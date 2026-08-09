# Dummies Guide To The "Staged Release Tree" Idea

> Written for a reader who is comfortable with software in general but **not** with
> JavaScript/TypeScript build-and-publish machinery. About a 5-minute read.

## The one-line version

Instead of shipping our messy workshop with sticky notes telling the packer what to leave out and
what to relabel, the build will assemble a clean "shipping pallet" directory containing **exactly
the files users get** — and we ship that directory.

## Background: three JS/TS facts you need first

**1. TypeScript has to become JavaScript before users can run it.**
We write `.ts` files. Node — the runtime on users' machines — natively runs `.js` files.
Contributors run the `.ts` directly using a dev tool called `tsx`, which compiles invisibly on the
fly; that's great for development, but users shouldn't need dev tools. So for the published package
everything is compiled once, up front, into plain `.js`. That compiled output lands in our `dist/`
directory ("dist" = "distribution"). AHQ-196 built this compile step.

**2. An npm package is just a zipped folder with one special file at its root: `package.json` (the "manifest").**
Publishing uploads a tarball (a `.tgz` archive); installing unpacks it onto the user's disk. The
manifest at its root is the contract that tells npm and Node things like:

- `bin` — "when the user types `agentic-hq` in their terminal, run **this** file";
- `exports` — "when some code says `import … from 'agentic-hq/tools/claude-code'`, **this** file
  is what that name means";
- plus `name`, `version`, `dependencies`, and so on.

**3. Node works out what an import name means by finding the *nearest* manifest.**
Our compiled workflow programs import the main package by name. Node resolves that by walking *up*
the directory tree from the importing file until it finds a `package.json`, then reads its
`exports`. So **which manifest happens to be "nearest" controls everything** — this detail caused a
real AHQ-196 bug and one of the patches described next.

## Sidebar: does anyone *ever* ship TypeScript in an npm package?

(Added on request — direct answers to: do people ever ship TS? is it non-standard? should we
consider shipping TS that runs on the user's machine, or forget it?)

**Yes, `.ts` files do ship in npm packages — but almost never as the thing that *runs*.** Three
distinct cases, from standard to rare:

1. **Type declaration files (`.d.ts`) — universal, standard practice.** These are TypeScript files
   containing *only* type information (no runnable code). Well-built packages ship them alongside
   the compiled JS so consumers' editors and compilers get autocompletion and type checking. This
   is not "shipping TypeScript" in the sense you mean — nothing in them executes.
2. **Source-for-reference — common enough, cosmetic.** Some packages include their `src/*.ts` in
   the tarball purely for debugging/"go to definition" convenience. The runtime still executes the
   compiled JS; the `.ts` is dead weight (and many packages exclude it to keep tarballs small).
3. **TypeScript as the *runnable* artifact — rare and non-standard for published Node packages.**
   It only works if the consumer's machine has something that can execute TS: a dev tool like
   `tsx`/`ts-node`, or an alternative runtime (Deno and Bun run TS natively — packages targeting
   *those* ecosystems do ship runnable TS, but that's a different world from a Node CLI). Recent
   Node can "type-strip" some TS directly, but only a limited subset — and AHQ-196 hit exactly
   that limitation for real: plain Node loaded one of our `.ts` files, then died on its imports
   (`ERR_MODULE_NOT_FOUND`). That defect is what forced the generated `dist/package.json` plaster.

**So yes — your instinct is right: "just ship JavaScript" is the standard, and it's exactly what
this work does.** Should we *consider* shipping runnable TS to users instead? No — forget it as an
option for the published package, for concrete reasons, not just convention:

- It would make a dev tool (`tsx`) a **runtime dependency on every user's machine** — a heavier
  install and a compile step on every single run, for zero user benefit.
- Node's built-in TS support is partial (proven insufficient on this very codebase, above), so
  we'd still need the dev-tool route — which is precisely the clone-and-build friction AHQ-195
  exists to remove.
- The parent brief already decided this formally (Q2/Q6: prebuilt read-only artifact) — shipping
  runnable TS was the *starting state* whose problems (runtime tsx, runtime installs) the prebuilt
  model dissolved.

Two nuances so "forget it" isn't overread:

- **Dev tools like tsx still exist in the repo for contributors** — the unit-test/typecheck loop
  works on TS source directly, which is fine and standard: it's a contributor machine with dev
  tools installed. But *running a workflow* in dev mode does **not** use tsx: under this ticket's
  `build-first` parity model it builds and then executes the exact shippable JavaScript, so the
  shipped path is the only execution path for workflow code — in production *and* in dev.
- **Shipping `.d.ts` declarations (case 1) may become worth doing later** if third parties import
  agentic-hq as a library (AHQ-203's third-party workflow-author world). That's an additive,
  standard step — unrelated to shipping *runnable* TS.

## The problem: one directory pretending to be two different products

Our repo working tree has to serve two audiences whose needs contradict each other:

| | Contributors (dev tree) | Users (published package) |
| --- | --- | --- |
| How code runs | `.ts` directly, via tsx | compiled `.js`, via plain node |
| `exports` should point at | `.ts` source | compiled `.js` in `dist/` |
| `bin` should point at | dev wrapper (launches tsx) | prebuilt wrapper (launches node) |
| Contents | everything — tests, dev configs, scratch files | only the runtime files |

Today we make **one** directory serve both by applying four patches ("sticking plasters") around
pack time:

1. **The `publishConfig` rewrite** — at pack time, pnpm swaps the "user" values of `bin`/`exports`
   into the tarball's copy of the manifest *only*, while the working tree keeps the "contributor"
   values. Result: two deliberately disagreeing versions of the manifest.
2. **The `files` whitelist** — a list in the manifest telling the packer which top-level paths to
   include. It's coarse (whole directories) and it overrides `.gitignore` — get the granularity
   wrong and things leak. AHQ-196 found **over a hundred dev-machine scratch io-files** under
   `.agentic-hq/temp/` shipping in today's tarball (a privacy problem AHQ-198 was due to fix).
3. **The generated `dist/package.json`** — an extra mini-manifest the build drops into `dist/` so
   that compiled code's imports resolve to compiled code (see fact 3: nearest manifest wins;
   without this, the *root* manifest was nearest and pointed compiled code at `.ts` source, which
   broke dev-tree runs). Now there are three manifest variants in play.
4. **The `postinstall` chmod** — pnpm's packer silently drops the "executable" permission bit from
   shipped shell scripts, so the package ships a small repair step that runs on the user's machine
   at install time, switching the bits back on.

Each patch is individually defensible — an external architecture review (Perplexity) judged them
"defensible transitional design", not hacks. But collectively there's a smell: **the thing we ship
never actually exists anywhere until the moment it's packed.** It's "the working tree, as modified
in flight by four patches". You can't open a folder and look at what users will get.

## The idea: assemble the product before shipping it

Think of a furniture workshop. It doesn't mail the workshop. There's a **packing table**: finished
pieces are placed on a pallet, a shipping label is printed for the customer, and the courier
collects the pallet. Sawdust can't end up in the box, because the box only ever contains what
someone deliberately placed in it.

The **staged release tree** is that packing table. The build gains a final step that assembles a
fresh directory (e.g. `release/`) containing exactly what ships:

- the compiled CLI JavaScript,
- the compiled workflow JavaScript,
- the plugins tree (SKILL.md files, bundled docs, scripts),
- the bin wrapper and the shared workflow-runner script,
- and **one generated manifest at its root** — produced *from* the real `package.json` (name,
  version, dependencies, engines copied across — one source of truth, transformed, never
  hand-maintained) with `bin`/`exports` written directly as the "user" values. No overrides, no
  second variant: it is simply correct for the tree it sits in.

Packing and publishing then run **from that directory**, not from the working tree.

## What this retires

| Sticking plaster | Why it dies |
| --- | --- |
| `publishConfig` rewrite | the generated manifest already contains the user values — nothing to swap at pack time |
| `files` whitelist | what ships = what was staged; nothing can leak in by accident — the whole leak class (scratch io-files, test plugins, pnpm-only files) is structurally gone |
| generated `dist/package.json` | the staged tree's root manifest **is** the nearest manifest above the compiled code — one manifest, correct by construction |
| `postinstall` chmod (probably) | while assembling the tree we know every shipped `.sh` file, so the manifest generator can list them in pnpm's `publishConfig.executableFiles` (exact paths — AHQ-196 spike-proved pnpm honours these), making the tarball itself carry the right permission bits. Replace-vs-keep-as-backup is a Planner decision. |

## What does NOT change

- **Contributors' edit/test loop:** still TS-first — you edit `.ts`, and the unit tests and the
  typechecker work on the source directly with no build step. But be clear about what this does
  NOT cover: under the `build-first` parity model this very ticket implements, **running a
  workflow in dev mode always triggers the automatic build and executes the same byte-identical
  JavaScript users get**. There are deliberately not two ways of running workflow code — dev mode
  simply puts the (automatic, no-step-to-remember) build in front of the identical run.
- **User-authored workflows in the user's own workspace** keep the current tsx model for now — an
  explicit parent-brief decision (Q3/Q6), revisited when AHQ-201/AHQ-203 run.

**The one-line summary of the whole execution model:** shipped workflows (bundled in the
published npm package) always run as built JavaScript — in production *and* in dev mode;
user-authored workflows in the user's own workspace stay on tsx for now.
- **Behaviour:** none — this is a "no behaviour change" refactor. AHQ-196's tests (the
  build-determinism check and the install-the-tarball-and-run-math-workflow e2e) assert *outcomes*,
  not directory layout, so they carry over with path re-pointing only and prove nothing broke.
- **What users get:** the same files doing the same things — just assembled honestly instead of
  patched into existence.

## How the system decides which model to use (and what the AI skill knows)

Two things people naturally assume must exist somewhere — a "detector" that works out whether a
workflow is shipped or user-authored, and AI awareness of which mode it's in — deliberately do
not exist.

**Nothing decides at runtime; the fork is static.** Which launch model a workflow uses is baked
into the SKILL.md template it was *born* with: shipped workflows carry the runner-invocation
command; user-authored workflows are scaffolded (by create-workflow) with the legacy tsx command
baked in. No code ever sniffs the filesystem or environment to ask "am I shipped?" — the same
structural-truth principle as `build-mode`, whose value comes from *which entry point you
invoked* (the dev bin wrapper bakes `build-first`; the shipped package's wrapper bakes
`prebuilt`), never from detection.

**The AI skill relays; it never reasons.** A SKILL.md is a dumb template: it returns a
launch-command string, inserting a couple of relayed values verbatim (the io-files directory
today; `build-mode` joining it in this ticket). So the shipped/user-authored distinction is
hidden from the AI in the sense that matters — the command *text* differs between the two kinds
of SKILL.md, so the AI can *see* it, but it never has to understand it or behave differently
because of it (the parent brief's Q8 principle).

**For shipped workflows, everything funnels through one script.** The flow:

```
you type: agentic-hq math …
  → bin entry point            (bakes the build-mode literal: dev = build-first, shipped = prebuilt)
  → TypeScript CLI             (passes it along explicitly, launches Claude with the skill)
  → SKILL.md                   (returns the launch command, relaying values verbatim)
  → scripts/run-workflow.cjs   ← THE funnel: the only code that acts on build-mode
       build-first → run the shared build, then execute the built JS
       prebuilt    → execute the built JS as-is
```

User-authored workflows do **not** go through the runner today — their scaffolded command runs
`pnpm install` + tsx directly. So there is one funnel for everything shipped, and a separate
static template family for user-authored workflows. A **universal funnel** — user-authored
workflows routed through the same runner script too — is a natural later end-state; how
user-authored workflows should work against a pure npm install is exactly the open design
question recorded for AHQ-201, with AHQ-203 as the full re-architecture.

## Three easily-confused pairs — a disambiguation map

Three different "two things" run through this work, on three different axes. Naming them
precisely avoids most of the confusion in this area.

### Packaging Architectures

*How the shippable package is assembled and structured.* The Perplexity review's two candidate
end-states for "runnable sub-programs shipped inside a package":

- **Staged Release Tree** (Option B) — being done **in this ticket (AHQ-197)**.
- **True Nested Packages** (Option A) — deferred to **AHQ-203**, which may never be done.

They are alternatives, but not exclusive ones: the staged tree is the smaller step and is
compatible with nested packages later — it neither blocks nor prejudges AHQ-203.

### Execution Models

*How workflow code runs on whatever machine it's on.* The split is by where the workflow lives,
and it exists regardless of which packaging architecture wins (under nested packages, shipped
workflows would still run built JS):

- **Shipped workflows** (bundled in the published npm package) — always run as **built
  JavaScript**, in production *and* in dev mode.
- **User-authored workflows** (in the user's own workspace) — run via **tsx** for now
  (parent-brief Q3/Q6; revisited in AHQ-201/AHQ-203).

### build-mode Values

*When the build happens, for shipped workflows.* Both values live inside the **same single**
execution model — both run the identical, byte-identical built JS:

- **`build-first`** (dev) — run the shared build immediately, then execute the result.
- **`prebuilt`** (installed package) — execute what was built at publish time, as-is.

One-line recap of all three axes: *which packaging architecture?* → staged tree now, nested
packages maybe later; *how does workflow code run?* → built JS if shipped, tsx if user-authored;
*when does the build happen?* → on the fly in dev, at publish time for users.

## How this relates to "true nested packages" (AHQ-203)

The same Perplexity review offered a bigger re-architecture: make each workflow program a real
standalone package with its own manifest and build (a "monorepo" of packages). That is the maximal
end-state, and it is deliberately **deferred until after AHQ-195** — its main payoff (third-party
workflow authors) is a post-launch concern, and it genuinely reshapes the dev flow. The staged
release tree is the smaller, compatible step being taken now; it neither blocks nor prejudges
AHQ-203.
