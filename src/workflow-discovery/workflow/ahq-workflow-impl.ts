import type { AhqFile } from '../interfaces/ahq-file.js';
import type { AhqWorkflow } from '../interfaces/ahq-workflow.js';
import type { ExampleCommand } from '../interfaces/example-command.js';
import type { WorkflowDescription } from '../interfaces/workflow-description.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';
import { JsonFileWorkflowMetadata } from '../workspace/json-file-workflow-metadata.js';

import { ExampleCommandImpl } from './example-command-impl.js';
import { WorkflowDescriptionImpl } from './workflow-description-impl.js';

const WHAT_IT_DOES_LINE_PREFIX = '\n   What it does: ';

/**
 * AhqWorkflowImpl — Concrete AhqWorkflow backed by a single workflow
 * metadata file; delegates to value-object `createFrom` factories.
 *
 * SRP Does: Assemble a single workflow's listing entry (example command
 * + description) by delegating to value-object createFroms over a
 * JsonFileWorkflowMetadata view of an AhqFile.
 *
 * SRP Knows About: The listing entry format (example + description
 * composition), the JsonFileWorkflowMetadata binding, and the
 * value-object createFrom factories.
 *
 * SRP Knows Nothing About: Where the AhqFile came from, the listing
 * header, or how multiple workflows combine into the full listing.
 */
export class AhqWorkflowImpl implements AhqWorkflow {
  private readonly metadata: WorkflowMetadata;
  constructor(file: AhqFile) {
    this.metadata = new JsonFileWorkflowMetadata(file);
  }
  /** Return the workflow's description (delegates to WorkflowDescriptionImpl.createFrom). */
  private getDescription(): WorkflowDescription {
    return WorkflowDescriptionImpl.createFrom(this.metadata);
  }
  /** Return the example invocation command (delegates to ExampleCommandImpl.createFrom). */
  private getExampleCommand(): ExampleCommand {
    return ExampleCommandImpl.createFrom(this.metadata);
  }
  /** Return the workflow's listing entry — two lines: example command + "What it does: {description}". */
  getWorkflowListingEntryString(): string {
    const example = this.getExampleCommand();
    const description = this.getDescription();
    return `${example}${WHAT_IT_DOES_LINE_PREFIX}${description}`;
  }
}
