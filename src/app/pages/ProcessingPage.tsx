import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router'; 
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, Shuffle, Braces, SlidersHorizontal, Code2,
  Layers, Activity, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { getProfile } from '../lib/imageTypeProfiles';

/* ─── Pipeline Configuration ─── */
const PIPELINE_STAGES = [
  { id: 0, label: 'Input Validation',     icon: FileCheck,         desc: 'Validating file format and extracting metadata.' },
  { id: 1, label: 'Preprocessing',        icon: Shuffle,           desc: 'Resizing, normalising and colour-space conversion.' },
  { id: 2, label: 'DCT / DWT Transform',  icon: Braces,            desc: 'Applying frequency-domain transform to coefficients.' },
  { id: 3, label: 'Quantization',         icon: SlidersHorizontal, desc: 'Reducing coefficient precision with step size Δ.' },
  { id: 4, label: 'Entropy Coding',       icon: Code2,             desc: 'Generating Huffman tree and encoding symbols.' },
  { id: 5, label: 'Reconstruction',       icon: Layers,            desc: 'Applying inverse transform and Huffman decoding.' },
  { id: 6, label: 'Evaluation',           icon: Activity,          desc: 'Computing MSE, PSNR, Compression Ratio, and Sparsity.' },
];

const STEP_DURATION = 800;

function durationFor(value: number) {
  if (value > 50) return 1.6; 
  if (value > 20) return 1.2; 
  return 0.9;
}

export function ProcessingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  
  const [upload, setUpload] = useState<any>(null);
  const [config, setConfig] = useState<any>(null); // Önceki sayfadan gelen ayarlar
  const [currentStep, setCurrentStep] = useState(-1);
  const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');
  const [error, setError] = useState<{stage: number, msg: string} | null>(null);
  const [metrics, setMetrics] = useState<any>({});
  const [countdown, setCountdown] = useState(3);

  const failAt = params.get('fail') ? +params.get('fail')! : -1;
  const profile = useMemo(() => (upload ? getProfile(upload.imageType) : null), [upload]);

  useEffect(() => {
    // 🔗 BAĞLANTI NOKTASI: Önceki sayfadan gelen verileri çekiyoruz
    const rawUpload = localStorage.getItem('spectra_upload');
    const rawConfig = localStorage.getItem('spectra_config'); // Ayarlar burada

    if (!rawUpload) {
      console.error("No upload data found, redirecting...");
      navigate('/'); 
      return;
    }

    const uploadData = JSON.parse(rawUpload);
    const configData = rawConfig ? JSON.parse(rawConfig) : { method: 'JPEG2000' };
    
    setUpload(uploadData);
    setConfig(configData);

    let isCancelled = false;

    const runPipeline = async () => {
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        if (isCancelled) return;
        if (i === failAt) {
          setError({ stage: i, msg: `${PIPELINE_STAGES[i].label} failed: simulated network timeout` });
          setStatus('error');
          return;
        }
        setCurrentStep(i);
        // Dinamik metrik simülasyonu
        if (i === 4) setMetrics((p: any) => ({ ...p, mse: 42.73, psnr: 31.82 }));
        if (i === 6) setMetrics((p: any) => ({ ...p, cr: 64.2, sparsity: 85 }));
        
        await new Promise(r => setTimeout(r, STEP_DURATION));
      }
      handleFinish(uploadData, configData);
    };

    runPipeline();
    return () => { isCancelled = true; };
  }, [failAt, navigate]);

  const handleFinish = (uploadData: any, configData: any) => {
    setStatus('done');
    const result = {
      ...metrics,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageName: uploadData.name,
      imageDataUrl: uploadData.dataUrl,
      method: configData.method || "JPEG2000",
      cfg: configData // InsightCard'ın beklediği config objesi
    };
    
    localStorage.setItem("lastResult", JSON.stringify(result));
    const history = JSON.parse(localStorage.getItem("compressionHistory") || "[]");
    history.unshift(result);
    localStorage.setItem("compressionHistory", JSON.stringify(history.slice(0, 10)));
  };

  useEffect(() => {
    if (status === 'done' && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (status === 'done' && countdown === 0) {
      navigate('/results');
    }
  }, [status, countdown, navigate]);

  return (
    <div className="sp-container py-12 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className={`sp-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[360px] ${status === 'processing' ? 'animate-shimmer' : ''}`}>
            <AnimatePresence mode="wait">
              {status === 'error' ? (
                <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                  <AlertTriangle className="mb-4" size={48} color="#d4574c" />
                  <h3 className="text-2xl font-serif mb-2">Pipeline Halted</h3>
                  <p className="font-mono text-xs text-red-400 mb-6">{error?.msg}</p>
                  <button onClick={() => navigate('/')} className="sp-btn sp-btn-klein">Return to Upload</button>
                </motion.div>
              ) : status === 'done' ? (
                <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                  <CheckCircle2 className="text-[var(--leaf)] mb-4" size={64} />
                  <h2 className="text-5xl font-serif mb-2 text-[var(--leaf)]">Done.</h2>
                  <p className="text-sm text-gray-400 font-mono italic">Redirecting to results in {countdown}s...</p>
                </motion.div>
              ) : (
                <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                  <h2 className="text-4xl font-serif italic text-[var(--klein)] mb-3">
                    {PIPELINE_STAGES[currentStep]?.label}…
                  </h2>
                  <p className="text-gray-500 text-sm max-w-md">{PIPELINE_STAGES[currentStep]?.desc}</p>
                  
                  {profile && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: profile.accent, marginTop: 20, letterSpacing: '0.02em' }}>
                      Tuned for {profile.label.toLowerCase()} · {profile.blurb.split('.')[0]}.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{
            padding: '24px', background: 'var(--ink)', color: 'var(--paper)',
            borderRadius: 'var(--r-md)', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8,
          }}>
            <div style={{ color: 'var(--cyan)', letterSpacing: '0.2em', fontSize: 10, textTransform: 'uppercase', marginBottom: 12, fontWeight: 'bold' }}>
              ◆ PIPELINE LOG · TAIL
            </div>
            <div className="space-y-1 text-left w-full">
              {PIPELINE_STAGES.map((s, idx) => (
                <div key={idx} style={{ opacity: currentStep >= idx ? 1 : 0.2, transition: 'opacity 0.4s' }}>
                  <span style={{ color: 'var(--cyan)' }}>[03:14:{22 + idx}.{idx}08]</span> 
                  <span className="ml-3">{s.label.toLowerCase()} · execution successful</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {['MSE', 'PSNR', 'CR', 'Sparsity'].map((label) => {
            const val = metrics[label.toLowerCase()];
            return (
              <div key={label} className="sp-card p-6 bg-[var(--paper-2)] border-none">
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="text-3xl font-serif text-[var(--klein)] h-10 flex items-center">
                  {val ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: durationFor(val) }}>
                      {label === 'CR' ? `${val}:1` : label === 'Sparsity' ? `%${val}` : val}
                    </motion.span>
                  ) : <span className="text-gray-200">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
