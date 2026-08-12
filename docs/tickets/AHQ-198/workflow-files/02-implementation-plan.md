# AHQ-198 — Implementation Plan

Un-private the staged release artifact, guard the wrong-tree/wrong-packer publish surfaces,
exclude the five unmigrated workflows from the artifact, write the manual publish checklist, then
perform the quiet `0.1.0` publish as `halso` and verify it from the real registry.

**Planner decision (recorded, per the parent brief):** the five unmigrated workflows
(string-reversal, quick-jira-workflow, full-jira-tdd-story-workflow, add-feature-detailed-example,
create-workflow) are **excluded** from the staged tree, not present-but-marked. Why: their
SKILL.md launch commands still use the legacy `pnpm install` + symlink + tsx pattern, which in an
installed package would try to **mutate the read-only artifact** and requires pnpm/tsx that npm
users don't have — shipping them breaks the parent ticket's read-only guarantee the moment anyone
runs one, on top of the known raw TypeError. Exclusion is also the minimal mechanism: a five-entry
list in `build-release.cjs`'s existing copy filter (AHQ-201 deletes entries as it migrates each
workflow), zero SKILL.md edits to revert later, and `agentic-hq list` self-corrects because
workflow discovery is filesystem-driven (verified: no skill names are hardcoded in `src/`, and
plugin.json manifests don't enumerate skills).

**Guard mechanism (spike-verified today, npm 11.12.1 / pnpm 11.1.2):** both packers run a
`prepack` lifecycle script and abort the pack/publish when it exits non-zero — npm does so even on
a `private: true` package — and `npm_config_user_agent` cleanly identifies the packer
(`npm/11.12.1 …` vs `pnpm/11.1.2 …`). So: an always-fail `prepack` at the **repo root** closes the
wrong-tree surface, and a UA-checking `prepack` in the **generated release manifest** closes the
wrong-packer surface. Neither runs at user install time (`prepack` is pack/publish-only).

## Tests Being Created

Test-first, because both features have a natural cheap RED (the tarball manifest currently carries
`private: true` and the excluded skills; `npm pack` currently *succeeds* from both wrong places),
and the resulting nets guard every future publish, not just this one.

**1. Extend the artifact-shape test in
`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`**
(AC: published manifest un-private; AC: unmigrated workflows per recorded decision):

- `expect(tarballManifest.private).toBeUndefined()` — the generated manifest omits `private`.
- Shipped-skills boundary, leak-class style: derive the unique `plugin/skills/skill` pairs from
  `tarballFileList` and assert **exactly** `agentic-hq-core-plugin → [self-termination]` and
  `agentic-hq-demos-plugin → [add-feature, math-workflow]` (utilities has no `skills/` dir).
- In the `list` test: installed `agentic-hq list` output does **not** contain `string-reversal`,
  `quick-jira`, `full-jira`, `add-feature-detailed-example`, or `create-workflow`, and does
  contain `agentic-hq add-feature` (unambiguous only alongside the detailed-example absence
  assertion — substring pitfall noted for the Implementer).

RED can run without a Claude invocation by scoping to the shape/list tests:
`pnpm test:e2e:prebuilt-tarball-math-workflow -- -t 'artifact shape'` (the beforeAll still
builds/packs/installs); the final GREEN runs the full file including the math run.

**2. New `tests/integration/build/publish-guards.integration.test.ts`**
(AC: wrong tree or wrong packer fails loudly) + a `test:integration:publish-guards` script in
`package.json` following the existing convention. `beforeAll` runs `pnpm build` (same cost as the
build-determinism test). Three tests:

- `npm pack --pack-destination <temp>` at the **repo root** exits non-zero, stderr pointing at
  `pnpm build && cd release && pnpm pack`. (RED today: this currently packs a garbage tarball.)
- `npm pack --pack-destination <temp>` inside **`release/`** exits non-zero, stderr naming pnpm
  and the exec-bit reason. (RED today: currently succeeds and would ship non-executable scripts.)
- Positive control: `pnpm pack --pack-destination <temp>` inside `release/` still succeeds (the
  UA guard must not false-positive on the blessed packer).

**3. The checklist and publish have no automated test** — the publish is a one-shot manual act
against the live registry. Concrete manual validation instead: the real `0.1.0` publish is
performed **by following the new checklist step by step**, and its registry-verification matrix
(§4 of the checklist: npx + prefix-global install, each on Node 22 and Node 24, math-workflow
end-to-end) is the acceptance evidence, recorded in `03-implementation-summary.md`. The existing
tarball e2e and build-determinism tests remain the automated pre-publish safety nets.

## Implementation Changes

**1. `scripts/build-release.cjs`** — three changes:

- Generated manifest omits `private` (delete the copy line and its "until AHQ-198" comment). The
  root keeps `private: true` permanently as the structural wrong-tree publish block (brief Q1).
- Generated `scripts` gains the wrong-packer guard alongside `postinstall`:

  ```js
  // Wrong-packer guard: only pnpm applies publishConfig.executableFiles, so an
  // npm-packed tarball would ship the plugin .sh files non-executable (exit 126
  // at runtime — AHQ-196). prepack runs on pack/publish only, never on install.
  prepack:
    'node -e "const ua=process.env.npm_config_user_agent||\'\'; ' +
    "if(!ua.startsWith('pnpm/')){console.error('ERROR: agentic-hq must be packed/published " +
    "with pnpm — npm silently drops publishConfig.executableFiles, so shipped plugin scripts " +
    "would lose their execute bits. Use: pnpm pack / pnpm publish from release/.');process.exit(1)}\"",
  ```

  (Exact quoting is the Implementer's to finalise; the guard logic is UA `startsWith('pnpm/')`.)
- Unmigrated-workflow exclusion in the plugin staging filter:

  ```js
  // AHQ-198: unmigrated workflows are excluded from the artifact until AHQ-201
  // migrates them — their legacy launch commands (pnpm install + tsx inside the
  // package) cannot work in the read-only npm install. AHQ-201 deletes entries
  // from this list as it migrates each workflow.
  const EXCLUDED_UNMIGRATED_SKILLS = [
    'agentic-hq-core-plugin/skills/create-workflow',
    'agentic-hq-demos-plugin/skills/add-feature-detailed-example',
    'agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow',
    'agentic-hq-demos-plugin/skills/quick-jira-workflow',
    'agentic-hq-demos-plugin/skills/string-reversal',
  ];
  // in the cpSync filter (pluginsRoot = <repo>/.agentic-hq/plugins):
  filter: (source) => {
    if (path.basename(source) === 'node_modules') return false;
    const rel = path.relative(pluginsRoot, source);
    return !EXCLUDED_UNMIGRATED_SKILLS.some((s) => rel === s || rel.startsWith(s + path.sep));
  },
  ```

  Dev mode is untouched: dev discovery and skill resolution read the **repo** plugins tree
  (`ahq-package-root` = repo root), and the excluded five never reach the runner (they crash at
  legacy tool construction first — the accepted AHQ-197 break). The two accepted-red legacy e2es
  stay red for the same reason as before, and `executableFiles` re-enumerates dynamically.

**2. Root `package.json`** — add the wrong-tree guard (plus a `// PREPACK` comment key):

```json
"prepack": "node -e \"console.error('ERROR: never pack/publish the repo root — the publishable artifact is the staged release tree. Run: pnpm build && cd release && pnpm pack. See docs/dev/publish-checklist.md'); process.exit(1)\"",
```

Verified today: nothing in `package.json` scripts, tests, or CI packs the repo root, so this
guard fires only on mistakes. Root `private: true`, untouched, keeps blocking root `npm publish`
/ `pnpm publish` with npm's own loud error.

**3. New `docs/dev/publish-checklist.md`** (+ one link line in `docs/README.md`'s Developer
section). Every maintainer-run step is written as **full instructions** — the exact command, the
expected output in each case (e.g. already-logged-in vs expired session), and what to do for
each — matching the style of *Steve's Commands To Run* below. Sections:

1. **Preconditions** — `pnpm --version` must equal the root `packageManager` pin (currently
   `11.1.2`; a pnpm **major** bump is a publish-pipeline change to re-verify, not a routine
   upgrade); `npm whoami` = `halso`; clean git tree; nets green: `pnpm validate`,
   `pnpm test:integration:build-determinism`, `pnpm test:integration:publish-guards`,
   `pnpm test:e2e:prebuilt-tarball-math-workflow`.
2. **Build & pack** — `pnpm build`, then `cd release && pnpm pack`.
3. **Inspect the packed tarball's ACTUAL manifest** (never the source manifest):
   `tar -xOzf agentic-hq-<version>.tgz package/package.json` — no `private`; `bin` →
   `bin/agentic-hq-prebuilt.cjs`; `exports` → compiled `./dist/....js` (no `.ts`);
   `publishConfig.executableFiles` non-empty; no
   `devDependencies`/`packageManager`/`engines.pnpm`; `engines.node` only. Spot-check
   `tar -tzf`: no excluded skills, no `node_modules`.
4. **Publish [maintainer-run]** — `npm publish ./agentic-hq-<version>.tgz` from `release/`,
   completing npm's **browser passkey hand-off** when the login URL prints (this account's 2FA
   is `auth-and-writes` via security key/passkey — no OTP codes exist for it). Publishing a
   tarball is an **upload only**: the pnpm-only rule protects *packing* (exec-bit recording),
   and a tarball publish runs **no lifecycle scripts** (dry-run spike-verified for both npm and
   pnpm), so the wrong-packer guard correctly stays silent — the artifact was pnpm-packed in
   step 2. Then [agent-run] `npm view agentic-hq versions dist-tags` → new version present,
   `latest` points at it.
5. **Registry verification matrix [maintainer-run, delegable]** — from clean temp dirs **outside
   the repo** (avoids the repo `.npmrc`'s cosmetic npm warning), on Node 24 then Node 22:
   `npx --yes agentic-hq list` and `npx --yes agentic-hq math -- --input-number=11` →
   `Output number: 5`; then `npm install -g --prefix "<temp>" agentic-hq` and run the installed
   bin by absolute path: `list` + the same math run. Record all results.
6. **If any step fails** — STOP. Never republish the same version (the registry is immutable);
   fix, bump patch, restart the checklist.

**4. The publish itself** — publish `0.1.0` as-is (brief Q2 — already ahead of the `0.0.1`
placeholder), `latest` tag, macOS only (Linux deferred to AHQ-199 per brief Q3), nothing
advertising the npm route. The Implementer prepares everything up to the GO point (build → pack →
inspect → all nets green → GO/NO-GO report); the publish command and verification matrix are
Steve's, run in-session — see **Steve's Commands To Run** below. Matrix results go in the
implementation summary.

### Sequencing (RED → CODE → GREEN, test-first)

1. **Cycle 1 — artifact shape:** RED: add the e2e assertions (scoped run, no Claude) and see them
   fail on today's artifact → CODE: `build-release.cjs` un-private + exclusions → GREEN: scoped
   e2e passes.
2. **Cycle 2 — publish guards:** RED: new integration test fails (both `npm pack` runs currently
   succeed) → CODE: root `prepack` + generated `prepack` → GREEN: guards test 3/3.
3. **Full local verification:** `pnpm validate`, build-determinism, publish-guards, the **full**
   tarball e2e (including the math run), and the cross-workspace math e2e (dev parity untouched).
4. **Checklist doc**, then **the publish + registry matrix** with the human (its manual GREEN).

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

## Steve's Commands To Run

Everything in this section is run by Steve, in this session, via the `!` prefix (each command is a
self-contained one-liner — session cwd and shell state reset between `!` invocations, so each line
carries its own `cd`/`PATH`). Everything **not** in this section is agent-run.

**Verified environment facts (checked live, 2026-08-11):** logged in to npm as `halso`; npm 2FA
mode `auth-and-writes`, second factor is a **passkey/security key** (Steve's confirmation: no
authenticator-app entry exists — he signs into npmjs.com with a passkey; so publishing uses
npm's browser hand-off, and **no OTP code is ever typed**); `pnpm --version` = 11.1.2, exactly
matching the root `packageManager` pin; local npm is 11.12.1 (supports the modern security-key
publish hand-off, present since npm ≥ 11.9); nvm has Node **v22.20.0** and **v24.15.0** already
installed (no `nvm install` needed); the default node is v24.15.0.

**Instructions verified current (2026-08-11), two ways.** Empirically against your exact local
binaries: the prepack-guard spike; `npm profile get` (2FA mode); and a `--dry-run` spike proving
a **tarball** publish runs no lifecycle scripts under either npm or pnpm (so uploading the
pnpm-packed tarball with npm never trips the wrong-packer guard). And against the live official
docs/changelogs: [npm 2FA docs](https://docs.npmjs.com/about-two-factor-authentication/) +
community threads — with security-key/passkey 2FA, `npm publish` hands off to the browser
("Open https://www.npmjs.com/login/<id> to use your security key for authentication"; the
machine-readable hand-off shipped in npm ≥ 11.9, local npm is 11.12.1);
[GitHub changelog Dec 2025](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)
— classic tokens revoked, `npm login` now issues **2-hour session tokens**;
[GitHub changelog Jul 2026](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)
— granular access tokens with Bypass-2FA still publish until **Jan 2027** (OIDC trusted
publishing after that); and
[docs.npmjs.com npx](https://docs.npmjs.com/cli/v11/commands/npx) ("Any options and arguments
after the package name are passed directly to the executed command, not to npx itself" — so the
`math -- --input-number=11` forwarding is doc-confirmed). pnpm remains the only sanctioned
**packer**; npm does the **upload** because its passkey hand-off is doc-verified and pnpm's is
not.

### How to run these

- **These commands must be run by the human (Steve), inside the Claude session, exactly as
  written — including the leading `!`** — so Claude sees each command run and its output, and
  records the results in the implementation summary. (The `!` is Claude Code's "run this in my
  shell" prefix; don't paste these into a normal terminal.)
- Each command is a **self-contained one-liner** (cwd and shell state reset between `!`
  commands).
- **Wait for the Implementer's explicit GO report** (build done, tarball packed and inspected,
  all automated nets green) before Step 1.
- Tailored to your current setup (verified today): your default node is **v24.15.0**, so the
  Node-24 steps need no version juggling at all; Node 22 is installed at
  `~/.nvm/versions/node/v22.20.0`, so the Node-22 steps just prefix `PATH` with it — no
  `nvm use` anywhere.

### Step 0 — Auth readiness (passkey — no OTP codes, no access token needed)

**There are no 6-digit codes anywhere in this flow, and you do not need to create an access
token.** Your 2FA is `auth-and-writes` with a **passkey** (your confirmation: you sign into
npmjs.com with a passkey; there is no authenticator-app entry — npm stopped new TOTP enrollments
in 2025 anyway). When Step 1 needs your second factor, npm **hands off to the browser**: it
prints (and usually opens) a URL like `https://www.npmjs.com/login/<id>` — you complete the
normal passkey ceremony there (Touch ID / your usual method), and the terminal continues by
itself.

**Know this:** since Dec 2025, `npm login` issues a **2-hour session token**. So on publish day
your login may well have expired — that's normal, not an error, and checking is always safe:

1. Run `! npm whoami`.
2. **If it prints `halso`** → you're already logged in; nothing to do.
3. **If it errors** (`E401`/`ENEEDAUTH` — the session has expired) → run `! npm login`: your
   browser opens an npmjs.com sign-in page; complete it with your passkey (Touch ID); when the
   terminal says you're logged in, run `! npm whoami` again and confirm it now prints `halso`.

**The readiness check (do now):** you already proved it today — you can sign into npmjs.com
with your passkey in your normal browser, and `npm whoami` returned `halso`. Nothing more to
set up.

**Plan B, only if the browser hand-off misbehaves on the day** (answering the "would an access
token work?" question — yes, but as fallback, not default): at
[npmjs.com/settings/halso/tokens](https://www.npmjs.com/settings/halso/tokens) → Generate New
Token → **Granular**, read+write scoped to **only the `agentic-hq` package**, shortest expiry,
**Bypass 2FA** ticked → use it for the one publish → **delete it immediately after**. These
still work for direct publishing until Jan 2027. It's not the default because it creates a
bearer secret that sidesteps your 2FA — the passkey flow leaves nothing behind to leak or
revoke.

### Step 1 — Publish `0.1.0` (the one irreversible step)

**What it does:** uploads the exact already-inspected tarball to npmjs.org as
`agentic-hq@0.1.0`, dist-tag `latest`. No re-pack happens — the manifest and exec bits are
already sealed inside the tarball. **Why `npm` and not `pnpm` for this one command:** the
pnpm-only rule is about *packing* (recording exec bits) and the tarball was pnpm-packed in the
GO steps; a tarball publish is an upload only and runs no lifecycle scripts (dry-run
spike-verified), npm 11.12.1's passkey hand-off is doc-verified while pnpm's is not, and npm
publish has no git branch checks (so no `--no-git-checks` needed).

**Before you run — check you're logged in (safe either way):**

1. Run `! npm whoami`.
2. **If it prints `halso`** → you're logged in; go straight to the publish command below.
3. **If it errors** → your 2-hour session expired. Run `! npm login`, complete the browser
   passkey sign-in (Touch ID), then run `! npm whoami` again — it should now print `halso`.

**The publish command:**

```
! cd release && npm publish ./agentic-hq-0.1.0.tgz
```

**You should see:** possibly the cosmetic `Unknown project config "frozen-lockfile"` warning
(ignore it — known repo `.npmrc` annoyance), npm notice lines describing the tarball, then the
browser hand-off (auto-opened or a printed `https://www.npmjs.com/login/<id>` URL to click) —
complete the passkey ceremony, return to the terminal — ending in `+ agentic-hq@0.1.0`.

**If it goes wrong:**
- `E401`/`ENEEDAUTH` → your session expired mid-step: run `! npm login` (browser + passkey),
  confirm `! npm whoami` now prints `halso`, then re-run the publish command (safe — nothing is
  published until auth completes).
- The hand-off page won't load or the ceremony loops → Ctrl-C (safe for the same reason), tell
  the agent, and fall back to Step 0's Plan B token if we decide to.
- "cannot publish over previously published version" → `0.1.0` is already on the registry —
  STOP and tell the agent.
- Anything else → STOP, don't retry; the output is already in the conversation for the agent to
  diagnose. **Never re-run a completed-looking publish "to see if it works this time".**

### Step 2 — Registry state check (agent-run, nothing for you)

The agent runs `npm view agentic-hq versions dist-tags` and confirms `0.1.0` exists with
`latest` pointing at it.

### Steps 3–6 — Registry verification matrix (4 combos, macOS)

Each combo: fresh temp workspace outside the repo (dodges the repo `.npmrc`'s cosmetic npm
warning), `list` as a cheap smoke, then the full math workflow (3 real Claude steps — expect
several minutes each). The Node-24 combos run on your default node (v24.15.0) with nothing
extra; the Node-22 combos start with a `PATH` prefix so just that command runs on your
installed v22.20.0.

**Expected in every combo:** the workflow list shows **only** `math` and `add-feature`, and the
math run ends with `Output number: 5`. If a combo fails: stop there — the output is in the
conversation; the agent diagnoses before anything else runs.

**Step 3 — npx on Node 24:**

```
! cd "$(mktemp -d /tmp/ahq-npx24-XXXXXX)" && npx --yes agentic-hq list && npx --yes agentic-hq math -- --input-number=11
```

**Step 4 — npx on Node 22:**

```
! export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && cd "$(mktemp -d /tmp/ahq-npx22-XXXXXX)" && npx --yes agentic-hq list && npx --yes agentic-hq math -- --input-number=11
```

**Step 5 — global install (temp prefix) on Node 24:**

```
! T=$(mktemp -d /tmp/ahq-g24-XXXXXX) && npm install -g --prefix "$T" agentic-hq && cd "$(mktemp -d /tmp/ahq-ws24-XXXXXX)" && "$T/bin/agentic-hq" list && "$T/bin/agentic-hq" math -- --input-number=11
```

**Step 6 — global install (temp prefix) on Node 22:**

```
! export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && T=$(mktemp -d /tmp/ahq-g22-XXXXXX) && npm install -g --prefix "$T" agentic-hq && cd "$(mktemp -d /tmp/ahq-ws22-XXXXXX)" && "$T/bin/agentic-hq" list && "$T/bin/agentic-hq" math -- --input-number=11
```

- Steps 5/6 use `npm install -g --prefix <temp>` — the identical npm code path the tarball e2e
  uses — so your dev-linked `agentic-hq` binary is **never touched**.
- All four are non-interactive (no auth involved) — they just take a few minutes each while the
  math workflow's three Claude steps run.

### Step 7 — Optional: true unprefixed global install (default: SKIP)

Only if you want the literal `npm install -g agentic-hq` as final proof: it **replaces your
dev-linked `agentic-hq`** until you re-link. Steps 5/6 exercise the same npm install path, so
the default is to skip this. Decide at the time.

## Risks/Unknowns/Concerns

- **Publish is immutable.** A bad `0.1.0` cannot be re-uploaded — mitigated by the inspect step,
  the tarball e2e, and publishing the exact inspected tarball. Worst case: fix and publish
  `0.1.1` (cheap at 0.x; AHQ-202 republishes a patch anyway).
- **Publishing from this feature branch, before the Reviewer stage.** I recommend publishing at
  the end of the Implementer stage (all nets green, Steve running Step 1) rather than after
  review/merge, because registry verification *is* this ticket's acceptance evidence. If you'd
  rather review first and publish after merge to `main`, say so at approval — the plan reorders
  cleanly (the checklist is sequence-independent).
- **Passkey hand-off inside a `!` command.** npm may auto-open the browser or only print the
  `npmjs.com/login/<id>` URL — either works (click or copy it); the publish waits until the
  ceremony completes, and interrupting before then publishes nothing. If the hand-off proves
  unworkable on the day, Step 0's Plan B (short-lived, package-scoped, Bypass-2FA granular
  token, deleted straight after) is the documented fallback — valid for direct publishing until
  Jan 2027, when npm moves publishing to OIDC trusted publishing (a fact for the future
  release-automation ticket, not this one).
- **npx argument forwarding** — doc-confirmed ("Any options and arguments after the package name
  are passed directly to the executed command"), and Steps 3/4 observe it live anyway; if
  reality disagrees with the docs, Steps 5/6's direct-bin form is the fallback and the finding
  gets recorded for AHQ-199's Quickstart docs.
- **npx cache reuse across Node versions (Steps 3→4)** — npx caches the package per version;
  the Node-22 rerun exercises Node 22 against the cached install (fine for our purpose: node-pty
  ships N-API prebuilds, ABI-independent). If we want a cold Node-22 npx instead, clear
  `~/.npm/_npx` between steps — decide at the time; not required for the AC.

## Follow-up Ideas

- AHQ-201 deletes `EXCLUDED_UNMIGRATED_SKILLS` entries as each workflow migrates, and restores
  the excluded five to the artifact.
- AHQ-199: Linux install-and-run check (deferred per brief Q3) + README npm/npx Quickstart.
- AHQ-202: patch republish + registry-installed interactive add-feature proof.
- Release automation (CI publish) — explicitly out of scope for v1 per parent brief Q5.

## Human Approval Confirmation

**Approved by Steve on 2026-08-12** (verbatim: "approved"), with no conditions attached, after
an iterative review that shaped the final version. What was approved is this plan as written,
including:

- the recorded Planner decision to **exclude** the five unmigrated workflows from the artifact;
- the two-cycle test-first implementation (tarball-e2e extensions; new publish-guards
  integration test) and the `build-release.cjs`/root-manifest changes behind them;
- the wrong-tree and wrong-packer `prepack` guards;
- the new `docs/dev/publish-checklist.md` written in full-instruction style;
- publish sequencing: `0.1.0` published at the **end of the Implementer stage** (after GO),
  via npm's browser passkey hand-off — no OTP codes, no access tokens (granular token is
  documented Plan B only);
- the *Steve's Commands To Run* steps (0–7), run by Steve inside the Claude session with the
  leading `!` so the agent sees and records the output; registry verification on Node 24
  (default) and Node 22 (v22.20.0 PATH pin), npx + temp-prefix global install, with the
  unprefixed true global install skipped by default.
