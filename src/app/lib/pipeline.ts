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

const MAX_PIXEL_SQ = 255 * 255;
const PSNR_FLOOR = 14;
const PSNR_CEIL = 50;

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

interface Distortion {
  mse: number;
  sparsity: number; // 0-100, fraction of coefficients quantized to zero
}

// Distortion from the real wavelet-packet subbands (the 16 / 64 / … band stats).
// Uniform quantization with step s, orthonormal transform → spatial MSE equals
// coefficient-domain MSE (Parseval):
//   • |c| < s/2  → quantized to 0 → the whole coefficient becomes error
//   • |c| ≥ s/2  → survives → uniform quant error, variance s²/12
// Per-subband coefficients are modelled as Laplacian with E|c| = meanAbs.
function distortionFromSubbands(subbands: SubbandStat[], s: number): Distortion {
  let errSum = 0, totalN = 0, zeroSum = 0;
  for (const b of subbands) {
    const nB = b.size * b.size;
    if (nB <= 0) continue;
    const m = Math.max(0.01, b.meanAbs);
    // Laplacian dead-zone probability P(|c| < s/2).
    const dead = Math.min(0.999, 1 - Math.exp(-(s / 2) / m));
    // Killed coefficients are the smallest, so they hold less than a
    // proportional share of the band energy — approximate with dead².
    const killedEnergy = dead * dead * b.energy;
    const survivors = nB * (1 - dead);
    errSum += killedEnergy + survivors * (s * s / 12);
    totalN += nB;
    zeroSum += dead * nB;
  }
  if (totalN <= 0) return { mse: (s * s) / 12, sparsity: 50 + s * 1.1 };
  return { mse: errSum / totalN, sparsity: (zeroSum / totalN) * 100 };
}

// Full pipeline metrics. Identical math is used by the Quantization preview,
// the Entropy preview and the Processing result, so all three always agree.
// MSE / PSNR are driven by the chosen transform: JPEG2000 uses the real
// wavelet-packet subbands, JPEG (DCT) uses an 8×8 block-transform model.
export function computeMetrics(input: PipelineInput): PipelineMetrics {
  if (input.lossless) {
    const crL = 2.4;
    return { mse: 0, psnr: PSNR_CEIL, cr: crL, crLabel: `${crL.toFixed(1)}:1`, sparsity: 0 };
  }

  const s = input.stepSize;
  const isJpeg = input.method === 'jpeg';
  const hasBands = !!input.subbandStats && input.subbandStats.length > 0;
  // JPEG's 8×8 DCT has block-edge artifacts and no multi-resolution subbands,
  // so at a given step it carries ~1.6× the error and ~15% less CR than DWT.
  const blockPenalty = isJpeg ? 1.6 : 1.0;
  const methodCR = isJpeg ? 0.85 : 1.0;

  let mse: number;
  let sparsity: number;

  if (hasBands) {
    // Distortion from the real wavelet-packet decomposition of the image —
    // the result tracks actual image content, wavelet and decomposition level.
    const d = distortionFromSubbands(input.subbandStats!, s);
    mse = d.mse * blockPenalty;
    sparsity = d.sparsity;
  } else {
    // No analysis data (demo / decode failed) — step-size fallback.
    mse = (s * s / 12) * blockPenalty;
    sparsity = 50 + s * 1.1;
  }

  mse = Math.max(0.01, mse);
  let psnr = 10 * Math.log10(MAX_PIXEL_SQ / mse);
  // Clamp PSNR, then keep MSE consistent with PSNR = 10·log₁₀(255²/MSE).
  if (psnr > PSNR_CEIL) { psnr = PSNR_CEIL; mse = MAX_PIXEL_SQ / Math.pow(10, psnr / 10); }
  else if (psnr < PSNR_FLOOR) { psnr = PSNR_FLOOR; mse = MAX_PIXEL_SQ / Math.pow(10, psnr / 10); }

  sparsity = Math.min(98, Math.max(0, sparsity));

  // More zeros → better entropy-coding gain.
  const sparsityBoost = hasBands ? 1 + (sparsity - 50) / 100 : 1.0;
  const baseCR = 16 + Math.pow(s / 64, 0.85) * 64;
  const cr = Math.max(16, baseCR * typeBonus(input.imageType) * sparsityBoost * methodCR) * coderGain(input.coder);

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    cr: +cr.toFixed(1),
    crLabel: `${cr.toFixed(1)}:1`,
    sparsity: +sparsity.toFixed(0),
  };
}
