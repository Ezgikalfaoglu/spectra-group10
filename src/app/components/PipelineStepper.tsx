import { Link, useLocation } from 'react-router';
import { Check } from 'lucide-react';

/* ─── Pipeline Stepper
   Shared by Upload, Transform, Quantization, Processing pages.
   Shows 4-step progress within the compression pipeline.
   ─── */

const STEPS = [
  { id: 'upload',       label: 'Upload',    sub: 'Specimen',    path: '/upload',       num: '01' },
  { id: 'transform',    label: 'Transform', sub: 'Method',      path: '/transform',    num: '02' },
  { id: 'quantize',     label: 'Quantize',  sub: 'Parameters',  path: '/quantization', num: '03' },
  { id: 'process',      label: 'Process',   sub: 'Pipeline',    path: '/processing',   num: '04' },
];

function getActiveIndex(pathname: string): number {
  if (pathname.startsWith('/processing'))  return 3;
  if (pathname.startsWith('/quantization')) return 2;
  if (pathname.startsWith('/transform'))   return 1;
  if (pathname.startsWith('/upload'))      return 0;
  return -1;
}

export function PipelineStepper() {
  const location = useLocation();
  const activeIdx = getActiveIndex(location.pathname);

  return (
    <div style={{
      background: 'var(--paper-2)',
      border: '1px solid var(--rule)',
      borderRadius: 'var(--r-lg)',
      padding: '18px 28px',
      marginBottom: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* subtle background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--rule-soft) 1px, transparent 1px), linear-gradient(90deg, var(--rule-soft) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.4,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', width: '100%', gap: 0,
      }}>
        {STEPS.map((step, idx) => {
          const isDone   = idx < activeIdx;
          const isActive = idx === activeIdx;
          const isPending = idx > activeIdx;

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : undefined }}>
              {/* Step node */}
              <Link
                to={isDone ? step.path : '#'}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: isDone ? 'pointer' : 'default', flexShrink: 0 }}
              >
                {/* Circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${isActive ? 'var(--klein)' : isDone ? 'var(--leaf)' : 'var(--rule)'}`,
                  background: isActive ? 'var(--klein)' : isDone ? 'rgba(31,138,94,0.08)' : 'var(--paper)',
                  boxShadow: isActive ? '0 0 0 4px rgba(30,42,255,0.10)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {isDone
                    ? <Check style={{ width: 14, height: 14, color: 'var(--leaf)', strokeWidth: 2.5 }} />
                    : <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
                        color: isActive ? 'white' : 'var(--ink-4)',
                        fontWeight: isActive ? 600 : 400,
                      }}>{step.num}</span>
                  }
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--klein)' : isDone ? 'var(--leaf)' : 'var(--ink-4)',
                    fontWeight: isActive ? 600 : 400,
                    lineHeight: 1.2,
                  }}>{step.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                    color: 'var(--ink-4)', textTransform: 'uppercase', marginTop: 2,
                  }}>{step.sub}</div>
                </div>
              </Link>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 1, marginBottom: 22,
                  background: idx < activeIdx
                    ? 'var(--leaf)'
                    : idx === activeIdx - 1
                      ? 'linear-gradient(90deg, var(--leaf), var(--rule))'
                      : 'var(--rule)',
                  margin: '0 8px 22px 8px',
                  transition: 'background 0.4s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
