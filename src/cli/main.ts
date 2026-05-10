/**
 * agentic-hq CLI entry point — 2-line main program.
 *
 * Bootstrap logic lives in `app.ts`. Keeping this file tiny means the entry
 * point holds nothing test-relevant, while `app.run()` stays a clean,
 * importable seam for tests and any future alternative entry points.
 */

import { app } from './app.js';

app.run();
