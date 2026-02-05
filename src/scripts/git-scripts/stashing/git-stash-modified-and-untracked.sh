#!/bin/bash

# git-stash-modified-and-untracked.sh
#
# Purpose: Safely stash modified and untracked files (but NOT ignored files). Used when I’ve made changes but
# I’ve forgotten to create a branch first. With this script I can stash the changes, create the branch and then pop the changes
# and commit them onto the new branch.
#
# This script runs `git stash -u` which stashes:
#   - Modified tracked files
#   - Untracked files
#   - Does NOT include ignored files (node_modules, build dirs, etc.)
#
# WARNING: Do NOT use `git stash -a` (--all) as it includes ignored files
# like node_modules/, which can take ages and stash thousands of files!
#
# Exit codes:
#   0 - Stash created successfully
#   1 - Aborted by user or error occurred
#
# Usage:
#   ./git-stash-modified-and-untracked.sh
#
# To restore stashed changes later:
#   git stash pop

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Git Stash (Modified + Untracked)${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check we're in a git repository
echo "Checking git repository..."
echo -e "$ git rev-parse --show-toplevel"
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$GIT_ROOT" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi
echo "$GIT_ROOT"
echo -e "${GREEN}OK - in git repository${NC}"
echo ""

# Show current state BEFORE
echo -e "${YELLOW}=== CURRENT GIT STATUS ===${NC}"
echo -e "$ git status"
git status
echo ""

echo -e "${YELLOW}=== EXISTING STASHES ===${NC}"
echo -e "$ git stash list"
STASH_LIST=$(git stash list)
if [ -z "$STASH_LIST" ]; then
    echo "(no existing stashes)"
else
    echo "$STASH_LIST"
fi
echo ""

# Show command to run
echo -e "${CYAN}----------------------------------------${NC}"
echo -e "Command to run: ${GREEN}git stash -u${NC}"
echo ""
echo "This will stash:"
echo "  - Modified tracked files"
echo "  - Untracked files"
echo "  - Does NOT include ignored files (safe and fast)"
echo -e "${CYAN}----------------------------------------${NC}"
echo ""

# User confirmation
echo -e "Press ${GREEN}Enter${NC} to proceed, or ${RED}Ctrl+C${NC} to abort..."
read -r

# Execute the command
echo ""
echo -e "$ git stash -u"
if git stash -u; then
    echo ""
    echo -e "${GREEN}Stash created successfully!${NC}"
else
    echo ""
    echo -e "${RED}Stash command failed${NC}"
    exit 1
fi

echo ""

# Show state AFTER
echo -e "${YELLOW}=== GIT STATUS AFTER STASH ===${NC}"
echo -e "$ git status"
git status
echo ""

echo -e "${YELLOW}=== STASH LIST AFTER ===${NC}"
echo -e "$ git stash list"
git stash list
echo ""

# Success message with pop command
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Done!${NC}"
echo ""
echo "To restore your stashed changes, run:"
echo ""
echo -e "    ${GREEN}git stash pop${NC}"
echo ""
echo -e "${CYAN}========================================${NC}"
