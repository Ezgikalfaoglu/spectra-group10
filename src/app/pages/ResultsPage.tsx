import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Download, RefreshCw, AlertCircle,
  TrendingUp, Activity, Cpu, Layers
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { ComparisonSlider, type ComparisonMode } from '../components/ComparisonSlider';
import { InsightCard } from '../components/InsightCard';
import { BlockArtifactFilter } from "../components/BlockArtifactFilter";
import { listProfiles } from '../lib/imageTypeProfiles';
const DEMO_IMAGE = 'https://images.unsplash.com/photo-1581447547509-711eb65cd5f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGUlMjBtb3VudGFpbiUyMGdyYXlzY2FsZSUyMG5hdHVyZXxlbnwxfHx8fDE3NzY3NjEzOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080';

const DEMO_RESULT = {
  id: 'DEMO', date: new Date().toISOString(),
  imageName: 'landscape_sample.tiff', method: 'JPEG2000',
  wavelet: 'db4', decompLevel: 3, quantType: 'scalar', stepSize: 18,
  mse: 42.73, psnr: 31.82, cr: '10.4:1', sparsity: '78%',
  imageDataUrl: DEMO_IMAGE,
  settings: { method: 'jpeg2000', waveletFilter: 'db4', decompositionLevel: 3, quantizationType: 'scalar', stepSize: 18 },
};
const JPEG_DEMO = { ...DEMO_RESULT, method: 'JPEG', wavelet: '—', decompLevel: '—', mse: 78.4, psnr: 29.2, cr: '8.9:1', sparsity: '62%' };

const CHART_DATA = [
  { stepSize: 4,  jpegPSNR: 38.2, jpeg2000PSNR: 40.1 },
  { stepSize: 8,  jpegPSNR: 35.1, jpeg2000PSNR: 37.4 },
  { stepSize: 12, jpegPSNR: 33.2, jpeg2000PSNR: 35.7 },
  { stepSize: 16, jpegPSNR: 31.8, jpeg2000PSNR: 34.1 },
  { stepSize: 20, jpegPSNR: 29.4, jpeg2000PSNR: 32.3 },
  { stepSize: 24, jpegPSNR: 27.8, jpeg2000PSNR: 30.5 },
  { stepSize: 32, jpegPSNR: 25.2, jpeg2000PSNR: 28.1 },
];
const CR_DATA = [
  { stepSize: 4,  jpegCR: 4.2,  jpeg2000CR: 5.1  },
  { stepSize: 8,  jpegCR: 6.8,  jpeg2000CR: 8.2  },
  { stepSize: 12, jpegCR: 8.9,  jpeg2000CR: 10.1 },
  { stepSize: 16, jpegCR: 10.2, jpeg2000CR: 11.8 },
  { stepSize: 20, jpegCR: 12.4, jpeg2000CR: 14.2 },
  { stepSize: 24, jpegCR: 14.8, jpeg2000CR: 17.1 },
  { stepSize: 32, jpegCR: 18.9, jpeg2000CR: 22.3 },
];
const RADAR_DATA = [
  { subject: 'PSNR', JPEG: 68, JPEG2000: 82 },
  { subject: 'Low MSE', JPEG: 58, JPEG2000: 75 },
  { subject: 'CR', JPEG: 72, JPEG2000: 78 },
  { subject: 'Sparsity', JPEG: 60, JPEG2000: 76 },
  { subject: 'Speed', JPEG: 90, JPEG2000: 72 },
  { subject: 'Quality', JPEG: 65, JPEG2000: 80 },
];
const TYPE_BENCHMARK = listProfiles().map(p => ({
  type: p.label,
  cr: 16 * p.crBonus + (p.stepSize / 64) * 64,
  psnr: p.forceLossless ? 45 : 38 - (p.stepSize / 32) * 16,
  fill: p.accent,
}));

type TabType = 'jpeg2000' | 'jpeg' | 'comparison';

const ttStyle = {
  backgroundColor: 'var(--paper-2)', borderColor: 'var(--rule)',
  color: 'var(--ink)', borderRadius: 8, fontSize: 12,
  boxShadow: 'var(--shadow-paper)', fontFamily: 'var(--font-mono)',
};

export function ResultsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('jpeg2000');
  const [lastResult, setLastResult] = useState<typeof DEMO_RESULT | null>(null);
  const [compareMode, setCompareMode] = useState<ComparisonMode>('split');
  const handleDownloadJSON = () => {
  const blob = new Blob(
    [JSON.stringify(currentResult, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'spectra-result.json';
  a.click();

  URL.revokeObjectURL(url);
};

  useEffect(() => {
    const stored = localStorage.getItem('lastResult');
    if (stored) { try { setLastResult(JSON.parse(stored)); } catch {} }
  }, []);

  const result = lastResult || DEMO_RESULT;
  const isDemo = !lastResult;
  const currentResult = activeTab === 'jpeg' ? JPEG_DEMO : result;
  const baselineResult = activeTab === 'jpeg2000' ? JPEG_DEMO : result;
  const imgSrc = currentResult.imageDataUrl || DEMO_IMAGE;
  const stepSize = currentResult.stepSize ?? 18;

  const renderDelta = (label: string, current: number, baseline: number) => {
    const betterIsLower = label === 'MSE';
    const delta = betterIsLower
      ? ((baseline - current) / baseline) * 100
      : ((current - baseline) / baseline) * 100;
    const improved = betterIsLower ? delta > 0 : delta > 0;
    const arrow = improved ? '↑' : '↓';
    const color = improved ? 'var(--leaf)' : 'rgba(212,87,76,1)';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color }}>
        <span>{arrow}</span>
        <span>{Math.abs(delta).toFixed(1)}%</span>
        <span style={{ color: 'var(--ink-4)' }}>
          vs {activeTab === 'jpeg2000' ? 'JPEG' : 'JPEG2000'}
        </span>
      </div>
    );
  };

  const normalizedProgress = (label: string) => {
    if (label === 'PSNR') return `${Math.min(100, Math.max(0, (currentResult.psnr / 40) * 100))}%`;
    if (label === 'MSE') return `${Math.min(100, Math.max(0, 100 - (currentResult.mse / 120) * 100))}%`;
    if (label === 'CR') return `${Math.min(100, Math.max(0, (parseFloat(currentResult.cr) / 24) * 100))}%`;
    if (label === 'Sparsity') return `${Math.min(100, Math.max(0, parseInt(currentResult.sparsity) ))}%`;
    return '0%';
  };

  return (
    <>
      <BlockArtifactFilter />
      <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="sp-eyebrow" style={{ marginBottom: 12 }}>RESULTS · BENCHMARK CONSOLE</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', fontVariationSettings: '"opsz" 72' }}>
            Quality <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>examination</em>.
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, textTransform: 'uppercase' }}>
            {isDemo ? 'Demo specimen · run a compression for real results' : `Specimen: ${result.imageName}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/upload" className="sp-btn sp-btn-klein sp-btn-sm">
            <RefreshCw style={{ width: 12, height: 12 }} />
            New Run
          </Link>
          <button onClick={handleDownloadJSON}className="sp-btn sp-btn-ghost sp-btn-sm">
          <Download style={{ width: 12, height: 12 }} />
            JSON
          </button>
        </div>
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div style={{ background: 'rgba(224,168,80,0.08)', border: '1px solid rgba(224,168,80,0.3)', borderRadius: 'var(--r-md)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <AlertCircle style={{ width: 16, height: 16, color: 'var(--amber)', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            Demo data. <Link to="/upload" style={{ color: 'var(--klein)', textDecoration: 'underline' }}>Run a compression</Link> via the pipeline to see your own results.
          </p>
        </div>
      )}

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'MSE', value: `${currentResult.mse?.toFixed?.(2) ?? currentResult.mse}`, hint: 'Lower is better', currentValue: currentResult.mse, baselineValue: baselineResult.mse },
          { label: 'PSNR', value: `${currentResult.psnr?.toFixed?.(2) ?? currentResult.psnr}`, unit: 'dB', hint: '> 30 dB threshold', currentValue: currentResult.psnr, baselineValue: baselineResult.psnr },
          { label: 'CR', value: currentResult.cr, hint: 'Size reduction', currentValue: parseFloat(currentResult.cr), baselineValue: parseFloat(baselineResult.cr) },
          { label: 'Sparsity', value: currentResult.sparsity, hint: 'Zero coefficients', currentValue: parseFloat(currentResult.sparsity), baselineValue: parseFloat(baselineResult.sparsity) },
        ].map(m => {
          const delta = renderDelta(m.label, m.currentValue, m.baselineValue);
          return (
            <div key={m.label} className="sp-card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'var(--klein)', borderRadius: '3px 0 0 3px' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 34, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.015em', marginBottom: 4 }}>
                {m.value}{(m as any).unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)', fontStyle: 'normal', marginLeft: 4 }}>{(m as any).unit}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.hint}</div>
              {delta}
              <div style={{ height: 4, width: normalizedProgress(m.label), background: 'var(--klein)', marginTop: 8, borderRadius: 999 }} />
            </div>
          );
        })}
      </div>

      {/* Insight */}
      <div style={{ marginBottom: 28 }}>
        <InsightCard
          metrics={{ mse: currentResult.mse, psnr: currentResult.psnr, cr: currentResult.cr, sparsity: currentResult.sparsity }}
          cfg={{
            method: currentResult.method,
            waveletFilter: typeof currentResult.wavelet === 'string' && currentResult.wavelet !== '—' ? currentResult.wavelet : undefined,
            decompositionLevel: typeof currentResult.decompLevel === 'number' ? currentResult.decompLevel : undefined,
            stepSize: currentResult.stepSize,
            quantizationType: currentResult.quantType,
          }}
          compareMethod={
            activeTab === 'jpeg'
              ? { method: 'JPEG2000', mse: DEMO_RESULT.mse, psnr: DEMO_RESULT.psnr }
              : { method: 'JPEG', mse: JPEG_DEMO.mse, psnr: JPEG_DEMO.psnr }
          }
        />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {([
          { key: 'jpeg2000', label: 'JPEG2000' },
          { key: 'jpeg',     label: 'JPEG' },
          { key: 'comparison', label: 'Charts' },
        ] as { key: TabType; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s', background: activeTab === tab.key ? 'var(--ink)' : 'transparent', color: activeTab === tab.key ? 'var(--paper)' : 'var(--ink-3)', boxShadow: activeTab === tab.key ? '0 2px 8px -2px rgba(10,11,14,0.3)' : 'none' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results tab content */}
      {activeTab !== 'comparison' && (
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="sp-card" style={{ overflow: 'hidden' }}>
          {/* Tab header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '3px 12px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: activeTab === 'jpeg2000' ? 'rgba(30,42,255,0.08)' : 'rgba(75,30,122,0.08)', color: activeTab === 'jpeg2000' ? 'var(--klein)' : 'var(--plum)', border: `1px solid ${activeTab === 'jpeg2000' ? 'rgba(30,42,255,0.2)' : 'rgba(75,30,122,0.2)'}` }}>
                {activeTab === 'jpeg2000' ? 'JPEG2000 (DWT)' : 'JPEG (DCT)'}
              </span>
              {activeTab === 'jpeg2000' && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{result.wavelet} · Level {result.decompLevel}</span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>Step Size: <span style={{ color: 'var(--ink)' }}>{currentResult.stepSize}</span></span>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Comparison slider */}
            <div style={{ position: "relative" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>COMPARATOR · DRAG THE HANDLE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{result.imageName}</span>
              </div>
              <div style={{ display: 'inline-flex', gap: 4, marginBottom: 12, padding: 4, background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)' }}>
                {(['split', 'reveal', 'lens'] as const).map(m => {
                  const active = compareMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCompareMode(m)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        fontWeight: active ? 600 : 500,
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--paper)' : 'var(--ink-3)',
                        boxShadow: active ? '0 2px 8px -2px rgba(10,11,14,0.3)' : 'none',
                        transition: 'all 0.18s',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <ComparisonSlider
                mode={compareMode}
                originalSrc={imgSrc}
                reconstructedSrc={imgSrc}
                originalFilter="none"
                reconstructedFilter={`
  blur(${stepSize > 22 ? 2.4 : stepSize > 16 ? 1.4 : 0.8}px)
  contrast(${stepSize > 22 ? 0.82 : stepSize > 16 ? 0.9 : 0.96})
  saturate(${stepSize > 20 ? 0.88 : 0.98})
  brightness(${stepSize > 20 ? 1.04 : 1.01})
  ${stepSize > 40 ? "url(#blockify)" : ""}
`}
              />
              {stepSize > 40 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.18) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    mixBlendMode: "overlay",
                    clipPath: "inset(0 0 0 var(--split, 50%))",
                  }}
                />
              )}
            </div>

            {/* Metrics table */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', padding: '10px 20px', background: 'var(--paper-3)', borderBottom: '1px solid var(--rule)' }}>
                  {['METRIC', 'VALUE', 'INTERPRETATION'].map(h => (
                    <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {[
                  { metric: 'MSE', value: `${currentResult.mse?.toFixed?.(2) ?? currentResult.mse}`, interp: currentResult.mse < 50 ? 'Good — low pixel distortion' : 'Moderate distortion detected' },
                  { metric: 'PSNR', value: `${currentResult.psnr?.toFixed?.(2) ?? currentResult.psnr} dB`, interp: currentResult.psnr >= 30 ? 'Acceptable quality (≥ 30 dB threshold)' : 'Below recommended threshold' },
                  { metric: 'Compression Ratio', value: currentResult.cr, interp: 'File size reduced significantly' },
                  { metric: 'Sparsity Ratio', value: currentResult.sparsity, interp: 'High proportion of zero coefficients' },
                ].map((row, i) => (
                  <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', padding: '14px 20px', borderBottom: i < 3 ? '1px solid var(--rule-soft)' : 'none', background: i % 2 === 0 ? 'white' : 'var(--paper-2)' }}>
                    <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{row.metric}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--klein)' }}>{row.value}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>{row.interp}</span>
                  </div>
                ))}
              </div>

              <div
                className="sp-card"
                style={{
                  padding: 20,
                  minWidth: 260,
                  maxWidth: 300,
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                    color: 'var(--cyan)',
                  }}
                >
                  HOW IS CR COMPUTED?
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                  }}
                >
                  CR = uncompressed_size / encoded_size

                  = (W × H × 8) / encoded_bits

                  PSNR = 10 · log₁₀(255² / MSE)
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts tab */}
      {activeTab === 'comparison' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="sp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <TrendingUp style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>PSNR vs Step Size</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
                  <XAxis dataKey="stepSize" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'var(--font-mono)' }} />
                  <Line type="monotone" dataKey="jpegPSNR" name="JPEG" stroke="var(--plum)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--paper-2)' }} />
                  <Line type="monotone" dataKey="jpeg2000PSNR" name="JPEG2000" stroke="var(--klein)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--paper-2)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="sp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Cpu style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>Compression Ratio</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={CR_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
                  <XAxis dataKey="stepSize" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)" />
                  <Tooltip contentStyle={ttStyle} cursor={{ fill: 'rgba(30,42,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'var(--font-mono)' }} />
                  <Bar dataKey="jpegCR" name="JPEG" fill="var(--plum)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="jpeg2000CR" name="JPEG2000" fill="var(--klein)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="sp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Activity style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>Method Performance Radar</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="var(--rule)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--ink-4)' }} stroke="var(--rule)" />
                  <Radar name="JPEG" dataKey="JPEG" stroke="var(--plum)" fill="var(--plum)" fillOpacity={0.18} />
                  <Radar name="JPEG2000" dataKey="JPEG2000" stroke="var(--klein)" fill="var(--klein)" fillOpacity={0.18} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <Tooltip contentStyle={ttStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="sp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Layers style={{ width: 14, height: 14, color: 'var(--klein)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>Head-to-Head</span>
              </div>
              <div style={{ borderTop: '1px solid var(--rule)' }}>
                {[
                  { metric: 'MSE',               jpeg: '78.4',     jpeg2000: '42.73',  winner: 'jpeg2000' },
                  { metric: 'PSNR (dB)',          jpeg: '29.2',     jpeg2000: '31.82',  winner: 'jpeg2000' },
                  { metric: 'Compression Ratio',  jpeg: '8.9:1',   jpeg2000: '10.4:1', winner: 'jpeg2000' },
                  { metric: 'Sparsity Ratio',     jpeg: '62%',     jpeg2000: '78%',    winner: 'jpeg2000' },
                  { metric: 'Processing Speed',   jpeg: 'Fast',    jpeg2000: 'Moderate',winner: 'jpeg'    },
                  { metric: 'Lossless Support',   jpeg: 'No',      jpeg2000: 'Yes',     winner: 'jpeg2000' },
                ].map(row => (
                  <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--rule-soft)', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{row.metric}</span>
                    <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px', borderRadius: 100, border: '1px solid', borderColor: row.winner === 'jpeg' ? 'rgba(75,30,122,0.3)' : 'var(--rule)', color: row.winner === 'jpeg' ? 'var(--plum)' : 'var(--ink-4)', background: row.winner === 'jpeg' ? 'rgba(75,30,122,0.05)' : 'transparent' }}>{row.jpeg}</span>
                    <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px', borderRadius: 100, border: '1px solid', borderColor: row.winner === 'jpeg2000' ? 'rgba(30,42,255,0.3)' : 'var(--rule)', color: row.winner === 'jpeg2000' ? 'var(--klein)' : 'var(--ink-4)', background: row.winner === 'jpeg2000' ? 'rgba(30,42,255,0.05)' : 'transparent' }}>{row.jpeg2000}</span>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, paddingTop: 14, marginTop: 4 }}>
                  <span />
                  <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', color: 'var(--plum)', textTransform: 'uppercase' }}>JPEG</span>
                  <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', color: 'var(--klein)', textTransform: 'uppercase' }}>JPEG2000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sp-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Layers style={{ width: 14, height: 14, color: 'var(--klein)' }}/>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--ink-2)',
                textTransform: 'uppercase'
              }}>
                Image-type Benchmark · trained presets
              </span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TYPE_BENCHMARK} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false}/>
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)"/>
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }} stroke="var(--rule)"/>
                <Tooltip contentStyle={ttStyle}/>

                <Bar dataKey="cr" name="CR" radius={[3,3,0,0]}>
                  {TYPE_BENCHMARK.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
      </motion.div>
    </>
  );
}
