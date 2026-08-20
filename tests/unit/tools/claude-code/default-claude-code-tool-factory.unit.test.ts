/**
 * Unit Test: DefaultClaudeCodeToolFactory
 *
 * The per-workflow build-mode seam (AHQ-208): the factory holds the ONE thing
 * that never varies per workflow — the AhqPackageRoot — and mints a
 * DefaultClaudeCodeTool per createTool(buildMode) call, wired through a fresh
 * CompositionRoot whose runtime params carry THAT workflow's mode. Verified by
 * mocking ClaudeCommandBuilder (the same vi.mock pattern as
 * default-claude-code-tool.unit.test.ts) and inspecting the runtime params the
 * tool wires it with.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AhqRuntimeParams } from '../../../../src/interfaces/ahq-runtime-params.js';
import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { DefaultClaudeCodeToolFactory } from '../../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool-factory.js';

vi.mock('../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js', () => ({
  ClaudeCommandBuilder: vi.fn(function MockClaudeCommandBuilder(this: {
    build: ReturnType<typeof vi.fn>;
  }) {
    this.build = vi.fn();
  }),
}));

function runtimeParamsWiredIntoBuilder(callIndex: number): AhqRuntimeParams {
  const builderCall = vi.mocked(ClaudeCommandBuilder).mock.calls[callIndex]!;
  return builderCall[2] as AhqRuntimeParams;
}

describe('DefaultClaudeCodeToolFactory', () => {
  beforeEach(() => {
    // The mocked ClaudeCommandBuilder's call list would otherwise leak between
    // tests, shifting the call indexes runtimeParamsWiredIntoBuilder reads.
    vi.clearAllMocks();
  });

  it('createTool(buildMode) wires a ClaudeCommandBuilder whose runtime params carry that mode and the unchanged package root', () => {
    const ahqPackageRoot = new DefaultAhqPackageRoot('/my-ahq-package-root');
    const factory = new DefaultClaudeCodeToolFactory(ahqPackageRoot);

    const tool = factory.createTool(BuildMode.PREBUILT);

    expect(tool).toBeDefined();
    expect(ClaudeCommandBuilder).toHaveBeenCalledTimes(1);
    const wiredParams = runtimeParamsWiredIntoBuilder(0);
    expect(wiredParams.getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(wiredParams.getAhqPackageRoot()).toBe(ahqPackageRoot);
  });

  it('mints a tool per call, each carrying its own mode over the same package root', () => {
    const ahqPackageRoot = new DefaultAhqPackageRoot('/my-ahq-package-root');
    const factory = new DefaultClaudeCodeToolFactory(ahqPackageRoot);

    const buildFirstTool = factory.createTool(BuildMode.BUILD_FIRST);
    const prebuiltTool = factory.createTool(BuildMode.PREBUILT);

    expect(buildFirstTool).not.toBe(prebuiltTool);
    expect(runtimeParamsWiredIntoBuilder(0).getBuildMode()).toBe(BuildMode.BUILD_FIRST);
    expect(runtimeParamsWiredIntoBuilder(1).getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(runtimeParamsWiredIntoBuilder(0).getAhqPackageRoot()).toBe(ahqPackageRoot);
    expect(runtimeParamsWiredIntoBuilder(1).getAhqPackageRoot()).toBe(ahqPackageRoot);
  });
});
