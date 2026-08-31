#!/usr/bin/env node
/**
 * prepack-guard — both publish guards as one Node script (AHQ-198, AHQ-211)
 *
 * npm and pnpm both run `prepack` and abort the pack/publish when it exits
 * non-zero (npm does so even on a private package), and prepack never runs at
 * install time — so this script is a packer-level gate with zero install-time
 * cost. Previously two inline `node -e` strings whose nested quoting is
 * cmd-hostile; a script file has no quoting at all (AHQ-211).
 *
 * Modes (argv[2]):
 *   root     Always refuse: the repo root must never be packed/published —
 *            the publishable artifact is the staged release tree (AHQ-198).
 *            The root's `private: true` blocks publish but NOT pack.
 *   release  Refuse on win32 first: NTFS has no exec bits, so a
 *            Windows-packed tarball would ship the plugin scripts
 *            non-executable on Mac/Linux (exit 126 at runtime) — publish
 *            from Mac now, from CI later, never from Windows (AHQ-211).
 *            Then refuse any packer but pnpm: only pnpm applies
 *            publishConfig.executableFiles, so an npm-packed tarball loses
 *            the same exec bits (AHQ-198). A tarball publish runs no
 *            lifecycle scripts, so uploading the pnpm-packed tarball with
 *            npm stays unaffected.
 *
 * Message substrings are asserted by tests/unit/scripts/prepack-guard.unit.test.ts
 * and tests/integration/build/publish-guards.integration.test.ts — keep in sync.
 */

const ROOT_MODE = 'root';
const RELEASE_MODE = 'release';
const VALID_MODES = [ROOT_MODE, RELEASE_MODE];

const ROOT_REFUSAL =
  'ERROR: never pack/publish the repo root — the publishable artifact is the staged release ' +
  'tree. Run: pnpm build && cd release && pnpm pack. See docs/dev/publish-checklist.md';

const WINDOWS_REFUSAL =
  'ERROR: never pack/publish agentic-hq from Windows — NTFS has no exec bits, so the tarball ' +
  'would ship the plugin scripts non-executable on Mac/Linux (exit 126 at runtime). Publish ' +
  'from Mac (CI publishing later). See docs/dev/publish-checklist.md';

const WRONG_PACKER_REFUSAL =
  'ERROR: agentic-hq must be packed/published with pnpm — npm silently drops ' +
  'publishConfig.executableFiles, so shipped plugin scripts would lose their execute bits. ' +
  'Use: pnpm pack / pnpm publish from release/.';

const WINDOWS_PLATFORM = 'win32';
const PNPM_USER_AGENT_PREFIX = 'pnpm/';

/** Pure guard decision: { allowed: true } or { allowed: false, message }. */
function evaluatePrepackGuard({ mode, platform, userAgent }) {
  requireValidMode(mode);
  if (isRootMode(mode)) {
    return refuse(ROOT_REFUSAL);
  }
  if (isWindows(platform)) {
    return refuse(WINDOWS_REFUSAL);
  }
  if (!isPnpmPacker(userAgent)) {
    return refuse(WRONG_PACKER_REFUSAL);
  }
  return allow();
}

function requireValidMode(mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(
      `prepack-guard.cjs: mode argument must be one of [${VALID_MODES.join(', ')}] (got "${mode}")`
    );
  }
}

function isRootMode(mode) {
  return mode === ROOT_MODE;
}

function isWindows(platform) {
  return platform === WINDOWS_PLATFORM;
}

function isPnpmPacker(userAgent) {
  return (userAgent || '').startsWith(PNPM_USER_AGENT_PREFIX);
}

function refuse(message) {
  return { allowed: false, message };
}

function allow() {
  return { allowed: true };
}

module.exports = { evaluatePrepackGuard };

if (require.main === module) {
  const verdict = evaluatePrepackGuard({
    mode: process.argv[2],
    platform: process.platform,
    userAgent: process.env.npm_config_user_agent,
  });
  if (!verdict.allowed) {
    console.error(verdict.message);
    process.exit(1);
  }
}
