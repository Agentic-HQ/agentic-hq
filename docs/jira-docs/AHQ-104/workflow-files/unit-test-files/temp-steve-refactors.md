


      32   getDescription(): WorkflowDescription {
      33     return new WorkflowDescriptionImpl(this.jsonFile.get(DESCRIPTION_JSON_FIELD_ID));
      34   }


->

      32   getDescription(): WorkflowDescription {
      33     return WorkflowDescriptionImpl.createFrom(this.jsonFile);
      34   }

and then WorkflowDescriptionImpl knows how to init itself using:
this.jsonFile.get(DESCRIPTION_JSON_FIELD_ID)

same for all other workflow classes, including: 

  getExampleCommand(): ExampleCommand {
    return new ExampleCommandImpl(
      new WorkflowShortNameImpl(this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)),
      new ExampleParametersImpl(this.jsonFile.get(EXAMPLE_PARAMETERS_JSON_FIELD_ID))
    );
  }

which shoudl be:

return ExampleCommandImpl.createFrom(this.jsonFile);

and ExampleCommandImpl knows it needs to construct itself using:
WorkflowShortNameImpl.createFrom(jsonFile) etc etc.




if AhqFile:

  getPath(): string;

is only used by tests, it shoudl be ditched.



AhqWorkflow:

displayYourself

returns a string, rather than printing itself to the console.

This is OK, but name should be changed to getWorkflowListingEntryString

Same for AhqWorkflow.displayYourselves() -> getWorkflowListingEntriesString()


Is this only used by tests? If so ditch:

export interface AhqWorkspace {
  getRoot(): string;



Also update:

  .agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md

  with new requirement to audit all methods on interfaces/classes that have been created and list which class.method it is used in production code (not just test). If only test code uses it - mark for deletion during refactoring.  This should be done after the audit of constants and the table included in the final doc.





  AhqWorkspaceImpl

  should delegate finding file based on pattern to a new

  AhqDirectory interface with AhqDirectoryImpl class that provides

  findMatchingFilesUsingPattern(pattern: string)

  Need new test that tests this separate class.  Should be in same directory as AhqFile




In:

tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts

we have:

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-ws-'));

Is there a test library that will automatically delete the temp directory when the test has finished without having to run a (potentially dangerous) rm recursive command?



Please check the pre-existing interfaces and classes for the SRP TSdoc header format - and update the refactor plan to do that on each of the interfaces/classes we have written in this work.