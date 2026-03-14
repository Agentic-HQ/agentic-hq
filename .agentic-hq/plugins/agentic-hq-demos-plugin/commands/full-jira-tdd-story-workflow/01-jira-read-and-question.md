You are executing the first step of the Jira Story Workflow: **Read & Question**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your role is to gain a deep understanding of the Jira, gather relevant context, do any necessary research, and then present a summary with questions for the human before implementation begins.

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)

## Step 0b: Establish Variables

```
jira-id = (parsed from input file above)
project-root = (your primary working directory)
jira-docs-root = {project-root}/docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## 🛑 Step 0b: CRITICAL - This Command is READ-ONLY

**WARNING: This command is for READING and QUESTIONING only. You must NOT:**
- Create any code files
- Create any documentation files (except the summary file at `{ai-summary-file}`)
- Modify any existing code or documentation
- Start implementing anything from the Jira
- Create draft versions of deliverables mentioned in the Jira

**Your ONLY outputs from this command are:**
1. The summary file at `{ai-summary-file}`
2. A Jira comment noting work has started
3. Discussion with the human about questions

Implementation happens in subsequent commands (02, 03, 04, 05). If you find yourself wanting to create files or write code, STOP - you are overstepping.

Tell the user you have read "Step 0" and understand this command is read-only.

## Step 1: Validate Input

If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage example: `/jira-story-workflow:01-jira-read-and-question AHQ-123`"

## Step 2: Check for Existing Workflow File

Check if the file `{ai-summary-file}` already exists.

If it exists, **STOP** and ask the user:
> "The summary file already exists at `{ai-summary-file}`.
>
> This suggests this command has been run previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and start fresh
> 2. **View existing** - Show me the existing summary so I can review it
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 3: Create Workflow Directory

Create the directory `{workflow-files}` if it doesn't already exist.

## Step 4: Read the Main Jira

Use the jira-verbatim-content-extractor agent to read the Jira at `{jira-id}`:
- Read ALL non empty fields: title, description, status, priority, issue type, labels, components etc
- Read ALL comments on the Jira
- Note the parent issue (Epic) if one exists
- Note any subtasks
- Note any linked issues mentioned in the description or issue links

## Step 5: Read Parent Jira (Epic)

If the Jira has a parent (e.g., an Epic), use the jira-verbatim-content-extractor agent to read it:
- Read the Epic's title, description, and key fields
- This provides important context about the broader initiative

## Step 6: Read All Subtasks

If the Jira has subtasks, read each one to understand the breakdown of work.

## Step 7: Read Linked Jiras (If Relevant)

Review any Jiras linked in the description or via issue links.

**Only read linked Jiras that you judge to be relevant to completing this task.** For example:
- A "blocked by" Jira might be important to understand dependencies
- A "next Jira" might help understand what's out of scope for this one
- A referenced Jira for additional technical context

Skip linked Jiras that are clearly not relevant (e.g., unrelated work items just mentioned in passing).

## Step 8: Read Relevant Project Files

Based on what you learned from the Jira(s), read files in the project that will help you understand:
- The codebase structure and patterns
- Existing code that this Jira will modify or extend
- Test patterns and conventions
- Any referenced documentation or specs

Use your judgment about which files are relevant. Don't read everything - focus on what's needed to understand and complete the Jira.

## Step 9: Research (If Needed)

If the Jira involves technologies, libraries, or approaches you need more information about:
- Use Perplexity MCP to research current best practices
- Look up documentation for specific libraries or tools mentioned
- Clarify any technical approaches you're unsure about

Document your research findings for inclusion in the summary.

## Step 10: Transition Jira to "In Progress" and Add Comment

Load the Jira MCP tools using `ToolSearch` with these queries: `select:mcp__mcp-atlassian__jira_get_transitions`, `select:mcp__mcp-atlassian__jira_transition_issue`, and `select:mcp__mcp-atlassian__jira_add_comment`. Then transition the Jira to "In Progress" status:
1. First, use `mcp__mcp-atlassian__jira_get_transitions` to get available transitions
2. Find the transition that moves to "In Progress" (or equivalent status)
3. Use `mcp__mcp-atlassian__jira_transition_issue` to make the transition. **IMPORTANT: Do NOT use the `comment` parameter on the transition call — it requires Atlassian Document Format (ADF) and will fail with plain Markdown. Always add comments separately via `mcp__mcp-atlassian__jira_add_comment` instead.**
4. Also assign the Jira to yourself to show you are working on it now.

If the transition fails (e.g., Jira is already in progress or workflow doesn't allow it), note this and WARN THE HUMAN but continue - it's not a blocker.

**Then add a comment to the Jira** using `mcp__mcp-atlassian__jira_add_comment`:

> "AI Agent has started work on this Jira.
>
> Workflow files are being created at: `{jira-docs-root}/{jira-id}/workflow-files`"

This provides visibility in Jira for anyone watching the ticket.

## Step 11: Create Summary Document

Create the file `{workflow-files}/ai-summary-of-jiras-and-questions-for-human.md` with the following structure:

```markdown
# AI Summary: {jira-id}

**Jira**: [{jira-id}]({jira-url})
**Title**: {jira title}
**Status**: Transitioned to In Progress (or note if transition failed)
**Generated**: {current date/time}

---

## My Understanding of This Task

{Write 2-4 paragraphs summarizing what you understand needs to be done, in your own words. This is NOT a copy of the Jira - it's your synthesis of the Jira + Epic + context + research. Show that you understand:
- The goal/outcome
- The scope (what's in and what's out)
- The technical approach
- Any constraints or "intentionally wrong" items}

## Research Findings

{If you did any research, document it here. Include:
- What you researched and why
- Key findings relevant to this task
- Any recommendations or decisions needed
- Links to sources if applicable}

### {Research Topic 1}

{Findings...}

### {Research Topic 2}

{Findings...}

## Questions for Human

{List any questions you have that need human input before proceeding.

**CRITICAL - VALIDATE EACH QUESTION BEFORE INCLUDING IT:**
Before adding ANY question, explicitly check:
1. Is this already answered in the Jira description? If yes, DON'T ASK.
2. Is this already answered in the Confluence/spec pages you read? If yes, DON'T ASK.
3. Is this already answered in the parent Epic or linked Jiras? If yes, DON'T ASK.
4. Is this already specified in acceptance criteria? If yes, DON'T ASK.

Only include questions that are GENUINELY not answered in any source material you've read. For each question, you should be able to say "I checked X, Y, and Z and none of them specify this."

Valid questions are things that:
- Are truly ambiguous (not specified anywhere you've read)
- Require a decision/preference the spec intentionally left open
- Involve tradeoffs the human should weigh in on
- Were discovered during research and aren't covered by existing docs}

### Question 1: {Brief title}

{Detailed question...}

**Human's Response**:
> _[Please write your response here]_

---

### Question 2: {Brief title}

{Detailed question...}

**Human's Response**:
> _[Please write your response here]_

---

{Add more questions as needed, or remove this section if you have no questions}

## Files I Reviewed

{List the key files you read to gain context (**only** the ones you found relevant to the Jira), with brief notes on why}

- `path/to/file.ts` - {why you read it and why it was relevant}
- `path/to/other.ts` - {why you read it and why it was relevant}

and summarise the most important things you found.

## Test Types And Tests We Will Be Implementing

**Test types: `{comma-separated test types}`** (in that order, each with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

{For each test type, list the specific tests you plan to write and what they will verify. Be specific enough that the next agent (who writes the tests) knows exactly what to implement. Include:
- Test descriptions/names
- What each test verifies
- Key assertions
- Any test infrastructure needed (e.g., mocks, fixtures, test scripts)}

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.
```

## Step 12: Present to Human

After creating the file, tell the human:

> "I've read {jira-id} and created my summary at:
> `{ai-summary-file}`
>
> **Summary**: {one sentence description of what the Jira is about}
>
> **Questions**: {number} questions need your input before we proceed.
>
> Please review the summary file, add your responses to any questions inline, and let me know when you're ready to continue to the next step."


## Step 13: Read And Discuss Answers With Human

Read and discuss the answers with the human. 

Once everything is resolved, update the file to clarify what the agreed answers were and move on to step 14.

## Step 14: Determine Test Types

Once all questions are resolved, determine which test types are needed for this Jira.

Look in the Jira description for a line matching: `Test types: X, Y` (where X, Y are comma-separated test types).

If found, extract the comma-separated test types (e.g. `unit, e2e`).

If NOT found, intelligently determine which test types are needed from the possible list: unit, integration, smoke, e2e. Return the relevant ones in that order.

If no tests are needed at all, use an empty string "".

Tell the human the test types you determined and confirm with them before proceeding.

## Step 15: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "<comma-separated test types e.g. unit, e2e>"
}
```

CRITICAL: The `command-output-string` value must be ONLY the comma-separated test types (e.g. "unit, e2e") - nothing else, no extra text, no explanation. If no test types, use an empty string "".

## Step 16: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

## Step 17: 🛑 CRITICAL: DO NOT IMPLEMENT ANYTHING 🛑

This command's purpose is **understanding and clarification** - nothing more. Do NOT:
- Start creating documentation files mentioned in the Jira
- Start writing any code
- Create "draft" versions of deliverables
- Begin the RED phase (test writing) yourself
- Make any file changes beyond the summary file

---

## Important Notes

- **Jira is source of truth**: Your summary shows YOUR understanding, not a copy of the Jira
- **Focus on relevance**: Don't read every file or every linked Jira - use judgment
- **Research is valuable**: If you're unsure about something technical, research it now rather than guessing during implementation
- **Questions must be validated**: Before asking ANY question, verify it's not already answered in the Jira, Confluence pages, acceptance criteria, or other docs you read. Asking about something that's already specified wastes human time and shows you didn't fully internalize what you read.
- **TDD applies**: Remember that the next step is writing failing tests first (Red phase of TDD) and the commands after that will guide you through doing the whole Jira using TDD (see your CLAUDE.md for details of TDD)
- **TDD test order**: When a Jira specifies multiple test types, the order is always: **unit → integration → smoke → e2e** (each with full RED → GREEN → REFACTOR → VALIDATE cycle). Do NOT ask about test ordering - this is standard.

---

