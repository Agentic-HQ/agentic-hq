import type { WorkflowMetadata } from '../../../../src/workflow-discovery/interfaces/workflow-metadata.js';

export function stubWorkflowMetadata(values: Record<string, string>): WorkflowMetadata {
  return {
    get: (fieldId: string): string => {
      if (!(fieldId in values)) {
        throw new Error(`Missing required field: ${fieldId}`);
      }
      return values[fieldId];
    },
  };
}
