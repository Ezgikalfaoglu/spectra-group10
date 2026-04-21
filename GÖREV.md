# 👋 Ayşe Berfin — Senin Branch'in: `feature/quantization-berfin`

## StackBlitz'te Aç (tarayıcıdan, kurulum gerektirmez)
👉 https://stackblitz.com/github/Ezgikalfaoglu/spectra-group10/tree/feature/quantization-berfin

## Yerel Çalıştırma
```bash
npm install
npm run dev
# Tarayıcı: http://localhost:3000/quantization
```

---

## Senin Dosyan
```
src/app/pages/QuantizationPage.tsx   ← SADECE BU DOSYAYA DOKUNUYORSUN
```

## Yapman Gerekenler

### 1. Quantization Tipi Seçici
- İki seçenek yan yana: **"Uniform"** | **"Scalar"**
- `sp-seg` / `sp-seg-btn` / `sp-seg-btn-active` class'larını kullan

### 2. Step Size Slider
- Aralık: **1 – 64**
- Sürüklerken sağda anlık değer göster (`font-mono`, `var(--klein)`)
- Değer değiştikçe tahmini PSNR ve CR **canlı güncellenir** (aşağıdaki formülle)
- `sp-slider-thumb` stilini kullan

```js
// Tahmini hesaplama (mock, yeterli)
const estPSNR = Math.max(20, 42 - stepSize * 0.35).toFixed(1)
const estCR   = (1 + stepSize * 0.14).toFixed(1) + ":1"
```

### 3. Lossless Toggle
- `Switch` bileşeni (shadcn/ui): `import { Switch } from '@/components/ui/switch'`
- Toggle **açıkken:**
  - Slider ve tip seçici `disabled` (soluk görünür)
  - `Lock` ikonu + **"Kayıpsız mod aktif"** amber renkli banner
  - PSNR tahmini → "∞ dB", CR → "1:1"

### 4. Canlı Kalite Tahmin Kartı
Büyük sayılarla `font-serif italic`:
- **PSNR** değeri ve rengi:
  - > 35 dB → `var(--leaf)` yeşil
  - 28–35 dB → amber/turuncu
  - < 28 dB → `#d4574c` kırmızı
- **CR** değeri (örn. `8.5:1`)

### 5. "Bu Ayarlar Ne Anlama Gelir?" Açıklaması
```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent }
  from '@/components/ui/collapsible'
```
Tıklayınca açılan kısa açıklama (2–3 cümle, step size ve CR ilişkisi)

### 6. Geri / İleri Navigasyon
- `sp-btn sp-btn-ghost` → ← `/transform`
- `sp-btn sp-btn-klein` → `/processing` →
- İleri gitmeden `localStorage["spectra_quantization"]`'a kaydet

### 7. Demo Modu
- `localStorage["spectra_transform"]` boşsa varsayılan değerlerle başlat

---

## Renk & Stil Referansı
```css
var(--leaf)     /* yeşil — iyi kalite */
var(--klein)    /* #1E2AFF — slider, seçili */
var(--paper-2)  /* kart arka planı */
var(--font-serif) /* büyük metrik sayıları */
var(--font-mono)  /* label ve değerler */
```

## localStorage Çıktın
```js
localStorage.setItem("spectra_quantization", JSON.stringify({
  quantizationType: "scalar",  // "uniform" | "scalar"
  stepSize: 18,                // 1-64
  lossless: false              // true | false
}))
```

## Commit & Push
```bash
git add src/app/pages/QuantizationPage.tsx
git commit -m "feat(quantization): step size slider ve canlı PSNR tahmini"
git push
```
Bitince GitHub'da **Pull Request** aç → Ezgi review yapar.
