import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import type { Locale } from '@/features/catalog/types';

export type Industry = {
  id: string;
  slug: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string } | null;
  status: 'draft' | 'published' | 'coming_soon' | 'retired';
  sortOrder: number;
};

const SNAPSHOT_INDUSTRIES: Industry[] = [
  {
    id: 'ind-tech',
    slug: 'technology',
    name: { en: 'Technology and software', bn: 'প্রযুক্তি ও সফটওয়্যার' },
    summary: {
      en: 'Software, SaaS and IT services — entity and licence considerations.',
      bn: 'সফটওয়্যার, SaaS ও আইটি সেবা — সত্তা ও লাইসেন্স বিবেচনা।',
    },
    status: 'published',
    sortOrder: 10,
  },
  {
    id: 'ind-ecom',
    slug: 'ecommerce',
    name: { en: 'E-commerce', bn: 'ই-কমার্স' },
    summary: {
      en: 'Online retail and marketplace operations in Bangladesh.',
      bn: 'বাংলাদেশে অনলাইন খুচরা ও মার্কেটপ্লেস পরিচালনা।',
    },
    status: 'published',
    sortOrder: 20,
  },
  {
    id: 'ind-import',
    slug: 'import-export',
    name: { en: 'Import and export', bn: 'আমদানি ও রপ্তানি' },
    summary: {
      en: 'Trading companies and logistics operators.',
      bn: 'ট্রেডিং কোম্পানি ও লজিস্টিক্স অপারেটর।',
    },
    status: 'published',
    sortOrder: 30,
  },
  {
    id: 'ind-mfg',
    slug: 'manufacturing',
    name: { en: 'Manufacturing', bn: 'উৎপাদন' },
    summary: {
      en: 'Factory registration, environmental and fire clearances.',
      bn: 'কারখানা নিবন্ধন, পরিবেশ ও অগ্নি ছাড়পত্র।',
    },
    status: 'published',
    sortOrder: 40,
  },
];

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export const getIndustries = cache(async (): Promise<Industry[]> => {
  if (!supabaseConfigured()) return SNAPSHOT_INDUSTRIES;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('industries')
      .select('id, slug, name_en, name_bn, summary_en, summary_bn, status, sort_order')
      .eq('status', 'published')
      .order('sort_order');

    if (error || !data?.length) {
      if (error) logger.warn('industries.fallback', { message: error.message });
      return SNAPSHOT_INDUSTRIES;
    }

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: { en: row.name_en, bn: row.name_bn },
      summary:
        row.summary_en || row.summary_bn
          ? { en: row.summary_en ?? '', bn: row.summary_bn ?? '' }
          : null,
      status: row.status,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    logger.warn('industries.threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return SNAPSHOT_INDUSTRIES;
  }
});

export const getIndustryBySlug = cache(async (slug: string): Promise<Industry | null> => {
  const industries = await getIndustries();
  return industries.find((i) => i.slug === slug) ?? null;
});

export function pickIndustryName(industry: Industry, locale: Locale): string {
  return locale === 'bn' ? industry.name.bn : industry.name.en;
}
