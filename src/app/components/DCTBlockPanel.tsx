/**
 * DCT 8×8 Block Panel — pedagogical visualisation
 * Shows the canonical JPEG textbook example: an 8×8 luminance patch and
 * its 2-D DCT coefficient matrix, with the formula and the grouping
 * rules (DC, low-/high-frequency, energy compaction) annotated.
 *
 * Source values: standard JPEG reference block widely cited in
 * "Practical Fast 1-D DCT Algorithms" and most JPEG textbooks.
 */

import { useState } from 'react';
import { ArrowRight, Sigma } from 'lucide-react';

/* ── Standard JPEG 8×8 luminance block ── */
const PIXELS: number[][] = [
  [ 52,  55,  61,  66,  70,  61,  64,  73 ],
  [ 63,  59,  66,  90, 109,  85,  69,  72 ],
  [ 62,  59,  68, 113, 144, 104,  66,  73 ],
  [ 63,  58,  71, 122, 154, 106,  70,  69 ],
  [ 67,  61,  68, 104, 126,  88,  68,  70 ],
  [ 79,  65,  60,  70,  77,  68,  58,  75 ],
  [ 85,  71,  64,  59,  55,  61,  65,  83 ],
  [ 87,  79,  69,  68,  65,  76,  78,  94 ],
];

/* ── Corresponding 2-D DCT coefficients (after −128 level shift) ── */
const DCT: number[][] = [
  [ -415,  -29,  -62,   25,   55,  -20,   -1,    0 ],
  [    8,  -22,  -61,   10,   13,   -7,   -9,    5 ],
  [  -47,    7,   77,  -25,  -29,   10,    5,   -6 ],
  [  -49,   12,   34,  -15,  -10,    6,    2,    2 ],
  [   12,   -7,  -13,   -4,   -2,    2,   -3,    3 ],
  [   -8,    3,    2,   -6,   -2,    1,    4,    2 ],
  [   -1,    0,    0,   -2,   -1,   -3,    4,   -1 ],
  [    0,    0,   -1,   -4,   -1,    0,    1,    2 ],
];

const MAX_DCT_ABS = 415;

/* round(F / Δ) · Δ → dequantised matrix; HF cluster collapses to 0 */
function quantizeDct(delta: number) {
  const safeDelta = Math.max(1, delta);
  return DCT.map((row) => row.map((v) => Math.round(v / safeDelta) * safeDelta));
}

function pixelBg(v: number) {
  const c = v;
  return `rgb(${c}, ${c}, ${c})`;
}

function dctBg(v: number) {
  const intensity = Math.min(1, Math.abs(v) / MAX_DCT_ABS);
  if (v < 0) return `rgba(75, 30, 122, ${0.06 + intensity * 0.55})`;
  if (v > 0) return `rgba(30, 42, 255, ${0.06 + intensity * 0.55})`;
  return 'var(--paper-2)';
}

function dctTextColor(v: number) {
  const intensity = Math.min(1, Math.abs(v) / MAX_DCT_ABS);
  if (intensity > 0.55) return 'white';
  if (Math.abs(v) === 0) return 'var(--ink-4)';
  return 'var(--ink-1)';
}

type HoverCell = { ri: number; ci: number; v: number; x: number; y: number };

export function DCTBlockPanel({ delta: externalDelta }: { delta?: number } = {}) {
  const isControlled = typeof externalDelta === 'number';
  const [previewQ, setPreviewQ] = useState(false);
  const [internalDelta, setInternalDelta] = useState(8);
  const [hovered, setHovered] = useState<HoverCell | null>(null);

  const showQuantized = isControlled ? externalDelta! > 1 : previewQ;
  const delta = isControlled ? externalDelta! : internalDelta;
  const effectiveDelta = showQuantized ? delta : 1;
  const quantized = quantizeDct(effectiveDelta);
  const zeroCount = quantized.flat().filter((v) => v === 0).length;
  const zeroPct = Math.round((zeroCount / 64) * 100);

  return (
    <div data-dct-panel style={{ padding: 22, position: 'relative' }}>

      {/* Quantization toolbar — only when uncontrolled */}
      {!isControlled && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 14, flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setPreviewQ((q) => !q)}
            className={previewQ ? 'sp-btn sp-btn-klein sp-btn-sm' : 'sp-btn sp-btn-ghost sp-btn-sm'}
          >
            {previewQ ? `Preview Δ = ${internalDelta}` : 'Show after quantization'}
          </button>
          {previewQ && (
            <>
              <input
                type="range" min={1} max={32} value={internalDelta}
                onChange={(e) => setInternalDelta(Number(e.target.value))}
                style={{ flex: 1, minWidth: 120, accentColor: 'var(--klein)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.1em', color: 'var(--klein)',
                }}
              >
                {zeroPct}% zeros
              </span>
            </>
          )}
        </div>
      )}

      {/* Formula */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', marginBottom: 18,
          background: 'var(--paper-2)', border: '1px solid var(--rule)',
          borderRadius: 'var(--r-md)',
        }}
      >
        <Sigma style={{ width: 14, height: 14, color: 'var(--klein)', flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--ink-1)', letterSpacing: '0.02em', lineHeight: 1.55,
          }}
        >
          F(u,v) = <span style={{ color: 'var(--klein)' }}>¼</span> · C(u) C(v) ·
          Σ<sub>x=0..7</sub> Σ<sub>y=0..7</sub> &nbsp;
          f(x,y) ·
          cos[(2x+1)<span style={{ color: 'var(--klein)' }}>u</span>π / 16] ·
          cos[(2y+1)<span style={{ color: 'var(--klein)' }}>v</span>π / 16]
        </span>
      </div>

      {/* Side-by-side blocks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 28px 1fr',
          gap: 12, alignItems: 'center',
          marginBottom: 18,
        }}
      >
        {/* Pixel block */}
        <BlockGrid
          title="Pixel block · f(x,y)"
          subtitle="Luma samples · 0–255"
          values={PIXELS}
          bgFn={pixelBg}
          textFn={(v) => (v > 128 ? 'var(--ink)' : 'white')}
          accent="var(--ink)"
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 8.5,
              letterSpacing: '0.15em', color: 'var(--ink-4)',
              textTransform: 'uppercase',
            }}
          >DCT</div>
          <ArrowRight style={{ width: 18, height: 18, color: 'var(--klein)' }} />
          <div
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 8.5,
              letterSpacing: '0.15em', color: 'var(--ink-4)',
              textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3,
            }}
          >
            level<br/>shift<br/>−128
          </div>
        </div>

        {/* DCT block — hoverable */}
        <BlockGrid
          title={showQuantized ? 'Quantized coeffs · q(u,v)·Δ' : 'DCT coeffs · F(u,v)'}
          subtitle={showQuantized ? `Δ = ${delta} · ${zeroPct}% zeros` : 'Frequency · −415..+77'}
          values={showQuantized ? quantized : DCT}
          bgFn={dctBg}
          textFn={dctTextColor}
          accent="var(--klein)"
          highlightDC
          onCellEnter={(ri, ci, v, e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const panel = (e.currentTarget as HTMLElement).closest('[data-dct-panel]') as HTMLElement | null;
            const panelRect = panel?.getBoundingClientRect();
            setHovered({
              ri, ci, v,
              x: rect.left - (panelRect?.left ?? 0) + rect.width / 2,
              y: rect.top - (panelRect?.top ?? 0),
            });
          }}
          onCellLeave={() => setHovered(null)}
        />
      </div>

      {/* Annotations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          {
            tag: 'DC',
            color: 'var(--klein)',
            text: <>F(0,0) = <strong>−415</strong> · the block's mean luma after level-shift, scaled by ⅛. Carries most of the energy.</>,
          },
          {
            tag: 'LF',
            color: 'var(--plum)',
            text: <>Top-left neighbours (low spatial frequencies) hold the bulk of the remaining signal — coarse gradients.</>,
          },
          {
            tag: 'HF',
            color: 'var(--ink-3)',
            text: <>Bottom-right cells ≈ 0: high frequencies the eye barely perceives. Quantisation zeroes them → compression gain.</>,
          },
          {
            tag: 'BASIS',
            color: 'var(--leaf)',
            text: <>Each F(u,v) is the projection onto one of <strong>64 fixed cosine basis</strong> functions — defined entirely by (u,v).</>,
          },
        ].map(row => (
          <div
            key={row.tag}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--r-sm)',
              background: 'var(--paper-2)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', color: row.color,
                textTransform: 'uppercase', padding: '2px 7px',
                border: `1px solid ${row.color}`, borderRadius: 100,
                flexShrink: 0, marginTop: 1, lineHeight: 1.2,
              }}
            >{row.tag}</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5,
                color: 'var(--ink-2)', lineHeight: 1.5, letterSpacing: '0.02em',
              }}
            >{row.text}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip overlay */}
      {hovered && <DctTooltip cell={hovered} />}
    </div>
  );
}

/* ── Hover tooltip card ── */
function DctTooltip({ cell }: { cell: HoverCell }) {
  const { ri: u, ci: v, v: F, x, y } = cell;
  const isDC = u === 0 && v === 0;
  const label = isDC ? 'DC' : (u + v <= 3 ? 'Low-frequency' : u + v >= 10 ? 'High-frequency' : 'Mid-frequency');
  return (
    <div
      style={{
        position: 'absolute',
        left: x, top: y,
        transform: 'translate(-50%, calc(-100% - 10px))',
        background: 'var(--paper)',
        border: '1px solid var(--klein)',
        borderRadius: 'var(--r-md)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
        padding: '10px 12px',
        pointerEvents: 'none',
        zIndex: 20,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--klein)', fontWeight: 600,
          letterSpacing: '0.04em', marginBottom: 6,
        }}
      >
        F(u={u}, v={v}) = {F}
      </div>
      <CosineBasis u={u} v={v} />
      <div
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--ink-3)', letterSpacing: '0.1em',
          textTransform: 'uppercase', marginTop: 6,
        }}
      >
        Cosine basis · {label}
      </div>
    </div>
  );
}

/* ── 32×32 SVG cosine basis preview for (u, v) ── */
function CosineBasis({ u, v }: { u: number; v: number }) {
  const N = 16;
  const cells: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const fx = x / 2;
      const fy = y / 2;
      const val =
        Math.cos(((2 * fx + 1) * u * Math.PI) / 16) *
        Math.cos(((2 * fy + 1) * v * Math.PI) / 16);
      const g = Math.round(((val + 1) / 2) * 255);
      cells.push({ x, y, c: `rgb(${g},${g},${g})` });
    }
  }
  const cell = 6;
  return (
    <svg
      width={N * cell} height={N * cell}
      style={{ display: 'block', borderRadius: 4, border: '1px solid var(--rule)' }}
      shapeRendering="crispEdges"
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x * cell} y={c.y * cell} width={cell} height={cell} fill={c.c} />
      ))}
    </svg>
  );
}

/* ── 8×8 grid renderer ── */
function BlockGrid({
  title, subtitle, values, bgFn, textFn, accent, highlightDC,
  onCellEnter, onCellLeave,
}: {
  title: string;
  subtitle: string;
  values: number[][];
  bgFn: (v: number) => string;
  textFn: (v: number) => string;
  accent: string;
  highlightDC?: boolean;
  onCellEnter?: (ri: number, ci: number, v: number, e: React.MouseEvent) => void;
  onCellLeave?: () => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10.5,
            color: accent, fontWeight: 600, letterSpacing: '0.06em',
          }}
        >{title}</div>
        <div
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--ink-4)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginTop: 2,
          }}
        >{subtitle}</div>
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 1.5, padding: 4,
          border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)',
          background: 'var(--rule)',
        }}
      >
        {values.flatMap((row, ri) => row.map((v, ci) => {
          const isDC = highlightDC && ri === 0 && ci === 0;
          return (
            <div
              key={`${ri}-${ci}`}
              onMouseEnter={onCellEnter ? (e) => onCellEnter(ri, ci, v, e) : undefined}
              onMouseLeave={onCellLeave}
              style={{
                aspectRatio: '1',
                background: bgFn(v),
                color: textFn(v),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5, fontWeight: isDC ? 700 : 500,
                letterSpacing: '-0.02em',
                outline: isDC ? `1.5px solid ${accent}` : 'none',
                outlineOffset: -1.5,
                borderRadius: 1,
                position: 'relative',
                cursor: onCellEnter ? 'crosshair' : 'default',
              }}
            >
              {v}
            </div>
          );
        }))}
      </div>
    </div>
  );
}
