-- =============================================================================
-- Case state machine, enforced in the database as well as in the application.
--
-- The allowed-transition table is data, not code, so operations can widen it
-- without a migration if the process changes — but nothing can bypass it.
-- =============================================================================

create table public.case_status_transitions (
  from_status public.case_status not null,
  to_status   public.case_status not null,
  -- Which actor kinds may perform this transition.
  allowed_actors text[] not null default array['staff'],
  requires_reason boolean not null default true,
  primary key (from_status, to_status)
);

alter table public.case_status_transitions enable row level security;

create policy case_status_transitions_read on public.case_status_transitions
  for select to anon, authenticated using (true);
create policy case_status_transitions_admin on public.case_status_transitions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

insert into public.case_status_transitions (from_status, to_status, allowed_actors) values
  ('draft', 'awaiting_kyc', array['customer', 'staff']),
  ('draft', 'cancelled', array['customer', 'staff']),
  ('awaiting_kyc', 'kyc_review', array['customer', 'staff']),
  ('awaiting_kyc', 'cancelled', array['staff']),
  ('kyc_review', 'quote_ready', array['staff']),
  ('kyc_review', 'documents_required', array['staff']),
  ('kyc_review', 'rejected', array['staff']),
  ('kyc_review', 'awaiting_kyc', array['staff']),
  ('quote_ready', 'awaiting_acceptance', array['staff']),
  ('quote_ready', 'cancelled', array['staff']),
  ('awaiting_acceptance', 'awaiting_payment', array['customer', 'staff']),
  ('awaiting_acceptance', 'quote_ready', array['staff']),
  ('awaiting_acceptance', 'cancelled', array['customer', 'staff']),
  ('awaiting_payment', 'documents_required', array['staff', 'system']),
  ('awaiting_payment', 'ready_to_submit', array['staff', 'system']),
  ('awaiting_payment', 'cancelled', array['staff']),
  ('documents_required', 'partner_review', array['staff']),
  ('documents_required', 'ready_to_submit', array['staff']),
  ('documents_required', 'customer_action_required', array['staff']),
  ('documents_required', 'cancelled', array['staff']),
  ('partner_review', 'ready_to_submit', array['staff', 'partner']),
  ('partner_review', 'documents_required', array['staff', 'partner']),
  ('partner_review', 'customer_action_required', array['staff', 'partner']),
  ('ready_to_submit', 'submitted', array['staff', 'partner']),
  ('ready_to_submit', 'documents_required', array['staff']),
  ('submitted', 'authority_query', array['staff', 'partner']),
  ('submitted', 'approved', array['staff', 'partner']),
  ('submitted', 'rejected', array['staff', 'partner']),
  ('authority_query', 'customer_action_required', array['staff', 'partner']),
  ('authority_query', 'submitted', array['staff', 'partner']),
  ('authority_query', 'rejected', array['staff']),
  ('customer_action_required', 'documents_required', array['staff']),
  ('customer_action_required', 'partner_review', array['staff']),
  ('customer_action_required', 'submitted', array['staff', 'partner']),
  ('customer_action_required', 'cancelled', array['staff']),
  ('approved', 'closed', array['staff']),
  ('rejected', 'closed', array['staff']),
  ('rejected', 'documents_required', array['staff']),
  ('cancelled', 'closed', array['staff'])
on conflict do nothing;

/**
 * Reject any status change that is not in the transition table.
 * The application also checks this before it writes, so a rejection here means
 * a bug or a direct Data API call — either way it must not succeed.
 */
create or replace function app.enforce_case_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not exists (
    select 1 from public.case_status_transitions t
    where t.from_status = old.status and t.to_status = new.status
  ) then
    raise exception 'Invalid case transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  -- Keep the waiting clock honest: bank elapsed time whenever we start waiting,
  -- and clear it when we stop.
  if new.waiting_on <> 'none' and old.waiting_on = 'none' then
    new.waiting_since := now();
  elsif new.waiting_on = 'none' and old.waiting_on <> 'none' then
    new.elapsed_days_banked := old.elapsed_days_banked;
    new.waiting_since := null;
  end if;

  if new.status in ('closed', 'cancelled') and new.closed_at is null then
    new.closed_at := now();
  end if;

  return new;
end;
$$;

create trigger cases_enforce_transition
  before update on public.cases
  for each row execute function app.enforce_case_transition();
