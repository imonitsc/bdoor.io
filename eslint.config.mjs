import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * eslint-config-next v16 ships flat config directly, so there is no
 * FlatCompat/eslintrc bridge here — going through the compat layer produces a
 * circular-structure crash with this version.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      'src/types/database.ts',
      'src/content/catalog-snapshot.ts',
      'src/content/rules-snapshot.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message: 'Use the locale-aware Link from "@/i18n/navigation" instead.',
            },
          ],
        },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // These modules legitimately log and legitimately import non-localised APIs.
    files: [
      'src/i18n/**',
      'src/lib/logger.ts',
      'scripts/**',
      'tests/**',
      '*.config.*',
      'src/app/global-error.tsx',
    ],
    rules: { 'no-restricted-imports': 'off', 'no-console': 'off' },
  },
];

export default config;
