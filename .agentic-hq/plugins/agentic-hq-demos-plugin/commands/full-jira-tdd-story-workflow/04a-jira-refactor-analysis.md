You are executing the first part of the REFACTOR phase in the Jira Story Workflow: **Refactor Analysis**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your role is to **analyze the code** written in the GREEN phase and **propose refactors** for human review. You will NOT execute any refactors yet - that happens in the next command after human approval.

**Remember**: Refactoring improves code structure WITHOUT changing behavior. Tests must pass before AND after.

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `project-root` - the absolute path to the project root directory
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 0b: Establish Variables

```
jira-id = (parsed from input file above)
test-type = (parsed from input file above)
project-root = (parsed from input file above)
jira-docs-root = {project-root}/docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
test-type-files = {workflow-files}/{test-type}-test-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
green-phase-plan-file = {test-type-files}/03-green-phase-implementation-plan.md
green-phase-file = {test-type-files}/03-green-phase-summary-of-what-was-implemented.md
refactor-analysis-file = {test-type-files}/04a-refactor-phase-proposed-refactors.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:04a-jira-refactor-analysis AHQ-123 unit`"

**Check test-type:**
If `{test-type}` is empty or not one of: `unit`, `integration`, `smoke`, `e2e`, STOP and tell the user:
> "Please provide a valid test type: `unit`, `integration`, `smoke`, or `e2e`.
>
> Usage: `/jira-story-workflow:04a-jira-refactor-analysis AHQ-123 unit`"

## Step 2: Check Pre-requisites

**Check GREEN phase file exists:**
Check that `{green-phase-file}` exists. If it doesn't exist, STOP and tell the user:
> "The GREEN phase file doesn't exist at `{green-phase-file}`.
>
> You need to complete the GREEN phase before refactoring:
> ```
> /agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation {jira-id} {test-type}
> ```"

## Step 3: Check for Existing Analysis File

Check if the file `{refactor-analysis-file}` already exists.

If it exists, **STOP** and ask the user:
> "The refactor analysis file already exists at `{refactor-analysis-file}`.
>
> This suggests the {test-type} test REFACTOR analysis has been run previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and start fresh
> 2. **Read existing and continue to execute** - Skip to 04b to execute approved refactors
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 4: Verify Tests Pass BEFORE Refactoring

**CRITICAL: Confirm we're starting from GREEN.**

- If {test-type} == 'unit': Run `pnpm test`
- If {test-type} is 'integration', 'smoke', or 'e2e': **DO NOT run the full suite.** Instead, run only the specific test file(s) for this Jira. Tell the user:
  > "NOTE: Running all {test-type} tests has been skipped to conserve Claude Code plan credits. Only running the specific test file(s) for this Jira to confirm GREEN. Please run `pnpm test:{test-type}` manually if you want a full suite check."

If ANY test fails, **STOP** and tell the user:
> "Tests are failing BEFORE refactoring. Cannot proceed with REFACTOR phase.
>
> The REFACTOR phase requires all tests to pass first. Please fix the failing tests and re-run GREEN phase."

## Step 5: Read Context

Read the following files to understand what was planned and implemented:
0. `{green-phase-plan-file}` - The plan that was made and then implemented for GREEN phase
1. `{green-phase-file}` - What was created in GREEN phase
2. The actual implementation file(s) mentioned in the GREEN phase document
3. The test file(s) for this test type
4. Use the jira-verbatim-content-extractor agent to obtain all the details of the Jira you are working on *and* any parent and child Jiras.  Use this information to obtain an understanding of what you are refactoring, what the constraints, requirements and the acceptance criteria were and the EXACT commands that you need to run to make sure the tests stay GREEN when the refactor happens for this test type.

## Step 6: Analyze Code for Potential Refactors

Analyze the code created in the GREEN phase looking for:

### 🔴 CRITICAL: Magic Constants Check (MUST DO FIRST)

**You MUST extract ALL magic constants. No exceptions.**

Magic constants are literal values (numbers, strings) used directly in code without a named constant.

> **Perplexity research**: "Explicit naming improves readability and maintainability for all developers. The most effective way to eliminate magic numbers is to assign them descriptive names and store them in constants. Named constants reduce the risk of accidentally using the wrong value and make code self-documenting."

**Examples of values that MUST be extracted (even if they seem "obvious"):**
- `0` → `EXIT_CODE_SUCCESS` (what does 0 mean? success? failure? index?)
- `'temp'` → `TEMP_DIRECTORY_NAME` (is this a temp dir? a temp file? a prefix?)
- `80` → `DEFAULT_TERMINAL_COLUMNS` (why 80? what is it for?)
- `2` → `JSON_INDENT_SPACES` (indent? retry count? array index?)
- `'.agentic-hq'` → `AGENTIC_HQ_WORKING_DIRECTORY` (makes the path structure self-documenting)
- `'claude'` → `DEFAULT_CLAUDE_EXECUTABLE` (what CLI? documented in JSDoc is NOT an excuse!)
- `'test input'` → `TEST_INPUT_STRING` (test data needs extraction too!)
- `'expected output'` → `EXPECTED_OUTPUT_STRING` (makes test assertions self-documenting)

**How to check:**
1. Read each implementation file line by line
2. Look for ANY literal number or string that represents a value, path, key, timeout, or identifier
3. For EACH one found, check if it has a named constant - if not, it's a magic constant

**In your analysis document, you MUST include a Magic Constants Audit table:**

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `file.ts` | 85 | `80` | ⚠️ MAGIC | → `DEFAULT_TERMINAL_COLUMNS` |
| `file.ts` | 32 | `'xterm-256color'` | ✅ EXTRACTED | `PTY_TERMINAL_TYPE` |

**If ANY magic constants are found, add them to Tier 1 refactors.**

### Tier 1: Always-Safe Refactors (Auto-approved)

These will be auto-executed without human approval:

| Refactor Type | Description |
|---------------|-------------|
| **Extract magic constants** | Replace magic numbers/strings with named constants - THIS IS THE MOST COMMON REFACTOR |
| **Naming improvements** | Rename variables/functions for clarity |
| **Duplication removal (within file)** | Extract repeated code within the same file |
| **Simplify conditionals** | Reduce nested if/else, simplify boolean logic |
| **Remove dead code** | Delete unused variables, unreachable code |
| **Fix obvious code smells** | Long lines, inconsistent formatting |

### Tier 2: Structural Refactors (Require Human Approval)

These need human approval because they may be "gold-plating":

| Refactor Type | Description | Risk |
|---------------|-------------|------|
| **Create new abstractions** | New interfaces, abstract classes | May be premature |
| **Extract to new file/module** | Split code into separate files | May over-modularize |
| **Introduce design patterns** | Factory, Strategy, Observer, etc. | May over-engineer |
| **Create helper classes** | New utility classes | May be YAGNI |
| **Cross-file refactoring** | Changes affecting multiple files | Higher risk |
| **Add generalization** | Make code more generic "for future use" | Classic gold-plating |

NOTE: Zero refactors is a valid outcome - if the code is minimal, well named, well commented, well structured and doesn't need additional abstractions/deduplication etc.

## Step 7: Create Refactor Analysis Document

Create the file `{refactor-analysis-file}` with the following structure:

```markdown
# REFACTOR Analysis: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: REFACTOR (Analysis)
**Generated**: {current date/time}

---

## Guidance for Human Reviewer

### The "Has It Earned It?" Question

Before approving Tier 2 refactors, ask yourself:
- **Is this code stable?** Will it change significantly in the next few stories?
- **Is this pattern repeated?** Rule of Three - only abstract when pattern appears 3+ times
- **Is this code important?** Is it core functionality or a one-off utility?
- **Will this abstraction be used?** Or is it speculative "just in case" design?

### Research on Limiting Refactoring (from Perplexity)

**Key principle**: Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller steps.

**Always-safe refactors** (low risk of over-engineering):
- Removing duplication within a single function or small module
- Improving variable/function names for clarity
- Simplifying conditionals or extracting constants

**Requires caution** (prone to gold-plating):
- Creating new abstractions or interfaces
- Extracting methods into separate classes
- Introducing design patterns
- Building "stepping stones" toward future features

**The anti-pattern to avoid**: "Beware of gold plating" - building intermediate functionality to make future work easier when that future work may never come.

**Rule of Three**: Only create an abstraction when the same pattern appears 3+ times in the codebase, not speculatively.

---

## Pre-Refactor Test Status

**Command**: `{pnpm test command}`
**Result**: ✅ PASSING (X tests)

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------|
| 1.1 | {type} | {description} | `{file}` Line: `{lineNum}` |
| 1.2 | {type} | {description} | `{file}` Line: `{lineNum}`|
| ... | ... | ... | ... |

**Or if none:**
> No Tier 1 refactors identified. Code is already clean at this level.

---

## Tier 2: Proposed Refactors (Require Approval)

These require your approval before execution:

### Refactor 2.1: {Title}

**Type**: {e.g., "Create new abstraction", "Extract to new file"}
**Description**: {What the refactor would do}
**Justification**: {Why AI thinks this is valuable}
**Risk**: {Why this might be gold-plating}
**Files affected**: `{file1}`, `{file2}`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, code hasn't earned this yet
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

### Refactor 2.2: {Title}

{Same structure as above}

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | X |
| Tier 2 (Pending approval) | Y |
| **Total proposed** | X+Y |

---

## Next Steps

1. Review the Tier 2 refactors above
2. Mark each as APPROVE / REJECT / DEFER
3. Add any comments explaining your decision
4. Run the execute command:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04b-jira-refactor-execute {jira-id} {test-type}
```
```

## Step 8: Handle "No Refactors Needed" Case

If the code is already clean and you find NO refactors (Tier 1 or Tier 2), create a simpler document:

```markdown
# REFACTOR Analysis: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: REFACTOR (Analysis)
**Generated**: {current date/time}

---

## Pre-Refactor Test Status

**Command**: `{pnpm test command}`
**Result**: ✅ PASSING (X tests)

---

## Magic Constants Audit

**ZERO magic constants found.** All literal values are extracted to named constants at the top of the file.

| File | Line | Value | Status | Constant Name |
|------|------|-------|--------|---------------|
| {file} | {line} | {value} | ✅ EXTRACTED | `{CONSTANT_NAME}` |
| ... | ... | ... | ... | ... |

---

## Analysis Result: No Refactors Needed

The code created in the GREEN phase is already clean:
- ✅ **ZERO magic constants** - all values extracted to named constants
- ✅ No duplication detected
- ✅ Names are clear and descriptive
- ✅ No obvious code smells
- ✅ No structural improvements warranted at this stage

**Recommendation**: Skip the refactor execute phase and proceed to VALIDATE.

---

## Next Steps

Since no refactors are needed, proceed directly to verification:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate {jira-id} {test-type}
```

Or if you want to proceed to the next test type in the TDD cycle.
```

## Step 9: Add Comment to Jira

Load the Jira comment tool using `ToolSearch` with query `select:mcp__mcp-atlassian__jira_add_comment`, then use it to add a comment to {jira-id}:

> AI Agent has completed REFACTOR analysis for {test-type} test.
>
> **Tier 1 refactors (auto-approved)**: {count}
> **Tier 2 refactors (pending approval)**: {count}
>
> Analysis documented at: `{refactor-analysis-file}`
>
> Human review required for Tier 2 refactors before execution.

## Step 10: Present to Human

After creating the file, tell the human:

> "I've completed the REFACTOR analysis for {jira-id} ({test-type} test).
>
> **Tier 1 (Auto-approved)**: {count} refactors - will execute automatically
> **Tier 2 (Needs your approval)**: {count} refactors - please review
>
> Analysis at: `{refactor-analysis-file}`
>
> Please review the Tier 2 refactors and mark each as APPROVE/REJECT/DEFER.
> The CLI will automatically proceed to the REFACTOR execute phase next."

## Step 11: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "REFACTOR analysis complete for test-type {test-type}"
}
```

## Step 12: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

---

## Important Notes

- **Analysis only**: This command does NOT modify any code - it only proposes changes
- **Tests must pass first**: Never analyze code that has failing tests
- **Be conservative**: When in doubt, classify as Tier 2 for human review
- **Rule of Three**: Don't propose abstractions unless a pattern appears 3+ times
- **No speculation**: Don't propose refactors "for future flexibility" - that's gold-plating
