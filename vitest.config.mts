import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Coverage is scoped to the pure-logic modules the unit suite actually targets
 * (state machine, money, intake rules, redaction, permissions). The rest of
 * `src/` is Server Actions, data access and React, which the integration and
 * Playwright suites cover instead — measuring them here would produce a number
 * that looks like coverage but tests nothing.
 *
 * Thresholds sit at the current measured floor so a regression fails CI. See
 * docs/BUILD_REPORT.md for the gap to the 90% target.
 */
const CRITICAL_LOGIC = [
  'src/features/cases/state-machine.ts',
  'src/features/quotes/money.ts',
  'src/features/intake/questions.ts',
  'src/features/intake/rules.ts',
  'src/features/intake/guide.ts',
  'src/lib/audit/redact.ts',
  'src/lib/permissions/roles.ts',
];

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    globals: false,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: CRITICAL_LOGIC,
      reporter: ['text-summary', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 70,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
