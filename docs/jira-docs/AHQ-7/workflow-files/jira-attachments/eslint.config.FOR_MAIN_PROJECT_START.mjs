/**
 * ESLint v9 Flat Config for main Agentic HQ project
 *
 * MANDATORY: This file must use .mjs extension for Flat Config
 *
 * Configured with:
 * - TypeScript support via @typescript-eslint
 * - Import ordering and hygiene via eslint-plugin-import
 * - Vitest test rules via eslint-plugin-vitest
 * - Prettier conflict prevention via eslint-config-prettier
 *
 * NOTE:
 * This configuration is intentionally sequenced for early-stage,
 * learning-driven development. Some stricter soundness rules are
 * temporarily disabled (with explicit documentation) and will be
 * re-enabled once system boundaries stabilise.
 */

import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import vitest from 'eslint-plugin-vitest';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '**/*.d.ts',
      'node_modules/**',
      '**/node_modules/**',
      'scripts/**', // Scripts are not in tsconfig.json
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript-specific rules
      ...tseslint.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      /*
       * TEMPORARILY DISABLED — INTENTIONAL
       *
       * @typescript-eslint/no-floating-promises
       *
       * Async semantics (error propagation, retries, cancellation,
       * lifecycle ownership) are still being discovered empirically.
       *
       * Enforcing this rule now would force premature decisions about
       * async behaviour and error handling that are likely to be rewritten
       * or deleted as the system evolves.
       *
       * This rule MUST be re-enabled (as 'error') once:
       * - async boundaries are stable,
       * - multiple real workflows depend on them, and
       * - breaking changes become meaningfully risky.
       *
       * See Jira: https://agentic-hq.atlassian.net/browse/AHQ-5
       * "Tighten TypeScript Soundness and Operational Discipline"
       */
      // '@typescript-eslint/no-floating-promises': 'error',

      /*
       * TEMPORARILY DISABLED — INTENTIONAL
       *
       * @typescript-eslint/no-explicit-any
       *
       * During early exploration, 'any' is used as an explicit marker of
       * epistemic uncertainty ("we do not yet know the true shape of this data").
       *
       * Enforcing this rule now would force the invention of speculative
       * or fictional types, which creates false certainty rather than safety.
       *
       * This rule MUST be re-enabled (as 'error') once:
       * - public or internal APIs have stabilised,
       * - boundaries are relied upon by multiple components or users, and
       * - types represent discovered behaviour rather than guesses.
       *
       * See Jira: https://agentic-hq.atlassian.net/browse/AHQ-5
       * "Tighten TypeScript Soundness and Operational Discipline"
       */
      // '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Import ordering and hygiene
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this

      /*
       * TEMPORARILY RELAXED — INTENTIONAL
       *
       * no-console
       *
       * Console output is allowed during the Golden Path / scaffolding phase
       * to support:
       * - interactive CLI experimentation,
       * - visibility into Claude Code execution,
       * - fast empirical feedback.
       *
       * A proper logging strategy will be introduced later, at which point
       * this rule will be re-enabled as 'error'.
       *
       * See Jira: https://agentic-hq.atlassian.net/browse/AHQ-5
       * "Tighten TypeScript Soundness and Operational Discipline"
       */
      'no-console': 'warn',

      'no-debugger': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts', '**/__tests__/**/*.ts'],
    plugins: {
      vitest,
    },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'warn',
      'vitest/prefer-to-be': 'warn',

      // DISABLED: vitest/valid-expect incorrectly flags valid Vitest syntax
      // Vitest supports expect(value, message) for custom error messages, but
      // eslint-plugin-vitest incorrectly implements Jest-only rules.
      // See: https://github.com/vitest-dev/eslint-plugin-vitest/issues
      'vitest/valid-expect': 'off',

      'no-console': 'off', // Allow console output in tests
    },
  },

  // Disable Prettier conflicts (must be last)
  eslintConfigPrettier,
];
