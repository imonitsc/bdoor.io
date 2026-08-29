-- Public partner profiles are an explicit admin decision, not a side effect
-- of verification.
--
-- `verified_partners_public` used to list every verified, active partner
-- organisation. Verification is an internal control (may this firm receive
-- cases?); appearing on the public partners page is an endorsement, and the
-- two must not be the same switch. A partner may be fully verified for case
-- work and still not want, or not yet have approved, a public listing.
--
-- The column defaults to false, so flipping a partner to verified changes
-- nothing publicly until an admin also approves the public profile.

alter table public.partners
  add column public_profile_approved boolean not null default false;

comment on column public.partners.public_profile_approved is
  'Admin-controlled: the partner appears in the public directory only when '
  'this is true AND verification_status = ''verified''. Verification alone '
  'must never publish a profile.';

-- The directory view, with the tightened predicate — and a correction.
--
-- The view was created `security_invoker`, but `partners` has no anonymous
-- SELECT policy, so for the anonymous visitors the directory exists for it
-- has always returned nothing (latent until now because zero partners were
-- verified). Adding an anon policy on `partners` instead would expose every
-- column of a listed partner — contact details, notes — to direct table
-- reads, which is far more than the directory should ever show.
--
-- So the view becomes the definer-style boundary: owner rights, a fixed
-- four-column projection, a fixed predicate, no caller input anywhere. This
-- is the same narrow-exception reasoning the repository applies to
-- SECURITY DEFINER functions in the app schema — the exposure is exactly
-- the projection below, nothing else, and the underlying tables keep their
-- RLS for every other path.
drop view public.verified_partners_public;
create view public.verified_partners_public as
  select p.id, o.name, p.practice_type, p.geographic_coverage
  from public.partners p
  join public.organizations o on o.id = p.organization_id
  where p.verification_status = 'verified'
    and o.is_active
    and p.public_profile_approved;

revoke all on public.verified_partners_public from public;
grant select on public.verified_partners_public to anon, authenticated;
