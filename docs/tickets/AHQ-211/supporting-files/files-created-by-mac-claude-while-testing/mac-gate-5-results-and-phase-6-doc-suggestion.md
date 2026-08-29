# AHQ-211 — Mac Gate 5 results + one Phase 6 doc suggestion

From the Claude session on Steve's Mac, 2026-08-29. Two things in this file: the Mac half of
the Phase 5 gate, and a small suggestion to fold into your Phase 6 docs work.

## 1. Phase 5 gate — Mac (POSIX) side

Run on branch `feature/ahq-211-add-windows-support` at `c73bf85` (freshly pulled), Node
v24.15.0, pnpm 11.1.2, macOS (Darwin x86_64).

- **`pnpm install --frozen-lockfile`:** clean, "Already up to date" (~700 ms).
- **`pnpm validate`:** **PASS** — typecheck ✓, lint ✓, format ✓, **239 unit tests passed +
  5 skipped (244 defined)**, 3.4 s. Mirror image of your Windows run (241 + 3): here the 3
  POSIX-only tests run and the 5 win32-only ones skip. Same 244 total.
- **`pnpm demo:agentic-hq-cli:string-reversal` (deferred Phase 4 demo gate):** **PASS** — run
  by Steve 2026-08-29. Spawned real-Claude session read the input, reversed it, wrote the
  output, then self-terminated via
  `node ".../skills/self-termination/scripts/kill-current-cli-process-node.cjs"` (visible in
  the session transcript). No hang; control returned to the wrapper, which printed
  `Reversed string: esrever ot gnirts tluafed eht si siht` back at the shell prompt. Note this
  run also exercised the node kill script under real Claude on POSIX (SIGINT path) end-to-end.
- **Real-Claude self-termination run:** **PASS** — run by Steve 2026-08-29 on Claude Code
  v2.1.251 (≥ 2.1.214 CLAUDE_PID requirement met). Fresh interactive session in the repo,
  `/agentic-hq-core-plugin:self-termination` invoked; the skill ran
  `node ".../scripts/kill-current-cli-process-node.cjs"` and the session terminated
  immediately, dropping straight back to the shell prompt.

**All three Mac (POSIX) checks of the Phase 5 gate: PASS.** Windows halves are with the
Windows session.

## 2. Suggestion for Phase 6 docs: "pnpm install is not one-off"

While prepping the gate, Steve flagged that as someone new to TypeScript/Node dev he wouldn't
have known `pnpm install` must be re-run after pulling. Verified current state on the branch:

- `docs/dev/setting-up-agentic-hq-for-development.md` documents only the FIRST
  `pnpm install` (after cloning, ~line 74). Nothing says it must be repeated when
  `pnpm-lock.yaml` changes.
- The repo's `.npmrc` already sets `frozen-lockfile=true`, so plain `pnpm install` is safe to
  re-run — the note needs no flags.

**Ask:** during your Phase 6 README/CONTRIBUTING/troubleshooting docs item, add a short note
to `docs/dev/setting-up-agentic-hq-for-development.md`, right after the install step —
suggested wording (edit freely):

> **Keeping your clone current:** `pnpm install` is not one-off. `node_modules/` is local to
> your machine and git never touches it, so after `git pull` or a branch switch that changed
> `pnpm-lock.yaml`, re-run `pnpm install`. It's near-instant when nothing changed, and
> skipping it when something *did* change is a classic source of confusing failures. (This
> repo's `.npmrc` pins installs to the lockfile, so the plain command is always safe to
> re-run.)

This is a suggestion from the Mac side, not something already in the plan — treat it as a
candidate Phase 6 sub-item for Steve to approve, and adjust placement/wording to fit however
you restructure the docs.
