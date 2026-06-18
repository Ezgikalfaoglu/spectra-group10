/**
 * TypePresetBanner
 * ───────────────────────────────────────────────────
 * Sticky-style banner shown on Transform / Quantization / Entropy pages.
 *
 *   • Reads the upload's imageType from localStorage.
 *   • Resolves the matching profile from imageTypeProfiles.
 *   • Renders a card showing the trained preset values relevant to the
 *     current page (transform | quantize | entropy) plus an
 *     "Apply preset" action that calls the supplied onApply callback.
 *
 * The banner is hidden when no upload is present.
 */

import { useEffect, useState } from 'react';
import { Sparkles, ArrowDownToLine } from 'lucide-react';
import { getProfile, type TypeProfile } from '../lib/imageTypeProfiles';

type Stage = 'transform' | 'quantize' | 'entropy';

export function TypePresetBanner({
  stage,
  onApply,
  coderOverride,
}: {
  stage: Stage;
  onApply: (profile: TypeProfile) => void;
  coderOverride?: string; // entropy stage: show the user's selected coder
}) {
  const [profile, setProfile] = useState<TypeProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('spectra_upload');
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      setProfile(getProfile(u.imageType));
    } catch {
      // ignore
    }
  }, []);

  if (!profile) return null;

  const fields = stage === 'transform'
    ? [
        { k: 'Method',           v: profile.method === 'jpeg2000' ? 'JPEG2000 · DWT' : 'JPEG · DCT' },
        { k: 'Wavelet',          v: profile.waveletFilter.toUpperCase() },
        { k: 'Decomp. level',    v: `L${profile.decompositionLevel}` },
      ]
    : stage === 'quantize'
    ? [
        { k: 'Quant. type',      v: profile.quantizationType.charAt(0).toUpperCase() + profile.quantizationType.slice(1) },
        { k: 'Step size',        v: profile.forceLossless ? 'Lossless' : `Δ ${profile.stepSize}` },
        { k: 'CR bonus',         v: `×${profile.crBonus.toFixed(2)}` },
      ]
    : [
        { k: 'Coder',            v: (coderOverride ?? profile.coder).replace('huffman-', 'Huffman · ').replace('arithmetic', 'Arithmetic') },
        { k: 'Lossless',         v: profile.forceLossless ? 'Yes' : 'No' },
        { k: 'CR bonus',         v: `×${profile.crBonus.toFixed(2)}` },
      ];

  return (
    <div
      style={{
        marginBottom: 18,
        background: 'white',
        border: `1px solid ${profile.accent}33`,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-paper)',
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, ${profile.accent}10, transparent 60%)`,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${profile.accent}22`,
        }}
      >
        <Sparkles style={{ width: 13, height: 13, color: profile.accent, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
            letterSpacing: '0.18em', color: profile.accent, textTransform: 'uppercase',
          }}
        >Trained preset · {profile.label}</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => onApply(profile)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 100,
            background: profile.accent, color: 'white',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            boxShadow: `0 4px 12px -4px ${profile.accent}66`,
          }}
        >
          <ArrowDownToLine style={{ width: 11, height: 11 }} />
          Apply preset
        </button>
      </div>

      <div style={{ padding: '14px 18px' }}>
        <p
          style={{
            fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55,
            marginBottom: 12,
          }}
        >{profile.blurb}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {fields.map(f => (
            <div
              key={f.k}
              style={{
                background: 'var(--paper-2)',
                border: '1px solid var(--rule-soft)',
                borderRadius: 'var(--r-sm)',
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8.5,
                  letterSpacing: '0.18em', color: 'var(--ink-4)',
                  textTransform: 'uppercase', marginBottom: 3,
                }}
              >{f.k}</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11.5,
                  color: 'var(--ink)', fontWeight: 500,
                }}
              >{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
