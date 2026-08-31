#!/usr/bin/env npx tsx

/**
 * CLI entry for the /git:03 squash-merge step. All logic lives in
 * squash-merge-operations.ts (unit-tested, injectable exec); this file only
 * parses arguments and reports the outcome.
 *
 * Prefer --commit-body-file over --commit-body: an inline multi-line body is
 * truncated at the first newline on Windows before this process even starts
 * (npm's exec machinery relaunches through cmd.exe — see AHQ-212).
 */
import { Command } from 'commander';

import {
  defaultExecFile,
  performSquashMergeFlow,
  resolveCommitBody,
} from './squash-merge-operations.js';

const program = new Command();

program
  .name('perform-squash-merge-on-branch')
  .description('Squash merge a feature branch PR into main, archive the branch, and return to main')
  .version('2.0.0')
  .requiredOption(
    '--branch-name <branchName>',
    'The feature branch name to merge (e.g., feature/add-hello-script)'
  )
  .option(
    '--commit-body <commitBody>',
    'Inline commit message body (POSIX only — truncated at the first newline on Windows; prefer --commit-body-file)'
  )
  .option(
    '--commit-body-file <path>',
    'Path to a file containing the commit message body (works on every platform)'
  )
  .action(async (options: { branchName: string; commitBody?: string; commitBodyFile?: string }) => {
    try {
      const commitBody = resolveCommitBody(options);

      console.log('');
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  SQUASH MERGE, ARCHIVE, AND RETURN TO MAIN                     ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('');

      const prNumber = await performSquashMergeFlow(
        { branchName: options.branchName, commitBody },
        defaultExecFile
      );

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  ✓ ALL OPERATIONS COMPLETED SUCCESSFULLY                       ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('Summary:');
      console.log(`  - PR #${prNumber} squash merged to main`);
      console.log(`  - Branch archived: ${options.branchName} → archive/${options.branchName}`);
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
  });

// Run the CLI
program.parse();
