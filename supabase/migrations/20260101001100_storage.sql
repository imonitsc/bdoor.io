-- =============================================================================
-- Storage buckets and object policies.
--
-- Every bucket is private. Access is decided from the object *path*, which the
-- server always generates via app.canonical_document_path():
--
--     org/<organization_id>/case/<case_id|none>/doc/<document_id>/v<n>.<ext>
--
-- The client never chooses a path, and these policies re-derive the owning
-- organization from segment 2 rather than trusting anything the uploader sent.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('identity-documents',  'identity-documents',  false, 10485760,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('case-documents',      'case-documents',      false, 26214400,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('official-records',    'official-records',    false, 26214400,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('message-attachments', 'message-attachments', false, 10485760,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('partner-credentials', 'partner-credentials', false, 10485760,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Marketing assets are the only public bucket and never hold customer data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-marketing', 'public-marketing', true, 5242880,
        array['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Path helpers
-- ---------------------------------------------------------------------------

create or replace function app.storage_path_org(v_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  parts text[] := storage.foldername(v_name);
begin
  if array_length(parts, 1) is null or array_length(parts, 1) < 2 or parts[1] <> 'org' then
    return null;
  end if;
  return parts[2]::uuid;
exception when others then
  return null;
end;
$$;

create or replace function app.storage_path_case(v_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  parts text[] := storage.foldername(v_name);
begin
  if array_length(parts, 1) is null or array_length(parts, 1) < 4 or parts[3] <> 'case' then
    return null;
  end if;
  if parts[4] = 'none' then
    return null;
  end if;
  return parts[4]::uuid;
exception when others then
  return null;
end;
$$;

grant execute on function app.storage_path_org(text) to authenticated;
grant execute on function app.storage_path_case(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Object policies
-- ---------------------------------------------------------------------------

alter table storage.objects enable row level security;

-- SELECT: customers read their own organization's objects; assigned partners
-- read a case's objects only once the customer authorised sharing; staff read
-- everything they are permitted to see on the case.
create policy bdoor_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id in ('identity-documents', 'case-documents', 'official-records', 'message-attachments')
    and (
      app.storage_path_org(name) in (select app.my_organization_ids())
      or (app.storage_path_case(name) is not null
          and app.partner_may_see_case_documents(app.storage_path_case(name)))
      or app.is_platform_staff()
    )
  );

-- INSERT: you may only write into your own organization's prefix, and only for
-- a case you actually belong to.
create policy bdoor_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('identity-documents', 'case-documents', 'official-records', 'message-attachments')
    and app.storage_path_org(name) is not null
    and (
      (app.storage_path_org(name) in (select app.my_organization_ids())
       and (app.storage_path_case(name) is null or app.is_case_customer(app.storage_path_case(name))))
      or (app.storage_path_case(name) is not null and app.is_case_partner(app.storage_path_case(name)))
      or app.is_platform_staff()
    )
  );

-- UPDATE is required alongside INSERT + SELECT for Storage upsert to work.
-- Versions are written to new paths, so this exists only to let the same
-- principal re-write an object it just created (retry after a failed upload).
create policy bdoor_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('identity-documents', 'case-documents', 'official-records', 'message-attachments')
    and (owner = auth.uid() or app.is_platform_staff())
    and app.storage_path_org(name) is not null
  )
  with check (
    bucket_id in ('identity-documents', 'case-documents', 'official-records', 'message-attachments')
    and (owner = auth.uid() or app.is_platform_staff())
    and (app.storage_path_org(name) in (select app.my_organization_ids()) or app.is_platform_staff())
  );

-- DELETE: regulated records are archived, not destroyed. Only an admin may
-- remove an object, and the retention rules still apply at the application
-- layer before this is ever called.
create policy bdoor_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('identity-documents', 'case-documents', 'official-records', 'message-attachments')
    and app.is_admin()
  );

-- partner-credentials: the partner org itself plus admins. Nobody else.
create policy bdoor_partner_credentials_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-credentials'
    and (app.storage_path_org(name) in (select app.my_partner_organization_ids()) or app.is_admin())
  )
  with check (
    bucket_id = 'partner-credentials'
    and (app.storage_path_org(name) in (select app.my_partner_organization_ids()) or app.is_admin())
  );

-- Marketing bucket: world-readable, admin-writable.
create policy bdoor_marketing_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-marketing');

create policy bdoor_marketing_write on storage.objects
  for all to authenticated
  using (bucket_id = 'public-marketing' and app.is_admin())
  with check (bucket_id = 'public-marketing' and app.is_admin());
