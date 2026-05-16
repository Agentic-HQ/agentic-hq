---
description: Returns the command to run the full-jira-tdd-story-workflow TypeScript workflow
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
  "command-output-string": "(cd {skill-base-dir}/ts-workflow && pnpm install) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts"
}
```
Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: construct the command used to run the Typesscript program that runs the full workflow.

## Self-Terminate

/agentic-hq-core-plugin:self-termination
