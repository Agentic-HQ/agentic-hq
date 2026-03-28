

/** Strategy for building tool-specific CLI commands */
interface CLICommandBuilder {
  build(command: string, marshallingId: string): CLICommand;
}

Want to rename:
command
to
activityID

so that it's generic (command/skill/whatever Codex calls it) and isn't semantically confused with "command" as in CLI Command.






The calls to:

getAgenticHqWorkspaceRoot()

embedded in ClaudeCodeTool are a code smell.  These are like "global state function calls" and, if they stay the same while the whole system runs, should be initialised at boot time into the Config and that be passed around - not "pulled out of thin air" which makes unit testing much harder.  Once you have a Config object that gets passed around everywhere you can easily mock it and change it to test things.  