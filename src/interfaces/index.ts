/**
 * Core architecture interfaces.
 *
 * These are the pluggable seams of the agentic-hq system:
 * - IOMarshallerSession: How command I/O is marshalled per execution
 * - CLIWrapper: How CLI processes are spawned and managed
 * - CLICommand: A built command ready to execute (executable + args)
 * - MarshalledIOCLICommandBuilder: How tool-specific CLI commands are built for marshalled-IO tools
 * - Tool: How AI tool commands are executed
 * - WorkflowCommandBuilder: How workflow commands are built (the pluggable seam)
 * - WorkflowCommand: A resolved, ready-to-execute workflow command
 */
export type { IOMarshallerSessionFactory } from './io-marshaller-session-factory.js';
export type { IOMarshallerSession } from './io-marshaller-session.js';
export type { CLIWrapper } from './cli-wrapper.js';
export type { CLICommand } from './cli-command.js';
export type { MarshalledIOCLICommandBuilder } from './marshalled-io-cli-command-builder.js';
export type { Tool } from './tool.js';
export type { WorkflowCommandBuilder } from './workflow-command-builder.js';
export type { WorkflowCommand } from './workflow-command.js';
export type { ClaudeCodeTool } from './claude-code-tool.js';
