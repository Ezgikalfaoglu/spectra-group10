# Training Specimens — Iteration 2

31 görsel · ~12 MB · 6 kategori
Hocanın istediği "AI vs Natural eşleştirmesi" + "Fingerprint dataset" dahil.

> Bu klasör `.gitignore`'da — repo'ya commit'lenmez. Sadece local test
> ve uygulama içine elle yüklemek için.

---

## 📂 natural/ — 5 görsel · 3.3 MB

Kodak True Color Image Suite — JPEG/JPEG2000 makalelerinin **standart** benchmark seti. Kayıpsız PNG, 24-bit, 768×512.

| Dosya          | İçerik                          |
|----------------|---------------------------------|
| kodim01.png    | Kapı (mimari, ahşap doku)       |
| kodim05.png    | Motorsiklet pilotu (kontrast)   |
| kodim15.png    | Kız portresi (cilt tonu testi)  |
| kodim19.png    | Deniz feneri (yüksek detay)     |
| kodim23.png    | Papağanlar (renk dolayışı)      |

**Kaynak:** [lemire/kodakimagecollection](https://github.com/lemire/kodakimagecollection) — orijinal Eastman Kodak, royalty-free.

---

## 🤖 ai-generated/ — 5 görsel · 5.4 MB

Stable Diffusion v1.4 ile üretilmiş resmî örnekler.

| Dosya                | Prompt / üretim tipi                       |
|----------------------|--------------------------------------------|
| fire_painting.png    | "a painting of a fire" — txt2img            |
| fire_photograph.png  | "a photograph of a fire" — txt2img          |
| fire_watercolor.png  | "a watercolor painting of a fire" — txt2img |
| txt2img_sample_1.png | Stable Diffusion sample 002025              |
| txt2img_grid.png     | 6'lı grid (farklı promptlar)                |

**Kaynak:** [CompVis/stable-diffusion](https://github.com/CompVis/stable-diffusion) — `assets/` klasörü.

---

## 🔀 paired-natural-ai/ — 4 görsel · 2.1 MB ⭐ HOCANIN ÖZEL İSTEĞİ

**Aynı sahne, doğal taslak vs AI üretim** — direkt karşılaştırma için.
Stable Diffusion `img2img` modunun resmî örneği.

| Dosya                         | Tip                                  |
|-------------------------------|--------------------------------------|
| 01_natural_mountain-sketch.jpg | Doğal (kullanıcı çizimi/sketch)     |
| 01_ai_mountain-v1.png          | AI rekonstrüksiyon — varyasyon 1    |
| 01_ai_mountain-v2.png          | AI rekonstrüksiyon — varyasyon 2    |
| 01_ai_mountain-v3.png          | AI rekonstrüksiyon — varyasyon 3    |

**Pedagojik değer:** Aynı sahne için 4 görsel — 1 natural sketch + 3 AI çıktısı. Sıkıştırma metrikleri (CR, PSNR, sparsity) karşılaştırması ile AI çıktılarının daha pürüzsüz gradyanlar (= daha iyi CR) ürettiği gösterilebilir.

**Kaynak:** [CompVis/stable-diffusion](https://github.com/CompVis/stable-diffusion/tree/main/assets/stable-samples/img2img)

---

## ✏️ synthetic/ — 4 görsel · 164 KB

**Bilgisayar üretimi test desenleri.** Sert kenarlar + düz renkler — JPEG block artifact'ı görselleştirmek için ideal.

| Dosya                  | Ne işe yarar                                          |
|------------------------|-------------------------------------------------------|
| smpte-color-bars.png   | Klasik TV test patterni — saf renkler, sınır artifact |
| checkerboard-32px.png  | Saf siyah/beyaz 32px kareler — DCT highest freq stress |
| zone-plate.png         | Frekans tepki haritası — quantization banding görünür |
| bar-chart-cr.png       | Mühendislik diyagramı — text + shape kombinasyonu     |

**Üretim:** `tools/gen_synthetic.py` (PIL/Pillow ile lokal). Public domain.

---

## 👆 fingerprint/ — 6 görsel · 988 KB ⭐ HOCANIN ÖZEL İSTEĞİ

**FVC2002 DB1** sample'ı (Fingerprint Verification Competition). 374×388 px, 8-bit gray TIFF, optik sensör.

| Dosya          | Parmak | Acquisition |
|----------------|--------|-------------|
| fp_101_1.tif   | 101    | 1. baskı   |
| fp_101_2.tif   | 101    | 2. baskı   |
| fp_101_3.tif   | 101    | 3. baskı   |
| fp_102_1.tif   | 102    | 1. baskı   |
| fp_103_1.tif   | 103    | 1. baskı   |
| fp_105_1.tif   | 105    | 1. baskı   |

**Forensik gerekçe:** Ridge spacing ~10 px → JPEG'in 8×8 DCT bloğu Δ > 8'de ridges'i birleştirir → false minutiae → AFIS eşleştirme başarısız. Bu yüzden `Fingerprint` profili **lossless zorunlu** (Δ=1).

**Kaynak:** [cuevas1208/fingerprint_recognition](https://github.com/cuevas1208/fingerprint_recognition/tree/master/sample_inputs) (FVC2002 DB1 türevi).

---

## 🧠 biomedical/ — 7 görsel · 88 KB ⭐ LOSSLESS GEREKLİ

Brain MRI — 4 tümörlü + 3 sağlıklı. JPG kayıpli ama orijinal de zaten DICOM→JPG dönüştürülmüş, demo için yeterli.

| Dosya                | Tanı       | Not                       |
|----------------------|------------|---------------------------|
| tumor_Y1.jpg         | Tümörlü    | Belirgin lezyon           |
| tumor_Y2.jpg         | Tümörlü    | Posterior fossa lezyon    |
| tumor_Y10.jpg        | Tümörlü    | Multiple lesions          |
| tumor_Y20.jpg        | Tümörlü    | Geniş kortikal lezyon     |
| healthy_no_1.jpg     | Normal     | Aksiyel kesit             |
| healthy_no_2.jpg     | Normal     | Sagittal kesit             |
| healthy_10_no.jpg    | Normal     | Aksiyel kesit             |

**Lossless gerekçe:** Δ > 8 doku sınırlarını bulanıklaştırır → lezyon margin yanlış okunur → tanı hatası riski.

**Kaynak:** [MohamedAliHabib/Brain-Tumor-Detection](https://github.com/MohamedAliHabib/Brain-Tumor-Detection)

---

## 🚀 Nasıl kullanılır

1. Codespace / local'de `npm run dev` çalıştır
2. `/upload` sayfasına git
3. Bu klasörden istediğin görseli **drag & drop** et
4. Image Type'ı doğru kategoriden seç:
   - kodim* → **Natural**
   - txt2img_*, fire_* → **AI Generated**
   - 01_natural_* → **Natural** (paired karşılaştırma için)
   - 01_ai_* → **AI Generated** (paired karşılaştırma için)
   - smpte/checkerboard/zone/bar → **Synthetic**
   - fp_* → **Fingerprint** (lossless otomatik aktif olur)
   - tumor_*, healthy_* → **Biomedical** (lossless otomatik aktif olur)
5. Pipeline'ı çalıştır → Results sayfasında karşılaştırmayı gör

## Hocaya gösterirken hangi senaryolar etkileyici?

**1. AI vs Natural CR farkı** (paired-natural-ai/)
- 01_natural_mountain-sketch.jpg yükle → CR ~22:1
- 01_ai_mountain-v1.png yükle → CR ~28:1
- Aynı kompozisyon, AI çıktısı %20+ daha iyi CR (entropy düşük)

**2. Synthetic'te JPEG vs JPEG2000** (synthetic/)
- checkerboard-32px.png yükle → JPEG'de blok artefakt çok belirgin → JPEG2000 (DWT) daha temiz

**3. Fingerprint'te quantization yıkımı** (fingerprint/)
- fp_101_1.tif yükle, Δ=20 dene → ridge'lerin nasıl birleştiğini comparator'da göster
- Sonra Δ=1 (lossless) yap → temiz

**4. MRI'da tanı kaybı** (biomedical/)
- tumor_Y10.jpg yükle, Δ=30 dene → küçük lezyonlar kaybolabilir
- Lossless mod doğru tanı için zorunlu

---

## Lisans / atıf

| Dataset    | Lisans                          | Atıf                          |
|------------|----------------------------------|-------------------------------|
| Kodak      | Royalty-free (Eastman Kodak)    | Kodak PhotoCD Test Suite      |
| Stable Diff. | OpenRAIL-M (research/edu OK)   | CompVis Group, LMU Munich     |
| FVC2002    | Akademik amaçlı serbest        | Fingerprint Verification Competition 2002 |
| Brain MRI  | Kaggle public domain            | M. Ali Habib (2018)           |
| Synthetic  | Public domain (locally generated) | —                            |

Tüm görseller akademik proje kullanımı için uygun (CENG 384, Group 10).
