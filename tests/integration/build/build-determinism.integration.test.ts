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

const TEST_TIMEOUT_MS = 600_000; // two release builds: Framework Build (1) + a Workflow Build (2) per shipped migrated workflow

// Key artifacts that must be present in the staged tree for the comparison
// to be meaningful: the generated manifest and every build surface — the
// Framework Build (1) output (compiled CLI + source map + shipped .d.ts) and
// each shipped migrated workflow's Workflow Build (2) output, which since
// AHQ-208 lives INSIDE the workflow's own ts-workflow/dist/.
const RELEASE_MANIFEST_RELATIVE_PATH = 'package.json';
const CLI_ENTRY_RELATIVE_PATH = 'dist/src/cli/main.js';
const CLI_ENTRY_SOURCE_MAP_RELATIVE_PATH = 'dist/src/cli/main.js.map';
const TOOLS_DECLARATION_RELATIVE_PATH = 'dist/src/tools/marshalled-io-tools/claude-code/index.d.ts';
const MATH_WORKFLOW_JS_RELATIVE_PATH =
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/dist/math-workflow-cli.js';
const STRING_REVERSAL_WORKFLOW_JS_RELATIVE_PATH =
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/dist/string-reversal-cli.js';
const ADD_FEATURE_WORKFLOW_JS_RELATIVE_PATH =
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/dist/add-feature-cli.js';

describe('Build determinism (AHQ-196/AHQ-197/AHQ-208)', () => {
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

      // Assert — the generated manifest and every build surface (Framework
      // Build (1) output + each migrated workflow's Workflow Build (2)
      // output) were staged
      const stagedPaths = Object.keys(hashesA);
      expect(stagedPaths).toContain(RELEASE_MANIFEST_RELATIVE_PATH);
      expect(stagedPaths).toContain(CLI_ENTRY_RELATIVE_PATH);
      expect(stagedPaths).toContain(CLI_ENTRY_SOURCE_MAP_RELATIVE_PATH);
      expect(stagedPaths).toContain(TOOLS_DECLARATION_RELATIVE_PATH);
      expect(stagedPaths).toContain(MATH_WORKFLOW_JS_RELATIVE_PATH);
      expect(stagedPaths).toContain(STRING_REVERSAL_WORKFLOW_JS_RELATIVE_PATH);
      expect(stagedPaths).toContain(ADD_FEATURE_WORKFLOW_JS_RELATIVE_PATH);

      // Assert — tsc's incremental cache never ships (of no use to a consumer)
      expect(stagedPaths.filter((p) => p.endsWith('.tsbuildinfo'))).toEqual([]);

      // Assert — identical relative-path → hash maps: the build is deterministic
      expect(stagedPaths.length).toBeGreaterThan(0);
      expect(hashesB).toEqual(hashesA);
    },
    TEST_TIMEOUT_MS
  );
});
