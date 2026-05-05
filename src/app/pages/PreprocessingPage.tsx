/**
 * PREPROCESSING PAGE — Pipeline Stage 02
 * Color-space conversion and level shifting before transform.
 *
 * Iter-2 additions:
 *   • Trained-preset banner (TypePresetBanner)
 *   • autoTuned lock — colorSpace pinned to profile recommendation
 *   • Mock luma histogram below channel decomposition
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shuffle,
  ArrowRight,
  Info,
  Lock,
  Unlock,
  BarChart3,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import { TypePresetBanner } from '../components/TypePresetBanner';
import { getProfile, type TypeProfile } from '../lib/imageTypeProfiles';

type ColorSpace = 'ycbcr' | 'rgb' | 'luma';

interface PreprocSettings {
  colorSpace: ColorSpace;
  autoTuned: boolean;
}

const DEFAULTS: PreprocSettings = {
  colorSpace: 'ycbcr',
  autoTuned: true,
};

const COLOR_SPACES: { id: ColorSpace; label: string; desc: string }[] = [
  { id: 'ycbcr', label: 'YCbCr',     desc: 'Luma + chroma decorrelation. Standard JPEG / JPEG2000 baseline. Best energy compaction for natural images.' },
  { id: 'rgb',   label: 'RGB',       desc: 'No conversion — process channels directly. Higher fidelity at the cost of compression efficiency.' },
  { id: 'luma',  label: 'Luma only', desc: 'Discard chroma channels and process the grayscale plane. Compact but loses all color information.' },
];

/* ── Mock 16-bucket luma histogram, biased per color-space ── */
function mockHistogram(colorSpace: ColorSpace, imageType: string): number[] {
  const seed = (imageType.length * 7 + colorSpace.length * 3) % 17;
  const center =
    colorSpace === 'ycbcr' ? 0.55 : colorSpace === 'rgb' ? 0.62 : 0.42;
  const width = colorSpace === 'luma' ? 0.18 : 0.24;
  const raw = Array.from({ length: 16 }, (_, i) => {
    const x = (i + seed) / 16;
    const v = Math.exp(-((x - center) ** 2) / (2 * width * width));
    const noise = 0.08 * Math.sin(i * 1.7 + seed);
    return Math.max(0.04, v + noise);
  });
  const max = Math.max(...raw);
  return raw.map(v => v / max);
}

export function PreprocessingPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PreprocSettings>(DEFAULTS);
  const [imageType, setImageType] = useState<string>('Natural');

  /* ── Hydrate from upload + previous preprocessing choice ── */
  useEffect(() => {
    let resolvedType = 'Natural';

    // 1. Read upload to discover the image type
    const uploadRaw = localStorage.getItem('spectra_upload');
    if (uploadRaw) {
      try {
        const u = JSON.parse(uploadRaw);
        if (u?.imageType) resolvedType = u.imageType;
      } catch { /* ignore */ }
    }
    setImageType(resolvedType);

    // 2. Restore saved preprocessing if present, else seed from profile
    const saved = localStorage.getItem('spectra_preprocessing');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          colorSpace: (parsed?.colorSpace ?? DEFAULTS.colorSpace) as ColorSpace,
          autoTuned: parsed?.autoTuned ?? DEFAULTS.autoTuned,
        });
        return;
      } catch { /* ignore */ }
    }

    // First visit → adopt the profile's color-space and lock it
    const profile = getProfile(resolvedType);
    setSettings({
      colorSpace: profile.colorSpace as ColorSpace,
      autoTuned: true,
    });
  }, []);

  /* ── Persist on every change ── */
  useEffect(() => {
    localStorage.setItem('spectra_preprocessing', JSON.stringify(settings));
  }, [settings]);

  const profile = useMemo(() => getProfile(imageType), [imageType]);

  const selectColorSpace = (cs: ColorSpace) => {
    if (settings.autoTuned) return; // locked
    setSettings(s => ({ ...s, colorSpace: cs }));
  };

  const applyPreset = (p: TypeProfile) => {
    setSettings({ colorSpace: p.colorSpace as ColorSpace, autoTuned: true });
  };

  const toggleAutoTuned = () => {
    setSettings(s => {
      if (s.autoTuned) {
        // unlock — keep current colorSpace
        return { ...s, autoTuned: false };
      }
      // re-lock — snap back to profile recommendation
      return { colorSpace: profile.colorSpace as ColorSpace, autoTuned: true };
    });
  };

  const handleNext = () => {
    localStorage.setItem('spectra_preprocessing', JSON.stringify(settings));
    navigate('/transform');
  };

  const active = COLOR_SPACES.find(c => c.id === settings.colorSpace) ?? COLOR_SPACES[0];

  const histogram = useMemo(
    () => mockHistogram(settings.colorSpace, imageType),
    [settings.colorSpace, imageType]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}
    >
      <PipelineStepper />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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

      {/* Trained preset banner — surfaces the upcoming pipeline preset for the selected image type */}
      <TypePresetBanner stage="transform" onApply={applyPreset} />

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

              {settings.autoTuned && (
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'var(--leaf)',
                    background: 'rgba(31,138,94,0.08)',
                    border: '1px solid rgba(31,138,94,0.30)',
                    padding: '2px 8px',
                    borderRadius: 100,
                  }}
                >
                  <Lock style={{ width: 10, height: 10 }} />
                  AUTO-TUNED
                </span>
              )}
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COLOR_SPACES.map(cs => {
                const isSelected = settings.colorSpace === cs.id;
                const isLocked = settings.autoTuned && !isSelected;
                return (
                  <motion.button
                    key={cs.id}
                    onClick={() => selectColorSpace(cs.id)}
                    disabled={isLocked}
                    whileHover={!isLocked ? { x: 2 } : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${isSelected ? 'rgba(30,42,255,0.35)' : 'var(--rule)'}`,
                      background: isSelected ? 'rgba(30,42,255,0.04)' : 'white',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.5 : 1,
                      transition: 'all 0.18s', textAlign: 'left',
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

              {/* Lock toggle */}
              <button
                onClick={toggleAutoTuned}
                style={{
                  marginTop: 4,
                  alignSelf: 'flex-start',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 100,
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: settings.autoTuned ? 'var(--ink-3)' : 'var(--klein)',
                  background: 'transparent',
                  border: `1px solid ${settings.autoTuned ? 'var(--rule)' : 'rgba(30,42,255,0.35)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                {settings.autoTuned
                  ? (<><Unlock style={{ width: 11, height: 11 }} /> Manual override</>)
                  : (<><Lock style={{ width: 11, height: 11 }} /> Re-lock to preset</>)
                }
              </button>
            </div>
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

        {/* RIGHT: Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>CHANNEL DECOMPOSITION</span>
            </div>
            <div style={{ padding: 24 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={settings.colorSpace}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: settings.colorSpace === 'luma' ? '1fr' : 'repeat(3, 1fr)',
                    gap: 10, marginBottom: 16,
                  }}>
                    {(settings.colorSpace === 'ycbcr'
                      ? [
                          { label: 'Y',  hint: 'Luma',     bg: 'linear-gradient(180deg, #fff 0%, #1a1a1a 100%)' },
                          { label: 'Cb', hint: 'Blue-diff', bg: 'linear-gradient(180deg, #ffd 0%, #00f 100%)' },
                          { label: 'Cr', hint: 'Red-diff',  bg: 'linear-gradient(180deg, #dff 0%, #f00 100%)' },
                        ]
                      : settings.colorSpace === 'rgb'
                      ? [
                          { label: 'R', hint: 'Red',   bg: 'linear-gradient(180deg, #fff 0%, #d4574c 100%)' },
                          { label: 'G', hint: 'Green', bg: 'linear-gradient(180deg, #fff 0%, #1F8A5E 100%)' },
                          { label: 'B', hint: 'Blue',  bg: 'linear-gradient(180deg, #fff 0%, #1E2AFF 100%)' },
                        ]
                      : [
                          { label: 'L', hint: 'Luma',  bg: 'linear-gradient(180deg, #fff 0%, #0a0b0e 100%)' },
                        ]
                    ).map(ch => (
                      <div key={ch.label} style={{
                        aspectRatio: '1', borderRadius: 'var(--r-md)',
                        background: ch.bg, border: '1px solid var(--rule)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                        padding: 10, color: 'white',
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 24, lineHeight: 1 }}>{ch.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85, marginTop: 2 }}>{ch.hint}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
                    {active.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* ── Luma histogram (mock) ── */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <BarChart3 style={{ width: 12, height: 12, color: 'var(--klein)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    LUMA DISTRIBUTION
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>
                    16 buckets · mock
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: 80,
                    background: 'var(--paper-2)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--r-sm)',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3,
                  }}
                >
                  {histogram.map((v, i) => (
                    <motion.div
                      key={`${settings.colorSpace}-${i}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${v * 100}%` }}
                      transition={{ duration: 0.4, delay: i * 0.015 }}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(180deg, var(--klein) 0%, var(--klein-deep) 100%)',
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.85,
                        minHeight: 2,
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8.5,
                    color: 'var(--ink-4)',
                    letterSpacing: '0.12em',
                  }}
                >
                  <span>0</span>
                  <span>luma intensity →</span>
                  <span>255</span>
                </div>
              </div>
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
