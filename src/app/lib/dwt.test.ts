import { describe, it, expect } from 'vitest';
import { waveletPacket2D, imageDataToGray, type Filter } from './dwt';

const SIDE = 64;

// A flat (constant) image — detail bands carry ~zero variance, so only the
// LL approximation path should keep splitting (classic Mallat pyramid).
function flatImage(side = SIDE, value = 128): Float32Array {
  return new Float32Array(side * side).fill(value);
}

// A broadband, multi-frequency texture — detail energy spreads across the
// spectrum, so the adaptive splitter should descend into many more subbands.
// (A pure 1px checkerboard is a single Nyquist frequency and would NOT split —
// that is correct adaptive behaviour, so it is a poor "busy" fixture.)
function busyImage(side = SIDE): Float32Array {
  const img = new Float32Array(side * side);
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++)
      img[y * side + x] =
        128 + 55 * Math.sin(x * 0.9) + 48 * Math.cos(y * 1.3) +
        40 * Math.sin((x + y) * 0.5) + (((x * 7 + y * 13) % 23) - 11) * 3;
  return img;
}

describe('waveletPacket2D — structure', () => {
  it('returns a stable subband shape', () => {
    const r = waveletPacket2D(flatImage(), SIDE, 'db4', 2);
    expect(r.subbands.length).toBeGreaterThan(0);
    for (const b of r.subbands) {
      expect(typeof b.chain).toBe('string');
      expect(Number.isFinite(b.energy)).toBe(true);
      expect(Number.isFinite(b.meanSigned)).toBe(true);
      expect(Number.isFinite(b.meanAbs)).toBe(true);
      expect(b.size).toBeGreaterThan(0);
      expect(b.depth).toBeGreaterThanOrEqual(1);
    }
  });

  it('maxLevel < 1 returns the whole image as a single band', () => {
    const r = waveletPacket2D(flatImage(), SIDE, 'haar', 0);
    expect(r.subbands.length).toBe(1);
    expect(r.level).toBe(0);
  });
});

describe('waveletPacket2D — adaptive (variance-based) splitting', () => {
  it('flat image collapses to the classic pyramid (3·level + 1 bands)', () => {
    const level = 2;
    const r = waveletPacket2D(flatImage(), SIDE, 'haar', level);
    // Only LL keeps splitting; detail bands are leaves.
    expect(r.subbands.length).toBe(3 * level + 1); // 7
  });

  it('busy image splits into more bands than a flat image', () => {
    const flat = waveletPacket2D(flatImage(), SIDE, 'haar', 2);
    const busy = waveletPacket2D(busyImage(), SIDE, 'haar', 2);
    expect(busy.subbands.length).toBeGreaterThan(flat.subbands.length);
    // Never exceeds the full wavelet-packet ceiling (4^level).
    expect(busy.subbands.length).toBeLessThanOrEqual(4 ** 2);
  });

  it('band count grows with level for the same image', () => {
    const l1 = waveletPacket2D(flatImage(), SIDE, 'haar', 1).subbands.length;
    const l2 = waveletPacket2D(flatImage(), SIDE, 'haar', 2).subbands.length;
    const l3 = waveletPacket2D(flatImage(), SIDE, 'haar', 3).subbands.length;
    expect(l1).toBe(4);          // single split
    expect(l2).toBeGreaterThan(l1);
    expect(l3).toBeGreaterThan(l2);
  });
});

describe('waveletPacket2D — robustness', () => {
  it('handles a tiny image without crashing', () => {
    expect(() => waveletPacket2D(flatImage(2), 2, 'haar', 1)).not.toThrow();
    const r = waveletPacket2D(flatImage(2), 2, 'haar', 1);
    expect(r.subbands.length).toBeGreaterThan(0);
  });

  it('does not over-split when the band is smaller than the filter support', () => {
    // db12 has 24 taps; on a 64px image it cannot recurse very deep.
    const r = waveletPacket2D(busyImage(), SIDE, 'db12', 5);
    expect(r.subbands.every(b => b.size >= 1)).toBe(true);
    expect(Number.isFinite(r.totalEnergy)).toBe(true);
  });

  it('every supported filter produces finite output', () => {
    const filters: Filter[] = ['haar', 'db2', 'db3', 'db4', 'db6', 'db8', 'db12'];
    for (const f of filters) {
      const r = waveletPacket2D(busyImage(), SIDE, f, 2);
      expect(r.subbands.length).toBeGreaterThan(0);
      expect(Number.isFinite(r.totalEnergy)).toBe(true);
    }
  });
});

describe('imageDataToGray', () => {
  it('converts RGBA to luma', () => {
    // 2×2 white image
    const data = new Uint8ClampedArray(2 * 2 * 4).fill(255);
    const imgData = { data, width: 2, height: 2, colorSpace: 'srgb' } as unknown as ImageData;
    const { data: gray, side } = imageDataToGray(imgData, 2);
    expect(side).toBe(2);
    expect(gray.length).toBe(4);
    for (const v of gray) expect(v).toBeCloseTo(255, 0);
  });
});
