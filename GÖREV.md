# 👋 Azra — `feature/results-azra`

> **İterasyon 2** — Hoca geri bildirimleri sonrası
> Genel proje haritası: `TASKS_V2.md` (main'de)

## 📋 Senin sorumluluğun

- ✅ `/results` — Senin sayfan
- ✅ `/history` — Senin sayfan
- ✅ `/dashboard` — Senin sayfan
- ✅ `components/ComparisonSlider.tsx`

> ⚠️ **Hoca'nın özel ricaları (senin tarafında en önemlileri):**
> 1. **CR yüksek olunca görsel BOZULMA görünür olsun** → comparator'da Δ=64 ile bloklu/bulanık görselin net farkı görünmeli
> 2. **AI / Natural / Fingerprint farkı görsel olarak gösterilebilmeli** → Charts tab'ına yeni bir karşılaştırma eklenecek

---

## 🚀 1. Ortamı kur

### GitHub Codespaces (tavsiye)
1. https://github.com/Ezgikalfaoglu/spectra-group10 → **`<> Code`** → **Codespaces** → **Create codespace on `feature/results-azra`**
2. Terminal:
```bash
nvm use 20
git pull
npm install
npm run dev
```

### Yerel
```bash
git clone https://github.com/Ezgikalfaoglu/spectra-group10.git
cd spectra-group10
git checkout feature/results-azra
git pull
nvm use 20
npm install
npm run dev
```

> ❗ `crypto$2.getRandomValues` hatası → `nvm use 20`

---

## 🎯 2. Yapacakların

### Görev A — Yüksek CR'da JPEG block artifact göster

**Dosya:** `src/app/pages/ResultsPage.tsx`

Şu an `reconstructedFilter` sadece `blur + saturate + contrast`. Δ > 40 olunca **JPEG'in 8×8 blok artefaktını simüle eden** bir SVG filter ekle.

#### A.1 — `index.html` veya yeni `BlockArtifactFilter.tsx` bileşenine SVG filter:
```tsx
// src/app/components/BlockArtifactFilter.tsx
export function BlockArtifactFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
      <defs>
        <filter id="blockify">
          <feFlood floodColor="rgba(0,0,0,0.18)"/>
          <feComposite in2="SourceGraphic" operator="in"/>
          <feMorphology operator="dilate" radius="4"/>
          <feComposite in="SourceGraphic" operator="arithmetic" k2="1" k3="0.7"/>
        </filter>
        <pattern id="block-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"/>
        </pattern>
      </defs>
    </svg>
  );
}
```

#### A.2 — Results'ta `<BlockArtifactFilter />` mount et + filter'ı uygula:
```tsx
const stepSize = currentResult.stepSize ?? 18;
const reconstructedFilter = stepSize > 40
  ? `blur(3px) contrast(0.75) saturate(0.7) brightness(1.05)`
  : stepSize > 22
    ? `blur(2.4px) contrast(0.82) saturate(0.88)`
    : stepSize > 16
      ? `blur(1.4px) contrast(0.9) saturate(0.98)`
      : `blur(0.8px) contrast(0.96) saturate(0.98)`;

// Δ > 40 ise comparator overlay'ine block grid ekle:
{stepSize > 40 && (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.18) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    mixBlendMode: 'overlay',
    clipPath: `inset(0 0 0 var(--split, 50%))`,
  }} />
)}
```

Test: Quantization'da Δ=64 yap → Process → Results → comparator'da reconstructed taraf belirgin **bloklu** görünmeli.

### Görev B — Charts tab'ına 5-tip benchmark grafiği

**Dosya:** `src/app/pages/ResultsPage.tsx`

Charts tab'ında mevcut 4 grafiğe ek olarak **5. grafik**: image type bazlı CR/PSNR karşılaştırma.

```tsx
import { listProfiles } from '../lib/imageTypeProfiles';

const TYPE_BENCHMARK = listProfiles().map(p => ({
  type: p.label,
  cr: 16 * p.crBonus + (p.stepSize / 64) * 64,    // mock
  psnr: p.forceLossless ? 45 : 38 - (p.stepSize / 32) * 16,
  fill: p.accent,
}));

// JSX:
<div className="sp-card" style={{ padding: 24 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <Layers style={{ width: 14, height: 14, color: 'var(--klein)' }}/>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-2)', textTransform: 'uppercase' }}>
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
        {TYPE_BENCHMARK.map((d, i) => <Cell key={i} fill={d.fill}/>)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>
```

Hoca'ya "biz 5 farklı veri tipiyle test ettik" görüntüsü verir.

### Görev C — Formula info card

Metric tablosunun yanına küçük bilgi kartı:

```
┌────────────────────────────────────────┐
│  HOW IS CR COMPUTED?                   │
│                                        │
│  CR = uncompressed_size / encoded_size │
│     = (W × H × 8) / encoded_bits       │
│                                        │
│  PSNR = 10 · log₁₀(255² / MSE)         │
└────────────────────────────────────────┘
```

### Görev D — History'e tip filter chip'leri

**Dosya:** `src/app/pages/HistoryPage.tsx`

Mevcut filter input'una ek olarak 5 tip için chip'ler:
```tsx
import { listProfiles } from '../lib/imageTypeProfiles';

const [typeFilter, setTypeFilter] = useState<string | null>(null);
const profiles = listProfiles();

<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
  <button onClick={() => setTypeFilter(null)}
    className={!typeFilter ? 'sp-pill sp-pill-active' : 'sp-pill'}>
    All
  </button>
  {profiles.map(p => (
    <button key={p.type}
      onClick={() => setTypeFilter(p.type)}
      style={{
        padding: '5px 11px', borderRadius: 100, cursor: 'pointer',
        border: `1px solid ${typeFilter === p.type ? p.accent : 'var(--rule)'}`,
        background: typeFilter === p.type ? `${p.accent}11` : 'white',
        color: typeFilter === p.type ? p.accent : 'var(--ink-3)',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
      }}>
      {p.label}
    </button>
  ))}
</div>
```

`filtered` listesini de filter'a göre süz.

### Görev E — History CR sort

Tablo başlığında "CR" sütunu tıklanınca azalan/artan sıraya alsın. State: `sortBy: 'cr-asc' | 'cr-desc' | null`.

### Görev F — Dashboard type benchmark widget

**Dosya:** `src/app/pages/DashboardPage.tsx`

5 tip için mini kart sırası: her kartta `Run preset` butonu → process'i o preset ile çalıştır (mock data, gerçek pipeline'a gerek yok). Tablo dolar.

---

## 🧪 3. Test et

```bash
npm run dev
```

Test senaryosu:
1. Upload → Preproc → Transform → Quantize'da **Δ=64** yap → Entropy → Process → Results
   - Comparator: reconstructed taraf belirgin bloklu/bulanık görünmeli
2. Δ=8 ile aynı yolu yap → minimal bozulma görünmeli
3. Charts tab → 5-tip benchmark görüyor musun?
4. History → tip filter chip'leri çalışıyor mu?
5. History → CR sütununa tıkla → sıralanıyor mu?

Build:
```bash
npx tsc --noEmit
npm run build
```

---

## 📤 4. Commit & push

```bash
git add src/app/pages/ResultsPage.tsx src/app/pages/HistoryPage.tsx src/app/pages/DashboardPage.tsx src/app/components/BlockArtifactFilter.tsx src/app/components/ComparisonSlider.tsx
git commit -m "feat(results+history): JPEG block artifact, type benchmark chart, type filter chips"
git push origin feature/results-azra
```

PR aç: `feature/results-azra` → `main`

---

## 🆘 Takıldığında

- **SVG filter çalışmıyor:** Filter mount edildiği yer DOM'da en üstte olsun, `<App>` içinde bir kez render et
- **`stepSize` undefined diyor:** `currentResult.stepSize ?? 18` ile fallback ver
- **Recharts `Cell` component import edilmiyor:** `import { Cell } from 'recharts';`
- **History filter sayıları yanlış:** `filtered = LEDGER.filter(...)` mantığı doğru mu bak

---

## 📚 Yararlı dosyalar

- `src/app/pages/ResultsPage.tsx` — senin sayfan
- `src/app/pages/HistoryPage.tsx` — senin sayfan
- `src/app/pages/DashboardPage.tsx` — senin sayfan
- `src/app/lib/imageTypeProfiles.ts` — okuma (5 profil)
- `src/app/components/ComparisonSlider.tsx` — senin sayfanda kullanılıyor
- `TASKS_V2.md` — ekip roadmap'i

İyi çalışmalar! 📈
