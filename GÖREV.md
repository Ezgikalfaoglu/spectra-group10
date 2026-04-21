# 👋 Fatmanur — Senin Branch'in: `feature/transform-fatmanur`

## StackBlitz'te Aç (tarayıcıdan, kurulum gerektirmez)
👉 https://stackblitz.com/github/Ezgikalfaoglu/spectra-group10/tree/feature/transform-fatmanur

## Yerel Çalıştırma
```bash
npm install
npm run dev
# Tarayıcı: http://localhost:3000/transform
```

---

## Senin Dosyan
```
src/app/pages/TransformPage.tsx   ← SADECE BU DOSYAYA DOKUNUYORSUN
```

## Yapman Gerekenler

### 1. Yöntem Seçici (Segmented Control)
- İki buton yan yana: **"JPEG (DCT)"** | **"J2K (DWT)"**
- `sp-seg` / `sp-seg-btn` / `sp-seg-btn-active` class'larını kullan
- Seçim değişince `AnimatePresence` ile alt seçenekler animasyonlu açılır/kapanır

### 2. Wavelet Filtre Seçimi *(sadece J2K seçilince görünür)*
Üç pill buton:
- `Haar` · `db2` · `db4`
- `sp-pill` class; seçili → `sp-pill-active` (klein mavi)

### 3. Ayrışım Seviyesi *(sadece J2K seçilince görünür)*
- 1'den 5'e pill butonlar yan yana
- Seçilen seviye değişince `DWTSubbandsViz` bileşeni canlı güncellenir
- Geçişte animasyon ekle (`motion`)

### 4. DWT Alt-Bant Görselleştirmesi
- `DWTSubbandsViz` bileşenini import et ve kullan:
```tsx
import { DWTSubbandsViz } from '../components/DWTSubbandsViz';
<DWTSubbandsViz level={decompositionLevel} />
```
- Seviye değişince bileşen animasyonlu geçiş yapsın

### 5. Seçim Özet Kartı
- Seçilen metot + tüm parametreleri `paper-2` arka planlı kart içinde göster
- Font: `font-mono`, renk: `var(--ink-3)` label · `var(--ink)` değer

### 6. Geri / İleri Navigasyon
- `sp-btn sp-btn-ghost` → ← `/upload`
- `sp-btn sp-btn-klein` → `/quantization` →
- `localStorage["spectra_transform"]`'a kaydet sonra ileri git

### 7. Demo Modu
- `localStorage["spectra_upload"]` boşsa varsayılan değerlerle başlat
- Küçük "Demo modu" badge göster

---

## Renk & Stil Referansı
```css
var(--klein)     /* #1E2AFF — seçili state */
var(--paper-2)   /* kart arka planı */
var(--rule)      /* hairline border */
var(--font-mono) /* sayılar ve label'lar */
var(--cyan)      /* #00D4FF — sadece aktif/canlı state */
```

## localStorage Çıktın
```js
localStorage.setItem("spectra_transform", JSON.stringify({
  method: "jpeg2000",        // "jpeg" | "jpeg2000"
  waveletFilter: "db4",      // "haar" | "db2" | "db4"
  decompositionLevel: 3      // 1-5
}))
```

## Commit & Push
```bash
git add src/app/pages/TransformPage.tsx
git commit -m "feat(transform): yöntem seçici ve DWT vizualizasyonu"
git push
```
Bitince GitHub'da **Pull Request** aç → Ezgi review yapar.
