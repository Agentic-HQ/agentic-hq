You are an agent being called from an integration test.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the file `command-input.json` from {command-input-output-files-directory}
2. Extract the `command-input-string` value
3. Reverse the string (e.g., "hello" becomes "olleh")
4. Write `command-output.json` to {command-input-output-files-directory} with: `{ "command-output-string": "<reversed>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: {command-input-output-files-directory}/command-input.json

## Step 2: Reverse String
Take the `command-input-string` value and reverse it character by character.

## Step 3: Write Output
Write to: {command-input-output-files-directory}/command-output.json
```json
{
  "command-output-string": "<the reversed string>"
}
```

## Step 4: Self-Terminate
Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
