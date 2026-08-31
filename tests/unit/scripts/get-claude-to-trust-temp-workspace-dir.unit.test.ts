/**
 * Tests scripts/get-claude-to-trust-temp-workspace-dir.cjs — the `pnpm setup:trust-tmp-dir`
 * one-time setup helper (AHQ-213).
 *
 * E2e (and some integration) tests spawn real Claude Code sessions inside
 * `<os.tmpdir()>/agentic-hq-test-workspaces`. Claude must already trust that base
 * dir — the sessions run under a PTY where nobody can answer the trust prompt, so
 * an untrusted base makes tests hang until timeout. Behaviour under test:
 * - Resolves the SAME base the tests use, creates it, and launches claude inside
 *   it so the user can answer "Yes, I trust this folder" themselves.
 * - Explains itself BEFORE claude takes over the terminal: full base path, an
 *   OS-appropriate description of where that temp dir lives, and what to select.
 * - Propagates claude's exit status; a failed launch (e.g. claude not on PATH)
 *   throws loudly — no silent fallback.
 */
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import { tmpdirTest } from '../workflow-discovery/test-fixtures/tmpdir-fixture.js';

const { getClaudeToTrustTempWorkspaceDir } = createRequire(import.meta.url)(
  '../../../scripts/get-claude-to-trust-temp-workspace-dir.cjs'
);

/** Run the flow with stubbed terminal + claude, capturing what it printed and
 * where it launched claude. */
function runTrustFlow(options: {
  platform: string;
  tmpdir: string;
  spawnResult?: { status: number | null; error?: Error };
}): { printed: string; spawnedIn: string[]; status: number } {
  const printedChunks: string[] = [];
  const spawnedIn: string[] = [];
  const status = getClaudeToTrustTempWorkspaceDir({
    platform: options.platform,
    tmpdir: options.tmpdir,
    print: (text: string) => printedChunks.push(text),
    spawnClaudeInteractivelyIn: (workspaceDir: string) => {
      spawnedIn.push(workspaceDir);
      return options.spawnResult ?? { status: 0 };
    },
  });
  return { printed: printedChunks.join(''), spawnedIn, status };
}

describe('get-claude-to-trust-temp-workspace-dir', () => {
  tmpdirTest('should create the e2e workspace base and launch claude inside it', ({ tmpdir }) => {
    const expectedBase = path.join(tmpdir, 'agentic-hq-test-workspaces');

    const { spawnedIn, status } = runTrustFlow({ platform: 'darwin', tmpdir });

    expect(fs.statSync(expectedBase).isDirectory()).toBe(true);
    expect(spawnedIn).toEqual([expectedBase]);
    expect(status).toBe(0);
  });

  tmpdirTest('should print the full base path and trust instructions', ({ tmpdir }) => {
    const { printed } = runTrustFlow({ platform: 'darwin', tmpdir });

    expect(printed).toContain(path.join(tmpdir, 'agentic-hq-test-workspaces'));
    expect(printed).toContain('Yes, I trust this folder');
    expect(printed).toContain('/exit');
  });

  tmpdirTest(
    'should print the instructions BEFORE claude takes over the terminal',
    ({ tmpdir }) => {
      let printedByLaunchTime = '';
      const printedChunks: string[] = [];
      getClaudeToTrustTempWorkspaceDir({
        platform: 'darwin',
        tmpdir,
        print: (text: string) => printedChunks.push(text),
        spawnClaudeInteractivelyIn: () => {
          printedByLaunchTime = printedChunks.join('');
          return { status: 0 };
        },
      });

      expect(printedByLaunchTime).toContain('Yes, I trust this folder');
    }
  );

  tmpdirTest('should explain where the temp dir lives per operating system', ({ tmpdir }) => {
    expect(runTrustFlow({ platform: 'darwin', tmpdir }).printed).toContain('$TMPDIR');
    expect(runTrustFlow({ platform: 'linux', tmpdir }).printed).toContain('/tmp');
    expect(runTrustFlow({ platform: 'win32', tmpdir }).printed).toContain('%LOCALAPPDATA%\\Temp');
  });

  tmpdirTest(
    'should print how to confirm trust worked, AFTER claude hands the terminal back',
    ({ tmpdir }) => {
      const confirmCommand = 'pnpm test:e2e:cross-workspace-string-reversal';
      let printedByLaunchTime = '';
      const printedChunks: string[] = [];
      getClaudeToTrustTempWorkspaceDir({
        platform: 'darwin',
        tmpdir,
        print: (text: string) => printedChunks.push(text),
        spawnClaudeInteractivelyIn: () => {
          printedByLaunchTime = printedChunks.join('');
          return { status: 0 };
        },
      });

      // Not in the pre-launch banner (the claude TUI would wipe it off-screen)…
      expect(printedByLaunchTime).not.toContain(confirmCommand);
      // …but printed by the time the script is done.
      expect(printedChunks.join('')).toContain(confirmCommand);
    }
  );

  tmpdirTest("should propagate claude's exit status", ({ tmpdir }) => {
    const { status } = runTrustFlow({ platform: 'darwin', tmpdir, spawnResult: { status: 130 } });

    expect(status).toBe(130);
  });

  tmpdirTest('should throw loudly when claude fails to launch', ({ tmpdir }) => {
    expect(() =>
      runTrustFlow({
        platform: 'darwin',
        tmpdir,
        spawnResult: { status: null, error: new Error('spawn claude ENOENT') },
      })
    ).toThrow(/claude/i);
  });
});
