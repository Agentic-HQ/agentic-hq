/**
 * ClaudeCommandBuilder unit tests.
 *
 * Tests the Claude-specific CLI command builder that produces
 * executable + args for Claude Code CLI invocations.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { DefaultCLICommand } from '../../../../src/io/terminal/default-cli-command.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import type { ClaudeLaunch } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-executable-resolver.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

// What the injected stub resolver reports — a resolved absolute path, as the
// real which-style resolver produces (AHQ-211 D4). Unit tests must never run
// the real resolver: it walks the host PATH for an actual claude install.
const RESOLVED_CLAUDE_EXECUTABLE = path.join('C:', 'resolved', 'claude.exe');

function stubResolveLaunch(): ClaudeLaunch {
  return { executable: RESOLVED_CLAUDE_EXECUTABLE, argsPrefix: [] };
}

let tmpDir: string;
let ahqConfigDir: string;
let userWorkspaceRoot: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccb-test-'));
  // AHQ installation with 2 plugins
  ahqConfigDir = path.join(tmpDir, 'ahq', '.agentic-hq');
  fs.mkdirSync(path.join(ahqConfigDir, 'plugins', 'core-plugin'), { recursive: true });
  fs.mkdirSync(path.join(ahqConfigDir, 'plugins', 'demos-plugin'), { recursive: true });
  // User workspace (same as AHQ by default — overridden in specific tests)
  userWorkspaceRoot = path.join(tmpDir, 'ahq');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function mockAhqPackage(): Workspace {
  return {
    getDisplayName: () => 'Agentic HQ Package',
    getPlugins: () => [],
    registerWorkflowsWith: () => {},
    getRoot: () => path.dirname(ahqConfigDir),
    getTempDir: () => path.join(ahqConfigDir, 'temp'),
    getDotAgenticHqDir: () => ahqConfigDir,
    isAhqPackage: () => true,
    getBuildMode: () => BuildMode.BUILD_FIRST,
  };
}

function mockUserWorkspace(root?: string): Workspace {
  const r = root ?? userWorkspaceRoot;
  const dotDir = path.join(r, '.agentic-hq');
  return {
    getDisplayName: () => 'Local Workspace',
    getPlugins: () => [],
    registerWorkflowsWith: () => {},
    getRoot: () => r,
    getTempDir: () => path.join(dotDir, 'temp'),
    getDotAgenticHqDir: () => dotDir,
    isAhqPackage: () => r === path.dirname(ahqConfigDir),
    getBuildMode: () => BuildMode.BUILD_FIRST,
  };
}

/** A builder in production shape (no custom executable) with the resolver stubbed. */
function createBuilder(userWorkspace: Workspace = mockUserWorkspace()): ClaudeCommandBuilder {
  return new ClaudeCommandBuilder(
    mockAhqPackage(),
    userWorkspace,
    undefined,
    [],
    stubResolveLaunch
  );
}

describe('ClaudeCommandBuilder', () => {
  describe('build()', () => {
    it('should use the resolver-supplied executable when no custom executable is given', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      expect(cmd.executable).toBe(RESOLVED_CLAUDE_EXECUTABLE);
    });

    it('should include --plugin-dir flags for all plugin subdirectories in AHQ installation', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      expect(pluginDirArgs).toHaveLength(2);
      expect(pluginDirArgs.join(' ')).toContain('core-plugin');
      expect(pluginDirArgs.join(' ')).toContain('demos-plugin');
    });

    it('should include user workspace plugin dirs when workspace differs from AHQ installation', () => {
      // Create a separate user workspace with its own plugin
      const userRoot = path.join(tmpDir, 'user-workspace');
      fs.mkdirSync(path.join(userRoot, '.agentic-hq', 'plugins', 'user-plugin'), {
        recursive: true,
      });

      const builder = createBuilder(mockUserWorkspace(userRoot));
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // 2 from AHQ + 1 from user workspace
      expect(pluginDirArgs).toHaveLength(3);
      expect(pluginDirArgs.join(' ')).toContain('core-plugin');
      expect(pluginDirArgs.join(' ')).toContain('demos-plugin');
      expect(pluginDirArgs.join(' ')).toContain('user-plugin');
    });

    // AHQ-205: Claude Code keeps only the FIRST of two --plugin-dir flags naming the same plugin,
    // so the user's workspace dirs must precede the AHQ package's for "local wins" to hold at
    // the Claude layer as well as in the CLI's own subcommand table.
    it('should place every user-workspace --plugin-dir flag before every AHQ-package one', () => {
      const userRoot = path.join(tmpDir, 'user-workspace');
      const userPluginsDir = path.join(userRoot, '.agentic-hq', 'plugins');
      fs.mkdirSync(path.join(userPluginsDir, 'user-plugin'), { recursive: true });

      const builder = createBuilder(mockUserWorkspace(userRoot));
      const cmd = builder.build('test-command', '/tmp/dir');

      const pluginDirIndexes = cmd.args
        .map((arg, index) => ({ arg, index }))
        .filter(({ arg }) => arg.startsWith('--plugin-dir='));
      const userIndexes = pluginDirIndexes
        .filter(({ arg }) => arg.startsWith(`--plugin-dir=${userPluginsDir}`))
        .map(({ index }) => index);
      const packageIndexes = pluginDirIndexes
        .filter(({ arg }) => arg.startsWith(`--plugin-dir=${path.join(ahqConfigDir, 'plugins')}`))
        .map(({ index }) => index);

      expect(userIndexes).toHaveLength(1);
      expect(packageIndexes).toHaveLength(2);
      expect(Math.max(...userIndexes)).toBeLessThan(Math.min(...packageIndexes));
    });

    it('should not duplicate plugin dirs when workspace and installation are the same directory', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // Only AHQ plugins — no duplicates from workspace
      expect(pluginDirArgs).toHaveLength(2);
    });

    it('should handle non-existent user workspace plugin dir gracefully', () => {
      const builder = createBuilder(mockUserWorkspace('/nonexistent/workspace'));
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // Only AHQ plugins — user workspace doesn't exist
      expect(pluginDirArgs).toHaveLength(2);
    });

    it('should include --allowedTools flag with default tools', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const allowedToolsArg = cmd.args.find((a) => a.startsWith('--allowedTools='));
      expect(allowedToolsArg).toBeDefined();
      expect(allowedToolsArg).toContain('Bash');
      expect(allowedToolsArg).toContain('Edit');
    });

    it('should include Read scoped to configDir in allowedTools', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const allowedToolsArg = cmd.args.find((a) => a.startsWith('--allowedTools='));
      expect(allowedToolsArg).toContain(`Read(${ahqConfigDir})`);
    });

    it('should append only the command and the double-quoted marshallingId as the positional arg', () => {
      // AHQ-210/AHQ-211 D1+D5: the io-directory is the ONLY value that crosses
      // the Claude/skill hop (build-mode and ahq-package-root no longer cross
      // it at all), and it is double-quoted because the AI re-splits the
      // positional prompt on spaces — Windows paths routinely contain them
      const builder = createBuilder();
      const cmd = builder.build('my-command', '/tmp/my-session');
      const lastArg = cmd.args[cmd.args.length - 1]!;
      expect(lastArg).toBe('my-command "/tmp/my-session"');
    });

    it('should keep a marshallingId containing spaces intact inside the quotes', () => {
      const builder = createBuilder();
      const cmd = builder.build(
        'my-command',
        'C:\\Users\\Steve Smith\\.agentic-hq\\temp\\io-files-x'
      );
      const lastArg = cmd.args[cmd.args.length - 1]!;
      expect(lastArg).toBe('my-command "C:\\Users\\Steve Smith\\.agentic-hq\\temp\\io-files-x"');
    });

    // AHQ-211 D4: without a custom executable, the injected resolver decides
    // how claude is spawned — including the legacy npm-shim launch shape
    describe('claude executable resolution', () => {
      it('should prepend the resolver argsPrefix before every other arg (legacy npm-shim launch)', () => {
        const npmShimEntryJs = path.join('C:', 'npm-prefix', 'cli.js');
        const legacyLaunchResolver = (): ClaudeLaunch => ({
          executable: process.execPath,
          argsPrefix: [npmShimEntryJs],
        });
        const builder = new ClaudeCommandBuilder(
          mockAhqPackage(),
          mockUserWorkspace(),
          undefined,
          [],
          legacyLaunchResolver
        );

        const cmd = builder.build('test-command', '/tmp/dir');

        expect(cmd.executable).toBe(process.execPath);
        expect(cmd.args[0]).toBe(npmShimEntryJs);
      });

      it('should not invoke the resolver at construction time — only when build() runs', () => {
        const resolver = vi.fn(stubResolveLaunch);
        const builder = new ClaudeCommandBuilder(
          mockAhqPackage(),
          mockUserWorkspace(),
          undefined,
          [],
          resolver
        );
        expect(resolver).not.toHaveBeenCalled();

        builder.build('test-command', '/tmp/dir');

        expect(resolver).toHaveBeenCalledTimes(1);
      });

      it('should bypass resolution entirely when a custom executable is provided', () => {
        const resolver = vi.fn(stubResolveLaunch);
        const builder = new ClaudeCommandBuilder(
          mockAhqPackage(),
          mockUserWorkspace(),
          'tsx',
          [],
          resolver
        );

        const cmd = builder.build('test-command', '/tmp/dir');

        expect(cmd.executable).toBe('tsx');
        expect(resolver).not.toHaveBeenCalled();
      });
    });

    it('should use custom executable when provided', () => {
      const builder = new ClaudeCommandBuilder(mockAhqPackage(), mockUserWorkspace(), 'tsx');
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.executable).toBe('tsx');
    });

    it('should include extra args before plugin flags', () => {
      const builder = new ClaudeCommandBuilder(mockAhqPackage(), mockUserWorkspace(), 'tsx', [
        '/path/to/fake.ts',
      ]);
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.args[0]).toBe('/path/to/fake.ts');
    });

    it('should return a DefaultCLICommand instance', () => {
      const builder = createBuilder();
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd).toBeInstanceOf(DefaultCLICommand);
    });

    it('should produce a human-readable string via toString()', () => {
      const builder = createBuilder();
      const cmd = builder.build('my-cmd', '/tmp/sess');
      const str = cmd.toString();
      expect(str).toContain('claude');
      expect(str).toContain('--plugin-dir=');
      expect(str).toContain('--allowedTools=');
      expect(str).toContain('my-cmd "/tmp/sess"');
    });

    it('should log ANSI-formatted debug output via logDebug()', () => {
      const builder = createBuilder();
      const cmd = builder.build('my-cmd', '/tmp/sess');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cmd.logDebug();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleSpy.mock.calls[0]![0] as string;
      expect(loggedMessage).toContain('\x1b[1m');
      expect(loggedMessage).toContain('\x1b[95m');
      expect(loggedMessage).toContain('[CLICommand] Running:');
      expect(loggedMessage).toContain('claude');
      expect(loggedMessage).toContain('\x1b[0m');

      consoleSpy.mockRestore();
    });
  });
});
