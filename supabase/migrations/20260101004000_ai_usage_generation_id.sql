-- The gateway generation id on the usage ledger.
--
-- `estimated_cost_usd` has been zero on every answer since the first one on
-- 30 August 2026, which matters because `checkBudget` sums that column: the
-- spend guard has been adding up zeros. The lookup that would supply the cost
-- runs the instant the stream ends and returns 404, and the bounded retry
-- added in #95 did not change that -- the answer served at 05:24 UTC on
-- 7 September logged `attempts: 3` and failed anyway.
--
-- Three 404s inside 1.2 seconds do not distinguish "the gateway settles more
-- slowly than that" from "the generation is never retrievable under this id",
-- and guessing between them is what has already cost this defect three wrong
-- turns. Storing the id is what makes the question answerable: with it, the
-- lookup can be retried minutes or hours later from the admin, and the result
-- says which of the two it is.
--
-- The column earns its place under either answer. A slow settle needs an
-- out-of-band reconcile, which needs the id. A permanently unusable id sends
-- us to a different endpoint, and the id identifies the rows to correct.
--
-- Additive and reversible: one nullable column, no backfill. Rows written
-- before this keep a null and can never be reconciled, which is honest --
-- their ids were discarded at the time.

alter table public.ai_usage
  add column if not exists generation_id text
    constraint ai_usage_generation_id_len check (char_length(generation_id) <= 200);

comment on column public.ai_usage.generation_id is
  'AI Gateway generation id, for reconciling cost after the request. Null on rows written before this column existed, and on answers where the gateway supplied no id.';

-- The reconcile reads exactly the rows that still owe a cost and can still be
-- looked up. Partial, because rows that already carry a cost are the majority
-- once this works and are never of interest to it.
create index if not exists ai_usage_cost_pending_idx
  on public.ai_usage (created_at desc)
  where generation_id is not null and estimated_cost_usd = 0;
