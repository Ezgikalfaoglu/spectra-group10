/**
 * ENTROPY CODING PAGE — Pipeline Stage 05
 * Huffman / RLE configuration after quantization.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Code2, ArrowRight, Info } from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

interface EntropySettings {
  coder: 'huffman-default' | 'huffman-custom' | 'arithmetic';
  useRLE: boolean;
  zigzag: boolean;
}

const DEFAULTS: EntropySettings = {
  coder: 'huffman-default',
  useRLE: true,
  zigzag: true,
};

const CODERS: { id: EntropySettings['coder']; label: string; sub: string; desc: string }[] = [
  { id: 'huffman-default', label: 'Huffman · default tables', sub: 'JPEG-standard',
    desc: 'Static Huffman tables specified in the JPEG standard. Fast and patent-free, no per-image overhead.' },
  { id: 'huffman-custom',  label: 'Huffman · custom tables',  sub: 'Per-specimen',
    desc: 'Build optimized Huffman tables from this specimen’s symbol distribution. Adds 4-32 bytes overhead but saves 5-10%.' },
  { id: 'arithmetic',      label: 'Arithmetic',                sub: 'JPEG2000-style',
    desc: 'Range / arithmetic coding (MQ coder for J2K). Higher compression ratio than Huffman, slightly slower.' },
];

function estimateBitRate(coder: EntropySettings['coder'], rle: boolean, zigzag: boolean) {
  let bpp = 0.92;
  if (coder === 'huffman-custom') bpp -= 0.06;
  if (coder === 'arithmetic') bpp -= 0.12;
  if (rle) bpp -= 0.08;
  if (zigzag) bpp -= 0.04;
  return Math.max(0.32, +bpp.toFixed(2));
}

export function EntropyPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<EntropySettings>(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem('spectra_entropy');
    if (saved) {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  const update = <K extends keyof EntropySettings>(k: K, v: EntropySettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleNext = () => {
    localStorage.setItem('spectra_entropy', JSON.stringify(settings));
    navigate('/processing');
  };

  const bpp = estimateBitRate(settings.coder, settings.useRLE, settings.zigzag);
  const cr = (8 / bpp).toFixed(1);

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
          STEP 05 · ENTROPY CODING
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          Compress the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>symbols</em>.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Lossless symbol coding to pack quantized coefficients into the final bitstream
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT: Coder selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code2 style={{ width: 14, height: 14, color: 'var(--klein)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>CODER</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CODERS.map(c => {
                const isSelected = settings.coder === c.id;
                return (
                  <motion.button
                    key={c.id}
                    onClick={() => update('coder', c.id)}
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
                        }}>{c.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8.5, padding: '2px 7px',
                          background: 'var(--paper-3)', color: 'var(--ink-3)',
                          borderRadius: 100, letterSpacing: '0.12em', textTransform: 'uppercase',
                        }}>{c.sub}</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.04em', lineHeight: 1.55 }}>{c.desc}</p>
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

          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>PRE-CODER OPTIONS</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'zigzag' as const, label: 'Zig-zag scan', desc: 'Reorder 2D coefficients into a 1D sequence prioritising low-frequency terms (DCT only).' },
                { k: 'useRLE' as const, label: 'Run-length encode zeros', desc: 'Collapse consecutive zero coefficients into (run, value) pairs before entropy coding.' },
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
            <button onClick={() => navigate('/quantization')} className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Quantize
            </button>
            <button onClick={handleNext} className="sp-btn sp-btn-klein" style={{ flex: 2, justifyContent: 'center', gap: 8 }}>
              Next: Process
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* RIGHT: Estimated output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>ESTIMATED PAYLOAD</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live preview</span>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ textAlign: 'center', padding: '16px 12px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--klein)' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>Bits / pixel</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>
                    {bpp}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 6, color: 'var(--klein)', fontStyle: 'normal' }}>bpp</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px 12px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--leaf)' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>Compression</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 30, color: 'var(--leaf)', lineHeight: 1 }}>
                    {cr}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 4, fontStyle: 'normal' }}>:1</span>
                  </div>
                </div>
              </div>

              {/* Symbol distribution mini bar chart */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Symbol frequency · estimated
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {[88, 64, 42, 28, 18, 12, 8, 5, 3, 2, 1].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${h}%`,
                      background: `linear-gradient(180deg, var(--klein) 0%, rgba(30,42,255,0.4) 100%)`,
                      borderRadius: '2px 2px 0 0', opacity: 0.3 + (h / 100) * 0.7,
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.08em', marginTop: 6 }}>
                  <span>0 (run)</span>
                  <span>±1</span>
                  <span>±2</span>
                  <span>±4+</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
            <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              Entropy coding is lossless — it cannot reduce quality, only redundancy. Custom Huffman saves a few
              percent on text-heavy or synthetic specimens; arithmetic is best for high-entropy natural images.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
