/**
 * Maps the engine's stable machine keys onto customer-facing copy in both
 * languages. Keeping this out of the rules table means an operations edit can
 * never produce untranslated or unreviewed customer text.
 */

type Bilingual = { en: string; bn: string };

export const MANUAL_REVIEW_REASONS: Record<string, Bilingual> = {
  corporate_or_trust_owner: {
    en: 'One of the owners is a company, trust or fund. We must identify the people who ultimately own or control it before we can proceed.',
    bn: 'মালিকদের একজন কোম্পানি, ট্রাস্ট বা ফান্ড। এগোনোর আগে যাঁরা প্রকৃতপক্ষে এর মালিক বা নিয়ন্ত্রক, তাঁদের শনাক্ত করতে হবে।',
  },
  regulated_sector: {
    en: 'The activity appears to fall in a regulated sector, which has its own eligibility conditions decided by a specific authority.',
    bn: 'কার্যক্রমটি একটি নিয়ন্ত্রিত খাতে পড়ে বলে মনে হচ্ছে, যার নিজস্ব যোগ্যতার শর্ত আছে এবং সিদ্ধান্ত নেয় নির্দিষ্ট কর্তৃপক্ষ।',
  },
  foreign_ownership: {
    en: 'There is foreign ownership. A partner advocate confirms sector eligibility and any ownership cap before we quote.',
    bn: 'এখানে বিদেশি মালিকানা আছে। কোটেশন দেওয়ার আগে অংশীদার আইনজীবী খাতের যোগ্যতা ও মালিকানার সীমা নিশ্চিত করেন।',
  },
  branch_or_liaison_office: {
    en: 'A branch or liaison office is set up under a different process from a company, with its own approvals.',
    bn: 'শাখা বা লিয়াজোঁ অফিস কোম্পানির চেয়ে ভিন্ন প্রক্রিয়ায় গঠিত হয়, যার নিজস্ব অনুমোদন লাগে।',
  },
  inward_capital_remittance: {
    en: 'Capital will be remitted from abroad, so the bank steps have to happen in a specific order.',
    bn: 'বিদেশ থেকে মূলধন আসবে, তাই ব্যাংকের ধাপগুলো নির্দিষ্ট ক্রমে সম্পন্ন করতে হবে।',
  },
};

export const STRUCTURE_LABELS: Record<string, Bilingual> = {
  private_limited: { en: 'Private limited company', bn: 'প্রাইভেট লিমিটেড কোম্পানি' },
  one_person: { en: 'One-person company', bn: 'ওয়ান পারসন কোম্পানি' },
  partnership: { en: 'Partnership', bn: 'পার্টনারশিপ' },
  sole_proprietorship: { en: 'Sole proprietorship', bn: 'একক মালিকানা' },
  branch_office: { en: 'Branch office', bn: 'শাখা অফিস' },
  liaison_office: { en: 'Liaison office', bn: 'লিয়াজোঁ অফিস' },
};

export function localized(
  map: Record<string, Bilingual>,
  key: string,
  locale: string,
): string | null {
  const entry = map[key];
  if (!entry) return null;
  return locale === 'bn' ? entry.bn : entry.en;
}
