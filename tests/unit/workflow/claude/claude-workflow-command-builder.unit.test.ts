/**
 * Unit Test: ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder.
 *
 * Verifies that ClaudeWorkflowCommandBuilder (AHQ-210/AHQ-211 D1):
 * 1. Implements the WorkflowCommandBuilder interface
 * 2. Obtains its Tool from the injected ToolFactory for the given BuildMode
 *    (per-workflow build-mode, AHQ-208) and calls executeSkillLaunch() to get
 *    the skill-base-dir handshake — the one fact only the Claude hop knows
 * 3. Sanity-checks the returned skill-base-dir (exists + contains ts-workflow/)
 *    with a loud error naming the skill
 * 4. Builds the launch argv natively — process.execPath + run-workflow.cjs +
 *    flags + raw passthrough args. No command string, no shell, no escaping.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterAll, describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../../src/interfaces/cli-wrapper.js';
import type { ToolFactory } from '../../../../src/interfaces/tool-factory.js';
import type { Tool } from '../../../../src/interfaces/tool.js';
import type { WorkflowCommandBuilder } from '../../../../src/interfaces/workflow-command-builder.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { ClaudeWorkflowCommandBuilder } from '../../../../src/workflow/claude/claude-workflow-command-builder.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

const AHQ_PACKAGE_ROOT_PATH = path.join('/', 'mock', 'ahq-package-root');
const RUN_WORKFLOW_SCRIPT = path.join(AHQ_PACKAGE_ROOT_PATH, 'scripts', 'run-workflow.cjs');

// A real skill dir (with ts-workflow/ inside) for the builder's sanity check
const TEST_TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-builder-test-'));
const SKILL_BASE_DIR = path.join(TEST_TEMP_DIR, 'my-workflow');
fs.mkdirSync(path.join(SKILL_BASE_DIR, 'ts-workflow'), { recursive: true });

afterAll(() => {
  fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
});

const mockWorkspace: Workspace = {
  getDisplayName: () => 'Mock',
  getPlugins: () => [],
  registerWorkflowsWith: () => {},
  getRoot: () => '/mock/project-root',
  getTempDir: () => '/mock/project-root/.agentic-hq/temp',
  getDotAgenticHqDir: () => '/mock/project-root/.agentic-hq',
  isAhqPackage: () => false,
  getBuildMode: () => BuildMode.BUILD_FIRST,
};

function createMockToolFactory(skillBaseDir: string): {
  toolFactory: ToolFactory;
  tool: Tool;
} {
  const tool: Tool = {
    execute: vi.fn().mockResolvedValue('unused command-step output'),
    executeSkillLaunch: vi.fn().mockResolvedValue({ skillBaseDir }),
  };
  const toolFactory: ToolFactory = {
    createTool: vi.fn().mockReturnValue(tool),
  };
  return { toolFactory, tool };
}

function createMockCliWrapper(): CLIWrapper {
  return {
    run: vi.fn().mockResolvedValue(undefined),
  };
}

function createBuilder(
  toolFactory: ToolFactory,
  cliWrapper: CLIWrapper
): ClaudeWorkflowCommandBuilder {
  return new ClaudeWorkflowCommandBuilder(
    toolFactory,
    cliWrapper,
    mockWorkspace,
    new DefaultAhqPackageRoot(AHQ_PACKAGE_ROOT_PATH)
  );
}

describe('ClaudeWorkflowCommandBuilder', () => {
  it('should implement the WorkflowCommandBuilder interface', () => {
    const builder: WorkflowCommandBuilder = createBuilder(
      createMockToolFactory(SKILL_BASE_DIR).toolFactory,
      createMockCliWrapper()
    );
    expect(builder).toBeDefined();
    expect(typeof builder.build).toBe('function');
  });

  it('should create the tool for the given build mode and get the handshake via executeSkillLaunch', async () => {
    const { toolFactory, tool } = createMockToolFactory(SKILL_BASE_DIR);
    const builder = createBuilder(toolFactory, createMockCliWrapper());

    const command = await builder.build('/plugin:my-workflow', BuildMode.PREBUILT, []);

    expect(toolFactory.createTool).toHaveBeenCalledWith(BuildMode.PREBUILT);
    expect(tool.executeSkillLaunch).toHaveBeenCalledWith('/plugin:my-workflow');
    expect(tool.execute).not.toHaveBeenCalled();
    expect(typeof command.execute).toBe('function');
  });

  it('should build the launch argv natively: process.execPath + run-workflow.cjs + flags', async () => {
    const { toolFactory } = createMockToolFactory(SKILL_BASE_DIR);
    const mockWrapper = createMockCliWrapper();
    const builder = createBuilder(toolFactory, mockWrapper);

    const command = await builder.build('/plugin:my-workflow', BuildMode.BUILD_FIRST, []);
    await command.execute();

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.executable).toBe(process.execPath);
    expect(cliCommand.args).toEqual([
      RUN_WORKFLOW_SCRIPT,
      `--ahq-package-root=${AHQ_PACKAGE_ROOT_PATH}`,
      '--build-mode=build-first',
      `--workflow-dir=${path.join(SKILL_BASE_DIR, 'ts-workflow')}`,
      '--workflow-js=dist/my-workflow-cli.js',
    ]);
    expect(call[1]).toBe('/mock/project-root');
  });

  it('should append passthrough args raw — no quoting or escaping, spaces intact', async () => {
    const { toolFactory } = createMockToolFactory(SKILL_BASE_DIR);
    const mockWrapper = createMockCliWrapper();
    const builder = createBuilder(toolFactory, mockWrapper);

    const command = await builder.build('/plugin:my-workflow', BuildMode.BUILD_FIRST, [
      '--arg1=value',
      '--name=hello world',
    ]);
    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args.slice(-2)).toEqual(['--arg1=value', '--name=hello world']);
  });

  it('should fail fast, naming the skill, when the reported skill-base-dir does not exist', async () => {
    const { toolFactory } = createMockToolFactory(path.join(TEST_TEMP_DIR, 'no-such-skill'));
    const builder = createBuilder(toolFactory, createMockCliWrapper());

    await expect(builder.build('/plugin:my-workflow', BuildMode.BUILD_FIRST, [])).rejects.toThrow(
      '/plugin:my-workflow'
    );
  });

  it('should fail fast, naming the skill, when the skill-base-dir has no ts-workflow/ directory', async () => {
    const skillWithoutTsWorkflow = path.join(TEST_TEMP_DIR, 'skill-without-ts-workflow');
    fs.mkdirSync(skillWithoutTsWorkflow, { recursive: true });
    const { toolFactory } = createMockToolFactory(skillWithoutTsWorkflow);
    const builder = createBuilder(toolFactory, createMockCliWrapper());

    await expect(builder.build('/plugin:my-workflow', BuildMode.BUILD_FIRST, [])).rejects.toThrow(
      'ts-workflow'
    );
  });

  it('should derive the workflow program name from the skill directory name (skill-id convention)', async () => {
    const otherSkillDir = path.join(TEST_TEMP_DIR, 'string-reversal');
    fs.mkdirSync(path.join(otherSkillDir, 'ts-workflow'), { recursive: true });
    const { toolFactory } = createMockToolFactory(otherSkillDir);
    const mockWrapper = createMockCliWrapper();
    const builder = createBuilder(toolFactory, mockWrapper);

    const command = await builder.build('/plugin:string-reversal', BuildMode.PREBUILT, []);
    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toContain('--workflow-js=dist/string-reversal-cli.js');
    expect(cliCommand.args).toContain('--build-mode=prebuilt');
  });
});
