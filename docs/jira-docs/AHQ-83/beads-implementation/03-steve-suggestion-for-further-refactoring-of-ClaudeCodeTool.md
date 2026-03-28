I've been looking at the ClaudeCodeTool class and thinking about what would happen if I wanted to create a new codex tool class equivalent to this.

Codex would differ in that it would have different command line options, different plugin stuff, all that kind of stuff, but a lot of the code in this class would still remain, assuming that marshalling input and output were still the same for Codex.

So I think we need some new abstractions/interfaces, something like:
- MarshalledIOTool - manages the marshelling using IOMarshaller and the running of the CommandLineTool inside a CLIWrapper.  doesn't know what kind of CommandLineTool it's loading - just requests it from the Plugin provider or gets it passed in on it's constructor.

Any Questions / ideas / thoughts?  Please put them in:

04-claude-response.md

and after discussing that, we'll make a plan.