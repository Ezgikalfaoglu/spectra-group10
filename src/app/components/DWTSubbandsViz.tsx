import { motion } from 'motion/react';

// Visualizes DWT decomposition: LL / LH / HL / HH layout with recursive nesting
export function DWTSubbandsViz({ level = 3, active = true }: { level?: number; active?: boolean }) {
  const levels = Math.max(1, Math.min(5, level));

  // Mock subband coefficient samples — energy is concentrated in LL, HF cells ≈ 0
  const COEFF = { LL: 234.5, LH: 12.3, HL: -8.7, HH: -1.2 } as const;

  const ValueLabel = ({ v, dark }: { v: number; dark?: boolean }) => (
    <span
      className={`absolute inset-0 flex items-center justify-center font-mono font-semibold text-[11px] tracking-tight ${
        dark ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]' : 'text-slate-900'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      {v.toFixed(1)}
    </span>
  );

  const Subband = ({
    depth,
    maxDepth,
  }: { depth: number; maxDepth: number }) => {
    const isLast = depth === maxDepth;
    const delay = depth * 0.2;
    const showValues = depth === 1;

    const cellClasses = 'relative overflow-hidden rounded-md border border-cyan-300/70';

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-full h-full bg-slate-200/70 p-[2px] rounded-md">
        {/* LL (top-left) — recurse into next level */}
        {isLast ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0.4 }}
            transition={{ delay, duration: 0.5 }}
            className={`${cellClasses} bg-gradient-to-br from-cyan-200 to-cyan-400`}
          >
            <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-white/90">LL{depth}</span>
            <ValueLabel v={COEFF.LL} dark />
          </motion.div>
        ) : (
          <div className={`${cellClasses} bg-white`}>
            <Subband depth={depth + 1} maxDepth={maxDepth} />
          </div>
        )}

        {/* HL (top-right) horizontal edges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0.4 }}
          transition={{ delay: delay + 0.05 }}
          className={`${cellClasses} bg-[repeating-linear-gradient(0deg,#0891b2_0_2px,#cffafe_2px_4px)]`}
        >
          <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-slate-800/80">HL{depth}</span>
          {showValues && <ValueLabel v={COEFF.HL} />}
        </motion.div>

        {/* LH (bottom-left) vertical edges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0.4 }}
          transition={{ delay: delay + 0.1 }}
          className={`${cellClasses} bg-[repeating-linear-gradient(90deg,#0891b2_0_2px,#cffafe_2px_4px)]`}
        >
          <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-slate-800/80">LH{depth}</span>
          {showValues && <ValueLabel v={COEFF.LH} />}
        </motion.div>

        {/* HH (bottom-right) diagonal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0.4 }}
          transition={{ delay: delay + 0.15 }}
          className={`${cellClasses} bg-[repeating-linear-gradient(45deg,#6366f1_0_2px,#e0e7ff_2px_4px)]`}
        >
          <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-slate-800/80">HH{depth}</span>
          {showValues && <ValueLabel v={COEFF.HH} />}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-48 h-48 rounded-lg overflow-hidden relative">
        <Subband depth={1} maxDepth={levels} />
        {active && (
          <motion.div
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-1 bg-cyan-400/70 blur-[2px] shadow-[0_0_10px_rgba(6,182,212,1)] pointer-events-none"
          />
        )}
      </div>
      <div className="flex gap-3 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-cyan-400" /> Approx. (LL)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-cyan-600" /> Details (LH/HL)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-indigo-500" /> Diagonal (HH)
        </span>
      </div>
    </div>
  );
}
