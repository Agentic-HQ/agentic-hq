#!/usr/bin/env node
/**
 * Kill Current CLI Process Script (cross-platform Node version)
 *
 * USAGE FOR AI AGENTS:
 * This script terminates the current CLI session and returns control to the
 * parent process.
 *
 * NOTE: Should not be included in command files or run directly, apart from
 * by the Self Termination skill. If you want to self-terminate you should
 * invoke the Self Termination skill, which will do the work for you.
 *
 * This script is invoked by the Self Termination skill at:
 * .agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md
 * which runs it using:
 * node "{skill-base-dir}/scripts/kill-current-cli-process-node.cjs"
 *
 * The target PID comes from env:CLAUDE_PID — Claude Code (>= v2.1.214)
 * stamps its own PID into the environment of every process it spawns, so no
 * argument is needed. (This replaced a bash script that took $PPID, which
 * breaks on native Windows: under Git Bash the MSYS fake process tree
 * reports PPID 1 — see AHQ-211.)
 *
 * PROCESS FLOW:
 * 1. Agentic HQ Workflow Engine starts CLI process
 * 2. AI Agent runs within CLI (e.g. Claude Code CLI)
 * 3. AI Agent runs the Self Termination skill (Agentic HQ Core Plugin)
 * 4. The skill runs this script, which signals the CLI process via CLAUDE_PID
 * 5. CLI process dies; control returns to the Agentic HQ Workflow Engine
 *
 * PLATFORM BEHAVIOUR:
 * - POSIX (macOS, Linux, BSD...): sends SIGINT (== kill -INT, mimicking
 *   Ctrl+C for graceful cleanup) — the CLI process exits 130.
 * - Windows: Node's process.kill(pid, 'SIGTERM') is an unconditional
 *   TerminateProcess — the CLI process exits 1. Deliberate: Windows has no
 *   deliverable Ctrl+C equivalent for an arbitrary PID.
 *
 * MUST WRITE NO FILES, EVER — console output only. This script ships inside
 * the plugin tree, so anything it writes lands in the installed package: a
 * temporary test copy of it once appended a __dirname-relative log file that
 * shipped in a release build (caught by the AHQ-211 Phase 3 cross-OS build
 * checkpoint).
 */
'use strict';

const rawClaudePid = process.env.CLAUDE_PID;
const cliPid = Number(rawClaudePid);
if (!rawClaudePid || !Number.isInteger(cliPid) || cliPid <= 1) {
  console.error(
    `ERROR: CLAUDE_PID not set or invalid ('${rawClaudePid ?? ''}') — Agentic HQ requires Claude Code >= v2.1.214`
  );
  process.exit(1);
}

// Existence/permission probe only — signal 0 delivers nothing
try {
  process.kill(cliPid, 0);
} catch {
  console.error(`ERROR: pid ${cliPid} (via env:CLAUDE_PID) is not running or not accessible`);
  process.exit(1);
}

const signal = process.platform === 'win32' ? 'SIGTERM' : 'SIGINT';
console.log(
  `Terminating CLI process ${cliPid} (via env:CLAUDE_PID) with ${signal} — control should return to the Agentic HQ Workflow Engine`
);
process.kill(cliPid, signal);
