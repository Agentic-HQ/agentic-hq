Read the jira-id from the parameters to this task.
If not provided tell the human it is required and ask them for it and DO NOT CONTINUE until you have it.

Use the following paramters:
```
jira-id = (parameter provided to this command)
project-root = (your primary working directory)
jira-docs-root = {project-root}/docs/jira-docs
rpi-docs-directory = {jira-docs-root}/{jira-id}/rpi-docs
jira-copy-file={rpi-docs-directory}/01-entire-jira-copy-of-details.{jira-id}.md
deep-research-prompt-file={rpi-docs-directory}/02-RPI-deep-research-prompt-without-task-details.md
deep-research-report-file={rpi-docs-directory}/03-RPI-deep-research-prompt-without-task-details.REPORT.md

```

## Step 2: Read the Jira

Use the jira-verbatim-content-extractor sub-agent (Task tool with subagent_type "jira-verbatim-content-extractor") to read the full content of the Jira at:
`https://agentic-hq.atlassian.net/browse/{jira-id}`

This saves context in the current session by delegating the Jira reading to a sub-agent.

## Step 3: Copy Entire Jira Details

Create the directory `{rpi-docs-directory}` if it doesn't exist.

NOTE: If there are multiple related Jiras for the Jira you read (e.g. parents and subtasks), please create multiple files numbered by Jira e.g.:
- 01-entire-jira-copy-of-details.AHQ-123.md
- 01-entire-jira-copy-of-details.AHQ-456.md
- 01-entire-jira-copy-of-details.AHQ-789.md

Write the ENTIRE verbatim Jira content (title, description, all fields - everything the sub-agent returned) to that file (or the multiple files detailed above):
`{jira-copy-file}`

## Step 4: Additional Reading

Also read the main files or git history for the task (remember: you're not actually doing all the deep research).  You need to understand enough to be able to provide a detailed request to another Agent for deep research on the task.

Then create a Prompt at:
{deep-research-prompt-file}
for an agent in a *FRESH* session to do the deep research for this task.

Importantly in your prompt you must:
- NOT include any details of the task. This is to prevent the Agent from starting to solutionise the problem in it's report.
- Tell what aspects of the system you want the Agent's opinion on or detailed research on
- Include any requests for external (web based or Perplexity) research if you think that would be useful.

Ask it to write it's report at:
{deep-research-report-file}
and so include a section at the bottom for the output of a back and fourth discussion with the user about questions/answers and additional research the human wanted after reading the report.

Thanks.