#!/bin/bash

# obtain-all-relevant-info-on-branch.sh
#
# Purpose: Gathers comprehensive information about the current branch for PR and merge commit analysis
#
# This script creates a timestamped directory containing:
# - branch-summary-info.md: High-level branch metadata (commits, dates, etc.)
# - full-branch-commit-history.txt: Detailed commit messages
# - full-branch-diff-from-main.txt: Complete diff from main branch
#
# These files are used by Claude to analyze the branch and create:
# - PR title and body
# - Merge commit message
#
# Exit codes:
#   0 - Successfully created all files
#   1 - Error occurred
#
# Usage:
#   ./obtain-all-relevant-info-on-branch.sh
#
# Output:
#   Prints the path to the created directory

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "GATHERING BRANCH ANALYSIS INFORMATION"
echo "========================================="
echo ""

# Generate timestamp
echo "Generating timestamp..."
echo "$ date '+%Y-%m-%d_%H-%M-%S'"
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
echo "$TIMESTAMP"
echo ""

# Create temp directory
TEMP_DIR="temp/temp-ai-git-analysis-files/${TIMESTAMP}-git-squash-merge-files"
echo "Creating temporary directory..."
echo "$ mkdir -p $TEMP_DIR"
mkdir -p "$TEMP_DIR"
echo -e "${GREEN}✓ Created: $TEMP_DIR${NC}"
echo ""

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
echo ""

# ============================================
# Create branch-summary-info.md
# ============================================
echo "Creating branch-summary-info.md..."
SUMMARY_FILE="$TEMP_DIR/branch-summary-info.md"

{
    echo "# Branch Summary Information"
    echo "Generated: $TIMESTAMP"
    echo ""

    echo "## Current Branch Name"
    echo "\`\`\`bash"
    echo "$ git rev-parse --abbrev-ref HEAD"
    git rev-parse --abbrev-ref HEAD
    echo "\`\`\`"
    echo ""

    echo "## Merge Base (Where Branch Diverged from Main)"
    echo "\`\`\`bash"
    echo "$ git merge-base main HEAD"
    git merge-base main HEAD
    echo "\`\`\`"
    echo ""

    echo "## Number of Commits to be Squashed"
    echo "\`\`\`bash"
    echo "$ git rev-list --count main..HEAD"
    git rev-list --count main..HEAD
    echo "\`\`\`"
    echo ""

    echo "## First Commit Time (When Work Started)"
    echo "\`\`\`bash"
    echo "$ git log main..HEAD --reverse --format='%ai' | head -n 1"
    git log main..HEAD --reverse --format="%ai" | head -n 1
    echo "\`\`\`"
    echo ""

    echo "## Concise List of All Commits"
    echo "\`\`\`bash"
    echo "$ git log main..HEAD --oneline"
    git log main..HEAD --oneline
    echo "\`\`\`"
    echo ""

    echo "## Last Commit Time (When Work Finished)"
    echo "\`\`\`bash"
    echo "$ git log -1 --format='%ai'"
    git log -1 --format="%ai"
    echo "\`\`\`"

} > "$SUMMARY_FILE"

echo -e "${GREEN}✓ Created: $SUMMARY_FILE${NC}"
echo ""

# ============================================
# Create full-branch-commit-history.txt
# ============================================
echo "Creating full-branch-commit-history.txt..."
HISTORY_FILE="$TEMP_DIR/full-branch-commit-history.txt"

{
    echo "Full Branch Commit History"
    echo "=========================="
    echo ""
    echo "Command: git log main..HEAD --format='%h - %s%n%b'"
    echo ""
    echo "---"
    echo ""
    git log main..HEAD --format="%h - %s%n%b"
} > "$HISTORY_FILE"

echo -e "${GREEN}✓ Created: $HISTORY_FILE${NC}"
echo ""

# ============================================
# Create full-branch-diff-from-main.txt
# ============================================
echo "Creating full-branch-diff-from-main.txt..."
DIFF_FILE="$TEMP_DIR/full-branch-diff-from-main.txt"

{
    echo "Full Branch Diff from Main"
    echo "=========================="
    echo ""
    echo "Command: git diff main...HEAD"
    echo ""
    echo "---"
    echo ""
    git diff main...HEAD
} > "$DIFF_FILE"

echo -e "${GREEN}✓ Created: $DIFF_FILE${NC}"
echo ""

# ============================================
# Summary
# ============================================
echo "========================================="
echo "ANALYSIS FILES CREATED SUCCESSFULLY"
echo "========================================="
echo ""
echo -e "${BLUE}Directory: $TEMP_DIR${NC}"
echo ""
echo "Files created:"
echo "  1. branch-summary-info.md"
echo "  2. full-branch-commit-history.txt"
echo "  3. full-branch-diff-from-main.txt"
echo ""
echo "These files contain all information needed for:"
echo "  - Drafting PR title and body"
echo "  - Drafting merge commit message"
echo "  - Understanding branch changes"
echo ""

# Output just the directory path as the last line for easy capture
echo "$TEMP_DIR"
