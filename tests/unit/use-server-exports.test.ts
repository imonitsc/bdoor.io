import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * A `'use server'` module may export nothing but async functions.
 *
 * Next.js does not enforce this at build time — it throws when the module is
 * first loaded, which for a Server Action means the moment somebody submits the
 * form. `src/features/auth/actions.ts` exported a plain object
 * (`export { IDLE as initialAuthState }`) for six days: `pnpm run build`,
 * typecheck, the whole CI suite and Playwright all passed, and signing up
 * returned "Something went wrong" in production. The signup page is
 * prerendered, so a GET never loaded the module and nothing noticed.
 *
 * This is a static check because it costs nothing and catches the whole class,
 * not just the one instance.
 */
describe("'use server' modules", () => {
  const files = execFileSync(
    'grep',
    ['-rl', "^'use server'", 'src', '--include=*.ts', '--include=*.tsx'],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);

  it('exist and were found', () => {
    // Guard against the grep silently matching nothing and the suite passing
    // for the wrong reason.
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s exports only async functions', (file) => {
    const source = readFileSync(file, 'utf8');
    const offending: string[] = [];

    for (const [index, line] of source.split('\n').entries()) {
      // Type exports are erased before the runtime ever sees them.
      if (/^export\s+(type|interface)\b/.test(line)) continue;

      if (/^export\s+(const|let|var|class|enum)\b/.test(line)) {
        offending.push(`${index + 1}: ${line.trim()}`);
      }
      // A re-export list: `export { X }` or `export { X as y }`.
      if (/^export\s*\{/.test(line)) {
        offending.push(`${index + 1}: ${line.trim()}`);
      }
      // A function export that is not async.
      if (/^export\s+function\b/.test(line)) {
        offending.push(`${index + 1}: ${line.trim()}`);
      }
      if (/^export\s+default\b/.test(line)) {
        offending.push(`${index + 1}: ${line.trim()}`);
      }
    }

    expect(offending, `${file} has exports a 'use server' module may not have`).toEqual([]);
  });
});
