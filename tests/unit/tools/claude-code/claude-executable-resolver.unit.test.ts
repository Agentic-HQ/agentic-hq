/**
 * resolveClaudeLaunch unit tests (AHQ-211 D4).
 *
 * Tests the which-style PATH walk (PATHEXT-aware on win32) that turns the
 * bare `claude` command into an absolute executable + args prefix that
 * node-pty can spawn directly on every platform — including the legacy
 * branch for npm's `claude.cmd` shim (deprecated installs), which must be
 * launched as `process.execPath <js-entry>` because pty.spawn cannot run
 * cmd.exe batch shims.
 *
 * All tests build their own PATH out of tmp directories and inject env +
 * platform, so they run identically on Windows and POSIX hosts and never
 * depend on a real claude install. The one exception is the POSIX
 * exec-bit test, which needs a host where the execute bit exists.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveClaudeLaunch } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-executable-resolver.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-resolver-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Create (and return) a directory under the test tmpdir. */
function makeBinDir(name: string): string {
  const dir = path.join(tmpDir, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Create an empty file (a stand-in executable) and return its absolute path. */
function makeFile(dir: string, fileName: string, mode?: number): string {
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, '');
  if (mode !== undefined) {
    fs.chmodSync(filePath, mode);
  }
  return filePath;
}

/** Build an env whose PATH lists the given dirs (host delimiter — see resolver docs). */
function envWithPath(dirs: string[], pathext?: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { PATH: dirs.join(path.delimiter) };
  if (pathext !== undefined) {
    env.PATHEXT = pathext;
  }
  return env;
}

describe('resolveClaudeLaunch', () => {
  describe('on win32 (winget/native install — real claude.exe)', () => {
    it('should resolve claude.exe on PATH to its absolute path with no args prefix', () => {
      const binDir = makeBinDir('winget-links');
      const claudeExe = makeFile(binDir, 'claude.exe');

      const launch = resolveClaudeLaunch({ env: envWithPath([binDir]), platform: 'win32' });

      expect(launch).toEqual({ executable: claudeExe, argsPrefix: [] });
    });

    it('should take the first PATH directory that has a spawnable claude', () => {
      const firstDir = makeBinDir('first');
      const secondDir = makeBinDir('second');
      const firstClaude = makeFile(firstDir, 'claude.exe');
      makeFile(secondDir, 'claude.exe');

      const launch = resolveClaudeLaunch({
        env: envWithPath([firstDir, secondDir]),
        platform: 'win32',
      });

      expect(launch.executable).toBe(firstClaude);
    });

    it('should honour PATHEXT order within one directory (default: .COM before .EXE)', () => {
      const binDir = makeBinDir('bin');
      const claudeCom = makeFile(binDir, 'claude.com');
      makeFile(binDir, 'claude.exe');

      const launch = resolveClaudeLaunch({ env: envWithPath([binDir]), platform: 'win32' });

      expect(launch.executable).toBe(claudeCom);
    });

    it('should fall back to the default PATHEXT list when env has none', () => {
      const binDir = makeBinDir('bin');
      const claudeExe = makeFile(binDir, 'claude.exe');
      const env = envWithPath([binDir]);
      delete env.PATHEXT;

      const launch = resolveClaudeLaunch({ env, platform: 'win32' });

      expect(launch.executable).toBe(claudeExe);
    });

    it('should skip empty PATH entries and strip surrounding quotes from quoted ones', () => {
      const binDir = makeBinDir('quoted dir with spaces');
      const claudeExe = makeFile(binDir, 'claude.exe');
      const env: NodeJS.ProcessEnv = {
        PATH: ['', `"${binDir}"`, ''].join(path.delimiter),
      };

      const launch = resolveClaudeLaunch({ env, platform: 'win32' });

      expect(launch.executable).toBe(claudeExe);
    });

    it('should throw naming the found file when it is not directly spawnable (e.g. only a .ps1)', () => {
      const binDir = makeBinDir('bin');
      makeFile(binDir, 'claude.ps1');

      expect(() =>
        resolveClaudeLaunch({
          env: envWithPath([binDir], '.COM;.EXE;.BAT;.CMD;.PS1'),
          platform: 'win32',
        })
      ).toThrow(/claude\.ps1/);
    });
  });

  describe('on win32 with only the legacy npm claude.cmd shim (D4)', () => {
    /** Lay out npm's global-prefix structure: <dir>/claude.cmd + <dir>/node_modules/@anthropic-ai/claude-code/ */
    function makeNpmShimLayout(binJson: string | undefined): {
      npmDir: string;
      packageDir: string;
    } {
      const npmDir = makeBinDir('npm-prefix');
      makeFile(npmDir, 'claude.cmd');
      const packageDir = path.join(npmDir, 'node_modules', '@anthropic-ai', 'claude-code');
      fs.mkdirSync(packageDir, { recursive: true });
      if (binJson !== undefined) {
        fs.writeFileSync(path.join(packageDir, 'package.json'), binJson);
      }
      return { npmDir, packageDir };
    }

    it('should spawn process.execPath + the JS bin entry instead of the .cmd shim (object bin form)', () => {
      const { npmDir, packageDir } = makeNpmShimLayout(
        JSON.stringify({ name: '@anthropic-ai/claude-code', bin: { claude: 'cli.js' } })
      );
      makeFile(packageDir, 'cli.js');

      const launch = resolveClaudeLaunch({ env: envWithPath([npmDir]), platform: 'win32' });

      expect(launch).toEqual({
        executable: process.execPath,
        argsPrefix: [path.join(packageDir, 'cli.js')],
      });
    });

    it('should also accept the plain-string bin form', () => {
      const { npmDir, packageDir } = makeNpmShimLayout(
        JSON.stringify({ name: '@anthropic-ai/claude-code', bin: 'cli.js' })
      );
      makeFile(packageDir, 'cli.js');

      const launch = resolveClaudeLaunch({ env: envWithPath([npmDir]), platform: 'win32' });

      expect(launch.argsPrefix).toEqual([path.join(packageDir, 'cli.js')]);
    });

    it('should throw with install guidance when the package is missing beside the shim', () => {
      const npmDir = makeBinDir('npm-prefix');
      const shimPath = makeFile(npmDir, 'claude.cmd');

      expect(() => resolveClaudeLaunch({ env: envWithPath([npmDir]), platform: 'win32' })).toThrow(
        new RegExp(`${shimPath.replaceAll('\\', '\\\\')}[\\s\\S]*native installer or winget`)
      );
    });

    it('should throw when the package.json has no claude bin entry', () => {
      makeNpmShimLayout(JSON.stringify({ name: '@anthropic-ai/claude-code' }));

      expect(() =>
        resolveClaudeLaunch({
          env: envWithPath([path.join(tmpDir, 'npm-prefix')]),
          platform: 'win32',
        })
      ).toThrow(/bin/);
    });

    it('should throw when the bin entry names a file that does not exist', () => {
      makeNpmShimLayout(
        JSON.stringify({ name: '@anthropic-ai/claude-code', bin: { claude: 'cli.js' } })
      );

      expect(() =>
        resolveClaudeLaunch({
          env: envWithPath([path.join(tmpDir, 'npm-prefix')]),
          platform: 'win32',
        })
      ).toThrow(/cli\.js/);
    });
  });

  describe('on POSIX', () => {
    it('should resolve claude on PATH to its absolute path with no args prefix', () => {
      const binDir = makeBinDir('bin');
      const claude = makeFile(binDir, 'claude', 0o755);

      const launch = resolveClaudeLaunch({ env: envWithPath([binDir]), platform: 'linux' });

      expect(launch).toEqual({ executable: claude, argsPrefix: [] });
    });

    // The execute bit only exists on POSIX hosts — on Windows fs.accessSync(X_OK)
    // degrades to an existence check, so this test would not exercise anything there.
    it.skipIf(process.platform === 'win32')(
      'should skip a non-executable claude file and keep walking the PATH',
      () => {
        const nonExecDir = makeBinDir('non-exec');
        const execDir = makeBinDir('exec');
        makeFile(nonExecDir, 'claude', 0o644);
        const executable = makeFile(execDir, 'claude', 0o755);

        const launch = resolveClaudeLaunch({
          env: envWithPath([nonExecDir, execDir]),
          platform: 'linux',
        });

        expect(launch.executable).toBe(executable);
      }
    );
  });

  describe('when claude is not installed', () => {
    it('should throw with clear install guidance', () => {
      const emptyDir = makeBinDir('empty');

      expect(() =>
        resolveClaudeLaunch({ env: envWithPath([emptyDir]), platform: 'win32' })
      ).toThrow(/not found on PATH[\s\S]*native installer or winget/);
    });

    it('should throw rather than resolve anything when PATH is entirely absent', () => {
      expect(() => resolveClaudeLaunch({ env: {}, platform: 'linux' })).toThrow(
        /not found on PATH/
      );
    });
  });
});
