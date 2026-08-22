/**
 * E2E Test: Cross-Workspace Quick Jira Workflow via globally-linked agentic-hq-dev binary
 *
 * Verifies that the quick Jira TDD workflow works from a SEPARATE workspace:
 * 1. Precondition: `agentic-hq-dev` is already on PATH (installed via README `npm link`)
 * 2. Setup: Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Setup: Create a test Jira via MarshalledCLITool
 * 4. Run: agentic-hq-dev quick-jira -- --jira-id={testJiraId}
 * 5. Assert: Workflow output files exist (01 summaries + per-test-type RED/GREEN/REFACTOR summaries)
 * 6. Assert: Implementation files exist (src/temp-test-hello-world.ts, src/temp-test-hello-world.cli.ts)
 * 7. Assert: Jira status is Done
 *
 * This is the cross-workspace version of quick-jira-workflow-produces-expected-files.e2e.test.ts,
 * following the pattern established by cross-workspace-demo-math-workflow and cross-workspace-string-reversal.
 *
 * NOTE: The setup code in this test is intentionally duplicated across the 3 cross-workspace
 * e2e tests (string-reversal, math-workflow, quick-jira-workflow). These are demo plugin tests
 * and should remain self-contained for readability by other developers. The tests differ slightly
 * and future tests will likely differ further. See AHQ-82 REFACTOR discussion.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-82
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { RepoCheckoutClaudeCodeTool } from '../../helpers/repo-checkout-claude-code-tool.js';
import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 3_600_000; // 60 minutes: 5-command orchestration with loop + install overhead + API latency
const LOG_FILE_LABEL = 'cross-workspace-quick-jira-workflow';
const LOG_FILE_PATH = `/tmp/e2e-${LOG_FILE_LABEL}.log`;

const CREATE_TEST_JIRA_COMMAND =
  '/agentic-hq-commands:used-in-tests:jira-helper-commands:create-test-jira';
const GET_JIRA_STATUS_COMMAND =
  '/agentic-hq-commands:used-in-tests:jira-helper-commands:get-jira-status';

// Multi-step Jira description - specifies 2 test types (unit, e2e) for the multi-step workflow
const MULTI_STEP_TEST_JIRA_INPUT =
  'Title: Hello World CLI With Unit And E2E Tests  Description: Create a hello-world module and CLI. ' +
  '- Create src/temp-test-hello-world.ts exporting a function helloWorld() that returns "Hello world" ' +
  '- Create src/temp-test-hello-world.cli.ts that calls helloWorld() and prints the result ' +
  '- Test types: unit, e2e ' +
  '- Unit test: test that helloWorld() returns "Hello world" ' +
  '- E2E test: test that running temp-test-hello-world.cli.ts prints "Hello world"';

const JIRA_KEY_PATTERN = /^TEST-\d+$/;
const EXPECTED_JIRA_STATUS = 'Done';
const EXPECTED_TEST_TYPES = ['unit', 'e2e'];

// Paths
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';

/** Asserts that all expected workflow output files exist for a given project root and Jira ID. */
function assertWorkflowOutputFilesExist(projectRoot: string, testJiraId: string): void {
  const workflowDocsRoot = path.join(projectRoot, 'docs', 'jira-docs', testJiraId, 'workflow-docs');
  expect(fs.existsSync(path.join(workflowDocsRoot, '01-entire-jira-copy-of-details.md'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(workflowDocsRoot, '01-summary-of-jira.md'))).toBe(true);

  for (const testType of EXPECTED_TEST_TYPES) {
    const testTypeDir = path.join(workflowDocsRoot, `${testType}-test-files`);
    expect(fs.existsSync(path.join(testTypeDir, '02-RED-write-failing-test.summary.md'))).toBe(
      true
    );
    expect(
      fs.existsSync(path.join(testTypeDir, '03-GREEN-minimal-implementation.summary.md'))
    ).toBe(true);
    expect(fs.existsSync(path.join(testTypeDir, '04-REFACTOR.summary.md'))).toBe(true);
  }
}

describe('Cross-Workspace Quick Jira Workflow via globally-linked agentic-hq-dev binary', () => {
  it(
    'should implement a test Jira and produce expected files from a separate workspace via the globally-linked binary',
    async () => {
      // Precondition: the `agentic-hq-dev` CLI must already be on PATH. Contributor setup
      // links it there via `npm link` (setting-up-agentic-hq-for-development.md step 6) — putting it on PATH is the
      // installer's job, not the test's, so we assert it rather than running `npm link`
      // here. A failure means the documented install step wasn't completed on this machine.
      const pathDirs = (process.env.PATH ?? '').split(path.delimiter);
      const agenticHqDevOnPath = pathDirs.some((dir) =>
        fs.existsSync(path.join(dir, 'agentic-hq-dev'))
      );
      expect(
        agenticHqDevOnPath,
        '`agentic-hq-dev` is not on your PATH. It should have been linked during ' +
          'contributor setup — see docs/dev/setting-up-agentic-hq-for-development.md ' +
          'step 6 (`npm link` from the repo root). Run that, then re-run the e2e ' +
          'tests; if it still fails, see docs/user-docs/troubleshooting.md.'
      ).toBe(true);

      // Arrange — create a unique temp workspace
      const tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
      fs.mkdirSync(tempWorkspace, { recursive: true });

      // Arrange — create a test Jira in the TEST project (multi-step: 2 test types)
      const tool = new RepoCheckoutClaudeCodeTool();
      const testJiraId = await tool.execute(CREATE_TEST_JIRA_COMMAND, MULTI_STEP_TEST_JIRA_INPUT);
      expect(testJiraId).toMatch(JIRA_KEY_PATTERN);

      // Act — run agentic-hq from the temp workspace (no --project-root, workspace IS the project root)
      const command = `agentic-hq-dev quick-jira -- --jira-id=${testJiraId}`;

      let output: string;
      try {
        output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS, tempWorkspace);
      } catch (error) {
        // Check if this is a timeout error (ETIMEDOUT) — likely caused by Claude
        // waiting for permission to use a tool not in ALLOWED_TOOLS
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('ETIMEDOUT') ||
            (error.cause instanceof Error && error.cause.message.includes('ETIMEDOUT')));

        if (isTimeout) {
          process.stdout.write(
            '\n' +
              '╔═══════════════════════════════════════════════════════════════════════════╗\n' +
              '║  🔴 TEST TIMED OUT — LIKELY CAUSE: Claude is waiting for permission      ║\n' +
              '╠═══════════════════════════════════════════════════════════════════════════╣\n' +
              '║                                                                           ║\n' +
              `║  Timeout after: ${TEST_TIMEOUT_MS / 1000} seconds\n` +
              `║  Log file: ${LOG_FILE_PATH}\n` +
              '║                                                                           ║\n' +
              '║  The most likely reason is that Claude Code is waiting for permission     ║\n' +
              '║  to use a tool that is not in the ALLOWED_TOOLS list.                    ║\n' +
              '║                                                                           ║\n' +
              '║  TO FIX: Check src/tools/claude-code/claude-command-builder.ts            ║\n' +
              '║  constant to see if a required tool is missing, then re-run this test.   ║\n' +
              '║                                                                           ║\n' +
              '║  Check the log file for details:                                          ║\n' +
              `║    cat ${LOG_FILE_PATH}\n` +
              '╚═══════════════════════════════════════════════════════════════════════════╝\n' +
              '\n'
          );
        }
        throw error;
      }

      // Assert — workflow produced output (basic sanity check)
      expect(output.length).toBeGreaterThan(0);

      // Assert — workflow output files from commands 01-04
      assertWorkflowOutputFilesExist(tempWorkspace, testJiraId);

      // Assert — implementation files exist
      expect(fs.existsSync(path.join(tempWorkspace, 'src', 'temp-test-hello-world.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'src', 'temp-test-hello-world.cli.ts'))).toBe(
        true
      );

      // Assert — Jira status is Done
      const jiraStatus = await tool.execute(GET_JIRA_STATUS_COMMAND, testJiraId);
      expect(jiraStatus).toBe(EXPECTED_JIRA_STATUS);

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — /tmp is auto-cleaned by the OS (on Mac: reboot or files older than 3 days).\n'
      );
    },
    TEST_TIMEOUT_MS
  );
});
