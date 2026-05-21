/**
 * ENTROPY CODING PAGE — Pipeline Stage 05
 * Huffman / RLE configuration after quantization.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Code2, ArrowRight, Info } from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import { TypePresetBanner } from '../components/TypePresetBanner';
import { computeMetrics } from '../lib/pipeline';
import type { SubbandStat } from '../lib/dwt';

interface EntropySettings {
  coder: 'huffman-default' | 'huffman-custom' | 'arithmetic';
}

interface ImageResolution {
  width: number;
  height: number;
}

interface QuantState {
  stepSize: number;
  lossless: boolean;
}

interface TransformState {
  method: 'jpeg' | 'jpeg2000';
  subbandStats?: SubbandStat[];
}

const DEFAULTS: EntropySettings = {
  coder: 'huffman-default',
};

const CODER_IDS = ['huffman-default', 'huffman-custom', 'arithmetic'] as const;
const DEFAULT_RESOLUTION: ImageResolution = { width: 1024, height: 1024 };
const DEFAULT_QUANT: QuantState = { stepSize: 18, lossless: false };
const DEFAULT_TRANSFORM: TransformState = { method: 'jpeg2000' };

function isCoder(value: unknown): value is EntropySettings['coder'] {
  return typeof value === 'string' && (CODER_IDS as readonly string[]).includes(value);
}

function parseResolution(raw: unknown): ImageResolution {
  if (typeof raw !== 'string') return DEFAULT_RESOLUTION;
  const match = raw.match(/(\d+)\D+(\d+)/);
  if (!match) return DEFAULT_RESOLUTION;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_RESOLUTION;
  }
  return { width, height };
}

const CODERS: { id: EntropySettings['coder']; label: string; sub: string; desc: string }[] = [
  { id: 'huffman-default', label: 'Huffman · default tables', sub: 'JPEG-standard',
    desc: 'Static Huffman tables specified in the JPEG standard. Fast and patent-free, no per-image overhead.' },
  { id: 'huffman-custom',  label: 'Huffman · custom tables',  sub: 'Per-specimen',
    desc: 'Build optimized Huffman tables from this specimen’s symbol distribution. Adds 4-32 bytes overhead but saves 5-10%.' },
  { id: 'arithmetic',      label: 'Arithmetic',                sub: 'JPEG2000-style',
    desc: 'Range / arithmetic coding (MQ coder for J2K). Higher compression ratio than Huffman, slightly slower.' },
];


export function EntropyPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<EntropySettings>(DEFAULTS);
  const [imageResolution, setImageResolution] = useState<ImageResolution>(DEFAULT_RESOLUTION);
  const [imageType, setImageType] = useState('Natural');
  const [quant, setQuant] = useState<QuantState>(DEFAULT_QUANT);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);

  useEffect(() => {
    const saved = localStorage.getItem('spectra_entropy');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          coder: isCoder(parsed?.coder) ? parsed.coder : DEFAULTS.coder,
        });
      } catch {}
    }

    const upload = localStorage.getItem('spectra_upload');
    if (upload) {
      try {
        const parsed = JSON.parse(upload);
        setImageResolution(parseResolution(parsed?.resolution));
        if (parsed?.imageType) setImageType(String(parsed.imageType));
      } catch {}
    }

    const quantRaw = localStorage.getItem('spectra_quantization');
    if (quantRaw) {
      try {
        const parsed = JSON.parse(quantRaw);
        const lossless = !!parsed?.lossless;
        const stepSize = lossless ? 1 : Number(parsed?.stepSize) || DEFAULT_QUANT.stepSize;
        setQuant({ stepSize, lossless });
      } catch {}
    }

    const transformRaw = localStorage.getItem('spectra_transform');
    if (transformRaw) {
      try {
        const parsed = JSON.parse(transformRaw);
        setTransform({
          method: parsed?.method === 'jpeg' ? 'jpeg' : 'jpeg2000',
          subbandStats: Array.isArray(parsed?.subbandStats) ? parsed.subbandStats : undefined,
        });
      } catch {}
    }
  }, []);

  const update = <K extends keyof EntropySettings>(k: K, v: EntropySettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleNext = () => {
    localStorage.setItem('spectra_entropy', JSON.stringify(settings));
    navigate('/processing');
  };

  // Same model as the Processing result — Entropy preview matches the final CR.
  const metrics = computeMetrics({
    method: transform.method,
    subbandStats: transform.subbandStats,
    stepSize: quant.stepSize,
    lossless: quant.lossless,
    imageType,
    coder: settings.coder,
  });
  const bppExact = 8 / metrics.cr;
  const bpp = +bppExact.toFixed(2);
  const cr = metrics.cr.toFixed(1);
  const pixelCount = imageResolution.width * imageResolution.height;
  const estimatedKB = Math.max(1, Math.round((pixelCount * bppExact) / (8 * 1024)));
  const coderBarGradient = {
    'huffman-default': 'linear-gradient(180deg, var(--klein) 0%, rgba(30,42,255,0.4) 100%)',
    'huffman-custom': 'linear-gradient(180deg, var(--leaf) 0%, rgba(31,138,94,0.4) 100%)',
    arithmetic: 'linear-gradient(180deg, var(--plum) 0%, rgba(75,30,122,0.4) 100%)',
  }[settings.coder] ?? 'linear-gradient(180deg, var(--klein) 0%, rgba(30,42,255,0.4) 100%)';

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

      <TypePresetBanner
        stage="entropy"
        onApply={(p) => setSettings(s => ({ ...s, coder: p.coder }))}
      />

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

              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Estimated Bitstream
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)' }}>
                  {estimatedKB}
                  <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', fontSize: 11, color: 'var(--klein)', marginLeft: 6 }}>KB</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
                  {imageResolution.width} × {imageResolution.height} · {bpp} bpp
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
                      background: coderBarGradient,
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

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.12)', borderRadius: 'var(--r-md)' }}>
          <Info style={{ width: 13, height: 13, color: 'var(--klein)', marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
            Entropy coding is lossless — it cannot reduce quality, only redundancy. Custom Huffman saves a few
            percent on text-heavy or synthetic specimens; arithmetic is best for high-entropy natural images.
          </p>
        </div>

        <div className="sp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
              Why These Matter
            </span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { k: 'Default Huffman', v: 'static tables, no per-image overhead, usually 5-10% over arithmetic' },
              { k: 'Custom Huffman', v: 'optimized for this specimen, adds 4-32 byte table overhead' },
              { k: 'Arithmetic', v: 'continuous fraction encoding with near-theoretical entropy limit' },
            ].map((row) => (
              <div key={row.k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--ink)', minWidth: 114 }}>{row.k}</span>
                <span style={{ color: 'var(--ink-4)' }}>-</span>
                <span>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
