import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';

export type ComparisonMode = 'split' | 'reveal' | 'lens';

export function ComparisonSlider({
  originalSrc,
  reconstructedSrc,
  originalFilter = 'none',
  reconstructedFilter = 'contrast(0.95) brightness(1.02)',
  height = 'md:h-[440px]',
  mode = 'split',
}: {
  originalSrc: string;
  reconstructedSrc: string;
  originalFilter?: string;
  reconstructedFilter?: string;
  height?: string;
  mode?: ComparisonMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [lensVisible, setLensVisible] = useState(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, next)));
  }, []);

  const updateLens = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  // ── Split: drag handlers ──
  useEffect(() => {
    if (mode !== 'split' || !dragging) return;
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
  }, [dragging, updatePos, mode]);

  // ── Reveal: animated sweep ──
  useEffect(() => {
    if (mode !== 'reveal') return;
    let raf: number;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = ((ts - start) / 2400) % 1;          // 2.4s per cycle
      const eased = 0.5 - 0.5 * Math.cos(t * Math.PI * 2); // 0 → 1 → 0
      setPos(eased * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Snap split pos to 50 when entering split fresh (after non-split modes)
  useEffect(() => {
    if (mode === 'split') setPos(50);
  }, [mode]);

  const isSplit = mode === 'split';
  const isReveal = mode === 'reveal';
  const isLens = mode === 'lens';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} rounded-xl overflow-hidden border select-none`}
      style={{
        borderColor: 'var(--rule)',
        background: 'var(--paper-3)',
        boxShadow: 'var(--shadow-lift)',
        cursor: isSplit ? 'ew-resize' : isLens ? 'crosshair' : 'default',
      }}
      onMouseDown={isSplit ? (e) => { setDragging(true); updatePos(e.clientX); } : undefined}
      onTouchStart={isSplit ? (e) => { setDragging(true); updatePos(e.touches[0].clientX); } : undefined}
      onMouseMove={isLens ? (e) => updateLens(e.clientX, e.clientY) : undefined}
      onMouseEnter={isLens ? () => setLensVisible(true) : undefined}
      onMouseLeave={isLens ? () => setLensVisible(false) : undefined}
    >
      {/* Original full */}
      <img
        src={originalSrc}
        alt="Original"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: originalFilter }}
        draggable={false}
      />
      {/* Reconstructed clipped (split/reveal) */}
      {!isLens && (
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
      )}

      {/* Lens (reconstructed view inside circle) */}
      {isLens && lensVisible && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${lensPos.x}%`,
            top: `${lensPos.y}%`,
            width: 180,
            height: 180,
            marginLeft: -90,
            marginTop: -90,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid white',
            boxShadow:
              '0 0 0 1px rgba(30,42,255,0.35), 0 12px 32px rgba(0,0,0,0.45)',
            zIndex: 4,
          }}
        >
          <img
            src={reconstructedSrc}
            alt="Reconstructed"
            draggable={false}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: reconstructedFilter,
              transform: `scale(2.4) translate(${(50 - lensPos.x) * 0.6}%, ${(50 - lensPos.y) * 0.6}%)`,
              transformOrigin: 'center',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: 8.5,
              letterSpacing: '0.18em',
              color: 'white',
              background: 'rgba(10,11,14,0.55)',
              padding: '2px 8px',
              borderRadius: 100,
              textTransform: 'uppercase',
            }}
          >
            Lens · 2.4×
          </span>
        </div>
      )}

      {/* Labels */}
      <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(30,42,255,0.9)', color: 'white', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', padding: '5px 12px', borderRadius: 100, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)' }}>
        Reconstructed
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(10,11,14,0.7)', backdropFilter: 'blur(6px)', color: 'white', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', padding: '5px 12px', borderRadius: 100, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.12)' }}>
        Original
      </div>

      {/* Divider (split + reveal) */}
      {!isLens && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 2,
            background: 'white',
            left: `${pos}%`,
            boxShadow: '0 0 0 1px rgba(30,42,255,0.2), 0 0 20px rgba(30,42,255,0.3)',
            pointerEvents: 'none',
            transition: isReveal ? 'none' : undefined,
          }}
        >
          {isSplit && (
            <motion.div
              animate={{ scale: dragging ? 1.1 : 1 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'grab',
              }}
            >
              <span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '6px solid var(--ink)' }} />
              <span style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid var(--ink)' }} />
            </motion.div>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(246,244,236,0.9)', backdropFilter: 'blur(6px)', border: '1px solid var(--rule)', padding: '4px 12px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
        {isSplit && `Drag to compare · ${Math.round(pos)}%`}
        {isReveal && 'Auto-reveal · sweep playing'}
        {isLens && (lensVisible ? 'Move to magnify' : 'Hover to magnify')}
      </div>
    </div>
  );
}
