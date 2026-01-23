#!/usr/bin/env npx tsx

import { exec } from 'child_process';
import { promisify } from 'util';

import { command, run, string, option } from 'cmd-ts';

const execAsync = promisify(exec);

/**
 * Execute a shell command and return output
 */
async function execCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Switched to branch')) {
      console.error('stderr:', stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Get PR number from branch name
 */
async function getPRNumber(branchName: string): Promise<string> {
  console.log(`Looking up PR for branch: ${branchName}`);
  console.log('');

  const command = `gh pr list --head "${branchName}" --state open --json number -q '.[0].number'`;
  console.log(`$ ${command}`);
  const result = await execCommand(command);
  const prNumber = result.trim();

  if (!prNumber) {
    throw new Error(`No open PR found for branch: ${branchName}`);
  }

  console.log(`Found PR #${prNumber}`);
  console.log('');
  return prNumber;
}

/**
 * Squash merge the PR with the given commit body
 */
async function squashMerge(
  prNumber: string,
  branchName: string,
  commitBody: string
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

  // Execute squash merge
  // Note: PR title automatically becomes commit title
  // We only need to pass the body
  const mergeCommand = `gh pr merge ${prNumber} --squash --body "${commitBody.replace(/"/g, '\\"').replace(/`/g, '\\`')}"`;

  console.log('Executing squash merge...');
  console.log(`$ gh pr merge ${prNumber} --squash --body "<commit-body>"`);
  const result = await execCommand(mergeCommand);
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
async function archiveBranch(branchName: string): Promise<void> {
  console.log('========================================');
  console.log('ARCHIVING BRANCH');
  console.log('========================================');
  console.log('');
  console.log('Note: Remote repos don\'t have native "rename" operations.');
  console.log('We will: checkout → rename local → push renamed → delete old remote');
  console.log('');

  // Step 1: Switch to the feature branch locally
  const checkoutCmd = `git checkout ${branchName}`;
  console.log('Step 1: Switch to feature branch');
  console.log(`$ ${checkoutCmd}`);
  const checkoutResult = await execCommand(checkoutCmd);
  if (checkoutResult) console.log(checkoutResult);
  console.log('✓ Switched to feature branch');
  console.log('');

  // Step 2: Rename current local branch to archive it
  const archiveName = `archive/${branchName}`;
  const renameCmd = `git branch -m ${archiveName}`;
  console.log('Step 2: Rename local branch to archive namespace');
  console.log(`$ ${renameCmd}`);
  const renameResult = await execCommand(renameCmd);
  if (renameResult) console.log(renameResult);
  console.log(`✓ Renamed local branch: ${branchName} → ${archiveName}`);
  console.log('');

  // Step 3: Push the renamed branch to remote and set upstream tracking
  const pushCmd = `git push -u origin ${archiveName}`;
  console.log('Step 3: Push archived branch to remote');
  console.log(`$ ${pushCmd}`);
  const pushResult = await execCommand(pushCmd);
  console.log(pushResult);
  console.log('✓ Pushed archived branch and set upstream tracking');
  console.log('');

  // Step 4: Delete the old branch from remote
  const deleteCmd = `git push origin --delete ${branchName}`;
  console.log('Step 4: Delete old branch from remote');
  console.log(`$ ${deleteCmd}`);
  const deleteResult = await execCommand(deleteCmd);
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
async function switchToMain(): Promise<void> {
  console.log('========================================');
  console.log('SWITCH TO MAIN BRANCH');
  console.log('========================================');
  console.log('');
  console.log('Switching back to main branch to ensure clean state for future work...');
  console.log('');

  const checkoutMainCmd = 'git checkout main';
  console.log(`$ ${checkoutMainCmd}`);
  const checkoutResult = await execCommand(checkoutMainCmd);
  if (checkoutResult) console.log(checkoutResult);
  console.log('✓ Switched to main branch');
  console.log('');

  console.log('Pulling latest changes from remote...');
  const pullCmd = 'git pull origin main';
  console.log(`$ ${pullCmd}`);
  const pullResult = await execCommand(pullCmd);
  console.log(pullResult);
  console.log('✓ Main branch updated');
  console.log('');
}

/**
 * Define the CLI command
 */
const app = command({
  name: 'perform-squash-merge-on-branch',
  description: 'Squash merge a feature branch PR into main, archive the branch, and return to main',
  version: '1.0.0',
  args: {
    branchName: option({
      type: string,
      long: 'branch-name',
      description: 'The feature branch name to merge (e.g., feature/add-hello-script)',
    }),
    commitBody: option({
      type: string,
      long: 'commit-body',
      description: 'Multi-line commit message body (use heredoc for multi-line)',
    }),
  },
  handler: async ({ branchName, commitBody }) => {
    try {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  SQUASH MERGE, ARCHIVE, AND RETURN TO MAIN                     ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('');

      // Get PR number
      const prNumber = await getPRNumber(branchName);

      // Squash merge the PR
      await squashMerge(prNumber, branchName, commitBody);

      // Archive the branch
      await archiveBranch(branchName);

      // Switch back to main
      await switchToMain();

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  ✓ ALL OPERATIONS COMPLETED SUCCESSFULLY                       ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('Summary:');
      console.log(`  - PR #${prNumber} squash merged to main`);
      console.log(`  - Branch archived: ${branchName} → archive/${branchName}`);
      console.log('  - Returned to main branch');
      console.log('');
    } catch (error: any) {
      console.error('');
      console.error('╔════════════════════════════════════════════════════════════════╗');
      console.error('║  ✗ ERROR                                                       ║');
      console.error('╚════════════════════════════════════════════════════════════════╝');
      console.error('');
      console.error(error.message);
      console.error('');
      process.exit(1);
    }
  },
});

// Run the CLI
run(app, process.argv.slice(2));
