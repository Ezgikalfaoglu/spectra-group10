// 2D adaptive wavelet-packet decomposition.
// Separable transform with periodic boundary. Pure JS, no deps.
//
// Splitting policy: image-adaptive, level-dependent variance threshold
// over a classical Mallat-pyramid baseline.
//
//   • LL (approximation) path always recurses while side ≥ filter length
//     → the dyadic pyramid is preserved for every image.
//   • Detail bands (HL/LH/HH) recurse only if their coefficient variance
//     exceeds  BASE_RATIO · imageVar · (1 + DEPTH_GROW · depth).
//     The base is fixed to the input image's own variance, so the
//     decision is image-adaptive. The depth factor tightens the criterion
//     at deeper levels (over-decomposition guard).
//
// References:
//   • Donoho-Johnstone 1994 — universal threshold T = σ·√(2 log N)
//     informs the level-dependent scaling.
//   • Donoho 1995 — MAD noise estimator from HH₁ (used as conceptual
//     calibration for the BASE_RATIO constant).
//   • Coifman-Wickerhauser 1992 — best-basis framework; here we replace
//     the entropy/L1 cost with a variance criterion because Shannon-on-
//     luma is biased toward splitting and L1 over-splits on textured
//     detail.
//
// Filter-length guard: db12 has 24 taps; on a 16×16 LL band at depth 4 the
// periodic convolution would alias heavily. `bandSide ≥ filterLen` stops
// the recursion before that point, so all 7 filters behave correctly
// across the full L=1…5 slider range.
//
// Output length is variable (between maxLevel+1 and 4^maxLevel). Leaf
// position in the 2^maxLevel × 2^maxLevel grid is encoded by `chain` + `depth`:
//   span per leaf = 2^(maxLevel − depth)
// Quadrant convention matches DWTSubbandsViz FILTER_POS:
//   LL=(0,0)  HL=(0,1)  LH=(1,0)  HH=(1,1)
//
// Output length is variable (between maxLevel+1 and 4^maxLevel). Leaf
// position in the 2^maxLevel × 2^maxLevel grid is encoded by `chain` + `depth`:
//   span per leaf = 2^(maxLevel − depth)
// Quadrant convention matches DWTSubbandsViz FILTER_POS:
//   LL=(0,0)  HL=(0,1)  LH=(1,0)  HH=(1,1)

export type Filter = 'haar' | 'db2' | 'db3' | 'db4' | 'db6' | 'db8' | 'db12';

export interface SubbandStat {
  chain: string;        // e.g. "LLHL" — 2 chars per filter step (length = 2*depth)
  depth: number;        // split steps applied to reach this leaf
  energy: number;       // Σ c²
  meanSigned: number;   // signed mean — used as cell display value
  meanAbs: number;      // mean |c|
  max: number;          // max |c|
  zeroFrac: number;     // fraction of |c| < 0.5
  size: number;         // side length of this subband (W / 2^depth)
}

export interface DWTResult {
  filter: Filter;
  level: number;             // max allowed depth (slider value)
  imageSize: number;
  subbands: SubbandStat[];   // variable length — adaptive leaves
  totalEnergy: number;
}

// Splitting-policy tuning constants.
//
//   BASE_DETAIL_RATIO  fraction of the input image's variance that a detail
//                      subband must exceed to be considered "informative
//                      enough to split". 0.05 ⇒ at least 5 % of image
//                      variance — calibrated so natural photos stay near
//                      the classical pyramid while fingerprints / leopard
//                      patterns trigger detail splits.
//   DEPTH_GROW         per-level tightening: threshold scales as
//                      (1 + DEPTH_GROW · depth). 0.5 ⇒ depth-2 needs 1.5×
//                      the depth-1 variance, depth-3 needs 2×, etc.
//   MIN_IMAGE_VAR      floor for the variance scale; prevents a degenerate
//                      "everything is informative" verdict on near-uniform
//                      inputs.
//   ABS_MIN_DETAIL_VAR absolute minimum detail-band variance at depth 1 before
//                      splitting is even considered. Floor scales as
//                      max(MIN_FLOOR, ABS_MIN/depth) so it tightens at shallow
//                      depths (where banding / quantisation noise dominates
//                      smooth content) and loosens at deeper depths (where
//                      real texture-band variance is naturally smaller).
//   MIN_FLOOR          lower bound the depth-scaled floor cannot fall below.
//
// Filter-quality normalisation: Daubechies dbN concentrates energy in LL
// proportionally better as N grows (N = vanishing moments). Detail-band
// variance therefore drops with N for the same content, so a fixed
// threshold under-splits long-support filters. We divide the threshold by
// √VM (not VM — that over-compensates for smooth content with banding
// artefacts, e.g. PNG-quantised gradients) so leopard-style content
// triggers detail splits consistently across haar … db12 while truly
// smooth content stays as a classical pyramid for every filter.
const BASE_DETAIL_RATIO = 0.05;
const DEPTH_GROW = 0.5;
const MIN_IMAGE_VAR = 25.0;
const ABS_MIN_DETAIL_VAR = 200.0;
const MIN_FLOOR = 50.0;

function varianceOf(arr: Float32Array): number {
  if (arr.length === 0) return 0;
  let sum = 0, sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    sum += v;
    sumSq += v * v;
  }
  const n = arr.length;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

// Daubechies orthogonal analysis low-pass coefficients (time-forward order).
// hi[] is derived via QMF: hi[k] = (-1)^k * lo[L-1-k].
const LO: Record<Filter, number[]> = {
  haar: [0.7071067811865476, 0.7071067811865476],
  db2: [0.4829629131445341, 0.8365163037378079, 0.2241438680420134, -0.1294095225512604],
  db3: [
    0.3326705529509569, 0.8068915093133388, 0.4598775021193313,
    -0.13501102001039084, -0.08544127388224149, 0.035226291882100656,
  ],
  db4: [
    0.2303778133088964, 0.7148465705529154, 0.6308807679298587, -0.0279837694168599,
    -0.1870348117190931, 0.0308413818355607, 0.0328830116668852, -0.0105974017850690,
  ],
  db6: [
    0.11154074335008017, 0.4946238903983854, 0.7511339080215775, 0.3152503517091982,
    -0.22626469396516913, -0.12976686756709563, 0.09750160558707936, 0.02752286553001629,
    -0.031582039318031156, 0.0005538422009938016, 0.00477725751101065, -0.00107730108499558,
  ],
  db8: [
    0.05441584224308161, 0.3128715909144659, 0.6756307362980128, 0.5853546836548691,
    -0.015829105256023893, -0.2840155429624281, 0.0004724845739124091, 0.128747426620186,
    -0.01736930100202211, -0.04408825393106472, 0.013981027917015516, 0.008746094047015655,
    -0.00487035299301066, -0.0003917403729959771, 0.0006754494059985568, -0.00011747678400228192,
  ],
  db12: [
    0.013112257957229239, 0.10956627282118277, 0.3773551352142041, 0.6571987225792911,
    0.5158864784278007, -0.04476388565377762, -0.31617845375277914, -0.023779257256064865,
    0.18247860592758275, 0.0053595696743599965, -0.09643212009649671, 0.010849130255828966,
    0.04154627749508764, -0.01221864906974642, -0.012840825198299315, 0.006711499008795549,
    0.0022486072409952287, -0.0021795036186277044, 6.5451282125215034e-05, 0.0003886530628209267,
    -8.850410920820318e-05, -2.4241545757030318e-05, 1.2776952219379579e-05, -1.5290717580684923e-06,
  ],
};

const HI_CACHE: Partial<Record<Filter, number[]>> = {};
function getFilter(f: Filter): { lo: number[]; hi: number[] } {
  const lo = LO[f];
  let hi = HI_CACHE[f];
  if (!hi) {
    const L = lo.length;
    hi = new Array(L);
    for (let k = 0; k < L; k++) hi[k] = ((k & 1) ? -1 : 1) * lo[L - 1 - k];
    HI_CACHE[f] = hi;
  }
  return { lo, hi };
}

// One 2D decomposition step. Returns 4 subbands of size half×half each.
// Position assignment matches DWTSubbandsViz FILTER_POS:
//   LL → (0,0)  HL → (0,1)  LH → (1,0)  HH → (1,1)
function split2D(
  band: Float32Array,
  side: number,
  f: Filter,
): { LL: Float32Array; HL: Float32Array; LH: Float32Array; HH: Float32Array } {
  const half = side >> 1;
  const { lo, hi } = getFilter(f);
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

function computeStat(chain: string, depth: number, band: Float32Array, side: number): SubbandStat {
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
    depth,
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
  maxLevel: number,
): DWTResult {
  if (maxLevel < 1) {
    const stat = computeStat('', 0, image, side);
    return { filter, level: 0, imageSize: side, subbands: [stat], totalEnergy: stat.energy };
  }

  // Image-adaptive scale: every detail-band variance is judged against this.
  const imageVar = Math.max(varianceOf(image), MIN_IMAGE_VAR);
  // Filter length governs the minimum band side that can host the analysis
  // filter without periodic-wrap aliasing — particularly important for
  // long-support Daubechies (db8=16 taps, db12=24 taps).
  const filterLen = LO[filter].length;
  // Vanishing moments = filterLen / 2 for Daubechies (haar:1, db2:2, db3:3, …).
  // Threshold is scaled by 1/√VM — strong enough to compensate for the
  // smaller detail variances produced by long-support filters on textured
  // content, mild enough that smooth content stays as classical pyramid.
  const vanishingMoments = filterLen / 2;
  const vmFactor = 1 / Math.sqrt(vanishingMoments);
  const baseDetailVar = imageVar * BASE_DETAIL_RATIO * vmFactor;

  const subbands: SubbandStat[] = [];

  function recurse(band: Float32Array, bandSide: number, depth: number, chain: string) {
    const stat = computeStat(chain, depth, band, bandSide);
    const n = band.length;
    const variance = n > 0 ? (stat.energy / n) - (stat.meanSigned * stat.meanSigned) : 0;

    // Last filter step decides whether this is the LL (approximation) path.
    // Root chain '' is treated as LL → the full image always splits at depth 0.
    const lastStep = chain.length >= 2 ? chain.slice(-2) : 'LL';
    const isApproximationPath = lastStep === 'LL';

    // Level-dependent threshold — tightens with depth so over-decomposition
    // is naturally penalised even when image variance is high. The depth-
    // scaled floor protects against banding artefacts in nominally smooth
    // images at shallow depths while still letting deeper levels capture
    // real texture detail.
    const levelFactor = 1 + DEPTH_GROW * depth;
    const depthFloor = Math.max(MIN_FLOOR, ABS_MIN_DETAIL_VAR / Math.max(1, depth));
    const detailThreshold = Math.max(depthFloor, baseDetailVar * levelFactor);

    const canSplit = depth < maxLevel && bandSide >= 2 && bandSide >= filterLen;
    const shouldSplit = canSplit && (isApproximationPath || variance > detailThreshold);

    if (!shouldSplit) {
      subbands.push(stat);
      return;
    }
    const { LL, HL, LH, HH } = split2D(band, bandSide, filter);
    const half = bandSide >> 1;
    recurse(LL, half, depth + 1, chain + 'LL');
    recurse(HL, half, depth + 1, chain + 'HL');
    recurse(LH, half, depth + 1, chain + 'LH');
    recurse(HH, half, depth + 1, chain + 'HH');
  }

  recurse(image, side, 0, '');

  let totalEnergy = 0;
  for (const b of subbands) totalEnergy += b.energy;

  return { filter, level: maxLevel, imageSize: side, subbands, totalEnergy };
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
