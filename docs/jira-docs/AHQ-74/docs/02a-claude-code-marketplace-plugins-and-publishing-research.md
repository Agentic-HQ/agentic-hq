# Document 2: Claude Code Marketplace, Plugins and Publishing Research

**AHQ-74 Deliverable 2 of 5**
**Date:** 2026-03-01

---

## Purpose

This document covers two interrelated topics:

**Part A** — How Claude Code's plugin and marketplace system works, how the project currently uses it, and what needs to change for AHQ-76.

**Part B** — The npm publishing strategy: what to build now (local dev + Verdaccio) and what to design for later (remote beta + production).

Both topics are essential for AHQ-76 ("agentic-hq CLI Runs String Reversal Single-Step Workflow In A New Dev Workspace"). The developer experience requires plugins to be installed via marketplace AND the `agentic-hq` package to be installed from a registry.

---

# Part A: Claude Code Plugins & Marketplace

## A1. How Plugins Are Loaded Today: `--plugin-dir`

The current approach hardcodes three `--plugin-dir` flags in `ClaudeCodeTool.ts` (lines 37-41, 119-123):

```typescript
const AGENTIC_HQ_CORE_PLUGIN_DIR = '.agentic-hq/plugins/agentic-hq-core-plugin';
const AGENTIC_HQ_DEMOS_PLUGIN_DIR = '.agentic-hq/plugins/agentic-hq-demos-plugin';
const AGENTIC_HQ_UTILITIES_PLUGIN_DIR = '.agentic-hq/plugins/agentic-hq-utilities-plugin';

// In spawnCliViaPty():
const fullArgs = [
  ...this.args,
  `--plugin-dir=${path.join(projectRoot, AGENTIC_HQ_CORE_PLUGIN_DIR)}`,
  `--plugin-dir=${path.join(projectRoot, AGENTIC_HQ_DEMOS_PLUGIN_DIR)}`,
  `--plugin-dir=${path.join(projectRoot, AGENTIC_HQ_UTILITIES_PLUGIN_DIR)}`,
  commandAndArguments,
];
```

**How `--plugin-dir` works:**
- Loads a plugin directory for the duration of a single Claude session
- Plugin is used **in-place** (not cached) — source changes are reflected immediately
- Multiple plugins require multiple `--plugin-dir` flags
- Paths must be absolute (the code resolves them via `getProjectRoot()`)
- Skills are namespaced: `/plugin-name:skill-name`

**Why this works for development:** Fast iteration. Edit a SKILL.md or command, restart Claude, see changes immediately. No install/cache cycle.

**Why this doesn't work for AHQ-76:** When `agentic-hq` is globally installed and running from the developer's own workspace, the plugin directories don't exist at those paths. The plugins need to be installed via the marketplace so Claude Code can find them regardless of where `agentic-hq` is run from.

## A2. How Marketplace Installation Works

Marketplace installation is a two-step process:

### Step 1: Register the marketplace

```bash
# From terminal:
claude plugin marketplace add /path/to/cloned/agentic-hq

# Or from inside Claude Code TUI:
/plugin marketplace add /path/to/cloned/agentic-hq
```

This tells Claude Code about the `marketplace.json` file in the repo. No plugins are installed yet — it just registers the catalog.

**Marketplace sources can be:** local directories, GitHub repos (`owner/repo`), Git URLs, remote URLs, or direct paths to `marketplace.json`. For AHQ-76, a local directory is what we need.

### Step 2: Install individual plugins

```bash
# From terminal:
claude plugin install plugin-name@marketplace-name

# From inside Claude Code TUI:
/plugin install plugin-name@marketplace-name
```

For our setup:
```bash
claude plugin install agentic-hq-core-plugin@agentic-hq-plugins
claude plugin install agentic-hq-demos-plugin@agentic-hq-plugins
claude plugin install agentic-hq-utilities-plugin@agentic-hq-plugins
```

### What happens during install: Plugin caching

When a plugin is installed from a marketplace, Claude Code **copies** the plugin to `~/.claude/plugins/cache/`. Key behaviors:

- Plugins are isolated — they cannot reference files outside their directory after installation (path traversal like `../shared-utils` won't work)
- **Symlinks ARE followed** during the copy process — so if a plugin uses symlinks to include shared files, those will be copied in
- After caching, Claude Code auto-loads the plugin on every session — no `--plugin-dir` needed
- To clear the cache: `rm -rf ~/.claude/plugins/cache/`

### Other plugin CLI commands

| Command | What it does |
|---------|-------------|
| `claude plugin install <plugin>@<marketplace>` | Install a plugin |
| `claude plugin uninstall <plugin>` | Remove a plugin |
| `claude plugin enable <plugin>` | Re-enable a disabled plugin |
| `claude plugin disable <plugin>` | Disable without uninstalling |
| `claude plugin update <plugin>` | Update to latest version |
| `claude plugin validate .` | Validate plugin/marketplace JSON |

Also available as interactive slash commands inside the TUI: `/plugin install`, `/plugin marketplace add`, etc.

## A3. The Current Marketplace: Nearly Empty

The existing marketplace (`.claude-plugin/marketplace.json`) only registers one plugin:

```json
{
  "name": "agentic-hq-plugins",
  "version": "0.0.2",
  "plugins": [
    {
      "name": "steve-test-plugin",
      "source": "./.agentic-hq/plugins/steve-test-plugin",
      "category": "test"
    }
  ]
}
```

**What needs to happen for AHQ-76:** Register all three operational plugins in `marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "agentic-hq-core-plugin",
      "description": "Core plugin providing essential skills like self-termination",
      "source": "./.agentic-hq/plugins/agentic-hq-core-plugin",
      "category": "core"
    },
    {
      "name": "agentic-hq-demos-plugin",
      "description": "Demo workflows showcasing orchestration capabilities",
      "source": "./.agentic-hq/plugins/agentic-hq-demos-plugin",
      "category": "demo"
    },
    {
      "name": "agentic-hq-utilities-plugin",
      "description": "Utilities used by other Agentic HQ plugins",
      "source": "./.agentic-hq/plugins/agentic-hq-utilities-plugin",
      "category": "utility"
    },
    {
      "name": "steve-test-plugin",
      "description": "Steve's test plugin for testing plugin functionality",
      "source": "./.agentic-hq/plugins/steve-test-plugin",
      "category": "test"
    }
  ]
}
```

## A4. The `--plugin-dir` vs Marketplace Refactoring Question

**The problem:** `ClaudeCodeTool` currently hardcodes `--plugin-dir` flags. When plugins are marketplace-installed, Claude Code auto-loads them — passing `--plugin-dir` is unnecessary and potentially confusing (loading the same plugin twice?).

**The solution (for consideration in AHQ-76):** `ClaudeCodeTool` should detect whether plugins are available via marketplace or need `--plugin-dir`:

- **Option A (simplest):** Remove `--plugin-dir` flags entirely. Require all plugins to be marketplace-installed. Development uses `--plugin-dir` at the terminal level, not inside `ClaudeCodeTool`.
- **Option B:** Make `--plugin-dir` configurable/optional. When plugins are marketplace-installed, omit the flags. When running in local dev mode, include them.
- **Option C:** Keep `--plugin-dir` but make it work both ways — `--plugin-dir` on an already-cached plugin is harmless (Claude Code deduplicates).

**Recommendation:** This needs testing. If passing `--plugin-dir` for an already-marketplace-installed plugin causes no issues (Option C), the simplest path is to leave the code as-is for now and address it later. If it causes duplicate loading or conflicts, Option B is the cleanest approach.

Steve Response: Agree that we should leave this as it is (while it's still working) until we have completed AHQ-76, and then do:
https://agentic-hq.atlassian.net/browse/AHQ-78 - Agentic HQ Plugins Run From Local Workspace (Not Marketplace) When I Run Workflows In "Local Dev" Mode
straight after https://agentic-hq.atlassian.net/browse/AHQ-76

## A5. Plugin Caching Implications for ts-workflow

When a plugin is marketplace-installed and cached at `~/.claude/plugins/cache/`, the ts-workflow directory is included in the cache. This means:

- The ts-workflow's `package.json` is cached
- The ts-workflow's source `.ts` files are cached
- But `node_modules/` is NOT cached (it's in `.gitignore` and excluded from the copy)
- The first time the skill runs, `pnpm install --ignore-workspace` creates `node_modules/` inside the cached directory

**Critical implication:** The ts-workflow's `package.json` depends on `agentic-hq`. In the cached copy, `"agentic-hq": "file:../../../../../.."` would point to a nonexistent path. This is exactly why AHQ-61's dependency resolution is essential — the cached workflow needs to resolve `agentic-hq` from a registry (Verdaccio or npm), not from a relative file path.

Steve Response: Yup, true.  This will have to be changed - but as you say: I would expect this to be changed so that **when we run in Local NPM mode** this would point at the agentic-hq npm packages that we publish in Verdaccio, and when we run in Local Dev mode it will point at the current file.

## A6. Skills vs Commands: Current State

**Commands and Skills have been merged.** A file at `.claude/commands/review.md` and a skill at `.claude/skills/review/SKILL.md` both create `/review` and work the same way. Existing `.claude/commands/` files continue to work. Skills are the recommended approach going forward.

**Key differences in practice:**

| Feature | Commands (`.md` files) | Skills (`SKILL.md` in directories) |
|---------|----------------------|-----------------------------------|
| File format | Single `.md` file | Directory with `SKILL.md` + supporting files |
| Supporting files | Not supported | Templates, scripts, reference docs alongside SKILL.md |
| Frontmatter | Supported | Supported (with additional options like `context: fork`, `agent:`, `model:`) |
| Precedence | Lower | Higher (skill wins if same name) |

**What Agentic HQ uses:**
- **Skills:** String reversal (`SKILL.md` + ts-workflow), self-termination (`SKILL.md` + script), plus various test skills
- **Commands:** String reversal's `reverse-a-string.md`, all math workflow steps, all Jira TDD workflow steps, quick Jira workflow steps

The existing approach is correct: Skills for entry points (what the CLI calls), Commands for the actual work (what ClaudeCodeTool executes within workflows).

## A7. Marketplace Plugin Source Types (Future-Relevant)

The `marketplace.json` schema supports multiple plugin source types:

| Source Type | Format | Relevance |
|-------------|--------|-----------|
| Relative path | `"source": "./plugins/my-plugin"` | **Now** — local directories |
| GitHub repo | `"source": { "source": "github", "repo": "owner/repo" }` | **Future** — public/private GitHub distribution |
| Git URL | `"source": { "source": "url", "url": "https://..." }` | Future — GitLab, Bitbucket, etc. |
| npm package | `"source": { "source": "npm", "package": "@acme/plugin" }` | **Future** — distribute plugins via npm registry |

**Notable:** The marketplace can reference npm packages as plugin sources. This means in the future, plugins could be distributed via npm alongside the `agentic-hq` CLI package itself. This is worth keeping in mind when designing the publishing architecture.

Steve Comment: Publishing the Claude Code Plugins via npm rather than GitHub is worth bearing in mind, but as I'd like normal developers (many of whom won't have an npm publishing account) to share their Plugins I'm pretty sure I'll stick to GitHub, as most devs know how it works and will be able to publish with almost no friction.

---

# Part B: Publishing Architecture

## B1. The Four Levels

| Level | Tool | Purpose | Build Now? |
|-------|------|---------|-----------|
| 1: Local Dev | `link:` protocol (symlink) | Fast iteration, live source | YES — switch from `file:` to `link:` |
| 2: Local NPM | Verdaccio on localhost:4873 | Test full npm lifecycle locally | YES — needed for AHQ-76 |
| 3: Remote Beta | npm public + `--tag beta` | Team/collaborator testing | LATER — design for, don't build |
| 4: Production | npm public + `latest` tag | General availability | LATER — design for, don't build |

The critical insight: **moving between levels is just changing the registry URL.** The package structure, `files` whitelist, `bin` entry, and `exports` map are all the same. Once Level 2 works, Level 3 is just `pnpm publish --tag beta` to a different registry.

## B2. Level 1 — Local Dev (`link:` protocol)

**Current state:** The ts-workflow's `package.json` uses `"agentic-hq": "file:../../../../../.."`. This works but `file:` causes pnpm to **hard-link (copy)** the entire project into `node_modules` — including 90MB of docs (see AHQ-61 addendum).

**The fix:** Switch from `file:` to `link:` in the ts-workflow's `package.json`:

```json
{
  "dependencies": {
    "agentic-hq": "link:../../../../../.."
  }
}
```

**Why `link:` is a strict improvement over `file:`:**

| Aspect | `file:` (current) | `link:` (proposed) |
|--------|-------------------|-------------------|
| Mechanism | Hard links (copies files) | Symlink |
| Disk usage | 90MB copy in node_modules | Zero (just a symlink pointer) |
| See source changes | Must re-run `pnpm install` | Instant — symlink points at live source |
| `files` whitelist | Not respected | Not respected |

Both `file:` and `link:` are local dev tools — neither tests the published package experience. That's what Level 2 (Local NPM / Verdaccio) is for.

**What the setup script does:**
```bash
setup.sh --env=dev
  # Changes ts-workflow's package.json to use link: protocol
  # Runs pnpm install in ts-workflow directories
  # Result: Live source symlink, instant iteration
```

**Practical implications for AHQ:**
- Good for daily development within the AHQ repo
- NOT suitable for testing the "install from registry" path — use Level 2 for that
- Does NOT respect `files` whitelist or run lifecycle scripts — by design, that's Level 2's job

## B3. Level 2 — Local NPM (The Key Test for AHQ-76)

### What is Verdaccio?

Verdaccio is a lightweight, zero-config npm proxy registry. It runs locally on port 4873 and can:
- Store packages you publish to it
- Proxy requests for other packages to the real npm registry
- Run with zero authentication for local development

### Installation and Setup

```bash
# Install globally (one-time)
pnpm add -g verdaccio

# Start it
verdaccio
# Listening on http://localhost:4873
```

Default config lives at `~/.verdaccio/config.yaml`. Out of the box, it:
- Listens on port 4873
- Stores packages in `~/.verdaccio/storage/`
- Proxies unknown packages to npmjs.org
- Requires authentication for publishing (htpasswd-based)

### Publishing to Verdaccio

```bash
# First time: create a user (required for publishing)
npm adduser --registry http://localhost:4873

# Publish
pnpm publish --registry http://localhost:4873 --no-git-checks
```

**Important finding: Verdaccio does NOT allow republishing the same version by default.** You get `"Cannot publish over existing version."` Workarounds:

1. **Bump the version** each time (e.g., `0.1.0` → `0.1.1` → `0.1.2`). Cleanest approach — and easily automated as a one-liner (see Discussion Point 1 for details).
2. **Unpublish then republish:** `npm unpublish agentic-hq@0.1.0 --registry http://localhost:4873` then republish (STEVE NOTE: Don't like this, as what is being published has actually changed, so version number should change)
3. **Clear storage entirely:** `rm -rf ~/.verdaccio/storage/agentic-hq` then republish. (STEVE NOTE: Definitely don't want to do this)

The draft plan said "publish infinite times" — that's technically true only if you change the version or clear storage each time. The setup script should handle this automatically using the auto-bump approach (option 1).

### Installing from Verdaccio

```bash
# Install as a dependency
pnpm add agentic-hq --registry http://localhost:4873

# Install globally (for the agentic-hq CLI binary)
pnpm add -g agentic-hq --registry http://localhost:4873
```

### What Verdaccio Validates

This is why Local NPM mode exists — it catches problems that `link:` hides:

| Check | What it catches |
|-------|----------------|
| `files` whitelist correct | Missing source files in published package |
| `bin` commands symlink properly | Broken CLI entry point |
| `exports` map works | Broken import paths (e.g., `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code'`) |
| No secrets leaked | `.env`, credentials, etc. not in package |
| Package size reasonable | Docs/tests/temp files not included |
| Lifecycle scripts run | `postinstall` for native modules |
| Dependencies resolve | All deps available from registry |

### Verdaccio Proxying

Verdaccio automatically proxies to npmjs.org for packages not published locally. This means when the ts-workflow's `pnpm install` runs, it gets:
- `agentic-hq` from Verdaccio (locally published)
- `commander`, `tsx`, `node-pty`, etc. from npmjs.org (proxied through Verdaccio)

No special configuration needed — this is the default behavior.

### Starting Verdaccio for Development

For the setup script:
```bash
# Start in background with output capture
verdaccio > /tmp/verdaccio.log 2>&1 &
VERDACCIO_PID=$!

# Wait for it to be ready
sleep 2

# ... do publish and install work ...

# Optionally stop when done
kill $VERDACCIO_PID
```

### Disabling Authentication (Not Recommended)

You could allow anonymous publishing by setting `publish: $all` in Verdaccio's `config.yaml`. However, **npm itself requires an auth token to publish** — even if Verdaccio allows anonymous access, `npm publish` / `pnpm publish` will fail without a token. So disabling auth doesn't actually help.

The recommended approach is to auto-create a user non-interactively in the setup script (see Discussion Point 3 for details).

## B4. Level 3 — Remote Beta (Design For Later)

**What changes from Level 2:**
- Registry URL: `http://localhost:4873` → `https://registry.npmjs.org`
- Authentication: Verdaccio htpasswd → npm access token
- Tag: `--tag beta` prevents the package from becoming `latest`

**What stays the same:** Package structure, `files` whitelist, `bin` entry, `exports` map, everything else.

The setup script will include this mode commented-out, ready to uncomment when needed:

```bash
# ============================================================================
# FUTURE: Level 3 — Remote Beta (not yet live)
# Publishes to public npmjs.org with beta tag.
# Consumers install via: pnpm add -g agentic-hq@beta
# Prerequisites before uncommenting:
#   - npm account created and logged in (npm login)
#   - Package name 'agentic-hq' available on npmjs.org (or use scoped @agentic-hq/cli)
# ============================================================================
# npm version patch --no-git-tag-version
# pnpm publish --tag beta --no-git-checks
# pnpm add -g agentic-hq@beta
#
# To promote a tested beta to latest:
# npm dist-tag add agentic-hq@<version> latest
```

## B5. Level 4 — Production (Design For Later)

Same as Level 3 but without `--tag beta`. Publishing assigns the `latest` tag automatically.

The setup script will include this mode commented-out, ready to uncomment when needed:

```bash
# ============================================================================
# FUTURE: Level 4 — Production (not yet live)
# Publishes to public npmjs.org as latest stable release.
# Consumers install via: pnpm add -g agentic-hq
# Prerequisites before uncommenting:
#   - npm account created and logged in (npm login)
#   - Package name 'agentic-hq' available on npmjs.org (or use scoped @agentic-hq/cli)
#   - Level 3 (beta) tested and working first
# ============================================================================
# npm version patch --no-git-tag-version
# pnpm publish --no-git-checks
# pnpm add -g agentic-hq
```

## B6. The `files` Whitelist (Critical for Levels 2-4)

Currently `package.json` has no `files` field. Without it, `pnpm publish` would include everything not in `.gitignore` — roughly 90MB of docs, tests, spike projects, etc.

**Required addition to root `package.json`:**

```json
{
  "files": [
    "src/",
    "bin/"
  ]
}
```

**Note:** `package.json`, `README.md`, `LICENSE`, and files referenced by `main`, `types`, `bin`, and `exports` are **automatically included** by npm — they don't need to be in the `files` array.

**Verification before publishing:**
```bash
pnpm pack --dry-run
```

This shows exactly what would be in the tarball without actually creating it. The setup script should run this and display the output so the developer can verify package contents.

**Special consideration:** The current `exports` field points to TypeScript source:

```json
{
  "exports": {
    "./tools/claude-code": "./src/tools/claude-code/ClaudeCodeTool.ts"
  }
}
```

Since the project uses `tsx` to run TypeScript directly (per AHQ-59 decision), this is correct — consumers run via tsx too, so they import `.ts` files directly. The `files` whitelist includes `src/` which contains this file. But this does mean **consumers must use tsx** (or a similar TypeScript loader) — they can't use plain Node.js. This is fine for now (all ts-workflows use tsx) but worth documenting.

## B7. The `private: true` Issue

`package.json` has `"private": true` which blocks `pnpm publish` even to Verdaccio. This needs to be changed:

```json
{
  "private": false
  // Or simply remove the field entirely
}
```

Per Document 1 discussion: this change should be clearly commented explaining why it was removed (to enable Verdaccio and future npm publishing).

## B8. The Setup Script Architecture

The draft plan proposed `setup.sh --env=dev|local-npm|remote-beta|remote-prod`. Here's what each mode does:

```bash
setup.sh --env=dev
  # 1. pnpm link /path/to/agentic-hq in ts-workflow directories
  # Result: Live source symlink, instant iteration

setup.sh --env=local-npm
  # 1. Start Verdaccio in background (if not already running)
  # 2. Auto-create Verdaccio user (idempotent, see Discussion Point 3)
  # 3. Auto-bump patch version: npm version patch --no-git-tag-version (see Discussion Point 1)
  # 4. Publish to Verdaccio: pnpm publish --registry http://localhost:4873 --no-git-checks
  # 5. Install globally: pnpm add -g agentic-hq --registry http://localhost:4873
  # 6. Register local marketplace: claude plugin marketplace add /path/to/cloned/agentic-hq
  # 7. Install plugins: claude plugin install agentic-hq-core-plugin@agentic-hq-plugins (etc.)
  # Result: Developer can cd to ANY directory and run `agentic-hq` commands

# FUTURE (commented-out in script with placeholder values):
# setup.sh --env=remote-beta
#   pnpm publish --tag beta (to https://registry.npmjs.org)
#   pnpm add -g agentic-hq@beta

# setup.sh --env=remote-prod
#   pnpm publish (to https://registry.npmjs.org, no --tag = latest)
#   pnpm add -g agentic-hq
```

**Key principle:** Each mode just populates `node_modules/` differently. No source files are changed. The script manages all state.

## B9. Assessment of AHQ-61's ChatGPT Advice

AHQ-61 contains detailed advice from ChatGPT for the dependency resolution refactor. Here's what's correct, what's unnecessary, and what's missing:

### What's Correct

| Advice | Assessment |
|--------|-----------|
| Replace `file:` with versioned dependency in `package.json` | Correct — `"agentic-hq": "^0.1.0"` is the right target |
| Script-driven mode switching | Correct — `setup.sh --env=...` is the right approach |
| Mode is determined at install time, not runtime | Correct — CLI doesn't care where deps came from |
| Import path `agentic-hq/tools/claude-code` stays unchanged | Correct — the `exports` map handles resolution |
| `files` whitelist needed | Correct and critical — without it, 90MB gets published |
| `link:` over `file:` for local dev | Correct — `link:` creates symlink (zero copy), `file:` copies |

### What's Unnecessary

| Advice | Why it's unnecessary |
|--------|---------------------|
| `pnpmfile.cjs` to rewrite dependencies at install time | Unnecessary — `pnpm link /path/to/pkg` achieves the same thing more simply, with no "magic" file that surprises people. The hook silently rewrites dependencies which is confusing. |
| `.npmrc` with `${AHQ_REGISTRY_URL}` env var | Unnecessary — `--registry` flag on the command is cleaner and more explicit. ENV-driven `.npmrc` is harder to debug ("which registry am I using?" requires checking env vars). |
| `always-auth=true` in `.npmrc` | Unnecessary — this forces auth on ALL registry requests (including reads/installs). Verdaccio allows anonymous reads by default, and the publish auth token is already handled by `npm adduser` in the setup script (see Discussion Point 3). Theoretically needed for private npm scopes, but very unlikely — private scopes require collaborators to pay $7/month, so we'll publish publicly. |
| `deps:local`, `deps:verdaccio`, `deps:prod` scripts in the ts-workflow's `package.json` | Unnecessary — this is the setup script's job, not the ts-workflow's. The ts-workflow's `package.json` should be minimal and not know about registry switching. |
| `cross-env` for Windows compatibility | Unnecessary now — Steve confirmed Mac/Linux is the target. Add later if Windows support is needed. |

### What's Missing from AHQ-61

| Missing Item | Why it matters |
|-------------|---------------|
| Marketplace plugin registration | AHQ-61 focuses entirely on npm dependency resolution but doesn't mention that plugins need to be in `marketplace.json` for the installed experience to work |
| `private: true` removal | AHQ-61 doesn't mention that `"private": true` blocks publish |
| Plugin caching implications | When plugins are marketplace-cached, the `file:` dependency in ts-workflow's `package.json` breaks because the relative path no longer exists |
| Verdaccio republish limitations | AHQ-61 implies you can publish repeatedly; you actually can't without version bumps or storage clearing |
| `link:` vs `file:` protocol tradeoffs | AHQ-61 mentions `link:` over `file:` but doesn't explain the key difference: `file:` copies 90MB, `link:` creates a zero-cost symlink |
| The actual setup script for AHQ-76 | AHQ-61 describes the concept but doesn't specify what the AHQ-76 end-to-end setup script needs to do (start Verdaccio, publish, global install, register marketplace, install plugins) |

### Recommendation: Replace AHQ-61 With a New Jira

AHQ-61 was written based on ChatGPT advice before the research in this document was done. While its core goals are correct (remove `file:` dependency, enable script-driven mode switching), the implementation approach is significantly different from what we now know works best:

- **No `pnpmfile.cjs`** — use `link:` protocol instead
- **No ENV-driven `.npmrc`** — use `--registry` flags explicitly
- **No `deps:*` scripts in ts-workflow** — setup script handles everything
- **Missing:** marketplace registration, `private: true` removal, Verdaccio auth automation, plugin caching implications

**Recommendation:** Close AHQ-61 as "won't do" and create a new Jira that references this document as its specification. The new Jira should cover the dependency resolution aspect of AHQ-76's setup script, using the approaches documented here (sections B2, B3, B6, B7, B8, and Discussion Points 1-3).

## B10. The End-to-End AHQ-76 Developer Experience

Putting it all together, here's what AHQ-76 should deliver:

```
Developer's terminal:

1. git clone https://github.com/agentic-hq/agentic-hq.git
2. cd agentic-hq
3. ./setup.sh --env=local-npm    # Automated: starts Verdaccio, publishes,
                                  # global installs, registers marketplace,
                                  # installs plugins
4. cd ~/my-project               # Developer goes to THEIR workspace
5. agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal \
     -- --string-to-reverse="hello"
   # Output: Reversed string: olleh
```

**What step 3 does internally:**
1. Starts Verdaccio in background (if not already running)
2. Clears previous agentic-hq package from Verdaccio storage
3. Runs `pnpm publish --registry http://localhost:4873 --no-git-checks`
4. Runs `pnpm add -g agentic-hq --registry http://localhost:4873`
5. Runs `claude plugin marketplace add /path/to/cloned/agentic-hq`
6. Runs `claude plugin install agentic-hq-core-plugin@agentic-hq-plugins`
7. Runs `claude plugin install agentic-hq-demos-plugin@agentic-hq-plugins`
8. Runs `claude plugin install agentic-hq-utilities-plugin@agentic-hq-plugins`
9. Verifies: `agentic-hq --help` works from a temp directory

---

## Differences From the Draft Plan

1. **New finding: Verdaccio doesn't allow republishing the same version.** The plan said "publish infinite times." Actually, you need to either bump the version, unpublish first, or clear storage. The setup script must handle this.

2. **New finding: `link:` protocol is a strict improvement over `file:`.** The current `file:` protocol causes pnpm to copy 90MB into `node_modules`. Switching to `link:` creates a zero-cost symlink instead, with instant source change reflection. No downsides.

3. **New finding: `pnpmfile.cjs` is definitively unnecessary.** The plan already leaned this way, but research confirms `link:` protocol is strictly better for local dev. No silent dependency rewriting, simpler to understand, fewer moving parts.

4. **New finding: Marketplace supports npm as a plugin source.** `marketplace.json` can reference npm packages as plugin sources (`"source": { "source": "npm", "package": "@acme/plugin" }`). This means in the future, plugins could be distributed via npm alongside the CLI package. The plan didn't mention this.

5. **Refined: `files` whitelist doesn't need README/LICENSE.** These are auto-included by npm. The whitelist only needs `["src/", "bin/"]`.

6. **Confirmed: Skills and Commands have been merged.** Commands continue to work but Skills are the recommended approach. The project's current split (Skills for entry points, Commands for actual work) is fine.

7. **New finding: Cached plugins can't reference files outside their directory.** Path traversal like `../shared-utils` won't work after marketplace installation. Each plugin must be self-contained. The current plugin structure already satisfies this.

---

## Things To Discuss

### Discussion Point 1: Verdaccio Republishing Strategy

Verdaccio doesn't allow publishing the same version twice. **Recommended approach: auto-bump version.**

Used inside `setup.sh --env=local-npm` (see section B8) when publishing to Verdaccio:
```bash
npm version patch --no-git-tag-version && pnpm publish --registry http://localhost:4873 --no-git-checks
```

- `npm version patch` — auto-bumps patch version in `package.json` (e.g., `0.1.0` → `0.1.1`). Note: pnpm doesn't have its own version command, but `npm version` just edits `package.json` and works fine alongside pnpm.
- `--no-git-tag-version` — skips creating a git commit/tag (not wanted during dev)
- `--no-git-checks` — skips pnpm's git dirty-tree check

**Other options considered but not recommended:**
- **(a) Auto-clear storage** — `rm -rf ~/.verdaccio/storage/agentic-hq` then publish. Works but risks deleting cached upstream packages if storage path is wrong.
- **(c) Unpublish then republish** — `npm unpublish agentic-hq@0.1.0 --registry http://localhost:4873` then publish. More explicit but requires knowing the current version.

### ~~Discussion Point 2: `--plugin-dir` Refactoring Scope~~ RESOLVED

**Answered by Steve inline in section A4:** Leave as-is for AHQ-76, then do AHQ-78 ("Agentic HQ Plugins Run From Local Workspace (Not Marketplace) When I Run Workflows In Local Dev Mode") straight after AHQ-76.

### Discussion Point 3: Verdaccio Authentication

**Recommended approach: auto-create user in the setup script.**

Used inside `setup.sh --env=local-npm` (see section B8) before publishing to Verdaccio:
```bash
echo -e "agentic-hq-test-publishing-user\ntestpass\nnot-a-real-email@localhost" | npm adduser --registry http://localhost:4873
```

- Zero prompts, zero user interaction
- Idempotent — safe to run multiple times (reuses the user, updates the token in `~/.npmrc`)
- No Verdaccio config changes needed (default `publish: $authenticated` works)
- Token is cached in `~/.npmrc` so subsequent `pnpm publish --registry http://localhost:4873` just works

**Why not disable auth (`publish: $all`)?** Even if Verdaccio allows anonymous access, npm itself requires an auth token to publish — so `pnpm publish` would still fail. Auto-creating a user is the only fully automated approach.

**Option (c) pre-configured token** was also considered but is unnecessary — auto-creating the user handles the token automatically.

### ~~Discussion Point 4: TypeScript Source Distribution~~ RESOLVED

**Not an issue.** The CLI entry point is `node bin/agentic-hq.cjs` — plain Node.js running a CJS file. That file internally bootstraps tsx to run TypeScript source. The ts-workflows also use tsx (installed automatically as a dependency). Consumers never need to install tsx manually — it's an internal implementation detail.

The target audience is professional developers, for whom the prerequisites are standard and reasonable:

| Prerequisite | Install effort | Notes |
|-------------|---------------|-------|
| **Node.js >= 22** | Low | Most JS/TS devs already have it. Recommend **nvm** for developers who need to switch between Node versions for different projects. |
| **pnpm** | Low | One command: `npm install -g pnpm` |
| **Claude Code** | Medium | Required by the tool's nature (AI-driven workflows) |

Everything else (npm comes with Node.js, tsx is auto-installed as a package dependency) is automatic. These requirements will be documented in the Installation docs.

---

## Discussion Notes

*(To be filled in after discussion)*



## Steve's Request For Additional Research And Document About Possible Simpler dev-agentic-hq CLI Option

I feel like all of this discussion about Verdaccio has made me think that a local npm server is a requirement, when actually I'm not sure it is.

It's also made me realise that publishing to any kind of npm repository is an overhead, because you lose the immediacy of running the code that's in the agentic-hq workspace.  If a developer changes any code in Agentic HQ they would have the overhead of publishing it before being able to try it in a different workspace.  This is not ideal.

The original proposal from ChatGPT at:

https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/23592962/AHQ-56#How-Best-To-Run-A-node-Command-Outside-The-Project-Workspace

which said:


=== START OF EXCERPT ===

bin/agentic-hq.cjs - file which is executable and launches the “agentic-hq.cli.ts” program using tsx

a packages.json entry that points agentic-hq at this executable:

"bin": {
  "agentic-hq": "bin/agentic-hq.cjs"
}
To install this locally as an npm module using:

pnpm install
pnpm link --global
And then when I run the following in any workspace root it will use the “live” current code in my workspace:

agentic-hq

=== END OF EXCERPT ===



I'm actually thinking that this app should be called:

dev-agentic-hq

to make it clear it is *not* the agentic-hq CLI installed by npm (local or remote) but the agentic-hq that points to the live, dev code in the Agentic HQ workspace.

I want this simpler option researched in depth (including asking Perplexity and searching on the web) and the findings put in:

03-simpler-dev-only-pnpm-and-plugin-running-methods.md

I want to understand:
- Does this "pnpm install" command above cause a link to the "real" code or copy it somewhere (not sure how this works - need help with that).
- Whether this will give me everything I need to share this project with a developer, them run a script, and them then be able to run dev-agentic-hq from any workspace and it:
  - run using the "live" Typescript code in the Agentic HQ workspace (so if they edit ClaudeCodeTool.ts it will affect this version immediately)
  - when dev-agentic-hq gets the command from the Skill to run, and runs it using tsx:
    - that typescript code will import ClaudeCodeTool.ts from the **same** location in the Agentic HQ workspace, and so update straight away if they changed it (remember - the "run command" from the Skill will always run "pnpm install" before running the script e.g. "cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow && pnpm install --ignore-workspace &&  pnpm demo:string-reversal")
- Whether this will introduce problems/complications?
- Whether overall it seems better just to have dev-agentic-hq actually run the "publish to local npm and update from local npm" script every time it runs?

I'd like the following sections added as well:
- Discussion Points - Indexed with placeholder for me to respond and then you to respond etc etc.



  ---                                                                                                                                                                                                           
  Questions about the dev-agentic-hq CLI research task:                                                                                                                                                         
                                                                                                                                                                                                                
  1. Naming scope: You want the new binary to be called dev-agentic-hq — does this mean a second bin entry in package.json alongside the existing agentic-hq, or would dev-agentic-hq replace agentic-hq for now
   (since you're only in dev mode currently)?
A: Replace (if this is a good route to go down).   
  2. Document placement: You specified 03-simpler-dev-only-publishing-method.md — should this go in docs/jira-docs/AHQ-74/docs/ alongside the other AHQ-74 documents? And should it count as a new document in
  the AHQ-74 sequence (making it Documents 1, 2, 3-new, 3-original, 4, 5) or is it a standalone companion to Document 2?

A: I've renumbered the deliverables in:

https://agentic-hq.atlassian.net/browse/AHQ-74

Deliverables
docs/jira-docs/AHQ-74/docs/01-task-summary-questions-and-clarifications.md - After you’ve read this Jira and done your initial exploration put your understanding of this task and your questions and clarifications required in here, and ask me to respond in-line in the doc, before we proceed.

Split into 2:

docs/jira-docs/AHQ-74/docs/02a-claude-code-marketplace-plugins-and-verdaccio-research.md - a comprehensive doc detailing your understanding of Claude Code Marketplace, Plugins and Verdaccio and how it relates to this project and it’s goals.

docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-publishing-method.md

docs/jira-docs/AHQ-74/docs/03-current-project-state.md - a comprehensive doc explaining the current state of the project, including how the “pnpm demo:agentic-hq-cli:string-reversal” program works (end to end) AHQ-56: bin/agentic-hq.cjs CLI That Runs Typescript Code Bundled With A Skill
Done
 and what the point of that program is and the point of the whole project (as currently understood).

docs/jira-docs/AHQ-74/docs/04-direction-of-project.md - where you think we are heading (use Jiras that haven’t been done to understand this better, and what I’ve said in this Jira).

docs/jira-docs/AHQ-74/docs/05-help-with-next-steps.md - what you think of the ChatGPT suggestions what I should focus on next, and especially some concrete steps for getting from here to completing AHQ-43: agentic-hq CLI Runs Full Demo TDD Workflow In A Dev Workspace
Backlog
 

  3. The pnpm link --global excerpt: The ChatGPT advice uses pnpm link --global (which creates a global symlink). Your questions about "does it link or copy" suggest you want me to research this deeply.
  Should I also cover what happens when node_modules dependencies change (e.g., if you add a new npm dependency to agentic-hq, does the global symlink pick that up automatically or does the developer need to
  re-run something)?

A: Yes please.

  4. Plugin loading: The dev-agentic-hq approach would run from the live workspace, meaning --plugin-dir flags pointing at the workspace would work as-is. Does that mean you'd want dev-agentic-hq to skip the
  marketplace entirely (just use --plugin-dir like today), while the regular agentic-hq (installed via npm/Verdaccio later) would use marketplace-installed plugins?

A. This is a good point (a GREAT point). At the moment my --plugin-dir points at a **relative** path in the current directory.  We could change this to $AGENTIC_HQ_WORKSPACE_ROOT/.agentic-hq/plugins/agentic-hq-core-plugin and then it would become absolute and work from anywhere.  Then we don't need to do marketplace stuff at all!!  Please include a section in the new doc about this much simpler method and I've renamed the doc to 03-simpler-dev-only-pnpm-and-plugin-running-methods.md to include both aspects (pnpm and Plugins)

I just tested this and it worked, so it does seem the simplest/best option for moving forward with this:

(base) stevepersonal@Steves-MacBook-Pro temp-ws-001 % pwd
/tmp/temp-workspaces/temp-ws-001
(base) stevepersonal@Steves-MacBook-Pro temp-ws-001 % 
(base) stevepersonal@Steves-MacBook-Pro temp-ws-001 % claude --plugin-dir=/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin

╭─── Claude Code v2.1.37 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                              │ Tips for getting started                                                                                                                                      │
│              Welcome back Steve!             │ Ask Claude to create a new app or clone a repository                                                                                                          │
│                                              │ ────────────────────────────────────────────────────                                                                                                          │
│                                              │ Recent activity                                                                                                                                               │
│                   ▗ ▗   ▖ ▖                  │ No recent activity                                                                                                                                            │
│                                              │                                                                                                                                                               │
│                     ▘▘ ▝▝                    │                                                                                                                                                               │
│            Opus 4.6 · Claude Max             │                                                                                                                                                               │
│   /private/tmp/temp-workspaces/temp-ws-001   │                                                                                                                                                               │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

❯ /agentic-hq-core-plugin:self-termination                                                                                                                                                                      
                                          
⏺ Running the self-termination script to return control to the Agentic HQ wrapper.                                                                                                                              
                                                                                                                                                                                                              
  Bash(/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh $PPID)                                             
  ⎿  Running…                                                                                                                                                                                                 
                                                                                                                                                                                                                
· Blanching… (9s · ↓ 77 tokens)                                                                                                                                                                               
                                                                                                                                                                                                                
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                                                                                                                                                                                             
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  esc to interrupt · ctrl+t to hide tasks                                                                                                                                                         22733 tokens
(base) stevepersonal@Steves-MacBook-Pro temp-ws-001 % 



  5. "Run publish to local npm every time": Your last bullet asks whether it's better to just have dev-agentic-hq run the Verdaccio publish+install cycle on every invocation. Do you want me to seriously evaluate this option (with timing estimates for a publish cycle vs. instant symlink execution), or is this more of a "rule it out and explain why" question?

A: Don't know?  If it seems a "bad" idea I'm happy for you to just rule it out and explain why it's a bad idea :-)

  6. Scope of "share with a developer": When you say "share this project with a developer, them run a script" — is this the same developer audience as AHQ-76 (someone who clones the repo to try it), or a  different scenario (e.g., a contributor who wants to develop on agentic-hq itself)?

A: That's a good question.  I'm kind of wanting to start with the simplest "all encompassing" setup that allows a developer to do **both** using the same tools.  When they run dev-agentic-hq they are running whatever is in their Agentic HQ workspace (plugins and core code) and if they leave it alone, they can just play with it - but if they want to add /change / fix something they just do it and re-run.  No deployment friction (at all).