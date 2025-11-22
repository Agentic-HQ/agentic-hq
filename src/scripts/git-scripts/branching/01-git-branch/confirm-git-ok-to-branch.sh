#!/bin/bash

# confirm-git-ok-to-branch.sh
#
# Purpose: Verifies that the current git repository state is ready for creating a new feature branch
#
# This script checks three critical conditions before branching:
# 1. Currently on the 'main' branch
# 2. Working directory is clean (no uncommitted changes)
# 3. Local main is up to date with origin/main
#
# Exit codes:
#   0 - All checks passed, safe to create a new branch
#   1 - One or more checks failed, not safe to branch
#
# Usage:
#   ./confirm-git-ok-to-branch.sh
#
# Example output when ready:
#   ✓ Current branch: main
#   ✓ Working directory: clean
#   ✓ Status: up to date with origin/main
#   STATUS: OK_TO_BRANCH
#
# Example output when not ready:
#   ✗ Current branch: feature/something (expected: main)
#   ✓ Working directory: clean
#   ✓ Status: up to date with origin/main
#   STATUS: NOT_OK_TO_BRANCH

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
    echo "STATUS: NOT_OK_TO_BRANCH"
    exit 1
fi
echo "$GIT_ROOT"
echo ""

# Check 1: Are we on the main branch?
echo "Check 1: Current branch"
echo "$ git rev-parse --abbrev-ref HEAD"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "$CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${GREEN}✓ Current branch: main${NC}"
else
    echo -e "${RED}✗ Current branch: $CURRENT_BRANCH (expected: main)${NC}"
    ALL_OK=false
fi
echo ""

# Check 2: Is the working directory clean?
echo "Check 2: Working directory status"
echo "$ git status --short"
GIT_STATUS=$(git status --short)
if [ -z "$GIT_STATUS" ]; then
    echo "(no output - working directory is clean)"
    echo -e "${GREEN}✓ Working directory: clean${NC}"
else
    echo "$GIT_STATUS"
    echo -e "${RED}✗ Working directory: has uncommitted changes${NC}"
    ALL_OK=false
fi
echo ""

# Check 3: Are we up to date with origin/main?
echo "Check 3: Sync status with origin/main"
echo ""
echo "Note: About to run 'git fetch origin main' to get current remote state."
echo "This updates .git/refs/remotes/origin/main (remote-tracking branch) and downloads"
echo "any new commits/objects to .git/objects/. It does NOT modify your working directory,"
echo "local branches, or staged changes. This is a safe, read-only operation."
echo ""
echo "$ git fetch origin main"
if git fetch origin main 2>&1; then
    echo -e "${GREEN}✓ Successfully fetched from origin/main${NC}"
else
    echo -e "${RED}✗ Cannot fetch from origin/main (is remote configured?)${NC}"
    ALL_OK=false
fi
echo ""

if [ "$ALL_OK" = true ]; then
    # Compare local main with origin/main
    echo "Getting local main branch commit hash:"
    echo "$ git rev-parse main"
    LOCAL=$(git rev-parse main 2>/dev/null || echo "")
    echo "$LOCAL"
    echo ""

    echo "Getting remote origin/main branch commit hash:"
    echo "$ git rev-parse origin/main"
    REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "")
    echo "$REMOTE"
    echo ""

    if [ -z "$LOCAL" ] || [ -z "$REMOTE" ]; then
        echo -e "${RED}✗ Cannot compare main with origin/main${NC}"
        ALL_OK=false
    elif [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✓ Status: up to date with origin/main${NC}"
    else
        # Check if we're behind
        echo "Finding common ancestor of main and origin/main:"
        echo "$ git merge-base main origin/main"
        MERGE_BASE=$(git merge-base main origin/main 2>/dev/null || echo "")
        echo "$MERGE_BASE"
        echo ""

        if [ "$MERGE_BASE" = "$LOCAL" ]; then
            echo -e "${RED}✗ Status: behind origin/main (need to pull)${NC}"
            ALL_OK=false
        elif [ "$MERGE_BASE" = "$REMOTE" ]; then
            echo -e "${YELLOW}⚠ Status: ahead of origin/main (unpushed commits)${NC}"
            # This is OK - we can still branch from our local main
        else
            echo -e "${RED}✗ Status: diverged from origin/main${NC}"
            ALL_OK=false
        fi
    fi
fi

echo ""

# Final status
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}STATUS: OK_TO_BRANCH${NC}"
    exit 0
else
    echo -e "${RED}STATUS: NOT_OK_TO_BRANCH${NC}"
    echo ""
    echo "Recommended fixes:"
    echo ""

    STEP=1

    # Check if working directory has uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "$STEP. Clean your working directory (you have uncommitted changes):"
        echo "   Option A: Commit your changes"
        echo "     git add ."
        echo "     git commit -m \"Your commit message\""
        echo ""
        echo "   Option B: Stash your changes (if you want to save them for later)"
        echo "     git stash push -m \"Description of changes\""
        echo ""
        STEP=$((STEP + 1))
    fi

    # Check if not on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo "$STEP. Switch to main branch:"
        echo "     git checkout main"
        echo ""
        STEP=$((STEP + 1))
    fi

    # Always recommend pulling to be up to date
    echo "$STEP. Pull latest changes from origin/main:"
    echo "     git pull origin main"
    echo ""

    echo "After fixing these issues, run this script again to verify."
    exit 1
fi
