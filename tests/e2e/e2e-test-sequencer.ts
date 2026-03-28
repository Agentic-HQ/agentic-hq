import { BaseSequencer } from 'vitest/node';
import type { TestSpecification } from 'vitest/node';

/**
 * Custom sequencer that runs the quick-jira-workflow e2e test last.
 *
 * That test has a 25-minute timeout and is the most likely to hang
 * (Claude waiting for MCP tool permissions). Running it last means the
 * three faster tests complete first, so we get useful results even if
 * the long one hangs or gets killed.
 */
export default class E2eTestSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    const sorted = await super.sort(files);

    const isJiraWorkflow = (spec: TestSpecification) =>
      spec.moduleId.includes('quick-jira-workflow');

    const regular = sorted.filter((f) => !isJiraWorkflow(f));
    const jira = sorted.filter((f) => isJiraWorkflow(f));

    return [...regular, ...jira];
  }
}
