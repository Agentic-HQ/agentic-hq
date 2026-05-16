# AI Summary: AHQ-136

**Jira**: [AHQ-136](https://agentic-hq.atlassian.net/browse/AHQ-136)
**Title**: Upgrade pnpm From 10 To 11 In Agentic HQ And Workflow Typescript Projects
**Status**: Transitioned to In Progress, assigned to Steve Halso
**Generated**: 2026-05-15 19:48

---

## My Understanding of This Task

This is a tooling/dependency upgrade Jira: move the project's package manager from pnpm 10 to pnpm 11, across **both** the main `agentic-hq` project **and** the workflow TypeScript sub-projects under `.agentic-hq/plugins/**`. It is **not** a code-feature change — there are no new classes, interfaces or behaviour. The Jira description is thorough and effectively functions as the implementation plan; on 2026-05-15 the title and scope were extended to explicitly cover the plugin sub-projects (*"Also said: Please update the pnpm projects under .agentic-hq as well."*).

The concrete work in the **main project**:

1. **Bump the pinned pnpm version** in `package.json`'s `packageManager` field, from `pnpm@10.33.0+sha512.…` to the latest `11.x` patch (the Jira example said `11.0.9`; the actual latest *today* is `11.1.2` — see Research below).
2. **Migrate the build-script allow-list** in `pnpm-workspace.yaml`: pnpm 11 removed the `onlyBuiltDependencies:` list and replaced it with the `allowBuilds:` map. Same three packages (`node-pty`, `esbuild`, `unrs-resolver`), new syntax. The doc-comment block above that section also needs updating — it currently references "pnpm 10.x" and links to the pnpm-10.0.0 announcement.
3. **Regenerate `pnpm-lock.yaml`** by running `pnpm install` under pnpm 11.

And in the **5 plugin workflow sub-projects** (see the dedicated section below): migrate each from its now-dead `pnpm.onlyBuiltDependencies` block in `package.json` to a per-directory `pnpm-workspace.yaml` with an `allowBuilds:` map. This is **required, not optional** — per the Perplexity research, pnpm 11 no longer reads the `pnpm` field of `package.json` at all, so without migration these projects' installs would fail under pnpm 11's `strictDepBuilds: true` default.

There is also one **knock-on change**: the `create-workflow` workflow scaffolds new workflow `ts-workflow` projects, and its build command only tells the scaffolding agent to create `package.json` + `tsconfig.json` — not a `pnpm-workspace.yaml`. Once build-script approval moves into a `pnpm-workspace.yaml`, that command must be updated so every newly-created workflow is born pnpm-11-correct. **Confirmed in scope for AHQ-136 (2026-05-15).** See the dedicated section below.

The scope stays focused on pnpm only. Other outdated packages (eslint 9→10, typescript 5.9→6, patch bumps) are explicitly **out of scope** and tracked separately, so any regression can be attributed cleanly to the pnpm bump. The Node 24 upgrade ([AHQ-135](https://agentic-hq.atlassian.net/browse/AHQ-135), which this Jira *blocks*) is also separate; this Jira should land first because it is the smaller, lower-unknown change.

Because the test type is **`manual`**, there are no automated tests to write. Verification is a checklist of manual smoke tests: `pnpm install` succeeds with no `onlyBuiltDependencies` warning, `pnpm validate` passes, `pnpm --version` reports `11.x`, each plugin sub-project installs cleanly under pnpm 11, the dev-CLI install script (`scripts/infra/install-dev-agentic-hq.sh`) still works, the `agentic-hq` CLI is reachable from a fresh terminal, an end-to-end workflow runs, and the "Update available!" nag no longer prints.

## Research Findings

### Latest pnpm 11 patch version

`npm view pnpm version` reports **`11.1.2`** as the latest published version (the Jira, written 2026-05-09, referenced `11.0.9`). The Jira AC explicitly allows for this: *"updated to `pnpm@11.0.9` (or whatever is the latest patch at the time of doing the work)"*. So the plan is to pin **`pnpm@11.1.2`**, generated via `corepack use pnpm@11.1.2` (which rewrites `package.json` with the full `+sha512.…` integrity hash — preserving the existing repo convention of pinning with the hash).

### pnpm 11 breaking/behaviour changes relevant to this repo

The Jira already did this research thoroughly. Cross-checked and summarised:

- **`onlyBuiltDependencies` removed → `allowBuilds` map.** The one mechanical breaking change. Must land in the same change as the version bump or `pnpm install` fails.
- **`strictDepBuilds: true` is now default** — install fails if a package has an un-whitelisted build script. With the `allowBuilds` migration covering our current three packages this is a no-op now, but it will surface loudly rather than silently if a future dependency adds a build script.
- **`minimumReleaseAge: 1440` (24h) is now default** — newly published packages won't resolve for 24h. No effect on this upgrade; only friction if a contributor adds a brand-new package within a day of its publication.
- **`blockExoticSubdeps: true` is now default** — blocks non-registry transitive deps. No effect on current deps.
- **`pnpm link --global` semantics changed** — global installs now go to an isolated per-link directory under `{storeDir}/links`. The dev-CLI install script uses this, so it needs a smoke test, but no code change is anticipated.
- **Node**: pnpm 11 requires Node 22+. The repo is already on `>=22.0.0 <23.0.0` — compatible, no action.

## Plugin Workflow Sub-Projects (`.agentic-hq/plugins/**`)

The Jira's "Current state" section only described the root project, but there are **5 self-contained `ts-workflow` mini-projects** under `.agentic-hq/plugins/**`, each with its own `package.json`. They are excluded from the main workspace (`!.agentic-hq/plugins/**` in `pnpm-workspace.yaml`) and each gets `pnpm install --ignore-workspace`'d when its workflow runs (via the `demo:plugin-direct:*` scripts and the e2e tests):

1. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json`
2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json`
3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`
4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json`
5. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json`

Each currently configures build-script approvals via a `"pnpm": { "onlyBuiltDependencies": [...] }` block in `package.json`, listing `agentic-hq`, `node-pty`, `esbuild`. None of them pins its own `packageManager`, so corepack walks up to the repo root and installs them with **pnpm 11** once the main upgrade lands.

**Why migrating these is required, not optional** — confirmed by Perplexity research (full Q&A: [`additional-docs/perplexity-answer-about-onlyBuiltDependencies.md`](additional-docs/perplexity-answer-about-onlyBuiltDependencies.md)):

- pnpm 11 **no longer reads the `pnpm` field of `package.json` at all** — all project config moved to `pnpm-workspace.yaml`. So `pnpm.onlyBuiltDependencies` in these files becomes **dead config**, silently ignored.
- With `strictDepBuilds: true` now the default, an ignored build-script allow-list means `pnpm install` will **fail** for packages that need to build (`node-pty`, `esbuild`, and the linked `agentic-hq` dep which has a `postinstall`).
- The supported pnpm 11 way to persist `allowBuilds` is `pnpm-workspace.yaml` — there is **no** documented way to keep it in `package.json`. A standalone single-package project therefore needs its **own `pnpm-workspace.yaml`**.

**Planned migration for each of the 5 sub-projects**: remove the dead `"pnpm": { "onlyBuiltDependencies": [...] }` block from `package.json`, and add a `pnpm-workspace.yaml` in the same directory with an `allowBuilds:` map (`agentic-hq: true`, `node-pty: true`, `esbuild: true`). The exact `allowBuilds` package set per project will be confirmed against each `package.json` during implementation.

### Knock-on: `create-workflow` scaffolding must be updated too

The `create-workflow` workflow generates new workflow `ts-workflow` mini-projects. Its build command — `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — does **not** hardcode any pnpm version: Step 1 points the scaffolding agent at `math-workflow/ts-workflow/package.json` as the pattern, and Step 4e tells it to "create `package.json` and `tsconfig.json` following the existing patterns."

- ✅ Because the version isn't hardcoded, once `math-workflow` is migrated the copied `package.json` is automatically pnpm-11-correct.
- ⚠️ But Step 4e (and the Step 1 reference list) name only `package.json` and `tsconfig.json` — **not** `pnpm-workspace.yaml`. After this migration, build-script approval lives in a `pnpm-workspace.yaml` per `ts-workflow` directory, so a newly-scaffolded workflow would be created **without** one and its `pnpm install` would fail under pnpm 11's `strictDepBuilds`.

**Decision (2026-05-15): in scope for AHQ-136.** Command 02 will be updated — Step 4e and the Step 1 reference list amended so the scaffolding agent also creates a `pnpm-workspace.yaml` (with `allowBuilds`) for each new workflow. Without this, the pnpm 11 migration would be complete for today's 5 workflows but every future workflow would be born broken.

**End-to-end verification deferred to [AHQ-143](https://agentic-hq.atlassian.net/browse/AHQ-143).** AHQ-136 makes the Command 02 edit but does **not** itself run `create-workflow` end-to-end to prove a freshly-generated workflow gets a working `pnpm-workspace.yaml`. The human has added a note to AHQ-143 (an "Add Feature" workflow, due within ~1–2 weeks of 2026-05-15) recording that — because AHQ-143 will use the `create-workflow` workflow to scaffold its own new workflow — it should confirm the `pnpm-workspace.yaml` gets created and the workflow runs fine. So within AHQ-136 the verification of this knock-on is limited to **reviewing the Command 02 edit**; the real-world scaffolding test is owned by AHQ-143.

(Out of scope — noted only: `create-workflow`'s `03-run-checks-on-workflow.md` has a hardcoded `typescript@5.9` pin in a `pnpm dlx` call. That is a TypeScript-version concern, not pnpm, and the TypeScript upgrade is explicitly out of scope for this Jira.)

(Not pnpm-version-specific, no change needed: `string-reversal/ts-workflow/.npmrc` contains only `engine-strict=true`. Nothing pnpm-related exists under `.claude`.)

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md` (found at the default location)

The design requirements document is entirely about **object-oriented design** of the codebase: every concept gets a class/interface pair, "tell don't ask", constructor injection, avoiding cached state, a Concept Table and Data Dictionary during design, etc.

**None of this is relevant to AHQ-136.** This Jira introduces no new code, no classes, no concepts — it edits config files (`package.json`, `pnpm-workspace.yaml`, plus the 5 plugin sub-projects) and regenerates lockfiles. There is nothing to model as objects, so the Concept Table / Data Dictionary / English Language Description sections will legitimately be skipped (not omitted by oversight — genuinely not applicable to a config-only change).

## Questions for Human

### Question 1: Should the `engines.pnpm` field also be bumped?

`package.json` currently has:

```json
"engines": {
  "node": ">=22.0.0 <23.0.0",
  "pnpm": ">=10.0.0"
}
```

The Jira's acceptance criteria only mention updating the **`packageManager`** field — they say nothing about `engines.pnpm`. But after this change the repo genuinely *requires* pnpm 11 (the `allowBuilds:` syntax is pnpm-11-only; pnpm 10 wouldn't understand it). Leaving `engines.pnpm` at `>=10.0.0` would be misleading.

I checked the Jira description, AC, "out of scope" section and linked AHQ-135 — none of them mention `engines.pnpm`.

**My recommendation**: bump it to `>=11.0.0` for consistency. It's a one-line change in the same file. Do you agree, or would you prefer to leave `engines.pnpm` untouched to keep the diff strictly matching the AC?

**Human's Response**:
> Yes, bump it.

---

### Question 2: Is updating contributor docs (for `minimumReleaseAge`) in scope?

The Jira's "Risks of upgrading" section says, about the new `minimumReleaseAge: 1440` default:

> *"could surprise a contributor adding a brand-new dependency … Mitigation: documented in the contributor docs"*

However, the **acceptance criteria do not list** any contributor-docs / `CONTRIBUTING.md` update, and the "Out of scope" section doesn't mention it either. So there's an inconsistency between the risk-mitigation note and the authoritative AC list.

**My recommendation**: add a short note to `CONTRIBUTING.md` explaining the 24h `minimumReleaseAge` behaviour and the one-line opt-out — it's cheap and the Jira itself flagged it as the mitigation. But since it's not in the AC, I want to confirm rather than add an undocumented deliverable. In scope, or leave for a separate Jira?

**Human's Response**:
> **Skip — not in scope, no follow-up Jira.** The behaviour is low-probability and low-impact (a contributor would only hit it if they add/update a dependency whose newest version is <24h old, and the symptom is just silently getting a slightly older version). It's not in the AC. The opt-out (`minimumReleaseAge: 0`) is a one-line change addable the day it ever becomes real friction — so no `CONTRIBUTING.md` note and no separate ticket. If it bites someone later, that's the moment to revisit.

---

### Question 3: Who runs the manual smoke tests (esp. the global-state-mutating script)?

Test type is `manual`, so the verification steps are done by hand. Several of them are routine and I can run them as part of the implementation/verify phase:

- `pnpm install`, `pnpm --version`, `pnpm validate`
- confirming no `onlyBuiltDependencies` warning / no "Update available!" nag

But two steps have side effects that reach **outside the project**, and my standing instructions say I must not mutate global machine state without your explicit approval:

- `scripts/infra/install-dev-agentic-hq.sh` runs `pnpm link --global`, which rewrites global pnpm state on your machine.
- The end-to-end smoke test (`agentic-hq reversal …`) makes a real Claude invocation.

**My recommendation**: I run the project-local checks; **you** run the install script + fresh-terminal `agentic-hq` check + the real-workflow smoke test (a fresh terminal is needed anyway to pick up PATH cleanly, which I can't give myself). Does that split work, or would you like me to run the install script too (with your go-ahead at that point)?

**Human's Response**:
> You can run both please, but only when I give you the go-ahead for each, and tell me the result afterwards. Thanks.

---

## Agreed Resolutions

All three questions are resolved:

1. **`engines.pnpm`** → **bump to `>=11.0.0`** (in scope) — a one-line edit alongside the `packageManager` bump.
2. **`minimumReleaseAge` contributor docs** → **out of scope, no follow-up Jira.** No `CONTRIBUTING.md` change.
3. **Manual smoke tests** → the **AI runs both** the dev-CLI install script (`install-dev-agentic-hq.sh`, which does `pnpm link --global`) and the end-to-end workflow smoke test — but **only after the human gives an explicit go-ahead for each**, and the AI reports the result back afterwards.

Also confirmed during discussion: the `create-workflow` Command 02 update is **in scope** for AHQ-136; its end-to-end verification is **owned by [AHQ-143](https://agentic-hq.atlassian.net/browse/AHQ-143)**.

## Files I Reviewed

- `package.json` — confirmed the `packageManager` pin (`pnpm@10.33.0+sha512.…`), the `engines` block (`node >=22 <23`, `pnpm >=10.0.0`), and the `postinstall` `chmod` fix for node-pty's `spawn-helper` (a known pnpm bug — worth keeping an eye on whether pnpm 11's new store layout affects it, though the chmod is platform-guarded and harmless if it no-ops).
- `pnpm-workspace.yaml` — confirmed the exact `onlyBuiltDependencies:` list (`node-pty`, `esbuild`, `unrs-resolver`) and the doc-comment block above it (lines 1–20) that references "pnpm 10.x" and the socket.dev pnpm-10.0.0 article. Both need migrating.
- `scripts/infra/install-dev-agentic-hq.sh` — confirmed it uses `pnpm link --global` (line 44) and already documents the "this is smelly" global-state caveat. This is the script the `pnpm link --global` smoke test exercises.
- The 5 plugin `ts-workflow` `package.json` files under `.agentic-hq/plugins/**` — confirmed each carries a `"pnpm": { "onlyBuiltDependencies": [...] }` block (`agentic-hq`, `node-pty`, `esbuild`) and none pins its own `packageManager`. See the "Plugin Workflow Sub-Projects" section above.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.npmrc` — checked; contains only `engine-strict=true`, not pnpm-version-specific, no change needed.
- `create-workflow` skill — `SKILL.md` and `ts-workflow/src/create-workflow-cli.ts` confirm it orchestrates 5 commands; the actual scaffolding happens in command 02.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — the build command. Step 4e creates a new workflow's `package.json`/`tsconfig.json` by copying the `math-workflow` pattern; needs updating to also scaffold `pnpm-workspace.yaml` (see "Knock-on" above). `03-run-checks-on-workflow.md` skimmed — has a `typescript@5.9` `pnpm dlx` pin (TS concern, out of scope).
- `docs/dev/project-design-requirements.md` — read in full; confirmed it's about OO code design and not applicable to this config-only Jira.
- `docs/jira-docs/AHQ-136/workflow-files/additional-docs/perplexity-answer-about-onlyBuiltDependencies.md` — Perplexity research confirming pnpm 11 stops reading `package.json#pnpm` entirely; drives the sub-project migration plan.

**Most important findings**: The change is config files plus regenerated lockfiles — no production code. Three real points of attention: (1) the 5 plugin sub-projects **must** be migrated to per-directory `pnpm-workspace.yaml` files or their installs break under pnpm 11 (`strictDepBuilds` + dead `package.json#pnpm` config); (2) `create-workflow`'s Command 02 must be updated to scaffold a `pnpm-workspace.yaml`, or every future workflow is born broken; (3) whether pnpm 11's changed `pnpm link --global` semantics break the dev-CLI install script — hence the smoke test. `node-pty`'s `postinstall` chmod fix is worth a glance post-upgrade but is not expected to need changes.

## Test Types And Tests We Will Be Implementing

**Test types: `manual`** (the only test type — no automated tests; `test-type = manual` is specified in the Jira description).

There are no unit/integration/smoke/e2e automated tests for this Jira — it is a config-only package-manager upgrade and the Jira explicitly specifies `manual`. The "implementation" the AI will do (in the GREEN phase) is the config-file edits (main project + 5 plugin sub-projects), the `create-workflow` Command 02 update, and lockfile regeneration. The **manual verification steps** the human (and AI, per Q3) will perform:

1. **`pnpm install` clean** — runs under pnpm 11 (corepack auto-fetches it), regenerates `pnpm-lock.yaml`, and prints **no** warning about `onlyBuiltDependencies` being unknown/removed and **no** "package X has a build script" error.
2. **`pnpm --version` reports `11.x`** (specifically `11.1.2`), not `10.x`.
3. **`pnpm validate` passes** — typecheck + lint:check + format:check + unit tests, 100%.
4. **Each plugin sub-project installs cleanly under pnpm 11** — the 5 `ts-workflow` projects each `pnpm install --ignore-workspace` successfully with their new per-directory `pnpm-workspace.yaml`, building `node-pty`/`esbuild` with no `strictDepBuilds` failure. Exercised in practice by running the workflows / e2e suite (step 7).
5. **No "Update available!" nag** — run a workflow and confirm the `10.33.0 → 11.x` banner no longer appears in the output.
6. **Dev-CLI install script** — `scripts/infra/install-dev-agentic-hq.sh` re-runs successfully under pnpm 11's new global-link layout.
7. **`agentic-hq` CLI reachable + end-to-end workflow smoke test** — from a *fresh terminal* in *any* directory, `agentic-hq list` works, and `agentic-hq reversal -- --string-to-reverse="upgrade smoke test"` produces the expected reversed output (this also installs the `string-reversal` sub-project under pnpm 11).
8. **Doc-comment check** — the migrated root `pnpm-workspace.yaml` doc-comment references pnpm 11, not pnpm 10.
9. **`create-workflow` Command 02 update** — verify the edited `02-confirm-spec-approved-and-build.md` now instructs the scaffolding agent to create a `pnpm-workspace.yaml` for new workflows. Full end-to-end verification (running `create-workflow` and confirming a generated workflow gets a working `pnpm-workspace.yaml`) is **owned by [AHQ-143](https://agentic-hq.atlassian.net/browse/AHQ-143)**, not AHQ-136 — the human has noted this on that ticket. So within AHQ-136 this step is just a review of the Command 02 edit.

If step 6/7 reveals the `pnpm link --global` semantics needed a script tweak, that tweak (and a comment explaining it) is itself a deliverable per the AC.

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.
