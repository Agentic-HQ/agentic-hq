# AI Summary: AHQ-107

**Jira**: [AHQ-107](https://agentic-hq.atlassian.net/browse/AHQ-107)
**Title**: Add Creation Of New ahq-workflow.json Metadata File To create-workflow Workflow
**Status**: In Progress (assigned to Steve Halso)
**Generated**: 2026-04-17 (updated after Jira description was expanded by human)

---

## My Understanding of This Task

AHQ-103 introduced a requirement that every AHQ workflow have an `ahq-workflow.json` metadata file (in its skill directory). All existing workflows were updated. The `create-workflow` workflow — which builds NEW workflows on demand — was not updated. This Jira closes that gap.

Scope was broader than my first read suggested. After the updated Jira description, changes touch **all five commands** in `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/`:

**All five commands (01–05):**
- Add a new derived variable to Step 0b: `ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json`

**Command 01 (`01-explain-to-user-how-workflows-work-and-get-workflow-details.md`):**
- Step 3 "Ask User for Workflow Details": insert new `3c` to collect the **workflow shortId** (with explanation of where it's used, e.g. CLI "agentic-hq math", plus examples). Shift existing `3c. one-sentence-description` to `3d`.
- Step 4 "Establish Derived Variables": add new `workflow-short-id` variable.
- Step 5 "Collaboratively Create DRAFT Workflow Spec": add detail about discussing with the user any **parameters** they want their workflow to accept, using the Full Jira workflow (`agentic-hq full-jira -- --jira-id=AHQ-107`) as an example. The AI must guide the user to produce an `exampleParameters` value. **CRITICAL**: spec/instructions must enforce that `exampleParameters` always starts with `-- ` so they are passthrough parameters. **If the user's workflow takes NO parameters, `exampleParameters` must be set to an empty string `""`** (this is the existing convention — e.g. the `create-workflow` workflow itself uses `"exampleParameters": ""`).
- Step 6 `command-output-string`: add `workflow-short-id` only. **`exampleParameters` is NOT passed via the command-output-string** — per Q1 answer, it lives in the DRAFT spec and Command 02 reads it from there.

**Commands 02, 03, 04, 05:**
- Step 0a "Read Input": parse the new `workflow-short-id` variable from the input string.
- Step 0b "Establish Variables": store `workflow-short-id` (from input) and add the derived `ahq-workflow-metadata-filename` variable.

**Command 01 Step 5 (DRAFT spec) additionally (per Q5):**
- Add a "Workflow Metadata" section to the DRAFT spec template recording `workflow-short-id` and `exampleParameters`. Command 02 will read `exampleParameters` from here when writing the `ahq-workflow.json`.

**Command 02 additionally:**
- Step 3 "Enter Plan Mode" (per Q3): add `ahq-workflow.json` to the list of artifacts the plan must cover — a new bullet between command files and TypeScript CLI.
- Step 4 "Build the Workflow" (per Q4): renumber existing sub-sections and insert the new one:
  - new `4b. Create ahq-workflow.json` (new section — full instructions + template, reads `exampleParameters` from the approved spec)
  - `4c. Create TypeScript CLI` (was `4b`)
  - `4d. Create SKILL.md` (was `4c`)
  - `4e. Create package.json and tsconfig.json` (was `4d`)

**Command 03 additionally (per Q2):**
- Add a check step that verifies `ahq-workflow.json` exists at `{ahq-workflow-metadata-filename}` and contains the required fields (`pluginId`, `skillId`, `shortId`, `description`, `exampleParameters`, `version`, `author.name`).

**test-type: `manual`.** Human explicitly stated: "No need to test this create-workflow workflow again after you've made this change — I'll be using it again soon and will confirm it works and fix it if it doesn't."

## Research Findings

No external research needed; context comes from the repo.

### ahq-workflow.json schema (locked — all existing files match exactly)

```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "math-workflow",
  "shortId": "math",
  "description": "Solves a math problem using an agent team",
  "exampleParameters": "-- --input-number=11",
  "version": "1.0.0",
  "author": {
    "name": "Agentic HQ"
  }
}
```

Mapping from create-workflow variables → JSON fields:
- `pluginId` ← `plugin-id`
- `skillId` ← `workflow-id`
- `shortId` ← `workflow-short-id` (NEW, collected in 01 Step 3c)
- `description` ← `one-sentence-description`
- `exampleParameters` ← decided with user in 01 Step 5 (must start with `-- `; empty string `""` if workflow takes no parameters)
- `version` ← constant `"1.0.0"` for new workflows
- `author.name` ← constant `"Agentic HQ"` for new workflows

### Current commands in the directory

All five currently parse only `agentic-hq-workspace-root-dir`, `plugin-id`, `workflow-id`. None parse `workflow-short-id` or `exampleParameters`. All need updating per above.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md`

Document concerns OO TypeScript code (class/interface pairs, SRP, tell-don't-ask, avoiding cached state, concept tables, data dictionaries, ELD). **Not directly applicable here**: this Jira edits markdown command-instruction files, not TypeScript source. The only loosely-applicable principle is general clarity/consistency of the instruction templates we author.

No concept table, data dictionary, or ELD section is needed for this Jira.

## Questions for Human

The updated Jira answered most of my original questions. A few small clarifications remain:

### Question 1: How does `exampleParameters` travel from Command 01 → Command 02?

The new Step 5 in Command 01 produces an `exampleParameters` value via discussion with the user. Command 02 needs this value to write it into `ahq-workflow.json`.

The Jira only says `workflow-short-id` should be added to `command-output-string`. It doesn't mention `exampleParameters`. Two options:

- **Option A — Pass via command-output-string too.** Add `example-parameters` alongside `workflow-short-id` in the output of 01 and the input parsing of 02–05. Pro: explicit, no reliance on parsing a markdown spec. Con: the string contains `--` and flags, slightly less readable; needs careful quoting.
- **Option B — Store only in the DRAFT spec; Command 02 reads it from the spec file.** The DRAFT spec already gets read by Command 02 as context. Pro: matches how other design details (commands, descriptions) already flow through the spec. Con: relies on the AI accurately extracting the value from markdown.

I recommend **Option A** (explicit, less fragile). OK?

**Human's Response**:
> Answer: *Option B. Reason: This exampleParameters will be recorded in the spec.  As it could be empty, or contain complex characters/strings/quotes that may cause problems/confusion with the AI parsing the string between commands I have chosen not to have this as an input/output parameter for the workflow.  Instead it will be stored in the spec and obtained from there (if set) to be used to construct the ahq-workflow.json metadata files in command 02.  In the future, if we implement a feature that allows multiple objects/strings to be safely passed between commands (e.g. in a Json file) we may revisit this and pass it as input/output parameters instead of embedded in the spec.

---

### Question 2: Should Command 03 (`run-checks-on-workflow.md`) be updated to verify `ahq-workflow.json` exists and is valid?

Command 03 does quality checks on the generated workflow files. A natural extension is to have it check that `ahq-workflow.json` is present at `{ahq-workflow-metadata-filename}` and contains the expected fields.

The Jira doesn't mention this. Options:

- **A. Skip**: Only add the variable (as the Jira states) — don't add a new check.
- **B. Include**: Add a small check step to Command 03 that verifies the metadata file exists and has the required fields.

I recommend **A (skip)** — stay narrowly within the Jira scope. You mentioned you'll confirm/fix when you use the workflow next. OK?

**Human's Response**:
> **B. Include** - well spotted!

---

### Question 3: Should Command 02 Step 3 (Enter Plan Mode) list `ahq-workflow.json` in the plan coverage?

Step 3 in 02 currently lists what the plan must cover: 0. Copy spec, 1. Command files, 2. TypeScript CLI, 3. SKILL.md, 4. package.json, 5. tsconfig.json.

The new Step 4 build section creates `ahq-workflow.json`. For the plan to match the build, it should be listed in Step 3 too. Recommend adding it as a new bullet between the command files and the TypeScript CLI. OK?

**Human's Response**:
> Yes. Good idea.  It should all be fully consistent.

---

### Question 4: Section numbering in Command 02 — confirm renumber?

Jira: "New section inserted before `### 4b. Create TypeScript CLI`". I will therefore:
- New section becomes `4b. Create ahq-workflow.json`
- Existing `4b` (TS CLI) → `4c`
- Existing `4c` (SKILL.md) → `4d`
- Existing `4d` (package.json/tsconfig) → `4e`

OK?

**Human's Response**:
> Yes.

---

### Question 5: DRAFT spec template — add a field for `exampleParameters` and `workflow-short-id`?

Command 01 Step 5 currently writes a DRAFT spec markdown file with sections: Overview, Commands, What Success Looks Like, AI Questions. Since we're now collecting `workflow-short-id` and `exampleParameters` as first-class details, should the DRAFT spec header/template also record them explicitly (e.g. under a new "Workflow Metadata" section) so they are preserved for human review and for downstream commands?

Recommend **yes** — add to the spec template so the information is visible in the artifact. OK?

**Human's Response**:
> Yes.

---

## Files I Reviewed

- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-…get-workflow-details.md` — **will modify.** Understood current Step 3 / Step 4 / Step 5 / Step 6 structure.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — **will modify.** Understood Step 0b variables and 4a–4d build sections.
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` — **will modify** (Step 0a + 0b only).
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md` — **will modify** (Step 0a + 0b only).
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md` — **will modify** (Step 0a + 0b only).
- Six existing `ahq-workflow.json` files (math, full-jira, quick-jira, string-reversal, create-workflow, string-reversal-copy-for-test) — schema confirmed identical.
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` — confirms all 5 semantic fields are consumed.
- `docs/dev/project-design-requirements.md` — read in full; not directly applicable (concerns OO TS code).
- Jira AHQ-103 (parent/reference) — confirms the canonical 7-field JSON schema.

**Most important findings:**
1. Scope is now five command files (not one).
2. Two new pieces of info must be collected from the user: `shortId` and `exampleParameters` (the latter must enforce `-- ` passthrough prefix).
3. `test-type: manual`; no re-test required.

## Test Types And Tests We Will Be Implementing

**Test types: `manual`** (single phase — no automated tests)

- **What the AI will implement**: Edits to all five command files (01–05) per the detailed list in "My Understanding" above. No TypeScript/code changes.
- **What the human will manually test**: Human will re-run the `create-workflow` workflow the next time they build a workflow and verify that a correctly populated `ahq-workflow.json` is generated in the new workflow's skill directory. Per Jira, no in-story test is required.

## Ready for Next Step

All questions resolved. Agreed decisions (see Q&A above) are now reflected in the "My Understanding" section. Test type is `manual`. This summary is complete and ready to hand off to the next workflow command.
