# Plan: Replace detectGitRoot() Free Function with Injected GitWorkspace Object

## Context

We just completed the directory-functions.ts elimination (all 5 tasks closed). But `detectGitRoot()` in `src/workspace/git-root-detector.ts` is a free function that calls `execSync('git rev-parse')` — the same hidden side-effect pattern we eliminated. It's called inside `DefaultAgenticHqInstallation` and `DefaultUserProjectWorkspace` constructors, so those "clean" concrete classes still have a hidden dependency.

The fix: a `GitWorkspace` interface (domain noun, not `-er`/`-or` anti-pattern) representing the git workspace, with a `DefaultGitWorkspace` concrete class that does the detection. Created once at the Composition Root, injected into both workspace classes.

**Why `GitWorkspace` not `GitRootDetector`**: Perplexity + DDD experts confirm `-er`/`-or` suffixes are anti-patterns — they describe what a class *does* (procedural) rather than what it *represents* (domain). `GitWorkspace` represents "the git workspace", extensible later with `getStatus()`, `getVersion()`, `getBranch()`, etc.

## The New Interface + Class

```typescript
// src/interfaces/git-workspace.ts
export interface GitWorkspace {
  getRoot(): string;
}

// src/workspace/not-in-git-workspace-error.ts
export class NotInGitWorkspaceError extends Error {
  constructor() {
    super(
      'Not in a git repository.\n\n' +
      'Agentic HQ must be run from within a git workspace.\n' +
      'Please cd into a git repository and try again, or run `git init` to create one.'
    );
    this.name = 'NotInGitWorkspaceError';
  }
}

// src/workspace/default-git-workspace.ts — eager, frozen, consistent with other workspace classes
export class DefaultGitWorkspace implements GitWorkspace {
  private readonly root: string;
  constructor() {
    try {
      this.root = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch {
      throw new NotInGitWorkspaceError();
    }
    Object.freeze(this);
  }
  getRoot(): string {
    return this.root;
  }
}
```

## Non-git directory handling

`DefaultGitWorkspace` follows the same pattern as the other workspace classes: **eager resolution in constructor, then frozen**. No lazy caching, no hidden side effects inside methods.

- **In a git repo**: Constructor succeeds, `getRoot()` returns the resolved root. Normal operation.
- **Not in a git repo**: Constructor throws `fatal: not a git repository` — **fail-fast** with a clear error message.
- This is correct: agentic-hq is a git-based tool. Running outside a git workspace without explicit paths is an error that should surface immediately, not be hidden.

## What Changes

| File | Before | After |
|---|---|---|
| `default-agentic-hq-installation.ts` | `constructor(root?: string)`, calls `detectGitRoot()` | `constructor(gitWorkspace: GitWorkspace, root?: string)`, uses `gitWorkspace.getRoot()` |
| `default-user-project-workspace.ts` | `constructor(root?: string)`, calls `detectGitRoot()` | `constructor(gitWorkspace: GitWorkspace, root?: string)`, uses `gitWorkspace.getRoot()` |
| `microkernel-loader.ts` | `new DefaultAgenticHqInstallation()` | `const gitWorkspace = new DefaultGitWorkspace(); new DefaultAgenticHqInstallation(gitWorkspace)` |
| Unit tests for workspace classes | `vi.mock('git-root-detector.js')` | Inject `{ getRoot: () => '/mock/root' }` — no more module mocking |
| Integration/e2e tests | `new DefaultUserProjectWorkspace()` | `new DefaultUserProjectWorkspace(new DefaultGitWorkspace())` |
| `src/workspace/git-root-detector.ts` | Exists (free function) | **Deleted** |

## Wiring in loadRuntime()

```
loadRuntime(options?):
  gitWorkspace = new DefaultGitWorkspace()                   // <-- NEW: created once
  installation = options?.installation ?? new DefaultAgenticHqInstallation(gitWorkspace)
  workspace    = options?.workspace ?? new DefaultUserProjectWorkspace(gitWorkspace)
  // ... rest unchanged ...
```

`GitWorkspace` is NOT in `LoadRuntimeOptions` — it's an internal detail. When callers pass their own `installation`/`workspace`, `gitWorkspace` is never created.

## Task Breakdown (2 tasks)

### Task 1: Create GitWorkspace interface + DefaultGitWorkspace class (additive, nothing breaks)

**Create:**
- `src/interfaces/git-workspace.ts` — `interface GitWorkspace { getRoot(): string }`
- `src/workspace/not-in-git-workspace-error.ts` — `NotInGitWorkspaceError extends Error` with clear multi-line message explaining the problem and how to fix it
- `src/workspace/default-git-workspace.ts` — `DefaultGitWorkspace` with eager `execSync` in constructor, catches failure and throws `NotInGitWorkspaceError`, `Object.freeze(this)`, `getRoot()` returns stored root
- `tests/unit/workspace/default-git-workspace.unit.test.ts` — tests: `getRoot()` returns non-empty string, object is frozen, throws `NotInGitWorkspaceError` when not in a git repo (mock `execSync` to simulate)
- `src/interfaces/index.ts` — add `GitWorkspace` barrel export

**TDD:** Write test first, verify RED, implement, verify GREEN, refactor, verify.

**Done:** New interface + class exist, tested, `pnpm validate` passes, nothing else changed.

### Task 2: Inject GitWorkspace into workspace classes, update callers, delete git-root-detector.ts

**Modify constructors:**
- `default-agentic-hq-installation.ts` — `constructor(gitWorkspace: GitWorkspace, root?: string)`, use `gitWorkspace.getRoot()` as fallback, remove `detectGitRoot` import
- `default-user-project-workspace.ts` — `constructor(gitWorkspace: GitWorkspace, root?: string)`, use `gitWorkspace.getRoot()` as fallback, remove `detectGitRoot` import

**Update composition root:**
- `microkernel-loader.ts` — `const gitWorkspace = new DefaultGitWorkspace()`, pass to both constructors

**Update unit tests (inject mock, remove vi.mock):**
- `default-agentic-hq-installation.unit.test.ts` — `const mockGitWorkspace: GitWorkspace = { getRoot: () => '/detected/git/root' }`, pass as first arg
- `default-user-project-workspace.unit.test.ts` — same pattern

**Update integration/e2e tests (pass real DefaultGitWorkspace):**
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`
- `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`
- `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`
- `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`

**Delete:**
- `src/workspace/git-root-detector.ts`

**Verify:**
- `pnpm validate` passes
- Grep: zero imports of `git-root-detector` anywhere
- Grep: `execSync.*git rev-parse` only in `src/workspace/default-git-workspace.ts`
- No `vi.mock('git-root-detector')` anywhere
- `npx tsx src/cli/agentic-hq-cli.ts list` works end-to-end
