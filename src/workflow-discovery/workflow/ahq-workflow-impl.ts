import type { BuildMode } from '../../interfaces/build-mode.js';
import type { AhqFile } from '../interfaces/ahq-file.js';
import type { AhqWorkflow } from '../interfaces/ahq-workflow.js';
import type { ExampleCommand } from '../interfaces/example-command.js';
import type { FullClaudeSkillCommand } from '../interfaces/full-claude-skill-command.js';
import type { WorkflowDescription } from '../interfaces/workflow-description.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';
import { JsonFileWorkflowMetadata } from '../workspace/json-file-workflow-metadata.js';

import { ExampleCommandImpl } from './example-command-impl.js';
import { FullClaudeSkillCommandImpl } from './full-claude-skill-command-impl.js';
import { WorkflowDescriptionImpl } from './workflow-description-impl.js';
import { WorkflowShortNameImpl } from './workflow-short-name-impl.js';

/**
 * AhqWorkflowImpl — Concrete AhqWorkflow backed by a single workflow
 * metadata file; delegates to value-object `createFrom` factories.
 *
 * SRP Does: Expose a single workflow's metadata (short name,
 * description, example command, full Claude skill command) by
 * delegating to value-object createFroms over a JsonFileWorkflowMetadata
 * view of an AhqFile.
 *
 * SRP Knows About: The JsonFileWorkflowMetadata binding and the
 * value-object createFrom factories.
 *
 * SRP Knows Nothing About: Where the AhqFile came from, the listing
 * format, or how multiple workflows combine into the full listing.
 */
export class AhqWorkflowImpl implements AhqWorkflow {
  private readonly metadata: WorkflowMetadata;

  constructor(
    file: AhqFile,
    private readonly buildMode: BuildMode
  ) {
    this.metadata = new JsonFileWorkflowMetadata(file);
  }
  /** Return the constructor-injected build mode (AHQ-208) — location is identity:
   *  the workspace this workflow was discovered under decided it. */
  getBuildMode(): BuildMode {
    return this.buildMode;
  }
  /** Return the workflow's description (delegates to WorkflowDescriptionImpl.createFrom). */
  getDescription(): WorkflowDescription {
    return WorkflowDescriptionImpl.createFrom(this.metadata);
  }
  /** Return the workflow's short name (delegates to WorkflowShortNameImpl.createFrom). */
  getShortName(): WorkflowShortName {
    return WorkflowShortNameImpl.createFrom(this.metadata);
  }
  /** Return the full /pluginId:skillId command (delegates to FullClaudeSkillCommandImpl.createFrom). */
  getFullClaudeSkillCommand(): FullClaudeSkillCommand {
    return FullClaudeSkillCommandImpl.createFrom(this.metadata);
  }
  /** Return the example invocation command (delegates to ExampleCommandImpl.createFrom). */
  getExampleCommand(): ExampleCommand {
    return ExampleCommandImpl.createFrom(this.metadata);
  }
}
