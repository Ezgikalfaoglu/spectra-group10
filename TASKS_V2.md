# Spectra · UI Görev Dağılımı — Sürüm 2 (Hoca geri bildirimleri sonrası)

**CENG 384 · Group 10** · İterasyon 2 · Implementation phase

> Hoca geri bildirimleri:
> 1. JPEG'in 8×8 blok visualizasyonu olmalı (6×6 değil) ve **her hücrede gerçek matematik değerleri** görünsün.
> 2. **CR (compression ratio)** çok küçük geliyor — minimum 16 olmalı, yükseldikçe görünür bozulma artmalı.
> 3. Natural / AI-generated / Fingerprint vb. veri tipleriyle "training" mantığı kurulmalı.
> 4. Sürüm-1'den bu yana 2 yeni sayfa eklendi: **Preprocessing** ve **Entropy** — bunların sahibi yok, dağıtılmalı.

---

## 0 · Kurallar (sürüm-1'den hatırlatma)

| Kural | Açıklama |
|---|---|
| **Branch akışı** | `feature/<name>-<owner>` üzerinde çalış → PR aç → Ezgi merge eder |
| **localStorage** | Yeni sayfa eklersen `spectra_<name>` anahtarı kullan |
| **Tip profilleri** | `src/app/lib/imageTypeProfiles.ts` artık tek kaynak — yeni tip eklemek isterken bu dosyayı genişlet |
| **CR minimum** | Tüm tahmin/hesap formülleri **CR ≥ 16:1** üretmeli (lossless hariç) |
| **Türkçe yok** | UI metinleri sadece İngilizce |
| **Test** | Push öncesi `npx vite build` mutlaka çalışsın |

---

## 1 · Ezginur Kalfaoğlu — PM & Integration

**Branch:** `main` (entegrasyon)  
**Dosyalar:** `Navbar.tsx` · `routes.tsx` · `lib/imageTypeProfiles.ts` · `App.tsx`

### Iter-2 görevleri
- [x] Pipeline'ı 4 → 6 sayfaya genişlet (Preproc, Entropy eklendi; Rebuild eklenip kaldırıldı)
- [x] `imageTypeProfiles.ts` modülü (5 profil: Natural, AI Generated, Synthetic, Fingerprint, Biomedical)
- [x] `TypePresetBanner` ortak bileşeni — Transform/Quantize/Entropy'de kullanılabilir
- [x] `DCTBlockPanel` ortak bileşeni — 8×8 görselleştirme + matematik
- [ ] **PR review**: Diğer branch'lerden gelen 5 PR'ı incele ve merge et
- [ ] **Branch korumaları**: `main`'e direkt push'u kapat, PR zorunlu yap (GitHub repo settings)
- [ ] **Dashboard entegrasyonu**: Yeni sayfaları (Preproc, Entropy) Dashboard'da da kontrol/preview olarak yansıt

---

## 2 · Gül Deniz Özdemir — Upload + Preprocessing

**Branch:** `feature/upload-guldeniz`  
**Dosyalar:** `UploadPage.tsx` · **`PreprocessingPage.tsx`** *(yeni — sahibi sensin)*

### Iter-2 görevleri
- [x] **Upload — Image type seçici**: "AI Generated" tipi eklendi (`src/app/pages/UploadPage.tsx`)
- [ ] **Upload — Type profile preview**: Tip seçilince altında "Bu tip için Spectra'nın trained preset'i" mini özet kartı (mavi/cyan badge ile) göster — `getProfile()` çağırıp method/wavelet/step özetle
- [ ] **Preprocessing sayfası — sahiplen**: `src/app/pages/PreprocessingPage.tsx`
  - Mevcut: yalnızca color-space seçici (YCbCr / RGB / Luma)
  - Eklenecek: profil önerisi banner'ı (`TypePresetBanner` zaten yok, sen ekle çağrısı: `<TypePresetBanner stage="..." onApply={...} />`)
  - Eklenecek: Sağdaki kanal görselleştirmesinin altında **histogram mini chart** (mock veri yeterli) — luma dağılımının nasıl değiştiğini göster
  - Eklenecek: localStorage `spectra_preprocessing` artık `{ colorSpace, autoTuned: boolean }` olabilir; `autoTuned: true` iken seçim profile bağlı kilitli
- [ ] **Routing**: Upload "Next" şu an `/preprocessing`'e yönlendiriyor — preprocess'te "Next" `/transform`'a düzgün gidiyor mu kontrol et

### Test edilecek
- AI Generated tipi seçilip Upload → Preproc → Transform → Quantize → Processing yolu sonunda CR ≥ 16, PSNR farkı görünür olmalı

---

## 3 · Fatmanur Durak — Transform Page

**Branch:** `feature/transform-fatmanur`  
**Dosya:** `TransformPage.tsx` · `components/DCTBlockPanel.tsx` · `components/DWTSubbandsViz.tsx`

### Iter-2 görevleri
- [x] **DCT 8×8 panel**: 6×6 grid kaldırıldı, `DCTBlockPanel` ile değiştirildi (canonical JPEG textbook example: −415 DC dahil tüm 64 değer)
- [x] **DCT formülü** kart üstünde gösteriliyor
- [ ] **DCT panel — interaktif zoom**: Bir hücreye hover → tooltip ile o hücrenin **u, v, F(u,v)** ve **karşılık gelen cosine basis function** SVG previewi gösterilsin (DCTBlockPanel'i genişlet — `<title>` yerine custom tooltip)
- [ ] **DCT panel — quantization preview butonu**: Sayfa üstünde küçük bir "Preview after Δ=8 quantization" toggle → DCT matrisi `round(F(u,v) / Δ) * Δ` ile yeniden hesaplanmış görünsün, böylece öğrenci hocaya quantization'ın görsel etkisini gösterebilir
- [ ] **DWT görselleştirmesi**: `DWTSubbandsViz` içinde mevcut alt-bant kutucuklarına da **örnek katsayı değerleri** ekle (LL: 234.5, LH: 12.3, HH: -1.2 gibi). Şu an kutucuklar boş.
- [ ] **TypePresetBanner** zaten Transform'a entegre edildi — bunu `feature/transform-fatmanur` branch'ine merge edildiğinde kontrol et

### Test edilecek
- 8×8 DCT panelde DC hücresi (−415) ayrı vurgulu, sağ alt 0 cluster görünüyor mu
- Tip profili "Apply preset" butonu method/wavelet/level'i doğru güncelliyor mu

---

## 4 · Ayşe Berfin Özçelik — Quantization + Entropy

**Branch:** `feature/quantization-berfin`  
**Dosyalar:** `QuantizationPage.tsx` · **`EntropyPage.tsx`** *(yeni — sahibi sensin)*

### Iter-2 görevleri
- [x] **CR formülü güncellendi**: `estimateMetrics` → `baseCR = 16 + (s/64)^0.85 × 64` → minimum 16, max ~80
- [x] **PSNR floor**: 16 dB'ye düştü (eskiden 20 dB) — yüksek Δ'da net bozulma
- [ ] **Quantization — quality scale gradient**: Görselin sağ panelinde renk skalası (yeşil → klein → amber → rust) — handle pozisyonu sayısal değerle (Δ=18) iliştirilsin (ipucu: zaten var ama daha okunaklı yap)
- [ ] **Quantization — kart üzerinde matrix preview**: 8×8 örnek DCT matrisinin Δ=stepSize ile bölünüp yuvarlanmış halini canlı göster (DCTBlockPanel'i quantized=true prop'uyla yeniden kullanabilirsin — Fatmanur'la koordine et)
- [ ] **Entropy sayfası — sahiplen**: `src/app/pages/EntropyPage.tsx`
  - Mevcut: coder seçici (Default Huffman, Custom Huffman, Arithmetic) + canlı bpp / CR önizleme + sembol frekans bar chart
  - Eklenecek: Bar chart üzerine seçili coder'a göre **renk değişikliği** (Default → klein, Custom → leaf, Arithmetic → plum)
  - Eklenecek: `TypePresetBanner stage="entropy"` çağrısı — coder otomatik öneri
  - Eklenecek: Sağ alt panele **estimated bitstream size in KB** ekle (image res × bpp / 8 / 1024)

### Test edilecek
- Δ=1 → CR ≈ 16:1, Δ=64 → CR ≈ 80:1, PSNR Δ=64'te < 18 dB
- Lossless açık → Δ slider disabled, CR ≈ 2.4:1

---

## 5 · Melike Şahin — Processing Page

**Branch:** `feature/processing-melike`  
**Dosya:** `ProcessingPage.tsx`

### Iter-2 görevleri
- [x] **CR/PSNR formülleri** güncellendi (CR ≥ 16, PSNR floor 14-16 dB)
- [x] **Step indicator** redesign edildi (Claude tarafından — code review et)
- [x] **`imageDataUrl`** artık `lastResult` ve `compressionHistory`'ye yazılıyor → Results comparator gerçek görseli gösteriyor
- [ ] **Pipeline log strip**: Mevcut `space-y-4` log düzeni yerine, 7 stage-log'u **ink dark kart** içinde mono font ile cyan timestamp'lerle çık (process-log gerçekçi görünsün)
- [ ] **Hata simulasyonu**: `?fail=2` query param ile 3. aşamada (DCT/DWT) `AlertTriangle` + retry butonu göster — gerçek error UX olsun
- [ ] **Type-aware progress text**: `imageType === 'Fingerprint'` ise "Lossless mode active — preserving every minutia" yazısı; AI Generated ise "Tuned for diffusion noise" yazısı (`getProfile().blurb` kullan)
- [ ] **Counter animation hızı**: Şu an `useCountUp` 900ms — yüksek değerler (CR ~60) için biraz uzat (1400ms), küçük olunca kısa bırak (curve)

### Test edilecek
- Console'da `localStorage.lastResult` parse edilince `imageDataUrl` dolu mu
- 7 aşama hep sırayla aktif oluyor, ortada takılmıyor

---

## 6 · Azra Erbaş — Results · History · Dashboard

**Branch:** `feature/results-azra`  
**Dosyalar:** `ResultsPage.tsx` · `HistoryPage.tsx` · `DashboardPage.tsx` · `components/ComparisonSlider.tsx`

### Iter-2 görevleri
- [x] **ComparisonSlider** 3 mod destekliyor (split / reveal / lens) — Claude implementasyonu, code review et
- [x] Reveal/Split/Lens butonları styled
- [ ] **Results — distortion görünür yap**: `currentResult.stepSize` arttıkça `reconstructedFilter` daha agresif olsun:
  - Şu an: `blur(0.8–2.4px)` + saturate
  - Eklenecek: Δ > 40 ise **JPEG block artifact simulation** — CSS `filter: url(#blockify)` ile 8×8 blok pixelate (SVG filter ile)
  - Hedef: Hocaya CR=64 olunca görsel tamamen "bloklu" görünsün
- [ ] **Results — type comparison chart**: Charts tab'ında yeni bir grafik ekle: **5 image type × CR/PSNR** bar chart. `imageTypeProfiles.PROFILES` üzerinden mock veri üret. Hoca'nın "training" isteğinin görsel karşılığı.
- [ ] **Results — formula card**: Metrik tablosunun yanına küçük "How is CR computed?" kart ekle — `CR = uncompressed_size / encoded_size = (W × H × 8) / encoded_bits`
- [ ] **History — type filter chip**: Mevcut filter input'a ek olarak 5 image type için filter chip'leri (`PROFILES.accent` rengiyle)
- [ ] **History — CR sort**: Tabloda CR sütunu tıklanınca azalan sırala
- [ ] **Dashboard — type benchmark widget**: 5 tipi üst üste mock benchmark olarak göster (her biri için Run preset → mini metric kart)

### Test edilecek
- Δ=64 ile sıkıştırılmış görsel comparator'da clearly bloklu/bozuk görünüyor mu
- 5-tip grafik Charts tab'ında render oluyor mu

---

## 7 · Yeni özellik — "Training Lab" (opsiyonel, ekibe açık)

**Sahibi:** Henüz atanmamış · Ezgi'ye sor

Hocanın "image type'larla training" isteğine **görsel karşılık** olacak yeni mini sayfa fikri:

`/training` (yeni route)
- 5 image type kartı (Natural, AI Gen, Synthetic, Fingerprint, Biomedical)
- Her kart üzerinde: tipin "trained" preset'i + örnek metric (CR/PSNR/Sparsity)
- Her kart "Run benchmark" butonu → Process pipeline'ını o preset ile çalıştır → tablo dolar
- Hoca'ya tek bakışta "biz tüm bu tiplerle test ettik" görüntüsü verir
- Beklenen efor: 4-6 saat

İlgilenen varsa Ezgi'ye söylesin — yeni branch açılır: `feature/training-<owner>`.

---

## Profile referansı (lib/imageTypeProfiles.ts)

| Type | Method | Wavelet | Level | Δ | Lossless | Coder | CR bonus | Accent |
|---|---|---|---|---|---|---|---|---|
| Natural | J2K · DWT | db4 | 3 | 18 | – | Default Huffman | ×1.00 | klein |
| AI Generated | J2K · DWT | db4 | 4 | 14 | – | Custom Huffman | ×1.10 | cyan |
| Synthetic | J2K · DWT | db2 | 3 | 10 | – | Arithmetic | ×1.18 | plum |
| Fingerprint | J2K · DWT | haar | 2 | 1 | ✓ | Custom Huffman | ×0.78 | amber |
| Biomedical | J2K · DWT | db4 | 4 | 1 | ✓ | Custom Huffman | ×0.82 | leaf |

---

## Akış kısayolu (sayfa → branch → sahibi)

```
/upload         → feature/upload-guldeniz   → Gül Deniz
/preprocessing  → feature/upload-guldeniz   → Gül Deniz   (yeni)
/transform      → feature/transform-fatmanur → Fatmanur
/quantization   → feature/quantization-berfin → Berfin
/entropy        → feature/quantization-berfin → Berfin    (yeni)
/processing     → feature/processing-melike → Melike
/results        → feature/results-azra      → Azra
/history        → feature/results-azra      → Azra
/dashboard      → feature/results-azra      → Azra
```

`Navbar.tsx`, `routes.tsx`, `lib/imageTypeProfiles.ts`, `components/TypePresetBanner.tsx`, `components/DCTBlockPanel.tsx` → **Ezgi · main**.
