# Emergency Security Fix: PNPM Changes To Try To Avoid Supply Chain Attacks

**AHQ-152** — https://agentic-hq.atlassian.net/browse/AHQ-152
**Type:** Bug / Security (Emergency)
**Date:** 2026-06-03
**Status:** Implemented (as-built) — all acceptance criteria met and verified. See Acceptance Criteria.

> **Branch / merge note:** This change was implemented and committed on the
> `feature/ahq-143-implement-add-feature-workflow` branch (a *different* feature). It is a small,
> self-contained, security-only set of edits to `pnpm-workspace.yaml` files and will reach `main` when
> that branch is squash-merged. It does not depend on the AHQ-143 add-feature work and could be
> cherry-picked out if needed.

---

## Summary

One sentence outcome: **three layered pnpm supply-chain controls are applied — (1) third-party
build/install scripts are blocked (`allowBuilds: false`), (2) installs are pinned to the committed
lockfile (`frozen-lockfile=true`), and (3) a 7-day release-age cooldown (`minimumReleaseAge`) gates
future updates — reducing the risk that a malicious or compromised dependency runs code, that a
newer/tampered version is silently pulled in, or that a brand-new malicious release is adopted before
the ecosystem can detect it.**

As a: developer / CI running `pnpm install` for this repo or any of its plugin ts-workflows
I want: (1) third-party `install`/`postinstall` scripts **blocked** by default, (2) installs to use the
**committed lockfile exactly** (no silent version drift), and (3) a **release-age cooldown** so
brand-new versions aren't adopted the instant they publish
So that: a malicious or compromised package release cannot execute arbitrary code on my machine during
`pnpm install`, a newer malicious version cannot be pulled in without a deliberate reviewable change,
and a freshly-published malicious release is held back until the ecosystem has had time to catch it.

### The three controls in this ticket

| # | Control | Mechanism | What it defends against |
|---|---|---|---|
| 1 | Block build scripts | `allowBuilds: <pkg>: false` in `pnpm-workspace.yaml` | Arbitrary code in a dependency's `install`/`postinstall` running **at install time**. |
| 2 | Pin to lockfile | `frozen-lockfile=true` in `.npmrc` | A **newer/tampered version** being silently resolved; complements pnpm's always-on SHA-512 integrity check. |
| 3 | Release-age cooldown | `minimumReleaseAge: 10080` (7 days) in **every** `pnpm-workspace.yaml` (all 9 install roots) | A **brand-new malicious release** being adopted at *update* time before the ecosystem has had time to detect/yank it. |

> **Honest scope:** neither control protects against a *trusted-but-compromised* package executing at
> **runtime** (e.g. a malicious prebuilt native binary that ships inside an allowed version, or
> malicious JS in the package's main module). That surface is mitigated only by the lockfile's integrity
> pin plus discipline around *updating* it — see Residual Risk. Hence the ticket title's "**Try To**".

## Background

### The risk

pnpm 11 blocks dependency build/install (`install` / `postinstall`) scripts by default
(`strictDepBuilds: true`). A package is only allowed to run those scripts if it is explicitly listed
as `true` in the `allowBuilds` map in `pnpm-workspace.yaml`.

Allowing a **third-party** package to run install scripts is a supply-chain attack vector: a malicious
(or compromised) release can run arbitrary code on a developer's / CI machine during `pnpm install`,
before any of our own code executes. Previously `node-pty`, `esbuild`, and `unrs-resolver` were all
set to `true`, so this repo (and each plugin ts-workflow) trusted those packages' install scripts.

### Why disabling them is SAFE (evidence)

The build-script approvals were added in **AHQ-21 / AHQ-23 (Jan 2026)** as part of a "clear all pnpm
warnings" sweep — not because the packages were proven to need them. Investigation shows the approvals
are **near-no-ops** on every platform we support, because all three packages ship **prebuilt native
binaries**:

| Package | How the native binary arrives | What its "build script" actually does |
|---|---|---|
| **node-pty** | All-platform prebuilds bundled inside its npm tarball (`prebuilds/<os>-<arch>/pty.node`, `spawn-helper`) | `install` (prebuild.js) just **checks** a prebuild exists → exits 0. `postinstall` just **cleans** `build/Release`. Neither compiles nor downloads when a prebuild is present. |
| **esbuild** | Per-platform optional-dependency package (e.g. `@esbuild/darwin-x64`) | `postinstall` (install.js) **validates/links** the already-present binary. |
| **unrs-resolver** | Per-platform optional-dependency package (e.g. `@unrs/resolver-binding-darwin-x64`) | `postinstall` (`napi-postinstall … check`) **checks** the binary. |

Because the matching prebuilt binary for the install platform is already present after a plain
`pnpm install`, blocking the build scripts changes nothing on supported platforms.

### Key historical finding — the approvals were not the real fix

`node-pty` was already `^1.1.0` when the approvals were added, and it is still `^1.1.0` now — so
nothing changed version-wise. The original `posix_spawnp failed` error on macOS was **not** a build
failure: it was a **permissions** problem (pnpm extracted `spawn-helper` as `-rw-r--r--` instead of
`-rwxr-xr-x`, a known pnpm bug — pnpm/pnpm#7366). The real fix was the **separate
`chmod +x spawn-helper` `postinstall` hack** in the root `package.json`, *not* the build approval.
The AHQ-23 commit bundled both fixes and the commit message conflated them.

### `false` does not break `pnpm install`

Setting a package to explicit `false` is a *recorded decision* ("I know this builds; I deliberately
refuse it"), which is distinct from *omitting* it. An omitted-but-needed build hard-fails the install
under `strictDepBuilds: true`; an explicit `false` lets the install succeed without running the
script. (Confirmed empirically by the reporter: a clean `rm -rf node_modules && pnpm install` at the
repo root with all three set to `false` installs cleanly and the `agentic-hq` CLI runs fine.)

## The `agentic-hq` exception (kept `true`) — human-confirmed decision

In the plugin `ts-workflow` sub-projects, the `allowBuilds` map also contains an **`agentic-hq`**
entry. This is **not** a third-party prebuilt-binary dependency — it is the **local, first-party**
package linked into the workflow, and its `postinstall` runs the `chmod +x spawn-helper` fix that
node-pty needs. The reporter explicitly chose to keep `agentic-hq: true` because:

- It is **our own code**, not a third-party supply-chain surface.
- Its `postinstall` is the *actual* fix for the node-pty `posix_spawnp` bug; disabling it risks
  reintroducing that bug. (Whether that chmod hack is still required under pnpm 11 is a separate,
  untested question — see Follow-up.)

## Control 1 (implemented) — Block build scripts (`allowBuilds`)

Set third-party deps → `false` and keep `agentic-hq: true`, plus an AHQ-152 comment (header block +
inline on each key) explaining the change. Each plugin/fixture file now reads:

```yaml
allowBuilds:
  agentic-hq: true # AHQ-152: first-party (our code) — runs the chmod fix for node-pty
  node-pty: false # AHQ-152: block third-party install scripts (prebuilt binaries used)
  esbuild: false # AHQ-152: block third-party install scripts (prebuilt binaries used)
```

All header-block and inline comments across the edited files cite **AHQ-152** (verified: no
`AHQ-143` references remain in any `pnpm-workspace.yaml`).

### Files changed for Control 1 (`allowBuilds`) — 8 of 9 `pnpm-workspace.yaml`

(Control 3 below separately adds `minimumReleaseAge` to **all 9** roots, and Control 2 adds `.npmrc`
files — so the full change set is larger than this Control-1 table.)

| File | Change |
|---|---|
| `pnpm-workspace.yaml` (root) | `node-pty`, `esbuild`, `unrs-resolver` already `false`; added the security comment block |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/pnpm-workspace.yaml` | `node-pty`+`esbuild` `true` → `false` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/pnpm-workspace.yaml` | `node-pty`+`esbuild` `true` → `false` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/pnpm-workspace.yaml` | `node-pty`+`esbuild` `true` → `false` |
| `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/pnpm-workspace.yaml` | `node-pty`+`esbuild` `true` → `false` |
| `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/pnpm-workspace.yaml` | `node-pty`+`esbuild` `true` → `false` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/pnpm-workspace.yaml` | **Correction:** had `agentic-hq: false` (wrong — would skip the chmod fix); restored to `true`. `node-pty`/`esbuild` remain `false`. |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/pnpm-workspace.yaml` | **Normalised:** map was malformed (`esbuild: set this to true or false`); replaced with the full 3-key map (`agentic-hq: true`, `node-pty: false`, `esbuild: false`). |

### File deliberately NOT changed (for Control 1)

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/pnpm-workspace.yaml`
  — it has **no** `allowBuilds` map (legacy dev-only spike), so there is nothing to flip. Adding one
  could break that spike's install for zero supply-chain benefit; left as-is. (It *did* receive a
  Control 2 `.npmrc`, below.)

## Control 2 (implemented) — Pin installs to the committed lockfile (`frozen-lockfile`)

Each independent install root carries an `.npmrc` with `frozen-lockfile=true`, so `pnpm install` uses
the committed `pnpm-lock.yaml` exactly (and its SHA-512 integrity hashes) and **fails** rather than
silently resolving newer versions. The `.npmrc` documents the deliberate-update escape hatch:

```ini
# Require pnpm to use the existing pnpm-lock.yaml exactly.
# … (silent version drift is blocked; intentional updates use an explicit flag) …
#   pnpm add <package> --no-frozen-lockfile
#   pnpm update --no-frozen-lockfile
#   pnpm install --no-frozen-lockfile
frozen-lockfile=true
```

### Coverage — `frozen-lockfile` across the 9 install roots

A repo has one *install root* per directory containing its own `pnpm-workspace.yaml` (each runs its
own `pnpm install`). Coverage:

| Install root | `.npmrc` frozen? | Notes |
|---|---|---|
| `.` (repo root) | ✅ | |
| `…/create-workflow/ts-workflow` | ✅ | |
| `…/add-feature/ts-workflow` | ✅ | |
| `…/full-jira-tdd-story-workflow/ts-workflow` | ✅ | |
| `…/math-workflow/ts-workflow` | ✅ | |
| `…/quick-jira-workflow/ts-workflow` | ✅ | |
| `…/string-reversal/ts-workflow` | ✅ | |
| `docs/project-docs/project-spikes/spike-00-…/project` | ✅ | `.npmrc` added in this ticket (it already had a `pnpm-lock.yaml`). |
| `tests/e2e/fixtures/string-reversal-copy-for-test/…/ts-workflow` | ⚠️ N/A — **exact-pin instead** | `frozen-lockfile` is impossible here (`link:` depth problem, proven below); its two registry deps (`tsx`, `commander`) are **exact-pinned** in `package.json` instead. |

No skill or test invokes `pnpm install` with `--no-frozen-lockfile` or `--ignore-workspace`, so
nothing silently overrides the setting. (Verified by grep.)

### The e2e test fixture — `frozen-lockfile` impossible, **exact-pin used instead (RESOLVED)**

The fixture at `tests/e2e/fixtures/string-reversal-copy-for-test/…/ts-workflow` **cannot** use
`frozen-lockfile` (unlike every other install root). Why forcing it would break the e2e suite:

- Its `package.json` pins `agentic-hq` to `link:REPO_ROOT_PLACEHOLDER`, and the e2e harness
  (`string-reversal-workflow-in-new-workspace-…` and `cross-workspace-string-reversal`) **copies the
  fixture to a temp dir and rewrites that placeholder to the real absolute repo path** before running
  `pnpm install`.
- It has **no `pnpm-lock.yaml`**. `frozen-lockfile=true` with no lockfile is a hard error.
- **Empirically tested (and the obvious fix disproven):** a probe generated a lockfile for the fixture
  and reused it at a different directory depth (as the harness does at runtime). pnpm records a `link:`
  dependency in the lockfile as **two fields** — an absolute `specifier` *and* a **relative `version`**
  (`link:../../../Users/…`) whose `../` depth is tied to the install location. At a deeper runtime temp
  dir, a frozen install **does not error** but produces a **dangling `agentic-hq` symlink** (wrong
  depth) → the workflow's `import 'agentic-hq'` would fail at runtime. So the "just `replaceAll` the
  placeholder in the lockfile too" idea **does not work** — the depth-relative `version` can't be
  reconstructed from a fixed placeholder.

**Resolution (implemented): exact-pin the registry deps.** The fixture's only third-party (registry)
deps are `tsx` and `commander`; `agentic-hq` is a first-party local `link:` (zero supply-chain risk).
Both registry deps are pinned to **exact** versions in `package.json` — `tsx: 4.21.0`,
`commander: 14.0.3` (matching the sibling `string-reversal` demo and the root lockfile) — with a
`"// EXACT-PINS-AHQ-152"` comment recording that this is the deliberate workaround for not being able
to freeze. This gives the same "no silent version drift" protection for the only deps that carry risk,
with no lockfile and no harness change.

- **Verified** (throwaway dir, no global mutation, no Claude): valid JSON; a clean resolve produces
  exactly `tsx@4.21.0` + `commander@14.0.3`; no `^` ranges remain.
- **Trade-off vs `frozen-lockfile`:** exact pins stop *direct*-dep drift but do not pin `tsx`'s
  transitive deps or pre-commit integrity hashes the way a lockfile would. Proportionate for a
  test-only fixture; accepted.

## Control 3 (implemented) — Minimum release-age cooldown (`minimumReleaseAge`)

Added to **all 9 install roots** (every `pnpm-workspace.yaml` — root, 6 ts-workflows, the e2e fixture,
and the spike):

```yaml
minimumReleaseAge: 10080   # 7 days, in minutes
```

pnpm refuses to *resolve* any dependency version published less than this long ago, giving the
ecosystem time to detect and yank a malicious release before we adopt it. This directly implements the
"> X days" idea from the research (`research/01-perplexity-question-and-answer.md`), using pnpm's
**native** setting rather than a custom scanner.

- **Why all 9 roots (not just the root):** pnpm settings do **not** cascade across nested
  `pnpm-workspace.yaml` boundaries — each ts-workflow is its own workspace root and reads only its own
  settings. *Verified:* before the edit a ts-workflow saw `undefined`; after, `pnpm config get
  minimumReleaseAge` inside `…/string-reversal/ts-workflow` returns `10080`. Without setting it in each,
  the ts-workflows would silently fall back to pnpm 11's **1-day** default while the root was on 7 days
  — a surprising inconsistency. Now uniform at 7 days everywhere.
- **Verified accepted + non-disruptive:** `pnpm config get minimumReleaseAge` → `10080` at root and in
  a ts-workflow; `pnpm install --frozen-lockfile` at root still succeeds ("Already up to date"); and a
  throwaway resolve of the (exact-pinned) e2e fixture with the cooldown active still resolves
  `tsx@4.21.0` + `commander@14.0.3` (old versions not blocked).
- **Scope of effect:** only gates **new resolution** (`pnpm update` / `--no-frozen-lockfile`). Frozen
  installs of the existing lockfile never consult it, and all currently-pinned versions are far older
  than 7 days — so **zero impact on today's behaviour**; it is a guard on *future* updates.
- **Escape hatch:** `minimumReleaseAgeExclude: [pkg@version]` for an urgent hotfix that must bypass the
  wait.

## Acceptance Criteria

- [x] Every `allowBuilds` map in the repo has all **third-party** entries (`node-pty`, `esbuild`,
      `unrs-resolver`) set to `false`. *(Verified by inspection of all 9 workspace files.)*
- [x] `agentic-hq` entries remain `true` with an explanatory comment. *(Verified.)*
- [x] Each edited file has a comment linking to the security ticket (AHQ-152) and a one-line "why".
      *(Verified — all files cite AHQ-152; no AHQ-143 references remain.)*
- [x] `rm -rf node_modules && pnpm install` succeeds at the repo **root** and the `agentic-hq` CLI
      runs. *(Confirmed by reporter prior to these edits.)*
- [x] A clean `pnpm install` (after `rm -rf node_modules`) succeeds in a plugin `ts-workflow` dir
      under the new config. *(Verified in `…/string-reversal/ts-workflow`: exit 0, no `strictDepBuilds`
      failure and no ignored-build error for `node-pty`/`esbuild`; the `agentic-hq` `chmod` postinstall
      ran. All plugin files share the identical 3-key map, so this dir is representative.)*
- [x] YAML machine-validated. *(Verified — pnpm itself parsed every edited `pnpm-workspace.yaml`
      during the install with no syntax error.)*
- [x] Runtime works end-to-end with the build scripts blocked. *(Verified — `tsx`→`esbuild` compiled
      and ran `string-reversal-demo-cli.ts`; the `@esbuild/darwin-x64` binary is present despite
      `esbuild: false`, confirming the prebuilt-binary path.)*
- [x] **(Control 2)** `frozen-lockfile=true` `.npmrc` present in 8 of 9 install roots (root + 6
      ts-workflows + spike). *(Verified by inspection.)*
- [x] **(Control 2)** No skill/test command overrides it (`--no-frozen-lockfile` / `--ignore-workspace`
      absent from all invocations). *(Verified by grep.)*
- [x] **(Control 2 — e2e fixture)** `frozen-lockfile` proven impossible here (`link:` depth problem);
      closed instead by **exact-pinning** `tsx@4.21.0` + `commander@14.0.3` in the fixture `package.json`
      with an explanatory `"// EXACT-PINS-AHQ-152"` comment. *(Verified: valid JSON, exact resolution,
      no `^` ranges.)*
- [x] **(Control 3)** `minimumReleaseAge: 10080` (7 days) set in **all 9 install roots** (does not
      cascade — each needs its own). *(Verified — `pnpm config get` → `10080` at root and inside a
      ts-workflow; frozen install at root unaffected; exact-pinned fixture still resolves with the
      cooldown active.)*

## Residual Risk / Caveats

- **Platform dependence:** the safety relies on prebuilt binaries existing for the install platform
  (all our supported targets: Node 22/24 on macOS/Linux, x64+arm64). On an exotic platform with **no**
  prebuild (e.g. Alpine/musl, or a brand-new Node ABI before prebuilds are published), `node-pty`
  would fall back to `node-gyp rebuild`, which needs the build script approved **and** a compiler
  toolchain — with `false`, that install would fail. If we ever target such a platform, flip
  `node-pty` back to `true` there.
- **Freeze is only as good as the locked versions (Control 2):** `frozen-lockfile` stops *drift* into
  a newer/tampered version, but it does nothing if the version we already committed is itself bad, and
  it does not protect against a trusted-but-compromised package running at **runtime**. It also means
  users do not automatically receive security *patches* — that now depends on our release cadence (see
  next section).
- **Developer friction:** because `frozen-lockfile=true` is committed (not CI-only), a plain
  `pnpm install` fails whenever `package.json` and the lockfile disagree. Intentional updates must use
  `--no-frozen-lockfile` (documented in every `.npmrc`). This is the intended trade-off.

## Effect of the freeze, and how we manage the locked-down system going forward

> Forward-looking — **not all implemented in this emergency ticket.** Based on research in
> `docs/jira-docs/AHQ-152/research/01-perplexity-question-and-answer.md` (current pnpm / Renovate /
> Dependabot best practice, 2025–2026). The research **confirms** the "minimum release age" instinct
> and names the concrete tool (pnpm's native `minimumReleaseAge`).

### (1) Who is affected, and how

**(a) New users who download, install and run Agentic HQ.**
They get **exactly the dependency graph we committed** — the pinned versions in `pnpm-lock.yaml`, with
integrity hashes verified, and third-party install scripts blocked. This is a **feature, not a bug**:
they run what we vetted and tested, not whatever happens to be newest on the registry the day they
install. They are *not* exposed to a malicious release published *after* our lockfile was cut. The
cost: if our shipped versions are stale or have a known vuln, new users inherit that until we ship an
update.

**(b) Existing users (e.g. the maintainer) already on a version.**
Once installed, they are effectively **frozen** on that lockfile — repeated `pnpm install` will not
move them. They stay reproducible and stable, but they will **not** automatically pick up upstream
security patches. Moving forward requires a *deliberate* update (pull a new release / run an explicit
update), which is exactly where review and a cooldown check can be applied.

In short: **the freeze concentrates all dependency risk at one controllable moment — when we choose to
update — instead of spreading it across every user's install.** That is the point.

### (2) Options for managing updates safely (recommended direction)

The research's 80/20 for a small OSS CLI ("not a bank, but don't compromise users' machines"):

1. **Keep the freeze as steady-state** (done in this ticket): committed lockfile + `frozen-lockfile`
   + integrity hashes + `allowBuilds` deny-by-default.
2. **A "minimum release age" cooldown — ✅ DONE in this ticket (Control 3).** pnpm's native
   `minimumReleaseAge` (added pnpm 10.16) refuses to resolve any version younger than the threshold,
   for direct *and* transitive deps. Set to **`10080` (7 days)** in **all 9 install roots** (it does
   not cascade across nested `pnpm-workspace.yaml` boundaries, so each root sets it explicitly).
   Rationale: most malicious releases are detected and yanked within ~hours, so even a short delay
   removes most of the "fresh malicious release" risk; larger X just delays legitimate patches.
3. **A deliberate, low-effort update workflow** (manual command or scheduled bot), run on a cadence:
   - `pnpm update` (or a Renovate/Dependabot PR — both support cooldown/`minimumReleaseAge` so brand-new
     releases are held back automatically),
   - `pnpm audit` (fix/override real vulns),
   - `pnpm install --frozen-lockfile` in a clean environment to prove the new lockfile is valid,
   - review the lockfile diff + run tests, then **merge only if all pass** → cut a release so users get
     the vetted patch.
4. **Keep dependencies minimal** — the cheapest supply-chain control of all.

This balances the two forces from (1): protect users from surprise *new* releases at install time
(freeze + cooldown), while still getting *security patches* to them through a regular maintainer update
cadence and fast patch releases when `pnpm audit`/advisories flag something real.

**Remaining next step (deferred — AHQ-154):** the cooldown (item 2) is done; what's left is the
*deliberate-update* process — scanning the changed packages for malicious code **before** adopting
them, then a `pnpm install --frozen-lockfile` + test. This is now its own ticket,
**AHQ-154 — "Later: Security: Use Scanning Techniques To Upgrade Frozen Package Versions"**
(https://agentic-hq.atlassian.net/browse/AHQ-154), with a full step-by-step < 2-hour plan in
`docs/jira-docs/AHQ-152/DRAFT-AHQ-154-Jira-Description-For_Future_Updating_Plan.md`. The research
behind it (`research/02-perplexity-question-and-answer-about-future-upgrading.md`) recommends the
**"diff the lockfile → behavioural-scan the changed packages (Socket / `npq`) → `osv-scanner` +
`pnpm audit` → frozen install + tests"** workflow, and stresses the key distinction: `audit`/OSV only
catch *known* CVEs, whereas a **behavioural scanner is what actually targets a novel supply-chain
*hack***. See Follow-up.

## Follow-up (separate tickets — NOT part of this emergency change)

- Confirm whether the root `package.json` `chmod +x spawn-helper` `postinstall` hack is still
  load-bearing under pnpm 11 (pnpm/pnpm#7366). If pnpm 11 fixed the extraction permissions bug, the
  hack — and the `agentic-hq: true` exception that exists to run it — may be removable, allowing full
  lockdown.
- **Safe-update workflow (deferred → AHQ-154):**
  https://agentic-hq.atlassian.net/browse/AHQ-154 — "Later: Security: Use Scanning Techniques To
  Upgrade Frozen Package Versions". The process for deliberately upgrading the frozen versions with
  confidence the new ones aren't hacked: **diff the lockfile → behavioural-scan the changed packages
  (Socket / `npq`) before adopting → `osv-scanner` + `pnpm audit` → `pnpm install --frozen-lockfile`
  + tests**, optionally a `pnpm run update:safe` helper and later a Renovate/Dependabot cooldown
  config. Full < 2-hour step-by-step plan:
  `docs/jira-docs/AHQ-152/DRAFT-AHQ-154-Jira-Description-For_Future_Updating_Plan.md`; research +
  citations: `research/02-perplexity-question-and-answer-about-future-upgrading.md`. *(The
  `minimumReleaseAge` cooldown itself is now done — Control 3.)*

## Out Of Scope

- Removing or changing the root `package.json` `postinstall` chmod hack (separate follow-up).
- Changing dependency *versions* or the contents of any lockfile (this ticket only *enforces* the
  existing lockfile; it does not bump anything).
- The safe-update / pre-adoption scanning workflow (deferred — **AHQ-154**, see Follow-up). *(The
  `minimumReleaseAge` cooldown itself IS in scope and done — Control 3.)*
- (The e2e fixture is handled — exact-pinned instead of frozen; see Control 2.)
- Any change to how skills/workflows are invoked or how `pnpm install` is wired into the skill command.
- Adding an `allowBuilds` map to the legacy spike-00 workspace (it has none to flip; it *did* get a
  Control 2 `.npmrc`).
- CI verification — no CI workflow exists yet. When one is added it will inherit the root `.npmrc`
  (`frozen-lockfile`) automatically; nothing to do here now.
