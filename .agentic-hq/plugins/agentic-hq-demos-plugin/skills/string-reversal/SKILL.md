---
description: Returns the command to run the string-reversal TypeScript workflow
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
base-command = pnpm install --ignore-workspace && pnpm demo:string-reversal
command-input-output-files-directory = $0

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "cd {skill-base-dir}/ts-workflow && {base-command}"
}
```

## Self-Terminate

/agentic-hq-core-plugin:self-termination
