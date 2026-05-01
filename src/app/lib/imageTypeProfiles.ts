/**
 * Image-type compression profiles
 * ─────────────────────────────────────────────────────────
 * Each image class (Natural, AI Generated, Synthetic, Fingerprint,
 * Biomedical) has a "trained" preset — a set of pipeline parameters
 * empirically tuned to that statistical distribution.
 *
 * Used by:
 *   • Transform page  — recommended method/wavelet/level
 *   • Quantization    — recommended step size, lossless lock
 *   • Processing      — type bonus on CR (in computeResults)
 *   • Upload          — banner shown when a type is picked
 */

export type ImageType =
  | 'Natural'
  | 'AI Generated'
  | 'Synthetic'
  | 'Fingerprint'
  | 'Biomedical';

export interface TypeProfile {
  type: ImageType;
  label: string;
  blurb: string;
  /** transform recommendation */
  method: 'jpeg' | 'jpeg2000';
  waveletFilter: 'haar' | 'db2' | 'db4';
  decompositionLevel: number;
  /** quantization recommendation */
  quantizationType: 'uniform' | 'scalar';
  stepSize: number;
  forceLossless: boolean;
  /** entropy coder recommendation */
  coder: 'huffman-default' | 'huffman-custom' | 'arithmetic';
  /** typical performance gain factor (multiplies base CR) */
  crBonus: number;
  /** colour-space pick suggested by the profile */
  colorSpace: 'ycbcr' | 'rgb' | 'luma';
  /** accent colour used in UI badges */
  accent: string;
}

export const PROFILES: Record<ImageType, TypeProfile> = {
  'Natural': {
    type: 'Natural',
    label: 'Natural',
    blurb: 'Photographic content with smooth gradients and texture. JPEG2000 + db4 captures the wide spatial-frequency range without ringing.',
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 3,
    quantizationType: 'scalar',
    stepSize: 18,
    forceLossless: false,
    coder: 'huffman-default',
    crBonus: 1.0,
    colorSpace: 'ycbcr',
    accent: '#1E2AFF',
  },
  'AI Generated': {
    type: 'AI Generated',
    label: 'AI Generated',
    blurb: 'Diffusion / GAN output — flatter regions and softer high-frequency content than photos. Higher decomposition + custom Huffman wins back 8-12 % size.',
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 4,
    quantizationType: 'scalar',
    stepSize: 14,
    forceLossless: false,
    coder: 'huffman-custom',
    crBonus: 1.10,
    colorSpace: 'ycbcr',
    accent: '#00D4FF',
  },
  'Synthetic': {
    type: 'Synthetic',
    label: 'Synthetic',
    blurb: 'Charts, UI captures, vector renderings — sharp edges and large flat regions. Wavelet transform with arithmetic coder outperforms DCT here.',
    method: 'jpeg2000',
    waveletFilter: 'db2',
    decompositionLevel: 3,
    quantizationType: 'uniform',
    stepSize: 10,
    forceLossless: false,
    coder: 'arithmetic',
    crBonus: 1.18,
    colorSpace: 'rgb',
    accent: '#4B1E7A',
  },
  'Fingerprint': {
    type: 'Fingerprint',
    label: 'Fingerprint',
    blurb: 'Forensic data — cannot tolerate ridge alteration. Lossless Haar at low decomposition keeps every minutia bit-exact.',
    method: 'jpeg2000',
    waveletFilter: 'haar',
    decompositionLevel: 2,
    quantizationType: 'uniform',
    stepSize: 1,
    forceLossless: true,
    coder: 'huffman-custom',
    crBonus: 0.78,
    colorSpace: 'luma',
    accent: '#E0A850',
  },
  'Biomedical': {
    type: 'Biomedical',
    label: 'Biomedical',
    blurb: 'CT / MRI slices — diagnostic accuracy required. Lossless mode is enforced; sym-style wavelets retain anatomical edges best.',
    method: 'jpeg2000',
    waveletFilter: 'db4',
    decompositionLevel: 4,
    quantizationType: 'scalar',
    stepSize: 1,
    forceLossless: true,
    coder: 'huffman-custom',
    crBonus: 0.82,
    colorSpace: 'luma',
    accent: '#1F8A5E',
  },
};

export function getProfile(type: string | undefined | null): TypeProfile {
  if (type && type in PROFILES) return PROFILES[type as ImageType];
  return PROFILES['Natural'];
}

export function listProfiles(): TypeProfile[] {
  return Object.values(PROFILES);
}
