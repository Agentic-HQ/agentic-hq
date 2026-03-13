You are an agent being called from the quick Jira workflow demo CLI.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the input file to get the Jira ID and project root
2. Read the Jira to understand what work needs to be done
3. Copy the entire Jira details to a file
4. Determine the test types
5. Create a summary of the Jira (including test types discovered)
6. Write the output file with the test types
7. Self-terminate

## Step 1: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)

## Step 2: Read the Jira

Use the jira-verbatim-content-extractor sub-agent (Task tool with subagent_type "jira-verbatim-content-extractor") to read the full content of the Jira at:
`https://agentic-hq.atlassian.net/browse/{jira-id}`

This saves context in the current session by delegating the Jira reading to a sub-agent.

## Step 3: Copy Entire Jira Details

Set this variable:
- `workflow-docs-directory` = `docs/jira-docs/{jira-id}/workflow-docs`

Create the directory `{workflow-docs-directory}` if it doesn't exist.

Write the ENTIRE verbatim Jira content (title, description, all fields - everything the sub-agent returned) to:
`{workflow-docs-directory}/01-entire-jira-copy-of-details.md`

## Step 4: Determine Test Types

Look in the Jira description for a line matching: `Test types: X, Y` (where X, Y are comma-separated test types).

If found, extract the comma-separated test types (e.g. `unit, e2e`).

If NOT found, intelligently determine which test types are needed from the possible list: unit, integration, smoke, e2e. Return the relevant ones in that order.

If no tests are needed at all, use an empty string "".

## Step 5: Create Summary

Write a brief summary of the Jira to:
`{workflow-docs-directory}/01-summary-of-jira.md`

The summary should include:
- The Jira ID and title
- What the Jira asks for (key requirements)
- The test types discovered and how they were determined (explicit "Test types:" line found in Jira, or inferred from analysis)
- A brief description of the planned approach

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "<comma-separated test types e.g. unit, e2e>"
}
```

CRITICAL: The `command-output-string` value must be ONLY the comma-separated test types (e.g. "unit, e2e") - nothing else, no extra text, no explanation. If no test types, use an empty string "".

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
