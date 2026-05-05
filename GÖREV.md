# 👋 Melike — `feature/processing-melike`

> **İterasyon 2** — Hoca geri bildirimleri sonrası
> Genel proje haritası: `TASKS_V2.md` (main'de)

## 📋 Senin sorumluluğun

- ✅ `/processing` — Senin sayfan

> ⚠️ **Hoca'nın özel ricaları (senin tarafına etki edenler):**
> 1. CR minimum 16 olsun, bozulma görünür olsun → `computeResults` formülü güncellendi ✅
> 2. AI / Natural / Fingerprint gibi farklı veri tipleriyle "training" → `imageType` bilgisi artık `computeResults`'a geçiyor ✅
> Senin görevin: process ekranını **daha bilgilendirici** yapmak.

---

## 🚀 1. Ortamı kur

### GitHub Codespaces (tavsiye)
1. https://github.com/Ezgikalfaoglu/spectra-group10 → **`<> Code`** → **Codespaces** → **Create codespace on `feature/processing-melike`**
2. Terminal:
```bash
nvm use 20
git pull
npm install
npm run dev
```

### Yerel
```bash
git clone https://github.com/Ezgikalfaoglu/spectra-group10.git
cd spectra-group10
git checkout feature/processing-melike
git pull
nvm use 20
npm install
npm run dev
```

> ❗ `crypto$2.getRandomValues` hatası → `nvm use 20`

---

## 🎯 2. Yapacakların

### Görev A — Pipeline log strip'i kart içine al

**Dosya:** `src/app/pages/ProcessingPage.tsx`

Şu an sağ panelde minimal bir log var. Onu **dark-ink kart** olarak yeniden tasarla:

```tsx
<div style={{
  marginTop: 24, padding: '20px 24px',
  background: 'var(--ink)',
  color: 'var(--paper)',
  borderRadius: 'var(--r-md)',
  fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
}}>
  <div style={{
    color: 'var(--cyan)', letterSpacing: '0.2em', fontSize: 10,
    textTransform: 'uppercase', marginBottom: 10,
  }}>
    ◆ PIPELINE LOG · TAIL
  </div>
  {/* Her stage için bir satır, timestamp cyan, body soluk */}
  <div style={{ opacity: currentStep >= 0 ? 1 : 0.4 }}>
    <span style={{ color: 'var(--cyan)' }}>[03:14:22.018]</span> input · decoded TIFF 1024 × 1024 RGB · 2.8 MB
  </div>
  <div style={{ opacity: currentStep >= 1 ? 1 : 0.4 }}>
    <span style={{ color: 'var(--cyan)' }}>[03:14:22.041]</span> preproc · YCbCr transform complete
  </div>
  {/* ... 7 stage ... */}
</div>
```

Her stage'in kendi log satırı olsun, `currentStep` ilerledikçe `opacity: 1` olsun. Hoca'ya gerçek bir process log'u görüntüsü ver.

### Görev B — Hata simulasyonu (?fail=N query param)

**Dosya:** `src/app/pages/ProcessingPage.tsx`

URL'de `?fail=2` parametresi varsa, 2. aşamada (DCT/DWT) **simulated error** göster:

```tsx
import { useSearchParams } from 'react-router';

const [params] = useSearchParams();
const failAt = params.get('fail') ? +params.get('fail')! : -1;

// useEffect içinde, her step'te:
if (idx === failAt) {
  setError({ stage: idx, msg: PIPELINE_STAGES[idx].label + ' failed: simulated network timeout' });
  setIsRunning(false);
  return;
}
```

Hata UI:
```tsx
{error && (
  <div style={{
    padding: 24, background: 'rgba(212,87,76,0.06)',
    border: '1px solid rgba(212,87,76,0.3)', borderRadius: 'var(--r-md)',
  }}>
    <AlertTriangle size={32} color="#d4574c" />
    <h3 style={{ fontFamily: 'var(--font-serif)' }}>Pipeline halted</h3>
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error.msg}</p>
    <button onClick={retry} className="sp-btn sp-btn-klein">Retry from start</button>
  </div>
)}
```

Test: `http://localhost:5173/processing?fail=2`

### Görev C — Type-aware aktif aşama metni

**Dosya:** `src/app/pages/ProcessingPage.tsx`

`getProfile(upload.imageType).blurb` kullanarak aktif aşama altında profile-specific metin göster:

```tsx
import { getProfile } from '../lib/imageTypeProfiles';

const profile = upload ? getProfile(upload.imageType) : null;

// Aktif stage başlığının altında:
{profile && (
  <p style={{
    fontFamily: 'var(--font-mono)', fontSize: 11,
    color: profile.accent, letterSpacing: '0.05em',
    marginTop: 8, opacity: 0.85,
  }}>
    Tuned for {profile.label.toLowerCase()} · {profile.blurb.split('.')[0]}.
  </p>
)}
```

Yani Fingerprint için: "Tuned for fingerprint · Forensic data — cannot tolerate ridge alteration"

### Görev D — Counter animation süresini metric büyüklüğüne göre uyarla

**Dosya:** `src/app/pages/ProcessingPage.tsx` (sayaç kısımları)

CR=64 gibi büyük sayılar 900ms'de hızlıca biter, kullanıcı göremez. Süreyi büyüklüğe göre ayarla:

```tsx
function durationFor(value: number) {
  if (value > 50) return 1600;
  if (value > 20) return 1200;
  return 900;
}
```

Mevcut counter kodunda `duration` prop'unu bu fonksiyonla geç.

---

## 🧪 3. Test et

```bash
npm run dev
```

Test senaryosu:
1. Upload → Preproc → Transform → Quantize → Entropy → Process akışı sonuna kadar
2. Process sayfasında:
   - 7 aşama sırayla aktif oluyor
   - Log strip dark cart, cyan timestamp ile dolu
   - Aktif stage altında profile blurb'u görünüyor
   - Bittikten sonra metric'ler animasyonla geliyor (büyük CR daha yavaş)
3. `?fail=2` query → 2. aşamada error UI göründü mü?
4. localStorage'da `lastResult.imageDataUrl` dolu mu? (Results sayfasının düzgün çalışması için kritik)

Build:
```bash
npx tsc --noEmit
npm run build
```

---

## 📤 4. Commit & push

```bash
git add src/app/pages/ProcessingPage.tsx
git commit -m "feat(processing): dark log strip, error simulation, type-aware text, scaled counters"
git push origin feature/processing-melike
```

PR aç: `feature/processing-melike` → `main`

---

## 🆘 Takıldığında

- **`useSearchParams` undefined diyor:** `react-router`'dan import etmeyi unutma
- **Profile import error:** `import { getProfile } from '../lib/imageTypeProfiles';`
- **Log opacity yanlış değişiyor:** `currentStep` 0-indexed mi 1-indexed mi kontrol et
- **Counter çok hızlı/yavaş:** `useCountUp` içinde `duration` prop'u kullanılıyor olmalı

---

## 📚 Yararlı dosyalar

- `src/app/pages/ProcessingPage.tsx` — senin sayfan
- `src/app/lib/imageTypeProfiles.ts` — okuma
- `TASKS_V2.md` — ekip roadmap'i

İyi çalışmalar! ⚙️
