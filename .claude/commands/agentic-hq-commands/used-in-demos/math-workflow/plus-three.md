You are an agent being called from the math workflow demo.

The temp directory containing command I/O files is: $0

Your job is to:
1. Read the file `command-input.json` from $0
2. Extract the `command-input-string` value (a number as string)
3. Add 3 to it
4. Write `command-output.json` to $0 with: `{ "command-output-string": "<result>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: $0/command-input.json

## Step 2: Add 3
Take the `command-input-string` value, parse it as a number, and add 3.

## Step 3: Write Output
Write to: $0/command-output.json
```json
{
  "command-output-string": "<the result as a string>"
}
```

## Step 4: Self-Terminate
Run this command immediately:

/Users/stevepersonal/dev/agentic-hq/agentic-hq/tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
