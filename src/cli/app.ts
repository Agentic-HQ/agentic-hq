/**
 * `app` — the bootstrap object for the agentic-hq CLI.
 *
 * Why this is a separate file, and why the shape is `const app = { run() {...} }`:
 *
 *   This repo is a Classwitch **Root Project**. Exposing the bootstrap as a
 *   standalone `app` const — rather than inlining it into the entry point
 *   (`main.ts`) — is the pattern that makes Classwitch **Override Projects**
 *   trivially cheap. An override repo's `main.ts` just side-effect-imports
 *   its override registry and then calls `app.run()`:
 *
 *     import './classwitch-registry/my-override-registry.js';
 *     import { app } from 'agentic-hq/cli';
 *     app.run();
 *
 *   The override repo doesn't need to re-implement wiring, re-import
 *   `CompositionRoot`, or duplicate any bootstrap code. Whatever is registered
 *   in its override registry at side-effect-import time will be picked up by
 *   the same `app.run()` call that the root project uses.
 *
 *   The shape mirrors `classwitch/src/demo/root-demo-repo/app/app.ts`
 *   deliberately: a plain `const` with a `run` method — **not** an `App`
 *   interface with an `AppImpl` class. An interface/class layer would dilute
 *   the teaching signal and add ceremony with no functional benefit
 *   (see AHQ-124 discussion).
 *
 *   AHQ-117 will later convert the `new WorkflowSearchResultsImpl()`
 *   construction below (and 5 other `new SomeImpl()` calls elsewhere in the
 *   codebase) to `rootServiceRegistry.loadClass(...)` calls — the classwitch
 *   swap point. That content change does not affect this file's *shape*, so
 *   override repos that already target `app.run()` will keep working
 *   unchanged when AHQ-117 lands.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-124
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
