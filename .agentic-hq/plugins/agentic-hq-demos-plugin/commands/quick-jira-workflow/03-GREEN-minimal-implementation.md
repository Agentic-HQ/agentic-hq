You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID and test type
2. Establish variables
3. Read the Jira details and RED phase summary from local files (NOT from mcp-atlassian MCP)
4. Write minimal code to make the failing test pass
5. Run the test and verify it PASSES
6. Write a summary of what you did
7. Write the output file
8. Self-terminate

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

## Step 2: Read the Jira Details and RED Phase Summary From Files

IMPORTANT: Do NOT use mcp-atlassian MCP tools. Read from local files:
- `{workflow-docs-directory}/01-entire-jira-copy-of-details.md` - Full Jira content
- `{test-type-files}/02-RED-write-failing-test.summary.md` - What test was written and why it fails

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
`{test-type-files}/03-GREEN-minimal-implementation.summary.md`

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

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
