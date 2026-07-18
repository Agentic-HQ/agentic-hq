# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic HQ is a thin TypeScript wrapper around Claude Code that allows you to create and run TypeScript programs that chain together multiple Claude Code Skills. Main use (currently): Automate developer workflows to give you better control of the AI and its context.

## Development And Testing Rules

- **TDD MANDATORY**: All code will follow Red-Green-Refactor cycle - write failing test first, verify it fails correctly, then implement, then refactor.
- **WATCH MODE BANNED**: NEVER create `test:watch` scripts or use `--watch` flags - they hang AI test execution. Always use `vitest run` (never `vitest` alone), `jest --no-watch` (never `jest --watch`)
- **NODE VERSION**: Defaults to **Node.js 24 LTS**; supports the Node 22 and 24 LTS lines only (not Node 23). Root `.nvmrc` pins Node 24 (currently `24.15.0`).


## If You're Not Sure, Or Need Help/Research - Use Perplexity

Perplexity is great.  You almost always get really useful answers from it, that help you and the human progress.  The Perplexity MCP worked well but then they introduced a $50 minimum credit addition, so the human may not have set up the MCP and API.  If the MCP is available, just use it directly.  If it isn't then instead you should:
- Create a question for the human to copy/paste into https://perplexity.ai
- STOP and wait for the answer to be pasted by the human
- Continue and use the results
Use Perplexity whenever you have something that repeatedly isn't working (e.g. a failing test or an error from a tool that you can't work out) or if you're starting something new or the human/command has instructed you do some research.  It's **GREAT** for research.

## Keep CLAUDE.md Concise

**RULE: When adding new rules to CLAUDE.md, keep them SHORT (~15-20 lines max, NOT 200+ lines)!**

**Why:**
- CLAUDE.md is included in EVERY prompt at EVERY session start
- Long rules fill up context window quickly → reduces tokens available for actual work
- Long rules get ignored/skipped → defeats the purpose
- **Example violation**: 200+ line rule about function duplication (2025-11-01) - had to cut to 20 lines

**Format for new rules:**
- Core rule statement (1-2 lines)
- Warning signs (3-5 bullets)
- What to do instead (3-5 bullets)
- Real example (1 line showing before/after)
- Total: ~15-20 lines maximum

## CRITICAL: Never Commit Without Explicit Approval

**RULE: NEVER run `git add`, `git commit`, or `git push` commands directly!**

- The user has a custom `/commit` command that handles the entire commit workflow
- The `/commit` command creates commit messages, gets approval, then stages/commits/pushes
- **ONLY commit when the user explicitly runs the `/commit` command**
- If you commit without approval, you bypass the review process and may commit unwanted changes
- Applies even for "simple fixes" or "quick cleanups"

If you need to commit something, STOP and tell the user:
> "These changes are ready to commit. Please run the `/commit` command when you're ready."

## Running Formatters: Only After Confirming Scope

**RULE: Formatters (`pnpm format:fix`, `prettier --write`, `pnpm lint:fix`) are allowed mid-work ONLY after `pnpm format:check` / `pnpm lint:check` has confirmed the pending changes are confined to code you wrote in this commit. If the check shows unrelated files would be reformatted, do NOT run the fix.**

The goal is to keep functional changes separate from whole-repo reformatting churn — not to ban formatters outright.

**Allowed workflow:**
1. Run `pnpm format:check` (read-only) — see which files would change.
2. If **only your in-progress files** are listed → running `pnpm format:fix` (or `prettier --write <those files>`) is fine.
3. If **unrelated files** are listed → stop. Either leave them alone, or make it a separate dedicated formatting commit with no code changes mixed in.

Same pattern for `pnpm lint:check` → `pnpm lint:fix`.

**Why this matters (problem we're avoiding):**
- You change 1 line of actual code.
- You run `pnpm format:fix` without checking scope first.
- Formatter touches 44 files with whitespace/formatting changes.
- Git diff shows hundreds of lines changed.
- Impossible to review what actually changed; code review becomes a nightmare.

**One exception where no scope check is needed:**
- A separate, dedicated formatting commit with no code changes mixed in — by definition the whole commit *is* the reformatting, so mixing is impossible.

**The rule is about scope discipline, not about blocking the tool.**

## CRITICAL: Never Catch Errors And Fall Back To Defaults

**RULE: In critical systems (config, logging, DB connections, required imports), let errors propagate — never silently fall back to defaults.**

A catch-and-fallback hides real problems (missing file, permission error, bad syntax) and lets the system run with wrong configuration.

```typescript
// BAD — silent fallback
try { this.config = await loadConfig(); }
catch { this.config = DEFAULT_CONFIG; }

// GOOD — fail fast, let it propagate
this.config = await loadConfig();
```

**Always fail fast for:** config loading, required imports/env vars, DB connections, critical initialisation, validation.

**Only catch when:** graceful degradation is explicitly in the spec, or the human has approved a fallback. Never invent one.

## Never Use Underscore Prefix To Suppress Warnings

**RULE: Don't prefix variables with `_` to silence the "unused" warning — fix the underlying problem.**

```typescript
// BAD — hides the fact that worker is stored but never used
constructor(private readonly _worker: ZeebeWorker) {}

// GOOD — either use it…
constructor(private readonly worker: ZeebeWorker) {}
async close() { await this.worker.close(); }

// …or don't store it at all.
```

**The only legit case for `_`:** the parameter is required by an interface or callback signature you can't change (e.g. `array.map((_v, _i, arr) => arr.length)`).

**Decision rule:** stored as a field? It must be used somewhere. Required by a signature you can't change? `_` is OK. Otherwise: fix properly.

## Unit Tests Must Verify Behaviour, Not Just Initialisation

**RULE: Unit tests must call the primary public methods and assert behaviour — not just that the constructor returned an object.**

```typescript
// BAD — doesn't test the main method at all
const engine = await CamundaWorkflowEngine.create(...);
expect(engine).toBeDefined();

// GOOD — calls the actual method, asserts behaviour
const outcome = await engine.runWorkflow('TestMission');
expect(mockZeebe.createProcessInstance).toHaveBeenCalledWith(...);
expect(outcome.getOutcomeId()).toBe('PASS');
```

**Red flags that mean your tests are insufficient:**
- `expect(x).toBeDefined()` is the only assertion.
- TODO comments like "will test later" or "tested in integration tests".
- Tests only call constructors/factories, never the primary methods.
- Excuses about timeouts/sleeps preventing tests — use `vi.useFakeTimers()` instead of skipping.

**Sanity check:** if you deleted the main method's implementation, would the tests fail? If no, the tests aren't testing anything.

## Check For Existing Code Before Creating New Functions

**RULE: Before creating a new function, search for existing functions that do similar things and NOTE DOWN IN YOUR "REFACTOR LIST" that this happened - then in the REFACTOR stage of TDD review that list and decide whether to refactor out the duplication**

### Warning Signs You're About to Duplicate:
- 🚩 New function has similar name/parameters to existing function
- 🚩 New function reuses existing helper functions extensively
- 🚩 Only difference is a parameter value, timestamp, or simple conditional
- 🚩 You copy-paste code from existing function to start new function

### What to Do Instead:
1. **Search first**: Use Grep to find functions with similar names/purposes
2. **Modify existing**:  NOTE DOWN IN YOUR "REFACTOR LIST": We could add an optional parameter with backward-compatible default
3. **Real Example**: `generateTestMission()` existed but auto-generated timestamped IDs. Instead of creating new `createUnitTestMission(id)` duplicating all the code, we modified existing function to accept optional `{ useTimestamp?: boolean }` parameter

### When NEW Function IS Appropriate:
- Completely different purpose (not just different parameter)
- Different abstraction level or domain/context
- Modifying existing would break single responsibility

## Validate Before Committing

**RULE: Run `pnpm validate` after any coding work and before committing.**

`pnpm validate` runs four checks in sequence:
1. **`pnpm typecheck`** — TypeScript type errors (tests alone don't catch these — Vitest only transpiles).
2. **`pnpm lint:check`** — code quality / style.
3. **`pnpm format:check`** — formatting drift.
4. **`pnpm test`** — runtime behaviour.

All four must pass — 100%, no exceptions.

**⚠️ Run it in the right directory.** Running `pnpm validate` at the repo root while a mission test is in flight under `docs/mission-docs/<MissionId>/project-output/` can kill the in-flight test. Pick whichever directory you're actually doing the dev work in:

```bash
cd <project-or-mission-or-spike-dir>
pnpm validate
```

## Don't Update Code Without Running Tests First

**RULE: Run tests BEFORE making "obvious" fixes — confirm they actually fail first.**

- See code that looks wrong? Run the test first.
- If it passes, the test was right — your "fix" would have broken it.
- Applies to bug fixes, refactors, cleanups, "obvious" corrections — everything.

Real example: AI was about to swap `process.cwd()` for a config-manager helper. Running the test first showed it was already correct — the swap would have broken a passing test.

## Before Deleting/Renaming/Moving Files: Search for References First

**RULE: Use Grep to search for references BEFORE deleting, renaming, or moving files.** Even files named `.BACKUP`, `DELME`, or `test-*` may be active test fixtures. Grep is faster than running tests and prevents breakage.
