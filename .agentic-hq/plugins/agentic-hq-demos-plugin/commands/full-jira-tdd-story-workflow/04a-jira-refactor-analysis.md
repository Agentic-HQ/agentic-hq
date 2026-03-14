You are executing the first part of the REFACTOR phase in the Jira Story Workflow: **Refactor Analysis**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your role is to **analyze the code** written in the GREEN phase, analyse the documents produced in previous phases, **propose refactors** for human review and discuss the human's proposed refactors. You will NOT execute any refactors yet - that happens in the next command (04b) after human approval.

**The overall flow**: AI surfaces all potential refactors -> human marks each as APPROVE / REJECT / DISCUSS and adds their own -> AI and human discuss the DISCUSS items + all human-identified items -> AI produces one Agreed Refactors table -> These Agreed Refactors will be executed by another agent (not you) when the 04b-jira-refactor-execute command is run.

**Remember**: Refactoring improves code structure WITHOUT changing behavior. Tests must pass before AND after.

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 0b: Establish Variables

```
jira-id = (parsed from input file above)
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
test-type = (parsed from input file above)
project-root = (your primary working directory)
jira-docs-root = {project-root}/docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
test-type-files = {workflow-files}/{test-type}-test-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
red-phase-plan-file-copy = {test-type-files}/02-red-phase-failing-test-plan-copy.md
red-phase-file = {test-type-files}/02-red-phase-failing-tests.md
green-phase-plan-file-copy = {test-type-files}/03-green-phase-implementation-plan-copy.md
green-phase-file = {test-type-files}/03-green-phase-summary-of-what-was-implemented.md
refactor-analysis-file = {test-type-files}/04a-refactor-phase-proposed-refactors.md

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
0. Use the jira-verbatim-content-extractor agent to obtain all the details of the Jira you are working on *and* any parent and child Jiras. Use this information to obtain an understanding of what you are refactoring, what the constraints, requirements and the acceptance criteria were and the EXACT commands that you need to run to make sure the tests stay GREEN when the refactor happens for this test type.
1. Read through **all** of the following files in full:
- ai-summary-file - the file containing the initial summary of the Jira and questions and answers from human. CRUCIAL - may give good pointers to things that were left for REFACTOR stage if we were aiming for minimal implementation.
- red-phase-plan-file-copy - tells you what plan was for creating the failing test.
- red-phase-file - summarises what was actually done to create the failing test code.
- green-phase-plan-file-copy = copy of the plan for implementation. CRUCIAL - may give good pointers to things that were **not** implemented at GREEN and left for REFACTOR stage if we were aiming for minimal implementation. Also tells you the files that were changed so you can spot things that you could improve / change.
- green-phase-file = summarises what was actually done to create the code that passed the test. NOTE: This would have been a **minimal** implementation - and so there will often be scope for refactoring to remove duplication or improve the design of this code or the whole system that incorporates this code.
2. The actual implementation file(s) mentioned in the GREEN phase document
3. The test file(s) for this test type

## Step 6: Analyze Code for Potential Refactors

### Refactoring Principles (for AI reference - do NOT include in the generated document)

Before approving or proposing refactors, consider these principles:
- **"Has It Earned It?"** - Is this code stable? Will it change in the next few stories? Is the pattern repeated 3+ times (Rule of Three)?
- **Always-safe refactors** (low risk): Removing duplication within a file, improving names, simplifying conditionals, extracting constants
- **Requires caution** (prone to gold-plating): Creating new abstractions, extracting to new files, introducing design patterns, building "stepping stones" for future features
- **Anti-pattern**: "Beware of gold plating" - building intermediate functionality to make future work easier when that future work may never come
- Zero refactors is a valid outcome - if the code is minimal, well named, well commented, well structured

### 6a. Analyse Previous Phase Documents

**You MUST do this FIRST, THOROUGHLY, before any other analysis.**

Go back through EVERY document you read in Step 5 and extract refactoring opportunities. These come from two sources:

1. **Explicitly deferred items** - things the documents said to do later (e.g. "defer to REFACTOR phase", `// REFACTOR:` comments, acknowledged shortcuts).  You **must** do a search of all of these documents for the string "REFACTOR" or "refactor" or "Refactor" to check for any references or mentions that point to possible refactorings, and include details of any outputs that are not just standard boiler plate mentions of this phase in the instructions.
2. **Opportunities you identify by reviewing the approach** - things nobody called out, but that become apparent when reviewing what was planned vs what was implemented (e.g. awkward seams, naming that made sense during GREEN but looks wrong now, module boundaries that could be improved, test organisation issues)

**For EACH item found**, record:
1. **Source** - which document, whether it was explicitly deferred or something you identified
2. **What the opportunity is** - describe the refactoring clearly
3. **AI's honest opinion** - Do you think this should actually be done? Why or why not? Be candid.
4. **Recommendation** - Tier 1 (safe, auto-approved), Tier 2 (needs human approval), or Skip (and why)

**WHY THIS MATTERS**: The human reads your analysis. If a previous phase said "defer X to REFACTOR" and you don't mention it, the human has no idea it was planned. Even if you think something shouldn't be done, LIST IT with your opinion so the human can decide.

**DO NOT skip this step or do it superficially because it's extra work.**

### 6b. Magic Constants Audit

**You MUST extract ALL magic constants. No exceptions.**

Magic constants are literal values (numbers, strings) used directly in code without a named constant.

**Examples that MUST be extracted (even if they seem "obvious"):**
- `0` -> `EXIT_CODE_SUCCESS`
- `'temp'` -> `TEMP_DIRECTORY_NAME`
- `80` -> `DEFAULT_TERMINAL_COLUMNS`
- `2` -> `JSON_INDENT_SPACES`
- `'test input'` -> `TEST_INPUT_STRING`

**How to check:**
1. Read each implementation file line by line
2. Look for ANY literal number or string that represents a value, path, key, timeout, or identifier
3. For EACH one found, check if it has a named constant - if not, it's a magic constant

**If ANY magic constants are found, add them to Tier 1 refactors.**

### 6c. Tier 1: Always-Safe Refactors (Auto-approved)

| Refactor Type | Description |
|---------------|-------------|
| **Extract magic constants** | Replace magic numbers/strings with named constants - THIS IS THE MOST COMMON REFACTOR |
| **Naming improvements** | Rename variables/functions for clarity |
| **Duplication removal (within file)** | Extract repeated code within the same file |
| **Simplify conditionals** | Reduce nested if/else, simplify boolean logic |
| **Remove dead code** | Delete unused variables, unreachable code |
| **Fix obvious code smells** | Long lines, inconsistent formatting |
| **Add missing TSDoc** | TSDoc is required on exported classes and their public methods. A brief `/** ... */` comment explaining what the class/method does. Check each source file touched in this Jira. |

### 6d. Tier 2: Potential Structural Refactors (surface ALL of them - even ones you're unsure about)

| Refactor Type | Description | Risk |
|---------------|-------------|------|
| **Create new abstractions** | New interfaces, abstract classes | May be premature |
| **Extract to new file/module** | Split code into separate files (see naming guidance below) | May over-modularize |
| **Introduce design patterns** | Factory, Strategy, Observer, etc. | May over-engineer |
| **Create helper classes** | New utility classes | May be YAGNI |
| **Cross-file refactoring** | Changes affecting multiple files | Higher risk |
| **Add generalization** | Make code more generic "for future use" | Classic gold-plating |

NOTE: Items from Step 6a that warrant action should be classified into Tier 1 or Tier 2 as appropriate.

**Utility file naming guidance**: When extracting functions to utility files, name the file after the **domain/category** (e.g. `src/utils/git/git-utils.ts`, `src/utils/cli/pty-utils.ts`), NOT after the single function being extracted (e.g. `project-root.ts`, `spawnPty.ts`). Naming a file after one function creates a 1:1 file-to-function mapping that discourages adding related functions later. A domain-named file provides a natural home for future related helpers.

## Step 7: Create Refactor Analysis Document

Create the file `{refactor-analysis-file}` with the following structure. Use this ONE template for all cases - when a section has no items, write "None identified" inline rather than omitting the section.

```markdown
# REFACTOR Analysis: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: REFACTOR (Analysis)
**Generated**: {current date/time}

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
> So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Missing TSDoc — exported classes and public methods should have `/** ... */` comments

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
> So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Pre-Refactor Test Status

**Command**: `{pnpm test command}`
**Result**: PASSING (X tests)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | {document name}: "{quote or context}" | Deferred / Observed | {what could be refactored} | {honest assessment} | Tier 1 / Tier 2 / Skip |
| P.2 | ... | ... | ... | ... | ... |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

**Or if none found:**
> No refactoring opportunities found in previous phase documents.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `{file}` | {line} | `{value}` | MAGIC | -> `{PROPOSED_CONSTANT_NAME}` |
| `{file}` | {line} | `{value}` | EXTRACTED | `{EXISTING_CONSTANT_NAME}` |

**Any MAGIC entries above are included in Tier 1 refactors below.**

**Or if all clean:**
> All literal values are already extracted to named constants.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | {type} | {description} | `{file}` Line: `{lineNum}` |
| 1.2 | {type} | {description} | `{file}` Line: `{lineNum}` |

**Or if none:**
> No Tier 1 refactors identified. Code is already clean at this level.

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: {Title}

**Type**: {e.g., "Create new abstraction", "Extract to new file"}
**Description**: {What the refactor would do}
**AI Recommendation**: {RECOMMEND / UNSURE / NOT RECOMMENDED - and why. Be honest.}
**Risk**: {Why this might be gold-plating or cause problems}
**Files affected**: `{file1}`, `{file2}`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: {Title}

{Same structure as above}

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

_None yet - human to fill in or write "None"_

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | X |
| Tier 2 AI-Identified (Pending review) | Y |
| **Total identified by AI** | X+Y |

---

## Agreed Refactors Discussion Notes

> **This section is filled in by the AI** after the human completes their review and discussion takes place. It will contain a subsection for each refactor that was discussed, capturing what was said and what was agreed. It remains empty until then.

_To be completed by the AI after review and discussion._

---

## Agreed Refactors Summary Table

> **This section is filled in by the AI** after discussion is complete. It is the single source of truth for the execute phase (04b). For detail on any item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above. It remains empty until then.

_To be completed by the AI after review and discussion._

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically
```

## Step 8: Add Comment to Jira

Load the Jira comment tool using `ToolSearch` with query `select:mcp__mcp-atlassian__jira_add_comment`, then use it to add a comment to {jira-id}:

> AI Agent has completed REFACTOR analysis for {test-type} test.
>
> **Tier 1 refactors (auto-approved)**: {count}
> **Tier 2 refactors (pending approval)**: {count}
>
> Analysis documented at: `{refactor-analysis-file}`
>
> Human review required before execution.

## Step 9: Present to Human and WAIT for Review

After creating the file, tell the human:

> "I've completed the REFACTOR analysis for {jira-id} ({test-type} test).
>
> **Tier 1 (Auto-approved)**: {count} refactors
> **Tier 2 AI-Identified**: {count} potential refactors
>
> Analysis at: `{refactor-analysis-file}`
>
> **Please edit the analysis file and:**
> 1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to your Human-Identified section
> 2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
> 3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
> 4. Tell me when your review is complete
>
> I'll then discuss any items you marked DISCUSS, plus all of your human-identified refactors. After discussion I'll produce the final agreed refactors table."

**CRITICAL: STOP HERE AND WAIT.** Do NOT proceed until the human explicitly confirms their review is complete (e.g. "review done", "looks good", "proceed", etc.). Never auto-proceed - even if you identified zero refactors. The human review gate is mandatory.

## Step 10: Discussion and Agreed Refactors

After the human confirms their review is complete, re-read `{refactor-analysis-file}` and identify items that need discussion:

1. **AI-Identified items marked DISCUSS** by the human
2. **All Human-Identified items** (these always need discussion)

**If there are no items to discuss** (no DISCUSS marks AND human wrote "None"): Skip discussion and go straight to producing the Agreed Refactors table.

**If there ARE items to discuss**: For EACH item needing discussion:

1. **Acknowledge** - Show you understand what's being considered
2. **Give your honest opinion** - Be candid:
   - Do you agree this is a good refactor? Why or why not?
   - Are there risks, downsides, or unintended consequences?
   - Is there a better way to achieve what the human wants?
   - Does this violate Rule of Three, YAGNI, or other principles?
   - Will this be straightforward or more complex than it appears?
3. **Ask clarifying questions** if anything is ambiguous
4. **Suggest alternatives** if you think there's a better approach
5. **Wait for the human's response** before moving to the next item

**This is a genuine two-way discussion.** Push back if you think a refactor is a bad idea.

### Produce the Agreed Refactors Sections

After all discussions are complete (or if no discussion was needed), update TWO sections in the analysis file:

#### 1. Fill in "Agreed Refactors Discussion Notes"

For each refactor that was discussed, add a subsection with the discussion summary:

```markdown
## Agreed Refactors Discussion Notes

### Refactor 2.3: {Title}
**Decision**: EXECUTE
**Summary**: {What was discussed, what the human's concern was, what was agreed, any modifications to the original proposal.}

### Refactor H.1: {Title}
**Decision**: EXECUTE (modified)
**Summary**: {Human proposed X. AI raised concern about Y. Agreed to do Z instead because...}

### Refactor H.2: {Title}
**Decision**: SKIP
**Summary**: {Human proposed X. After discussion, agreed not needed because...}
```

For refactors that were straight APPROVE or REJECT (no discussion), no subsection is needed here - they go directly into the summary table.

#### 2. Fill in "Agreed Refactors Summary Table"

This is the **single source of truth** for the execute phase (04b).

```markdown
## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 2.1 | AI | {description} | EXECUTE | Approved by human |
| 2.2 | AI | {description} | SKIP | Rejected by human |
| 2.3 | AI | {description} | EXECUTE | Discussed - see notes above |
| H.1 | Human | {description} | EXECUTE (modified) | Discussed - see notes above |
| H.2 | Human | {description} | SKIP | Discussed - see notes above |
```

**Decision values:**
- **EXECUTE** - Will be executed by 04b
- **EXECUTE (modified)** - Will be executed with the modifications noted in discussion
- **SKIP** - Will not be executed (rejected, deferred, or dropped after discussion)

Confirm with the human that both sections accurately capture what was decided.

### Mark Review Complete

After the human confirms the Agreed Refactors table is correct:

**Add the following marker to the END of the analysis file:**

```markdown
---

## Review Status: COMPLETE

Human review and discussion completed on {current date/time}.
```

This marker is checked by the execute phase (04b) to confirm all review steps are done.

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
- **Previous phases matter**: The most valuable analysis comes from mining previous phase documents - don't skip Step 6a
- **Human gate is mandatory**: NEVER proceed past Step 9 without human confirmation
