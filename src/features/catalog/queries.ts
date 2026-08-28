import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import {
  SNAPSHOT_CATEGORIES,
  SNAPSHOT_FAQS,
  SNAPSHOT_RESOURCES,
  SNAPSHOT_SERVICES,
} from '@/content/catalog-snapshot';
import { mergeCategories, mergeServices } from '@/content/directory/taxonomy';
import type { CatalogSource, Faq, ResourcePage, Service, ServiceCategory } from './types';

export type CatalogResult<T> = { data: T; source: CatalogSource };

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Reads the published catalog.
 *
 * If Supabase is not configured or the query fails, the bundled snapshot is
 * returned rather than an empty page. The `source` field is surfaced in the UI
 * outside production so nobody mistakes stale snapshot content for live data.
 */
export const getCategories = cache(async (): Promise<CatalogResult<ServiceCategory[]>> => {
  if (!supabaseConfigured()) {
    return { data: mergeCategories(SNAPSHOT_CATEGORIES), source: 'snapshot' };
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('service_categories')
      .select('id, slug, name_en, name_bn, summary_en, summary_bn, icon, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      if (error) logger.warn('catalog.categories_fallback', { message: error.message });
      return { data: mergeCategories(SNAPSHOT_CATEGORIES), source: 'snapshot' };
    }

    return {
      source: 'database',
      data: mergeCategories(
        data.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: { en: row.name_en, bn: row.name_bn },
          summary: { en: row.summary_en ?? '', bn: row.summary_bn ?? '' },
          icon: row.icon,
          sortOrder: row.sort_order,
        })),
      ),
    };
  } catch (error) {
    logger.warn('catalog.categories_threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { data: mergeCategories(SNAPSHOT_CATEGORIES), source: 'snapshot' };
  }
});

const SERVICE_SELECT = `
  id, slug, name_en, name_bn, summary_en, summary_bn,
  who_for_en, who_for_bn, included_en, included_bn, not_included_en, not_included_bn,
  eligibility_en, eligibility_bn, authority_name_en, authority_name_bn,
  starting_fee_bdt, estimated_days_min, estimated_days_max, time_reviewed_at,
  requires_partner, is_regulated, status, sort_order,
  service_categories!inner(slug),
  service_requirements(code, label_en, label_bn, help_en, help_bn, applies_to, is_mandatory, sort_order),
  service_milestone_templates(code, label_en, label_bn, owner_kind, typical_days, weight, sort_order),
  service_fee_components(category, label_en, label_bn, payee, amount_bdt, is_estimate, is_refundable, tax_treatment, reviewed_at, sort_order)
`;

type ServiceRow = {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  summary_en: string;
  summary_bn: string;
  who_for_en: string | null;
  who_for_bn: string | null;
  included_en: string[];
  included_bn: string[];
  not_included_en: string[];
  not_included_bn: string[];
  eligibility_en: string | null;
  eligibility_bn: string | null;
  authority_name_en: string | null;
  authority_name_bn: string | null;
  starting_fee_bdt: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  time_reviewed_at: string | null;
  requires_partner: boolean;
  is_regulated: boolean;
  status: Service['status'];
  sort_order: number;
  service_categories: { slug: string } | null;
  service_requirements: Array<{
    code: string;
    label_en: string;
    label_bn: string;
    help_en: string | null;
    help_bn: string | null;
    applies_to: string;
    is_mandatory: boolean;
    sort_order: number;
  }>;
  service_milestone_templates: Array<{
    code: string;
    label_en: string;
    label_bn: string;
    owner_kind: string;
    typical_days: number | null;
    weight: number;
    sort_order: number;
  }>;
  service_fee_components: Array<{
    category: Service['feeComponents'][number]['category'];
    label_en: string;
    label_bn: string;
    payee: Service['feeComponents'][number]['payee'];
    amount_bdt: number | null;
    is_estimate: boolean;
    is_refundable: boolean;
    tax_treatment: string;
    reviewed_at: string | null;
    sort_order: number;
  }>;
};

function mapService(row: ServiceRow): Service {
  const bySort = <T extends { sort_order: number }>(items: T[]) =>
    [...items].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.service_categories?.slug ?? '',
    name: { en: row.name_en, bn: row.name_bn },
    summary: { en: row.summary_en, bn: row.summary_bn },
    whoFor: row.who_for_en ? { en: row.who_for_en, bn: row.who_for_bn ?? row.who_for_en } : null,
    included: { en: row.included_en, bn: row.included_bn },
    notIncluded: { en: row.not_included_en, bn: row.not_included_bn },
    eligibility: row.eligibility_en
      ? { en: row.eligibility_en, bn: row.eligibility_bn ?? row.eligibility_en }
      : null,
    authorityName: row.authority_name_en
      ? { en: row.authority_name_en, bn: row.authority_name_bn ?? row.authority_name_en }
      : null,
    startingFeeBdt: row.starting_fee_bdt,
    estimatedDaysMin: row.estimated_days_min,
    estimatedDaysMax: row.estimated_days_max,
    timeReviewedAt: row.time_reviewed_at,
    requiresPartner: row.requires_partner,
    isRegulated: row.is_regulated,
    status: row.status,
    sortOrder: row.sort_order,
    requirements: bySort(row.service_requirements).map((r) => ({
      code: r.code,
      label: { en: r.label_en, bn: r.label_bn },
      help: r.help_en ? { en: r.help_en, bn: r.help_bn ?? r.help_en } : null,
      appliesTo: r.applies_to,
      isMandatory: r.is_mandatory,
    })),
    milestones: bySort(row.service_milestone_templates).map((m) => ({
      code: m.code,
      label: { en: m.label_en, bn: m.label_bn },
      ownerKind: m.owner_kind as Service['milestones'][number]['ownerKind'],
      typicalDays: m.typical_days,
      weight: m.weight,
    })),
    feeComponents: bySort(row.service_fee_components).map((f) => ({
      category: f.category,
      label: { en: f.label_en, bn: f.label_bn },
      payee: f.payee,
      amountBdt: f.amount_bdt,
      isEstimate: f.is_estimate,
      isRefundable: f.is_refundable,
      taxTreatment: f.tax_treatment as Service['feeComponents'][number]['taxTreatment'],
      reviewedAt: f.reviewed_at,
    })),
  };
}

export const getServices = cache(async (): Promise<CatalogResult<Service[]>> => {
  if (!supabaseConfigured()) {
    return { data: mergeServices(SNAPSHOT_SERVICES), source: 'snapshot' };
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_SELECT)
      .in('status', ['published', 'coming_soon'])
      .order('sort_order');

    if (error || !data || data.length === 0) {
      if (error) logger.warn('catalog.services_fallback', { message: error.message });
      return { data: mergeServices(SNAPSHOT_SERVICES), source: 'snapshot' };
    }

    return {
      data: mergeServices((data as unknown as ServiceRow[]).map(mapService)),
      source: 'database',
    };
  } catch (error) {
    logger.warn('catalog.services_threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { data: mergeServices(SNAPSHOT_SERVICES), source: 'snapshot' };
  }
});

export async function getService(slug: string): Promise<CatalogResult<Service | null>> {
  const { data, source } = await getServices();
  return { data: data.find((s) => s.slug === slug) ?? null, source };
}

export const getFaqs = cache(async (): Promise<CatalogResult<Faq[]>> => {
  if (!supabaseConfigured()) return { data: SNAPSHOT_FAQS, source: 'snapshot' };

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('service_faqs')
      .select(
        'id, question_en, question_bn, answer_en, answer_bn, is_global, is_compliance_sensitive, last_reviewed_at, sort_order, services(slug)',
      )
      .eq('status', 'published')
      .order('sort_order');

    if (error || !data || data.length === 0) {
      if (error) logger.warn('catalog.faqs_fallback', { message: error.message });
      return { data: SNAPSHOT_FAQS, source: 'snapshot' };
    }

    type Row = {
      id: string;
      question_en: string;
      question_bn: string;
      answer_en: string;
      answer_bn: string;
      is_global: boolean;
      is_compliance_sensitive: boolean;
      last_reviewed_at: string | null;
      sort_order: number;
      services: { slug: string } | null;
    };

    return {
      source: 'database',
      data: (data as unknown as Row[]).map((row) => ({
        id: row.id,
        serviceSlug: row.services?.slug ?? null,
        question: { en: row.question_en, bn: row.question_bn },
        answer: { en: row.answer_en, bn: row.answer_bn },
        isGlobal: row.is_global,
        isComplianceSensitive: row.is_compliance_sensitive,
        lastReviewedAt: row.last_reviewed_at,
        sortOrder: row.sort_order,
      })),
    };
  } catch (error) {
    logger.warn('catalog.faqs_threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { data: SNAPSHOT_FAQS, source: 'snapshot' };
  }
});

export const getResources = cache(async (): Promise<CatalogResult<ResourcePage[]>> => {
  if (!supabaseConfigured()) return { data: SNAPSHOT_RESOURCES, source: 'snapshot' };

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('content_pages')
      .select(
        'slug, kind, title_en, title_bn, excerpt_en, excerpt_bn, body_en, body_bn, last_reviewed_at, next_review_due, published_at, reading_minutes',
      )
      .eq('status', 'published')
      .eq('kind', 'resource')
      .order('published_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) logger.warn('catalog.resources_fallback', { message: error.message });
      return { data: SNAPSHOT_RESOURCES, source: 'snapshot' };
    }

    return {
      source: 'database',
      data: data.map((row) => ({
        slug: row.slug,
        kind: row.kind as ResourcePage['kind'],
        title: { en: row.title_en, bn: row.title_bn },
        excerpt: row.excerpt_en
          ? { en: row.excerpt_en, bn: row.excerpt_bn ?? row.excerpt_en }
          : null,
        body: { en: row.body_en, bn: row.body_bn },
        lastReviewedAt: row.last_reviewed_at,
        nextReviewDue: row.next_review_due,
        publishedAt: row.published_at,
        readingMinutes: row.reading_minutes,
      })),
    };
  } catch (error) {
    logger.warn('catalog.resources_threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { data: SNAPSHOT_RESOURCES, source: 'snapshot' };
  }
});

export async function getResource(slug: string): Promise<CatalogResult<ResourcePage | null>> {
  const { data, source } = await getResources();
  return { data: data.find((r) => r.slug === slug) ?? null, source };
}

export const getGlobalFaqs = cache(async (): Promise<CatalogResult<Faq[]>> => {
  const { data, source } = await getFaqs();
  return { data: data.filter((f) => f.isGlobal), source };
});
