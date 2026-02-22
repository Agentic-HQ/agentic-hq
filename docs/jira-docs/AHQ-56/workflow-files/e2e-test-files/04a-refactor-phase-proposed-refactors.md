# REFACTOR Analysis: AHQ-56 (e2e test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-22

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Pre-Refactor Test Status

**Command**: `pnpm test:e2e:agentic-hq-cli-string-reversal`
**Result**: PASSING (1 test, 56.2s)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | AI Summary: "We should consider refactoring out this duplication in the REFACTOR stage of our TDD process for this Jira — extracting a shared PTY runner utility that both ClaudeCodeTool and the agentic-hq CLI can use." | Deferred | **Extract shared PTY runner utility** from duplicated code in `agentic-hq-cli.ts:runCommandViaPty()` and `ClaudeCodeTool.ts:runPtyProcess()`. Both contain identical logic: terminal size detection, node-pty spawn, resize handling, stdout streaming, stdin passthrough with isTTY guard, signal cleanup. | This is a **genuine Rule of Three candidate**: the PTY pattern now exists in (1) `ClaudeCodeTool.ts`, (2) `agentic-hq-cli.ts`, and (3) `quick-jira-workflow-demo-cli.ts` also uses ClaudeCodeTool which internally uses it. However, the two actual duplicates are ClaudeCodeTool and agentic-hq-cli — they are structurally very similar but have key differences (ClaudeCodeTool spawns a specific executable with args; agentic-hq-cli spawns `bash -c "<command>"`; ClaudeCodeTool runs from `projectRoot` CWD, agentic-hq-cli from `process.cwd()`). Extracting a shared utility would be a non-trivial structural refactor touching a critical, working system. I'm genuinely unsure if the ROI is there for this Jira. | **Tier 2** |
| P.2 | GREEN phase summary (line 28): "PTY passthrough: Duplicated from ClaudeCodeTool.runPtyProcess() pattern (refactor will extract shared utility)" | Deferred | Same as P.1 — explicitly noted during GREEN that this duplication was deliberate and intended for REFACTOR. | Same opinion as P.1. This was planned, but that doesn't mean it's the right call. | (Merged with P.1) |
| P.3 | GREEN phase implementation plan (line 96): "PTY duplication from ClaudeCodeTool is OK in GREEN - REFACTOR will extract shared utility" | Deferred | Same as P.1 — third mention of the same planned refactor. | Same opinion as P.1. Three documents mention it, which shows it was top-of-mind during GREEN. | (Merged with P.1) |
| P.4 | `agentic-hq-cli.ts` (line 58-59): "NOTE: This duplicates PTY logic from ClaudeCodeTool. REFACTOR phase will extract a shared utility. See AHQ-56." | Deferred | Same as P.1 — code comment explicitly deferring to REFACTOR. | The comment in the code itself is the strongest signal this was planned. | (Merged with P.1) |
| P.5 | `ClaudeCodeTool.ts` (line 75-76): "NOTE: This duplicates the GIT_ROOT_DETECTION_COMMAND pattern from src/demo/cli/quick-jira-workflow-demo-cli.ts — REFACTOR should extract a shared utility." | Deferred | **Extract shared `getProjectRoot()` utility**. `GIT_ROOT_DETECTION_COMMAND` + `getProjectRoot()` pattern exists in: (1) `ClaudeCodeTool.ts:77-81`, (2) `quick-jira-workflow-demo-cli.ts:37,59`, (3) `full-jira-tdd-story-workflow-demo-cli.ts:44,66`. Three duplicates = Rule of Three met. | This one is a **strong candidate**. It's a small, self-contained function (2 lines), duplicated in 3 files, with identical logic. Extracting to a shared module is low-risk and high-clarity. However, the demo CLIs are somewhat legacy/separate from the core — touching them may be out of scope for AHQ-56. | **Tier 2** |
| P.6 | AI Summary Q3 — Human's answer: "Make 'pnpm demo:string-reversal' actually run the full command that the skill tells agentic-hq to run, i.e. 'cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal'" | Deferred | **Update `demo:string-reversal` script** in root `package.json` to run via the new skill-based workflow instead of the old `tsx src/demo/cli/string-reversal-demo-cli.ts`. The human explicitly asked for this during Q&A. | This was an explicit human request. Currently `demo:string-reversal` still points to the old `src/demo/cli/string-reversal-demo-cli.ts`. However, this is arguably a **feature change** (changing what a script does), not a refactor (improving structure without changing behavior). It changes observable behavior. I'd classify this as Tier 2 for human decision since it's borderline refactor vs. feature. | **Tier 2** |
| P.7 | GREEN phase summary (line 37): ".allowExcessArguments(true)" bug fix | Observed | **Review whether `.allowExcessArguments(true)` is still needed.** This was added during GREEN as a bug fix for Commander "too many arguments" error. With `.passThroughOptions()` active, Commander should already handle excess args. The `.allowExcessArguments(true)` might be redundant. | Worth checking — if `.passThroughOptions()` already handles this, the redundant call is dead code. But if removing it breaks things, it's a safety net that costs nothing. Low priority. | **Tier 1** (if redundant, remove dead code) |
| P.8 | Observed from reading `bin/agentic-hq.cjs` | Observed | **`bin/agentic-hq.cjs` catch block uses `error.status` without type checking.** Line 21: `process.exit(error.status \|\| 1)` — `error` is typed `unknown` in strict TypeScript but this is a CJS file so no TS checking. Not a problem now but inconsistent with project standards. | Very minor. This is a CJS file, not TypeScript, so TS strictness doesn't apply. The pattern is standard for CJS Node.js scripts. Skip. | **Skip** (CJS file, standard pattern) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/cli/agentic-hq-cli.ts` | 23 | `'xterm-256color'` | EXTRACTED | `PTY_TERMINAL_TYPE` |
| `src/cli/agentic-hq-cli.ts` | 24 | `80` | EXTRACTED | `DEFAULT_TERMINAL_COLUMNS` |
| `src/cli/agentic-hq-cli.ts` | 25 | `30` | EXTRACTED | `DEFAULT_TERMINAL_ROWS` |
| `src/cli/agentic-hq-cli.ts` | 26 | `0` | EXTRACTED | `EXIT_CODE_SUCCESS` |
| `src/cli/command/workflow-command.ts` | 12 | `'unused input string'` | EXTRACTED | `UNUSED_INPUT_STRING` |
| `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` | 19 | `90_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` | 22 | `'this is a test string'` | EXTRACTED | `TEST_INPUT_STRING` |
| `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` | 23 | `'gnirts tset a si siht'` | EXTRACTED | `EXPECTED_REVERSED_STRING` |
| `bin/agentic-hq.cjs` | 21 | `1` | MAGIC | -> `EXIT_CODE_FAILURE` (but this is CJS, standard pattern — see P.8 Skip) |

> All literal values in TypeScript files are already extracted to named constants. The only remaining magic value (`1` in `bin/agentic-hq.cjs`) is in a CJS file following standard Node.js patterns.

---

## Tier 1: Auto-Approved Refactors

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Remove dead code (if confirmed) | **Check if `.allowExcessArguments(true)` is redundant** with `.passThroughOptions()`. If removing it doesn't break the e2e test, delete it. If it IS needed, add a comment explaining why. | `src/cli/agentic-hq-cli.ts` Line: 37 |
| 1.2 | Remove deferred-to-refactor comment | **Remove the REFACTOR comment** from `runCommandViaPty()` (line 58-59) once a decision is made on P.1 (either do the extraction or accept the duplication and remove the comment). | `src/cli/agentic-hq-cli.ts` Lines: 58-59 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Extract Shared PTY Runner Utility

**Type**: Extract to new file, Remove duplication across files
**Description**: Extract the PTY execution logic (terminal size detection, node-pty spawn, resize handling, stdout streaming, stdin passthrough with isTTY guard, signal cleanup) from both `agentic-hq-cli.ts:runCommandViaPty()` and `ClaudeCodeTool.ts:runPtyProcess()` into a shared utility, e.g. `src/utils/cli/pty-utils.ts`. Both call sites would then delegate to this shared function. This was **explicitly planned** in the AI summary, GREEN phase plan, GREEN phase summary, and the code comment itself — all four said "REFACTOR will extract shared utility".
**AI Recommendation**: **UNSURE**. Pros: The duplication is real (~60 lines of near-identical PTY code). It was planned from the start. If a third caller ever needs PTY, they'd copy-paste again. Cons: The two call sites have subtle differences (ClaudeCodeTool spawns a specific executable with `fullArgs`, uses `projectRoot` as CWD, adds `--plugin-dir` args; agentic-hq-cli spawns `bash -c "<command>"`, uses `process.cwd()`). Abstracting would need a config object to handle these differences. Also, ClaudeCodeTool is a critical, heavily-tested system — changing it carries risk. And we only have 2 callers, not 3 (Rule of Three not strictly met for the PTY code itself).
**Risk**: Medium. Touching `ClaudeCodeTool.runPtyProcess()` affects all existing tests (unit, smoke, integration, e2e). The abstraction would need to be flexible enough to handle both use cases without becoming overly generic. Could easily become gold-plating if we design for hypothetical future callers.
**Files affected**: `src/cli/agentic-hq-cli.ts`, `src/tools/claude-code/ClaudeCodeTool.ts`, new `src/utils/cli/pty-utils.ts`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): __ *Definitely* time to refactor this into shared code - the agentic-hq CLI wraps the plugin typescript program, which then wraps the "claude" cli - so it's the same thing (identical) at two different levels in the program.  **everything** we want to happen in one we will want to happen in the other, including future fixes or improvements, so it's key they use the same code_____________

---

### Refactor 2.2: Extract Shared `getProjectRoot()` Utility

**Type**: Extract to new file, Remove duplication across files
**Description**: Extract the `GIT_ROOT_DETECTION_COMMAND` constant and `getProjectRoot()` function from `ClaudeCodeTool.ts` into a shared utility (e.g. `src/utils/git/git-utils.ts`). This exact pattern (2-line function doing `execSync('git rev-parse --show-toplevel').trim()`) is duplicated in 3 files: `ClaudeCodeTool.ts:77-81`, `quick-jira-workflow-demo-cli.ts:37,59`, `full-jira-tdd-story-workflow-demo-cli.ts:44,66`. The comment in `ClaudeCodeTool.ts` line 75-76 explicitly calls this out for refactoring.
**AI Recommendation**: **RECOMMEND**. Rule of Three is clearly met (3 duplicates). The function is tiny and self-contained (no complex abstraction needed). Low risk — just replace inline code with an import. The only concern is that the demo CLIs (`quick-jira-workflow-demo-cli.ts`, `full-jira-tdd-story-workflow-demo-cli.ts`) are somewhat separate from the core system, so touching them may be out of scope for AHQ-56.
**Risk**: Low. The function signature is identical in all 3 locations. No behavioral change. Demo CLIs have their own e2e tests that would catch any breakage.
**Files affected**: `src/tools/claude-code/ClaudeCodeTool.ts`, `src/demo/cli/quick-jira-workflow-demo-cli.ts`, `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`, new `src/utils/git/git-utils.ts`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Update `demo:string-reversal` Script to Use New Workflow

**Type**: Script redirect / Feature change
**Description**: Update the `demo:string-reversal` script in root `package.json` from `tsx src/demo/cli/string-reversal-demo-cli.ts` to instead run the full command that the skill tells agentic-hq to run: `cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal`. This was explicitly requested by the human during Q3 of the AI summary discussion. The existing e2e test `test:e2e:demo-string-reversal` would then test the new path.
**AI Recommendation**: **UNSURE**. The human explicitly asked for this in the Q&A, which is a strong signal. However, this is arguably a **behavior change** (the script does something different), not a structural refactor. It also raises the question: should we delete the old `src/demo/cli/string-reversal-demo-cli.ts` if nothing uses it anymore? And the existing e2e test `demo-string-reversal-cli-reverses-string.e2e.test.ts` might need updating. This could cascade.
**Risk**: Medium. Changes observable behavior of `pnpm demo:string-reversal`. May break `test:e2e:demo-string-reversal` if it depends on the old output format. Could leave orphaned file `src/demo/cli/string-reversal-demo-cli.ts`.
**Files affected**: `package.json`, possibly `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts`, possibly `src/demo/cli/string-reversal-demo-cli.ts` (deletion)

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): ____Approved with modifications: 
- delete the old `src/demo/cli/string-reversal-demo-cli.ts`
- delete old demo:string-reversal
- create new demo:plugin-direct:string-reversal - which we know (because it's "direct") that it runs the plugin demo "directly"
- create new demo:agentic-hq-cli:string-reversal - which calls the exact same thing the tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts calls (see above - we are refactoring this test to call "node bin/agentic-hq.cjs" directly because we don't want to rely on having agentic-hq binary on the PATH.  Add a comment to the package.json to make this clear )
- find and delete "demo" entry that runs the old "src/demo/cli/string-reversal-demo-cli.ts"
- find and delete test that tests the old "src/demo/cli/string-reversal-demo-cli.ts"
- find and delete the "test" calls that runs the old "src/demo/cli/string-reversal-demo-cli.ts"
- Summary: old stuff removed/deleted - new calls should call the new plugin version at **3** different levels: (1) e2e test (2) agentic-hq cli (3) direct plugin run

___________

---

### Refactor 2.4: Remove Global `npm link` Dependency — Make E2E Test Self-Contained

**Type**: Fix broken developer experience, Remove undocumented global side effect
**Description**: The E2E test currently runs `agentic-hq` and relies on it being on the system PATH via a manual `npm link` that the GREEN phase AI agent ran without asking. This means: (1) any developer who clones the repo and runs `pnpm test:e2e:agentic-hq-cli-string-reversal` will get a failure (`command not found` or wrong output from the npmjs.org placeholder), (2) the global `npm link` is an undocumented side effect living outside the project directory. **Fix**: Change the test to call `node bin/agentic-hq.cjs` directly (Perplexity-recommended best practice for CLI E2E testing — self-contained, no global installation needed). Then run `npm unlink -g agentic-hq` to clean up the global side effect, since it's no longer needed.
**AI Recommendation**: **STRONGLY RECOMMEND**. This is the most important refactor in this list. Without it, the test is not reproducible for any other developer. Perplexity confirms this is standard practice — well-known CLI projects test by invoking the entry point directly, not by relying on global PATH installation. The `npm link` was a workaround that should never have been done silently.
**Risk**: Low. The test change is a one-line path substitution. `npm unlink -g` cleanly reverses the global side effect. No behavioral change to the CLI itself.
**Files affected**: `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` (change command), cleanup step: `npm unlink -g agentic-hq`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

### Refactor H.1: Replace `shellEscape()` with Array-Based Arg Passing

**Type**: Robustness improvement
**Description**: The `shellEscape()` function in `workflow-command.ts` wraps passthrough args in single quotes with the `'\''` technique to survive re-interpretation by bash when the command runs via `bash -c "<command>"`. The human raised the concern that this might only work for the current test case and could break with different types of args (single quotes, double quotes, special characters, etc.).
**AI Recommendation**: **NOT RECOMMENDED (REJECT)**. After investigation and Perplexity research, the current `shellEscape()` implementation is the **industry-standard POSIX technique** — the same principle used by Python's `shlex.quote()` and Ruby's `Shellwords.escape()`. It correctly handles all edge cases: spaces, double quotes, single quotes (via `'\''`), `$variables`, backticks, glob characters (`*`, `?`), and newlines. No known failure cases exist for literal string escaping with this technique. Perplexity noted the ideal approach would be passing args as a separate array (bypassing shell parsing entirely), but this is not possible in our case because the PTY necessarily runs `bash -c "<full command string>"` — so shell escaping is the correct and only approach. The current code is robust, not a fragile hack.
**Decision**: **REJECT** — no change needed. The fix is sound and industry-standard. Documented here so the reasoning is preserved.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 2 |
| Tier 2 AI-Identified (Pending review) | 4 |
| **Total identified by AI** | 6 |

---

## Agreed Refactors Discussion Notes

### Refactor 2.1: Extract Shared PTY Runner Utility
**Decision**: EXECUTE
**Summary**: AI was genuinely UNSURE due to subtle differences between the two PTY implementations (different executables, different CWDs, different arg construction). Human approved with strong reasoning: the agentic-hq CLI wraps the plugin TS code, which wraps the `claude` CLI — PTY behavior at both levels must be identical, and any future fix/improvement must apply at both levels. Shared code enforces this. No modifications to original proposal. Target file: `src/utils/cli/pty-utils.ts`.

### Refactor 2.3: Update `demo:string-reversal` Script to Use New Workflow
**Decision**: EXECUTE (modified)
**Summary**: AI flagged this as borderline refactor vs. feature change. Human approved with significant modifications expanding the scope beyond what was originally proposed. The original proposal was simply to redirect the `demo:string-reversal` script. The human's modifications create a clean 3-level demo architecture and delete all old superseded code from AHQ-25.

**Agreed modifications:**
1. **Delete** `src/demo/cli/string-reversal-demo-cli.ts` (old standalone demo CLI from AHQ-25)
2. **Delete** old `demo:string-reversal` script from root `package.json`
3. **Delete** old test `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts`
4. **Delete** old test script `test:e2e:demo-string-reversal` from root `package.json`
5. **Delete** the E2E test comment line in package.json that references old test
6. **Create** `demo:plugin-direct:string-reversal` — runs the plugin demo directly (`cd .agentic-hq/plugins/.../ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal`). Hard-codes a default string but allows override.
7. **Create** `demo:agentic-hq-cli:string-reversal` — calls `node bin/agentic-hq.cjs` with the same args as the e2e test. Hard-codes a default string but allows override. Add a comment to `package.json` explaining why `node bin/agentic-hq.cjs` is used (self-contained, no global PATH dependency).
8. **Update** `README.md` to reflect the new demo scripts

**3 levels of access (from highest to lowest):**
1. E2E test (`pnpm test:e2e:agentic-hq-cli-string-reversal`) — automated verification
2. `pnpm demo:agentic-hq-cli:string-reversal` — full CLI experience via `node bin/agentic-hq.cjs`
3. `pnpm demo:plugin-direct:string-reversal` — direct plugin run, bypassing agentic-hq CLI

**Discussion Q&A:**
- Demo scripts: hard-code default string but allow override (human's preference)
- Old AHQ-25 docs: no need to check/update — they're historical records
- README.md: yes, update as part of this refactor

### Refactor H.1: Replace `shellEscape()` with Array-Based Arg Passing
**Decision**: SKIP
**Summary**: Pre-rejected by AI with detailed reasoning. The current `shellEscape()` uses the industry-standard POSIX single-quote technique (same as Python's `shlex.quote()`). Perplexity confirmed it handles all edge cases. Array-based arg passing would bypass shell parsing entirely but is not possible because PTY runs `bash -c "<command>"`. Human agreed with rejection. Documented here so reasoning is preserved.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Check if `.allowExcessArguments(true)` is redundant with `.passThroughOptions()` — remove if so, add comment if needed | EXECUTE | Auto-approved |
| 1.2 | AI (Tier 1) | Remove REFACTOR comment from `runCommandViaPty()` (lines 58-59) after PTY extraction is done | EXECUTE | Auto-approved, depends on 2.1 |
| 2.1 | AI | Extract shared PTY runner utility to `src/utils/cli/pty-utils.ts` from `agentic-hq-cli.ts` and `ClaudeCodeTool.ts` | EXECUTE | Human: "Definitely time to refactor this" — see discussion notes |
| 2.2 | AI | Extract shared `getProjectRoot()` to `src/utils/git/git-utils.ts` from 3 files | EXECUTE | Approved by human, no modifications |
| 2.3 | AI | Update demo:string-reversal — delete old CLI/test/scripts, create 2 new demo scripts, update README | EXECUTE (modified) | Significant human modifications — see discussion notes for full details |
| 2.4 | AI | Remove global `npm link` dependency — change e2e test to use `node bin/agentic-hq.cjs` directly, run `npm unlink -g agentic-hq` | EXECUTE | Approved by human, no modifications |
| H.1 | Human | Replace `shellEscape()` with array-based arg passing | SKIP | Pre-rejected — industry-standard POSIX technique, see discussion notes |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-02-22.
