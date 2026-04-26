Hata sebebi Git conflict işaretleri kalmış:

`<<<<<<<` `=======` `>>>>>>>`

Bunları silip aşağıdaki temiz halini kullan: 

````md
# 👋 Ayşe Berfin — Senin Branch'in: `feature/quantization-berfin`

## GitHub Codespaces ile Aç

1. `github.com/Ezgikalfaoglu/spectra-group10` → branch olarak **`feature/quantization-berfin`** seç
2. Yeşil **`<> Code`** butonu → **Codespaces** sekmesi → **Create codespace on feature/quantization-berfin**
3. Terminale yaz:

```bash
npm install
npm run dev
````

4. Açılan port linkine tıkla → `http://localhost:3000/quantization` canlı görünür

## Yerel Çalıştırma

```bash
git clone https://github.com/Ezgikalfaoglu/spectra-group10.git
cd spectra-group10
git checkout feature/quantization-berfin
npm install
npm run dev
```

Tarayıcı: `http://localhost:3000/quantization`

---

## Senin Dosyan

```txt
src/app/pages/QuantizationPage.tsx
```

Sadece bu dosyaya dokunuyorsun.

## Yapman Gerekenler

### 1. Quantization Tipi Seçici

* İki seçenek yan yana: **Uniform** | **Scalar**
* `sp-seg`, `sp-seg-btn`, `sp-seg-btn-active` class'larını kullan

### 2. Step Size Slider

* Aralık: **1 – 64**
* Sürüklerken sağda anlık değer göster
* Değer değiştikçe tahmini PSNR ve CR canlı güncellenir

```js
const estPSNR = Math.max(20, 42 - stepSize * 0.35).toFixed(1)
const estCR = (1 + stepSize * 0.14).toFixed(1) + ":1"
```

### 3. Lossless Toggle

```tsx
import { Switch } from '@/components/ui/switch'
```

Toggle açıkken:

* Slider ve tip seçici disabled olur
* Lock ikonu + **Kayıpsız mod aktif** banner gösterilir
* PSNR → `∞ dB`
* CR → `1:1`

### 4. Canlı Kalite Tahmin Kartı

Büyük sayılarla `font-serif italic`:

* PSNR > 35 dB → yeşil
* 28–35 dB → amber/turuncu
* < 28 dB → kırmızı
* CR değeri gösterilir

### 5. Açıklama Alanı

```tsx
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@/components/ui/collapsible'
```

Başlık: **Bu Ayarlar Ne Anlama Gelir?**

Kısa açıklama: Step size arttıkça sıkıştırma artar ama kalite düşebilir.

### 6. Navigasyon

* Geri: `/transform`
* İleri: `/processing`
* İleri gitmeden önce şunu kaydet:

```js
localStorage.setItem("spectra_quantization", JSON.stringify({
  quantizationType: "scalar",
  stepSize: 18,
  lossless: false
}))
```

### 7. Demo Modu

`localStorage["spectra_transform"]` boşsa varsayılan değerlerle başlat.

---

## Commit & Push

```bash
git add src/app/pages/QuantizationPage.tsx
git commit -m "feat(quantization): step size slider ve canlı PSNR tahmini"
git push
```

Bitince GitHub'da Pull Request aç.

```
```

