-- =============================================================================
-- Production catalog expansion: countries, authorities, industries, evidence
-- claims and versioned pricing. Additive only — no existing data is modified.
-- =============================================================================

create type public.delivery_mode as enum ('online', 'hybrid', 'in_person');

create type public.evidence_status as enum ('draft', 'verified', 'expired', 'withdrawn');

create type public.evidence_source_type as enum (
  'official_website',
  'legislation',
  'owner_approved',
  'partner_verified',
  'internal_review'
);

-- ---------------------------------------------------------------------------
-- Countries (international framework)
-- ---------------------------------------------------------------------------

create table public.countries (
  code              text primary key,
  name_en           text not null,
  name_bn           text not null,
  summary_en        text,
  summary_bn        text,
  status            public.publication_status not null default 'coming_soon',
  sort_order        integer not null default 100,
  is_flagship       boolean not null default false,
  official_sources  jsonb not null default '[]'::jsonb,
  last_verified_at  date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint countries_code_upper check (code = upper(code))
);

create trigger countries_touch before update on public.countries
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Authority directory (informational profiles — not government affiliation)
-- ---------------------------------------------------------------------------

create table public.authorities (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name_en          text not null,
  name_bn          text not null,
  role_en          text not null,
  role_bn          text not null,
  website_url      text,
  summary_en       text,
  summary_bn       text,
  disclaimer_en    text,
  disclaimer_bn    text,
  status           public.publication_status not null default 'draft',
  last_verified_at date,
  sort_order       integer not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger authorities_touch before update on public.authorities
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Industries taxonomy
-- ---------------------------------------------------------------------------

create table public.industries (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name_en          text not null,
  name_bn          text not null,
  summary_en       text,
  summary_bn       text,
  body_en          text,
  body_bn          text,
  status           public.publication_status not null default 'draft',
  last_verified_at date,
  sort_order       integer not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger industries_touch before update on public.industries
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Evidence register — unverified claims must not render publicly
-- ---------------------------------------------------------------------------

create table public.evidence_claims (
  id                  text primary key,
  claim_text_en       text not null,
  claim_text_bn       text,
  source_type         public.evidence_source_type not null,
  source_url          text,
  source_published_at date,
  last_verified_at    date,
  reviewer_user_id    uuid references auth.users (id) on delete set null,
  status              public.evidence_status not null default 'draft',
  allowed_countries   text[] not null default '{}',
  allowed_services    text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger evidence_claims_touch before update on public.evidence_claims
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Service extensions and versioned pricing
-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists delivery_mode public.delivery_mode not null default 'hybrid',
  add column if not exists country_code text not null default 'BD',
  add column if not exists industry_slugs text[] not null default '{}',
  add column if not exists business_stage text[] not null default '{}';

alter table public.services
  add constraint services_country_fk
  foreign key (country_code) references public.countries (code) on delete restrict;

create table public.service_price_versions (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services (id) on delete cascade,
  effective_from   date not null,
  effective_to     date,
  starting_fee_bdt numeric(12, 2),
  approved_by      uuid references auth.users (id) on delete set null,
  approved_at      timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  constraint service_price_versions_fee_nonnegative
    check (starting_fee_bdt is null or starting_fee_bdt >= 0),
  constraint service_price_versions_range
    check (effective_to is null or effective_to >= effective_from),
  unique (service_id, effective_from)
);

create index service_price_versions_service_idx
  on public.service_price_versions (service_id, effective_from desc);

-- ---------------------------------------------------------------------------
-- Seed: countries and reference data (draft until owner verifies)
-- ---------------------------------------------------------------------------

insert into public.countries (code, name_en, name_bn, summary_en, summary_bn, status, sort_order, is_flagship) values
  ('BD', 'Bangladesh', 'বাংলাদেশ',
   'Primary market — company formation, licences, tax and compliance.',
   'প্রাথমিক বাজার — কোম্পানি গঠন, লাইসেন্স, কর ও কমপ্লায়েন্স।',
   'published', 10, true),
  ('US', 'United States', 'যুক্তরাষ্ট্র',
   'LLC and corporation routes through verified specialists. Coming soon.',
   'যাচাইকৃত বিশেষজ্ঞদের মাধ্যমে LLC ও কর্পোরেশন রুট। শীঘ্রই আসছে।',
   'coming_soon', 20, false),
  ('GB', 'United Kingdom', 'যুক্তরাজ্য',
   'Private limited company formation and filings. Coming soon.',
   'প্রাইভেট লিমিটেড কোম্পানি গঠন ও ফাইলিং। শীঘ্রই আসছে।',
   'coming_soon', 30, false),
  ('AE', 'United Arab Emirates', 'সংযুক্ত আরব আমিরাত',
   'Free-zone and mainland options through verified providers. Coming soon.',
   'যাচাইকৃত প্রদানকারীদের মাধ্যমে ফ্রি-জোন ও মেইনল্যান্ড বিকল্প। শীঘ্রই আসছে।',
   'coming_soon', 40, false),
  ('SG', 'Singapore', 'সিঙ্গাপুর',
   'Pte Ltd formation and ACRA filings. Coming soon.',
   'Pte Ltd গঠন ও ACRA ফাইলিং। শীঘ্রই আসছে।',
   'coming_soon', 50, false)
on conflict (code) do nothing;

insert into public.service_categories (slug, name_en, name_bn, summary_en, summary_bn, icon, sort_order) values
  ('corporate-maintenance', 'Corporate maintenance and changes', 'কর্পোরেট রক্ষণাবেক্ষণ ও পরিবর্তন',
   'Name clearance, director changes, share transfers and annual returns.',
   'নাম ক্লিয়ারেন্স, পরিচালক পরিবর্তন, শেয়ার হস্তান্তর ও বার্ষিক রিটার্ন।',
   'settings-2', 15),
  ('trade-procurement', 'Trade and procurement', 'বাণিজ্য ও ক্রয়',
   'Import/export readiness, Bangladesh Single Window and e-GP preparation.',
   'আমদানি/রপ্তানি প্রস্তুতি, বাংলাদেশ সিঙ্গেল উইন্ডো ও ই-জিপি প্রস্তুতি।',
   'package', 35),
  ('intellectual-property', 'Intellectual property and documents', 'মেধাস্বত্ব ও নথি',
   'Trademark coordination, notarisation, translation and attestation.',
   'ট্রেডমার্ক সমন্বয়, নোটারাইজেশন, অনুবাদ ও সত্যায়ন।',
   'shield', 55),
  ('industry-specific', 'Industry-specific services', 'শিল্প-নির্দিষ্ট সেবা',
   'Sector routes for technology, manufacturing, healthcare and more.',
   'প্রযুক্তি, উৎপাদন, স্বাস্থ্যসেবা ও আরও অনেক খাতের রুট।',
   'factory', 65)
on conflict (slug) do nothing;

insert into public.authorities (slug, name_en, name_bn, role_en, role_bn, website_url, status, sort_order, disclaimer_en, disclaimer_bn) values
  ('rjsc', 'Registrar of Joint Stock Companies and Firms (RJSC)', 'জয়েন্ট স্টক কোম্পানি ও ফার্ম রেজিস্ট্রার (আরজেএসসি)',
   'Registers companies, partnerships and societies in Bangladesh.',
   'বাংলাদেশে কোম্পানি, অংশীদারিত্ব ও সোসাইটি নিবন্ধন করে।',
   'https://www.roc.gov.bd/', 'draft', 10,
   'bdoor is not affiliated with RJSC. Government decisions remain with the authority.',
   'bdoor আরজেএসসির সাথে সংযুক্ত নয়। সরকারি সিদ্ধান্ত কর্তৃপক্ষের কাছে থাকে।'),
  ('nbr', 'National Board of Revenue (NBR)', 'জাতীয় রাজস্ব বোর্ড (এনবিআর)',
   'Tax registration, returns and VAT administration.',
   'কর নিবন্ধন, রিটার্ন ও ভ্যাট প্রশাসন।',
   'https://www.nbr.gov.bd/', 'draft', 20,
   'bdoor is not affiliated with NBR.',
   'bdoor এনবিআরের সাথে সংযুক্ত নয়।'),
  ('bida', 'Bangladesh Investment Development Authority (BIDA)', 'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (বিডা)',
   'Foreign investment registration and facilitation.',
   'বিদেশি বিনিয়োগ নিবন্ধন ও সহজীকরণ।',
   'https://bida.gov.bd/', 'draft', 30,
   'bdoor is not affiliated with BIDA.',
   'bdoor বিডার সাথে সংযুক্ত নয়।'),
  ('ccie', 'Chief Controller of Imports and Exports (CCI&E)', 'প্রধান আমদানি ও রপ্তানি নিয়ন্ত্রক (সিসিআইএন্ডই)',
   'Import and export registration (IRC/ERC).',
   'আমদানি ও রপ্তানি নিবন্ধন (IRC/ERC)।',
   'https://www.ccie.gov.bd/', 'draft', 40,
   'bdoor is not affiliated with CCI&E.',
   'bdoor সিসিআইএন্ডই-এর সাথে সংযুক্ত নয়।'),
  ('bsw', 'Bangladesh Single Window', 'বাংলাদেশ সিঙ্গেল উইন্ডো',
   'Trade facilitation portal for import/export procedures.',
   'আমদানি/রপ্তানি প্রক্রিয়ার জন্য বাণিজ্য সহজীকরণ পোর্টাল।',
   'https://bangladeshsw.gov.bd/', 'draft', 50,
   'bdoor is not affiliated with Bangladesh Single Window.',
   'bdoor বাংলাদেশ সিঙ্গেল উইন্ডোর সাথে সংযুক্ত নয়।')
on conflict (slug) do nothing;

insert into public.industries (slug, name_en, name_bn, summary_en, summary_bn, status, sort_order) values
  ('technology', 'Technology and software', 'প্রযুক্তি ও সফটওয়্যার',
   'Software, SaaS and IT services — entity and licence considerations.',
   'সফটওয়্যার, SaaS ও আইটি সেবা — সত্তা ও লাইসেন্স বিবেচনা।', 'draft', 10),
  ('ecommerce', 'E-commerce', 'ই-কমার্স',
   'Online retail and marketplace operations in Bangladesh.',
   'বাংলাদেশে অনলাইন খুচরা ও মার্কেটপ্লেস পরিচালনা।', 'draft', 20),
  ('import-export', 'Import and export', 'আমদানি ও রপ্তানি',
   'Trading companies and logistics operators.',
   'ট্রেডিং কোম্পানি ও লজিস্টিক্স অপারেটর।', 'draft', 30),
  ('manufacturing', 'Manufacturing', 'উৎপাদন',
   'Factory registration, environmental and fire clearances.',
   'কারখানা নিবন্ধন, পরিবেশ ও অগ্নি ছাড়পত্র।', 'draft', 40),
  ('garments', 'Garments and textiles', 'গার্মেন্টস ও টেক্সটাইল',
   'Export-oriented apparel and textile operations.',
   'রপ্তানিমুখী পোশাক ও টেক্সটাইল কার্যক্রম।', 'draft', 50),
  ('food-restaurant', 'Food and restaurant', 'খাদ্য ও রেস্তোরাঁ',
   'Restaurants, catering and food processing.',
   'রেস্তোরাঁ, ক্যাটারিং ও খাদ্য প্রক্রিয়াকরণ।', 'draft', 60),
  ('healthcare', 'Healthcare', 'স্বাস্থ্যসেবা',
   'Clinics, diagnostics and health-related services.',
   'ক্লিনিক, ডায়াগনস্টিক ও স্বাস্থ্য-সম্পর্কিত সেবা।', 'draft', 70),
  ('education', 'Education', 'শিক্ষা',
   'Schools, training centres and EdTech.',
   'স্কুল, প্রশিক্ষণ কেন্দ্র ও EdTech।', 'draft', 80),
  ('travel-tourism', 'Travel and tourism', 'ভ্রমণ ও পর্যটন',
   'Travel agencies and tour operators.',
   'ট্রাভেল এজেন্সি ও ট্যুর অপারেটর।', 'draft', 90),
  ('professional-services', 'Professional services', 'পেশাদার সেবা',
   'Consulting, legal coordination and advisory firms.',
   'কনসাল্টিং, আইনি সমন্বয় ও পরামর্শক প্রতিষ্ঠান।', 'draft', 100)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.countries enable row level security;
alter table public.authorities enable row level security;
alter table public.industries enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.service_price_versions enable row level security;

create policy countries_public_read on public.countries
  for select to anon, authenticated
  using (status in ('published', 'coming_soon'));
create policy countries_admin on public.countries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy authorities_public_read on public.authorities
  for select to anon, authenticated
  using (status = 'published');
create policy authorities_staff_read on public.authorities
  for select to authenticated using (app.is_platform_staff());
create policy authorities_admin on public.authorities
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy industries_public_read on public.industries
  for select to anon, authenticated
  using (status = 'published');
create policy industries_staff_read on public.industries
  for select to authenticated using (app.is_platform_staff());
create policy industries_admin on public.industries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Evidence claims: only verified claims are public; staff see all.
create policy evidence_claims_public_read on public.evidence_claims
  for select to anon, authenticated using (status = 'verified');
create policy evidence_claims_staff_read on public.evidence_claims
  for select to authenticated using (app.is_platform_staff());
create policy evidence_claims_admin on public.evidence_claims
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy service_price_versions_staff on public.service_price_versions
  for select to authenticated using (app.is_platform_staff());
create policy service_price_versions_admin on public.service_price_versions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
