# AHQ-196 — Feature Brief

## One Sentence Outcome

The prebuilt read-only model is proven end-to-end: an npm-tarball install of agentic-hq in a temp
prefix runs `agentic-hq list` and a full non-interactive math-workflow (correct output number)
from a clean directory with no cloned repo — answering the import-resolution and build-determinism
questions the rest of AHQ-195 depends on.

## User Story

**As a**: developer executing the AHQ-195 npm-publishing plan  
**I want:** proof that a prebuilt, npm-installed agentic-hq package runs a shipped workflow end-to-end  
**So that:** the remaining sub-tasks build on verified assumptions instead of discovering failures mid-build

## Human Prompt

This is AHQ-196 - sub-task of:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
please read that file for all the info and hunt around to gain context etc.

## My Understanding of This Task

AHQ-196 is **Sub-Task 1 (the Tracer Bullet)** of the AHQ-195 npm-publishing feature (parent brief:
`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`): prove end-to-end that a **prebuilt,
read-only** agentic-hq package installed from an npm tarball can run a shipped workflow with the
cloned repo out of the picture. The proving vehicle is **math-workflow** — chosen over add-feature
because it runs end-to-end with no human in the loop (three chained Claude commands: ×2, +3, ÷5 →
an assertable output number), so every infrastructure iteration is fast and fully automatable; the
full rationale is recorded in the parent brief's `## Split Suggestion (Accepted)`. Concretely: a
minimal deterministic build compiles the CLI (65 `.ts` files under `src/`) and the single-file
math-workflow ts-workflow to JavaScript; a minimal shared runner script replaces the math-workflow
SKILL.md's current `pnpm install` + `ln -sfn` + tsx launch command; `npm pack` produces the
tarball; installing that tarball into a temp prefix must yield a working `agentic-hq list` and a
full non-interactive math-workflow run (correct output number) from a clean directory. The two
research questions the parent brief mandates this sub-task answer: **how the
`agentic-hq/tools/claude-code` import resolves in compiled workflow JS**, and **that the build is
deterministic** (build twice, compare hashes).

Scope guards inherited from the parent decisions: **math-workflow only** (add-feature's conversion
is Sub-Task 4 / AHQ-202, and happens only after the pipeline is proven through a real npm publish;
the remaining workflows are migrated in the final Sub-Task); **no publish** (AHQ-198), **no docs**
(AHQ-199), **no full `build-mode`/`ahq-package-root`
explicit-parameter chain** (AHQ-197 — the tracer bullet may keep the env-var mechanism the bin
wrapper uses today), though per parent Q10 any *new* seams created here (the runner script's
interface) should be born with the `ahq-package-root` name. Findings must be recorded for the later
sub-tasks — reshaping them is this ticket's main value. Per Question 1's answer, spike/scratch work
lives in the human-created `temp/AHQ-196/` tree inside the repo (falling back to an external
scratch tree only if git interference appears).

## Research Findings

*The full runtime-chain analysis lives in the parent brief's Research Findings; only
tracer-bullet-specific facts verified in this pass are recorded here.*

### What the minimal build must cover (verified — no build pipeline exists today)

- Root `tsconfig.json` is `noEmit: true` (an `outDir: dist` is configured but unused) and
  `moduleResolution: "Bundler"`; there is **no build script** in `package.json` — only typecheck.
  A tsc-emit build needs its own config (emit on, exclude `tests/`, a Node-compatible
  moduleResolution). Relative imports across `src/` already carry `.js` suffixes (e.g.
  `src/cli/main.ts` imports `./app.js`), so the source is ESM-emit-ready.
- **CLI build surface:** `bin/agentic-hq.cjs` → tsx → `src/cli/main.ts` → `app.ts` →
  `CompositionRoot` → the 65-file `src/` graph. The shipped bin wrapper must instead run compiled
  JS with plain `node` (no tsx — tsx is a devDependency, the core blocker the prebuilt model
  dissolves). The wrapper's env-var write (`AGENTIC_HQ_WORKSPACE_ROOT = package root`,
  `bin/agentic-hq.cjs:24`) stays for the tracer bullet.
- **Workflow build surface:** the math-workflow ts-workflow is a single file
  (`ts-workflow/src/math-workflow-demo-cli.ts`) importing only `commander` and
  `agentic-hq/tools/claude-code` — the same two imports every shipped workflow CLI uses. It chains
  three Claude commands (`times-two`, `plus-three`, `div-five`), takes `--input-number` (default
  `11`), and prints `Output number: <n>` — with the default input the expected output is `5`
  ((11×2+3)÷5), giving the tracer run a single assertable line. Invoked via the CLI as
  `agentic-hq math -- --input-number=<n>` (verified in the existing e2e test).

### The mandated import-resolution question (`agentic-hq/tools/claude-code`)

- The specifier is served by the root `package.json` `exports` map, which today points at **`.ts`
  source** (`./src/tools/marshalled-io-tools/claude-code/index.ts`). In dev it resolves because the
  SKILL.md command symlinks `node_modules/agentic-hq` → the repo root and the workflow runs under
  tsx. In the shipped artifact there is no symlink step and no runtime install, so one of three
  mechanisms must be proven (parent Update-1 response): **(a)** build-time rewrite to a relative
  import; **(b)** bundle the workflow into one JS file (its only other import is `commander`);
  **(c)** ship the workflow *without* its nested `package.json` so Node **package self-reference**
  resolves the specifier against the root manifest.
- Wrinkles verified for option (c): self-reference uses the *nearest ancestor* `package.json`, and
  the nested one (`agentic-hq-demo-math-workflow`, with its `link:../../../../../..` dep) would
  shadow the root — so it must not ship as-is; and the root `exports` target must point at
  compiled `dist/` JS in the shipped artifact. Root `"type": "module"` then governs the workflow's
  `.js` files — fine, the emit is ESM.
- math-workflow's nested manifest, SKILL.md launch command, and imports are **pattern-identical**
  to every other shipped workflow's (verified against add-feature's), so whatever mechanism the
  tracer bullet proves generalises directly to the later migrations.
- The ts-workflow directory also carries pnpm-only files (`pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `.npmrc`) that are meaningless in a read-only shipped copy — exactly what
  ships from `ts-workflow/` is a Planner/spike decision tied to the chosen mechanism.
- Third-party imports in compiled workflow JS (`commander`) resolve by Node's normal upward
  `node_modules` walk to the installed package's own dependencies — no per-workflow install.

### Runtime facts that make the model workable (each verified in code this pass)

- `ClaudeCommandBuilder` derives `--plugin-dir` flags by scanning `{ahq-root}/.agentic-hq/plugins/*`
  **at runtime** (`claude-command-builder.ts:111-136`) — works identically when ahq-root is the
  installed package dir, since the tarball packs `.agentic-hq/plugins/` (parent spike).
- Marshalling io-files go under the **user's** workspace (`composition-root.ts:42-43` wires
  `JsonFileIOMarshallerSessionFactory` to `CurrentUserWorkspaceImpl`) — nothing is written inside
  the package directory at runtime.
- `AhqWorkspaceImpl.getRoot()` = env var ?? `process.cwd()` (`ahq-workspace-impl.ts:44`) — the
  installed package root flows in from the bin wrapper unchanged.
- Runtime deps beyond `commander`: `node-pty` (only `src/io/terminal/pty-cli-wrapper.ts`) and
  `fast-glob` (only `src/workflow-discovery/workspace/ahq-directory-impl.ts`). node-pty ships
  darwin prebuilds; the chmod `postinstall` works around a **pnpm-only** extraction bug, so npm
  tarball installs are unaffected. (Linux compile-from-source is a docs concern — AHQ-199.)
- `private: true` blocks `npm publish` only — `npm pack` and installing the tarball work (parent
  spike). The tarball currently over-includes `tests/` etc.; harmless for the tracer bullet
  (hygiene is AHQ-198). The packed `.npmrc` (`frozen-lockfile=true`) is pnpm-only and inert for
  npm installs of the tarball.

### Determinism verification approach

tsc and esbuild both produce byte-identical output for identical inputs, config, and tool versions
(no embedded timestamps). Verify by building twice into separate directories and comparing
recursive SHA-256 hashes of the two `dist/` trees. **Do not** compare `npm pack` tarball hashes —
tarballs embed file mtimes and will differ spuriously.

### What the end-to-end tracer run proves

`DefaultClaudeCodeTool.execute()` writes `command-input.json` into the user workspace's io-files
temp dir, launches `claude` (via node-pty) with the plugin-dir + allowedTools flags, and the
command .md writes `command-output.json` back; math-workflow does this **three times in sequence**,
threading each command's output into the next command's input. A full run from a clean temp
project directory therefore proves, with no human in the loop: the compiled CLI runs, plugin
discovery from the installed package works, the Claude launch flags are right, the shipped
SKILL.md's runner command executes the prebuilt workflow JS, and file-IO marshalling round-trips
three times — with the final `Output number:` line asserting the whole chain in one check.

### Existing test template

`tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`
already asserts exactly this behaviour when running from a different workspace — it is the direct
template for the installed-package check. Whether an automated e2e lands in this ticket or later is
a Planner decision.

## Web/Perplexity Research

None required — the parent brief's research (including the two live npm-registry spikes: `npm view
agentic-hq`, `npm pack --dry-run`) plus direct code inspection in this pass covered everything.

## Questions And Answers

### Question 1

**Question:** Implementing this ticket requires `npm install`s of the packed tarball **and its
registry dependencies** (commander, node-pty, fast-glob) into temp prefixes/scratch directories,
likely several times as the spike iterates. Do you give standing approval for those installs for
the duration of this ticket (confined to temp/scratch dirs and disposable test project dirs —
never global, never the repo)?

**AI Recommendation:** Yes — grant it once here. The tracer bullet cannot run at all without
tarball installs, and re-asking per iteration would add friction with no safety benefit given the
temp-prefix confinement.

**Human Answer ('Yes' means follow AI Recommendation):** Yes (I recommend you use /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-196 which I've created for you as that will prevent auth requests for directories outside the current workspace coming to me, unless git things will conflict with the ones in /Users/stevepersonal/dev/agentic-hq/agentic-hq/ - in which case you can use a separate temp/scratch directory tree on the file system )

### Question 2

**Question:** Are this ticket's artifacts (minimal build script, minimal shared runner, modified
math-workflow SKILL.md) committed as the **seed that AHQ-197 hardens**, or is this a throwaway
spike where only the findings are kept and the code is reverted?

**AI Recommendation:** Commit them as the real-but-minimal seed (on the feature branch). This
matches the parent's one-workflow-end-to-end principle — math-workflow keeps moving forward
through the sub-tasks — and avoids re-writing working code in AHQ-197. Accepted side-effect until
AHQ-197 lands its `build-first` mode: math-workflow's dev-mode run may temporarily go via the
prebuilt path; all other workflows are untouched and keep working in dev mode.

**Human Answer ('Yes' means follow AI Recommendation):**  Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the parent brief: all strategy
  decisions, the Sub-Task plan, and the full runtime-chain research this ticket executes against.
- `package.json` — no build script, `exports` map pointing at `.ts` source, `private: true`, bin
  mapping, runtime vs dev dependency split.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts`
  — the workflow program to compile: three chained commands, the two imports.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` — the launch command
  the minimal shared runner replaces.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` —
  the nested manifest (`link:` dep) that must not ship as-is.
- `bin/agentic-hq.cjs` — the bin wrapper to re-point at compiled JS; its env-var write stays for
  this ticket.
- `tsconfig.json` (root) and the math-workflow `ts-workflow/tsconfig.json` — the `noEmit` configs
  a build config must derive from.
- `src/cli/main.ts` + `src/cli/app.ts` — the CLI entry graph the build compiles.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — runtime `--plugin-dir`
  scanning and the allowedTools grant.
- `src/kernel/composition-root.ts` — proves io-files marshalling is wired to the user's workspace.
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — the env-var read supplying the AHQ
  root.
- `src/tools/marshalled-io-tools/claude-code/index.ts` — the barrel module the exports map serves.
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` —
  the direct template for the installed-package check (asserts the output number and the io-files
  round-trip).
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md` +
  `ts-workflow/package.json` — pattern-identity comparison showing the tracer's findings
  generalise to all shipped workflows.

## Acceptance Criteria

- `agentic-hq list` works from a temp-prefix install of the `npm pack` tarball, with the cloned
  repo out of the picture.
- A full math-workflow run from a clean directory against that install prints the correct output
  number — no pnpm, no tsx, no runtime installs.
- Nothing is written inside the installed package directory at runtime.
- The `agentic-hq/tools/claude-code` resolution mechanism for compiled workflows and the build's
  determinism (build twice, identical hashes) are both proven and recorded for the later
  sub-tasks.
- The minimal build script, shared runner, and math-workflow SKILL.md change are committed on the
  feature branch (per Question 2).
