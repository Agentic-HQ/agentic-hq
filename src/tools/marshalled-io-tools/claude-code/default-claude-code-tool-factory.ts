/**
 * DefaultClaudeCodeToolFactory — mints a DefaultClaudeCodeTool per workflow
 * launch (AHQ-208).
 *
 * SRP Does: Hold the one runtime param that never varies per workflow — the
 * AhqPackageRoot — and, on createTool(buildMode), assemble a fresh
 * DefaultClaudeCodeTool over a CompositionRoot whose AhqRuntimeParams carry
 * THAT workflow's mode, so the Claude launch relays the per-workflow mode
 * across the skill hop.
 *
 * SRP Knows About: The DefaultAhqRuntimeParams/CompositionRoot/
 * DefaultClaudeCodeTool assembly order.
 *
 * SRP Knows Nothing About: How the tool executes, how the mode is decided
 * (the workspace the workflow was discovered under does that), or what the
 * runner does with the relayed mode.
 */
import type { AhqPackageRoot } from '../../../interfaces/ahq-package-root.js';
import type { BuildMode } from '../../../interfaces/build-mode.js';
import type { ToolFactory } from '../../../interfaces/tool-factory.js';
import type { Tool } from '../../../interfaces/tool.js';
import { CompositionRoot } from '../../../kernel/composition-root.js';
import { DefaultAhqRuntimeParams } from '../../../runtime-params/default-ahq-runtime-params.js';

import { DefaultClaudeCodeTool } from './default-claude-code-tool.js';

export class DefaultClaudeCodeToolFactory implements ToolFactory {
  constructor(private readonly ahqPackageRoot: AhqPackageRoot) {}

  createTool(buildMode: BuildMode): Tool {
    return new DefaultClaudeCodeTool(
      new CompositionRoot(new DefaultAhqRuntimeParams(buildMode, this.ahqPackageRoot))
    );
  }
}
