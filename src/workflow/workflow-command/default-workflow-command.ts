/**
 * DefaultWorkflowCommand — Default implementation of WorkflowCommand.
 *
 * SRP Does: Hold a resolved command string and execute it via CLIWrapper
 * in a specific working directory.
 *
 * SRP Knows About: How to wrap a command string in 'bash -c' and delegate
 * to CLIWrapper for execution.
 *
 * SRP Knows Nothing About: How the command string was built, which AI tool
 * resolved it, or how I/O is marshalled. Uses CLICommand internally via
 * composition.
 */
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { WorkflowCommand } from '../../interfaces/workflow-command.js';
import { DefaultCLICommand } from '../../io/terminal/default-cli-command.js';

export class DefaultWorkflowCommand implements WorkflowCommand {
  constructor(
    private readonly commandString: string,
    private readonly cliWrapper: CLIWrapper,
    private readonly workingDirectory: string
  ) {}

  async execute(): Promise<void> {
    const command = new DefaultCLICommand('bash', ['-c', this.commandString]);
    await this.cliWrapper.run(command, this.workingDirectory);
  }
}
