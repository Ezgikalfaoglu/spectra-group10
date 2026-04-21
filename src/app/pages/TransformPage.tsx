/**
 * TRANSFORM PAGE — Team: Transform / Compression Controls
 * ─────────────────────────────────────────────────────────
 * Responsibilities:
 *   • Transform method selection (JPEG/DCT vs JPEG2000/DWT)
 *   • Wavelet filter selection (Haar, db2, db4) — J2K only
 *   • Decomposition level control (1–5) — J2K only
 *   • Shows live preview of how DWT subbands are structured
 *   • Reads localStorage["spectra_upload"]
 *   • Stores result in localStorage["spectra_transform"]
 *   • Routes ← /upload  → /quantization
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Braces, ChevronUp, ChevronDown, ArrowRight, Info,
  AlertTriangle, Layers, Zap,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import { DWTSubbandsViz } from '../components/DWTSubbandsViz';

interface TransformSettings {
  method: 'jpeg' | 'jpeg2000';
  waveletFilter: string;
  decompositionLevel: number;
}

interface UploadData {
  name: string;
  format: string;
  resolution: string;
  sizeKB: number;
  dataUrl: string;
  imageType: string;
}

const WAVELET_INFO: Record<string, { full: string; description: string; quality: string }> = {
  haar: {
    full: 'Haar Wavelet',
    description: 'Simplest orthogonal wavelet. Fast but produces blocking at low bit-rates.',
    quality: 'Basic',
  },
  db2: {
    full: 'Daubechies-2',
    description: 'Smoother than Haar. Good trade-off between complexity and reconstruction quality.',
    quality: 'Moderate',
  },
  db4: {
    full: 'Daubechies-4',
    description: 'Best spatial-frequency localisation. Preferred for natural images and photographic content.',
    quality: 'High',
  },
};

export function TransformPage() {
  const navigate = useNavigate();
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [settings, setSettings] = useState<TransformSettings>({
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 3,
  });

  /* ── Load previous data ── */
  useEffect(() => {
    const upload = localStorage.getItem('spectra_upload');
    if (upload) {
      try { setUploadData(JSON.parse(upload)); } catch {}
    }
    const saved = localStorage.getItem('spectra_transform');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  const update = <K extends keyof TransformSettings>(key: K, value: TransformSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  const handleNext = () => {
    localStorage.setItem('spectra_transform', JSON.stringify(settings));
    navigate('/quantization');
  };

  const handleBack = () => navigate('/upload');

  const wavelet = WAVELET_INFO[settings.waveletFilter] || WAVELET_INFO['db4'];

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
          STEP 02 · TRANSFORM METHOD
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          Choose the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>transform</em>.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          DCT works on 8×8 blocks — DWT analyses the full image hierarchically
        </p>
      </div>

      {/* Guard: no upload */}
      {!uploadData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(212,87,76,0.06)', border: '1px solid rgba(212,87,76,0.2)', borderRadius: 'var(--r-md)', marginBottom: 24 }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: '#d4574c', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            No specimen loaded. <Link to="/upload" style={{ color: 'var(--klein)', textDecoration: 'underline' }}>Return to Upload</Link> first.
          </p>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Transform Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Method selector */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Braces style={{ width: 14, height: 14, color: 'var(--klein)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>TRANSFORM METHOD</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Segmented control */}
              <div className="sp-seg">
                {(['jpeg', 'jpeg2000'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => update('method', m)}
                    className={`sp-seg-btn ${settings.method === m ? 'sp-seg-btn-active' : ''}`}
                  >
                    {m === 'jpeg' ? 'JPEG · DCT' : 'JPEG2000 · DWT'}
                  </button>
                ))}
              </div>

              {/* Method description */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={settings.method}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{ padding: '14px 16px', background: settings.method === 'jpeg2000' ? 'rgba(30,42,255,0.04)' : 'rgba(75,30,122,0.04)', border: `1px solid ${settings.method === 'jpeg2000' ? 'rgba(30,42,255,0.15)' : 'rgba(75,30,122,0.15)'}`, borderRadius: 'var(--r-sm)' }}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    {settings.method === 'jpeg2000'
                      ? <Layers style={{ width: 14, height: 14, color: 'var(--klein)', marginTop: 2, flexShrink: 0 }} />
                      : <Zap style={{ width: 14, height: 14, color: 'var(--plum)', marginTop: 2, flexShrink: 0 }} />
                    }
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, color: settings.method === 'jpeg2000' ? 'var(--klein)' : 'var(--plum)', letterSpacing: '0.08em', marginBottom: 5, textTransform: 'uppercase' }}>
                        {settings.method === 'jpeg2000' ? 'JPEG 2000 — Discrete Wavelet Transform' : 'JPEG — Discrete Cosine Transform'}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                        {settings.method === 'jpeg2000'
                          ? 'Decomposes the image into multi-resolution wavelet subbands. Supports progressive decoding, lossless compression, and superior artifact control at high compression ratios.'
                          : 'Divides the image into 8×8 blocks and applies the DCT to each. Fast and widely supported, but produces block artifacts (mosquito noise) at high compression ratios.'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Wavelet settings — J2K only */}
          <AnimatePresence>
            {settings.method === 'jpeg2000' && (
              <motion.div
                key="j2k-settings"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="sp-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>WAVELET PARAMETERS</span>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Wavelet Filter */}
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>Wavelet Filter</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(['haar', 'db2', 'db4'] as const).map(w => {
                          const info = WAVELET_INFO[w];
                          const isActive = settings.waveletFilter === w;
                          return (
                            <button
                              key={w}
                              onClick={() => update('waveletFilter', w)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', borderRadius: 'var(--r-sm)',
                                border: `1px solid ${isActive ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                                background: isActive ? 'rgba(30,42,255,0.04)' : 'white',
                                cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
                              }}
                            >
                              <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isActive ? 'var(--klein)' : 'var(--ink)', fontWeight: isActive ? 600 : 400, letterSpacing: '0.05em', marginBottom: 3 }}>
                                  {info.full}
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.03em' }}>
                                  {info.description}
                                </div>
                              </div>
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                                textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100,
                                border: `1px solid ${isActive ? 'rgba(30,42,255,0.3)' : 'var(--rule)'}`,
                                color: isActive ? 'var(--klein)' : 'var(--ink-4)',
                                background: isActive ? 'rgba(30,42,255,0.06)' : 'transparent',
                                flexShrink: 0, marginLeft: 10,
                              }}>
                                {info.quality}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Decomposition Level */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Decomposition Level</label>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--klein)', lineHeight: 1, padding: '2px 10px', background: 'rgba(30,42,255,0.06)', borderRadius: 100 }}>
                          {settings.decompositionLevel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => update('decompositionLevel', Math.max(1, settings.decompositionLevel - 1))}
                          style={{ width: 36, height: 36, borderRadius: 8, background: 'white', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)', transition: 'all 0.15s' }}
                        ><ChevronDown style={{ width: 14, height: 14 }} /></button>

                        <div style={{ flex: 1, display: 'flex', gap: 4, padding: 3, background: 'var(--paper-3)', borderRadius: 8, border: '1px solid var(--rule)' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => update('decompositionLevel', n)}
                              style={{
                                flex: 1, height: 30, borderRadius: 6,
                                border: settings.decompositionLevel === n ? '1px solid rgba(30,42,255,0.3)' : 'none',
                                background: settings.decompositionLevel === n ? 'white' : 'transparent',
                                color: settings.decompositionLevel === n ? 'var(--klein)' : 'var(--ink-3)',
                                fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                                fontWeight: settings.decompositionLevel === n ? 600 : 400,
                              }}
                            >{n}</button>
                          ))}
                        </div>

                        <button
                          onClick={() => update('decompositionLevel', Math.min(5, settings.decompositionLevel + 1))}
                          style={{ width: 36, height: 36, borderRadius: 8, background: 'white', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)', transition: 'all 0.15s' }}
                        ><ChevronUp style={{ width: 14, height: 14 }} /></button>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.04em' }}>
                        Higher levels → more subbands → better energy compaction. Recommended: 3–4 for natural images.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={handleBack} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Upload
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
              Next: Quantize
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: DWT Subbands Visualisation ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Specimen context */}
          {uploadData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)' }}>
              <img src={uploadData.dataUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--rule)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 3 }}>Active Specimen</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{uploadData.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', marginTop: 2 }}>{uploadData.resolution} · {uploadData.sizeKB} KB</div>
              </div>
            </div>
          )}

          {/* DWT Viz — only for J2K */}
          <AnimatePresence mode="wait">
            {settings.method === 'jpeg2000' ? (
              <motion.div
                key="dwt-viz"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="sp-card" style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>DWT SUBBAND STRUCTURE</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--klein)', letterSpacing: '0.1em' }}>
                    {settings.waveletFilter.toUpperCase()} · L{settings.decompositionLevel}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <DWTSubbandsViz
                    level={settings.decompositionLevel}
                    active={true}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dct-explain"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="sp-card" style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>DCT BLOCK STRUCTURE</span>
                </div>
                <div style={{ padding: 24 }}>
                  {/* 8x8 block grid illustration */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, maxWidth: 240, margin: '0 auto 16px' }}>
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: i === 0 ? 'var(--klein)' : `rgba(30,42,255,${0.06 + (i % 7) * 0.015})`, border: '1px solid var(--rule-soft)' }} />
                      ))}
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>8×8 Pixel Blocks → DCT Coefficients</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Block Size', value: '8 × 8 px' },
                      { label: 'Transform', value: 'Discrete Cosine Transform' },
                      { label: 'Basis Functions', value: '64 cosine functions' },
                      { label: 'DC Component', value: 'Average block value' },
                      { label: 'AC Components', value: 'High-frequency details' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--rule-soft)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{row.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plum)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Performance hint */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              {settings.method === 'jpeg2000'
                ? `At Level ${settings.decompositionLevel}, the image decomposes into ${3 * settings.decompositionLevel + 1} subbands. ${settings.decompositionLevel >= 4 ? 'High levels give excellent compression but require more processing time.' : 'This is an optimal level for most natural images.'}`
                : 'JPEG DCT is the fastest option. Ideal for web delivery where file size is critical. For archival or medical use, prefer JPEG2000.'
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
