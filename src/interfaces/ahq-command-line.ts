import type { AhqRuntimeParams } from './ahq-runtime-params.js';

/**
 * AhqCommandLine — the INCOMING command line: the entire argv this process
 * was launched with, as composed by an AHQ entry-point wrapper (the bin
 * wrappers for the main CLI, the workflow runner for workflow programs).
 *
 * Direction is what separates this from the repo's other command types,
 * which are both OUTGOING — commands this process runs:
 *   - CLICommand: a behaviour-free executable+args DTO used to SPAWN a
 *     child process (e.g. launching Claude).
 *   - WorkflowCommand: a resolved workflow command this process executes.
 * AhqCommandLine is neither — it is the command line somebody else composed
 * to launch US.
 *
 * SRP Does: Represent the whole launch argv and yield its two interpreted
 * views — the framework's typed runtime params, and the remaining args for
 * the consumer's own Commander parse.
 *
 * SRP Knows About: How an AHQ entry-point wrapper structures a command line
 * (the required `--build-mode=` / `--ahq-package-root=` options interleaved
 * with the consumer's own arguments — presence is this type's invariant).
 *
 * SRP Knows Nothing About: What the runtime params mean, who consumes the
 * remaining args, or how the process was actually spawned.
 */
export interface AhqCommandLine {
  /** The framework's typed runtime params carried on this command line */
  getAhqRuntimeParams(): AhqRuntimeParams;

  /** The argv with the framework's options stripped, order preserved */
  getRemainingArgs(): string[];
}
