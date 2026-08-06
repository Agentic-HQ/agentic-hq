# AHQ-196 — Perplexity Q&A: Second Opinion On The Implementation Plan

> **Outcome (recorded after the answer below was received):** Perplexity's verdict — "a good and
> fairly standard solution"; it endorsed tsc + package self-reference + `publishConfig` over all
> the rejected alternatives. Its recommendations were triaged into the plan — see
> `../../02-implementation-plan.md`, "Update From AI 01".

Copy everything between the START and END markers below into https://perplexity.ai, then paste
its reply into the "Perplexity's Answer" placeholder at the bottom of this file.

---- START OF QUESTION FOR PERPLEXITY ----

I'd like a second opinion on an npm packaging/build plan for a TypeScript project before we
implement it. Please assess whether the approach is standard and sound, and point out any risks.
Note this is a more-than-average-complexity packaging problem: the npm package is a workflow
system that ships runnable sub-programs inside itself, not just a single CLI binary.

**The system.** `agentic-hq` is a Node.js CLI (ESM, `"type": "module"`, supports Node 22/24 LTS)
that orchestrates AI developer workflows. Besides the main CLI (~65 TypeScript files under
`src/`), the package must also ship *plugin workflow programs* — small standalone TypeScript CLIs
living in a `.agentic-hq/plugins/**/skills/<name>/ts-workflow/src/` tree inside the package. At
runtime the main CLI launches an AI coding agent (the Claude Code CLI), which returns a shell
command; the main CLI then executes that command, which launches one of the bundled workflow
programs as a separate Node process. Each workflow program imports the parent package by name via
a subpath export: `import { … } from 'agentic-hq/tools/claude-code'`.

**Today (dev-only model, works fine but only from a cloned repo).** There is no build step. The
CLI's `bin` wrapper runs TypeScript source via `tsx`. The root `package.json` `exports` map
points at `.ts` source files. When a bundled workflow runs in dev, it first does `pnpm install`
in its own directory and symlinks `node_modules/agentic-hq` back to the repo root, then runs
under tsx. All relative imports in the source already carry `.js` extensions, so the code is
ESM-emit-ready.

**The goal.** Publish to npm as a prebuilt, read-only artifact: `npm install -g agentic-hq` /
`npx agentic-hq` must work with no cloned repo, no pnpm, no tsx, no runtime installs, and nothing
ever written inside the installed package directory at runtime. Constraint: the contributors'
cloned-repo dev workflow must keep working completely unchanged in this first step. A further
goal is a deterministic build (dev mode will later rebuild the artifact on the fly and must get
byte-identical output for dev/prod parity).

**The plan (a tracer bullet proving one bundled workflow end-to-end):**

1. A single `tsc` build (`tsconfig.build.json` with `rootDir: "."`, `outDir: "dist"`) compiles
   both `src/**` (the CLI) and the one workflow program, mirroring the repo layout under `dist/`.
   No bundler. A TypeScript `paths` mapping handles typechecking of the self-referencing import;
   tsc leaves the bare import specifier untouched in the emitted JS.
2. The compiled workflow JS therefore lives at
   `dist/.agentic-hq/plugins/.../ts-workflow/src/<name>.js` — *inside* the package. At runtime
   its `import 'agentic-hq/tools/claude-code'` resolves via **Node package self-reference**: the
   nearest ancestor `package.json` is the root manifest (name `agentic-hq`, has an `exports`
   field), whose exports target points at compiled `dist/` JS in the published artifact.
   Third-party runtime deps (`commander`, `node-pty`, `fast-glob`) resolve by Node's normal
   upward `node_modules` walk to the installed package's own dependencies.
3. To keep dev untouched while the shipped artifact differs, we use **`publishConfig` field
   overrides applied by `pnpm pack`**: the working-tree manifest keeps the dev `bin` (tsx
   wrapper) and dev `exports` (`.ts` targets), while the tarball's manifest gets `bin` pointing
   at a new `bin/agentic-hq-prebuilt.cjs` (which just runs `node dist/src/cli/main.js`) and
   `exports` pointing at `./dist/.../index.js`. pnpm's docs say `publishConfig` can override
   `bin`, `exports`, `main`, `types` etc. at pack/publish time; npm's own packer does not apply
   these overrides, so the tarball is produced with `pnpm pack` (contributor-side only) and then
   installed with npm as normal.
4. A `files` whitelist (`bin`, `dist`, `scripts`, `.agentic-hq`) is added, because `dist/` is
   gitignored and would otherwise be excluded from the tarball (npm/pnpm packers fall back to
   `.gitignore` when there is no `files` field).
5. Build determinism is verified by building twice into two directories and comparing recursive
   SHA-256 hashes of the outputs.

**Why we believe this is standard practice (please challenge):** compiling TypeScript to `dist/`
at publish time with a `files` whitelist and repointing `bin`/`exports` at built output is the
canonical shape for published npm CLIs; Node package self-reference is a documented, stable Node
feature designed exactly for code inside a package importing that package by its own name; pnpm
`publishConfig` overrides are a documented, widely used mechanism for "source exports in dev,
dist exports when published"; and tsc-only (no bundler) is a legitimate, dependency-free choice
when the source is already ESM-ready.

**My questions:**

1. Is this overall approach standard and sound for this shape of problem — a package shipping
   internal sub-programs that import the parent package by name? Would you structure it
   differently?
2. Is Node package self-reference reliable here on Node 22/24 — including when the package is
   installed globally or run via npx — and are there known gotchas (exports-map conditions,
   `"type": "module"` interactions, symlinked global installs)?
3. Are pnpm `publishConfig` overrides of `bin` and `exports` actually applied by `pnpm pack` in
   current pnpm (v11)? Any known issues or version caveats?
4. Any pitfalls with the `files` whitelist vs `.gitignore` interaction, or with shipping a
   dot-directory (`.agentic-hq/`) inside an npm package?
5. Alternatives we considered and rejected: bundling each workflow program with esbuild/tsup
   (adds a devDependency and bundles/rewrites imports), rewriting the import specifier to a
   relative path at build time, or conditional exports. Given the constraints (no new
   dependencies, dev workflow untouched, deterministic output), do you agree tsc +
   self-reference + publishConfig overrides is the better fit?

Please give a clear verdict: do you understand what we're trying to do, is this a good and
standard way to do it, and what risks have we missed?

---- END OF QUESTION FOR PERPLEXITY ----

## Perplexity's Answer

## Verdict

Yes—I understand the design: the published package is both a normal ESM CLI and a container for runnable workflow subprograms. Those subprograms are executed from inside the installed package, but import selected implementation APIs through the package’s own public subpath exports.

The overall approach is **standard and technically sound**, and `tsc` plus package self-reference is a reasonable fit. I would proceed with it, but only after addressing a few important packaging and release-test risks—especially nested `package.json` files, manifest verification, and the fact that `publishConfig` is pnpm-specific.

## 1. Architecture assessment

Your proposed artifact shape is valid:

```text
package/
  package.json              # published manifest
  bin/
    agentic-hq-prebuilt.cjs
  dist/
    src/...
    .agentic-hq/plugins/.../ts-workflow/src/foo.js
  .agentic-hq/
    plugins/...              # runtime workflow metadata/assets
```

A compiled workflow can import:

```js
import { ... } from "agentic-hq/tools/claude-code";
```

provided the published manifest contains an export such as:

```json
{
  "exports": {
    ".": "./dist/src/index.js",
    "./tools/claude-code": "./dist/src/tools/claude-code/index.js"
  }
}
```

Node explicitly supports package self-reference by package name when the package has both a `name` and an `exports` field. Self-reference is constrained by the exports map, which is desirable here because it prevents accidental access to unrelated internal files. [nodejs](https://nodejs.org/api/packages.html)

Using plain `tsc` is also defensible. Since your source already uses ESM-compatible `.js` specifiers, the emitted JavaScript should be directly runnable without a bundler or runtime TypeScript loader.

I would not bundle the workflow programs merely to make self-reference work. Bundling would introduce more transformation behavior, potentially duplicate dependencies, and complicate the relationship between the workflow programs and the parent package’s exported APIs.

## 2. The biggest hidden risk: nested manifests

The most important thing to verify is whether any workflow directory contains a `package.json`, particularly under:

```text
.agentic-hq/plugins/**/skills/<name>/ts-workflow/
```

Your current development workflow apparently runs `pnpm install` in each workflow directory. That strongly suggests there may be a local `package.json` there.

A nested `package.json` can change Node’s package-scope and package-resolution behavior. In the published artifact, the workflow may no longer be considered part of the root `agentic-hq` package for self-reference purposes, or it may resolve against a different package scope. The phrase “nearest ancestor `package.json` is the root manifest” is only safe if that is actually true in the shipped artifact.

Recommended options:

- Do not publish workflow-local `package.json` files.
- Keep development-only manifests outside the published subtree.
- Add a release-time assertion that the compiled workflow’s ancestor chain contains no nested package manifest before the root package manifest.
- Test the exact extracted tarball, not just `dist/` in the repository.

If a workflow must retain a manifest for development, exclude it explicitly and ensure that the emitted workflow path in the artifact has no intervening `package.json`.

This is more important than the global-install or npx case.

## 3. Self-reference on global installs and npx

Self-reference should work on Node 22 and Node 24 in both cases:

- `npm install -g agentic-hq`
- `npx agentic-hq`

The global executable is normally a link or shim to the package’s declared `bin` file; Node then loads modules based on the installed package’s actual location. npm documents that global installation links the declared bin entry into the global binary directory. [docs.npmjs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json/)

Likewise, `npx` installs or reuses a package in its cache and invokes its bin entry. The package name self-reference is resolved from the module’s package context, not from the shell’s current working directory.

Important conditions:

- The workflow JS must physically remain inside the published package.
- The root published `package.json` must have the correct `name` and `exports`.
- The subpath must be explicitly exported.
- The export target must use a relative path beginning with `./`; Node requires this for exports targets. [nodejs](https://nodejs.org/api/packages.html)
- The relevant branch must be available under the `import` condition, since the programs are ESM.
- Any `require` callers need a compatible `require` branch or must not be supported.

For example:

```json
{
  "exports": {
    "./tools/claude-code": {
      "import": "./dist/src/tools/claude-code/index.js",
      "default": "./dist/src/tools/claude-code/index.js"
    }
  }
}
```

You probably do not need a `require` condition if the package is intentionally ESM-only.

Symlinked global installations are not inherently a problem. However, test at least:

- global npm installation,
- `npx --yes agentic-hq`,
- installation from the generated tarball,
- execution from an unrelated current working directory,
- execution through the actual installed bin shim.

Do not test only by running `node dist/src/cli/main.js` from the repository.

## 4. `publishConfig` and pnpm v11

Your understanding is correct for pnpm: pnpm documents `publishConfig` overrides for `bin`, `main`, `exports`, `types`, and several other package metadata fields.  npm itself does not generally apply these package-metadata overrides; npm’s own issue tracker describes this as a feature not currently supported by npm. [pnpm](https://pnpm.io/package_json)

Therefore this is sound:

```json
{
  "bin": {
    "agentic-hq": "./bin/agentic-hq-dev.cjs"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "publishConfig": {
    "bin": {
      "agentic-hq": "./bin/agentic-hq-prebuilt.cjs"
    },
    "exports": {
      ".": "./dist/src/index.js",
      "./tools/claude-code": "./dist/src/tools/claude-code/index.js"
    }
  }
}
```

The caveat is operational rather than conceptual: **the release pipeline must never accidentally use npm to pack the repository directly**. Pin pnpm in CI and make the release command explicit, for example:

```text
pnpm install --frozen-lockfile
pnpm build
pnpm pack
```

Then inspect the resulting tarball’s actual manifest:

```text
package/package.json
```

Do not infer that the override worked merely because the source manifest contains `publishConfig`.

I would add an automated assertion that the tarball manifest has:

- the prebuilt bin target,
- only compiled export targets,
- no `.ts` export targets,
- no development-only scripts or paths,
- the expected `files` contents.

Also test the exact pnpm version you intend to support. pnpm’s behavior is documented, but it is still package-manager behavior rather than an npm-registry contract. A future release pipeline that switches to `npm publish`, Changesets configured to invoke npm, or another packer could silently produce an unusable package.

A staging directory containing a generated final `package.json` is more tool-independent, but it would require more restructuring. Under your “dev unchanged” constraint, pnpm `publishConfig` is a reasonable first implementation.

## 5. `files` and dot-directories

The whitelist is the right direction. npm’s `files` entries use inclusion-style patterns and recursively include listed directories. npm also notes that, absent a `.npmignore`, `.gitignore` can influence what is packed; a `files` field makes the intended package surface much more explicit. [docs.npmjs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)

Be careful about these details:

- `"dist"` includes the compiled tree recursively.
- `"bin"` includes the wrapper.
- `"scripts"` may include files that are unnecessary or accidentally executable.
- `".agentic-hq"` should be explicitly listed, preferably as `".agentic-hq"` or `".agentic-hq/**/*"`.
- A `.gitignore` or `.npmignore` inside `.agentic-hq` or one of its descendants may still affect files below that directory.
- Dotfiles are not automatically equivalent to ordinary files under every ignore pattern; verify the packed result rather than relying on pattern intuition.

The npm documentation specifically notes that subdirectory ignore files can affect inclusion, even when a root `files` field is present. [docs.npmjs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)

Use all of these checks in CI:

```text
pnpm pack
tar -tf agentic-hq-<version>.tgz
npm install ./agentic-hq-<version>.tgz --prefix <temporary-directory>
```

Then run the CLI and the workflow from the temporary installation.

## Additional risks

### Runtime dependencies

Every dependency needed by compiled CLI code and compiled workflows must be in `dependencies`, not only `devDependencies`. This includes dependencies imported exclusively by a workflow.

In particular, test `node-pty` on every supported platform and architecture. It may involve native binaries or platform-specific installation behavior. “No runtime installs” does not mean “no install-time native setup”; npm may still run the dependency’s install process during installation.

Also distinguish package dependencies from external executables. If Claude Code is required, document and validate that separately; it cannot be supplied by the npm package unless you intentionally package it.

### Stale and incomplete builds

Always clean `dist/` before compiling. Otherwise deleted source files can remain in the artifact and make builds appear inconsistent.

Your build should fail if:

- a workflow source is omitted,
- an exported source module is not emitted,
- an export target does not exist,
- a `.ts` file is accidentally referenced by emitted runtime JavaScript,
- a workflow-local `package.json` slips into the artifact.

### Determinism

Comparing two `dist/` trees is useful, but it is not the same as proving deterministic packages. Also compare:

- generated declarations, if emitted,
- source maps,
- generated metadata,
- the final tarball file list,
- the extracted published `package.json`.

Tar archives and gzip layers can contain timestamps or ordering differences even when their extracted files are identical. If byte-identical tarballs are a requirement, normalize file ordering, timestamps, and archive metadata—or define determinism as byte-identical extracted artifact contents instead.

TypeScript itself is generally deterministic for a fixed compiler version and inputs, so pin the TypeScript version and relevant toolchain versions.

### ESM path behavior

Check for runtime assumptions such as:

- `__dirname` or `__filename`,
- `process.cwd()` being the package directory,
- relative paths resolved against the current working directory rather than the module’s location,
- shell commands assuming `pnpm` or `tsx`,
- writes to the workflow source directory,
- executable permissions on workflow entrypoints.

The prebuilt bin wrapper can simply use:

```js
#!/usr/bin/env node
import("../dist/src/cli/main.js");
```

or invoke the file in a way consistent with your error and exit-code handling. Ensure the wrapper has the executable bit in the tarball. pnpm documents an `executableFiles` mechanism for additional executable files when needed. [pnpm](https://pnpm.io/package_json)

## Recommended decision

I agree with the proposed choice:

| Option | Assessment |
|---|---|
| `tsc` plus self-reference | Best fit for the stated constraints |
| Bundle every workflow | Unnecessary transformation and dependency duplication |
| Rewrite imports to relative paths | Fragile and couples workflows to output layout |
| Conditional exports | Possible, but adds condition-resolution complexity |
| Generated release/staging package | More portable than `publishConfig`, but more implementation work |

My recommendation is to keep the design but make these changes before implementation is considered complete:

1. Prove that no nested published `package.json` interferes with self-reference.
2. Generate and inspect the actual pnpm-produced tarball.
3. Install that tarball into a clean temporary directory using npm.
4. Run the main CLI and the bundled workflow from outside the package directory.
5. Assert that all runtime dependencies are ordinary production dependencies.
6. Add a release guard preventing `npm pack` or `npm publish` from being used on the source tree.
7. Test global npm installation and npx execution on Node 22 and Node 24.
8. Define whether determinism means identical extracted files or identical `.tgz` bytes.

So the clear answer is: **yes, this is a good and fairly standard solution for the unusual “package contains runnable internal programs” shape.** The design is not invalidated by global installs, npx, ESM, or Node self-reference. The main risks are the nested package scope, pnpm-only publication semantics, incomplete files/manifest verification, native dependencies, and assuming directory-hash equality proves byte-identical packages.