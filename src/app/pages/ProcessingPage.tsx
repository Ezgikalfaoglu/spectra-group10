import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck, Shuffle, Braces, SlidersHorizontal, Code2,
  Layers, Activity, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';

const query = new URLSearchParams(window.location.search);
const failStep = query.get('fail') ? Number(query.get('fail')) : null;

interface UploadData {
  name: string; resolution: string; sizeKB: number;
  dataUrl: string; imageType: string;
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

const PIPELINE_STAGES = [
  { id: 0, label: 'Input', icon: FileCheck, desc: 'Validating input' },
  { id: 1, label: 'Preproc.', icon: Shuffle, desc: 'Preprocessing' },
  { id: 2, label: 'Transform', icon: Braces, desc: 'Applying DCT/DWT' },
  { id: 3, label: 'Quant.', icon: SlidersHorizontal, desc: 'Quantizing' },
  { id: 4, label: 'Entropy', icon: Code2, desc: 'Encoding' },
  { id: 5, label: 'Reconst.', icon: Layers, desc: 'Reconstruction' },
  { id: 6, label: 'Eval.', icon: Activity, desc: 'Metrics' },
];

const STEP_DURATION = 800;

function computeResults(t: TransformSettings, q: QuantizationSettings): Results {
  const s = q.stepSize;

  let psnr = 38 - s * 0.9;
  let mse = (s * s) / 180;
  let cr = 6 + s * 1.2;
  let sp = 50 + s * 1.1;

  psnr = Math.max(14, psnr);
  cr = Math.max(16, cr);

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    compressionRatio: `${cr.toFixed(1)}:1`,
    sparsityRatio: `${Math.min(98, sp).toFixed(0)}%`,
  };
}

export function ProcessingPage() {
  const navigate = useNavigate();

  const [upload, setUpload] = useState<UploadData | null>(null);
  const [transform, setTransform] = useState<TransformSettings | null>(null);
  const [quant, setQuant] = useState<QuantizationSettings | null>(null);

  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const u = localStorage.getItem('spectra_upload');
    const t = localStorage.getItem('spectra_transform');
    const q = localStorage.getItem('spectra_quantization');

    if (!u || !t || !q) return;

    setUpload(JSON.parse(u));
    setTransform(JSON.parse(t));
    setQuant(JSON.parse(q));
  }, []);


  useEffect(() => {
    if (!upload || !transform || !quant) return;

    setIsRunning(true);
    setCurrentStep(0);

    PIPELINE_STAGES.forEach((_, idx) => {
      setTimeout(() => {

      
        if (failStep !== null && idx === failStep) {
          setErrorStage(idx);
          setIsRunning(false);
          return;
        }

        setCurrentStep(idx);

        if (idx === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            const r = computeResults(transform, quant);
            setResults(r);
            setIsRunning(false);
            setIsDone(true);

            const entry = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              imageName: upload.name,
              mse: r.mse,
              psnr: r.psnr,
              cr: r.compressionRatio,
              sparsity: r.sparsityRatio,
              imageDataUrl: upload.dataUrl,
            };

            const history = JSON.parse(localStorage.getItem('compressionHistory') || '[]');
            history.unshift(entry);

            localStorage.setItem('compressionHistory', JSON.stringify(history));
            localStorage.setItem('lastResult', JSON.stringify(entry));

          }, 500);
        }

      }, idx * STEP_DURATION);
    });

  }, [upload, transform, quant]);

  useEffect(() => {
    if (!isDone) return;

    const t = setInterval(() => {
      setCountdown((c) => {
        if (c === 1) navigate('/results');
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isDone]);

  if (errorStage !== null) {
    return (
      <div style={{ textAlign: 'center', marginTop: 120 }}>
        <AlertTriangle size={50} color="orange" />
        <h2>Stage Failed</h2>
        <p>{PIPELINE_STAGES[errorStage].label}</p>
        <button className="sp-btn sp-btn-ghost" onClick={() => window.location.reload()}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (isDone && results) {
    return (
      <div style={{ textAlign: 'center', marginTop: 120 }}>
        <CheckCircle2 size={64} color="var(--leaf)" />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40 }}>Done.</h1>
        <p>Sonuçlara yönlendiriliyorsunuz... {countdown}</p>
      </div>
    );
  }

  const progress = (currentStep / (PIPELINE_STAGES.length - 1)) * 100;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>

      <PipelineStepper />

      {/* ACTIVE STAGE */}
      {isRunning && currentStep >= 0 && (
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--klein)'
          }}>
            {PIPELINE_STAGES[currentStep].label}…
          </h2>

          <p>{PIPELINE_STAGES[currentStep].desc}</p>

          {/* TYPE TEXT */}
          <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {upload?.imageType === 'Fingerprint'
              ? 'Lossless mode active — preserving every minutia'
              : upload?.imageType === 'AI Generated'
              ? 'Tuned for diffusion noise'
              : 'Standard compression pipeline'}
          </p>
        </div>
      )}

      {/* PROGRESS */}
      <div style={{ height: 6, background: '#ddd', borderRadius: 10 }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'var(--cyan)',
          transition: '0.4s'
        }} />
      </div>

      {/* STEPS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30 }}>
        {PIPELINE_STAGES.map((s, i) => {
          const state =
            i < currentStep ? 'done' :
            i === currentStep ? 'active' : 'wait';

          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className={
                state === 'done'
                  ? 'sp-pstep-dot sp-pstep-dot-done'
                  : state === 'active'
                  ? 'sp-pstep-dot sp-pstep-dot-active'
                  : 'sp-pstep-dot'
              }>
                {state === 'done' ? '✔' : ''}
              </div>
              <small>{s.label}</small>
            </div>
          );
        })}
      </div>

      {/* PROCESS LOG */}
      <div style={{
        marginTop: 20,
        background: '#0f1115',
        color: '#9ef',
        padding: 14,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 11
      }}>
        {PIPELINE_STAGES.slice(0, currentStep + 1).map((s, i) => (
          <div key={i}>
            <span style={{ color: '#00D4FF' }}>
              [{(i * STEP_DURATION / 1000).toFixed(2)}s]
            </span>
            {' '}
            {s.label} completed
          </div>
        ))}
      </div>

    </div>
  );
}
