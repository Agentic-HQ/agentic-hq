# AI Summary: AHQ-104

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Title**: Refactor Current Workflow Listing To Use Dynamic Discovery
**Status**: Transitioned to In Progress
**Generated**: 2026-04-04

---

## My Understanding of This Task

This Jira is about replacing the hardcoded workflow listing in `agentic-hq list` with a dynamic discovery mechanism, while keeping the output **exactly identical** to what it produces today. Currently, the 5 workflows are defined in a hardcoded `DEMO_SKILLS` array in `src/demo/demo-skills.ts`, which feeds into `WorkflowSkillsRegistry`. The goal is to instead discover workflows by scanning for `ahq-workflow.json` metadata files within the AHQ workspace's plugin skill directories (`.agentic-hq/plugins/*/skills/*/ahq-workflow.json`).

The work involves three main parts: (1) creating `ahq-workflow.json` metadata files for each of the 5 existing workflows, (2) designing and implementing a rich set of OO classes/interfaces following the project design requirements (each concept gets a class/interface pair, minimal state, delegation over state manipulation, "tell don't ask"), and (3) wiring the new discovery mechanism into the CLI so that `agentic-hq list` and the short alias subcommands work identically to today.

The scope is deliberately narrow. We're only searching the AHQ workspace (not the user's current workspace), keeping the exact same output format (including the `fullPath` column like `/agentic-hq-demos-plugin:math-workflow`), and not changing how `ClaudeCodeTool` resolves plugin directories. The existing hardcoded `DEMO_SKILLS`, `demo-skills.ts`, and the current `WorkflowSkillsRegistry` will be replaced by the new discovery classes. All new code goes in `src/workflow-discovery/` as a self-contained subsystem.

This is a subtask of AHQ-103, which is the broader initiative to add full plugin and workflow discovery. Later subtasks will add current-workspace searching, new output formatting, and dynamic plugin-dir configuration.

## Research Findings

No external research was needed. The task is well-defined by the Jira, parent Jira, and design requirements document. The existing codebase patterns (interface/class pairs, CompositionRoot DI, Commander CLI) are clear from reading the source.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md`

The following requirements from the design document are most relevant to this Jira:

1. **Every concept gets a class/interface pair** - The parent Jira AHQ-103 lists concepts: Workflow, Plugin, Skill, Workspace, WorkflowListing, ExampleCommand, ExampleParameters, WorkflowVersion, WorkflowDescription, WorkflowAuthor, WorkflowShortName. Each needs an interface and a `Default*` concrete implementation. For AHQ-104, we'll create the subset needed for discovery within the AHQ workspace only.

2. **Primitives must be wrapped immediately** - Strings parsed from `ahq-workflow.json` (shortId, description, version, etc.) must be wrapped in domain objects (e.g., `WorkflowShortName`, `WorkflowVersion`) as soon as they're parsed and stay as typed objects until they reach the output boundary (toString()).

3. **Minimize state, use delegation** - Instead of building up lists and manipulating them, objects should delegate to contained objects. E.g., a `WorkflowSearchResult` delegates display to its contained workspace results, which delegate to their contained workflows. "Tell, don't ask."

4. **Data Dictionary and English Language Description** - The planning phase must include a table of all concepts with planned class/interface names, and a paragraph describing the system flow using those names (class names **bolded**, verbs *italicized*).

5. **`Default*` naming convention** - Default implementations use the `Default` prefix (e.g., `DefaultWorkflowSearchResult`), allowing third parties to swap in custom implementations.

6. **Balance OO purity with readability** - Not every tiny operation needs its own class. Use design judgement about what's worth extracting vs keeping inline for readability.

## Questions for Human

### Question 1: E2E test approach - simple in-repo or cross-workspace?

The existing e2e tests (string-reversal, math, quick-jira) all follow a cross-workspace pattern: they run `install-dev-agentic-hq.sh`, create a temp workspace at `/tmp/`, run `git init`, and then execute `agentic-hq` from that workspace.

For the `agentic-hq list` e2e test, since we're only discovering workflows in the AHQ workspace (not the current workspace), we have two options:

1. **Simple in-repo test**: Run `node bin/agentic-hq.cjs list` from the repo root and assert the output. Much simpler, faster, no global pnpm link needed.
2. **Cross-workspace test**: Follow the existing pattern with a temp workspace, proving that `agentic-hq list` finds AHQ workspace workflows even when run from a different directory.

Option 1 is simpler and sufficient for AHQ-104's scope. Option 2 matches the existing test pattern and would also validate that `AGENTIC_HQ_WORKSPACE_ROOT` resolution works, which may be useful for later subtasks.

Which approach do you prefer?

**Human's Response**:
> 2 please.  Follows existing pattern and should work fine. Also, currently I can run list from any workspace location and it works, so we don't want a regression in functionality:

(base) stevepersonal@Steves-MacBook-Pro tmp-steve-workspace-002 % pwd
/tmp/tmp-steve-workspace-002
(base) stevepersonal@Steves-MacBook-Pro tmp-steve-workspace-002 % agentic-hq list
Available workflows:

  reversal         /agentic-hq-demos-plugin:string-reversal               Reverses a string (hello world demo)
Example: agentic-hq reversal -- --string-reverse='hello there you'
  math             /agentic-hq-demos-plugin:math-workflow                 Solves a math problem using an agent team
Example: agentic-hq math -- --input-number=54321
  quick-jira       /agentic-hq-demos-plugin:quick-jira-workflow           Creates and completes a Jira ticket
Example: agentic-hq quick-jira -- --jira-id=TEST-123
  full-jira        /agentic-hq-demos-plugin:full-jira-tdd-story-workflow  Full TDD story workflow driven by a Jira ticket
Example: agentic-hq full-jira -- --jira-id=TEST-123
  create-workflow  /agentic-hq-core-plugin:create-workflow                Create a new Agentic HQ workflow
Example: agentic-hq create-workflow
(base) stevepersonal@Steves-MacBook-Pro tmp-steve-workspace-002 % 



---

### Question 2: Scope of value-object classes for this subtask

The design requirements say every concept should have a class/interface pair, and the parent Jira AHQ-103 lists ~10+ concepts (WorkflowVersion, WorkflowAuthor, WorkflowShortName, ExampleParameters, etc.). However, AHQ-104's "Out of Scope" section says to avoid "anything that isn't absolutely required to just get this working exactly as it works now."

For AHQ-104, some of these value objects (like `WorkflowVersion` and `WorkflowAuthor`) are present in `ahq-workflow.json` but are NOT used in the current `agentic-hq list` output. They'd be parsed and wrapped but never displayed.

Should I:
1. **Create all value-object classes** listed in the design requirements, even if some aren't used in the output yet (building the foundation for later subtasks)
2. **Create only the value objects that are actually used** in producing the current output (shortName, fullPath/pluginId+skillId, description, exampleParameters), and add the rest when they're needed

My instinct is option 1, since the design requirements are clear about wrapping everything, and it's low effort to create simple value objects. But the Jira's "Out of Scope" language could be read either way.

**Human's Response**:
> "Out of Scope" section says to avoid "anything that isn't absolutely required to just get this working exactly as it works now." - refers to functionality - not implementation / design.  I've update the description in the Jira to:

In terms of functionality - anything else that isn’t absolutely required to just get this working functionally exactly as it works now (from the user’s point of view).  Clarification: Under the hood we are doing a massive change which adds the capability to detect any newly added plugins/workflows when they are added to the AHQ workspace and we are massively refactoring to introduce lots of classes / interfaces for all the different concepts this Jira talks about.

**BUT** you are right - we should not create classes/interfaces in this Jira that have zero effect on output - because that creates a situation where if we get them wrong, we commit them and they break something in the future (when they are used).  So your instinct is exactly right.  Only create (all) the classes/interfaces we are using in this Jira.  When we change/add the new functionallity later we'll add the new classes as required.  We'll include version and author in the json (but not use them for now)

---

## Files I Reviewed

- `src/demo/demo-skills.ts` - The hardcoded `DEMO_SKILLS` array with 5 workflows. This is what gets replaced by dynamic discovery.
- `src/workflow/workflow-skills/workflow-skills-registry.ts` - The `WorkflowSkillsRegistry` class that holds skills and formats the list output. Will be replaced by new discovery classes.
- `src/interfaces/workflow-skill.ts` - The `WorkflowSkill` interface (shortName, fullPath, description, example). Will evolve to match new domain model.
- `src/cli/agentic-hq-cli.ts` - Entry point that wires `DEMO_SKILLS` into the program. Will use new discovery mechanism.
- `src/cli/agentic-hq-program.ts` - Program factory with `list` command, short alias subcommands, and `--workflow-command-supplier`. Already accepts injected registry - good for swapping.
- `src/kernel/composition-root.ts` - DI wiring class. May need a new factory method for the discovery mechanism.
- `src/workspace/default-agentic-hq-installation.ts` - `DefaultAgenticHqInstallation` provides `getConfigDir()` which returns the `.agentic-hq` directory path. This is where plugins are found.
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` - Good example of the interface/class pattern used in the codebase (SRP docs, constructor injection, delegation).
- `tests/unit/cli/agentic-hq-cli-list.unit.test.ts` - Existing unit tests for `WorkflowSkillsRegistry`. These will be replaced with tests for new discovery classes.
- `tests/unit/cli/agentic-hq-program.unit.test.ts` - Tests for the program factory. These should still work since `createProgram()` accepts an injected registry.
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Example of e2e test pattern (cross-workspace, pnpm link, timeout handling).
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/` - Example skill directory structure (SKILL.md + ts-workflow/). No `ahq-workflow.json` exists yet.
- `docs/dev/project-design-requirements.md` - Design requirements for OO design, concept wrapping, minimal state.

**Key findings:**
- The `createProgram()` function already accepts an injected `WorkflowSkillsRegistry`, making the swap straightforward.
- No `ahq-workflow.json` files exist yet - they need to be created for all 5 workflows.
- There is NO existing e2e test for `agentic-hq list` - one must be written.
- The skill directory structure is: `.agentic-hq/plugins/{pluginId}/skills/{skillId}/SKILL.md` (and `ts-workflow/`). The `ahq-workflow.json` will go alongside `SKILL.md`.
- The `fullPath` format is `/{pluginId}:{skillId}` and can be reconstructed from the JSON metadata.
- The example command format is `agentic-hq {shortId}{exampleParameters}`.

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### Unit Tests (multiple tests per TDD cycle, per Jira instruction)

**1. ahq-workflow.json parsing:**
- Should parse a valid ahq-workflow.json into a domain object with all fields
- Should throw/fail on missing required fields (skillId, pluginId, shortId, description, exampleParameters)
- Should throw/fail on invalid JSON content

**2. Value object behavior (WorkflowShortName, WorkflowDescription, ExampleParameters, PluginId, SkillId, etc.):**
- Should store the value and return it via toString()
- Should reject empty/blank values (fail fast)

**3. Workflow discovery mechanism:**
- Should scan plugin skill directories and find ahq-workflow.json files
- Should return discovered workflows as domain objects
- Should return empty result when no ahq-workflow.json files exist
- Should skip skill directories that don't contain ahq-workflow.json

**4. Workflow listing/formatting:**
- Should format discovered workflows in the exact same format as current output
- Should include "Available workflows:" header
- Should align columns correctly (shortName, fullPath, description)
- Should include "Example:" lines for each workflow

**5. Full path and example command construction:**
- ExampleCommand should construct `agentic-hq {shortId}{exampleParameters}`
- FullPath should construct `/{pluginId}:{skillId}`

**6. Integration with CLI program:**
- Discovery-based registry replaces DEMO_SKILLS and produces identical createProgram() behavior
- Short alias subcommands still resolve correctly

### E2E Tests (cross-workspace, following existing e2e pattern)

**1. `agentic-hq list` output verification from a separate workspace:**
- Run via globally-linked `agentic-hq` binary from a temp workspace at `/tmp/`
- Should output "Available workflows:" header
- Should list all 5 workflows: reversal, math, quick-jira, full-jira, create-workflow
- Should include math workflow's description ("Solves a math problem using an agent team")
- Should include math workflow's example ("agentic-hq math -- --input-number=54321")
- Output format matches current hardcoded format exactly (including column alignment)
- Proves no regression: list works from any workspace location, not just the AHQ repo

## Agreed Decisions

1. **E2E test**: Cross-workspace pattern (option 2), matching existing e2e tests. Proves `agentic-hq list` works from any workspace location.
2. **Value-object scope**: Only create classes/interfaces that are actually used in this Jira's output. `version` and `author` fields will be in `ahq-workflow.json` but NOT wrapped in value objects until a later Jira needs them. This avoids committing unused classes that could be wrong.

## Ready for Next Step

All questions resolved, test types confirmed (`unit, e2e`). This summary is complete.




== UPDATE - Refactors Spotted By Human

See REFACTORs in:
src/workflow-discovery/interfaces/workflow-search-results.ts
and it's implementing class.


See also:

### Step 2b: Add duplicate command name guard to WorkflowRegistryImpl

in green plan file which needs undoing after the removal of classes.

