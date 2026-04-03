# GREEN Phase Complete: AHQ-99 (manual test)

**Jira**: [AHQ-99](https://agentic-hq.atlassian.net/browse/AHQ-99)
**Test Type**: manual
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-03

---

## Implementation Created

**Files Created/Modified**:
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/tsconfig.json`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts`
- `src/demo/demo-skills.ts` (modified — added create-workflow entry)
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` (modified — added Read permission + temp plugin dir)
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` (modified — new test + updated assertions)

**Test Command**: Manual testing by human
**Test Result**: ✅ PASSING — Human confirmed: "Amazing. It worked really well."

---

## What Was Implemented

A meta-workflow (create-workflow) that guides a human through creating a new Agentic HQ workflow. It's a 5-command linear workflow living in `agentic-hq-core-plugin` that explains how workflows work, collaboratively creates a spec, builds the workflow, runs checks/refactorings, documents it, and guides the human through testing with an iterative improvement loop.

### Key implementation decisions:

1. **AGENTIC_HQ_WORKSPACE_ROOT env var**: Commands need to read reference files (README, example workflows, how-agentic-hq-works.md) that live in the AHQ repo. When the user runs from a different workspace, these aren't accessible via `project-root`. The CLI reads `AGENTIC_HQ_WORKSPACE_ROOT` and passes it through all 5 commands as a separate variable from `project-root`.

2. **Read(configDir) in allowedTools**: Added path-scoped Read permission for the AHQ config directory to `--allowedTools` via a new `buildAllowedToolsListString()` method in `claude-command-builder.ts`. Temporary until AHQ-102 bundles resources with workflows.

3. **Skill registered in demo-skills.ts**: Semantically wrong (it's a core skill, not a demo), but it's the minimum change for GREEN. Flagged for REFACTOR — should split into `CORE_SKILLS` + `DEMO_SKILLS`.

4. **File numbering convention**: Workflow-creation-docs files are prefixed with the command number that creates them (e.g., `01-DRAFT-workflow-spec.md`, `02a-APPROVED-workflow-spec.md`, `03b-workflow-potential-refactorings.md`) so they sort in execution order.

5. **Command 05 feedback model**: Rather than asking the human to fill in a template, the AI examines the test workspace, writes the feedback doc itself, then has a Q&A with the human. More useful and less tedious.

6. **Test-and-fix loop guidance in command 05**: Explains using two CLI sessions side by side (Session A for edits, Session B for testing) and the option to get the testing AI to fix its own command directly.

### Bugs found and fixed during GREEN:

1. **Command naming missing numbering prefix** — Generated CLI had command names like `therapy-test-workflow:check-in-and-research` instead of `therapy-test-workflow:01-check-in-and-research`, causing "Unknown skill" errors. Fixed in therapy workflow CLI and added a warning box to create-workflow command 02.

2. **Read permission prompts from different workspace** — Claude prompted for permission to read files in the AHQ config directory when running from a non-AHQ workspace. Fixed by adding `Read(configDir)` to `buildAllowedToolsListString()` in `claude-command-builder.ts`.

3. **Command 02 of therapy workflow skipping main step** — AI jumped from feedback discussion straight to file-writing, skipping the deep exploration. User fixed by adding an Overview section with explicit warnings.

4. **Feedback-in-file confusion** — AI thought user feedback would come via chat, not as inline annotations in the file. Fixed command to explicitly say feedback goes into the file and AI re-reads the file after "done".

5. **Temporary plugin dir for testing** — Added `TEMPORARILY_ADDED_PLUGIN_DIR` constant pointing to the test plugin in `/tmp/tmp-steve-workspace-002`. Temporary until AHQ-103 adds plugin discovery.

## Files Created

- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` — Command 01: explains workflows, gets workflow-id and plugin-id from user, creates DRAFT spec
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — Command 02: confirms spec, renames DRAFT→APPROVED, builds all workflow files
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` — Command 03: checks implementation against spec, suggests refactorings
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md` — Command 04: creates user-facing help documentation
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md` — Command 05: guides human through testing with iterative improvement loop
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md` — Skill definition (disable-model-invocation, shell command)
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json` — Dependencies (agentic-hq, tsx, commander)
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/tsconfig.json` — TypeScript config
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` — Linear CLI orchestrator running 5 commands sequentially

## Files Modified

- `src/demo/demo-skills.ts` — Added create-workflow skill entry
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — Added `buildAllowedToolsListString()` with `Read(configDir)`, added `TEMPORARILY_ADDED_PLUGIN_DIR`
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` — Added test for Read(configDir) in allowedTools, updated plugin dir count assertion

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-99 manual
```
