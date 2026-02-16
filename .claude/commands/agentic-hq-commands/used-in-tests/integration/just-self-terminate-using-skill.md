You are an agent being called from an integration test.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Write a dummy output file
2. Self-terminate by using the self-termination skill

## Step 1: Write Output
Write to: {command-input-output-files-directory}/command-output.json
```json
{
  "command-output-string": "terminated"
}
```

## Step 2: Self-Terminate Using Skill
Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
