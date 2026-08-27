/**
 * MarshalledCLITool — Orchestrates marshalled I/O around a CLI process.
 *
 * SRP Does: The session pipeline — create a marshalling session, write
 * input, run CLI, read output — behind two typed exits (AHQ-210/AHQ-211
 * D1): execute() reads a command step's output string, executeSkillLaunch()
 * reads the workflow-launch handshake. Both share one private orchestration.
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
import type { SkillOutput } from '../../interfaces/skill-output.js';
import type { Tool } from '../../interfaces/tool.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';

// A workflow-launch skill takes no input — it only reports where it is
// installed — but the marshalling transport always carries an input file.
const UNUSED_INPUT_STRING = 'unused input string';

export class MarshalledCLITool implements Tool {
  constructor(
    private readonly sessionFactory: IOMarshallerSessionFactory,
    private readonly cliWrapper: CLIWrapper,
    private readonly marshalledIOCLICommandBuilder: MarshalledIOCLICommandBuilder,
    private readonly workspace: Workspace
  ) {}

  /** Run a command step and return its output string — unchanged behaviour. */
  async execute(command: string, input: string): Promise<string> {
    const session = await this.runSession(command, input);
    return session.readCommandOutput();
  }

  /** Run a workflow skill and return its typed launch handshake (AHQ-210). */
  async executeSkillLaunch(skillCommand: string): Promise<SkillOutput> {
    const session = await this.runSession(skillCommand, UNUSED_INPUT_STRING);
    return session.readSkillOutput();
  }

  private async runSession(aiToolCommand: string, input: string): Promise<IOMarshallerSession> {
    const session = this.sessionFactory.create();
    session.write(input);
    await this.runMarshalledIOCLICommand(aiToolCommand, session);
    return session;
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
