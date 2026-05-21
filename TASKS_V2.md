# Spectra · UI Görev Dağılımı — Sürüm 2 (Hoca geri bildirimleri sonrası)

**CENG 384 · Group 10** · İterasyon 2 · Implementation phase

> Hoca geri bildirimleri:
> 1. JPEG'in 8×8 blok visualizasyonu olmalı (6×6 değil) ve **her hücrede gerçek matematik değerleri** görünsün.
> 2. **CR (compression ratio)** çok küçük geliyor — minimum 16 olmalı, yükseldikçe görünür bozulma artmalı.
> 3. Natural / AI-generated / Fingerprint vb. veri tipleriyle "training" mantığı kurulmalı.
> 4. Sürüm-1'den bu yana 2 yeni sayfa eklendi: **Preprocessing** ve **Entropy** — bunların sahibi yok, dağıtılmalı.

> **Iter-3 (QA pass — May 2026):** Tüm pipeline 5 farklı görüntü tipiyle E2E test edildi
> (Natural, AI Generated, Synthetic, Fingerprint, Biomedical). Bulunan tüm runtime ve UI
> hataları `main`'e PM tarafından entegre edildi. Aşağıdaki her sahip için **Iter-3 görevleri**
> bölümünde entegre edilen düzeltmeler `[x]` olarak işaretli; doğrulamaları gereken testler
> ve hâlâ açık kalan implementation işleri `[ ]` olarak listelendi.

---

## Iter-4 · Hata düzeltme turu (filtre · quantization · compression)

> **Durum: AÇIK — sahiplerine atandı, henüz düzeltilmedi.**
> Ekipten ve denemelerden gelen 4 hata. Her sahip kendi `feature/...` branch'inde
> çalışır → PR açar → Ezgi `main`'e merge eder. Branch'ler `main`'den güncel
> alınmalı (`git pull --rebase origin <branch>`).

### Özet tablo

| # | Görev alanı | Problem | Yapılacak düzeltme | Atanan kişi | Öncelik |
|---|---|---|---|---|---|
| 1 | Transform filtreleri & DWT alt-bant mantığı | Filtre listesi kısa; bölme mantığı yanlış (tüm alt-bantlar bölünüyor) | Filtre ekle + varyans-tabanlı bölme | **Fatmanur Durak** | Yüksek |
| 2 | Quantization'da DWT/DCT karışması | DWT seçiliyken DCT paneli de görünüyor | Metoda göre panel ayır | **Ayşe Berfin Özçelik** | Orta |
| 3 | Compression: JPEG/JPEG2000 ayrımı | JPEG2000 sonucu JPEG sekmesi altında açılıyor | Sekme/metot ayrımını düzelt | **Azra Erbaş** | Yüksek |
| 4 | Tam akış hata ayıklama / test | Akışta başka hatalar olabilir | Uçtan uca test | **Ezginur Kalfaoğlu** (PM) | Orta |

---

### Görev 1 — Fatmanur Durak · Transform filtreleri & DWT alt-bant mantığı

**Branch:** `feature/transform-fatmanur`
**Dosyalar:** `src/app/lib/dwt.ts` · `src/app/components/DWTSubbandsViz.tsx` · `src/app/pages/TransformPage.tsx`
**Öncelik:** Yüksek

- [ ] **Filtre listesini genişlet** — şu an sadece `haar, db2, db4` var. En az `db3, db6, db8` ekle.
  - `dwt.ts` → `Filter` tipine yeni isimleri ekle + `FILTERS` tablosuna alçak-geçiren (lo) katsayılarını gir (hi otomatik QMF ile üretiliyor).
  - `TransformPage.tsx` → `WAVELET_INFO` sözlüğüne ve wavelet `sp-pill` butonlarına yeni filtreleri ekle.
- [ ] **Bölme mantığını düzelt — varyans tabanlı uyarlamalı bölme.**
  - Mevcut durum: `waveletPacket2D` her alt-bandı maxLevel'e kadar **koşulsuz** bölüyor (tam wavelet-packet).
  - İstenen: bir alt-bant **yalnızca varyansı yüksekse** bölünsün.
    - Alt-bandın katsayı varyansını hesapla.
    - Varyans eşiği aşıyorsa → 4'e böl (LL/HL/LH/HH) ve devam et.
    - Düşükse → o alt-bandı **yaprak** bırak, gereksiz bölme.
  - Sonuç: düz görüntü → az bölme (≈ klasik piramit), detaylı görüntü → çok bölme.
- [ ] **LL/LH/HL/HH yerleşimini doğrula** — her bölme adımında 4 alt-bant doğru konuma yazılıyor mu.
- [ ] **`DWTSubbandsViz` uyarlamalı çizime geçsin** — artık sabit `2^level × 2^level` grid değil; yapraklar farklı boyutta (derinliği az olan yaprak daha büyük hücre). Hücre `span`'ı = `2^(maxLevel − depth)`.
- [ ] **Aşağı-akış uyumu** — alt-bant çıktısının şekli değişiyor (sabit `4^level` yerine değişken yaprak listesi). `pipeline.ts`/`computeMetrics` zaten `b.size` ile alan-ağırlıklı topluyor; yine de Berfin ve Azra'ya haber ver.

**Test:** `npx vite build` hatasız; Transform'da J2K + farklı filtreler seçilince viz değişiyor; düz vs detaylı görüntüde bölme sayısı farklı.

---

### Görev 2 — Ayşe Berfin Özçelik · Quantization DWT/DCT ayrımı

**Branch:** `feature/quantization-berfin`
**Dosya:** `src/app/pages/QuantizationPage.tsx`
**Öncelik:** Orta

- [ ] **Bug:** Quantize ekranında "QUANTIZATION EFFECT · LIVE" kartı her zaman `DCTBlockPanel` (8×8 DCT bloğu) gösteriyor — transform DWT (jpeg2000) seçiliyken bile.
- [ ] **Düzeltme:** kartı `transform.method`'a göre koşullu render et:
  - `method === 'jpeg'` (DCT) → mevcut `DCTBlockPanel` kalsın.
  - `method === 'jpeg2000'` (DWT) → DCT bloğu yerine **DWT alt-bant quantization önizlemesi** göster (örn. `DWTSubbandsViz`'i `transform.subbandStats` ile besle).
- [ ] Kart başlığı da metoda göre değişsin ("DCT BLOCK QUANTIZATION" / "DWT SUBBAND QUANTIZATION").
- [ ] Quantization Type segmenti (Uniform/Scalar) ve diğer seçenekler **yalnızca seçili transform ile alakalı** olanları göstersin — alakasız seçenek kalmasın.
- [ ] `localStorage["spectra_transform"]` zaten okunuyor; `method` alanına göre dallandır.

**Test:** Transform'da DWT seç → Quantize'da DCT bloğu görünmemeli. DCT seç → DCT bloğu görünmeli.

---

### Görev 3 — Azra Erbaş · Compression JPEG/JPEG2000 ayrımı

**Branch:** `feature/results-azra`
**Dosya:** `src/app/pages/ResultsPage.tsx`
**Öncelik:** Yüksek

- [ ] **Bug:** Sonuç ekranında `activeTab` varsayılanı sabit `'jpeg2000'`. Kullanıcı JPEG çalıştırdıysa sayfa yine JPEG2000 sekmesinde açılıyor; JPEG2000 çalıştırıldığında ise sonuç yanlış sekme altında görünebiliyor.
- [ ] **Düzeltme:**
  - `activeTab` başlangıç değeri **çalıştırılan metoda göre** (`ranTab`) belirlensin — JPEG çalıştıysa JPEG sekmesi, JPEG2000 çalıştıysa JPEG2000 sekmesi açık gelsin.
  - Çalıştırılmayan metot sekmesi açıkça **"tahmini / çalıştırılmadı"** rozetiyle işaretlensin (türetilmiş `otherResult` gerçek sonuç sanılmasın).
  - JPEG ve JPEG2000 net ayrılsın; her sekme yalnızca kendi metodunu temsil etsin.
- [ ] JPEG2000 desteklenmiyorsa devre dışı bırak + açıklayıcı mesaj; destekleniyorsa kendi sekmesi/sonucu net olsun.

**Test:** JPEG2000 çalıştır → Results JPEG2000 sekmesinde açılır, gerçek sonuç orada. JPEG sekmesi "tahmini" etiketli.

---

### Görev 4 — Ezginur Kalfaoğlu (PM) · Tam akış hata ayıklama & test

**Branch:** `main` (entegrasyon)
**Öncelik:** Orta · **Görev 1–3 merge edildikten sonra yapılır**

- [ ] Uçtan uca test: Upload → Filter → Transform → Quantize → Compress → Output.
- [ ] Şunları doğrula:
  1. DWT seçiliyken Quantization'da DCT görünmüyor.
  2. JPEG2000 sonucu yanlışlıkla JPEG sekmesi altında değil.
  3. Filtre sayısı arttı (haar, db2, db3, db4, db6, db8).
  4. Alt-bant bölünmesi yalnızca varyans yüksekken oluyor.
  5. Proje runtime hatasız çalışıyor (console error/warning yok).
- [ ] Yanlış bölümde görünen / yanlış çalışan her yeri raporla; sahibine geri ata.
- [ ] 1–3 PR'larını incele ve `main`'e merge et; tüm `feature/...` branch'lerini `main`'e güncel tut.

**Koordinasyon:** Görev 1 alt-bant çıktısının şeklini değiştiriyor → Fatmanur düzeltmesini Berfin ve Azra'dan **önce** merge etmek mantıklı.

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

> **PM rolü:** Kendi feature branch'i yok. Diğer ekip üyelerinden gelen PR'ları `main`'e merge eder, entegrasyon dosyalarını (`Navbar`, `routes`, `imageTypeProfiles`) doğrudan `main`'de günceller.

**Dosyalar:** `Navbar.tsx` · `routes.tsx` · `lib/imageTypeProfiles.ts` · `App.tsx`

### Iter-2 görevleri
- [x] Pipeline'ı 4 → 6 sayfaya genişlet (Preproc, Entropy eklendi; Rebuild eklenip kaldırıldı)
- [x] `imageTypeProfiles.ts` modülü (5 profil: Natural, AI Generated, Synthetic, Fingerprint, Biomedical)
- [x] `TypePresetBanner` ortak bileşeni — Transform/Quantize/Entropy'de kullanılabilir
- [x] `DCTBlockPanel` ortak bileşeni — 8×8 görselleştirme + matematik
- [ ] **PR review**: Diğer branch'lerden gelen 5 PR'ı incele ve merge et
- [ ] **Branch korumaları**: `main`'e direkt push'u kapat, PR zorunlu yap (GitHub repo settings)
- [ ] **Dashboard entegrasyonu**: Yeni sayfaları (Preproc, Entropy) Dashboard'da da kontrol/preview olarak yansıt

### Iter-3 görevleri (QA pass)

**Entegre edilenler (`main`'de):**
- [x] **Routes + Navbar** — full E2E test sonrası tüm `Link` / `useNavigate` çağrıları doğrulandı, 7 sayfa arası geçişlerde 404 yok
- [x] **PipelineStepper** her sayfada doğru step number'la görünüyor (TransformPage 02→03, QuantizationPage 03→04 düzeltildi)

**Senin yapman gerekenler:**
- [ ] **Repo'ya branch protection ekle** (GitHub Settings → Branches): `main`'e PR olmadan push'u kapat
- [ ] **`lastResult` localStorage quota** — bazı görüntüler büyük dataURL üretiyor (>5MB), `ProcessingPage` quota fallback'i sadece `lastResult` kaydediyor; uzun vadede thumbnail boyutuna küçült (`canvas.toDataURL('image/jpeg', 0.8)` ile)
- [ ] **Bundle size warning** — `npm run build` sonrası "chunks larger than 500KB" uyarısı var; `recharts` ve `motion` dynamic import ile lazy load et (gerekirse)
- [ ] **Tüm feature branch'leri `main`'e güncel tut** — bu iterasyonda 5 branch sırayla yeniden senkronlandı (`git merge origin/main`), bu sıklıkta tekrarlanmalı

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

### Iter-3 görevleri (QA pass)

**Entegre edilenler (`main`'de):**
- [x] **Auto-loaded demo image kaldırıldı**: UploadPage açılınca otomatik demo görsel yükleniyordu → kullanıcı şikayet etti ("önce onu kaldırmamız gerekiyor, direkt resim yükleyelim") → `UploadPage.tsx` artık localStorage boşsa **boş** açılıyor, kullanıcı dropzone'a görsel atana kadar bekliyor
- [x] **TIFF format kaldırıldı**: `accept="image/png,image/jpeg,image/tiff"` → TIFF browser'da render edilemediği için kaldırıldı (training-data'daki `.tif` fingerprint'ler `.png`'ye çevrildi)
- [x] **DEMO_IMAGE → inline SVG**: Eski Unsplash URL'i (CORS sorunlu) yerine sandbox/offline safe inline SVG data URL
- [x] **Routing onaylandı**: Upload → Preprocessing → Transform akışı E2E test'te tüm 5 görüntü tipi için sorunsuz

**Senin yapman gerekenler:**
- [ ] **`isDemo` state'i temizle**: Artık demo otomatik yüklenmediği için `UploadPage.tsx`'teki `isDemo` state'i ve "demo banner" mantığı temizlenebilir (kullanılmıyor)
- [ ] **Type profile preview kartı** (Iter-2'den kalan) — hoca "training" istiyor, bu görsel olarak gerekli
- [ ] **PreprocessingPage iyileştirmeleri** (Iter-2'den kalan) — TypePresetBanner + histogram + autoTuned

### Test edilecek
- AI Generated tipi seçilip Upload → Preproc → Transform → Quantize → Processing yolu sonunda CR ≥ 16, PSNR farkı görünür olmalı
- localStorage boşken `/upload` açıldığında dropzone boş görünüyor mu (demo yok)

---

## 3 · Fatmanur Durak — Transform Page

**Branch:** `feature/transform-fatmanur`  
**Dosya:** `TransformPage.tsx` · `components/DCTBlockPanel.tsx` · `components/DWTSubbandsViz.tsx`

### Iter-2 görevleri
- [x] **DCT 8×8 panel**: 6×6 grid kaldırıldı, `DCTBlockPanel` ile değiştirildi (canonical JPEG textbook example: −415 DC dahil tüm 64 değer)
- [x] **DCT formülü** kart üstünde gösteriliyor
- [ ] **DCT panel — interaktif zoom**: Bir hücreye hover → tooltip ile o hücrenin **u, v, F(u,v)** ve **karşılık gelen cosine basis function** SVG previewi gösterilsin (DCTBlockPanel'i genişlet — `<title>` yerine custom tooltip)
- [ ] **DCT panel — quantization preview butonu**: Sayfa üstünde küçük bir "Preview after Δ=8 quantization" toggle → DCT matrisi `round(F(u,v) / Δ) * Δ` ile yeniden hesaplanmış görünsün, böylece öğrenci hocaya quantization'ın görsel etkisini gösterebilir
- [x] **DWT görselleştirmesi**: `DWTSubbandsViz` içinde mevcut alt-bant kutucuklarına da **örnek katsayı değerleri** ekle (LL: 234.5, LH: 12.3, HH: -1.2 gibi) — UI tarafı tamamlandı (4×4 = 16 bant, packet decomposition)
- [ ] **TypePresetBanner** zaten Transform'a entegre edildi — bunu `feature/transform-fatmanur` branch'ine merge edildiğinde kontrol et

### Iter-3 görevleri (Hoca geri bildirimi: "4 filtreden geçirip 16 bant elde et")

> Hoca demiş ki: "DWT sadece 4 bant gösteriyor — ben 4 filtreden geçirip **16 bant** istiyorum."
> UI tarafı PM tarafından `main`'e entegre edildi:
> - `DWTSubbandsViz` artık **wavelet packet decomposition** yapıyor (sadece LL değil, **her 4 alt-bant** yeniden 4 filtreden geçiriliyor).
> - Level 1 → 4 bant, **Level 2 → 16 bant**, Level 3 → 64 bant.
> - Her hücrede filter zinciri (`LLLL`, `LLHL`, …) ve gerçekçi katsayı değeri (`234.5`, `−6.4`, `0.02`…) görünüyor.
> - `TransformPage` default level **3 → 2** değiştirildi → kullanıcı sayfayı açtığı an 16 bantlı görüntü çıkıyor.
> - "Subband count" satırı ve performance hint metni `4^level` formülüne uyarlandı.

**Senin tamamlaman gereken işler (implementation tarafı — UI artık 16 bant gösteriyor, alttaki hesap da uymalı):**
- [ ] **Wavelet-packet transform fonksiyonu**: `TransformPage` veya `lib/dwt.ts` (yeni) içinde gerçek 2D wavelet-packet transform fonksiyonu olmalı:
  - Girdi: 2D image array + filter (`haar`/`db2`/`db4`) + level
  - Çıktı: `level^2` × `level^2` koefisyen grid'i (4^level alt-bant)
  - Mevcut kod (eğer pyramid DWT yapıyorsa) → packet'e çevir: her seviyede sadece LL değil **4 bandın hepsini** yeniden böl
- [ ] **Coefficient hesaplama**: `DWTSubbandsViz` şu an mock değer (`FILTER_ENERGY`) kullanıyor. Gerçek transform sonucu localStorage'a yazılıp viz'e prop olarak geçirilebilir → `<DWTSubbandsViz coefficients={...} />` API'sı ekle
- [ ] **`computeResults`'da kullan**: `ProcessingPage`'deki sparsity/CR formülünde 16-bant katsayı dağılımını kullan (LL-heavy → daha az sparsity, HH-heavy → daha yüksek sparsity)
- [ ] **PreprocessingPage'deki "Subband count" benzeri metinleri kontrol et** — başka yerlerde `3*level+1` formülü kullanılıyor mu?
- [ ] **`grep -rn "3 \* .*decompositionLevel\|3\*level" src/`** ile eski formülü ara, hepsini `Math.pow(4, level)` yap

**Test:**
- `npx vite build` hatasız geçmeli
- Transform sayfasında J2K seçili + Level 2 → 16 hücre görünmeli, her hücrede sayı + etiket olmalı
- Level değiştirildiğinde (1/2/3) bant sayısı 4/16/64 olarak değişmeli

### Test edilecek (eski)
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

### Iter-3 görevleri (QA pass)

**Entegre edilenler (`main`'de):**
- [x] **Step number düzeltmesi**: `QuantizationPage.tsx` "STEP 03" yerine **"STEP 04"** olarak güncellendi (transform 03, quantize 04, entropy 05, processing 06)
- [x] **CR-distortion tutarlılığı**: Kullanıcı şikayeti — "Δ=40 seçince görsel bozulma çok az oluyor". `ResultsPage` `reconstructedFilter` baştan yazıldı; Δ ≥ 32 → blur 8.5px + contrast 0.52 + saturate 0.48 → CR ≈ 60'ta görsel "tamamen bloklu" görünüyor (hocanın isteği)
- [x] **Block-artifact overlay** Δ > 40 yerine **Δ > 20**'de aktifleşiyor — daha makul bir eşik

**Senin yapman gerekenler:**
- [ ] **Quantization formula consistency**: `ProcessingPage`'deki `computeResults` (`baseCR = 16 + (s/64)^0.85 * 64`) ile `QuantizationPage`'deki canlı preview hesabı **birebir aynı olmalı** — kullanıcı slider'ı çekerken gördüğü PSNR/CR ile Processing sonucu farklılaşırsa kafa karışıyor
- [ ] **Lossless durumda step size = 1** olduğundan emin ol: `entry.stepSize` alanı `q.lossless ? 1 : q.stepSize` yapıldı, sen de Quantization'daki preview formülünde aynısı geçerli mi kontrol et
- [ ] **Entropy bar chart renk değişikliği** (Iter-2'den kalan)
- [ ] **TypePresetBanner stage="entropy"** entegrasyonu (Iter-2'den kalan)
- [ ] **Estimated bitstream size in KB** alanı (Iter-2'den kalan)

### Test edilecek
- Δ=1 → CR ≈ 16:1, Δ=64 → CR ≈ 80:1, PSNR Δ=64'te < 18 dB
- Lossless açık → Δ slider disabled, CR ≈ 2.4:1

---

## 5 · Melike Şahin — Processing Page

**Branch:** `feature/processing-melike`  
**Dosya:** `ProcessingPage.tsx`

### Iter-2 görevleri
- [x] **CR/PSNR formülleri** güncellendi (CR ≥ 16, PSNR floor 14-16 dB)
- [x] **Step indicator** redesign edildi (`main`'de — code review et)
- [x] **`imageDataUrl`** artık `lastResult` ve `compressionHistory`'ye yazılıyor → Results comparator gerçek görseli gösteriyor
- [x] **Pipeline log strip**: Ink dark kart + mono font + cyan timestamp'li log strip `main`'e eklendi
- [x] **Hata simulasyonu**: `?fail=N` query param ile aşama N'de `AlertTriangle` + "Retry pipeline" butonu çıkıyor
- [x] **Type-aware progress text**: `typeNote` switch'i `Fingerprint/Biomedical/AI Generated/Synthetic` için özel mesaj veriyor
- [ ] **Counter animation hızı**: Şu an `useCountUp` 900ms — yüksek değerler (CR ~60) için biraz uzat (1400ms), küçük olunca kısa bırak (curve)

### Iter-3 görevleri (QA pass)

> **Önemli:** `ProcessingPage.tsx` Iter-3'te ciddi şekilde yeniden yazıldı. Aşağıdaki tüm düzeltmeler `main`'de — kendi branch'ini güncellerken (`git rebase main` veya `git pull --rebase`) çakışma çıkması beklenir. **Lütfen `main`'deki sürümü baz al, kendi değişikliklerini onun üstüne taşı.**

**Entegre edilenler (`main`'de):**
- [x] **7 aşama → 6 aşama**: "Reconstruction" stage'i kaldırıldı (decode aşaması encode'la aynı şeyi simüle ediyordu, redundant). Yeni sıra: Input → Preproc → Transform → Quantize → Entropy → Evaluate
- [x] **Türkçe metinler → İngilizce**: "Tekrar Dene" → "Retry pipeline", redirect metni → "Redirecting to results · Xs"
- [x] **`setState`-in-render uyarısı**: `setCountdown` updater içinde `navigate('/results')` çağrısı vardı → React 18 strict mode'da warning. Navigate ayrı bir `useEffect` içine taşındı (`countdown === 0` watch)
- [x] **StrictMode double-mount bug**: Effect cleanup yoktu, sayfa iki kez mount olunca pipeline iki kez başlıyordu → timeouts array + `window.clearTimeout` cleanup eklendi
- [x] **`entry.settings` tam obje**: Önceden `lastResult` sadece flat alanlar içeriyordu, `InsightCard` `settings.method`'a erişip undefined crash veriyordu → şimdi `entry.settings = { method, waveletFilter, decompositionLevel, quantizationType, stepSize }`
- [x] **Image type bonus** uygulandı: `typeBonus` (AI Gen ×1.10, Synth ×1.18, Fingerprint ×0.78, Biomedical ×0.82) baseCR'ye çarpılıyor → her tip farklı sonuç üretiyor (hocanın "training" isteğinin görsel karşılığı)
- [x] **localStorage quota fallback**: Büyük görseller history'yi şişiriyor → quota aşılırsa sadece `lastResult` kaydediliyor (history pas geçiliyor, çökmüyor)

**Senin yapman gerekenler:**
- [ ] **Code review**: `main`'deki yeni `ProcessingPage.tsx`'i incele, kendi UI tasarımına özel detayları (örn. log strip stili) burda da varsa muhafaza et
- [ ] **`STEP_DURATION` ince ayar**: Şu an her aşama 800ms → 6 aşama × 800ms = 4.8s. Bu hocaya gerçekçi görünüyor mu, yoksa daha yavaş mı (1200ms)?
- [ ] **Lossless akış testi**: `Fingerprint` ve `Biomedical` profilleri `lossless: true` ile geliyor — `computeResults`'ta `s = q.lossless ? 1 : q.stepSize` yapıldı, sen final PSNR=50, CR ≈ 2.4 olduğundan emin ol
- [ ] **Counter animation hızı** (Iter-2'den kalan)

### Test edilecek
- Console'da `localStorage.lastResult` parse edilince `imageDataUrl` dolu mu
- 6 aşama hep sırayla aktif oluyor, ortada takılmıyor (7'ye geri dönme)
- StrictMode'da sayfa iki kez render olduğunda pipeline tek kez çalışıyor mu

---

## 6 · Azra Erbaş — Results · History · Dashboard

**Branch:** `feature/results-azra`  
**Dosyalar:** `ResultsPage.tsx` · `HistoryPage.tsx` · `DashboardPage.tsx` · `components/ComparisonSlider.tsx`

### Iter-2 görevleri
- [x] **ComparisonSlider** 3 mod destekliyor (split / reveal / lens) — `main`'de, code review et
- [x] Reveal/Split/Lens butonları styled
- [x] **Results — distortion görünür yap**: `reconstructedFilter` agresif scale + block-artifact overlay (Δ > 20) — `main`'e entegre edildi (aşağıya bak)
- [x] **Results — type comparison chart**: `TYPE_BENCHMARK` charts tab'ında render ediliyor
- [x] **Results — formula card**: "How is CR computed?" mini kart eklendi
- [x] **History — type filter chip**: Tamamlandı (commit `a1a872b`)
- [ ] **History — CR sort**: Tabloda CR sütunu tıklanınca azalan sırala
- [ ] **Dashboard — type benchmark widget**: 5 tipi üst üste mock benchmark olarak göster (her biri için Run preset → mini metric kart)

### Iter-3 görevleri (QA pass)

> **Önemli:** `ResultsPage.tsx` Iter-3'te ciddi ölçüde yeniden yazıldı. Kullanıcı raporu:
> 1. "JPEG ekranı boş görünüyor"
> 2. "CR'yi 40 yapıyorum ama görsel bozulma çok az oluyor"
> 3. "Charts kısmı doğru mu kontrol et"
>
> Üçü de düzeltildi. Branch'ini güncellerken `main`'i baz al.

**Entegre edilenler (`main`'de):**

*ResultsPage.tsx:*
- [x] **JPEG tab boş bug'ı**: Önceden `JPEG_DEMO` statik objesinden okuyordu (lastResult JPEG2000 ise JPEG sekmesi boş kalıyordu) → `otherResult` derive ediliyor: kullanıcı JPEG2000 çalıştırdıysa JPEG sekmesi de aynı upload'tan türetilmiş (`psnr - 2.6 dB`, `CR × 0.85` gibi) değerlerle dolduruluyor
- [x] **Distortion-CR tutarsızlığı**: Eski filter `blur(0.8–2.4px)` → Δ=40'ta neredeyse görünmüyordu. Yeni aşamalı scale:
  - Δ ≤ 8: blur 0.3px (minimum)
  - Δ ≤ 16: blur 1.2px
  - Δ ≤ 24: blur 3.0px
  - Δ ≤ 32: blur 5.5px
  - Δ > 32: **blur 8.5px + contrast 0.52 + saturate 0.48 + brightness 1.22** (CR ≈ 60'ta görsel ciddi bozuk)
- [x] **Block-artifact grid overlay** Δ > 40 yerine **Δ > 20**'de görünüyor (8×8 blok izleri)
- [x] **CHART_DATA / CR_DATA güncellendi**: Eski statik veri formülle uyuşmuyordu. Yeni veri `ProcessingPage`'deki gerçek formüllerle birebir (PSNR 4–40, CR 4–40 aralığı; max CR 58.9:1)
- [x] **"Your run" reference dot/line**: PSNR chart'a `ReferenceDot`, CR chart'a `ReferenceLine` (amber renkli, `result.stepSize`/`result.cr`'den) → kullanıcı kendi çalıştırmasını eğri üzerinde görüyor
- [x] **`InsightCard` compareMethod fix**: Eski `JPEG_DEMO.mse, JPEG_DEMO.psnr` statik referansı → `otherResult.mse, otherResult.psnr` (gerçek karşı-method değerleri)
- [x] **Compressed image download dosya adı**: Önceden `landscape_jpeg2000_q60_cr10.4:1.jpg` → Windows'ta `:` geçersiz, indirme çöküyordu → `:` → `x` sanitize (`cr10.4x1`)
- [x] **Data URL crossOrigin guard**: `handleDownloadCompressed` `img.crossOrigin = 'anonymous'` HER zaman set ediyordu → data URL'lerde tainted canvas hatası. Sadece `http(s)://` source'larda set ediliyor
- [x] **DEMO_IMAGE → inline SVG**: Unsplash URL (CORS sorunlu) → offline-safe SVG data URL

*Components:*
- [x] **`InsightCard` `toLowerCase()` crash**: `cfg.method` undefined olunca `.toLowerCase()` çöküyordu (lastResult merge sırasında settings stripped) → `const method = cfg.method ?? 'JPEG2000'` fallback + tüm cfg alanları optional
- [x] **`InsightCard` key prop warning**: Narrative split sırasında `<>{part}<em key={i}>...</em></>` Fragment'ı key prop'a izin vermiyor → keyed `<span>` ile sarmalandı

**Senin yapman gerekenler:**
- [ ] **`/results` page review**: Yeni `currentResult` / `otherResult` / `baselineResult` mantığını oku, kendi UI detaylarını (mesela mevcut renk kullanımları) korumayı unutma
- [ ] **History — CR sort** (Iter-2'den kalan)
- [ ] **Dashboard — type benchmark widget** (Iter-2'den kalan)
- [ ] **`isDemo` notice yer değişikliği**: Demo notice card şu an üstte, ama artık kullanıcı upload zorunlu olduğu için neredeyse hiç görünmüyor — kaldırılabilir veya `/upload` linki daha belirgin yapılabilir

### Test edilecek
- Δ=64 ile sıkıştırılmış görsel comparator'da clearly bloklu/bozuk görünüyor mu
- 5-tip grafik Charts tab'ında render oluyor mu
- JPEG2000 çalıştırınca **hem JPEG2000 hem JPEG sekmesi** dolu görünüyor mu, ikisi de aynı upload'ı gösteriyor mu
- "Your run" amber marker'ı PSNR ve CR chart'larında doğru pozisyonda mı

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
