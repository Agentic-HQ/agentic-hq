# Implementation Plan: AHQ-32 Documentation

**Jira**: [AHQ-32](https://agentic-hq.atlassian.net/browse/AHQ-32)
**Goal**: Create documentation so the project could be released today

---

## Summary

This Jira requires creating/updating documentation files:
1. **README.md** - Already drafted, needs links fixed in "Further Documentation"
2. **docs/roadmap.md** - New file describing planned features
3. **docs/dev/how-agentic-hq-works.md** - New file explaining the architecture
4. **docs/dev/npm-commands.md** - Improve and expand with ALL scripts from package.json

No tests required - validation is `pnpm validate` passing + manual review.

---

## Step 0: Copy This Plan

After approval, copy this plan to:
`docs/jira-docs/AHQ-32/workflow-files/implementation-plan.md`

---

## Step 1: Create docs/roadmap.md

Create a new file describing the three planned roadmap items based on research:

### 1.1 Jira Story Workflow Automation

**What it does:** Automates the workflow in `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/`

**Key points to document:**
- Currently 5 manual commands: 01-read-and-question → 02-write-failing-test → 03-minimal-implementation → 04a/04b-refactor → 05-validate
- Plan: Orchestrator that detects test types in Jira and loops automatically
- Test order: **unit → integration → smoke → e2e** (each with full RED → GREEN → REFACTOR → VERIFY)

### 1.2 Command Fragments Compilation

**What it does:** Build commands from reusable fragments to eliminate duplication

**Key points to document:**
- Based on spike-02 (partially completed)
- VSCode MPE extension used for expandable prompt fragment viewer
- Goal: Reduce duplication across workflow commands
- Status: Conditional compilation started but not completed

### 1.3 Resumable Workflows (Temporal)

**What it does:** Allow long-running workflows to resume after crashes/failures

**Key points to document:**
- Camunda abandoned (hard to code, BPMN/XML learning curve)
- Temporal planned as replacement (workflows are real TypeScript code)
- Provides deterministic replay for exact logical continuation
- **IMPORTANT caveat:** Won't implement until real "latent demand" exists

---

## Step 2: Create docs/dev/how-agentic-hq-works.md

Create a new file explaining how Agentic HQ works:

### 2.1 Core Mechanism: ClaudeCodeTool

Document the file-based I/O pattern from `src/tools/claude-code/ClaudeCodeTool.ts`:
1. Caller provides slash command + input string
2. Tool writes input to `command-input.json` in temp directory
3. Tool spawns Claude CLI via PTY (pseudo-terminal)
4. Claude reads input, processes, writes to `command-output.json`
5. Tool reads output and returns result

### 2.2 Why PTY?

- Claude CLI produces zero output with piped stdio
- PTY makes `isatty()` return true, enabling full output

### 2.3 Custom Commands

- Markdown files in `.claude/commands/`
- Claude executes these as instructions
- Can be chained together via ClaudeCodeTool

### 2.4 Example: Math Workflow Demo

Reference `src/demo/cli/math-workflow-demo-cli.ts`:
- Input → times-two → plus-three → div-five → output
- Shows chaining pattern: output of one command becomes input to next

---

## Step 3: Improve docs/dev/npm-commands.md

Expand the existing file to document ALL scripts from package.json, organized by category with explanations:

### Sections to include:

#### 3.1 Validation (Pre-Commit Quality Gate)
- `pnpm validate` - Run all checks: typecheck + lint + format + unit tests (REQUIRED before commits)
- `pnpm validate:all` - Run ALL checks including smoke and integration tests
- `pnpm typecheck` - TypeScript type checking only (`tsc --noEmit`)

#### 3.2 Linting (ESLint)
- `pnpm lint:check` - Read-only check - always safe to run
- `pnpm lint:fix` - Auto-fix linting issues (use carefully - check what it changes first)

#### 3.3 Formatting (Prettier)
- `pnpm format:check` - Read-only check - always safe to run
- `pnpm format:fix` - Auto-fix formatting (use carefully - check what it changes first)

#### 3.4 Demo CLIs
Programs that demonstrate Agentic HQ capabilities:
- `pnpm hello-world` - Simple hello world example
- `pnpm demo:string-reversal` - String reversal demo using Claude Code
- `pnpm demo:math-workflow` - 3-step math workflow (×2 → +3 → ÷5) showing command chaining

#### 3.5 Unit Tests
Fast tests that run in isolation with mocks:
- `pnpm test` - Run ALL unit tests
- `pnpm test:hello-world` - Run only hello-world unit test
- `pnpm test:unit:fake-claude-file-io` - Test ClaudeCodeTool with fake Claude CLI

#### 3.6 Smoke Tests
Quick validation tests that verify basic functionality works:
- `pnpm test:smoke` - Run ALL smoke tests
- `pnpm test:smoke:hello-world` - Run only hello-world smoke test

#### 3.7 Integration Tests
Tests that verify real component interaction:
- `pnpm test:integration` - Run ALL integration tests
- `pnpm test:integration:kill-script` - Test process termination script
- `pnpm test:integration:real-claude-self-termination` - Test Claude self-termination
- `pnpm test:integration:claude-file-io` - Test ClaudeCodeTool with real Claude

#### 3.8 E2E Tests
End-to-end tests that verify complete workflows:
- `pnpm test:e2e` - Run ALL e2e tests
- `pnpm test:e2e:demo-string-reversal` - Test string reversal demo end-to-end
- `pnpm test:e2e:demo-math-workflow` - Test math workflow demo end-to-end

#### 3.9 All Tests Combined
- `pnpm test:all` - Run unit + smoke + integration tests

Add note about watch mode being disabled (causes AI test execution to hang).

---

## Step 4: Update README.md

Fix the "Further Documentation" section to have proper markdown links:

```markdown
## Further Documentation

You can also:
- Read more about [How Agentic HQ Works](docs/dev/how-agentic-hq-works.md)
- Check out the [Roadmap](docs/roadmap.md)
- Refer to the [NPM Commands](docs/dev/npm-commands.md) documentation
```

---

## Step 5: Verify

Run validation to ensure no issues:

```bash
pnpm validate
```

This runs typecheck + lint + tests. All should pass (docs don't affect code).

---

## Step 6: Update Jira

Add comment to Jira indicating documentation is complete.

---

## Files Modified/Created

| Action | File | Description |
|--------|------|-------------|
| Create | `docs/roadmap.md` | Planned features roadmap |
| Create | `docs/dev/how-agentic-hq-works.md` | Architecture explanation |
| Improve | `docs/dev/npm-commands.md` | Full npm scripts documentation |
| Edit | `README.md` | Fix documentation links |
| Create | `docs/jira-docs/AHQ-32/workflow-files/implementation-plan.md` | Copy of this plan |

---

## Verification

- [ ] `pnpm validate` passes
- [ ] README links work (relative paths correct)
- [ ] Roadmap covers all 3 items from Jira
- [ ] How-it-works doc explains core mechanism clearly
- [ ] npm-commands.md includes ALL scripts from package.json
