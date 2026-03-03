# Jira Draft: agentic-hq CLI Runs String Reversal From A Separate Dev Workspace

**AHQ-74 Deliverable**
**Date:** 2026-03-02
Jira created: https://agentic-hq.atlassian.net/browse/AHQ-79

---

## Summary

One sentence outcome: **a developer who has run `switch-agentic-hq-to-dev` (which does `pnpm install && pnpm link --global`) can open a terminal in any workspace on their machine, type `agentic-hq`, and successfully run the string reversal workflow.**

As a: developer who has cloned the agentic-hq repo
I want: to run `agentic-hq` from my own project workspace and have it execute a demo workflow
So that: I can see agentic-hq working outside the repo directory, proving the CLI works as a globally-installed tool against live source code.

## Background

AHQ-56 got the `agentic-hq` CLI working within the agentic-hq project directory. The existing e2e test runs `node bin/agentic-hq.cjs` from the repo root — which works because `getProjectRoot()` (via `git rev-parse`) returns the agentic-hq workspace, and all plugin paths resolve correctly.

The problem: when running from a different workspace, `getProjectRoot()` returns that workspace's git root — not the agentic-hq workspace. Plugin paths break, temp file paths land in the wrong place.

The fix is small and documented in `docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md`. The TL;DR:

1. Add 1 line to `bin/agentic-hq.cjs`: `process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');`
2. Create a small `AgenticHqConfig` class that reads that env var (falls back to `git rev-parse` for existing workflows that bypass the binary)
3. Mechanical replacements in `ClaudeCodeTool.ts` and demo CLIs: swap `getProjectRoot()` for the right Config method

## Acceptance Tests

### 1. Unit test for AgenticHqConfig

- **When** I run: `pnpm test:unit`
- **Then** a unit test verifies methods in the AgenticHqConfig class:
  - `getAgenticHqWorkspaceRoot()` returns the env var value when `AGENTIC_HQ_WORKSPACE_ROOT` is set
  - `getAgenticHqWorkspaceRoot()` falls back to `git rev-parse` when the env var is not set
  - `getAgenticHqPluginsDir()` returns `getAgenticHqWorkspaceRoot() + '/.agentic-hq/plugins'`

NOTE: We are going to slightly break convention and design all these unit tests for this new AgenticHqConfig in ONE HIT as part of the TDD workflow.  This is because it's too much overhead to repeat 5 loops of red->green->refactor for these tiny tests (and the automatic workflow currently doesn't support more than one run of a unit test)

### 2. E2E test confirms string reversal works from a separate workspace via the globally-linked binary

- **When** I run: `pnpm test:e2e:cross-workspace-string-reversal`
- **Then** this e2e test will:
  1. Run `scripts/infra/switch-agentic-hq-to-dev.sh` (which will put the `agentic-hq` binary on the PATH) (WARNING: See section about this being "smelly" below)
  2. Create an empty temp workspace at `/tmp/agentic-hq-test-workspaces/test-ws-{guid}/`
  3. Change directory to the temp workspace
  4. Run `git init` in that workspace (so `git rev-parse` works for `getCurrentWorkspaceRoot()`)
  5. Run `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="cross workspace test"` — exactly as a developer would type it from their own project
  6.a. Confirm the output contains the expected reversed string: `"tset ecapskrow ssorc"`
  6.b. Confirm the <workspace_root>./.agentic-hq/temp directory contains the expected output files
  7. Output message saying temp workspace won't be cleaned as `/tmp` is assumed to be auto-cleaned (On Mac: cleaned on reboot or files older than 3 days are cleaned on a daily basis)
- **And** it does this within a 90 second timeout.
- **And** the existing `agentic-hq-cli-string-reversal` e2e test (which runs from within the repo) still passes — proving the `git rev-parse` fallback works for the existing code path.


## Implementation Guidance

**Read first:** `docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md` — contains the full research, the three-roots problem, and the AgenticHqConfig class design.

### Change 1: Set env var in `bin/agentic-hq.cjs`

Add one line before the `execFileSync` call:

```javascript
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');
```

This is the only change to this file. The bootstrapping logic (`__dirname`-based tsx and CLI paths) already works correctly through symlinks.

### Change 2: Create `AgenticHqConfig` class

New file: `src/config/agentic-hq-config.ts`

See Part 7 of the 02b document for the full design. Key methods:

| Method | Returns | Source |
|--------|---------|--------|
| `getAgenticHqWorkspaceRoot()` | Where agentic-hq source + plugins live | `AGENTIC_HQ_WORKSPACE_ROOT` env var, fallback to `git rev-parse` |
| `getAgenticHqPluginsDir()` | Plugin directory | `getAgenticHqWorkspaceRoot() + '/.agentic-hq/plugins'` |
| `getCurrentWorkspaceRoot()` | Git root of user's cwd | `git rev-parse --show-toplevel` |
| `getAgenticHqTempDir()` | Temp files for command I/O | `getCurrentWorkspaceRoot() + '/.agentic-hq/temp'` |
| `getProjectWorkingDir()` | Where Claude makes code changes | `getCurrentWorkspaceRoot()` (for now) |

The `git rev-parse` fallback in `getAgenticHqWorkspaceRoot()` is needed because many code paths bypass the binary (demo scripts, tests, direct tsx invocations). See Part 7's table of which scripts go through the binary vs bypass it.

### Change 3: Update `ClaudeCodeTool.ts`

Replace `getProjectRoot()` calls with the appropriate Config method:

- Plugin paths → `config.getAgenticHqPluginsDir()` (agentic-hq workspace)
- CWD for Claude → `config.getProjectWorkingDir()` (user's workspace)
- Temp I/O directory → `config.getAgenticHqTempDir()` (user's workspace)

### Change 4: Update demo CLIs

In `full-jira-tdd-story-workflow-demo-cli.ts` and `quick-jira-workflow-demo-cli.ts`, replace `getProjectRoot()` with `config.getCurrentWorkspaceRoot()` (these are already getting the user's project root, just need to use the explicit method).

### Change 5: Create `switch-agentic-hq-to-dev` setup script

New file: `scripts/infra/switch-agentic-hq-to-dev.sh`. Two commands: `pnpm install && pnpm link --global`. This is what a developer runs once after cloning. See Part 4 of the 02b document. Lives in `scripts/infra/` (not `bin/`) because it's developer infrastructure tooling, not the product binary.

### E2E Test Approach

The test runs the `agentic-hq` binary — the same command a developer types. This is the real developer experience:

| Aspect | Existing test (AHQ-56) | New test (this Jira) |
|--------|----------------------|---------------------|
| Working directory | Repo root (`process.cwd()`) | Temp workspace (`/tmp/agentic-hq-test-workspaces/test-ws-{guid}/`) |
| Command | `node bin/agentic-hq.cjs` (relative, within repo) | `agentic-hq` (globally-linked binary, from another workspace) |
| What it proves | CLI works from within the repo | CLI works from any workspace, via the global binary |
| Setup | Delete ts-workflow node_modules | `scripts/infra/switch-agentic-hq-to-dev.sh`, create temp dir, `git init` |
| Teardown | None | None (`/tmp` is auto-cleaned) |

The test runs `scripts/infra/switch-agentic-hq-to-dev.sh` in its own setup, so it's fully self-contained — no manual pre-requisites.

## What Does NOT Change

- `package.json` `bin` entry (stays as `"agentic-hq": "bin/agentic-hq.cjs"`)
- `bin/agentic-hq.cjs` bootstrapping logic (only addition is the env var line)
- Plugin structure (already works with absolute `--plugin-dir`)
- Skill definitions (already use skill base directory)
- ts-workflow dependency resolution (`file:` relative paths work from physical location)
- CLI argument parsing (Commander setup stays the same)

## Out Of Scope

- Verdaccio / npm publishing setup (not needed for dev mode — see 02b document and in later Jira's we may do this and come back to useful research/ideas in docs/jira-docs/AHQ-74/docs/02a-claude-code-marketplace-plugins-and-publishing-research.md)
- Marketplace plugin installation (absolute `--plugin-dir` paths work for dev mode)
- Switching `file:` to `link:` in ts-workflow dependency (separate Jira)
- Creating the `switch-agentic-hq-to-prod` setup script (later, when packaging validation is needed)
- `npm pack` packaging validation (later Jira)

## Reference: How The Whole Workflow Fits Together

The companion document `docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md` is essential reading for anyone implementing or reviewing this work. It explains the complete workflow end-to-end: how the globally-linked binary bootstraps via `__dirname`, how absolute `--plugin-dir` paths eliminate the need for marketplace in dev mode, how the ts-workflow dependency chain resolves back to the agentic-hq workspace via the `cd` command in skill output, and the three-roots problem that `AgenticHqConfig` solves. This research was done as part of [AHQ-74](https://agentic-hq.atlassian.net/browse/AHQ-74).

## Known Smell: `pnpm link --global` Mutates Global State

This approach works, but it has a bad smell that we should acknowledge.

**The problem:** `pnpm link --global` changes the global pnpm state on the developer's entire machine — it rewrites what `agentic-hq` points to in `~/.local/share/pnpm/global/` and `~/.pnpm/_bin/`. This is a hidden side-effect that reaches outside the project. The e2e test has to do this in its setup, which means running the test suite silently mutates global state on the laptop. That's not great.

**Why we're doing it anyway:** It's the simplest way to get cross-workspace execution working right now. The alternative (Verdaccio, marketplace, etc.) is far more complex for the same result. Pragmatism wins.

**The better future:** Ideally, changes should be local to the project that's doing the work. The TypeScript code that actually runs inside the developer's workspace (or wherever it gets run) should be the thing that decides whether it points to dev source or to the production `agentic-hq` package — without needing global pnpm state to have been set up first.

If we get to that point (e.g. the ts-workflow's `package.json` dependency on `agentic-hq` resolves to dev source in dev mode and to the published package in production mode, controlled locally), then:

- No `pnpm link --global` needed
- No global state mutation
- Tests don't touch anything outside the project
- The smell goes away

**Action:** When a better mechanism is found, refactor this test and the setup scripts to remove the global state dependency. Until then, this is a conscious trade-off — pragmatic but smelly.
