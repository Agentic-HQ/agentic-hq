---
description: Returns the command to run the math-workflow TypeScript workflow
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
command-input-output-files-directory = $0

List the variable names and values for the user, and explain where they came from.

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "node \"$AGENTIC_HQ_WORKSPACE_ROOT/scripts/run-workflow.cjs\" --ahq-package-root=\"$AGENTIC_HQ_WORKSPACE_ROOT\" --workflow-js=dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js"
}
```

INFO FOR YOU ONLY (Don't tell user): The command above runs the PREBUILT workflow — run-workflow.cjs launches the compiled workflow JS (under dist/ inside the agentic-hq package) with plain node, passing any trailing args through to the workflow program. `$AGENTIC_HQ_WORKSPACE_ROOT` — the env var the `agentic-hq` CLI exports on every run — supplies the package root, so this works from any workspace on any machine with no package manager, no symlinks, and no installs at runtime.

Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: construct the command used to run the Typesscript program that runs the full workflow.


## Self-Terminate

/agentic-hq-core-plugin:self-termination
