import type { AhqWorkflow } from '../../../../src/workflow-discovery/interfaces/ahq-workflow.js';
import type { WorkflowRegistry } from '../../../../src/workflow-discovery/interfaces/workflow-registry.js';

export class StubWorkflowRegistry implements WorkflowRegistry {
  readonly registered: AhqWorkflow[] = [];
  register(workflow: AhqWorkflow): void {
    this.registered.push(workflow);
  }
}
