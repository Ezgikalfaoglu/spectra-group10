# 👋 Gül Deniz — `feature/upload-guldeniz`

> **İterasyon 2** — Hoca geri bildirimleri sonrası
> Güncel görev listesi: bu dosya. Genel proje haritası: `TASKS_V2.md` (main'de)

## 📋 Senin sorumluluğun

Bu iterasyonda **2 sayfa** sende:
- ✅ `/upload` — Senin orijinal sayfan
- 🆕 `/preprocessing` — **YENİ sayfa**, sahibi sensin

---

## 🚀 1. Ortamı kur

### GitHub Codespaces (tavsiye edilen — kurulum yok)
1. https://github.com/Ezgikalfaoglu/spectra-group10 → **`<> Code`** → **Codespaces** → **Create codespace on `feature/upload-guldeniz`**
2. Tarayıcıda VS Code açılır
3. Terminal açılınca:
```bash
nvm use 20         # Node 20'yi aktif et (Vite 6 buna ihtiyaç duyuyor)
git pull           # son değişiklikleri çek
npm install        # bağımlılıklar
npm run dev        # geliştirme sunucusu (port 3000 veya 5173)
```
4. Açılan port linkine tıkla → tarayıcıda Spectra arayüzü açılır

### Yerel makine (alternatif)
```bash
git clone https://github.com/Ezgikalfaoglu/spectra-group10.git
cd spectra-group10
git checkout feature/upload-guldeniz
git pull
nvm use 20         # yoksa: nvm install 20
npm install
npm run dev
```

> ❗ **Önemli:** Eğer `crypto$2.getRandomValues is not a function` hatası alırsan **Node sürümün 18 veya altı**. `nvm use 20` (yoksa `nvm install 20`) çalıştır.

---

## 🎯 2. Yapacakların — sırayla

### Görev A — Upload sayfasında "AI Generated" tipi için preset preview ekle

**Dosya:** `src/app/pages/UploadPage.tsx`
**Şu an:** `IMAGE_TYPES` listesine "AI Generated" zaten eklendi. Sadece tıklanınca seçim göründüğünü doğrula.

**Eklenecek:** Tip seçilince altında küçük bir **"Bu tip için trained preset"** kartı çıksın. Örnek:

```
┌──────────────────────────────────────────────────┐
│ ✨ TRAINED PRESET · AI GENERATED                 │
│ J2K · DWT · db4 · L4 · Δ14 · Custom Huffman    │
│ "Diffusion / GAN output — softer high-freq..."  │
└──────────────────────────────────────────────────┘
```

**Nasıl yapılır:**
- `src/app/lib/imageTypeProfiles.ts` dosyasını import et:
```tsx
import { getProfile } from '../lib/imageTypeProfiles';
```
- `IMAGE_TYPES.map(...)` döngüsünün altında, seçili tip için `getProfile(file.imageType)` çağırıp dönen `profile.method`, `profile.waveletFilter`, vb. değerleri minimal bir `<div>` içinde göster.
- Renk için `profile.accent` kullan.

### Görev B — `/preprocessing` sayfasını sahiplen ve genişlet

**Dosya:** `src/app/pages/PreprocessingPage.tsx`
**Şu an:** Sadece **Color Space** seçimi var (YCbCr / RGB / Luma). Sağda kanal görselleştirmesi var.

**Eklenecek 3 şey:**

#### B.1 — TypePresetBanner ekle (sayfanın en üstüne)
```tsx
import { TypePresetBanner } from '../components/TypePresetBanner';

// JSX içinde, PipelineStepper'dan hemen sonra:
<TypePresetBanner
  stage="transform"   // preprocessing için 'transform' kullan, color space önerisi metoda yakın
  onApply={(p) => setSettings(s => ({ ...s, colorSpace: p.colorSpace }))}
/>
```
Bu banner: "Trained preset · AI Generated · YCbCr" gibi öneri gösterir, tek tıkla uygulanır.

#### B.2 — Sağ panele histogram mini chart ekle
**Channel Decomposition** kartının altına bir **Luma Histogram** kartı ekle. Mock veri yeterli:

```tsx
const HIST = [4, 8, 14, 22, 35, 48, 62, 78, 88, 92, 85, 70, 52, 38, 22, 12]; // 16 bin

<div className="sp-card" style={{ overflow: 'hidden' }}>
  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
      LUMA HISTOGRAM · POST-PREPROC
    </span>
  </div>
  <div style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
      {HIST.map((h, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${h}%`,
          background: 'var(--klein)',
          opacity: 0.3 + (h / 100) * 0.7,
          borderRadius: '2px 2px 0 0',
        }} />
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)' }}>
      <span>0</span><span>128</span><span>255</span>
    </div>
  </div>
</div>
```

**Bonus:** Color space değişince histogram yüksekliklerini biraz farklılaştır (`useMemo` ile `colorSpace`'e göre).

#### B.3 — Auto-tuned mode toggle
LocalStorage'a `{ colorSpace, autoTuned }` yaz. `autoTuned: true` iken color space seçimi disabled olsun, `Apply preset` ile gelen değer kilitli kalsın. Üstte küçük bir uyarı göster: "Auto-tuned for AI Generated".

---

## 🧪 3. Test et

```bash
npm run dev
```

Test senaryosu:
1. `/upload` aç → "AI Generated" tip seç → trained preset preview çıktı mı?
2. "Next: Preprocess" → `/preprocessing` aç
3. TypePresetBanner görünüyor mu? "Apply preset" tıklanınca color space değişiyor mu?
4. Histogram render oluyor mu?
5. Dev tools → Application → Local Storage → `spectra_preprocessing` doğru kaydediliyor mu?

Build test:
```bash
npx tsc --noEmit     # type errors yok
npm run build        # vite build temiz
```

---

## 📤 4. Commit & push

```bash
git add src/app/pages/UploadPage.tsx src/app/pages/PreprocessingPage.tsx
git commit -m "feat(upload+preproc): AI Generated preset preview + histogram"
git push origin feature/upload-guldeniz
```

Sonra GitHub'da → **Pull Requests** → **New PR** → `feature/upload-guldeniz` → `main` → açıklama yaz, Ezgi'ye review iste.

---

## 🆘 Takıldığında

- **Tip hatası alıyorsun:** `npx tsc --noEmit` çıktısını WhatsApp grubuna at
- **CSS değişkenleri çalışmıyor:** `var(--klein)`, `var(--paper-2)` gibi kullan; `--klein` doğrudan değil
- **Banner gözükmüyor:** localStorage'da `spectra_upload` boşsa banner null döner — önce `/upload`'da bir görsel yükle
- **Preset uygulayınca eski seçim kalıyor:** `setSettings` callback'inde eski state'i koru ama yeni değerleri override et

Sorularını **WhatsApp grubuna at**, code-pasted screenshot ile birlikte. Ezgi her gün PR review yapıyor.

---

## 📚 Yararlı dosyalar

- `src/app/lib/imageTypeProfiles.ts` — 5 tipin trained preset'i (sen sadece okuyacaksın, değiştirme)
- `src/app/components/TypePresetBanner.tsx` — hazır banner bileşeni
- `src/app/pages/PreprocessingPage.tsx` — senin yeni sayfan
- `TASKS_V2.md` (main'de) — tüm ekibin genel roadmap'i

İyi çalışmalar! 🚀
