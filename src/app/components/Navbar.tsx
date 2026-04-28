import { Link, useLocation } from 'react-router';

/* ─── Pipeline flow steps (shown as connected group) ─── */
const PIPELINE_STEPS = [
  { path: '/upload',          num: '01', label: 'Upload'    },
  { path: '/preprocessing',   num: '02', label: 'Preproc'   },
  { path: '/transform',       num: '03', label: 'Transform' },
  { path: '/quantization',    num: '04', label: 'Quantize'  },
  { path: '/entropy',         num: '05', label: 'Entropy'   },
  { path: '/processing',      num: '06', label: 'Process'   },
];

const TOP_LINKS = [
  { path: '/',        label: 'Overview' },
  { path: '/results', label: 'Results'  },
  { path: '/history', label: 'Log'      },
];

function isPipelinePath(pathname: string) {
  return PIPELINE_STEPS.some(s => pathname.startsWith(s.path));
}

export function Navbar() {
  const location = useLocation();
  const inPipeline = isPipelinePath(location.pathname);

  return (
    <nav className="sp-nav">
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', gap: 24 }}>

        {/* ── Brand ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ width: 28, height: 28 }}>
            <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
              <rect x="1" y="1" width="38" height="38" rx="8" fill="var(--ink)" />
              <rect x="8"  y="8"  width="11" height="11" rx="1" fill="var(--klein)" />
              <rect x="21" y="8"  width="11" height="11" rx="1" fill="var(--paper)" />
              <rect x="8"  y="21" width="11" height="11" rx="1" fill="var(--paper)" />
              <rect x="21" y="21" width="11" height="11" rx="1" fill="var(--cyan)" />
            </svg>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Spectra</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>IMAGING ATELIER · v4.2</span>
          </span>
        </Link>

        {/* ── Divider ── */}
        <span style={{ width: 1, height: 24, background: 'var(--rule)', flexShrink: 0 }} />

        {/* ── Top-level links ── */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {TOP_LINKS.map(({ path, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path} className={`sp-nav-link ${isActive ? 'sp-nav-link-active' : ''}`}>
                {label}
                {isActive && (
                  <span style={{ display: 'block', width: 4, height: 4, background: 'var(--klein)', borderRadius: '50%', margin: '2px auto -6px' }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <span style={{ width: 1, height: 24, background: 'var(--rule)', flexShrink: 0 }} />

        {/* ── Pipeline flow ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '4px 10px', borderRadius: 100,
          background: inPipeline ? 'rgba(30,42,255,0.05)' : 'transparent',
          border: `1px solid ${inPipeline ? 'rgba(30,42,255,0.18)' : 'transparent'}`,
          transition: 'all 0.2s',
        }}>
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = location.pathname.startsWith(step.path);
            const isDone   = PIPELINE_STEPS.slice(0, idx).some(s => {
              // mark a step as done if we're past it in the flow
              const activeIdx = PIPELINE_STEPS.findIndex(s2 => location.pathname.startsWith(s2.path));
              return activeIdx > idx;
            });

            return (
              <div key={step.path} style={{ display: 'flex', alignItems: 'center' }}>
                <Link
                  to={step.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    textDecoration: 'none', padding: '4px 7px', borderRadius: 100,
                    background: isActive ? 'white' : 'transparent',
                    boxShadow: isActive ? '0 1px 4px rgba(10,11,14,0.1)' : 'none',
                    transition: 'all 0.18s',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em',
                    color: isActive ? 'var(--klein)' : isDone ? 'var(--leaf)' : 'var(--ink-4)',
                  }}>{step.num}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.05em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    color: isActive ? 'var(--klein)' : isDone ? 'var(--leaf)' : 'var(--ink-4)',
                    fontWeight: isActive ? 600 : 400,
                  }}>{step.label}</span>
                </Link>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <span style={{
                    width: 8, height: 1, background: isDone ? 'var(--leaf)' : 'var(--rule)',
                    display: 'inline-block', flexShrink: 0, transition: 'background 0.3s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/upload" className="sp-btn sp-btn-klein sp-btn-sm">
            Start pipeline →
          </Link>
        </div>

      </div>
    </nav>
  );
}
