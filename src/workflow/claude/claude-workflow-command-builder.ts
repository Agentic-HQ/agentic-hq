/**
 * ClaudeWorkflowCommandBuilder — builds workflow commands using Claude skills.
 *
 * SRP Does: Ask a Tool (minted by the injected ToolFactory for the launched
 * workflow's build mode, per-workflow since AHQ-208) for the skill-base-dir
 * launch handshake, sanity-check it, and build the launch argv natively —
 * process.execPath + the shared workflow runner + flags + raw passthrough
 * args (AHQ-210/AHQ-211 D1: no command string, no shell, no escaping).
 *
 * SRP Knows About: The skill launch handshake, the shared runner's CLI
 * contract (scripts/run-workflow.cjs and its four required options), and the
 * `<skill-id>-cli.js` program-name convention.
 *
 * SRP Knows Nothing About: How the Tool resolves skills internally,
 * how the command will be executed, or I/O marshalling details.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { AhqPackageRoot } from '../../interfaces/ahq-package-root.js';
import type { BuildMode } from '../../interfaces/build-mode.js';
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { ToolFactory } from '../../interfaces/tool-factory.js';
import type { WorkflowCommandBuilder } from '../../interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../interfaces/workflow-command.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';
import { DefaultWorkflowCommand } from '../workflow-command/default-workflow-command.js';

const TS_WORKFLOW_DIR_NAME = 'ts-workflow';

export class ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder {
  constructor(
    private readonly toolFactory: ToolFactory,
    private readonly cliWrapper: CLIWrapper,
    private readonly workspace: Workspace,
    private readonly ahqPackageRoot: AhqPackageRoot
  ) {}

  async build(
    skillCommand: string,
    buildMode: BuildMode,
    passthroughArgs: string[]
  ): Promise<WorkflowCommand> {
    const tool = this.toolFactory.createTool(buildMode);
    const { skillBaseDir } = await tool.executeSkillLaunch(skillCommand);
    const workflowDir = this.validatedWorkflowDir(skillCommand, skillBaseDir);
    const args = this.buildLaunchArgs(buildMode, skillBaseDir, workflowDir, passthroughArgs);
    return new DefaultWorkflowCommand(
      process.execPath,
      args,
      this.cliWrapper,
      this.workspace.getRoot()
    );
  }

  /**
   * Sanity-check the handshake (AHQ-211 D1): the reported dir must exist and
   * contain ts-workflow/ — stronger than any string format could be, with a
   * loud error naming the skill.
   */
  private validatedWorkflowDir(skillCommand: string, skillBaseDir: string): string {
    if (!fs.existsSync(skillBaseDir)) {
      throw new Error(
        `Workflow skill ${skillCommand} reported a skill-base-dir that does not exist: ${skillBaseDir}`
      );
    }
    const workflowDir = path.join(skillBaseDir, TS_WORKFLOW_DIR_NAME);
    if (!fs.existsSync(workflowDir)) {
      throw new Error(
        `Workflow skill ${skillCommand} reported a skill-base-dir with no ` +
          `${TS_WORKFLOW_DIR_NAME}/ directory: ${skillBaseDir}`
      );
    }
    return workflowDir;
  }

  private buildLaunchArgs(
    buildMode: BuildMode,
    skillBaseDir: string,
    workflowDir: string,
    passthroughArgs: string[]
  ): string[] {
    // skill-id is the skill directory name; the workflow program follows the
    // `<skill-id>-cli.js` convention (see the byte-identical SKILL.md template)
    const skillId = path.basename(skillBaseDir);
    const ahqPackageRootPath = this.ahqPackageRoot.getPath();
    return [
      path.join(ahqPackageRootPath, 'scripts', 'run-workflow.cjs'),
      `--ahq-package-root=${ahqPackageRootPath}`,
      `--build-mode=${buildMode.getValue()}`,
      `--workflow-dir=${workflowDir}`,
      `--workflow-js=dist/${skillId}-cli.js`,
      ...passthroughArgs,
    ];
  }
}
