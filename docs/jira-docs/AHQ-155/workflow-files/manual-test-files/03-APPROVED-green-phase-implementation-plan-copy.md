# GREEN Phase Plan — AHQ-155: Rename `add-feature` → `add-feature-detailed-example` (manual test)

## Context

The current seven-agent `add-feature` workflow is being **renamed** to `add-feature-detailed-example`
and **reframed** so it no longer presents itself as the recommended default. This frees the `add-feature`
name for a new, simpler four-agent flagship workflow (AHQ-157, out of scope here) and rebills the heavy
workflow as a *worked example* of a deeply customised, opinionated workflow.

This is the **GREEN phase**, but the test type is **manual** — the "test" is the human running the first
two workflow stages and reading the docs. Because a *partial* rename leaves the workflow broken/inconsistent
(broken slash-command chain, broken `current-workflow-id` paths, dangling help-doc links), the minimum that
makes the manual test pass is the **complete, consistent rename** the human already approved in Q1 (Option A,
full rename) and Q2 (repoint the one external referrer). No new production logic; this is string/path/prose edits
plus four `mv` renames.

**Approach note (scope honesty):** the manual test only exercises stages 01→02, but I am renaming **all** of
01–07 + the CLI + skill assets. Shipping a half-rename (only 01/02) would knowingly break stages 03–07 — that
violates "don't fix by half-doing" and contradicts the Jira's "complete audit + full rename" agreement. This is
called out so the human can object during plan review if they'd prefer a narrower change.

---

## Jira Requirements (Numbered)

1. Rename the workflow `add-feature` → `add-feature-detailed-example` everywhere it is the workflow's name → [Steps 1–8]
2. Update the workflow's **description/framing** to its new role (detailed worked example, not the default) → [Step 2 (list desc), Step 7 (help docs), Step 5 (CLI desc)]
3. **Out of scope** — `README.md`, repo-level `docs/**` tree (AHQ-158) → N/A (untouched)
4. **Out of scope** — the new simple `add-feature` workflow (AHQ-157) → N/A (not created here)
5. **Out of scope** — historical/generated records (`docs/artifacts/**`, `.agentic-hq/temp/**`, `docs/jira-docs/**`) → N/A (untouched)
6. In scope: the workflow's own command files, skill files (`ahq-workflow.json`, `SKILL.md`, CLI + `package.json`), and **bundled** docs (skill `docs/`) → [Steps 1–7]
7. In scope: the one external referrer that points a path at this workflow (`create-workflow/02-…`) → [Step 8]
8. Q1 (agreed: **Option A full rename**) — also rename internal identifiers: CLI filename, commander `.name()`, package `name` + `demo:` script, the one help-doc filename embedding the name, internal command H1s → [Steps 1, 4, 5, 6]
9. Q2 (agreed) — repoint `create-workflow/02` line 155 to `add-feature-detailed-example/03-planner.md` → [Step 8]
10. **Testing: `test-type: manual`** — human runs first two stages + reads docs; no automated tests → [Step 10 / handoff; no test files created]
11. New `list` description wording is pre-specified in the AHQ-157 source doc → [Step 2]

## Project Design Requirements Compliance

`docs/dev/project-design-requirements.md` is almost entirely about **code** design (concept→interface/class
mapping, state handling, data dictionary, "-er" suffix avoidance, etc.). This Jira adds **no new production
code** — it edits string constants in one existing CLI file and rewrites Markdown/JSON prose.

| # | Design Requirement | Plan Section | Notes |
|---|---|---|---|
| D.1 | Concept→class/interface pairs, data dictionary, English-Language-Description | N/A | No new domain concepts/classes introduced; pure rename. |
| D.2 | Tell-don't-ask, minimal state, switchable concretes | N/A | No new behaviour/objects. |
| D.3 | Naming consistency / no drift | Steps 1–9 (whole plan) | **The core risk.** Rename must be applied in lockstep so there is no half-renamed state (broken slash-chain, stale `list` entry, dangling `current-workflow-id` path, dead help-doc link). The verification step (Step 9) grep-confirms no stale `add-feature` identifier remains except intended pointers to the *simple* workflow. |

No design requirement is challenging given the scope; the only relevant one (no-drift) is the whole point of the task.

---

## Step 0 — Save the approved plan (FIRST, before any other change)

Copy this approved plan to:
`docs/jira-docs/AHQ-155/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

---

## Step 1 — Directory & file renames (plain `mv`, so git detects renames at commit time; not `git mv`)

Base: `.agentic-hq/plugins/agentic-hq-demos-plugin/`

1a. `skills/add-feature/` → `skills/add-feature-detailed-example/`
1b. `commands/add-feature/` → `commands/add-feature-detailed-example/`
1c. `…/skills/add-feature-detailed-example/ts-workflow/src/add-feature-cli.ts` → `…/add-feature-detailed-example-cli.ts`
1d. `…/skills/add-feature-detailed-example/docs/workflow-help-docs/00-add-feature-workflow-user-help-doc.md` → `…/00-add-feature-detailed-example-workflow-user-help-doc.md`

(The `ts-workflow/node_modules` symlink `agentic-hq → link:../../../../../..` stays valid — rename keeps the same path depth. Only `00-…` embeds the name among help docs; `01–07-…-help-doc.md` do not, so they are NOT renamed.)

## Step 2 — `skills/.../ahq-workflow.json`

- `skillId`: `add-feature` → `add-feature-detailed-example` (must match the renamed skill dir)
- `shortId`: `add-feature` → `add-feature-detailed-example` (drives the `agentic-hq list` name)
- `description`: → `Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process` (pre-specified wording)
- `exampleParameters`: **unchanged** (`-- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123`)

## Step 3 — `skills/.../SKILL.md`

- Line 2 `description:` front-matter — `add-feature` → `add-feature-detailed-example`
- The `command-output-string` tsx target path — `…/src/add-feature-cli.ts` → `…/src/add-feature-detailed-example-cli.ts`

## Step 4 — `skills/.../ts-workflow/package.json`

- `name`: `agentic-hq-demo-add-feature-workflow` → `agentic-hq-demo-add-feature-detailed-example-workflow`
- script key `demo:add-feature` → `demo:add-feature-detailed-example`; value `tsx src/add-feature-cli.ts` → `tsx src/add-feature-detailed-example-cli.ts`

## Step 5 — CLI `…/src/add-feature-detailed-example-cli.ts`

- Header block comment: reword `CLI: Add Feature —` framing to the detailed-example role (keep the existing AHQ-143 link / mechanics description)
- The **7 chained slash-command constants** `/agentic-hq-demos-plugin:add-feature:0X-…` → `/agentic-hq-demos-plugin:add-feature-detailed-example:0X-…` (lockstep with the Step 1b command-dir rename — this is the runtime-fragile coupling the manual test exists to catch)
- `.name('add-feature-cli')` → `.name('add-feature-detailed-example-cli')`
- `.description(...)` → reword to detailed-example framing

## Step 6 — Command files `commands/add-feature-detailed-example/01-…07-…md` (the same pattern in each of the 7)

- **H1**: `Command 0X of the Add Feature workflow` → `Command 0X of the Add Feature Detailed Example workflow`
- **Intro prose**: every `Add Feature workflow` → `Add Feature Detailed Example workflow` (name change conveys "example"; no positioning paragraph injected into command Intros — the framing lives in the help docs to avoid per-agent bloat at `verbosity=low`)
- **Variable** `current-workflow-id = add-feature` → `add-feature-detailed-example` (**critical path mechanic** — feeds `current-workflow-skills-dir = …/skills/{current-workflow-id}`; wrong value = agent can't find its skill docs/templates at runtime)
- **Help-doc variable**: rename the key `add-feature-workflow-user-help-doc` → `add-feature-detailed-example-workflow-user-help-doc` (and all `{…}` usages of it in that file), and update its value to the renamed `00-add-feature-detailed-example-workflow-user-help-doc.md` (Option A: nothing `add-feature-*` lingers)
- **Prose instructions to re-run the workflow** ("run the add-feature workflow on it", "a dedicated `add-feature` run", "the add-feature chain/workflow is finished/complete", etc.) → `add-feature-detailed-example` (these refer to re-running *this* workflow)

## Step 7 — Bundled help docs `skills/.../docs/`

- **`00-…-detailed-example-…-user-help-doc.md`** (renamed in 1d): retitle H1; reframe the opening so it reads as a **detailed worked example, not the default**, using the pre-specified phrasing:
  > "The detailed example add-feature workflow is included as a worked example of a heavily customized development workflow. It is intentionally opinionated around the creator's own process. Most users should start with the simple add-feature workflow, then customize that workflow to fit their own process."
  …and add pointers to the simple `add-feature` and `create-workflow --using=add-feature` paths. Update the example command (line 47) `agentic-hq add-feature -- …` → `agentic-hq add-feature-detailed-example -- …`. (These pointers deliberately keep the bare `add-feature` name — they reference the *future simple* workflow, not this one.)
- **`01–07-…-help-doc.md`** + **`developer-help-docs/developer-help-doc.md`**: name references `add-feature workflow` → `add-feature-detailed-example workflow`; update the cross-link filename to the renamed `00-…` doc; the "dedicated `add-feature` run" reference → `add-feature-detailed-example`.

## Step 8 — External referrer (one file, one line)

`.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
line 155: path `…/commands/add-feature/03-planner.md` → `…/commands/add-feature-detailed-example/03-planner.md`

## Step 9 — AI-side verification (before handing to the human)

1. `cd …/skills/add-feature-detailed-example/ts-workflow && pnpm install` (re-link), then
   `node_modules/.bin/tsc -p tsconfig.json --noEmit` — confirm the edited/renamed CLI still compiles.
2. `agentic-hq list` — confirm the entry now shows `add-feature-detailed-example` with the new description and **no stale `add-feature` entry**.
3. Grep the in-scope tree for residual `add-feature` identifiers; confirm the only remaining bare `add-feature` strings are the **intended** pointers to the simple workflow / `create-workflow --using=add-feature` (and not stray un-renamed references).

## Step 10 — Re-read the command file for the rest of the workflow

**TODO after Step 9:** re-read this command file (`03-jira-minimal-implementation`) for the remaining steps —
manual-test handoff to the human (Step 7 of the command: this is `test-type: manual`, so I STOP and ask the
human to run the first two stages + read the docs and confirm), then write the GREEN-phase summary doc, add the
Jira comment, write `command-output.json`, and self-terminate. (Not copying those instructions here to avoid
missing details.)

---

## Verification (end-to-end, summary)

- **Compiles:** `tsc --noEmit` on the renamed CLI passes.
- **Discovery:** `agentic-hq list` shows the renamed workflow + new description, no stale entry.
- **Runtime chain (human, manual test):** `agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-XXX` launches and Command 01→02 chain resolves (proves the 7 renamed slash-constants + command-dir + `current-workflow-id` are all in lockstep).
- **Docs (human, manual test):** `00-…` + a couple of agent docs read as a *detailed example* and point to the simple `add-feature` / `create-workflow --using=add-feature`.
- **No drift:** grep confirms no unintended `add-feature` identifier remains.
