You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID, project root, and test type
2. Read the Jira details from a local file (NOT from Jira MCP)
3. Write a failing test for the given test type
4. Run the test and verify it FAILS
5. Write a summary of what you did
6. Write the output file
7. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 2: Read the Jira Details From File

IMPORTANT: Do NOT use Jira MCP tools. Read the Jira details from the local file:
`docs/jira-docs/{jira-id}/workflow-docs/01-entire-jira-copy-of-details.md`

This file was created by the previous command (01) and contains the full Jira content.

## Step 3: Write a Failing Test

Based on the Jira details and the test type, write a failing test:

- For `unit` test type: Write a unit test file that tests the core function/module described in the Jira
- For `e2e` test type: Write an e2e test file that tests the CLI/program end-to-end as described in the Jira

Write the test file(s) relative to the project root.

The test should fail because the implementation doesn't exist yet (this is the RED phase of TDD). A compilation error or import error because the module doesn't exist IS a valid failure.

## Step 4: Run the Test and Verify it FAILS

Run the test you just wrote and confirm that it fails. This is the RED phase - the test MUST fail. If it passes, something is wrong with the test.

## Step 5: Write Summary

Create the directory `docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files` if it doesn't exist.

Write a summary of what test was written and why it fails to:
`docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/02-RED-write-failing-test.summary.md`

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "RED phase complete for test-type {test-type}"
}
```

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
