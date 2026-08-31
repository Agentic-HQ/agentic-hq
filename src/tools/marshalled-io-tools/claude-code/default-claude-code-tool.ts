/**
 * DefaultClaudeCodeTool — MarshalledCLITool pre-wired for Claude Code.
 *
 * SRP Does: Supply the four Claude-specific wiring arguments to
 * MarshalledCLITool's constructor — the session factory, CLI wrapper,
 * ClaudeCommandBuilder, and current-user workspace — sourced from a
 * CompositionRoot.
 *
 * SRP Knows About: That Claude's CLI command is built by
 * ClaudeCommandBuilder (wired with the AHQ package + current-user
 * workspace), and that the rest of the pipeline (session, CLI wrapper,
 * working directory) is shared generic infrastructure drawn from
 * CompositionRoot.
 *
 * SRP Knows Nothing About: How MarshalledCLITool orchestrates the
 * execute() pipeline, how ClaudeCommandBuilder assembles Claude's CLI
 * arguments internally, or how I/O is marshalled.
 */
import { CompositionRoot } from '../../../kernel/composition-root.js';
import { MarshalledCLITool } from '../marshalled-cli-tool.js';

import { ClaudeCommandBuilder } from './claude-command-builder.js';

export class DefaultClaudeCodeTool extends MarshalledCLITool {
  // root is REQUIRED with no default (AHQ-197): the explicit parameter chain
  // bans silent defaults, and CompositionRoot itself now needs the runtime
  // params. Unmigrated legacy workflow CLIs that still call
  // `new DefaultClaudeCodeTool()` fail here until AHQ-201 migrates them —
  // a break the human explicitly accepted for AHQ-197. (math-workflow was
  // migrated in AHQ-197; add-feature was pulled forward from AHQ-202 during
  // AHQ-195 development.)
  constructor(root: CompositionRoot) {
    super(
      root.getIOMarshallerSessionFactory(),
      root.getCLIWrapper(),
      new ClaudeCommandBuilder(root.getAhqPackage(), root.getCurrentUserWorkspace()),
      root.getCurrentUserWorkspace()
    );
  }
}
