/**
 * ClaudeCommandBuilder unit tests.
 *
 * Tests the Claude-specific CLI command builder that produces
 * executable + args for Claude Code CLI invocations.
 */
import { describe, expect, it, vi } from 'vitest';

import type { AgenticHqInstallation } from '../../../../src/interfaces/agentic-hq-installation.js';
import { DefaultCLICommand } from '../../../../src/io/terminal/default-cli-command.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';

const mockInstallation: AgenticHqInstallation = {
  getConfigDir: () => '/fake/workspace/.agentic-hq',
};

describe('ClaudeCommandBuilder', () => {
  describe('build()', () => {
    it('should return a CLICommand with executable "claude" by default', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      expect(cmd.executable).toBe('claude');
    });

    it('should include --plugin-dir flags for each default plugin dir', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      expect(pluginDirArgs).toHaveLength(3);
      expect(pluginDirArgs.join(' ')).toContain('agentic-hq-core-plugin');
      expect(pluginDirArgs.join(' ')).toContain('agentic-hq-demos-plugin');
      expect(pluginDirArgs.join(' ')).toContain('agentic-hq-utilities-plugin');
    });

    it('should resolve plugin dirs under installation.configDir/plugins', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('test-command', '/tmp/dir');
      const pluginDirArgs = cmd.args.filter((a) => a.startsWith('--plugin-dir='));
      for (const arg of pluginDirArgs) {
        const dirPath = arg.replace('--plugin-dir=', '');
        expect(dirPath).toMatch(/^\/fake\/workspace\/.agentic-hq\/plugins\//);
      }
    });

    it('should include --allowedTools flag with default tools', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('test-command', '/tmp/marshalling-dir');
      const allowedToolsArg = cmd.args.find((a) => a.startsWith('--allowedTools='));
      expect(allowedToolsArg).toBeDefined();
      expect(allowedToolsArg).toContain('Bash');
      expect(allowedToolsArg).toContain('Edit');
    });

    it('should append command and marshallingId to args', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('my-command', '/tmp/my-session');
      const lastArg = cmd.args[cmd.args.length - 1]!;
      expect(lastArg).toBe('my-command /tmp/my-session');
    });

    it('should use custom executable when provided', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation, 'tsx');
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.executable).toBe('tsx');
    });

    it('should include extra args before plugin flags', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation, 'tsx', ['/path/to/fake.ts']);
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd.args[0]).toBe('/path/to/fake.ts');
    });

    it('should return a DefaultCLICommand instance', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('test-command', '/tmp/dir');
      expect(cmd).toBeInstanceOf(DefaultCLICommand);
    });

    it('should produce a human-readable string via toString()', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
      const cmd = builder.build('my-cmd', '/tmp/sess');
      const str = cmd.toString();
      expect(str).toContain('claude');
      expect(str).toContain('--plugin-dir=');
      expect(str).toContain('--allowedTools=');
      expect(str).toContain('"my-cmd /tmp/sess"');
    });

    it('should log ANSI-formatted debug output via logDebug()', () => {
      const builder = new ClaudeCommandBuilder(mockInstallation);
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
