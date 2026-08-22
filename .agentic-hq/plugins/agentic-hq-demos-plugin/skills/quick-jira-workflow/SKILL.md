---
description: Returns the command that runs this workflow's TypeScript program via the shared agentic-hq workflow runner
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
skill-id = the final path segment of {skill-base-dir} (this skill's directory name, which is its skill id)
workflow-program-name = {skill-id}-cli
command-input-output-files-directory = $0
build-mode = $1
ahq-package-root = $2

List the variable names and values for the user, and explain where they came from.

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "node \"{ahq-package-root}/scripts/run-workflow.cjs\" --ahq-package-root=\"{ahq-package-root}\" --build-mode={build-mode} --workflow-dir=\"{skill-base-dir}/ts-workflow\" --workflow-js=dist/{workflow-program-name}.js"
}
```

INFO FOR YOU ONLY (Don't tell user): The command above invokes the shared workflow runner with the values you were handed — you relay `build-mode` and `ahq-package-root` VERBATIM without interpreting or acting on them; `skill-base-dir` names this workflow's own `ts-workflow/` directory, and `skill-id` (its final path segment) names this workflow's TypeScript program by convention: `src/{skill-id}-cli.ts`, compiled to `dist/{skill-id}-cli.js`. The runner is the only code that acts on `build-mode`: `build-first` runs the Workflow Build for THIS workflow (pnpm install → symlink node_modules/agentic-hq → tsc into ts-workflow/dist/) and then runs it; `prebuilt` just runs the already-built dist/. The runner never builds the agentic-hq framework itself. Everything runs under plain node — no environment variables.

Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: construct the command used to run the TypeScript program that runs the full workflow.

## Self-Terminate

/agentic-hq-core-plugin:self-termination
