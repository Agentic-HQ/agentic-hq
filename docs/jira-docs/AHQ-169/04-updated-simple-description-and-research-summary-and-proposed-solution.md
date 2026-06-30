# Agentic HQ install — simple description, research summary, and proposed solution

*This supersedes an earlier draft (the hand-rolled-launcher `problem.md`, not
retained in the repo), which proposed a hand-rolled launcher script — now
dropped; see "What changed" at the end. The problem statement itself now lives in
[`01-problem-description.md`](01-problem-description.md).*

---

## TL;DR

- **The problem:** the dev install uses `pnpm add -g .`, and pnpm 11 puts global
  commands in its own private folder (`$PNPM_HOME/bin`) that isn't on your `PATH`.
  Getting it onto `PATH` needs `pnpm setup` + a shell restart — a confusing,
  multi-step, machine-mutating dance.
- **Root cause:** it's a **pnpm-specific quirk**, not your code. `npm` doesn't have
  this problem — its global bin folder (especially under nvm) is already on `PATH`.
- **The fix:** stop using pnpm for the global step. Use **`npm link`**, which uses
  the `bin` field you already have to put `agentic-hq` on `PATH` — in the common
  case with **no setup and no shell restart**, and it works cross-platform.
- **Two independent research sources (my own web research + Perplexity) agree** on
  this, and agree it lets us **delete the "This is smelly" warning**.
- **Later (when you publish to npmjs.org):** add a build step that compiles
  TypeScript → JavaScript and point `bin` at the compiled file. Same install
  mechanism, just a different target.

---

## Part 1 — The problem, explained simply

**What a "command" really is.** When you type `agentic-hq`, the terminal just
looks for a program file of that name in a fixed list of folders called `PATH`.
If none of those folders contains it, you get `command not found`. So "install a
command globally" = "put it (or a pointer to it) in a folder that's on `PATH`."

**What your command actually is.** The real program is `bin/agentic-hq.cjs` in the
repo. It's self-contained: it finds the repo's own `tsx` and uses it to run your
TypeScript CLI, and it locates the repo from its *own* file location — so it works
no matter which directory you run it from. (Proven: I ran a faithful copy from
`$HOME`, `/tmp`, and a random project dir — it always found the repo correctly.)

**Where it broke.** The install script used `pnpm add -g .`. On pnpm 11:

1. pnpm wants to put a pointer named `agentic-hq` into its *own* private folder,
   `$PNPM_HOME/bin` (on your machine: `~/.local/share/pnpm/bin`).
2. But that folder is **not on `PATH`** by default.
3. pnpm checks "is my folder on PATH?", sees no, and **refuses** — printing:
   `The configured global bin directory "…/.local/share/pnpm/bin" is not in PATH`.
4. So the pointer was never even created (I confirmed that folder is empty), *and*
   it wouldn't be findable anyway.

The documented fix — `pnpm setup` then restart your shell then re-run — works, but
it's three fiddly steps that mutate your shell config, and it confused even you.

---

## Part 2 — Research summary

I researched this two ways independently: my own web search, and a question posed
to Perplexity. **They reached the same conclusions.**

| Question | Conclusion (both sources agree) |
|---|---|
| Is this our code's fault? | **No** — it's pnpm 11's global-bin ergonomics. npm integrates with nvm's PATH; pnpm uses a separate `$PNPM_HOME/bin` that needs manual setup. |
| Best way to expose the CLI in dev? | **`npm link`** — the canonical "run my local clone globally" command. Uses the `bin` field; usually already on PATH; gives a live symlink to the repo. |
| Hand-roll our own launcher script? | **No** — "not idiomatic… a pragmatic bootstrap hack." It duplicates what `bin` already does and is Unix-only. |
| Windows? | The `bin` field auto-generates `.cmd`/`.ps1` shims; a bash launcher can't. Another reason to use `bin` + `npm link`, not a script. |
| Publishing to npm later? | **Compile TypeScript → JavaScript**, point `bin` at the compiled JS, keep `tsx` as a dev-only tool. Don't ship `tsx` as a runtime dependency. |
| Build tooling? | **tsup** (popular, zero-config) or **plain `tsc`**. `oclif` is overkill for a thin wrapper. |

One important refinement I'd add on top of both: it must be **`npm link`**, *not*
`pnpm link --global` — because pnpm's link command *also* uses `$PNPM_HOME/bin`
and would hit the exact same PATH footgun. `npm link` is what sidesteps it.

*(Full write-ups with citations:
[`03-web-research-q-and-a.md`](03-web-research-q-and-a.md) and the answer in
[`02-perplexity-q-and-a.md`](02-perplexity-q-and-a.md).)*

---

## Part 3 — Proposed solution

A clean two-phase plan. The install mechanism stays the same across both phases —
only *what `bin` points at* changes — so nothing built now is thrown away later.

### Phase 1 — Now: fix dev onboarding (small, low-risk)

Replace the `pnpm add -g .` step with `npm link`:

1. `pnpm install` (so the repo's `tsx` and deps exist) — unchanged.
2. `npm link` — registers `agentic-hq` on `PATH` via the existing `bin` field, as
   a live symlink back to the repo.
3. **It just works in the same terminal** — no `pnpm setup`, no shell-config edit,
   no restart (under nvm, npm's global bin is already on PATH).
4. The script self-verifies by actually running `agentic-hq` and printing a check.

Mixing `npm link` into a pnpm repo is fine: `npm link` only registers the command;
pnpm still owns `node_modules`.

### Phase 2 — Later: make it publish-ready (when you go to npmjs.org)

1. Add a build step (**tsup** or **tsc**) that compiles `src/` → `dist/`.
2. Point `bin` at the compiled `dist/cli.js` (with a `#!/usr/bin/env node` shebang).
3. Move `tsx` to a dev-only dependency (not shipped to users).
4. Add `prepublishOnly` so the build always runs before `npm publish`.
5. Then end users simply `npm install -g agentic-hq` (or `npx agentic-hq`) — the
   same `bin`-shim mechanism, now pointing at compiled JS.

---

## Part 4 — Two things you asked about, answered

**Does it still run from any directory and know where the workspace is?**
**Yes.** `npm link` makes the global `agentic-hq` a symlink to the repo's
`bin/agentic-hq.cjs`, which derives the workspace root from its own location
(`__dirname`), independent of your current directory. This is the same mechanism
that works today — I verified it runs correctly from `$HOME`, `/tmp`, and an
arbitrary project folder.

**Can we delete the "This is smelly. Sorry." warning?**
**Yes.** That banner apologises specifically for `pnpm add -g .` mutating pnpm's
global state. `npm link` is the standard, cross-platform, reversible Node
mechanism (undo with `npm unlink`) — it needs no apology. The big `PNPM_HOME` /
pnpm-11 caveat block in the script header also goes.

---

## Part 5 — What changes concretely (high level)

- **`scripts/infra/install-dev-agentic-hq.sh`** — replace `pnpm add -g .` with
  `npm link`; drop the "smelly"/`PNPM_HOME` warning blocks; add a self-verify step.
- **5 cross-workspace e2e tests** (`tests/e2e/demo/cross-workspace-*.e2e.test.ts`
  and one more) — they currently run the install script then locate the shim via
  `$PNPM_HOME/bin`. They'd locate it via npm's global bin instead (often no
  patching needed). Good chance to extract the duplicated setup into one shared
  helper (already flagged as tech debt under AHQ-82).
- **Docs** — rewrite README Quick Start step 5 and the install section of
  `docs/user-docs/troubleshooting-quickstart.md` to match the simpler flow (remove
  the `pnpm setup` / `PNPM_HOME` instructions).

---

## Open decisions (for you)

1. **Scope:** do Phase 1 now and track Phase 2 as a ticket (recommended — fixes
   your actual pain with least risk), *or* do both now?
   A: Phase 1 only.  Publishing to npmjs.org remains a future task.
2. **Install UX:** keep `install-dev-agentic-hq.sh` as a one-script entry point
   that wraps `npm link` + verify (recommended), *or* drop the script and just
   document `pnpm install && npm link` in the README?
   A: drop the script and document `pnpm install && npm link` in the README?

---

## What changed since the earlier draft

The earlier draft (`problem.md`, the hand-rolled-launcher proposal — not retained
in the repo) proposed a **hand-rolled launcher script** placed into a
PATH directory we detect. The research (both sources) advised against that — it's
non-idiomatic, Unix-only, and reinvents what the `bin` field already does. **The
launcher idea is dropped in favour of `npm link`.** Everything else (the PATH
explanation, run-from-anywhere being preserved, removing the warning) still holds.