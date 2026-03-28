# Unit Test Audit Report — AHQ-83 Branch vs Main

**Branch:** `refactor/ahq-83-microkernal-plugin-architecture`
**Total tests:** 84 across 20 files
**Tests on main (in tests/unit/):** 4 files (1 deleted on branch, 2 modified, 1 unchanged)
**New test files on branch:** 17

---

## Summary Statistics

| Category | Count | % |
|----------|-------|---|
| High Value | 38 | 45% |
| Medium Value | 25 | 30% |
| Low Value | 15 | 18% |
| No Value | 6 | 7% |

---

## Deleted Test File (was on main, removed on branch)

| # | File | Test | OLD/NEW | Value | Recommendation |
|---|------|------|---------|-------|----------------|
| - | `utils/directory/directory-functions.unit.test.ts` | 7 tests (getAgenticHqWorkspaceRoot, getAgenticHqPluginsDir, getCurrentWorkspaceRoot, getAgenticHqTempDir, getProjectWorkingDir) | OLD (DELETED) | Was Medium Value | **OK to delete** — these functions were replaced by the DefaultGitWorkspace / DefaultAgenticHqInstallation / DefaultUserProjectWorkspace classes, which have their own tests. |

---

## Full Test Audit Table

### File 1: `e2e-helpers/run-cli-and-log-output.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 1 | should create log file at /tmp/{label}.log and return its contents | OLD | **High** | Tests real shell execution + file creation of e2e helper used by all e2e tests | Keep |
| 2 | should execute command in the specified working directory | OLD | **High** | Tests working directory parameter which is critical for e2e test correctness | Keep |

### File 2: `interfaces/tool.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 3 | should define execute that accepts command and input, returns Promise\<string\> | NEW | **Low** | Tests that a stub satisfies a TypeScript interface — the compiler already enforces this. Only checks `typeof result === 'string'` | Delete |
| 4 | should allow different commands and inputs | NEW | **No Value** | Calls the same stub with different args and checks typeof again. Tests nothing beyond test #3 | Delete |

### File 3: `interfaces/cli-wrapper.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 5 | should define run that accepts a CLICommand and currentWorkingDirectory and returns Promise\<void\> | NEW | **Low** | Tests that a stub satisfies CLIWrapper interface — compiler already enforces this | Delete |
| 6 | should accept all required parameters | NEW | **No Value** | Calls the same stub with different args. Adds nothing beyond test #5 | Delete |

### File 4: `interfaces/pty-cli-wrapper.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 7 | should implement CLIWrapper interface | NEW | **Low** | Checks `typeof asInterface.run === 'function'` — TypeScript compilation already validates this | Delete |
| 8 | should have a run method that returns a Promise | NEW | **No Value** | Duplicates test #7 — both just check `run` exists | Delete |

### File 5: `interfaces/json-file-io-marshaller-session.unit.test.ts` (9 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 9 | getMarshallingId > should return a unique marshalling ID on construction | NEW | **Medium** | Verifies ID generation exists and returns a string | Keep |
| 10 | getMarshallingId > should include timestamp and UUID in the marshalling ID | NEW | **High** | Validates the ID format contract (timestamp + UUID) with regex — catches format regressions | Keep |
| 11 | getMarshallingId > should return a path under the provided tempDir | NEW | **Medium** | Verifies ID is rooted under tempDir and includes subdirectory path | Keep |
| 12 | getMarshallingId > should generate different IDs for different sessions | NEW | **High** | Prevents collisions between concurrent sessions — critical for correctness | Keep |
| 13 | write > should create directory and write command-input.json | NEW | **High** | Tests real file I/O: directory creation + JSON file writing. Core marshalling behavior | Keep |
| 14 | write > should write empty string input | NEW | **Medium** | Edge case: empty string input still produces valid JSON file | Keep |
| 15 | readOutput > should read command-output.json and return the output string | NEW | **High** | Tests reading output file — the other half of the marshalling contract | Keep |
| 16 | readOutput > should throw if output file does not exist | NEW | **High** | Error handling: verifies fail-fast when output file is missing | Keep |
| 17 | JsonFileIOMarshallerSessionFactory > should create sessions that use the workspace tempDir | NEW | **Medium** | Tests factory creates sessions rooted at correct tempDir | Keep |

### File 6: `workspace/default-git-workspace.unit.test.ts` (4 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 18 | getRoot() > should return the trimmed git root directory | NEW | **High** | Tests core behavior: execSync output is trimmed correctly. Mocked child_process | Keep |
| 19 | immutability > should be frozen | NEW | **Medium** | Validates design invariant (Object.freeze). Catches accidental removal of freeze | Keep |
| 20 | error handling > should throw NotInGitWorkspaceError when not in a git repository | NEW | **High** | Tests custom error type is thrown when git fails — fail-fast behavior | Keep |
| 21 | error handling > should include a helpful message in NotInGitWorkspaceError | NEW | **Medium** | Verifies error message is human-readable | Keep |

### File 7: `workspace/default-agentic-hq-installation.unit.test.ts` (4 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 22 | should use AGENTIC_HQ_WORKSPACE_ROOT env var when set | NEW | **High** | Tests env var override path — critical config resolution logic | Keep |
| 23 | should use gitWorkspace.getRoot() when no env var | NEW | **High** | Tests git root fallback — the default code path | Keep |
| 24 | should use custom git root for configDir | NEW | **Medium** | Variant of #23 with different mock value. Some overlap but confirms path composition | Keep |
| 25 | immutability > should be frozen | NEW | **Medium** | Validates design invariant | Keep |

### File 8: `workspace/default-user-project-workspace.unit.test.ts` (4 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 26 | should derive root from gitWorkspace.getRoot() | NEW | **High** | Tests core delegation to gitWorkspace | Keep |
| 27 | should compute tempDir from root | NEW | **High** | Tests derived path composition — critical for file I/O marshalling | Keep |
| 28 | should use custom git root for derived paths | NEW | **Low** | Variant of #26+#27 with a different mock. Overlap, but harmless | Keep (borderline) |
| 29 | immutability > should be frozen | NEW | **Medium** | Validates design invariant | Keep |

### File 9: `tools/claude-code/claude-command-builder.unit.test.ts` (11 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 30 | should return a CLICommand with executable "claude" by default | NEW | **High** | Verifies default executable is 'claude' — the most basic contract | Keep |
| 31 | should include --plugin-dir flags for each default plugin dir | NEW | **High** | Verifies all 3 plugin dirs are included — critical for Claude to find plugins | Keep |
| 32 | should resolve plugin dirs under installation.configDir/plugins | NEW | **High** | Verifies plugin dirs are rooted under configDir — path correctness | Keep |
| 33 | should include --allowedTools flag with default tools | NEW | **High** | Verifies security-relevant flag is present with expected tools | Keep |
| 34 | should append command and marshallingId to args | NEW | **High** | Verifies the command + marshallingId are the final argument — protocol contract | Keep |
| 35 | should use custom executable when provided | NEW | **Medium** | Tests DI: custom executable (e.g., 'tsx' for testing with fake CLI) | Keep |
| 36 | should include extra args before plugin flags | NEW | **Medium** | Tests DI: extra args positioning (e.g., fake CLI path) | Keep |
| 37 | should resolve default plugin dirs to absolute paths | NEW | **Low** | Overlap with #32 — both check paths start with `/`. Redundant | Delete (covered by #32) |
| 38 | should return a DefaultCLICommand instance | NEW | **Low** | Tests concrete return type. Less valuable than testing behavior | Keep (borderline) |
| 39 | should produce a human-readable string via toString() | NEW | **Medium** | Tests debugging/logging output format | Keep |
| 40 | should log ANSI-formatted debug output via logDebug() | NEW | **Medium** | Tests debug logging produces ANSI-colored output | Keep |

### File 10: `tools/claude-code/default-claude-code-tool.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 41 | should implement ClaudeCodeTool interface | NEW | **Low** | Checks `toBeDefined()` and `typeof execute === 'function'` — TypeScript handles this | Delete |
| 42 | should delegate execute() to CompositionRoot.getTool() | NEW | **High** | Tests the actual delegation behavior — verifies args pass through correctly | Keep |

### File 11: `tools/marshalled-cli-tool.unit.test.ts` (8 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 43 | should implement the Tool interface | NEW | **Low** | Checks `toBeDefined()` + `typeof execute === 'function'` — compiler validates | Keep (borderline) |
| 44 | should create a session via sessionFactory.create() on each execute() | NEW | **High** | Verifies session factory is called — core orchestration behavior | Keep |
| 45 | should call session.write() with the input | NEW | **High** | Verifies input is written to session — core marshalling step | Keep |
| 46 | should call commandBuilder.build() with command and marshalling ID | NEW | **High** | Verifies command builder receives correct args | Keep |
| 47 | should call cliWrapper.run() with CLICommand and currentWorkingDirectory | NEW | **High** | Verifies CLI execution delegation with correct params | Keep |
| 48 | should call session.readOutput() and return the result | NEW | **High** | Verifies output is read from session and returned | Keep |
| 49 | should NOT call logDebug() — that is the wrapper responsibility | NEW | **Medium** | Documents architectural boundary: tool doesn't log, wrapper does | Keep |
| 50 | should create a new session for each execute() call | NEW | **High** | Verifies session isolation between calls — prevents cross-contamination | Keep |

### File 12: `workflow/default-workflow-command.unit.test.ts` (3 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 51 | should implement the WorkflowCommand interface | NEW | **Low** | Checks `toBeDefined()` + `typeof execute === 'function'` — compiler validates | Keep (borderline) |
| 52 | should execute via CLIWrapper with bash -c and the command string | NEW | **High** | Tests core behavior: wraps command string in `bash -c` and delegates to CLIWrapper | Keep |
| 53 | should pass the command string exactly as provided (no modification) | NEW | **High** | Tests that special characters / quotes are preserved — critical for shell safety | Keep |

### File 13: `workflow/claude/claude-workflow-command-builder.unit.test.ts` (5 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 54 | should implement the WorkflowCommandBuilder interface | NEW | **Low** | Checks `toBeDefined()` + `typeof build === 'function'` — compiler validates | Keep (borderline) |
| 55 | should resolve skill path via Tool and return a WorkflowCommand | NEW | **High** | Tests core behavior: Tool.execute resolves skill path, result is a WorkflowCommand | Keep |
| 56 | should return a WorkflowCommand that executes with the resolved command string | NEW | **High** | Tests end-to-end: build + execute produces correct bash -c invocation | Keep |
| 57 | should append shell-escaped passthrough args to the command | NEW | **High** | Tests shell escaping of passthrough args — critical for correctness | Keep |
| 58 | should work with any Tool implementation | NEW | **Medium** | Variant of #55-57 with different mock. Demonstrates polymorphism | Keep |

### File 14: `cli/agentic-hq-cli-list.unit.test.ts` (14 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 59 | class behavior > should return all registered skills via getSkills() | OLD (modified) | **High** | Tests core registry API | Keep |
| 60 | class behavior > should resolve a known short name to its full path | OLD (modified) | **High** | Tests skill resolution — the primary lookup method | Keep |
| 61 | class behavior > should return undefined for unknown short names | OLD (modified) | **High** | Tests error case: unknown skill name returns undefined (not throw) | Keep |
| 62 | class behavior > should format the skill list with header, names, paths, and examples | OLD (modified) | **Medium** | Tests formatting output structure | Keep |
| 63 | class behavior > should be immutable (frozen) | NEW | **Medium** | Validates design invariant | Keep |
| 64 | class behavior > should not be affected by mutations to the original skills array | NEW | **High** | Tests defensive copy — prevents external mutation from corrupting registry | Keep |
| 65 | DEMO_SKILLS > should contain 4 demo workflow skills | OLD (modified) | **Low** | Hardcoded count assertion — brittle, breaks when skills are added/removed | Delete |
| 66 | DEMO_SKILLS > should have reversal, math, quick-jira, and full-jira entries | OLD (modified) | **Low** | Hardcoded name list — same brittleness as #65. Tests data, not behavior | Delete |
| 67 | DEMO_SKILLS > should have correct full paths for each skill | OLD (modified) | **Low** | Hardcoded path assertions — tests data constants, not logic | Delete |
| 68 | DEMO_SKILLS > should have a description for each skill | OLD (modified) | **Medium** | Tests structural invariant: every skill has a description. Less brittle than #65-67 | Keep |
| 69 | DEMO_SKILLS > should have a usage example for each skill | OLD (modified) | **Medium** | Tests structural invariant: every skill has an example | Keep |
| 70 | DEMO_SKILLS > should format demo skill list with correct structure | OLD (modified) | **Medium** | Tests formatting includes all skill names | Keep |
| 71 | DEMO_SKILLS > should include Example: lines for each demo skill | OLD (modified) | **Low** | Hardcoded example strings — brittle, breaks when examples change | Delete |
| 72 | DEMO_SKILLS > should have a skill line and an example line for each skill | OLD (modified) | **Low** | Hardcoded line count (9) — brittle, breaks when skills added/removed | Delete |

### File 15: `cli/agentic-hq-program.unit.test.ts` (5 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 73 | should delegate short alias workflow to builder.build() + command.execute() | NEW | **High** | Tests the primary CLI flow: short alias → skill resolution → execution | Keep |
| 74 | should pass passthrough args to builder.build() | NEW | **High** | Tests -- passthrough args are forwarded correctly | Keep |
| 75 | should delegate --workflow-command-supplier to builder.build() | NEW | **High** | Tests the explicit skill path option — alternative to short alias | Keep |
| 76 | should not call builder.build() for list command | NEW | **Medium** | Tests list command doesn't trigger workflow execution | Keep |
| 77 | should use skills from injected registry, not hardcoded data | NEW | **High** | Tests DI: custom registry works — proves system isn't hardcoded to DEMO_SKILLS | Keep |

### File 16: `claude-code-tool/claude-code-tool-with-injected-cli-wrapper.unit.test.ts` (1 test)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 78 | should use injected CLIWrapper | NEW | **Medium** | Tests CLIWrapper DI — but heavily overlaps with marshalled-cli-tool.unit.test.ts #47. Different test file tests same class (MarshalledCLITool) with same scenario | **Delete** (redundant with #47) |

### File 17: `claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` (1 test)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 79 | should use default plugin dirs and allowed tools | NEW | **Medium** | Tests ClaudeCommandBuilder defaults flow through MarshalledCLITool. Overlap with claude-command-builder tests #31-33 but tests integration of two classes | Keep (borderline — overlap with #31-33) |

### File 18: `claude-code-tool/claude-code-tool-implements-tool-interface.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 80 | should be assignable to a Tool-typed variable (compile-time check) | NEW | **No Value** | Exact duplicate of marshalled-cli-tool test #43. Same class, same assertion, different file | **Delete** (redundant with #43) |
| 81 | should work polymorphically when used as a Tool | NEW | **No Value** | Duplicate of test pattern already covered by #48 (readOutput returns mock output) | **Delete** (redundant) |

### File 19: `claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` (2 tests)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 82 | should use injected sessionFactory instead of built-in | NEW | **Low** | Tests session factory DI — but overlaps heavily with marshalled-cli-tool tests #44, #45, #48 | **Delete** (redundant with #44+#45+#48) |
| 83 | should work end-to-end with real session factory and fake CLI | NEW | **High** | Real end-to-end test: PtyCLIWrapper + real JSON files + fake CLI fixture. Proves the whole pipeline works | Keep |

### File 20: `claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` (1 test)

| # | Test Name | OLD/NEW | Value | Why | Recommendation |
|---|-----------|---------|-------|-----|----------------|
| 84 | should reverse a string via file I/O with fake CLI | OLD (modified) | **High** | The original end-to-end fake CLI test. Real file I/O, real PTY execution. Core confidence test | Keep |

---

## Recommended Deletions Summary

| # | Test | Reason |
|---|------|--------|
| 3 | Tool interface > should define execute... | Interface contract tested by compiler |
| 4 | Tool interface > should allow different commands and inputs | Duplicate of #3 |
| 5 | CLIWrapper interface > should define run... | Interface contract tested by compiler |
| 6 | CLIWrapper interface > should accept all required parameters | Duplicate of #5 |
| 7 | PtyCLIWrapper > should implement CLIWrapper interface | Compiler validates interface conformance |
| 8 | PtyCLIWrapper > should have a run method that returns a Promise | Duplicate of #7 |
| 37 | ClaudeCommandBuilder > should resolve default plugin dirs to absolute paths | Redundant with #32 |
| 65 | DEMO_SKILLS > should contain 4 demo workflow skills | Brittle hardcoded count |
| 66 | DEMO_SKILLS > should have reversal, math, quick-jira, and full-jira entries | Brittle hardcoded names |
| 67 | DEMO_SKILLS > should have correct full paths for each skill | Brittle hardcoded paths |
| 71 | DEMO_SKILLS > should include Example: lines for each demo skill | Brittle hardcoded examples |
| 72 | DEMO_SKILLS > should have a skill line and an example line for each skill | Brittle hardcoded line count |
| 78 | MarshalledCLITool with injected CLIWrapper | Redundant with #47 |
| 80 | MarshalledCLITool implements Tool interface (compile-time check) | Redundant with #43 |
| 81 | MarshalledCLITool should work polymorphically | Redundant with #48 |
| 82 | MarshalledCLITool with injected sessionFactory | Redundant with #44+#45+#48 |

**Total recommended deletions: 16 tests** (from 84 down to 68)

This would also allow deleting 3 entire test files that become empty:
- `interfaces/tool.unit.test.ts` (tests #3, #4)
- `interfaces/cli-wrapper.unit.test.ts` (tests #5, #6)
- `interfaces/pty-cli-wrapper.unit.test.ts` (tests #7, #8)

And 2 more files that become empty after deletions:
- `claude-code-tool/claude-code-tool-implements-tool-interface.unit.test.ts` (tests #80, #81)
- `claude-code-tool/claude-code-tool-with-injected-cli-wrapper.unit.test.ts` (test #78)

That's **5 entire test files** that can be deleted, plus individual tests from 2 other files.

---

## Observations

### Pattern: "Interface contract" tests that duplicate the compiler
Tests #3-8 all follow the same pattern: create a stub/instance, check `typeof method === 'function'`. TypeScript's type system already guarantees these at compile time. These tests pass by definition if the code compiles. They provide zero regression protection.

### Pattern: Scattered tests for the same class
MarshalledCLITool is tested in **5 separate files** (files 11, 16, 17, 18, 19). The canonical test file (`marshalled-cli-tool.unit.test.ts`, file 11) is comprehensive with 8 tests covering all behavior. The 4 satellite files (in `claude-code-tool/`) duplicate subsets of those tests. Consolidating to one file would reduce duplication and improve maintainability.

### Pattern: Hardcoded demo data assertions
Tests #65-67, #71-72 assert specific DEMO_SKILLS values (count=4, names=reversal/math/quick-jira/full-jira, exact example strings, line count=9). These break every time a demo skill is added, removed, or renamed. Tests #68-69 are better — they check structural invariants (every skill has a description/example) without hardcoding specific values.

### The two end-to-end tests are the highest-value tests in the suite
Tests #83 and #84 actually spawn a PTY, run a fake CLI fixture, read/write real JSON files, and verify the reversed string output. They test the entire MarshalledCLITool pipeline end-to-end. These are worth more than many of the mock-based tests combined, though they are nearly identical to each other (test #83 in file 19 was created on the branch as a near-duplicate of #84 in file 20).
