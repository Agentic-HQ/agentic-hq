# GREEN Phase Implementation Plan: AHQ-10 (e2e test)

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Phase**: GREEN (Minimal Implementation)
**Goal**: Make the failing E2E test pass with minimum code

---

## Jira Requirements (Numbered)

| # | Requirement | Plan Section |
|---|-------------|--------------|
| 1 | CLI location: `src/demo/cli/math-workflow-demo-cli.ts` | → Step 2 |
| 2 | pnpm command: `demo:math-workflow` | → Step 1 |
| 3 | CLI takes `--input-number=<number>` argument | → Step 2 |
| 4 | Uses Commander library (per existing pattern) | → Step 2 |
| 5 | Math workflow: Input → ×2 → +3 → ÷5 → Output | → Steps 2, 3, 4, 5 |
| 6 | Three Claude commands: `times-two`, `plus-three`, `div-five` | → Steps 3, 4, 5 |
| 7 | Command location: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/` | → Steps 3, 4, 5 |
| 8 | Commands read `command-input.json`, write `command-output.json` | → Steps 3, 4, 5 |
| 9 | Commands self-terminate via kill script | → Steps 3, 4, 5 |
| 10 | Output format: "Output number: X" | → Step 2 |
| 11 | E2E test: `pnpm test:e2e:demo-math-workflow` | → Step 6 (verification) |
| 12 | Test expects input=11, output="Output number: 5" | → Step 6 (verification) |
| 13 | 90 second timeout (30s per Claude invocation) | → N/A (test already has this) |

---

## Implementation Steps

### Step 1: Add pnpm script to package.json

**File**: `package.json`

Add script:
```json
"demo:math-workflow": "tsx src/demo/cli/math-workflow-demo-cli.ts"
```

### Step 2: Create the CLI file

**File**: `src/demo/cli/math-workflow-demo-cli.ts`

Pattern follows `string-reversal-demo-cli.ts`:
- Uses Commander for CLI argument parsing
- Takes `--input-number` required option
- Creates ClaudeCodeTool instance
- Calls `execute()` three times sequentially:
  1. `/agentic-hq-commands:used-in-demos:math-workflow:times-two` with input number
  2. `/agentic-hq-commands:used-in-demos:math-workflow:plus-three` with step1 result
  3. `/agentic-hq-commands:used-in-demos:math-workflow:div-five` with step2 result
- Prints: `Output number: ${finalResult}`

### Step 3: Create times-two command

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md`

Pattern follows `reverse-a-string.md`:
1. Read `command-input.json` from `$0`
2. Extract `command-input-string` value (a number as string)
3. Multiply by 2
4. Write result to `$0/command-output.json` as `{ "command-output-string": "<result>" }`
5. Self-terminate via kill script

### Step 4: Create plus-three command

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/plus-three.md`

Same pattern as Step 3, but adds 3 to the input number.

### Step 5: Create div-five command

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md`

Same pattern as Step 3, but divides by 5.

---

## Files To Create/Modify

| File | Action |
|------|--------|
| `package.json` | MODIFY - add `demo:math-workflow` script |
| `src/demo/cli/math-workflow-demo-cli.ts` | CREATE - CLI file |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md` | CREATE - Claude command |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/plus-three.md` | CREATE - Claude command |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md` | CREATE - Claude command |

---

## Verification

### Step 6: Run E2E test (expect PASS)

```bash
pnpm test:e2e:demo-math-workflow
```

Expected: Test passes - output contains "Output number: 5"

### Step 7: Run all E2E tests (ensure no regressions)

```bash
pnpm test:e2e
```

Expected: All E2E tests pass

### Step 8: Check for manual acceptance tests

Per Jira AC, there are **no manual tests** for this story - only the automated E2E test.

---

## GREEN Phase Constraints (Reminders)

- **Minimal code only** - just enough to pass the test
- **Hard-coded values OK** - no need for error handling
- **No gold-plating** - no extra features beyond what test checks
- **Copy-paste OK** - duplication is fine, will clean up in REFACTOR

---

## TODO After Step 5

After implementation, return to the command file to follow testing and documentation instructions (Step 7 onwards in the original command).
