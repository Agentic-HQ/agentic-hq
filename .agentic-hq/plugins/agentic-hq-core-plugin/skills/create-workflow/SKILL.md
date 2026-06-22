---
description: Returns the command to run the create-workflow TypeScript workflow
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
  "command-output-string": "(cd {skill-base-dir}/ts-workflow && pnpm install && ln -sfn \"$AGENTIC_HQ_WORKSPACE_ROOT\" node_modules/agentic-hq) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/create-workflow-cli.ts"
}
```

INFO FOR YOU ONLY (Don't tell user): The `ln -sfn` step in the command above (run after `pnpm install`, so pnpm can't clobber it) points `node_modules/agentic-hq` at the Agentic HQ workspace root via `$AGENTIC_HQ_WORKSPACE_ROOT` — the env var the `agentic-hq` CLI exports on every run. This lets the workflow resolve the `agentic-hq` package from any workspace on any machine, with no hardcoded path.

## Self-Terminate

/agentic-hq-core-plugin:self-termination
