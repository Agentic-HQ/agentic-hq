/**
 * E2E Test: User workspace workflow discovery and execution via globally-linked agentic-hq binary
 *
 * Verifies that workflows installed in a USER'S workspace (not the AHQ repo) are:
 * 1. Discovered and listed by `agentic-hq list` (dynamic discovery from user workspace)
 * 2. Executable via short alias subcommand (e.g., `agentic-hq string-reversal-copy-for-test`)
 *
 * Setup:
 * 1. Precondition: `agentic-hq` is already on PATH (installed via README `npm link`)
 * 2. Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Copy the string-reversal-copy-for-test fixture plugin into the temp workspace
 * 4. Patch the ts-workflow package.json with the real REPO_ROOT path
 *
 * The fixture plugin (agentic-hq-temp-e2e-test-plugin) is a self-contained copy of the
 * string-reversal demo, stored in tests/e2e/fixtures/ per Jira requirement to avoid
 * depending on files that may be moved/changed/removed.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-106
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

// Timeouts
const LISTING_TIMEOUT_MS = 60_000; // 60s — no Claude invocation, just CLI startup
const EXECUTION_TIMEOUT_MS = 300_000; // 300s — Claude invocation (can be very slow)

// Test data
const TEST_INPUT_STRING = 'user workspace e2e test';
const EXPECTED_REVERSED_STRING = 'tset e2e ecapskrow resu';

// Paths
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const FIXTURE_DIR = path.join(
  import.meta.dirname,
  '..',
  'fixtures',
  'string-reversal-copy-for-test'
);
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';

// Plugin structure constants
const TEST_PLUGIN_NAME = 'agentic-hq-temp-e2e-test-plugin';
const PLUGINS_SUBPATH = path.join('.agentic-hq', 'plugins');
const PACKAGE_JSON_LINK_PLACEHOLDER = 'REPO_ROOT_PLACEHOLDER';
const TS_WORKFLOW_PACKAGE_JSON_SUBPATH = path.join(
  'skills',
  'string-reversal-copy-for-test',
  'ts-workflow',
  'package.json'
);

describe('User Workspace Workflow Discovery and Execution via globally-linked agentic-hq binary', () => {
  let tempWorkspace: string;

  beforeAll(() => {
    // Precondition: the `agentic-hq` CLI must already be on PATH. Installation links it
    // there via `npm link` (README Quick Start step 5) — putting it on PATH is the
    // installer's job, not the test's, so we assert it rather than running `npm link`
    // here. A failure means the documented install step wasn't completed on this machine.
    const pathDirs = (process.env.PATH ?? '').split(path.delimiter);
    const agenticHqOnPath = pathDirs.some((dir) => fs.existsSync(path.join(dir, 'agentic-hq')));
    expect(
      agenticHqOnPath,
      '`agentic-hq` is not on your PATH. It should have been linked during ' +
        'installation — see README Quick Start step 5 (`npm link` from the repo ' +
        'root). Run that, then re-run the e2e tests; if it still fails, see ' +
        'docs/user-docs/troubleshooting-quickstart.md.'
    ).toBe(true);

    // Arrange — create a unique temp workspace
    tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
    fs.mkdirSync(tempWorkspace, { recursive: true });

    // Arrange — copy fixture plugin into the temp workspace's plugin directory
    const targetPluginDir = path.join(tempWorkspace, PLUGINS_SUBPATH, TEST_PLUGIN_NAME);
    fs.cpSync(FIXTURE_DIR, targetPluginDir, { recursive: true });

    // Arrange — patch the ts-workflow package.json with the real REPO_ROOT path
    const pkgJsonPath = path.join(targetPluginDir, TS_WORKFLOW_PACKAGE_JSON_SUBPATH);
    const pkgJsonContent = fs.readFileSync(pkgJsonPath, 'utf-8');
    fs.writeFileSync(
      pkgJsonPath,
      pkgJsonContent.replaceAll(PACKAGE_JSON_LINK_PLACEHOLDER, REPO_ROOT)
    );

    process.stdout.write(`\nTemp workspace created at: ${tempWorkspace}\n`);
    process.stdout.write(`Fixture plugin installed at: ${targetPluginDir}\n\n`);
  });

  it(
    'should list user workspace workflow when running agentic-hq list from that workspace',
    () => {
      // Act — run `agentic-hq list` from the temp workspace
      const output = runCliAndLogOutput(
        'agentic-hq list',
        'user-workspace-list',
        LISTING_TIMEOUT_MS,
        tempWorkspace
      );

      // Assert — the user workspace workflow appears in the listing
      expect(output).toContain('string-reversal-copy-for-test');

      // Assert — the test plugin name appears (proves per-plugin grouping)
      expect(output).toContain('agentic-hq-temp-e2e-test-plugin');

      // Assert — the Local Workspace header appears (proves two-workspace listing)
      expect(output).toContain('Local Workspace');
    },
    LISTING_TIMEOUT_MS
  );

  it(
    'should execute user workspace workflow via short alias subcommand',
    () => {
      // Act — run the workflow by its short alias from the temp workspace
      const command = `agentic-hq string-reversal-copy-for-test -- --string-to-reverse="${TEST_INPUT_STRING}"`;

      const output = runCliAndLogOutput(
        command,
        'user-workspace-execution',
        EXECUTION_TIMEOUT_MS,
        tempWorkspace
      );

      // Assert — the reversed string appears in the output
      expect(output).toContain(EXPECTED_REVERSED_STRING);
    },
    EXECUTION_TIMEOUT_MS
  );
});
