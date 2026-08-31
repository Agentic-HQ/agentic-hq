---
description: Terminates the current Claude Code CLI process and returns control to the parent process
disable-model-invocation: false
---

## Variables
Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
kill-current-process-script-path = {skill-base-dir}/scripts/kill-current-cli-process-node.cjs

## Self-Terminate
Run this command immediately which should terminate Claude Code and return control to the Agentic HQ wrapper script:

node "{kill-current-process-script-path}"
