// Real entropy coding measurement on quantized wavelet coefficients.
// Computes the actual bitstream cost from the real symbol distribution — no
// hardcoded bars, no fixed formula.
//
//   • Symbols = dead-zone quantization indices  idx = sign(c)·floor(|c|/step)
//   • Shannon entropy  H = -Σ p·log2(p)   → theoretical lower bound (bits/symbol)
//   • Huffman avg length  L ≥ H            → built from the real histogram
//   • Coders:
//       arithmetic      → reaches ~H              (near the entropy limit)
//       huffman-custom  → L + per-image table overhead
//       huffman-default → L with a small static-table inefficiency, no overhead
//
// CR = 8 / bpp  (source is an 8-bit grayscale plane).

import type { SubbandStat } from './dwt';

export type Coder = 'huffman-default' | 'huffman-custom' | 'arithmetic';

export interface EntropyResult {
  bits: number;           // total encoded bits
  bpp: number;            // bits per sample (≈ per pixel)
  cr: number;             // compression ratio vs 8 bpp
  entropy: number;        // Shannon bits/symbol (lower bound)
  avgCodeLen: number;     // chosen coder's effective bits/symbol
  nSymbols: number;
  distinctSymbols: number;
  buckets: { label: string; count: number }[]; // |idx|: 0, 1, 2, 3, ≥4
}

const CR_CEIL = 250;

function quantIndex(c: number, step: number): number {
  return Math.sign(c) * Math.floor(Math.abs(c) / step);
}

// Min-heap of numbers (coefficient weights) for Huffman tree construction.
class MinHeap {
  private a: number[] = [];
  get size() { return this.a.length; }
  push(x: number) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      const n = a.length;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let m = i;
        if (l < n && a[l] < a[m]) m = l;
        if (r < n && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

// Average Huffman code length (bits/symbol) from symbol frequencies.
// total tree weight = total emitted bits (classic Huffman cost).
function huffmanAvgLen(freqs: number[], n: number): number {
  if (n <= 0) return 0;
  if (freqs.length <= 1) return 1; // a single symbol still needs 1 bit
  const heap = new MinHeap();
  for (const f of freqs) if (f > 0) heap.push(f);
  let totalBits = 0;
  while (heap.size > 1) {
    const merged = heap.pop() + heap.pop();
    totalBits += merged;
    heap.push(merged);
  }
  return totalBits / n;
}

export function analyzeEntropy(
  subbands: SubbandStat[],
  step: number,
  coder: Coder,
  lossless: boolean,
): EntropyResult | null {
  const s = Math.max(1e-6, lossless ? 1 : step);
  const hist = new Map<number, number>();
  const buckets = [0, 0, 0, 0, 0]; // |idx| = 0,1,2,3,≥4
  let n = 0;

  for (const b of subbands) {
    const c = b.coeffs;
    if (!c) continue;
    for (let i = 0; i < c.length; i++) {
      const idx = quantIndex(c[i], s);
      hist.set(idx, (hist.get(idx) ?? 0) + 1);
      const a = Math.abs(idx);
      buckets[a >= 4 ? 4 : a]++;
      n++;
    }
  }

  if (n === 0) return null;

  // Shannon entropy.
  let H = 0;
  for (const cnt of hist.values()) {
    const p = cnt / n;
    H -= p * Math.log2(p);
  }

  const distinct = hist.size;
  const L = huffmanAvgLen([...hist.values()], n);

  // Coder cost model — all anchored to the measured H / L.
  let avgCodeLen: number;
  let overheadBits = 0;
  if (coder === 'arithmetic') {
    avgCodeLen = H;                       // near the entropy limit
  } else if (coder === 'huffman-custom') {
    avgCodeLen = L;
    overheadBits = distinct * 8;          // store the per-image code lengths
  } else {
    avgCodeLen = L * 1.06;                // static tables: ~6% off-optimal, no overhead
  }

  const bits = Math.max(1, avgCodeLen * n + overheadBits);
  const bpp = bits / n;
  const cr = Math.min(CR_CEIL, Math.max(1, 8 / bpp));

  return {
    bits: Math.round(bits),
    bpp: +bpp.toFixed(3),
    cr: +cr.toFixed(1),
    entropy: +H.toFixed(3),
    avgCodeLen: +avgCodeLen.toFixed(3),
    nSymbols: n,
    distinctSymbols: distinct,
    buckets: [
      { label: '0 (run)', count: buckets[0] },
      { label: '±1', count: buckets[1] },
      { label: '±2', count: buckets[2] },
      { label: '±3', count: buckets[3] },
      { label: '±4+', count: buckets[4] },
    ],
  };
}
