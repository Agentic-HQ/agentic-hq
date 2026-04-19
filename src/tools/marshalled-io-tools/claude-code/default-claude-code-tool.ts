/**
 * DefaultClaudeCodeTool — MarshalledCLITool pre-wired for Claude Code.
 *
 * SRP Does: Supply the four Claude-specific wiring arguments to
 * MarshalledCLITool's constructor — the session factory, CLI wrapper,
 * ClaudeCommandBuilder, and current-user workspace — sourced from a
 * CompositionRoot.
 *
 * SRP Knows About: That Claude's CLI command is built by
 * ClaudeCommandBuilder (wired with the AHQ + current-user workspaces),
 * and that the rest of the pipeline (session, CLI wrapper, working
 * directory) is shared generic infrastructure drawn from CompositionRoot.
 *
 * SRP Knows Nothing About: How MarshalledCLITool orchestrates the
 * execute() pipeline, how ClaudeCommandBuilder assembles Claude's CLI
 * arguments internally, or how I/O is marshalled.
 */
import { CompositionRoot } from '../../../kernel/composition-root.js';
import { MarshalledCLITool } from '../marshalled-cli-tool.js';

import { ClaudeCommandBuilder } from './claude-command-builder.js';

export class DefaultClaudeCodeTool extends MarshalledCLITool {
  constructor(root: CompositionRoot = new CompositionRoot()) {
    super(
      root.getIOMarshallerSessionFactory(),
      root.getCLIWrapper(),
      new ClaudeCommandBuilder(root.getAhqWorkspace(), root.getCurrentUserWorkspace()),
      root.getCurrentUserWorkspace()
    );
  }
}
