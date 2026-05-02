# 👋 Ayşe Berfin — `feature/quantization-berfin`

> **İterasyon 2** — Hoca geri bildirimleri sonrası
> Genel proje haritası: `TASKS_V2.md` (main'de)

## 📋 Senin sorumluluğun

Bu iterasyonda **2 sayfa** sende:
- ✅ `/quantization` — Senin orijinal sayfan
- 🆕 `/entropy` — **YENİ sayfa**, sahibi sensin (quantization'dan hemen sonra geliyor)

> ⚠️ **Hoca'nın özel ricası:** "CR (compression ratio) çok küçük, **minimum 16 olsun**, yükseldikçe görsel bozulma da artsın." → Formül zaten güncellendi (`baseCR = 16 + (s/64)^0.85 × 64`). Sen UI tarafını cilala.

---

## 🚀 1. Ortamı kur

### GitHub Codespaces (tavsiye)
1. https://github.com/Ezgikalfaoglu/spectra-group10 → **`<> Code`** → **Codespaces** → **Create codespace on `feature/quantization-berfin`**
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
git checkout feature/quantization-berfin
git pull
nvm use 20
npm install
npm run dev
```

> ❗ `crypto$2.getRandomValues` hatası → `nvm use 20`

---

## 🎯 2. Yapacakların

### Görev A — Quantization sayfasında live matrix preview ekle

**Dosya:** `src/app/pages/QuantizationPage.tsx`

Sağdaki "Estimated Output" kartının altına yeni bir kart ekle: **Quantization Effect Preview**.

Fatmanur'un `DCTBlockPanel` bileşenini kullan ama prop ile `delta = settings.stepSize` gönder. Böylece slider'ı oynatınca matriste **HF hücrelerin sıfıra düştüğü** canlı görünür. Hoca'ya quantization'ın matematiksel etkisini göster.

```tsx
import { DCTBlockPanel } from '../components/DCTBlockPanel';

// JSX'te:
<div className="sp-card" style={{ overflow: 'hidden' }}>
  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
      QUANTIZATION EFFECT · LIVE
    </span>
  </div>
  <DCTBlockPanel delta={settings.stepSize} />
</div>
```

**Not:** `DCTBlockPanel`'in şu an `delta` prop'u yok. Fatmanur eklediğinde sen kullanacaksın. Bu görev **ona bağımlı** — önce Fatmanur ile koordine et veya sen bir override yap (`DCTBlockPanel` source'unu local'de kopyala, prop ekle).

### Görev B — Lossless durumunu daha belirgin yap

**Dosya:** `src/app/pages/QuantizationPage.tsx`

Lossless toggle açıkken:
- Step size slider grileşsin (zaten var, ama opacity 0.5 → 0.3 yap)
- Quality scale gradient'ında handle'ı **leaf yeşili** yap, "LOSSLESS" yazısı çıksın
- "Quality preview" sayılarını "∞ dB" / "2.4:1" yerine animasyonlu serif ital yazıyla göster

### Görev C — `/entropy` sayfasını sahiplen ve genişlet

**Dosya:** `src/app/pages/EntropyPage.tsx`

**Şu an:** Coder seçici (3 seçenek) + canlı bpp/CR kart + sembol frekans bar chart. Pre-coder Options bölümü kaldırıldı.

**Eklenecek 4 şey:**

#### C.1 — TypePresetBanner ekle (sayfanın üstüne)
```tsx
import { TypePresetBanner } from '../components/TypePresetBanner';

<TypePresetBanner
  stage="entropy"
  onApply={(p) => setSettings(s => ({ ...s, coder: p.coder }))}
/>
```

#### C.2 — Bar chart rengini coder'a göre değiştir
Şu an mavi gradyan. Seçili coder'a göre:
- Default Huffman → klein
- Custom Huffman → leaf
- Arithmetic → plum

```tsx
const coderColor = {
  'huffman-default': 'var(--klein)',
  'huffman-custom':  'var(--leaf)',
  'arithmetic':      'var(--plum)',
}[settings.coder];

// Bar style:
background: `linear-gradient(180deg, ${coderColor} 0%, ${coderColor}66 100%)`,
```

#### C.3 — Estimated bitstream size kartı
Sağ panele yeni bir alt-kart: **estimated payload in KB**.

```tsx
// Mock: 1024×1024 image
const estimatedKB = Math.round((1024 * 1024 * bpp) / (8 * 1024));

<div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)' }}>
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
    Estimated Bitstream
  </div>
  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)' }}>
    {estimatedKB}<span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', fontSize: 11, color: 'var(--klein)', marginLeft: 6 }}>KB</span>
  </div>
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
    1024 × 1024 · {bpp} bpp
  </div>
</div>
```

#### C.4 — Coder formula card
Sayfa altına küçük bir bilgi kartı: **"Why these matter"**.

```
Default Huffman   ─ static tables, no per-image overhead, 5-10% over arithmetic
Custom Huffman    ─ optimized for this specimen, 4-32 byte table overhead
Arithmetic        ─ continuous fraction encoding, theoretical optimum
```

---

## 🧪 3. Test et

```bash
npm run dev
```

Test senaryosu:
1. `/quantization` → Δ slider'ı 1'den 64'e oynat
   - **CR önizlemesi her zaman ≥ 16:1** (kontrol et!)
   - Δ=64'te PSNR < 18 dB
   - Lossless aç → CR ≈ 2.4:1, PSNR = ∞
2. `/entropy` → coder değiştir
   - bar chart rengi değişiyor mu?
   - Estimated KB güncelleniyor mu?
3. Pipeline akışı: `/quantization` → "Next: Entropy" → `/entropy` → "Next: Process" → `/processing` (otomatik geçiş)
4. TypePresetBanner: AI Generated tipinde "Apply preset" → coder = Custom Huffman olmalı

Build:
```bash
npx tsc --noEmit
npm run build
```

---

## 📤 4. Commit & push

```bash
git add src/app/pages/QuantizationPage.tsx src/app/pages/EntropyPage.tsx
git commit -m "feat(quantize+entropy): live matrix preview, color-coded bars, payload estimate"
git push origin feature/quantization-berfin
```

PR aç: `feature/quantization-berfin` → `main`

---

## 🆘 Takıldığında

- **CR < 16 hesaplıyorsa formül senin değişmiş demektir** — `estimateMetrics` fonksiyonunu kontrol et:
  ```ts
  const baseCR = 16 + Math.pow(stepSize / 64, 0.85) * 64;
  ```
- **DCTBlockPanel `delta` prop'u yok diyor:** Fatmanur'un ekran ekran cevabını bekle veya sen bir kopyasını al
- **TypePresetBanner sayfada görünmüyor:** localStorage'da `spectra_upload` boş → önce Upload'da görsel yükle

---

## 📚 Yararlı dosyalar

- `src/app/pages/QuantizationPage.tsx` — senin orijinal sayfan
- `src/app/pages/EntropyPage.tsx` — yeni, senin sayfan
- `src/app/lib/imageTypeProfiles.ts` — sadece okuma
- `src/app/components/TypePresetBanner.tsx` — hazır
- `TASKS_V2.md` — ekip roadmap'i

İyi çalışmalar! 📊
