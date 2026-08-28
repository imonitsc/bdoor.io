import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import type { Locale } from '@/features/catalog/types';

export type Country = {
  code: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string } | null;
  status: 'draft' | 'published' | 'coming_soon' | 'retired';
  isFlagship: boolean;
  sortOrder: number;
};

const SNAPSHOT_COUNTRIES: Country[] = [
  {
    code: 'BD',
    name: { en: 'Bangladesh', bn: 'বাংলাদেশ' },
    summary: {
      en: 'Primary market — company formation, licences, tax and compliance.',
      bn: 'প্রাথমিক বাজার — কোম্পানি গঠন, লাইসেন্স, কর ও কমপ্লায়েন্স।',
    },
    status: 'published',
    isFlagship: true,
    sortOrder: 10,
  },
  {
    code: 'US',
    name: { en: 'United States', bn: 'যুক্তরাষ্ট্র' },
    summary: {
      en: 'LLC and corporation routes through verified specialists. Coming soon.',
      bn: 'যাচাইকৃত বিশেষজ্ঞদের মাধ্যমে LLC ও কর্পোরেশন রুট। শীঘ্রই আসছে।',
    },
    status: 'coming_soon',
    isFlagship: false,
    sortOrder: 20,
  },
  {
    code: 'GB',
    name: { en: 'United Kingdom', bn: 'যুক্তরাজ্য' },
    summary: {
      en: 'Private limited company formation and filings. Coming soon.',
      bn: 'প্রাইভেট লিমিটেড কোম্পানি গঠন ও ফাইলিং। শীঘ্রই আসছে।',
    },
    status: 'coming_soon',
    isFlagship: false,
    sortOrder: 30,
  },
  {
    code: 'AE',
    name: { en: 'United Arab Emirates', bn: 'সংযুক্ত আরব আমিরাত' },
    summary: {
      en: 'Free-zone and mainland options through verified providers. Coming soon.',
      bn: 'যাচাইকৃত প্রদানকারীদের মাধ্যমে ফ্রি-জোন ও মেইনল্যান্ড বিকল্প। শীঘ্রই আসছে।',
    },
    status: 'coming_soon',
    isFlagship: false,
    sortOrder: 40,
  },
  {
    code: 'SG',
    name: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
    summary: {
      en: 'Pte Ltd formation and ACRA filings. Coming soon.',
      bn: 'Pte Ltd গঠন ও ACRA ফাইলিং। শীঘ্রই আসছে।',
    },
    status: 'coming_soon',
    isFlagship: false,
    sortOrder: 50,
  },
];

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export const getCountries = cache(async (): Promise<Country[]> => {
  if (!supabaseConfigured()) return SNAPSHOT_COUNTRIES;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('countries')
      .select('code, name_en, name_bn, summary_en, summary_bn, status, is_flagship, sort_order')
      .in('status', ['published', 'coming_soon'])
      .order('sort_order');

    if (error || !data?.length) {
      if (error) logger.warn('countries.fallback', { message: error.message });
      return SNAPSHOT_COUNTRIES;
    }

    return data.map((row) => ({
      code: row.code,
      name: { en: row.name_en, bn: row.name_bn },
      summary:
        row.summary_en || row.summary_bn
          ? { en: row.summary_en ?? '', bn: row.summary_bn ?? '' }
          : null,
      status: row.status,
      isFlagship: row.is_flagship,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    logger.warn('countries.threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return SNAPSHOT_COUNTRIES;
  }
});

export function pickCountryName(country: Country, locale: Locale): string {
  return locale === 'bn' ? country.name.bn : country.name.en;
}
