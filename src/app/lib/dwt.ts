// 2D wavelet-packet decomposition.
// Separable transform with periodic boundary. Pure JS, no deps.
// Output ordering: subbands[gridR * gridSize + gridC] matches DWTSubbandsViz FILTER_POS
// (LL=(0,0), HL=(0,1), LH=(1,0), HH=(1,1) at each split, recursing inside each quadrant).

export type Filter = 'haar' | 'db2' | 'db4';

export interface SubbandStat {
  chain: string;        // e.g. "LLHL" for level 2 — 2 chars per filter step
  energy: number;       // Σ c²
  meanSigned: number;   // signed mean — used as cell display value
  meanAbs: number;      // mean |c|
  max: number;          // max |c|
  zeroFrac: number;     // fraction of |c| < 0.5
  size: number;         // side length of this subband (W / 2^level)
}

export interface DWTResult {
  filter: Filter;
  level: number;
  imageSize: number;
  subbands: SubbandStat[];   // length 4^level
  totalEnergy: number;
}

// Daubechies orthogonal analysis filters. hi[k] = (-1)^k * lo[L-1-k] (quadrature mirror).
const FILTERS: Record<Filter, { lo: number[]; hi: number[] }> = {
  haar: {
    lo: [0.7071067811865476, 0.7071067811865476],
    hi: [0.7071067811865476, -0.7071067811865476],
  },
  db2: {
    lo: [0.4829629131445341, 0.8365163037378079, 0.2241438680420134, -0.1294095225512604],
    hi: [-0.1294095225512604, -0.2241438680420134, 0.8365163037378079, -0.4829629131445341],
  },
  db4: {
    lo: [
      0.2303778133088964, 0.7148465705529154, 0.6308807679298587, -0.0279837694168599,
      -0.1870348117190931, 0.0308413818355607, 0.0328830116668852, -0.0105974017850690,
    ],
    hi: [
      -0.0105974017850690, -0.0328830116668852, 0.0308413818355607, 0.1870348117190931,
      -0.0279837694168599, -0.6308807679298587, 0.7148465705529154, -0.2303778133088964,
    ],
  },
};

// One 2D decomposition step. Returns 4 subbands of size half×half each.
// Position assignment matches DWTSubbandsViz FILTER_POS:
//   LL → (0,0)  HL → (0,1)  LH → (1,0)  HH → (1,1)
function split2D(
  band: Float32Array,
  side: number,
  f: Filter,
): { LL: Float32Array; HL: Float32Array; LH: Float32Array; HH: Float32Array } {
  const half = side >> 1;
  const { lo, hi } = FILTERS[f];
  const L = lo.length;

  // Pass 1 (rows): for each row, convolve + ↓2 with lo and hi.
  const rowLo = new Float32Array(side * half);
  const rowHi = new Float32Array(side * half);
  for (let r = 0; r < side; r++) {
    const rowBase = r * side;
    const outBase = r * half;
    for (let k = 0; k < half; k++) {
      let sLo = 0, sHi = 0;
      const start = 2 * k;
      for (let n = 0; n < L; n++) {
        const v = band[rowBase + ((start + n) % side)];
        sLo += lo[n] * v;
        sHi += hi[n] * v;
      }
      rowLo[outBase + k] = sLo;
      rowHi[outBase + k] = sHi;
    }
  }

  // Pass 2 (cols): apply lo/hi along columns of rowLo and rowHi.
  const LL = new Float32Array(half * half);
  const HL = new Float32Array(half * half);
  const LHs = new Float32Array(half * half);
  const HH = new Float32Array(half * half);
  for (let c = 0; c < half; c++) {
    for (let k = 0; k < half; k++) {
      let aLo = 0, aHi = 0, bLo = 0, bHi = 0;
      const start = 2 * k;
      for (let n = 0; n < L; n++) {
        const rIdx = (start + n) % side;
        const vA = rowLo[rIdx * half + c];
        const vB = rowHi[rIdx * half + c];
        aLo += lo[n] * vA;
        aHi += hi[n] * vA;
        bLo += lo[n] * vB;
        bHi += hi[n] * vB;
      }
      const out = k * half + c;
      LL[out] = aLo;   // (0,0)
      HL[out] = aHi;   // (0,1)
      LHs[out] = bLo;  // (1,0)
      HH[out] = bHi;   // (1,1)
    }
  }

  return { LL, HL, LH: LHs, HH };
}

function computeStat(chain: string, band: Float32Array, side: number): SubbandStat {
  let sum = 0, sumAbs = 0, sumSq = 0, max = 0, zeroCount = 0;
  for (let i = 0; i < band.length; i++) {
    const v = band[i];
    const a = v < 0 ? -v : v;
    sum += v;
    sumAbs += a;
    sumSq += v * v;
    if (a > max) max = a;
    if (a < 0.5) zeroCount++;
  }
  const n = band.length || 1;
  return {
    chain,
    energy: sumSq,
    meanSigned: sum / n,
    meanAbs: sumAbs / n,
    max,
    zeroFrac: zeroCount / n,
    size: side,
  };
}

export function waveletPacket2D(
  image: Float32Array,
  side: number,
  filter: Filter,
  level: number,
): DWTResult {
  if (level < 1) {
    const stat = computeStat('', image, side);
    return { filter, level: 0, imageSize: side, subbands: [stat], totalEnergy: stat.energy };
  }

  const gridSize = 1 << level;
  const subbands: SubbandStat[] = new Array(gridSize * gridSize);

  function recurse(
    band: Float32Array,
    bandSide: number,
    depth: number,
    chain: string,
    gridR: number,
    gridC: number,
  ) {
    if (depth === level) {
      subbands[gridR * gridSize + gridC] = computeStat(chain, band, bandSide);
      return;
    }
    const { LL, HL, LH, HH } = split2D(band, bandSide, filter);
    const childSpan = 1 << (level - depth - 1);
    const half = bandSide >> 1;
    recurse(LL, half, depth + 1, chain + 'LL', gridR, gridC);
    recurse(HL, half, depth + 1, chain + 'HL', gridR, gridC + childSpan);
    recurse(LH, half, depth + 1, chain + 'LH', gridR + childSpan, gridC);
    recurse(HH, half, depth + 1, chain + 'HH', gridR + childSpan, gridC + childSpan);
  }

  recurse(image, side, 0, '', 0, 0);

  let totalEnergy = 0;
  for (const b of subbands) totalEnergy += b.energy;

  return { filter, level, imageSize: side, subbands, totalEnergy };
}

// Convert RGBA ImageData (assumed side×side) to luma Float32Array.
export function imageDataToGray(imgData: ImageData, side: number): { data: Float32Array; side: number } {
  const N = side * side;
  const out = new Float32Array(N);
  const px = imgData.data;
  for (let i = 0; i < N; i++) {
    const b = i << 2;
    out[i] = 0.299 * px[b] + 0.587 * px[b + 1] + 0.114 * px[b + 2];
  }
  return { data: out, side };
}
