/**
 * Unit Test: DefaultClaudeCodeToolFactory
 *
 * The per-workflow build-mode seam (AHQ-208): the factory holds the ONE thing
 * that never varies per workflow — the AhqPackageRoot — and mints a
 * DefaultClaudeCodeTool per createTool(buildMode) call, wired through a fresh
 * CompositionRoot whose runtime params carry THAT workflow's mode. Verified by
 * mocking ClaudeCommandBuilder (the same vi.mock pattern as
 * default-claude-code-tool.unit.test.ts) and inspecting the AHQ-package
 * workspace the tool wires it with — since AHQ-210/AHQ-211 D1 deleted the
 * runtime-params relay, the workspace's root and build-mode are where the
 * factory's wiring is observable.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { DefaultClaudeCodeToolFactory } from '../../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool-factory.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

vi.mock('../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js', () => ({
  ClaudeCommandBuilder: vi.fn(function MockClaudeCommandBuilder(this: {
    build: ReturnType<typeof vi.fn>;
  }) {
    this.build = vi.fn();
  }),
}));

function ahqPackageWorkspaceWiredIntoBuilder(callIndex: number): Workspace {
  const builderCall = vi.mocked(ClaudeCommandBuilder).mock.calls[callIndex]!;
  return builderCall[0] as Workspace;
}

describe('DefaultClaudeCodeToolFactory', () => {
  beforeEach(() => {
    // The mocked ClaudeCommandBuilder's call list would otherwise leak between
    // tests, shifting the call indexes ahqPackageWorkspaceWiredIntoBuilder reads.
    vi.clearAllMocks();
  });

  it('createTool(buildMode) wires a ClaudeCommandBuilder whose AHQ-package workspace carries that mode and the unchanged package root', () => {
    const ahqPackageRoot = new DefaultAhqPackageRoot('/my-ahq-package-root');
    const factory = new DefaultClaudeCodeToolFactory(ahqPackageRoot);

    const tool = factory.createTool(BuildMode.PREBUILT);

    expect(tool).toBeDefined();
    expect(ClaudeCommandBuilder).toHaveBeenCalledTimes(1);
    const wiredAhqPackage = ahqPackageWorkspaceWiredIntoBuilder(0);
    expect(wiredAhqPackage.getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(wiredAhqPackage.getRoot()).toBe('/my-ahq-package-root');
  });

  it('mints a tool per call, each carrying its own mode over the same package root', () => {
    const ahqPackageRoot = new DefaultAhqPackageRoot('/my-ahq-package-root');
    const factory = new DefaultClaudeCodeToolFactory(ahqPackageRoot);

    const buildFirstTool = factory.createTool(BuildMode.BUILD_FIRST);
    const prebuiltTool = factory.createTool(BuildMode.PREBUILT);

    expect(buildFirstTool).not.toBe(prebuiltTool);
    expect(ahqPackageWorkspaceWiredIntoBuilder(0).getBuildMode()).toBe(BuildMode.BUILD_FIRST);
    expect(ahqPackageWorkspaceWiredIntoBuilder(1).getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(ahqPackageWorkspaceWiredIntoBuilder(0).getRoot()).toBe('/my-ahq-package-root');
    expect(ahqPackageWorkspaceWiredIntoBuilder(1).getRoot()).toBe('/my-ahq-package-root');
  });
});
