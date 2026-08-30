import { productionEnvProblems, productionEnvWarnings } from '@/lib/env';

/**
 * Runs once when the server starts.
 *
 * Environment completeness is checked here rather than per request: a missing
 * production secret should stop the deployment, not turn every page into a 500.
 * `STRICT_ENV=false` downgrades it to a warning for a preview deployment that
 * deliberately runs without production credentials.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Hygiene gaps with safe fallbacks are logged, never fatal — a missing
  // convenience secret degrades one feature, not the whole deployment.
  const warnings = productionEnvWarnings();
  if (warnings.length > 0) {
    console.warn(
      `[bdoor] Production environment warnings:\n${warnings.map((w) => `  - ${w}`).join('\n')}`,
    );
  }

  const problems = productionEnvProblems();
  if (problems.length === 0) return;

  const message = `Incomplete production environment:\n${problems.map((p) => `  - ${p}`).join('\n')}`;

  if (process.env.STRICT_ENV === 'false') {
    console.warn(`[bdoor] ${message}\n  Continuing because STRICT_ENV=false.`);
    return;
  }

  // Fail the boot loudly. A half-configured deployment that appears healthy is
  // worse than one that refuses to start.
  console.error(`[bdoor] ${message}`);
  throw new Error(message);
}
