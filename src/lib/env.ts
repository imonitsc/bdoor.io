import { z } from 'zod';

/**
 * Environment validation.
 *
 * Server variables are only ever read on the server. Client variables must be
 * referenced by their full literal name so Next.js can inline them at build time.
 *
 * Nothing in this file may print a secret value. On failure we report the *names*
 * of missing/invalid variables only.
 */

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal('').transform(() => undefined));

const providerMode = z.enum(['mock', 'live']).default('mock');

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  NEXT_PUBLIC_ANALYTICS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(10).optional(),
  PAYMENT_PROVIDER: z.enum(['mock', 'sslcommerz', 'stripe']).default('mock'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(16).optional(),
  PAYMENT_RETURN_URL: optionalUrl,
  EMAIL_PROVIDER: z.enum(['mock', 'resend', 'smtp']).default('mock'),
  EMAIL_FROM: z.string().email().optional(),
  /** Provider API key. Server-only; required for any non-mock provider. */
  EMAIL_API_KEY: z.string().min(1).optional(),
  SCREENING_PROVIDER: providerMode,
  MALWARE_SCAN_PROVIDER: providerMode,
  AI_PROVIDER: z.enum(['disabled', 'anthropic']).default('disabled'),
  AI_API_KEY: z.string().min(10).optional(),
  // Ask bdoor AI. On by default everywhere (owner release decision,
  // 30 Aug 2026): the assistant is a published feature, not a gated one.
  // ASK_BDOOR_AI_ENABLED=false remains the kill switch and always wins.
  ASK_BDOOR_AI_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  // AI Gateway credential for LOCAL DEVELOPMENT ONLY. Deployed environments
  // authenticate with Vercel OIDC, which the SDK picks up from the runtime
  // without any secret in project configuration. Setting this in production
  // would be a long-lived credential where a short-lived token already works.
  AI_GATEWAY_API_KEY: z.string().min(10).optional(),
  // Application-side spend caps. The enforced caps are the AI Gateway budgets
  // (`vercel ai-gateway budgets set ...`); these stop the app before it spends.
  AI_DAILY_BUDGET_USD: z.coerce.number().positive().default(25),
  // No counterpart in CLAUDE.md §4.1, kept because a daily cap alone lets a
  // slow leak run for a month.
  AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(400),
  // Ceiling for a single answer, so one pathological question cannot spend a
  // meaningful share of the daily cap on its own.
  AI_MAX_COST_USD_PER_ANSWER: z.coerce.number().positive().default(0.5),
  // Salt for the hashed safety identifier sent to AI Gateway.
  AI_IDENTITY_SALT: z.string().min(16).optional(),

  // --- Model routes (CLAUDE.md §4.1) -------------------------------------
  // AI Gateway slugs. Overrides exist so a model change is a configuration
  // decision with a rollback, not a deploy; the defaults live in
  // src/features/ai/config.ts beside the reasoning for each choice. Never
  // copy a slug from the specification or from memory — §4.1 requires them to
  // be discovered from the installed SDK and the live Gateway catalogue.
  AI_PRIMARY_MODEL: z.string().min(3).optional(),
  // The single automatic failover. §4.1 allows "maximum one automatic
  // answer-model failover per request", which is why this is one slug and not
  // the comma-separated chain it replaces. Ships EMPTY: a cross-provider
  // fallback is chosen by an admin from the gateway's runtime model listing
  // (/admin/ai/models), never hardcoded, because a slug written here would
  // only go stale.
  AI_SECONDARY_MODEL: z.string().min(3).optional(),
  // Classification, query rewriting and extraction. Never customer-facing.
  AI_FAST_MODEL: z.string().min(3).optional(),
  // DANGEROUS TO CHANGE, and configurable only because §4.1 requires it.
  // A different embedding model is a different vector space, so switching it
  // without reindexing does not degrade retrieval — it silently corrupts it,
  // with queries and stored documents living in different spaces. The stored
  // corpus records what produced it in `ai_knowledge_chunks.embedding_model`;
  // `embeddingCorpusMismatch` in src/features/ai/models.ts is the guard. Changing this is a migration plus a full reindex.
  AI_EMBEDDING_MODEL: z.string().min(3).optional(),
  // Voice, for the WhatsApp channel in §18. Declared here so the contract is
  // complete; nothing reads them until P0W.
  AI_TRANSCRIPTION_MODEL: z.string().min(3).optional(),
  AI_SPEECH_MODEL: z.string().min(3).optional(),
  // Roles §4.1 describes without naming a variable. The expert chain answers
  // high-risk questions; the verifier ships empty and turns on by
  // configuration once it has been evaluated, never by code default.
  AI_EXPERT_MODEL: z.string().min(3).optional(),
  AI_VERIFIER_MODEL: z.string().min(3).optional(),

  // --- Answer limits (CLAUDE.md §4.1) ------------------------------------
  // These were constants in src/features/ai/config.ts, on the reasoning that
  // "a limit that can be raised by editing a dashboard field is a limit that
  // gets raised at 2am during an incident". §4.1 requires them as
  // configuration, so they are configuration — with the constants kept as the
  // defaults, so an unset environment behaves exactly as before.
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  AI_MAX_RETRIEVAL_CHUNKS: z.coerce.number().int().positive().max(50).default(8),
  // Below this, retrieval is treated as insufficient and the answer narrows or
  // refuses rather than reaching for ungrounded model knowledge (§7.1 step 10).
  AI_MIN_GROUNDING_SCORE: z.coerce.number().min(0).max(1).default(0.35),

  // --- Controlled live-web research (CLAUDE.md §6.7) ----------------------
  // OFF by default, and off is the safe state: with this false the assistant
  // answers only from the reviewed ledger, which is what it does today.
  // Turning it on lets the assistant fetch from the open web, so it stays a
  // deliberate act.
  AI_WEB_RESEARCH_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Search tool identifiers, resolved against the live AI Gateway catalogue —
  // §6.7 requires the selection be read from current Vercel documentation and
  // owner-approved configuration, never hardcoded into the domain layer, so
  // these ship EMPTY and there is no default to go stale.
  AI_WEB_SEARCH_TOOL: z.string().min(2).optional(),
  AI_WEB_SECONDARY_SEARCH_TOOL: z.string().min(2).optional(),
  // Per-answer budgets. A research run that cannot answer within these stops
  // and says so, rather than crawling: §6.7 forbids recursive crawling and
  // §7.3 puts a latency gate on live-research answers.
  AI_WEB_MAX_SEARCHES_PER_ANSWER: z.coerce.number().int().positive().max(10).default(2),
  AI_WEB_MAX_FETCHES_PER_ANSWER: z.coerce.number().int().positive().max(20).default(4),
  AI_WEB_RESEARCH_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  // Which version of the official-domain allowlist a research run was made
  // under. Recorded on every fetch so an answer can be re-judged later against
  // the policy that actually applied when it was produced.
  AI_OFFICIAL_DOMAIN_POLICY_VERSION: z.string().min(1).default('0'),
  // Document OCR for scanned official documents. Disabled by default: the
  // ingestion pipeline records that OCR is needed rather than inventing text.
  AI_OCR_PROVIDER: z.enum(['disabled', 'external']).default('disabled'),
  // bdoor ID (BI-OS §4.2): shows the private business identifier in the
  // customer workspace. The database column exists either way; the flag gates
  // display only, for the staged rollout §17 asks for. Off by default until
  // the founder approves the surface.
  BDOOR_ID_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Passwordless authentication. When true, /login and /signup drop passwords
  // entirely and run on one-time email links.
  //
  // OFF BY DEFAULT ON PURPOSE. Passwordless makes every sign-in — customers,
  // partners and platform staff alike — depend on Supabase Auth email, which
  // is sent by Supabase's own SMTP settings and NOT by src/lib/email/. Turning
  // this on before Supabase → Authentication → SMTP Settings is configured
  // means the built-in sender's rate limits become the sign-in rate limit.
  // The variable is the rollback: flipping it back restores password sign-in
  // without a deploy.
  AUTH_PASSWORDLESS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Shared secret for scheduled jobs (Vercel cron sends it as a bearer token).
  CRON_SECRET: z.string().min(16).optional(),
  SENTRY_DSN: optionalUrl,
  RATE_LIMIT_DISABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Client env is inlined at build time, so every key must be spelled out literally.
 */
function readClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment configuration:\n${formatIssues(parsed.error)}\n` +
        'See .env.example for the required variables.',
    );
  }
  return parsed.data;
}

let cachedClientEnv: ClientEnv | undefined;
export function clientEnv(): ClientEnv {
  cachedClientEnv ??= readClientEnv();
  return cachedClientEnv;
}

/**
 * A `.env` file written from `.env.example` leaves optional variables present
 * but empty. An empty string is "not configured", not "configured as nothing",
 * so it is normalised away before validation.
 */
function withoutEmptyStrings(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    out[key] = value === '' ? undefined : value;
  }
  return out;
}

let cachedServerEnv: ServerEnv | undefined;
export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(withoutEmptyStrings(process.env));
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${formatIssues(parsed.error)}\n` +
        'See .env.example for the required variables.',
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/**
 * Production completeness check.
 *
 * This is a DEPLOYMENT concern, not a per-request one, so it runs once from
 * `instrumentation.ts` at server start. Throwing it on every request would turn
 * one missing variable into a 500 on every page, including pages that do not
 * need the variable at all — which hides the real problem behind noise.
 *
 * Returns the list of problems rather than throwing, so the caller decides
 * whether to refuse to boot or merely warn.
 */
export function productionEnvProblems(): string[] {
  if (!isProduction) return [];

  const env = serverEnv();
  const problems: string[] = [];

  // The proxy builds a Supabase client on EVERY request, so a missing public
  // variable is a total outage rather than a degraded feature. They are checked
  // here, not only in `clientEnv()`, because nothing calls `clientEnv()` at
  // boot: without these lines the server starts "healthy" and then 500s on
  // every request — the exact failure this whole check exists to prevent.
  // Read from `process.env` directly: they are inlined at build time, so a
  // blank one is a defined empty string and `||` is deliberate over `??`.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    problems.push('NEXT_PUBLIC_SUPABASE_URL — required by the proxy on every request');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()) {
    problems.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — required by the proxy on every request');
  }

  if (!env.SUPABASE_SECRET_KEY) {
    problems.push(
      'SUPABASE_SECRET_KEY — required for webhooks, invitations and the compliance schema',
    );
  }
  if (env.PAYMENT_PROVIDER !== 'mock' && !env.PAYMENT_WEBHOOK_SECRET) {
    problems.push('PAYMENT_WEBHOOK_SECRET — required when PAYMENT_PROVIDER is not "mock"');
  }
  if (env.EMAIL_PROVIDER !== 'mock' && !env.EMAIL_FROM) {
    problems.push('EMAIL_FROM — required when EMAIL_PROVIDER is not "mock"');
  }
  if (env.EMAIL_PROVIDER !== 'mock' && !env.EMAIL_API_KEY) {
    problems.push('EMAIL_API_KEY — required when EMAIL_PROVIDER is not "mock"');
  }
  if (env.AI_PROVIDER !== 'disabled' && !env.AI_API_KEY) {
    problems.push('AI_API_KEY — required when AI_PROVIDER is not "disabled"');
  }
  return problems;
}

/**
 * Production hygiene warnings.
 *
 * Everything here has a safe runtime fallback, so none of it may refuse the
 * boot — the assistant ships on by default and a missing convenience secret
 * must degrade one feature, not take the site down. `instrumentation.ts` logs
 * these on every start so the gap stays visible until the owner closes it.
 */
export function productionEnvWarnings(): string[] {
  if (!isProduction || process.env.VERCEL_ENV !== 'production') return [];

  const env = serverEnv();
  const warnings: string[] = [];

  if (env.ASK_BDOOR_AI_ENABLED) {
    if (!env.AI_IDENTITY_SALT) {
      warnings.push(
        'AI_IDENTITY_SALT — unset; safety identifiers fall back to a salt derived from SUPABASE_SECRET_KEY',
      );
    }
    if (!env.CRON_SECRET) {
      warnings.push(
        'CRON_SECRET — unset; the scheduled jobs stay locked (503): expired AI conversations are not \ndeleted and no compliance reminder is ever sent',
      );
    }
    if (env.AI_GATEWAY_API_KEY) {
      warnings.push(
        'AI_GATEWAY_API_KEY — set in production; deployed environments should rely on Vercel OIDC instead',
      );
    }
  }

  return warnings;
}

export const isProductionRuntime = isProduction;

/** True when every third-party integration is running in mock/sandbox mode. */
export function integrationModes() {
  const env = serverEnv();
  return {
    payments: env.PAYMENT_PROVIDER,
    email: env.EMAIL_PROVIDER,
    screening: env.SCREENING_PROVIDER,
    malwareScan: env.MALWARE_SCAN_PROVIDER,
    ai: env.AI_PROVIDER,
  } as const;
}
