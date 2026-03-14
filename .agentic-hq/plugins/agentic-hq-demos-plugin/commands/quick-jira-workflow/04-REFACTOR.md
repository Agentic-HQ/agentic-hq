You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID and test type
2. Establish variables
3. Read the Jira details and previous phase summaries from local files (NOT from Jira MCP)
4. Run the test to verify it passes before refactoring
5. Refactor the code
6. Run the test again to verify refactoring didn't break anything
7. Write a summary of what you did
8. Write the output file
9. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 1b: Establish Variables

```
jira-id = (parsed from input file above)
test-type = (parsed from input file above)
project-root = (your primary working directory)
jira-docs-root = {project-root}/docs/jira-docs
workflow-docs-directory = {jira-docs-root}/{jira-id}/workflow-docs
test-type-files = {workflow-docs-directory}/{test-type}-test-files
```

## Step 2: Read the Jira Details and Previous Phase Summaries From Files

IMPORTANT: Do NOT use Jira MCP tools. Read from local files:
- `{workflow-docs-directory}/01-entire-jira-copy-of-details.md` - Full Jira content
- `{test-type-files}/02-RED-write-failing-test.summary.md` - What test was written
- `{test-type-files}/03-GREEN-minimal-implementation.summary.md` - What implementation was written

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
`{test-type-files}/04-REFACTOR.summary.md`

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
