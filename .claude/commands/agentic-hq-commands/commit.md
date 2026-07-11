---
argument-hint: jira-id (optional)
---

Creates commit message for approval then stages, commit and pushes changes.

## Variables

```
jira-id = $1 (optional - if not provided, commit title is generated from changes)
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Commit Workflow

When I run this "commit" command I would like you to please:
AH
### ⚠️ STEP 1: Check Jira ID FIRST (before anything else)

**This is the FIRST thing to check.** The AI previously skipped this step because it wasn't prominent enough - it jumped straight to validation instead.

**If `{jira-id}` was not provided:**
STOP and ask the human to confirm whether they intended to commit without providing a Jira ID and give options:
(1) Continue without Jira ID (commit title and body will be constructed by the AI)
(2) Provide Jira ID - I will ask you for it and then continue
(3) Abort command

**Only proceed to validation AFTER this step is complete.**

### STEP 2: Pre-Commit Validation

**MANDATORY**: Before creating the commit message, run validation:

1. Run `pnpm validate` to check:
   - TypeScript types (`pnpm typecheck`)
   - Linting rules (`pnpm lint:check`)
   - Formatting rules (`pnpm format:check`)
   - Unit tests (`pnpm test`)

2. If validation fails:
   - **STOP** immediately
   - **Investigate the failure** before reporting to the human:
     - For **formatting issues**: Run `pnpm prettier --write <file> --dry-run` to see what would change, or read the file and compare against Prettier rules
     - For **lint errors**: The error output usually shows the issue; if unclear, run `pnpm eslint <file>` for detailed output
     - For **type errors**: Read the file at the line number shown to understand the type mismatch
     - For **test failures**: Read the test output to understand what assertion failed
   - **Report to the human** with:
     - Which check failed (typecheck/lint/format/test)
     - Which file(s) are affected
     - What specifically is wrong (e.g., "missing semicolon on line 42", "import order incorrect", "unused variable 'foo'")
     - Whether it's auto-fixable or requires manual intervention
   - **DO NOT automatically run any fix commands**
   - Offer options to the human:
     1. Run the fix command (e.g., `pnpm format:fix <file>` or `pnpm lint:fix <file>`) - explain what it will do
     2. Let the human fix it manually
     3. Abort the commit
   - **Wait for the human's approval** before running any fix command
   - After fix is applied (if approved), re-run `pnpm validate` to confirm it passes

3. Only proceed with commit message creation if `pnpm validate` passes

### After Validation

- Present the following menu options to the user in a list format (1) Continue (2) Provide additional info to help with creating the Commit message - (user can append to the (2) option).  
- STOP and wait for answer.
- Once you have the answer you can continue, but be sure to *remember* any additional info about the commit message they want you to consider when you create the commit message later.
- Run in bash: date "+%Y-%m-%d_%H-%M-%S"
- Use the output of the bash command as the TIMESTAMP field in the following file names.
- Run the git status command to list all changed files and all unstaged and send the output to .agentic-hq/temp/git-statuses/git-status-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Run the "git diff HEAD" command to show detailed diff of any modified tracked files (uncommitted changes) and send the output to .agentic-hq/temp/git-diffs/git-diff-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Run the "git ls-files --others --exclude-standard" to show the full list of all new files and send the output to .agentic-hq/temp/git-new-files-list/git-new-files-list-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Tell the human the filenames so they can check them themselves
- Analyse the files to work out what will be in the commit
- Analyse the files to determine whether some files should not be committed and so should be in the .gitignore file. **IMPORTANT**: Exclude the following from this check as they are ALWAYS ignored by git:
  - `.agentic-hq/temp/` directory and all its contents (temporary working files)
  - Any other directories/files you know are standard gitignore patterns
  - Only suggest adding files to .gitignore if they are NEW patterns not already covered by existing .gitignore rules
- If there are genuinely new files that should be in .gitignore, then STOP and ask the human for approval for adding those recommended files or directories to .gitignore. If approved - add them and continue.
- Before working out a commit title and message body - think hard about what are the *main* things that were done in this commit. The most *important* things. They will need to be mentioned first in the commit title and the message body, and have the main focus.

### Jira Research

**If a `{jira-id}` was provided:**

1. Find all information on all the relevant Jiras by following the following 3 steps (A,B and C):

#### Step A: Read the Main Jira

Use the jira-verbatim-content-extractor agent to read the Jira at `{jira-id}`:
- Read ALL non empty fields: title, description, status, priority, issue type, labels, components etc
- Read ALL comments on the Jira
- Note the parent issue (Epic) if one exists
- Note any subtasks
- Note any linked issues mentioned in the description or issue links

#### Step B: Read Parent Jira (Epic)

If the Jira has a parent (e.g., an Epic), use the jira-verbatim-content-extractor agent to read it:
- Read the Epic's title, description, and key fields
- This provides important context about the broader initiative

#### Step C: Read All Subtasks

If the Jira has subtasks, read each one to understand the breakdown of work.

**If `{jira-id}` was not provided:**

No Jira research required.

### Commit Title

**If a `{jira-id}` was provided:**
1. The commit title will be: `{jira-id} - {Jira Title}`
2. Tell the user: "Commit title will be: `{jira-id} - {Jira Title}` (from Jira)"
3. Keep the Jira content available for use in creating the message body below

**If no `{jira-id}` was provided:** 
Use the file info, the recent AI conversation history and the context from the project to work out a really nice commit *title* for the commit, that summarises in one sentence all the main things included in the commit, e.g. bug fixes, UI changes, documentation updates, script updates - whatever the main things were.

### Commit Message Body

- Use the conversation history and the context from the project to work out a really nice, comprehensive commit *message body* that is a detailed, well formatted description of what is being committed.
- **If a `{jira-id}` was provided:** Also use the Jira content (description, acceptance criteria, etc.) to inform and enrich the commit message body. The Jira context helps explain *why* the changes were made and what they achieve.
- NOTE: If the change in the commit is small (e.g. a small addition to some documentation) please don't write a full detailed, description of that one change, as the human will only want a summary of the change, and they can read the code/doc themselves if they need the full detail. If there are lots of changes though - then obviously the human will want a detailed breakdown of what was done. Please group these into titled sections of related change descriptions, each with the list of changes. You are already very good at this - so please continue to do it :-)
- End the commit *message body* section with a one or two sentence summary of what is in the commit and it's relevance/effect on the whole system.

### Approval Menu

- Then present a Menu to me, with 3 choices:
    1. Approve - Stage, commit and push changes
    2. Edit commit message - Modify the commit message
    3. Abandon commit - Cancel this commit process
- **⚠️ NEVER use the AskUserQuestion tool for this menu (or any other menu in this command).** Its dialog hides all text printed before it (I cannot see the commit message I am approving) and its option previews truncate at ~25 lines with no scrolling. Both are Claude Code bugs closed "not planned" upstream (anthropics/claude-code #58207, #38674). Present the menu as PLAIN TEXT in the chat, numbered, directly below the commit message, then STOP and WAIT for me to type the number:

```
What would you like to do?

  1. Approve             — stage, commit and push changes
  2. Edit commit message — tell me what to change
  3. Abandon commit      — cancel this commit process

Enter 1, 2 or 3:
```
- If I select Edit and explain what I want changed, please just do that.  If I just select Edit without specifying then please ask me what I want changed and I will tell you, then please update the commit message and present to me for approval again and present the above Menu to me again.

- If I select Approve please
    - stage changes
    - commit changes
    - push to the remote repo

- If I select Abandon then please abandon this whole process and confirm no commands were run to make any changes.


CHECKLIST:
    - If the commit is small, double check the bit above about: "If the change in the commit is small..."


## ⚠️ CRITICAL: DO NOT STAGE FILES BEFORE APPROVAL ⚠️

  **IMPORTANT**: Files must ONLY be staged AFTER the user approves the commit message (selects option 1).

  The correct sequence is:
  1. Analyze changes (git status, git diff, etc.)
  2. Create and present commit message
  3. Get user approval via menu
  4. **ONLY THEN** stage files (git add)
  5. Commit and push

One time the AI Agent staged the files before the Approval, which breaks the whole workflow.  Please don't do this.
