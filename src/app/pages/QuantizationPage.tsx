/**
 * QUANTIZATION PAGE — Team: Quantization Controls
 * ─────────────────────────────────────────────────────────
 * Responsibilities:
 *   • Quantization type selection (Uniform / Scalar)
 *   • Step size control (1–64)
 *   • Lossless mode toggle (forced for fingerprint/biomedical)
 *   • Live quality preview (estimated PSNR/CR display)
 *   • Reads localStorage["spectra_upload", "spectra_transform"]
 *   • Stores result in localStorage["spectra_quantization"]
 *   • Routes ← /transform  → /processing
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal, ArrowRight, AlertTriangle, Info,
  Lock, Unlock, Play, TrendingDown, TrendingUp,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

interface QuantizationSettings {
  quantizationType: 'uniform' | 'scalar';
  stepSize: number;
  lossless: boolean;
}

interface StoredTransform {
  method: 'jpeg' | 'jpeg2000';
  waveletFilter: string;
  decompositionLevel: number;
}

/* Rough quality estimates for the preview chip */
function estimateMetrics(method: string, stepSize: number, decompositionLevel: number, lossless: boolean) {
  if (lossless) return { psnr: '∞', cr: '2–3:1', grade: 'Lossless' };
  if (method === 'jpeg2000') {
    const lvlBonus = (decompositionLevel - 1) * 0.4;
    const psnr = Math.max(22, 38.5 - (stepSize / 32) * 16 + lvlBonus + 1.2).toFixed(1);
    const cr = (5 + (stepSize / 4) * 2.1).toFixed(1);
    return { psnr: `~${psnr}`, cr: `~${cr}:1`, grade: parseFloat(psnr) >= 35 ? 'Good' : parseFloat(psnr) >= 30 ? 'Acceptable' : 'Lossy' };
  } else {
    const psnr = Math.max(20, 36.5 - (stepSize / 32) * 14).toFixed(1);
    const cr = (4 + (stepSize / 4) * 1.8).toFixed(1);
    return { psnr: `~${psnr}`, cr: `~${cr}:1`, grade: parseFloat(psnr) >= 35 ? 'Good' : parseFloat(psnr) >= 30 ? 'Acceptable' : 'Lossy' };
  }
}

const GRADE_COLOR: Record<string, string> = {
  'Lossless':   'var(--leaf)',
  'Good':       'var(--klein)',
  'Acceptable': 'var(--amber)',
  'Lossy':      '#d4574c',
};

export function QuantizationPage() {
  const navigate = useNavigate();
  const [transform, setTransform] = useState<StoredTransform | null>(null);
  const [isLosslessForced, setIsLosslessForced] = useState(false);
  const [settings, setSettings] = useState<QuantizationSettings>({
    quantizationType: 'scalar',
    stepSize: 18,
    lossless: false,
  });

  useEffect(() => {
    const upload = localStorage.getItem('spectra_upload');
    if (upload) {
      try {
        const u = JSON.parse(upload);
        const forced = ['fingerprint', 'biomedical'].includes(u.imageType || '');
        setIsLosslessForced(forced);
        if (forced) setSettings(s => ({ ...s, lossless: true }));
      } catch {}
    }
    const saved = localStorage.getItem('spectra_transform');
    if (saved) {
      try { setTransform(JSON.parse(saved)); } catch {}
    }
    const savedQ = localStorage.getItem('spectra_quantization');
    if (savedQ) {
      try { setSettings(JSON.parse(savedQ)); } catch {}
    }
  }, []);

  const update = <K extends keyof QuantizationSettings>(key: K, value: QuantizationSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  const handleNext = () => {
    localStorage.setItem('spectra_quantization', JSON.stringify(settings));
    navigate('/processing');
  };

  const metrics = estimateMetrics(
    transform?.method || 'jpeg2000',
    settings.stepSize,
    transform?.decompositionLevel || 3,
    settings.lossless,
  );

  const gradeColor = GRADE_COLOR[metrics.grade] || 'var(--ink)';

  /* Step size qualitative label */
  const stepLabel = settings.stepSize <= 8
    ? 'Near-lossless quality'
    : settings.stepSize <= 16
      ? 'High quality'
      : settings.stepSize <= 24
        ? 'Balanced'
        : settings.stepSize <= 40
          ? 'High compression'
          : 'Maximum compression';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}
    >
      <PipelineStepper />

      {/* Page Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="sp-eyebrow" style={{ marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--klein)', display: 'inline-block' }} />
          STEP 03 · QUANTIZATION PARAMETERS
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          Dial the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>resolution</em>.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Quantization reduces coefficient precision — the step size controls the quality-to-size trade-off
        </p>
      </div>

      {/* Guard */}
      {!transform && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(224,168,80,0.06)', border: '1px solid rgba(224,168,80,0.25)', borderRadius: 'var(--r-md)', marginBottom: 24 }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: 'var(--amber)', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            Transform settings not found. Please complete Step 02 first.
          </p>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Quantization Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Lossless toggle */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: isLosslessForced ? 'rgba(224,168,80,0.12)' : 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {settings.lossless
                  ? <Lock style={{ width: 14, height: 14, color: isLosslessForced ? 'var(--amber)' : 'var(--leaf)' }} />
                  : <Unlock style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                }
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>COMPRESSION MODE</span>
            </div>
            <div style={{ padding: 20 }}>
              <button
                onClick={() => !isLosslessForced && update('lossless', !settings.lossless)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', borderRadius: 'var(--r-md)',
                  border: `1px solid ${settings.lossless ? 'rgba(31,138,94,0.35)' : 'var(--rule)'}`,
                  background: settings.lossless ? 'rgba(31,138,94,0.05)' : 'white',
                  cursor: isLosslessForced ? 'not-allowed' : 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: settings.lossless ? 'var(--leaf)' : 'var(--ink)', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {settings.lossless ? 'Lossless Reconstruction' : 'Lossy Compression'}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                    {settings.lossless
                      ? 'Perfect reconstruction. No coefficient precision loss. Larger file size.'
                      : 'Reduces precision via step size. Controls quality-size trade-off.'
                    }
                  </p>
                  {isLosslessForced && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--amber)', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>
                      Forced by image type
                    </span>
                  )}
                </div>
                {/* Toggle switch */}
                <div style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: settings.lossless ? 'var(--leaf)' : 'var(--paper-3)',
                  border: `1px solid ${settings.lossless ? 'var(--leaf)' : 'var(--rule)'}`,
                  position: 'relative', transition: 'all 0.2s', marginLeft: 12,
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: settings.lossless ? 22 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s', display: 'block',
                  }} />
                </div>
              </button>
            </div>
          </div>

          {/* Step size — disabled in lossless */}
          <AnimatePresence>
            {!settings.lossless && (
              <motion.div
                key="step-controls"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="sp-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SlidersHorizontal style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>STEP SIZE CONTROL</span>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Quantization type */}
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>
                        Quantization Type
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {(['uniform', 'scalar'] as const).map(q => (
                          <label key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '10px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${settings.quantizationType === q ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`, background: settings.quantizationType === q ? 'rgba(30,42,255,0.04)' : 'white', transition: 'all 0.18s' }}>
                            <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
                              <input
                                type="radio"
                                checked={settings.quantizationType === q}
                                onChange={() => update('quantizationType', q)}
                                style={{ appearance: 'none', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${settings.quantizationType === q ? 'var(--klein)' : 'var(--rule)'}`, cursor: 'pointer', background: 'white', outline: 'none' }}
                              />
                              {settings.quantizationType === q && (
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%', background: 'var(--klein)', display: 'block' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: settings.quantizationType === q ? 'var(--klein)' : 'var(--ink)', fontWeight: settings.quantizationType === q ? 600 : 400, textTransform: 'capitalize' }}>{q}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
                                {q === 'uniform' ? 'Same Δ for all bands' : 'Adaptive per subband'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Step size slider */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Step Size (Δ)</label>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.01em' }}>{settings.stepSize}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{stepLabel}</span>
                        </div>
                      </div>

                      {/* Custom slider */}
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <input
                          type="range" min={1} max={64} value={settings.stepSize}
                          onChange={e => update('stepSize', Number(e.target.value))}
                          style={{
                            width: '100%', height: 4, appearance: 'none', outline: 'none',
                            background: `linear-gradient(90deg, var(--klein) ${(settings.stepSize / 64) * 100}%, var(--paper-3) ${(settings.stepSize / 64) * 100}%)`,
                            borderRadius: 2, cursor: 'pointer',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>
                        <span>1 · MAX QUALITY</span>
                        <span>64 · MAX COMPRESSION</span>
                      </div>
                    </div>

                    {/* Preset buttons */}
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>Quick Presets</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Archival', value: 4 },
                          { label: 'High', value: 8 },
                          { label: 'Balanced', value: 18 },
                          { label: 'Web', value: 28 },
                          { label: 'Thumbnail', value: 48 },
                        ].map(p => (
                          <button
                            key={p.label}
                            onClick={() => update('stepSize', p.value)}
                            style={{
                              padding: '5px 12px', borderRadius: 100,
                              border: `1px solid ${settings.stepSize === p.value ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                              background: settings.stepSize === p.value ? 'rgba(30,42,255,0.06)' : 'white',
                              color: settings.stepSize === p.value ? 'var(--klein)' : 'var(--ink-3)',
                              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {p.label}&nbsp;<span style={{ opacity: 0.6 }}>Δ{p.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => navigate('/transform')} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Transform
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--klein)', color: 'white',
                padding: '13px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500,
                boxShadow: '0 4px 16px -4px rgba(30,42,255,0.4)',
                transition: 'all 0.22s',
              }}
            >
              <Play style={{ width: 13, height: 13 }} />
              Run Compression
            </button>
          </div>
        </div>

        {/* ── RIGHT: Live Quality Preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quality estimate card */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>ESTIMATED OUTPUT</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>Live Preview</span>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'PSNR', value: metrics.psnr, unit: 'dB', icon: TrendingUp, hint: 'Higher = better' },
                  { label: 'CR', value: metrics.cr, unit: '', icon: TrendingDown, hint: 'Compression ratio' },
                  { label: 'Grade', value: metrics.grade, unit: '', hint: 'Quality tier', special: true },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '16px 12px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: m.special ? gradeColor : 'var(--klein)' }} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: m.special ? 18 : 24, color: m.special ? gradeColor : 'var(--ink)', lineHeight: 1 }}>
                      {m.value}
                    </div>
                    {m.unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--klein)' }}> {m.unit}</span>}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.hint}</div>
                  </div>
                ))}
              </div>

              {/* Visual quality scale */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>
                  <span>Quality ←</span>
                  <span>→ Compression</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--leaf), var(--klein), var(--amber), #d4574c)', position: 'relative', marginBottom: 6 }}>
                  {!settings.lossless && (
                    <motion.div
                      animate={{ left: `${Math.min(95, (settings.stepSize / 64) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      style={{
                        position: 'absolute', top: -4, width: 16, height: 16,
                        borderRadius: '50%', background: 'white',
                        border: '2px solid var(--ink)', transform: 'translateX(-50%)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>
                  <span>Δ1</span>
                  <span>Δ16</span>
                  <span>Δ32</span>
                  <span>Δ64</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline summary */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>PIPELINE SUMMARY</span>
            </div>
            <div style={{ padding: 20 }}>
              {[
                { label: 'Transform', value: transform ? (transform.method === 'jpeg2000' ? 'JPEG2000 · DWT' : 'JPEG · DCT') : '—', color: 'var(--klein)' },
                { label: 'Wavelet', value: transform?.method === 'jpeg2000' ? transform.waveletFilter?.toUpperCase() || '—' : 'N/A (DCT)', color: 'var(--ink)' },
                { label: 'Decomp. Level', value: transform?.method === 'jpeg2000' ? `Level ${transform.decompositionLevel}` : 'N/A', color: 'var(--ink)' },
                { label: 'Quantization', value: settings.lossless ? 'Lossless' : settings.quantizationType.charAt(0).toUpperCase() + settings.quantizationType.slice(1), color: settings.lossless ? 'var(--leaf)' : 'var(--ink)' },
                { label: 'Step Size', value: settings.lossless ? '— (lossless)' : `Δ ${settings.stepSize}`, color: settings.lossless ? 'var(--ink-4)' : 'var(--plum)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: row.color, fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              Scalar quantization adapts the step size per subband based on frequency significance, typically yielding better results than uniform quantization at the same compression ratio.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
