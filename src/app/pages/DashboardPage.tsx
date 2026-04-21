import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileImage, X, AlertCircle, CheckCircle2,
  Play, RotateCcw, Save, ChevronUp, ChevronDown,
  ZoomIn, Info, SlidersHorizontal, Layers,
  Cpu, Braces, Activity, FileCheck, Shuffle, Code2,
  GitCompare
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DWTSubbandsViz } from '../components/DWTSubbandsViz';
import { InsightCard } from '../components/InsightCard';

type AppState = 'idle' | 'uploaded' | 'fileError' | 'processing' | 'complete';

interface UploadedFile {
  name: string; format: string; resolution: string;
  colorMode: string; sizeKB: number; dataUrl: string;
}
interface Settings {
  imageType: string;
  method: 'jpeg' | 'jpeg2000';
  waveletFilter: string;
  decompositionLevel: number;
  quantizationType: 'uniform' | 'scalar';
  stepSize: number;
  lossless: boolean;
}
interface Results {
  mse: number; psnr: number; compressionRatio: string; sparsityRatio: string;
}

const SUPPORTED_EXTS = ['png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff'];

const PIPELINE_STAGES = [
  { id: 0, label: 'Input Validation', icon: FileCheck, desc: 'Validating file format and extracting metadata' },
  { id: 1, label: 'Preprocessing', icon: Shuffle, desc: 'Resizing, normalizing and color space conversion' },
  { id: 2, label: 'DCT / DWT Transform', icon: Braces, desc: 'Applying frequency-domain transform' },
  { id: 3, label: 'Quantization', icon: SlidersHorizontal, desc: 'Reducing coefficient precision with step size' },
  { id: 4, label: 'Entropy Coding', icon: Code2, desc: 'Applying Huffman coding to quantized data' },
  { id: 5, label: 'Reconstruction', icon: Layers, desc: 'Decoding and inverse transform (IDCT/IDWT)' },
  { id: 6, label: 'Evaluation', icon: Activity, desc: 'Computing MSE, PSNR, Compression Ratio, Sparsity' },
];

const CHART_DATA = [
  { stepSize: 4,  jpegPSNR: 38.2, jpeg2000PSNR: 40.1, jpegCR: 4.2,  jpeg2000CR: 5.1 },
  { stepSize: 8,  jpegPSNR: 35.1, jpeg2000PSNR: 37.4, jpegCR: 6.8,  jpeg2000CR: 8.2 },
  { stepSize: 12, jpegPSNR: 33.2, jpeg2000PSNR: 35.7, jpegCR: 8.9,  jpeg2000CR: 10.1 },
  { stepSize: 16, jpegPSNR: 31.8, jpeg2000PSNR: 34.1, jpegCR: 10.2, jpeg2000CR: 11.8 },
  { stepSize: 20, jpegPSNR: 29.4, jpeg2000PSNR: 32.3, jpegCR: 12.4, jpeg2000CR: 14.2 },
  { stepSize: 24, jpegPSNR: 27.8, jpeg2000PSNR: 30.5, jpegCR: 14.8, jpeg2000CR: 17.1 },
  { stepSize: 32, jpegPSNR: 25.2, jpeg2000PSNR: 28.1, jpegCR: 18.9, jpeg2000CR: 22.3 },
];

function computeResults(settings: Settings): Results {
  const s = settings.stepSize;
  if (settings.method === 'jpeg2000') {
    const levelBonus = (settings.decompositionLevel - 1) * 0.4;
    const waveletBonus = settings.waveletFilter === 'db4' ? 1.2 : settings.waveletFilter === 'db2' ? 0.6 : 0;
    const psnr = Math.max(22, 38.5 - (s / 32) * 16 + levelBonus + waveletBonus);
    const mse = Math.max(3, (s * s) / (255 * 0.6 + s));
    const cr = (5 + (s / 4) * 2.1).toFixed(1);
    const sparsity = Math.min(95, 55 + s * 1.2).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sparsity}%` };
  } else {
    const psnr = Math.max(20, 36.5 - (s / 32) * 14);
    const mse = Math.max(5, (s * s) / (255 * 0.5 + s));
    const cr = (4 + (s / 4) * 1.8).toFixed(1);
    const sparsity = Math.min(88, 45 + s * 1.0).toFixed(0);
    return { mse: +mse.toFixed(2), psnr: +psnr.toFixed(2), compressionRatio: `${cr}:1`, sparsityRatio: `${sparsity}%` };
  }
}

const tooltipStyle = {
  backgroundColor: 'var(--paper-2)',
  borderColor: 'var(--rule)',
  color: 'var(--ink)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: 'var(--shadow-paper)',
  fontFamily: 'var(--font-mono)',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [appState, setAppState] = useState<AppState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [errorFileName, setErrorFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [results, setResults] = useState<Results | null>(null);
  const [settings, setSettings] = useState<Settings>({
    imageType: 'natural',
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 3,
    quantizationType: 'scalar',
    stepSize: 18,
    lossless: false,
  });

  const isLosslessType = ['fingerprint', 'biomedical'].includes(settings.imageType);
  const isProcessing = appState === 'processing';
  const canRun = (appState === 'uploaded' || appState === 'complete') && !isProcessing;

  const processFile = useCallback((file: File) => {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!SUPPORTED_EXTS.includes(ext)) {
      setErrorFileName(file.name);
      setAppState('fileError');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setUploadedFile({
          name: file.name, format: ext.toUpperCase(),
          resolution: `${img.width} × ${img.height}`,
          colorMode: 'Grayscale', sizeKB: Math.round(file.size / 1024), dataUrl,
        });
        setResults(null); setAppState('uploaded');
      };
      img.onerror = () => {
        setUploadedFile({
          name: file.name, format: ext.toUpperCase(),
          resolution: '1024 × 1024', colorMode: 'Grayscale',
          sizeKB: Math.round(file.size / 1024), dataUrl,
        });
        setResults(null); setAppState('uploaded');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const runCompression = () => {
    if (!canRun) return;
    setAppState('processing'); setProcessingStep(0); setResults(null);
    PIPELINE_STAGES.forEach((_, idx) => {
      setTimeout(() => {
        setProcessingStep(idx);
        if (idx === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            const r = computeResults(settings);
            setResults(r); setAppState('complete');
            const historyEntry = {
              id: `RUN-${Date.now().toString(36).toUpperCase()}`,
              date: new Date().toISOString(),
              imageName: uploadedFile?.name || 'unknown',
              method: settings.method.toUpperCase(),
              wavelet: settings.method === 'jpeg2000' ? settings.waveletFilter : '—',
              decompLevel: settings.method === 'jpeg2000' ? settings.decompositionLevel : '—',
              quantType: settings.quantizationType,
              stepSize: settings.stepSize,
              mse: r.mse, psnr: r.psnr,
              cr: r.compressionRatio, sparsity: r.sparsityRatio,
              imageDataUrl: uploadedFile?.dataUrl || '',
              settings: { ...settings },
            };
            const history = JSON.parse(localStorage.getItem('compressionHistory') || '[]');
            history.unshift(historyEntry);
            localStorage.setItem('compressionHistory', JSON.stringify(history.slice(0, 20)));
            localStorage.setItem('lastResult', JSON.stringify({ ...historyEntry, file: uploadedFile }));
          }, 600);
        }
      }, idx * 700);
    });
  };

  const reset = () => {
    setAppState('idle'); setUploadedFile(null); setResults(null);
    setProcessingStep(-1); setErrorFileName('');
  };

  const resetParams = () => {
    setSettings({
      imageType: 'natural', method: 'jpeg2000', waveletFilter: 'db4',
      decompositionLevel: 3, quantizationType: 'scalar', stepSize: 18, lossless: false,
    });
  };

  useEffect(() => {
    if (isLosslessType) setSettings(s => ({ ...s, lossless: true }));
  }, [isLosslessType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <div className="sp-eyebrow" style={{ marginBottom: 12 }}>WORKSPACE · COMPRESSION ATELIER</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3vw, 48px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', fontVariationSettings: '"opsz" 72' }}>
          Configure & <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>run</em> the pipeline.
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Upload a specimen · select transform · dial parameters · observe quality metrics
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── LEFT RAIL ── */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80, zIndex: 10 }}>
          <UploadCard
            appState={appState} uploadedFile={uploadedFile}
            errorFileName={errorFileName} isDragging={isDragging}
            isProcessing={isProcessing} fileInputRef={fileInputRef}
            dropZoneRef={dropZoneRef} onDrop={handleDrop}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onFileSelect={handleFileSelect}
            onBrowse={() => fileInputRef.current?.click()}
            onRetry={reset} onRemove={reset}
          />

          <SettingsCard
            settings={settings} setSettings={setSettings}
            isProcessing={isProcessing} isLosslessType={isLosslessType}
          />

          {/* Action buttons */}
          <div className="sp-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={runCompression}
              disabled={!canRun}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: canRun ? 'var(--klein)' : 'var(--paper-3)',
                color: canRun ? 'white' : 'var(--ink-4)',
                padding: '14px 20px', borderRadius: 100, border: 'none', cursor: canRun ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, letterSpacing: '0.01em',
                boxShadow: canRun ? '0 4px 16px -4px rgba(30,42,255,0.4)' : 'none',
                transition: 'all 0.22s',
              }}
            >
              <Play style={{ width: 14, height: 14 }} />
              Run Compression
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetParams} disabled={isProcessing}
                className="sp-btn sp-btn-ghost sp-btn-sm"
                style={{ flex: 1, justifyContent: 'center', opacity: isProcessing ? 0.5 : 1 }}
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                Reset
              </button>
              {appState === 'complete' && (
                <button
                  onClick={() => navigate('/results')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(31,138,94,0.08)', color: 'var(--leaf)', border: '1px solid rgba(31,138,94,0.25)', borderRadius: 100, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                >
                  <Save style={{ width: 13, height: 13 }} />
                  Full Results
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN STAGE ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AnimatePresence mode="wait">
            {appState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IdleState onBrowse={() => fileInputRef.current?.click()} />
              </motion.div>
            )}
            {appState === 'fileError' && (
              <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <FileErrorBanner fileName={errorFileName} onRetry={reset} />
              </motion.div>
            )}
            {appState === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <ProcessingStatusCard currentStep={processingStep} method={settings.method} settings={settings} />
              </motion.div>
            )}
            {appState === 'complete' && results && uploadedFile && (
              <motion.div key="complete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <ResultsSideBySide file={uploadedFile} settings={settings} />
                <MetricsPanel results={results} />
                <InsightCard
                  metrics={{ mse: results.mse, psnr: results.psnr, cr: results.compressionRatio, sparsity: results.sparsityRatio }}
                  cfg={settings}
                />
                <ComparisonCharts tooltipStyle={tooltipStyle} />
              </motion.div>
            )}
            {appState === 'uploaded' && (
              <motion.div key="uploaded" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ReadyToRunCard settings={settings} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Upload Card ─── */
function UploadCard({ appState, uploadedFile, errorFileName, isDragging, isProcessing, fileInputRef, dropZoneRef, onDrop, onDragOver, onDragLeave, onFileSelect, onBrowse, onRetry, onRemove }: any) {
  const isError = appState === 'fileError';
  const hasFile = appState === 'uploaded' || appState === 'processing' || appState === 'complete';

  return (
    <div className="sp-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileImage style={{ width: 14, height: 14, color: 'var(--klein)' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>SPECIMEN UPLOAD</span>
      </div>
      <div style={{ padding: 20 }}>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".png,.jpg,.jpeg,.bmp,.tif,.tiff" onChange={onFileSelect} />

        {!hasFile && (
          <div
            ref={dropZoneRef} onDrop={onDrop} onDragOver={onDragOver}
            onDragLeave={onDragLeave} onClick={onBrowse}
            style={{
              border: `2px dashed ${isError ? '#d4574c' : isDragging ? 'var(--klein)' : 'var(--rule)'}`,
              borderRadius: 'var(--r-md)', padding: '32px 16px', textAlign: 'center',
              cursor: 'pointer', background: isDragging ? 'rgba(30,42,255,0.03)' : isError ? 'rgba(212,87,76,0.03)' : 'white',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: `1px solid ${isError ? '#d4574c' : 'var(--rule)'}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {isError
                ? <AlertCircle style={{ width: 20, height: 20, color: '#d4574c' }} />
                : <Upload style={{ width: 20, height: 20, color: isDragging ? 'var(--klein)' : 'var(--ink-4)' }} />
              }
            </div>
            {isError ? (
              <div>
                <p style={{ color: '#d4574c', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Unsupported Format</p>
                <p style={{ color: 'var(--ink-3)', fontSize: 11, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>&ldquo;{errorFileName}&rdquo;</p>
                <button onClick={(e) => { e.stopPropagation(); onRetry(); }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--klein)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
                  TRY AGAIN
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--ink)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {isDragging ? 'DROP TO UPLOAD' : 'CLICK OR DROP FILE'}
                </p>
                <p style={{ color: 'var(--ink-4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>PNG · BMP · TIFF · JPG/JPEG</p>
              </div>
            )}
          </div>
        )}

        {hasFile && uploadedFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--rule)' }}>
              <img src={uploadedFile.dataUrl} alt="Preview" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
              {!isProcessing && (
                <button onClick={onRemove} style={{ position: 'absolute', top: 10, right: 10, background: '#d4574c', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(30,42,255,0.9)', color: 'white', padding: '3px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em' }}>
                {uploadedFile.format}
              </div>
              <span style={{ position: 'absolute', top: 10, left: 10, width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 0 3px rgba(0,212,255,0.2)', display: 'inline-block' }} />
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--r-sm)', padding: '10px 14px', border: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'File Name', value: uploadedFile.name },
                { label: 'Resolution', value: uploadedFile.resolution },
                { label: 'Color Mode', value: uploadedFile.colorMode },
                { label: 'File Size', value: `${uploadedFile.sizeKB} KB` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Settings Card ─── */
function SettingsCard({ settings, setSettings, isProcessing, isLosslessType }: any) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s: Settings) => ({ ...s, [key]: value }));

  return (
    <div className="sp-card" style={{ overflow: 'hidden', opacity: isProcessing ? 0.5 : 1, pointerEvents: isProcessing ? 'none' : 'auto' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SlidersHorizontal style={{ width: 14, height: 14, color: 'var(--klein)' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>PARAMETERS</span>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Image type */}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>Image Type</label>
          <div style={{ position: 'relative' }}>
            <select value={settings.imageType} onChange={e => update('imageType', e.target.value)} className="sp-select"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236C7183' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: 36 }}>
              <option value="natural">Natural (Landscape, Portrait)</option>
              <option value="computer-generated">Computer-Generated (Synthetic)</option>
              <option value="hybrid">Hybrid</option>
              <option value="fingerprint">Fingerprint</option>
              <option value="biomedical">Biomedical</option>
            </select>
          </div>
        </div>

        {/* Method segmented */}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>Transform Method</label>
          <div className="sp-seg">
            {(['jpeg', 'jpeg2000'] as const).map(m => (
              <button key={m} onClick={() => update('method', m)} className={`sp-seg-btn ${settings.method === m ? 'sp-seg-btn-active' : ''}`}>
                {m === 'jpeg' ? 'JPEG (DCT)' : 'J2K (DWT)'}
              </button>
            ))}
          </div>
        </div>

        {/* JPEG2000-specific */}
        <AnimatePresence>
          {settings.method === 'jpeg2000' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>Wavelet Filter</label>
                <select value={settings.waveletFilter} onChange={e => update('waveletFilter', e.target.value)} className="sp-select"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236C7183' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: 36 }}>
                  <option value="haar">Haar</option>
                  <option value="db2">Daubechies-2 (db2)</option>
                  <option value="db4">Daubechies-4 (db4)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Decomp. Level</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)', padding: '2px 8px', background: 'rgba(30,42,255,0.06)', borderRadius: 100 }}>{settings.decompositionLevel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => update('decompositionLevel', Math.max(1, settings.decompositionLevel - 1))}
                    style={{ width: 34, height: 34, borderRadius: 8, background: 'white', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
                    <ChevronDown style={{ width: 14, height: 14 }} />
                  </button>
                  <div style={{ flex: 1, display: 'flex', gap: 4, padding: 3, background: 'var(--paper-3)', borderRadius: 8, border: '1px solid var(--rule)' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => update('decompositionLevel', n)}
                        style={{ flex: 1, height: 28, borderRadius: 6, border: settings.decompositionLevel === n ? '1px solid rgba(30,42,255,0.3)' : 'none', background: settings.decompositionLevel === n ? 'white' : 'transparent', color: settings.decompositionLevel === n ? 'var(--klein)' : 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => update('decompositionLevel', Math.min(5, settings.decompositionLevel + 1))}
                    style={{ width: 34, height: 34, borderRadius: 8, background: 'white', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
                    <ChevronUp style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantization type */}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>Quantization Type</label>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['uniform', 'scalar'] as const).map(q => (
              <label key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input type="radio" checked={settings.quantizationType === q} onChange={() => update('quantizationType', q)}
                    style={{ appearance: 'none', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${settings.quantizationType === q ? 'var(--klein)' : 'var(--rule)'}`, cursor: 'pointer', transition: 'border-color 0.2s', outline: 'none', background: 'white' }} />
                  {settings.quantizationType === q && <span style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'var(--klein)', pointerEvents: 'none' }} />}
                </div>
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500, textTransform: 'capitalize' }}>{q}</span>
              </label>
            ))}
          </div>
          <code style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--klein)', background: 'rgba(30,42,255,0.05)', padding: '4px 10px', borderRadius: 6, marginTop: 8, border: '1px solid rgba(30,42,255,0.12)' }}>
            {settings.quantizationType === 'uniform' ? 'q = floor(x / step_size)' : 'q = round(x / step_size)'}
          </code>
        </div>

        {/* Step size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Quantization Step Size</label>
            <input type="number" min={1} max={64} value={settings.stepSize}
              onChange={e => update('stepSize', Math.max(1, Math.min(64, +e.target.value)))}
              style={{ width: 56, background: 'white', border: '1px solid var(--rule)', borderRadius: 8, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--klein)', textAlign: 'center', outline: 'none' }} />
          </div>
          <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 3, background: 'var(--paper-3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((settings.stepSize - 1) / 63) * 100}%`, background: 'var(--klein)', borderRadius: 3 }} />
            </div>
            <input type="range" min={1} max={64} value={settings.stepSize}
              onChange={e => update('stepSize', +e.target.value)}
              style={{ position: 'absolute', left: 0, right: 0, height: 3, opacity: 0, cursor: 'pointer', zIndex: 2, width: '100%' }} />
            <div className="sp-slider-thumb" style={{ position: 'absolute', left: `${((settings.stepSize - 1) / 63) * 100}%`, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 1 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.1em' }}>
            <span>Low (Quality)</span>
            <span>High (Compression)</span>
          </div>
        </div>

        {/* Lossless toggle */}
        <AnimatePresence>
          {isLosslessType && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'rgba(30,42,255,0.04)', border: '1px solid rgba(30,42,255,0.15)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--klein)', textTransform: 'uppercase', marginBottom: 2 }}>Lossless Mode</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Recommended for {settings.imageType}</div>
                </div>
                <button onClick={() => update('lossless', !settings.lossless)}
                  style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: settings.lossless ? 'var(--klein)' : 'var(--rule)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: settings.lossless ? 'calc(100% - 21px)' : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', display: 'block' }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

/* ─── Idle State ─── */
function IdleState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="sp-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(30,42,255,0.06)', border: '1px solid rgba(30,42,255,0.15)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <Upload style={{ width: 32, height: 32, color: 'var(--klein)' }} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em', fontWeight: 400 }}>
        Awaiting a <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>specimen</em>.
      </h3>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
        Initialize the compression pipeline by uploading a high-resolution source file. Compatible with PNG, BMP, TIFF, and JPEG.
      </p>
      <button onClick={onBrowse} className="sp-btn sp-btn-klein">
        <FileImage style={{ width: 14, height: 14 }} />
        Browse Files
      </button>
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 32, borderTop: '1px solid var(--rule)' }}>
        {[
          { icon: Cpu, label: 'DCT / DWT', desc: 'Transform algorithms' },
          { icon: SlidersHorizontal, label: 'Quantization', desc: 'Uniform or scalar' },
          { icon: Activity, label: 'PSNR / MSE', desc: 'Quality metrics' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s' }}>
            <Icon style={{ width: 20, height: 20, color: 'var(--ink-3)', margin: '0 auto 10px' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── File Error Banner ─── */
function FileErrorBanner({ fileName, onRetry }: { fileName: string; onRetry: () => void }) {
  return (
    <div style={{ background: 'rgba(212,87,76,0.04)', border: '1px solid rgba(212,87,76,0.25)', borderRadius: 'var(--r-lg)', padding: 24 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'rgba(212,87,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertCircle style={{ width: 20, height: 20, color: '#d4574c' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: '#d4574c', textTransform: 'uppercase', marginBottom: 6 }}>Format Exception</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
            Module rejected <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d4574c', background: 'rgba(212,87,76,0.08)', padding: '2px 6px', borderRadius: 4 }}>{fileName}</code>. The processing pipeline requires specific raster formats.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {['PNG', 'BMP', 'TIFF', 'TIF', 'JPG', 'JPEG'].map(f => (
              <span key={f} style={{ background: 'white', border: '1px solid rgba(212,87,76,0.2)', color: '#d4574c', padding: '3px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>.{f.toLowerCase()}</span>
            ))}
          </div>
          <button onClick={onRetry} className="sp-btn sp-btn-sm" style={{ background: '#d4574c', color: 'white', borderRadius: 100, border: 'none', cursor: 'pointer', gap: 8 }}>
            <Upload style={{ width: 12, height: 12 }} />
            Upload Different File
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ready to Run ─── */
function ReadyToRunCard({ settings }: { settings: Settings }) {
  return (
    <div style={{ background: 'rgba(30,42,255,0.03)', border: '1px solid rgba(30,42,255,0.15)', borderRadius: 'var(--r-lg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '40%', aspectRatio: '1/1', background: 'radial-gradient(circle, rgba(30,42,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'rgba(30,42,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info style={{ width: 20, height: 20, color: 'var(--klein)' }} />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--klein)', textTransform: 'uppercase', marginBottom: 6 }}>System Ready · Awaiting Execution</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
            Input verified. Review configuration parameters before initializing the pipeline.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              settings.method.toUpperCase(),
              ...(settings.method === 'jpeg2000' ? [settings.waveletFilter, `L${settings.decompositionLevel}`] : []),
              `${settings.quantizationType} Q`,
              `Step ${settings.stepSize}`,
            ].map(tag => (
              <span key={tag} style={{ background: 'white', border: '1px solid rgba(30,42,255,0.2)', color: 'var(--klein)', padding: '3px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Processing Status ─── */
function ProcessingStatusCard({ currentStep, method, settings }: { currentStep: number; method: string; settings: Settings }) {
  const total = PIPELINE_STAGES.length;
  const progress = ((currentStep + 1) / total) * 100;
  const isTransformStage = currentStep === 2 || currentStep === 5;
  const isJ2K = method === 'jpeg2000';

  return (
    <div className="sp-card" style={{ overflow: 'hidden' }}>
      {/* Progress header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 100% 50%, rgba(30,42,255,0.06), transparent 60%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, position: 'relative' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 0 3px rgba(0,212,255,0.2)', display: 'inline-block', animation: 'sp-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>PIPELINE EXECUTING</span>
        </div>
        <code style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--klein)', marginBottom: 14, position: 'relative' }}>
          &gt; init {method.toUpperCase()}_transform_module ...
        </code>
        <div style={{ position: 'relative' }}>
          <div style={{ height: 3, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
            <div className="sp-pipe-fill" style={{ width: `${progress}%`, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
            <span>STEP {currentStep + 1} / {total}</span>
            <span style={{ color: 'var(--klein)' }}>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isJ2K ? '1fr auto' : '1fr', gap: 16, padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div key={stage.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: isActive ? 'rgba(30,42,255,0.04)' : 'transparent',
                border: isActive ? '1px solid rgba(30,42,255,0.15)' : '1px solid transparent',
                opacity: !isDone && !isActive ? 0.4 : 1,
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isDone ? 'rgba(31,138,94,0.08)' : isActive ? 'rgba(30,42,255,0.08)' : 'white', border: `1px solid ${isDone ? 'rgba(31,138,94,0.2)' : isActive ? 'rgba(30,42,255,0.2)' : 'var(--rule)'}` }}>
                  {isDone ? <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--leaf)' }} /> : <Icon style={{ width: 14, height: 14, color: isActive ? 'var(--klein)' : 'var(--ink-4)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: isActive ? 'var(--klein)' : isDone ? 'var(--ink)' : 'var(--ink-4)', fontWeight: isActive ? 500 : 400 }}>
                    {stage.label}
                  </div>
                  {isActive && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                      &gt; {stage.desc} ...
                    </motion.div>
                  )}
                </div>
                {isActive && <div style={{ width: 16, height: 16, border: '2px solid rgba(30,42,255,0.15)', borderTopColor: 'var(--klein)', borderRadius: '50%', animation: 'sp-spin 0.8s linear infinite', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        {isJ2K && (
          <div style={{ background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 220 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 12 }}>Live DWT Sub-bands</div>
            <DWTSubbandsViz level={settings.decompositionLevel} active={isTransformStage} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Results side by side ─── */
function ResultsSideBySide({ file, settings }: { file: UploadedFile; settings: Settings }) {
  return (
    <div className="sp-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GitCompare style={{ width: 14, height: 14, color: 'var(--klein)' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Visual <em style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 400 }}>comparison</em>
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{file.resolution} · {file.colorMode}</span>
      </div>
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Original */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>SPECIMEN A · ORIGINAL</span>
            <ZoomIn style={{ width: 14, height: 14, color: 'var(--ink-4)' }} />
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--rule)', aspectRatio: '4/3' }}>
            <img src={file.dataUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(6px)', color: 'white', padding: '4px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', textTransform: 'uppercase' }}>SRC · {file.sizeKB} KB</div>
          </div>
        </div>
        {/* Reconstructed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--klein)', textTransform: 'uppercase' }}>SPECIMEN B · RECONSTRUCTED</span>
            <ZoomIn style={{ width: 14, height: 14, color: 'var(--ink-4)' }} />
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid rgba(30,42,255,0.3)', aspectRatio: '4/3', boxShadow: '0 0 0 1px rgba(30,42,255,0.08)' }}>
            <img src={file.dataUrl} alt="Reconstructed" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: `contrast(${settings.stepSize > 20 ? 0.9 : 0.96}) brightness(${settings.stepSize > 20 ? 1.03 : 1.01})` }} />
            <motion.div animate={{ top: ['-10%', '110%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(0,212,255,0.5)', filter: 'blur(1px)' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(30,42,255,0.9)', color: 'white', padding: '4px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {settings.method.toUpperCase()} OUT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Metrics Panel ─── */
function MetricsPanel({ results }: { results: Results }) {
  const cards = [
    { label: 'MSE', value: results.mse.toFixed(2), unit: '', hint: 'Mean Squared Error', quality: results.mse < 30 ? 'optimal' : results.mse < 60 ? 'nominal' : 'suboptimal' },
    { label: 'PSNR', value: results.psnr.toFixed(2), unit: 'dB', hint: 'Peak Signal-to-Noise Ratio', quality: results.psnr >= 35 ? 'optimal' : results.psnr >= 30 ? 'nominal' : 'suboptimal' },
    { label: 'CR', value: results.compressionRatio, unit: '', hint: 'Compression Ratio', quality: 'nominal' },
    { label: 'Sparsity', value: results.sparsityRatio, unit: '', hint: 'Zero Coefficients', quality: 'nominal' },
  ];
  const qColor: Record<string, string> = { optimal: 'var(--leaf)', nominal: 'var(--amber)', suboptimal: '#d4574c' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} className="sp-card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: qColor[c.quality], borderRadius: '3px 0 0 3px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{c.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: qColor[c.quality], textTransform: 'uppercase', padding: '2px 7px', background: `${qColor[c.quality]}18`, borderRadius: 100 }}>{c.quality}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.015em', marginBottom: 4 }}>
            {c.value}{c.unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)', fontStyle: 'normal', marginLeft: 4 }}>{c.unit}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.hint}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Comparison Charts ─── */
function ComparisonCharts({ tooltipStyle }: { tooltipStyle: object }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <div className="sp-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Activity style={{ width: 14, height: 14, color: 'var(--klein)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>PSNR vs Step Size</span>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
            <XAxis dataKey="stepSize" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'var(--font-mono)' }} />
            <Line type="monotone" dataKey="jpegPSNR" name="JPEG" stroke="var(--plum)" strokeWidth={2} dot={{ r: 3, fill: 'var(--paper-2)' }} />
            <Line type="monotone" dataKey="jpeg2000PSNR" name="JPEG2000" stroke="var(--klein)" strokeWidth={2} dot={{ r: 3, fill: 'var(--paper-2)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="sp-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Cpu style={{ width: 14, height: 14, color: 'var(--klein)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>Compression Ratio</span>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
            <XAxis dataKey="stepSize" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(30,42,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'var(--font-mono)' }} />
            <Bar dataKey="jpegCR" name="JPEG" fill="var(--plum)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="jpeg2000CR" name="JPEG2000" fill="var(--klein)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
