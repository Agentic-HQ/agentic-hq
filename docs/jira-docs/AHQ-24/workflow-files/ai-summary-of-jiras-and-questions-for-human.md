# AI Summary: AHQ-24

**Jira**: [AHQ-24](https://agentic-hq.atlassian.net/browse/AHQ-24)
**Title**: Real Claude Code Executes Simple Math Command
**Status**: Transitioned to In Progress
**Generated**: 2026-01-25

---

## My Understanding of This Task

This is a stepping-stone Jira between AHQ-21 (kill script test with fake Claude) and AHQ-8 (full self-terminating Claude Code). The goal is to verify we can spawn the **real** Claude Code CLI via PTY and get a response - proving the basic plumbing works before adding self-termination complexity.

The test chain is: `test code → ClaudeCodeTool.execute() → node-pty → claude CLI`. We send Claude a simple math prompt ("What is 123 * 321? Reply with just the number.") and verify the output contains "39483". Since Claude won't naturally exit after answering a simple question, the test waits up to 30 seconds, terminates Claude, and checks if the answer appeared in the output.

The implementation should be **minimal** - no logging infrastructure, no complex parsing, no timeout handling beyond the test itself. The Jira explicitly states this is simpler than the spike code, stripping out everything that isn't essential to prove "we can call Claude and get output back".

Key constraint: Must use PTY (node-pty) because regular `spawn()` with piped stdio causes Claude CLI to produce zero output - PTY creates a real pseudo-terminal that Claude recognizes.

---

## Research Findings

No additional research was needed. The spike code at `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/src/ClaudeCodeTool.ts` and the existing AHQ-21 integration test provide clear patterns to follow.

---

## Questions for Human

I checked the Jira description, parent Jira (AHQ-8), Epic (AHQ-1), and reviewed the spike code. The following items are genuinely not specified:

### Question 1: Test command script name typo?

The Jira specifies:
- Test command: `pnpm test:integration:claude-maths` (British spelling)
- Test file: `claude-executes-maths-command.integration.test.ts` (British spelling)

This differs from the existing pattern:
- Existing: `pnpm test:integration:kill-script`

Do you want me to use the British "maths" spelling as written, or should I use American "math" to be consistent with typical programming conventions?

**Human's Response**:
> I'm fine keep it as "math" to make you happy (seeing as you are American). ;-)
> I've updated the Jira description to use "math" at https://agentic-hq.atlassian.net/browse/AHQ-24

---

### Question 2: Directory structure for ClaudeCodeTool

The Jira says to create `src/tools/claude-code/ClaudeCodeTool.ts`. This would be a new directory structure - there's currently no `src/tools/` directory (only `src/misc/` exists with hello-world files).

Should I:
1. Create `src/tools/claude-code/ClaudeCodeTool.ts` exactly as specified
2. Use a different structure (e.g., `src/claude-code-tool/ClaudeCodeTool.ts`)

The spike uses a much deeper nested path: `project/components/tool/claude/claude-code-tool/src/ClaudeCodeTool.ts` - but that's spike-specific organization.

**Human's Response**:
> I've learnt that we should add complexity / genericness once it is "earned" - so we'll stick to src/tools/claude-code/ClaudeCodeTool.ts (i.e. component path is simply: tools/claude-code) please.

---

### Question 3: Should ClaudeCodeTool have an `execute()` method or `spawnProcess()` method?

The Jira acceptance test says: "calls `ClaudeCodeTool.execute()`"

But the spike implementation uses `spawnProcess(commandString, context?, logFilePath?)`.

For this minimal implementation, should I:
1. Create a simple `execute(prompt: string): Promise<string>` method that just returns the output
2. Match the spike's `spawnProcess()` signature for future compatibility

Option 1 is simpler and matches the Jira wording. Option 2 would make future integration with AHQ-8 easier.

**Human's Response**:
> I'm happy with execute.

---

## Files I Reviewed

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/src/ClaudeCodeTool.ts` - The spike implementation showing the full-featured version with logging, timeout, OutcomeID parsing. Important insight: why PTY is required (regular spawn produces zero output from Claude CLI).

- `tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts` - The existing integration test pattern for AHQ-21, showing how to structure a PTY-based integration test with timeouts and output capture.

- `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts` - Shows the fixture pattern for PTY testing, though this Jira won't need a fixture (we're calling real Claude directly).

- `vitest.integration.config.ts` - The integration test configuration, already set up with the correct pool settings for node-pty compatibility.

- `package.json` - The existing npm scripts pattern, showing where to add the new `test:integration:claude-maths` script.

**Most important findings:**
1. PTY is essential - Claude CLI produces zero output with regular spawn()
2. Test pattern from AHQ-21 can be adapted (spawn via PTY, capture output, timeout, assert)
3. Integration test config already handles node-pty's Vitest compatibility requirements
4. The implementation should be much simpler than the spike - no logging, no OutcomeID parsing, no complex error types

---

## Ready for Next Step

Once you've read this file and answered the questions and completed your discussion with me about the Jira, please run the next command (in this session so context is retained):
```
/agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test AHQ-24 integration
```
