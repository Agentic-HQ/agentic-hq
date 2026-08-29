/**
 * E2E Test: User workspace workflow discovery and execution against a
 * tarball-installed agentic-hq (AHQ-106, moved onto the two-builds design and
 * the tarball install by AHQ-208 — the NO-CLONE COLLABORATOR PROOF)
 *
 * Verifies that workflows in a USER'S workspace (not the AHQ repo, no repo
 * clone anywhere in the chain) are:
 * 1. Discovered and listed by the INSTALLED bin's `agentic-hq list` under
 *    "Local Workspace"
 * 2. Executable via short alias subcommand — which runs the Workflow Build
 *    (2) INSIDE the user's workspace (a user-workspace workflow is always
 *    build-first, even though the installed wrapper is prebuilt — the
 *    per-workflow build-mode rule, AC4, end-to-end) and leaves the installed
 *    package untouched
 *
 * Setup:
 * 1. buildPackAndInstallTarball → an isolated npm install under temp/AHQ-208
 * 2. Create a temp workspace at <os.tmpdir()>/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Copy the string-reversal-copy-for-test fixture plugin into it verbatim
 *    (the fixture is fully self-contained — no placeholder patching)
 *
 * The fixture plugin (agentic-hq-temp-e2e-test-plugin) is a self-contained
 * copy of the string-reversal demo, stored in tests/e2e/fixtures/ per Jira
 * requirement to avoid depending on files that may be moved/changed/removed.
 *
 * Windows: this suite is SKIPPED — its setup packs the release tree, which
 * the prepack guard refuses on win32 (publish-from-Mac policy, AHQ-211).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-106
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

import { hashTree } from '../../helpers/file-tree-helper-functions.js';
import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';
import { buildPackAndInstallTarball } from '../helpers/tarball-install-helper-functions.js';

// Timeouts — 900s where the old 600s assumed Mac speed: Windows needs
// headroom (Defender real-time scanning slows file-heavy steps — AHQ-211)
const SETUP_TIMEOUT_MS = 900_000; // build + pack + npm install of the tarball
const LISTING_TIMEOUT_MS = 60_000; // 60s — no Claude invocation, just CLI startup
const EXECUTION_TIMEOUT_MS = 900_000; // Claude invocation + the in-workspace Workflow Build

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
// Under os.tmpdir(), never a hardcoded /tmp: /tmp does not exist on Windows,
// where the literal path silently created C:\tmp instead (AHQ-211)
const TEMP_WORKSPACES_BASE = path.join(os.tmpdir(), 'agentic-hq-test-workspaces');

// Plugin structure constants
const TEST_PLUGIN_NAME = 'agentic-hq-temp-e2e-test-plugin';
const PLUGINS_SUBPATH = path.join('.agentic-hq', 'plugins');
const FIXTURE_TS_WORKFLOW_SUBPATH = path.join(
  PLUGINS_SUBPATH,
  TEST_PLUGIN_NAME,
  'skills',
  'string-reversal-copy-for-test',
  'ts-workflow'
);

// Skipped on Windows BY POLICY, not as a gap: the setup packs the release
// tree, which the prepack guard refuses on win32 (NTFS has no exec bits —
// publish from Mac now, from CI later, never from Windows; AHQ-211). Without
// the skip this suite would build for minutes and then die at the guard.
const describeSkippedOnWindows = describe.skipIf(process.platform === 'win32');

describeSkippedOnWindows(
  'User Workspace Workflow Discovery and Execution against a tarball-installed agentic-hq',
  () => {
    let tempWorkspace: string;
    let installedPackageRoot: string;
    let installedBinPath: string;
    let installedPackageHashes: Record<string, string>;

    beforeAll(() => {
      // Arrange — a REAL npm install of the packed tarball, no repo clone in
      // the chain the workspace workflow will use
      const runDir = path.join(
        REPO_ROOT,
        'temp',
        'AHQ-208',
        `e2e-user-workspace-${Date.now()}_${randomUUID()}`
      );
      ({ installedPackageRoot, installedBinPath } = buildPackAndInstallTarball(runDir));
      installedPackageHashes = hashTree(installedPackageRoot);

      // Arrange — create a unique temp workspace
      tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
      fs.mkdirSync(tempWorkspace, { recursive: true });

      // Arrange — copy the fixture plugin into the temp workspace's plugin
      // directory VERBATIM (self-contained; no placeholder patching). Local
      // build/install output is filtered out in case the fixture was built in
      // place at some point.
      const targetPluginDir = path.join(tempWorkspace, PLUGINS_SUBPATH, TEST_PLUGIN_NAME);
      fs.cpSync(FIXTURE_DIR, targetPluginDir, {
        recursive: true,
        filter: (source) => !['node_modules', 'dist'].includes(path.basename(source)),
      });

      process.stdout.write(`\nTemp workspace created at: ${tempWorkspace}\n`);
      process.stdout.write(`Fixture plugin installed at: ${targetPluginDir}\n`);
      process.stdout.write(`Tarball install kept at: ${runDir}\n\n`);
    }, SETUP_TIMEOUT_MS);

    it(
      'should list the user workspace workflow under Local Workspace via the installed bin',
      () => {
        // Act — run the INSTALLED bin's `list` from the temp workspace
        const output = runCliAndLogOutput(
          `"${installedBinPath}" list`,
          'user-workspace-list',
          LISTING_TIMEOUT_MS,
          tempWorkspace
        );

        // Assert — the user workspace workflow appears in the listing
        expect(output).toContain('string-reversal-copy-for-test');

        // Assert — the test plugin name appears (proves per-plugin grouping)
        expect(output).toContain(TEST_PLUGIN_NAME);

        // Assert — the Local Workspace header appears (proves two-workspace listing)
        expect(output).toContain('Local Workspace');
      },
      LISTING_TIMEOUT_MS
    );

    it(
      'should execute the user workspace workflow via its short alias, building it INSIDE the workspace',
      () => {
        // Act — run the workflow by its short alias from the temp workspace
        const command = `"${installedBinPath}" string-reversal-copy-for-test -- --string-to-reverse="${TEST_INPUT_STRING}"`;

        const output = runCliAndLogOutput(
          command,
          'user-workspace-execution',
          EXECUTION_TIMEOUT_MS,
          tempWorkspace
        );

        // Assert — the reversed string appears in the output
        expect(output).toContain(EXPECTED_REVERSED_STRING);

        // Assert — the Workflow Build (2) ran IN THE WORKSPACE: compiled output
        // exists and the framework symlink points at the INSTALLED package (the
        // per-workflow build-mode rule end-to-end: a user-workspace workflow is
        // build-first although the installed wrapper is prebuilt — AC4)
        const workspaceTsWorkflowDir = path.join(tempWorkspace, FIXTURE_TS_WORKFLOW_SUBPATH);
        expect(
          fs.existsSync(
            path.join(workspaceTsWorkflowDir, 'dist', 'string-reversal-copy-for-test-cli.js')
          )
        ).toBe(true);
        const frameworkLink = path.join(workspaceTsWorkflowDir, 'node_modules', 'agentic-hq');
        expect(fs.lstatSync(frameworkLink).isSymbolicLink()).toBe(true);
        // realpath, not readlink: on Windows the link is a junction, which
        // readlinks as an NT path (`\\?\C:\...`) — AHQ-211 D3
        expect(fs.realpathSync(frameworkLink)).toBe(fs.realpathSync(installedPackageRoot));

        // Assert — the installed package stayed READ-ONLY throughout
        expect(hashTree(installedPackageRoot)).toEqual(installedPackageHashes);
      },
      EXECUTION_TIMEOUT_MS
    );
  }
);
