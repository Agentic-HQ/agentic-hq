# AHQ-170 — macOS verification results

Ticket: https://agentic-hq.atlassian.net/browse/AHQ-170
Test plan followed: `004-testing-details-and-instructions.md` (Part B — macOS verification)
Run by: Claude (Claude Code), on the human's Mac
Date: 2026-06-30

## Verdict: ✅ PASS — no macOS regression from `node-pty: true`

The key new data point the test set out to capture:

> **On macOS, node-pty used its bundled darwin prebuild — it did NOT compile from
> source.** No `gyp`/`CXX`/`SOLINK`/`node-gyp rebuild` ran. **No Xcode Command Line
> Tools are required** for Mac developers to install the project. The
> "compiles-on-mac → needs Xcode CLT" onboarding regression did **not** occur.

The darwin `spawn-helper` stayed executable and the PTY runtime path (spawning Claude
Code via node-pty) worked with no `posix_spawnp failed` — so the pnpm #7366 workaround is
intact alongside `node-pty: true`.

## Environment

- OS: macOS (Darwin 24.6.0), **x86_64 / Intel Mac** → relevant prebuild is `darwin-x64`
- Node: `v24.15.0`
- pnpm: `11.1.2`
- node-pty: `1.1.0` (exact pin)
- Commit under test: `d2424cc` — "AHQ-170 - Installation Fails On x86 Linux Due To Lack Of node-pty Binary"
- Logs captured (transient, `/tmp`): `/tmp/ahq170-mac-install.log`, `/tmp/ahq170-validate.log`

## Step-by-step results

### 0. Change present — ✅
- `git log --oneline -1` → `d2424cc AHQ-170 ...`
- `package.json` → `"node-pty": "1.1.0"` (exact pin)
- `pnpm-workspace.yaml` → `allowBuilds: { esbuild: false, node-pty: true, unrs-resolver: false }`

### 1. Clean install, watching node-pty — ✅ (used PREBUILD, no compile)
`rm -rf node_modules && pnpm install --no-side-effects-cache` completed in **3.5s**.
node-pty's lifecycle scripts ran (as expected now that it is approved), but resolved to
the prebuild:

```
node-pty install$ node scripts/prebuild.js || node-gyp rebuild
node-pty install: > Checking prebuilds...
node-pty install: Done                         # <- stopped here; did NOT fall through to node-gyp rebuild
node-pty postinstall$ node scripts/post-install.js
node-pty postinstall: > Cleaning release folder...
node-pty postinstall: > Moving conpty.dll...   SKIPPED (not Windows)
node-pty postinstall: Done
. postinstall$ chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true
. postinstall: Done                            # <- our root #7366 chmod workaround ran
```

Grep for compile markers (`CXX` / `SOLINK` / `gyp info` / `node-gyp rebuild` actually
running) → **none found**. node-pty used the bundled darwin binary.

### 2. darwin binary + spawn-helper perms (#7366) — ✅
`node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/prebuilds/`:
- `darwin-x64/pty.node` present (≈52 KB) — the binary for this Intel Mac.
- `darwin-arm64/pty.node` also present (≈85 KB).
- **Both** `darwin-x64/spawn-helper` and `darwin-arm64/spawn-helper` are `-rwxr-xr-x`
  (executable). End state after node-pty's own `post-install.js` + our root postinstall is
  still `+x`.

### 3. GREEN smoke test (`node bin/agentic-hq.cjs list`) — ✅
Printed `Available workflows` and the full workflow list. Exit code 0. No
`Failed to load native module` / no `prebuilds/linux-x64` error.

### 4. PTY runtime test — the real #7366 check — ✅
`node bin/agentic-hq.cjs reversal -- --string-to-reverse="hello mac"`
- Spawned Claude Code through node-pty (twice: orchestrator + the `reverse-a-string`
  command), both self-terminated cleanly via the self-termination skill.
- Final output: `Reversed string: cam olleh` (`hello mac` reversed correctly).
- **No `posix_spawnp failed`** and no native-module errors → the darwin `spawn-helper`
  permissions are correct under `node-pty: true`.

### 5. Full validation (`pnpm validate`) — ✅
Exit code 0. typecheck ✓, lint ✓, format ✓ ("All matched files use Prettier code
style!"), **146/146 unit tests** pass (32 test files).

### 6. (Optional) cross-workspace e2e — ⏭️ SKIPPED (out of scope)
Per the test plan, the 5 cross-workspace e2e tests still use the old `pnpm add -g .`
install mechanism (a separate `npm link` change, not AHQ-170). Skipped here as out of
scope for AHQ-170.

## Success criteria (from the test plan)

- [x] Clean `pnpm install` completes on macOS — **yes, 3.5s**.
- [x] **Did node-pty use the prebuild or compile from source?** — **PREBUILD** (no
      compile; no Xcode CLT needed on macOS).
- [x] `spawn-helper` is executable; `node bin/agentic-hq.cjs list` works — **yes**.
- [x] A PTY-spawning workflow (`reversal`) runs with **no `posix_spawnp failed`** —
      **yes** (`cam olleh`).
- [x] `pnpm validate` passes 100% — **yes** (146/146).
- [x] Any regression / "compiles-on-mac → needs Xcode CLT" finding noted — **no
      regression; macOS uses the prebuild, no compile, no toolchain requirement.**

## Conclusion

`node-pty: true` is **safe on macOS**. macOS continues to use the bundled darwin prebuild
(no source build, no Xcode CLT requirement), the #7366 `spawn-helper` workaround still
holds, the PTY runtime path works end-to-end, and full validation is green. Combined with
the Linux results in `004-...` (Part A), the AHQ-170 fix resolves the Linux startup
failure with **no regression on macOS**.
