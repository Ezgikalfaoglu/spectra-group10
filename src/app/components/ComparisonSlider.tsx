import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';

export function ComparisonSlider({
  originalSrc,
  reconstructedSrc,
  originalFilter = 'none',
  reconstructedFilter = 'contrast(0.95) brightness(1.02)',
  height = 'md:h-[440px]',
}: {
  originalSrc: string;
  reconstructedSrc: string;
  originalFilter?: string;
  reconstructedFilter?: string;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, next)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updatePos(x);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, updatePos]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} rounded-xl overflow-hidden border select-none cursor-ew-resize`}
      style={{ borderColor: 'var(--rule)', background: 'var(--paper-3)', boxShadow: 'var(--shadow-lift)' }}
      onMouseDown={(e) => { setDragging(true); updatePos(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); updatePos(e.touches[0].clientX); }}
    >
      {/* Original full */}
      <img
        src={originalSrc}
        alt="Original"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: originalFilter }}
        draggable={false}
      />
      {/* Reconstructed clipped */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={reconstructedSrc}
          alt="Reconstructed"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: reconstructedFilter }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(30,42,255,0.9)', color: 'white', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', padding: '5px 12px', borderRadius: 100, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)' }}>
        Reconstructed
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(10,11,14,0.7)', backdropFilter: 'blur(6px)', color: 'white', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', padding: '5px 12px', borderRadius: 100, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.12)' }}>
        Original
      </div>

      {/* Divider */}
      <div
        style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'white', left: `${pos}%`, boxShadow: '0 0 0 1px rgba(30,42,255,0.2), 0 0 20px rgba(30,42,255,0.3)', pointerEvents: 'none' }}
      >
        <motion.div
          animate={{ scale: dragging ? 1.1 : 1 }}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 46, height: 46, borderRadius: '50%', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'grab' }}
        >
          <span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '6px solid var(--ink)' }} />
          <span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid var(--ink)' }} />
        </motion.div>
      </div>

      {/* Progress hint */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(246,244,236,0.9)', backdropFilter: 'blur(6px)', border: '1px solid var(--rule)', padding: '4px 12px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
        Drag to compare · {Math.round(pos)}%
      </div>
    </div>
  );
}