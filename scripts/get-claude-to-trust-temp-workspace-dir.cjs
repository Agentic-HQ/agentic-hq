#!/usr/bin/env node
/**
 * setup:trust-tmp-dir — one-time Claude Code trust of the e2e temp workspace base (AHQ-213)
 *
 * E2e (and some integration) tests spawn real Claude Code sessions inside
 * `<os.tmpdir()>/agentic-hq-test-workspaces`. Those sessions run under a PTY
 * where nobody can answer Claude's "do you trust this folder?" prompt, so an
 * untrusted base makes the tests hang until they time out with no visible
 * error (first hit in AHQ-79; rediscovered per-OS in AHQ-211/AHQ-213).
 *
 * This script creates that base dir — resolved exactly the way the tests
 * resolve it — explains where it lives on this OS, and launches claude inside
 * it so the user can answer "Yes, I trust this folder" themselves. Trusting
 * the base covers the per-test `test-ws-<uuid>` subdirs, and trust is keyed on
 * the path in ~/.claude.json, so it survives OS temp cleanups. Once per
 * machine per user.
 *
 * A failed claude launch (not on PATH) throws loudly — no silent fallback.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// Must match the TEMP_WORKSPACES_BASE constant used by the e2e tests.
const TEMP_WORKSPACES_DIR_NAME = 'agentic-hq-test-workspaces';

const TEMP_DIR_EXPLANATIONS = {
  darwin:
    'On macOS this is $TMPDIR — your per-user temp dir. The path looks random\n' +
    'but is stable for your user on this machine, across reboots.',
  linux:
    'On Linux this is /tmp by default (or $TMPDIR if your environment sets one —\n' +
    'uncommon outside HPC/shared-hosting setups).',
  win32: 'On Windows this is %LOCALAPPDATA%\\Temp — your per-user Windows temp dir.',
};

function getClaudeToTrustTempWorkspaceDir({ platform, tmpdir, print, spawnClaudeInteractivelyIn }) {
  const workspacesBase = path.join(tmpdir, TEMP_WORKSPACES_DIR_NAME);
  fs.mkdirSync(workspacesBase, { recursive: true });
  print(buildTrustInstructions({ platform, workspacesBase }));
  const claudeResult = spawnClaudeInteractivelyIn(workspacesBase);
  if (claudeResult.error) {
    throw new Error(
      `Could not launch the claude CLI (is Claude Code installed and on your PATH?): ${claudeResult.error.message}`
    );
  }
  // After claude exits, so the claude TUI cannot wipe it off-screen.
  print(buildConfirmationInstructions());
  return claudeResult.status ?? 0;
}

function buildConfirmationInstructions() {
  return (
    '\n' +
    'To confirm the trust took, run the quickest Claude-spawning e2e test\n' +
    '(a single-step string reversal from a workspace under that dir, ~1 min):\n' +
    '\n' +
    '    pnpm test:e2e:cross-workspace-string-reversal\n' +
    '\n' +
    'If it passes, all e2e tests can now run on this machine. If it instead\n' +
    'hangs for minutes and times out, the folder is still untrusted — run\n' +
    'pnpm setup:trust-tmp-dir again and make sure to select "Yes, I trust this folder".\n' +
    '\n'
  );
}

function buildTrustInstructions({ platform, workspacesBase }) {
  return (
    '\n' +
    'One-time setup: get Claude Code to trust the test workspace base dir\n' +
    '=====================================================================\n' +
    '\n' +
    'E2e and integration tests spawn Claude Code sessions inside throwaway\n' +
    'workspaces under this dir — and hang (until timeout) if Claude does not\n' +
    'already trust it, because nobody can answer the trust prompt in a test.\n' +
    '\n' +
    `The dir (just created if it did not exist):\n` +
    `\n` +
    `    ${workspacesBase}\n` +
    `\n` +
    `${explainTempDirForPlatform(platform)}\n` +
    '\n' +
    'Claude Code will now open inside that dir. When it asks whether you\n' +
    'trust the folder:\n' +
    '\n' +
    '    1. Select "Yes, I trust this folder"\n' +
    '    2. Exit the session with /exit\n' +
    '\n' +
    'Trusting this base dir also covers the per-test subdirs the tests\n' +
    'create, and survives OS temp cleanups. Once per machine per user.\n' +
    '\n'
  );
}

function explainTempDirForPlatform(platform) {
  return TEMP_DIR_EXPLANATIONS[platform] ?? "This is your OS temp dir (node's os.tmpdir()).";
}

module.exports = { getClaudeToTrustTempWorkspaceDir };

if (require.main === module) {
  process.exitCode = getClaudeToTrustTempWorkspaceDir({
    platform: process.platform,
    tmpdir: os.tmpdir(),
    print: (text) => process.stdout.write(text),
    spawnClaudeInteractivelyIn: (workspaceDir) =>
      // Through a shell on win32 so the claude .ps1/.cmd shim resolves (the
      // same spawn shape the tests use for npm/pnpm — AHQ-211 D4).
      spawnSync('claude', [], {
        cwd: workspaceDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }),
  });
}
