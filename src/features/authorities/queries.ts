import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import type { Locale } from '@/features/catalog/types';

export type Authority = {
  id: string;
  slug: string;
  name: { en: string; bn: string };
  role: { en: string; bn: string };
  websiteUrl: string | null;
  summary: { en: string; bn: string } | null;
  disclaimer: { en: string; bn: string } | null;
  lastVerifiedAt: string | null;
  sortOrder: number;
};

const SNAPSHOT_AUTHORITIES: Authority[] = [
  {
    id: 'auth-rjsc',
    slug: 'rjsc',
    name: {
      en: 'Registrar of Joint Stock Companies and Firms (RJSC)',
      bn: 'জয়েন্ট স্টক কোম্পানি ও ফার্ম রেজিস্ট্রার (আরজেএসসি)',
    },
    role: {
      en: 'Registers companies, partnerships and societies in Bangladesh.',
      bn: 'বাংলাদেশে কোম্পানি, অংশীদারিত্ব ও সোসাইটি নিবন্ধন করে।',
    },
    websiteUrl: 'https://www.roc.gov.bd/',
    summary: null,
    disclaimer: {
      en: 'bdoor is not affiliated with RJSC. Government decisions remain with the authority.',
      bn: 'bdoor আরজেএসসির সাথে সংযুক্ত নয়। সরকারি সিদ্ধান্ত কর্তৃপক্ষের কাছে থাকে।',
    },
    lastVerifiedAt: null,
    sortOrder: 10,
  },
  {
    id: 'auth-nbr',
    slug: 'nbr',
    name: { en: 'National Board of Revenue (NBR)', bn: 'জাতীয় রাজস্ব বোর্ড (এনবিআর)' },
    role: {
      en: 'Tax registration, returns and VAT administration.',
      bn: 'কর নিবন্ধন, রিটার্ন ও ভ্যাট প্রশাসন।',
    },
    websiteUrl: 'https://www.nbr.gov.bd/',
    summary: null,
    disclaimer: {
      en: 'bdoor is not affiliated with NBR.',
      bn: 'bdoor এনবিআরের সাথে সংযুক্ত নয়।',
    },
    lastVerifiedAt: null,
    sortOrder: 20,
  },
];

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export const getAuthorities = cache(async (): Promise<Authority[]> => {
  if (!supabaseConfigured()) return SNAPSHOT_AUTHORITIES;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('authorities')
      .select(
        'id, slug, name_en, name_bn, role_en, role_bn, website_url, summary_en, summary_bn, disclaimer_en, disclaimer_bn, last_verified_at, sort_order',
      )
      .eq('status', 'published')
      .order('sort_order');

    if (error || !data?.length) {
      if (error) logger.warn('authorities.fallback', { message: error.message });
      return SNAPSHOT_AUTHORITIES;
    }

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: { en: row.name_en, bn: row.name_bn },
      role: { en: row.role_en, bn: row.role_bn },
      websiteUrl: row.website_url,
      summary:
        row.summary_en || row.summary_bn
          ? { en: row.summary_en ?? '', bn: row.summary_bn ?? '' }
          : null,
      disclaimer:
        row.disclaimer_en || row.disclaimer_bn
          ? { en: row.disclaimer_en ?? '', bn: row.disclaimer_bn ?? '' }
          : null,
      lastVerifiedAt: row.last_verified_at,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    logger.warn('authorities.threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return SNAPSHOT_AUTHORITIES;
  }
});

export function pickAuthority(field: { en: string; bn: string }, locale: Locale): string {
  return locale === 'bn' ? field.bn : field.en;
}
