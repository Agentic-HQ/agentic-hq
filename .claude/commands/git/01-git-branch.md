# ⚠️ WARNING: USER-ONLY COMMAND ⚠️

**This command should ONLY be run by the USER, not by Claude.**

Claude should NOT invoke this command autonomously. If the user wants to use this command, they should run it themselves by typing the slash command.

---

You are helping the user create a new feature branch following the Git feature branch workflow.

## Step 1: Verify Git Status

Run the confirmation script to check if the workspace is ready for branching and tell the user what exact command you are running:

```bash
src/scripts/git-scripts/branching/01-git-branch/confirm-git-ok-to-branch.sh
```

**Check the output for "STATUS: OK_TO_BRANCH" or "STATUS: NOT_OK_TO_BRANCH"**

### If NOT_OK_TO_BRANCH:
- Show the user the output from the script (it provides detailed, context-specific recommendations)
- The script will tell them exactly what to fix based on their specific situation:
  - If uncommitted changes: commit or stash them
  - If not on main branch: checkout main
  - If behind origin/main: pull latest changes
- Inform them to follow the instructions given by the script to make things OK to branch and tell them that once they have done that they should tell you and then you must:
  - run the confirmation script again
- **Repeat this step until you see the confirmation script output "STATUS: OK_TO_BRANCH"**

### If OK_TO_BRANCH:
Proceed to Step 2.

---

## Step 2: Select Branch Prefix

Once the workspace is ready, explain to the user:

"I'll help you create a namespaced branch. First, let's choose the branch prefix."

Use the AskUserQuestion tool to present these branch prefix options:

**Question:** "Which type of branch do you want to create?"
**Header:** "Branch type"
**Options:**
1. `feature/` - New features or functionality
2. `bugfix/` - Bug fixes
3. `hotfix/` - Critical production fixes that can't wait
4. `refactor/` - Code restructuring without changing functionality
5. `docs/` - Documentation changes
6. `chore/` - Maintenance tasks (dependencies, build tools, cleanup)
7. `test/` - Test additions or modifications

Note: The user can also select "Supply my own custom branch prefix" to enter a custom prefix.

Store the selected prefix (including the trailing slash).

---

## Step 3: Get Branch Description

Ask the user for the branch description (the part after the prefix).

Provide these guidelines and examples:
- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Examples: `add-user-authentication`, `fix-login-bug`, `update-readme`, `refactor-error-handling`

Store the description.

---

## Step 4: Create the Branch

Combine the prefix and description to create the full branch name: `prefix/description`

Run the git command to create and checkout the new branch:

```bash
git checkout -b <prefix>/<description>
```

---

## Step 5: Confirm to User

After successfully creating the branch, inform the user:

"✓ Created and switched to branch: `<prefix>/<description>`

You can now start developing on this branch. 

While developing run the /02-git-perform-minor-WIP-commit-on-branch custom command to do minor Work In Progress commmits on your branch (which will be squashed into one big commit when merged into the main branch).

When you're ready to merge, run the /03-git-create-PR-and-squash-merge-to-main custom command which will run scripts to:
1. Push the branch to remote
2. Create a PR via `gh pr create`
3. Squash merge with `gh pr merge --squash`
4. Archive the branch (not delete it)"