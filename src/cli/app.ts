/**
 * `app` — the bootstrap object for the agentic-hq CLI.
 *
 * Exposed as `const app = { run() {...} }` rather than inlined into `main.ts`
 * so tests can import and exercise `app.run()` without going through the
 * binary entry point. The plain-const shape (no `App` interface, no `AppImpl`
 * class) is deliberate: an interface/class layer would add ceremony with no
 * functional benefit at this layer.
 */

import { CompositionRoot } from '../kernel/composition-root.js';
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';

import { createProgram } from './agentic-hq-program.js';

export const app = {
  run(): void {
    const root = new CompositionRoot();
    const builder = root.getWorkflowCommandBuilder();
    createProgram(builder, new WorkflowSearchResultsImpl()).parse();
  },
};
