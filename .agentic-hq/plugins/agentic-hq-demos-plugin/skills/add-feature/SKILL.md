---
description: Returns the command to run the add-feature TypeScript workflow
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
command-input-output-files-directory = $0
build-mode = $1
ahq-package-root = $2

List the variable names and values for the user, and explain where they came from.

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "node \"{ahq-package-root}/scripts/run-workflow.cjs\" --ahq-package-root=\"{ahq-package-root}\" --build-mode={build-mode} --workflow-js=dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.js"
}
```

INFO FOR YOU ONLY (Don't tell user): The command above invokes the shared workflow runner with the explicit runtime parameters you were handed as arguments — you relay `build-mode` and `ahq-package-root` VERBATIM into the command without interpreting or acting on them. The runner is the only code that acts on `build-mode`: `build-first` builds the release tree and executes the workflow JS from it; `prebuilt` executes the installed artifact as-is. Everything runs under plain node from the execution root — no package manager, no symlinks, no environment variables.

Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: construct the command used to run the TypeScript program that runs the full workflow.


## Self-Terminate

/agentic-hq-core-plugin:self-termination
