/**
 * agentic-hq CLI entry point — 2-line main program.
 *
 * Why the main → app split:
 *   This repo is a Classwitch **Root Project**. The entry point is deliberately
 *   tiny (just `import { app }; app.run();`) so that Classwitch **Override
 *   Projects** — for example the `agentic-hq-with-colours` repo planned in
 *   AHQ-120 — can write their own `main.ts` that side-effect-imports an
 *   override registry and then runs the same `app`, e.g.
 *
 *     import './classwitch-registry/my-override-registry.js';  // plugs in overrides
 *     import { app } from 'agentic-hq/cli';
 *     app.run();
 *
 *   All bootstrap logic lives in `app.ts`. This file holds nothing an override
 *   would want to replace, which is exactly the point.
 *
 *   This shape mirrors the classwitch demo at
 *   `classwitch/src/demo/root-demo-repo/app/main.ts` deliberately.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-124
 */

import { app } from './app.js';

app.run();
