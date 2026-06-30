# Installation Fails On x86 Linux Due To Lack Of node-pty Binary

- **Type:** Bug
- **Project:** AHQ
- **Priority:** Medium (High for Linux users) — blocks all CLI/workflow execution on
  x86_64 Linux; macOS (primary target) is unaffected.
- **Components:** Install / dev onboarding, `node-pty` native dependency
- **Affects platform:** Linux x86_64 (`linux x64`). Not macOS, not Windows.

---

## Description

On x86_64 Linux the `agentic-hq` CLI cannot start because the `node-pty` native module
has no `linux-x64` binary. `node-pty` is loaded eagerly at CLI startup (via the Claude
Code tooling), so the failure hits **every** subcommand — not only ones that use a PTY.
It is **independent of the install method** (reproduces even without `npm link` — see
Steps To Reproduce) and is **separate from, though surfaced by,** the `npm link`
install-simplification change. Root cause and fix options are below.

## Environment (where it was observed)

- OS: `Linux 7.0.0-27-generic x86_64` (Ubuntu VM)
- Node: `v24.18.0` (via nvm); `process.platform = linux`, `process.arch = x64`
- `node-pty`: `1.1.0`
- Package manager: `pnpm 11.1.2`

## Steps To Reproduce

1. On an x86_64 Linux machine, clone the repo and run `pnpm install`.
2. Run the CLI by any route — e.g. `node bin/agentic-hq.cjs list`, or `agentic-hq list`
   after `npm link`.

## Expected

`agentic-hq list` prints `Available workflows` and the workflow list.

## Actual

The process exits non-zero at startup with:

```
Error: Failed to load native module: pty.node, checked: build/Release, build/Debug,
prebuilds/linux-x64: Error: Cannot find module './prebuilds/linux-x64//pty.node'
Require stack:
- .../node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/lib/utils.js
- .../node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/lib/index.js
    at Object.loadNativeModule (.../node-pty/src/utils.ts:28:9)
    at Object.<anonymous> (.../node-pty/src/unixTerminal.ts:15:16)
    ...
Node.js v24.18.0
```

## Root cause

Two facts combine:

1. **`node-pty` ships prebuilt binaries only for darwin + win32 — not linux.**
   The bundled `prebuilds/` directory contains:
   ```
   prebuilds/darwin-arm64/pty.node
   prebuilds/darwin-x64/pty.node
   prebuilds/win32-x64/pty.node
   prebuilds/win32-arm64/pty.node
   ```
   There is **no `prebuilds/linux-x64/`** and **no `build/Release/`**. On Linux,
   `node-pty` is expected to compile from source on install — its `package.json` has
   `"install": "node scripts/prebuild.js || node-gyp rebuild"`.

2. **The build is disabled by pnpm.** `pnpm-workspace.yaml:38` sets:
   ```yaml
   allowBuilds: { esbuild: false, node-pty: false, unrs-resolver: false }
   ```
   So pnpm does **not** run `node-pty`'s `install`/`postinstall` scripts → the
   `node-gyp rebuild` never happens → no `linux-x64` binary is produced. On macOS and
   Windows this is harmless because the bundled prebuilds satisfy the loader; on Linux
   it leaves the module with no binary at all.

The C toolchain needed to build is *present* on the observed machine (`python3`,
`make`, `gcc`, `g++` are installed; `node-gyp` itself is bundled with npm) — the build
is simply never invoked because of `allowBuilds: { node-pty: false }`.

> Note: `allowBuilds: false` was a deliberate supply-chain decision (don't run
> dependency install scripts). See the comment block above line 38 in
> `pnpm-workspace.yaml`, and the related macOS chmod workaround / pnpm bug #7366
> referenced in `package.json` (`postinstall`). Any fix must weigh that intent.

## Impact

- **All** workflow execution on x86_64 Linux is blocked — the CLI cannot start.
- Linux is a secondary target (README states macOS is primary; "Linux is most likely
  to work with little or no changes") — this is one of those "small change" gaps.
- Surfaced while verifying the `npm link` install change; that change is correct and
  works, but its e2e tests cannot go green on Linux until this is fixed.

## Fix options (decision: Option 1 — chosen)

1. ✅ **CHOSEN — Enable the `node-pty` build for Linux** — set `node-pty: true` in
   `allowBuilds` (`pnpm-workspace.yaml:38`) so pnpm runs its install script and
   `node-gyp rebuild` compiles `pty.node` for the host platform.
   - ✅ Minimal change; produces a correct native binary for the exact machine.
   - ⚠️ Re-enables running `node-pty`'s install scripts (revisits the supply-chain
     decision); requires a C toolchain (`build-essential`, `python3`) on Linux dev
     machines. Could be scoped so only `node-pty` builds while others stay disabled.

2. **(not chosen) Switch to a prebuilt fork that ships Linux binaries** — e.g.
   `@homebridge/node-pty-prebuilt-multiarch`, which provides prebuilds for
   `linux-x64` / `linux-arm64` (and others).
   - ✅ No build toolchain needed on any platform; keeps `allowBuilds` off.
   - ⚠️ Dependency swap + compatibility check; a third-party fork to vet/track.

3. **(not chosen) Keep `allowBuilds: false` but document a manual Linux step** — README /
   troubleshooting instruct Linux users to install `build-essential`/`python3` and run
   `pnpm approve-builds node-pty` (or `pnpm rebuild node-pty`) after `pnpm install`.
   - ✅ Smallest policy change.
   - ⚠️ Extra manual onboarding step; easy to miss; weaker UX.

**Decision: Option 1 (chosen).** Allow only `node-pty` to build from source on Linux,
with the mitigations listed in the Supply-chain assessment below. The C toolchain is
available on the target Linux machines, and a reviewable source build is a smaller
supply-chain risk than swapping to an opaque third-party prebuilt fork (Option 2).

## Supply-chain assessment (Option 1)

Reviewed the supply-chain risk of re-enabling `node-pty`'s build scripts (full Q&A:
`/tmp/AHQ-170-perplexity-q-and-a.md`). **Verdict: acceptable, bounded risk — Option 1
chosen.**

- **Scope is narrow.** Allow-listing `node-pty` runs only *its* lifecycle scripts; all
  other direct and transitive dependencies stay blocked. The trusted surface grows by
  exactly one known package.
- **Threat model.** Re-opens install-time code execution (as the installing user, on
  dev machines and CI) for `node-pty` only. Realistic compromise = maintainer-account
  takeover / malicious release, not a runtime exploit.
- **`node-pty` is medium-to-low practical risk** — Microsoft-maintained, VS Code-grade;
  an install-time native build is expected behaviour for a native module.
- **Safer than Option 2.** A reviewable, version-pinned, integrity-hashed build from a
  reputable upstream beats trusting an opaque prebuilt binary from a smaller,
  less-audited fork.

**Required mitigations (apply with the fix):**
- [ ] Allow-list **only** `node-pty` in `allowBuilds` — leave `esbuild` /
      `unrs-resolver` (and everything else) blocked.
- [ ] Pin an exact `node-pty` version; rely on the frozen lockfile + integrity hash;
      use `--frozen-lockfile` in CI.
- [ ] Review `node-pty`'s `scripts/prebuild.js` / `scripts/post-install.js` on every
      version bump.
- [ ] Run installs in least-privilege / disposable CI environments.
- [ ] Consider pnpm's newer controls: `minimumReleaseAge` (defaults to 1440 min in
      v11), `trustPolicy` / `trustLockfile`, and `frozenStore`.

## Acceptance criteria

- On a clean x86_64 Linux clone, after the documented install (`pnpm install && npm
  link`), `agentic-hq list` runs without the `node-pty` native-module error and prints
  the workflow list.
- The cross-workspace e2e tests pass on x86_64 Linux.
- macOS and Windows behaviour is unchanged (still works; no regressions).
- Any new prerequisite (build toolchain) or step is documented in the README /
  `docs/user-docs/troubleshooting-quickstart.md`.
- The supply-chain rationale for the chosen approach is captured (update the comment
  in `pnpm-workspace.yaml` if `allowBuilds` changes).

## References

- `pnpm-workspace.yaml:38` — `allowBuilds: { esbuild: false, node-pty: false, ... }`
- `package.json` — `node-pty: ^1.1.0`; darwin-only `postinstall` chmod (pnpm bug #7366)
- node-pty `package.json` install script: `node scripts/prebuild.js || node-gyp rebuild`
- Surfaced by: the "simplify dev install — replace `pnpm add -g .` with `npm link`"
  change (plan: `/tmp/plan.md`). That change is correct; this ticket unblocks its e2e
  verification on Linux.
- Related: AHQ-79 (install "smell"), and the install simplification work.