# 👋 Gül Deniz — Senin Branch'in: `feature/upload-guldeniz`

## StackBlitz'te Aç (tarayıcıdan, kurulum gerektirmez)
👉 https://stackblitz.com/github/Ezgikalfaoglu/spectra-group10/tree/feature/upload-guldeniz

## Yerel Çalıştırma
```bash
npm install
npm run dev
# Tarayıcı: http://localhost:3000/upload
```

---

## Senin Dosyan
```
src/app/pages/UploadPage.tsx   ← SADECE BU DOSYAYA DOKUNUYORSUN
```

## Yapman Gerekenler

### 1. Drop Zone
- Büyük sürükle-bırak kutusu: `border: 2px dashed var(--rule)`
- Fare üzerine gelince: `border-color: var(--klein)` + hafif mavi arka plan
- Dosya sürüklenince: kutu büyür (`scale(1.01)`), animasyonlu geçiş

### 2. Dosya Önizleme
- Yüklenen görsel thumbnail olarak göster
- Sağ üst köşede **X butonu** → tıklayınca görüntü kaldırılır, drop zone geri gelir

### 3. Metadata Kartı
Görüntü yüklenince şu bilgileri kart içinde göster (`font-mono` ile):
- Çözünürlük (örn. 1024 × 1024)
- Dosya boyutu (örn. 2.4 MB)
- Renk modu (RGB / Grayscale)
- Format (PNG / JPG / TIFF / BMP)

### 4. Görüntü Türü Seçici
4 seçenekli radio buton grubu:
- `Natural` · `Synthetic` · `Fingerprint` · `Biomedical`
- Seçili olan: klein mavi border + hafif mavi arka plan

### 5. Hata Durumu
- Geçersiz format yüklenince kırmızı border + uyarı mesajı
- Kutu hafifçe salla (`shake` animasyonu)

### 6. İleri Butonu
- `sp-btn sp-btn-klein` stil → `/transform` sayfasına yönlendirir
- localStorage boşsa buton `disabled` + "Önce görsel yükle" tooltip

### 7. Demo Modu
- Sayfa açıldığında localStorage boşsa **örnek görsel + metadata** otomatik doldur
- Kullanıcıya "Demo modunda çalışıyor" küçük badge göster

---

## Renk & Stil Referansı
```css
var(--klein)    /* #1E2AFF — mavi, seçili state */
var(--paper-2)  /* #FAF8F1 — kart arka planı */
var(--rule)     /* hairline border rengi */
var(--ink)      /* #0A0B0E — ana metin */
var(--ink-3)    /* açık gri — label metni */
var(--font-mono) /* JetBrains Mono — sayılar */
```

## localStorage Çıktın
```js
localStorage.setItem("spectra_upload", JSON.stringify({
  name: "gorsel.jpg",
  format: "JPEG",
  resolution: "1024x1024",
  colorMode: "RGB",
  sizeKB: 2400,
  dataUrl: "...",
  imageType: "Natural"
}))
```

## Commit & Push
```bash
git add src/app/pages/UploadPage.tsx
git commit -m "feat(upload): drop zone ve metadata kartı"
git push
```
Bitince GitHub'da **Pull Request** aç → Ezgi review yapar.
