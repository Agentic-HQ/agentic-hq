You are executing Command 03 of the Create Workflow workflow: **Run Checks on Workflow**.

Your role is to verify that the workflow built in Command 02 matches the approved spec, follows established conventions, and then suggest potential refactorings for the user to approve.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow and workflow-short-id=my`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)
- `plugin-id` — the plugin where the workflow lives
- `workflow-id` — the workflow identifier
- `workflow-short-id` — the short CLI alias for the workflow

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
plugin-id = (parsed from input)
workflow-id = (parsed from input)
workflow-short-id = (parsed from input)
project-root = (your primary working directory)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
plugin-manifest-filename = {plugin-dir}/.claude-plugin/plugin.json
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
ts-workflow-dir = {skills-dir}/ts-workflow
ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
approved-workflow-spec-filename = {workflow-creation-docs-dir}/02a-APPROVED-workflow-spec.md
workflow-implementation-approval-list-file = {workflow-creation-docs-dir}/03a-workflow-implementation-approval-list.md
workflow-potential-refactorings-file = {workflow-creation-docs-dir}/03b-workflow-potential-refactorings.md
example-workflow-commands-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow
example-workflow-skill-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
2. **All files in `{workflow-creation-docs-dir}`** — spec, verbatim copy, any other process docs
3. **All generated workflow code**:
   - All files in `{commands-dir}` — the command .md files that were created
   - All files in `{skills-dir}` — SKILL.md, CLI .ts, package.json, tsconfig.json
4. **Example workflow files for convention comparison**:
   - All `.md` files in `{example-workflow-commands-dir}`
   - `{example-workflow-skill-dir}/SKILL.md`
   - `{example-workflow-skill-dir}/ts-workflow/src/math-workflow-demo-cli.ts`

---

## Step 2: Check Spec Compliance

Go through every element in `{approved-workflow-spec-filename}` and verify the implementation matches. For each item, check:

1. **All commands defined in the spec exist** as .md files in `{commands-dir}`
2. **Each command's inputs/outputs match** what the spec defines
3. **The CLI chains commands in the correct order** as defined in the spec
4. **SKILL.md exists** and correctly references the CLI
5. **package.json and tsconfig.json exist** with correct dependencies
6. **`ahq-workflow.json` exists and is valid** — confirm the file exists at `{ahq-workflow-metadata-filename}`, is valid JSON, and contains all seven required fields: `pluginId`, `skillId`, `shortId`, `description`, `exampleParameters`, `version`, `author.name`. Verify each field's value matches the values from the approved spec / variable chain (e.g. `pluginId` equals `plugin-id`, `skillId` equals `workflow-id`, `shortId` equals `workflow-short-id`, `description` equals `one-sentence-description`). If `exampleParameters` is non-empty, verify it starts with `-- `.
7. **Plugin manifest (`{plugin-manifest-filename}`) exists and is valid** — confirm the file exists at `{plugin-manifest-filename}` (i.e. `{plugin-dir}/.claude-plugin/plugin.json`), is valid JSON, and contains all four required fields: `name`, `description`, `version`, `author.name`. Verify `name` equals `plugin-id`. This check applies regardless of whether the manifest was created in this `create-workflow` run or already existed — both cases should result in a valid manifest at the end. Without this file, Claude Code's `--plugin-dir` flag will not load the plugin.
8. **Variable naming conventions** match the math-workflow pattern (kebab-case, $0 for temp dir)
9. **Self-termination** is present at the end of every command
10. **Context loading** — each command (beyond the first) reads previous commands and generated files

Create the file `{workflow-implementation-approval-list-file}` with the results:

```markdown
# Workflow Implementation Approval List: {workflow-id}

**Spec**: {approved-workflow-spec-filename}
**Generated**: {current date}

---

## Checklist

| # | Spec Requirement | Status | Notes |
|---|-----------------|--------|-------|
| 1 | {requirement} | PASS/FAIL | {notes} |
| 2 | {requirement} | PASS/FAIL | {notes} |
| ... | ... | ... | ... |

---

## Convention Compliance

| Convention | Status | Notes |
|-----------|--------|-------|
| Command structure (Step 0a/0b pattern) | PASS/FAIL | |
| Variable naming (kebab-case) | PASS/FAIL | |
| Self-termination at end | PASS/FAIL | |
| File-based I/O (command-input/output.json) | PASS/FAIL | |
| Context loading in commands 02+ | PASS/FAIL | |
| ahq-workflow.json present and well-formed | PASS/FAIL | |
| Plugin manifest (plugin.json) present and well-formed | PASS/FAIL | |
| Generated TS CLI installs and typechecks cleanly | PASS/FAIL | (filled in by Step 2A — leave as `PASS/FAIL` placeholder when writing the file in this step) |

---

## Summary

{Overall assessment — does the implementation match the spec?}
```

Present the results to the user.

---

## Step 2A: Install Deps + Typecheck the Generated TS CLI

The Step 2 checks above verify file existence, JSON validity, and convention compliance. This step goes one level deeper and verifies the **generated TypeScript CLI actually compiles** — file-level checks alone could green-light a CLI with real type errors (wrong import path, wrong Commander API usage, bad tsconfig setting) that nobody would discover until the workflow is run for the first time (or until someone opens the file in VSCode and sees red squigglies).

This step fills in the **"Generated TS CLI installs and typechecks cleanly"** row that Step 2 added to `{workflow-implementation-approval-list-file}` — that row is left as `PASS/FAIL` placeholder by Step 2 and resolved here.

### 2A.1: Install dependencies

Run:

```bash
cd {ts-workflow-dir} && pnpm install --ignore-workspace
```

`--ignore-workspace` keeps this install isolated from any parent pnpm workspace.

This creates two things on disk:
- **`{ts-workflow-dir}/node_modules/`** — gitignored by convention (every existing `ts-workflow/` directory in the repo follows this).
- **`{ts-workflow-dir}/pnpm-lock.yaml`** — **NOT gitignored**; convention is to commit it. Tell the user explicitly: *"Generated `pnpm-lock.yaml` at `{ts-workflow-dir}/pnpm-lock.yaml` — please include this in your workflow's commit. Convention across all `ts-workflow/` directories in the repo is to track lockfiles."*

If `pnpm install` fails, capture the error output verbatim, write FAIL into the row's Status column with the error in the Notes column, surface the failure to the user, and STOP this step (do not attempt the typecheck — it would fail for unrelated reasons). Do not attempt to fix the install error here; that's Command 02 scaffolding territory.

### 2A.2: Typecheck the generated CLI

#### Pick the TypeScript version

Before running the typecheck, **verify the pinned TypeScript major.minor below still matches the agentic-hq root project's TypeScript version** so the typecheck behaves the same way as the root's `pnpm validate`.

1. Read `{agentic-hq-workspace-root-dir}/package.json`.
2. Find the `typescript` entry under `devDependencies` (or `dependencies`). It will be a semver range like `"^5.9.3"`.
3. Extract the major.minor (e.g. `5.9` from `"^5.9.3"`).
4. Compare against the pinned major.minor in the `pnpm dlx` command immediately below (currently `5.9`):
   - **If they match**: proceed with the command as written.
   - **If they don't match**: this Command 03 file's pin is stale relative to the root. Use the root's major.minor for *this* check (so the workflow-being-created is typechecked against the same TS the root uses), then surface the discrepancy to the user with: *"The TypeScript pin in `create-workflow`'s Command 03 (`typescript@<old>`) is older than the agentic-hq root's `typescript@<new>`. I used `typescript@<new>` for this check. Please bump the pin in `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` so future workflow-creation runs use the up-to-date version."*

#### Run the typecheck

```bash
cd {ts-workflow-dir} && pnpm --package=typescript@5.9 dlx tsc --noEmit -p tsconfig.json
```

(Substitute the root's major.minor here if the previous sub-step found a mismatch.)

**Why `pnpm dlx typescript@<version>` rather than adding `typescript` to the bundled `ts-workflow/package.json` as a devDep:**
- Avoids inflating every workflow's `package.json` and `pnpm-lock.yaml` with a `typescript` entry.
- Avoids ~50 MB of additional `node_modules/` per workflow (only partially mitigated by pnpm's content-addressable store).
- `pnpm dlx` is a built-in subcommand of `pnpm` — which IS already a documented prerequisite of Agentic HQ (see README.md "Prerequisites" section) — so no new install requirement is introduced.
- The pinned `typescript@5.9` lives once here in Command 03; bump it centrally and all future workflow-creation runs use the new version.

If `tsc --noEmit` exits zero (no type errors), write PASS into the row.

If `tsc --noEmit` exits non-zero, write FAIL into the row's Status column, paste the error output verbatim into the Notes column (or into a sub-section under the table if it's long), and surface the failure to the user. Do NOT attempt to fix the errors as part of this step — Command 03 is verification-only. The user decides whether to (a) regenerate the relevant file by hand, or (b) treat it as a Command 02 scaffolding bug to fix before the next `create-workflow` run.

---

## Step 3: Suggest Refactorings

Analyze the generated workflow code and suggest **3 potential refactorings**. For each, include:
- What the refactoring is
- Why it might be beneficial
- Your recommendation: **DO** (worth doing now) or **SKIP** (not worth the effort)

Create `{workflow-potential-refactorings-file}`:

```markdown
# Potential Refactorings: {workflow-id}

**Generated**: {current date}

---

## AI-Suggested Refactorings

### Refactoring 1: {title}
- **What**: {description}
- **Why**: {benefit}
- **AI Recommendation**: DO / SKIP
- **Human Decision**: __________ (APPROVE / REJECT)

### Refactoring 2: {title}
{... same structure ...}

### Refactoring 3: {title}
{... same structure ...}

---

## Human-Suggested Refactorings

{Add your own refactoring suggestions here, using the same format as above}

### Refactoring H1: {title}
- **What**: {description}
- **Why**: {benefit}
- **Human Decision**: APPROVE

---

## Instructions

Please review each refactoring above and write APPROVE or REJECT next to "Human Decision".
Add any of your own suggestions in the "Human-Suggested Refactorings" section.
When done, tell the AI to proceed.
```

---

## Step 4: Get Human Review

Present the refactorings document to the user and ask them to:

1. Review each AI-suggested refactoring and decide APPROVE or REJECT
2. Add any of their own refactoring suggestions
3. Tell you when they're done

**STOP and WAIT** for the human to review and respond.

---

## Step 5: Implement Approved Refactorings

Once the human has reviewed:

1. Read the updated `{workflow-potential-refactorings-file}` to see their decisions
2. Implement any refactorings marked APPROVE (both AI-suggested and human-suggested)
3. For each refactoring implemented, update the file to show it's done

If no refactorings were approved, skip this step and tell the user.

---

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "{workflow-id}"
}
```

---

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
