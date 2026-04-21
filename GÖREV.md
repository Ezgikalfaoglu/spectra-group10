# 👋 Azra — Senin Branch'in: `feature/results-azra`

## GitHub Codespaces ile Aç (Tavsiye Edilen — kurulum gerektirmez)

1. `github.com/Ezgikalfaoglu/spectra-group10` → branch olarak **`feature/results-azra`** seç
2. Yeşil **`<> Code`** butonu → **Codespaces** sekmesi → **Create codespace on feature/results-azra**
3. Tarayıcıda VS Code açılır, terminale yaz:
```bash
npm install
npm run dev
```
4. Açılan port linkine tıkla → `/results`, `/history`, `/dashboard` canlı görünür

## Yerel Çalıştırma (isteğe bağlı)
```bash
git clone https://github.com/Ezgikalfaoglu/spectra-group10.git
cd spectra-group10
git checkout feature/results-azra
npm install
npm run dev
# Sayfaların: /results  /history  /dashboard
```

---

## Senin Dosyaların (3 sayfa)
```
src/app/pages/ResultsPage.tsx     ← Sonuçlar
src/app/pages/HistoryPage.tsx     ← Geçmiş
src/app/pages/DashboardPage.tsx   ← Ana çalışma alanı
```

---

## ResultsPage (`/results`)

### 1. ComparisonSlider — Görüntü Karşılaştırıcı
```tsx
import { ComparisonSlider } from '../components/ComparisonSlider';
```
- Sol: orijinal görüntü · Sağ: sıkıştırılmış görüntü
- Sürüklenebilir beyaz çizgi ortada
- 3 mod butonu: **REVEAL** | **SPLIT** | **LENS**

### 2. Metrik Kartları
MSE · PSNR · CR · Sparsity için 4 kart:
- Büyük `font-serif italic` sayı
- Alt satırda delta badge: JPEG'e göre fark (↑ yeşil, ↓ kırmızı)
- Ince progress bar (`var(--klein)` rengi)

### 3. InsightCard
```tsx
import { InsightCard } from '../components/InsightCard';
```
`var(--ink)` arka plan, `var(--cyan)` aksan — `lastResult` verisine göre içerik üret

### 4. Grafikler (recharts)
```tsx
import { LineChart, BarChart, RadarChart, ... } from 'recharts';
```
- **LineChart:** PSNR vs Step Size eğrisi
- **BarChart:** JPEG ↔ JPEG2000 CR karşılaştırması
- **RadarChart:** 4 metriği tek radar'da göster

### 5. JSON İndir Butonu
```js
const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
// <a href={url} download="spectra-result.json">
```

### 6. Demo Modu
`lastResult` boşsa `DEMO_RESULT` sabit verisiyle çalış (dosyada zaten var)

---

## HistoryPage (`/history`)

### 1. Benchmark Tablosu
`compressionHistory` dizisini tablo olarak göster:

| Tarih | Görüntü | Metot | PSNR | CR | Sparsity | |
|---|---|---|---|---|---|---|
| 21 Nis | gorsel.jpg | JPEG2000 | 31.82 dB | 10.4:1 | 78% | [Aç] [Sil] |

### 2. Satır Genişletme
```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent }
  from '@/components/ui/collapsible'
```
Tıklayınca mini grafik + tam parametre özeti açılır

### 3. Filtre & Sıralama
- Metot filtresi: "Tümü | JPEG | JPEG2000" (`sp-seg`)
- PSNR'a göre büyükten küçüğe sıralama

### 4. Sil Butonu
- Çöp kutusu ikonuna tıklayınca satır slide-out animasyonuyla kaybolur
- `localStorage["compressionHistory"]` güncellenir

### 5. Boş Durum
Geçmiş yoksa:
```
font-serif italic büyük: "Henüz kayıt yok."
sp-btn sp-btn-klein: "Workspace'i Aç" → /dashboard
```

---

## DashboardPage (`/dashboard`)

### 1. 3 Kolon Layout
```
[Sol Rail 300px] [Orta Stage flex] [Sağ Observation 290px]
```
LandingPage'deki mock'u gerçek state'e bağla — bu sayfa tüm akışı tek ekranda barındırır.

### 2. Sol Rail
- Görsel yükleme alanı (mini upload zone)
- Metot seçici (`sp-seg`)
- Step size slider
- "Run" butonu (`sp-btn sp-btn-klein`)

### 3. Orta Stage
- Pipeline stepper (7 aşama) — `PipelineStepper` bileşeni
- `ComparisonSlider` — görüntü karşılaştırıcı

### 4. Sağ Observation
- 4 metrik (`sp-metric-item` stiliyle), sayaç animasyonu
- `InsightCard` bileşeni
- Son 3 çalıştırma mini kartı (geçmiş özeti)

### 5. Run Butonu Akışı
- Tıklayınca: disabled + shimmer
- İşlem tamamlanınca: yeşil "Done" + `/results`'a link

---

## Renk & Stil Referansı
```css
var(--klein)      /* grafik rengi, seçili state */
var(--cyan)       /* InsightCard aksan, canlı state */
var(--leaf)       /* pozitif delta, yeşil */
var(--paper-2)    /* kart arka planı */
var(--font-serif) /* büyük metrik sayıları */
var(--font-mono)  /* label, tarih, değer */
```

## Commit & Push
```bash
# Her sayfa için ayrı commit atabilirsin
git add src/app/pages/ResultsPage.tsx
git commit -m "feat(results): comparison slider ve metrik kartları"

git add src/app/pages/HistoryPage.tsx
git commit -m "feat(history): benchmark tablosu ve filtreler"

git add src/app/pages/DashboardPage.tsx
git commit -m "feat(dashboard): 3 kolon layout ve run akışı"

git push
```
Bitince GitHub'da **Pull Request** aç → Ezgi review yapar.
