import { defineConfig } from 'vitest/config';

/**
 * Integration test configuration for Agentic HQ
 *
 * NOTE: Vitest 2.0+ defaults to `pool: 'forks'` which is required when using
 * node-pty to avoid V8 API locking crashes. See (in the project's private
 * archive repo — for access see the Support section of README.md):
 * https://github.com/Agentic-HQ/agentic-hq-archive-001/blob/main/docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/tests/README.regarding_PTY_Vitest_Crashing_Bug.md
 *
 * We don't need to explicitly set pool: 'forks' since it's the default,
 * but this comment documents why it matters for our node-pty integration tests.
 */
export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.integration.test.ts'],
    environment: 'node',
    globals: true,
  },
});
