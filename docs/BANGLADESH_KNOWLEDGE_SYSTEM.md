# The Bangladesh Authoritative Business Knowledge System

How Ask bdoor AI knows what it knows: a continuously updated, source-cited
knowledge system built on the existing Ask bdoor AI stack (see
`docs/ASK_BDOOR_AI.md`, which this document extends). Nothing here lives in
the system prompt and nothing is fine-tuned: knowledge is data — ingested,
versioned, reviewed, published, cited and withdrawable.

---

## The pipeline

```
ai_source_registry            the institutions we watch (tier, frequency, health)
      │  scheduled check (cron → /api/ai/ingestion, CRON_SECRET)
      ▼
ai_registry_documents         one row per document VERSION
      discovered → downloaded → extracted → review_required
                                   │ human review (content.publish)
                                   ▼
                              approved → published ─→ superseded / withdrawn
                                   │
                                   ├─→ ai_knowledge_sources (the existing corpus;
                                   │   retrieval reads ONLY this, through its own
                                   │   published/effective/public filters)
                                   └─→ ai_structured_rules (drafts from the
                                       extraction model; a reviewer approves,
                                       verifies fees, publishes)
```

- **Ingestion workers** (`src/features/ai/registry/`): a robots-respecting,
  rate-limited fetcher; HTML/PDF text extraction with page boundaries
  preserved as form feeds; sha-256 dedupe; new-version detection with
  fee/deadline/form change alerts; a resumable, idempotent job queue with
  bounded backoff. Originals go to the private `ai-source-documents` bucket,
  never to git. OCR is an adapter that defaults to `disabled` — a scanned
  document is recorded as needing OCR, never guessed at.
- **Chunking** is structural: sections keep their headings, provisos and
  explanations stay with the provision they qualify, and every chunk carries
  its section reference and page range for citations
  (`registry/chunker.ts`; unit-pinned in `tests/unit/bd-knowledge-chunker.test.ts`).
- **Retrieval** stays the existing hybrid FTS + pgvector RRF function,
  extended with a small additive authority bonus (tier 1 gazette … tier 6
  secondary) that orders comparably relevant chunks and can never let an
  irrelevant gazette bury the provision that answers the question. The
  published / effective-date / public-scope filters are unchanged and still
  live inside the function body, because the assistant reads through the
  service role. The embedding model and 768-dimension space are untouched —
  changing either requires a tested migration and a full re-index, exactly as
  before.
- **The answer contract** lives in `system-prompt.ts` (PROMPT_VERSION
  2026-08-31.1): direct answer first; then, only where sources state it, who
  it applies to, steps, documents, authority, official fee, official time,
  deadline and applicable date; citations for every regulatory claim; the
  law/guidance, active/proposed, government-fee/bdoor-fee, national/local and
  information/advice distinctions; refusal with a professional-review offer
  when sources are missing, conflicting or outdated. Citations carry title,
  institution, reference number, section, page, effective date, review date
  and the official URL.
- **Admin knowledge centre** (`/admin/ai`): source registry and health,
  document pipeline with original-versus-extracted view and version chains,
  structured-rule review queue with the fee-verification gate, an honest
  coverage dashboard (it enumerates the fixed taxonomy, so gaps cannot hide
  and "complete" is not a renderable state), change alerts, failed-source
  list, upcoming review dates, and a retrieval testing console that shows the
  exact context the model would receive without calling it.

## What can and cannot happen

- Nothing ingested from the internet reaches a customer answer without a
  human publishing it. The pipeline's terminal state is `review_required`.
- A **proposed** instrument (draft amendment, budget speech) refuses
  publication until a reviewer records that it took effect.
- A structured rule with an **unverified government fee** refuses
  publication; unverified fees render as "quoted after review", never as a
  figure.
- Ingested text is data behind review, and the prompt boundary treats
  retrieved content as reference material, not instructions — both halves of
  the prompt-injection defence.
- Publication, supersession, withdrawal and fee verification are all written
  to `ai_registry_audit_log` (and publication to the platform audit log) with
  the acting reviewer's identity.

## Scheduling

One Vercel cron tick per day (`/api/ai/ingestion`, bearer `CRON_SECRET`)
schedules whatever has come due — per-source frequencies live in the registry
(gazette 24h, NBR/Bangladesh Bank 48h, fee-carrying regulators 72h, static
guidance weekly) — and runs a small bounded batch. Large work is many small
idempotent jobs with checkpoints; nothing ever ingests a whole archive in one
request. On a paid Vercel plan the cron cadence can be raised without code
changes; the per-source frequencies already express the intent.

## Migration and rollback plan

**Migration** `20260101002800_bd_knowledge_registry.sql` is additive only:

- new enums (`ai_registry_lifecycle`, `ai_document_currency`, `ai_topic`,
  `ai_rule_status`, `ai_job_status`, `ai_job_type`, `ai_alert_type`);
- new tables (`ai_source_registry`, `ai_registry_documents`,
  `ai_structured_rules`, `ai_ingestion_jobs`, `ai_source_change_alerts`,
  `ai_registry_audit_log`), all with RLS enabled — staff-only except the
  single public face: published, in-date structured rules;
- additive columns on `ai_knowledge_sources` (authority tier, topics,
  institution, reference number, publication date, registry link) and
  `ai_knowledge_chunks` (heading, section ref, page range);
- `ai_search_knowledge` recreated with the same arguments, extra return
  columns and the authority bonus;
- the private `ai-source-documents` storage bucket.

Apply order: run the migration, regenerate `src/types/database.ts`, deploy.
The existing 27 applied migrations are untouched; no existing row is
modified.

**Rollback**: the deployed code degrades safely if the migration is absent
(admin lists render empty; retrieval falls back at runtime only if the old
function shape exists — so roll code back _before_ rolling the schema back).
To retire the feature after applying:

1. Roll back the deploy (previous build still targets the old function shape
   — recreate the previous `ai_search_knowledge` from migration 2500 if code
   rollback happens after schema rollback).
2. The new tables can be left in place (they are staff-only and inert without
   the workers) — dropping them is only needed for a full reversal:
   `drop table` the six new tables in reverse dependency order, drop the
   added columns, recreate `ai_search_knowledge` from migration 2500.
3. Stored originals in `ai-source-documents` are not customer data; delete
   the bucket only on a full reversal.

The knowledge content itself needs no rollback machinery: withdrawing a
source or rule removes it from retrieval immediately (chunks deleted), and
that is the supported "undo" for a bad publication.

## Evaluation

`tests/eval/bd-questions.json` holds 112 realistic questions across all 13
taxonomy areas in both languages, including out-of-scope declines and
prompt-injection probes. `tests/unit/bd-knowledge-eval.test.ts` pins the
set's structure and the answer contract. `scripts/ai-eval.mjs` runs the set
against a deployed environment and **fails the release** on any high-stakes
answer that is neither cited nor an honest refusal, on any uncited monetary
figure, on a followed injection, and on an out-of-scope question that was not
declined for free. It spends real model calls, so it runs against previews on
demand, not in `pnpm run verify`.

## The registration knowledge seed

`src/content/bd/registration-knowledge.ts` carries the reviewed Bangladesh
company-registration corpus: bdoor's end-to-end walkthrough (a `guide`), and
bdoor-authored summaries of the official sources (`government_reference`
entries for the Companies Act 1994, RJSC name clearance / incorporation /
fees, NBR e-TIN and VAT/BIN, city-corporation trade licences, BIDA,
Bangladesh Bank foreign exchange, CCI&E IRC/ERC, and the Gazette). Every
government reference records its authority tier, issuing institution and
official URL — that URL is the clickable citation a customer sees — and no
entry states a taka figure: fees name the authority and the published
schedule, and exact amounts live in the itemised quote.

It flows through the same governed path as everything else: **Import** on
`/admin/ai` creates the drafts, and **"Publish and index imported content"**
walks each seed draft through in-review → approved → published and indexes
it, in one audited click, with the clicking admin recorded as the reviewer
at every step. The bulk action touches only repo-reviewed seed slugs.

Retrieval note: the chunk index uses the `simple` text-search configuration
(the price of one column indexing Bangla and English), and
`websearch_to_tsquery` ANDs every literal word — so the application rewrites
questions to their meaningful terms joined with OR (`keywordQuery` in
`retrieval.ts`) before the keyword search runs. Without the rewrite, "How do
I register a company in Bangladesh?" matches nothing. The admin testing
console shows per-chunk ranks, score components and — for sources that look
relevant but can never be retrieved — the exclusion reason.

## Model routes

The BI-OS instruction (31 Aug 2026) moved the assistant from a single fixed
model to a role registry (`src/features/ai/models.ts`) — see
`docs/BIOS-BASELINE.md` for the recorded supersession. In short:

- Roles: **answer** (standard questions), **expert** (high-risk tax/VAT,
  customs, investment/FX, licensing questions), **verifier** (off until a
  chain is configured and evaluated), **extraction**, **embedding**. The
  "router" is the deterministic classifier and the "reranker" is the RRF
  fusion — code, not paid model calls.
- Each role resolves to a fallback chain of AI Gateway slugs, configured with
  `AI_ANSWER_MODEL` + `AI_ANSWER_FALLBACK_MODELS`, `AI_EXPERT_MODEL` and
  `AI_VERIFIER_MODEL` (comma-separated). Defaults stay the
  production-verified `anthropic/claude-sonnet-5`; cross-provider fallbacks
  ship empty and are configured from the live gateway model list on
  `/admin/ai/models` — never hardcoded.
- Failover walks the chain only before the first streamed word, inside the
  one request budget, with the identical prompt and citation contract on
  every model. Each slug is provider-locked to its own vendor, every hop is
  logged, and `ai_usage` records `model_role`, `risk_class` and
  `failover_count`.

## Operating notes

- Adopt a cheaper extraction slug only after it passes the extraction
  evaluation.
- This environment's egress proxy blocks `.gov.bd`; ingestion runs where the
  app runs (Vercel), on the cron. The registry ships seeded with 31 official
  institutions; documents flow from the first production ticks into the
  review queue.
- Related reading: `docs/BANGLADESH_SOURCE_POLICY.md` (what counts as an
  authority), `docs/BANGLADESH_AI_REVIEW_PLAYBOOK.md` (how a reviewer works),
  `docs/BANGLADESH_COVERAGE_REPORT.md` (current, honest coverage).
