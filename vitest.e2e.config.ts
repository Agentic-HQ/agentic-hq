import { defineConfig } from 'vitest/config';
import E2eTestSequencer from './tests/e2e/e2e-test-sequencer.js';

/**
 * E2E test configuration for Agentic HQ
 *
 * IMPORTANT: Do NOT set global testTimeout/hookTimeout here.
 * E2E tests vary widely in duration (some take seconds, others minutes).
 * Each test should specify its own timeout using the third argument to it().
 *
 * Example: it('my test', async () => { ... }, 30_000);  // 30 second timeout
 */
export default defineConfig({
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    globals: true,

    // E2E tests run sequentially to avoid conflicts
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
      sequencer: E2eTestSequencer,
    },
    // NO global timeout - each test specifies its own via it('...', async () => {}, TIMEOUT_MS)
  },
});
