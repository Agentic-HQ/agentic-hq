/**
 * Unit Test: DefaultWorkflowRuntime (AHQ-197)
 *
 * The workflow-program side of the runner→workflow contract: constructed from
 * the raw argv the workflow runner forwards, it consumes the framework's
 * required `--build-mode=` / `--ahq-package-root=` options (fail-fast on
 * omission or an invalid value) and provides the workflow with a fully wired
 * Claude Code tool plus the workflow's own remaining args — so workflow files
 * contain no framework plumbing.
 */
import { describe, expect, it, vi } from 'vitest';

import type { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { DefaultClaudeCodeTool } from '../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';
import { DefaultWorkflowRuntime } from '../../../src/workflow-runtime/default-workflow-runtime.js';

vi.mock('../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js', () => ({
  DefaultClaudeCodeTool: vi.fn(function MockDefaultClaudeCodeTool(this: {
    execute: ReturnType<typeof vi.fn>;
  }) {
    this.execute = vi.fn().mockResolvedValue('mock-tool-output');
  }),
}));

const NODE_ARGV_PREFIX = ['/usr/bin/node', '/installed/dist/plugins/math-workflow-demo-cli.js'];

describe('DefaultWorkflowRuntime', () => {
  it('strips the framework options and preserves the remaining argv in order', () => {
    const runtime = new DefaultWorkflowRuntime([
      ...NODE_ARGV_PREFIX,
      '--build-mode=build-first',
      '--ahq-package-root=/repo',
      '--input-number=7',
    ]);

    expect(runtime.getWorkflowArgs()).toEqual([...NODE_ARGV_PREFIX, '--input-number=7']);
  });

  it('provides a Claude Code tool wired with the runtime params extracted from argv', async () => {
    const runtime = new DefaultWorkflowRuntime([
      ...NODE_ARGV_PREFIX,
      '--build-mode=prebuilt',
      '--ahq-package-root=/installed/package/root',
    ]);

    const tool = runtime.getClaudeCodeTool();

    expect(DefaultClaudeCodeTool).toHaveBeenCalledTimes(1);
    const wiredRoot = vi.mocked(DefaultClaudeCodeTool).mock.calls[0]![0] as CompositionRoot;
    expect(wiredRoot.getAhqRuntimeParams().getBuildMode().getValue()).toBe('prebuilt');
    expect(wiredRoot.getAhqRuntimeParams().getAhqPackageRoot().getPath()).toBe(
      '/installed/package/root'
    );

    await expect(tool.execute('/my-command', 'my-input')).resolves.toBe('mock-tool-output');
  });

  it('throws loudly at construction when --build-mode is missing', () => {
    expect(
      () => new DefaultWorkflowRuntime([...NODE_ARGV_PREFIX, '--ahq-package-root=/repo'])
    ).toThrowError(/--build-mode/);
  });

  it('throws loudly at construction when --ahq-package-root is missing', () => {
    expect(
      () => new DefaultWorkflowRuntime([...NODE_ARGV_PREFIX, '--build-mode=build-first'])
    ).toThrowError(/--ahq-package-root/);
  });

  it('throws loudly at construction on an invalid --build-mode value', () => {
    expect(
      () =>
        new DefaultWorkflowRuntime([
          ...NODE_ARGV_PREFIX,
          '--build-mode=sideways',
          '--ahq-package-root=/repo',
        ])
    ).toThrowError(/sideways/);
  });
});
