# Spectra — JPEG & JPEG2000 Image Compression System
**CENG 384 · Group 10** | Ankara Science University

## Team

| İsim | Öğrenci No | Rol | Sayfa |
|---|---|---|---|
| Ezginur Kalfaoğlu | 220204055 | PM & System Integrator | Landing, Navbar, entegrasyon |
| Gül Deniz Özdemir | 230201900 | Input Handling | `/upload` |
| Fatmanur Durak | 220204032 | Transform Core | `/transform` |
| Ayşe Berfin Özçelik | 230201021 | Quantization Engine | `/quantization` |
| Melike Şahin | 220204019 | Entropy Coding | `/processing` |
| Azra Erbaş | 220204023 | Decoder & Metrics | `/results`, `/history`, `/dashboard` |

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda: `http://localhost:3000`

## StackBlitz'te Açma

Projeyi StackBlitz'e yükleyip **Share → Invite collaborators** ile tüm takıma link gönder.

## Kurallar

- **Kimse** `Navbar.tsx`, `routes.tsx`, `App.tsx`, `theme.css`, `spectra.css` dosyalarına dokunmaz — sadece Ezgi
- Her kişi yalnızca kendi page dosyasını düzenler
- Mock data yeterli — backend bağlantısı bekleme, localStorage üzerinden veri akışı var
- Yeni renk/font oluşturma — `spectra.css` değişkenlerini kullan

## Mock Data Akışı

```
UploadPage → localStorage["spectra_upload"]
TransformPage → localStorage["spectra_transform"]  
QuantizationPage → localStorage["spectra_quantization"]
ProcessingPage → localStorage["lastResult"] + localStorage["compressionHistory"]
ResultsPage → localStorage["lastResult"] okur
HistoryPage → localStorage["compressionHistory"] okur
```

Sayfa açıldığında localStorage boşsa demo data otomatik gösterilir.
