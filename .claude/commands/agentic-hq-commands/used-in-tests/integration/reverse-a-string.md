You are an agent being called from an integration test.

The temp directory containing command I/O files is: $0

Your job is to:
1. Read the file `command-input.json` from $0
2. Extract the `command-input-string` value
3. Reverse the string (e.g., "hello" becomes "olleh")
4. Write `command-output.json` to $0 with: `{ "command-output-string": "<reversed>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: $0/command-input.json

## Step 2: Reverse String
Take the `command-input-string` value and reverse it character by character.

## Step 3: Write Output
Write to: $0/command-output.json
```json
{
  "command-output-string": "<the reversed string>"
}
```

## Step 4: Self-Terminate
Run this command immediately:

/Users/stevepersonal/dev/agentic-hq/agentic-hq/tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
