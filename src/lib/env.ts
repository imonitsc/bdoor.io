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
  AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(400),
  // Salt for the hashed safety identifier sent to AI Gateway.
  AI_IDENTITY_SALT: z.string().min(16).optional(),
  // Model routes, as AI Gateway slugs. Overrides exist so a model change is a
  // configuration decision with a rollback, not a deploy; the defaults live in
  // src/features/ai/config.ts beside the reasoning for each choice.
  AI_ANSWER_MODEL: z.string().min(3).optional(),
  AI_EXTRACTION_MODEL: z.string().min(3).optional(),
  // Document OCR for scanned official documents. Disabled by default: the
  // ingestion pipeline records that OCR is needed rather than inventing text.
  AI_OCR_PROVIDER: z.enum(['disabled', 'external']).default('disabled'),
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
        'CRON_SECRET — unset; the AI retention sweep stays locked (503) and expired conversations are not deleted',
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
