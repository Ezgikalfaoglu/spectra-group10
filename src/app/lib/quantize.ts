// Real scalar (dead-zone) quantization of wavelet coefficients.
// Operates on the actual leaf coefficients (SubbandStat.coeffs), not a model.
//
// Dead-zone uniform quantizer (the JPEG2000 scalar quantizer):
//   index = sign(c) · floor(|c| / step)
//   reconstructed q = index · step
//   → coefficients with |c| < step quantize to 0 (the "dead zone").
//
// Because the wavelet transform is orthonormal, coefficient-domain MSE equals
// spatial-domain MSE (Parseval), so the reconstruction error computed here is
// the real pixel MSE of the decoded image — no inverse transform needed.

import type { SubbandStat } from './dwt';

const MAX_PIXEL_SQ = 255 * 255;

export interface QuantResult {
  mse: number;        // real mean squared error (pixel domain via Parseval)
  psnr: number;       // 10·log10(255²/MSE)
  sparsity: number;   // % of coefficients quantized to zero
  totalCoeffs: number;
  zeroCoeffs: number;
  nonzeroCoeffs: number;
}

// Dead-zone quantize one coefficient, return its reconstruction.
function deadZone(c: number, step: number): number {
  const idx = Math.sign(c) * Math.floor(Math.abs(c) / step);
  return idx * step;
}

// Quantize all leaf coefficients at the given step and measure real distortion.
// Lossless (step ≤ 1 with no rounding) returns zero error.
export function quantizeSubbands(subbands: SubbandStat[], step: number, lossless = false): QuantResult {
  if (lossless) {
    let total = 0;
    for (const b of subbands) total += b.coeffs ? b.coeffs.length : b.size * b.size;
    return { mse: 0, psnr: 50, sparsity: 0, totalCoeffs: total, zeroCoeffs: 0, nonzeroCoeffs: total };
  }

  const s = Math.max(1e-6, step);
  let errSum = 0, total = 0, zeros = 0;

  for (const b of subbands) {
    const c = b.coeffs;
    if (!c || c.length === 0) continue;
    for (let i = 0; i < c.length; i++) {
      const v = c[i];
      const q = deadZone(v, s);
      const e = v - q;
      errSum += e * e;
      if (q === 0) zeros++;
      total++;
    }
  }

  if (total === 0) return { mse: 0, psnr: 50, sparsity: 0, totalCoeffs: 0, zeroCoeffs: 0, nonzeroCoeffs: 0 };

  const mse = Math.max(1e-6, errSum / total);
  const psnr = Math.min(99, 10 * Math.log10(MAX_PIXEL_SQ / mse));
  const sparsity = (zeros / total) * 100;

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    sparsity: +sparsity.toFixed(1),
    totalCoeffs: total,
    zeroCoeffs: zeros,
    nonzeroCoeffs: total - zeros,
  };
}
