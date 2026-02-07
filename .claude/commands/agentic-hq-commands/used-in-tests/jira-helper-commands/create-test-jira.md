You are an agent being called from an integration test.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the file `command-input.json` from {command-input-output-files-directory}
2. Extract the `command-input-string` value (contains "Title: ... Description: ...")
3. Create a Jira in the TEST project with that title and description
4. Write `command-output.json` to {command-input-output-files-directory} with ONLY the Jira ID (e.g. "TEST-123")
5. Self-terminate

## Step 1: Read Input
Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be in the format:
`Title: Some Title  Description: Some description text.`

Parse out the title (text after "Title:" and before "Description:") and the description (text after "Description:").

## Step 2: Create Jira

Use your Jira MCP tool to create a new issue in the **TEST** project with:
- Project key: TEST
- Issue type: Task
- Summary: the parsed title (trimmed)
- Description: the parsed description (trimmed)

Note the Jira key returned (e.g. `TEST-123`).

## Step 3: Write Output

Write to: {command-input-output-files-directory}/command-output.json

CRITICAL: The `command-output-string` value must be ONLY the Jira key (e.g. "TEST-123") - nothing else, no extra text, no quotes around it in the string value.

```json
{
  "command-output-string": "<the Jira key e.g. TEST-123>"
}
```

## Step 4: Self-Terminate
Change directory to the root of this project and then run this command immediately:

./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
