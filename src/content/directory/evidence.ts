import type { EvidenceClaim } from '@/features/directory/types';

/**
 * Only `verified` and `public` rows may appear on marketing pages.
 * Draft operator-identity claims stay here so they cannot be forgotten,
 * and so a future approval is a status change rather than a new invention.
 */
export const EVIDENCE_CLAIMS: readonly EvidenceClaim[] = [
  {
    id: 'EVD-INDEPENDENCE',
    text: {
      en: 'Independent platform — not a government authority or law firm.',
      bn: 'স্বাধীন প্ল্যাটফর্ম — সরকারি কর্তৃপক্ষ বা আইনি প্রতিষ্ঠান নয়।',
    },
    status: 'verified',
    public: true,
  },
  {
    id: 'EVD-PRIVATE-STORAGE',
    text: {
      en: 'Documents stay in a private vault, not a public link.',
      bn: 'কাগজপত্র থাকে ব্যক্তিগত ভল্টে, পাবলিক লিঙ্কে নয়।',
    },
    status: 'verified',
    public: true,
  },
  {
    id: 'EVD-STAFF-MFA',
    text: {
      en: 'Staff and partners use multi-factor authentication.',
      bn: 'কর্মী ও অংশীদাররা মাল্টি-ফ্যাক্টর প্রমাণীকরণ ব্যবহার করেন।',
    },
    status: 'verified',
    public: true,
  },
  {
    id: 'EVD-ITEMISED-QUOTES',
    text: {
      en: 'Every quote itemises the bdoor fee separately from official charges.',
      bn: 'প্রতিটি কোটেশনে bdoor-এর ফি সরকারি খরচ থেকে আলাদা করে দেখানো হয়।',
    },
    status: 'verified',
    public: true,
  },
  {
    id: 'EVD-OPERATOR-ENTITY',
    text: {
      en: 'Operator legal entity',
      bn: 'পরিচালক আইনি সত্তা',
    },
    status: 'draft',
    public: false,
  },
];

export function publicEvidenceClaims(): EvidenceClaim[] {
  return EVIDENCE_CLAIMS.filter((row) => row.public && row.status === 'verified');
}
