# WhatsApp mesaj şablonları — İterasyon 2 dağıtımı

Aşağıdaki 5 mesajı tek tek arkadaşlarına yolla. Hepsi aynı yapıyı kullanır:
1. Kısa selam + bağlam
2. Hocanın geri bildirimleri
3. Kendi görevi (özet)
4. Branch + GÖREV.md linki
5. Hızlı başlangıç komutları

---

## 📩 1 — Gül Deniz'e

```
Selam Gül Deniz 🙋‍♀️

Hocanın yorumları sonrası iter-2'ye geçtik. Sen hâlâ Upload sayfasının sahibi-
sin ama bir de YENİ sayfa düştü: /preprocessing (color-space ayarları).

Hocanın senin tarafına etki eden ricaları:
• "AI Generated" diye yeni bir image type ekleyelim ✅ (zaten kodda)
• Sen kullanıcıya tip seçince "trained preset"in özetini göster

Yapacakların branch'inde GÖREV.md dosyasında detaylı:
👉 https://github.com/Ezgikalfaoglu/spectra-group10/blob/feature/upload-guldeniz/GÖREV.md

Hızlı başlangıç (Codespaces):
• repo'da <> Code → Codespaces → "Create codespace on feature/upload-guldeniz"
• terminalde:
   nvm use 20
   git pull
   npm install
   npm run dev

Yerel çalıştıracaksan Node 20 olduğundan emin ol (yoksa nvm install 20).

Takılırsan WhatsApp grubuna sor, takıldığın yerde screenshot at. Bittiğinde
PR aç → main'e — ben merge ederim 🙏

Süre: ~3-4 saat tahminim.
```

---

## 📩 2 — Fatmanur'a

```
Selam Fatmanur 👋

Iter-2 başladı. Hocanın senin tarafına direkt ricası vardı:
• JPEG'in 8x8 blok görselleştirmesi olmalı (6x6 değil)
• Her hücrede gerçek matematik değerleri görünsün ✅ ZATEN HAZIR

Ben canonical JPEG textbook 8x8 örneğini DCTBlockPanel olarak ekledim
(DC = -415 dahil 64 katsayı). Sen bunu daha interaktif yapacaksın:
• Hover'da hücrelerin u,v,F(u,v) değerleri tooltip'te gösterilsin
• "Show after quantization Δ=N" toggle eklensin → yuvarlanmış matris
• DWT görselleştirmesindeki LL/LH/HL/HH kutucuklarına da örnek
  katsayı değerleri ekle (boş duruyorlar)

Detaylar branch'indeki GÖREV.md'de:
👉 https://github.com/Ezgikalfaoglu/spectra-group10/blob/feature/transform-fatmanur/GÖREV.md

Hızlı başlangıç (Codespaces tavsiye edilir):
• <> Code → Codespaces → "Create codespace on feature/transform-fatmanur"
• terminalde:
   nvm use 20
   git pull
   npm install
   npm run dev

⚠️ Node 20 şart, yoksa "crypto.getRandomValues" hatası alırsın → nvm install 20.

Bittiğinde PR aç. Süre tahminim: ~4-5 saat.
```

---

## 📩 3 — Berfin'e

```
Selam Berfin 🌟

Iter-2 görevlerin geldi. Sende 2 sayfa var:
• /quantization (zaten senin)
• /entropy (yeni — sahibi sensin) — Quantization'dan hemen sonra geliyor

Hocanın ricası: CR (compression ratio) çok küçük geliyor, minimum 16 olsun,
yükseldikçe görsel bozulma da artsın. ✅ Ben formülü zaten güncelledim
(baseCR = 16 + (s/64)^0.85 × 64). Sen UI tarafını cilala:

• Quantization sayfasında live "matrix preview" ekle (Fatmanur'un DCTBlockPanel'ini
  kullanarak Δ slider'ıyla matrisin nasıl yuvarlandığını canlı göster)
• Entropy sayfasındaki bar chart'ı seçilen coder'a göre renklendir
• "Estimated bitstream KB" kartı ekle
• TypePresetBanner'ı her iki sayfaya entegre et

Detaylar:
👉 https://github.com/Ezgikalfaoglu/spectra-group10/blob/feature/quantization-berfin/GÖREV.md

Hızlı başlangıç:
• <> Code → Codespaces → "Create codespace on feature/quantization-berfin"
• terminalde:
   nvm use 20
   git pull
   npm install
   npm run dev

Süre: ~4 saat. Bittiğinde PR aç 🙏
```

---

## 📩 4 — Melike'ye

```
Selam Melike 🐾

Iter-2 başladı. Senin sayfan (/processing) için 4 görev var:

• Pipeline log strip'i dark-ink kart yap (gerçek log görüntüsü, cyan timestamps)
• ?fail=2 query param ile hata simulasyonu UI'sı (AlertTriangle + retry)
• Aktif aşamanın altında image type'a özel açıklama metni
  (Fingerprint için "preserving every minutia" gibi)
• Counter animation süresini metric değerine göre ölçekle (CR=64 yavaş,
  CR=16 hızlı dolsun)

ÖNEMLİ ✅: imageDataUrl artık lastResult'a yazılıyor (Azra'nın results sayfası
için kritikti). Ben düzelttim, sen sadece kullan.

Detaylar branch'inde:
👉 https://github.com/Ezgikalfaoglu/spectra-group10/blob/feature/processing-melike/GÖREV.md

Hızlı başlangıç:
• <> Code → Codespaces → "Create codespace on feature/processing-melike"
• terminalde:
   nvm use 20
   git pull
   npm install
   npm run dev

Süre: ~3-4 saat. Bittiğinde PR aç 🙏
```

---

## 📩 5 — Azra'ya

```
Selam Azra 👋

Iter-2 görev paketi geldi. Sendeki sayfalar (results / history / dashboard)
en kritik etkilenen taraf çünkü hoca özellikle "yüksek CR'da görsel bozulma
görünsün" dedi.

Ana görevlerin:
• Δ > 40 olunca comparator'da reconstructed taraf BELİRGİN BLOKLU görünsün
  (8x8 grid overlay + agresif blur+contrast). Hoca'ya "evet quantization
  gerçekten bozar" demek için.
• Charts tab'ına 5-tip benchmark bar chart'ı ekle (Natural / AI Gen /
  Synthetic / Fingerprint / Biomedical) — hoca'nın "training" isteğinin
  görsel karşılığı
• History sayfasına tip filter chip'leri + CR sıralama
• "How is CR computed?" formula info card

ÖNEMLİ: ComparisonSlider artık 3 mod destekliyor (split/reveal/lens),
imageDataUrl gerçek görseli getiriyor. Ben hazırladım, sen distortion
kısmını koyacaksın.

Detaylar:
👉 https://github.com/Ezgikalfaoglu/spectra-group10/blob/feature/results-azra/GÖREV.md

Hızlı başlangıç:
• <> Code → Codespaces → "Create codespace on feature/results-azra"
• terminalde:
   nvm use 20
   git pull
   npm install
   npm run dev

Süre tahmini: ~5-6 saat (en yoğun paket sende, 3 sayfa var).

Takıldığın yer olursa hemen sor 💪
```

---

## 📩 Bonus: Grup mesajı (genel duyuru)

Önce bireysel mesajları yolla. Sonra grup mesajı olarak şunu at:

```
Arkadaşlar, iter-2 görev dağılımı yapıldı 🚀

Her birinizin branch'ine kendi GÖREV.md dosyası push'landı, oraya bakın.
Genel proje haritası da main'de TASKS_V2.md dosyasında.

Hocanın 3 ana ricası:
1️⃣ JPEG 8x8 blok matematik görselleştirmesi → Fatmanur (zaten hazır, cilala)
2️⃣ CR minimum 16, yükseldikçe görsel bozulma → Berfin + Melike + Azra
3️⃣ AI/Natural/Fingerprint training → Hepimiz (TypePresetBanner ile)

NOT (önemli): Node 20 olmadan Vite çalışmaz, hep "nvm use 20" yapın.

Sırasıyla:
• Önce kendi GÖREV.md'nizi okuyun
• Codespace açın (en kolayı)
• Çalışmaya başlayın
• Bittiğinde PR açın → main'e
• Ben her gün PR review yapacağım

Süre tahmini herkes için: 3-6 saat arası.

Sorular WhatsApp grubuna 💬
```

---

## 🛠️ Terminal komutları (kendin lazım olursa)

Branch'lerin durumunu kontrol et:
```bash
git fetch origin --prune
git log --oneline origin/feature/upload-guldeniz -3
git log --oneline origin/feature/transform-fatmanur -3
git log --oneline origin/feature/quantization-berfin -3
git log --oneline origin/feature/processing-melike -3
git log --oneline origin/feature/results-azra -3
```

Her birinin GÖREV.md'sini hızlıca görmek için:
```bash
git show origin/feature/upload-guldeniz:GÖREV.md | head -30
git show origin/feature/transform-fatmanur:GÖREV.md | head -30
# ...vs
```

PR review akışı (PR açıldığında):
```bash
gh pr list                          # tüm PR'lar
gh pr view <num>                    # detay
gh pr checkout <num>                # local'e al
gh pr merge <num> --squash          # squash merge (tavsiye)
```
