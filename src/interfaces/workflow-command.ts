/**                                                                                                                                                                                                   │
 * WorkflowCommand — a resolved, ready-to-execute workflow command.                                                                                                                                   │
 *                                                                                                                                                                                                    │
 * Created by a WorkflowCommandBuilder after skill resolution, then                                                                                                                                   │
 * executed by the CLI program. This is the Command pattern: the builder                                                                                                                              │
 * resolves *what* to run, and the WorkflowCommand knows *how* to run it.                                                                                                                             │
 *                                                                                                                                                                                                    │
 * Higher-level than CLICommand (which is a low-level executable + args DTO).                                                                                                                         │
 * Implementations encapsulate the resolved command string, working directory,                                                                                                                        │
 * and execution mechanism behind a single execute() call.                                                                                                                                            │
 */
export interface WorkflowCommand {
  /** Execute the workflow command. */
  execute(): Promise<void>;
}
