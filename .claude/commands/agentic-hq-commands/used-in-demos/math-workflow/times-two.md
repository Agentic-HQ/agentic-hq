You are an agent being called from the math workflow demo.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Read the file `command-input.json` from {command-input-output-files-directory}
2. Extract the `command-input-string` value (a number as string)
3. Multiply it by 2
4. Write `command-output.json` to {command-input-output-files-directory} with: `{ "command-output-string": "<result>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: {command-input-output-files-directory}/command-input.json

## Step 2: Multiply by 2
Take the `command-input-string` value, parse it as a number, and multiply by 2.

## Step 3: Write Output
Write to: {command-input-output-files-directory}/command-output.json
```json
{
  "command-output-string": "<the result as a string>"
}
```

## Step 4: Self-Terminate
Change directory to the root of this project and then run this command immediately:

./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
