# AHQ-170 Implementation Plan — Fix `node-pty` on x86 Linux (Option 1)

Ticket: https://agentic-hq.atlassian.net/browse/AHQ-170
Run + test **on this x86_64 Linux instance** (this is where the bug manifests).

## Context

On x86_64 Linux the CLI crashes at startup: `node-pty@1.1.0` ships prebuilds only for
darwin + win32, and its build script is disabled (`pnpm-workspace.yaml:38`
`allowBuilds: { … node-pty: false }`), so no `linux-x64` binary is ever produced.
**Option 1 (chosen, supply-chain reviewed):** allow only `node-pty` to build from
source on Linux, and pin its version exactly.

## Toolchain (verified present on this box — no apt installs needed)

`gcc`, `g++`, `make`, `libc6-dev` headers, `python3` all present; `node-gyp` is provided
by npm at build time.

## Changes

1. **`package.json`** — pin exact version (mitigation):
   `"node-pty": "^1.1.0"` → `"node-pty": "1.1.0"`.
2. **`pnpm-workspace.yaml:38`** — allow only node-pty to build:
   `allowBuilds: { esbuild: false, node-pty: true, unrs-resolver: false }`
   (keep `esbuild`/`unrs-resolver` blocked — narrow allow-list).
3. **`pnpm-workspace.yaml` comment block (lines 10–28)** — update the AHQ-152 security
   note to record that `node-pty` is now allowed to build (it lacks a `linux-x64`
   prebuild), citing AHQ-170 and the supply-chain assessment.

## Implementation order (TDD-aligned)

1. **RED (re-confirm):** `node bin/agentic-hq.cjs list` crashes with the `node-pty`
   native-module load error.
2. Apply changes 1–3.
3. **Rebuild:** `pnpm install`; if the build doesn't auto-run, force it with
   `pnpm rebuild node-pty`. **Verify a `linux-x64` binary is produced** (e.g.
   `node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/build/Release/pty.node`).
   - Fallback: if flipping `allowBuilds` does not trigger the build (in case that key
     is not the effective knob), use pnpm's documented `onlyBuiltDependencies: [node-pty]`
     and re-run. Confirm empirically either way.
4. **GREEN:** `node bin/agentic-hq.cjs list` runs and prints `Available workflows`.
5. **Validate:** `pnpm validate` (typecheck + lint:check + format:check + unit). Apply
   `format:fix`/`lint:fix` only if `*:check` shows changes confined to the touched files.

## Verification

- A `linux-x64` `pty.node` exists after install/rebuild.
- `node bin/agentic-hq.cjs list` (and optionally `agentic-hq list` after `npm link`)
  start without the node-pty crash.
- `pnpm validate` passes 100%.
- macOS/Windows expected unaffected (their bundled prebuilds still satisfy the loader);
  to be re-confirmed on a Mac separately.

## Mitigations applied (from the supply-chain assessment)

- Exact version pin (`1.1.0`).
- Narrow allow-list (only `node-pty` flipped to `true`).
- `minimumReleaseAge: 10080` (7 days) already set; frozen-lockfile installs unaffected.
- (No CI exists yet → sandboxed-CI mitigations are future work.)

## Out of scope

- The `npm link` install-simplification change (separate plan, completed on macOS).
- Documenting the Linux build-toolchain prerequisite in README/troubleshooting (small
  follow-up; the toolchain was already present on this box).

## Notes

- No `git commit` (per repo rule — only via the `/commit` command).
- Changes are intended to STAY on this box (this is the AHQ-170 fix, done here on purpose).