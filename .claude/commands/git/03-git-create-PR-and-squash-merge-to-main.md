# ⚠️ WARNING: USER-ONLY COMMAND ⚠️

**This command should ONLY be run by the USER, not by Claude.**

Claude should NOT invoke this command autonomously. If the user wants to use this command, they should run it themselves by typing the slash command.

---

You are helping the user create a PR and squash merge their feature branch into main.

## Step 1: Change to Git Root and Run Pre-Merge Checks

First, get the git root directory and change to it for consistent behavior:

```bash
# Get git root directory
git rev-parse --show-toplevel

# Change to git root
cd $(git rev-parse --show-toplevel)
```

Inform the user: "Changing to git root directory: [path]"

Then run the pre-merge check script:

```bash
src/scripts/git-scripts/branching/03-squash-merge-branch/check-we-are-ready-to-create-PR-and-squash-merge-branch.sh
```

**Check the output for "STATUS: OK_TO_MERGE" or "STATUS: NOT_OK_TO_MERGE"**

### If NOT_OK_TO_MERGE:
- Show the user the output from the script (it provides detailed, context-specific recommendations)
- ABORT the command immediately
- Tell the user to follow the instructions given by the script to fix the issues
- DO NOT proceed with any other steps

### If OK_TO_MERGE:
- Note the current branch name
- Proceed to Step 2

---

## Step 2: Gather Branch Analysis Information

Run the analysis script to collect all information about the branch:

```bash
src/scripts/git-scripts/branching/03-squash-merge-branch/obtain-all-relevant-info-on-branch.sh
```

This script will:
- Create a timestamped temp directory
- Generate branch-summary-info.md
- Generate full-branch-commit-history.txt
- Generate full-branch-diff-from-main.txt

Store the temp directory path from the script output.

---

## Step 3: Analyze Changes and Create AI Analysis Document

Read all the files in the temp directory:
- branch-summary-info.md
- full-branch-commit-history.txt
- full-branch-diff-from-main.txt

Also extract relevant information from:
- The current conversation history
- Any context about what was done on this branch

Then create a file in the temp directory called:

**ai-analysis-of-changes-on-branch.md**

This file must contain the following sections:

### Main Changes (1-3 max)
- Identify the **big, main** single change (or changes - max 3!) that were done in this branch
- These are the most important things that will be mentioned in the PR title and commit title
- Examples: "Add user authentication", "Fix login validation bug", "Refactor database connection logic"

### Other Changes
- List other changes that were done in the branch
- Changes that support or complement the main changes
- Minor fixes, documentation updates, etc.

### Commit Size/Complexity
- Assess the overall size and complexity of the branch changes
- Categories: Small, Medium, Large, Very Large
- Consider: number of files changed, lines added/deleted, scope of changes

### Commit Message Size
- Based on the complexity assessment, decide on commit message size:
  - **Small/simple changes** → Short, simple commit message (1-2 sentences)
  - **Medium/average changes** → Average length commit message (1 paragraph)
  - **Large/complex changes** → Long, detailed commit message (multiple sections)

### Context and Conversation History
- Extract from the conversation history details relevant to changes made on this branch
- Include any user requirements, decisions made, approaches chosen
- This helps understand the "why" behind the changes

Save this analysis file to the temp directory.

---

## Step 4: Present Files to User

Show the user:
1. The contents of **branch-summary-info.md**
2. The full path to the temp directory
3. The list of all files in the temp directory

Then use the AskUserQuestion tool to present these options:

**Question:** "Review the branch analysis above. Would you like to continue creating the PR?"
**Header:** "Continue?"
**Options:**
1. "Continue" - Proceed with creating the PR
2. "Abort" - Cancel the entire command

### If user selects "Abort":
- Inform them: "✓ Command cancelled. Temp files are preserved at [path] if you want to review them."
- END the command here

### If user selects "Continue":
- Proceed to Step 5

---

## Step 5: Draft Pull Request

Read the **ai-analysis-of-changes-on-branch.md** file you created.

Use the analysis to draft a Pull Request:

### PR Title
- Think hard about what are the *main* things that were done in this branch
- Use the "Main Changes (1-3 max)" section from your analysis
- Create a concise, clear title that summarizes the main work
- This title will automatically become the commit title when squash merging
- Examples:
  - "Add user authentication with JWT"
  - "Fix validation bug in login form"
  - "Refactor database connection logic and add connection pooling"

### PR Body
Use the template from .github/pull_request_template.md:

```markdown
## Description
[High-level description and context - WHY this change is needed, WHAT approach was taken]

## Related Issue(s)
[List any related issues, or state "N/A"]

## Checklist
- [ ] All tests pass
- [ ] Code follows project style guidelines
- [ ] Ready for review
```

Remember: The PR body is for REVIEWERS, not for git history. Include:
- High-level description and context
- Why this change is needed
- What approach was taken
- Testing checklist
- Related issues

### Present to User

Present the draft PR to the user in this format:

```
**PR TITLE:**
[title]

**PR BODY:**
[full body with template]
```

Then use the AskUserQuestion tool:

**Question:** "What would you like to do with this PR draft?"
**Header:** "PR Draft"
**Options:**
1. "Accept and create PR" - Create the PR with this title and body
2. "Edit PR" - Provide feedback to modify the PR draft
3. "Abort" - Cancel the entire command

### Handle User's Choice:

**If "Accept and create PR":**
- Proceed to Step 6

**If "Edit PR":**
- Ask: "What changes would you like to the PR title or body?"
- Wait for their feedback
- Revise the PR draft based on their feedback
- Present the revised draft again with the same menu
- Repeat until they accept or abort

**If "Abort":**
- Inform them: "✓ Command cancelled. No PR was created."
- END the command here

---

## Step 6: Create the Pull Request

Once the user has accepted the PR draft, create the PR using the GitHub CLI:

```bash
gh pr create \
  --base main \
  --head [current-branch-name] \
  --title "[pr-title]" \
  --body "$(cat <<'PRBODY'
[full-pr-body-here]
PRBODY
)"
```

**Important:**
- Use heredoc format with `cat <<'PRBODY'` for the body
- The single quotes around 'PRBODY' prevent variable expansion
- Fill in the checklist with `[x]` for checked items based on your analysis

Show the output to the user and confirm the PR was created successfully.

If there's an error, show it to the user and ABORT the command.

---

## Step 7: Suggest .gitignore Updates (if needed)

Analyze the files that were changed/added in this branch to determine if any should be in .gitignore.

**IMPORTANT:** Exclude the following from this check:
- `temp/temp-ai-git-analysis-files/` directory (temporary working files)
- Any patterns already in .gitignore
- Standard gitignore patterns (node_modules, .DS_Store, etc.)

**Only suggest if:**
- There are NEW files/patterns not already covered by .gitignore
- These files should genuinely not be committed (logs, build artifacts, credentials, etc.)

**If there are new files that should be in .gitignore:**
- STOP and use AskUserQuestion to ask the user for approval
- Show them which files/patterns you want to add
- If approved: add them to .gitignore and continue
- If not approved: continue without changes

**If no new .gitignore entries needed:**
- Proceed to Step 8

---

## Step 8: Draft Merge Commit Body Message

Read the **ai-analysis-of-changes-on-branch.md** file again.

Use the analysis to draft a merge commit body message.

### Guidelines:

**Focus on Main Changes:**
- Think hard about what are the *main* things done in this branch
- The most *important* things should be mentioned first
- Use the "Main Changes" section from your analysis

**Message Size:**
- Use the "Commit Message Size" decision from your analysis:
  - **Small/simple changes** → Short summary (don't over-describe simple changes)
  - **Medium changes** → Average description with key details
  - **Large/complex changes** → Detailed breakdown with sections

**Structure for Medium/Large Changes:**
- Group related changes into titled sections
- Use bullet points for lists of changes
- Be specific about what was done

**Always End With:**
- A one or two sentence summary of what is in the commit
- Its relevance/effect on the whole system and the progress of the project

### Present to User

Present the commit message draft in this format:

```
**Branch being merged:** [branch-name]

**PR TITLE:** "[title]"
(This will automatically become the commit title)

**COMMIT BODY:** (draft this separately)
[full commit body here]
```

Then use the AskUserQuestion tool:

**Question:** "What would you like to do with this merge commit message?"
**Header:** "Commit Message"
**Options:**
1. "Approve" - Squash-merge, push to remote, and archive branch
2. "Edit commit body" - Modify the merge commit body
3. "Abandon" - Cancel this merge commit process

### Handle User's Choice:

**If "Approve":**
- Proceed to Step 9

**If "Edit commit body":**
- If they provided specific feedback, make those changes
- If they didn't specify, ask: "What changes would you like to the commit body?"
- Revise the commit body based on their feedback
- Present the revised message again with the same menu
- Repeat until they approve or abandon

**If "Abandon":**
- Inform them: "✓ Merge cancelled. No changes were made. PR remains open."
- END the command here

---

## Step 9: Execute Squash Merge and Archive

Once the user has approved the commit message, run the TypeScript script:

```bash
src/scripts/git-scripts/branching/03-squash-merge-branch/perform-squash-merge-on-branch.ts \
  --branch-name "[current-branch-name]" \
  --commit-body "$(cat <<'EOF'
[full-commit-body-here]
EOF
)"
```

**Important:**
- Use heredoc format with `cat <<'EOF'` for the commit body
- The single quotes around 'EOF' prevent variable expansion

Show the full output to the user as the script runs.

**If the script completes successfully:**
- Proceed to Step 10

**If there are any errors:**
- Show the errors to the user
- Inform them: "✗ Merge process failed. Please review the error above."
- STOP and tell the user they may need to manually resolve issues
- END the command here

---

## Step 10: Summarize What Was Done

Present a summary of the entire process:

```
✓ PR and Squash Merge Complete!

Summary of what was done:
1. ✓ Pre-merge checks passed
2. ✓ Branch analysis completed
3. ✓ PR created: [PR title]
4. ✓ PR #[number] squash merged to main
5. ✓ Branch archived: [branch-name] → archive/[branch-name]
6. ✓ Returned to main branch

The branch [branch-name] has been successfully merged into main.
All small commits have been squashed into one clean commit.
The original detailed commit history is preserved in the archived branch.

Next steps:
- The main branch now contains your changes
- The feature branch has been archived (not deleted)
- You can create a new feature branch with /git:01-git-branch
```

Show the path to the temp analysis directory in case they want to review it later.

---

## Important Notes

**DO NOT:**
- Skip any approval steps - always get user confirmation before creating PR or merging
- Continue if any script fails - always abort and show the error
- Delete the temp analysis files - they may be useful for review
- Make assumptions about PR content - always draft based on actual changes

**ALWAYS:**
- Show script outputs to the user so they can see what's happening
- Use heredoc format for multi-line PR bodies and commit messages
- Present clear choices to the user with the AskUserQuestion tool
- Handle errors gracefully and inform the user what went wrong
