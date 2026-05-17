import { motion } from 'motion/react';

type Filter = 'LL' | 'HL' | 'LH' | 'HH';

// 2D wavelet packet decomposition: applies the 4 filter bank (LL/HL/LH/HH)
// recursively to *every* subband (not just LL), yielding 4^level bands.
// Level 1 → 4 bands, Level 2 → 16 bands, Level 3 → 64 bands.

// Mock energy decay — used only when real coefficients are unavailable (demo mode).
const FILTER_ENERGY: Record<Filter, number> = { LL: 0.78, HL: 0.10, LH: 0.10, HH: 0.02 };

// Spatial layout for wavelet packets: outer 2×2 super-block holds level-1 filter,
// inner 2×2 holds level-2 filter — produces the canonical Mallat-tree image.
const FILTER_POS: Record<Filter, [number, number]> = { LL: [0, 0], HL: [0, 1], LH: [1, 0], HH: [1, 1] };

export interface SubbandCoef {
  chain: string; // "LLHL" — 2 chars per filter step
  value: number; // signed mean of subband (display value)
}

interface BandCell {
  chain: Filter[];
  row: number;
  col: number;
  value: number;
  energy: number;
}

function buildBands(level: number): BandCell[] {
  const size = 1 << level; // 2^level
  const cells: BandCell[] = [];
  const baseEnergy = 234.5;

  function recurse(chain: Filter[], row: number, col: number, blockSize: number, energy: number) {
    if (chain.length === level) {
      // Signed pseudo-coefficient — alternating sign based on chain to look realistic
      const signSeed = chain.reduce((s, f) => s + (f === 'HL' ? 1 : f === 'LH' ? 2 : f === 'HH' ? 3 : 0), 0);
      const sign = signSeed % 2 === 0 ? 1 : -1;
      cells.push({ chain, row, col, value: sign * energy, energy });
      return;
    }
    const half = blockSize / 2;
    (['LL', 'HL', 'LH', 'HH'] as Filter[]).forEach((f) => {
      const [dr, dc] = FILTER_POS[f];
      recurse([...chain, f], row + dr * half, col + dc * half, half, energy * FILTER_ENERGY[f]);
    });
  }

  recurse([], 0, 0, size, baseEnergy);
  return cells;
}

function cellPattern(chain: Filter[]): string {
  // Pattern by the *last* applied filter — visually expresses the band's orientation
  const last = chain[chain.length - 1];
  // Intensity by total LL-ness in chain → LL-heavy bands are brighter
  const llCount = chain.filter((f) => f === 'LL').length;
  const alpha = 0.35 + 0.65 * (llCount / chain.length);

  if (last === 'LL') {
    return `linear-gradient(135deg, rgba(34,211,238,${alpha}) 0%, rgba(6,182,212,${alpha * 0.85}) 100%)`;
  }
  if (last === 'HL') {
    return `repeating-linear-gradient(0deg, rgba(8,145,178,${alpha}) 0 2px, rgba(207,250,254,${alpha * 0.6}) 2px 4px)`;
  }
  if (last === 'LH') {
    return `repeating-linear-gradient(90deg, rgba(8,145,178,${alpha}) 0 2px, rgba(207,250,254,${alpha * 0.6}) 2px 4px)`;
  }
  // HH
  return `repeating-linear-gradient(45deg, rgba(99,102,241,${alpha}) 0 2px, rgba(224,231,255,${alpha * 0.6}) 2px 4px)`;
}

// Cheap solid-color fallback for dense grids (L4/L5) — avoids GPU cost of 256+ gradient fills.
function cellSolidColor(chain: Filter[]): string {
  const last = chain[chain.length - 1];
  const llCount = chain.filter((f) => f === 'LL').length;
  const alpha = 0.35 + 0.65 * (llCount / chain.length);
  if (last === 'LL') return `rgba(34,211,238,${alpha})`;
  if (last === 'HL') return `rgba(8,145,178,${alpha})`;
  if (last === 'LH') return `rgba(14,165,233,${alpha})`;
  return `rgba(99,102,241,${alpha})`;
}

function chainStringToFilters(chain: string): Filter[] {
  const out: Filter[] = [];
  for (let i = 0; i < chain.length; i += 2) {
    out.push(chain.slice(i, i + 2) as Filter);
  }
  return out;
}

// Place a chain at its grid coordinates by walking FILTER_POS at each step.
function chainToGridPos(chain: Filter[], lvl: number): { row: number; col: number } {
  let row = 0, col = 0;
  for (let i = 0; i < chain.length; i++) {
    const [dr, dc] = FILTER_POS[chain[i]];
    const span = 1 << (lvl - i - 1);
    row += dr * span;
    col += dc * span;
  }
  return { row, col };
}

export function DWTSubbandsViz({
  level = 2,
  active = true,
  coefficients,
}: {
  level?: number;
  active?: boolean;
  coefficients?: SubbandCoef[];
}) {
  const lvl = Math.max(1, Math.min(5, level));
  const size = 1 << lvl;
  const expectedCount = size * size;
  const useReal = coefficients && coefficients.length === expectedCount;

  const bands: BandCell[] = useReal
    ? coefficients!.map((c) => {
        const chain = chainStringToFilters(c.chain);
        const { row, col } = chainToGridPos(chain, lvl);
        return { chain, row, col, value: c.value, energy: Math.abs(c.value) };
      })
    : buildBands(lvl);

  // Per-level visual scale. L4/L5 hide text (cells too small).
  const cellPx = lvl === 1 ? 96 : lvl === 2 ? 48 : lvl === 3 ? 28 : lvl === 4 ? 14 : 7;
  const showValues = lvl <= 3;
  const showLabels = lvl <= 2;
  const valueFontSize = lvl === 1 ? 13 : lvl === 2 ? 10 : 7;
  // L4/L5: skip per-cell motion + use solid colors (256/1024 motion.divs lag the UI).
  const useMotion = lvl <= 3;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: cellPx * size + (size - 1) * 2 + 8,
          height: cellPx * size + (size - 1) * 2 + 8,
          padding: 4,
          background: 'rgba(15,23,42,0.06)',
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          gap: 2,
        }}
      >
        {bands.map((b) => {
          const cellStyle = {
            gridColumn: b.col + 1,
            gridRow: b.row + 1,
            background: useMotion ? cellPattern(b.chain) : cellSolidColor(b.chain),
          };
          const cellClass = useMotion
            ? 'relative overflow-hidden rounded-[3px] border border-cyan-300/60'
            : 'relative overflow-hidden';
          const content = (
            <>
              {showLabels && (
                <span className="absolute top-0.5 left-1 font-mono font-bold text-[8px] text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] leading-none">
                  {b.chain.join('')}
                </span>
              )}
              {showValues && (
                <span
                  className="absolute inset-0 flex items-center justify-center font-mono font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] px-0.5"
                  style={{ fontSize: valueFontSize, lineHeight: 1 }}
                >
                  {lvl >= 3
                    ? (Math.abs(b.value) >= 100 ? b.value.toFixed(0) : Math.abs(b.value) >= 10 ? b.value.toFixed(1) : Math.abs(b.value) >= 1 ? b.value.toFixed(1) : b.value.toFixed(2))
                    : (Math.abs(b.value) >= 100 ? b.value.toFixed(0) : Math.abs(b.value) >= 10 ? b.value.toFixed(1) : Math.abs(b.value) >= 1 ? b.value.toFixed(2) : b.value.toFixed(3))}
                </span>
              )}
            </>
          );
          if (useMotion) {
            const delay = (b.row + b.col) * 0.04;
            return (
              <motion.div
                key={b.chain.join('-')}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: active ? 1 : 0.4, scale: 1 }}
                transition={{ delay, duration: 0.35 }}
                className={cellClass}
                style={cellStyle}
              >
                {content}
              </motion.div>
            );
          }
          return (
            <div key={b.chain.join('-')} className={cellClass} style={cellStyle}>
              {content}
            </div>
          );
        })}
        {active && (
          <motion.div
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-1 bg-cyan-400/70 blur-[2px] shadow-[0_0_10px_rgba(6,182,212,1)] pointer-events-none"
            style={{ zIndex: 2 }}
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-500">
          {bands.length} subbands · level {lvl} · 4-filter packet
        </div>
        <div className="flex gap-3 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-cyan-400" /> Approx (LL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'repeating-linear-gradient(0deg,#0891b2_0_1px,#cffafe_1px_2px)' }} /> Vertical (HL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'repeating-linear-gradient(90deg,#0891b2_0_1px,#cffafe_1px_2px)' }} /> Horizontal (LH)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg,#6366f1_0_1px,#e0e7ff_1px_2px)' }} /> Diagonal (HH)
          </span>
        </div>
      </div>
    </div>
  );
}
