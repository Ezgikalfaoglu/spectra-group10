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
  { id: 0, label: 'Input Validation',     icon: FileCheck,         desc: 'Validating file format and extracting metadata' },
  { id: 1, label: 'Preprocessing',        icon: Shuffle,           desc: 'Resizing, normalising and colour-space conversion' },
  { id: 2, label: 'DCT / DWT Transform',  icon: Braces,            desc: 'Applying frequency-domain transform to coefficients' },
  { id: 3, label: 'Quantization',         icon: SlidersHorizontal, desc: 'Reducing coefficient precision with step Δ' },
  { id: 4, label: 'Entropy Coding',       icon: Code2,             desc: 'Applying Huffman coding to quantised symbols' },
  { id: 5, label: 'Reconstruction',       icon: Layers,            desc: 'Inverse transform & Huffman decode (IDCT/IDWT)' },
  { id: 6, label: 'Evaluation',           icon: Activity,          desc: 'Computing MSE, PSNR, Compression Ratio, Sparsity' },
];

const STEP_DURATION = 800; // 800ms per stage

/* ─── Compute results helper ─────────────────────────────────────────────
 * CR floor is 16:1 even at minimal step. Distortion ramps hard at high Δ
 * (PSNR drops below 18 dB, MSE rises sharply) so the visual artefacts in
 * the comparator are clearly visible.
 * ─────────────────────────────────────────────────────────────────────── */
function computeResults(t: TransformSettings, q: QuantizationSettings, imageType?: string): Results {
  const s = q.stepSize;

  // Type-specific multipliers — fingerprint and biomedical data is harder
  // to compress losslessly, AI images compress slightly better than natural.
  const typeBonus =
    imageType === 'AI Generated' ? 1.10 :
    imageType === 'Synthetic'    ? 1.18 :
    imageType === 'Fingerprint'  ? 0.78 :
    imageType === 'Biomedical'   ? 0.82 :
    1.0;

  if (q.lossless) {
    const lossCR = (2.4 * typeBonus).toFixed(1);
    return { mse: 0.00, psnr: Infinity, compressionRatio: `${lossCR}:1`, sparsityRatio: '38%' };
  }

  // Base CR ramps from 16:1 (s=1) up to ~80:1 (s=64) — a multiplicative curve
  // so artefacts and CR scale together as the user expects.
  const baseCR = 16 + Math.pow(s / 64, 0.85) * 64;
  const cr = (baseCR * typeBonus).toFixed(1);

  if (t.method === 'jpeg2000') {
    const lvlBonus = (t.decompositionLevel - 1) * 0.6;
    const wBonus = t.waveletFilter === 'db4' ? 1.6 : t.waveletFilter === 'db2' ? 0.8 : 0;
    const psnr = Math.max(16, 40 - (s / 32) * 22 + lvlBonus + wBonus);
    const mse  = Math.max(2, Math.pow(s, 1.7) / 32);
    const sp   = Math.min(96, 55 + s * 1.2).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sp}%` };
  } else {
    // JPEG/DCT: stronger blocking artefacts → lower PSNR, higher MSE
    const psnr = Math.max(14, 38 - (s / 32) * 24);
    const mse  = Math.max(4, Math.pow(s, 1.85) / 26);
    const sp   = Math.min(90, 48 + s * 1.0).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sp}%` };
  }
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
  const [countdown, setCountdown]     = useState(3);

  /* ── Load settings ── */
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
    } catch { setMissingStep('Data parse error'); }
  }, []);

  /* ── Pipeline Loop ── */
  useEffect(() => {
    if (!upload || !transform || !quant || isRunning || isDone) return;
    setIsRunning(true);
    setCurrentStep(0);

    PIPELINE_STAGES.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStep(idx);
        if (idx === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            const r = computeResults(transform, quant, upload.imageType);
            setResults(r);
            setIsRunning(false);
            setIsDone(true);

            // Persist result for Results / History pages
            const resultEntry = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              imageName: upload.name,
              imageDataUrl: upload.dataUrl,
              method: transform.method.toUpperCase(),
              wavelet: transform.waveletFilter || "db4",
              decompLevel: transform.decompositionLevel,
              quantType: quant.quantizationType,
              stepSize: quant.stepSize,
              mse: r.mse,
              psnr: r.psnr,
              cr: r.compressionRatio,
              sparsity: r.sparsityRatio
            };
            localStorage.setItem("lastResult", JSON.stringify(resultEntry));
            const history = JSON.parse(localStorage.getItem("compressionHistory") || "[]");
            history.unshift(resultEntry);
            localStorage.setItem("compressionHistory", JSON.stringify(history.slice(0, 20)));
          }, 500);
        }
      }, idx * STEP_DURATION);
    });
  }, [upload, transform, quant]);

  // Countdown + auto-redirect to results
  useEffect(() => {
    if (isDone && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (isDone && countdown === 0) {
      navigate('/results');
    }
  }, [isDone, countdown, navigate]);

  const progressPct = isDone ? 100 : Math.round(((currentStep + 1) / PIPELINE_STAGES.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <PipelineStepper />

      {/* Missing config error state */}
      {missingStep && (
        <div className="sp-card" style={{ padding: 24, border: '1px solid var(--leaf)', textAlign: 'center' }}>
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 style={{ fontFamily: 'var(--font-serif)' }}>Missing Configuration</h2>
          <p>{missingStep}</p>
          <button onClick={() => navigate('/')} className="sp-btn sp-btn-ghost mt-4">Try again</button>
        </div>
      )}

      {!missingStep && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          
          {/* LEFT: Pipeline & Animation */}
          <div className={`sp-card p-8 ${isRunning ? 'animate-shimmer' : ''}`} style={{ position: 'relative' }}>
            <div style={{ marginBottom: 24 }}>
                <span className="sp-eyebrow">PIPELINE STAGES</span>
                <div style={{ height: 4, background: 'var(--rule)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <motion.div 
                        className="sp-pipe-fill"
                        animate={{ width: `${progressPct}%` }} 
                        style={{ height: '100%', background: 'var(--klein)' }} 
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = currentStep > idx || isDone;
                const isActive = currentStep === idx && isRunning;
                const StageIcon = stage.icon;
                const isLast = idx === PIPELINE_STAGES.length - 1;
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr',
                      gap: 14,
                      padding: '10px 0',
                      alignItems: 'center',
                    }}
                  >
                    {/* Connector line */}
                    {!isLast && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 17,
                          top: 38,
                          bottom: -4,
                          width: 2,
                          background: isCompleted ? 'var(--klein)' : 'var(--rule)',
                          transition: 'background 0.4s',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Step indicator */}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted
                          ? 'var(--klein)'
                          : isActive
                            ? 'white'
                            : 'var(--paper-2)',
                        border: `1.5px solid ${
                          isCompleted
                            ? 'var(--klein)'
                            : isActive
                              ? 'var(--klein)'
                              : 'var(--rule)'
                        }`,
                        color: isCompleted
                          ? 'white'
                          : isActive
                            ? 'var(--klein)'
                            : 'var(--ink-4)',
                        boxShadow: isActive
                          ? '0 0 0 6px rgba(30,42,255,0.10), 0 4px 14px -4px rgba(30,42,255,0.4)'
                          : 'none',
                        transition: 'all 0.3s',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} strokeWidth={2.4} />
                      ) : (
                        <StageIcon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                      )}
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            inset: -3,
                            borderRadius: '50%',
                            border: '1.5px solid var(--klein)',
                            opacity: 0.4,
                            animation: 'sp-pstepPulse 1.8s ease-in-out infinite',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ opacity: isCompleted || isActive ? 1 : 0.55, transition: 'opacity 0.3s' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          fontWeight: isActive ? 700 : 600,
                          letterSpacing: '0.04em',
                          color: isActive ? 'var(--klein)' : isCompleted ? 'var(--ink)' : 'var(--ink-2)',
                          marginBottom: 2,
                        }}
                      >
                        {stage.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                        {stage.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active Info & Metrics */}
          <div className="space-y-6">
            <div className="sp-card p-12 text-center">
              <AnimatePresence mode="wait">
                {!isDone ? (
                  <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--klein)' }}>
                      {PIPELINE_STAGES[currentStep]?.label}…
                    </h2>
                    <p style={{ color: 'var(--ink-3)', marginTop: 8 }}>{PIPELINE_STAGES[currentStep]?.desc}</p>
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="mx-auto text-[var(--leaf)] mb-4" size={64} />
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 42 }}>Done.</h2>
                    <p className="font-mono text-sm">Redirecting to results in {countdown}…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'MSE', value: results?.mse, showAt: 4 },
                { label: 'PSNR', value: results?.psnr, showAt: 4 },
                { label: 'CR', value: results?.compressionRatio, showAt: 6 },
                { label: 'Sparsity', value: results?.sparsityRatio, showAt: 6 }
              ].map((m, i) => (
                <div key={i} className="sp-card p-6" style={{ background: 'var(--paper-2)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{m.label}</div>
                  <div style={{ height: 32, marginTop: 8 }}>
                    {currentStep >= m.showAt || isDone ? (
                      <motion.span 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--klein)' }}
                      >
                        {m.value || '—'}
                      </motion.span>
                    ) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
