-- Per-stage latency on the usage ledger (BI-OS §7.3: "Retrieval, rerank,
-- model, first-token and completion latency are separately recorded").
--
-- Until now the stage marks existed only inside one request and were flushed
-- to a single log line, so completion latency was the only number that
-- survived. That makes the first-token p75/p95 targets unmeasurable and
-- leaves a slow answer with no way to say which stage was slow.
--
-- Additive and reversible: four nullable columns, no backfill. Rows written
-- before this migration keep a null, which is honest — those requests were
-- never measured per stage. Every column is a duration in milliseconds and
-- must be non-negative; the writer sends null rather than a negative when a
-- stage boundary is missing or out of order.

alter table public.ai_usage
  add column if not exists first_token_ms integer
    constraint ai_usage_first_token_ms_check check (first_token_ms >= 0),
  add column if not exists retrieval_ms integer
    constraint ai_usage_retrieval_ms_check check (retrieval_ms >= 0),
  add column if not exists rerank_ms integer
    constraint ai_usage_rerank_ms_check check (rerank_ms >= 0),
  add column if not exists model_ms integer
    constraint ai_usage_model_ms_check check (model_ms >= 0);

comment on column public.ai_usage.first_token_ms is
  'Request start to first streamed token, ms. Null when nothing streamed.';
comment on column public.ai_usage.retrieval_ms is
  'Embedding plus keyword and vector retrieval, ms. Parallel legs count once.';
comment on column public.ai_usage.rerank_ms is
  'Fusion and reranking of the retrieved chunks, ms.';
comment on column public.ai_usage.model_ms is
  'Model call start to stream end, ms.';

-- The latency report reads complete answers for one day at a time; without
-- this the percentile query sequentially scans the whole ledger.
create index if not exists ai_usage_latency_idx
  on public.ai_usage (occurred_on, status)
  where first_token_ms is not null;
