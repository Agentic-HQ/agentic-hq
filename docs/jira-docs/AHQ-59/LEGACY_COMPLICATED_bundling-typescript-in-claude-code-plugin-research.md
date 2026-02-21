# AHQ-59: Bundling TypeScript In A Claude Code Plugin — Research Document

## 1. Introduction

This document researches the different ways to bundle TypeScript code for distribution as part of a Claude Code plugin. It is written for a developer who is experienced in Java but new to the Node.js/npm ecosystem, so it explains concepts from the ground up with Java analogies where helpful.

The goal: understand how to take TypeScript source code (like `string-reversal-demo-cli.ts`) that currently lives in the Agentic HQ `src/` directory and **distribute it alongside a Claude Code plugin** so that the `agentic-hq` CLI can discover and run it.

The findings here will directly feed into [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56), which will implement the chosen approach.

---

## 2. Context Within This Project

### What We Have Today

The Agentic HQ project has TypeScript workflow programs in `src/demo/cli/` that are run using `tsx` (a TypeScript executor):

```bash
pnpm demo:string-reversal --string-to-reverse="hello"
# Which runs: tsx src/demo/cli/string-reversal-demo-cli.ts
```

This only works from within the Agentic HQ project workspace because:
- `tsx` is a dev dependency of the project
- The TypeScript source imports modules from the project's `src/` directory
- The project's `node_modules/` contains all required dependencies

### What We Want

Per AHQ-56, we want to:
1. Move the workflow TypeScript code **into the plugin directory** (e.g., `.agentic-hq/plugins/agentic-hq-demos-plugin/`)
2. Have the `agentic-hq` CLI ask a skill for the command to run
3. Run that command — the CLI doesn't need to know anything about how the TypeScript was compiled or built

### Key Constraints

- **Target runtime**: Node.js 22 (matching the project's `"engines": { "node": ">=22.0.0 <23.0.0" }`)
- **Users are developers**: They will have Node.js, npm/pnpm installed. Requiring standard dev tools is reasonable.
- **Native module dependency**: `ClaudeCodeTool` depends on `node-pty`, a native C++ module that **cannot** be bundled into a single JavaScript file (explained below)
- **Plugin distribution**: Plugins are distributed as directory trees via Git-based marketplaces, cached at `~/.claude/plugins/cache/`

---

## 3. Key Concepts For Java Developers

Before diving into the methods, here are the Node.js equivalents of concepts you already know from Java.

### 3.1 Compilation: TypeScript vs Java

| Concept | Java | TypeScript/Node.js |
|---------|------|-------------------|
| Source code | `.java` files | `.ts` files |
| Compiled output | `.class` bytecode (runs on JVM) | `.js` JavaScript (runs on Node.js) |
| Compiler | `javac` | `tsc` (TypeScript Compiler) |
| Runtime | `java` (JVM) | `node` (Node.js runtime) |

**Key difference**: Java compiles to bytecode that a virtual machine interprets. TypeScript compiles to JavaScript that Node.js executes directly. JavaScript is not bytecode — it's readable source code. This means you *could* skip compilation entirely and run TypeScript directly using tools like `tsx` (which compiles on-the-fly).

### 3.2 Packaging: JAR vs Bundle

| Concept | Java | Node.js |
|---------|------|---------|
| Package archive | `.jar` file (ZIP of `.class` files) | A "bundle" — a single `.js` file containing all code |
| Dependency manager | Maven / Gradle | npm / pnpm |
| Dependency manifest | `pom.xml` / `build.gradle` | `package.json` |
| Dependency cache | `~/.m2/repository/` | `node_modules/` folder in project |
| Running | `java -jar app.jar` | `node dist/app.js` |

**Key difference**: In Java, you package `.class` files into a self-contained JAR. In Node.js, "bundling" is **optional** — you can distribute raw `.js` files with a `package.json` and let the user run `npm install` to download dependencies. Or you can bundle everything into a single `.js` file. Both approaches work.

### 3.3 Native Modules: JNI vs Node Addons

In Java, if you need to call C/C++ code, you use JNI (Java Native Interface) with platform-specific `.so`/`.dll` files. In Node.js, the equivalent is **native modules** (also called "native addons") — C/C++ code compiled to `.node` binary files.

`node-pty` (which our `ClaudeCodeTool` uses for spawning pseudo-terminals) is a native module. Like JNI libraries:
- It must be **compiled for the specific OS and CPU architecture** (macOS ARM vs Linux x64, etc.)
- It must match the **Node.js version** it was built for
- It **cannot** be inlined into a JavaScript bundle file

This is the single biggest constraint on our bundling strategy.

### 3.4 Tools You'll Encounter

| Tool | What it is | Java analogy |
|------|-----------|--------------|
| **npm** | Package manager — installs dependencies | Maven (downloads deps) |
| **pnpm** | Faster, disk-efficient alternative to npm | Maven with a shared local cache |
| **npx** | Runs a package without installing it globally | `mvn exec:java` (runs without global install) |
| **tsx** | Runs TypeScript directly (compiles on-the-fly using esbuild) | Like running `.java` files without explicit `javac` step |
| **esbuild** | Ultra-fast bundler/compiler (written in Go) | Like Maven Shade Plugin (bundles deps into one file) |
| **tsup** | Friendly wrapper around esbuild for library bundling | Like Maven Shade Plugin with sensible defaults |
| **tsc** | The official TypeScript compiler | `javac` |
| **rollup** | Module bundler with tree-shaking | Like ProGuard (removes unused code) + Maven Shade |
| **webpack** | Full-featured bundler (originally for browsers) | Like an all-in-one build tool — powerful but complex |

---

## 4. The Two Big Decisions

Before comparing bundling tools, there are two higher-level decisions that shape everything else.

### 4.1 Decision 1: Distribute Source or Compiled Code?

**Option A: Distribute TypeScript source, compile at runtime**

The plugin directory contains `.ts` files. When the `agentic-hq` CLI needs to run the workflow, it executes something like `npx tsx src/workflow.ts`.

```
plugin-directory/
  ts-workflows/
    src/
      string-reversal-workflow.ts
    package.json          (lists dependencies)
    node_modules/         (installed dependencies — or installed on first run)
```

**Pros:**
- No build step needed during plugin development
- Developer can read/modify the source directly in the plugin
- Simple — what you write is what gets distributed
- Debugging is straightforward (source code is right there)

**Cons:**
- Requires `tsx` (or `ts-node`) to be available on the developer's machine
- Slightly slower startup (~100-300ms for tsx to compile on each run)
- Dependencies must be installed (`npm install` in plugin directory)
- Source code is exposed (may not matter for open-source plugins, but relevant for proprietary ones)

**Java analogy**: Like distributing `.java` source files and running them with something like `jshell` or `groovy` — works, but not the standard way to distribute production code.

---

**Option B: Distribute pre-compiled JavaScript, run with `node`**

The plugin directory contains `.js` files that were compiled during the plugin build process. The `agentic-hq` CLI runs `node dist/workflow.js`.

```
plugin-directory/
  ts-workflows/
    dist/
      string-reversal-workflow.js    (compiled output)
    package.json
    node_modules/                     (if external deps needed)
    README.md                         (link to source code repo)
```

**Pros:**
- No tsx/ts-node needed on developer's machine — just `node` (which they already have)
- Faster startup (no compilation step)
- If bundled into a single file, may not even need `npm install`
- More "production-ready" feel

**Cons:**
- Requires a build step during plugin development/release (someone must run the bundler)
- Debugging is harder (stack traces point to compiled code, not original TypeScript)
- Source maps can help with debugging but add complexity
- Developer can't easily read or modify the code in the plugin directory

**Java analogy**: Like distributing a `.jar` file — compiled, ready to run, but you need to look at the source repo to understand the code.

---

**Recommendation for this project**: **Option B (pre-compiled JavaScript)** is the better choice for distribution, with a clear link to the source code in a README. Reasons:
- Users of your plugin don't need tsx installed
- One fewer runtime dependency to manage
- This is the standard practice in the Node.js ecosystem for distributed packages
- You can still develop in TypeScript locally — the build step just happens before publishing the plugin
- The `agentic-hq` CLI just needs to run `node <path-to-js>` — the simplest possible execution model

---

### 4.2 Decision 2: Bundle Dependencies Inline or Keep Them External?

Once you've decided to distribute compiled JavaScript, the next question is what to do about dependencies.

**Option A: Bundle everything into a single file (inline dependencies)**

A bundler like esbuild takes your code AND all its `import` statements and produces one big `.js` file that contains everything. No `node_modules` needed.

```
plugin-directory/
  ts-workflows/
    dist/
      string-reversal-workflow.js    (2MB — includes commander, chalk, etc.)
    README.md
```

The `agentic-hq` CLI runs: `node dist/string-reversal-workflow.js`

**Pros:**
- **Zero install step** — the file just works with `node`
- No `node_modules`, no `npm install`, no dependency resolution
- Self-contained — like a Java fat JAR
- No risk of dependency version conflicts
- Simplest user experience: one file, one command

**Cons:**
- **Cannot bundle native modules** like `node-pty` (this is a hard technical limitation)
- File can be large (a few MB for typical CLI tools — not terrible, but larger than source)
- If two plugins use the same library, it's duplicated in each bundle
- Harder to debug (everything in one file)

---

**Option B: Bundle pure-JS dependencies inline, keep native modules external**

Bundle everything you can, but mark native modules as "external" so the bundler skips them. These native modules are then listed in `package.json` and installed via `npm install`.

```
plugin-directory/
  ts-workflows/
    dist/
      string-reversal-workflow.js    (500KB — includes commander, etc.)
    package.json                     (lists node-pty as dependency)
    node_modules/                    (contains compiled node-pty)
    README.md
```

The `agentic-hq` CLI runs: `node dist/string-reversal-workflow.js` (after ensuring `npm install` was run)

**Pros:**
- Works with native modules like `node-pty`
- Pure-JS deps are fully self-contained (no version conflicts)
- Smaller bundle than full external deps (only native modules external)

**Cons:**
- Still requires `npm install` for native modules
- More complex build configuration (must know which deps are native)
- Two-step process: install, then run

---

**Option C: Keep all dependencies external (no bundling of dependencies)**

Compile TypeScript to JavaScript but don't bundle dependencies. All imports resolve to `node_modules/` at runtime.

```
plugin-directory/
  ts-workflows/
    dist/
      string-reversal-workflow.js
      ClaudeCodeTool.js
      (... other compiled files ...)
    package.json                     (lists ALL dependencies)
    node_modules/                    (ALL installed dependencies)
    README.md
```

**Pros:**
- Simplest build configuration (just `tsc` to compile)
- Works with everything including native modules
- Standard npm-style distribution — familiar to Node.js developers
- Easy to debug (compiled files map 1:1 to source files)

**Cons:**
- Requires `npm install` — adds a setup step for users
- `node_modules` can be large (50-200MB for a typical project)
- Dependency version conflicts possible if plugin and host project share deps
- Multiple output files to manage

---

**Recommendation for this project**: **Option B (hybrid)** is the pragmatic choice. Bundle pure-JS dependencies inline (like `commander`) to reduce the number of external dependencies, while keeping native modules like `node-pty` external.

**Important reality**: Almost all Agentic HQ workflows use `ClaudeCodeTool`, which depends on the native module `node-pty`. This means **`npm install` is always required** for the plugin's TypeScript workflows — it is not an exception, it is the standard case. The benefit of Option B over Option C is that you reduce the number of external dependencies to just the native ones, which means fewer things that can go wrong during `npm install` and fewer version conflicts. But the install step itself is unavoidable.

Option A (zero-install single file) is only possible for the rare workflow that doesn't use `ClaudeCodeTool` at all.

---

## 5. Bundling Methods — Detailed Comparison

Now let's look at the actual tools you can use.

### 5.1 tsc (TypeScript Compiler) — "Just Compile, Don't Bundle"

**What it does**: `tsc` is the official TypeScript compiler. It converts `.ts` files to `.js` files, one-for-one. It does NOT bundle — each source file becomes a separate output file.

**How to use it**:
```bash
# Already in the project — just run:
npx tsc --outDir dist
```

This reads `tsconfig.json` and compiles all TypeScript in `src/` to JavaScript in `dist/`.

**What you get**:
```
dist/
  demo/cli/string-reversal-demo-cli.js
  tools/claude-code/ClaudeCodeTool.js
  tools/claude-code/types.js
  ... (one .js file per .ts file)
```

**Java analogy**: This is like `javac` — it compiles but doesn't package. You still need `node_modules/` for dependencies.

**Pros:**
- Already configured in the project (`tsconfig.json` exists)
- Zero new dependencies to install
- Output files map 1:1 to source (easy debugging)
- Full TypeScript type checking during compilation
- Most "standard" approach — the TypeScript team's own tool

**Cons:**
- Produces multiple files (not a single bundle)
- Does NOT include dependencies — `npm install` always required
- No tree-shaking (unused code is not removed)
- Slightly more complex to distribute (many files + `node_modules`)
- The project's current `tsconfig.json` has `noEmit: true` — you'd need a separate config for building

**Best for**: Projects where `npm install` is already expected (like npm packages), or where you want the simplest possible build with no new tools.

---

### 5.2 esbuild — "Ultra-Fast Bundler"

**What it does**: esbuild is an extremely fast JavaScript/TypeScript bundler written in Go. It compiles TypeScript AND bundles all imports into a single file. It's 10-100x faster than alternatives.

**How to use it**:
```bash
# Install as dev dependency
pnpm add -D esbuild

# Bundle a TypeScript file to a single JavaScript output
npx esbuild src/demo/cli/string-reversal-demo-cli.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --outfile=dist/string-reversal-workflow.js \
  --external:node-pty
```

Flags explained:
- `--bundle` — follow all imports and include them in the output
- `--platform=node` — we're targeting Node.js, not browsers
- `--target=node22` — transpile code to be compatible with Node 22 syntax
- `--outfile` — produce a single output file
- `--external:node-pty` — DON'T try to bundle this (it's a native module)

**What you get**:
```
dist/
  string-reversal-workflow.js    (single file, all pure-JS deps included)
```

**Java analogy**: Like the Maven Shade Plugin — takes your code and all its dependencies and produces a single "fat JAR" (except it's a single `.js` file).

**Pros:**
- Blazingly fast (~10ms for a typical CLI tool)
- Produces a single file (simplest distribution)
- Bundles pure-JS dependencies inline (no `npm install` for those)
- `--target=node22` ensures syntax compatibility
- Handles TypeScript directly (no separate `tsc` step needed)
- Very mature and widely used (powers Vite, tsup, and many other tools)
- Minimal configuration — CLI flags are often enough

**Cons:**
- Does NOT do TypeScript type checking (it strips types but doesn't validate them)
- You still need `tsc --noEmit` for type checking (which you already run in `pnpm validate`)
- Configuration is via CLI flags (can get verbose) — no `esbuild.config.ts` file natively
- Native modules must be explicitly marked `--external`
- Less feature-rich plugin ecosystem compared to webpack/rollup (though you won't need plugins for this use case)

**Best for**: CLI tools and libraries where you want fast, simple bundling with minimal configuration. **This is the most popular choice for Node.js CLI tools in 2026.**

---

### 5.3 tsup — "esbuild Made Easy"

**What it does**: tsup is a wrapper around esbuild specifically designed for building TypeScript libraries and CLI tools. It provides sensible defaults and a config file format.

**How to use it**:
```bash
# Install as dev dependency
pnpm add -D tsup

# Create tsup.config.ts
```

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/demo/cli/string-reversal-demo-cli.ts'],
  format: ['esm'],          // ES Modules (matches project's "type": "module")
  target: 'node22',
  platform: 'node',
  bundle: true,
  splitting: false,          // Single file output
  clean: true,               // Clean dist/ before build
  external: ['node-pty'],    // Don't bundle native modules
});
```

```bash
# Build
npx tsup
```

**What you get**: Same as esbuild — a single bundled `.js` file.

**Java analogy**: Like Maven Shade Plugin with a well-designed `pom.xml` configuration — same power as esbuild but with a cleaner configuration story.

**Pros:**
- Everything esbuild offers (fast, single-file output)
- Clean config file (`tsup.config.ts`) instead of long CLI flags
- Can auto-generate TypeScript type declaration files (`.d.ts`) if needed
- Can output both CJS and ESM formats simultaneously
- Popular and well-documented
- Designed specifically for the "building a TypeScript library" use case

**Cons:**
- One more dependency to install and learn
- Still uses esbuild under the hood — so same limitations (no type checking, native module exclusion)
- **Note**: Some reports suggest tsup's maintenance has slowed in 2025-2026, with `tsdown` (a Rolldown-based alternative) gaining traction. However, tsup still works well and has a large user base.

**Best for**: Projects that want the power of esbuild but prefer a config file over CLI flags, or that need multiple output formats.

---

### 5.4 Rollup — "Tree-Shaking Expert"

**What it does**: Rollup is a module bundler that excels at "tree-shaking" — removing unused code from the bundle. It's the bundler behind Vite (which you may have heard of).

**How to use it**:
```bash
pnpm add -D rollup @rollup/plugin-typescript @rollup/plugin-node-resolve @rollup/plugin-commonjs
```

```javascript
// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/demo/cli/string-reversal-demo-cli.ts',
  output: {
    file: 'dist/string-reversal-workflow.js',
    format: 'esm',
  },
  external: ['node-pty'],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
  ],
};
```

**Java analogy**: Like ProGuard (removes unused code) combined with Maven Shade (bundles into one file).

**Pros:**
- Best-in-class tree-shaking (smallest possible output)
- Very flexible plugin system
- Powers Vite — so has a massive ecosystem
- Can produce highly optimized bundles

**Cons:**
- Slower than esbuild (10-50x slower for typical builds)
- Requires multiple plugins for basic functionality (TypeScript support, CommonJS support, Node module resolution — each is a separate plugin to install)
- More configuration than esbuild/tsup
- Overkill for a CLI tool — tree-shaking matters more for browser bundles where every KB counts
- The build config above requires 3 plugins and a config file just to get started

**Best for**: Libraries distributed to many consumers where bundle size matters, or browser-targeted code. **Not recommended for our use case** — the complexity outweighs the benefits for a CLI plugin.

---

### 5.5 webpack — "The Kitchen Sink"

**What it does**: webpack is the original JavaScript bundler that pioneered the concept. It can do everything — bundling, code splitting, asset handling, hot module replacement, and more.

**How to use it**:
```bash
pnpm add -D webpack webpack-cli ts-loader
```

```javascript
// webpack.config.js
module.exports = {
  target: 'node',
  entry: './src/demo/cli/string-reversal-demo-cli.ts',
  output: {
    filename: 'string-reversal-workflow.js',
    path: __dirname + '/dist',
  },
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader' }],
  },
  externals: { 'node-pty': 'commonjs node-pty' },
  resolve: { extensions: ['.ts', '.js'] },
};
```

**Java analogy**: Like Gradle — incredibly powerful but with a learning curve. Can do anything, but you'll spend time configuring it.

**Pros:**
- Most feature-rich bundler — can handle any scenario
- Massive ecosystem of loaders and plugins
- Excellent documentation and community support

**Cons:**
- Significantly slower than esbuild (100-1000x for large projects)
- Complex configuration — even a simple setup requires understanding loaders, resolvers, and externals
- Way overkill for a Node.js CLI tool
- Designed primarily for browser bundles — Node.js support is secondary
- The mental model is complex (loaders, plugins, chunks, entries, etc.)

**Best for**: Complex web applications with many assets. **Not recommended for our use case** — too complex, too slow, designed for the wrong problem.

---

### 5.6 Bun — "All-In-One Runtime"

**What it does**: Bun is a JavaScript/TypeScript runtime (like Node.js) that also includes a bundler, package manager, and test runner. It can execute TypeScript directly and bundle it.

**How to use it**:
```bash
bun build src/demo/cli/string-reversal-demo-cli.ts \
  --target=node \
  --outfile=dist/string-reversal-workflow.js
```

**Java analogy**: Like if the JVM also included Maven, JUnit, and a compiler all in one binary.

**Pros:**
- Extremely fast (written in Zig)
- Can run TypeScript directly (no compilation step)
- Built-in bundler, no extra tools needed
- Can target Node.js output (code runs on `node`, not just `bun`)

**Cons:**
- Requires Bun to be installed on the **build** machine (not common on all developer machines yet)
- When targeting `--target=node`, output must still run on Node.js (so Bun-specific APIs can't be used)
- Smaller ecosystem than Node.js — some npm packages don't work perfectly with Bun
- Adds a non-standard tool dependency to the project
- The project already uses pnpm + Node.js — adding Bun introduces friction

**Best for**: Projects that are all-in on Bun as their runtime. **Not recommended for our use case** — we're targeting Node.js developers, and adding Bun as a build-time dependency creates unnecessary complexity.

---

### 5.7 Node.js Single Executable Applications (SEA)

**What it does**: Node.js SEA lets you embed a JavaScript file into the `node` binary itself, producing a standalone executable that doesn't require Node.js to be installed.

**How to use it**:
```bash
# 1. Bundle your code into a single JS file first (using esbuild, etc.)
# 2. Create a SEA config:
echo '{ "main": "dist/workflow.js", "output": "dist/workflow.blob" }' > sea-config.json
# 3. Generate the blob:
node --experimental-sea-config sea-config.json
# 4. Copy the node binary and inject the blob:
cp $(which node) dist/workflow-executable
npx postject dist/workflow-executable NODE_SEA_BLOB dist/workflow.blob
```

**Java analogy**: Like GraalVM Native Image — compiles to a standalone native executable. Or like jlink, which bundles the JRE with your app.

**Pros:**
- Zero dependencies — single executable file, no Node.js needed
- Tamper-resistant
- Simplest distribution for non-developers

**Cons:**
- Still experimental/early-stage in Node.js 22 (the `--experimental-sea-config` flag is a clue)
- Complex build process (multiple steps)
- Large output files (the entire Node.js runtime is embedded — 50-80MB per executable)
- Platform-specific — need separate builds for macOS, Linux, Windows
- Cannot dynamically load native modules (so `node-pty` won't work at all)
- If the Node.js version in the binary is wrong, you can't easily update it

**Best for**: Distributing CLI tools to non-developers who don't have Node.js installed. **Not recommended for our use case** — our users are developers who already have Node.js, and the native module limitation is a dealbreaker.

---

### 5.8 tsx — "Run TypeScript Directly"

**What it does**: `tsx` is a tool that executes TypeScript files directly without a separate compilation step. Under the hood, it uses esbuild to transpile on-the-fly.

**How to use it**:
```bash
# If tsx is installed locally (already a devDependency in this project):
npx tsx src/demo/cli/string-reversal-demo-cli.ts

# Or if globally installed:
tsx src/demo/cli/string-reversal-demo-cli.ts
```

**Java analogy**: Like JBang or `jshell` — run Java source files directly without explicit compilation.

**Pros:**
- **Zero build step** — no compilation, no bundling, no config
- What you see is what runs (source TypeScript)
- Already a dev dependency in the Agentic HQ project
- Fast startup (~100-300ms overhead for compilation)
- Perfect for development and testing

**Cons:**
- Requires `tsx` to be installed on the developer's machine
- Requires `node_modules/` to be populated (all dependencies must be installed)
- Compilation happens every time (not cached between runs)
- Not suitable for "production" distribution — adds unnecessary overhead
- Dependency on tsx adds a potential point of failure

**How npx fits in**: Running `npx tsx src/app.ts` will:
1. Check if `tsx` is in local `node_modules/.bin/` — if yes, use it
2. If not, download it temporarily from npm, run it, then discard it
3. This download-on-demand behaviour makes it convenient but adds network dependency and latency on first run

**Best for**: Local development and testing. **Not recommended as the primary distribution method**, but excellent for the development workflow alongside a bundled output.

---

## 6. Versioning And Compatibility

This section addresses the three specific versioning questions from the Jira.

### 6.1 What If The Developer's Node.js Is Too Old?

**What happens without any protection**: The developer runs `node dist/workflow.js` and gets a cryptic error. Depending on what Node 22 feature was used:

| Feature used | Error on older Node | How clear is it? |
|-------------|-------------------|------------------|
| `fetch()` (built-in since Node 18) | `ReferenceError: fetch is not defined` | Fairly clear |
| `node:` protocol imports | `Error: Cannot find module 'node:fs'` | Confusing — looks like a missing package |
| New syntax features | `SyntaxError: Unexpected token` | Confusing — no mention of version |

**How to protect against this**: Add a **runtime version check** at the very top of the entry point, BEFORE any other code runs. This must be plain JavaScript (not TypeScript) and use only syntax compatible with very old Node versions:

```javascript
#!/usr/bin/env node

// Version check — must use old-style JS syntax (no optional chaining, etc.)
var nodeVersion = process.versions.node.split('.').map(Number);
var major = nodeVersion[0];
var minor = nodeVersion[1];

if (major < 22) {
  console.error('');
  console.error('ERROR: This plugin requires Node.js >= 22.0.0');
  console.error('You are running Node.js ' + process.version);
  console.error('');
  console.error('To fix this:');
  console.error('  Option 1: nvm install 22 && nvm use 22');
  console.error('  Option 2: Download from https://nodejs.org/');
  console.error('');
  process.exit(1);
}

// Now safe to use modern syntax and imports
// ... rest of the application
```

This is the pattern used by popular CLI tools like ESLint, Prettier, and Angular CLI.

**The `engines` field** in `package.json` also helps, but it's a soft check:
- **npm**: Shows a warning during `npm install` but does NOT prevent installation
- **pnpm**: Stricter — can be configured to fail installation if `engines` doesn't match (with `engine-strict=true` in `.npmrc`)
- **Neither** checks at runtime — it's install-time only

**Recommendation**: Use BOTH approaches:
1. `"engines": { "node": ">=22.0.0" }` in `package.json` for install-time warning
2. Runtime version check at the top of the entry point for runtime protection

### 6.2 What If The Developer's Node.js Is Very New?

**What happens**: This is **usually fine**. Node.js has excellent backwards compatibility — code written for Node 22 will almost certainly work on Node 24, 26, etc. The Node.js team rarely removes features, and when they do, they deprecate them for several major versions first.

**When it could be a problem**: If the plugin uses a deprecated API that was eventually removed (rare, but possible). Example: `require('url').parse()` was deprecated in favour of `new URL()`, but it still works years later.

**How to protect against this**:
- Set a maximum version if needed: `"engines": { "node": ">=22.0.0 <24.0.0" }` (but only if you have a specific reason)
- Test against latest LTS in CI
- Don't use deprecated APIs
- The runtime version check can also warn on untested versions:

```javascript
if (major > 23) {
  console.warn('WARNING: This plugin was tested with Node.js 22-23.');
  console.warn('You are running Node.js ' + process.version);
  console.warn('It should work, but if you encounter issues, please report them.');
  // Don't exit — just warn
}
```

**Recommendation**: Don't worry too much about this. Set `engines` with a minimum version. Only add a maximum version if you discover a specific incompatibility.

### 6.3 What If Dependencies Are Missing?

This depends on which bundling strategy you chose (from Section 4.2):

| Strategy | Missing deps scenario | What happens |
|----------|----------------------|-------------|
| **Full inline bundle** (Option A) | Dependencies are inside the JS file | **Not possible** — everything is self-contained |
| **Hybrid bundle** (Option B) | Native module not installed | `Error: Cannot find module 'node-pty'` — clear-ish error |
| **External deps** (Option C) | Any dependency not installed | `Error: Cannot find module 'commander'` — clear error |

**How to protect against this**: For Options B and C, add a **pre-flight check** that runs before the main application:

```javascript
// Pre-flight dependency check
function checkDependencies() {
  const required = ['node-pty'];  // List native/external deps
  const missing = [];

  for (const dep of required) {
    try {
      require.resolve(dep);
    } catch {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    console.error('');
    console.error('ERROR: Missing required dependencies: ' + missing.join(', '));
    console.error('');
    console.error('Run the following command in the plugin directory:');
    console.error('  cd ' + __dirname + ' && npm install');
    console.error('');
    process.exit(1);
  }
}
```

**Can dependencies auto-install?** Yes — and they should. See Section 6.5 below.

### 6.5 Automatic Dependency Installation (Solving The Hidden Directory Problem)

**The problem**: Plugin code lives in a hidden cache directory like `~/.claude/plugins/cache/agentic-hq-plugins/some-plugin/0.0.1/ts-workflows/`. Asking developers to `cd` into this path and run `npm install` is terrible UX.

**Key discovery: node-pty ships pre-built binaries.** We verified that `node-pty` (the native module that all workflows depend on) already includes pre-compiled `.node` binaries for:
- `darwin-arm64` (macOS Apple Silicon — your machine)
- `darwin-x64` (macOS Intel)
- `win32-arm64` (Windows ARM)
- `win32-x64` (Windows x64)

This means `npm install` is just a **download** — no C++ compiler needed on the developer's machine. This makes auto-install much safer and faster than if compilation were required.

**Recommended approach: layered auto-install**

| Layer | When it runs | What it does |
|-------|-------------|-------------|
| **1. Auto-install at first run** (primary) | `agentic-hq` CLI detects missing `node_modules` before executing a workflow | Runs `npm install --production` automatically with visible output |
| **2. `agentic-hq setup` command** (explicit) | Developer runs it manually whenever they want | Finds all installed plugins and runs `npm install` in each |
| **3. Post-marketplace-install hook** (future) | Plugin is installed via marketplace | Plugin manager runs `npm install` as part of installation |

**How Layer 1 (auto-install at first run) works:**

```javascript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

function ensureDependenciesInstalled(pluginWorkflowDir) {
  const nodeModulesPath = path.join(pluginWorkflowDir, 'node_modules');
  const packageJsonPath = path.join(pluginWorkflowDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return; // No dependencies to install
  }

  if (!existsSync(nodeModulesPath)) {
    console.log('Installing plugin dependencies (first run)...');
    console.log('  Directory: ' + pluginWorkflowDir);
    try {
      execSync('npm install --production', {
        cwd: pluginWorkflowDir,
        stdio: 'inherit', // Show npm output to user
      });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('');
      console.error('ERROR: Failed to install plugin dependencies.');
      console.error('Try running manually:');
      console.error('  cd ' + pluginWorkflowDir + ' && npm install');
      console.error('');
      process.exit(1);
    }
  }
}
```

**Why this is safe:**
- `npm install --production` only installs runtime dependencies, not devDependencies (smaller, faster, more secure)
- `node-pty` has prebuilt binaries — no compiler needed, install is just a download
- Clear output shows the developer what's happening (no silent magic)
- If it fails, fallback to a clear error message with the manual command
- Only runs when `node_modules` is missing — subsequent runs skip the check instantly

**Why popular tools do this:**
- VS Code extensions auto-install dependencies when activated
- Homebrew formulae run post-install steps automatically
- Docker images install deps during build
- The pattern is trusted in developer tools because developers expect managed dependency handling

**Java analogy**: Like Maven automatically downloading dependencies from the central repository the first time you build a project. You don't manually download JARs — Maven does it for you. This is the same concept.

### 6.4 Using nvm To Manage Node.js Versions

**What is nvm?** nvm (Node Version Manager) lets you install and switch between multiple Node.js versions on the same machine. It's the standard way developers manage Node.js versions.

**Java analogy**: Like SDKMAN! or jEnv for managing JDK versions (e.g., switching between Java 17 and Java 21).

**How it works**: You already have it installed and configured:

```
$ nvm list
       v22.17.0
->     v22.20.0        # currently active
default -> 22.20.0
lts/jod -> v22.20.0    # Node 22 is the current LTS
```

**The `.nvmrc` file**: You can add a `.nvmrc` file to the project root that specifies the required Node.js version:

```
# .nvmrc
22
```

When a developer `cd`s into the project directory and runs `nvm use`, nvm reads this file and switches to the right version. Some shell configurations (like oh-my-zsh with the nvm plugin) do this **automatically** on `cd`.

**Java analogy**: Like a `.java-version` file used by jEnv, or the `<java.version>` property in a Maven `pom.xml`.

**The "missing packages" gotcha you experienced**: When you switch Node.js versions with nvm, globally installed packages don't carry over. This is because each Node version has its own `lib/node_modules/` directory. So if you had `tsx` installed globally on v22.17.0 and switched to v22.20.0, `tsx` wouldn't be there.

This is actually **by design** — it prevents version conflicts — but it's confusing the first time you hit it. Solutions:
1. **Don't rely on global packages** — use local project dependencies (`devDependencies` in `package.json`) and run via `npx` or `pnpm exec`. This is already what the Agentic HQ project does.
2. **Use `nvm install --reinstall-packages-from=22.17.0`** when upgrading — this copies global packages from the old version.
3. **Create a `~/.nvm/default-packages`** file listing packages you always want installed with every new Node version.

**Recommendation for this project**:
1. **Add a `.nvmrc` file** to the project root containing `22` — this makes the required version explicit
2. **Require nvm** as a documented prerequisite (reasonable for developers)
3. **Use local dependencies, not global** — the project already does this correctly via `devDependencies`
4. **The runtime version check** (from 6.1) should suggest `nvm use` in its error message — which it already does:
   ```
   To fix this:
     Option 1: nvm install 22 && nvm use 22
   ```
5. **Document in the plugin README**: "This plugin requires Node.js 22. If you use nvm, run `nvm use` in the project directory."

**Combined version protection strategy (bringing 6.1-6.4 together)**:

| Layer | What it does | When it runs |
|-------|-------------|-------------|
| `.nvmrc` file | Tells nvm which Node version to use | When developer runs `nvm use` (or auto on `cd`) |
| `engines` in `package.json` | Warns/fails during `npm install` if version is wrong | At dependency install time |
| Runtime version check in code | Hard-fails with clear error + nvm instructions | Every time the CLI runs |
| Dependency pre-flight check | Verifies native modules are installed | Every time the CLI runs |

This gives four layers of protection. A developer with the wrong Node version will hit at least one of these before getting a cryptic error.

---

## 7. Comparison Table

| Criterion | tsc | esbuild | tsup | rollup | webpack | Bun | Node.js SEA | tsx |
|-----------|-----|---------|------|--------|---------|-----|------------|-----|
| **Output** | Multiple .js files | Single .js file | Single .js file | Single .js file | Single .js file | Single .js file | Standalone binary | Raw .ts files |
| **Speed** | Moderate | Extremely fast | Very fast | Moderate | Slow | Extremely fast | N/A (multi-step) | Fast (on-the-fly) |
| **Config complexity** | Low (tsconfig.json) | Low (CLI flags) | Low (config file) | Medium (plugins) | High (loaders) | Low (CLI flags) | High (multi-step) | None |
| **Bundles dependencies inline?** | No | Yes | Yes | Yes | Yes | Yes | Yes (pre-bundled) | No |
| **Handles native modules?** | Yes (external) | Yes (mark external) | Yes (mark external) | Yes (mark external) | Yes (mark external) | Yes (mark external) | No | Yes (external) |
| **Type checking?** | Yes | No (use tsc separately) | No (use tsc separately) | Via plugin | Via loader | No | N/A | No |
| **New deps to install?** | None (already in project) | 1 (`esbuild`) | 1 (`tsup`) | 3+ (rollup + plugins) | 3+ (webpack + loaders) | 1 (`bun`) | None | None (already in project) |
| **Requires Node.js on target?** | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes + tsx |
| **npm install needed on target?** | Always | Only for native modules | Only for native modules | Only for native modules | Only for native modules | Only for native modules | Never | Always |
| **Ecosystem maturity** | Official TS tool | Very mature | Mature | Very mature | Very mature | Maturing | Experimental | Mature |
| **Suited for CLI plugin distribution?** | OK | Excellent | Excellent | Overkill | Overkill | Awkward fit | Not practical | Dev only |

---

## 8. Conclusion And Recommendation

### Recommended Approach: esbuild (direct)

For the Agentic HQ plugin system, **esbuild** is the recommended bundling tool. Here's why:

1. **Simplest effective solution**: One command bundles TypeScript + dependencies into a single `.js` file
2. **Fastest build tool available**: Builds in milliseconds, not seconds
3. **Minimal configuration**: CLI flags are sufficient — no config file needed
4. **Handles the native module constraint**: `--external:node-pty` cleanly excludes what can't be bundled
5. **Already proven**: Powers tsx (which the project already uses) and tsup
6. **One new dependency**: Just `pnpm add -D esbuild`

tsup is a close second (it's esbuild with a nicer config file), but for this project's needs, direct esbuild is simpler and has one fewer abstraction layer.

### Recommended Distribution Model

Since almost all workflows use `ClaudeCodeTool` (which depends on `node-pty`), **`npm install` is always required** — this is the standard case, not an exception.

```
plugin-directory/
  ts-workflows/
    dist/
      string-reversal-workflow.js     (bundled with esbuild, pure-JS deps inlined)
    package.json                      (lists node-pty + engines field)
    node_modules/                     (installed via npm install — contains native modules)
    .nvmrc                            (contains "22")
    README.md                         (links to source code, build instructions, setup steps)
```

**Build command** (run during plugin development/release):
```bash
npx esbuild src/workflow.ts \
  --bundle --platform=node --target=node22 \
  --outfile=dist/workflow.js \
  --external:node-pty
```

**Run command** (what the `agentic-hq` CLI executes):
```bash
# First run: agentic-hq auto-detects missing node_modules, runs npm install automatically
# Subsequent runs: skips install, runs immediately
node dist/workflow.js --string-to-reverse="hello"
```

The developer never needs to know where the plugin cache directory is. The `agentic-hq` CLI handles dependency installation transparently on first run.

### Recommended Version And Dependency Protection (five layers)

1. **`.nvmrc`** in project root containing `22` — so `nvm use` switches to the right version automatically
2. **`package.json`**: Include `"engines": { "node": ">=22.0.0" }` — warns/fails at install time
3. **Runtime version check**: At the top of each entry point, check Node version with `nvm use` suggestion in error message
4. **Auto-install dependencies**: `agentic-hq` CLI auto-runs `npm install --production` on first run if `node_modules` is missing (transparent to developer)
5. **README.md**: Document the Node.js version requirement, nvm usage, and link to source code

### Summary of Key Decisions (for human review)

| Decision | Recommendation | Alternative |
|----------|---------------|-------------|
| Source or compiled? | **Pre-compiled JS** in plugin | TypeScript source + tsx at runtime |
| Bundle tool? | **esbuild** (direct) | tsup (if you prefer a config file) |
| Dependency strategy? | **Hybrid** (inline pure-JS, external natives) — `npm install` always needed since all workflows use node-pty | Full external (simpler build, same npm install requirement) |
| Version protection? | **4 layers: .nvmrc + engines + runtime check + dep check** | Engines field only (weaker) |
| Node version management? | **Require nvm** (reasonable for developers) | Document version requirement only |
| What to distribute? | **Compiled JS + package.json + README** | Source TS (requires tsx on target) |

### Next Steps

1. Review this document and the clarifications doc together
2. Agree on the approach
3. Implement in [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
