# GREEN Phase Complete: AHQ-107 (manual test)

**Jira**: [AHQ-107](https://agentic-hq.atlassian.net/browse/AHQ-107)
**Test Type**: manual
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-17

---

## Implementation Created

**Files Modified** (5 command-instruction markdown files):
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`

**Test Command**: N/A — test-type=manual. Per Jira: "No need to test this create-workflow workflow again after you've made this change — I'll be using it again soon and will confirm it works and fix it if it doesn't."

**Test Result**: ✅ Manual — human will verify when next using the `create-workflow` workflow.

---

## What Was Implemented

Added creation of the `ahq-workflow.json` metadata file to the `create-workflow` workflow. Two new pieces of information are now collected from the user during Command 01 (`workflow-short-id` + `exampleParameters`), and Command 02 now generates the metadata file during the build stage. Command 03 now validates the new file.

### Key implementation decisions:

1. **`workflow-short-id` travels via command-output-string; `exampleParameters` travels via the spec file.** Per the human's answer to Q1 in the AI summary: `exampleParameters` could contain complex characters/quotes that would be fragile to parse out of the inter-command plain-English string, so it is stored under a fixed "Workflow Metadata" section of the DRAFT/APPROVED spec and Command 02's new 4b reads it from there.
2. **`ahq-workflow-metadata-filename` placement differs between Command 01 and Commands 02–05.** In Commands 02–05 it's declared in Step 0b alongside `skills-dir`. In Command 01 `skills-dir` only exists from Step 4, so the metadata-filename variable is declared in Step 4 (not Step 0b).
3. **Command 02 build ordering: `ahq-workflow.json` is created before the TypeScript CLI.** New section `4b. Create ahq-workflow.json` sits between the command files (`4a`) and the CLI (`4c`). This matches the plan-mode list order from Step 3.
4. **Seven-field JSON schema taken verbatim from existing `ahq-workflow.json` files** (e.g. `agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json`). Fixed constants: `version: "1.0.0"`, `author.name: "Agentic HQ"`.
5. **Command 03 adds spec-check item #6 and a convention-compliance table row.** Existing items 6/7/8 were renumbered to 7/8/9. The check verifies the seven required fields exist and — if `exampleParameters` is non-empty — enforces the `-- ` prefix.
6. **Explicit `-- ` prefix enforcement and empty-string `""` convention for parameter-less workflows** were added as CRITICAL instructions in Command 01 Step 5, matching the existing convention already used by the `create-workflow` workflow itself.

### Bugs found and fixed during GREEN:

None — implementation went as planned. Cross-check greps confirmed all 5 command files now reference `workflow-short-id` (21 total occurrences) and `ahq-workflow-metadata-filename` (8 total occurrences) consistently.

## Files Created

None. This Jira edits existing command-instruction markdown files only. (The approved plan was also copied to `03-APPROVED-green-phase-implementation-plan-copy.md` under this same workflow directory per the command instruction.)

## Files Modified

- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` — new Step 3c `workflow-short-id`; renumbered 3c→3d; new `workflow-short-id` + `ahq-workflow-metadata-filename` derived vars in Step 4; new "Discussing Parameters and `exampleParameters`" subsection + new "Workflow Metadata" spec-template section in Step 5; `workflow-short-id` added to Step 6 `command-output-string`.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — parse `workflow-short-id` in Step 0a; add `workflow-short-id` + `ahq-workflow-metadata-filename` in Step 0b; added `ahq-workflow.json` bullet to Step 3 plan-mode list (bullet 2); inserted new Step 4b (`Create ahq-workflow.json`) with template and per-field source; renumbered 4b→4c, 4c→4d, 4d→4e.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` — parse `workflow-short-id` in Step 0a; add `workflow-short-id` + `ahq-workflow-metadata-filename` in Step 0b; inserted new spec-compliance item #6 validating the metadata file; renumbered existing 6→7/7→8/8→9; added new "ahq-workflow.json present and well-formed" row to Convention Compliance table.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md` — parse `workflow-short-id` in Step 0a; add `workflow-short-id` + `ahq-workflow-metadata-filename` in Step 0b. No other changes.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md` — parse `workflow-short-id` in Step 0a; add `workflow-short-id` + `ahq-workflow-metadata-filename` in Step 0b. No other changes.

---

## Ready for REFACTOR Phase

The manual test is out-of-scope per the Jira (human will verify later). This program will self terminate, and then (if running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-107 manual
```
