# Web Research Q&A — globally runnable TypeScript CLI (dev install + npm publishing)

My own answer, from web research (June 2026), to the same questions posed to
Perplexity in `/tmp/perplexity-q-and-a.md`. Sources are linked inline and listed
at the bottom.

---

## The question I researched

For an open-source **TypeScript** CLI (`agentic-hq`) that is run today from a local
git clone (dev mode) but is **intended to be published to npmjs.org and installed
via `npm install -g` / `npx`** later:

1. What is the industry-standard way to expose it globally **in dev**? Would
   `npm link` / `npm install -g .` avoid the `pnpm setup` / PATH pain we hit?
2. Is **hand-rolling our own launcher script** into a detected PATH dir an
   anti-pattern vs letting the package manager generate the `bin` shim?
3. **Cross-platform / Windows** implications of a bash launcher vs the `bin` field.
4. For the **published** package: ship/execute **TypeScript at runtime via `tsx`**,
   or add a **build step** that compiles to JS and points `bin` at compiled JS?
5. A **single coherent approach** that won't be thrown away when we publish.
6. **Tooling** recommendation (tsup / pkgroll / unbuild / oclif / plain tsc).

---

## Bottom line (my recommendation)

- **The root cause of your pain is using _pnpm_ for the global install, not your
  code.** pnpm 11 puts global binaries in its *own* `$PNPM_HOME/bin`, which is not
  on `PATH` by default and — critically — pnpm's "is it on PATH?" check does **not
  recognise nvm's symlinked bin dir**. npm has no such problem: under nvm, npm's
  global bin *is* the active Node version's `bin` directory, which nvm already puts
  on `PATH`. ([pnpm #4744](https://github.com/pnpm/pnpm/issues/4744),
  [pnpm #12319](https://github.com/pnpm/pnpm/issues/12319),
  [pnpm global packages](https://pnpm.io/global-packages))

- **Recommended dev mechanism: use the `bin` field you already have + `npm link`**
  (not `pnpm add -g .`, and not a hand-rolled launcher). On your nvm setup this
  needs **no `pnpm setup`, no PATH editing, no shell restart** — and it produces a
  live symlink back to the repo (same dev-mode benefit you have now). This is the
  canonical Node way to develop a CLI locally. ([npm-link docs](https://docs.npmjs.com/cli/link/))

- **Don't hand-roll a launcher** if you can avoid it. It re-implements what the
  `bin` field already does, and a bash launcher **breaks native Windows**, whereas
  npm auto-generates `.cmd`/`.ps1` shims from `bin`. Keep it only as a last-resort
  fallback, not the primary path.

- **Before publishing to npm: add a build step.** The universal standard is to
  **compile TypeScript → JavaScript** (tsup or plain `tsc`) and point `bin` at the
  compiled JS with a `#!/usr/bin/env node` shebang. Do **not** ship `.ts` + `tsx`
  as a runtime dependency to end users. ([Node.js: Publishing a TS package](https://nodejs.org/learn/typescript/publishing-a-ts-package),
  [LogRocket: tsx vs ts-node vs native](https://blog.logrocket.com/running-typescript-node-js-tsx-vs-ts-node-vs-native/))

- **One coherent path:** standardise on the **`bin` shim** mechanism now and
  forever; only change *what `bin` points at*. Today (dev): `bin` → the `.cjs`
  wrapper that runs `tsx` on source, exposed via `npm link`. Later (published):
  `bin` → compiled `dist/cli.js`, installed via `npm install -g`. Same mechanism,
  same cross-platform shims, minimal divergence.

- **Tooling:** **tsup** (esbuild-based, zero-config, most popular, emits ESM/CJS +
  `.d.ts`) for the eventual build step; **commander** (already a dependency) for
  arg parsing. **oclif is overkill** for a thin wrapper. ([tsup](https://tsup.egoist.dev/),
  [pkgroll](https://github.com/privatenumber/pkgroll))

---

## Per-question detail

### 1. Industry-standard dev exposure — does npm avoid the PATH pain? **Yes.**

`npm link` is the canonical "develop a CLI locally" command: it creates a global
symlink for your package and links its `bin` onto `PATH`
([npm-link docs](https://docs.npmjs.com/cli/link/)). The reason it sidesteps your
error is structural: npm installs globals into npm's prefix, which **under nvm is
the active Node version's `bin`** — already on `PATH` and managed by nvm. pnpm
deliberately uses a separate `$PNPM_HOME/bin` and its PATH validation fails on
nvm's symlinked dir, which is exactly the "[ERROR] ... not in PATH" you saw
([pnpm #4744](https://github.com/pnpm/pnpm/issues/4744),
[pnpm #12319](https://github.com/pnpm/pnpm/issues/12319)).

Note: `npm link` (symlink, live, editable) is the right dev choice over
`npm install -g .` (which *copies* the package into npm's global `node_modules` —
not live, and wouldn't carry your repo's local `tsx`). You can use `npm link` for
the global CLI exposure even though `pnpm` installs your `node_modules` — the two
are independent. (Minor caveat: keep using one package manager for dependency
installs; `npm link` here is used purely to register the `bin`.)

### 2. Is a hand-rolled launcher an anti-pattern? **Mostly yes — avoid as primary.**

A hand-rolled launcher works on macOS/Linux/WSL, but it duplicates what the `bin`
field does for free, adds detection/maintenance logic, and — the dealbreaker —
**does not produce a Windows-executable command**. The package-manager mechanism
is predictable and well-understood by every Node dev. The only legitimate niche
for a hand-rolled launcher is a deliberately PM-agnostic bootstrap; for a tool
heading to npm it's a detour.

### 3. Cross-platform / Windows. **Strong point for the `bin` field.**

From `bin`, npm creates a **symlink on Unix** and **`.cmd` + PowerShell `.ps1`
wrapper scripts on Windows**; the `#!/usr/bin/env node` shebang is read on Unix and
harmlessly ignored on Windows (npm's wrappers handle invocation there)
([cross-platform CLIs](https://imsaravananm.medium.com/running-cross-platform-scripts-in-nodejs-2af9f06babf7),
[guide to a Node CLI package](https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e)).
A `#!/usr/bin/env bash` launcher has no equivalent on native Windows. Even though
you currently say "Windows users use WSL," choosing the `bin` mechanism keeps the
native-Windows door open for free.

### 4. Publish: tsx-at-runtime vs compile-to-JS. **Compile to JS.**

The consistent guidance: **publish JavaScript, not TypeScript.** Run type-checks
with `tsc`, transpile with a fast tool (esbuild/swc/tsup), and have `main`/`bin`
point at the emitted `.js`
([Node.js publishing guide](https://nodejs.org/learn/typescript/publishing-a-ts-package),
[Convex: npm + TypeScript](https://www.convex.dev/typescript/resources/typescript-npm)).
`tsx` is explicitly positioned as a **development** runner (it has replaced
ts-node), not a production/runtime distribution mechanism
([LogRocket](https://blog.logrocket.com/running-typescript-node-js-tsx-vs-ts-node-vs-native/),
[Better Stack: tsx vs ts-node](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/)).
Shipping `tsx` at runtime means: a heavier dependency, slower cold start, shipping
source, and pushing transpilation onto every user's machine. Keep `tsx` as a
**devDependency**; ship compiled JS. (Heads-up: ESM vs CJS dual-publishing is still
fiddly — pick one target deliberately; for a CLI, a single bundled output is
simplest. [Liran Tal: TS publishing in 2025 is still a mess](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing))

### 5. One coherent path across both horizons.

Standardise on the **`bin` shim** and only swap its target:

| | Now (dev, from clone) | Later (published to npm) |
|---|---|---|
| Exposure | `npm link` (uses `bin`) | `npm install -g` / `npx` (uses `bin`) |
| `bin` points at | `.cjs` wrapper → `tsx` on `src/**` | compiled `dist/cli.js` (shebang) |
| `tsx` | devDependency, used at runtime in dev | not shipped |
| Build step | none | `tsup`/`tsc` on `prepublishOnly` |
| Windows shims | auto (npm) | auto (npm) |

Nothing about the install mechanism changes between the two — exactly the
low-divergence property you asked for.

### 6. Tooling. **tsup + commander; oclif overkill.**

For the build step, **tsup** is the safe, popular default (esbuild-powered,
zero-config, emits ESM/CJS and type declarations; ~2M weekly downloads)
([tsup](https://tsup.egoist.dev/)). **pkgroll** is a strong zero-config
alternative that infers entry points from `package.json` and emits very clean
output ([pkgroll](https://github.com/privatenumber/pkgroll)); **tsdown** is the
emerging performance option ([PkgPulse build-tools 2026](https://www.pkgpulse.com/guides/best-typescript-build-tools-2026)).
You already depend on **commander** for arg parsing, so a full CLI framework like
**oclif** is unnecessary weight for a thin wrapper.

---

## How this maps back to your proposal

- Your "detect a PATH dir + write a launcher" plan **would work on your machines**,
  but it's a workaround for a pnpm-specific quirk. The more standard, lower-risk,
  Windows-capable, future-proof move is: **keep the `bin` field, use `npm link` for
  dev, and add a compile step before publishing.**
- The pieces you already have are right: a `bin` field, a `__dirname`-based
  workspace resolver (proven to work from any directory), and commander. The change
  is mostly *which command registers the shim* (npm link, not pnpm global) plus a
  future build step — not a bespoke launcher.

---

## Caveats / things to verify

- `npm link` inside a pnpm-managed repo is fine for registering the `bin`, but
  don't let it start managing dependencies — keep deps installed via pnpm.
- Confirm npm's global prefix is on PATH on a *non-nvm* machine too (e.g. a system
  Node). Under nvm it's automatic; with a system Node, `npm config get prefix`
  should be a dir already on PATH (usually is).
- When you add the build step, decide ESM vs CJS deliberately and test the
  published tarball with `npm pack` + a global install in a clean container before
  the first real publish.

---

## Sources

- [npm-link | npm Docs](https://docs.npmjs.com/cli/link/)
- [Global Packages | pnpm](https://pnpm.io/global-packages)
- [pnpm #4744 — continue using nvm's global bin dir](https://github.com/pnpm/pnpm/issues/4744)
- [pnpm #12319 — global bin directory not in PATH](https://github.com/pnpm/pnpm/issues/12319)
- [Publishing a TypeScript package | Node.js Learn](https://nodejs.org/learn/typescript/publishing-a-ts-package)
- [Running TypeScript in Node.js: tsx vs ts-node vs native | LogRocket](https://blog.logrocket.com/running-typescript-node-js-tsx-vs-ts-node-vs-native/)
- [tsx vs ts-node | Better Stack](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/)
- [TypeScript in 2025 with ESM and CJS npm publishing is still a mess | Liran Tal](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)
- [npm and TypeScript | Convex](https://www.convex.dev/typescript/resources/typescript-npm)
- [Running Cross-Platform scripts in NodeJS | Medium](https://imsaravananm.medium.com/running-cross-platform-scripts-in-nodejs-2af9f06babf7)
- [A guide to creating a NodeJS command-line package | Medium](https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e)
- [tsup](https://tsup.egoist.dev/)
- [pkgroll | GitHub](https://github.com/privatenumber/pkgroll)
- [Best TypeScript-First Build Tools 2026 | PkgPulse](https://www.pkgpulse.com/guides/best-typescript-build-tools-2026)