# Perplexity Q&A — globally runnable TypeScript CLI: dev install + npm publishing

> Copy everything in the **QUESTION** block into https://perplexity.ai, then paste
> the response into the **ANSWER** section at the bottom.

---

## QUESTION (paste this into Perplexity)

I maintain an open-source Node.js command-line tool written in TypeScript. I want
expert, current (2026) advice on the **industry-standard, correct way to make it a
globally runnable CLI** — both (A) right now for developers running it from a
local git clone, and (B) later when it is published to npmjs.org and installed via
`npm install -g` / `npx`.

### What the tool is

- A CLI called `agentic-hq` — a thin TypeScript wrapper that orchestrates other
  developer-workflow tools. Distributed open-source; **the long-term plan is to
  publish it to npmjs.org and have users install it with `npm install -g` (or run
  it via `npx`).** Today it is only run from a cloned git repo (dev mode).
- Package manager: **pnpm 11**. Runtime: **Node.js 22 / 24 LTS**, typically
  managed via **nvm**. Primary OS macOS; also Linux and WSL; native Windows not
  yet supported (we currently tell Windows users to use WSL).

### Current entry-point mechanism (no build step today)

- `package.json` declares: `"bin": { "agentic-hq": "bin/agentic-hq.cjs" }`.
- `bin/agentic-hq.cjs` is a small CommonJS wrapper with `#!/usr/bin/env node`. It
  does **not** compile anything — at runtime it locates the repo's *local* `tsx`
  (`node_modules/.bin/tsx`) and uses it to execute the TypeScript source directly
  (`src/cli/main.ts`). It also derives the project's workspace root from
  `__dirname` (the wrapper's own location), so the command works regardless of the
  user's current directory.
- So today: **TypeScript is executed at runtime via `tsx`; there is no compiled
  JavaScript build output.**

### The problem we hit (dev mode)

Our dev install script uses `pnpm add -g .` to put the CLI on `PATH`. On pnpm 11
this fails for a fresh user with:

```
[ERROR] The configured global bin directory "<home>/.local/share/pnpm/bin" is not in PATH
Run "pnpm setup" to update your shell configuration.
```

Because pnpm 11 places global binaries in its own private `$PNPM_HOME/bin`, which
is **not on PATH by default**. Fixing it requires running `pnpm setup` (which edits
the shell rc), then **restarting the shell**, then re-running the install. This
multi-step, machine-mutating dance confuses new users.

### The fix we are considering (dev mode)

Stop using `pnpm add -g .`. Instead, our install script would:

1. Run `pnpm install` (so the repo's local `tsx` exists).
2. Detect a directory that is **already on the user's `PATH` and writable**
   (checking `~/.local/bin`, `~/bin`, `/usr/local/bin`, `/opt/homebrew/bin`, then
   any other writable PATH entry).
3. Write a tiny launcher there named `agentic-hq`:
   ```bash
   #!/usr/bin/env bash
   exec node "/absolute/path/to/repo/bin/agentic-hq.cjs" "$@"
   ```
4. So in the common case it works immediately with **no `pnpm setup` and no shell
   restart**. Fallback (only if no writable PATH dir exists): create `~/.local/bin`,
   add one line to the shell rc, ask the user to restart the shell.

### My questions

1. **Dev install (local clone):** What is the canonical, industry-standard way to
   expose a Node/TS CLI globally during development — `npm link`, `npm install -g .`,
   `pnpm link <dir>`, `pnpm add -g .`, or something else? Would plain
   **`npm install -g .` / `npm link`** sidestep the PATH problem we hit, given that
   npm's global bin directory is usually already on `PATH` (especially under nvm,
   where it lives in the active Node version's `bin`)? Is pnpm's `$PNPM_HOME/bin`
   not-on-PATH behavior the real root cause we should just avoid?

2. **Is hand-rolling our own launcher an anti-pattern?** Detecting a PATH dir and
   copying our own shell launcher into it — versus letting the package manager
   generate the bin shim from the `bin` field — is that reasonable and idiomatic,
   or a code smell? What are the trade-offs (maintenance, "live"/symlinked dev
   behavior, predictability)?

3. **Cross-platform / Windows:** Our hand-rolled launcher is a bash script
   (`#!/usr/bin/env bash`), which works on macOS/Linux/WSL but **not native
   Windows**. npm/pnpm automatically generate cross-platform shims (`.cmd` /
   `.ps1`) from the `bin` field. Since we may want native Windows eventually, does
   that alone argue for relying on package-manager bin-linking instead of a
   hand-rolled script?

4. **Publishing a TS CLI to npm (the future):** Is it standard/acceptable to ship
   and execute **TypeScript at runtime via `tsx`** (shipping `.ts` source + `tsx`
   as a runtime dependency), or should we add a **build step** that compiles to
   JavaScript (tsc / tsup / esbuild / pkgroll) and point `bin` at the compiled JS
   (with a `#!/usr/bin/env node` shebang)? What do widely-used TypeScript CLIs do
   in 2026, and what are the trade-offs (startup latency, dependency weight, ESM vs
   CJS, having to ship source, Node-version compatibility)?

5. **One coherent path across both horizons:** What should we do *now* (dev from
   clone) that we will **not have to throw away** when we publish to npm? For
   example: rely on the `bin` field + `npm install -g .` for dev, and add a
   compile-to-JS build step before publishing — so dev and published installs use
   the same mechanism (the `bin` shim) and differ only in whether `bin` points at
   source-via-tsx or compiled JS.

6. **Tooling recommendation:** For a thin TS CLI like this, what modern packaging/
   build tooling is recommended in 2026 (e.g. tsup, pkgroll, unbuild, esbuild,
   plain tsc)? Is a CLI framework like **oclif** overkill for a thin wrapper, or
   worth it for the cross-platform install/distribution it provides?

Please give concrete, opinionated recommendations with reasoning, note any
relevant gotchas (ESM/CJS, shebangs, Windows shims, nvm/global-bin PATH, `tsx`
at runtime), and cite up-to-date sources where possible.

---

## ANSWER (paste Perplexity's response here)

<!-- PASTE THE PERPLEXITY ANSWER BELOW THIS LINE -->

For your use case, the most **industry-standard** path is: use package-manager-generated `bin` shims for both local dev and published installs, and move to a compiled JS entrypoint before npm publish. For development, `npm link` / `pnpm link` are the canonical “run my local clone globally” tools; for publishing, point `bin` at a real JS file and let npm/pnpm generate the cross-platform shim from it. [pnpm](https://pnpm.io/settings)

## Dev installs from a clone

`npm link` is the classic developer workflow for making a local package globally runnable, and npm explicitly says it links the package’s bins into the global prefix bin directory. `pnpm` has equivalent linking/global-install workflows, but pnpm v11 now stores global binaries under `PNPM_HOME/bin`, and `pnpm setup` is what creates that home directory and edits shell config so it lands on `PATH`. So yes: the PATH problem is very likely a pnpm-v11 global-bin ergonomics issue, not a Node/CLI issue. [pnpm](https://pnpm.io/cli/setup)

My recommendation for dev mode is **do not invent a separate launcher system**. Prefer one of these:

- `npm link` for local development and quick global testing.
- `pnpm link --global` / `pnpm link <dir>` style workflows if you want pnpm-native linking.
- `pnpm install` in the repo, then `pnpm exec agentic-hq ...` or `pnpm run ...` during development.

If your goal is “make the clone runnable globally without shell mutation,” `npm link` is usually the least surprising answer, because npm’s global prefix/bin setup is the older, more universal mental model and npm creates the bin shims for you. [docs.npmjs](https://docs.npmjs.com/cli/v9/commands/npm-link/)

## Hand-rolled launcher

Hand-rolling a bash launcher is **not idiomatic** as the long-term mechanism. It works, but it duplicates what `bin` + package-manager linking already solves: executable resolution, Windows shims, symlink vs copy behavior, and consistent package metadata. It also creates maintenance burden because now you own shell portability, quoting, path escaping, and edge cases around spaces in repo paths. [pnpm](https://pnpm.io/settings)

The main trade-offs are:

- **Pros:** immediate “works now” behavior, no need for global-bin setup, can point directly at a checked-out repo.
- **Cons:** it’s Unix-only if written as bash, it bypasses package-manager conventions, and it can diverge from the published-package path.

In short: it’s a pragmatic bootstrap hack, not the canonical CLI packaging model.

## Windows and shims

Yes, this is a strong argument **against** a hand-written bash launcher as your primary distribution path. npm explicitly generates symlinks on Unix and `.cmd` shims on Windows for package executables, which is exactly what you want for cross-platform CLI distribution. A bash wrapper won’t help native Windows users, and it will make future support harder. [pnpm](https://pnpm.io/settings)

So for native Windows support, rely on package-manager bin-linking from the `bin` field. That gives you the platform-specific shims automatically, which is much more future-proof than copying a shell script into some PATH directory. [npmjs](https://www.npmjs.com/package/cmd-shim)

## TypeScript at runtime

Shipping `.ts` plus `tsx` as a runtime dependency is technically acceptable, but it is **less standard** for a published CLI than compiling to JS first. `tsx` is explicitly a runtime TypeScript executor, so your current dev setup is valid for internal use. But for a published CLI, most serious TypeScript CLIs still compile to JavaScript and point `bin` at the compiled file, because that reduces runtime dependencies, avoids bootstrapping complexity, and gives more predictable startup behavior. [npmjs](https://www.npmjs.com/package/tsx)

The usual trade-offs are:

- **Runtime TS via `tsx`:** faster iteration, less build plumbing, but extra startup overhead and a runtime dependency.
- **Compiled JS:** slightly more build work, but simpler install-time behavior, smaller dependency surface for end users, and clearer compatibility with Node 22/24 LTS.

For a thin wrapper CLI, I would strongly favor **build-to-JS for publish**.

## Recommended path

The cleanest “now and later” plan is:

1. Keep `bin` in `package.json`.
2. In development, use `npm link` or `pnpm link` to expose the local clone globally, with package-manager-generated shims. [pnpm](https://pnpm.io/settings)
3. Add a build step that emits `dist/cli.js` (or similar).
4. On publish, point `bin.agentic-hq` at the built JS file.
5. Use `prepublishOnly` or your release pipeline to ensure the build runs before `npm publish`.

That gives you one coherent CLI interface and one canonical entrypoint mechanism. The only thing that changes between dev and publish is whether `bin` points at source-driven dev code or compiled output.

A practical pattern is:

- Dev: `bin` points to a lightweight JS wrapper that imports/executes TypeScript only in the repo, or you use `pnpm exec`.
- Publish: `bin` points to `dist/agentic-hq.js`.

If you want dev and published installs to be as identical as possible, compile in both cases and run the built output even locally.

## Tooling choice

For a thin TypeScript CLI, I’d recommend:

- **plain `tsc`** if you want maximum transparency and the fewest moving parts.
- **tsup** if you want a very low-friction, modern default with bundling and easy CLI output.
- **pkgroll** or **unbuild** if you prefer package-aware packaging workflows and convention-over-configuration.

For your size and shape, **tsup or plain `tsc`** are the most sensible defaults. `oclif` is probably overkill unless you want its opinionated command architecture, plugin ecosystem, help generation, and broader CLI framework benefits; for a thin orchestration wrapper, it’s usually more machinery than payoff.

## Concrete recommendation

My opinionated recommendation is:

- **Stop using `pnpm add -g .` for local dev onboarding.**
- Use **`npm link`** or **`pnpm link`** for developer-global testing.
- **Do not ship a bash launcher** as the primary solution.
- **Switch to a build-to-JS publish pipeline** and have `bin` point at compiled JS.
- Keep `tsx` only for development, not as the published runtime for your CLI.

That path avoids pnpm v11’s `PNPM_HOME`/`PATH` footgun, preserves cross-platform shims, and matches how Node CLIs are usually packaged and distributed in practice. [pnpm](https://pnpm.io/cli/setup)

If you want a single-sentence decision: **use package-manager linking for dev, compile to JS for publish, and let `bin` + npm/pnpm generate the actual launcher everywhere.**

<!-- END OF ANSWER -->