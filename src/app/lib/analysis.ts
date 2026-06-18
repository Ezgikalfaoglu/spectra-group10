// Shared image → wavelet-coefficient analysis.
// One source of truth for the decode → center-crop → scale → luma → level-shift
// → wavelet-packet chain, used by both the Transform and Quantization pages so
// they never disagree about the coefficients.

import { waveletPacket2D, imageDataToGray, type DWTResult, type Filter } from './dwt';

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
