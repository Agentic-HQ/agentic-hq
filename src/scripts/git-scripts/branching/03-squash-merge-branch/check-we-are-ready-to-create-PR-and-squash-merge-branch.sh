#!/bin/bash

# check-we-are-ready-to-create-PR-and-squash-merge-branch.sh
#
# Purpose: Verifies that the current git repository state is ready for creating a PR and squash merging
#
# This script checks three critical conditions before creating a PR and squash merging:
# 1. Currently on a feature branch (NOT 'main')
# 2. Working directory is clean (no uncommitted changes)
# 3. All commits are pushed (local branch matches remote)
#
# Exit codes:
#   0 - All checks passed, safe to create PR and merge
#   1 - One or more checks failed, not safe to proceed
#
# Usage:
#   ./check-we-are-ready-to-create-PR-and-squash-merge-branch.sh
#
# Example output when ready:
#   ✓ Current branch: feature/my-feature (not main)
#   ✓ Working directory: clean
#   ✓ Status: all commits pushed to remote
#   STATUS: OK_TO_MERGE
#
# Example output when not ready:
#   ✗ Current branch: main (expected: feature branch)
#   ✓ Working directory: clean
#   ✓ Status: all commits pushed to remote
#   STATUS: NOT_OK_TO_MERGE

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_OK=true

echo "Usage info: see script header comments or run 'head -n 30 $0'"
echo ""

# Get current working directory and git root
echo "Current directory: $(pwd)"
echo ""
echo "Getting git repository root:"
echo "$ git rev-parse --show-toplevel"
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$GIT_ROOT" ]; then
    echo -e "${RED}✗ Not in a git repository${NC}"
    echo "STATUS: NOT_OK_TO_MERGE"
    exit 1
fi
echo "$GIT_ROOT"
echo ""

# Check 1: Are we on a feature branch (NOT main)?
echo "Check 1: Current branch"
echo "$ git rev-parse --abbrev-ref HEAD"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "$CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${GREEN}✓ Current branch: $CURRENT_BRANCH (not main)${NC}"
else
    echo -e "${RED}✗ Current branch: main (expected: feature branch)${NC}"
    echo "This command is only for merging feature branches, not for use on main."
    ALL_OK=false
fi
echo ""

# Check 2: Is the working directory clean?
echo "Check 2: Working directory status"
echo "$ git diff-index --quiet HEAD --"
if git diff-index --quiet HEAD --; then
    echo "(no output - working directory is clean)"
    echo -e "${GREEN}✓ Working directory: clean${NC}"
else
    echo "$ git status --short"
    git status --short
    echo -e "${RED}✗ Working directory: has uncommitted changes${NC}"
    ALL_OK=false
fi
echo ""

# Check 3: Are all commits pushed?
echo "Check 3: Sync status with remote"
echo ""
echo "Fetching latest from remote to compare..."
echo "$ git fetch origin $CURRENT_BRANCH"
if git fetch origin "$CURRENT_BRANCH" 2>&1; then
    echo -e "${GREEN}✓ Successfully fetched from origin/$CURRENT_BRANCH${NC}"
else
    echo -e "${YELLOW}⚠ Cannot fetch origin/$CURRENT_BRANCH (branch may not exist on remote yet)${NC}"
    echo "This might be the first push - you'll need to push before creating PR."
fi
echo ""

# Check if local branch is ahead of remote
echo "Checking if there are unpushed commits:"
echo "$ git rev-list @{u}..HEAD --count 2>/dev/null || echo 'no-upstream'"
UNPUSHED=$(git rev-list @{u}..HEAD --count 2>/dev/null || echo "no-upstream")
echo "$UNPUSHED"
echo ""

if [ "$UNPUSHED" = "no-upstream" ]; then
    echo -e "${RED}✗ Status: no remote tracking branch set${NC}"
    echo "You need to push this branch to remote first."
    ALL_OK=false
elif [ "$UNPUSHED" = "0" ]; then
    echo -e "${GREEN}✓ Status: all commits pushed to remote${NC}"
else
    echo -e "${RED}✗ Status: $UNPUSHED unpushed commit(s)${NC}"
    ALL_OK=false
fi

echo ""

# Final status
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}STATUS: OK_TO_MERGE${NC}"
    exit 0
else
    echo -e "${RED}STATUS: NOT_OK_TO_MERGE${NC}"
    echo ""
    echo "Recommended fixes:"
    echo ""

    STEP=1

    # Check if on main branch
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo "$STEP. This command is for merging feature branches into main."
        echo "   You should be ON a feature branch when running this command."
        echo "   If you want to create a new feature branch, use:"
        echo "     /git:01-git-branch"
        echo ""
        STEP=$((STEP + 1))
    fi

    # Check if working directory has uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "$STEP. Commit all your changes before creating PR:"
        echo "   Use the WIP commit command:"
        echo "     /git:02-git-perform-minor-WIP-commit-on-branch"
        echo ""
        echo "   Or commit manually:"
        echo "     git add -A"
        echo "     git commit -m \"Your commit message\""
        echo ""
        STEP=$((STEP + 1))
    fi

    # Check if there are unpushed commits or no remote tracking
    if [ "$UNPUSHED" != "0" ]; then
        if [ "$UNPUSHED" = "no-upstream" ]; then
            echo "$STEP. Push your branch to remote and set upstream tracking:"
            echo "     git push -u origin $CURRENT_BRANCH"
        else
            echo "$STEP. Push your unpushed commits to remote:"
            echo "     git push"
        fi
        echo ""
    fi

    echo "After fixing these issues, run this script again to verify."
    exit 1
fi
