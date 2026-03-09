# GREEN Phase Plan: AHQ-79 Unit Test — AgenticHqConfig

## Context

AHQ-79 RED phase created 6 failing unit tests for a new `AgenticHqConfig` class. The tests fail because the module `src/config/agentic-hq-config.ts` doesn't exist yet. This GREEN phase creates the minimal implementation to make all 6 tests pass.

## Jira Requirements (Numbered)

1. `AgenticHqConfig` is a plain class with instance methods, no constructor params → [Step 2]
2. `getAgenticHqWorkspaceRoot()` reads `AGENTIC_HQ_WORKSPACE_ROOT` env var → [Step 2]
3. `getAgenticHqWorkspaceRoot()` falls back to `git rev-parse --show-toplevel` when env var unset → [Step 2]
4. `getAgenticHqPluginsDir()` returns `getAgenticHqWorkspaceRoot() + '/.agentic-hq/plugins'` → [Step 2]
5. `getCurrentWorkspaceRoot()` returns `git rev-parse --show-toplevel` → [Step 2]
6. `getAgenticHqTempDir()` returns `getCurrentWorkspaceRoot() + '/.agentic-hq/temp'` → [Step 2]
7. `getProjectWorkingDir()` returns `getCurrentWorkspaceRoot()` → [Step 2]
8. Unit test command: `pnpm test:unit` → [Step 3: Verification]
9. Changes 1, 3, 4, 5 from the Jira (bin/agentic-hq.cjs, ClaudeCodeTool.ts, demo CLIs, install scripts) → N/A for unit test GREEN phase — those are NOT tested by the unit test, so implementing them would be gold-plating

## Steps

### Step 0: Copy this approved plan to workflow directory
Copy this plan to `docs/jira-docs/AHQ-79/workflow-files/unit-test-files/03-green-phase-implementation-plan-copy.md`

### Step 1: Create directory
Create `src/config/` directory (doesn't exist yet).

### Step 2: Create `src/config/agentic-hq-config.ts`

Minimal implementation — one class, six methods:

```typescript
import { execSync } from 'node:child_process';

export class AgenticHqConfig {
  getAgenticHqWorkspaceRoot(): string {
    const envValue = process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    if (envValue) {
      return envValue;
    }
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  }

  getAgenticHqPluginsDir(): string {
    return `${this.getAgenticHqWorkspaceRoot()}/.agentic-hq/plugins`;
  }

  getCurrentWorkspaceRoot(): string {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  }

  getAgenticHqTempDir(): string {
    return `${this.getCurrentWorkspaceRoot()}/.agentic-hq/temp`;
  }

  getProjectWorkingDir(): string {
    return this.getCurrentWorkspaceRoot();
  }
}
```

That's it. No extra features, no changes to other files, no CLI work — only what the test requires.

### Step 3: Verification
1. Run `pnpm test:unit` — all 6 new tests + 3 existing tests should pass (9 total)
2. Run `pnpm typecheck` — no type errors

### Step 4: Document and wrap up
- Create GREEN phase summary document
- Add Jira comment
- Write command output
- Come back and re-read the command file for testing and documenting instructions (Steps 7-12)
