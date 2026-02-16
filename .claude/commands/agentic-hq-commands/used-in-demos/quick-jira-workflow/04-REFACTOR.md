You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID, project root, and test type
2. Read the Jira details and previous phase summaries from local files (NOT from Jira MCP)
3. Run the test to verify it passes before refactoring
4. Refactor the code
5. Run the test again to verify refactoring didn't break anything
6. Write a summary of what you did
7. Write the output file
8. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `project-root` - the absolute path to the project root directory
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 2: Read the Jira Details and Previous Phase Summaries From Files

IMPORTANT: Do NOT use Jira MCP tools. Read from local files:
- `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/01-entire-jira-copy-of-details.md` - Full Jira content
- `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/02-RED-write-failing-test.summary.md` - What test was written
- `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/03-GREEN-minimal-implementation.summary.md` - What implementation was written

## Step 3: Run Tests Before Refactoring

Find and run the test for this test type to verify it passes BEFORE making any changes. Look at the test files created in the RED phase to identify which test to run.

## Step 4: Refactor

Review the implementation code and refactor for:
- Improved code structure and readability
- Removing duplication
- Extraction of magic constants
- Better naming
- Adding inline comments/documentation where helpful

Do NOT optimize for performance unless there's a clear problem.

## Step 5: Run Tests After Refactoring

Run the same test again to verify refactoring didn't break anything. The test MUST still pass.

## Step 6: Write Summary

Write a summary of what was refactored to:
`{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/04-REFACTOR.summary.md`

The summary should include:
- What refactoring was done (or "No refactoring needed" if the code was already clean)
- Confirmation that the test still passes after refactoring

## Step 7: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "REFACTOR phase complete for test-type {test-type}"
}
```

## Step 8: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
