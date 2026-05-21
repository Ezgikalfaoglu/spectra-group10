/**
 * UPLOAD PAGE — Team: Upload / Input
 * ─────────────────────────────────────────────────────────
 * Responsibilities:
 *   • Drag-and-drop / browse file upload (PNG, JPG, BMP, TIFF)
 *   • Image type classification (Natural, Synthetic, Fingerprint, Biomedical)
 *   • Metadata extraction (resolution, size, color mode)
 *   • Stores result in localStorage["spectra_upload"]
 *   • Routes to → /transform
 * ─────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileImage,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  Image,
  Sparkles,
} from 'lucide-react';
import { PipelineStepper } from '../components/PipelineStepper';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

interface UploadedFile {
  name: string;
  format: string;
  resolution: string;
  colorMode: string;
  sizeKB: number;
  dataUrl: string;
  imageType: string;
}

/* TIFF intentionally excluded — most browsers cannot render it as <img>. */
const SUPPORTED_EXTS = ['png', 'jpg', 'jpeg', 'bmp'];

const IMAGE_TYPES = [
  {
    value: 'Natural',
    label: 'Natural',
    hint: 'Landscape, portrait, outdoor',
  },
  {
    value: 'AI Generated',
    label: 'AI Generated',
    hint: 'Diffusion / GAN output, midjourney-style',
  },
  {
    value: 'Synthetic',
    label: 'Synthetic',
    hint: 'Rendered, chart, computer-generated',
  },
  {
    value: 'Fingerprint',
    label: 'Fingerprint',
    hint: 'Forces lossless in step 3',
  },
  {
    value: 'Biomedical',
    label: 'Biomedical',
    hint: 'MRI, CT scan — lossless required',
  },
];

const normalizeFormat = (ext: string) => {
  if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
  if (ext === 'tif' || ext === 'tiff') return 'TIFF';
  return ext.toUpperCase();
};

// Shrink + re-encode big images so the dataUrl fits in localStorage's ~5 MB
// quota. The pipeline rescales internally to ≤512 anyway — 1024 / q=0.85
// is more than enough for the preview and the analysis pass.
const MAX_STORAGE_SIDE = 1024;
const STORAGE_QUALITY = 0.85;
const SAFE_DATAURL_BYTES = 900_000;

function compressForStorage(dataUrl: string, w: number, h: number): Promise<string> {
  return new Promise((resolve) => {
    const maxDim = Math.max(w, h);
    if (maxDim <= MAX_STORAGE_SIDE && dataUrl.length < SAFE_DATAURL_BYTES) {
      resolve(dataUrl);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_STORAGE_SIDE / maxDim);
      const nw = Math.max(1, Math.round(w * scale));
      const nh = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, nw, nh);
      try {
        resolve(canvas.toDataURL('image/jpeg', STORAGE_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Quota-safe localStorage write. On QuotaExceededError, retries once without
// the heavy dataUrl field so navigation can still proceed.
function safeSetUpload(value: object): void {
  const json = JSON.stringify(value);
  try {
    localStorage.setItem('spectra_upload', json);
    return;
  } catch {
    // Drop dataUrl and retry — downstream pages handle missing dataUrl.
    try {
      localStorage.setItem(
        'spectra_upload',
        JSON.stringify({ ...(value as object), dataUrl: '' }),
      );
    } catch {
      // Give up — navigation will still happen.
    }
  }
}

/* ── Detect RGB vs Grayscale by sampling pixels via canvas ── */
const detectColorMode = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();

    img.onload = () => {
      const w = Math.min(img.width, 64);
      const h = Math.min(img.height, 64);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('Grayscale');
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      try {
        const data = ctx.getImageData(0, 0, w, h).data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
            resolve('RGB');
            return;
          }
        }

        resolve('Grayscale');
      } catch {
        resolve('Grayscale');
      }
    };

    img.onerror = () => resolve('Grayscale');
    img.src = dataUrl;
  });
};

type PageState = 'idle' | 'error' | 'uploaded';

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageState, setPageState] = useState<PageState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [errorFileName, setErrorFileName] = useState('');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  /* ── Restore saved upload (no demo fallback) ── */
  useEffect(() => {
    const saved = localStorage.getItem('spectra_upload');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as UploadedFile;
      setFile(parsed);
      setPageState('uploaded');
      setIsDemo(false);
    } catch {
      localStorage.removeItem('spectra_upload');
    }
  }, []);

  const processFile = useCallback(
    (f: File) => {
      const ext = f.name.toLowerCase().split('.').pop() || '';

      if (!SUPPORTED_EXTS.includes(ext)) {
        setErrorFileName(f.name);
        setPageState('error');
        setIsDragging(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new window.Image();

        const finalize = async (w: number, h: number) => {
          const colorMode = await detectColorMode(dataUrl);
          const format = normalizeFormat(ext);
          const storageUrl = await compressForStorage(dataUrl, w, h);

          const uploadedFile: UploadedFile = {
            name: f.name,
            format,
            resolution: `${w} × ${h}`,
            colorMode,
            sizeKB: Math.round(f.size / 1024),
            dataUrl: storageUrl,
            imageType: file && !isDemo ? file.imageType : 'Natural',
          };

          setFile(uploadedFile);
          setPageState('uploaded');
          setIsDemo(false);
          setErrorFileName('');

          safeSetUpload(uploadedFile);
        };

        img.onload = () => finalize(img.width, img.height);
        img.onerror = () => finalize(1024, 1024);
        img.src = dataUrl;
      };

      reader.readAsDataURL(f);
    },
    [file, isDemo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];

    if (f) processFile(f);

    e.target.value = '';
  };

  const updateImageType = (type: string) => {
    if (!file) return;

    const updatedFile: UploadedFile = {
      ...file,
      imageType: type,
    };

    setFile(updatedFile);

    if (!isDemo) {
      safeSetUpload(updatedFile);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageState('idle');
    setErrorFileName('');
    setIsDemo(false);
    localStorage.removeItem('spectra_upload');
  };

  const handleNext = () => {
    if (!file || isDemo) return;

    safeSetUpload(file);
    navigate('/preprocessing');
  };

  const isForced =
    file && ['Fingerprint', 'Biomedical'].includes(file.imageType);

  const canProceed = pageState === 'uploaded' && !!file && !isDemo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <PipelineStepper />

      {/* Page Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div className="sp-eyebrow">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--klein)',
                display: 'inline-block',
              }}
            />
            STEP 01 · SPECIMEN UPLOAD
          </div>

          {isDemo && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--klein)',
                background: 'rgba(30,42,255,0.08)',
                border: '1px solid rgba(30,42,255,0.25)',
                padding: '3px 9px',
                borderRadius: 100,
              }}
            >
              <Sparkles style={{ width: 10, height: 10 }} />
              Running in demo mode
            </motion.span>
          )}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(32px, 3vw, 52px)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
            fontVariationSettings: '"opsz" 72',
          }}
        >
          Select your{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--klein)' }}>
            specimen
          </em>
          .
        </h1>

        <p
          style={{
            color: 'var(--ink-3)',
            fontSize: 14,
            marginTop: 10,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          Drop a file and classify its content type — the pipeline adapts
          accordingly
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT: Dropzone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--rule)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(30,42,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileImage
                  style={{
                    width: 14,
                    height: 14,
                    color: 'var(--klein)',
                  }}
                />
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: 'var(--ink-3)',
                  textTransform: 'uppercase',
                }}
              >
                FILE INPUT
              </span>

              {pageState === 'uploaded' && !isDemo && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    letterSpacing: '0.1em',
                    color: 'var(--leaf)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  <CheckCircle2 style={{ width: 11, height: 11 }} />
                  LOADED
                </span>
              )}
            </div>

            <div style={{ padding: 20 }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".png,.jpg,.jpeg,.bmp"
                onChange={handleFileSelect}
              />

              <AnimatePresence mode="wait">
                {pageState !== 'uploaded' ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0 }}
                    animate={
                      pageState === 'error'
                        ? {
                            opacity: 1,
                            x: [0, -8, 8, -6, 6, -3, 3, 0],
                          }
                        : {
                            opacity: 1,
                            scale: isDragging ? 1.01 : 1,
                          }
                    }
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: pageState === 'error' ? 0.5 : 0.2,
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${
                        pageState === 'error'
                          ? '#d4574c'
                          : isDragging
                            ? 'var(--klein)'
                            : 'var(--rule)'
                      }`,
                      borderRadius: 'var(--r-md)',
                      padding: '52px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: isDragging
                        ? 'rgba(30,42,255,0.03)'
                        : pageState === 'error'
                          ? 'rgba(212,87,76,0.03)'
                          : 'white',
                      transition:
                        'background 0.2s, border-color 0.2s, transform 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        border: `1px solid ${
                          pageState === 'error'
                            ? '#d4574c'
                            : isDragging
                              ? 'var(--klein)'
                              : 'var(--rule)'
                        }`,
                        background: isDragging
                          ? 'rgba(30,42,255,0.04)'
                          : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {pageState === 'error' ? (
                        <AlertCircle
                          style={{
                            width: 22,
                            height: 22,
                            color: '#d4574c',
                          }}
                        />
                      ) : (
                        <Upload
                          style={{
                            width: 22,
                            height: 22,
                            color: isDragging
                              ? 'var(--klein)'
                              : 'var(--ink-4)',
                          }}
                        />
                      )}
                    </div>

                    {pageState === 'error' ? (
                      <div>
                        <p
                          style={{
                            color: '#d4574c',
                            fontSize: 14,
                            fontWeight: 500,
                            marginBottom: 6,
                          }}
                        >
                          Unsupported Format
                        </p>

                        <p
                          style={{
                            color: 'var(--ink-3)',
                            fontSize: 11.5,
                            marginBottom: 14,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          "{errorFileName}"
                        </p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--klein)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          TRY AGAIN
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p
                          style={{
                            color: 'var(--ink)',
                            fontSize: 13,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                          }}
                        >
                          {isDragging ? 'DROP TO LOAD' : 'DRAG & DROP · OR CLICK'}
                        </p>

                        <p
                          style={{
                            color: 'var(--ink-4)',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          PNG · BMP · JPG / JPEG
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    {/* Image preview */}
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--r-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--rule)',
                      }}
                    >
                      <img
                        src={file!.dataUrl}
                        alt="Specimen preview"
                        style={{
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      <button
                        onClick={handleReset}
                        title="Remove"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: '#d4574c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X style={{ width: 13, height: 13 }} />
                      </button>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'rgba(30,42,255,0.9)',
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: 100,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.15em',
                        }}
                      >
                        {file!.format}
                      </div>

                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isDemo ? 'var(--klein)' : 'var(--leaf)',
                          boxShadow: isDemo
                            ? '0 0 0 4px rgba(30,42,255,0.18)'
                            : '0 0 0 4px rgba(31,138,94,0.18)',
                          display: 'inline-block',
                        }}
                      />
                    </div>

                    {/* Metadata card */}
                    <div
                      style={{
                        background: 'var(--paper-2)',
                        borderRadius: 'var(--r-sm)',
                        padding: '12px 16px',
                        border: '1px solid var(--rule)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {[
                        { label: 'File Name', value: file!.name },
                        { label: 'Resolution', value: file!.resolution },
                        { label: 'Color Mode', value: file!.colorMode },
                        { label: 'Format', value: file!.format },
                        {
                          label: 'File Size',
                          value:
                            file!.sizeKB >= 1024
                              ? `${(file!.sizeKB / 1024).toFixed(1)} MB`
                              : `${file!.sizeKB} KB`,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: 6,
                            borderBottom: '1px solid var(--rule-soft)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9.5,
                              letterSpacing: '0.18em',
                              color: 'var(--ink-3)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {row.label}
                          </span>

                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--ink)',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Format info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '14px 18px',
              background: 'rgba(30,42,255,0.04)',
              border: '1px solid rgba(30,42,255,0.12)',
              borderRadius: 'var(--r-md)',
            }}
          >
            <Info
              style={{
                width: 13,
                height: 13,
                color: 'var(--klein)',
                marginTop: 1,
                flexShrink: 0,
              }}
            />

            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--ink-2)',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
              }}
            >
              All images are processed in <strong>greyscale</strong>. BMP and
              PNG provide the cleanest baseline. Max recommended size:{' '}
              <strong>2048×2048 px</strong>.
            </p>
          </div>
        </div>

        {/* RIGHT: Image Type Classification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sp-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--rule)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(30,42,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  style={{
                    width: 14,
                    height: 14,
                    color: 'var(--klein)',
                  }}
                />
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: 'var(--ink-3)',
                  textTransform: 'uppercase',
                }}
              >
                IMAGE CLASSIFICATION
              </span>
            </div>

            <div
              style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                Select the content type of your specimen. This affects how the
                pipeline optimises compression at later stages.
              </p>

              {IMAGE_TYPES.map((t) => {
                const isSelected = file?.imageType === t.value;
                const isLosslessForced = ['Fingerprint', 'Biomedical'].includes(
                  t.value
                );

                return (
                  <motion.button
                    key={t.value}
                    onClick={() => updateImageType(t.value)}
                    whileHover={{ x: 2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${
                        isSelected
                          ? 'rgba(30,42,255,0.35)'
                          : 'var(--rule)'
                      }`,
                      background: isSelected
                        ? 'rgba(30,42,255,0.04)'
                        : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: isSelected
                              ? 'var(--klein)'
                              : 'var(--ink)',
                            fontWeight: isSelected ? 600 : 400,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {t.label}
                        </span>

                        {isLosslessForced && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8.5,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: 'var(--amber)',
                              background: 'rgba(224,168,80,0.1)',
                              border: '1px solid rgba(224,168,80,0.25)',
                              padding: '1px 6px',
                              borderRadius: 100,
                            }}
                          >
                            LOSSLESS
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9.5,
                          color: 'var(--ink-4)',
                          marginTop: 3,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t.hint}
                      </p>
                    </div>

                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: `2px solid ${
                          isSelected ? 'var(--klein)' : 'var(--rule)'
                        }`,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.18s',
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--klein)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Lossless notice */}
          <AnimatePresence>
            {isForced && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '14px 18px',
                  background: 'rgba(224,168,80,0.06)',
                  border: '1px solid rgba(224,168,80,0.28)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <AlertCircle
                  style={{
                    width: 13,
                    height: 13,
                    color: 'var(--amber)',
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                />

                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    color: 'var(--ink-2)',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--amber)' }}>
                    Lossless mode
                  </strong>{' '}
                  will be enforced in the Quantization step for this image type.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Link
              to="/"
              className="sp-btn sp-btn-ghost"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              ← Overview
            </Link>

            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span style={{ flex: 2, display: 'flex' }}>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="sp-btn sp-btn-klein"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: canProceed ? 1 : 0.55,
                        cursor: canProceed ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Next: Preprocess
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </span>
                </TooltipTrigger>

                {!canProceed && (
                  <TooltipContent side="top">Upload an image first</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

    </motion.div>
  );
}