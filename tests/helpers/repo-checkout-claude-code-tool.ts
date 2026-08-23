/**
 * RepoCheckoutClaudeCodeTool — a DefaultClaudeCodeTool wired for the repo
 * checkout the test process runs from: build-first mode, with the
 * ahq-package-root set to process.cwd() (vitest runs every test with the
 * repo root as the working directory).
 *
 * Shared by the integration/e2e tests that construct a real tool directly
 * against this repo, so the runtime-params wiring lives in one place
 * instead of being duplicated at every construction site.
 */

import { BuildMode } from '../../src/interfaces/build-mode.js';
import { CompositionRoot } from '../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../src/runtime-params/default-ahq-runtime-params.js';
import { DefaultClaudeCodeTool } from '../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

export class RepoCheckoutClaudeCodeTool extends DefaultClaudeCodeTool {
  constructor() {
    super(
      new CompositionRoot(
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(process.cwd()))
      )
    );
  }
}
