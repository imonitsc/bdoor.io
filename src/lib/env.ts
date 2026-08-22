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
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
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

let cachedServerEnv: ServerEnv | undefined;
export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${formatIssues(parsed.error)}\n` +
        'See .env.example for the required variables.',
    );
  }

  // Production guard rails: fail fast rather than silently running a mock in prod.
  if (isProduction) {
    const problems: string[] = [];
    if (!parsed.data.SUPABASE_SECRET_KEY) problems.push('SUPABASE_SECRET_KEY');
    if (parsed.data.PAYMENT_PROVIDER !== 'mock' && !parsed.data.PAYMENT_WEBHOOK_SECRET) {
      problems.push('PAYMENT_WEBHOOK_SECRET (required when PAYMENT_PROVIDER is live)');
    }
    if (parsed.data.EMAIL_PROVIDER !== 'mock' && !parsed.data.EMAIL_FROM) {
      problems.push('EMAIL_FROM (required when EMAIL_PROVIDER is live)');
    }
    if (parsed.data.AI_PROVIDER !== 'disabled' && !parsed.data.AI_API_KEY) {
      problems.push('AI_API_KEY (required when AI_PROVIDER is enabled)');
    }
    if (problems.length > 0) {
      throw new Error(
        `Missing production environment variables:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
      );
    }
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
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
