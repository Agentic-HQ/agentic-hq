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

**If `{jira-id}` was not provided:**
STOP and ask the human to confirm whether they intended to commit without providing a Jira ID and give options:
(1) Continue without Jira ID (commit title and body will be constructed by the AI)
(2) Provide Jira ID - I will ask you for the Jira ID and then continue
(3) Abort command

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
- If any of the files are in .claude/commands/agentic-hq-commands, STOP and then ask to human to confirm that this is the right Jira to commit the changes against, since the human is developing commands while working on code, and trying to keep commits separate (e.g. in https://agentic-hq.atlassian.net/browse/AHQ-13)
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
