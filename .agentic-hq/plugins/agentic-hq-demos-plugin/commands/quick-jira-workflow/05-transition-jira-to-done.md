You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID
2. Transition the Jira to Done
3. Write the output file
4. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)

## Step 2: Transition Jira to Done

Use the Jira MCP tools to transition the Jira to "Done":
1. First, use `jira_get_transitions` to get the available transitions for `{jira-id}`
2. Find the transition that moves the issue to "Done"
3. Use `jira_transition_issue` with that transition ID to move the Jira to Done

## Step 3: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "Jira {jira-id} transitioned to Done"
}
```

## Step 4: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
