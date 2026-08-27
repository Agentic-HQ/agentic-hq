/**
 * Tests scripts/build-release.cjs staging helpers (AHQ-211 Phase 3).
 *
 * The plugin-staging filter and the executableFiles enumeration both work in
 * RELATIVE paths, which path.relative produces with backslashes on Windows.
 * Comparing those against the POSIX-style draft-dir constants matched
 * nothing, so the skill-less draft command dirs silently shipped in a
 * Windows-built release tree; and the generated manifest's
 * publishConfig.executableFiles entries came out backslashed. Both sides
 * must be POSIX-normalized — a Windows build must stage byte-identically to
 * a Linux/macOS build (modulo exec bits).
 *
 * Test inputs are built with path.join so they are native on every OS: on
 * Windows they exercise the backslash normalization for real, on POSIX they
 * pin the already-correct behaviour.
 */
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { tmpdirTest } from '../workflow-discovery/test-fixtures/tmpdir-fixture.js';

const { shouldStagePluginPath, listStagedShellScripts } = createRequire(import.meta.url)(
  '../../../scripts/build-release.cjs'
);

describe('shouldStagePluginPath', () => {
  it('should exclude the skill-less draft command dirs and everything inside them', () => {
    expect(
      shouldStagePluginPath(
        path.join('agentic-hq-demos-plugin', 'commands', 'DRAFT-oo-refactoring-workflow')
      )
    ).toBe(false);
    expect(
      shouldStagePluginPath(
        path.join('agentic-hq-demos-plugin', 'commands', 'research-plan-implement', 'notes.md')
      )
    ).toBe(false);
  });

  it('should not exclude a sibling dir that merely shares a draft dir name prefix', () => {
    expect(
      shouldStagePluginPath(
        path.join('agentic-hq-demos-plugin', 'commands', 'research-plan-implement-v2', 'cmd.md')
      )
    ).toBe(true);
  });

  it('should exclude node_modules trees and per-workflow install files inside ts-workflow', () => {
    expect(
      shouldStagePluginPath(
        path.join('a-plugin', 'skills', 'a-skill', 'ts-workflow', 'node_modules')
      )
    ).toBe(false);
    expect(
      shouldStagePluginPath(
        path.join('a-plugin', 'skills', 'a-skill', 'ts-workflow', 'package.json')
      )
    ).toBe(false);
    expect(
      shouldStagePluginPath(
        path.join('a-plugin', 'skills', 'a-skill', 'ts-workflow', 'pnpm-lock.yaml')
      )
    ).toBe(false);
  });

  it('should stage regular plugin files, including compiled ts-workflow output', () => {
    expect(
      shouldStagePluginPath(
        path.join('agentic-hq-demos-plugin', 'skills', 'string-reversal', 'SKILL.md')
      )
    ).toBe(true);
    expect(
      shouldStagePluginPath(
        path.join('a-plugin', 'skills', 'a-skill', 'ts-workflow', 'dist', 'a-skill-cli.js')
      )
    ).toBe(true);
  });
});

describe('listStagedShellScripts', () => {
  tmpdirTest(
    'should list staged .sh files as sorted forward-slash relative paths',
    ({ tmpdir }) => {
      const scriptsDir = path.join(tmpdir, '.agentic-hq', 'plugins', 'a-plugin', 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, 'b-script.sh'), '#!/bin/sh\n');
      fs.writeFileSync(path.join(scriptsDir, 'a-script.sh'), '#!/bin/sh\n');
      fs.writeFileSync(path.join(scriptsDir, 'not-a-script.md'), 'docs\n');

      expect(listStagedShellScripts(tmpdir)).toEqual([
        '.agentic-hq/plugins/a-plugin/scripts/a-script.sh',
        '.agentic-hq/plugins/a-plugin/scripts/b-script.sh',
      ]);
    }
  );
});
