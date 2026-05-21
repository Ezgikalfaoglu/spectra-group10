// Shared compression-metric model.
// Single source of truth for CR / PSNR / MSE / sparsity so the Quantization
// preview, the Entropy preview and the Processing result never disagree.

import type { SubbandStat } from './dwt';

export type Coder = 'huffman-default' | 'huffman-custom' | 'arithmetic';

export interface PipelineInput {
  method: 'jpeg' | 'jpeg2000';
  subbandStats?: SubbandStat[];
  stepSize: number;
  lossless: boolean;
  imageType: string;
  coder: Coder;
}

export interface PipelineMetrics {
  mse: number;
  psnr: number;
  cr: number;        // numeric compression ratio
  crLabel: string;   // e.g. "80.0:1"
  sparsity: number;  // 0-98 (%)
}

// Per-type CR bonus — mirrors imageTypeProfiles crBonus values.
export function typeBonus(imageType: string): number {
  if (imageType === 'AI Generated') return 1.10;
  if (imageType === 'Synthetic') return 1.18;
  if (imageType === 'Fingerprint') return 0.78;
  if (imageType === 'Biomedical') return 0.82;
  return 1.0;
}

// Entropy coder efficiency — the final lossless pack. Arithmetic packs tightest.
export function coderGain(coder: Coder | undefined): number {
  if (coder === 'huffman-custom') return 1.05;
  if (coder === 'arithmetic') return 1.12;
  return 1.0;
}

// Sparsity (fraction of coefficients quantized to zero), as a percentage.
// Uses the real wavelet-packet subband distribution when available.
export function computeSparsity(input: Pick<PipelineInput, 'method' | 'subbandStats' | 'stepSize' | 'lossless'>): number {
  const { method, subbandStats, stepSize: s, lossless } = input;
  if (lossless) return 0;

  if (method === 'jpeg2000' && subbandStats && subbandStats.length) {
    let zeroSum = 0, weightSum = 0;
    for (const b of subbandStats) {
      const w = b.size * b.size;
      const denom = Math.max(0.001, b.meanAbs * 2);
      const zf = Math.max(0, Math.min(0.98, 1 - denom / s));
      zeroSum += zf * w;
      weightSum += w;
    }
    if (weightSum) return (zeroSum / weightSum) * 100;
  }
  return 50 + s * 1.1;
}

// Full pipeline metrics. Identical math is used by Processing (final result)
// and Entropy (live preview), so the two always agree.
export function computeMetrics(input: PipelineInput): PipelineMetrics {
  const s = input.lossless ? 1 : input.stepSize;

  const mse = input.lossless ? 0 : (s * s) / 180;
  const psnr = input.lossless ? 50 : Math.max(14, 38 - s * 0.9);

  const sparsity = Math.min(98, Math.max(0, computeSparsity(input)));
  // More zeros → better entropy-coding gain.
  const sparsityBoost = (input.method === 'jpeg2000' && input.subbandStats?.length && !input.lossless)
    ? 1 + (sparsity - 50) / 100
    : 1.0;

  const baseCR = 16 + Math.pow(s / 64, 0.85) * 64;
  const g = coderGain(input.coder);
  // Lossless image compression realistically lands at ~2–2.5:1.
  const cr = input.lossless
    ? Math.max(2.0, 2.4 * typeBonus(input.imageType)) * g
    : Math.max(16, baseCR * typeBonus(input.imageType) * sparsityBoost) * g;

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    cr: +cr.toFixed(1),
    crLabel: `${cr.toFixed(1)}:1`,
    sparsity: +sparsity.toFixed(0),
  };
}
