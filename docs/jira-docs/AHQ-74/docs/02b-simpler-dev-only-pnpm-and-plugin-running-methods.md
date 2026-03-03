# Document 2b: Simpler Dev-Only pnpm and Plugin Running Methods

**AHQ-74 Deliverable**
**Date:** 2026-03-02

---

## TL;DR

The whole document boils down to a small implementation:

1. **Add 1 line** to `bin/agentic-hq.cjs`: `process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');`
2. **Create a small Config class** (~30 lines) that reads that env var (falls back to `git rev-parse` for existing workflows that bypass the binary)
3. **Mechanical replacements** in `ClaudeCodeTool.ts` and demo CLIs: swap `getProjectRoot()` for the right Config method (`getAgenticHqWorkspaceRoot()` for plugins, `getCurrentWorkspaceRoot()` for user's project)
4. **Run `pnpm link --global`** (one-time setup — creates global symlink to live source)
5. **Go to any directory, run `agentic-hq`** — it works, using live source, with instant feedback on code changes

No Verdaccio, no marketplace, no publishing step, no build step. Everything already in place — CJS binary resolves `__dirname` through symlinks, absolute `--plugin-dir` paths work from any workspace (tested), ts-workflow `cd` command brings execution back to the right directory. The rest of this document is the research that got us here.

---

## Purpose

Document 2a (claude-code-marketplace-plugins-and-publishing-research.md) explored the full publishing architecture: Verdaccio, marketplace, 4-level progression. That research is valuable for the future but it raised a crucial question:

**Do we actually need any of that for dev mode?**

This document researches the simpler alternative: `pnpm link --global` + absolute `--plugin-dir` paths. The goal is zero deployment friction — edit code, re-run, see changes instantly. No Verdaccio, no marketplace, no publishing step.

---

## The Core Insight

Steve tested this on 2026-03-02 and it worked:

```
$ pwd
/tmp/temp-workspaces/temp-ws-001

$ claude --plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin

# Claude Code started, found the plugin, ran /agentic-hq-core-plugin:self-termination successfully
```

**What this proves:** Absolute `--plugin-dir` paths work from any workspace. No marketplace installation needed. No plugin caching needed. The plugin is used in-place from the agentic-hq workspace.

Combined with `pnpm link --global` for the CLI binary, this gives us everything we need for dev mode with zero deployment friction.

---

## Part 1: How `pnpm link --global` Works

### What Happens When You Run It

```bash
cd /Users/stevepersonal/dev/agentic-hq/agentic-hq
pnpm install          # Install dependencies first (required)
pnpm link --global    # Create global symlink
```

Step by step:

1. pnpm reads `package.json` to find the package name and `bin` entries
2. Creates a **symlink** (not a copy!) in the global `node_modules`:
   - `~/.local/share/pnpm/global/5/node_modules/agentic-hq` -> `/Users/stevepersonal/dev/agentic-hq/agentic-hq`
3. For each `bin` entry, creates a symlink in the global bin directory:
   - `~/.pnpm/_bin/agentic-hq` -> `/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs`

That's it. Symlinks all the way. No files copied. No packages built.

### Why This Gives Us Live Code

When a developer types `agentic-hq` from any directory:

1. Shell finds `~/.pnpm/_bin/agentic-hq` (on PATH)
2. Follows symlink to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs`
3. `bin/agentic-hq.cjs` uses `__dirname` to find tsx and the CLI entry point
4. **`__dirname` resolves to the REAL location** (through symlinks), not the global bin directory
5. So it runs: `tsx /Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/agentic-hq-cli.ts`
6. All TypeScript source files are the live files in the workspace

**Edit `ClaudeCodeTool.ts`, save, run `agentic-hq` again — the change is picked up instantly.** No build step, no publish step, no install step.

### How `bin/agentic-hq.cjs` Bootstraps

Looking at the current file:

```javascript
const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.join(__dirname, '..', 'src', 'cli', 'agentic-hq-cli.ts');

execFileSync(tsxPath, [cliPath, ...process.argv.slice(2)], { stdio: 'inherit' });
```

All paths are relative to `__dirname` (the `bin/` directory). Since `__dirname` resolves through symlinks to the real agentic-hq workspace:
- `tsxPath` = `/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.bin/tsx` (correct)
- `cliPath` = `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/agentic-hq-cli.ts` (correct)

**No changes needed to the `bin/agentic-hq.cjs` bootstrapping logic for this to work.** (The only addition is setting the `AGENTIC_HQ_WORKSPACE_ROOT` env var — see Part 7.)

### What About Dependencies?

Since the global link is a symlink to the project directory, Node.js resolves `node_modules` from the original project directory:

| Scenario | What Happens |
|----------|-------------|
| Developer adds a new dependency (`pnpm add some-package`) | Automatically available next run — `node_modules` is in the project directory, and the symlink points there |
| Developer removes a dependency | Same — instantly reflected |
| Developer runs `pnpm install` after pulling changes | Dependencies updated in place, globally-linked binary picks them up |
| Developer does NOT need to re-run `pnpm link --global` | Correct — the symlink still points to the same directory |

**Only time you need to re-run `pnpm link --global`:**
- If the `bin` entry in `package.json` changes
- If the project directory is moved/renamed

### `pnpm install` Is Required First

`pnpm link --global` does NOT install dependencies. It only creates symlinks. The workflow is:

```bash
pnpm install          # Populates node_modules
pnpm link --global    # Creates global symlink to project
```

If `pnpm install` is skipped, the binary will fail with `Cannot find module` errors at runtime.

---

## Part 2: Absolute `--plugin-dir` Paths (Eliminating Marketplace for Dev Mode)

### The Current Problem

`ClaudeCodeTool.ts` resolves plugin directories using `getProjectRoot()`:

```typescript
// src/utils/git/git-utils.ts
export function getProjectRoot(): string {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}

// src/tools/claude-code/ClaudeCodeTool.ts
const projectRoot = getProjectRoot();
const fullArgs = [
  `--plugin-dir=${path.join(projectRoot, '.agentic-hq/plugins/agentic-hq-core-plugin')}`,
  `--plugin-dir=${path.join(projectRoot, '.agentic-hq/plugins/agentic-hq-demos-plugin')}`,
  `--plugin-dir=${path.join(projectRoot, '.agentic-hq/plugins/agentic-hq-utilities-plugin')}`,
];
```

`git rev-parse --show-toplevel` returns the root of the **nearest git repository** — which is the **user's workspace**, not the agentic-hq workspace.

**If a developer runs `agentic-hq` from `/Users/alice/my-project/`:**

```
getProjectRoot() returns: /Users/alice/my-project/
Plugin path constructed: /Users/alice/my-project/.agentic-hq/plugins/agentic-hq-core-plugin
That directory doesn't exist!
Result: "Unknown skill" error
```

### The Fix: Derive Agentic-HQ Root From `__dirname`

Since `__dirname` resolves through symlinks to the real agentic-hq location, we can derive the workspace root from the binary's location:

```
__dirname in bin/agentic-hq.cjs = /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin
path.join(__dirname, '..') = /Users/stevepersonal/dev/agentic-hq/agentic-hq (the workspace root!)
```

This value can be passed through to `ClaudeCodeTool` so it knows where the agentic-hq workspace is, regardless of where the user is running from.

**Two options for passing this value:**

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A: Environment variable** | Binary sets `AGENTIC_HQ_WORKSPACE_ROOT` before launching CLI | Explicit, configurable, easy to override | One more env var |
| **B: `__dirname`-based detection** | CLI derives it from its own file location using `import.meta.url` | Zero-config, automatic | Hardcoded assumption about directory structure |

**Recommendation:** Option A (environment variable) is cleaner. The binary is the right place to know where the workspace is, and passing it via env var is a clean contract between the binary and the rest of the code. See Part 7 for the full solution using an `AgenticHqConfig` class that reads this env var with a `git rev-parse` fallback for direct invocations.

### How the Plugin Paths Would Work

With the workspace root known, `ClaudeCodeTool` constructs absolute plugin paths:

```
--plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin
--plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin
--plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-utilities-plugin
```

These are the **live plugin directories** in the agentic-hq workspace. Edit a `SKILL.md`, edit a command `.md` file, re-run — changes are instant.

**Steve's test on 2026-03-02 confirms this works.** Running `claude --plugin-dir=/absolute/path/to/plugin` from a completely different workspace successfully found and executed the plugin.

### No Marketplace Needed for Dev Mode

With absolute `--plugin-dir` paths:
- No `claude plugin marketplace add` step
- No `claude plugin install` step
- No `~/.claude/plugins/cache/` involvement
- No plugin copying or caching
- Plugins used in-place from live source

**Marketplace is still valuable for the future** (when agentic-hq is published to npm and plugins need to be distributed), but for dev mode it's unnecessary complexity.

---

## Part 3: The ts-Workflow Dependency Chain

### How It Works Today

The string reversal ts-workflow has:
```json
{
  "dependencies": {
    "agentic-hq": "file:../../../../../.."
  }
}
```

When the skill runs, the command is:
```bash
cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow \
  && pnpm install --ignore-workspace \
  && pnpm demo:string-reversal
```

### Does This Work When Running From Another Workspace?

**Yes.** Here's why:

1. `agentic-hq` runs from the user's workspace (e.g., `/tmp/temp-ws-001/`)
2. It calls ClaudeCodeTool, which spawns Claude with absolute `--plugin-dir` paths
3. Claude reads the skill from the agentic-hq workspace
4. The skill returns a command that `cd`s to the ts-workflow directory **in the agentic-hq workspace**
5. `pnpm install --ignore-workspace` runs in that directory
6. `file:../../../../../..` resolves relative to the ts-workflow's **physical location** = the agentic-hq workspace root
7. The `agentic-hq` module resolves correctly

**The key insight:** The `cd` command in the skill output brings execution back to the agentic-hq workspace. The relative `file:` path works because it's relative to the file's physical location, not the user's cwd.

### Should We Switch `file:` to `link:`?

Per Document 2a's research, switching from `file:` to `link:` is a strict improvement:

| Aspect | `file:` (current) | `link:` (proposed) |
|--------|-------------------|-------------------|
| Mechanism | Hard links (copies files) | Symlink |
| Disk usage | 90MB copy in node_modules | Zero (just a symlink pointer) |
| See source changes | Must re-run `pnpm install` | Instant |

For dev mode, `link:` is clearly better — but this change is independent of the cross-workspace work. It can be done as part of AHQ-61's replacement Jira.

---

## Part 4: Two Setup Scripts — One Binary Name

### The Approach: Always `agentic-hq`, Toggle With Setup Scripts

Instead of having two different binary names, the binary is always called `agentic-hq`. Two setup scripts toggle which version is globally installed:

| Setup Script | What It Does | `agentic-hq` Points To |
|-------------|-------------|----------------------|
| `switch-agentic-hq-to-dev` | `pnpm install && pnpm link --global` | Live source (symlink) |
| `switch-agentic-hq-to-prod` (later) | Verdaccio publish + `pnpm add -g agentic-hq` | Published package |

They're **mutually exclusive** — running one replaces whatever the other set up. This is intentional:

- Running `switch-agentic-hq-to-dev` creates a symlink at `~/.local/share/pnpm/global/5/node_modules/agentic-hq` → your source directory
- Running `switch-agentic-hq-to-prod` replaces that symlink with the actual published package from Verdaccio
- Want to go back to dev? Run `switch-agentic-hq-to-dev` again

The command on PATH is always `agentic-hq`. The setup script determines what it points to.

### No Changes Needed in `package.json`

The existing `bin` entry stays exactly as it is:

```json
{
  "bin": {
    "agentic-hq": "bin/agentic-hq.cjs"
  }
}
```

No renaming needed. Both setup modes use the same binary name.

### The `switch-agentic-hq-to-dev` Setup Script

For a developer who clones the repo:

```bash
#!/bin/bash
# scripts/infra/switch-agentic-hq-to-dev.sh
# Sets up agentic-hq CLI for local development (live source)

set -e

echo "Installing dependencies..."
pnpm install

echo "Creating global symlink for agentic-hq..."
pnpm link --global

echo ""
echo "Done! 'agentic-hq' now points to live source at: $(pwd)"
echo "Edit code, save, run agentic-hq — changes are instant."
echo ""
echo "Try it:"
echo "  cd /tmp && agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal"
```

That's it. Two commands. Compare to the Verdaccio setup script in Document 2a (7 steps including starting a local npm server, auto-creating users, version bumping, publishing, global installing, marketplace registering, and plugin installing).

### The `switch-agentic-hq-to-prod` Setup Script (Later — When Verdaccio Is Set Up)

```bash
#!/bin/bash
# scripts/infra/switch-agentic-hq-to-prod.sh
# Sets up agentic-hq CLI from Verdaccio (tests real packaging)

set -e

# Start Verdaccio if not running, publish package, install globally
# (Details to be worked out when Verdaccio support is implemented)
pnpm add -g agentic-hq --registry http://localhost:4873

echo ""
echo "Done! 'agentic-hq' now points to the published package from Verdaccio."
echo "To switch back to dev mode, run: scripts/infra/switch-agentic-hq-to-dev.sh"
```

### Why This Is Better Than Two Binary Names

The original approach was to rename the `bin` entry to `switch-agentic-hq-to-dev` so both could coexist. But as Steve identified, there's a simpler symmetry:

| Concern | Two binary names | Two setup scripts (this approach) |
|---------|-----------------|----------------------------------|
| Package name in package.json | Stays `agentic-hq` | Stays `agentic-hq` |
| `bin` entry in package.json | Must change to `switch-agentic-hq-to-dev` | No change needed |
| Command on PATH | `switch-agentic-hq-to-dev` (dev) vs `agentic-hq` (prod) | Always `agentic-hq` |
| Can both exist simultaneously? | Yes, but same package name conflicts in global node_modules | No — mutually exclusive by design |
| Mental model | "Which command am I running?" | "Which setup did I run?" |

The key insight: you never need both simultaneously. You're either in dev mode (editing source, instant feedback) or testing the production flow (validating packaging). The setup scripts are the toggle.

---

## Part 5: The Complete Architecture

### End-to-End Flow: `agentic-hq` String Reversal (After `switch-agentic-hq-to-dev` Setup)

```
Developer's terminal (from /Users/alice/her-project/):

$ agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal \
    -- --string-to-reverse="hello"
```

**Step 1: Shell resolves `agentic-hq`**
```
~/.pnpm/_bin/agentic-hq  (symlink)
  -> /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs  (real file)
```

**Step 2: `bin/agentic-hq.cjs` bootstraps**
```
__dirname = /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin  (resolved through symlink)
tsx = /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.bin/tsx
cli = /Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/agentic-hq-cli.ts
-> Sets AGENTIC_HQ_WORKSPACE_ROOT=/Users/stevepersonal/dev/agentic-hq/agentic-hq
-> Runs: tsx agentic-hq-cli.ts --workflow-command-supplier=...
```

**Step 3: CLI calls ClaudeCodeTool to get workflow command from skill**
```
ClaudeCodeTool uses AgenticHqConfig (reads AGENTIC_HQ_WORKSPACE_ROOT env var)
Spawns: claude \
  --plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin \
  --plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin \
  --plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-utilities-plugin \
  "/agentic-hq-demos-plugin:string-reversal <io-dir-path>"
```

**Step 4: Claude reads the skill, returns a command**
```
Skill output: "cd /Users/.../ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal"
```

**Step 5: CLI runs the command**
```
bash -c "cd /Users/.../ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- --string-to-reverse=hello"
```

**Step 6: ts-workflow runs**
```
pnpm install resolves agentic-hq from file:../../../../../.. (the live workspace root)
demo:string-reversal imports ClaudeCodeTool from the live workspace
ClaudeCodeTool runs Claude with --plugin-dir pointing to live plugins
Claude executes the reverse-a-string command
Result: "olleh"
```

**Every single file in this chain is live source.** Edit any of them, re-run, changes take effect.

### Architecture Diagram

```
Developer types: agentic-hq (from ANY directory, after switch-agentic-hq-to-dev setup)
       |
       v
~/.pnpm/_bin/agentic-hq  ──symlink──>  bin/agentic-hq.cjs
                                                    |
                                            __dirname resolves to
                                            agentic-hq workspace root
                                                    |
                                                    v
                                     src/cli/agentic-hq-cli.ts (LIVE)
                                                    |
                                            ClaudeCodeTool (LIVE)
                                                    |
                                    --plugin-dir = absolute paths to
                                    agentic-hq workspace plugins (LIVE)
                                                    |
                                                    v
                                     Claude Code loads plugins in-place
                                     Skill returns command with cd to
                                     ts-workflow in agentic-hq workspace
                                                    |
                                                    v
                                     ts-workflow runs with file:/link:
                                     dependency pointing to workspace root
                                     Imports ClaudeCodeTool (LIVE)

Everything = LIVE source. Zero publish/install/cache steps.
```

---

## Part 6: Why Not Verdaccio On Every Run?

Steve asked whether the dev setup should just run the Verdaccio publish+install cycle every time.

**This is not a good idea.** Here's why:

| Aspect | `pnpm link --global` | Verdaccio on every run |
|--------|---------------------|----------------------|
| **Time per invocation** | Instant (~0ms overhead) | ~20-90 seconds (pack + publish + install) |
| **Complexity** | 2 setup commands, then done forever | Verdaccio must be running, auth must be configured, version must be bumped each time |
| **Live code changes** | Instant — symlink points to live source | Only after republishing |
| **Plugin changes** | Instant — `--plugin-dir` points to live source | Would need to re-register marketplace + reinstall plugins |
| **Network dependency** | None | Verdaccio must be running on localhost |
| **Error surface** | Minimal (symlink or not) | Many things can fail (Verdaccio down, auth expired, version conflict, publish error) |

The whole point of dev mode is instant feedback. Adding a 20-90 second publish cycle to every invocation defeats the purpose entirely.

**Verdaccio is valuable for a different purpose:** testing that the published package actually works (the `files` whitelist is correct, `bin` entry symlinks properly, `exports` map resolves, etc.). That's what `setup.sh --env=local-npm` is for in Document 2a — a deliberate "test the packaging" step, not something you run on every invocation.

---

## Part 7: The `getProjectRoot()` Problem — Three Roots, Not One

### Current Behavior

```typescript
// src/utils/git/git-utils.ts
export function getProjectRoot(): string {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}
```

This returns the nearest git root relative to the **current working directory**. Today it's used everywhere, but it's actually serving **three different purposes** that happen to return the same value only because development happens inside the agentic-hq repo.

### The Three Roots

| Root | What it means | Example (dev inside agentic-hq) | Example (agentic-hq from user's project, after dev setup) |
|------|--------------|-------------------------------|---------------------------------------------|
| **Agentic-HQ workspace root** | Where the agentic-hq source, plugins, and tooling live | `/Users/steve/dev/agentic-hq/agentic-hq` | `/Users/steve/dev/agentic-hq/agentic-hq` (fixed — from `__dirname`) |
| **Current workspace root** | The git root of the directory the user is running from | `/Users/steve/dev/agentic-hq/agentic-hq` | `/Users/alice/her-project` (from `git rev-parse`) |
| **Project working directory** | Where the developer wants Claude to make code changes | `/Users/steve/dev/agentic-hq/agentic-hq` | `/Users/alice/her-project` (same as workspace root for now) |

Today all three are the same. When running `agentic-hq` from a different workspace (after `switch-agentic-hq-to-dev` setup), the first one diverges from the other two.

### Where Each Root Is Needed

**In `ClaudeCodeTool.ts`** — uses `getProjectRoot()` for three things that need **two different roots**:

| Usage | Code | Which root it actually needs |
|-------|------|------------------------------|
| Plugin paths | `path.join(projectRoot, '.agentic-hq/plugins/...')` | **Agentic-HQ workspace root** — plugins live in the agentic-hq source |
| CWD for Claude | `cwd: projectRoot` | **Current workspace root** — Claude should operate on the user's files |
| Temp I/O directory | `path.join(getProjectRoot(), '.agentic-hq/temp/...')` | **Current workspace root** — temp files belong to the user's workflow session |

**In the demo CLIs** (`quick-jira-workflow-demo-cli.ts`, `full-jira-tdd-story-workflow-demo-cli.ts`):

| Usage | Code | Which root it actually needs |
|-------|------|------------------------------|
| Project root for workflow commands | `options.projectRoot ?? getProjectRoot()` | **Current workspace root** — tells Claude which project to work on |

### The Fix: The New AgenticHqConfig Class With Explicit Methods

Rather than having one ambiguous `getProjectRoot()` function, create a AgenticHqConfig class that makes the intent explicit:

```typescript
class AgenticHqConfig {
  /** Where the agentic-hq source code, plugins, and tooling live.
   *  Derived from the binary's __dirname (resolved through symlinks).
   *  Fixed regardless of where the user runs from. 
   * NOTE: Returns value of AGENTIC_HQ_WORKSPACE_ROOT env var if that is set (see below). */
  getAgenticHqWorkspaceRoot(): string

  /** Convenience: the plugins directory within the agentic-hq workspace.
   *  Returns getAgenticHqWorkspaceRoot() + '/.agentic-hq/plugins' */
  getAgenticHqPluginsDir(): string

  /** The git root of the directory the user is currently running from.
   *  Uses git rev-parse --show-toplevel.
   *  NOTE: Could be changed to be just the current working directory where the original command was run in (this is what Claude Code uses) */
  getCurrentWorkspaceRoot(): string

  /** Where temp files (command I/O, logs, etc.) are stored.
   *  Returns getCurrentWorkspaceRoot() + '/.agentic-hq/temp' */
  getAgenticHqTempDir(): string

  /** The directory where Claude should make code changes.
   *  Currently returns getCurrentWorkspaceRoot(), but having it as a
   *  separate method retains optionality for future scenarios where
   *  the project being worked on differs from the Current Workspace Root. */
  getProjectWorkingDir(): string
}
```

**Why separate methods matter for future optionality:**

- `getProjectWorkingDir()` returns `getCurrentWorkspaceRoot()` today, but could later accept a `--project-root` flag or configuration to point to a different project
- `getAgenticHqTempDir()` returns a path under the current workspace today, but could later be configurable (e.g., `/tmp/agentic-hq/` for CI environments)
- `getAgenticHqPluginsDir()` could later support multiple plugin directories or marketplace-cached plugins

**How the agentic-hq workspace root gets set:**

The `bin/agentic-hq.cjs` entry point is the one place that knows the true location (via `__dirname`, which resolves through symlinks). It sets this before launching the TypeScript CLI:

```javascript
// bin/agentic-hq.cjs (CommonJS — __dirname works here)
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');
```

**Note on `__dirname` in ESM/TypeScript:** `__dirname` is NOT available in ESM modules (`"type": "module"`). The TypeScript code (run via tsx) would need `import.meta.url` instead. But since `bin/agentic-hq.cjs` is a CJS file, `__dirname` works there — and passing it as an env var means the TypeScript code never needs to worry about it.

The AgenticHqConfig class reads the env var **with a fallback for direct invocations:**

```typescript
getAgenticHqWorkspaceRoot(): string {
  const root = process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  if (root) {
    return root;  // Running via agentic-hq binary (set by bin/agentic-hq.cjs)
  }
  // Fallback: running directly from within the agentic-hq workspace
  // (e.g., pnpm demo:*, pnpm test:*, tsx src/demo/cli/..., etc.)
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}
```

**Why the fallback is needed:** Many code paths bypass the `bin/agentic-hq.cjs` binary and therefore won't have `AGENTIC_HQ_WORKSPACE_ROOT` set. These include:

| Script | How it runs | Has env var? |
|--------|------------|-------------|
| `pnpm demo:agentic-hq-cli:string-reversal` | `node bin/agentic-hq.cjs` | YES — goes through binary |
| `pnpm demo:full-jira-tdd-story-workflow` | `tsx src/demo/cli/...` | NO — direct tsx, bypasses binary |
| `pnpm demo:quick-jira-workflow` | `tsx src/demo/cli/...` | NO — direct tsx, bypasses binary |
| `pnpm demo:math-workflow` | `tsx src/demo/cli/...` | NO — direct tsx, bypasses binary |
| Integration tests | `new ClaudeCodeTool()` directly | NO — test instantiates directly |
| E2e tests via CLI | `node bin/agentic-hq.cjs` | YES — goes through binary |

The fallback to `git rev-parse` is safe for these cases because they are **always run from within the agentic-hq workspace** (via `pnpm` scripts in the repo). The `git rev-parse` correctly returns the agentic-hq root in this case — which is the same behavior as today.

**Summary:** Env var when available (running from another workspace via binary), `git rev-parse` fallback when not (running directly from within the agentic-hq workspace). Zero breakage for existing workflows.

### How This Changes `ClaudeCodeTool.ts`

Before (one ambiguous root):
```typescript
const projectRoot = getProjectRoot();
// Used for plugins (needs agentic-hq root)
// AND cwd for Claude (needs user's root)
// AND temp dir (needs user's root)
```

After (explicit roots via AgenticHqConfig):
```typescript
const config = new AgenticHqConfig();

// Plugins — from agentic-hq workspace (fixed, regardless of user's cwd)
const pluginArgs = [
  `--plugin-dir=${path.join(config.getAgenticHqPluginsDir(), 'agentic-hq-core-plugin')}`,
  `--plugin-dir=${path.join(config.getAgenticHqPluginsDir(), 'agentic-hq-demos-plugin')}`,
  `--plugin-dir=${path.join(config.getAgenticHqPluginsDir(), 'agentic-hq-utilities-plugin')}`,
];

// CWD for Claude — user's workspace (where their code is)
cwd: config.getProjectWorkingDir(),

// Temp I/O — in the user's workspace
const ioDir = path.join(config.getAgenticHqTempDir(), 'command-input-output-files', ...);
```

Each call site is now self-documenting. No ambiguity about which root is being used.

---

## Part 8: What Changes Are Needed

### Summary of Changes for Cross-Workspace Support

| Change | File(s) | Complexity |
|--------|---------|-----------|
| Set `AGENTIC_HQ_WORKSPACE_ROOT` env var in binary | `bin/agentic-hq.cjs` | Small |
| Create `AgenticHqConfig` class with explicit root methods | New `src/config/agentic-hq-config.ts` | Medium |
| Replace `getProjectRoot()` calls in ClaudeCodeTool with Config methods | `ClaudeCodeTool.ts` | Medium |
| Replace `getProjectRoot()` calls in demo CLIs with Config methods | `full-jira-tdd-story-workflow-demo-cli.ts`, `quick-jira-workflow-demo-cli.ts` | Small |
| `switch-agentic-hq-to-dev` setup script: `pnpm install && pnpm link --global` | New `scripts/infra/switch-agentic-hq-to-dev.sh` | Small |

**Total effort:** Medium. The Config class is the main new piece. ClaudeCodeTool changes are mostly mechanical — replacing one function call with the right Config method. No changes needed to `package.json` — the `bin` entry stays as `agentic-hq`.

### What Does NOT Need to Change

- `package.json` `bin` entry (stays as `"agentic-hq": "bin/agentic-hq.cjs"`)
- `bin/agentic-hq.cjs` bootstrapping logic (already uses `__dirname` correctly — only addition is the env var line)
- Plugin structure (already works with absolute `--plugin-dir`)
- Skill definitions (already use skill base directory)
- ts-workflow dependency resolution (`file:` relative paths work from physical location)
- CLI argument parsing (Commander setup stays the same)

---

## Part 9: Comparison — Dev Mode (`pnpm link`) vs Verdaccio Approach

| Aspect | Dev mode via `switch-agentic-hq-to-dev` setup (this document) | Verdaccio via `switch-agentic-hq-to-prod` setup (Document 2a) |
|--------|----------------------------------|------------------------|
| **Setup steps** | `pnpm install && pnpm link --global` | Start Verdaccio, create user, bump version, publish, global install, register marketplace, install 3 plugins |
| **Setup time** | ~30 seconds | ~2-5 minutes |
| **Code change feedback** | Instant | Re-publish required (~20-90s) |
| **Plugin change feedback** | Instant | Re-install plugins from marketplace |
| **Complexity** | Minimal — just symlinks | Significant — local npm server, auth, versioning |
| **Dependencies** | pnpm (already required) | pnpm + Verdaccio |
| **Tests real packaging?** | No — that's not its purpose | Yes — validates files whitelist, bin entry, exports |
| **Works for published npm?** | No — dev mode only | Yes — stepping stone to real npm |
| **Audience** | Developer who cloned the repo | Same, but also validates packaging |

**These are complementary, not competing.** Dev mode (via `switch-agentic-hq-to-dev` setup) is for daily development. Verdaccio (via `switch-agentic-hq-to-prod` setup) is for testing the packaging before you publish to npm. Both result in the same `agentic-hq` command on PATH — the setup scripts toggle which version it points to.

**For the path to AHQ-76/AHQ-43, dev mode should come first** because:
1. It's simpler to implement
2. It delivers the developer experience immediately
3. It doesn't require solving the `private: true`, `files` whitelist, or Verdaccio auth problems yet
4. Verdaccio can be added later as a "packaging validation" step

---

## Differences From Document 2a's Assumptions

1. **Marketplace not needed for dev mode.** Absolute `--plugin-dir` paths work from any workspace. Steve tested this on 2026-03-02.

2. **Verdaccio not needed for dev mode.** `pnpm link --global` provides instant live code execution with zero publishing overhead.

3. **`getProjectRoot()` conflates three different roots.** It's used for the agentic-hq workspace (plugins), the user's workspace (temp files, Claude CWD), and the project working directory (where Claude makes changes). These are the same today but diverge when running from another workspace. The fix is an `AgenticHqConfig` class with explicit methods for each root (see Part 7).

4. **Setup is dramatically simpler.** Two commands (`pnpm install && pnpm link --global`) vs seven steps in the Verdaccio approach.

5. **The Verdaccio approach from Document 2a is still valuable** — just for a different purpose (validating packaging before npm publish). It becomes relevant when moving from Level 1 (dev) to Level 2 (local npm) to Level 3/4 (public npm).

---

## Things To Discuss

### Discussion Point 1: The `AgenticHqConfig` Class Approach

Steve proposed (during discussion) replacing the single ambiguous `getProjectRoot()` with an `AgenticHqConfig` class that has explicit methods for each root (see Part 7). The proposed methods are:

| Method | Returns | Source |
|--------|---------|--------|
| `getAgenticHqWorkspaceRoot()` | Where agentic-hq source + plugins live | `AGENTIC_HQ_WORKSPACE_ROOT` env var (set by `bin/agentic-hq.cjs` from `__dirname`) |
| `getAgenticHqPluginsDir()` | Plugin directory | `getAgenticHqWorkspaceRoot() + '/.agentic-hq/plugins'` |
| `getCurrentWorkspaceRoot()` | Git root of user's cwd | `git rev-parse --show-toplevel` |
| `getAgenticHqTempDir()` | Temp files for command I/O | `getCurrentWorkspaceRoot() + '/.agentic-hq/temp'` |
| `getProjectWorkingDir()` | Where Claude makes code changes | `getCurrentWorkspaceRoot()` (for now — retains future optionality) |

**Questions for discussion:**

1. Should the Config class be instantiated once and passed around, or be a singleton/static?
2. ~~Should it fail fast (throw) if `AGENTIC_HQ_WORKSPACE_ROOT` is not set, or fall back to `git rev-parse` for backward compatibility when running inside the agentic-hq repo?~~ **RESOLVED:** Fall back to `git rev-parse` — many code paths (demo scripts, tests) bypass the binary and won't have the env var set. See "Why the fallback is needed" in Part 7.
3. The existing `getProjectRoot()` in `git-utils.ts` — should it be removed entirely and replaced by Config methods, or kept as a low-level utility that Config wraps?

Steve's Response:

AI Response:

### Discussion Point 2: Temp Files — In User's Workspace or Agentic-HQ Workspace?

Steve clarified (during discussion) that `.agentic-hq/temp/` I/O files should live in the **user's workspace**, not the agentic-hq source directory. This means when Alice runs `agentic-hq` from `/Users/alice/her-project/` (after `switch-agentic-hq-to-dev` setup):

- Plugin paths → `/Users/steve/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/...` (agentic-hq workspace)
- Temp I/O → `/Users/alice/her-project/.agentic-hq/temp/...` (user's workspace)
- Claude CWD → `/Users/alice/her-project/` (user's workspace)

This creates a `.agentic-hq/temp/` directory in the user's project. Considerations:

1. Should `.agentic-hq/` be added to a recommended `.gitignore` for user projects?
2. Or should temp files go somewhere less intrusive (e.g., `/tmp/agentic-hq/<project-hash>/`)?
3. Is it OK that running `agentic-hq` creates directories in the user's project?

Steve's Response:

AI Response:

### Discussion Point 3: ~~Binary Name~~ — RESOLVED

~~**`switch-agentic-hq-to-dev`** is Steve's current preference.~~

**RESOLVED:** The binary name stays `agentic-hq` always. Instead of two binary names, we use two **setup scripts** (`switch-agentic-hq-to-dev` and `switch-agentic-hq-to-prod`) that toggle which version the single `agentic-hq` command points to. See Part 4 for details. This avoids the conflict problem (same package name in global node_modules) and gives a simpler mental model.

### Discussion Point 4: Impact on AHQ-76 Scope

With the setup scripts approach, the path to AHQ-76 ("agentic-hq CLI Runs String Reversal In A New Dev Workspace") becomes significantly simpler:

**Original AHQ-76 scope (with Verdaccio):**
1. Add `files` whitelist to package.json
2. Remove `private: true`
3. Create Verdaccio setup (start, auth, publish, install)
4. Register marketplace, install plugins
5. Verify binary works from another workspace

**Simplified AHQ-76 scope (with setup scripts approach):**
1. Add env var for workspace root in `bin/agentic-hq.cjs`
2. Create `AgenticHqConfig` class with explicit root methods
3. Update ClaudeCodeTool + demo CLIs to use Config instead of `getProjectRoot()`
4. Create `switch-agentic-hq-to-dev` setup script (`pnpm install && pnpm link --global`)
5. Verify `agentic-hq` works from another workspace after `switch-agentic-hq-to-dev` setup

Should AHQ-76 be simplified to use the setup scripts approach? Or should AHQ-76 still include Verdaccio as originally planned?

Steve's Response:

AI Response:

### Discussion Point 5: ts-Workflow Dependency — Keep `file:` or Switch to `link:`?

The ts-workflow currently uses `"agentic-hq": "file:../../../../../.."`. This works when running from another workspace because the skill command `cd`s to the ts-workflow directory in the agentic-hq workspace.

Switching to `link:` would be a strict improvement (symlink vs 90MB copy). But should this be done:

**Option A:** As part of the cross-workspace support work (since we're touching this area anyway)
**Option B:** Separately, as part of AHQ-61's replacement Jira (keeps scope minimal)

Steve's Response:

AI Response:

---

## Discussion Notes

*(To be filled in after discussion)*
