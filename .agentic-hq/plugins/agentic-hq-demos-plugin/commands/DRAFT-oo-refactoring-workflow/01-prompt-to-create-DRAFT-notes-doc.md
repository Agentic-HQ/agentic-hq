On this branch that we're currently in, the whole project has been refactored to be object-oriented.

There have been multiple commits done and multiple files in this same directory that explain what the additional refactoring is.

I want a draft document created at:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/DRAFT-oo-refactoring-workflow/02-DRAFT-notes-about-refactorings-done.md

doc that documents:
- What the plugin will do (check the code produced matches the oo refactorings/patterns we have used before commit happens and refactors accordingly)
- The list of refactorings we did and why they are relevant and important to write a high quality OO system.
- A brief summary of the steps the workflow could go through (probably just a command for each check and discussion with human about each one?)

The list is the key here.  I want you to:

- Read through all the commits made to refactor/ahq-83-microkernal-plugin-architecture
- Read the refactorings done in docs/jira-docs/AHQ-83/beads-implementation.
- include in 02-DRAFT-notes-about-refactorings-done.md a section for each of the refactoring types we did including motivation, OO best practice, example of what got done.

The important ones I can remember include (but not limited to):
- Not putting all interfaces in one "interfaces" directory as that's bad practice (yet to be implemented/committed but Perplexity confirmed this as an anti-Pattern)
- Not using Options class for <= 3 parameters - just use the parameters and delete the Options interfaces/class.
- Not having a class do too many things (every class should adhere to SRP and have the strict header comment explaining the 3 things)
- Not having files with "utility functions" that get called from inside the code - these hide away and make creating unit tests hard.  *EVERYTHING* should be an explicit object that is injected.  Those objects should be created at the start of the system or at the "boundaries" so that it's easy to recreate and unit test *any* part of the system by looking at what objects get injected to it.  Zero side effects then.  Everything controllable and settable (and importantly **visible** to the reader of the code) explicitly.  Basically - if it's a not an object, a thing, then it shouldn't exist.  Refactor to get rid of it (like we did with directory-functions.ts in docs/jira-docs/AHQ-83/beads-implementation/09-c-additional-prompt-for-ditching-directory-function.FULL_PLAN.md)
- Making functions that are hard to understand / read much simpler and more readable. Rule: a human should be able to read every single function in 20 seconds and know what it does.  All complexity should be pushed into private methods.  It should ready like a story.  This was done in refactoring of MarshalledCLITool, where I said "when I look at the execute method from this tool, I don't immediately see the four simple things it does.  I want this written in a way that allows me to read those four lines and I want only four lines that tell me the four things that execute does."
- There are others, please add sections for them as well...

Thanks.

JIRA for doing Later this workflow: https://agentic-hq.atlassian.net/browse/AHQ-90
