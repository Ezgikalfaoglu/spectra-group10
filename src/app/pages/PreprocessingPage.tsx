/**
 * PREPROCESSING PAGE — Pipeline Stage 02
 * Color-space conversion and level shifting before transform.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, ArrowRight, Info } from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

interface PreprocSettings {
  colorSpace: 'ycbcr' | 'rgb' | 'luma';
}

const DEFAULTS: PreprocSettings = {
  colorSpace: 'ycbcr',
};

const COLOR_SPACES: { id: PreprocSettings['colorSpace']; label: string; desc: string }[] = [
  { id: 'ycbcr', label: 'YCbCr',     desc: 'Luma + chroma decorrelation. Standard JPEG / JPEG2000 baseline. Best energy compaction for natural images.' },
  { id: 'rgb',   label: 'RGB',       desc: 'No conversion — process channels directly. Higher fidelity at the cost of compression efficiency.' },
  { id: 'luma',  label: 'Luma only', desc: 'Discard chroma channels and process the grayscale plane. Compact but loses all color information.' },
];

export function PreprocessingPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PreprocSettings>(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem('spectra_preprocessing');
    if (saved) {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  const update = <K extends keyof PreprocSettings>(k: K, v: PreprocSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleNext = () => {
    localStorage.setItem('spectra_preprocessing', JSON.stringify(settings));
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
