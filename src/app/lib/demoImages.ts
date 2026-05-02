export interface DemoImage {
  id: string;
  label: string;
  imageType: string;
  src: string;
  description: string;
  compressionNote: string;
  accent: string;
  crRange: string;
  losslessRequired: boolean;
}

export const DEMO_IMAGES: DemoImage[] = [
  {
    id: 'natural',
    label: 'Natural Scene',
    imageType: 'Natural',
    src: '/samples/natural.svg',
    description: 'Mountain lake at dusk — representative natural photograph with organic noise and irregular contours.',
    compressionNote: 'JPEG2000 db4/L3 achieves ~24:1 CR. Natural noise preserves gradient entropy better than AI outputs.',
    accent: '#2d6a4f',
    crRange: '18 – 28 : 1',
    losslessRequired: false,
  },
  {
    id: 'ai-generated',
    label: 'AI Generated',
    imageType: 'AI Generated',
    src: '/samples/ai-generated.svg',
    description: 'Same mountain lake scene — diffusion-model output. Hyper-smooth gradients, symmetric peaks, no film grain.',
    compressionNote: 'Smoother gradient fields → ~10–15% higher CR than the natural equivalent. DCT sparsity noticeably higher.',
    accent: '#6d28d9',
    crRange: '22 – 32 : 1',
    losslessRequired: false,
  },
  {
    id: 'synthetic',
    label: 'Synthetic Diagram',
    imageType: 'Synthetic',
    src: '/samples/synthetic.svg',
    description: 'Technical bar chart with solid flat colors and crisp hard edges — typical of rendered / CAD output.',
    compressionNote: 'Hard edges produce ringing at Δ > 12. Arithmetic coder preferred. PNG often beats JPEG on this type.',
    accent: '#0e7490',
    crRange: '16 – 24 : 1',
    losslessRequired: false,
  },
  {
    id: 'fingerprint',
    label: 'Fingerprint Whorl',
    imageType: 'Fingerprint',
    src: '/samples/fingerprint.svg',
    description: 'Latent impression scan — whorl pattern with annotated minutiae (ridge endings + bifurcations).',
    compressionNote: 'JPEG Δ > 8 merges adjacent ridges (spacing ~10 px) and creates false minutiae. AFIS matching fails. Δ = 1 forced.',
    accent: '#b45309',
    crRange: '4 – 6 : 1 (lossless)',
    losslessRequired: true,
  },
  {
    id: 'biomedical',
    label: 'Brain MRI Slice',
    imageType: 'Biomedical',
    src: '/samples/biomedical.svg',
    description: 'Simulated T1-weighted axial MRI. Tissue boundaries between white matter, gray matter and CSF must be preserved.',
    compressionNote: 'Lossy at Δ > 8 blurs tissue margins and alters signal intensity ratios. Misread as lesion or ventricle change.',
    accent: '#0891b2',
    crRange: '3 – 5 : 1 (lossless)',
    losslessRequired: true,
  },
];

export function getDemoImage(id: string): DemoImage | undefined {
  return DEMO_IMAGES.find(d => d.id === id);
}

export function getDemoImageByType(imageType: string): DemoImage | undefined {
  return DEMO_IMAGES.find(d => d.imageType === imageType);
}
