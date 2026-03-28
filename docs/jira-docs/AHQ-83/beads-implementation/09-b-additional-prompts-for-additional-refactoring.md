MarshalledCLITool - when I look at the execute method from this tool, I don't immediately see the four simple things it does.  I want this written in a way that allows me to read those four lines and I want only four lines that tell me the four things that execute does. I'd also like you to ask Perplexity whether this options pattern that I can see in this file is really a good one because for me the simplest class would be one where the constructor has three things passed in, they're then available and they get used in the execute and that's it. The whole thing looks a lot simpler and a lot smaller then. Please ask Perplexity and have a think about it, tell me what you think!





❯ Why does the first param take a function and the rest not?  Seems they should all be simple objects: 

export class DefaultRuntime implements Runtime {
  private readonly tool: Tool;

  constructor(options?: DefaultRuntimeOptions) {
    this.tool =
      options?.tool ??
      new MarshalledCLITool(
        () => new JsonFileIOMarshallerSession(),
        new PtyCLIWrapper(),
        new ClaudeCommandBuilder()
      );
  }



I'm thinking that CLICommandBuilder should be MarshalledIOCLICommandBuilder as it only builds CLICommands for a Tool that needs Marshalled IO, like MarshalledCLITool. Please plan refactoring to this naming and fixing the comments to make this clearer.  Also ClaudeCommandBuilder should be renamed ClaudeCLICommandBuilder.  


CLICommandBuilder builds a CLICommand but it's very confusing that it's passed a "command" which is not the CLICommand it's building, but actually the aiToolCommand that we want the aiTool to run.  So, to make this less confusing - I don't want to rename "command" to "aiToolCommand" across the whole system, but just in the CLICommandBuilder interface and in the concrete class: rename "command" variables to "aiToolCommand"

src/interfaces/cli-wrapper-options.ts - I really don't like these "Options" classes - please remove CLIWrapperOptions and any trace of usage - and replace with well named, direct parameters: "executable", "args", "currentWorkingDirectory" (not cwd) in all places
