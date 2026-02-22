# GREEN Phase Implementation Plan: AHQ-56 E2E Test

## Context

AHQ-56 requires an `agentic-hq` CLI that runs TypeScript workflow code bundled with a Claude Code Plugin skill. The unit test GREEN phase is complete (created `buildWorkflowCommand()` in `src/cli/agentic-hq-cli.ts`). Now we need to make the E2E test pass.

The E2E test at `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` runs:
```
agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is a test string"
```
and expects output to contain `"gnirts tset a si siht"`.

Currently `agentic-hq` on PATH is a placeholder from npmjs.org. We need to replace it with our real CLI via `pnpm link --global`.

---

## Jira Requirements (Numbered)

1. `agentic-hq` CLI with `--workflow-command-supplier` option -> [Step 3 + Step 4]
2. `--` separator for passthrough args (Commander `.passThroughOptions()`) -> [Step 4]
3. CLI invokes skill via ClaudeCodeTool to get workflow command -> [Step 4]
4. Skill at `skills/string-reversal/SKILL.md` returns the full command -> [Step 6]
5. SKILL.md uses `skill-base-dir` to find `ts-workflow/` -> [Step 6]
6. Self-contained mini Node.js project in `ts-workflow/` -> [Step 7]
7. `pnpm install --ignore-workspace` in ts-workflow -> [Step 7a]
8. PTY-based passthrough (same as ClaudeCodeTool) -> [Step 4]
9. All stdout/stdin passed through -> [Step 4]
10. Exclude plugins from pnpm workspace -> [Step 5]
11. **AC1**: `pnpm test:e2e:agentic-hq-cli-string-reversal` passes within 30s -> [Verification]
12. Out of scope: npm publishing, marketplace distribution -> N/A
13. `bin/agentic-hq.cjs` entry point using `tsx` (Confluence) -> [Step 3]
14. `"bin"` + `pnpm link --global` (Confluence) -> [Step 2 + Step 8]
15. ClaudeCodeTool as `file:` protocol dependency in ts-workflow -> [Step 7a]

---

## File Structure (Conventional TypeScript CLI layout per Perplexity research)

```
bin/
  agentic-hq.cjs              <- CJS wrapper: runs `tsx src/cli/agentic-hq-cli.ts`
src/cli/
  agentic-hq-cli.ts           <- Commander entry point (REWRITTEN - replaces current content)
  command/
    workflow-command.ts        <- buildWorkflowCommand() (MOVED from current agentic-hq-cli.ts)
```

Unit test import path changes: `src/cli/agentic-hq-cli.js` -> `src/cli/command/workflow-command.js`

---

## Implementation Steps

### Step 0: Copy this approved plan
Copy to `docs/jira-docs/AHQ-56/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md`

### Step 1: Verify current state
- Run E2E test to confirm it fails (RED verification)
- Confirm `which agentic-hq` is the placeholder

### Step 2: Add `"bin"` and `"exports"` to `package.json`
**File**: `package.json`

```json
"bin": {
  "agentic-hq": "bin/agentic-hq.cjs"
},
"exports": {
  "./tools/claude-code": "./src/tools/claude-code/ClaudeCodeTool.ts"
},
```

### Step 3: Create `bin/agentic-hq.cjs`
**File**: `bin/agentic-hq.cjs` (NEW)

Minimal CJS wrapper that runs `tsx src/cli/agentic-hq-cli.ts`, passing all args through. `chmod +x`.

### Step 4: Restructure CLI files

**4a: Move `buildWorkflowCommand()` to `src/cli/command/workflow-command.ts`**
- Move the function and its imports from current `src/cli/agentic-hq-cli.ts`
- This is the testable business logic (per TypeScript CLI convention)

**4b: Rewrite `src/cli/agentic-hq-cli.ts` as Commander entry point**
- Commander with `.passThroughOptions()` to parse `--workflow-command-supplier` and collect args after `--`
- Creates `ClaudeCodeTool` instance
- Calls `buildWorkflowCommand()` from `./command/workflow-command.js`
- Executes resulting command via PTY (copied from `ClaudeCodeTool.runPtyProcess()` pattern):
  - `node-pty` spawn with `bash -c "<command>"`
  - Terminal size detection (80x30 fallback)
  - Dynamic resize handling
  - stdout streaming, stdin passthrough with isTTY guard
  - Signal cleanup (SIGINT/SIGTERM)
  - Flow control enabled
- No ESM guard needed - nothing imports this file (tests import from `command/workflow-command.ts`)
- PTY duplication from ClaudeCodeTool is OK in GREEN - REFACTOR will extract shared utility

**4c: Update unit test import**
- Change `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts`
- Import from `../../../src/cli/command/workflow-command.js` instead of `../../../src/cli/agentic-hq-cli.js`

### Step 5: Update `pnpm-workspace.yaml`
Add plugin exclusion:
```yaml
  - '!.agentic-hq/plugins/**'
```

### Step 6: Create SKILL.md
**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md` (NEW)

Pattern from `steve-test-plugin/skills/investigate-git-stuff/SKILL.md`:
- Gets `skill-base-dir` (provided at runtime by skill runner)
- Writes to `command-output.json`: `cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal`
- Self-terminates

### Step 7: Create `ts-workflow/` mini project
**Directory**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`

#### 7a: `package.json`
```json
{
  "name": "agentic-hq-demo-string-reversal",
  "version": "0.0.1",
  "type": "module",
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "demo:string-reversal": "tsx src/string-reversal-demo-cli.ts"
  },
  "dependencies": {
    "// TEMPORARY-LOCAL-DEPENDENCY — See AHQ-61": [
      "This file: dependency is a TEMPORARY workaround. AHQ-61 will replace it with",
      "a proper script-driven, ENV-controlled dependency resolution system.",
      "",
      "See: https://agentic-hq.atlassian.net/browse/AHQ-61",
      "",
      "CURRENT STATE: file:../../../../../.. hard-links the main agentic-hq project",
      "so that 'import { ClaudeCodeTool } from agentic-hq/tools/claude-code' works.",
      "",
      "WHAT AHQ-61 WILL DO:",
      "  - Replace file: with a versioned dep: \"agentic-hq\": \"^0.1.0\"",
      "  - Add ENV-driven .npmrc: registry=${AHQ_REGISTRY_URL}",
      "  - Add pnpmfile.cjs hook: if AHQ_USE_LOCAL=1, rewrite to link: at install time",
      "  - Add switching scripts: pnpm deps:local / deps:verdaccio / deps:prod",
      "  - Result: package.json never changes, mode switching via scripts only",
      "",
      "THE 3 MODES (after AHQ-61):",
      "  Local Dev:    pnpm deps:local      (AHQ_USE_LOCAL=1, uses live source)",
      "  Verdaccio:    pnpm deps:verdaccio  (tests published package locally)",
      "  Production:   pnpm deps:prod       (real npm/GitHub Packages)",
      "",
      "KEY: The import path 'agentic-hq/tools/claude-code' NEVER changes across modes."
    ],
    "agentic-hq": "file:../../../../../..",
    "tsx": "^4.20.6",
    "commander": "^14.0.3"
  }
}
```

`node-pty` comes transitively via `agentic-hq`'s dependencies - no need to list it directly.

#### 7b: `src/string-reversal-demo-cli.ts`
Copy of `src/demo/cli/string-reversal-demo-cli.ts` with import changed:
- FROM: `import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js';`
- TO: `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code';`

#### 7c-7f: Config files
- `.nvmrc` -> `22`
- `.npmrc` -> `engine-strict=true`
- `.gitignore` -> `node_modules/`
- `tsconfig.json` -> Minimal TS config

### Step 8: Install and link
1. `pnpm install` (creates bin symlink)
2. `pnpm link --global` (overrides placeholder on PATH)

### Step 9: Run E2E test
```bash
pnpm test:e2e:agentic-hq-cli-string-reversal
```

### TODO: After Step 9
Re-read original command file for documenting steps and remaining workflow (Steps 7b, 7c, 8, 9, 10, 11, 12 of the command).

---

## Verification
- `pnpm test:e2e:agentic-hq-cli-string-reversal` passes within 30s
- `which agentic-hq` points to local bin (not npm placeholder)
- Unit tests still pass after restructure

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | MODIFY | Add `"bin"` + `"exports"` |
| `bin/agentic-hq.cjs` | CREATE | CJS wrapper for tsx |
| `src/cli/agentic-hq-cli.ts` | REWRITE | Commander entry point + PTY execution |
| `src/cli/command/workflow-command.ts` | CREATE (move) | `buildWorkflowCommand()` moved here |
| `tests/unit/cli/...unit.test.ts` | MODIFY | Update import path |
| `pnpm-workspace.yaml` | MODIFY | Add plugin exclusion |
| `.../skills/string-reversal/SKILL.md` | CREATE | Skill returning workflow command |
| `.../ts-workflow/package.json` | CREATE | Mini project with `file:` dep |
| `.../ts-workflow/src/string-reversal-demo-cli.ts` | CREATE | Workflow CLI (copy, import changed) |
| `.../ts-workflow/.nvmrc, .npmrc, .gitignore, tsconfig.json` | CREATE | Config files |

## Existing Code Being Reused
- `src/cli/agentic-hq-cli.ts:buildWorkflowCommand()` -> moved to `src/cli/command/workflow-command.ts`
- `src/tools/claude-code/ClaudeCodeTool.ts:runPtyProcess()` pattern -> duplicated into agentic-hq-cli.ts (refactored later)
- `steve-test-plugin/skills/investigate-git-stuff/SKILL.md` -> skill-base-dir pattern
