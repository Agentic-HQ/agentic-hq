# REFACTOR Analysis: AHQ-79 (e2e test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-03-04

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
> So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Missing TSDoc — exported classes and public methods should have `/** ... */` comments

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
> So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Pre-Refactor Test Status

**Command**: `pnpm test:e2e:cross-workspace-string-reversal`
**Result**: PASSING (1 test, 55.93s)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | Unit test refactor analysis (P.1): "git-utils.ts and getProjectRoot() are now superseded by AgenticHqConfig... pick up in e2e phase (Changes 3 & 4 in the Jira)" | Deferred to e2e phase | Deletion of `src/utils/git/git-utils.ts` was deferred from unit test REFACTOR to the e2e phase. | This was **already completed during GREEN phase** of the e2e test — the GREEN phase summary confirms: "git-utils.ts deleted entirely: getProjectRoot() is fully replaced by AgenticHqConfig". Nothing to do here. | Skip — already done |
| P.2 | GREEN Phase Plan (Step 7): "Remove unused constants from ClaudeCodeTool.ts — AGENTIC_HQ_WORKING_DIRECTORY and TEMP_DIRECTORY_NAME may become unused" | Deferred | The GREEN plan noted these constants might become unused after replacing `getProjectRoot()` with Config methods. | Reviewing `ClaudeCodeTool.ts` — these constants are indeed gone. The GREEN phase already removed them. Nothing to do. | Skip — already done |
| P.3 | GREEN Phase Summary: "Smelly warnings everywhere: Per human request, both the install script and the e2e test include prominent warnings about pnpm link --global mutating global state" | Observed | The Jira's "Known Smell" section acknowledges `pnpm link --global` is smelly but pragmatic. The warnings are in place. The install script (lines 20-26) and e2e test (lines 55-76, 80-83) both have prominent warnings. | The warnings are extensive and well-placed. No refactoring needed — the code does exactly what was asked for. | Skip — working as intended |
| P.4 | GREEN Phase Summary: "install script handles PNPM_HOME setup... detects if PNPM_HOME is not set and runs pnpm setup automatically" | Observed | The install script (lines 32-44) has fallback logic for PNPM_HOME detection: grep shell configs, then fallback to `$HOME/Library/pnpm` (macOS-specific). | The `$HOME/Library/pnpm` fallback on line 41 is macOS-specific. This is fine for now since the project is developed on Mac, but worth noting. Not worth refactoring unless cross-platform support becomes a requirement. | Skip — macOS-only project currently |
| P.5 | GREEN Phase Summary: "Test creates .claude/settings.local.json in temp workspace — Without this, Claude prompts 'Do you want to create command-output.json?' and hangs" | Observed | The e2e test (lines 109-120) creates a `.claude/settings.local.json` with hardcoded `permissions` object. This is a workaround for Claude Code's permission system. | This is a pragmatic workaround. The JSON structure is small and straightforward. No refactoring needed. | Skip — working as intended |
| P.6 | AI Summary (Question 2): "Remove entirely. AgenticHqConfig replaces it. The file git-utils.ts will be deleted." + GREEN Phase confirms `git-utils.ts` deleted | Observed | Need to verify no remaining references to the deleted `git-utils.ts` module exist anywhere in the codebase (imports, comments, docs). | Good hygiene check. If any stale references exist, they should be cleaned up. | Tier 1 (if any stale references found) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

### E2E Test File: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `cross-workspace-string-reversal.e2e.test.ts` | 27 | `90_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `cross-workspace-string-reversal.e2e.test.ts` | 28 | `'cross-workspace-string-reversal'` | EXTRACTED | `LOG_FILE_LABEL` |
| `cross-workspace-string-reversal.e2e.test.ts` | 33 | `'cross workspace test'` | EXTRACTED | `TEST_INPUT_STRING` |
| `cross-workspace-string-reversal.e2e.test.ts` | 34 | `'tset ecapskrow ssorc'` | EXTRACTED | `EXPECTED_REVERSED_STRING` |
| `cross-workspace-string-reversal.e2e.test.ts` | 38 | `'/tmp/agentic-hq-test-workspaces'` | EXTRACTED | `TEMP_WORKSPACES_BASE` |
| `cross-workspace-string-reversal.e2e.test.ts` | 89 | `30_000` | MAGIC | -> `INSTALL_SCRIPT_TIMEOUT_MS` |
| `cross-workspace-string-reversal.e2e.test.ts` | 94 | `'Library', 'pnpm'` (path fallback) | MAGIC | -> `PNPM_HOME_MACOS_DEFAULT_SUBPATH` (or inline comment) |
| `cross-workspace-string-reversal.e2e.test.ts` | 113 | `JSON.stringify({ permissions: { allow: ['Write'], deny: [], ask: [] } })` | MAGIC (hardcoded JSON structure) | -> `CLAUDE_SETTINGS_PERMISSIONS_JSON` |

### Install Script: `scripts/infra/install-dev-agentic-hq.sh`

Bash scripts don't typically extract constants the same way, but noted:
| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `install-dev-agentic-hq.sh` | 41 | `$HOME/Library/pnpm` | OK | N/A — Bash scripts use inline values idiomatically; this has a comment explaining the fallback |

### Other Files Modified in This Jira

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `bin/agentic-hq.cjs` | All literals | `path.join(__dirname, '..', ...)` | OK | N/A — idiomatic `__dirname` patterns, already clear |
| `ClaudeCodeTool.ts` | All | N/A | OK | Already well-extracted from unit test REFACTOR |
| `full-jira-tdd-story-workflow-demo-cli.ts` | All | N/A | OK | No new magic constants |
| `quick-jira-workflow-demo-cli.ts` | All | N/A | OK | No new magic constants |

**1 MAGIC entry warrants extraction (the `30_000` timeout). The other two are borderline — see Tier 1 below.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `30_000` (install script timeout) to named constant `INSTALL_SCRIPT_TIMEOUT_MS` | `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` Line: 89 |
| 1.2 | Extract magic constant | Extract the Claude settings permissions JSON structure to a named constant `CLAUDE_SETTINGS_PERMISSIONS` (object) to make the test's intent clearer | `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` Lines: 113-120 |
| 1.3 | ~~Remove stale references~~ | ~~Verify no remaining imports or references to the deleted `git-utils.ts` / `getProjectRoot()` exist in source files.~~ **VERIFIED CLEAN** — grep found zero references in `src/` and `tests/`. Nothing to do. | N/A |
| 1.4 | Add missing TSDoc | Add TSDoc to the `runCliAndLogOutput` function's `workingDirectory` parameter (new parameter added in RED phase but the existing TSDoc `@param` block already covers it — verify it's complete) | `tests/e2e/helpers/cli-test-helper-functions.ts` Line: 47 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Extract `buildVariablesString` to a shared utility

**Type**: Cross-file duplication removal
**Description**: The function `buildVariablesString(jiraId, projectRoot, testType?)` is duplicated identically in both `full-jira-tdd-story-workflow-demo-cli.ts` (line 44) and `quick-jira-workflow-demo-cli.ts` (line 37). Same signature, same body, same JSDoc. Could extract to a shared file like `src/utils/cli/cli-utils.ts` or `src/demo/cli/shared-demo-utils.ts`.
**AI Recommendation**: RECOMMEND — This is textbook duplication across two files with identical code. Both files were modified in this Jira. The function is small but the duplication is exact. A shared utility file named after the domain (e.g., `src/demo/cli/demo-cli-utils.ts`) would be the right home.
**Risk**: Low. The function is trivial and has no dependencies. The only risk is over-modularizing for 2 call sites, but the Rule of Three says "wince at the duplication but do it anyway" for 2. However, both files already exist and this is exact copy-paste — I'd lean toward extracting it.
**Files affected**: `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`, `src/demo/cli/quick-jira-workflow-demo-cli.ts`, new file `src/demo/cli/demo-cli-utils.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _For the moment I'm Thinking that These plugins should be kind of independent from each other and have their own libraries. At some point, I probably want to have shared libraries amongst the plugins, but right now I don't want this embedded into the Core System. I think, as this is a very small function, we'll just leave it as is.

---

### Refactor 2.2: Simplify install script PNPM_HOME detection — replace grep/sed with `source ~/.zshrc`

**Type**: Simplify overly complex code
**Description**: The `if [ -z "$PNPM_HOME" ]` check and the `pnpm setup` call (lines 32-34) are correct and stay as-is. The problem is what comes **after** `pnpm setup` (lines 35-44): fragile grep/sed extraction of `PNPM_HOME` from shell configs, plus a hardcoded macOS fallback. Since `pnpm setup` writes `export PNPM_HOME=...` to `~/.zshrc`, the script can simply `source ~/.zshrc` to pick up the new value. Replaces 8 lines of fragile detection with 1 line: `source ~/.zshrc`.
**AI Recommendation**: RECOMMEND — Identified by the human during review. The current grep/sed approach is fragile (assumes specific shell config file locations and export format) and has a platform-specific fallback. `source ~/.zshrc` is simpler, more robust, and shell-idiomatic.
**Risk**: Low. `source ~/.zshrc` could execute other things in the user's zshrc, but this is standard practice and the script already requires a shell environment.
**Files affected**: `scripts/infra/install-dev-agentic-hq.sh`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Extract the prerequisite warning box and timeout error box to helper functions

**Type**: Duplication removal within file
**Description**: The e2e test has two large `process.stdout.write()` blocks: the prerequisite warning (lines 55-76) and the timeout error (lines 137-159). Both use the same box-drawing pattern (`╔═══...═══╗`). These could be extracted to a helper like `printBoxWarning(title, lines)` in `cli-test-helper-functions.ts`.
**AI Recommendation**: UNSURE — The two boxes serve different purposes (pre-run warning vs post-failure diagnostic) and have different content. The box-drawing pattern is shared but the content is completely different. Extracting a generic "draw a box" helper feels like premature abstraction for 2 uses in one file. But it would make the test's main flow easier to read by moving the large string blocks out of the `it()` body.
**Risk**: Moderate. The helper would need to handle variable-width content, padding, and mixed-length lines. That's more complexity than the current inline approach. The current code is ugly but simple.
**Files affected**: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`, potentially `tests/e2e/helpers/cli-test-helper-functions.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Make `AgenticHqConfig` instantiation in demo CLIs use a shared pattern

**Type**: Potential structural improvement
**Description**: Both demo CLIs (`full-jira-tdd-story-workflow-demo-cli.ts` line 62 and `quick-jira-workflow-demo-cli.ts` line 55) have the identical pattern: `const config = new AgenticHqConfig(); const projectRoot = options.projectRoot ?? config.getCurrentWorkspaceRoot();`. This pattern appeared when `getProjectRoot()` was replaced. Could be part of the `buildVariablesString` extraction (Refactor 2.1) if the "project root resolution" is included in the shared utility.
**AI Recommendation**: NOT RECOMMENDED as a separate refactor — This is really part of Refactor 2.1 if that's approved. If 2.1 is rejected, this is too small to warrant its own extraction. The 2-line pattern is clear and readable.
**Risk**: Over-modularizing. It's 2 lines of code in 2 files. Not worth a separate abstraction.
**Files affected**: `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`, `src/demo/cli/quick-jira-workflow-demo-cli.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

In the Config file the constants aren't good.  In ClaudeCodeTool.ts there were split into individual things like this:

// Directory structure for command I/O
const AGENTIC_HQ_WORKING_DIRECTORY = '.agentic-hq';
const TEMP_DIRECTORY_NAME = 'temp';

which was better than lumping them together like this:

AGENTIC_HQ_TEMP_SUBPATH = '/.agentic-hq/temp'
---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 4 |
| Tier 2 AI-Identified (Pending review) | 4 |
| **Total identified by AI** | 8 |

---

## Agreed Refactors Discussion Notes

### Human-Identified: Split composed subpath constants into individual directory segments in `agentic-hq-config.ts`

**Decision**: EXECUTE
**Summary**: Human identified that `AGENTIC_HQ_PLUGINS_SUBPATH = '/.agentic-hq/plugins'` and `AGENTIC_HQ_TEMP_SUBPATH = '/.agentic-hq/temp'` duplicate `.agentic-hq`. In ClaudeCodeTool.ts these were previously split into individual constants (`AGENTIC_HQ_WORKING_DIRECTORY`, `TEMP_DIRECTORY_NAME`) which was better. Agreed to split into individual segment constants and compose subpaths using `path.join()`:

```typescript
const AGENTIC_HQ_WORKING_DIRECTORY = '.agentic-hq';
const PLUGINS_DIRECTORY_NAME = 'plugins';
const TEMP_DIRECTORY_NAME = 'temp';

const AGENTIC_HQ_PLUGINS_SUBPATH = path.join(AGENTIC_HQ_WORKING_DIRECTORY, PLUGINS_DIRECTORY_NAME);
const AGENTIC_HQ_TEMP_SUBPATH = path.join(AGENTIC_HQ_WORKING_DIRECTORY, TEMP_DIRECTORY_NAME);
```

Methods stay the same. Eliminates `.agentic-hq` duplication in constants.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Extract `30_000` install script timeout to `INSTALL_SCRIPT_TIMEOUT_MS` | EXECUTE | Auto-approved |
| 1.2 | AI (Tier 1) | Extract Claude settings permissions JSON to `CLAUDE_SETTINGS_PERMISSIONS` constant | EXECUTE | Auto-approved |
| 1.3 | AI (Tier 1) | ~~Stale git-utils references~~ | SKIP | Verified clean — nothing to do |
| 1.4 | AI (Tier 1) | Verify TSDoc on `workingDirectory` param is complete | EXECUTE | Auto-approved |
| 2.1 | AI (Tier 2) | Extract `buildVariablesString` to shared utility | SKIP | Rejected by human — plugins should stay independent |
| 2.2 | AI (Tier 2) | Simplify install script PNPM_HOME detection — replace grep/sed with `source ~/.zshrc` | EXECUTE | Approved by human |
| 2.3 | AI (Tier 2) | Extract warning boxes to helper functions | SKIP | Rejected by human |
| 2.4 | AI (Tier 2) | Shared AgenticHqConfig pattern in demo CLIs | SKIP | Rejected by human |
| H.1 | Human | Split composed subpath constants in `agentic-hq-config.ts` into individual directory segments, compose with `path.join()` | EXECUTE | Discussed — see notes above |

**Total to execute: 5** | **Total skipped: 4**

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-03-04.
