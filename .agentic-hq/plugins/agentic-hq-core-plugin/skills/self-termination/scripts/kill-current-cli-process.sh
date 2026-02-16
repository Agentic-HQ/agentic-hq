#!/usr/bin/env bash

# Kill Current CLI Process Script
#
# USAGE FOR AI AGENTS:
# This script terminates the current CLI session and returns control to the parent process.
#
# NOTE: Should not be included in command files or run directly, apart from by the
# Self Termination skill.  If you want to self termination you should invoke the 
# Self Termination skill, which will do the work for you.
#
# This script is invoked by the Self Termination skill at:
# .agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md
# which runs it using: 
# {skill-base-dir}/scripts/kill-current-cli-process.sh $PPID
#
# WHAT THIS DOES:
# - Kills the CLI process with the provided PID
# - Ends the current AI Agent session immediately
# - Returns control to the calling process (typically Agentic HQ Workflow Engine)
#
# PROCESS FLOW:
# 1. Agentic HQ Workflow Engine starts CLI process
# 2. AI Agent runs within CLI (e.g. Claude Code CLI or Codex CLI)
# 3. AI Agent run Self Termination skill included in the Agentic HQ Core Plugin
# 3. Self Termination skill executes this script with $PPID
# 4. Script kills CLI process (the AI Agent's parent)
# 5. Control returns to Agentic HQ Workflow Engine
#
# PORTABILITY:
# - Uses #!/usr/bin/env bash for cross-platform compatibility
# - Works on macOS, Linux, BSD, Solaris, and other Unix-like systems
# - Uses POSIX-compatible features: kill, echo, test
# - WARNING: Does NOT work on Windows natively (requires WSL or similar) NOTE: We aim to write a Windows version of this script later.

# Check if exactly one argument provided
if [ $# -ne 1 ]; then
    echo "ERROR: This script requires exactly one argument - the CLI process PID"
    echo "USAGE: ./tools/scripts/process-control/unix/kill-current-cli-process.sh \$PPID"
    echo "This will kill the current CLI session and return control to the parent process"
    exit 1
fi

# Check if argument is a number
if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid PID '$1' - must be a number"
    exit 1
fi

CLI_PID="$1"

# Check if process is running and get its command
if ! kill -0 "$CLI_PID" 2>/dev/null; then
    echo "ERROR: Process with PID $CLI_PID is not running or not accessible"
    exit 1
fi

# Get the command name/path for the process
# Uses Linux /proc fallback for better compatibility, then falls back to portable ps approach
if [ -r "/proc/$CLI_PID/comm" ]; then
    # Linux-specific: direct read from /proc (most reliable)
    PROCESS_CMD=$(cat "/proc/$CLI_PID/comm" 2>/dev/null)
else
    # Portable fallback: works on macOS, BSD, Solaris, but may include arguments
    PROCESS_CMD=$(ps -p "$CLI_PID" 2>/dev/null | tail -n +2 | awk '{print $NF}' | xargs basename 2>/dev/null)
fi
if [ -z "$PROCESS_CMD" ]; then
    echo "WARNING: Could not determine command for PID $CLI_PID"
    PROCESS_CMD="unknown"
fi

echo "CLI_PID: $CLI_PID is running: $PROCESS_CMD"
echo "Terminating CLI process with CLI_PID: $CLI_PID (which should return control to the Agentic HQ Workflow Engine)"
# SIGINT (signal 2) is part of POSIX.1-1990 standard and works on all Unix-like systems:
# Linux, macOS, FreeBSD, OpenBSD, NetBSD, Solaris, AIX, HP-UX, and other POSIX-compliant systems
# Uses -INT instead of default SIGTERM to mimic Ctrl+C behavior, allowing graceful cleanup
kill -INT "$CLI_PID"