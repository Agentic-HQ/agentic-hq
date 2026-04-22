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
 *   AHQ-117 converted the `new WorkflowSearchResultsImpl()` construction
 *   below (and 5 other `new SomeImpl()` calls elsewhere in the codebase)
 *   to `rootServiceRegistry.loadClass(...)` calls — the Classwitch swap
 *   point. Override projects' registries replace these defaults at
 *   side-effect-import time.
 *
 *   AHQ-117 Add-On §9 also centralises `AGENTIC_HQ_WORKSPACE_ROOT`
 *   resolution inside `run()` below. A is the Root Classwitch Project and
 *   the authoritative workflow source (alongside the user's cwd); override
 *   projects override *code*, not workflow sources, and therefore must
 *   NOT set this env var themselves. Resolving it here — from this file's
 *   own `import.meta.url` — means override projects' `bin/*.cjs` wrappers
 *   never touch it and cannot get it wrong.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-124,
 *      https://agentic-hq.atlassian.net/browse/AHQ-117
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rootServiceRegistry } from '../classwitch-registry/root-registry.js';
import { CompositionRoot } from '../kernel/composition-root.js';
import { AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR } from '../workflow-discovery/workspace/ahq-workspace-impl.js';

import { createProgram } from './agentic-hq-program.js';

export const app = {
  run(): void {
    // NOTE RE REFACTOR: In the future would be good to work out what this AGENTIC_HQ_WORKSPACE_ROOT env
    // variable does and how it controls the system. May be better to have it as an explicit
    // Typescript parameter that is set on the boundaries of the system and passed inward, instead of
    // this "env" variable which is like a global, hidden variable which is harder to test, track,
    // understand and control.
    // (The separate concern this note used to carry — about Classwitch Override Projects colliding on
    // workspace-root meaning — is resolved by AHQ-117 Add-On §9: `app.run()` resolves A's own location
    // from `import.meta.url`, so override projects don't set the env var at all.)
    if (!process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR]) {
      const thisFileDir = path.dirname(fileURLToPath(import.meta.url));
      process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR] = path.resolve(thisFileDir, '..', '..');
    }

    const root = new CompositionRoot();
    const builder = root.getWorkflowCommandBuilder();
    const WorkflowSearchResultsClass = rootServiceRegistry.loadClass('WorkflowSearchResultsImpl');
    createProgram(builder, new WorkflowSearchResultsClass()).parse();
  },
};
