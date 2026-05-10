import { motion } from 'motion/react';

type Filter = 'LL' | 'HL' | 'LH' | 'HH';

// 2D wavelet packet decomposition: applies the 4 filter bank (LL/HL/LH/HH)
// recursively to *every* subband (not just LL), yielding 4^level bands.
// Level 1 → 4 bands, Level 2 → 16 bands, Level 3 → 64 bands.

// Energy decay per filter — LL keeps most energy, HH bands collapse toward zero.
const FILTER_ENERGY: Record<Filter, number> = { LL: 0.78, HL: 0.10, LH: 0.10, HH: 0.02 };

// Spatial layout for wavelet packets: outer 2×2 super-block holds level-1 filter,
// inner 2×2 holds level-2 filter — produces the canonical Mallat-tree image.
const FILTER_POS: Record<Filter, [number, number]> = { LL: [0, 0], HL: [0, 1], LH: [1, 0], HH: [1, 1] };

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

export function DWTSubbandsViz({ level = 2, active = true }: { level?: number; active?: boolean }) {
  const lvl = Math.max(1, Math.min(3, level));
  const size = 1 << lvl;
  const bands = buildBands(lvl);
  const cellPx = lvl === 1 ? 96 : lvl === 2 ? 48 : 24;
  const showValues = lvl <= 2;
  const showLabels = lvl <= 2;

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
        {bands.map((b, i) => {
          const delay = (b.row + b.col) * 0.04;
          return (
            <motion.div
              key={b.chain.join('-')}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: active ? 1 : 0.4, scale: 1 }}
              transition={{ delay, duration: 0.35 }}
              className="relative overflow-hidden rounded-[3px] border border-cyan-300/60"
              style={{
                gridColumn: b.col + 1,
                gridRow: b.row + 1,
                background: cellPattern(b.chain),
              }}
            >
              {showLabels && (
                <span className="absolute top-0.5 left-1 font-mono font-bold text-[8px] text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] leading-none">
                  {b.chain.join('')}
                </span>
              )}
              {showValues && (
                <span
                  className="absolute inset-0 flex items-center justify-center font-mono font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                  style={{ fontSize: lvl === 1 ? 13 : 10 }}
                >
                  {b.value.toFixed(b.energy >= 10 ? 1 : 2)}
                </span>
              )}
            </motion.div>
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
