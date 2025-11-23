# ⚠️ WARNING: USER-ONLY COMMAND ⚠️

**This command should ONLY be run by the USER, not by Claude.**

Claude should NOT invoke this command autonomously. If the user wants to use this command, they should run it themselves by typing the slash command.

---

You are helping the user create a WIP (Work In Progress) commit on their current feature branch.

## Step 1: Change to Git Root and Verify We're on a Feature Branch

First, get the git root directory and change to it for consistent behavior:

```bash
# Get git root directory
git rev-parse --show-toplevel

# Change to git root
cd $(git rev-parse --show-toplevel)
```

Inform the user: "Changing to git root directory: [path]"

Then check that we're on a feature branch (NOT on main):

```bash
git rev-parse --abbrev-ref HEAD
```

**If the output is "main":**
- ABORT the command immediately
- Tell the user: "❌ You're on the main branch. This command is only for feature branches. Please switch to a feature branch first or create one with /git:01-git-branch"
- DO NOT proceed with any other steps

**If on a feature branch:**
- Note the branch name
- Proceed to Step 2

---

## Step 2: Analyze Changes

Run these commands to understand what has changed:

```bash
# Show current status
git status

# Show what will be committed
git diff HEAD

# Show the last commit on this branch for context
git log -1 --oneline
```

Analyze the changes to understand:
- What files were modified/added/deleted
- What functionality was changed
- The scope and complexity of the changes

Use the context in your memory to also understand better what has been done since the last commit

---

## Step 3: Create Commit Message

Based on the changes analyzed, create a commit message following these rules:

**Title (required):**
- Always start with "WIP: " prefix
- Be concise and descriptive
- Describe what was done
- Max ~50-60 characters
- Examples:
  - "WIP: Add user authentication form"
  - "WIP: Fix validation bug in login"
  - "WIP: Refactor database connection logic"

**Message Body (conditional):**
- Include ONLY for larger/complex changes
- Keep it brief (usually 2-3 lines max)
- Provide key details about what changed
- For simple changes, omit the body entirely

---

## Step 4: Present Commit Message and Get Approval

Present the commit message to the user in this format:

```
Proposed commit message:

TITLE:
WIP: [your title here]

BODY:
[body lines if any, or "None" if simple change]
```

Then use the AskUserQuestion tool to present these options:

**Question:** "What would you like to do with this commit message?"
**Header:** "Commit action"
**Options:**
1. "Accept and commit" - Stage all changes, commit with this message, and push to remote
2. "Edit message" - Provide feedback and I'll revise the message
3. "Abort" - Cancel this commit entirely

---

## Step 5: Handle User's Choice

### If user selects "Accept and commit":
Proceed to Step 6 (Stage, Commit, and Push)

### If user selects "Edit message":
- Ask the user: "What changes would you like to the commit message?"
- Wait for their feedback
- Revise the commit message based on their feedback
- Return to Step 4 (present the revised message again)
- Repeat until they select "Accept and commit" or "Abort"

### If user selects "Abort":
- Inform the user: "✓ Commit cancelled. No changes were staged or committed."
- END the command here

---

## Step 6: Stage, Commit, and Push

**ONLY execute these commands if the user approved the message in Step 4/5:**

```bash
# Stage all changes
git add -A

# Commit with the approved message using heredoc
git commit -m "$(cat <<'EOF'
WIP: Your title here

Optional body line 1
Optional body line 2
EOF
)"

# Push to remote (set upstream if first push)
git push -u origin HEAD
```

**Important notes:**
- Always use heredoc format with `cat <<'EOF'` for proper multi-line handling
- If there's no body, just include the title line only in the heredoc
- The single quotes around 'EOF' prevent variable expansion

---

## Step 7: Confirm Completion

After successfully committing and pushing, inform the user:

```
✓ WIP commit created and pushed!

Branch: [branch-name]
Commit: [commit-hash]
Message: [title]

Files committed:
[insert list of files committed, each either as "- Created:" or "- Modified"]

You can continue working on this branch and run /git:02-git-perform-minor-WIP-commit-on-branch
again for your next WIP commit.

When you're ready to merge back into the main branch, run /git:03-git-create-PR-and-squash-merge-to-main
```

---

## ⚠️ CRITICAL: DO NOT STAGE FILES BEFORE APPROVAL ⚠️

**IMPORTANT**: Files must ONLY be staged AFTER the user approves the commit message (selects option 1).

The correct sequence is:
1. Analyze changes (git status, git diff, etc.)
2. Create and present commit message
3. Get user approval via menu
4. **ONLY THEN** stage files (git add)
5. Commit and push

**DO NOT stage files in Step 2 or Step 3. Only stage in Step 6 after approval.**
