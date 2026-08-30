# Ask bdoor AI

A retrieval-grounded assistant that answers public questions about starting and
running a business, in English and Bangla, from bdoor's own approved content.

It is **off by default**. `ASK_BDOOR_AI_ENABLED=false` is the shipped state, and
nothing on the customer site changes until it is switched on.

---

## What answers a question

```
question
  → feature switch            off  → the entry and /ask do not render at all
  → rate limit (hashed IP)    over → 429, friendly copy, specialist offered
  → length                    over → 400
  → scope classifier          out  → bilingual decline, no model call, gap logged
  → budget check (ai_usage)   over → 402, friendly copy, specialist offered
  → conversation row created           ← before the model, always
  → question row written (redacted)
  → retrieval  ── embedding (gemini-embedding-001 @ 768)
              └─ ai_search_knowledge(): hybrid keyword + semantic, RRF k=60
              └─ live structured records (prices, fee split) from the catalogue
  → Claude (anthropic/claude-sonnet-5) via AI Gateway, streaming
  → answer row + usage row written (redacted, tokens, cost, latency, status)
```

Order matters. Everything cheap and refusable happens before anything is spent,
and the conversation exists before the model is called — so a timeout, a dropped
stream or a budget rejection is still recorded against something.

## Rules the code enforces, not just the prompt

| Rule                                                   | Where it lives                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Claude answers, or nobody does                         | `providerOptions.gateway.only` in `chat.ts`. A total Claude outage surfaces as an outage, never as another vendor's answer.              |
| No Claude Code / coding-agent interface                | `tests/unit/ai-boundaries.test.ts` fails the build if one appears in the dependency tree or the feature source.                          |
| Only published, in-date, public knowledge is retrieved | Repeated **inside** `ai_search_knowledge`, not only in RLS — the assistant reaches it through the service role, which bypasses policies. |
| Draft policy text is never indexed                     | `knowledge-seed.ts` excludes `src/content/legal` entirely (every document there is 0.9, awaiting counsel).                               |
| Prices come from live records, never from a chunk      | `structured.ts` reads the catalogue at answer time; `knowledge-seed.ts` drops any bullet carrying a currency figure.                     |
| Internal readiness never reaches a prompt              | `structured.ts` emits `publicStatus` only; `status`, `availability` and `feeComponents` stay out.                                        |
| A price appears only when approved, with its qualifier | `offer.priceApproved && offer.publicLabel` gate, tested structurally.                                                                    |
| Identifiers are never stored                           | `redaction.ts` runs before every write; `messageTelemetry()` is the only thing that reaches a log line.                                  |
| Prompts are never logged                               | Nothing logs message text. Telemetry is `{chars, redacted[]}`.                                                                           |
| The assistant cannot reach a customer's case           | There is no code path from `retrieval.ts` to any customer table.                                                                         |
| Draft → Published has no shortcut                      | `TRANSITIONS` in `knowledge.ts`; `draft → published` is refused.                                                                         |
| Answers are never edited                               | No function edits `ai_messages`. Corrections edit the source and re-index.                                                               |

## The knowledge workflow

```
Draft → In review → Approved → Published → Indexed
                                   ↓
                               Withdrawn  (chunks deleted immediately)
```

- **Import** (`/admin/ai`) creates drafts from reviewed site content. It never
  publishes, and never overwrites a source a human has since edited.
- **Publish** stamps `last_reviewed_at` — the date shown to customers beside
  every factual answer.
- **Index** embeds and replaces the chunks. Publishing does not index: a publish
  that silently spent money would make review feel expensive, and a re-index
  after a typo fix must not need a re-publish.
- **Published but not indexed** is called out on the admin screen. It is the one
  state that looks fine and is not — live everywhere except in retrieval.

## Data protection

|                              | Anonymous visitor        | Signed-in customer | Staff             |
| ---------------------------- | ------------------------ | ------------------ | ----------------- |
| Published public knowledge   | read                     | read               | read              |
| Draft / restricted knowledge | —                        | —                  | `content.publish` |
| Own conversation             | held in the browser only | read, delete       | `audit.read`      |
| Anyone else's conversation   | —                        | —                  | `audit.read`      |
| Usage, gaps, audit log       | —                        | —                  | staff only        |

No `anon` or `authenticated` insert policy exists on `ai_conversations`,
`ai_messages` or `ai_usage`. A browser cannot forge a transcript, a token count
or a cost line. Writes go through the service role, from server-only modules.

`ai_usage.conversation_id` is `on delete set null`, so deleting a transcript —
by request or by retention — removes what was said without erasing the record
that money was spent. The budget check keeps working.

Retention: 90 days, swept nightly by `/api/ai/retention` (Vercel cron,
`CRON_SECRET` bearer token). Customers can delete a conversation themselves from
the panel.

## Spending controls

Two layers, and the second is the one that actually holds:

1. **Application caps** — `AI_DAILY_BUDGET_USD` / `AI_MONTHLY_BUDGET_USD`,
   summed from the `ai_usage` ledger before every answer. Fails open on a
   database error: losing the ledger should not take the assistant down.
2. **AI Gateway budgets** — checked by the gateway before every request,
   rejecting with HTTP 402 `quota_for_entity_exceeded`. Set outside the repo:

   ```bash
   vercel ai-gateway budgets set project bdoor-io --limit 40 --refresh-period daily
   vercel ai-gateway budgets set team --limit 600 --refresh-period monthly
   ```

Every request is tagged `bdoor-ai`, `country:<code>`, `lang:<code>` so spend
splits by market and language in the gateway's own reports.

## Credentials

Deployed environments authenticate with **Vercel OIDC** — the SDK reads it from
the runtime, and there is no gateway secret in project settings.
`AI_GATEWAY_API_KEY` is for local development only, and setting it in production
is refused at boot.

`AI_IDENTITY_SALT` salts the safety identifier sent to the gateway. The
identifier is a hash: an account id or an IP leaving our infrastructure in
cleartext is a privacy problem the feature does not need.

## Embeddings

`google/gemini-embedding-001` at **768 dimensions**, for documents and queries
alike. It is a Matryoshka model, so 768 is a supported truncation of its native
3072 — but truncation destroys the unit norm cosine distance assumes, so
`normaliseVector()` renormalises and both paths go through it. A query embedded
differently from the corpus retrieves noise.

The embedding model never writes a word a customer reads. It decides which
approved paragraphs Claude is allowed to see.

## Testing

```bash
pnpm test:unit                     # boundaries, redaction, scope, workflow
pnpm test:integration              # RLS + the real retrieval function
pnpm test:e2e                      # the interface, and the outage path
```

The Playwright suite runs with the feature **on** and no gateway credential, so
every model call fails. That is the point: the failure path is what a customer
meets during a real outage, and it is where "no silent fallback" has to hold.

Integration tests need the local database:

```bash
scripts/local-db/apply.sh --seed   # needs postgresql-16-pgvector
```

## Before switching it on

- [ ] Migration applied; `pnpm db:types` regenerated
- [ ] Knowledge sources imported, reviewed, approved, published **and indexed**
- [ ] Admin screen shows no "published but not indexed" warning
- [ ] RLS verified against the deployed project (`tests/integration/ai-knowledge-rls.test.ts`)
- [ ] AI Gateway budgets set at the project and team level
- [ ] `AI_IDENTITY_SALT` and `CRON_SECRET` set in production
- [ ] `AI_GATEWAY_API_KEY` **not** set in production
- [ ] Preview tested end to end in both languages
- [ ] Legal sign-off on the disclosure copy and the privacy notice
