// Real preprocessing: color-space conversion + level-shift.
// Operates on the actual uploaded pixels (no mock gradients).
//
// Pipeline role (JPEG / JPEG2000 stage 02):
//   • Decorrelate color channels so most energy lands in one plane (luma),
//     which the transform stage compresses far better than raw RGB.
//   • Level-shift samples [0,255] → [-128,127] (DC centering) before the
//     frequency transform, exactly as the JPEG standard specifies.
//
// All math is plain JS on canvas ImageData — no dependencies.

export type ColorSpace = 'ycbcr' | 'rgb' | 'luma';

export interface ChannelPlane {
  label: string;       // 'Y' | 'Cb' | 'Cr' | 'R' | 'G' | 'B' | 'L'
  hint: string;        // human label
  gray: Uint8ClampedArray; // 0-255 grayscale render of this plane (w*h)
  mean: number;        // mean sample value
  variance: number;    // sample variance — proxy for "information / energy"
  energyPct: number;   // variance share across the channels of this space
}

export interface PreprocResult {
  width: number;
  height: number;
  colorSpace: ColorSpace;
  levelShift: boolean;
  planes: ChannelPlane[];
  // Index of the plane that carries the bulk of the energy and is fed to the
  // transform stage (Y for ycbcr/luma; luma proxy for rgb).
  primaryPlaneIndex: number;
}

// Decode a dataURL into ImageData, scaled so the longest side ≤ maxSide.
export function loadImageData(dataUrl: string, maxSide = 512): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:\/\//.test(dataUrl)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { reject(new Error('no 2d context')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(ctx.getImageData(0, 0, w, h));
      } catch (e) {
        reject(e as Error);
      }
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = dataUrl;
  });
}

function statsOf(gray: Uint8ClampedArray): { mean: number; variance: number } {
  let sum = 0, sumSq = 0;
  const n = gray.length || 1;
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  return { mean, variance: Math.max(0, sumSq / n - mean * mean) };
}

// ITU-R BT.601 — the conversion JPEG / JPEG2000 use.
function rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
  const y  = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return [y, cb, cr];
}

// Build the grayscale planes for the chosen color space from real pixels.
export function decompose(img: ImageData, colorSpace: ColorSpace): ChannelPlane[] {
  const { data, width: w, height: h } = img;
  const n = w * h;
  const px = data;

  const makePlane = (label: string, hint: string, fill: (i: number) => number): ChannelPlane => {
    const gray = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) gray[i] = fill(i);
    const { mean, variance } = statsOf(gray);
    return { label, hint, gray, mean, variance, energyPct: 0 };
  };

  let planes: ChannelPlane[];

  if (colorSpace === 'rgb') {
    planes = [
      makePlane('R', 'Red',   i => px[i * 4]),
      makePlane('G', 'Green', i => px[i * 4 + 1]),
      makePlane('B', 'Blue',  i => px[i * 4 + 2]),
    ];
  } else if (colorSpace === 'luma') {
    planes = [
      makePlane('L', 'Luma', i => {
        const b = i * 4;
        return 0.299 * px[b] + 0.587 * px[b + 1] + 0.114 * px[b + 2];
      }),
    ];
  } else {
    // ycbcr
    planes = [
      makePlane('Y',  'Luma',      i => { const b = i * 4; return rgbToYCbCr(px[b], px[b + 1], px[b + 2])[0]; }),
      makePlane('Cb', 'Blue-diff', i => { const b = i * 4; return rgbToYCbCr(px[b], px[b + 1], px[b + 2])[1]; }),
      makePlane('Cr', 'Red-diff',  i => { const b = i * 4; return rgbToYCbCr(px[b], px[b + 1], px[b + 2])[2]; }),
    ];
  }

  // Energy share = each plane's variance over the sum (shows compaction).
  const totalVar = planes.reduce((s, p) => s + p.variance, 0) || 1;
  for (const p of planes) p.energyPct = (p.variance / totalVar) * 100;

  return planes;
}

// Render a grayscale plane to a PNG dataURL for preview / downstream use.
export function planeToDataUrl(plane: ChannelPlane, w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < plane.gray.length; i++) {
    const v = plane.gray[i];
    const b = i * 4;
    out.data[b] = out.data[b + 1] = out.data[b + 2] = v;
    out.data[b + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  try { return canvas.toDataURL('image/png'); } catch { return ''; }
}

// Apply the JPEG level-shift to a plane: [0,255] → [-128,127].
// Returns a Float32Array ready for the frequency transform.
export function levelShiftPlane(plane: ChannelPlane): Float32Array {
  const out = new Float32Array(plane.gray.length);
  for (let i = 0; i < plane.gray.length; i++) out[i] = plane.gray[i] - 128;
  return out;
}
