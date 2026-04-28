/**
 * RECONSTRUCTION PAGE — Pipeline Stage 07
 * Inverse pipeline visualization & decoded preview before Results.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Layers, ArrowRight, Info, RotateCcw } from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

interface ReconSettings {
  precision: 'float64' | 'float32' | 'fixed';
  postFilter: boolean;
  clipRange: boolean;
}

const DEFAULTS: ReconSettings = {
  precision: 'float32',
  postFilter: true,
  clipRange: true,
};

const INVERSE_STAGES = [
  { id: 'unpack',    label: 'Unpack bitstream',    desc: 'Read header and demultiplex coded segments.' },
  { id: 'decode',    label: 'Entropy decode',      desc: 'Reverse Huffman / arithmetic coding.' },
  { id: 'dequant',   label: 'De-quantize',         desc: 'Multiply each coefficient by its step Δ.' },
  { id: 'inverse',   label: 'Inverse transform',   desc: 'IDWT (J2K) or IDCT block-by-block (JPEG).' },
  { id: 'unshift',   label: 'Reverse level shift', desc: 'Add 128 back to each sample, clip to [0, 255].' },
  { id: 'render',    label: 'Render plate',        desc: 'Composite channels and emit pixel buffer.' },
];

const PRECISIONS: { id: ReconSettings['precision']; label: string; sub: string; desc: string }[] = [
  { id: 'float64', label: 'Float 64',  sub: 'Reference',
    desc: 'Double-precision arithmetic. Reference quality, slowest. Use for ground-truth comparisons.' },
  { id: 'float32', label: 'Float 32',  sub: 'Default',
    desc: 'Single-precision. Indistinguishable from float64 for natural images. Good speed/quality balance.' },
  { id: 'fixed',   label: 'Fixed 16.16', sub: 'Embedded',
    desc: 'Integer arithmetic with 16-bit fractional precision. Fast on devices without an FPU.' },
];

export function ReconstructionPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ReconSettings>(DEFAULTS);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('spectra_reconstruction');
    if (saved) {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  // Animated stage walker for the visualization
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStage(s => (s + 1) % INVERSE_STAGES.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const update = <K extends keyof ReconSettings>(k: K, v: ReconSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleNext = () => {
    localStorage.setItem('spectra_reconstruction', JSON.stringify(settings));
    navigate('/results');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}
    >
      <PipelineStepper />

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="sp-eyebrow" style={{ marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--klein)', display: 'inline-block' }} />
          STEP 07 · RECONSTRUCTION
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          Rebuild the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>plate</em>.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Run the encoder backwards — entropy decode, de-quantize, inverse transform, render the pixel buffer
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Precision */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: 14, height: 14, color: 'var(--klein)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>NUMERIC PRECISION</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRECISIONS.map(p => {
                const isSelected = settings.precision === p.id;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => update('precision', p.id)}
                    whileHover={{ x: 2 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                      padding: '14px 18px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${isSelected ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                      background: isSelected ? 'rgba(30,42,255,0.04)' : 'white',
                      cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11.5,
                          color: isSelected ? 'var(--klein)' : 'var(--ink)',
                          fontWeight: isSelected ? 600 : 400, letterSpacing: '0.04em',
                        }}>{p.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8.5, padding: '2px 7px',
                          background: 'var(--paper-3)', color: 'var(--ink-3)',
                          borderRadius: 100, letterSpacing: '0.12em', textTransform: 'uppercase',
                        }}>{p.sub}</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.04em', lineHeight: 1.55 }}>{p.desc}</p>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: `2px solid ${isSelected ? 'var(--klein)' : 'var(--rule)'}`,
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--klein)' }} />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Post-processing toggles */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>POST-PROCESSING</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'postFilter' as const, label: 'Deblock / deringing filter', desc: 'Smooth visible block-boundary artifacts and ringing near sharp edges.' },
                { k: 'clipRange'  as const, label: 'Clip to [0, 255]', desc: 'Saturate over- and under-shoots from numeric precision back into valid pixel range.' },
              ].map(row => {
                const isOn = settings[row.k];
                return (
                  <div key={row.k}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${isOn ? 'rgba(30,42,255,0.25)' : 'var(--rule)'}`,
                      background: isOn ? 'rgba(30,42,255,0.04)' : 'white',
                    }}
                  >
                    <div style={{ marginRight: 12 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: isOn ? 'var(--klein)' : 'var(--ink)', letterSpacing: '0.05em', marginBottom: 3 }}>
                        {row.label}
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>{row.desc}</p>
                    </div>
                    <button
                      onClick={() => update(row.k, !isOn)}
                      role="switch"
                      aria-checked={isOn}
                      style={{
                        width: 42, height: 24, borderRadius: 100,
                        background: isOn ? 'var(--klein)' : 'var(--paper-3)',
                        border: 'none', position: 'relative', cursor: 'pointer',
                        transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: isOn ? 21 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => navigate('/processing')} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Process
            </button>
            <button onClick={handleNext} className="sp-btn sp-btn-klein" style={{ flex: 2, justifyContent: 'center', gap: 8 }}>
              View results
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* RIGHT: Inverse-pipeline visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RotateCcw style={{ width: 13, height: 13, color: 'var(--klein)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>INVERSE PIPELINE</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Demo loop</span>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {INVERSE_STAGES.map((s, i) => {
                const isActive = i === activeStage;
                return (
                  <div key={s.id} style={{
                    position: 'relative',
                    display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14,
                    padding: '8px 0', alignItems: 'center',
                  }}>
                    {i < INVERSE_STAGES.length - 1 && (
                      <span style={{
                        position: 'absolute', left: 15, top: 32, bottom: -4,
                        width: 2, background: 'var(--rule)', zIndex: 0,
                      }} />
                    )}
                    <div style={{
                      position: 'relative', zIndex: 1,
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'var(--klein)' : 'white',
                      border: `1.5px solid ${isActive ? 'var(--klein)' : 'var(--rule)'}`,
                      color: isActive ? 'white' : 'var(--ink-4)',
                      boxShadow: isActive ? '0 0 0 5px rgba(30,42,255,0.10)' : 'none',
                      transition: 'all 0.4s',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    }}>{i + 1}</div>
                    <div style={{ opacity: isActive ? 1 : 0.6, transition: 'opacity 0.4s' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11.5,
                        fontWeight: isActive ? 700 : 500, letterSpacing: '0.04em',
                        color: isActive ? 'var(--klein)' : 'var(--ink-1)', marginBottom: 2,
                      }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              Reconstruction is deterministic — given the same encoded bitstream and decoder, the output is bit-for-bit identical.
              Quality differences come from <strong>encode-side</strong> choices (transform, quantization, entropy).
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
