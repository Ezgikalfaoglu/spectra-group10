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
 *   • Routes ← /transform  → /entropy
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  SlidersHorizontal, ArrowRight, AlertTriangle, Info,
  Lock,
} from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/app/components/ui/collapsible';
import { PipelineStepper } from '../components/PipelineStepper';
import { TypePresetBanner } from '../components/TypePresetBanner';
import { DCTBlockPanel } from '../components/DCTBlockPanel';
import { DWTSubbandsViz } from '../components/DWTSubbandsViz';
import { computeMetrics } from '../lib/pipeline';
import type { SubbandStat } from '../lib/dwt';

interface QuantizationSettings {
  quantizationType: 'uniform' | 'scalar';
  stepSize: number;
  lossless: boolean;
}

interface StoredTransform {
  method: 'jpeg' | 'jpeg2000';
  waveletFilter: string;
  decompositionLevel: number;
  subbandStats?: SubbandStat[];
}

const DEFAULT_TRANSFORM: StoredTransform = {
  method: 'jpeg2000',
  waveletFilter: 'db4',
  decompositionLevel: 2,
};

function normalizeQuantizationType(
  method: StoredTransform['method'] | undefined,
  value: QuantizationSettings['quantizationType'],
): QuantizationSettings['quantizationType'] {
  // In the JPEG2000 path, we expose only scalar subband quantization controls.
  if (method === 'jpeg2000') return 'scalar';
  return value;
}

export function QuantizationPage() {
  const navigate = useNavigate();
  const [transform, setTransform] = useState<StoredTransform | null>(null);
  const [uploadType, setUploadType] = useState('Natural');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLosslessForced, setIsLosslessForced] = useState(false);
  const [settings, setSettings] = useState<QuantizationSettings>({
    quantizationType: 'scalar',
    stepSize: 18,
    lossless: false,
  });

  useEffect(() => {
    let forcedLossless = false;

    const upload = localStorage.getItem('spectra_upload');
    if (upload) {
      try {
        const u = JSON.parse(upload);
        setUploadType(String(u.imageType || 'Natural'));
        const forced = ['fingerprint', 'biomedical'].includes(String(u.imageType || '').toLowerCase());
        forcedLossless = forced;
        setIsLosslessForced(forced);
      } catch {}
    }

    const saved = localStorage.getItem('spectra_transform');
    if (saved) {
      try {
        setTransform(JSON.parse(saved));
      } catch {
        setTransform(DEFAULT_TRANSFORM);
        localStorage.setItem('spectra_transform', JSON.stringify(DEFAULT_TRANSFORM));
      }
    } else {
      setTransform(DEFAULT_TRANSFORM);
      localStorage.setItem('spectra_transform', JSON.stringify(DEFAULT_TRANSFORM));
    }

    const savedQ = localStorage.getItem('spectra_quantization');
    if (savedQ) {
      try { setSettings(JSON.parse(savedQ)); } catch {}
    }

    if (forcedLossless) {
      setSettings(s => ({ ...s, lossless: true }));
    }

    setIsHydrated(true);
  }, []);

  const update = <K extends keyof QuantizationSettings>(key: K, value: QuantizationSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  useEffect(() => {
    if (transform?.method === 'jpeg2000' && settings.quantizationType !== 'scalar') {
      setSettings(s => ({ ...s, quantizationType: 'scalar' }));
    }
  }, [transform?.method, settings.quantizationType]);

  const handleNext = () => {
    const payload = {
      ...settings,
      stepSize: settings.lossless ? 1 : settings.stepSize,
    };
    localStorage.setItem('spectra_quantization', JSON.stringify(payload));
    navigate('/entropy');
  };

  const effectiveStep = settings.lossless ? 1 : settings.stepSize;
  const isDwtTransform = (transform?.method ?? DEFAULT_TRANSFORM.method) === 'jpeg2000';
  const quantizationEffectTitle = isDwtTransform ? 'DWT SUBBAND QUANTIZATION' : 'DCT BLOCK QUANTIZATION';
  const quantizedSubbandCoefs = useMemo(() => {
    if (!transform?.subbandStats || transform.subbandStats.length === 0) return undefined;
    return transform.subbandStats.map((s) => ({
      chain: s.chain,
      value: Math.round(s.meanSigned / effectiveStep) * effectiveStep,
    }));
  }, [transform?.subbandStats, effectiveStep]);

  // Live preview — same model as Entropy/Processing (coder defaults to the
  // pipeline baseline since the entropy stage hasn't been visited yet).
  const previewMetrics = computeMetrics({
    method: transform?.method ?? 'jpeg2000',
    subbandStats: transform?.subbandStats,
    stepSize: settings.stepSize,
    lossless: settings.lossless,
    imageType: uploadType,
    coder: 'huffman-default',
  });
  const metrics = {
    psnr: settings.lossless ? '∞' : previewMetrics.psnr.toFixed(1),
    cr: previewMetrics.crLabel,
  };
  const psnrValue = settings.lossless ? Infinity : previewMetrics.psnr;
  const psnrColor = psnrValue > 35
    ? 'var(--leaf)'
    : psnrValue >= 28
      ? 'var(--amber)'
      : '#d4574c';

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
  const controlsDisabled = settings.lossless;
  const qualityScaleLeft = settings.lossless
    ? 4
    : Math.min(95, (effectiveStep / 64) * 100);

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
          STEP 04 · QUANTIZATION PARAMETERS
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

      <TypePresetBanner
        stage="quantize"
        onApply={(p) => setSettings(s => ({
          ...s,
          quantizationType: normalizeQuantizationType(transform?.method, p.quantizationType),
          stepSize: p.stepSize,
          lossless: p.forceLossless || s.lossless,
        }))}
      />

      {/* Guard */}
      {isHydrated && !transform && (
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
              <div style={{ width: 28, height: 28, borderRadius: 8, background: settings.lossless ? 'rgba(224,168,80,0.12)' : 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock style={{ width: 14, height: 14, color: settings.lossless ? 'var(--amber)' : 'var(--klein)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>COMPRESSION MODE</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', borderRadius: 'var(--r-md)',
                  border: `1px solid ${settings.lossless ? 'rgba(224,168,80,0.35)' : 'var(--rule)'}`,
                  background: settings.lossless ? 'rgba(224,168,80,0.06)' : 'white',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: settings.lossless ? 'var(--amber)' : 'var(--ink)', letterSpacing: '0.05em', marginBottom: 3 }}>
                    Lossless Mode
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                    When enabled, quantization is bypassed and output quality is theoretically unlimited.
                  </p>
                  {isLosslessForced && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--amber)', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>
                      Forced by image type
                    </span>
                  )}
                </div>
                <Switch
                  checked={settings.lossless}
                  onCheckedChange={(checked) => update('lossless', checked)}
                  disabled={isLosslessForced}
                  className="data-[state=checked]:bg-[var(--amber)] data-[state=unchecked]:bg-[var(--paper-3)]"
                />
              </div>
              {settings.lossless && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(224,168,80,0.1)', border: '1px solid rgba(224,168,80,0.3)' }}>
                  <Lock style={{ width: 13, height: 13, color: 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase' }}>
                    Lossless mode active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Step size — disabled in lossless */}
          <div className="sp-card" style={{ overflow: 'hidden', opacity: controlsDisabled ? 0.3 : 1, transition: 'opacity 0.2s' }}>
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
                      {isDwtTransform ? (
                        <div style={{ padding: '12px 14px', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', background: 'var(--paper-2)' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', letterSpacing: '0.06em' }}>
                            Scalar (subband)
                          </div>
                          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.04em', lineHeight: 1.5 }}>
                            JPEG2000 uses wavelet-subband quantization; block-only choices are hidden in this mode.
                          </div>
                        </div>
                      ) : (
                        <div className="sp-seg">
                          {(['uniform', 'scalar'] as const).map(q => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => update('quantizationType', q)}
                              className={`sp-seg-btn ${settings.quantizationType === q ? 'sp-seg-btn-active' : ''}`}
                              disabled={controlsDisabled}
                              style={{ cursor: controlsDisabled ? 'not-allowed' : 'pointer' }}
                            >
                              {q === 'uniform' ? 'Uniform' : 'Scalar'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step size slider */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Step Size (Δ)</label>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--klein)', lineHeight: 1, letterSpacing: '0.03em' }}>{settings.stepSize}</span>
                      </div>

                      {/* Custom slider */}
                      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--paper-3)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${((settings.stepSize - 1) / 63) * 100}%`, background: 'var(--klein)', borderRadius: 2 }} />
                        </div>
                        <input
                          type="range" min={1} max={64} value={settings.stepSize}
                          onChange={e => update('stepSize', Number(e.target.value))}
                          disabled={controlsDisabled}
                          style={{
                            position: 'absolute', left: 0, right: 0, width: '100%',
                            height: 4, opacity: 0, cursor: controlsDisabled ? 'not-allowed' : 'pointer', zIndex: 2,
                          }}
                        />
                        <div
                          className="sp-slider-thumb"
                          style={{
                            position: 'absolute',
                            left: `${((settings.stepSize - 1) / 63) * 100}%`,
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em', marginBottom: 6 }}>
                        <span>1 · MAX QUALITY</span>
                        <span>64 · MAX COMPRESSION</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {stepLabel}
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
                            type="button"
                            onClick={() => update('stepSize', p.value)}
                            disabled={controlsDisabled}
                            style={{
                              padding: '5px 12px', borderRadius: 100,
                              border: `1px solid ${settings.stepSize === p.value ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                              background: settings.stepSize === p.value ? 'rgba(30,42,255,0.06)' : 'white',
                              color: settings.stepSize === p.value ? 'var(--klein)' : 'var(--ink-3)',
                              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                              cursor: controlsDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {p.label}&nbsp;<span style={{ opacity: 0.6 }}>Δ{p.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => navigate('/transform')} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Transform
            </button>
            <button
              onClick={handleNext}
              className="sp-btn sp-btn-klein"
              style={{ flex: 2, justifyContent: 'center' }}
            >
              Next: Entropy
              <ArrowRight style={{ width: 14, height: 14 }} />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div style={{ textAlign: 'center', padding: '16px 12px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: psnrColor }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>PSNR</div>
                  {settings.lossless ? (
                    <motion.div
                      animate={{ opacity: [0.72, 1, 0.72], scale: [0.98, 1.02, 0.98] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--leaf)', lineHeight: 1 }}
                    >
                      ∞
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 6, fontStyle: 'normal' }}>dB</span>
                    </motion.div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 30, color: psnrColor, lineHeight: 1 }}>
                      {metrics.psnr}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 6 }}>dB</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', padding: '16px 12px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: settings.lossless ? 'var(--leaf)' : 'var(--klein)' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>CR</div>
                  {settings.lossless ? (
                    <motion.div
                      animate={{ opacity: [0.72, 1, 0.72], scale: [0.98, 1.02, 0.98] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--leaf)', lineHeight: 1 }}
                    >
                      {metrics.cr}
                    </motion.div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>
                      {metrics.cr}
                    </div>
                  )}
                </div>
              </div>

              {/* Visual quality scale */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>
                  <span style={{ color: settings.lossless ? 'var(--leaf)' : 'var(--ink-4)', fontWeight: settings.lossless ? 600 : 400 }}>
                    {settings.lossless ? 'LOSSLESS' : 'Quality ←'}
                  </span>
                  <span>→ Compression</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--leaf), var(--klein), var(--amber), #d4574c)', position: 'relative', marginBottom: 6 }}>
                  <div style={{
                    position: 'absolute',
                    left: `${qualityScaleLeft}%`,
                    top: -24,
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    color: settings.lossless ? 'var(--leaf)' : 'var(--ink-3)',
                  }}>
                    {settings.lossless ? 'Δ1' : `Δ${effectiveStep}`}
                  </div>
                  <motion.div
                    animate={{
                      left: `${qualityScaleLeft}%`,
                      scale: settings.lossless ? [1, 1.08, 1] : 1,
                    }}
                    transition={{
                      left: { type: 'spring', stiffness: 200, damping: 25 },
                      scale: settings.lossless
                        ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.2 },
                    }}
                    style={{
                      position: 'absolute', top: -4, width: 16, height: 16,
                      borderRadius: '50%',
                      background: settings.lossless ? 'var(--leaf)' : 'white',
                      border: `2px solid ${settings.lossless ? 'var(--leaf)' : 'var(--ink)'}`,
                      transform: 'translateX(-50%)',
                      boxShadow: settings.lossless
                        ? '0 0 0 4px rgba(45,142,94,0.18), 0 2px 6px rgba(0,0,0,0.16)'
                        : '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  />
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

          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                {quantizationEffectTitle}
              </span>
            </div>
            {isDwtTransform ? (
              <div style={{ padding: 18 }}>
                <DWTSubbandsViz
                  level={transform?.decompositionLevel ?? 2}
                  active
                  coefficients={quantizedSubbandCoefs}
                />
              </div>
            ) : (
              <DCTBlockPanel delta={effectiveStep} />
            )}
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

          {/* Collapsible explanation */}
          <Collapsible className="sp-card" style={{ overflow: 'hidden' }}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '14px 18px',
                  background: 'rgba(30,42,255,0.04)',
                  border: 'none',
                  borderBottom: '1px solid rgba(30,42,255,0.12)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--klein)', textTransform: 'uppercase' }}>
                  <Info style={{ width: 13, height: 13, color: 'var(--klein)' }} />
                  What Do These Settings Mean?
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Open / Close
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ padding: '12px 18px 16px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
                  As step size increases, coefficients are quantized more coarsely and the file compresses better.
                  This raises Compression Ratio (CR), but usually lowers PSNR and introduces more quality loss.
                  Lower step sizes preserve quality better, but reduce compression gain.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

    </motion.div>
  );
}
