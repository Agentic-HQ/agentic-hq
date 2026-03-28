# AHQ-89: Create DRAFT Commands

## Fields

- **Summary:** Create DRAFT Commands
- **Status:** Backlog (Category: To Do)
- **Type:** Sub-task
- **Priority:** Medium
- **Parent:** [AHQ-88](https://agentic-hq.atlassian.net/browse/AHQ-88) - New "Refactor To Single Responsibility Principle Workflow" Demo (Story, Backlog)
- **Reporter:** Steve Halso
- **Assignee:** Unassigned
- **Created:** 2026-03-16T21:43:50.523+0000
- **Updated:** 2026-03-16T22:02:54.786+0000

## Description

Subtask of [AHQ-88](https://agentic-hq.atlassian.net/browse/AHQ-88)  (be sure to read that first, in full)

Task:

Create commands at:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/refactor-to-srp-workflow

like:

- 01-DRAFT-research-codebase-looking-for-candidate-classes-and-interfaces-to-refactor.md
- 02-DRAFT-discuss-with-human-to-decide-on-one-and-linked-objects.md
- 03-DRAFT-create-and-discuss-plan-to-refactor.md
- 04-DRAFT-document-refactoring-that-was-performed.md

Please read:

[AHQ-83](https://agentic-hq.atlassian.net/browse/AHQ-83)

and the relevant dos that were ONLY about additional refactoring work (i.e. not docs 01 and 02) from:

- docs/jira-docs/AHQ-83/beads-implementation/03-steve-suggestion-for-further-refactoring-of-ClaudeCodeTool.md
- up to:
- docs/jira-docs/AHQ-83/beads-implementation/08-document-detailing-what-was-done-in-additional-refactoring.md

and detail what things were great about that work that we can include in our workflow here.

I want to distil the magic and the process of that work into this generic workflow, so I can run it (manually at first - but later maybe as a properly AHQ workflow) to do further refactoring of this code base.

Things I loved and want to keep:

- The discussion initially centred around a single class ClaudeCodeTool that did lots of things and had it's fingers in multiple "pies".  We started fairly simple, but ended up creating whole new abstractions like `IOMarshallerSession`, `CLICommandBuilder` and `CLICommand`
- The discussion was very iterative.  We made it better, then I realised other things that could make it even better. It took about 5 rounds of back and forth until the 04 doc was in good shape.
- Documenting SRP in fields at the top of every class/interface that gets changed, like this at:
- src/interfaces/json-file-io-marshaller-session.ts
- has:
- ```
/**
 * JsonFileIOMarshallerSession — A marshalling session that stores
 * command I/O as JSON files in a temp directory.
 *
 * SRP Does: For one execution session, generate a GUID, create a temp
 * directory, write command-input.json, read command-output.json.
 *
 * SRP Knows About: File-system I/O, JSON serialization, temp directory
 * layout, the command-input/output file naming convention.
 *
 * SRP Knows Nothing About: What tool produces the output, how the CLI
 * process is spawned, or where the user's project lives.
 */
```
  - So it says the name of the interface/class - a quick description, then is saying what it **does**, what is **knows** and what it **doesn't know** (important, to make clear the things it should not be messing around with, or knowing about).  This is about **cohesion** - the things it knows about are all related.

## Comments

0 total (none)
