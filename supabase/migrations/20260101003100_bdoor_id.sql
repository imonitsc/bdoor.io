-- bdoor ID (BI-OS §4.2): a stable, private platform identifier for every
-- business profile. Additive and reversible — one generator function, two
-- columns with safe defaults, a backfill that the volatile default performs
-- row by row.
--
-- What the identifier is NOT is part of the design: never a government
-- identifier, never a score, never public. `public_verification_opt_in`
-- defaults to false and nothing reads it yet — the column exists so a future
-- public verification surface is an opt-in from day one rather than a
-- retrofit. Access control is the companies table's existing RLS; the id adds
-- no new read path.

create or replace function app.generate_bdoor_id()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 12 random hex chars (48 bits): non-sequential so profiles cannot be
  -- enumerated, long enough that collision is a theoretical concern only —
  -- and the unique index below still refuses one if it ever happens.
  select 'BDR-'
    || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 6))
    || '-'
    || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 7, 6));
$$;

alter table public.companies
  add column if not exists bdoor_id text not null default app.generate_bdoor_id(),
  add column if not exists public_verification_opt_in boolean not null default false;

create unique index if not exists companies_bdoor_id_idx on public.companies (bdoor_id);

comment on column public.companies.bdoor_id is
  'Private bdoor platform identifier (BI-OS §4.2). Not a government identifier, not a rating, never public by default.';
comment on column public.companies.public_verification_opt_in is
  'Reserved for a future opt-in public verification surface; nothing exposes the profile while false (the default).';
