/**
 * PROCESSING PAGE — Team: Processing / Encoding State
 * ─────────────────────────────────────────────────────────
 * Responsibilities:
 *   • Runs the 7-stage compression pipeline animation
 *   • Reads all settings from localStorage
 *   • Computes MSE / PSNR / CR / Sparsity metrics
 *   • Saves to localStorage["lastResult", "compressionHistory"]
 *   • Navigates to /results on completion
 *   • Routes ← /quantization  → /results
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck, Shuffle, Braces, SlidersHorizontal, Code2,
  Layers, Activity, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

/* ─── Types ─── */
interface UploadData {
  name: string; format: string; resolution: string;
  colorMode: string; sizeKB: number; dataUrl: string; imageType: string;
}
interface TransformSettings {
  method: 'jpeg' | 'jpeg2000'; waveletFilter: string; decompositionLevel: number;
}
interface QuantizationSettings {
  quantizationType: 'uniform' | 'scalar'; stepSize: number; lossless: boolean;
}
interface Results {
  mse: number; psnr: number; compressionRatio: string; sparsityRatio: string;
}

/* ─── Pipeline stages ─── */
const PIPELINE_STAGES = [
  { id: 0, label: 'Input Validation',    icon: FileCheck,        desc: 'Validating file format and extracting metadata' },
  { id: 1, label: 'Preprocessing',       icon: Shuffle,          desc: 'Resizing, normalising and colour-space conversion' },
  { id: 2, label: 'DCT / DWT Transform', icon: Braces,           desc: 'Applying frequency-domain transform to coefficients' },
  { id: 3, label: 'Quantization',        icon: SlidersHorizontal,desc: 'Reducing coefficient precision with step Δ' },
  { id: 4, label: 'Entropy Coding',      icon: Code2,            desc: 'Applying Huffman coding to quantised symbols' },
  { id: 5, label: 'Reconstruction',      icon: Layers,           desc: 'Inverse transform & Huffman decode (IDCT/IDWT)' },
  { id: 6, label: 'Evaluation',          icon: Activity,         desc: 'Computing MSE, PSNR, Compression Ratio, Sparsity' },
];

const STEP_DURATION = 680; // ms per stage

/* ─── Compute results helper ─── */
function computeResults(t: TransformSettings, q: QuantizationSettings): Results {
  const s = q.stepSize;
  if (q.lossless) {
    return { mse: 0.00, psnr: Infinity, compressionRatio: '2.4:1', sparsityRatio: '38%' };
  }
  if (t.method === 'jpeg2000') {
    const lvlBonus = (t.decompositionLevel - 1) * 0.4;
    const wBonus = t.waveletFilter === 'db4' ? 1.2 : t.waveletFilter === 'db2' ? 0.6 : 0;
    const psnr = Math.max(22, 38.5 - (s / 32) * 16 + lvlBonus + wBonus);
    const mse  = Math.max(3, (s * s) / (255 * 0.6 + s));
    const cr   = (5 + (s / 4) * 2.1).toFixed(1);
    const sp   = Math.min(95, 55 + s * 1.2).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sp}%` };
  } else {
    const psnr = Math.max(20, 36.5 - (s / 32) * 14);
    const mse  = Math.max(5, (s * s) / (255 * 0.5 + s));
    const cr   = (4 + (s / 4) * 1.8).toFixed(1);
    const sp   = Math.min(88, 45 + s * 1.0).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sp}%` };
  }
}

/* ─── Elapsed time hook ─── */
function useElapsed(running: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const id = setInterval(() => setMs(Date.now() - t0), 80);
    return () => clearInterval(id);
  }, [running]);
  return ms;
}

export function ProcessingPage() {
  const navigate = useNavigate();

  const [upload, setUpload]   = useState<UploadData | null>(null);
  const [transform, setTransform] = useState<TransformSettings | null>(null);
  const [quant, setQuant]     = useState<QuantizationSettings | null>(null);
  const [missingStep, setMissingStep] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning]     = useState(false);
  const [isDone, setIsDone]           = useState(false);
  const [results, setResults]         = useState<Results | null>(null);

  const elapsed = useElapsed(isRunning);

  /* ── Load settings from localStorage ── */
  useEffect(() => {
    const u = localStorage.getItem('spectra_upload');
    const t = localStorage.getItem('spectra_transform');
    const q = localStorage.getItem('spectra_quantization');
    if (!u) { setMissingStep('Upload (Step 01)'); return; }
    if (!t) { setMissingStep('Transform (Step 02)'); return; }
    if (!q) { setMissingStep('Quantization (Step 03)'); return; }
    try {
      setUpload(JSON.parse(u));
      setTransform(JSON.parse(t));
      setQuant(JSON.parse(q));
    } catch { setMissingStep('Data parse error — restart from Upload'); }
  }, []);

  /* ── Auto-start once all settings are loaded ── */
  useEffect(() => {
    if (!upload || !transform || !quant || isRunning || isDone) return;
    setIsRunning(true);
    setCurrentStep(0);

    PIPELINE_STAGES.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStep(idx);
        if (idx === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            const r = computeResults(transform, quant);
            setResults(r);
            setIsRunning(false);
            setIsDone(true);

            /* Save to localStorage */
            const entry = {
              id: `RUN-${Date.now().toString(36).toUpperCase()}`,
              date: new Date().toISOString(),
              imageName: upload.name,
              method: transform.method.toUpperCase(),
              wavelet: transform.method === 'jpeg2000' ? transform.waveletFilter : '—',
              decompLevel: transform.method === 'jpeg2000' ? transform.decompositionLevel : '—',
              quantType: quant.quantizationType,
              stepSize: quant.stepSize,
              mse: r.mse, psnr: r.psnr,
              cr: r.compressionRatio, sparsity: r.sparsityRatio,
              imageDataUrl: upload.dataUrl,
              settings: { ...transform, ...quant },
            };
            const history = JSON.parse(localStorage.getItem('compressionHistory') || '[]');
            history.unshift(entry);
            localStorage.setItem('compressionHistory', JSON.stringify(history.slice(0, 20)));
            localStorage.setItem('lastResult', JSON.stringify({ ...entry, file: upload }));

            /* Navigate to results after brief pause */
            setTimeout(() => navigate('/results'), 1400);
          }, 500);
        }
      }, idx * STEP_DURATION);
    });
  }, [upload, transform, quant]); // eslint-disable-line

  const progressPct = isDone ? 100 : currentStep < 0 ? 0 : Math.round(((currentStep + 0.5) / PIPELINE_STAGES.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}
    >
      <PipelineStepper />

      {/* Page Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="sp-eyebrow" style={{ marginBottom: 10 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isRunning ? 'var(--cyan)' : isDone ? 'var(--leaf)' : 'var(--klein)',
            display: 'inline-block',
            boxShadow: isRunning ? '0 0 0 4px rgba(0,212,255,0.18)' : 'none',
            animation: isRunning ? 'sp-pulse 1.2s ease-in-out infinite' : 'none',
          }} />
          STEP 04 · ENCODING PIPELINE
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 52px)',
          fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em',
          color: 'var(--ink)', fontVariationSettings: '"opsz" 72',
        }}>
          {isDone
            ? <><em style={{ fontStyle: 'italic', color: 'var(--leaf)' }}>Complete.</em> Rendering results.</>
            : isRunning
              ? <>The atelier is <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>working</em>.</>
              : <>Preparing <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>pipeline</em>.</>
          }
        </h1>
      </div>

      {/* Missing step guard */}
      {missingStep && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', background: 'rgba(212,87,76,0.06)', border: '1px solid rgba(212,87,76,0.2)', borderRadius: 'var(--r-md)', marginBottom: 28 }}
        >
          <AlertTriangle style={{ width: 18, height: 18, color: '#d4574c', flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            Missing: <strong style={{ color: '#d4574c' }}>{missingStep}</strong>. Please return to the beginning of the pipeline.
          </p>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 28, alignItems: 'start' }}>

        {/* ── LEFT: Pipeline Stages ── */}
        <div className="sp-card" style={{ overflow: 'hidden' }}>
          {/* Progress header */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>PIPELINE PROGRESS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isRunning ? 'var(--cyan)' : isDone ? 'var(--leaf)' : 'var(--ink-4)', letterSpacing: '0.1em' }}>
                  {isDone ? 'COMPLETE' : isRunning ? `${progressPct}%` : 'PENDING'}
                </span>
                {isRunning && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>
                    {(elapsed / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--rule)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                style={{ height: '100%', background: isDone ? 'var(--leaf)' : 'var(--cyan)', borderRadius: 2 }}
              />
            </div>
          </div>

          {/* Stages list */}
          <div style={{ padding: '8px 0' }}>
            {PIPELINE_STAGES.map((stage) => {
              const isDoneStage = currentStep > stage.id || isDone;
              const isActive    = currentStep === stage.id && isRunning;
              const isPending   = currentStep < stage.id && !isDone;
              const Icon = stage.icon;

              return (
                <motion.div
                  key={stage.id}
                  initial={false}
                  animate={{ backgroundColor: isActive ? 'rgba(0,212,255,0.04)' : isDoneStage ? 'rgba(31,138,94,0.03)' : 'transparent' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px',
                    borderBottom: stage.id < PIPELINE_STAGES.length - 1 ? '1px solid var(--rule-soft)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Stage indicator */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${isActive ? 'var(--cyan)' : isDoneStage ? 'var(--leaf)' : 'var(--rule)'}`,
                    background: isActive ? 'rgba(0,212,255,0.08)' : isDoneStage ? 'rgba(31,138,94,0.08)' : 'var(--paper)',
                    boxShadow: isActive ? '0 0 0 4px rgba(0,212,255,0.10)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {isDoneStage
                      ? <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--leaf)', strokeWidth: 2 }} />
                      : <Icon style={{ width: 15, height: 15, color: isActive ? 'var(--cyan)' : 'var(--ink-4)', strokeWidth: 1.5 }} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
                        {String(stage.id + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500,
                        color: isActive ? 'var(--ink)' : isDoneStage ? 'var(--ink-2)' : 'var(--ink-4)',
                        transition: 'color 0.3s',
                      }}>
                        {stage.label}
                      </span>
                      {isActive && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--cyan)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
                        >
                          · RUNNING
                        </motion.span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: isPending ? 'var(--ink-4)' : 'var(--ink-3)', letterSpacing: '0.03em', lineHeight: 1.4 }}>
                      {stage.desc}
                    </p>
                  </div>

                  {/* Step number */}
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: isActive ? 'var(--cyan)' : isDoneStage ? 'var(--leaf)' : 'var(--rule)', transition: 'color 0.3s', flexShrink: 0 }}>
                    {stage.id + 1}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Info + Results preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active specimen */}
          {upload && (
            <div className="sp-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>ACTIVE SPECIMEN</span>
              </div>
              <div style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={upload.dataUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--rule)', display: 'block' }} />
                  {isRunning && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 0 3px rgba(0,212,255,0.2)', display: 'block' }}
                    />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{upload.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4, letterSpacing: '0.08em' }}>{upload.resolution} · {upload.sizeKB} KB</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: transform?.method === 'jpeg2000' ? 'var(--klein)' : 'var(--plum)', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {transform?.method === 'jpeg2000' ? `JPEG2000 · ${transform.waveletFilter?.toUpperCase() || 'DB4'} · L${transform.decompositionLevel}` : 'JPEG · DCT'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-time results (appear as stages complete) */}
          <AnimatePresence>
            {(isDone && results) ? (
              <motion.div
                key="results-preview"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="sp-card" style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--leaf)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--leaf)', textTransform: 'uppercase' }}>RESULTS READY</span>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'MSE',      value: results.mse === 0 ? '0.00' : results.mse.toFixed(2), note: results.mse < 50 ? 'Low distortion' : 'Moderate' },
                      { label: 'PSNR',     value: results.psnr === Infinity ? '∞' : results.psnr.toFixed(2), unit: 'dB', note: results.psnr >= 30 ? '≥ 30 dB ✓' : 'Below threshold' },
                      { label: 'CR',       value: results.compressionRatio, note: 'Compression ratio' },
                      { label: 'Sparsity', value: results.sparsityRatio, note: 'Zero coefficients' },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '12px 14px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'var(--leaf)' }} />
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>
                          {m.value}
                          {(m as any).unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--leaf)', fontStyle: 'normal', marginLeft: 3 }}>{(m as any).unit}</span>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4, letterSpacing: '0.05em' }}>{m.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(31,138,94,0.06)', border: '1px solid rgba(31,138,94,0.2)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--leaf)', textAlign: 'center', letterSpacing: '0.1em' }}>
                    Redirecting to Results Console…
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pipeline-status"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="sp-card" style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>ENCODING CONFIGURATION</span>
                </div>
                <div style={{ padding: 20 }}>
                  {[
                    { k: 'Method',       v: transform ? (transform.method === 'jpeg2000' ? 'JPEG2000' : 'JPEG') : '—' },
                    { k: 'Wavelet',      v: transform?.method === 'jpeg2000' ? transform.waveletFilter?.toUpperCase() : 'DCT' },
                    { k: 'Decomp.',      v: transform?.method === 'jpeg2000' ? `Level ${transform.decompositionLevel}` : 'N/A' },
                    { k: 'Quant. Type',  v: quant ? quant.quantizationType : '—' },
                    { k: 'Step Size',    v: quant?.lossless ? '— (lossless)' : `Δ ${quant?.stepSize}` },
                    { k: 'Image Type',   v: upload?.imageType || '—' },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', background: 'var(--paper-3)', padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage counter */}
          {isRunning && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2 }}
              style={{ padding: '12px 18px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--cyan)', textTransform: 'uppercase' }}>
                Stage {Math.max(0, currentStep + 1)} of {PIPELINE_STAGES.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {(elapsed / 1000).toFixed(1)}s elapsed
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
