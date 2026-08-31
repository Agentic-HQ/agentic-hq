/**
 * DefaultWorkflowCommand — Default implementation of WorkflowCommand.
 *
 * SRP Does: Hold a resolved executable + argv array and execute it via
 * CLIWrapper in a specific working directory. The argv array is spawned
 * directly — no shell of any kind wraps the launch, so no quoting or
 * escaping exists at this layer (AHQ-210/AHQ-211 D1 deleted `bash -c`).
 *
 * SRP Knows Nothing About: How the argv was built, which AI tool
 * resolved it, or how I/O is marshalled. Uses CLICommand internally via
 * composition.
 */
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { WorkflowCommand } from '../../interfaces/workflow-command.js';
import { DefaultCLICommand } from '../../io/terminal/default-cli-command.js';

export class DefaultWorkflowCommand implements WorkflowCommand {
  constructor(
    private readonly executable: string,
    private readonly args: string[],
    private readonly cliWrapper: CLIWrapper,
    private readonly workingDirectory: string
  ) {}

  async execute(): Promise<void> {
    const command = new DefaultCLICommand(this.executable, this.args);
    await this.cliWrapper.run(command, this.workingDirectory);
  }
}
