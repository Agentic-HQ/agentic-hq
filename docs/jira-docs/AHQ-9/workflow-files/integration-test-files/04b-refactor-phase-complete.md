# REFACTOR Complete: AHQ-9 (integration test)

**Jira**: [AHQ-9](https://agentic-hq.atlassian.net/browse/AHQ-9)
**Test Type**: integration
**Phase**: REFACTOR (Complete)
**Generated**: 2026-01-31T14:10Z

---

## Refactoring Summary

| Category | Proposed | Executed | Skipped | Failed |
|----------|----------|----------|---------|--------|
| Tier 1 (Auto) | 0 | 0 | 0 | 0 |
| Tier 2 (Approved) | 3 | 3 | 0 | 0 |
| Tier 2 (Rejected) | 1 | 0 | 1 | 0 |
| Additional (Human-driven) | 3 | 3 | 0 | 0 |
| **Total** | 7 | 6 | 1 | 0 |

---

## Tier 1 Refactors Executed

> No Tier 1 refactors were identified - code was already clean.

---

## Tier 2 Refactors

### Approved and Executed

| # | Title | Result |
|---|-------|--------|
| 2.1 | Delete ExecuteHandle interface | ✅ Success |
| 2.2 | Delete math command test | ✅ Success |
| 2.4 | Remove isRealClaude branching | ✅ Success |

### Rejected by Human

| # | Title | Reason |
|---|-------|--------|
| 2.3 | Extract PTY helper | Gold-plating - Rule of Three not satisfied |

---

## Additional Refactors (Human-Driven During Session)

The human identified further simplification opportunities during the refactor session:

| # | Title | Description | Result |
|---|-------|-------------|--------|
| A.1 | Remove output accumulation | Changed `executeWithPty()` to return `Promise<void>` instead of accumulating unbounded output in memory | ✅ Success |
| A.2 | Unify execute methods | Merged `executeWithFileIO()` and `executeWithPty()` into single `execute()` method with conditional file I/O | ✅ Success |
| A.3 | Extract file I/O helpers | Created `createInputFile()` and `readOutputFile()` private methods for cleaner code | ✅ Success |

---

## Post-Refactor Test Status

**Unit Tests**: `pnpm test`
**Result**: ✅ PASSING (2 tests)

**Integration Tests**: `pnpm test:integration`
**Result**: ✅ PASSING (3 tests)
- kill-script-terminates-cli-process
- real-claude-self-termination
- claude-executes-command-using-file-io

**Full Validation**: `pnpm validate`
**Result**: ✅ PASSING (typecheck + lint + format + tests)

---

## Code Changes Made

### ClaudeCodeTool.ts - BEFORE (162 lines)

```
- ExecuteHandle interface (with .finished and .kill())
- execute() with complex overloading returning ExecuteHandle | Promise<string>
- executeWithFileIO() - 78 lines with PTY logic
- executeWithPty() - 38 lines duplicating PTY logic
- Output accumulation in memory (unbounded growth)
- Hardcoded 'claude' in executeWithPty (didn't use this.cliExecutable)
```

### ClaudeCodeTool.ts - AFTER (117 lines)

```typescript
export class ClaudeCodeTool {
  private readonly cliExecutable: string;

  constructor(options?: ClaudeCodeToolOptions) { ... }

  // Clean overloads - both return promises, no ExecuteHandle
  execute(command: string, commandInput: string): Promise<string>;
  execute(prompt: string): Promise<void>;

  // Single unified implementation
  async execute(commandOrPrompt: string, commandInput?: string): Promise<string | void> {
    const [executable, ...baseArgs] = this.cliExecutable.split(' ');

    // 1. Optional: set up file I/O
    const tempDir = commandInput !== undefined ? this.createInputFile(commandInput) : undefined;

    // 2. Build prompt (append tempDir if file I/O)
    const prompt = tempDir ? `${commandOrPrompt} ${tempDir}` : commandOrPrompt;

    // 3. Run PTY (single implementation, no duplication)
    const ptyProcess = spawnPty(executable, [...baseArgs, prompt], { ... });
    ptyProcess.onData((data) => process.stdout.write(data));
    await new Promise<void>((resolve) => { ptyProcess.onExit(() => resolve()); });

    // 4. Optional: read and return output
    if (tempDir) {
      return this.readOutputFile(tempDir);
    }
  }

  private createInputFile(commandInput: string): string { ... }
  private readOutputFile(tempDir: string): string { ... }
}
```

### Files Modified:
- `src/tools/claude-code/ClaudeCodeTool.ts` - Massively simplified (162 → 117 lines, -28%)
- `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts` - Removed output assertion
- `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` - Added ARGV parsing comment
- `package.json` - Removed `test:integration:claude-math` script

### Files Deleted:
- `tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts` - Superseded by file I/O test

---

## Key Improvements

### 1. Eliminated Memory Leak Risk
**Before**: `executeWithPty()` accumulated ALL output in a string buffer - unbounded memory growth for long sessions.
**After**: Output streams directly to stdout, no accumulation.

### 2. Single Execution Path
**Before**: Two separate methods (`executeWithFileIO`, `executeWithPty`) with duplicated PTY logic.
**After**: One `execute()` method with conditional file I/O - DRY principle.

### 3. Consistent CLI Executable Usage
**Before**: `executeWithPty()` hardcoded `'claude'`, ignoring `this.cliExecutable`.
**After**: Both paths use `this.cliExecutable` - tests and production behave identically.

### 4. Cleaner API
**Before**: `execute(prompt)` returned `ExecuteHandle` with `.finished` and `.kill()`.
**After**: `execute(prompt)` returns `Promise<void>` - simple and predictable.

### 5. Removed Test-Specific Production Code
**Before**: `isRealClaude` branching in production code to handle test fixtures differently.
**After**: Production code is test-agnostic; fixture parses args like real Claude.

---

## Ready for VERIFY Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-commands:workflow:jira-story-workflow:05-jira-verify AHQ-9 integration
```
