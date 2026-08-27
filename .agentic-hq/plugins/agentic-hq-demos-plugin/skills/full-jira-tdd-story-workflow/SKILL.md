---
description: Reports where this workflow skill is installed so the Agentic HQ engine can build and run this workflow's TypeScript program
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
  "skill-base-dir": "{skill-base-dir}"
}
```

INFO FOR YOU ONLY (Don't tell user): This skill exists so the Agentic HQ engine can discover where this workflow skill is installed. You report `{skill-base-dir}` — the one fact only you know — and the engine itself constructs and runs the command for this workflow's linked TypeScript program (in `{skill-base-dir}/ts-workflow/`). This is what will make workflows in marketplace-installed plugins discoverable and runnable: wherever a plugin gets installed, you tell the engine where it landed. (Marketplace-installed plugin support is not yet completed/tested.)

Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: tell the Agentic HQ engine where this workflow skill is installed, so the engine can construct and run the command for this workflow's TypeScript program.

## Self-Terminate

/agentic-hq-core-plugin:self-termination
