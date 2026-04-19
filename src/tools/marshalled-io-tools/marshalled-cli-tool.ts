/**
 * MarshalledCLITool — Orchestrates marshalled I/O around a CLI process.
 *
 * SRP Does: The execute() pipeline — create a marshalling session,
 * write input, run CLI, read output.
 *
 * SRP Knows About: The orchestration sequence (uses the injected
 * workspace root as the CLI working directory).
 *
 * SRP Knows Nothing About: Which AI tool is being run (that's the
 * builder's job), how I/O is marshalled (that's the session's job),
 * or how the CLI is spawned and wrapped (that's the CLIWrapper's job).
 */
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../../interfaces/io-marshaller-session-factory.js';
import type { IOMarshallerSession } from '../../interfaces/io-marshaller-session.js';
import type { MarshalledIOCLICommandBuilder } from '../../interfaces/marshalled-io-cli-command-builder.js';
import type { Tool } from '../../interfaces/tool.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';

export class MarshalledCLITool implements Tool {
  constructor(
    private readonly sessionFactory: IOMarshallerSessionFactory,
    private readonly cliWrapper: CLIWrapper,
    private readonly marshalledIOCLICommandBuilder: MarshalledIOCLICommandBuilder,
    private readonly workspace: Workspace
  ) {}

  async execute(command: string, input: string): Promise<string> {
    // Rename "command" to "aiToolCommand" to make clear the distinction between the
    // CLICommand for running the CLI e.g. "claude arg1 arg2 arg3" vs
    // the aiToolCommand e.g. "/RunJiraDevWorkflow"
    const aiToolCommand = command;
    const ioMarshallerSession = this.sessionFactory.create();
    ioMarshallerSession.write(input);
    await this.runMarshalledIOCLICommand(aiToolCommand, ioMarshallerSession);
    return ioMarshallerSession.readOutput();
  }

  private async runMarshalledIOCLICommand(
    aiToolCommand: string,
    ioMarshallerSession: IOMarshallerSession
  ): Promise<void> {
    const marshallingId = ioMarshallerSession.getMarshallingId();
    const cliCmd = this.marshalledIOCLICommandBuilder.build(aiToolCommand, marshallingId);
    await this.cliWrapper.run(cliCmd, this.workspace.getRoot());
  }
}
