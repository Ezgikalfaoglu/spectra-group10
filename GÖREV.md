# 👋 Melike — Senin Branch'in: `feature/processing-melike`

## StackBlitz'te Aç (tarayıcıdan, kurulum gerektirmez)
👉 https://stackblitz.com/github/Ezgikalfaoglu/spectra-group10/tree/feature/processing-melike

## Yerel Çalıştırma
```bash
npm install
npm run dev
# Tarayıcı: http://localhost:3000/processing
```

---

## Senin Dosyan
```
src/app/pages/ProcessingPage.tsx   ← SADECE BU DOSYAYA DOKUNUYORSUN
```

## Yapman Gerekenler

### 1. 7 Aşamalı Pipeline Animasyonu
Aşamalar sırayla: **Input → Preproc. → Transform → Quant. → Entropy → Reconst. → Eval.**

Her aşama için class:
- Bekliyor → varsayılan `sp-pstep-dot`
- Aktif (şu an işleniyor) → `sp-pstep-dot-active` (klein mavi + pulse)
- Tamamlandı → `sp-pstep-dot-done` (yeşil + tik)

Aşamalar arası progress bar: `sp-pipe-fill` genişler (örn. aşama 3/7 → %43)

### 2. Aktif Aşama Açıklaması
Ortada büyük `font-serif italic` ile aktif aşamanın adı + kısa açıklama:
```
"Entropy Coding…"
"Huffman ağacı oluşturuluyor, semboller kodlanıyor."
```

### 3. Shimmer Efekti
- İşlem devam ederken başlık veya kart üzerinde CSS shimmer animasyonu
- İşlem bitince shimmer **durur** (dekoratif loop yok — gerçek state)

### 4. Metriklerin Sayaç Animasyonuyla Gelmesi
Her aşama tamamlanınca ilgili metrik `motion` ile sayaç animasyonuyla belirir:
- Aşama 3 → Transform verisi
- Aşama 5 → MSE ve PSNR
- Aşama 7 → CR ve Sparsity

```tsx
// Sayaç animasyonu örneği (motion ile)
<motion.span
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {value}
</motion.span>
```

### 5. Tamamlandı Ekranı
Tüm aşamalar bitince:
- Büyük `CheckCircle2` ikonu (yeşil)
- `font-serif` ile "Done."
- "Sonuçlara yönlendiriliyorsunuz... 3" geri sayım
- 3 saniye sonra otomatik `/results`'a git

### 6. Hata Durumu
Herhangi bir aşama başarısız olursa:
- `AlertTriangle` ikonu (kırmızı/amber)
- Hangi aşamada hata olduğu
- "Tekrar Dene" butonu (`sp-btn sp-btn-ghost`)

### 7. Demo Modu
- localStorage boşsa örnek metriklerle sahte pipeline çalıştır
- Her aşama 800ms beklesin (setTimeout/useEffect ile)

---

## Renk & Stil Referansı
```css
var(--klein)    /* aktif aşama rengi */
var(--leaf)     /* tamamlanan aşama, yeşil */
var(--cyan)     /* #00D4FF — "canlı işlem" göstergesi */
var(--paper-2)  /* kart arka planı */
var(--font-serif) /* büyük metrik sayıları, "Done." */
var(--font-mono)  /* aşama label'ları, % değerleri */
```

## localStorage Çıktın
```js
// lastResult
localStorage.setItem("lastResult", JSON.stringify({
  id: Date.now().toString(),
  date: new Date().toISOString(),
  imageName: "gorsel.jpg",
  method: "JPEG2000",
  wavelet: "db4",
  decompLevel: 3,
  quantType: "scalar",
  stepSize: 18,
  mse: 42.73,
  psnr: 31.82,
  cr: "10.4:1",
  sparsity: "78%"
}))

// compressionHistory — diziye ekle
const history = JSON.parse(localStorage.getItem("compressionHistory") || "[]")
history.unshift(result)
localStorage.setItem("compressionHistory", JSON.stringify(history))
```

## Commit & Push
```bash
git add src/app/pages/ProcessingPage.tsx
git commit -m "feat(processing): 7 aşama pipeline animasyonu ve sayaç efektleri"
git push
```
Bitince GitHub'da **Pull Request** aç → Ezgi review yapar.
