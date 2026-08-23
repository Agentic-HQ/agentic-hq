# Prompt For Fable — AHQ-205 Research And Plan (fresh start)

> Paste the section below into a new Fable session. Everything it references is in this repo.

---

Please research [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) (read it directly via the
Atlassian MCP) and write a **new** research document and plan of action to
`docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md`.

## Context you must read first

| File | Why |
| --- | --- |
| `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` | Parent story. Read the § *Split Suggestion* entry for Sub-Task 6, and § *Open Sub-Task Instructions → Sub-Task 6*, which carries two instructions specific to this ticket. |
| `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md` | The full bug description as filed. |
| `docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN` | A previous attempt. **§1–§5 are verified and reusable. §6 and §7 are wrong — see the banner at the top.** |
| `docs/tickets/AHQ-205/workflow-files/supporting-docs/bad-coding-conversation-with-Opus.md` | Post-mortem of why that attempt went wrong. Worth reading so you don't repeat it. |

## What has already been established (verified — reuse, don't redo)

**The bug reproduces four ways** (all run 2026-08-16, macOS, Node 24.15.0). Fixtures are still on
disk under `temp/AHQ-205/` (gitignored) — see the Appendix of the superseded doc for what each one
is:

1. Prebuilt package run from the repo clone root — reproduces the filed stack trace line for line.
2. Any local workspace defining a workflow with a colliding `shortId` — plugin names need not match.
3. **Not in the Jira:** two plugins inside *one* workspace sharing a `shortId`.
4. **Not in the Jira:** a workflow whose `shortId` is `list`, colliding with the built-in subcommand.
   (`help` is **not** reserved — tested; Commander's implicit help is not a registered command.)

**A second, quieter defect was found:** Claude Code silently collapses two `--plugin-dir` flags that
name the same plugin, and **the first flag wins** (probed directly, both orderings). Since
`ClaudeCommandBuilder.getClaudeCliPluginDirArgs()` lists the AHQ package's plugin dirs first, any
"local workspace wins" policy is a lie in the repo-clone case unless that ordering is flipped too.

**Path normalisation** (one of the two carried Sub-Task 6 instructions): symlinked invocation is
clean — no defect, `process.cwd()` and `__dirname` both resolve physically. A trailing slash on
`--ahq-package-root` *does* break `WorkspaceImpl.isAhqPackage()`, but is unreachable through the
shipped bin wrappers, which build the value with `path.join`.

## Decisions the human has already made — these are settled, do not re-open

1. **Precedence: the local working directory wins**; the AHQ package comes second.
2. **The listing keeps its current structure exactly.** Same blocks, same order, same layout.
3. **Duplicates are shown exactly as they are shown now, with a red bold flag in front**, along the
   lines of `DISABLED — shortId 'add-feature' is already used by existing workflow`. Deliberately
   *not* naming what is blocking it — the loser needs no knowledge of the winner, which keeps the
   implementation simple.
4. **Nobody is using this product yet** (nothing cloned or installed by anyone else), so there is no
   backwards compatibility to preserve. The human's explicit instruction: *"whatever is quickest and
   easiest and makes the bug go away completely."* This is not a ticket that wants a re-architecture.

## Where the conversation landed on implementation — verify it independently

The conclusion reached was: **roughly six lines inside the existing
`src/cli/workflow-registry-impl.ts`, with no new classes.** That class already wraps Commander and
already owns turning discovered workflows into subcommands; a name that is already taken is
registration's own failure case, not a separate concern. Commander's `program.commands` is already
the keyed table (and is already read that way in that class's own unit test), and the built-in `list`
is registered before workflows, so reserving it costs nothing.

**Do not take that on trust.** Read the code and reach your own conclusion — but if you propose
anything larger, justify why the existing class cannot own it.

A useful review lever from the post-mortem, since this repo has an abstraction for nearly every
domain concept and that pull is strong: **does a proposed new class name a *thing* in the domain, or
a *step* in an algorithm?** Every existing abstraction here (`Workspace`, `Plugin`, `AhqWorkflow`,
`WorkflowShortName`, `AhqPackageRoot`, `BuildMode`) names a thing. If the candidate names a step, it
is probably a method or a guard clause on something that already exists. The project's own
`feedback_no_er_suffix_classes` rule is the same principle.

## Also carry forward

- **The second Sub-Task 6 instruction:** verify AHQ-200's AC 5 at runtime — confirm Command 01's
  `command-input.json` reads `ahq-package-root=…`. The static half is done (the add-feature CLI
  broadcast, `SKILL.md`, and all four `commands/add-feature/0?-*.md` parsers all use the new name,
  with no `agentic-hq-workspace-root-dir` remaining); only the runtime check is outstanding.
- **Known test-suite hazard:** `publish-guards.integration.test.ts` and
  `build-determinism.integration.test.ts` both stage into `release/` and contend when the suite runs
  together. Don't add a third test that races on `release/`.
- **Out of scope:** publishing (AHQ-201 owns the next re-publish), migrating the five unmigrated
  workflows (AHQ-201), and splitting the `Workspace` interface (already filed as AHQ-206).

## What to produce

A research document and plan at
`docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md` covering: what the defect is
and where it lives (with `file:line` references), your implementation plan as TDD cycles
(RED → GREEN → REFACTOR → VERIFY, per this repo's CLAUDE.md), the test list, and anything you think
the human still needs to decide. Keep the plan proportionate to the fix — if it is a small change,
the plan should read like a small change.
