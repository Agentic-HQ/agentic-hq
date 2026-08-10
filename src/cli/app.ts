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
import { DefaultAhqCommandLine } from '../runtime-params/default-ahq-command-line.js';
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';

import { createProgram } from './agentic-hq-program.js';

export const app = {
  run(argv: string[]): void {
    // The incoming command line consumes the required AHQ runtime options
    // (inserted by the bin wrappers) BEFORE Commander parses the remaining
    // argv (AHQ-197)
    const ahqCommandLine = new DefaultAhqCommandLine(argv);
    const root = new CompositionRoot(ahqCommandLine.getAhqRuntimeParams());
    const builder = root.getWorkflowCommandBuilder();
    createProgram(builder, new WorkflowSearchResultsImpl()).parse(
      ahqCommandLine.getRemainingArgs()
    );
  },
};
