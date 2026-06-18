import { describe, it, expect } from 'vitest';
import { computeMetrics, typeBonus, coderGain, type PipelineInput } from './pipeline';
import type { SubbandStat } from './dwt';

// Minimal synthetic subbands (Laplacian-ish coefficients) so the metric model
// has real data to work on without needing a full DWT pass.
function fakeBands(meanAbs: number): SubbandStat[] {
  return [
    { chain: 'LL', depth: 1, energy: 1_000_000, meanSigned: 120, meanAbs: 120, max: 255, zeroFrac: 0.1, size: 128 },
    { chain: 'HL', depth: 1, energy: 5_000, meanSigned: 0, meanAbs, max: 40, zeroFrac: 0.6, size: 128 },
    { chain: 'LH', depth: 1, energy: 5_000, meanSigned: 0, meanAbs, max: 40, zeroFrac: 0.6, size: 128 },
    { chain: 'HH', depth: 1, energy: 1_000, meanSigned: 0, meanAbs: meanAbs / 2, max: 20, zeroFrac: 0.8, size: 128 },
  ];
}

const base = (over: Partial<PipelineInput> = {}): PipelineInput => ({
  method: 'jpeg2000',
  subbandStats: fakeBands(8),
  stepSize: 18,
  lossless: false,
  imageType: 'Natural',
  coder: 'huffman-default',
  ...over,
});

describe('typeBonus', () => {
  it('returns the documented per-type multipliers', () => {
    expect(typeBonus('AI Generated')).toBe(1.1);
    expect(typeBonus('Synthetic')).toBe(1.18);
    expect(typeBonus('Fingerprint')).toBe(0.78);
    expect(typeBonus('Biomedical')).toBe(0.82);
    expect(typeBonus('Natural')).toBe(1.0);
    expect(typeBonus('anything-else')).toBe(1.0);
  });
});

describe('coderGain', () => {
  it('arithmetic packs tightest, default is the baseline', () => {
    expect(coderGain('huffman-default')).toBe(1.0);
    expect(coderGain('huffman-custom')).toBeGreaterThan(1.0);
    expect(coderGain('arithmetic')).toBeGreaterThan(coderGain('huffman-custom'));
    expect(coderGain(undefined)).toBe(1.0);
  });
});

describe('computeMetrics — lossless', () => {
  it('returns safe finite values with no NaN', () => {
    const m = computeMetrics(base({ lossless: true }));
    expect(m.mse).toBe(0);
    expect(Number.isFinite(m.psnr)).toBe(true);
    expect(Number.isNaN(m.cr)).toBe(false);
    expect(m.cr).toBeGreaterThan(0);
    expect(m.sparsity).toBe(0);
    // PSNR for a lossless run must be the ceiling, never NaN/Infinity.
    expect(m.psnr).toBe(50);
    expect(Number.isFinite(m.cr)).toBe(true);
  });
});

describe('computeMetrics — general invariants', () => {
  it('produces only finite, positive, in-range values', () => {
    for (const step of [1, 8, 18, 32, 64]) {
      const m = computeMetrics(base({ stepSize: step }));
      expect(Number.isFinite(m.mse)).toBe(true);
      expect(Number.isFinite(m.psnr)).toBe(true);
      expect(Number.isFinite(m.cr)).toBe(true);
      expect(m.mse).toBeGreaterThanOrEqual(0);
      expect(m.cr).toBeGreaterThan(0);
      expect(m.psnr).toBeGreaterThanOrEqual(14);
      expect(m.psnr).toBeLessThanOrEqual(50);
      expect(m.sparsity).toBeGreaterThanOrEqual(0);
      expect(m.sparsity).toBeLessThanOrEqual(98);
    }
  });

  it('PSNR is consistent with 10·log10(255²/MSE) when not clamped', () => {
    const m = computeMetrics(base({ stepSize: 18 }));
    if (m.psnr > 14.5 && m.psnr < 49.5) {
      const expected = 10 * Math.log10((255 * 255) / m.mse);
      expect(Math.abs(expected - m.psnr)).toBeLessThan(0.1);
    }
  });

  it('never divides by zero even with zero-energy bands', () => {
    const zeroBands: SubbandStat[] = [
      { chain: 'LL', depth: 1, energy: 0, meanSigned: 0, meanAbs: 0, max: 0, zeroFrac: 1, size: 64 },
    ];
    const m = computeMetrics(base({ subbandStats: zeroBands }));
    expect(Number.isNaN(m.mse)).toBe(false);
    expect(Number.isNaN(m.psnr)).toBe(false);
    expect(Number.isNaN(m.cr)).toBe(false);
  });

  it('CR stays at or above the 16:1 floor for lossy runs', () => {
    const m = computeMetrics(base({ stepSize: 4, imageType: 'Fingerprint' }));
    expect(m.cr).toBeGreaterThanOrEqual(16);
  });
});

describe('computeMetrics — JPEG vs JPEG2000', () => {
  it('JPEG2000 beats JPEG (higher PSNR, higher CR) on the same image', () => {
    const bands = fakeBands(8);
    const dwt = computeMetrics(base({ method: 'jpeg2000', subbandStats: bands, stepSize: 24 }));
    const dct = computeMetrics(base({ method: 'jpeg', subbandStats: bands, stepSize: 24 }));
    expect(dwt.psnr).toBeGreaterThan(dct.psnr);
    expect(dwt.cr).toBeGreaterThan(dct.cr);
    // The two methods must not produce identical metrics (method must matter).
    expect(dwt.mse).not.toBe(dct.mse);
  });
});

describe('computeMetrics — monotonicity', () => {
  it('higher step size lowers PSNR and raises CR', () => {
    let prevPsnr = Infinity, prevCr = 0;
    for (const step of [4, 8, 16, 32, 64]) {
      const m = computeMetrics(base({ stepSize: step }));
      expect(m.psnr).toBeLessThanOrEqual(prevPsnr + 1e-6);
      expect(m.cr).toBeGreaterThanOrEqual(prevCr - 1e-6);
      prevPsnr = m.psnr; prevCr = m.cr;
    }
  });
});
