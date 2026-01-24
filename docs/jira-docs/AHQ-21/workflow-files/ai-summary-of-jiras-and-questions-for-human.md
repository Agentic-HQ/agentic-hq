# AI Summary: AHQ-21

**Jira**: [AHQ-21](https://agentic-hq.atlassian.net/browse/AHQ-21)
**Title**: Create Integration Test for Unix CLI Process Kill Script
**Status**: Transitioned to In Progress
**Generated**: 2026-01-24

---

## My Understanding of This Task

This Jira creates an **integration test** that proves the kill script at `tools/scripts/process-control/unix/kill-current-cli-process.sh` correctly terminates its parent process. This is part of the parent story AHQ-8 (Self Terminating Claude Code) which enables Claude Code to self-terminate after completing commands, returning control to the Agentic HQ Workflow Engine.

The test cannot call the kill script directly (that would kill the test runner!). Instead, we create a **fake CLI fixture** that mimics Claude Code's behavior:

**Fixture: `fake-claude-cli.triggers-kill-script.fixture.ts`** will:
1. Print: `<timestamp> - Hi I'm fake-claude-cli.triggers-kill-script.fixture.ts`
2. Print: `<timestamp> - Calling kill-current-cli-process.sh which should kill me immediately...`
3. Call the kill script with `$PPID` as the argument (shell expands this to parent PID)
4. Print: `<timestamp> - Finished calling kill-current-cli-process.sh If you see this then the kill script didn't work :-(` (should NOT appear if kill works)
5. Enter infinite loop prompting for input (like Claude does when waiting for next command)

**Test: `kill-script-terminates-cli-process.integration.test.ts`** will:
1. Spawn the fixture using **node-pty** (matching production behavior - see Confluence section on why)
2. Wait up to `fakeClaudeKillTimeoutSeconds = 30` seconds
3. If timeout: FAIL with message explaining it shouldn't take that long
4. If finishes before timeout: verify output contains "Hi I'm fake-claude-cli" and does NOT contain "kill script didn't work"
5. **Show full output** from both the fixture AND the kill script to the user (additional acceptance test from human)

**File locations** (per Confluence):
```
tests/
  integration/
    process-control/
      kill-script-terminates-cli-process.integration.test.ts
      fixtures/
        fake-claude-cli.triggers-kill-script.fixture.ts
```

**TDD Process** (per Confluence):
- **RED phase**: Temporarily disable kill script (add early exit), verify test fails with timeout
- **GREEN phase**: Re-enable kill script, verify test passes
- **REFACTOR phase**: Clean up test code
- **VALIDATE phase**: Run `pnpm validate` and `pnpm test:integration`

**Why node-pty**: The Confluence page emphasizes using node-pty in the integration test to keep it "as close as possible to the real implementation we will be using in our real code" when calling Claude Code. This must be noted in a comment in the test with a reference to the Confluence section.

## Research Findings

No external research needed - the Confluence page and existing spike code provide complete technical guidance.

### Key Technical Details from Confluence

1. **The kill script expects `$PPID` to be expanded by the shell** - we should NOT try to calculate or pass the PID from TypeScript; the fixture should invoke the script in a way that allows shell expansion of `$PPID`

2. **The 30 second timeout is intentional** - provides a safe margin while still being reasonable for CI

3. **Assertions rely on exit signal vs exit code and lifecycle markers** - we check for presence/absence of specific output strings

4. **Robust cleanup required** - must avoid orphaned processes in CI

### Existing Kill Script Behavior
The script at `tools/scripts/process-control/unix/kill-current-cli-process.sh`:
- Validates exactly one numeric argument (the PID)
- Checks the process exists
- Uses `kill -INT` (SIGINT) for graceful termination like Ctrl+C
- Is already used successfully in the spike for killing Claude Code

### node-pty in the Project
- `node-pty` is already a dependency in package.json
- The spike shows the pattern: `spawnPty(command, args, { name: 'xterm-256color', ... })`
- The spike's vitest.integration.config.ts uses `pool: 'forks'` to avoid node-pty V8 API crashes

### Perplexity Research: Vitest pool default
Confirmed via Perplexity MCP (2026-01-24):
- **Vitest 2.0+ defaults to `pool: 'forks'`** - no configuration needed
- The Vitest 2.0 migration guide states: "Default Pool is `forks`. Vitest 2.0 changes the default configuration for `pool` to `'forks'` for better stability."
- This was changed from 'threads' to fix node-pty V8 API crashes and `node:worker_threads` issues
- Sources: https://v3.vitest.dev/guide/migration, https://vitest.dev/guide/improving-performance

**Action**: Add a comment in vitest.integration.config.ts explaining that `pool: 'forks'` is the default and is required to avoid the PTY crashing bug documented in `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/tests/README.regarding_PTY_Vitest_Crashing_Bug.md`

## Questions for Human

### Question 1: Vitest pool setting - use 'forks' to avoid node-pty crashes?

The spike's `vitest.integration.config.ts` includes:
```typescript
// NOTE: pool: 'forks' also avoids node-pty V8 API locking crash
pool: 'forks',
```

Since our integration test uses node-pty, should we include `pool: 'forks'` in our new `vitest.integration.config.ts` from the start? The alternative is to try without it and add if we hit crashes.

My recommendation: Include it from the start since we know node-pty is involved and the spike already discovered this issue.

**Human's Response**:
> Please research this with Perplexity MCP first, but I'm pretty sure as we are using Vitest >= 2.0 that "pool: 'forks'" is the default (this was changed to fix this kind of crashing bug).  I found this sentence: "Vitest 2.0+ (released July 2024) defaults to `pool: 'forks'` which fixes this issue completely. No configuration needed." in docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/tests/README.regarding_PTY_Vitest_Crashing_Bug.md (please **don't** read that file - it's massive).  It is is the default, just add a brief comment explaining that "pool: 'forks'" is the default for Vitest in the version we are using and is required to avoid this PTY crashing bug mentioned in docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/tests/README.regarding_PTY_Vitest_Crashing_Bug.md

---

### Question 2: How should the fixture invoke the kill script to get proper $PPID expansion?

The Confluence says: "Call the kill-current-cli-process.sh as a command line script, passing $PPID as the first parameter (IMPORTANT: $PPID will be expanded on the command line as the parent process id, and so we should not set or try to work out this variable in our fake-claude-cli.triggers-kill-script.fixture.ts)"

I see two approaches:
- A) Use `child_process.execSync()` or `spawn()` with a shell command string that includes `$PPID` literally (shell expands it)
- B) Use `child_process.spawn('bash', ['-c', '/path/to/kill-script.sh $PPID'])` to ensure bash expansion

My recommendation: Option B is more explicit about needing shell expansion.

**Human's Response**:
>  I agree. Option B looks best.  Once we have the failing test (RED) and we try this - if we see the test passes we know we've got it right.  It may take a bit of experimentation as I'm not sure what happens when Claude calls /path/to/kill-script.sh $PPID - maybe PPID gets explanded by Claude??? (in which case we'll have to do the same...)

---

## Files I Reviewed

- `tools/scripts/process-control/unix/kill-current-cli-process.sh` - The kill script we're testing. Validates PID argument, checks process exists, uses `kill -INT` for graceful termination.

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/src/ClaudeCodeTool.ts` - Shows node-pty usage pattern with `spawnPty()`, terminal settings, `onData` and `onExit` handlers.

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/vitest.integration.config.ts` - Spike's integration config with `pool: 'forks'` for node-pty compatibility.

- `package.json` - Confirmed `node-pty` is already installed. Need to add `pnpm test:integration` and `pnpm test:integration:kill-script` scripts.

- `vitest.unit.config.ts` and `vitest.smoke.config.ts` - Patterns to follow for the new `vitest.integration.config.ts`.

- Confluence page (10092545) - Comprehensive implementation guidance including fixture behavior, test assertions, file locations, TDD process, and node-pty rationale.

**Most Important Findings:**
1. The Confluence page is comprehensive - file locations, exact behavior, TDD steps are all specified
2. node-pty is required to match production behavior (not just for testing convenience)
3. Vitest 2.0+ defaults to `pool: 'forks'` - no config needed, just add explanatory comment
4. `$PPID` must be shell-expanded using `spawn('bash', ['-c', 'script.sh $PPID'])`
5. **Additional acceptance test**: Test output must show full debug from fixture AND kill script

**Resolved Questions:**
- Q1 (pool setting): Vitest 2.0+ defaults to 'forks' - confirmed via Perplexity. Add comment only.
- Q2 ($PPID expansion): Use Option B - `spawn('bash', ['-c', '...'])` approach

## Ready for Next Step

Once you've read this file and answered the questions and completed your discussion with me about the Jira, please run the next command (in this session so context is retained):
```
/agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test AHQ-21 unit
```
