-- Seed published Bangladesh packages and draft international offers from the
-- 65/35 commercial catalog (review date 2026-08-28). Additive and idempotent.
-- Public UI may still prefer the TypeScript catalog when credentials are
-- absent; this gives admin/RLS environments real rows to read.

insert into public.service_packages (slug, segment, jurisdiction_code, name_en, name_bn, sort_order)
values
  ('solo-start', 'new_business', 'BD', 'Solo Start', 'সোলো স্টার্ট', 10),
  ('limited-company', 'new_business', 'BD', 'Limited Company', 'লিমিটেড কোম্পানি', 20),
  ('complete-launch', 'new_business', 'BD', 'Complete Launch', 'সম্পূর্ণ লঞ্চ', 30),
  ('compliance-check', 'existing_business', 'BD', 'Compliance Check', 'কমপ্লায়েন্স যাচাই', 40),
  ('annual-compliance', 'existing_business', 'BD', 'Annual Compliance', 'বার্ষিক কমপ্লায়েন্স', 50),
  ('managed-finance-compliance', 'existing_business', 'BD', 'Managed Finance & Compliance', 'ম্যানেজড ফাইন্যান্স ও কমপ্লায়েন্স', 60)
on conflict (slug) do update set
  segment = excluded.segment,
  name_en = excluded.name_en,
  name_bn = excluded.name_bn,
  sort_order = excluded.sort_order,
  updated_at = now();

-- One published version per package (version_no = 1). Skip if already present.
insert into public.package_versions (
  package_id, version_no, status, effective_from, checkout_enabled,
  public_label_en, public_label_bn, summary_en, summary_bn,
  inclusions, exclusions, limits, assumptions, source_reviewed_at
)
select
  p.id,
  1,
  'published',
  date '2026-08-28',
  true,
  v.public_label_en,
  v.public_label_bn,
  v.summary_en,
  v.summary_bn,
  v.inclusions::jsonb,
  v.exclusions::jsonb,
  v.limits::jsonb,
  v.assumptions::jsonb,
  date '2026-08-28'
from public.service_packages p
join (
  values
    ('solo-start',
     'BDT 9,900 + official fees', '৯,৯০০ টাকা + সরকারি ফি',
     'For a sole proprietor or single-founder start with essential registrations.',
     'একক মালিকানা বা একজন প্রতিষ্ঠাতার জন্য প্রয়োজনীয় নিবন্ধন।',
     '[]', '[]', '[]', '[]'),
    ('limited-company',
     'BDT 24,900 + RJSC fees', '২৪,৯০০ টাকা + আরজেএসসি ফি',
     'Private limited company incorporation with RJSC filing coordination.',
     'আরজেএসসি ফাইলিং সমন্বয়সহ প্রাইভেট লিমিটেড কোম্পানি গঠন।',
     '[]', '[]', '[]', '[]'),
    ('complete-launch',
     'BDT 39,900 + official and third-party fees', '৩৯,৯০০ টাকা + সরকারি ও তৃতীয়-পক্ষ ফি',
     'Incorporation plus essential registrations for a fuller launch.',
     'পূর্ণতর লঞ্চের জন্য গঠনসহ প্রয়োজনীয় নিবন্ধন।',
     '[]', '[]', '[]', '[]'),
    ('compliance-check',
     'BDT 14,900', '১৪,৯০০ টাকা',
     'A scoped review of filings, licences and gaps for an existing business.',
     'বিদ্যমান ব্যবসার ফাইলিং, লাইসেন্স ও ঘাটতির নির্ধারিত পর্যালোচনা।',
     '[]', '[]', '[]', '[]'),
    ('annual-compliance',
     'BDT 49,900/year + official, audit and specialist fees',
     'বছরে ৪৯,৯০০ টাকা + সরকারি, অডিট ও বিশেষজ্ঞ ফি',
     'Year-round compliance coordination for an operating company.',
     'চালু কোম্পানির জন্য সারা বছরের কমপ্লায়েন্স সমন্বয়।',
     '[]', '[]', '[]', '[]'),
    ('managed-finance-compliance',
     'From BDT 11,900/month', 'মাসে ১১,৯০০ টাকা থেকে',
     'Ongoing finance and compliance coordination with a dedicated case manager.',
     'নির্দিষ্ট কেস ম্যানেজারসহ চলমান ফাইন্যান্স ও কমপ্লায়েন্স সমন্বয়।',
     '[]', '[]', '[]', '[]')
) as v(slug, public_label_en, public_label_bn, summary_en, summary_bn, inclusions, exclusions, limits, assumptions)
  on p.slug = v.slug
where not exists (
  select 1 from public.package_versions pv
  where pv.package_id = p.id and pv.version_no = 1
);

insert into public.package_fee_components (
  package_version_id, layer, label_en, label_bn, amount_minor, currency,
  is_estimate, is_refundable, payee, tax_treatment, reviewed_at, sort_order
)
select
  pv.id,
  'platform_service_fee',
  'bdoor professional fee',
  'bdoor পেশাদার ফি',
  f.amount_minor,
  'BDT',
  false,
  false,
  'bdoor',
  'pending_review',
  date '2026-08-28',
  10
from public.package_versions pv
join public.service_packages p on p.id = pv.package_id
join (
  values
    ('solo-start', 990000::bigint),
    ('limited-company', 2490000::bigint),
    ('complete-launch', 3990000::bigint),
    ('compliance-check', 1490000::bigint),
    ('annual-compliance', 4990000::bigint),
    ('managed-finance-compliance', 1190000::bigint)
) as f(slug, amount_minor) on f.slug = p.slug
where pv.version_no = 1
  and not exists (
    select 1 from public.package_fee_components c where c.package_version_id = pv.id
  );

insert into public.international_offers (
  slug, country_code, route_en, route_bn, status, checkout_enabled,
  public_label_en, public_label_bn, summary_en, summary_bn,
  disclosures, fee_components, source_reviewed_at
)
values
  (
    'usa-wyoming-llc', 'US', 'Wyoming LLC', 'ওয়াইমিং LLC', 'draft', false,
    'USD 449 estimated total', 'আনুমানিক মোট ৪৪৯ মার্কিন ডলার',
    'LLC formation with EIN support, delivered with a licensed US provider.',
    'লাইসেন্সপ্রাপ্ত মার্কিন প্রদানকারীর সঙ্গে LLC গঠন ও EIN সহায়তা।',
    '[]'::jsonb,
    '[{"layer":"platform_service_fee","amount_minor":34900,"currency":"USD"},{"layer":"government_fee_estimate","amount_minor":10000,"currency":"USD"}]'::jsonb,
    date '2026-08-28'
  ),
  (
    'uk-non-resident-ltd', 'GB', 'Non-resident LTD', 'নন-রেসিডেন্ট LTD', 'draft', false,
    'GBP 349 estimated total', 'আনুমানিক মোট ৩৪৯ পাউন্ড',
    'Private limited company formation for non-resident founders.',
    'অনাবাসী প্রতিষ্ঠাতাদের জন্য প্রাইভেট লিমিটেড কোম্পানি গঠন।',
    '[]'::jsonb,
    '[{"layer":"platform_service_fee","amount_minor":24900,"currency":"GBP"},{"layer":"government_fee_estimate","amount_minor":10000,"currency":"GBP"}]'::jsonb,
    date '2026-08-28'
  ),
  (
    'uae-sharjah-no-visa', 'AE', 'Sharjah eligible no-visa route', 'শারজাহ যোগ্য নো-ভিসা রুট', 'draft', false,
    'AED 9,375 estimated total', 'আনুমানিক মোট ৯,৩৭৫ দিরহাম',
    'Free-zone licence routes scoped to the intended activity.',
    'পরিকল্পিত কার্যক্রম অনুযায়ী ফ্রি-জোন লাইসেন্স রুট।',
    '[]'::jsonb,
    '[{"layer":"platform_service_fee","amount_minor":250000,"currency":"AED"},{"layer":"government_fee_estimate","amount_minor":687500,"currency":"AED"}]'::jsonb,
    date '2026-08-28'
  ),
  (
    'singapore-resident-director', 'SG', 'Pte Ltd with qualifying resident director', 'যোগ্য রেসিডেন্ট ডিরেক্টরসহ Pte Ltd', 'draft', false,
    'From S$1,500', 'S$১,৫০০ থেকে',
    'Pte Ltd formation when a qualifying Singapore resident director is available.',
    'যোগ্য সিঙ্গাপুর রেসিডেন্ট ডিরেক্টর থাকলে Pte Ltd গঠন।',
    '[]'::jsonb,
    '[{"layer":"platform_service_fee","amount_minor":150000,"currency":"SGD"},{"layer":"government_fee_estimate","amount_minor":1500,"currency":"SGD"},{"layer":"government_fee_estimate","amount_minor":30000,"currency":"SGD"}]'::jsonb,
    date '2026-08-28'
  )
on conflict (slug) do update set
  public_label_en = excluded.public_label_en,
  public_label_bn = excluded.public_label_bn,
  summary_en = excluded.summary_en,
  summary_bn = excluded.summary_bn,
  fee_components = excluded.fee_components,
  checkout_enabled = false,
  status = 'draft',
  updated_at = now();
