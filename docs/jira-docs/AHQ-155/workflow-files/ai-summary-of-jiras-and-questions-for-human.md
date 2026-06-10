# AI Summary: AHQ-155

**Jira**: [AHQ-155](https://agentic-hq.atlassian.net/browse/AHQ-155)
**Title**: Rename add-feature Workflow To add-feature-detailed-example
**Status**: Already In Progress (transition was a no-op); assigned to Steve Halso; start comment added
**Generated**: 2026-06-10 18:31

---

## My Understanding of This Task

The current seven-agent `add-feature` workflow (Ticket Creator → Interrogator → Planner → Executor → Refactoring Planner → Refactoring Executor → Validator) is being **renamed** to `add-feature-detailed-example`, and all of its self-descriptions/framing need to be **reworded** to match its new role. The driver (from the two AHQ-157 chat docs I read in full) is a launch-strategy pivot: the plain `add-feature` name will be freed up for a new, simpler four-agent flagship workflow (built separately under AHQ-157, **out of scope here**). The current heavy, opinionated workflow should no longer present itself as "the" add-feature workflow or the recommended path — it should be billed as a **worked example of a deeply customised, opinionated workflow that encodes one creator's personal development process**, useful primarily as a showcase of how far an AHQ workflow can go, not as something most developers should adopt directly.

So this Jira is two intertwined things: (1) a mechanical **rename** of the identifier `add-feature` → `add-feature-detailed-example` everywhere it appears as the workflow's name (so `agentic-hq add-feature-detailed-example` is what runs it, and the chained slash-commands resolve), and (2) a **reframing** of the prose descriptions so the docs/help/`list` entry stop implying it's the default and instead present it as a detailed example, pointing users toward the simple `add-feature` and `create-workflow --using=add-feature` (both delivered by other Jiras).

**Scope is tightly bounded.** In scope: the workflow's own command files, skill files (`ahq-workflow.json`, `SKILL.md`, the `ts-workflow` CLI + `package.json`), and the docs **bundled with the skill** (its `docs/` directory). Plus one external referrer that points a path at this workflow (the `create-workflow` build command). **Out of scope** (per the Jira): `README.md`, the repo-level `docs/**` tree (handled by AHQ-158), the new simple `add-feature` workflow (AHQ-157), and historical/generated records of the work that created this workflow (the `.agentic-hq/temp/**` artifacts and `docs/artifacts/**`).

**Coordination note:** AHQ-157's new simple `add-feature` does **not** yet exist in this branch's working tree (I checked — only the seven-agent workflow is present, and `agentic-hq list` shows a single `add-feature`). So after this rename the `add-feature` name/namespace becomes free, ready for AHQ-157 to populate later. Nothing in this Jira creates it.

## Research Findings

No external/web research was required — this is an internal rename + documentation-reframing task. The two source docs named in the Jira fully specify the intent, the new name, and even the exact `list` description wording. My "research" was the codebase audit below.

### Complete audit of `add-feature` references

I searched the whole repo (excluding `node_modules`). 37 files mention `add-feature`/`Add Feature`. Classified:

**IN SCOPE — the rename target (the workflow itself):**

- `.../skills/add-feature/` directory (rename the directory) containing:
  - `ahq-workflow.json` — `skillId`, `shortId`, `description`, `exampleParameters`
  - `SKILL.md` — description front-matter + the output command string (path to the CLI file)
  - `ts-workflow/src/add-feature-cli.ts` — the 7 chained slash-command constants (`/agentic-hq-demos-plugin:add-feature:0X-...`), commander `.name()`/`.description()`, and the header comment
  - `ts-workflow/package.json` — `name` field + `demo:add-feature` script
  - `ts-workflow/.npmrc`, `tsconfig.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` — ride along with the directory rename; no name references inside (confirmed)
  - `docs/workflow-help-docs/00-add-feature-workflow-user-help-doc.md` (+ `01`–`07` agent help docs)
  - `docs/developer-help-docs/developer-help-doc.md`
  - `resources/templates/{refactoring-execution,refactoring-plan,split-feature,unsplit-feature,validator-summary}.TEMPLATE.md` — **5 files that contain no literal `add-feature` string** (so my text-grep didn't flag them) but live inside the skill directory and therefore **move with the rename**. Verified: their content has no workflow-name reference, so they need no text edits — but the plan must include moving them and confirming nothing inside needs rewording.
- `.../commands/add-feature/` directory (rename the directory) containing the 7 command files `01-ticket-creator.md` … `07-validator.md` (each opens "You are executing Command 0X of the **Add Feature workflow**")

**IN SCOPE — external referrer (one file):**

- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — line 155 hard-codes the path `.../commands/add-feature/03-planner.md` as a "worked example" to read. Renaming the directory **breaks this path**, so it must be repointed. (See Question 2.)

**Audit completeness cross-checked against PR #35 (AHQ-143):** I compared my grep-based audit against the full file list of the PR that created this workflow. It confirmed two things: (1) the complete skill footprint — which surfaced the `resources/templates/` files above that a pure text-grep misses — and (2) that although PR #35 also modified `create-workflow/01-explain-…md`, that file contains **no** `add-feature` reference (it was changed for unrelated reasons in that PR), so the **only** external referrer remains the single `02-confirm-…md` line-155 path. Audit is complete.

**OUT OF SCOPE (confirmed, no action):**

- All `docs/**` matches: `docs/artifacts/workflow-creation-artifacts/...` (historical creation artifacts) and `docs/jira-docs/...` (AHQ-136/143/152/157 records). Excluded by the Jira (docs/* + historical records).
- All `.agentic-hq/temp/**` matches (command-input/output JSON, git-diffs, git-statuses, git-new-files-list) — generated/historical.
- Root `.claude-plugin/marketplace.json` — checked, **no** `add-feature` reference.
- `src/**` and `tests/**` — checked, **no** references at all (the engine discovers workflows dynamically; nothing hard-codes this workflow's name). This means **no production TypeScript or test changes are needed** for the rename.

### Mechanics worth noting (for the plan, not blocking)

- **Workflow discovery is dynamic** — the plugin `plugin.json` does not enumerate skills, so renaming the skill/command directories is sufficient for `agentic-hq list` to pick up the new name (via `shortId` in `ahq-workflow.json`).
- **The chained slash-commands are namespaced by the command directory name.** `add-feature-cli.ts` calls `/agentic-hq-demos-plugin:add-feature:01-ticket-creator` etc. Renaming `commands/add-feature/` → `commands/add-feature-detailed-example/` requires updating those 7 constants in lockstep or the chain breaks at runtime. (Unit tests won't catch this — only running it will; hence the manual test.)
- **`ts-workflow` has an installed `node_modules`** with `agentic-hq` linked via `link:../../../../../..` (6 levels up). Renaming the skill directory keeps it at the same depth, so the relative link stays valid; `SKILL.md` re-runs `pnpm install` on each run anyway.
- **The exact new `list` description is already specified** in the source doc, so I won't be inventing wording:
  > `agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123`
  > Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md` (found at the default location)

This document is almost entirely about **code** design — how to map concepts to interfaces/classes, state handling, data-dictionary/English-Language-Description during design, "-er" suffix avoidance, etc. This Jira adds **no new production code** (it edits string constants in one existing CLI file and rewrites Markdown prose). So the bulk of the document does not apply.

The only loosely-relevant principles:

- **Naming consistency / no drift** — the rename must be applied consistently across every in-scope file so there is no half-renamed state (broken slash-command chain, stale `list` entry, dangling path reference). This is the core risk of the task and is covered by the audit above.

No design requirement is challenging to meet given the scope. The compliance sections in later phases will be light because there is no design/data-modelling work here.

## Questions for Human

I validated each question against the Jira, the two AHQ-157 source docs, and the codebase. The new name, the `list` description wording, the out-of-scope boundaries, and the test type are all already specified, so I'm **not** asking about those. Two genuine decisions remain that the source docs leave open.

### Question 1: How deep should the rename of *internal* identifiers go?

The **user-visible** name must change — that's not in question: the skill `shortId`, the command-directory namespace (so the chained slash-commands resolve), and all prose descriptions/framing all become `add-feature-detailed-example`.

But several identifiers are **internal** (never seen by an end user running `agentic-hq add-feature-detailed-example`), and the Jira's "everything that needs updating" leaves their depth open:

- the CLI source filename `add-feature-cli.ts`
- the commander program `.name('add-feature-cli')`
- the `ts-workflow/package.json` `name` (`agentic-hq-demo-add-feature-workflow`) and the `demo:add-feature` npm script
- the bundled help-doc **filenames** that embed the old name (e.g. `00-add-feature-workflow-user-help-doc.md`)

**Option A — Full rename (my recommendation):** rename these too (`add-feature-detailed-example-cli.ts`, `demo:add-feature-detailed-example`, help-doc filenames, etc.) so the whole workflow is internally consistent and there's no lingering `add-feature` that could later collide/confuse once AHQ-157 creates the *new* `add-feature`. Cost: longer names, a slightly bigger diff, and a couple of cross-references to keep in sync (`SKILL.md` → CLI path).

**Option B — Minimal rename:** change only what's user-visible (`shortId`, command-dir namespace + the 7 CLI command constants, descriptions/framing, and the slash-command-derived bits), and leave internal filenames/package-name/script as `add-feature-*`. Cost: a half-renamed internal surface, but a smaller, lower-risk diff.

Which do you want?

**Human's Response**:
> A

**Agreed:** Option A — **full rename**. In addition to the user-visible surface, also rename the internal identifiers so nothing `add-feature-*` lingers:
- CLI source file `add-feature-cli.ts` → `add-feature-detailed-example-cli.ts` (and update the `SKILL.md` output command-string path that points at it)
- commander `.name('add-feature-cli')` → `add-feature-detailed-example-cli`
- `ts-workflow/package.json` `name` (`agentic-hq-demo-add-feature-workflow` → `…-add-feature-detailed-example-workflow`) and the `demo:add-feature` script → `demo:add-feature-detailed-example`
- bundled help-doc filenames embedding the old name (e.g. `00-add-feature-workflow-user-help-doc.md` → `00-add-feature-detailed-example-workflow-user-help-doc.md`) and any in-doc cross-links to them
- internal command H1s ("Command 0X of the **Add Feature workflow**" → "**Add Feature Detailed Example workflow**")

Rationale: keep the `add-feature` name/namespace completely free so AHQ-157's new simple workflow can claim it with zero collision risk.

---

### Question 2: Where should the `create-workflow` "worked example" reference point after the rename?

`create-workflow/02-confirm-spec-approved-and-build.md` (line 155) tells the workflow-builder agent to read `.../commands/add-feature/03-planner.md` as a complete, real example of a well-written "Intro To Give The Agent Context" section. Renaming the directory breaks that path, so it **must** be updated to something valid.

My recommendation: **repoint it to `.../commands/add-feature-detailed-example/03-planner.md`** — that *is* the file with the rich worked-example Intro the reference is praising, and it stays valid immediately. (The future simple `add-feature` planner from AHQ-157 will be deliberately lighter, so it would be a weaker example anyway.)

The only reason to do otherwise would be if you'd prefer the create-workflow example to eventually track the *new* simple `add-feature` — but that workflow doesn't exist yet, so that can't be done in this Jira regardless.

Do you agree I should just repoint the path to the renamed `add-feature-detailed-example/03-planner.md`?

**Human's Response**:
> Yes

**Agreed:** repoint the line-155 path to `.../commands/add-feature-detailed-example/03-planner.md`.

---

## Files I Reviewed

- `docs/jira-docs/AHQ-157/01-initial-chats/01-codex-report-on-what-im-doing-wrong-etc.md` — the Codex report; established **why** the rename is happening (launch pivot: simple flagship vs. opinionated detailed example) and the final naming decision (`add-feature-detailed-example`, not `add-feature-opinionated`).
- `docs/jira-docs/AHQ-157/01-initial-chats/02-codex-new-simple-add-feature-workflow.md` — the shape/positioning doc; gave the exact `list` description wording and the framing language ("worked example of a heavily customised workflow… most users should start with the simple add-feature workflow").
- `.../skills/add-feature/ahq-workflow.json` — the registration record: `shortId`/`description`/`exampleParameters` that drive `agentic-hq list`. Primary rename target.
- `.../skills/add-feature/SKILL.md` — returns the shell command that runs the CLI; references the CLI file path.
- `.../skills/add-feature/ts-workflow/src/add-feature-cli.ts` — the orchestrator: 7 hard-coded slash-command constants that must stay in lockstep with the command-directory name.
- `.../skills/add-feature/ts-workflow/package.json` — `name` + `demo:add-feature` script; confirmed the `link:` dependency depth is rename-safe.
- `.../commands/add-feature/01-ticket-creator.md` … `07-validator.md` — each opens "Command 0X of the **Add Feature workflow**"; the framing prose lives here too.
- `.../skills/add-feature/docs/workflow-help-docs/00-add-feature-workflow-user-help-doc.md` — the main user-facing framing ("This is the main user help doc… issue-tracker-agnostic descendant…") that must be reworded to the detailed-example framing.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — the one external referrer (line 155 path) that breaks on rename.
- `.claude-plugin/marketplace.json`, `src/**`, `tests/**`, plugin `plugin.json` — checked and **clear** (no references / dynamic discovery), which is why the rename touches no production code or tests.

**Most important findings:** the rename is well-isolated (no `src`/`tests`/marketplace impact), the only fragile coupling is the 7 slash-command constants ↔ command-directory name (runtime-only failure, so manual test matters), the new `list` description is pre-specified, and there's exactly one external referrer to fix.

## Test Types And Tests We Will Be Implementing

**Test types: `manual`** (the only type specified in the Jira: `test-type: manual`).

There are no automated tests to add — this is a rename + documentation reframing with no new production logic, and `src`/`tests` contain no references to the workflow name. The Jira explicitly states: *"The human will run the first couple of stages of the workflow to test it runs and read the docs. No other testing required."*

**Manual testing steps the human will perform (after implementation):**

1. Run `agentic-hq list` and confirm the workflow now appears as `add-feature-detailed-example` with the new "Worked example of a detailed, opinionated seven-stage…" description, and that there is no stale `add-feature` entry.
2. Start the workflow: `agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-XXX` and confirm it launches and that **Command 01 (Ticket Creator) → Command 02 (Interrogator)** run and chain correctly (this is what proves the 7 renamed slash-command constants resolve — the thing unit tests can't catch).
3. Read the bundled help docs (`00-…-user-help-doc.md` and a couple of agent docs) and confirm the framing now reads as a *detailed example* (not the recommended default) and points to the simple `add-feature` / `create-workflow --using=add-feature` paths.

**AI-side verification before handing to the human (in the GREEN/REFACTOR phases):** run `agentic-hq list` to confirm the new entry; typecheck the `ts-workflow` (`tsc -p .../ts-workflow/tsconfig.json --noEmit`) to confirm the edited CLI still compiles; and grep the in-scope tree to confirm no stale `add-feature` identifier remains except where intended.

## Ready for Next Step

All questions resolved (Q1 → full rename; Q2 → repoint to `add-feature-detailed-example/03-planner.md`). Test type confirmed: **manual**. This summary is complete.
