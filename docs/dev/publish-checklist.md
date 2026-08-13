# Publish Checklist — Releasing `agentic-hq` to npm

The manual, maintainer-run process for publishing a new version of `agentic-hq` to
npmjs.org. Follow it top to bottom for every publish — each step gives the exact
command, what you should see, and what to do in each case.

**Why the process is shaped like this:**

- The **staged `release/` tree is the only publishable artifact**. The repo root is
  permanently `private: true` and carries an always-fail `prepack` script, so packing or
  publishing the root fails loudly (guarded by
  `tests/integration/build/publish-guards.integration.test.ts`).
- **Packing must be `pnpm pack`, run from inside `release/`.** Only pnpm applies
  `publishConfig.executableFiles`, which is what records the shipped plugin `.sh`
  files' execute bits in the tarball — an npm-packed tarball would ship them
  non-executable (exit 126 at runtime). The generated release manifest carries a
  user-agent-checking `prepack` that fails any non-pnpm pack.
- **The upload itself uses `npm publish` on the already-packed tarball.** A tarball
  publish is an upload only — it runs no lifecycle scripts and does not re-pack — so
  the pnpm-only rule is not violated and the wrong-packer guard correctly stays
  silent. npm is used for the upload because its browser passkey hand-off for 2FA is
  documented and verified; pnpm's is not.
- **The registry is immutable.** A bad version can never be re-uploaded — hence the
  inspect-before-publish step and the never-republish rule in §6.

---

## 1. Preconditions

**1a. pnpm version matches the pin.**

```
pnpm --version
```

- **Expected:** exactly the version pinned in the root `package.json`'s
  `packageManager` field (currently `11.1.2`).
- **If it differs:** STOP. Align your pnpm to the pin before continuing. A pnpm
  **major** bump is a publish-pipeline change, not a routine upgrade — re-verify the
  pipeline (the publish-guards test and the tarball e2e) before publishing with it.

**1b. Logged in to npm as the package owner.**

```
npm whoami
```

- **Expected:** `halso` (the `agentic-hq` package owner).
- **If it errors with `E401`/`ENEEDAUTH`:** your session has expired — this is normal,
  not an error condition. Since December 2025 `npm login` issues a **2-hour session
  token**, so you will usually need to log in again on publish day. Run `npm login`,
  complete the browser passkey sign-in when it opens, then re-run `npm whoami` and
  confirm it prints `halso`. (This account's 2FA is `auth-and-writes` via
  passkey/security key — there are no OTP codes anywhere in this flow.)

**1c. Clean git tree on the intended branch.**

```
git status
```

- **Expected:** `nothing to commit, working tree clean`, on the branch you mean to
  publish from.

**1d. All safety nets green.** Run each; every one must pass — no exceptions:

```
pnpm validate
pnpm test:integration:build-determinism
pnpm test:integration:publish-guards
pnpm test:e2e:prebuilt-tarball-math-workflow
```

- **If any fails:** STOP and fix before going any further.

## 2. Build & pack

```
pnpm build
```

- **Expected:** compile output ending `build-release: staged <repo>/release`.

```
cd release && pnpm pack
```

- **Expected:** a `agentic-hq-<version>.tgz` file created inside `release/`.
- **If it fails:** the generated manifest's own `prepack` guard or pnpm itself
  rejected the pack — STOP and diagnose; do not fall back to `npm pack` (that is
  exactly the wrong-packer mistake the guard exists to block).

## 3. Inspect the packed tarball's ACTUAL manifest

Always inspect the manifest **inside the tarball** — never the source manifest, and
never the staged `release/package.json` — the tarball is what ships.

```
tar -xOzf agentic-hq-<version>.tgz package/package.json
```

Check every one of these:

- **no `private` field** at all;
- `bin` is exactly `{"agentic-hq": "bin/agentic-hq-prebuilt.cjs"}`;
- every `exports` target is compiled `./dist/….js` — **no `.ts` anywhere**;
- `publishConfig.executableFiles` is **non-empty** and lists only
  `.agentic-hq/plugins/**/*.sh` paths;
- **no** `devDependencies`, **no** `packageManager`, **no** `engines.pnpm` —
  `engines` contains `node` only.

Then spot-check the file list:

```
tar -tzf agentic-hq-<version>.tgz | grep '^package/\.agentic-hq/plugins/' | grep '/skills/' | cut -d/ -f4,6 | sort -u
```

- **Expected:** exactly the migrated workflows' skills (currently
  `agentic-hq-core-plugin/self-termination`, `agentic-hq-demos-plugin/add-feature`,
  `agentic-hq-demos-plugin/math-workflow`) — none of the unmigrated skills listed in
  `EXCLUDED_UNMIGRATED_SKILLS` in `scripts/build-release.cjs`.

```
tar -tzf agentic-hq-<version>.tgz | grep node_modules
```

- **Expected:** no output at all.

**If any check fails:** STOP — do not publish. Fix the build, then restart from §2.

## 4. Publish (maintainer-run)

From inside `release/`, publish the **exact tarball you just inspected** — and run this in a
**real terminal window** (verified 2026-08-12: in a non-TTY shell, npm cannot wait for the
browser ceremony and exits immediately with `EOTP`, publishing nothing):

```
npm publish ./agentic-hq-<version>.tgz
```

- **Expected:** possibly a cosmetic `Unknown project config "frozen-lockfile"` warning
  (a known annoyance from the repo `.npmrc` when npm runs inside the repo — ignore
  it); `npm notice` lines describing the tarball; then the **browser passkey
  hand-off** — npm auto-opens (or prints) a URL like `https://www.npmjs.com/login/<id>`;
  complete the passkey ceremony there and the terminal continues by itself — ending
  in `+ agentic-hq@<version>`.
- **If `E401`/`ENEEDAUTH`:** your 2-hour session expired mid-step. Run `npm login`
  (browser + passkey), confirm `npm whoami` prints `halso`, then re-run the publish
  command — this is safe, nothing is published until auth completes.
- **If the hand-off page won't load or the ceremony loops:** Ctrl-C (safe for the same
  reason). Fallback (**Plan B, not the default**): create a **granular access token**
  at npmjs.com → Access Tokens, read+write scoped to **only the `agentic-hq`
  package**, shortest expiry, "Bypass 2FA" ticked; use it for the one publish; then
  **delete it immediately**. It is not the default because it is a bearer secret that
  sidesteps 2FA. (Granular Bypass-2FA tokens can publish until Jan 2027; after that
  npm moves publishing to OIDC trusted publishing.)
- **If `cannot publish over previously published version`:** that version already
  exists on the registry — STOP and go to §6.
- **Anything else:** STOP — do not retry. Diagnose first. **Never re-run a
  completed-looking publish "to see if it works this time".**

Then confirm the registry state:

```
npm view agentic-hq versions dist-tags
```

- **Expected:** the new version present in `versions`, and `dist-tags.latest`
  pointing at it.

## 5. Registry verification matrix (maintainer-run, delegable)

Verify the published package from the real registry — four combos: {`npx`,
prefix-scoped global install} × {Node 24, Node 22}. Run each from a **fresh temp
directory outside the repo** (inside the repo, the repo `.npmrc` makes npm print the
cosmetic warning from §4).

**Expected in every combo:** the workflow list shows **only** the migrated workflows
(currently `math` and `add-feature`), and the math run ends with `Output number: 5`.
The math workflow runs three real Claude steps — expect several minutes per combo.

**npx (per Node version):**

```
cd "$(mktemp -d /tmp/ahq-npx-XXXXXX)" && npx --yes agentic-hq list && npx --yes agentic-hq math -- --input-number=11
```

**Global install with a temp prefix (per Node version):**

```
T=$(mktemp -d /tmp/ahq-g-XXXXXX) && npm install -g --prefix "$T" agentic-hq && cd "$(mktemp -d /tmp/ahq-ws-XXXXXX)" && "$T/bin/agentic-hq" list && "$T/bin/agentic-hq" math -- --input-number=11
```

- The `--prefix` form exercises the identical npm global-install code path while
  leaving any dev-linked `agentic-hq` binary untouched. (A true unprefixed
  `npm install -g agentic-hq` would replace a dev link until re-linked — only do that
  deliberately.)
- To run a combo on a non-default Node version, prefix the command with a `PATH`
  override for that Node's bin directory, e.g.
  `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && …` — this affects
  just that shell.
- **Record all results** (e.g. in the ticket's implementation summary). **If any
  combo fails:** stop there and diagnose before running anything else.
- **Folder-trust prompt:** the first workflow run in a fresh directory can trigger Claude
  Code's interactive "do you trust this folder?" prompt — fine when you run the combo
  yourself (answer Yes), but it hangs any non-interactive/delegated run forever. For
  delegated runs, create the workspaces under a parent directory Claude already trusts
  (verified 2026-08-12: `/tmp/agentic-hq-test-workspaces/`, the e2e suite's workspace
  parent, does not prompt).

## 6. If any step fails

**STOP.** The npm registry is immutable: a version, once published, can **never** be
re-uploaded — not even after an unpublish. Never republish the same version. Fix the
problem, bump the **patch** version, and restart this checklist from the top.
