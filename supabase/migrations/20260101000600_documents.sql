-- =============================================================================
-- Documents.
--
-- Storage object paths are generated server-side and recorded here. Customers
-- never choose their own path — see `app.canonical_document_path` below and the
-- storage policies in the storage migration.
-- =============================================================================

create table public.document_requests (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  requirement_code text,
  label_en      text not null,
  label_bn      text not null,
  help_en       text,
  help_bn       text,
  category      text not null default 'other',
  subject_person_id uuid references public.company_people (id) on delete set null,
  company_id    uuid references public.companies (id) on delete set null,
  status        public.document_status not null default 'requested',
  is_mandatory  boolean not null default true,
  due_on        date,
  requested_by  uuid references auth.users (id) on delete set null,
  fulfilled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint document_requests_category_values
    check (category in ('identity', 'address_proof', 'corporate', 'financial', 'photo',
                        'signature', 'authority_form', 'official_record', 'other'))
);

create index document_requests_case_idx on public.document_requests (case_id, status);
create index document_requests_open_idx on public.document_requests (due_on)
  where status in ('requested', 'replacement_requested');

create trigger document_requests_touch before update on public.document_requests
  for each row execute function app.touch_updated_at();

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  case_id         uuid references public.cases (id) on delete set null,
  request_id      uuid references public.document_requests (id) on delete set null,
  company_id      uuid references public.companies (id) on delete set null,
  person_id       uuid references public.company_people (id) on delete set null,
  bucket_id       text not null,
  title           text not null,
  category        text not null default 'other',
  visibility      public.document_visibility not null default 'customer',
  status          public.document_status not null default 'uploaded',
  current_version integer not null default 1,
  retention_category text not null default 'standard',
  retain_until    date,
  deletion_eligible_at date,
  expires_on      date,
  uploaded_by     uuid references auth.users (id) on delete set null,
  uploaded_by_org_id uuid references public.organizations (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint documents_bucket_values
    check (bucket_id in ('identity-documents', 'case-documents', 'official-records',
                         'message-attachments', 'partner-credentials')),
  constraint documents_retention_values
    check (retention_category in ('standard', 'aml_record', 'financial_record', 'transient')),
  constraint documents_category_values
    check (category in ('identity', 'address_proof', 'corporate', 'financial', 'photo',
                        'signature', 'authority_form', 'official_record', 'receipt', 'other'))
);

create index documents_case_idx on public.documents (case_id, created_at desc);
create index documents_org_idx on public.documents (organization_id, created_at desc);
create index documents_request_idx on public.documents (request_id);
create index documents_expiry_idx on public.documents (expires_on) where expires_on is not null;

create trigger documents_touch before update on public.documents
  for each row execute function app.touch_updated_at();

create table public.document_versions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents (id) on delete cascade,
  version_no    integer not null,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text not null,
  byte_size     bigint not null,
  checksum_sha256 text,
  scan_status   public.document_scan_status not null default 'pending',
  scan_provider text,
  scanned_at    timestamptz,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (document_id, version_no),
  unique (storage_path),
  constraint document_versions_size_positive check (byte_size > 0),
  -- Server-side allow-list. The application also sniffs the magic bytes; this
  -- is the second line of defence, not the first.
  constraint document_versions_mime_allowed
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp'))
);

create index document_versions_document_idx on public.document_versions (document_id, version_no desc);
create index document_versions_scan_idx on public.document_versions (scan_status)
  where scan_status in ('pending', 'infected', 'quarantined');

-- Versions are immutable except for the scan result being filled in.
create or replace function app.document_versions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Document versions are retained; archive the document instead';
  end if;
  if new.storage_path is distinct from old.storage_path
     or new.checksum_sha256 is distinct from old.checksum_sha256
     or new.byte_size is distinct from old.byte_size
     or new.document_id is distinct from old.document_id
     or new.version_no is distinct from old.version_no then
    raise exception 'Document version content fields are immutable';
  end if;
  return new;
end;
$$;

create trigger document_versions_immutable
  before update or delete on public.document_versions
  for each row execute function app.document_versions_guard();

-- Append-only access log. Every download, preview and upload lands here.
create table public.document_access_logs (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents (id) on delete cascade,
  version_id    uuid references public.document_versions (id) on delete set null,
  actor_id      uuid references auth.users (id) on delete set null,
  actor_org_id  uuid references public.organizations (id) on delete set null,
  action        text not null,
  correlation_id text,
  ip_hash       text,
  created_at    timestamptz not null default now(),
  constraint document_access_logs_action_values
    check (action in ('upload', 'preview', 'download', 'replace', 'delete', 'quarantine',
                      'share_with_partner', 'restore'))
);

create index document_access_logs_document_idx on public.document_access_logs (document_id, created_at desc);
create index document_access_logs_actor_idx on public.document_access_logs (actor_id, created_at desc);

create trigger document_access_logs_append_only
  before update or delete on public.document_access_logs
  for each row execute function app.reject_mutation();

create table public.document_retention_rules (
  id                 uuid primary key default gen_random_uuid(),
  retention_category text not null unique,
  label_en           text not null,
  label_bn           text not null,
  retain_years       integer not null,
  legal_basis        text not null,
  allows_early_deletion boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint document_retention_rules_years_positive check (retain_years >= 0)
);

create trigger document_retention_rules_touch before update on public.document_retention_rules
  for each row execute function app.touch_updated_at();

create table public.document_scan_results (
  id           uuid primary key default gen_random_uuid(),
  version_id   uuid not null references public.document_versions (id) on delete cascade,
  provider     text not null,
  status       public.document_scan_status not null,
  signature    text,
  raw_summary  text,
  scanned_at   timestamptz not null default now()
);

create index document_scan_results_version_idx on public.document_scan_results (version_id, scanned_at desc);

-- ---------------------------------------------------------------------------
-- Canonical storage path. The client never supplies a path.
-- ---------------------------------------------------------------------------
create or replace function app.canonical_document_path(
  v_org uuid,
  v_case uuid,
  v_document uuid,
  v_version integer,
  v_extension text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'org/' || v_org::text
      || '/case/' || coalesce(v_case::text, 'none')
      || '/doc/' || v_document::text
      || '/v' || v_version::text
      || case when v_extension is null or v_extension = '' then '' else '.' || lower(v_extension) end;
$$;

grant execute on function app.canonical_document_path(uuid, uuid, uuid, integer, text) to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.document_requests enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_access_logs enable row level security;
alter table public.document_retention_rules enable row level security;
alter table public.document_scan_results enable row level security;

create policy document_requests_read on public.document_requests
  for select to authenticated using (app.can_read_case(case_id));
create policy document_requests_partner_create on public.document_requests
  for insert to authenticated with check (app.is_case_partner(case_id));
create policy document_requests_staff on public.document_requests
  for all to authenticated
  using (app.is_platform_staff() and app.can_read_case(case_id))
  with check (app.has_platform_role(array['case_manager', 'compliance_officer', 'admin', 'super_admin']::public.platform_role[]));

-- Customers see their own organization's documents. Partners see a case's
-- documents only when the assignment is accepted AND the customer authorised
-- sharing, and never the internal-only ones.
create policy documents_customer_read on public.documents
  for select to authenticated
  using (visibility <> 'internal' and organization_id in (select app.my_organization_ids()));

create policy documents_partner_read on public.documents
  for select to authenticated
  using (
    case_id is not null
    and visibility = 'partner_shared'
    and app.partner_may_see_case_documents(case_id)
  );

create policy documents_staff_read on public.documents
  for select to authenticated using (app.is_platform_staff());

create policy documents_customer_insert on public.documents
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and organization_id in (select app.my_organization_ids())
    and visibility <> 'internal'
    and (case_id is null or app.is_case_customer(case_id))
  );

create policy documents_staff_write on public.documents
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'compliance_officer', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'compliance_officer', 'admin', 'super_admin']::public.platform_role[]));

create policy document_versions_read on public.document_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id
        and (
          (d.visibility <> 'internal' and d.organization_id in (select app.my_organization_ids()))
          or (d.case_id is not null and d.visibility = 'partner_shared'
              and app.partner_may_see_case_documents(d.case_id))
          or app.is_platform_staff()
        )
    )
  );

create policy document_versions_insert on public.document_versions
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id
        and (
          d.organization_id in (select app.my_organization_ids())
          or app.is_platform_staff()
          or (d.case_id is not null and app.is_case_partner(d.case_id))
        )
    )
  );

create policy document_versions_staff_update on public.document_versions
  for update to authenticated
  using (app.has_platform_role(array['compliance_officer', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['compliance_officer', 'admin', 'super_admin']::public.platform_role[]));

-- Access logs: you can see your own trail and staff can see all. Nobody edits.
create policy document_access_logs_self on public.document_access_logs
  for select to authenticated using (actor_id = auth.uid());
create policy document_access_logs_staff on public.document_access_logs
  for select to authenticated using (app.is_platform_staff());
create policy document_access_logs_insert on public.document_access_logs
  for insert to authenticated with check (actor_id = auth.uid());

create policy document_retention_rules_read on public.document_retention_rules
  for select to anon, authenticated using (true);
create policy document_retention_rules_admin on public.document_retention_rules
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy document_scan_results_staff on public.document_scan_results
  for select to authenticated using (app.is_platform_staff());
create policy document_scan_results_admin on public.document_scan_results
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
