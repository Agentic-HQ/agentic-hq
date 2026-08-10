/**
 * Integration Test: Build Determinism (AHQ-196, re-pointed at the staged
 * release tree by AHQ-197)
 *
 * The AHQ-195 parent brief mandates proving the prebuilt-package build is
 * deterministic: identical inputs with identical config and tool versions
 * must produce byte-identical output trees. Verified by running the shared
 * build script (`scripts/build-release.cjs`) twice and comparing recursive
 * SHA-256 hashes of the staged `release/` tree it assembles — which also
 * proves the generated release manifest is deterministic.
 *
 * Deliberately compares staged-tree hashes, NOT tarball hashes — tarballs
 * embed file mtimes and would differ spuriously (see the AHQ-196 feature
 * brief, "Determinism verification approach").
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-196
 * See: https://agentic-hq.atlassian.net/browse/AHQ-197
 */

import { execFileSync } from 'node:child_process';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { hashTree } from '../../helpers/file-tree-helper-functions.js';

const TEST_TIMEOUT_MS = 300_000; // two full tsc compiles of the 65-file src graph

// Key artifacts that must be present in the staged tree for the comparison
// to be meaningful: the generated manifest and every build surface (the CLI
// graph plus each migrated workflow's compiled JS)
const RELEASE_MANIFEST_RELATIVE_PATH = 'package.json';
const CLI_ENTRY_RELATIVE_PATH = 'dist/src/cli/main.js';
const MATH_WORKFLOW_JS_RELATIVE_PATH =
  'dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js';
const ADD_FEATURE_WORKFLOW_JS_RELATIVE_PATH =
  'dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.js';

describe('Build determinism (AHQ-196/AHQ-197)', () => {
  it(
    'should produce byte-identical release/ trees when the build runs twice',
    () => {
      const repoRoot = process.cwd();
      const buildScriptPath = path.join(repoRoot, 'scripts', 'build-release.cjs');
      const releaseDir = path.join(repoRoot, 'release');

      // Act — run the same build twice; the script cleans and reassembles
      // release/ in place, so hash the tree after each run
      execFileSync(process.execPath, [buildScriptPath], { cwd: repoRoot, stdio: 'inherit' });
      const hashesA = hashTree(releaseDir);
      execFileSync(process.execPath, [buildScriptPath], { cwd: repoRoot, stdio: 'inherit' });
      const hashesB = hashTree(releaseDir);

      // Assert — the generated manifest and every build surface (CLI graph +
      // the migrated workflows) were staged
      expect(Object.keys(hashesA)).toContain(RELEASE_MANIFEST_RELATIVE_PATH);
      expect(Object.keys(hashesA)).toContain(CLI_ENTRY_RELATIVE_PATH);
      expect(Object.keys(hashesA)).toContain(MATH_WORKFLOW_JS_RELATIVE_PATH);
      expect(Object.keys(hashesA)).toContain(ADD_FEATURE_WORKFLOW_JS_RELATIVE_PATH);

      // Assert — identical relative-path → hash maps: the build is deterministic
      expect(Object.keys(hashesA).length).toBeGreaterThan(0);
      expect(hashesB).toEqual(hashesA);
    },
    TEST_TIMEOUT_MS
  );
});
