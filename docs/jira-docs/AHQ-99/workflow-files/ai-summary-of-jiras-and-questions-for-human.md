# AI Summary: AHQ-99

**Jira**: [AHQ-99](https://agentic-hq.atlassian.net/browse/AHQ-99)
**Title**: Create Workflow Creation Workflow
**Status**: Transitioned to In Progress
**Generated**: 2026-03-30

---

## My Understanding of This Task

This Jira asks me to build a **meta-workflow** - a workflow that creates other workflows. It's an Agentic HQ workflow that guides a human through the process of specifying, building, checking, documenting, and testing a new workflow. The key insight is that this is intentionally the simplest version first - a linear, step-by-step process with no conditional loops or branching.

The workflow has 5 commands that run sequentially, orchestrated by a TypeScript CLI (following the established math-workflow and full-jira-tdd-story-workflow patterns). Each command runs in a fresh Claude session, communicates via JSON files, and collaborates with the human at key decision points. The commands are: (1) explain workflows to the user and collaboratively draft a spec, (2) confirm spec approval and build the workflow, (3) run checks against the spec and propose refactorings, (4) create user-facing documentation, and (5) guide the human through manual testing.

The Jira explicitly calls out that this workflow's structure mirrors the existing `full-jira-tdd-story-workflow` (understand, plan, build, check, document) and asks me to use those commands as inspiration. A key design requirement is that each command must be self-contained - it needs to re-read all context from scratch (previous commands, generated files, existing code) since each runs in a fresh Claude session.

The scope is clearly defined: simple linear workflow only, no conditional loops (that's a future Jira). All file paths and directories must be stored in well-named variables. The workflow creates documentation artifacts in `docs/workflow-creation-docs/{workflow-id}/` as it progresses, and the actual workflow code goes into the standard plugin structure under `.agentic-hq/plugins/`.

## Research Findings

No external research was needed - the codebase contains comprehensive examples and documentation for how to build workflows:

### Existing Patterns Studied

I studied both the **math-workflow** (simple 3-step linear workflow) and the **full-jira-tdd-story-workflow** (complex 6-step workflow with human collaboration) in detail. Key patterns I'll follow:

- **Command structure**: Numbered steps, input parsing from `command-input.json`, variable establishment block, validation, work, output to `command-output.json`, self-termination
- **TypeScript orchestrator**: Uses `Commander` for CLI args, `DefaultClaudeCodeTool` for chaining commands, plain English variable strings for inter-command communication
- **SKILL.md**: Returns the shell command to run the TypeScript CLI, uses `disable-model-invocation: true`
- **Package.json**: Uses `link:` protocol for agentic-hq dependency, includes node-pty postinstall fix
- **Variable passing**: `"Your variables for use in this command are workflow-id = my-workflow"` format

## Questions for Human

### Question 1: Which plugin should this workflow live in?

The existing demo workflows live in `agentic-hq-demos-plugin`. Should this "workflow creation workflow" also go in `agentic-hq-demos-plugin`, or should it go in a different plugin (e.g., `agentic-hq-core-plugin` since it's a tool for building workflows, not a demo)?

I checked the Jira description and it doesn't specify which plugin to use. It says to model after the demo workflows but doesn't say whether this IS a demo or a core tool.

**Human's Response**:
> agentic-hq-core-plugin please

---

### Question 2: Test types for this Jira - is it "none"?

This Jira creates markdown command files, a SKILL.md, a TypeScript orchestrator CLI, and a package.json. The Jira doesn't specify `Test types:` anywhere.

Looking at what's being built:
- **Command files** (`.md`) - These are instructions for Claude, not testable code in the traditional sense
- **TypeScript orchestrator** (`*-cli.ts`) - This chains commands together using `DefaultClaudeCodeTool`. The existing math-workflow and full-jira-tdd-story-workflow orchestrators don't have unit tests
- **SKILL.md** - Template file, not testable

Given that none of the existing workflow orchestrators have tests, and the deliverables are primarily markdown files + a thin TypeScript CLI, I believe the answer is **no automated tests** - the testing is done via Command 05 (human manually runs the workflow). But I want to confirm this with you since your CLAUDE.md is emphatic about TDD.

**Human's Response**:
> No testing. That's correct. Red Phase of TDD can be skipped.

---

### Question 3: What should the skill short name and registration look like?

The existing workflows are registered in `workflow-skills-registry.ts` with short names (e.g., `reversal`, `math`). What short name do you want for this workflow? Something like `create-workflow` or `workflow-creator`?

Also, should it be registered in the skills registry so users can run it via `agentic-hq create-workflow` (or whatever short name), or is this for now just a slash-command workflow?

**Human's Response**:
> create-workflow

---

### Question 4: Variable passing - what gets passed between commands?

The Jira says Command 01 outputs `workflow-id`. But Commands 02-05 all need to "read all the files necessary to gain context." I want to confirm the variable passing chain:

- **Command 01** input: (nothing - first command) → output: `workflow-id`
- **Command 02** input: `workflow-id` → output: `workflow-id` (pass through)
- **Command 03** input: `workflow-id` → output: `workflow-id` (pass through)
- **Command 04** input: `workflow-id` → output: `workflow-id` (pass through)
- **Command 05** input: `workflow-id` → output: (final - workflow complete)

Is this correct? Or do you want additional variables passed (e.g., `one-sentence-description`, specific file paths)?

The Jira says "a value passed as parameter to all the commands apart from the first one" which suggests only `workflow-id` is passed. Each command then derives all other paths from that (e.g., `workflow-creation-docs-dir=docs/workflow-creation-docs/{workflow-id}`).

**Human's Response**:
> just workflow-id - as you said.  All other data will be in files anyway.

---

## Files I Reviewed

- `README.md` - Project overview, how to run workflows, plugin structure
- `docs/dev/how-agentic-hq-works.md` - Architecture doc explaining ClaudeCodeTool, PTY, file-based I/O
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow/times-two.md` - Simple command pattern (input → process → output → self-terminate)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow/plus-three.md` - Same pattern, confirms convention
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow/div-five.md` - Same pattern
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` - How SKILL.md returns shell command with `disable-model-invocation: true`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts` - TypeScript orchestrator pattern: Commander + DefaultClaudeCodeTool + sequential execute calls
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` - Package structure with `link:` protocol
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md` - Complex command pattern with Jira integration, human collaboration, MCP tools
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/02-jira-write-failing-test.md` - RED phase pattern, Plan Mode usage
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md` - GREEN phase pattern
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md` - Refactoring analysis with human approval gates
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04b-jira-refactor-execute.md` - Refactoring execution pattern
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/05-jira-validate.md` - Validation pattern
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts` - Complex orchestrator with looping over test types
- `src/interfaces/workflow-skill.ts` - WorkflowSkill interface for registry
- `src/workflow/workflow-skills/workflow-skills-registry.ts` - How skills are registered

**Key findings**: The codebase has clear, consistent patterns. Every command follows the same structure (read input → parse variables → validate → do work → write output → self-terminate). The TypeScript orchestrators are thin - they just chain commands and pass variables. The full-jira-tdd-story-workflow is the closest analog to what we're building and provides excellent patterns for human collaboration, Plan Mode usage, and document creation.

## Agreed Answers Summary

| # | Question | Answer |
|---|----------|--------|
| 1 | Which plugin? | `agentic-hq-core-plugin` |
| 2 | Test types? | `manual` - human does manual testing after AI implements |
| 3 | Skill short name? | `create-workflow` |
| 4 | Variable passing? | Only `workflow-id` between commands; all other data in files |

## Test Types And Tests We Will Be Implementing

**Test types: `manual`**

No automated tests. The AI will implement the workflow (command files, TypeScript orchestrator CLI, SKILL.md, package.json). The human will manually test by running the workflow end-to-end via Command 05, which guides them through testing and collecting feedback.

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.
