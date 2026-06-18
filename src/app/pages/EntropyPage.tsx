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
import { analyzeChannels } from '../lib/analysis';
import { analyzeEntropy } from '../lib/entropy';
import type { SubbandStat, Filter } from '../lib/dwt';
import type { ColorSpace } from '../lib/preprocess';

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
  waveletFilter?: string;
  decompositionLevel?: number;
  subbandStats?: SubbandStat[];
}

interface PreprocData {
  planeDataUrl?: string;
  levelShift?: boolean;
  colorSpace?: ColorSpace;
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
  const [preproc, setPreproc] = useState<PreprocData | null>(null);
  const [uploadSource, setUploadSource] = useState('');
  const [coeffSubbands, setCoeffSubbands] = useState<SubbandStat[] | null>(null);

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
        setUploadSource(String(parsed?.dataUrl || ''));
      } catch {}
    }

    const pp = localStorage.getItem('spectra_preprocessing');
    if (pp) {
      try { setPreproc(JSON.parse(pp)); } catch {}
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
          waveletFilter: typeof parsed?.waveletFilter === 'string' ? parsed.waveletFilter : 'db4',
          decompositionLevel: Number(parsed?.decompositionLevel) || 2,
          subbandStats: Array.isArray(parsed?.subbandStats) ? parsed.subbandStats : undefined,
        });
      } catch {}
    }
  }, []);

  const update = <K extends keyof EntropySettings>(k: K, v: EntropySettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  // Recompute the real leaf coefficients across ALL channels of the color space
  // so entropy is measured over the whole image (R+G+B / Y+Cb+Cr / L).
  const analysisSource = uploadSource || preproc?.planeDataUrl || '';
  const colorSpace: ColorSpace = preproc?.colorSpace ?? 'luma';
  useEffect(() => {
    if (!analysisSource) { setCoeffSubbands(null); return; }
    const isJ2K = transform.method === 'jpeg2000';
    const filter: Filter = isJ2K ? ((transform.waveletFilter as Filter) || 'db4') : 'db4';
    const level = isJ2K ? (transform.decompositionLevel || 2) : 2;
    let cancelled = false;
    analyzeChannels({ source: analysisSource, colorSpace, filter, level, levelShift: preproc?.levelShift })
      .then(res => { if (!cancelled) setCoeffSubbands(res); })
      .catch(() => { if (!cancelled) setCoeffSubbands(null); });
    return () => { cancelled = true; };
  }, [analysisSource, colorSpace, preproc?.levelShift, transform.method, transform.waveletFilter, transform.decompositionLevel]);

  // Real entropy measurement on the actual quantized symbols. Channel count
  // makes bpp / bitstream size reflect the full color payload.
  const channels = colorSpace === 'luma' ? 1 : 3;
  const realEntropy = coeffSubbands
    ? analyzeEntropy(coeffSubbands, quant.stepSize, settings.coder, quant.lossless, channels)
    : null;

  // Model fallback (used until the coefficient analysis finishes).
  const metrics = computeMetrics({
    method: transform.method,
    subbandStats: transform.subbandStats,
    stepSize: quant.stepSize,
    lossless: quant.lossless,
    imageType,
    coder: settings.coder,
  });

  const isReal = !!realEntropy;
  const crNum = realEntropy ? realEntropy.cr : metrics.cr;
  const bppExact = realEntropy ? realEntropy.bpp : 8 / metrics.cr;
  const bpp = +bppExact.toFixed(2);
  const cr = crNum.toFixed(1);
  const pixelCount = imageResolution.width * imageResolution.height;
  const estimatedKB = Math.max(1, Math.round((pixelCount * bppExact) / (8 * 1024)));

  const handleNext = () => {
    const payload: Record<string, unknown> = { ...settings };
    if (realEntropy) {
      payload.realCr = realEntropy.cr;
      payload.realBpp = realEntropy.bpp;
      payload.realBits = realEntropy.bits;
      payload.entropy = realEntropy.entropy;
      payload.avgCodeLen = realEntropy.avgCodeLen;
    }
    localStorage.setItem('spectra_entropy', JSON.stringify(payload));
    navigate('/processing');
  };
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
        coderOverride={settings.coder}
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                {isReal ? 'MEASURED PAYLOAD' : 'ESTIMATED PAYLOAD'}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: isReal ? 'var(--leaf)' : 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {isReal ? '● real coding' : 'Live preview'}
              </span>
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

              {/* Symbol distribution — real histogram of quantized indices */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    Symbol frequency · {isReal ? 'measured' : 'estimated'}
                  </span>
                  {realEntropy && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
                      H = {realEntropy.entropy} b/sym · {realEntropy.distinctSymbols} symbols
                    </span>
                  )}
                </div>
                {(() => {
                  const buckets = realEntropy
                    ? realEntropy.buckets
                    : [88, 64, 42, 18, 6].map((c, i) => ({ label: ['0 (run)', '±1', '±2', '±3', '±4+'][i], count: c }));
                  const total = Math.max(1, buckets.reduce((s, b) => s + b.count, 0));
                  // Linear scale — bar height is proportional to each bucket's
                  // share, normalised so the largest bucket fills the chart.
                  const maxPct = Math.max(...buckets.map(b => (b.count / total) * 100), 1);
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                        {buckets.map((b, i) => {
                          const pct = (b.count / total) * 100;
                          const h = Math.max(b.count > 0 ? 2 : 0, (pct / maxPct) * 100);
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)', marginBottom: 3 }}>
                                {pct >= 0.05 ? `${pct.toFixed(pct < 10 ? 1 : 0)}%` : '·'}
                              </span>
                              <div style={{
                                width: '100%',
                                height: `${h}%`,
                                background: coderBarGradient,
                                borderRadius: '2px 2px 0 0', opacity: 0.45 + (h / 100) * 0.55,
                              }} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.08em', marginTop: 6 }}>
                        {buckets.map((b, i) => <span key={i} style={{ flex: 1, textAlign: 'center' }}>{b.label}</span>)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--ink-4)', letterSpacing: '0.04em', marginTop: 8, fontStyle: 'italic', textAlign: 'right' }}>
                        % = share of all coefficients
                      </div>
                    </>
                  );
                })()}
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
