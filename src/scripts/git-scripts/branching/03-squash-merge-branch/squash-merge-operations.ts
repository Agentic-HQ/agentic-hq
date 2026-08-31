/**
 * Operations behind the /git:03 squash-merge step (AHQ-212).
 *
 * Every external command is issued as (file, args[]) through an injectable
 * ExecFileFn — never as a shell string. On Windows, shell strings run under
 * cmd.exe, which does not strip single quotes (gh's -q jq expression arrived
 * quoted and failed to parse) and treats newlines as command separators
 * (AHQ-211's multi-line commit body was cut to one line). No shell, no
 * quoting layer, no platform divergence.
 */
import { execFile } from 'child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

export type ExecFileFn = (
  file: string,
  args: string[]
) => Promise<{ stdout: string; stderr: string }>;

export const defaultExecFile: ExecFileFn = promisify(execFile);

/**
 * Execute a command with an argument array (no shell) and return trimmed stdout
 */
async function execCommand(file: string, args: string[], exec: ExecFileFn): Promise<string> {
  try {
    const { stdout, stderr } = await exec(file, args);
    if (stderr && !stderr.includes('Switched to branch')) {
      console.error('stderr:', stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${file} ${args.join(' ')}\n${error.message}`);
  }
}

/**
 * Resolve the commit body from CLI options: exactly one of an inline body or
 * a file path. The file route is what /git:03 uses — a path survives every
 * process boundary, so the multi-line body can never be truncated in transit.
 */
export function resolveCommitBody(options: {
  commitBody?: string;
  commitBodyFile?: string;
}): string {
  const { commitBody, commitBodyFile } = options;
  if ((commitBody === undefined) === (commitBodyFile === undefined)) {
    throw new Error('Provide exactly one of --commit-body or --commit-body-file');
  }
  return commitBody !== undefined ? commitBody : readFileSync(commitBodyFile!, 'utf8');
}

/**
 * Get PR number from branch name — gh emits JSON, Node parses it (gh's -q jq
 * flag is what cmd.exe's quote handling broke)
 */
export async function getPRNumber(branchName: string, exec: ExecFileFn): Promise<string> {
  console.log(`Looking up PR for branch: ${branchName}`);
  console.log('');

  const args = ['pr', 'list', '--head', branchName, '--state', 'open', '--json', 'number'];
  console.log(`$ gh ${args.join(' ')}`);
  const result = await execCommand('gh', args, exec);
  const openPRs: Array<{ number: number }> = JSON.parse(result);

  if (openPRs.length === 0) {
    throw new Error(`No open PR found for branch: ${branchName}`);
  }

  const prNumber = String(openPRs[0].number);
  console.log(`Found PR #${prNumber}`);
  console.log('');
  return prNumber;
}

/**
 * Squash merge the PR with the given commit body
 */
export async function squashMerge(
  prNumber: string,
  branchName: string,
  commitBody: string,
  exec: ExecFileFn
): Promise<void> {
  console.log('========================================');
  console.log('SQUASH MERGE');
  console.log('========================================');
  console.log(`Branch: ${branchName}`);
  console.log(`PR: #${prNumber}`);
  console.log('');

  // Show commit body that will be used
  console.log('Commit body:');
  console.log('----------------------------------------');
  console.log(commitBody);
  console.log('----------------------------------------');
  console.log('');

  // The body goes to gh via --body-file: a temp file sidesteps every
  // platform quoting/newline hazard an inline --body "…" argument has.
  // Note: PR title automatically becomes commit title.
  const bodyFile = join(mkdtempSync(join(tmpdir(), 'ahq-merge-body-')), 'commit-body.txt');
  writeFileSync(bodyFile, commitBody, 'utf8');

  console.log('Executing squash merge...');
  console.log(`$ gh pr merge ${prNumber} --squash --body-file "${bodyFile}"`);
  const result = await execCommand(
    'gh',
    ['pr', 'merge', prNumber, '--squash', '--body-file', bodyFile],
    exec
  );
  console.log(result);
  console.log('');

  console.log('✓ Squash merge completed successfully!');
  console.log('');
}

/**
 * Archive the branch after successful merge
 *
 * Git's data model doesn't support native "rename" operations on remote repos,
 * so we need to:
 * 1. Checkout the feature branch locally
 * 2. Rename the local branch
 * 3. Push the renamed branch and set upstream tracking
 * 4. Delete the old branch from remote
 */
export async function archiveBranch(branchName: string, exec: ExecFileFn): Promise<void> {
  console.log('========================================');
  console.log('ARCHIVING BRANCH');
  console.log('========================================');
  console.log('');
  console.log('Note: Remote repos don\'t have native "rename" operations.');
  console.log('We will: checkout → rename local → push renamed → delete old remote');
  console.log('');

  // Step 1: Switch to the feature branch locally
  console.log('Step 1: Switch to feature branch');
  console.log(`$ git checkout ${branchName}`);
  const checkoutResult = await execCommand('git', ['checkout', branchName], exec);
  if (checkoutResult) console.log(checkoutResult);
  console.log('✓ Switched to feature branch');
  console.log('');

  // Step 2: Rename current local branch to archive it
  const archiveName = `archive/${branchName}`;
  console.log('Step 2: Rename local branch to archive namespace');
  console.log(`$ git branch -m ${archiveName}`);
  const renameResult = await execCommand('git', ['branch', '-m', archiveName], exec);
  if (renameResult) console.log(renameResult);
  console.log(`✓ Renamed local branch: ${branchName} → ${archiveName}`);
  console.log('');

  // Step 3: Push the renamed branch to remote and set upstream tracking
  console.log('Step 3: Push archived branch to remote');
  console.log(`$ git push -u origin ${archiveName}`);
  const pushResult = await execCommand('git', ['push', '-u', 'origin', archiveName], exec);
  console.log(pushResult);
  console.log('✓ Pushed archived branch and set upstream tracking');
  console.log('');

  // Step 4: Delete the old branch from remote
  console.log('Step 4: Delete old branch from remote');
  console.log(`$ git push origin --delete ${branchName}`);
  const deleteResult = await execCommand('git', ['push', 'origin', '--delete', branchName], exec);
  console.log(deleteResult);
  console.log(`✓ Deleted old remote branch: ${branchName}`);
  console.log('');

  console.log('✓ Branch archiving completed successfully!');
  console.log(`  Local: ${archiveName}`);
  console.log(`  Remote: origin/${archiveName}`);
  console.log('');
}

/**
 * Switch back to main branch
 *
 * After archiving the feature branch, we need to return to main branch
 * to ensure we're in a clean state for future work.
 */
export async function switchToMain(exec: ExecFileFn): Promise<void> {
  console.log('========================================');
  console.log('SWITCH TO MAIN BRANCH');
  console.log('========================================');
  console.log('');
  console.log('Switching back to main branch to ensure clean state for future work...');
  console.log('');

  console.log('$ git checkout main');
  const checkoutResult = await execCommand('git', ['checkout', 'main'], exec);
  if (checkoutResult) console.log(checkoutResult);
  console.log('✓ Switched to main branch');
  console.log('');

  console.log('Pulling latest changes from remote...');
  console.log('$ git pull origin main');
  const pullResult = await execCommand('git', ['pull', 'origin', 'main'], exec);
  console.log(pullResult);
  console.log('✓ Main branch updated');
  console.log('');
}

/**
 * The full flow: look up the PR, squash merge it, archive the branch, return to main
 */
export async function performSquashMergeFlow(
  options: { branchName: string; commitBody: string },
  exec: ExecFileFn
): Promise<string> {
  const { branchName, commitBody } = options;

  const prNumber = await getPRNumber(branchName, exec);
  await squashMerge(prNumber, branchName, commitBody, exec);
  await archiveBranch(branchName, exec);
  await switchToMain(exec);

  return prNumber;
}
