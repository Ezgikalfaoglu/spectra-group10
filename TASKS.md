# Spectra · UI Görev Dağılımı
**CENG 384 · Group 10** | Ankara Bilim Üniversitesi  
Tasarım sistemi: `spectra.css` değişkenleri · shadcn/ui bileşenleri · Motion animasyonları

---

## Kurallar (herkes okur)

| Kural | Açıklama |
|---|---|
| **Dokunma yasağı** | `Navbar.tsx`, `routes.tsx`, `App.tsx`, `theme.css`, `spectra.css` → sadece Ezgi |
| **Renk/font** | Yeni değişken oluşturma; `spectra.css`'teki `--klein`, `--cyan`, `--paper`, `--ink-*` kullan |
| **Veri** | Backend yok → localStorage üzerinden. Sayfa açıkken localStorage boşsa **demo data** otomatik yükle |
| **Animasyon** | `motion/react` kullan. Dekoratif loop animasyon yok; her hareket gerçek bir state geçişine bağlı olmalı |
| **Commit** | `git pull` → kendi sayfanı düzenle → `git add src/app/pages/SayfaAdin.tsx` → `git commit -m "feat(upload): ..."` |

---

## 1 · Ezginur Kalfaoğlu — PM & System Integrator

**Dosyalar:** `LandingPage.tsx` · `Navbar.tsx` · `App.tsx` · `routes.tsx`

### UI Görevleri
- [x] **Landing — Cover bölümü**: Hero başlık, specimen kartları, metric chip'leri
- [x] **Landing — Agency critique**: 3 sütunlu kart layout (A/B/C ajans)
- [x] **Landing — Atelier vision**: Spectra. _Atelier_ büyük serif display + ilkeler listesi
- [x] **Landing — Workspace preview**: 3 kolon mock (rail / stage / observation)
- [x] **Landing — Blueprint**: Renk paleti swatch'ları + type scale tablosu
- [ ] **Navbar**: Aktif route'a göre underline indicator; mobil hamburger menü (≤768 px)
- [ ] **PipelineStepper entegrasyonu**: Her sayfada doğru `currentStep` prop'u geldiğini doğrula
- [ ] **404 / hata sayfası**: Sade, `sp-btn sp-btn-klein` ile "Ana sayfaya dön" butonu

---

## 2 · Gül Deniz Özdemir — Upload Page (`/upload`)

**Dosya:** `src/app/pages/UploadPage.tsx`  
**localStorage çıktı:** `spectra_upload`

### UI Görevleri
- [ ] **Drop zone**: `border: 2px dashed var(--rule)` kutu; hover → `border-color: var(--klein)`; aktif sürükleme → `background: rgba(30,42,255,0.04)` + scale(1.01) geçişi
- [ ] **Dosya önizleme**: Yüklenen görsel `sp-upload-zone` içinde thumbnail olarak göster; sağ üst X butonu ile kaldırma
- [ ] **Metadata kartı**: `background: var(--paper-2)` kart → Çözünürlük · Boyut · Renk modu · Format bilgileri `font-mono` ile
- [ ] **Görüntü türü seçici**: "Natural / Synthetic / Fingerprint / Biomedical" — 4'lü radio group, seçili → klein mavi border
- [ ] **Hata durumu**: Geçersiz format uyarısı (`AlertCircle` + kırmızı border + shake animasyonu)
- [ ] **İleri butonu**: `sp-btn sp-btn-klein` → `/transform` → localStorage boşsa disabled + tooltip
- [ ] **Demo modu**: localStorage boşsa örnek görsel + metadata otomatik doldur (kullanıcıya göster)

---

## 3 · Fatmanur Durak — Transform Page (`/transform`)

**Dosya:** `src/app/pages/TransformPage.tsx`  
**localStorage çıktı:** `spectra_transform`

### UI Görevleri
- [ ] **Yöntem seçici**: `sp-seg` / `sp-seg-btn` ile iki buton: "JPEG (DCT)" | "J2K (DWT)"; J2K seçilince alt seçenekler `AnimatePresence` ile açılır
- [ ] **Wavelet filtre seçimi** *(J2K only)*: Haar · db2 · db4 — pill butonları (`sp-pill`); seçili → `sp-pill-active`
- [ ] **Ayrışım seviyesi** *(J2K only)*: 1–5 pill row; seçili seviyeye göre `DWTSubbandsViz` bileşeni canlı güncellenir
- [ ] **DWT alt-bant görselleştirmesi**: `DWTSubbandsViz` bileşenini göster; seçili level değişince animasyonlu geçiş
- [ ] **Seçim özeti kartı**: Seçilen metot + parametre özetini `paper-2` arkaplan kart içinde göster
- [ ] **Geri / İleri navigasyon**: `sp-btn sp-btn-ghost` (← Upload) + `sp-btn sp-btn-klein` (Quantization →)
- [ ] **Demo modu**: `spectra_upload` boşsa sample veriyle başlat

---

## 4 · Ayşe Berfin Özçelik — Quantization Page (`/quantization`)

**Dosya:** `src/app/pages/QuantizationPage.tsx`  
**localStorage çıktı:** `spectra_quantization`

### UI Görevleri
- [ ] **Quantization tipi**: "Uniform | Scalar" segmented control (`sp-seg`)
- [ ] **Step size slider**: Range 1–64; sürükleme sırasında PSNR / CR tahmini canlı güncelle (formül tabanlı mock hesap yeterli); `sp-slider-thumb` stili
- [ ] **Lossless toggle**: `Switch` bileşeni; açık → step size ve tip disabled + `Lock` ikonu + sarı/amber uyarı banner
- [ ] **Canlı kalite tahmin kartı**: Tahmini PSNR (dB) + CR değeri büyük serif sayı olarak göster; renk → PSNR > 35 → yeşil (`var(--leaf)`), 28–35 → amber, <28 → kırmızı
- [ ] **Expert açıklaması**: `Collapsible` (radix) → "Bu ayarlar ne anlama gelir?" içinde kısa açıklama
- [ ] **Geri / İleri**: `sp-btn sp-btn-ghost` (← Transform) + `sp-btn sp-btn-klein` (Processing →)
- [ ] **Demo modu**: `spectra_transform` boşsa varsayılan değerlerle başlat

---

## 5 · Melike Şahin — Processing Page (`/processing`)

**Dosya:** `src/app/pages/ProcessingPage.tsx`  
**localStorage çıktı:** `lastResult` + `compressionHistory`

### UI Görevleri
- [ ] **7 aşamalı pipeline animasyonu**: Her aşama sırayla aktifleşir (`sp-pstep-dot`, `sp-pstep-dot-active`, `sp-pstep-dot-done`); aralarında `sp-pipe-fill` progress bar ilerler
- [ ] **Aşama açıklaması**: Aktif aşamanın adı + kısa açıklama `font-serif italic` ile orta alanda göster
- [ ] **Shimmer efekti**: İşlem devam ederken başlık veya kart üzerinde CSS shimmer (`sp-shimmer` veya `motion` ile); encoding bitince durur
- [ ] **Metriklerin gelmesi**: Aşamalar tamamlanınca MSE · PSNR · CR · Sparsity değerleri birer birer sayaç animasyonuyla görünür (`motion` + `useEffect`)
- [ ] **Tamamlandı ekranı**: `CheckCircle2` ikonu + büyük "Done." + otomatik `/results` yönlendirmesi (3 sn countdown göster)
- [ ] **Hata durumu**: Herhangi bir aşama başarısız → `AlertTriangle` + aşama adı + "Tekrar dene" butonu
- [ ] **Demo modu**: localStorage boşsa örnek metriklerle sahte pipeline çalıştır

---

## 6 · Azra Erbaş — Results · History · Dashboard

**Dosyalar:** `ResultsPage.tsx` · `HistoryPage.tsx` · `DashboardPage.tsx`

### ResultsPage (`/results`) UI Görevleri
- [ ] **ComparisonSlider**: Orijinal ↔ sıkıştırılmış görsel arasında sürüklenebilir bölücü (`ComparisonSlider` bileşeni); REVEAL · SPLIT · LENS mod butonları
- [ ] **Metrik kartları**: MSE · PSNR · CR · Sparsity → büyük `font-serif italic` sayı + delta badge (yeşil/kırmızı)
- [ ] **InsightCard**: `InsightCard` bileşenini kullan; `var(--ink)` arkaplan, `var(--cyan)` aksan rengi
- [ ] **Grafik bölümü**: `LineChart` (PSNR vs Step Size) + `BarChart` (CR karşılaştırma) + `RadarChart` (4 metrik); `recharts` kullan
- [ ] **Dışa aktarma**: "Raporu indir" butonu → JSON verisini `.json` dosyası olarak indirme
- [ ] **Demo modu**: `lastResult` boşsa `DEMO_RESULT` ile çalış

### HistoryPage (`/history`) UI Görevleri
- [ ] **Benchmark defteri tablosu**: `compressionHistory` dizisini tablo olarak göster; sütunlar: Tarih · Görüntü · Metot · PSNR · CR · Sparsity · Aksiyon
- [ ] **Satır genişletme**: Tıklanan satır `Collapsible` ile açılır → mini grafik + tam parametre özeti
- [ ] **Sıralama / filtre**: Metot filtresi (JPEG / J2K / Tümü) + PSNR'a göre sıralama
- [ ] **Sil butonu**: Her satırda çöp kutusu ikonu → `localStorage`'dan satırı kaldır + slide-out animasyonu
- [ ] **Boş durum**: Geçmiş yoksa büyük italic "Henüz kayıt yok." + "Workspace aç" linki

### DashboardPage (`/dashboard`) UI Görevleri
- [ ] **3 kolon layout**: Sol rail (upload + method) · Orta stage (pipeline + comparator) · Sağ observation (metrics + insight) — LandingPage'deki mock'u gerçek state'e bağla
- [ ] **Tek sayfada tam akış**: Upload → Transform → Quantization → Processing adımlarını burada birleştir; her adım kendi bölümünde ayrı kart
- [ ] **Canlı metrik paneli**: Sağ panel `sp-metric-item` stiliyle MSE/PSNR/CR/Sparsity; sayaç animasyonu
- [ ] **"Run" butonu**: `sp-btn sp-btn-klein`; işlem başlayınca disabled + shimmer; tamamlanınca `/results`'a link
- [ ] **Geçmiş özeti**: Sağ alt köşede son 3 çalıştırma mini kartı

---

## Ortak Bileşenler (herkese açık, dokunabilir)

| Bileşen | Nerede | Ne için |
|---|---|---|
| `PipelineStepper` | `components/PipelineStepper.tsx` | Her sayfada üstte pipeline ilerleme gösterimi |
| `ComparisonSlider` | `components/ComparisonSlider.tsx` | Results + Dashboard'da görüntü karşılaştırma |
| `DWTSubbandsViz` | `components/DWTSubbandsViz.tsx` | Transform sayfasında alt-bant vizüalizasyonu |
| `InsightCard` | `components/InsightCard.tsx` | Results + Dashboard'da AI benzeri yorum kartı |

---

## Renk & Stil Referansı

```css
var(--paper)       /* #F6F4EC — sayfa zemin */
var(--paper-2)     /* #FAF8F1 — kart zemin */
var(--ink)         /* #0A0B0E — ana metin */
var(--ink-2)       /* koyu gri — ikincil metin */
var(--ink-3)       /* açık gri — label / meta */
var(--klein)       /* #1E2AFF — mavi vurgu, primary buton */
var(--cyan)        /* #00D4FF — sadece canlı/aktif durum */
var(--leaf)        /* yeşil — olumlu delta */
var(--rule)        /* hairline border */
var(--font-serif)  /* Fraunces — başlıklar */
var(--font-mono)   /* JetBrains Mono — sayılar, label */
var(--font-sans)   /* Geist — gövde metin */
```

## localStorage Şeması

```
UploadPage      → localStorage["spectra_upload"]
TransformPage   → localStorage["spectra_transform"]
QuantizationPage→ localStorage["spectra_quantization"]
ProcessingPage  → localStorage["lastResult"] + localStorage["compressionHistory"]
ResultsPage     ← localStorage["lastResult"] okur
HistoryPage     ← localStorage["compressionHistory"] okur
```
