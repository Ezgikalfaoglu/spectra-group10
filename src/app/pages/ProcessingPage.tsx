import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, Shuffle, Braces, SlidersHorizontal, Code2,
  Layers, Activity, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { getProfile } from '../lib/imageTypeProfiles';

/* ─── Pipeline ─── */
const PIPELINE_STAGES = [
  { id: 0, label: 'Input Validation', icon: FileCheck, desc: 'File metadata extraction' },
  { id: 1, label: 'Preprocessing', icon: Shuffle, desc: 'Color space normalization' },
  { id: 2, label: 'DCT / DWT Transform', icon: Braces, desc: 'Frequency domain transform' },
  { id: 3, label: 'Quantization', icon: SlidersHorizontal, desc: 'Coefficient quantization' },
  { id: 4, label: 'Entropy Coding', icon: Code2, desc: 'Huffman encoding stage' },
  { id: 5, label: 'Reconstruction', icon: Layers, desc: 'Inverse transform' },
  { id: 6, label: 'Evaluation', icon: Activity, desc: 'Metric computation' },
];

const STEP_DURATION = 800;

/* metric speed */
function durationFor(v: number) {
  if (v > 50) return 1.6;
  if (v > 20) return 1.2;
  return 0.9;
}

export function ProcessingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [upload, setUpload] = useState<any>(null);
  const [step, setStep] = useState(-1);
  const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');
  const [error, setError] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>({});
  const [countdown, setCountdown] = useState(3);

  const failAt = params.get('fail') ? Number(params.get('fail')) : -1;

  const profile = useMemo(
    () => (upload ? getProfile(upload.imageType) : null),
    [upload]
  );

  /* LOAD UPLOAD */
  useEffect(() => {
    const u = localStorage.getItem('spectra_upload');
    if (!u) return navigate('/');
    setUpload(JSON.parse(u));
  }, []);

  /* PIPELINE */
  useEffect(() => {
    if (!upload) return;

    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        if (cancelled) return;

        setStep(i);

        /* FAIL SIMULATION */
        if (i === failAt) {
          setError({
            stage: i,
            msg: `${PIPELINE_STAGES[i].label} failed: simulated timeout`,
          });
          setStatus('error');
          return;
        }

        /* METRICS */
        if (i === 4) setMetrics((p: any) => ({ ...p, mse: 42.7, psnr: 31.8 }));
        if (i === 6) setMetrics((p: any) => ({ ...p, cr: 64.2, sparsity: 85 }));

        await new Promise(r => setTimeout(r, STEP_DURATION));
      }

      finish(upload);
    };

    run();
    return () => { cancelled = true; };
  }, [upload, failAt]);

  /* FINISH */
  const finish = (u: any) => {
    setStatus('done');

    const result = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageName: u.name,
      imageDataUrl: u.dataUrl,
      method: 'JPEG2000',
      ...metrics,
      cfg: {
        wavelet: 'db4',
        level: 3,
      },
    };

    localStorage.setItem('lastResult', JSON.stringify(result));

    const history = JSON.parse(localStorage.getItem('compressionHistory') || '[]');
    history.unshift(result);
    localStorage.setItem('compressionHistory', JSON.stringify(history.slice(0, 20)));
  };

  /* REDIRECT */
  useEffect(() => {
    if (status !== 'done') return;

    if (countdown === 0) navigate('/results');

    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [status, countdown]);

  return (
    <div className="sp-container max-w-6xl mx-auto px-6 py-10">

      {/* MAIN */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* ACTIVE CARD */}
          <div className={`sp-card p-10 text-center min-h-[320px] ${status === 'processing' ? 'animate-shimmer' : ''}`}>

            <AnimatePresence mode="wait">

              {status === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertTriangle size={48} color="#d4574c" />
                  <h2 className="font-serif text-2xl mt-3">Pipeline halted</h2>
                  <p className="font-mono text-xs mt-2 text-red-400">{error?.msg}</p>
                  <button onClick={() => location.reload()} className="sp-btn sp-btn-klein mt-4">
                    Retry
                  </button>
                </motion.div>
              )}

              {status === 'done' && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                  {/* TICK ABOVE */}
                  <CheckCircle2 size={64} color="var(--leaf)" />
                  <h1 className="font-serif text-5xl text-[var(--leaf)] mt-3 italic">
                    Done.
                  </h1>
                  <p className="font-mono text-xs mt-2">
                    Redirecting in {countdown}s
                  </p>
                </motion.div>
              )}

              {status === 'processing' && (
                <motion.div>
                  <h2 className="font-serif italic text-3xl text-[var(--klein)]">
                    {PIPELINE_STAGES[step]?.label}
                  </h2>

                  <p className="text-sm text-gray-500 mt-2">
                    {PIPELINE_STAGES[step]?.desc}
                  </p>

                  {profile && (
                    <p className="font-mono text-xs mt-4"
                      style={{ color: profile.accent }}>
                      {profile.label} · {profile.blurb.split('.')[0]}
                    </p>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* LOG STRIP */}
          <div className="p-6 bg-black text-white rounded-md font-mono text-xs">
            <div className="text-cyan-400 mb-3 tracking-widest">
              PIPELINE LOG
            </div>

            {PIPELINE_STAGES.map((s, i) => (
              <div key={i} style={{ opacity: step >= i ? 1 : 0.2 }}>
                <span className="text-cyan-400">
                  [00:0{i}:12]
                </span>
                <span className="ml-3">
                  {s.label.toLowerCase()} completed
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT METRICS */}
        <div className="space-y-4">

          {['mse', 'psnr', 'cr', 'sparsity'].map(k => (
            <div key={k} className="sp-card p-5">
              <div className="text-xs font-mono uppercase text-gray-400">{k}</div>

              <div className="text-3xl font-serif text-[var(--klein)]">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: durationFor(metrics[k] || 10) }}
                >
                  {metrics[k] ?? '—'}
                </motion.span>
              </div>

            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
