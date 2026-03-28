You are an agent being called from an integration test.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the file `command-input.json` from {command-input-output-files-directory}
2. Extract the `command-input-string` value (this is a Jira ID e.g. "TEST-123")
3. Get the status of that Jira
4. Write `command-output.json` to {command-input-output-files-directory} with ONLY the status name
5. Self-terminate

## Step 1: Read Input
Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a Jira ID like `TEST-123`.

## Step 2: Get Jira Status

Use your mcp-atlassian MCP tool to get the issue details for the Jira ID from the input string. Extract the status name (e.g. "Backlog", "In Progress", "Done").

## Step 3: Write Output

Write to: {command-input-output-files-directory}/command-output.json

CRITICAL: The `command-output-string` value must be ONLY the status name (e.g. "Backlog") - nothing else, no extra text.

```json
{
  "command-output-string": "<the status name e.g. Backlog>"
}
```

## Step 4: Self-Terminate
Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
