-- Multi-model roles on the usage ledger (BI-OS §6.2: tag calls by role and
-- risk). Additive and reversible: three columns with safe defaults, no
-- backfill needed — every existing row was written by the single-model
-- pipeline, which is exactly what the defaults say.

alter table public.ai_usage
  add column if not exists model_role text not null default 'answer'
    constraint ai_usage_model_role_check
    check (model_role in ('answer', 'expert', 'verifier', 'extraction', 'embedding')),
  add column if not exists risk_class text not null default 'standard'
    constraint ai_usage_risk_class_check
    check (risk_class in ('standard', 'high')),
  add column if not exists failover_count integer not null default 0
    constraint ai_usage_failover_count_check
    check (failover_count >= 0);

comment on column public.ai_usage.model_role is
  'Which registry role served this generation (src/features/ai/models.ts).';
comment on column public.ai_usage.risk_class is
  'Deterministic risk classification of the question at answer time.';
comment on column public.ai_usage.failover_count is
  'Explicit model-chain hops before this answer; 0 means the primary served it.';
