// Shared image → wavelet-coefficient analysis.
// One source of truth for the decode → center-crop → scale → luma → level-shift
// → wavelet-packet chain, used by both the Transform and Quantization pages so
// they never disagree about the coefficients.

import { waveletPacket2D, waveletPacketInverse, imageDataToGray, type DWTResult, type Filter, type SubbandStat } from './dwt';
import { decompose, type ColorSpace } from './preprocess';

export interface AnalyzeOptions {
  source: string;          // dataURL (preprocessed plane preferred, else raw upload)
  filter: Filter;
  level: number;           // decomposition level (1..5)
  levelShift?: boolean;    // subtract 128 before transform (JPEG DC centering)
  keepCoeffs?: boolean;    // attach raw leaf coefficients to each SubbandStat
  maxSide?: number;        // analysis resolution cap (default 512)
}

// Returns null when the image is too small for the requested level or cannot
// be decoded — callers fall back to their estimate path.
export async function analyzeImage(opts: AnalyzeOptions): Promise<DWTResult | null> {
  const { source, filter, level, levelShift = false, keepCoeffs = false, maxSide = 512 } = opts;
  if (!source) return null;

  const img = new Image();
  if (/^https?:\/\//.test(source)) img.crossOrigin = 'anonymous';
  img.src = source;
  await img.decode();

  const minDim = Math.min(img.width, img.height);
  const minNeeded = 1 << level;
  if (minDim < minNeeded) return null;

  const log2Side = Math.floor(Math.log2(minDim));
  const targetSide = Math.min(maxSide, 1 << log2Side);
  if (targetSide < minNeeded) return null;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = targetSide;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Center-crop to a square, then scale to the power-of-two analysis side.
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSide, targetSide);

  const imgData = ctx.getImageData(0, 0, targetSide, targetSide);
  const { data: gray, side } = imageDataToGray(imgData, targetSide);

  if (levelShift) {
    for (let i = 0; i < gray.length; i++) gray[i] -= 128;
  }

  return waveletPacket2D(gray, side, filter, level, keepCoeffs);
}

export interface ReconstructOptions {
  source: string;
  colorSpace: ColorSpace;
  filter: Filter;
  level: number;
  step: number;
  lossless?: boolean;
  levelShift?: boolean;
  maxSide?: number;
}

const clamp8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Forward → dead-zone quantize → INVERSE DWT for EVERY channel of the color
// space, then recombine to RGB. Returns a dataURL of the genuinely decoded
// image (color preserved), so what the user sees matches the measured MSE/PSNR.
export async function reconstructImage(opts: ReconstructOptions): Promise<string | null> {
  const { source, colorSpace, filter, level, step, lossless = false, levelShift = false, maxSide = 512 } = opts;
  if (!source) return null;

  const img = new Image();
  if (/^https?:\/\//.test(source)) img.crossOrigin = 'anonymous';
  img.src = source;
  await img.decode();

  const minDim = Math.min(img.width, img.height);
  const minNeeded = 1 << level;
  if (minDim < minNeeded) return null;
  const log2Side = Math.floor(Math.log2(minDim));
  const targetSide = Math.min(maxSide, 1 << log2Side);
  if (targetSide < minNeeded) return null;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = targetSide;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSide, targetSide);

  const imgData = ctx.getImageData(0, 0, targetSide, targetSide);
  const side = targetSide;
  const planes = decompose(imgData, colorSpace);
  const s = Math.max(1e-6, step);

  // Reconstruct each channel through the full transform → quantize → inverse path.
  const rec = planes.map((p) => {
    const g = new Float32Array(p.gray.length);
    for (let i = 0; i < g.length; i++) g[i] = levelShift ? p.gray[i] - 128 : p.gray[i];
    const res = waveletPacket2D(g, side, filter, level, true);
    if (!lossless) {
      for (const b of res.subbands) {
        const c = b.coeffs;
        if (!c) continue;
        for (let i = 0; i < c.length; i++) c[i] = Math.sign(c[i]) * Math.floor(Math.abs(c[i]) / s) * s;
      }
    }
    const r = waveletPacketInverse(res.subbands, side, filter);
    if (levelShift) for (let i = 0; i < r.length; i++) r[i] += 128;
    return r;
  });

  const out = ctx.createImageData(side, side);
  const N = side * side;
  for (let i = 0; i < N; i++) {
    let R: number, G: number, B: number;
    if (colorSpace === 'luma') {
      R = G = B = rec[0][i];
    } else if (colorSpace === 'rgb') {
      R = rec[0][i]; G = rec[1][i]; B = rec[2][i];
    } else {
      // YCbCr → RGB (BT.601 inverse)
      const Y = rec[0][i], Cb = rec[1][i] - 128, Cr = rec[2][i] - 128;
      R = Y + 1.402 * Cr;
      G = Y - 0.344136 * Cb - 0.714136 * Cr;
      B = Y + 1.772 * Cb;
    }
    const b = i * 4;
    out.data[b] = clamp8(R);
    out.data[b + 1] = clamp8(G);
    out.data[b + 2] = clamp8(B);
    out.data[b + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  try { return canvas.toDataURL('image/jpeg', 0.9); } catch { return null; }
}

export interface AnalyzeChannelsOptions {
  source: string;          // the ORIGINAL color image (so every channel exists)
  colorSpace: ColorSpace;  // ycbcr → Y,Cb,Cr · rgb → R,G,B · luma → L
  filter: Filter;
  level: number;
  levelShift?: boolean;
  maxSide?: number;
}

// Decompose the image into every channel of the chosen color space, run the
// wavelet transform on each, and return the POOLED leaf subbands (coefficients
// attached). Quantization / entropy treat the pool as one set, so MSE / CR span
// all channels (R+G+B or Y+Cb+Cr), not just one plane. Luma → single channel,
// identical to the per-plane path.
export async function analyzeChannels(opts: AnalyzeChannelsOptions): Promise<SubbandStat[] | null> {
  const { source, colorSpace, filter, level, levelShift = false, maxSide = 512 } = opts;
  if (!source) return null;

  const img = new Image();
  if (/^https?:\/\//.test(source)) img.crossOrigin = 'anonymous';
  img.src = source;
  await img.decode();

  const minDim = Math.min(img.width, img.height);
  const minNeeded = 1 << level;
  if (minDim < minNeeded) return null;

  const log2Side = Math.floor(Math.log2(minDim));
  const targetSide = Math.min(maxSide, 1 << log2Side);
  if (targetSide < minNeeded) return null;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = targetSide;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSide, targetSide);

  const imgData = ctx.getImageData(0, 0, targetSide, targetSide);
  const planes = decompose(imgData, colorSpace);

  const pooled: SubbandStat[] = [];
  for (const p of planes) {
    const gray = new Float32Array(p.gray.length);
    for (let i = 0; i < gray.length; i++) gray[i] = levelShift ? p.gray[i] - 128 : p.gray[i];
    const res = waveletPacket2D(gray, targetSide, filter, level, true);
    for (const b of res.subbands) pooled.push(b);
  }
  return pooled;
}
