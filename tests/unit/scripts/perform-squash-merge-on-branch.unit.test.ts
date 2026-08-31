/**
 * Tests the /git:03 squash-merge operations (AHQ-212).
 *
 * The original script built shell command strings for child_process.exec,
 * which on Windows run under cmd.exe: single quotes reached gh's jq parser
 * unstripped (immediate failure), and multi-line commit bodies were cut at
 * the first newline (AHQ-211's squash commit landed on main with a one-line
 * body). Behaviour under test:
 * - Every command is issued as (file, args[]) — no shell, no quoting layer.
 * - The PR number comes from parsing gh's --json output in Node (no -q jq).
 * - The commit body reaches gh via --body-file, byte-for-byte, so newlines,
 *   quotes, backticks and $-words survive on every platform.
 * - resolveCommitBody accepts exactly one of an inline body or a body file —
 *   the file route is what /git:03 uses so no multi-line string ever crosses
 *   a process boundary as an argument.
 * - Errors propagate — a failed command aborts the flow with no fallback.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  archiveBranch,
  getPRNumber,
  performSquashMergeFlow,
  resolveCommitBody,
  squashMerge,
  switchToMain,
  type ExecFileFn,
} from '../../../src/scripts/git-scripts/branching/03-squash-merge-branch/squash-merge-operations.js';
import { tmpdirTest } from '../workflow-discovery/test-fixtures/tmpdir-fixture.js';

const BRANCH = 'bugfix/ahq-212-git-03-merge-fails-on-windows';

const MULTI_LINE_BODY = [
  'Line one of the commit body.',
  '',
  'Hostile-to-shells content: "double quotes", `backticks`, $PPID, %PATH%,',
  "single 'quotes' and a trailing backslash \\",
  '',
  'Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>',
].join('\n');

interface RecordedCall {
  file: string;
  args: string[];
}

/** Fake ExecFileFn that records every (file, args) call and answers each one
 * from the supplied responder (empty stdout by default). */
function createFakeExec(respond?: (call: RecordedCall) => string): {
  calls: RecordedCall[];
  exec: ExecFileFn;
} {
  const calls: RecordedCall[] = [];
  const exec: ExecFileFn = (file, args) => {
    const call = { file, args };
    calls.push(call);
    return Promise.resolve({ stdout: respond ? respond(call) : '', stderr: '' });
  };
  return { calls, exec };
}

function readAndCleanUpBodyFile(mergeArgs: string[]): string {
  const bodyFilePath = mergeArgs[mergeArgs.indexOf('--body-file') + 1];
  const body = fs.readFileSync(bodyFilePath, 'utf8');
  fs.rmSync(path.dirname(bodyFilePath), { recursive: true, force: true });
  return body;
}

describe('getPRNumber', () => {
  it('should look up the PR with plain args and parse the JSON in Node (no -q jq flag)', async () => {
    const { calls, exec } = createFakeExec(() => '[{"number":6}]');

    const prNumber = await getPRNumber(BRANCH, exec);

    expect(prNumber).toBe('6');
    expect(calls).toEqual([
      {
        file: 'gh',
        args: ['pr', 'list', '--head', BRANCH, '--state', 'open', '--json', 'number'],
      },
    ]);
  });

  it('should throw when no open PR exists for the branch', async () => {
    const { exec } = createFakeExec(() => '[]');

    await expect(getPRNumber(BRANCH, exec)).rejects.toThrow(
      `No open PR found for branch: ${BRANCH}`
    );
  });
});

describe('squashMerge', () => {
  it('should merge via --body-file with the multi-line body preserved byte-for-byte', async () => {
    const { calls, exec } = createFakeExec();

    await squashMerge('6', BRANCH, MULTI_LINE_BODY, exec);

    expect(calls).toHaveLength(1);
    expect(calls[0].file).toBe('gh');
    expect(calls[0].args.slice(0, 4)).toEqual(['pr', 'merge', '6', '--squash']);
    expect(calls[0].args[4]).toBe('--body-file');
    expect(readAndCleanUpBodyFile(calls[0].args)).toBe(MULTI_LINE_BODY);
  });
});

describe('archiveBranch', () => {
  it('should checkout, rename to archive/, push the archive, and delete the old remote branch — in order', async () => {
    const { calls, exec } = createFakeExec();

    await archiveBranch(BRANCH, exec);

    expect(calls).toEqual([
      { file: 'git', args: ['checkout', BRANCH] },
      { file: 'git', args: ['branch', '-m', `archive/${BRANCH}`] },
      { file: 'git', args: ['push', '-u', 'origin', `archive/${BRANCH}`] },
      { file: 'git', args: ['push', 'origin', '--delete', BRANCH] },
    ]);
  });
});

describe('switchToMain', () => {
  it('should checkout main and pull from origin', async () => {
    const { calls, exec } = createFakeExec();

    await switchToMain(exec);

    expect(calls).toEqual([
      { file: 'git', args: ['checkout', 'main'] },
      { file: 'git', args: ['pull', 'origin', 'main'] },
    ]);
  });
});

describe('performSquashMergeFlow', () => {
  it('should run lookup → merge → archive → switch-to-main using the looked-up PR number', async () => {
    const { calls, exec } = createFakeExec((call) =>
      call.args[1] === 'list' ? '[{"number":42}]' : ''
    );

    await performSquashMergeFlow({ branchName: BRANCH, commitBody: MULTI_LINE_BODY }, exec);

    expect(calls.map((call) => [call.file, call.args[0], call.args[1]])).toEqual([
      ['gh', 'pr', 'list'],
      ['gh', 'pr', 'merge'],
      ['git', 'checkout', BRANCH],
      ['git', 'branch', '-m'],
      ['git', 'push', '-u'],
      ['git', 'push', 'origin'],
      ['git', 'checkout', 'main'],
      ['git', 'pull', 'origin'],
    ]);
    expect(calls[1].args[2]).toBe('42');
    expect(readAndCleanUpBodyFile(calls[1].args)).toBe(MULTI_LINE_BODY);
  });

  it('should abort the flow and propagate the error when a command fails', async () => {
    const { calls, exec } = createFakeExec(() => {
      throw new Error('gh exploded');
    });

    await expect(
      performSquashMergeFlow({ branchName: BRANCH, commitBody: MULTI_LINE_BODY }, exec)
    ).rejects.toThrow(/gh exploded/);
    expect(calls).toHaveLength(1);
  });
});

describe('resolveCommitBody', () => {
  it('should pass an inline commit body through unchanged', () => {
    expect(resolveCommitBody({ commitBody: MULTI_LINE_BODY })).toBe(MULTI_LINE_BODY);
  });

  tmpdirTest('should read the commit body from a file byte-for-byte', ({ tmpdir }) => {
    const bodyFile = path.join(tmpdir, 'commit-body.txt');
    fs.writeFileSync(bodyFile, MULTI_LINE_BODY, 'utf8');

    expect(resolveCommitBody({ commitBodyFile: bodyFile })).toBe(MULTI_LINE_BODY);
  });

  it('should reject when both an inline body and a body file are supplied', () => {
    expect(() =>
      resolveCommitBody({ commitBody: 'inline', commitBodyFile: 'somewhere.txt' })
    ).toThrow(/exactly one of --commit-body or --commit-body-file/);
  });

  it('should reject when neither an inline body nor a body file is supplied', () => {
    expect(() => resolveCommitBody({})).toThrow(
      /exactly one of --commit-body or --commit-body-file/
    );
  });

  it('should propagate a missing body file as an error, not fall back', () => {
    expect(() => resolveCommitBody({ commitBodyFile: 'does-not-exist-anywhere.txt' })).toThrow();
  });
});

describe('perform-squash-merge-on-branch CLI', () => {
  it('should document both --commit-body and --commit-body-file in --help', () => {
    const tsxJsEntry = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const scriptPath = path.join(
      process.cwd(),
      'src',
      'scripts',
      'git-scripts',
      'branching',
      '03-squash-merge-branch',
      'perform-squash-merge-on-branch.ts'
    );

    const helpText = execFileSync(process.execPath, [tsxJsEntry, scriptPath, '--help'], {
      encoding: 'utf8',
    });

    expect(helpText).toContain('--commit-body ');
    expect(helpText).toContain('--commit-body-file ');
  });
});
