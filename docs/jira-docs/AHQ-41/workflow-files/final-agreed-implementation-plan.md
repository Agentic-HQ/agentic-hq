# Implementation Plan: AHQ-41 - Full Jira TDD Story Workflow CLI

## Context

AHQ-41 requests a full, interactive version of the Jira TDD Story Workflow demo CLI. A "quick" non-interactive version already exists (`src/demo/cli/quick-jira-workflow-demo-cli.ts`, AHQ-36) for automated testing. This new CLI will be Steve's real-world tool for executing Jira stories through the full interactive TDD workflow.

The CLI spawns Claude Code sessions via PTY (using `ClaudeCodeTool`), which allows full human interaction within each step. The CLI automatically chains steps together - each command self-terminates after completing its work, and the CLI picks up the output and runs the next command.

**No automated tests** - the Jira explicitly says TDD is skipped for this one. Acceptance is Steve running the full workflow and being happy with it.

---

## Step 0: Copy this approved plan

Copy this approved plan to `docs/jira-docs/AHQ-41/workflow-files/final-agreed-implementation-plan.md` before proceeding with implementation.

---

## Step 1: `git mv` the workflow directory

Move the workflow commands from their current location to the demos directory:

```
git mv .claude/commands/agentic-hq-commands/workflow/jira-story-workflow \
       .claude/commands/agentic-hq-commands/used-in-demos/full-jira-tdd-story-workflow
```

This changes the slash command prefix from:
- `/agentic-hq-commands:workflow:jira-story-workflow:*`

to:
- `/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:*`

Files moved (6 total - WARNING_RE_COMMITTING.md already deleted by human):
- `01-jira-read-and-question.md`
- `02-jira-write-failing-test.md`
- `03-jira-minimal-implementation.md`
- `04a-jira-refactor-analysis.md`
- `04b-jira-refactor-execute.md`
- `05-jira-validate.md`

---

## Step 2: Modify each command file for file-based I/O

Each of the 6 command files (01 through 05) needs three additions and some updates:

### 2a. Pattern to add to EACH command file

**At the top** - replace the `argument-hint` frontmatter and add new Variable section:
```markdown
Remember the following variable: command-input-output-files-directory = $0

## Step 0a: Read Input
Read the file: {command-input-output-files-directory}/command-input.json
Extract the `command-input-string` value. Parse out:
- `jira-id` - the Jira ID
- `project-root` - the absolute path to the project root
- `test-type` - the test type (only for commands 02, 03, 04a, 04b)
```

**At the bottom** - add output and self-terminate steps:
```markdown
## Write Output
Write to: {command-input-output-files-directory}/command-output.json
{"command-output-string": "<appropriate output string>"}

## Self-Terminate
cd to root of this project then run:
./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
```

### 2b. Per-command specifics

| Command | Output String | Special Changes |
|---------|--------------|-----------------|
| **01** | Comma-separated test types (e.g., "unit, e2e") | Add step to determine test types (like quick workflow 01). Remove Step 14 (tell human to run next command manually) - replace with Write Output + Self-Terminate |
| **02** | "RED phase complete for test-type {test-type}" | Remove the "tell human to run next command" at the end of Step 10. Replace with Write Output + Self-Terminate |
| **03** | "GREEN phase complete for test-type {test-type}" | Remove the "tell human to run next command" at the end of Step 10. Replace with Write Output + Self-Terminate |
| **04a** | "REFACTOR analysis complete for test-type {test-type}" | Remove the "tell human to run next command" at the end of Step 10. Replace with Write Output + Self-Terminate |
| **04b** | "REFACTOR execution complete for test-type {test-type}" | Remove the "tell human to run next command" at the end of Step 10. Replace with Write Output + Self-Terminate |
| **05** | "VALIDATE complete for {jira-id}" | Keep existing messaging (it already tells human to commit/merge). Add Write Output + Self-Terminate at the end |

### 2c. Update ALL cross-references within command files

Every reference to `jira-story-workflow` inside the command files needs updating. This includes:
- References like `/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation`
- Change to `/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:03-jira-minimal-implementation`
- Also file path references like `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/02-jira-write-failing-test.md`

### 2d. Update variable blocks

Each command's Variables section currently has things like:
```
jira-id = $0
test-type = $1
```

These need to change to derive from the parsed input file instead of `$0`/`$1`.

---

## Step 3: Create the CLI file

Create `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` modelled on `src/demo/cli/quick-jira-workflow-demo-cli.ts`.

Key differences from quick workflow CLI:

| Aspect | Quick Workflow | Full Workflow |
|--------|---------------|---------------|
| Commands | 5 (01, 02, 03, 04, 05) | 6 (01, 02, 03, 04a, 04b, 05) |
| Loop per test type | RED → GREEN → REFACTOR | RED → GREEN → REFACTOR-analysis → REFACTOR-execute |
| After loop | Transition Jira to Done | Run VALIDATE once (it tells human to commit/merge) |
| At end | (done) | (done - command 05 handles the messaging) |
| Command prefix | `used-in-demos:quick-jira-workflow` | `used-in-demos:full-jira-tdd-story-workflow` |

**CLI structure:**
```typescript
// 1. Parse args (--jira-id, optional --project-root)
// 2. Auto-detect project root from git if not provided
// 3. Run command 01 (read & question) -> returns test types
// 4. Parse test types from output
// 5. For each test type:
//    a. Run command 02 (RED)
//    b. Run command 03 (GREEN)
//    c. Run command 04a (REFACTOR analysis)
//    d. Run command 04b (REFACTOR execute)
// 6. Run command 05 (VALIDATE) once — it tells the human to commit/merge
```

Reuse from quick workflow:
- `buildVariablesString()` function (same pattern)
- `ClaudeCodeTool` import and usage
- Commander CLI setup
- Git root auto-detection

---

## Step 4: Add package.json script

Add to the `scripts` section of `package.json`:
```json
"demo:full-jira-tdd-story-workflow": "tsx src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts"
```

---

## Step 5: Run `pnpm validate`

Run `pnpm validate` to ensure:
- TypeScript compiles without errors
- Linting passes
- Existing tests still pass (we didn't break anything)

---

## Step 6: Verification

Manual verification by running:
```bash
pnpm demo:full-jira-tdd-story-workflow --jira-id=AHQ-41
```

(This is the acceptance test per the Jira - Steve runs it and says he's happy.)

---

## Files to Create/Modify

| Action | File | Notes |
|--------|------|-------|
| **git mv** | `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/` → `.claude/commands/agentic-hq-commands/used-in-demos/full-jira-tdd-story-workflow/` | 6 files (WARNING_RE_COMMITTING.md already deleted) |
| **Modify** | `.../full-jira-tdd-story-workflow/01-jira-read-and-question.md` | Add I/O + test type determination |
| **Modify** | `.../full-jira-tdd-story-workflow/02-jira-write-failing-test.md` | Add I/O + update refs |
| **Modify** | `.../full-jira-tdd-story-workflow/03-jira-minimal-implementation.md` | Add I/O + update refs |
| **Modify** | `.../full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md` | Add I/O + update refs |
| **Modify** | `.../full-jira-tdd-story-workflow/04b-jira-refactor-execute.md` | Add I/O + update refs |
| **Modify** | `.../full-jira-tdd-story-workflow/05-jira-validate.md` | Add I/O + update refs |
| **Create** | `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` | New CLI file |
| **Modify** | `package.json` | Add `demo:full-jira-tdd-story-workflow` script |
