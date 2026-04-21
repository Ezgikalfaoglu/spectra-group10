import { Link } from 'react-router';
import { motion } from 'motion/react';

/* ─── Decorative SVG landscape (specimen image) ─── */
function SpecimenSVG({ id = 'sky1' }: { id?: string }) {
  return (
    <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#1a2350" />
          <stop offset="0.35" stopColor="#3d4a8a" />
          <stop offset="0.65" stopColor="#8faad8" />
          <stop offset="0.78" stopColor="#b8c8e2" />
          <stop offset="1"    stopColor="#4a5a80" />
        </linearGradient>
      </defs>
      <rect width="200" height="110" fill={`url(#${id})`} />
      <circle cx="54" cy="34" r="14" fill="#fff0d4" opacity="0.95" />
      <circle cx="54" cy="34" r="24" fill="#fff0d4" opacity="0.2" />
      <path d="M0,110 L38,68 L72,90 L110,52 L148,86 L200,62 L200,110 Z" fill="#1e2744" opacity="0.95" />
      <path d="M0,110 L30,94 L64,102 L104,80 L144,96 L182,88 L200,92 L200,110 Z" fill="#2a3560" />
      <rect y="110" width="200" height="50" fill="#5d7ab8" />
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.5">
        <line x1="20" y1="122" x2="180" y2="122" />
        <line x1="30" y1="136" x2="170" y2="136" />
      </g>
    </svg>
  );
}

/* ─── Reconstructed overlay (shows DWT subbands hint) ─── */
function ReconSVG() {
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#1a2350" />
          <stop offset="0.35" stopColor="#3d4a8a" />
          <stop offset="0.65" stopColor="#8faad8" />
          <stop offset="0.78" stopColor="#b8c8e2" />
          <stop offset="1"    stopColor="#4a5a80" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#sky2)" />
      <circle cx="54" cy="30" r="12" fill="#fff0d4" opacity="0.95" />
      <path d="M0,100 L38,60 L72,78 L110,44 L148,72 L200,54 L200,100 Z" fill="#1e2744" />
      <rect y="100" width="200" height="40" fill="#5d7ab8" />
      <g stroke="rgba(30,42,255,0.2)" fill="none" strokeWidth="0.5">
        <rect x="0"   y="0"  width="100" height="70" />
        <rect x="100" y="0"  width="100" height="70" />
        <rect x="0"   y="70" width="100" height="70" />
      </g>
    </svg>
  );
}

const PRINCIPLES = [
  { num: '01', title: <>Paper, not <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>plastic</em>.</>, body: 'Warm off-white canvas, hairline rules, no gradients on backgrounds. Depth comes from paper stock — shadow, shift, and stack — not from glow.' },
  { num: '02', title: <>Serif <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>authority</em>, mono <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>evidence</em>.</>, body: 'Fraunces at optical 144 for editorial headlines. JetBrains Mono for every number on screen. Geist sans for operating chrome. Three fonts, three jobs.' },
  { num: '03', title: <>One <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>blue</em>. One <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>pulse</em>.</>, body: 'Klein blue is the only saturated colour that lives on the page. Electric cyan is reserved exclusively for live-computation state — it means something.' },
  { num: '04', title: <>The <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>comparator</em> is the product.</>, body: 'Controls, pipeline, metrics — all orbit one signature interaction: a split-reveal slider with a draggable lens for artifact inspection at subband level.' },
  { num: '05', title: <>Every <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>wow</em> is a real state.</>, body: 'The shimmer means "encoding now." The orb means "stage 5 of 7." Nothing decorative animates forever. The interface earns its motion.' },
];

const AGENCIES = [
  {
    mark: 'A', accent: 'sp-agency-mark-klein',
    tag: 'AGENCY A · VISUAL DIRECTION',
    title: <>The <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>art direction</em> is not arriving early enough.</>,
    subtitle: '— Maison Chroma, art direction studio',
    weak: { label: "WHAT'S FORGETTABLE", text: <>The current system leans on <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>dark-mode neon</em> — the default "futuristic dashboard" dialect. It reads as competent, not iconic. No signature typeface moment, no editorial voice, no object you'd screenshot. The metrics live inside equally-weighted cards, which means <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>nothing is beautiful</em>.</> },
    move: { label: 'WHAT TO CHANGE', text: <>Reposition Spectra as an <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>imaging atelier</em>, not a lab. Paper-white canvas, one saturated signature colour (Klein blue), oversized serif headlines with optical sizing, images treated as <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>specimens</em> with caption plates — not widgets.</> },
  },
  {
    mark: 'B', accent: '',
    tag: 'AGENCY B · EXPERIENCE LOGIC',
    title: <>Side-by-side is a <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>placeholder</em>, not a product.</>,
    subtitle: '— North Field UX, product research agency',
    weak: { label: "WHAT'S FORGETTABLE", text: <>Every parameter is visible at once — no progressive disclosure for quantization edge cases. The comparison is passive: two static images side-by-side. Users cannot <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>inspect artifacts</em>, zoom into regions, or sweep quality mentally. History is a spreadsheet, not a decision tool.</> },
    move: { label: 'WHAT TO CHANGE', text: <>Make comparison the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>centerpiece interaction</em>: a split-reveal slider with a lens mode for zooming into subbands and block artifacts. Collapse advanced quantization into an "Expert" disclosure. Turn history into a <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>benchmark ledger</em> where rows are reopenable runs.</> },
  },
  {
    mark: 'C', accent: 'sp-agency-mark-plum',
    tag: 'AGENCY C · FRONTEND FEASIBILITY',
    title: <>Premium <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>must survive</em> the production build.</>,
    subtitle: '— Vector Works, engineering collective',
    weak: { label: "WHAT'S FORGETTABLE", text: <>Heavy glow stacks and always-animated backgrounds create <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>render cost</em> on mid-range laptops where this audience actually works. The pipeline animation is decorative, not tied to real state. Chart-heavy results page is a canvas liability without virtualization.</> },
    move: { label: 'WHAT TO CHANGE', text: <>Build it on <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>React + Tailwind + Radix + Motion</em>. Pin glow to CSS variables, use container queries for workspace collapse, and hand image decode off to createImageBitmap with an OffscreenCanvas worker. Every "wow" is a <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>real</em> state transition, not a loop.</> },
  },
];

export function LandingPage() {
  return (
    <div style={{ position: 'relative', zIndex: 2 }}>

      {/* ═══════════════════════════
          COVER
          ═══════════════════════════ */}
      <section id="cover" style={{ minHeight: 'calc(100vh - 64px)', padding: '80px 0 120px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="sp-cover-bg-grid" />
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px', width: '100%', position: 'relative', zIndex: 2 }}>
          <div className="sp-cover-grid">

            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 64, paddingBottom: 20, borderBottom: '1px solid var(--rule)' }}>
                <span>SPECTRA · IMAGING ATELIER</span>
                <span><span style={{ color: 'var(--ink-4)' }}>◆</span>&nbsp;&nbsp;LIGHT EDITION · VOL. 01</span>
                <span>APR 2026 · ANKARA</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(56px, 7vw, 108px)', lineHeight: 0.92, letterSpacing: '-0.035em', color: 'var(--ink)', marginBottom: 36, fontVariationSettings: '"opsz" 144' }}>
                The <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--klein)' }}>quiet</span> laboratory<br />
                of the image.
                <span style={{ display: 'block', fontSize: '0.38em', fontWeight: 400, fontStyle: 'normal', color: 'var(--ink-2)', letterSpacing: '-0.01em', marginTop: 12, fontVariationSettings: '"opsz" 14' }}>
                  A light-first imaging atelier where JPEG and JPEG&nbsp;2000 are measured, not marketed.
                </span>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 520, marginBottom: 44 }}>
                Spectra is a <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>research-grade workspace</strong> for image compression. Drop a file, switch transforms, dial in wavelets and quantization — and watch <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>MSE, PSNR, CR and sparsity</strong> settle into place with the calm of a museum specimen card.
              </p>

              <div style={{ display: 'flex', gap: 12, marginBottom: 56, flexWrap: 'wrap' }}>
                <Link to="/upload" className="sp-btn sp-btn-klein">
                  Open the workspace
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/results" className="sp-btn sp-btn-ghost">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21"/></svg>
                  Explore results
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 48, paddingTop: 36, borderTop: '1px solid var(--rule)' }}>
                {[
                  { label: 'TRANSFORMS', value: 'DCT · DWT' },
                  { label: 'ENTROPY', value: 'Huffman' },
                  { label: 'EVALUATION', value: 'MSE · PSNR · CR' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontStyle: 'italic', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Specimen visual */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} style={{ position: 'relative', aspectRatio: '1 / 1.1' }}>

              {/* Annotation lines */}
              <span style={{ position: 'absolute', top: '20%', left: '-3%', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                PLATE&nbsp;01 · ORIGINAL
                <span style={{ width: 32, height: 1, background: 'var(--ink-3)', display: 'inline-block' }} />
              </span>
              <span style={{ position: 'absolute', bottom: '22%', right: '-2%', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row-reverse' }}>
                PLATE&nbsp;02 · RECONSTRUCTED
                <span style={{ width: 32, height: 1, background: 'var(--ink-3)', display: 'inline-block' }} />
              </span>

              {/* Base specimen frame */}
              <div style={{ position: 'absolute', inset: '4%', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lift)', overflow: 'hidden', transform: 'rotate(-1.2deg)' }}>
                <span style={{ position: 'absolute', top: 16, right: 16, width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 0 4px rgba(0,212,255,0.12)', display: 'block' }} />
                <span style={{ position: 'absolute', top: 16, left: 20, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-3)' }}>SPECIMEN A · ORIGINAL</span>
                <div style={{ position: 'absolute', top: 44, left: 20, right: 20, bottom: 80, borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                  <SpecimenSVG id="sky1a" />
                </div>
                <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', paddingTop: 14, borderTop: '1px solid var(--rule)', textTransform: 'uppercase' }}>
                  <span>LANDSCAPE_SAMPLE.TIFF</span>
                  <span style={{ color: 'var(--ink)' }}>1024 × 1024</span>
                </div>
              </div>

              {/* Floating recon card */}
              <div style={{ position: 'absolute', top: '26%', right: '-6%', width: '56%', aspectRatio: '1/1', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lift)', transform: 'rotate(2.5deg)', overflow: 'hidden', padding: '36px 18px 36px' }}>
                <span style={{ position: 'absolute', top: 14, left: 18, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--klein)', fontWeight: 500 }}>SPECIMEN B · RECONSTRUCTED</span>
                <span style={{ position: 'absolute', top: 14, right: 18, width: 28, height: 10, background: 'var(--klein)', borderRadius: 2, display: 'block' }} />
                <div style={{ position: 'absolute', top: 38, left: 18, right: 18, bottom: 38, borderRadius: 'var(--r-xs)', overflow: 'hidden' }}>
                  <ReconSVG />
                </div>
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 14, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.15em', color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}>
                  <span>J2K · db4 · L3</span>
                  <span style={{ color: 'var(--ink)' }}>10.4:1</span>
                </div>
              </div>

              {/* Metric chips */}
              {[
                { k: 'PSNR', v: '31.82', u: 'dB', style: { top: '4%', right: '12%', transform: 'rotate(-3deg)' } },
                { k: 'SPARSITY', v: '78', u: '%', style: { bottom: '10%', left: '-4%', transform: 'rotate(1.5deg)', zIndex: 3 } },
                { k: 'MSE', v: '42.73', u: '', style: { bottom: '-2%', right: '18%', transform: 'rotate(-1deg)' } },
              ].map(chip => (
                <div key={chip.k} style={{ position: 'absolute', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: '12px 16px', boxShadow: 'var(--shadow-lift)', ...chip.style }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>{chip.k}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, lineHeight: 1, color: 'var(--ink)' }}>
                    {chip.v}{chip.u && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)', fontStyle: 'normal', marginLeft: 3 }}>{chip.u}</span>}
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════
          PHASE 1 — AGENCY CRITIQUE
          ═══════════════════════════ */}
      <section id="phase-1" style={{ padding: '140px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px' }}>

          <div className="sp-sec-head">
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 96, lineHeight: 0.8, color: 'var(--klein)', fontWeight: 300, letterSpacing: '-0.04em' }}>01</div>
            <div>
              <div className="sp-eyebrow" style={{ marginBottom: 20 }}>PHASE ONE · THREE AGENCIES, ONE ROOM</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 4.2vw, 64px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 20, fontVariationSettings: '"opsz" 72', maxWidth: 780 }}>
                Before the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>beautiful</em>, the <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>honest</em>.
              </h2>
              <p style={{ fontSize: 16.5, color: 'var(--ink-2)', maxWidth: 620, lineHeight: 1.55 }}>
                Three senior agencies walk into the product and say what the deck won't. UI, UX, and engineering each file an independent critique — then we converge.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {AGENCIES.map((ag, i) => (
              <motion.div
                key={ag.mark}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="sp-agency"
              >
                <div className={`sp-agency-mark ${ag.accent}`}>{ag.mark}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>{ag.tag}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, lineHeight: 1.05, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4, fontWeight: 400, maxWidth: 240 }}>{ag.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{ag.subtitle}</p>

                {/* Weak */}
                <div style={{ paddingTop: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: '#d4574c', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
                    {ag.weak.label}
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-1)' }}>{ag.weak.text}</p>
                </div>

                {/* Move */}
                <div style={{ paddingTop: 20, borderTop: '1px solid var(--rule-soft)', marginTop: 20 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: 'var(--leaf)', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
                    {ag.move.label}
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-1)' }}>{ag.move.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Synthesis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sp-synthesis"
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.25em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 16, position: 'relative' }}>◆ AGENCY SYNTHESIS</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 2.3vw, 30px)', lineHeight: 1.3, letterSpacing: '-0.015em', maxWidth: 900, position: 'relative', fontWeight: 400 }}>
              Spectra is not a neon lab. It is a <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>light-first imaging atelier</em> — a specimen-card interface where serif typography carries the authority, Klein blue carries the emotion, and the <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>split-reveal comparator</em> carries the product. Every pixel must justify its cost on a 13-inch MacBook.
            </p>
          </motion.div>

        </div>
      </section>


      {/* ═══════════════════════════
          PHASE 2 — VISION
          ═══════════════════════════ */}
      <section id="phase-2" style={{ padding: '140px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px' }}>

          <div className="sp-sec-head">
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 96, lineHeight: 0.8, color: 'var(--klein)', fontWeight: 300, letterSpacing: '-0.04em' }}>02</div>
            <div>
              <div className="sp-eyebrow" style={{ marginBottom: 20 }}>PHASE TWO · CONCEPT DIRECTION</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 4.2vw, 64px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 20, fontVariationSettings: '"opsz" 72', maxWidth: 780 }}>
                Name the thing. <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>Then</em> defend it.
              </h2>
              <p style={{ fontSize: 16.5, color: 'var(--ink-2)', maxWidth: 620, lineHeight: 1.55 }}>
                Before any pixel ships we commit to a single creative idea with a single word to describe it. That word is <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--klein)' }}>atelier</em>.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'start' }} className="sp-cover-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 28 }}>CODENAME · CONCEPT MARK · WORKING TITLE</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(80px, 10vw, 160px)', lineHeight: 0.82, letterSpacing: '-0.04em', color: 'var(--ink)', marginBottom: 32, fontVariationSettings: '"opsz" 144' }}>
                Spectra<span style={{ color: 'var(--klein)' }}>.</span><br />
                <span style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 300 }}>Atelier</span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.35, color: 'var(--ink-1)', fontWeight: 400, marginBottom: 36, maxWidth: 560, letterSpacing: '-0.01em' }}>
                A <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>quiet instrument</em> for loud decisions. Compression is rarely explained well — Spectra treats every run as a <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>specimen</em>, every comparison as an <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>exhibit</em>, every metric as a caption on the wall.
              </p>
              <Link to="/upload" className="sp-btn sp-btn-klein">
                See it operating
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {/* Principles */}
            <div style={{ borderTop: '1px solid var(--rule)' }}>
              {PRINCIPLES.map((p, i) => (
                <motion.div
                  key={p.num}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{ display: 'grid', gridTemplateColumns: '60px 1fr', padding: '28px 0', borderBottom: '1px solid var(--rule)', gap: 24, alignItems: 'start', cursor: 'default', transition: 'all 0.3s' }}
                  whileHover={{ paddingLeft: 16, paddingRight: 16, backgroundColor: 'var(--paper-2)', borderRadius: 8 }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--klein)', letterSpacing: '0.15em', paddingTop: 4 }}>{p.num}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.015em', fontWeight: 500 }}>{p.title}</div>
                    <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 520 }}>{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* ═══════════════════════════
          PHASE 3 — WORKSPACE PREVIEW
          ═══════════════════════════ */}
      <section id="phase-3" style={{ padding: '140px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px' }}>

          <div className="sp-sec-head">
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 96, lineHeight: 0.8, color: 'var(--klein)', fontWeight: 300, letterSpacing: '-0.04em' }}>03</div>
            <div>
              <div className="sp-eyebrow" style={{ marginBottom: 20 }}>PHASE THREE · THE WORKING ATELIER</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 4.2vw, 64px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 20, fontVariationSettings: '"opsz" 72', maxWidth: 780 }}>
                One workspace, <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>seven rooms</em>.
              </h2>
              <p style={{ fontSize: 16.5, color: 'var(--ink-2)', maxWidth: 620, lineHeight: 1.55 }}>
                The workspace below is the flagship screen. Every control, reading, and shadow is the real thing — try it yourself.
              </p>
            </div>
          </div>

          {/* Screen frame */}
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lift)', overflow: 'hidden' }}>
            {/* Chrome bar */}
            <div className="sp-screen-chrome">
              <div style={{ display: 'flex', gap: 6 }}>
                {['#efb8b8','#f0d9a0','#a8d8b3'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
              </div>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', letterSpacing: '0.05em' }}>
                spectra.atelier / workspace / <span style={{ color: 'var(--ink)', fontWeight: 500 }}>landscape_sample.tiff</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--leaf)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(31,138,94,0.08)', borderRadius: 100 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leaf)', boxShadow: '0 0 0 3px rgba(31,138,94,0.12)', display: 'inline-block' }} />
                RUN 047 · LIVE
              </div>
            </div>

            {/* Workspace 3-col mock */}
            <div className="sp-workspace">
              {/* LEFT RAIL */}
              <aside className="sp-rail">
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    SPECIMEN
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--klein)', padding: '2px 7px', background: 'rgba(30,42,255,0.06)', borderRadius: 100 }}>1024²</span>
                  </div>
                  <div className="sp-upload-zone">
                    <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: 'var(--r-sm)', marginBottom: 14, background: 'linear-gradient(180deg,#1a2350 0%,#3d4a8a 35%,#8faad8 65%,#4a5a80 88%,#1e2744 100%)', position: 'relative', overflow: 'hidden', border: '1px solid var(--rule)' }}>
                      <SpecimenSVG id="sky_rail" />
                      <span style={{ position: 'absolute', top: 8, left: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 0 3px rgba(0,212,255,0.2)', display: 'inline-block' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', marginBottom: 6, fontWeight: 500 }}>landscape_sample.tiff</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
                      <span>1024 × 1024</span><span>2.4 MB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>METHOD</div>
                  <div className="sp-seg">
                    <button className="sp-seg-btn sp-seg-btn-active">JPEG (DCT)</button>
                    <button className="sp-seg-btn">J2K (DWT)</button>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>DECOMP. LEVEL</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`sp-pill ${n === 3 ? 'sp-pill-active' : ''}`}>{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>Step Size</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--klein)', fontWeight: 500 }}>18</span>
                  </div>
                  <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: 3, borderRadius: 3, background: 'var(--paper-3)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: '0 auto 0 0', width: '28%', background: 'var(--klein)', borderRadius: 3 }} />
                    </div>
                    <div className="sp-slider-thumb" style={{ position: 'absolute', left: '28%', transform: 'translateX(-50%)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
                  <Link to="/dashboard" className="sp-btn sp-btn-klein" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 13 }}>
                    Run
                  </Link>
                  <button className="sp-btn sp-btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 13 }}>
                    Reset
                  </button>
                </div>
              </aside>

              {/* CENTER STAGE */}
              <div className="sp-stage">
                {/* Pipeline */}
                <div style={{ padding: '22px 26px', borderRadius: 'var(--r-lg)', background: 'var(--paper-2)', border: '1px solid var(--rule)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
                      Processing <em style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 400 }}>pipeline</em>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>STAGE 5/7</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
                    {['Input','Preproc.','Transform','Quant.','Entropy','Reconst.','Eval.'].map((label, i) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
                        {i < 6 && <div style={{ position: 'absolute', top: 15, left: 'calc(50% + 15px)', right: 'calc(-50% + 15px)', height: 1, background: i < 4 ? 'var(--ink)' : 'var(--rule)', zIndex: 1 }} />}
                        <div className={`sp-pstep-dot ${i < 4 ? 'sp-pstep-dot-done' : i === 4 ? 'sp-pstep-dot-active' : ''}`}>{i + 1}</div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i < 4 ? 'var(--ink)' : i === 4 ? 'var(--klein)' : 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: i === 4 ? 500 : 400 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 3, background: 'var(--paper-3)', overflow: 'hidden', position: 'relative' }}>
                      <div className="sp-pipe-fill" style={{ width: '68%' }} />
                    </div>
                    <span style={{ color: 'var(--klein)', fontWeight: 500 }}>68%</span>
                    <span>Entropy coding…</span>
                  </div>
                </div>

                {/* Comparison viewer */}
                <div style={{ borderRadius: 'var(--r-lg)', background: 'var(--paper-2)', border: '1px solid var(--rule)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
                      Specimen <em style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 400 }}>comparator</em>
                    </span>
                    <div style={{ display: 'flex', padding: 3, background: 'var(--paper-3)', borderRadius: 8, gap: 2 }}>
                      {['REVEAL','SPLIT','LENS'].map((m, i) => (
                        <button key={m} style={{ padding: '6px 12px', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, background: i === 0 ? 'white' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-3)', boxShadow: i === 0 ? '0 1px 3px rgba(10,11,14,0.1)' : 'none' }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#0a0b0e', cursor: 'ew-resize' }}>
                    {/* Original layer */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a2350 0%,#3d4a8a 35%,#8faad8 65%,#b8c8e2 78%,#4a5a80 90%,#1e2744 100%)' }}>
                      <SpecimenSVG id="sky_comp_orig" />
                    </div>
                    {/* Recon layer */}
                    <div style={{ position: 'absolute', inset: 0, clipPath: 'inset(0 0 0 50%)' }}>
                      <ReconSVG />
                    </div>
                    {/* Divider */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: 'white', transform: 'translateX(-50%)', boxShadow: '0 0 0 1px rgba(30,42,255,0.2), 0 0 20px rgba(30,42,255,0.3)', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translate(-50%,-50%)', width: 46, height: 46, borderRadius: '50%', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'grab' }}>
                        <span style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '6px solid var(--ink)' }} />
                        <span style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid var(--ink)' }} />
                      </div>
                    </div>
                    {/* Labels */}
                    <div style={{ position: 'absolute', top: 18, left: 18, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white', background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(8px)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.12)' }}>ORIGINAL</div>
                    <div style={{ position: 'absolute', top: 18, right: 18, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white', background: 'rgba(30,42,255,0.9)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)' }}>JPEG2000</div>
                  </div>
                  <div style={{ padding: '14px 22px', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.05em' }}>
                    <span>1024 × 1024 · TIFF</span>
                    <span>PSNR <span style={{ color: 'var(--ink)' }}>31.82 dB</span>&nbsp;&nbsp;MSE <span style={{ color: 'var(--ink)' }}>42.73</span>&nbsp;&nbsp;CR <span style={{ color: 'var(--ink)' }}>10.4:1</span></span>
                  </div>
                </div>
              </div>

              {/* RIGHT OBSERVATION */}
              <aside className="sp-observation">
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>METRICS</div>
                  <div style={{ borderTop: '1px solid var(--rule)' }}>
                    {[
                      { label: 'PSNR', value: '31.82', unit: 'dB', delta: '+2.62', up: true },
                      { label: 'MSE',  value: '42.73', unit: '',   delta: '−35.7', up: false },
                      { label: 'CR',   value: '10.4',  unit: ':1', delta: '+1.5×', up: true },
                      { label: 'SPARSITY', value: '78', unit: '%', delta: '+16%', up: true },
                    ].map(m => (
                      <div key={m.label} className="sp-metric-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{m.label}</span>
                          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 34, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
                            {m.value}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--klein)', fontStyle: 'normal', marginLeft: 3 }}>{m.unit}</span>
                          </span>
                        </div>
                        <div style={{ height: 2, borderRadius: 2, background: 'var(--paper-3)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.random() * 40 + 40}%`, background: 'var(--klein)', borderRadius: 2 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.05em' }}>
                          <span>vs JPEG baseline</span>
                          <span style={{ color: m.up ? 'var(--leaf)' : '#d4574c' }}>{m.delta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insight card */}
                <div className="sp-insight">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 12, position: 'relative' }}>◆ ATELIER INSIGHT</div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.35, fontWeight: 400, letterSpacing: '-0.01em', position: 'relative' }}>
                    At step-size 18 with <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>db4 wavelet</em>, the DWT subband structure suppresses blocking. Reduce to 12 for <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>+4.1 dB PSNR</em> at a 7.2:1 ratio.
                  </p>
                  <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(246,244,236,0.6)', letterSpacing: '0.1em', position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                    <span>CONFIDENCE · 91%</span>
                    <span>RUN 047</span>
                  </div>
                </div>
              </aside>

            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/dashboard" className="sp-btn sp-btn-klein">
              Open the live workspace →
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════
          PHASE 4 — BLUEPRINT
          ═══════════════════════════ */}
      <section id="phase-4" style={{ padding: '140px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px' }}>

          <div className="sp-sec-head">
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 96, lineHeight: 0.8, color: 'var(--klein)', fontWeight: 300, letterSpacing: '-0.04em' }}>04</div>
            <div>
              <div className="sp-eyebrow" style={{ marginBottom: 20 }}>PHASE FOUR · DESIGN BLUEPRINT</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 4.2vw, 64px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 20, fontVariationSettings: '"opsz" 72', maxWidth: 780 }}>
                Every token, <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>documented</em>.
              </h2>
              <p style={{ fontSize: 16.5, color: 'var(--ink-2)', maxWidth: 620, lineHeight: 1.55 }}>
                The visual grammar of Spectra. Colours, type scales, component states — all defined with exactness. No ambiguity in the handoff.
              </p>
            </div>
          </div>

          {/* Colour swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>

            {/* Colours */}
            <div style={{ padding: 32, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--klein)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 1, background: 'var(--klein)', display: 'inline-block' }} />
                COLOUR SYSTEM
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 24, letterSpacing: '-0.02em', fontWeight: 500 }}>
                Six <em style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 400 }}>controlled</em> pigments.
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
                {[
                  { bg: 'var(--paper)',  name: 'Paper',  hex: '#F6F4EC', dark: false },
                  { bg: 'var(--paper-2)',name: 'Paper 2',hex: '#FAF8F1', dark: false },
                  { bg: 'var(--ink)',    name: 'Ink',    hex: '#0A0B0E', dark: true  },
                  { bg: 'var(--klein)', name: 'Klein',  hex: '#1E2AFF', dark: true  },
                  { bg: 'var(--cyan)',  name: 'Cyan',   hex: '#00D4FF', dark: false },
                  { bg: 'var(--plum)', name: 'Plum',   hex: '#4B1E7A', dark: true  },
                ].map(sw => (
                  <div key={sw.name} style={{ aspectRatio: '1/1', borderRadius: 'var(--r-sm)', background: sw.bg, border: '1px solid var(--rule)', padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: sw.dark ? 'rgba(246,244,236,0.9)' : 'var(--ink-2)' }}>{sw.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', opacity: 0.7, color: sw.dark ? 'rgba(246,244,236,0.7)' : 'var(--ink-3)' }}>{sw.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Type scale */}
            <div style={{ padding: 32, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--klein)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 1, background: 'var(--klein)', display: 'inline-block' }} />
                TYPE SYSTEM
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 24, letterSpacing: '-0.02em', fontWeight: 500 }}>
                Three <em style={{ fontStyle: 'italic', color: 'var(--klein)', fontWeight: 400 }}>typefaces</em>, three roles.
              </h3>
              <div style={{ borderTop: '1px solid var(--rule)' }}>
                {[
                  { meta: 'Fraunces', sample: 'Quiet laboratory.', size: '96 opsz 144', serif: true },
                  { meta: 'Fraunces', sample: 'Specimen analysis', size: '32 opsz 72',  serif: true },
                  { meta: 'Geist',    sample: 'Compression workspace', size: '16 / 500', serif: false },
                  { meta: 'JetBrains Mono', sample: '31.82 dB · 10.4:1', size: '13 / 400', serif: false, mono: true },
                ].map(r => (
                  <div key={r.meta + r.size} style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '110px 1fr 80px', gap: 20, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{r.meta}</span>
                    <span style={{ fontFamily: r.mono ? 'var(--font-mono)' : r.serif ? 'var(--font-serif)' : 'var(--font-sans)', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{r.sample}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', textAlign: 'right' }}>{r.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Master prompt — full width */}
            <div style={{ gridColumn: '1 / -1', padding: '40px 48px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--r-xl)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '40%', aspectRatio: '1/1', background: 'radial-gradient(circle, rgba(0,212,255,0.3), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 16, position: 'relative' }}>◆ ENGINEERING BRIEF</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, letterSpacing: '-0.02em', marginBottom: 20, fontWeight: 400, position: 'relative', lineHeight: 1.1 }}>
                Build the <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>atelier</em>, not the lab.
              </h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.75, color: 'rgba(246,244,236,0.82)', position: 'relative' }}>
                Stack: React · React Router · Tailwind CSS v4 · Motion · Recharts{'\n'}
                Fonts: Fraunces (serif authority) · Geist (sans chrome) · JetBrains Mono (numeric evidence){'\n'}
                Palette: Paper #F6F4EC · Klein Blue #1E2AFF · Cyan #00D4FF (live-state only){'\n'}
                Shadows: layered paper stock, no glow on static elements{'\n'}
                Animations: shimmer = encoding, orb = stage N of 7, pulse = live sync{'\n'}
                Workspace: 3-column (rail 300px / stage flex / observation 290px){'\n'}
                Every "wow" must correspond to a real application state.
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════
          FOOTER
          ═══════════════════════════ */}
      <footer style={{ padding: '80px 0 48px', borderTop: '1px solid var(--rule)', marginTop: 40 }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid var(--rule)', alignItems: 'end' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(80px, 10vw, 156px)', lineHeight: 0.82, color: 'var(--ink)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144' }}>
              Spectra<span style={{ color: 'var(--klein)' }}>.</span><br />
              <span style={{ fontStyle: 'italic', color: 'var(--klein)' }}>Atelier</span>
            </div>
            <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 32px' }}>
              {[
                { to: '/',          label: 'Overview'  },
                { to: '/dashboard', label: 'Workspace' },
                { to: '/results',   label: 'Results'   },
                { to: '/history',   label: 'Log'       },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ color: 'var(--ink-1)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '6px 0', borderBottom: '1px solid var(--rule-soft)', display: 'block', transition: 'color 0.2s' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.15em', flexWrap: 'wrap', gap: 12 }}>
            <span>CENG 384 · INTRO. TO SIGNAL PROCESSING · GROUP 10 · APR 2026</span>
            <span>Ezginur Kalfaoğlu · Gül Deniz Özdemir · Fatmanur Durak · Ayşe Berfin Özçelik · Melike Şahin · Azra Erbaş</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
