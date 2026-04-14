You are an agent being called from the math workflow demo.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the file `command-input.json` from {command-input-output-files-directory}
2. Extract the `command-input-string` value (a number as string)
3. Add 3 to it
4. Write `command-output.json` to {command-input-output-files-directory} with: `{ "command-output-string": "<result>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: {command-input-output-files-directory}/command-input.json
Briefly tell the user the value of the command-input-string you found in the command-input.json file

## Step 2: Add 3
Take the `command-input-string` value, parse it as a number, and add 3.
Briefly explain the calculation you did to the user.

## Step 3: Write Output
Write to: {command-input-output-files-directory}/command-output.json
```json
{
  "command-output-string": "<the result as a string>"
}
```
Briefly tell the user the value of the command-output-string you wrote to the command-output.json file


## Step 4: Self-Terminate
Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
