= Project Design Requirements

== About This Doc

This doc contains the design requirement for this project.

== How Code Should Be Designed

Code in this project should be created in highly object oriented way, with each component having it’s own:

- class
- interface

To understand this please read around the existing code to see the patterns/design used so far.  Early in the project I spent many weeks refactoring tightly coupled, procedural code from 3 big files into about 12 different classes, each following the Single Responsibility Principle.  

Read the SRP header of multiple classes and interfaces to see how this is designed and documented.  A good example of this is the concrete class MarshalledCliTool in marshalled-cli-tool.ts which implements the simple Tool interface.

If we are talking about a “concept” in the spec for a feature (e.g. Plugin or WorkflowSearchResult) then we want an interface and a class for that concept.   

Currently we are using the convention that if an interface has only one “default” implementation we call the interface the concept name e.g. WorkflowSearchResult and the default concrete implementation DefaultWorkflowSearchResult.  This means that this DefaultWorkflowSearchResult is our "default" implementation of the WorkflowSearchResult, but anyone else can create their own CustomWorkflowSearchResult which does things a different way and easily replace our default with their custom implementation.

As an example for:
https://agentic-hq.atlassian.net/browse/AHQ-103 - 

we to do O-O design with the following concepts which have been mentioned in this spec:

- Workflow - a workflow that exists within a plugin and can be run
- Plugin - a Claude Plugin that contains one or more AHQ Workflows in subdirectories
- Skill - a Claude Skill that can be run by Claude, lives inside a Plugin, can contains the typescript code that is run by agentic-hq in order to execute a workflow and also contains the "skill" that returns the CLI command that runs this typescript workflow code.
- Workspace - A place where Plugins can live - either the current project workspace or the AHQ workspace.
- WorkflowListing - A listing of all the available workflows that a user can run, including instructions for running them and what each workflow does.
- ExampleCommand - an example command that tell the user how to run that workflow (as an example)
- ExampleParameters - the parameters that are added to "agentic-hq <workflowsShortName>" to create an ExampleCommand
- WorkflowVersion
- WorkflowDescription
- WorkflowAuthor
- WorkflowShortName

We want a class/interface pair for every concept used.  Even if it’s just a String we are moving about, we want:
- The String to immediately be encapsulated by a Class (e.g. WorkflowVersion) as soon as it’s parsed from a file.
- It stays as a WorkflowVersion object (via the interface) until it is written out to the user or to a file, using toString (which is at the edge of the system)
- Any interaction with or use of a WorkflowVersion inside the system happens **through it’s interface**

This will create a lot of classes/interfaces/objects - but hopefully create code that is very easy to understand (so long as you can understand the many, many concepts that are represented by the objects and the structure of the system).  It also should mean that any functionality linked to an object should (where possible) be pushed into that object so instead of:

String version = workflowVersion.getValue();
String newVersion = doSomethingTo(version);
workflowVersion.set(newVersion)

we want to be **lazy users of the class** and just **push the work into the object** by saying:

workflowVersion.doSomethingToVersion()

This is the “tell, don’t ask” method of coding.

Part of the reason for making everything we talk about or do in AHQ into a class/interface is that we are soon going to be using the framework I’ve also written:

classwitch

to make every concrete class “switchable” by a third-party developer, so they can replace it with their own implementation quickly and easily and publish their version of AHQ without having to change the original project.  It’s similar to plugins, but different…

So while developing this feature, think always:

"If someone want to replace (switch out) just one small aspect of the feature I've deveoped with their own concrete class to change the behaviour - could they do it easily?"

If the answer is "No, because that small aspect is mixed up with other things inside a function somewhere" - then we've failed to extract that things as a "concept" into a class/inteface.  This means we need to rethink and extract it.


Question: Is this overkill and does it make the system **harder** to understand and change?
Answer: There are valid arguments that if you spread out a system *entirely* into object/interfaces you are making the code harder to understand and change because to understand one thing you may have to read 12 files, rather than one or two procedural methods.  This is a valid concern.  If you do anything in design that is **extreme** you cause problems.  If you push this idea to it's extreme then everywhere you look you will only see "bits" that interact and nothing seems to do anything.  The functionality has moved from procedures into the *structure* of the objects and how they interact.  So, we want to achieve some kind of balance where we may clump together functionality so it's easier to read/understand, at the expense of the fact that something in the middle of that method **won't** be easily replaceable.  This has to be based on an assessement and judgement of how likely someone is going to want to extract and replace that little bit of functionality. This is where design "taste" and "judgement" are valuable. As has been known for 50 years in software design (see Fred Brooks - https://www.cs.unc.edu/techreports/86-020.pdf) there is "no silver bullet" for software design/systems.  In summary - we are **leaning** more towards providing future developers the classes they can override/replace for a lot of our system, but we aren't going to fracture our system to the extreme to achieve this at the expense of readability and elegance.  NOTE: We are **still** going to have a class for **every** "thing" in our system and not pass around primitive (ints, strings etc) - but we may choose *not* to push some functionality into that class if it's more readable to keep it in a bigger function...

I want a complete audit done at the end of this plan and of the implementation of what parts people could switch out to change behaviour (or fix a bit with a class, without having to get it merged into the main branch).

== Important Requirement About State

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
- The list fields is used to temporarily store the list from the search until it used to print
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

Answer: We make WorkflowSearchResult just an agreggator of of two workspace workflow search results, with fields:  

WorkspaceWorkflowSearchResult ahqWorkspaceWorkflowSearchResult
WorkspaceWorkflowSearchResult currentWorkspaceWorkflowSearchResult

In the constructor of WorkflowSearchResult we know we want to search two sets of workspaces so we initialise them:

ahqWorkspaceWorkflowSearchResult = new AHQWorkspaceWorkflowSearchResult();
currentWorkspaceWorkflowSearchResult = new CurrentWorkspaceWorkflowSearchResult();

then in displaySearchResults we "push"/delagate the work of displaying to the results to the individual workspaces result objects:

console.output("Workflows Available:");
ahqWorkspaceWorkflowSearchResult.display()
currentWorkspaceWorkflowSearchResult.display()


What we have done here:
- We have avoided storing/caching state that we then have to interact with or change (e.g. the list object containing the list of workflows)
- Instead the only thing we are storing in our new WorkflowSearchResult class is just other objects that get **told** to do stuff.  Notice that our WorkflowSearchResult doesn't obtain any state from these objects. It delagates (lazily) the work to them, and just prints out a little header before it does that.

When we do this with all our code it becomes massively simpler.  It becomes a network of cooperating / delagating objects where very little state is passed around or manipulated.  State is maintained and manipulated in very isolated and well understood and well controlled little areas and the main logic is carried out by different objects asking each other to do higher level things like "displayYourself()".  In this example above:

currentWorkspaceWorkflowSearchResult.display()

is likely to involve the currentWorkspaceWorkflowSearchResult delegating the search of the workspace to an object it contains (e.g. a WorkspaceSearchResult object that knows it's workspace root is "/tmp/steve-temp-workspace") and that WorkspaceSearchResult object does the search on the file system for the plugins and workflows.


== Creating A Data Dictionary Table And Corresponding English Language Description During Design/Plan Phase

When doing planning, in order to be sure we are mapping all concepts to a class/interface two additional sections must be created:
- A "Data Dictionary" section containing a table of all the concepts we are working with and their planned Class and Interface names.
- An "English Language Description Using Concepts" section - which describes in a paragraph how the system will work with the class or interface names slotted in so they read like English.   The class/interface names should be **bolded** to stand out in markdown format.  Verbs that could represent messages between classes must be highlighted as *italic* and these would be messages between object/interfaces e.g. *displays*   If this paragraph doesn't read fluently and easily as English, then this is a sign the design doesn't reflect well how the system works.  Example sentence: "The **WorkflowSearchResult** *displaysSearchResults* to the user by *printingAHeader* and then asking it's **WorkspaceWorkflowSearchResults** to *display* themselves." (NOTE here: *printingAHeader* would correspond to an internal method printHeader() which just does "console.output("Workflows Available:");" )

== Important Caveat

Designing a well structured and well balanced set of classes and interfaces to make an object oriented system that is easy to understand and easy to change is **hard work** and you won't get it right first time.  You have to try, see where it looks bad, looks complicated, could be simplified, could be consolidated, and **iterate** until you have something that is **good enough** (NOT perfect, as that will use up far to much time and energy).  It's all about balance and assessing risk/reward for work done.