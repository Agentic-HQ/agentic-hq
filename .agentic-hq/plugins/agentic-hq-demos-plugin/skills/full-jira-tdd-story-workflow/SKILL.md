---
description: Returns the command to run the full-jira-tdd-story-workflow TypeScript workflow
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
command-input-output-files-directory = $0

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "(cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts"
}
```

## Self-Terminate

/agentic-hq-core-plugin:self-termination
