# Project Design Requirements

## About This Doc

This doc contains the design requirements for this Agentic HQ project.

It is used by all the agents in the Full Jira TDD Story Workflow to ensure the requirements are kept to when developing software in the Agentic HQ project.  See:

[02-jira-write-failing-test.md](../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/02-jira-write-failing-test.md)

and the other commands in that workflow.


## How Code Should Be Designed

Code in this project should be created in highly object oriented way, with each component having its own:

- class
- interface

To understand this please read around the existing code to see the patterns/design used so far.  Early in the project I spent many weeks refactoring tightly coupled, procedural code from 3 big files into about 12 different classes, each following the Single Responsibility Principle.  

Read the SRP header of multiple classes and interfaces to see how this is designed and documented.  A good example of this is the concrete class MarshalledCLITool in marshalled-cli-tool.ts which implements the simple Tool interface.

If we are talking about a “concept” in the spec for a feature (e.g. Plugin or WorkflowSearchResult) then we want an interface and a class for that concept.   

We use the convention that the interface gets the concept name (e.g. `WorkflowSearchResults`) and the concrete implementation appends `Impl` (e.g. `WorkflowSearchResultsImpl`).  This means that `WorkflowSearchResultsImpl` is our implementation of the `WorkflowSearchResults` interface, but anyone else can create their own `CustomWorkflowSearchResults` which does things a different way and easily replace our implementation with theirs.

As an example for:
https://agentic-hq.atlassian.net/browse/AHQ-103 - 

we want to do O-O design with the following concepts which have been mentioned in this spec:

- Workflow - a workflow that exists within a plugin and can be run
- Plugin - a Claude Plugin that contains one or more AHQ Workflows in subdirectories
- Skill - a Claude Skill that can be run by Claude, lives inside a Plugin, can contain the TypeScript code that is run by agentic-hq in order to execute a workflow and also contains the "skill" that returns the CLI command that runs this typescript workflow code.
- Workspace - A place where Plugins can live - either the current project workspace or the AHQ package.
- WorkflowListing - A listing of all the available workflows that a user can run, including instructions for running them and what each workflow does.
- ExampleCommand - an example command that tells the user how to run that workflow (as an example)
- ExampleParameters - the parameters that are added to "agentic-hq <workflowsShortName>" to create an ExampleCommand
- WorkflowVersion
- WorkflowDescription
- WorkflowAuthor
- WorkflowShortName

We want a class/interface pair for every concept used.  Even if it’s just a String we are moving about, we want:
- The String to immediately be encapsulated by a Class (e.g. WorkflowVersion) as soon as it’s parsed from a file.
- It stays as a WorkflowVersion object (via the interface) until it is written out to the user or to a file, using toString (which is at the edge of the system)
- Any interaction with or use of a WorkflowVersion inside the system happens **through its interface**

This will create a lot of classes/interfaces/objects - but hopefully create code that is very easy to understand (so long as you can understand the many, many concepts that are represented by the objects and the structure of the system).  It also should mean that any functionality linked to an object should (where possible) be pushed into that object so instead of:

String version = workflowVersion.getValue();
String newVersion = doSomethingTo(version);
workflowVersion.set(newVersion)

we want to be **lazy users of the class** and just **push the work into the object** by saying:

workflowVersion.doSomethingToVersion()

This is the “tell, don’t ask” method of coding.

So while developing this feature, think always:

"If someone wants to replace (switch out) just one small aspect of the feature I've developed with their own concrete class to change the behaviour - could they do it easily?"

If the answer is "No, because that small aspect is mixed up with other things inside a function somewhere" - then we've failed to extract that thing as a "concept" into a class/interface.  This means we need to rethink and extract it.


Question: Is this overkill and does it make the system **harder** to understand and change?
Answer: There are valid arguments that if you spread out a system *entirely* into object/interfaces you are making the code harder to understand and change because to understand one thing you may have to read 12 files, rather than one or two procedural methods.  This is a valid concern.  If you do anything in design that is **extreme** you cause problems.  If you push this idea to its extreme then everywhere you look you will only see "bits" that interact and nothing seems to do anything.  The functionality has moved from procedures into the *structure* of the objects and how they interact.  So, we want to achieve some kind of balance where we may clump together functionality so it's easier to read/understand, at the expense of the fact that something in the middle of that method **won't** be easily replaceable.  This has to be based on an assessment and judgement of how likely someone is going to want to extract and replace that little bit of functionality. This is where design "taste" and "judgement" are valuable. As has been known for 50 years in software design (see Fred Brooks - https://www.cs.unc.edu/techreports/86-020.pdf) there is "no silver bullet" for software design/systems.  In summary - we are **leaning** more towards providing future developers the classes they can override/replace for a lot of our system, but we aren't going to fracture our system to the extreme to achieve this at the expense of readability and elegance.  NOTE: We are **still** going to have a class for **every** "thing" in our system and not pass around primitive (ints, strings etc) - but we may choose *not* to push some functionality into that class if it's more readable to keep it in a bigger function...

I want a complete audit done at the end of this plan and of the implementation of what parts people could switch out to change behaviour (or fix a bit with a class, without having to get it merged into the main branch).

## Important Requirement About State

Often programmers (and LLMs) write software that likes to build up, maintain and manipulate state - which is stored/cached in object fields.

A lot of the time though these fields and this temporary state is not required and:
- it makes the system unnecessarily complex
- it allows subtle bugs to be introduced where cached state changes, but doesn't update in all the right places.

As an example think of a WorkflowList object that we want to display a list of workflows to a user.

The first way of doing this is:

WorkflowList list = new WorkflowList();
list.searchForWorkflows();
list.displayToUser()

and inside WorkflowList we have a:

List list = new List();

and the searchForWorkflows method does:

list = doSearchForWorkflow()

and displayToUser() method does:

for(entry : list){
    console.print("Entry: " + entry.toString());
}

In this example we have used fields/variables **twice** to temporarily cache/store values:
- The list field is used to temporarily store the list from the search until it is used to print
- The entry variable is used to temporarily store the entry until it is printed

AI (and developers) love to write code this way.  We can see what's happening and it all seems obvious.  But it can be simpler if we just *push* what we want done (if we are "lazy" in a good way) to the things that can do it for us.

At the top level this means instead of:

WorkflowList list = new WorkflowList();
list.searchForWorkflows();
list.displayToUser()

we just say:

WorkflowSearchResult workflowSearchResult = new WorkflowSearchResult();
workflowSearchResult.displayToUser()

Here we have *pushed* the responsibility for doing the search into the WorkflowSearchResult

Next question: How can we make WorkflowSearchResult "lazy" (in a good way) as well?

Answer: We make WorkflowSearchResult just an aggregator of two workspace workflow search results, with fields:  

WorkspaceWorkflowSearchResult ahqWorkspaceWorkflowSearchResult
WorkspaceWorkflowSearchResult currentWorkspaceWorkflowSearchResult

In the constructor of WorkflowSearchResult we know we want to search two sets of workspaces so we initialise them:

ahqWorkspaceWorkflowSearchResult = new AHQWorkspaceWorkflowSearchResult();
currentWorkspaceWorkflowSearchResult = new CurrentWorkspaceWorkflowSearchResult();

then in displayToUser() we "push"/delegate the work of displaying the results to the individual workspace result objects:

console.output("Workflows Available:");
ahqWorkspaceWorkflowSearchResult.display()
currentWorkspaceWorkflowSearchResult.display()


What we have done here:
- We have avoided storing/caching state that we then have to interact with or change (e.g. the list object containing the list of workflows)
- Instead the only thing we are storing in our new WorkflowSearchResult class is just other objects that get **told** to do stuff.  Notice that our WorkflowSearchResult doesn't obtain any state from these objects. It delegates (lazily) the work to them, and just prints out a little header before it does that.

When we do this with all our code it becomes massively simpler.  It becomes a network of cooperating / delegating objects where very little state is passed around or manipulated.  State is maintained and manipulated in very isolated and well understood and well controlled little areas and the main logic is carried out by different objects asking each other to do higher level things like "displayYourself()".  In this example above:

currentWorkspaceWorkflowSearchResult.display()

is likely to involve the currentWorkspaceWorkflowSearchResult delegating the search of the workspace to an object it contains (e.g. a WorkspaceSearchResult object that knows its workspace root is "/tmp/steve-temp-workspace") and that WorkspaceSearchResult object does the search on the file system for the plugins and workflows.


## Concept Table: Mapping Concepts To Interfaces And Classes

When designing or changing classes/interfaces, create a **Concept Table** that maps each real-world concept to its interface and implementation class. This table should be created early in design and kept up to date as the design evolves.

The "Concept" column should describe the thing in plain English (not code). The interface and impl class names should follow from the concept name naturally.

Example from AHQ-106 (dynamic workflow discovery):

| Concept | Interface | Impl Class | Purpose |
|---------|-----------|------------|---------|
| A workspace containing plugins | `Workspace` | (two concrete impls below) | Common contract — has `getWorkflowListingString()`, contains Plugins |
| The AHQ package | `Workspace` | `AhqPackageImpl` | Root injected via `--ahq-package-root` |
| The user's current workspace | `Workspace` | `CurrentUserWorkspaceImpl` | Root from `process.cwd()`. When same dir as AHQ, returns "same as" message |
| A plugin containing workflows | `Plugin` | `PluginImpl` | Discovers workflows within a plugin, formats per-plugin listing section |
| A plugin's directory path | `PluginDirectory` | `PluginDirectoryImpl` | Delegates to workspace for root, computes path dynamically |
| Top-level search results | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` (modify existing) | Contains two Workspaces, provides listing + all workflows |

This table serves as a quick reference for anyone reading or modifying the code, and ensures every concept has been deliberately mapped to a class/interface pair.

## Creating A Data Dictionary Table And Corresponding English Language Description During Design/Plan Phase

When doing planning, in order to be sure we are mapping all concepts to a class/interface two additional sections must be created:
- A "Data Dictionary" section containing a table of all the concepts we are working with and their planned Class and Interface names.
- An "English Language Description Using Concepts" section - which describes in a paragraph how the system will work with the class or interface names slotted in so they read like English.   The class/interface names should be **bolded** to stand out in markdown format.  Verbs that represent actual method calls / messages between objects must be highlighted as *italic* e.g. *getWorkflowListingString*.  Plain narrative verbs that describe internal behaviour or flow (e.g. "creates", "checks", "delegates to") should NOT be in italics — only verbs that correspond to real method names on the public interface of a class.  The ELD should walk through the system's main scenarios step by step (e.g. listing, execution) showing start-to-finish mechanics.  If this paragraph doesn't read fluently and easily as English, then this is a sign the design doesn't reflect well how the system works.  Example sentence: "The **WorkflowSearchResults** asks each **Workspace** to *getWorkflowListingString*. The **AhqPackageImpl** creates a **WorkspaceImpl** with the injected package root and delegates to it."  ANTI-PATTERN: "*delegatesToAWorkspaceImpl*" — this is NOT a method name, it's narrative description of what happens internally. It should be plain text: "delegates to a WorkspaceImpl". Only use italics for things that will be actual method calls like *getWorkflowListingString*, *registerWorkflowsWith*, *findWorkflowFiles* etc.  PHRASING: Use "asks X to *doThing*" not "asks X for its *doThing*" — the former reads as natural English ("asks the **Workspace** to *getWorkflowListingString*") while the latter sounds like you're asking for a property rather than sending a message.

## Important Caveat

Designing a well structured and well balanced set of classes and interfaces to make an object oriented system that is easy to understand and easy to change is **hard work** and you won't get it right first time.  You have to try, see where it looks bad, looks complicated, could be simplified, could be consolidated, and **iterate** until you have something that is **good enough** (NOT perfect, as that will use up far too much time and energy).  It's all about balance and assessing risk/reward for work done.

## STEVE TO DO LATER — Design Rules Captured In Memory, Not Yet Folded Into This Doc

During planning sessions Claude has been recording design tips/preferences as feedback memory files under `~/.claude/projects/-Users-stevepersonal-dev-agentic-hq-agentic-hq/memory/`. These need to be folded into the relevant sections above; until then they live as standalone memory files. Each entry below has enough description that — if the memory file were lost — the rule could be reconstructed from this doc plus the code:

- **Unit test file per class** (`feedback_unit_test_file_per_class.md`) — one `.unit.test.ts` file per source class; never bundle tests for several classes into one file. Mirror the source folder layout under `tests/unit/` (e.g. `src/workflow-discovery/plugin/plugin-impl.ts` → `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`).

- **Directory structure by entity** (`feedback_directory_structure_by_entity.md`) — group source folders by **concept/entity** (`plugin/`, `workspace/`, `workflow/`), never by code-type (`value-objects/`, `domain/`, `services/`). Each concept folder holds its interface, impl(s) and helpers together, so one folder = one thing to understand.

- **Constructor injection + delegation** (`feedback_constructor_injection_delegation.md`) — take dependencies as `private readonly` fields in the constructor; methods then delegate to those fields plus their own params. Keeps method signatures small, makes collaborators explicit at construction time, and lets tests swap deps in via the constructor (rather than passing the same dep through every method).

- **No "-er" suffix classes** (`feedback_no_er_suffix_classes.md`) — class names ending in "-er" (Parser, Discoverer, Manager, Helper, Handler) usually mean behaviour has been pulled out of the entity that owns the data — a "tell, don't ask" violation. Push the method back onto the entity itself; the codebase deliberately has zero of these classes (Builder is OK only when it's a real Builder pattern, not a generic dumping ground).

- **Temp dirs need UID** (`feedback_temp_dirs_need_uid.md`) — test and runtime temp dirs must include a UUID, not just a timestamp; vitest parallelism and same-second workflow steps **will** collide on a timestamp-only path eventually. Use `<timestamp>_<uuid>` — see `JsonFileIOMarshallerSession` building `io-files-<timestamp>_<uuid>` via `crypto.randomUUID()` (`src/io/marshalling/json-file-io-marshaller-session.ts:39`).

- **Avoid cached state** (`feedback_avoid_cached_state.md`) — store only the minimal source data in fields; **derive** computed values dynamically on each method call rather than caching them. Cached fields drift out of sync with their source over time, causing subtle bugs; recomputation is almost always cheap enough to be the safer default. (Closely related to the "Important Requirement About State" section above.)

- **Collection names: plural, not "List"** (`feedback_collection_names_plural_not_list.md`) — name collection types with the plural noun (`Workflows`, `Plugins`) rather than baking in a data structure (`WorkflowList`, `PluginArray`, `WorkflowSet`). The interface describes *what* it is, not *how* it's stored, so the impl can change without renaming the type.

- **Do not delete comments when changing code** (`feedback_do_not_delete_comments.md`) — never delete existing comments as a side-effect of an edit; REFACTOR notes, TODOs, design-intent blocks and SRP docstrings often capture concerns the surrounding code itself can't express. Only remove a comment when *every* sentence in it is now false; if part of a multi-concern comment is resolved, keep the still-valid parts, and move comments with the code when files split.

- **Tests assert behaviour, not implementation details** (`feedback_no_instanceof_in_tests.md`) — in unit tests, never use `instanceof`, prototype-identity comparisons (`X.prototype.method === Y.prototype.method`), `constructor.name`, or `(x as any).privateField`; those couple tests to *what an object is* rather than *what it does*, so behaviour-preserving refactors break them for no real reason. Drive assertions through observable effects: call public methods, spy on injected dependencies, and check side-effects.

TODO: incorporate each of these into the relevant section above (or add new sections), and then either delete this list or leave it as a short index pointing at the in-doc home of each rule.

> **Note (2026-05-07):** The first 7 memory files in the list above were lost during a laptop move and have been **reconstructed** from the one-line summaries plus concrete code anchors — they capture the gist, not the original wording. The last 2 (`feedback_do_not_delete_comments.md` and `feedback_no_instanceof_in_tests.md`) survived and are originals. Please review the reconstructed ones and adjust if any text doesn't match what you intended.