import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { InsightCard } from '../components/InsightCard';
import { UploadCloud, Image, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { listProfiles } from '../lib/imageTypeProfiles';

type Method = 'jpeg' | 'jpeg2000';

type Result = {
  mse: number;
  psnr: number;
  cr: string;
  sparsity: string;
  method: Method;
  stepSize: number;
  imageDataUrl: string;
};

type HistoryEntry = {
  id: string;
  date: string;
  imageName: string;
  method: Method | 'JPEG' | 'JPEG2000';
  stepSize: number;
  mse: number;
  psnr: number;
  cr: string;
  sparsity: string;
  imageDataUrl: string;
  type?: string;
};

const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'];

const placeholderImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540"><rect width="100%" height="100%" fill="#14161d"/><text x="50%" y="44%" dominant-baseline="middle" text-anchor="middle" fill="#9aa0b7" font-family="system-ui, sans-serif" font-size="28">Upload an image</text><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#6b708d" font-family="system-ui, sans-serif" font-size="16">then compare original and processed</text></svg>`
  );

function generateMockResult(method: Method, stepSize: number): Omit<Result, 'method' | 'stepSize' | 'imageDataUrl'> {
  const base = method === 'jpeg2000'
    ? { psnrOffset: 42, mseOffset: 3.2, crBase: 5.2, sparsityBase: 32 }
    : { psnrOffset: 38, mseOffset: 5.4, crBase: 4.0, sparsityBase: 24 };

  const psnr = Math.max(18, base.psnrOffset - stepSize * (method === 'jpeg2000' ? 0.24 : 0.3));
  const mse = Math.min(220, Math.max(1.2, base.mseOffset + stepSize * (method === 'jpeg2000' ? 0.65 : 0.8)));
  const cr = (base.crBase + stepSize * (method === 'jpeg2000' ? 0.142 : 0.12)).toFixed(1);
  const sparsity = Math.min(95, Math.max(14, base.sparsityBase + stepSize * (method === 'jpeg2000' ? 1.4 : 1.1))).toFixed(0);

  return {
    mse: +mse.toFixed(2),
    psnr: +psnr.toFixed(2),
    cr: `${cr}:1`,
    sparsity: `${sparsity}%`,
  };
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const previousValue = useRef(value);

  useEffect(() => {
    const start = previousValue.current;
    const change = value - start;
    const duration = 640;
    let startTime: number | null = null;

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplay(start + change * progress);
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(step);
      } else {
        previousValue.current = value;
      }
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, decimals]);

  return <>{display.toFixed(decimals)}</>;
}

function SevenStepStepper({ activeStep }: { activeStep: number }) {
  const steps = ['Upload', 'Inspect', 'Configure', 'Quantize', 'Encode', 'Analyze', 'Review'];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="sp-eyebrow">PIPELINE</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Compression workflow</div>
        </div>
        <span className="sp-tag" style={{ fontSize: 11, padding: '6px 10px' }}>7 steps</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {steps.map((label, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 18,
                background: isActive ? 'rgba(30,42,255,0.08)' : 'var(--paper-2)',
                border: `1px solid ${isActive ? 'var(--klein)' : isComplete ? 'rgba(31,138,94,0.15)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: isActive ? 'var(--klein)' : isComplete ? 'var(--leaf)' : 'rgba(255,255,255,0.06)',
                  color: isActive || isComplete ? 'white' : 'var(--ink-4)',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {isComplete ? '✓' : index + 1}
              </div>
              <div style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Step {index + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<Method>('jpeg');
  const [stepSize, setStepSize] = useState(18);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const profiles = listProfiles();

  useEffect(() => {
    const saved = window.localStorage.getItem('compressionHistory');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as HistoryEntry[];
      setHistory(parsed.slice(0, 20));
    } catch {
      setHistory([]);
    }
  }, []);

  const handleUploadFile = useCallback((file: File) => {
    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      window.alert(`Unsupported image type: .${extension}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage({ name: file.name, dataUrl });
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleUploadFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleUploadFile(file);
  };

  const runCompression = () => {
    if (!uploadedImage || isProcessing) return;
    setIsProcessing(true);

    window.setTimeout(() => {
      const generated = generateMockResult(method, stepSize);
      const newResult: Result = {
        ...generated,
        method,
        stepSize,
        imageDataUrl: uploadedImage.dataUrl,
      };

      setResult(newResult);

      const nextEntry: HistoryEntry = {
        id: `run-${Date.now()}`,
        date: new Date().toISOString(),
        imageName: uploadedImage.name,
        method,
        stepSize,
        mse: newResult.mse,
        psnr: newResult.psnr,
        cr: newResult.cr,
        sparsity: newResult.sparsity,
        imageDataUrl: uploadedImage.dataUrl,
      };

      const updatedHistory = [nextEntry, ...history].slice(0, 20);
      setHistory(updatedHistory);
      window.localStorage.setItem('compressionHistory', JSON.stringify(updatedHistory));
      setIsProcessing(false);
    }, 1500);
  };

  const runPreset = (p: ReturnType<typeof listProfiles>[number]) => {
    const newResult: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageName: `${p.label}_sample.jpg`,
      method: 'JPEG2000',
      stepSize: p.stepSize,
      mse: +(Math.random() * 50 + 20).toFixed(2),
      psnr: +(40 - p.stepSize / 2).toFixed(2),
      cr: `${(10 + p.crBonus * 10).toFixed(1)}:1`,
      sparsity: `${Math.floor(60 + p.crBonus * 20)}%`,
      imageDataUrl: placeholderImage,
      type: p.type,
    };

    const updated = [newResult, ...history].slice(0, 20);

    setHistory(updated);
    localStorage.setItem('compressionHistory', JSON.stringify(updated));
  };

  const currentOriginal = uploadedImage?.dataUrl ?? placeholderImage;
  const currentProcessed = result?.imageDataUrl ?? uploadedImage?.dataUrl ?? placeholderImage;
  const lastThreeRuns = useMemo(() => history.slice(0, 3), [history]);
  const canRun = Boolean(uploadedImage) && !isProcessing;
  const activeStep = result ? 6 : uploadedImage ? 3 : 1;

  return (
    <div style={{ padding: '28px 24px', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="sp-eyebrow">DASHBOARD</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, color: 'var(--ink)' }}>
            JPEG / JPEG2000 Compression Studio
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink-4)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            <Sparkles style={{ width: 18, height: 18, color: 'var(--cyan)' }} /> Configure input, run simulation, review metrics.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr) 290px', gap: 24, alignItems: 'start' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="sp-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UploadCloud style={{ width: 22, height: 22, color: 'var(--klein)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Image upload</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-4)' }}>Drag and drop or click to select an image.</p>
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="sp-card"
              style={{
                minHeight: 192,
                border: '1px dashed var(--rule)',
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 14,
                background: isDragging ? 'rgba(30,42,255,0.06)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Image style={{ width: 42, height: 42, color: 'var(--ink-3)' }} />
              <div style={{ textAlign: 'center', color: 'var(--ink-4)' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Drop or click to upload</p>
                <p style={{ margin: 0, fontSize: 12 }}>PNG, JPG, JPEG, BMP, GIF, WEBP</p>
              </div>
              <button type="button" className="sp-btn sp-btn-klein" style={{ minWidth: 120 }}>
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>

            {uploadedImage ? (
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
                <div><strong>Name:</strong> {uploadedImage.name}</div>
                <div><strong>Method:</strong> {method.toUpperCase()}</div>
                <div><strong>Step size:</strong> {stepSize}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No image uploaded yet.</div>
            )}
          </section>

          <section className="sp-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText style={{ width: 20, height: 20, color: 'var(--ink)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Method & step size</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-4)' }}>Adjust the compression mode and quality parameter.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['jpeg', 'jpeg2000'] as Method[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className="sp-btn sp-btn-klein"
                  style={{
                    background: method === option ? 'var(--klein)' : 'var(--paper-2)',
                    color: method === option ? 'white' : 'var(--ink)',
                  }}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Step size</span>
                <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>{stepSize}</span>
              </div>
              <input
                type="range"
                min={2}
                max={48}
                step={1}
                value={stepSize}
                onChange={(event) => setStepSize(Number(event.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </section>

          <section className="sp-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              type="button"
              onClick={runCompression}
              disabled={!canRun}
              className="sp-btn sp-btn-klein"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: canRun ? 'var(--klein)' : 'var(--paper-2)',
                color: canRun ? 'white' : 'var(--ink-4)',
                cursor: canRun ? 'pointer' : 'not-allowed',
              }}
            >
              {isProcessing ? 'Processing...' : result ? 'Done' : 'Run'}
            </button>
            {result ? (
              <button
                type="button"
                onClick={() => navigate('/results')}
                className="sp-btn sp-btn-klein"
                style={{ background: 'var(--leaf)', color: 'white', borderColor: 'transparent' }}
              >
                Jump to results
              </button>
            ) : null}
          </section>
        </aside>

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="sp-card" style={{ padding: 24 }}>
            <SevenStepStepper activeStep={activeStep} />
          </section>

          <section className="sp-card" style={{ padding: 16, minHeight: 540 }}>
            <ComparisonSlider originalSrc={currentOriginal} reconstructedSrc={currentProcessed} />
          </section>
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="sp-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="sp-eyebrow">OBSERVATION</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Metric summary</div>
              </div>
              <Sparkles style={{ width: 20, height: 20, color: 'var(--cyan)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'MSE', value: result?.mse ?? 0, suffix: '', decimals: 2 },
                { label: 'PSNR', value: result?.psnr ?? 0, suffix: ' dB', decimals: 2 },
                { label: 'Compression Ratio', value: result ? parseFloat(result.cr) : 0, suffix: ':1', decimals: 1 },
                { label: 'Sparsity', value: result ? parseFloat(result.sparsity) : 0, suffix: '%', decimals: 0 },
              ].map((metric) => (
                <div key={metric.label} className="sp-metric-item" style={{ padding: 16, borderRadius: 18, background: 'var(--paper-2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                    {metric.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif)' }}>
                      <CountUp value={metric.value} decimals={metric.decimals} />
                    </span>
                    <span style={{ color: 'var(--ink-4)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{metric.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sp-card" style={{ padding: 22 }}>
            <InsightCard
              metrics={{
                mse: result?.mse ?? 0,
                psnr: result?.psnr ?? 0,
                cr: result?.cr ?? '0:1',
                sparsity: result?.sparsity ?? '0%',
              }}
              cfg={{
                method: method.toUpperCase(),
                waveletFilter: method === 'jpeg2000' ? 'db4' : 'dct',
                decompositionLevel: method === 'jpeg2000' ? 3 : 0,
                stepSize,
                quantizationType: 'scalar',
              }}
            />
          </section>

          <section className="sp-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="sp-eyebrow">HISTORY</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Last 3 runs</div>
              </div>
              <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--leaf)' }} />
            </div>

            {lastThreeRuns.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--ink-4)', fontSize: 13 }}>No compression history yet. Run the pipeline to fill this panel.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {lastThreeRuns.map((entry) => (
                  <div key={entry.id} style={{ borderRadius: 18, padding: 14, background: 'var(--paper-2)', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                      <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{entry.imageName}</strong>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
                      <span>{entry.method.toUpperCase()} · step {entry.stepSize}</span>
                      <span>MSE {entry.mse.toFixed(2)} · PSNR {entry.psnr.toFixed(1)} dB</span>
                      <span>{entry.cr} · {entry.sparsity}</span>
                    </div>
                    <button
                      type="button"
                      className="sp-btn sp-btn-klein"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        setUploadedImage({ name: entry.imageName, dataUrl: entry.imageDataUrl });
                        setMethod(entry.method === 'JPEG2000' ? 'jpeg2000' : 'jpeg');
                        setStepSize(entry.stepSize);
                        setResult({ ...entry, method: entry.method === 'JPEG2000' ? 'jpeg2000' : 'jpeg', stepSize: entry.stepSize, imageDataUrl: entry.imageDataUrl });
                      }}
                    >
                      Reload run
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--ink-3)',
            marginBottom: 12,
            textTransform: 'uppercase'
          }}
        >
          TYPE BENCHMARK PRESETS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {profiles.map(p => (
            <div
              key={p.type}
              className="sp-card"
              style={{
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: `1px solid ${p.accent}33`
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: p.accent,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}
              >
                {p.label}
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Step: {p.stepSize}
              </div>

              <button
                onClick={() => runPreset(p)}
                className="sp-btn sp-btn-klein"
              >
                Run preset
              </button>
            </div>
          ))}
        </div>
      </div>
   </div>
    </div>
  );
}
