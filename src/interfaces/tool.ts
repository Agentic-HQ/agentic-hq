/**
 * Tool - Interface for executing commands via an AI tool.
 *
 * Two typed exits (AHQ-210/AHQ-211 D1): execute() for command steps, whose
 * output is a string; executeSkillLaunch() for the workflow-launch hop, whose
 * output is the typed skill handshake. Wrong method = wrong return type =
 * compile error, plus a runtime fail-fast in the marshaller.
 *
 * Current implementation uses Claude Code CLI with file-based I/O.
 * Alternative implementations could use different AI tools, local models,
 * remote API calls, etc.
 */
import type { SkillOutput } from './skill-output.js';

export interface Tool {
  /** Execute a command with input and return the output string */
  execute(command: string, input: string): Promise<string>;

  /** Run a workflow skill and return its launch handshake (AHQ-210) */
  executeSkillLaunch(skillCommand: string): Promise<SkillOutput>;
}
