# Jira Draft: Switch ts-workflow dependency from `file:` to `link:` protocol

**AHQ-74 Deliverable**
**Date:** 2026-03-03
Jira created:  https://agentic-hq.atlassian.net/browse/AHQ-80

---

## Summary

One sentence outcome: **the ts-workflow's dependency on `agentic-hq` uses `link:` (symlink) instead of `file:` (90MB copy), so `pnpm install` is faster and disk usage drops to zero.**

As a: developer working on agentic-hq
I want: the ts-workflow to use `link:` protocol for its `agentic-hq` dependency
So that: `pnpm install` (which runs every time the skill executes) runs faster and uses less disk space (because it creates a fast symlink instead of copying 90MB, and disk isn't wasted on a redundant copy).

## Background

### What `file:` does (current)

The ts-workflow at `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json` currently has:

```json
"agentic-hq": "file:../../../../../.."
```

When `pnpm install --ignore-workspace` runs, `file:` causes pnpm to **hard-link (copy)** the entire agentic-hq project into `node_modules`. This means:

- ~90MB of files are copied into `ts-workflow/node_modules/agentic-hq/` (including docs, tests, plugins — everything)
- Every `pnpm install` re-copies the entire project — slow and wasteful

Note: the skill command runs `pnpm install --ignore-workspace` **every time** before executing the workflow. This is by design — we can't know if it's the first run or if dependencies have changed, so we always run it. The question is how expensive that install is.

### What `link:` does (proposed)

```json
"agentic-hq": "link:../../../../../.."
```

When `pnpm install --ignore-workspace` runs, `link:` creates a **symlink** in `node_modules`:

- `ts-workflow/node_modules/agentic-hq` → `../../../../../../..` (the agentic-hq workspace root)
- Zero disk usage (just a symlink pointer)
- `pnpm install` is faster — creating/verifying a symlink vs copying 90MB

### Why this matters

This is documented in detail in the AHQ-74 research:

- **02a** (`docs/jira-docs/AHQ-74/docs/02a-claude-code-marketplace-plugins-and-publishing-research.md`): Section B2 "Level 1 — Local Dev (`link:` protocol)" explains the `file:` vs `link:` difference and calls switching to `link:` "a strict improvement". The comparison table (Section B2) shows mechanism, disk usage, and source change visibility differences.
- **02b** (`docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md`): Part 3 "Should We Switch `file:` to `link:`?" confirms `link:` is strictly better for dev mode and notes neither protocol respects the `files` whitelist (both are local dev tools).

### No downsides

| Aspect | `file:` (current) | `link:` (proposed) |
|--------|-------------------|-------------------|
| Mechanism | Hard links (copies files) | Symlink |
| Disk usage | ~90MB copy in node_modules | Zero (just a symlink pointer) |
| `pnpm install` speed | Slow — re-copies 90MB every run | Fast — creates/verifies a symlink |
| `files` whitelist | Not respected | Not respected |
| Import paths | `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code'` | Identical — no change |
| Cross-workspace behaviour | Resolves from physical location | Resolves from physical location |

Both `file:` and `link:` resolve relative to the ts-workflow's physical location, not the user's cwd. So cross-workspace execution (via the `cd` command in the skill output) works identically with either protocol.

## Acceptance Tests

### 1. Existing e2e test still passes

- **When** I run: `pnpm test:e2e:string-reversal`
- **Then** the existing string reversal e2e test passes — proving `link:` works as a drop-in replacement for `file:`.

### 2. (If cross-workspace Jira https://agentic-hq.atlassian.net/browse/AHQ-79 is done first) Cross-workspace e2e test still passes

- **When** I run: `pnpm test:e2e:cross-workspace-string-reversal` (done in https://agentic-hq.atlassian.net/browse/AHQ-79)
- **Then** the cross-workspace test passes — proving `link:` works from another workspace too.

## Implementation

This is a one-line change.

### Change 1: Update `package.json`

File: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`

Before:
```json
"agentic-hq": "file:../../../../../..",
```

After:
```json
"agentic-hq": "link:../../../../../..",
```

### Change 2: Update the `TEMPORARY-LOCAL-DEPENDENCY` comment

The existing comment block (lines 8-15 of the same `package.json`) references AHQ-61's plan for `pnpmfile.cjs` hooks and ENV-driven `.npmrc`. Per AHQ-74 research, that approach has been superseded — `pnpmfile.cjs` is unnecessary and `link:` is the right protocol for local dev. Update the comment to reflect the current plan, or simplify it to just note that `link:` is temporary until a proper registry-based dependency is set up.

### Change 3: Delete `ts-workflow/node_modules` and re-run `pnpm install`

After changing `file:` to `link:`, delete the existing `node_modules` (which contains the 90MB copy) and re-run `pnpm install --ignore-workspace` to create the symlink instead. This is a one-time step.

## Out Of Scope

- Changing the relative path `../../../../../..` (that's correct and works from the ts-workflow's physical location)
- Switching to a registry-based dependency (e.g. `"agentic-hq": "^0.1.0"` from Verdaccio) — that's a later Jira
- Any changes to how the ts-workflow is invoked or how skills work
