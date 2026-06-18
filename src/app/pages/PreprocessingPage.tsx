/**
 * PREPROCESSING PAGE — Pipeline Stage 02
 * Real color-space conversion + level-shift on the uploaded pixels.
 *   • Reads localStorage["spectra_upload"]
 *   • Decomposes the actual image into real channel planes (Y/Cb/Cr · R/G/B · Luma)
 *   • Computes per-channel energy (variance) to show decorrelation compaction
 *   • Stores the processed primary plane + settings in localStorage["spectra_preprocessing"]
 *   • Routes ← /upload  → /transform
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import {
  loadImageData, decompose, planeToDataUrl,
  type ColorSpace, type ChannelPlane,
} from '../lib/preprocess';

interface PreprocSettings {
  colorSpace: ColorSpace;
  levelShift: boolean;
}

interface UploadData {
  name: string;
  dataUrl: string;
  imageType: string;
}

const DEFAULTS: PreprocSettings = {
  colorSpace: 'ycbcr',
  levelShift: true,
};

const COLOR_SPACES: { id: ColorSpace; label: string; desc: string }[] = [
  { id: 'ycbcr', label: 'YCbCr',     desc: 'Luma + chroma decorrelation. Standard JPEG / JPEG2000 baseline. Best energy compaction for natural images.' },
  { id: 'rgb',   label: 'RGB',       desc: 'No conversion — process channels directly. Higher fidelity at the cost of compression efficiency.' },
  { id: 'luma',  label: 'Luma only', desc: 'Discard chroma channels and process the grayscale plane. Compact but loses all color information.' },
];

// Draws one grayscale plane to a canvas at the plane's native size, scaled by CSS.
function PlaneCanvas({ plane, width, height }: { plane: ChannelPlane; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const out = ctx.createImageData(width, height);
    for (let i = 0; i < plane.gray.length; i++) {
      const v = plane.gray[i];
      const b = i * 4;
      out.data[b] = out.data[b + 1] = out.data[b + 2] = v;
      out.data[b + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [plane, width, height]);

  return (
    <div style={{
      borderRadius: 'var(--r-md)', overflow: 'hidden',
      border: '1px solid var(--rule)', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>
      <canvas
        ref={ref}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', imageRendering: 'auto' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '6px 8px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.65), transparent)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.6)',
      }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1 }}>{plane.label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>{plane.hint}</span>
      </div>
    </div>
  );
}

export function PreprocessingPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PreprocSettings>(DEFAULTS);
  const [upload, setUpload] = useState<UploadData | null>(null);
  const [imgData, setImgData] = useState<ImageData | null>(null);
  const [planes, setPlanes] = useState<ChannelPlane[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Restore saved settings + upload.
  useEffect(() => {
    const saved = localStorage.getItem('spectra_preprocessing');
    if (saved) {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); } catch {}
    }
    const u = localStorage.getItem('spectra_upload');
    if (u) {
      try { setUpload(JSON.parse(u)); } catch {}
    }
  }, []);

  // Decode the uploaded image once.
  useEffect(() => {
    if (!upload?.dataUrl) { setImgData(null); return; }
    let cancelled = false;
    loadImageData(upload.dataUrl, 320)
      .then(d => { if (!cancelled) { setImgData(d); setLoadError(null); } })
      .catch(() => { if (!cancelled) { setImgData(null); setLoadError('Could not decode the uploaded image.'); } });
    return () => { cancelled = true; };
  }, [upload?.dataUrl]);

  // Recompute real channel planes whenever the image or color space changes.
  useEffect(() => {
    if (!imgData) { setPlanes(null); return; }
    setPlanes(decompose(imgData, settings.colorSpace));
  }, [imgData, settings.colorSpace]);

  const update = <K extends keyof PreprocSettings>(k: K, v: PreprocSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleNext = () => {
    // Produce the real processed primary plane (the one the transform compresses).
    let payload: Record<string, unknown> = { ...settings };
    if (imgData && planes && planes.length) {
      // Primary plane = first plane (Y / R / L) — carries the dominant energy.
      const primary = planes[0];
      const planeDataUrl = planeToDataUrl(primary, imgData.width, imgData.height);
      payload = {
        ...settings,
        width: imgData.width,
        height: imgData.height,
        primaryPlane: primary.label,
        planeDataUrl,
        channelEnergy: planes.map(p => ({ label: p.label, energyPct: +p.energyPct.toFixed(1), variance: +p.variance.toFixed(1) })),
      };
    }
    try {
      localStorage.setItem('spectra_preprocessing', JSON.stringify(payload));
    } catch {
      // Quota — drop the heavy plane dataURL, keep settings + stats.
      const { planeDataUrl: _drop, ...light } = payload as any;
      try { localStorage.setItem('spectra_preprocessing', JSON.stringify(light)); } catch {}
    }
    navigate('/transform');
  };

  const active = COLOR_SPACES.find(c => c.id === settings.colorSpace) ?? COLOR_SPACES[0];

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
          STEP 02 · PREPROCESSING
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          Condition the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>signal</em>.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Convert color space and level-shift the specimen before the frequency transform
        </p>
      </div>

      {/* No-upload warning */}
      {!upload && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(212,87,76,0.06)', border: '1px solid rgba(212,87,76,0.2)', borderRadius: 'var(--r-md)', marginBottom: 24 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: '#d4574c', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            No specimen loaded — upload an image first to see real channel decomposition.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Color space */}
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shuffle style={{ width: 14, height: 14, color: 'var(--klein)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>COLOR SPACE</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COLOR_SPACES.map(cs => {
                const isSelected = settings.colorSpace === cs.id;
                return (
                  <motion.button
                    key={cs.id}
                    onClick={() => update('colorSpace', cs.id)}
                    whileHover={{ x: 2 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${isSelected ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                      background: isSelected ? 'rgba(30,42,255,0.04)' : 'white',
                      cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11.5,
                        color: isSelected ? 'var(--klein)' : 'var(--ink)',
                        fontWeight: isSelected ? 600 : 400, letterSpacing: '0.05em', marginBottom: 3,
                      }}>{cs.label}</div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.04em', lineHeight: 1.5, maxWidth: 360 }}>
                        {cs.desc}
                      </p>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
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

          {/* Level-shift toggle */}
          <div className="sp-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', letterSpacing: '0.05em', marginBottom: 3 }}>
                Level-shift (DC centering)
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', lineHeight: 1.5, maxWidth: 340 }}>
                Maps samples [0,255] → [−128,127] before the transform — the JPEG-standard pre-step.
              </p>
            </div>
            <button
              onClick={() => update('levelShift', !settings.levelShift)}
              style={{
                width: 44, height: 24, borderRadius: 100, border: 'none', flexShrink: 0,
                background: settings.levelShift ? 'var(--klein)' : 'var(--rule)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
              aria-pressed={settings.levelShift}
            >
              <span style={{
                position: 'absolute', top: 2, left: settings.levelShift ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => navigate('/upload')} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Upload
            </button>
            <button onClick={handleNext} className="sp-btn sp-btn-klein" style={{ flex: 2, justifyContent: 'center', gap: 8 }}>
              Next: Transform
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* RIGHT: Real channel decomposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>CHANNEL DECOMPOSITION</span>
              {planes && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--leaf)', textTransform: 'uppercase' }}>
                  ● live · real pixels
                </span>
              )}
            </div>
            <div style={{ padding: 24 }}>
              {loadError && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d4574c' }}>{loadError}</p>
              )}
              {!imgData && !loadError && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                  Waiting for a decoded specimen…
                </p>
              )}
              <AnimatePresence mode="wait">
                {imgData && planes && (
                  <motion.div
                    key={settings.colorSpace}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: planes.length === 1 ? '1fr' : 'repeat(3, 1fr)',
                      gap: 10, marginBottom: 18,
                    }}>
                      {planes.map(p => (
                        <PlaneCanvas key={p.label} plane={p} width={imgData.width} height={imgData.height} />
                      ))}
                    </div>

                    {/* Real per-channel energy bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
                        Energy share (variance)
                      </div>
                      {planes.map(p => (
                        <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)', width: 24 }}>{p.label}</span>
                          <div style={{ flex: 1, height: 6, background: 'var(--rule-soft)', borderRadius: 100, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${p.energyPct}%` }}
                              transition={{ duration: 0.4 }}
                              style={{ height: '100%', background: 'var(--klein)' }}
                            />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', width: 44, textAlign: 'right' }}>
                            {p.energyPct.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Real level-shift effect on the primary plane's DC mean */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--r-sm)',
                      background: settings.levelShift ? 'rgba(30,42,255,0.05)' : 'var(--paper-2)',
                      border: `1px solid ${settings.levelShift ? 'rgba(30,42,255,0.18)' : 'var(--rule)'}`,
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                        {planes[0].label} DC mean
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}>
                        {planes[0].mean.toFixed(1)}
                        {settings.levelShift && (
                          <>
                            <span style={{ color: 'var(--ink-4)', margin: '0 6px' }}>→</span>
                            <span style={{ color: 'var(--klein)' }}>{(planes[0].mean - 128).toFixed(1)}</span>
                            <span style={{ color: 'var(--ink-4)', fontSize: 9, marginLeft: 6 }}>centered</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
                      {active.desc}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              Decorrelating the channels concentrates most of the image's energy into a single luma plane,
              which the wavelet / DCT transform can compress more efficiently in the later pipeline stages.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
