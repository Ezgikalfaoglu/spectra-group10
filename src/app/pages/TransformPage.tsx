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
  Braces, ArrowRight, Info, AlertTriangle, Layers, Zap,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import { DWTSubbandsViz } from '../components/DWTSubbandsViz';
import { DCTBlockPanel } from '../components/DCTBlockPanel';
import { TypePresetBanner } from '../components/TypePresetBanner';
import { waveletPacket2D, imageDataToGray, type SubbandStat, type Filter } from '../lib/dwt';

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

const DEMO_UPLOAD: UploadData = {
  name: 'demo_image.png',
  format: 'PNG',
  resolution: '512 × 512',
  sizeKB: 128,
  dataUrl: '',
  imageType: 'natural',
};

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
  const [isDemo, setIsDemo] = useState(false);
  const [settings, setSettings] = useState<TransformSettings>({
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 2,
  });
  const [subbandStats, setSubbandStats] = useState<SubbandStat[] | null>(null);

  useEffect(() => {
    const upload = localStorage.getItem('spectra_upload');
    if (upload) {
      try { setUploadData(JSON.parse(upload)); } catch {}
    } else {
      setUploadData(DEMO_UPLOAD);
      setIsDemo(true);
    }
    const saved = localStorage.getItem('spectra_transform');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Strip persisted subbandStats — they'll be recomputed for the current image+settings.
        const { subbandStats: _drop, ...rest } = parsed;
        setSettings(rest);
      } catch {}
    }
  }, []);

  // Wavelet-packet analysis of the uploaded image. For JPEG2000 this is the
  // actual transform (user's wavelet + level); for JPEG it still runs as an
  // image-characterisation pass (fixed db4 / L2) so the DCT result reflects
  // real image content instead of a step-size-only formula.
  useEffect(() => {
    if (!uploadData?.dataUrl) {
      setSubbandStats(null);
      return;
    }
    const isJ2K = settings.method === 'jpeg2000';
    const analysisFilter: Filter = isJ2K ? (settings.waveletFilter as Filter) : 'db4';
    const analysisLevel = isJ2K ? settings.decompositionLevel : 2;
    let cancelled = false;
    (async () => {
      try {
        const img = new Image();
        img.src = uploadData.dataUrl;
        await img.decode();
        const minDim = Math.min(img.width, img.height);
        const minNeeded = 1 << analysisLevel;
        if (minDim < minNeeded) {
          if (!cancelled) setSubbandStats(null);
          return;
        }
        const log2Side = Math.floor(Math.log2(minDim));
        const targetSide = Math.min(512, 1 << log2Side);
        if (targetSide < minNeeded) {
          if (!cancelled) setSubbandStats(null);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = targetSide;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (!cancelled) setSubbandStats(null);
          return;
        }
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSide, targetSide);
        const imgData = ctx.getImageData(0, 0, targetSide, targetSide);
        const { data: gray, side } = imageDataToGray(imgData, targetSide);
        const result = waveletPacket2D(gray, side, analysisFilter, analysisLevel);
        if (!cancelled) setSubbandStats(result.subbands);
      } catch {
        if (!cancelled) setSubbandStats(null);
      }
    })();
    return () => { cancelled = true; };
  }, [uploadData?.dataUrl, settings.method, settings.waveletFilter, settings.decompositionLevel]);

  const update = <K extends keyof TransformSettings>(key: K, value: TransformSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  const handleNext = () => {
    const payload = subbandStats ? { ...settings, subbandStats } : settings;
    try {
      localStorage.setItem('spectra_transform', JSON.stringify(payload));
    } catch {
      // quota — drop subbandStats and retry
      localStorage.setItem('spectra_transform', JSON.stringify(settings));
    }
    navigate('/quantization');
  };

  const handleBack = () => navigate('/preprocessing');

  const wavelet = WAVELET_INFO[settings.waveletFilter] ?? WAVELET_INFO['db4'];

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
          STEP 03 · TRANSFORM METHOD
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

      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px',
            background: 'rgba(0,212,255,0.06)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: 'var(--r-md)', marginBottom: 20,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100,
            background: 'var(--cyan)', color: 'var(--paper)', fontWeight: 600,
          }}>Demo Mode</span>
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
            No uploaded image found — continuing with default values.{' '}
            <Link to="/upload" style={{ color: 'var(--klein)', textDecoration: 'underline' }}>
              Upload an image
            </Link>
          </p>
        </motion.div>
      )}

      {/* No upload warning (non-demo, edge case) */}
      {!uploadData && !isDemo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
            background: 'rgba(212,87,76,0.06)', border: '1px solid rgba(212,87,76,0.2)',
            borderRadius: 'var(--r-md)', marginBottom: 24,
          }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: '#d4574c', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            No specimen loaded.{' '}
            <Link to="/upload" style={{ color: 'var(--klein)', textDecoration: 'underline' }}>Return to Upload</Link> first.
          </p>
        </motion.div>
      )}

      <TypePresetBanner
        stage="transform"
        onApply={(p) => setSettings(s => ({
          ...s,
          method: p.method,
          waveletFilter: p.waveletFilter,
          decompositionLevel: p.decompositionLevel,
        }))}
      />

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
                    {m === 'jpeg' ? 'JPEG · DCT' : 'J2K · DWT'}
                  </button>
                ))}
              </div>

              {/* Method description */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={settings.method}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{
                    padding: '14px 16px',
                    background: settings.method === 'jpeg2000' ? 'rgba(30,42,255,0.04)' : 'rgba(75,30,122,0.04)',
                    border: `1px solid ${settings.method === 'jpeg2000' ? 'rgba(30,42,255,0.15)' : 'rgba(75,30,122,0.15)'}`,
                    borderRadius: 'var(--r-sm)',
                  }}
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
                    {/* Wavelet Filter — sp-pill butonlar */}
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>
                        Wavelet Filter
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['haar', 'db2', 'db4'] as const).map(w => (
                          <button
                            key={w}
                            onClick={() => update('waveletFilter', w)}
                            className={`sp-pill ${settings.waveletFilter === w ? 'sp-pill-active' : ''}`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                      {/* Selected wavelet description */}
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={settings.waveletFilter}
                          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.03em', lineHeight: 1.5 }}
                        >
                          {wavelet.description}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Decomposition Level — sp-pill butonlar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                          Decomposition Level
                        </label>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--klein)', lineHeight: 1, padding: '2px 10px', background: 'rgba(30,42,255,0.06)', borderRadius: 100 }}>
                          {settings.decompositionLevel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => update('decompositionLevel', n)}
                            className={`sp-pill ${settings.decompositionLevel === n ? 'sp-pill-active' : ''}`}
                          >
                            {n}
                          </button>
                        ))}
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

          {/* ── Selection summary card ── */}
          <div className="sp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 12 }}>
              Selection Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Method', value: settings.method === 'jpeg' ? 'JPEG (DCT)' : 'JPEG 2000 (DWT)' },
                ...(settings.method === 'jpeg2000' ? [
                  { label: 'Wavelet filter', value: WAVELET_INFO[settings.waveletFilter]?.full ?? settings.waveletFilter },
                  { label: 'Decomposition level', value: `Level ${settings.decompositionLevel}` },
                  { label: 'Subband count', value: `${Math.pow(4, settings.decompositionLevel)} bands (packet)` },
                ] : [
                  { label: 'Block size', value: '8 × 8 px' },
                  { label: 'Basis functions', value: '64 cosine' },
                ]),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 7, borderBottom: '1px solid var(--rule-soft)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    {row.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink)', fontWeight: 500 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={handleBack} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Preprocess
            </button>
            <button onClick={handleNext} className="sp-btn sp-btn-klein" style={{ flex: 2, justifyContent: 'center', gap: 8 }}>
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
              {uploadData.dataUrl
                ? <img src={uploadData.dataUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--rule)', flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--paper-3)', border: '1px solid var(--rule)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Demo</span>
                  </div>
              }
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Active Specimen</div>
                  {isDemo && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: 'var(--cyan)', color: 'var(--paper)', fontWeight: 600 }}>
                      Demo
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                  {uploadData.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', marginTop: 2 }}>
                  {uploadData.resolution} · {uploadData.sizeKB} KB
                </div>
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${settings.decompositionLevel}-${settings.waveletFilter}`}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <DWTSubbandsViz
                        level={settings.decompositionLevel}
                        active={true}
                        coefficients={subbandStats?.map(s => ({ chain: s.chain, value: s.meanSigned }))}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dct-explain"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="sp-card" style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>DCT · 8 × 8 BLOCK</span>
                </div>
                <DCTBlockPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Performance hint */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              {settings.method === 'jpeg2000'
                ? `At Level ${settings.decompositionLevel}, the 4-filter bank (LL · HL · LH · HH) is applied recursively to every subband, yielding ${Math.pow(4, settings.decompositionLevel)} bands (wavelet-packet decomposition). ${settings.decompositionLevel >= 3 ? 'High levels give finer frequency resolution at the cost of processing time.' : 'Level 2 (16 bands) balances frequency selectivity and runtime for most natural images.'}`
                : 'JPEG DCT is the fastest option. Ideal for web delivery where file size is critical. For archival or medical use, prefer JPEG2000.'
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
