/**
 * resolveClaudeLaunch — Resolve the `claude` CLI to a spawnable absolute
 * executable + args prefix BEFORE pty.spawn (AHQ-211 D4).
 *
 * SRP Does: A which-style PATH walk (PATHEXT-aware on win32) for the claude
 * executable, classifying what it finds — a real binary is spawned directly;
 * npm's legacy `claude.cmd` shim is unwrapped to `process.execPath` + the
 * package's JS entry. Fails fast with install guidance when nothing
 * spawnable is found.
 *
 * SRP Knows About: PATH/PATHEXT semantics, npm's global-prefix shim layout
 * (`claude.cmd` beside `node_modules/@anthropic-ai/claude-code/`), and
 * process.execPath as the shell-free way to run a JS entry point.
 *
 * SRP Knows Nothing About: Claude's CLI flags, plugin dirs, or I/O
 * marshalling — that's ClaudeCommandBuilder, which calls this at build()
 * time (never earlier: resolution walks the filesystem and must only run —
 * and only fail — when a launch is actually happening).
 *
 * Why this exists: node-pty spawns its executable directly with no shell,
 * so a bare `claude` must become an absolute path, and Windows `.cmd`
 * batch shims — which only cmd.exe can run — must never reach pty.spawn.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const CLAUDE_COMMAND_NAME = 'claude';

// Windows' built-in default, used when PATHEXT is absent from the env.
const WINDOWS_DEFAULT_PATHEXT = '.COM;.EXE;.BAT;.CMD';

// Extensions cmd.exe runs as batch scripts — pty.spawn cannot (D4 branch).
const WINDOWS_BATCH_SHIM_EXTENSIONS = new Set(['.cmd', '.bat']);

// Extensions Windows' CreateProcess runs directly — safe for pty.spawn.
const WINDOWS_DIRECTLY_SPAWNABLE_EXTENSIONS = new Set(['.exe', '.com']);

const INSTALL_GUIDANCE =
  'install Claude Code via the native installer or winget ' +
  '(https://docs.anthropic.com/en/docs/claude-code/setup)';

/** How to spawn claude: the executable plus args that must precede all others. */
export interface ClaudeLaunch {
  executable: string;
  argsPrefix: string[];
}

/**
 * Injectable environment for resolution — a test seam. The `platform`
 * override steers the claude-specific branching (PATHEXT candidates, shim
 * classification, exec-bit checks); PATH is always split on the HOST's
 * delimiter, because the PATH value itself is a host construct (tests build
 * theirs from host tmp directories, and in production host === platform).
 */
export interface ClaudeResolverEnvironment {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

/** Signature of resolveClaudeLaunch, for injection into ClaudeCommandBuilder. */
export type ResolveClaudeLaunchFn = () => ClaudeLaunch;

export function resolveClaudeLaunch({
  env = process.env,
  platform = process.platform,
}: ClaudeResolverEnvironment = {}): ClaudeLaunch {
  const claudePath = locateClaudeOnPath(env, platform);
  if (claudePath === undefined) {
    throw new Error(
      `The '${CLAUDE_COMMAND_NAME}' executable was not found on PATH — ${INSTALL_GUIDANCE}.`
    );
  }
  if (platform !== 'win32') {
    return { executable: claudePath, argsPrefix: [] };
  }
  return classifyWindowsClaude(claudePath);
}

/**
 * Walk the PATH directories in order and return the first spawnable claude,
 * or undefined. On win32 each directory is probed with every PATHEXT
 * extension (in PATHEXT order) since extension-less files aren't executable
 * there; on POSIX the bare name is probed and must carry the execute bit.
 */
function locateClaudeOnPath(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string | undefined {
  const pathValue = env.PATH ?? env.Path ?? '';
  const candidateNames = platform === 'win32' ? windowsCandidateNames(env) : [CLAUDE_COMMAND_NAME];

  for (const rawEntry of pathValue.split(path.delimiter)) {
    // Windows PATH entries are sometimes quoted (cmd.exe strips the quotes;
    // Node's own child_process PATH walk does the same, so we match it)
    const directory = rawEntry.trim().replace(/^"|"$/g, '');
    if (directory === '') {
      continue;
    }
    for (const name of candidateNames) {
      const candidate = path.resolve(directory, name);
      if (isSpawnableFile(candidate, platform)) {
        return candidate;
      }
    }
  }
  return undefined;
}

/** `claude` + each PATHEXT extension, lowercased to match how files are actually named. */
function windowsCandidateNames(env: NodeJS.ProcessEnv): string[] {
  const pathext = env.PATHEXT ?? WINDOWS_DEFAULT_PATHEXT;
  return pathext
    .split(';')
    .map((extension) => extension.trim().toLowerCase())
    .filter((extension) => extension !== '')
    .map((extension) => CLAUDE_COMMAND_NAME + extension);
}

function isSpawnableFile(candidate: string, platform: NodeJS.Platform): boolean {
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    return false;
  }
  if (platform === 'win32') {
    // Executability is extension-based on Windows — no execute bit to check
    return true;
  }
  return hasExecutePermission(candidate);
}

function hasExecutePermission(filePath: string): boolean {
  // A file without the execute bit is "not a match" and the walk continues —
  // that's which(1) semantics, not a swallowed error
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** A found Windows claude is either a real binary (spawn it) or npm's batch shim (unwrap it). */
function classifyWindowsClaude(claudePath: string): ClaudeLaunch {
  const extension = path.extname(claudePath).toLowerCase();
  if (WINDOWS_DIRECTLY_SPAWNABLE_EXTENSIONS.has(extension)) {
    return { executable: claudePath, argsPrefix: [] };
  }
  if (WINDOWS_BATCH_SHIM_EXTENSIONS.has(extension)) {
    return resolveLegacyNpmShimLaunch(claudePath);
  }
  throw new Error(
    `Found '${claudePath}' on PATH, but it is not a directly spawnable executable — ` +
      `${INSTALL_GUIDANCE}.`
  );
}

/**
 * LEGACY-ONLY BRANCH — npm installs of Claude Code are deprecated since
 * v2.1.15 (the CLI self-migrates to the native installer). This exists only
 * so an OLD npm-installed claude — whose PATH entry is a cmd.exe-only
 * `claude.cmd` batch shim that pty.spawn cannot run — still launches, by
 * spawning `process.execPath <js-entry>` directly. Delete this function
 * (and its tests) once nobody runs npm-installed claude any more.
 * Evidence: https://github.com/anthropics/claude-code/releases/tag/v2.1.15
 *           https://vibecodemoonlighter.com/posts/claude-code-npm-to-native-installer
 */
function resolveLegacyNpmShimLaunch(shimPath: string): ClaudeLaunch {
  const packageDir = path.join(
    path.dirname(shimPath),
    'node_modules',
    '@anthropic-ai',
    'claude-code'
  );
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      `Found only npm's batch shim for claude at '${shimPath}', and the ` +
        `@anthropic-ai/claude-code package it wraps is missing beside it ` +
        `(expected '${packageJsonPath}'). npm installs of Claude Code are ` +
        `deprecated — ${INSTALL_GUIDANCE}.`
    );
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const binEntry =
    typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.[CLAUDE_COMMAND_NAME];
  if (binEntry === undefined) {
    throw new Error(
      `'${packageJsonPath}' has no claude bin entry to launch — ${INSTALL_GUIDANCE}.`
    );
  }

  const jsEntryPath = path.join(packageDir, binEntry);
  if (!fs.existsSync(jsEntryPath)) {
    throw new Error(
      `The claude bin entry '${jsEntryPath}' named by '${packageJsonPath}' does not exist — ` +
        `${INSTALL_GUIDANCE}.`
    );
  }
  return { executable: process.execPath, argsPrefix: [jsEntryPath] };
}
