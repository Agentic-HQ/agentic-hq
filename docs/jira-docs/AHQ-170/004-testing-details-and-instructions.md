# AHQ-170 — Testing details (Linux) + verification instructions (macOS)

Ticket: https://agentic-hq.atlassian.net/browse/AHQ-170
Plan: `/tmp/AHQ-170-plan.md` · Bug write-up: `/tmp/node-pty-Jira.md`

**What changed (the fix):**
- `package.json` — `node-pty` pinned **exactly** (`^1.1.0` → `1.1.0`) + a `"// node-pty"`
  comment explaining the pin is for supply-chain safety (build script runs on Linux).
- `pnpm-workspace.yaml` — `allowBuilds` flips **only** `node-pty` `false` → `true`
  (`esbuild`/`unrs-resolver` stay `false`); security comment updated with the AHQ-170
  exception + rationale.
- `pnpm-lock.yaml` — 1 line (node-pty spec).

**Why macOS still needs checking:** setting `node-pty: true` means node-pty's own
`install`/`postinstall` scripts now run on **every** OS, including macOS. On macOS it
*should* use the bundled darwin prebuild (no compile), but this is a behaviour change
right next to the existing darwin `spawn-helper` chmod workaround (pnpm bug #7366), so
it must be confirmed on a real Mac.

---

## Part A — Testing already done on x86_64 Linux (all ✅)

Environment: Linux x86_64, Node `v24.18.0` (nvm), pnpm `11.1.2`. Toolchain present:
`gcc`/`g++`/`make`/`libc6-dev` headers/`python3` (no `build-essential` meta-package, but
all its parts were installed); `node-gyp` provided by npm at build time.

1. **RED (bug reproduced):** `node bin/agentic-hq.cjs list` crashed at startup —
   `Failed to load native module: pty.node … prebuilds/linux-x64` (no linux binary;
   build was disabled). Reproduced with a plain `node bin/...`, i.e. independent of the
   install mechanism.
2. **Applied the fix** (the 3 files above).
3. **Build compiles from source:** `pnpm rebuild node-pty` ran node-gyp
   (`CXX → SOLINK_MODULE → COPY Release/pty.node`, `gyp info ok`) and produced
   `node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/build/Release/pty.node` (75 KB).
4. **GREEN:** `node bin/agentic-hq.cjs list` prints `Available workflows` and the list.
5. **Clean-machine path proven:** `rm -rf node_modules && pnpm install --no-side-effects-cache`
   → pnpm **auto-compiled** node-pty *during install* (freshly built binary, single
   hard-link, new timestamp — not served from cache) because it is now approved. CLI works.
   (A normal `pnpm install` reuses pnpm's side-effects cache, so the build only happens
   once per machine.)
6. **`pnpm validate` green:** typecheck ✓, lint ✓, format ✓, **146/146 unit tests** ✓.

Not yet verified on Linux: workflows that actually spawn Claude Code via node-pty (the
PTY runtime path) — they need Claude Code installed. The darwin `spawn-helper`/#7366
concern is macOS-specific anyway.

---

## Part B — Verification instructions for Claude on the Mac (after commit + sync)

Run these from the repo root on macOS once the AHQ-170 commit is synced. Goal: confirm
macOS is **not** regressed by `node-pty: true`, and capture whether node-pty uses the
prebuilt darwin binary or compiles from source.

### 0. Confirm you have the change
```bash
git log --oneline -1
grep -n '"node-pty"' package.json                      # expect: "node-pty": "1.1.0"
grep -n 'allowBuilds' pnpm-workspace.yaml              # expect: node-pty: true
```

### 1. Clean install, watching what node-pty does
```bash
rm -rf node_modules
pnpm install --no-side-effects-cache 2>&1 | tee /tmp/ahq170-mac-install.log
```
Then inspect the log:
```bash
grep -iE 'node-pty|gyp|CXX|SOLINK|prebuild|postinstall' /tmp/ahq170-mac-install.log
```
- **Expected (ideal):** node-pty uses the bundled **darwin prebuild** — i.e. **no**
  `gyp`/`CXX`/`SOLINK` compile lines. No Xcode toolchain needed.
- **⚠️ FLAG if it COMPILES** on macOS (you see `CXX`/`gyp info` / node-gyp running):
  that means Mac devs would now need **Xcode Command Line Tools** to install — a possible
  onboarding regression. Note it on AHQ-170 (may warrant restricting the build to Linux,
  e.g. via an OS-specific approval or reconsidering Option 2).

### 2. Confirm the darwin binary + spawn-helper perms (#7366)
```bash
ls -la node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/prebuilds/darwin-*/
```
- `pty.node` present for your arch (`darwin-arm64` on Apple Silicon, `darwin-x64` on Intel).
- **`spawn-helper` must be executable** (`-rwxr-xr-x`). Our `package.json` `postinstall`
  chmods it; with `node-pty: true`, node-pty's own `post-install.js` also runs now —
  confirm the end state is still `+x`.

### 3. GREEN smoke test (CLI starts)
```bash
node bin/agentic-hq.cjs list
```
- Expect `Available workflows` + the workflow list (no `Failed to load native module`,
  no `posix_spawnp failed`).

### 4. PTY runtime test — the real #7366 check (spawns Claude Code via node-pty)
This exercises the actual PTY path that the spawn-helper perms affect. Needs Claude Code
installed; accept the "trust this folder" prompt if shown.
```bash
node bin/agentic-hq.cjs reversal -- --string-to-reverse="hello mac"
# (self-contained alternative: pnpm demo:agentic-hq-cli:string-reversal)
```
- **Success:** the workflow runs and returns the reversed string.
- **⚠️ FAIL if** you get `Error: posix_spawnp failed` → the darwin `spawn-helper` is not
  executable (the #7366 workaround broke with `node-pty: true`). Re-check step 2 / the
  postinstall ordering and report on AHQ-170.

### 5. Full validation
```bash
pnpm validate     # typecheck + lint:check + format:check + unit tests — expect 100% pass
```

### 6. (Optional) Cross-workspace e2e
The 5 cross-workspace e2e tests currently still use the **old** install mechanism
(`pnpm add -g .`) — that is a **separate** change (the `npm link` install-simplification
plan), **not** part of AHQ-170. Only run `pnpm test:e2e` here if pnpm's global bin is set
up on this Mac; otherwise skip — it's out of scope for AHQ-170.

---

## Success criteria (report back)

- [ ] Clean `pnpm install` completes on macOS.
- [ ] **Did node-pty use the prebuild or compile from source?** (report which — this is
      the key new data point for macOS).
- [ ] `spawn-helper` is executable; `node bin/agentic-hq.cjs list` works.
- [ ] A PTY-spawning workflow (`reversal`) runs with **no `posix_spawnp failed`**.
- [ ] `pnpm validate` passes 100%.
- [ ] Any regression or the "compiles-on-mac → needs Xcode CLT" finding noted on AHQ-170.

## Notes
- Do **not** `git commit` without the `/commit` command (repo rule).
- If macOS regresses, the fallback is Option 2 in `/tmp/node-pty-Jira.md` (switch to a
  prebuilt-multiarch fork) or scoping the build approval to Linux only.