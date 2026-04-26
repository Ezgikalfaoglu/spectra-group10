import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, ChevronDown, ChevronUp, Download,
  Eye, Trash2, BarChart3, Clock, Database, RefreshCw,
  ArrowUpDown, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer
} from 'recharts';

interface RunRecord {
  id: string; date: string; imageName: string;
  method: string; wavelet: string; decompLevel: number | string;
  quantType: string; stepSize: number;
  mse: number; psnr: number; cr: string; sparsity: string;
}

const MOCK_HISTORY: RunRecord[] = [
  { id: 'RUN-001', date: '2026-04-21T10:32:00Z', imageName: 'landscape_sample.tiff',  method: 'JPEG2000', wavelet: 'db4',  decompLevel: 3, quantType: 'scalar',  stepSize: 18, mse: 42.73,  psnr: 31.82, cr: '10.4:1', sparsity: '78%' },
  { id: 'RUN-002', date: '2026-04-21T10:28:00Z', imageName: 'landscape_sample.tiff',  method: 'JPEG',    wavelet: '—',   decompLevel: '—', quantType: 'uniform', stepSize: 16, mse: 78.40,  psnr: 29.20, cr: '8.9:1',  sparsity: '62%' },
  { id: 'RUN-003', date: '2026-04-21T10:15:00Z', imageName: 'fingerprint_01.bmp',     method: 'JPEG2000', wavelet: 'haar', decompLevel: 2, quantType: 'scalar',  stepSize: 8,  mse: 12.10,  psnr: 37.30, cr: '6.8:1',  sparsity: '55%' },
  { id: 'RUN-004', date: '2026-04-20T16:44:00Z', imageName: 'biomedical_scan.png',    method: 'JPEG2000', wavelet: 'db2',  decompLevel: 4, quantType: 'scalar',  stepSize: 4,  mse: 5.20,   psnr: 40.97, cr: '4.1:1',  sparsity: '44%' },
  { id: 'RUN-005', date: '2026-04-20T15:20:00Z', imageName: 'synthetic_graphic.png',  method: 'JPEG',    wavelet: '—',   decompLevel: '—', quantType: 'uniform', stepSize: 24, mse: 143.80, psnr: 26.55, cr: '14.3:1', sparsity: '81%' },
  { id: 'RUN-006', date: '2026-04-20T14:55:00Z', imageName: 'portrait_natural.tiff',  method: 'JPEG2000', wavelet: 'db4',  decompLevel: 5, quantType: 'scalar',  stepSize: 12, mse: 22.90,  psnr: 34.53, cr: '9.2:1',  sparsity: '69%' },
  { id: 'RUN-007', date: '2026-04-20T11:08:00Z', imageName: 'landscape_sample.tiff',  method: 'JPEG2000', wavelet: 'db2',  decompLevel: 3, quantType: 'uniform', stepSize: 20, mse: 58.40,  psnr: 30.47, cr: '12.1:1', sparsity: '74%' },
  { id: 'RUN-008', date: '2026-04-19T17:30:00Z', imageName: 'hybrid_chart.bmp',       method: 'JPEG',    wavelet: '—',   decompLevel: '—', quantType: 'scalar',  stepSize: 32, mse: 220.60, psnr: 24.70, cr: '19.8:1', sparsity: '87%' },
  { id: 'RUN-009', date: '2026-04-19T14:12:00Z', imageName: 'fingerprint_02.png',     method: 'JPEG2000', wavelet: 'haar', decompLevel: 1, quantType: 'scalar',  stepSize: 6,  mse: 8.40,   psnr: 38.88, cr: '5.4:1',  sparsity: '48%' },
  { id: 'RUN-010', date: '2026-04-19T09:45:00Z', imageName: 'mri_slice.tiff',         method: 'JPEG2000', wavelet: 'db4',  decompLevel: 4, quantType: 'scalar',  stepSize: 4,  mse: 4.10,   psnr: 42.00, cr: '3.8:1',  sparsity: '41%' },
];

type SortKey = keyof RunRecord;
type SortDir = 'asc' | 'desc';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export function HistoryPage() {
  const [rows, setRows] = useState<RunRecord[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('psnr');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('compressionHistory');
    let history: RunRecord[] = [];
    if (stored) { try { history = JSON.parse(stored); } catch {} }
    setRows([...history, ...MOCK_HISTORY].slice(0, 20));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = rows
    .filter(r => {
      const q = search.toLowerCase();
      if (q && !r.imageName.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.method.toLowerCase().includes(q)) return false;
      if (methodFilter !== 'all' && r.method !== methodFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'psnr') {
        return sortDir === 'asc'
          ? a.psnr - b.psnr
          : b.psnr - a.psnr;
      }
      const va = a[sortKey]; const vb = b[sortKey];
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button onClick={() => handleSort(col)} style={{ marginLeft: 4, opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center' }}>
      {sortKey === col
        ? (sortDir === 'asc' ? <ChevronUp style={{ width: 11, height: 11, color: 'var(--klein)' }} /> : <ChevronDown style={{ width: 11, height: 11, color: 'var(--klein)' }} />)
        : <ArrowUpDown style={{ width: 11, height: 11 }} />}
    </button>
  );

  const stats = {
    total: rows.length,
    jpeg2000: rows.filter(r => r.method === 'JPEG2000').length,
    jpeg: rows.filter(r => r.method === 'JPEG').length,
    avgPSNR: (rows.reduce((s, r) => s + r.psnr, 0) / rows.length || 0).toFixed(1),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="sp-eyebrow" style={{ marginBottom: 12 }}>HISTORY · BENCHMARK LEDGER</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', fontVariationSettings: '"opsz" 72' }}>
            Experiment <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>log</em>.
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, textTransform: 'uppercase' }}>
            All compression runs · parameters · results
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/upload" className="sp-btn sp-btn-klein sp-btn-sm">
            <RefreshCw style={{ width: 12, height: 12 }} />
            New Run
          </Link>
          <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => {
            const csv = [
              ['Run ID', 'Date', 'Specimen', 'Method', 'Wavelet', 'Level', 'Quant', 'Step', 'MSE', 'PSNR', 'CR', 'Sparsity'].join(','),
              ...filtered.map(r => [
                r.id,
                formatDate(r.date),
                r.imageName,
                r.method,
                r.wavelet,
                r.decompLevel,
                r.quantType,
                r.stepSize,
                r.mse.toFixed(2),
                r.psnr.toFixed(2),
                r.cr,
                r.sparsity
              ].map(v => `"${v}"`).join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compression-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download style={{ width: 12, height: 12 }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: Database, label: 'Total Runs', value: stats.total },
          { icon: BarChart3, label: 'JPEG2000', value: stats.jpeg2000 },
          { icon: BarChart3, label: 'JPEG', value: stats.jpeg },
          { icon: Clock, label: 'Avg. PSNR', value: `${stats.avgPSNR} dB` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="sp-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'rgba(30,42,255,0.06)', border: '1px solid rgba(30,42,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon style={{ width: 16, height: 16, color: 'var(--klein)' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.015em' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & filter bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="sp-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input
              type="text" placeholder="Search by name, run ID, method…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid var(--rule)', borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, background: 'white', color: 'var(--ink)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter style={{ width: 13, height: 13, color: 'var(--ink-4)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Method:</span>
            <div style={{ display: 'flex', padding: 3, background: 'var(--paper-3)', borderRadius: 8, border: '1px solid var(--rule)', gap: 3 }}>
              {['all', 'JPEG', 'JPEG2000'].map(m => (
                <button key={m} onClick={() => setMethodFilter(m)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.15s', background: methodFilter === m ? 'white' : 'transparent', color: methodFilter === m ? 'var(--ink)' : 'var(--ink-3)', boxShadow: methodFilter === m ? '0 1px 3px rgba(10,11,14,0.1)' : 'none' }}>
                  {m === 'all' ? 'All' : m}
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--klein)', padding: '4px 12px', background: 'rgba(30,42,255,0.06)', borderRadius: 100, border: '1px solid rgba(30,42,255,0.15)', letterSpacing: '0.1em', marginLeft: 'auto' }}>
            {filtered.length} records
          </span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="sp-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)', borderBottom: '1px solid var(--rule)' }}>
                {[
                  { key: 'id', label: 'Run ID' },
                  { key: 'date', label: 'Date' },
                  { key: 'imageName', label: 'Specimen' },
                  { key: 'method', label: 'Method' },
                  { key: 'wavelet', label: 'Wavelet' },
                  { key: 'decompLevel', label: 'Lvl' },
                  { key: 'quantType', label: 'Quant.' },
                  { key: 'stepSize', label: 'Step' },
                  { key: 'mse', label: 'MSE' },
                  { key: 'psnr', label: 'PSNR' },
                  { key: 'cr', label: 'CR' },
                  { key: 'sparsity', label: 'Sparsity' },
                ].map(({ key, label }) => (
                  <th key={key} style={{ padding: '11px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 400 }}>
                    {label}<SortBtn col={key as SortKey} />
                  </th>
                ))}
                <th style={{ padding: '11px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 400 }}>Actions</th>
              </tr>
            </thead>
<tbody>
  {filtered.length === 0 && (
    <tr>
      <td colSpan={13} style={{ textAlign: 'center', padding: '64px 20px' }}>
        
        <Database style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.5 }} />

        <div style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          marginBottom: 16,
          color: 'var(--ink)'
        }}>
          No records yet.
        </div>

        <Link
          to="/dashboard"
          className="sp-btn sp-btn-klein"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Open Workspace
        </Link>

      </td>
    </tr>
  )}
  {filtered.map((row, idx) => (
    <Fragment key={row.id}>
      <tr
        onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
        style={{
          borderBottom: '1px solid var(--rule-soft)',
          background: idx % 2 === 1 ? 'var(--paper-2)' : 'white',
          cursor: 'pointer',
          transition: 'background 0.15s'
        }}
      >
        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--klein)', letterSpacing: '0.05em' }}>{row.id}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{formatDate(row.date)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.imageName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid', borderColor: row.method === 'JPEG2000' ? 'rgba(30,42,255,0.3)' : 'rgba(75,30,122,0.3)', color: row.method === 'JPEG2000' ? 'var(--klein)' : 'var(--plum)', background: row.method === 'JPEG2000' ? 'rgba(30,42,255,0.05)' : 'rgba(75,30,122,0.05)' }}>
                        {row.method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{row.wavelet}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>{row.decompLevel}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'capitalize' }}>{row.quantType}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>{row.stepSize}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: row.mse > 100 ? '#d4574c' : row.mse > 50 ? 'var(--amber)' : 'var(--leaf)' }}>
                      {row.mse.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>{row.psnr.toFixed(1)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--klein)' }}>dB</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}>{row.cr}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: parseFloat(row.sparsity) > 75 ? '#d4574c' : parseFloat(row.sparsity) > 50 ? 'var(--amber)' : 'var(--leaf)' }}>{row.sparsity}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <Link to="/results" onClick={e => e.stopPropagation()}
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'white', border: '1px solid var(--rule)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', textDecoration: 'none' }}>
                          <Eye style={{ width: 13, height: 13 }} />
                        </Link>
                        <button onClick={e => { 
                          e.stopPropagation(); 
                          const newRows = rows.filter(x => x.id !== row.id);
                          setRows(newRows);
                          localStorage.setItem("compressionHistory", JSON.stringify(newRows));
                        }}
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'white', border: '1px solid var(--rule)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  <AnimatePresence>
                    {expandedRow === row.id && (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(30,42,255,0.02)', borderBottom: '1px solid var(--rule)' }}>
                        <td colSpan={13} style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, background: 'white', borderRadius: 'var(--r-md)', padding: '20px 24px', border: '1px solid var(--rule)' }}>
                            {/* Config */}
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Search style={{ width: 11, height: 11 }} /> Configuration
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--rule)' }}>
                                {[
                                  { k: 'Method', v: row.method },
                                  { k: 'Wavelet', v: row.wavelet },
                                  { k: 'Decomp. Level', v: String(row.decompLevel) },
                                  { k: 'Quant. Type', v: row.quantType },
                                  { k: 'Step Size', v: String(row.stepSize) },
                                ].map(({ k, v }) => (
                                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', background: 'var(--paper-3)', padding: '2px 8px', borderRadius: 6 }}>{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Metrics */}
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity style={{ width: 11, height: 11 }} /> Quality Metrics
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--rule)' }}>
                                {[
                                  { k: 'MSE', v: row.mse.toFixed(2) },
                                  { k: 'PSNR', v: `${row.psnr.toFixed(2)} dB` },
                                  { k: 'Compression Ratio', v: row.cr },
                                  { k: 'Sparsity', v: row.sparsity },
                                ].map(({ k, v }) => (
                                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)' }}>{v}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ marginTop: 16 }}>
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart
                                    data={[
                                      { step: Math.max(2, row.stepSize - 8), psnr: row.psnr - 2 },
                                      { step: Math.max(2, row.stepSize - 4), psnr: row.psnr - 1 },
                                      { step: row.stepSize, psnr: row.psnr },
                                      { step: row.stepSize + 4, psnr: row.psnr - 0.8 },
                                      { step: row.stepSize + 8, psnr: row.psnr - 1.6 },
                                    ]}
                                  >
                                    <CartesianGrid stroke="var(--rule)" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                      dataKey="step"
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}
                                      label={{ value: 'Step Size', position: 'insideBottom', offset: -4, fill: 'var(--ink-4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                    />
                                    <YAxis
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}
                                      label={{ value: 'PSNR (dB)', angle: -90, position: 'insideLeft', fill: 'var(--ink-4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                      width={38}
                                    />
                                    <Tooltip
                                      cursor={{ stroke: 'rgba(30,42,255,0.15)', strokeWidth: 1 }}
                                      contentStyle={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="psnr"
                                      stroke="var(--klein)"
                                      strokeWidth={2.5}
                                      dot={{ r: 3, fill: 'var(--klein)' }}
                                      activeDot={{ r: 5, fill: 'var(--klein)' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            {/* Specimen */}
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>Target Specimen</div>
                              <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.imageName}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{formatDate(row.date)}</div>
                              </div>
                              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                                <Link to="/results" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--klein)', color: 'white', borderRadius: 100, padding: '8px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textDecoration: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                                  View Results
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer note */}
      <div style={{ marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-4)', textAlign: 'center', textTransform: 'uppercase' }}>
        Showing {filtered.length} of {rows.length} recorded runs · CENG 384 · Group 10
      </div>
    </motion.div>
  );
}
