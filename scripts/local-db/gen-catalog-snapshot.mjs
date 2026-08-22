#!/usr/bin/env node
/**
 * Dumps the published catalog from the local seeded database into
 * `src/content/catalog-snapshot.ts`.
 *
 * That snapshot is the fallback the marketing site renders when Supabase is not
 * reachable — a fresh clone with no credentials, a preview build, or a database
 * outage. It is generated from supabase/seed.sql so there is one source of
 * truth, and it is regenerated with:
 *
 *   scripts/local-db/apply.sh --seed && node scripts/local-db/gen-catalog-snapshot.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DB = process.env.PGDATABASE ?? 'bdoor_test';
const HOST = process.env.PGHOST ?? '/tmp';
const PORT = process.env.PGPORT ?? '55432';
const USER = process.env.PGUSER ?? 'postgres';

function query(sql) {
  const out = execFileSync('psql', ['-h', HOST, '-p', PORT, '-U', USER, '-d', DB, '-tAqc', sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.trim() ? JSON.parse(out) : [];
}

const categories = query(`
  select coalesce(json_agg(json_build_object(
    'id', id, 'slug', slug,
    'name', json_build_object('en', name_en, 'bn', name_bn),
    'summary', json_build_object('en', coalesce(summary_en,''), 'bn', coalesce(summary_bn,'')),
    'icon', icon, 'sortOrder', sort_order
  ) order by sort_order), '[]'::json)
  from public.service_categories where is_active;
`);

const services = query(`
  select coalesce(json_agg(x order by x."sortOrder"), '[]'::json) from (
    select s.id, s.slug, c.slug as "categorySlug",
      json_build_object('en', s.name_en, 'bn', s.name_bn) as name,
      json_build_object('en', s.summary_en, 'bn', s.summary_bn) as summary,
      case when s.who_for_en is null then null
           else json_build_object('en', s.who_for_en, 'bn', coalesce(s.who_for_bn, s.who_for_en)) end as "whoFor",
      json_build_object('en', s.included_en, 'bn', s.included_bn) as included,
      json_build_object('en', s.not_included_en, 'bn', s.not_included_bn) as "notIncluded",
      case when s.eligibility_en is null then null
           else json_build_object('en', s.eligibility_en, 'bn', coalesce(s.eligibility_bn, s.eligibility_en)) end as eligibility,
      case when s.authority_name_en is null then null
           else json_build_object('en', s.authority_name_en, 'bn', coalesce(s.authority_name_bn, s.authority_name_en)) end as "authorityName",
      s.starting_fee_bdt::float8 as "startingFeeBdt",
      s.estimated_days_min as "estimatedDaysMin",
      s.estimated_days_max as "estimatedDaysMax",
      s.time_reviewed_at::text as "timeReviewedAt",
      s.requires_partner as "requiresPartner",
      s.is_regulated as "isRegulated",
      s.status, s.sort_order as "sortOrder",
      coalesce((select json_agg(json_build_object(
          'code', r.code,
          'label', json_build_object('en', r.label_en, 'bn', r.label_bn),
          'help', case when r.help_en is null then null
                       else json_build_object('en', r.help_en, 'bn', coalesce(r.help_bn, r.help_en)) end,
          'appliesTo', r.applies_to, 'isMandatory', r.is_mandatory) order by r.sort_order)
        from public.service_requirements r where r.service_id = s.id), '[]'::json) as requirements,
      coalesce((select json_agg(json_build_object(
          'code', m.code,
          'label', json_build_object('en', m.label_en, 'bn', m.label_bn),
          'ownerKind', m.owner_kind, 'typicalDays', m.typical_days, 'weight', m.weight) order by m.sort_order)
        from public.service_milestone_templates m where m.service_id = s.id), '[]'::json) as milestones,
      coalesce((select json_agg(json_build_object(
          'category', f.category,
          'label', json_build_object('en', f.label_en, 'bn', f.label_bn),
          'payee', f.payee, 'amountBdt', f.amount_bdt::float8,
          'isEstimate', f.is_estimate, 'isRefundable', f.is_refundable,
          'taxTreatment', f.tax_treatment, 'reviewedAt', f.reviewed_at::text) order by f.sort_order)
        from public.service_fee_components f where f.service_id = s.id), '[]'::json) as "feeComponents"
    from public.services s
    join public.service_categories c on c.id = s.category_id
    where s.status in ('published', 'coming_soon')
  ) x;
`);

const faqs = query(`
  select coalesce(json_agg(json_build_object(
    'id', f.id,
    'serviceSlug', s.slug,
    'question', json_build_object('en', f.question_en, 'bn', f.question_bn),
    'answer', json_build_object('en', f.answer_en, 'bn', f.answer_bn),
    'isGlobal', f.is_global,
    'isComplianceSensitive', f.is_compliance_sensitive,
    'lastReviewedAt', f.last_reviewed_at::text,
    'sortOrder', f.sort_order) order by f.sort_order), '[]'::json)
  from public.service_faqs f
  left join public.services s on s.id = f.service_id
  where f.status = 'published';
`);

const resources = query(`
  select coalesce(json_agg(json_build_object(
    'slug', slug, 'kind', kind,
    'title', json_build_object('en', title_en, 'bn', title_bn),
    'excerpt', case when excerpt_en is null then null
                    else json_build_object('en', excerpt_en, 'bn', coalesce(excerpt_bn, excerpt_en)) end,
    'body', json_build_object('en', body_en, 'bn', body_bn),
    'lastReviewedAt', last_reviewed_at::text,
    'nextReviewDue', next_review_due::text,
    'publishedAt', published_at::text,
    'readingMinutes', reading_minutes) order by published_at desc nulls last), '[]'::json)
  from public.content_pages where status = 'published' and kind = 'resource';
`);

const banner = `// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Offline snapshot of the published catalog, generated from supabase/seed.sql:
//
//   scripts/local-db/apply.sh --seed
//   node scripts/local-db/gen-catalog-snapshot.mjs
//
// The marketing site renders this when Supabase is unreachable (a fresh clone
// with no credentials, a preview build, an outage) so the public pages never
// go blank. \`catalogSource\` on every query result tells callers which was used.

import type { Faq, ResourcePage, Service, ServiceCategory } from '@/features/catalog/types';
`;

const out = `${banner}
export const SNAPSHOT_CATEGORIES: ServiceCategory[] = ${JSON.stringify(categories, null, 2)};

export const SNAPSHOT_SERVICES: Service[] = ${JSON.stringify(services, null, 2)};

export const SNAPSHOT_FAQS: Faq[] = ${JSON.stringify(faqs, null, 2)};

export const SNAPSHOT_RESOURCES: ResourcePage[] = ${JSON.stringify(resources, null, 2)};
`;

writeFileSync(new URL('../../src/content/catalog-snapshot.ts', import.meta.url), out);
console.log(
  `Snapshot: ${categories.length} categories, ${services.length} services, ${faqs.length} FAQs, ${resources.length} resources.`,
);
