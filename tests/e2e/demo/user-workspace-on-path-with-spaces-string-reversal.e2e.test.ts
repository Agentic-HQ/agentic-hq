/**
 * E2E Test: User workspace on a PATH WITH SPACES runs its own string-reversal workflow
 *
 * The AHQ-211 D5 probe: does the whole chain survive a user workspace whose path
 * contains spaces? Spaces then reach every place a workspace-derived path travels:
 * 1. The spawned CLI's CWD (the workspace itself)
 * 2. `--plugin-dir=<workspace>/.agentic-hq/plugins/<plugin>` — emitted ONLY when the
 *    workspace has its own plugins dir, which is why the fixture plugin is copied in
 *    (a bare workspace would never put spaces into a plugin-dir flag)
 * 3. The marshalling-ID positional (double-quoted by the command builder per D5)
 * 4. The Workflow Build inside the workspace (pnpm install + framework junction/symlink
 *    + tsc), and the kill-script path in the command instructions
 *
 * Setup mirrors the cross-workspace tests (globally-linked `agentic-hq-dev`, temp
 * workspace under os.tmpdir()) plus the user-workspace test's fixture-plugin copy —
 * minus the tarball install, so this runs on Windows too. The only deliberate
 * difference from those tests is the SPACES in the workspace directory name.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-211 (design decision D5)
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const LISTING_TIMEOUT_MS = 60_000; // no Claude invocation, just CLI startup + discovery
const EXECUTION_TIMEOUT_MS = 600_000; // Claude invocation + the in-workspace Workflow Build

// Test data
const TEST_INPUT_STRING = 'path with spaces test';
const EXPECTED_REVERSED_STRING = 'tset secaps htiw htap';

// Paths — the workspace leaf deliberately contains spaces; everything else is
// identical to the cross-workspace tests
const FIXTURE_DIR = path.join(
  import.meta.dirname,
  '..',
  'fixtures',
  'string-reversal-copy-for-test'
);
const TEMP_WORKSPACES_BASE = path.join(os.tmpdir(), 'agentic-hq-test-workspaces');
const SPACED_WORKSPACE_LEAF_PREFIX = 'test ws with spaces ';

// Plugin structure constants (same fixture as the user-workspace e2e test)
const TEST_PLUGIN_NAME = 'agentic-hq-temp-e2e-test-plugin';
const WORKFLOW_NAME = 'string-reversal-copy-for-test';
const PLUGINS_SUBPATH = path.join('.agentic-hq', 'plugins');
const FIXTURE_TS_WORKFLOW_SUBPATH = path.join(
  PLUGINS_SUBPATH,
  TEST_PLUGIN_NAME,
  'skills',
  WORKFLOW_NAME,
  'ts-workflow'
);

describe('User workspace on a path with spaces runs its own string-reversal workflow', () => {
  let tempWorkspace: string;

  beforeAll(() => {
    // Precondition: `agentic-hq-dev` on PATH (contributor setup step 6, `npm link`).
    // On win32 npm link writes shims (`agentic-hq-dev.cmd` is what execSync resolves).
    const pathDirs = (process.env.PATH ?? '').split(path.delimiter);
    const agenticHqDevOnPath = pathDirs.some(
      (dir) =>
        fs.existsSync(path.join(dir, 'agentic-hq-dev')) ||
        fs.existsSync(path.join(dir, 'agentic-hq-dev.cmd'))
    );
    expect(
      agenticHqDevOnPath,
      '`agentic-hq-dev` is not on your PATH — run `npm link` from the repo root ' +
        '(docs/dev/setting-up-agentic-hq-for-development.md step 6), then re-run.'
    ).toBe(true);

    // Arrange — a unique temp workspace whose directory name CONTAINS SPACES
    tempWorkspace = path.join(
      TEMP_WORKSPACES_BASE,
      `${SPACED_WORKSPACE_LEAF_PREFIX}${randomUUID()}`
    );
    fs.mkdirSync(tempWorkspace, { recursive: true });

    // Arrange — copy the fixture plugin into the workspace's plugin dir VERBATIM, so the
    // CLI emits a `--plugin-dir=` flag whose value contains the spaces
    const targetPluginDir = path.join(tempWorkspace, PLUGINS_SUBPATH, TEST_PLUGIN_NAME);
    fs.cpSync(FIXTURE_DIR, targetPluginDir, {
      recursive: true,
      filter: (source) => !['node_modules', 'dist'].includes(path.basename(source)),
    });

    process.stdout.write(`\nTemp workspace (with spaces) created at: ${tempWorkspace}\n`);
    process.stdout.write(`Fixture plugin installed at: ${targetPluginDir}\n\n`);
  });

  it(
    'should list the workspace workflow under Local Workspace from the spaced path',
    () => {
      // Act — discovery only (no Claude): the plugin lives on the spaced path
      const output = runCliAndLogOutput(
        'agentic-hq-dev list',
        'spaced-workspace-list',
        LISTING_TIMEOUT_MS,
        tempWorkspace
      );

      // Assert — the workspace workflow and its plugin appear under Local Workspace
      expect(output).toContain(WORKFLOW_NAME);
      expect(output).toContain(TEST_PLUGIN_NAME);
      expect(output).toContain('Local Workspace');
    },
    LISTING_TIMEOUT_MS
  );

  it(
    'should execute the workspace workflow (spaced --plugin-dir, spaced CWD, spaced marshalling ID)',
    () => {
      // Act — run the workflow by its short alias from the spaced workspace
      const command = `agentic-hq-dev ${WORKFLOW_NAME} -- --string-to-reverse="${TEST_INPUT_STRING}"`;
      const output = runCliAndLogOutput(
        command,
        'spaced-workspace-execution',
        EXECUTION_TIMEOUT_MS,
        tempWorkspace
      );

      // Assert — the reversed string appears in the output
      expect(output).toContain(EXPECTED_REVERSED_STRING);

      // Assert — the Workflow Build ran INSIDE the spaced workspace
      const workspaceTsWorkflowDir = path.join(tempWorkspace, FIXTURE_TS_WORKFLOW_SUBPATH);
      expect(
        fs.existsSync(path.join(workspaceTsWorkflowDir, 'dist', `${WORKFLOW_NAME}-cli.js`))
      ).toBe(true);

      // Log — temp workspace won't be cleaned (it lives under the OS temp dir)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — it is under the OS temp dir and safe to delete any time.\n'
      );
    },
    EXECUTION_TIMEOUT_MS
  );
});
