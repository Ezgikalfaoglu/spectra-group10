import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck, Shuffle, Braces, SlidersHorizontal, Code2,
  Activity, CheckCircle2, AlertTriangle, Terminal,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import type { SubbandStat } from '../lib/dwt';
import { computeMetrics, type Coder } from '../lib/pipeline';

const query = new URLSearchParams(window.location.search);
const failStep = query.get('fail') ? Number(query.get('fail')) : null;

interface UploadData {
  name: string; resolution: string; sizeKB: number;
  dataUrl: string; imageType: string;
}
interface TransformSettings {
  method: 'jpeg' | 'jpeg2000'; waveletFilter: string; decompositionLevel: number;
  subbandStats?: SubbandStat[];
}
interface QuantizationSettings {
  quantizationType: 'uniform' | 'scalar'; stepSize: number; lossless: boolean;
  realMse?: number; realPsnr?: number; realSparsity?: number;
}
interface EntropySettings {
  coder: Coder;
  realCr?: number; realBpp?: number; realBits?: number;
}
interface Results {
  mse: number; psnr: number; compressionRatio: string; sparsityRatio: string;
  bpp?: number; outputKB?: number; measured?: boolean;
}

const PIPELINE_STAGES = [
  { id: 0, label: 'Input',     icon: FileCheck,         desc: 'Validating specimen' },
  { id: 1, label: 'Preproc.',  icon: Shuffle,           desc: 'Color-space conversion' },
  { id: 2, label: 'Transform', icon: Braces,            desc: 'Applying DCT / DWT' },
  { id: 3, label: 'Quantize',  icon: SlidersHorizontal, desc: 'Coefficient quantization' },
  { id: 4, label: 'Entropy',   icon: Code2,             desc: 'Huffman / arithmetic coding' },
  { id: 5, label: 'Evaluate',  icon: Activity,          desc: 'Computing metrics' },
];

const STEP_DURATION = 800;

function parsePixels(resolution: string): number {
  const match = resolution?.match(/(\d+)\D+(\d+)/);
  if (!match) return 1024 * 1024;
  return Number(match[1]) * Number(match[2]);
}

// Prefer the real measured values from the Quantization (MSE/PSNR/sparsity) and
// Entropy (CR/bpp) stages. Fall back to the model only for whatever is missing.
function computeResults(
  t: TransformSettings,
  q: QuantizationSettings,
  e: EntropySettings,
  imageType: string,
  resolution: string,
): Results {
  const m = computeMetrics({
    method: t.method,
    subbandStats: t.subbandStats,
    stepSize: q.stepSize,
    lossless: q.lossless,
    imageType,
    coder: e.coder ?? 'huffman-default',
  });

  const mse = q.realMse ?? m.mse;
  const psnr = q.realPsnr ?? m.psnr;
  const sparsity = q.realSparsity ?? m.sparsity;
  const cr = e.realCr ?? m.cr;
  const bpp = e.realBpp ?? +(8 / cr).toFixed(3);
  const measured = q.realPsnr != null && e.realCr != null;

  const outputKB = Math.max(1, Math.round((parsePixels(resolution) * bpp) / (8 * 1024)));

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    compressionRatio: `${cr.toFixed(1)}:1`,
    sparsityRatio: `${Math.round(sparsity)}%`,
    bpp: +bpp.toFixed(3),
    outputKB,
    measured,
  };
}

export function ProcessingPage() {
  const navigate = useNavigate();

  const [upload, setUpload] = useState<UploadData | null>(null);
  const [transform, setTransform] = useState<TransformSettings | null>(null);
  const [quant, setQuant] = useState<QuantizationSettings | null>(null);
  const [entropy, setEntropy] = useState<EntropySettings | null>(null);

  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [logLines, setLogLines] = useState<{ t: number; text: string }[]>([]);

  useEffect(() => {
    const u = localStorage.getItem('spectra_upload');
    const t = localStorage.getItem('spectra_transform');
    const q = localStorage.getItem('spectra_quantization');

    if (!u || !t || !q) return;

    setUpload(JSON.parse(u));
    setTransform(JSON.parse(t));
    setQuant(JSON.parse(q));

    // Entropy stage is optional — fall back to default coder if not visited.
    const e = localStorage.getItem('spectra_entropy');
    if (e) {
      try { setEntropy(JSON.parse(e)); } catch { setEntropy({ coder: 'huffman-default' }); }
    } else {
      setEntropy({ coder: 'huffman-default' });
    }
  }, []);

  useEffect(() => {
    if (!upload || !transform || !quant || !entropy) return;

    setIsRunning(true);
    setCurrentStep(0);
    setLogLines([]);

    const timeouts: number[] = [];

    PIPELINE_STAGES.forEach((stage, idx) => {
      const id = window.setTimeout(() => {
        if (failStep !== null && idx === failStep) {
          setErrorStage(idx);
          setIsRunning(false);
          setLogLines((prev) => [
            ...prev,
            { t: idx * STEP_DURATION / 1000, text: `[ERROR] ${stage.label} failed — synthetic fault injection` },
          ]);
          return;
        }

        setCurrentStep(idx);
        setLogLines((prev) => [
          ...prev,
          { t: idx * STEP_DURATION / 1000, text: `${stage.label.toUpperCase()} · ${stage.desc} — ok` },
        ]);

        if (idx === PIPELINE_STAGES.length - 1) {
          const finalId = window.setTimeout(() => {
            const r = computeResults(transform, quant, entropy, upload.imageType, upload.resolution);
            setResults(r);
            setIsRunning(false);
            setIsDone(true);

            const entry = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              imageName: upload.name,
              imageType: upload.imageType,
              method: transform.method === 'jpeg2000' ? 'JPEG2000' : 'JPEG',
              wavelet: transform.method === 'jpeg2000' ? transform.waveletFilter : '—',
              decompLevel: transform.method === 'jpeg2000' ? transform.decompositionLevel : '—',
              quantType: quant.quantizationType,
              stepSize: quant.lossless ? 1 : quant.stepSize,
              lossless: quant.lossless,
              coder: entropy.coder,
              mse: r.mse,
              psnr: r.psnr,
              cr: r.compressionRatio,
              sparsity: r.sparsityRatio,
              bpp: r.bpp,
              outputKB: r.outputKB,
              measured: r.measured,
              imageDataUrl: upload.dataUrl,
              settings: {
                method: transform.method,
                waveletFilter: transform.waveletFilter,
                decompositionLevel: transform.decompositionLevel,
                quantizationType: quant.quantizationType,
                stepSize: quant.lossless ? 1 : quant.stepSize,
                coder: entropy.coder,
              },
            };

            try {
              const history = JSON.parse(localStorage.getItem('compressionHistory') || '[]');
              history.unshift(entry);
              localStorage.setItem('compressionHistory', JSON.stringify(history));
              localStorage.setItem('lastResult', JSON.stringify(entry));
            } catch (err) {
              // localStorage quota exceeded — keep just the latest result
              try {
                localStorage.setItem('lastResult', JSON.stringify(entry));
              } catch { /* ignore */ }
            }
          }, 500);
          timeouts.push(finalId);
        }
      }, idx * STEP_DURATION);
      timeouts.push(id);
    });

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [upload, transform, quant, entropy]);

  useEffect(() => {
    if (!isDone) return;
    const t = window.setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [isDone]);

  // Separate effect for navigation, so setState updater never triggers a route change
  useEffect(() => {
    if (isDone && countdown === 0) {
      navigate('/results');
    }
  }, [isDone, countdown, navigate]);

  const typeNote = upload?.imageType === 'Fingerprint'
    ? 'Lossless mode active — preserving every minutia for AFIS matching'
    : upload?.imageType === 'Biomedical'
    ? 'Lossless mode active — preserving diagnostic tissue boundaries'
    : upload?.imageType === 'AI Generated'
    ? 'Tuned for diffusion-model output — smoother coefficient distribution'
    : upload?.imageType === 'Synthetic'
    ? 'Optimised for hard-edge transitions — arithmetic coder preferred'
    : 'Standard compression pipeline';

  if (errorStage !== null) {
    return (
      <div style={{ maxWidth: 600, margin: '120px auto 0', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(212,87,76,0.08)', border: '2px solid rgba(212,87,76,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <AlertTriangle style={{ width: 36, height: 36, color: '#d4574c' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--ink)', marginBottom: 8 }}>
          Stage Failed
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 24 }}>
          {PIPELINE_STAGES[errorStage].label} · {PIPELINE_STAGES[errorStage].desc}
        </p>
        <button
          className="sp-btn sp-btn-klein"
          onClick={() => window.location.assign('/processing')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          Retry pipeline
        </button>
      </div>
    );
  }

  if (isDone && results) {
    return (
      <div style={{ maxWidth: 600, margin: '120px auto 0', padding: '0 24px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'rgba(31,138,94,0.08)', border: '2px solid rgba(31,138,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle2 style={{ width: 42, height: 42, color: 'var(--leaf)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 56, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Done<em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>.</em>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 12 }}>
            Redirecting to results · {countdown}s
          </p>
        </motion.div>
      </div>
    );
  }

  const progress = currentStep < 0 ? 0 : ((currentStep + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}
    >
      <PipelineStepper />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="sp-eyebrow" style={{ marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--klein)', display: 'inline-block', marginRight: 8 }} />
          STEP 06 · COMPRESSION PIPELINE
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(28px, 3vw, 44px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)',
        }}>
          Running <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>compression</em>.
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, textTransform: 'uppercase' }}>
          {upload?.name ?? 'specimen'} · {upload?.imageType ?? 'unclassified'}
        </p>
      </div>

      {/* Active stage card */}
      <AnimatePresence mode="wait">
        {isRunning && currentStep >= 0 && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="sp-card"
            style={{ padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
          >
            {/* Pulse halo on active icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: -6,
                    borderRadius: '50%',
                    background: 'var(--klein)',
                    opacity: 0.18,
                  }}
                />
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(30,42,255,0.08)',
                  border: '1px solid rgba(30,42,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {(() => {
                    const Icon = PIPELINE_STAGES[currentStep].icon;
                    return <Icon style={{ width: 22, height: 22, color: 'var(--klein)' }} />;
                  })()}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Stage {currentStep + 1} of {PIPELINE_STAGES.length}
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 28, fontWeight: 400,
                  color: 'var(--klein)', letterSpacing: '-0.015em',
                }}>
                  {PIPELINE_STAGES[currentStep].label}…
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>
                  {PIPELINE_STAGES[currentStep].desc}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.05em', color: 'var(--ink-4)', marginTop: 8, fontStyle: 'italic' }}>
                  → {typeNote}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
        {/* Connector line behind icons */}
        <div style={{
          position: 'absolute', top: 18, left: '6%', right: '6%', height: 2,
          background: 'var(--rule)', zIndex: 0,
        }} />
        <motion.div
          animate={{ width: `${(progress / 100) * 88}%` }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute', top: 18, left: '6%', height: 2,
            background: 'var(--klein)', zIndex: 1,
          }}
        />

        {PIPELINE_STAGES.map((stage, i) => {
          const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'wait';
          const Icon = stage.icon;
          return (
            <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: state === 'done' ? 'var(--leaf)' : state === 'active' ? 'var(--klein)' : 'white',
                border: `1.5px solid ${state === 'wait' ? 'var(--rule)' : 'transparent'}`,
                color: state === 'wait' ? 'var(--ink-4)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
                boxShadow: state === 'active' ? '0 0 0 4px rgba(30,42,255,0.18)' : 'none',
                transition: 'all 0.2s',
              }}>
                {state === 'done'
                  ? <CheckCircle2 style={{ width: 18, height: 18 }} />
                  : <Icon style={{ width: 16, height: 16 }} />}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9.5,
                color: state === 'wait' ? 'var(--ink-4)' : 'var(--ink-2)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--rule-soft)', borderRadius: 100, overflow: 'hidden', marginBottom: 24 }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'var(--klein)' }}
        />
      </div>

      {/* Pipeline log strip — dark ink card */}
      <div style={{
        background: 'var(--ink)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lift)',
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(246,244,236,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Terminal style={{ width: 13, height: 13, color: 'var(--cyan)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.22em',
            color: 'rgba(246,244,236,0.5)', textTransform: 'uppercase',
          }}>
            Pipeline log
          </span>
          <span style={{ flex: 1 }} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
            color: 'var(--cyan)', textTransform: 'uppercase',
          }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }}
            />
            Live
          </span>
        </div>
        <div style={{
          padding: '14px 18px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'rgba(246,244,236,0.85)',
          minHeight: 140,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {logLines.length === 0 ? (
            <span style={{ color: 'rgba(246,244,236,0.35)' }}>Waiting for pipeline to start…</span>
          ) : (
            logLines.map((line, i) => (
              <div key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--cyan)' }}>[{line.t.toFixed(2)}s]</span>{' '}
                <span style={{ color: line.text.includes('[ERROR]') ? '#ff6b6b' : 'rgba(246,244,236,0.85)' }}>
                  {line.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
