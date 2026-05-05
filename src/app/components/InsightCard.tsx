import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Lightbulb, Target } from 'lucide-react';

type Metric = { mse: number; psnr: number; cr: string; sparsity: string };
type Cfg = { method?: string; waveletFilter?: string; decompositionLevel?: number; stepSize?: number; quantizationType?: string };

export function InsightCard({ metrics, cfg, compareMethod }: {
  metrics: Metric;
  cfg: Cfg;
  compareMethod?: { method: string; mse: number; psnr: number };
}) {
  const qualityScore = Math.min(100, Math.max(0, ((metrics.psnr - 20) / 25) * 100));
  const qualityLabel = metrics.psnr >= 35 ? 'Excellent' : metrics.psnr >= 30 ? 'Nominal' : 'Suboptimal';

  const method = cfg.method ?? 'JPEG2000';
  const stepSize = cfg.stepSize ?? 18;
  const isJ2K = method.toLowerCase().includes('2000');
  const mseDelta = compareMethod ? ((compareMethod.mse - metrics.mse) / compareMethod.mse) * 100 : 0;
  const psnrDelta = compareMethod ? metrics.psnr - compareMethod.psnr : 0;

  const suggestions: { icon: typeof Lightbulb; text: string }[] = [];
  if (metrics.psnr < 30) {
    suggestions.push({ icon: TrendingDown, text: `Step size ${stepSize} is aggressive. Try ${Math.max(2, Math.round(stepSize / 2))} for higher PSNR.` });
  }
  if (isJ2K && (cfg.decompositionLevel ?? 0) < 3) {
    suggestions.push({ icon: Lightbulb, text: `Increase decomposition level to 3–4 for finer wavelet sub-bands and better sparsity.` });
  }
  if (isJ2K && cfg.waveletFilter === 'haar') {
    suggestions.push({ icon: Lightbulb, text: `Try db4 wavelet for smoother natural images — Haar is better for binary/fingerprint data.` });
  }
  if (metrics.psnr >= 35 && suggestions.length === 0) {
    suggestions.push({ icon: Target, text: `Configuration is near-optimal. Push step size to ${stepSize + 4} for higher compression while staying above 30 dB.` });
  }

  const narrative = isJ2K
    ? `JPEG2000 with ${cfg.waveletFilter} at level ${cfg.decompositionLevel} produced ${qualityLabel.toLowerCase()} fidelity. The ${cfg.quantizationType} quantizer preserved dominant wavelet coefficients while zeroing out ${metrics.sparsity} — ideal for multi-resolution reconstruction.`
    : `JPEG (DCT) achieved ${qualityLabel.toLowerCase()} quality at step ${stepSize}. Block-based 8×8 transform is fast but may introduce visible blocking at step > 20.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sp-insight"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, position: 'relative' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4 }}>◆ ATELIER INSIGHT</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, color: 'var(--paper)', letterSpacing: '-0.01em' }}>Compression Analysis</div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100, border: '1px solid', borderColor: metrics.psnr >= 35 ? 'rgba(31,138,94,0.4)' : metrics.psnr >= 30 ? 'rgba(224,168,80,0.4)' : 'rgba(212,87,76,0.4)', color: metrics.psnr >= 35 ? 'var(--leaf)' : metrics.psnr >= 30 ? 'var(--amber)' : '#d4574c', background: 'rgba(10,11,14,0.3)', flexShrink: 0 }}>
          {qualityLabel}
        </span>
      </div>

      {/* Quality bar */}
      <div style={{ marginBottom: 18, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
          <span style={{ color: 'rgba(246,244,236,0.6)', textTransform: 'uppercase' }}>Quality Score</span>
          <span style={{ color: 'var(--paper)' }}>{qualityScore.toFixed(0)} / 100</span>
        </div>
        <div style={{ height: 3, background: 'rgba(246,244,236,0.12)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${qualityScore}%` }} transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', background: 'var(--cyan)', borderRadius: 3 }} />
        </div>
      </div>

      {/* Narrative */}
      <div style={{ borderTop: '1px solid rgba(246,244,236,0.1)', paddingTop: 16, marginBottom: 16, position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5, color: 'rgba(246,244,236,0.85)', fontWeight: 400, letterSpacing: '-0.01em' }}>
          {narrative.split(cfg.waveletFilter || '__NONE__').map((part, i, arr) => (
            i === arr.length - 1 ? part : <>{part}<em key={i} style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>{cfg.waveletFilter}</em></>
          ))}
        </p>
      </div>

      {/* Compare callout */}
      {compareMethod && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, position: 'relative' }}>
          {[
            { label: `vs ${compareMethod.method} · MSE`, delta: mseDelta, isUp: mseDelta > 0, label2: `${mseDelta > 0 ? '−' : '+'}${Math.abs(mseDelta).toFixed(1)}%` },
            { label: `vs ${compareMethod.method} · PSNR`, delta: psnrDelta, isUp: psnrDelta > 0, label2: `${psnrDelta > 0 ? '+' : ''}${psnrDelta.toFixed(2)} dB` },
          ].map(c => (
            <div key={c.label} style={{ background: 'rgba(246,244,236,0.06)', border: '1px solid rgba(246,244,236,0.1)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(246,244,236,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.isUp ? <TrendingUp style={{ width: 13, height: 13, color: 'var(--leaf)' }} /> : <TrendingDown style={{ width: 13, height: 13, color: '#d4574c' }} />}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: c.isUp ? 'var(--leaf)' : '#d4574c' }}>{c.label2}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(246,244,236,0.1)', paddingTop: 14, position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'rgba(246,244,236,0.5)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb style={{ width: 11, height: 11 }} /> Recommendations
          </div>
          {suggestions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(246,244,236,0.06)', border: '1px solid rgba(246,244,236,0.1)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 8 }}>
              <s.icon style={{ width: 13, height: 13, color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12.5, color: 'rgba(246,244,236,0.75)', lineHeight: 1.55 }}>{s.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(246,244,236,0.35)', letterSpacing: '0.1em', position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        <span>CONFIDENCE · {Math.round(85 + qualityScore * 0.1)}%</span>
        <span>{isJ2K ? 'JPEG2000 ENGINE' : 'JPEG ENGINE'}</span>
      </div>
    </motion.div>
  );
}
