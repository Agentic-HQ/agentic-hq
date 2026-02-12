You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID, project root, and test type
2. Read the Jira details and RED phase summary from local files (NOT from Jira MCP)
3. Write minimal code to make the failing test pass
4. Run the test and verify it PASSES
5. Write a summary of what you did
6. Write the output file
7. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `project-root` - the absolute path to the project root directory
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 2: Read the Jira Details and RED Phase Summary From Files

IMPORTANT: Do NOT use Jira MCP tools. Read from local files:
- `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/01-entire-jira-copy-of-details.md` - Full Jira content
- `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/02-RED-write-failing-test.summary.md` - What test was written and why it fails

## Step 3: Write Minimal Implementation

Based on the Jira details and the failing test, write the MINIMUM code needed to make the test pass.

GREEN PHASE RULES:
- Write ONLY enough code to make the test pass
- Hard-coded values are OK if that's all the test needs
- Ugly but working is acceptable
- No gold-plating or extra features
- No premature optimization
- Copy-paste and duplication are OK

Write all implementation files relative to `{project-root}`.

## Step 4: Run the Test and Verify it PASSES

Run the test and confirm that it now passes. This is the GREEN phase - the test MUST pass. If it still fails, fix the implementation until it passes.

## Step 5: Write Summary

Write a summary of what was implemented to:
`{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/03-GREEN-minimal-implementation.summary.md`

The summary should include:
- What files were created/modified
- What minimal code was written
- Confirmation that the test passes

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "GREEN phase complete for test-type {test-type}"
}
```

## Step 7: Self-Terminate

Change directory to the root of this project and then run this command immediately:

./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
