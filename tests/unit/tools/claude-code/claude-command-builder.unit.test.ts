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

import type { AgenticHqInstallation } from '../../../../src/interfaces/agentic-hq-installation.js';
import type { UserProjectWorkspace } from '../../../../src/interfaces/user-project-workspace.js';
import { DefaultCLICommand } from '../../../../src/io/terminal/default-cli-command.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';

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

function mockInstallation(): AgenticHqInstallation {
  return { getConfigDir: () => ahqConfigDir };
}

function mockWorkspace(root?: string): UserProjectWorkspace {
  const r = root ?? userWorkspaceRoot;
  return { getRoot: () => r, getTempDir: () => path.join(r, '.agentic-hq', 'temp') };
}

describe('ClaudeCommandBuilder', () => {
  describe('build()', () => {
    it('should return a CLICommand with executable "claude" by default', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      expect(cmd.executable).toBe('claude');
    });

    it('should include --plugin-dir flags for all plugin subdirectories in AHQ installation', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
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

      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace(userRoot));
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // 2 from AHQ + 1 from user workspace
      expect(pluginDirArgs).toHaveLength(3);
      expect(pluginDirArgs.join(' ')).toContain('core-plugin');
      expect(pluginDirArgs.join(' ')).toContain('demos-plugin');
      expect(pluginDirArgs.join(' ')).toContain('user-plugin');
    });

    it('should not duplicate plugin dirs when workspace and installation are the same directory', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // Only AHQ plugins — no duplicates from workspace
      expect(pluginDirArgs).toHaveLength(2);
    });

    it('should handle non-existent user workspace plugin dir gracefully', () => {
      const builder = new ClaudeCommandBuilder(
        mockInstallation(),
        mockWorkspace('/nonexistent/workspace')
      );
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      // Only AHQ plugins — user workspace doesn't exist
      expect(pluginDirArgs).toHaveLength(2);
    });

    it('should include --allowedTools flag with default tools', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const allowedToolsArg = cmd.args.find((a) => a.startsWith('--allowedTools='));
      expect(allowedToolsArg).toBeDefined();
      expect(allowedToolsArg).toContain('Bash');
      expect(allowedToolsArg).toContain('Edit');
    });

    it('should include Read scoped to configDir in allowedTools', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const allowedToolsArg = cmd.args.find((a) => a.startsWith('--allowedTools='));
      expect(allowedToolsArg).toContain(`Read(${ahqConfigDir})`);
    });

    it('should append command and marshallingId to args', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('my-command', '/tmp/my-session');
      const lastArg = cmd.args[cmd.args.length - 1]!;
      expect(lastArg).toBe('my-command /tmp/my-session');
    });

    it('should use custom executable when provided', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace(), 'tsx');
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.executable).toBe('tsx');
    });

    it('should include extra args before plugin flags', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace(), 'tsx', [
        '/path/to/fake.ts',
      ]);
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.args[0]).toBe('/path/to/fake.ts');
    });

    it('should return a DefaultCLICommand instance', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd).toBeInstanceOf(DefaultCLICommand);
    });

    it('should produce a human-readable string via toString()', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
      const cmd = builder.build('my-cmd', '/tmp/sess');
      const str = cmd.toString();
      expect(str).toContain('claude');
      expect(str).toContain('--plugin-dir=');
      expect(str).toContain('--allowedTools=');
      expect(str).toContain('"my-cmd /tmp/sess"');
    });

    it('should log ANSI-formatted debug output via logDebug()', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation(), mockWorkspace());
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
