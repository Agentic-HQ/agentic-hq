# GREEN Phase Implementation Plan: AHQ-99 (Create Workflow Creation Workflow)

## Context

AHQ-99 asks us to create a **meta-workflow** — a workflow that guides a human through creating a new Agentic HQ workflow. It's a simple linear 5-command workflow (no loops/branching) that lives in `agentic-hq-core-plugin`. The workflow follows the same patterns as the existing `full-jira-tdd-story-workflow` and `math-workflow` demos.

This is the GREEN phase (manual test type) — no automated tests, the human will manually test the result.

---

## Jira Requirements (Numbered)

1. Workflow guides through creating a new AHQ workflow → [All command files]
2. Simple linear step-by-step, no conditional loops → [Step 3: CLI orchestrator]
3. 5 commands as specified in Jira → [Steps 4-8: Command files]
4. Lives in `agentic-hq-core-plugin` (Q&A #1) → [All steps: core plugin paths]
5. Short name: `create-workflow` (Q&A #3) → [Step 9: Skill registration]
6. `plugin-id` and `workflow-id` passed between commands (updated from Q&A #4) → [Step 3: CLI + all commands, Common Variable Chain]
7. `workflow-creation-docs-dir={project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}` → [All command variable blocks]
8. Command 01: Explain workflows, read README + demo math workflow, get workflow-id + one-sentence-description, create DRAFT-workflow-spec.md with back-and-forth, output workflow-id → [Step 4]
9. Command 02: Read all context, confirm DRAFT spec, rename DRAFT→APPROVED, Plan Mode, copy spec verbatim, build workflow → [Step 5]
10. Command 03: Read all context, check spec elements completed + conventions, create approval list, suggest 3 refactorings, get human approval, implement approved ones → [Step 6]
11. Command 04: Read all context, create user-facing-help-doc.md in skills-docs-dir → [Step 7]
12. Command 05: Read all context, instruct user to test, feedback to human-manual-testing-feedback.md → [Step 8]
13. All variables stored in named variables (as many as possible) → [All command variable blocks]
14. Use full-jira-tdd-story-workflow as inspiration → [All command files follow same patterns]
15. Each command must re-read all context from scratch (fresh Claude session) → [All commands: context-loading sections]
16. No automated testing — manual testing by human → [Step 10: Manual verification]
17. `skills-docs-dir={skills-dir}/docs` and `user-facing-help-doc-filename={skills-docs-dir}/user-facing-help-doc.md` (chain from `{skills-dir}` which chains from `{plugin-dir}` → `{project-root}`) → [Step 7: Command 04]

---

## Two Variables Passed Between Commands: `plugin-id` and `workflow-id`

Command 01 interactively asks the user for both `plugin-id` (default: `agentic-hq-demos-plugin`) and `workflow-id`. It outputs a combined string. Commands 02-05 all receive and parse this same string.

**Output from Command 01 / Input to Commands 02-05:**
```
The variables used in this workflow creation workflow are: plugin-id={plugin-id} and workflow-id={workflow-id}
```

**Common Variable Chain (established by Commands 02-05 after parsing input):**

Each command file will include a complete, self-contained `## Step 0b: Establish Variables` code block with ALL variables fully expanded — just like the full-jira-tdd-story-workflow commands. No command will reference another command's variables. The base chain for commands 02-05 is:

```
plugin-id = (parsed from command input)
workflow-id = (parsed from command input)
project-root = (your primary working directory)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
```

Each command will then add its own command-specific variables after this base chain (e.g., `draft-workflow-spec-filename`, `user-facing-help-doc-filename`, etc.).

---

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-99/workflow-files/manual-test-files/03-green-phase-implementation-plan-copy.md` before proceeding with implementation.

---

## Step 1: Create Directory Structure

Create the following directories under the core plugin:

```
.agentic-hq/plugins/agentic-hq-core-plugin/
├── commands/                          ← NEW directory
│   └── create-workflow/               ← NEW directory
│       ├── 01-explain-to-user-how-workflows-work-and-get-workflow-details.md
│       ├── 02-confirm-spec-approved-and-build.md
│       ├── 03-run-checks-on-workflow.md
│       ├── 04-document-workflow.md
│       └── 05-get-human-to-test-workflow.md
└── skills/
    ├── self-termination/              ← EXISTS
    └── create-workflow/               ← NEW directory
        ├── SKILL.md
        └── ts-workflow/
            ├── package.json
            ├── tsconfig.json
            └── src/
                └── create-workflow-cli.ts
```

---

## Step 2: Create SKILL.md, package.json, tsconfig.json

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md`

Follows exact pattern from full-jira-tdd-story-workflow SKILL.md:
- `disable-model-invocation: true`
- Returns shell command: `(cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/create-workflow-cli.ts`
- Self-terminates

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json`

Follows exact pattern from full-jira-tdd-story-workflow package.json:
- `name`: `agentic-hq-create-workflow`
- `link:../../../../../..` for agentic-hq dependency (same depth as demos plugin)
- Same postinstall node-pty fix
- Dependencies: `agentic-hq`, `tsx`, `commander`
- Same `pnpm.onlyBuiltDependencies`

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/tsconfig.json`

Identical copy of the full-jira-tdd-story-workflow tsconfig.json.

---

## Step 3: Create TypeScript Orchestrator CLI

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts`

Simple linear flow — no looping, no CLI arguments. Command 01 returns a combined variables string, which is stored and passed verbatim to Commands 02-05:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const COMMAND_01 = '/agentic-hq-core-plugin:create-workflow:01-...';
const COMMAND_02 = '/agentic-hq-core-plugin:create-workflow:02-...';
// ... etc

const program = new Command();
program
  .name('create-workflow-cli')
  .description('Create a new Agentic HQ workflow')
  .action(async () => {
    const tool = new DefaultClaudeCodeTool();

    // Step 1: No input → returns plugin-id-and-workflow-id combined string
    const pluginIdAndWorkflowId = await tool.execute(COMMAND_01, '');

    // Steps 2-5: Pass the same combined string as input (don't read their output)
    await tool.execute(COMMAND_02, pluginIdAndWorkflowId);
    await tool.execute(COMMAND_03, pluginIdAndWorkflowId);
    await tool.execute(COMMAND_04, pluginIdAndWorkflowId);
    await tool.execute(COMMAND_05, pluginIdAndWorkflowId);
  });

program.parse();
```

---

## Step 4: Command 01 — Explain Workflows & Get Details

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`

Structure:
- Read input (no variables expected for first command)
- Establish variables:
  - `project-root` = primary working directory
  - `readme-file` = `{project-root}/README.md`
  - `how-agentic-hq-works-file` = `{project-root}/docs/dev/how-agentic-hq-works.md`
  - `demos-plugin-dir` = `{project-root}/.agentic-hq/plugins/agentic-hq-demos-plugin` (reference — read for patterns)
  - `example-workflow-commands-dir` = `{demos-plugin-dir}/commands/math-workflow` (reference — read for patterns)
  - `example-workflow-skill-dir` = `{demos-plugin-dir}/skills/math-workflow` (reference — read for patterns)
- **Step 1**: Read reference files to gain context on how workflows are built (README, how-agentic-hq-works, math-workflow commands + CLI + SKILL.md as examples)
- **Step 2**: Explain to user what an AHQ workflow is and how it works
- **Step 3**: Ask user for:
  - `plugin-id` — which plugin the workflow lives in (default suggestion: `agentic-hq-demos-plugin`)
  - `workflow-id` — used to name folders and the skill (e.g., `math-workflow`, `string-reversal`, `full-jira-tdd-story-workflow`)
  - `one-sentence-description`
- **Step 4**: Establish derived variables (see Common Variable Chain):
  - `workflow-creation-docs-dir` = `{project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}`
  - `draft-workflow-spec-filename` = `{workflow-creation-docs-dir}/DRAFT-workflow-spec.md`
- **Step 5**: Collaboratively create DRAFT-workflow-spec.md with the user (back-and-forth until approved). Spec includes: plugin-id, workflow-id, one-sentence-description, command IDs with descriptions/inputs/outputs, what success looks like. Include "AI Questions" section.
- **Step 6**: Write output: `The variables used in this workflow creation workflow are: plugin-id={plugin-id} and workflow-id={workflow-id}`
- **Step 7**: Self-terminate

---

## Step 5: Command 02 — Confirm Spec & Build

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`

Structure:
- Read input, parse `plugin-id` and `workflow-id`
- Establish variables (see "Common Variable Chain" above), plus:
  - `draft-workflow-spec-filename` = `{workflow-creation-docs-dir}/DRAFT-workflow-spec.md`
  - `approved-workflow-spec-filename` = `{workflow-creation-docs-dir}/APPROVED-workflow-spec.md`
  - `spec-file-verbatim-copy-file` = `{workflow-creation-docs-dir}/final-approved-workflow-plan-verbatim-copy.md`
- **Step 1**: Read all context — previous command files AND **all files in `{workflow-creation-docs-dir}`**
- **Step 2**: Confirm spec with user, rename DRAFT→APPROVED
- **Step 3**: Copy spec verbatim to `final-approved-workflow-plan-verbatim-copy.md`
- **Step 4**: Enter Plan Mode — present implementation plan
- **Step 5**: Build the workflow (create command .md files, CLI, SKILL.md, package.json, tsconfig.json following math-workflow pattern)
- **Step 6**: Write output: `workflow-id`
- **Step 7**: Self-terminate

---

## Step 6: Command 03 — Run Checks

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`

Structure:
- Read input, parse `plugin-id` and `workflow-id`
- Establish variables (see "Common Variable Chain" above), plus:
  - `approved-workflow-spec-filename` = `{workflow-creation-docs-dir}/APPROVED-workflow-spec.md`
  - `workflow-implementation-approval-list-file` = `{workflow-creation-docs-dir}/workflow-implementation-approval-list.md`
  - `workflow-potential-refactorings-file` = `{workflow-creation-docs-dir}/workflow-potential-refactorings.md`
- **Step 1**: Read all context — previous command files, **all files in `{workflow-creation-docs-dir}`**, AND **all generated workflow code in `{skills-dir}` and `{commands-dir}`**
- **Step 2**: Check all spec elements completed, follows math-workflow conventions → create `workflow-implementation-approval-list.md`
- **Step 3**: Suggest 3 refactorings → create `workflow-potential-refactorings.md`, include section for human suggestions
- **Step 4**: Get human to review and approve/reject refactorings
- **Step 5**: Implement approved refactorings
- **Step 6**: Write output: `workflow-id`
- **Step 7**: Self-terminate

---

## Step 7: Command 04 — Document

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`

Structure:
- Read input, parse `plugin-id` and `workflow-id`
- Establish variables (see "Common Variable Chain" above), plus:
  - `user-facing-help-doc-filename` = `{skills-docs-dir}/user-facing-help-doc.md`
- **Step 1**: Read all context — previous command files, **all files in `{workflow-creation-docs-dir}`**, AND **all generated workflow code in `{skills-dir}` and `{commands-dir}`**
- **Step 2**: Create `user-facing-help-doc.md` explaining how to use the workflow
- **Step 3**: Write output: `workflow-id`
- **Step 4**: Self-terminate

---

## Step 8: Command 05 — Human Testing

**File**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`

Structure:
- Read input, parse `plugin-id` and `workflow-id`
- Establish variables (see "Common Variable Chain" above), plus:
  - `human-manual-testing-feedback-file` = `{workflow-creation-docs-dir}/human-manual-testing-feedback.md`
- **Step 1**: Read all context — previous command files, **all files in `{workflow-creation-docs-dir}`**, AND **all generated workflow code in `{skills-dir}` and `{commands-dir}`**
- **Step 2**: Tell user how to run the workflow to test it
- **Step 3**: Tell them to put feedback in `human-manual-testing-feedback.md`
- **Step 4**: Write output: `workflow-id` (or empty — final command)
- **Step 5**: Self-terminate

---

## Step 9: Register Skill

**File to modify**: `src/demo/demo-skills.ts`

Add new entry to `DEMO_SKILLS` array:
```typescript
{
  shortName: 'create-workflow',
  fullPath: '/agentic-hq-core-plugin:create-workflow',
  description: 'Create a new Agentic HQ workflow',
  example: 'agentic-hq create-workflow',
}
```

Note: This is semantically wrong (it's not a demo), but it's the minimum change for GREEN phase. **TODO for GREEN phase doc**: Flag as potential REFACTOR item — split into `CORE_SKILLS` + `DEMO_SKILLS` and merge them in `agentic-hq-cli.ts`. The refactor agent will pick this up.

---

## Step 10: Verification (Manual Testing)

Since test-type is `manual`:
1. Run `pnpm validate` from project root to verify no TypeScript/lint errors in modified files
2. Run `agentic-hq list` to verify `create-workflow` appears in the skill list
3. Human will manually run `agentic-hq create-workflow` to test the full workflow end-to-end (in a later step)

---

## Step 11: TODO — After Implementation

Come back and re-read the GREEN phase command file (03-jira-minimal-implementation.md) for testing and documenting instructions (Steps 7-12).

---

## Summary of Files

| # | File | Action |
|---|------|--------|
| 1 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md` | CREATE |
| 2 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json` | CREATE |
| 3 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/tsconfig.json` | CREATE |
| 4 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` | CREATE |
| 5 | `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` | CREATE |
| 6 | `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` | CREATE |
| 7 | `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` | CREATE |
| 8 | `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md` | CREATE |
| 9 | `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md` | CREATE |
| 10 | `src/demo/demo-skills.ts` | MODIFY (add create-workflow entry) |

**Total: 9 new files, 1 modified file**

---

## Post-Implementation Fix: Pass AGENTIC_HQ_WORKSPACE_ROOT to Commands

### Human's Updated Request

During manual testing of the workflow from a new, empty, temp workspace directory, the human discovered that the workflow couldn't find reference files (README.md, math-workflow examples, how-agentic-hq-works.md, and the create-workflow's own command .md files for context). These files only exist in the Agentic HQ repo, not in the user's workspace.

Three options were considered:
1. Limit the workflow to only run from the Agentic HQ workspace directory
2. Read `AGENTIC_HQ_WORKSPACE_ROOT` env var in the CLI and pass it to all commands
3. Bundle all documentation/sample code with the skill (deferred to AHQ-102)

The human chose **Option 2**: read `process.env.AGENTIC_HQ_WORKSPACE_ROOT` and pass it through all 5 commands so they can construct absolute paths to reference files. The human specified the exact variable passing format:
- CLI → Command 01: `"The variable used in this workflow creation workflow is: agentic-hq-workspace-root-dir={value}"`
- Command 01 → Commands 02-05: `"The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir={value} and plugin-id={plugin-id} and workflow-id={workflow-id}"`

### What Was Implemented

**Key distinction**: `agentic-hq-workspace-root-dir` (from env var) is for reading reference/example files from the AHQ repo. `project-root` (primary working directory) remains for creating NEW workflow files in the user's workspace.

**6 files modified:**

1. **`create-workflow-cli.ts`** — Reads `AGENTIC_HQ_WORKSPACE_ROOT` env var at startup (fails fast with error if not set). Passes it to Command 01 as the input string. Renamed `pluginIdAndWorkflowId` → `allVariables` since it now carries 3 values.

2. **Command 01** (`01-explain-to-user-how-workflows-work-and-get-workflow-details.md`) — Step 0a now parses `agentic-hq-workspace-root-dir` from input. Step 0b uses it for all reference file paths (`readme-file`, `how-agentic-hq-works-file`, `demos-plugin-dir`, `example-workflow-*`). Step 6 output now includes all 3 variables.

3. **Command 02** (`02-confirm-spec-approved-and-build.md`) — Parses `agentic-hq-workspace-root-dir` from input. Uses it for `example-workflow-*` paths. Previous command file references prefixed with `{agentic-hq-workspace-root-dir}/`.

4. **Command 03** (`03-run-checks-on-workflow.md`) — Same as Command 02: parses workspace root, uses it for example paths and previous command file references.

5. **Command 04** (`04-document-workflow.md`) — Parses `agentic-hq-workspace-root-dir`. Previous command file references prefixed with `{agentic-hq-workspace-root-dir}/`.

6. **Command 05** (`05-get-human-to-test-workflow.md`) — Same as Command 04.

All 67 unit tests pass after this change (`pnpm validate` green).
