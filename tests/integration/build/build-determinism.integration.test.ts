/**
 * Integration Test: Build Determinism (AHQ-196)
 *
 * The AHQ-195 parent brief mandates proving the prebuilt-package build is
 * deterministic: compiling identical inputs with identical config and tool
 * versions must produce byte-identical output trees. Verified by running
 * `tsc -p tsconfig.build.json` twice into two separate temp directories and
 * comparing recursive SHA-256 hashes of every emitted file.
 *
 * Deliberately compares extracted-tree hashes, NOT tarball hashes — tarballs
 * embed file mtimes and would differ spuriously (see the AHQ-196 feature
 * brief, "Determinism verification approach").
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-196
 */

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { hashTree } from '../../helpers/file-tree-helper-functions.js';

const TEST_TIMEOUT_MS = 300_000; // two full tsc compiles of the 65-file src graph

// Both build surfaces must be present in the output for the comparison to be meaningful
const CLI_ENTRY_RELATIVE_PATH = 'src/cli/main.js';
const WORKFLOW_JS_RELATIVE_PATH =
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js';

describe('Build determinism (AHQ-196)', () => {
  it(
    'should produce byte-identical output trees when the build runs twice',
    () => {
      const repoRoot = process.cwd();
      const tscBinPath = path.join(repoRoot, 'node_modules', '.bin', 'tsc');
      const tempBase = path.join(
        repoRoot,
        'temp',
        'AHQ-196',
        `build-determinism-${Date.now()}_${randomUUID()}`
      );
      const outDirA = path.join(tempBase, 'build-a');
      const outDirB = path.join(tempBase, 'build-b');

      // Act — run the same build twice into separate output directories
      for (const outDir of [outDirA, outDirB]) {
        execFileSync(tscBinPath, ['-p', 'tsconfig.build.json', '--outDir', outDir], {
          cwd: repoRoot,
          stdio: 'inherit',
        });
      }

      const hashesA = hashTree(outDirA);
      const hashesB = hashTree(outDirB);

      // Assert — both build surfaces (CLI graph + math workflow) were emitted
      expect(Object.keys(hashesA)).toContain(CLI_ENTRY_RELATIVE_PATH);
      expect(Object.keys(hashesA)).toContain(WORKFLOW_JS_RELATIVE_PATH);

      // Assert — identical relative-path → hash maps: the build is deterministic
      expect(Object.keys(hashesA).length).toBeGreaterThan(0);
      expect(hashesB).toEqual(hashesA);

      // Clean up on success only — a failing run keeps its trees for inspection
      fs.rmSync(tempBase, { recursive: true, force: true });
    },
    TEST_TIMEOUT_MS
  );
});
