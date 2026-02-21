# AHQ-59: Bundling TypeScript In A Claude Code Plugin — Research And Recommendation

## What Was Originally Proposed (And Why We Moved On)

The original research doc (`LEGACY_COMPLICATED_bundling-typescript-in-claude-code-plugin-research.md`) recommended using esbuild to pre-compile TypeScript into bundled `.js` files, with custom auto-install logic, pre-flight dependency checks, and runtime version checking code.

This was over-engineered. **The key realisation**: All workflows use `ClaudeCodeTool`, which depends on `node-pty` (a native C++ module that cannot be bundled). This means `pnpm install` is **always required**. And if we're running `pnpm install` anyway, there's no point pre-compiling — we can just install `tsx` as a dependency and run TypeScript source directly.

Then the second realisation: **we're already doing exactly this in the main project.** The existing `pnpm demo:string-reversal` runs `tsx src/demo/cli/string-reversal-demo-cli.ts`. We just need to move that into the plugin directory and keep doing the same thing.

---

## The Approach: Move What We Already Do Into The Plugin

### Core Idea

The plugin's TypeScript workflows directory is a **self-contained mini Node.js project** — identical in structure to how workflows run today in the main project. Same `package.json` scripts, same `tsx`, same everything. Just relocated.

**Today (in main project root):**
```bash
pnpm demo:string-reversal --string-to-reverse="hello"
# runs: tsx src/demo/cli/string-reversal-demo-cli.ts
```

**After migration (in plugin directory):**
```bash
cd .agentic-hq/plugins/agentic-hq-demos-plugin/ts-workflows
pnpm demo:string-reversal --string-to-reverse="hello"
# runs: tsx src/string-reversal-demo-cli.ts
```

Same command. Same behaviour. Different directory.

### Three Things In A Plugin (Don't Confuse Them)

There are three distinct things inside a plugin that are easy to mix up. Using string-reversal as an example:

| Thing | What it is | Where it lives | How it's invoked |
|-------|-----------|---------------|-----------------|
| **The Skill** | A `SKILL.md` that `agentic-hq` invokes to get the command to run the workflow | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md` | `/agentic-hq-demos-plugin:string-reversal` |
| **The TypeScript workflow code** | The actual TypeScript program that orchestrates the workflow (this is what we're bundling) | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/` | `cd ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal` |
| **The Command(s)** | The markdown command file(s) that the workflow TypeScript code calls via ClaudeCodeTool to do the actual work | `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/string-reversal/reverse-a-string.md` | `/agentic-hq-demos-plugin:string-reversal:reverse-a-string` |

**How they connect**: `agentic-hq` calls **the skill** -> skill returns the command to run **the TypeScript workflow** -> the TypeScript workflow calls **the command(s)** via ClaudeCodeTool -> commands do the actual work (e.g., reverse a string).

### What Lives In The Plugin Directory

```
.agentic-hq/plugins/agentic-hq-demos-plugin/
  .claude-plugin/
    plugin.json                        (existing plugin manifest)

  commands/                            ← THE COMMANDS (markdown, called by workflow code)
    string-reversal/
      reverse-a-string.md               (does the actual string reversing)

  skills/                              ← THE SKILLS + THE TYPESCRIPT WORKFLOW CODE
    string-reversal/
      SKILL.md                           (THE SKILL: returns the command to run the workflow)
      ts-workflow/                       (THE TYPESCRIPT CODE: self-contained Node.js project)
        src/
          string-reversal-demo-cli.ts      (moved from src/demo/cli/)
        package.json                       (scripts + dependencies for THIS workflow)
        pnpm-lock.yaml                     (locks exact dependency versions)
        .nvmrc                             (contains "22")
        .npmrc                             (contains "engine-strict=true")
        .gitignore                         (contains "node_modules/")
    math-workflow/
      SKILL.md
      ts-workflow/
        src/
          math-workflow-demo-cli.ts
        package.json                       (independent — may have different deps)
        pnpm-lock.yaml
        .nvmrc
        .npmrc
        .gitignore
```

Each workflow is fully independent — you can add, remove, or update one without affecting any other. Each has its own dependencies, its own lock file, its own `node_modules/`.

**Important**: `node_modules/` is NOT shipped with the plugin. It's `.gitignore`d. The plugin distributes `package.json` + `pnpm-lock.yaml` only — `pnpm install` recreates `node_modules/` on the developer's machine. This is standard Node.js practice (same as never committing `target/` in a Maven project).

### The Workflow's package.json

Each `ts-workflow/package.json` is a self-contained project:

```json
{
  "name": "agentic-hq-demo-string-reversal",
  "version": "0.0.1",
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "demo:string-reversal": "tsx src/string-reversal-demo-cli.ts"
  },
  "dependencies": {
    "tsx": "^4.20.6",
    "node-pty": "^1.1.0",
    "commander": "^14.0.3"
  }
}
```

### How The agentic-hq CLI Runs A Workflow

1. Developer runs: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal --string-to-reverse="hello"`
2. `agentic-hq` calls **the skill** `/agentic-hq-demos-plugin:string-reversal` (which is `skills/string-reversal/SKILL.md`)
3. The skill knows its own directory, builds the full command including `cd` to its `ts-workflow/` subdirectory
4. Skill returns the full command: `cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- <args>`
5. `agentic-hq` runs that command, passing all stdout/stderr through to the user
6. **The TypeScript workflow code** runs, and internally calls **the command** `/agentic-hq-demos-plugin:string-reversal:reverse-a-string` via ClaudeCodeTool to do the actual work

---

## Migration Plan (For AHQ-56)

| Step | What | Details |
|------|------|---------|
| **0. Workspace exclusion** | Exclude plugins from pnpm workspace (one-time, all workflows) | Add `- '!.agentic-hq/plugins/**'` to `pnpm-workspace.yaml` (see [Workspace Isolation](#workspace-isolation-required)) |
| **1. Move** | Move workflow code + deps into skill directory | Create `skills/string-reversal/ts-workflow/` with its own `package.json`, move TypeScript source from `src/demo/cli/` |
| **2. Create SKILL.md** | Skill supplies the full run command | `skills/string-reversal/SKILL.md` knows its directory, returns the full `cd ... && pnpm install --ignore-workspace && pnpm demo:string-reversal` command |
| **3. Get it working** | Test directly in the skill's ts-workflow directory | `cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- --string-to-reverse="hello"` |
| **4. Redirect** | Update project-root script to delegate | Change the main project's `pnpm demo:string-reversal` to run via the plugin skill directory, passing all args through |
| **5. Update tests** | Point tests at the plugin skill location | Update E2E and other tests to run against the new location |
| **6. Delete old code** | Remove redundant code from main project | Delete `src/demo/cli/string-reversal-demo-cli.ts` and any other code that's now in the plugin |
| **7. Verify** | All tests pass | Run full test suite to confirm nothing is broken |

The key safety of this approach: **step 3 proves it works before anything else changes.** If it runs in the skill directory, it'll run from anywhere.

---

## Key Concepts For Java Developers

### TypeScript vs Java

| Concept | Java | TypeScript/Node.js (our approach) |
|---------|------|-------------------|
| Source code | `.java` files | `.ts` files |
| How it runs | `javac` compiles to `.class`, then `java` runs it | `tsx` runs `.ts` directly — no separate compile step |
| Runner | `java` (JVM) | `tsx` (thin wrapper that transpiles `.ts` on-the-fly and passes it to `node`) |
| Runtime | JVM | `node` (Node.js runtime) — tsx invokes this under the hood |
| Dependency manager | Maven / Gradle | pnpm |
| Dependency manifest | `pom.xml` / `build.gradle` | `package.json` |
| Lock file | (Maven uses fixed versions) | `pnpm-lock.yaml` |
| Install deps | `mvn install` | `pnpm install` |
| Run a script | `mvn exec:java` | `pnpm demo:string-reversal` |

### What `pnpm install && pnpm demo:string-reversal` Is Doing

**Java analogy**: Like `mvn install && mvn exec:java -Dexec.mainClass="StringReversal"`. Maven downloads any missing dependencies, then runs the class. If deps are already there, `mvn install` is near-instant. Same thing here.

### Native Modules = JNI

`node-pty` is the Node.js equivalent of a JNI library — C++ code compiled to a platform-specific binary. The good news: `node-pty` ships **pre-built binaries** for macOS (ARM + x64) and Windows (ARM + x64), so `pnpm install` just downloads the right binary — no C++ compiler needed.

### nvm = SDKMAN!/jEnv

nvm (Node Version Manager) manages Node.js versions. A `.nvmrc` file specifies which version to use (like `.java-version` for jEnv). Running `nvm use` switches to the right version.

---

## Versioning And Compatibility

### What If The Developer's Node.js Is Too Old?

**Protection (three layers, all built-in — no custom code needed):**

| Layer | What it does | When |
|-------|-------------|------|
| **`.nvmrc`** containing `22` | `nvm use` auto-switches to the right version | When developer enters the directory |
| **`engines`** in `package.json` | Declares required Node version | Read by pnpm |
| **`engine-strict=true`** in `.npmrc` | Makes `pnpm install` hard-fail if Node version is wrong | At install time, before any code runs |

With `engine-strict=true`, a developer on Node 18 sees:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment

Your Node version is incompatible with "agentic-hq-demos-workflows".
Expected version: >=22.0.0
Got: 18.20.8

To fix: nvm install 22 && nvm use 22
```

Clear, actionable, happens before any code runs. No custom version-checking code needed — pnpm does it for us.

### What If The Developer's Node.js Is Too New For Old Plugin Code?

**Mostly a non-issue.** Node.js has excellent backwards compatibility. Code for Node 22 will almost certainly work on Node 24, 26, etc.

**If needed**: Set a max version in `engines`: `"node": ">=22.0.0 <26.0.0"` — pnpm with `engine-strict=true` will catch it. Only do this if you discover a specific incompatibility.

**Realistic risk level**: Very low. The "too old" scenario is far more likely.

### What If The Developer's Environment Is Missing Required Libraries?

**`pnpm install` handles this entirely.** That's its job — read `package.json`, download everything, put it in `node_modules/`.

| Scenario | What happens |
|----------|-------------|
| Pure JS dependency missing | `pnpm install` downloads it |
| Native module missing | `pnpm install` downloads pre-built binary |
| Native module has no prebuild for exotic platform | `pnpm install` tries to compile from source — may need build tools |
| Network is down | `pnpm install` fails with clear error (deps cached after first install) |
| pnpm not installed | `pnpm: command not found` — document pnpm as prerequisite |

**The nvm "missing packages" gotcha doesn't apply here** because all dependencies are **local** (in `node_modules/` inside the plugin directory), not global.

---

## What Would We Gain By Pre-Compiling Instead?

Worth understanding what the esbuild/bundling approach would buy us, and why we're not using it.

### What You'd Gain

- **Slightly faster startup**: Skip tsx's ~100-300ms compile step per run
- **Smaller install footprint**: Pure-JS deps baked into single file, fewer things in `node_modules`
- **Source code hidden**: Compiled JS instead of readable TypeScript (relevant for proprietary plugins)

### Why We're Not Doing This

**`pnpm install` is unavoidable anyway** (native modules), so the main benefit of bundling (avoiding install) is gone.

**The "forgot to mark as external" risk is dangerous.** With esbuild, you must manually mark each native module as `--external:node-pty`. Add a new native dependency and forget? Bundle silently breaks. With `pnpm install`, you just add to `package.json` — no distinction between native and pure-JS. Nothing special to remember.

| Scenario | Our approach (pnpm + tsx) | esbuild bundle approach |
|----------|--------------------------|------------------------|
| Add new dependency (any kind) | Add to `package.json`. Done. | Add to `package.json` AND check if native AND if so add `--external` to esbuild config. **Forget = silent breakage.** |
| Debug a runtime error | Stack trace points to your `.ts` source | Stack trace points to compiled `.js` — need source maps |
| New developer joins | `pnpm install && pnpm demo:string-reversal` — identical to main project | Must understand esbuild config, externals, build scripts |

### When Would Pre-Compilation Make Sense In Future?

- Workflow with no native modules (pure TypeScript, no `ClaudeCodeTool`) — single `.js` file, zero-install
- Startup time critical (sub-50ms) — tsx's ~100-300ms overhead matters
- Proprietary plugin code — want to hide source

None of these apply now.

---

## Workspace Isolation (Required)

The Agentic HQ project uses a pnpm workspace (`pnpm-workspace.yaml`). By default, pnpm auto-detects all nested `package.json` files as workspace members. This means a plugin's `ts-workflow/package.json` would be treated as part of the main workspace — causing `pnpm install` at the project root to interfere with plugin dependencies, and `pnpm install` inside the plugin to behave as a workspace install rather than a standalone one.

**Two mitigations (both required):**

1. **Exclude plugins from the workspace** — add to `pnpm-workspace.yaml`:
```yaml
- '!.agentic-hq/plugins/**'
```

2. **Use `--ignore-workspace` flag** — when `agentic-hq` runs pnpm in the plugin directory, use:
```bash
cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- <args>
```

Belt and braces. The exclusion prevents the main workspace from touching plugin dirs. The `--ignore-workspace` flag prevents pnpm from walking up the directory tree to find the workspace root.

---

## Risks For The Developer

With the workspace isolation above in place, the risks are minimal:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **pnpm install modifies something outside the plugin's ts-workflow directory** | Very low (with `--ignore-workspace`) | `node_modules` is only created locally inside `ts-workflow/`. pnpm's content-addressable store (`~/.local/share/pnpm/store/`) is shared across all projects but this is safe by design — it's read-only deduplication, not modification. | `--ignore-workspace` + workspace exclusion |
| **Malicious postinstall script in a plugin dependency** | Low | A dependency could run arbitrary code during `pnpm install`. | pnpm 10.x blocks lifecycle scripts by default. Only packages listed in `onlyBuiltDependencies` (in the plugin's own config) can run build scripts. Only whitelist what's needed (e.g., `node-pty`). |
| **Plugin install uses disk space** | Certain but minor | Each workflow's `node_modules/` contains all dependencies (~74MB for string-reversal: `node-pty` 62MB, `esbuild` 11MB, `tsx` 576KB, `commander` 240KB). `du` will report ~74MB, but the actual extra disk cost is near-zero — pnpm shares file content with its global store via APFS clones on macOS or hard links on Linux (see Aside below). The real local overhead is just directory structure and symlinks (~a few hundred KB). | Non-issue in practice |
| **Wrong Node.js version causes weird errors** | Low (with protections) | Could get cryptic syntax errors | `.nvmrc` + `engines` + `engine-strict=true` catches this before any code runs |
| **Network required on first run** | Certain (first time only) | `pnpm install` needs to download packages | After first install, `node_modules` is cached locally. pnpm's global store also caches packages across projects. |

**What does NOT happen:**
- pnpm install does NOT modify the main project's `node_modules`, `package.json`, or `pnpm-lock.yaml`
- pnpm install does NOT affect other projects on the developer's machine
- pnpm install does NOT install anything globally
- Running a different Node.js version in the plugin directory does NOT affect other projects (each `node_modules` is independent)

### Aside: How pnpm's Content-Addressable Store Works (And Why Version Conflicts Are Impossible)

This is one of the most elegant things about pnpm and worth understanding.

**The problem with npm**: When you run `npm install`, npm **copies** every package into your project's `node_modules/`. If you have 10 projects that all use `commander@14.0.3`, you have 10 separate copies on disk. Wasteful.

**How pnpm solves it**: pnpm maintains a single **content-addressable store** on your machine (on this Mac it's at `~/Library/pnpm/store/v10/`, on Linux typically `~/.local/share/pnpm/store/`). Every version of every package you've ever installed lives there — once. When a project needs a package, pnpm links the files from the store into the project's `node_modules/`:

- **macOS (APFS)**: Uses **APFS clones** (copy-on-write). The files look like independent copies (`du` reports the full size, `stat` shows link count 1), but the underlying disk blocks are shared with the store. The actual extra physical cost is just directory metadata — a few hundred KB per workflow, not ~74MB.
- **Linux (ext4, etc.)**: Uses **hard links**. Multiple directory entries point to the same inode. `stat` shows link count > 1 and `du` correctly reports near-zero extra usage.

Both achieve the same outcome — shared storage, near-zero extra disk cost — just via different filesystem mechanisms.

**What this means for version coexistence**: If your main project uses `commander@14.0.3` and a plugin needs `commander@15.0.0`, both versions exist in the store as separate entries. Each project's `node_modules/` links to the version it needs. They coexist forever. No conflicts, no overwriting, no interference.

**Java analogy**: It's exactly like Maven's `~/.m2/repository/`. Maven stores `commander/14.0.3/commander-14.0.3.jar` and `commander/15.0.0/commander-15.0.0.jar` as separate files. Each project resolves to whichever version its `pom.xml` specifies. They never conflict. pnpm works the same way, but with filesystem-level deduplication, so the disk cost of having multiple versions is essentially zero for the shared parts.

This is why running `pnpm install` in a plugin directory is completely safe — it's just creating a local `node_modules/` that links to packages in the shared store. No duplication, no corruption, no interference with other projects.

---

## Prerequisites For Developers

| Prerequisite | Why | How to get it |
|-------------|-----|--------------|
| **Node.js 22** (LTS) | Runtime | `nvm install 22` |
| **nvm** | Manages Node versions | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh \| bash` |
| **pnpm** | Package manager | `npm install -g pnpm` |

Three standard developer tools. That's it.

### Why pnpm (not npm)?

The main Agentic HQ project uses pnpm (declared as `packageManager` in the root `package.json`). Plugin workflows use pnpm too, for consistency. This means:

- `pnpm-lock.yaml` locks exact dependency versions (not `package-lock.json`)
- `pnpm install` must be used (not `npm install`) — npm would ignore the lock file and potentially get different versions
- pnpm is a hard prerequisite for running plugin workflows

We considered supporting plain npm (which comes free with Node.js, reducing prerequisites to two). But consistency wins — one package manager everywhere means fewer surprises, and developers already need pnpm for the main project.

---

## TLDR

**Move what we already do into each skill's own directory. Same scripts, same tsx, same everything — just relocated. Each workflow is self-contained.**

Migration (per workflow):
0. Exclude plugins from pnpm workspace — add `- '!.agentic-hq/plugins/**'` to `pnpm-workspace.yaml` (one-time)
1. Move workflow code into `skills/<name>/ts-workflow/` with its own `package.json`
2. Create `SKILL.md` that supplies the full run command (including `--ignore-workspace`)
3. Get it working directly in the skill directory
4. Redirect main project's script to delegate to the skill directory
5. Update tests to point at the new location
6. Delete old redundant code from main project
7. Verify all tests pass

What the `agentic-hq` CLI runs (as supplied by the skill):
```bash
cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- <args>
```

Version protection — all built-in, no custom code:
- `.nvmrc` + `engines` + `engine-strict=true` = pnpm hard-fails with clear message if wrong Node version

What if tools are too old? `pnpm install` fails: "Unsupported engine. Run `nvm install 22`."
What if tools are too new? Almost certainly fine — Node.js backwards compatibility is excellent.
What if libraries are missing? `pnpm install` gets them. That's literally its job.
Why not pre-compile with esbuild? No benefit — `pnpm install` is unavoidable anyway, and adds "forgot to mark as external" risk.
