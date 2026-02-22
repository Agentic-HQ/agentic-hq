# AI Summary: AHQ-56

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Title**: agentic-hq CLI That Runs Typescript Code Bundled With A Skill
**Status**: Transitioned to In Progress
**Generated**: 2026-02-21

---

## My Understanding of This Task

This Jira is about creating a new `agentic-hq` CLI command that adds a level of indirection between the developer and the workflow TypeScript code. Instead of running `pnpm demo:string-reversal` directly (which only works from the AHQ project root), the developer will run `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal --string-to-reverse="hello"`. The `agentic-hq` CLI doesn't know anything about how the workflow works - it just asks a skill "what command should I run?" and then runs it.

The flow is: `agentic-hq` CLI -> invokes the `/agentic-hq-demos-plugin:string-reversal` skill (via ClaudeCodeTool) -> the skill returns the full shell command to run the TypeScript workflow -> `agentic-hq` executes that command with all user args passed through. The powerful part is the CLI is completely decoupled from the workflow implementation.

Critically, when `agentic-hq` runs the workflow command, it must use **the same PTY-based passthrough approach as ClaudeCodeTool.ts** - not a simple `child_process.spawn`. This means: spawning via `node-pty`, terminal size detection with fallback defaults, dynamic resize handling, raw-mode stdin passthrough (with isTTY guard for non-interactive environments like CI/tests), stdout streaming via `ptyProcess.onData`, and graceful signal cleanup (SIGINT/SIGTERM). This ensures the user gets a fully transparent terminal experience - colors, interactive prompts, Ctrl-C, everything passes through as if they ran the workflow directly.

The TypeScript workflow code needs to be moved from `src/demo/cli/string-reversal-demo-cli.ts` into a self-contained mini Node.js project at `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`. This mini project has its own `package.json`, `pnpm-lock.yaml`, etc. - identical to how it runs today, just relocated into the plugin. The skill's `SKILL.md` knows its own directory and returns the full command: `cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal -- <args>`.

The scope is limited to: (1) creating the `agentic-hq` CLI entry point, (2) creating the SKILL.md, (3) moving the string-reversal TypeScript into a self-contained ts-workflow directory inside the plugin, (4) adding the workspace exclusion to pnpm-workspace.yaml, and (5) an E2E test. Out of scope: npm publishing, marketplace distribution, and user-installed plugins.

## Research Findings

### How to Create the `agentic-hq` CLI (from Confluence)

The Confluence page specifies creating a `bin/agentic-hq.cjs` entry point that uses `tsx` to run the main TypeScript CLI code directly. Combined with a `"bin"` entry in `package.json` and `pnpm link --global`, this gives a globally-available `agentic-hq` command that always points to the live development code - no rebuild needed.

### AHQ-59 Research Document (Bundling TypeScript in Plugins)

The research document at `docs/jira-docs/AHQ-59/bundling-typescript-in-claude-code-plugin-research-and-recommendation.md` is comprehensive and provides the full migration plan. Key decisions:
- **No pre-compilation/esbuild** - `pnpm install` is unavoidable anyway (native modules like node-pty), so just use `tsx` to run TypeScript directly
- Each workflow is a **self-contained mini Node.js project** in `ts-workflow/`
- **Workspace isolation** required: add `- '!.agentic-hq/plugins/**'` to `pnpm-workspace.yaml` AND use `--ignore-workspace` flag
- Version protection via `.nvmrc` + `engines` + `engine-strict=true` (all built-in, no custom code)

### PTY Passthrough Requirements (from Jira update)

The `agentic-hq` CLI must use the same PTY passthrough technique as `ClaudeCodeTool.runPtyProcess()` when executing the workflow command. The full feature set from ClaudeCodeTool that must be replicated:

1. **node-pty spawn** - Use `spawnPty()` from `node-pty`, not `child_process.spawn/exec`
2. **Terminal size detection** - `process.stdout.columns/rows` with fallback defaults (80x30)
3. **Dynamic resize** - Listen for `process.stdout` `resize` events and call `ptyProcess.resize()`
4. **stdout streaming** - `ptyProcess.onData()` piped to `process.stdout.write()` (preserves ANSI codes/colors)
5. **stdin passthrough** - Raw mode stdin with `isTTY` guard (prevents crash in CI/tests where `setRawMode()` throws)
6. **Signal cleanup** - SIGINT/SIGTERM handlers that clean up PTY, restore terminal state, and exit
7. **Flow control** - `handleFlowControl: true` for better performance with large output

This is a significant amount of shared logic with ClaudeCodeTool. **We should consider refactoring out this duplication in the REFACTOR stage of our TDD process for this Jira** - extracting a shared PTY runner utility that both ClaudeCodeTool and the `agentic-hq` CLI can use. The key difference between the two usages: ClaudeCodeTool spawns the `claude` executable; the `agentic-hq` CLI will spawn `bash -c "<command-from-skill>"` (since the skill returns a full shell command string with `cd && pnpm install && pnpm run`).

### Existing Codebase Observations

- The current `string-reversal-demo-cli.ts` is simple (~29 lines): parses args with commander, calls `ClaudeCodeTool.execute()`, prints result
- `ClaudeCodeTool` handles all the PTY/file-I/O complexity - the CLI just calls `execute(command, input)` and gets back a string
- The `skills/` directory doesn't exist yet under `agentic-hq-demos-plugin` - needs to be created
- The `bin/` directory doesn't exist yet - needs to be created
- The `pnpm-workspace.yaml` currently excludes spike projects but NOT plugins - the plugin exclusion needs to be added
- The existing E2E test uses `execSync` to run the CLI command and checks output contains the reversed string

## Questions for Human

### Question 1: What is the main TypeScript file for the `agentic-hq` CLI?

The Confluence page says to create `bin/agentic-hq.cjs` as the entry point that calls a TypeScript file via `tsx`. But where should the actual TypeScript CLI code live? Options:
- `src/cli/agentic-hq-cli.ts` (new directory alongside `src/demo/cli/`)
- `src/agentic-hq-cli.ts` (at src root)
- `src/demo/cli/agentic-hq-cli.ts` (alongside existing demo CLIs)

The Confluence notes mention the CJS file launches an `agentic-hq.cli.ts` program. Where should this TypeScript file be placed?

**Human's Response**:
> src/cli/agentic-hq-cli.ts

---

### Question 2: How should the `agentic-hq` CLI pass arguments to the workflow?

The Jira says "All IO is passed through from user" and shows the command:
```
agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal --string-to-reverse="hello"
```

The `agentic-hq` CLI needs `--workflow-command-supplier` for itself, but all other args (`--string-to-reverse="hello"`) need to be passed through to the workflow command. Should the CLI:
- **Option A**: Use commander's `allowUnknownOption()` and pass through everything after `--workflow-command-supplier`
- **Option B**: Use `--` separator convention (e.g., `agentic-hq --workflow-command-supplier=... -- --string-to-reverse="hello"`)
- **Option C**: Just pass the raw remaining args after extracting `--workflow-command-supplier`

The Jira implies Option A (no `--` separator), since the example shows `--string-to-reverse` as a direct argument. But I want to confirm this is the intended UX.

**Perplexity Research**: Perplexity recommends **Option B (the `--` separator)** as the standard Unix/POSIX convention, known as **"passThroughOptions"** in commander's own documentation. Commander has a dedicated `.passThroughOptions()` method that stops parsing at the first unrecognized option and collects the rest. The `--` itself is the POSIX "end-of-options marker". Tools like `npm run`, `yarn`, and most CLIs use this pattern. Benefits: explicit separation (no ambiguity), preserves argument integrity, safer (no shell injection), and simpler implementation. However, the Jira's example shows args without `--`, which is a slightly more convenient UX but non-standard.

**Human's Response**:
> We discussed this further and we should go with Perplexity's recommendation to use '--' pass through options.  I've updated the jira to say this: 


    developer runs the agentic-hq CLI in the Agentic HQ workspace root directory with option that tells the CLI how to get the Workflow Command they need to run and options that are passed through to the internal command passed after a ‘--’ string - which is the default for POSIX command line arguments and supported by the Commander.js library:

    agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse=”hello”



---

### Question 3: Should we keep the old `pnpm demo:string-reversal` working?

The AHQ-59 research doc mentions "Step 4: Redirect - Update project-root script to delegate" and "Step 6: Delete old code". Should we:
- **Option A**: Keep `pnpm demo:string-reversal` working by redirecting it to use the new plugin-based workflow (backwards compatible)
- **Option B**: Remove the old `pnpm demo:string-reversal` script and `src/demo/cli/string-reversal-demo-cli.ts` entirely (clean break)
- **Option C**: Keep both for now (old direct way + new `agentic-hq` CLI way) and remove the old in a future Jira

The acceptance criteria only mentions the new E2E test using `agentic-hq`, so the old path isn't strictly required. But other tests (`test:e2e:demo-string-reversal`) currently depend on the old `pnpm demo:string-reversal` command.

**Human's Response**:
> Make "pnpm demo:string-reversal" actually run the full command that the skill tells agentic-hq to run, i.e. "cd <skill-dir>/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal"
---

### Question 4: The SKILL.md needs to communicate args - via file I/O or direct command building?

**Resolved via discussion.** The design is:

- `agentic-hq` CLI sends `command-input-string` = `"unused input string"` (placeholder, not used by skill)
- The SKILL.md has a `base-command` variable defined upfront (e.g., `pnpm install --ignore-workspace && pnpm demo:string-reversal`)
- The skill prepends `cd {skill-base-dir}/ts-workflow && ` to `{base-command}` to build the full command
- The skill writes **only** that full command to `command-output-string` - nothing else
- The `agentic-hq` CLI then appends `-- <passthrough-args>` to that command before running it via PTY
- The SKILL.md is told not to worry about workflow arguments - `agentic-hq` will append them

Example output: `cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal`

This keeps the SKILL.md dead simple - just variable substitution, no complex logic. The skill doesn't know or care about the user's args.

**Human's Response**:
> Agreed as above.

---

## Files I Reviewed

- `docs/jira-docs/AHQ-59/bundling-typescript-in-claude-code-plugin-research-and-recommendation.md` - The prerequisite research doc. Contains the full migration plan, directory structure, package.json template, and reasoning for the tsx-based approach. Critical context for this Jira.
- `src/demo/cli/string-reversal-demo-cli.ts` - The existing string reversal CLI that will be moved into the plugin's ts-workflow directory. Simple 29-line file using commander + ClaudeCodeTool.
- `src/tools/claude-code/ClaudeCodeTool.ts` - The core tool that executes slash commands via PTY. Understanding this is essential since the `agentic-hq` CLI will use it to invoke the skill, and the workflow code inside ts-workflow will also use it.
- `.agentic-hq/plugins/steve-test-plugin/skills/investigate-git-stuff/SKILL.md` - Reference for how skills access their base directory. The pattern `skill-base-dir = the skill base directory you were provided with when you ran this skill` is what the new string-reversal SKILL.md will use.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/string-reversal/reverse-a-string.md` - The existing command that does the actual string reversing. This stays unchanged - the workflow TS code calls it via ClaudeCodeTool.
- `package.json` - Root project config. Shows existing demo scripts, dependencies, and bin configuration (no `bin` entry yet).
- `pnpm-workspace.yaml` - Workspace config. Currently excludes spike projects but NOT plugins - needs the `!.agentic-hq/plugins/**` exclusion added.
- `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts` - Existing E2E test for string reversal. Uses `execSync` to run `pnpm demo:string-reversal`. Need to understand whether this test stays, gets updated, or gets replaced.

**Most important findings:**
1. The skills directory under `agentic-hq-demos-plugin` doesn't exist yet - it's entirely new
2. There's no `bin/` directory or `bin` entry in package.json yet - the CLI entry point is new
3. The pnpm workspace exclusion for plugins hasn't been added yet
4. The existing `ClaudeCodeTool` already supports everything needed - the skill just needs to return the right command string via the file I/O pattern
5. The `investigate-git-stuff` SKILL.md shows exactly how to get the skill base directory, which is the pattern our new SKILL.md will follow

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### Unit Tests

Tests for the `agentic-hq` CLI logic with mocked dependencies:

- **Arg parsing**: Verifies `--workflow-command-supplier` is extracted and passthrough args (after `--`) are collected correctly
- **Skill invocation**: Verifies ClaudeCodeTool is called with the correct skill command and `"unused input string"` as input
- **Command construction**: Verifies the base command from the skill has `-- <passthrough-args>` appended correctly
- **PTY runner**: Verifies the PTY spawn is called with the correct command (may be tested via the shared utility if we refactor in the REFACTOR stage)
- **Error handling**: Verifies appropriate errors when `--workflow-command-supplier` is missing or skill returns no output

### E2E Test

As specified in acceptance criteria:

- **Test name**: `pnpm test:e2e:agentic-hq-cli-string-reversal`
- **Runs**: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is a test string"`
- **Asserts**: Output contains `"gnirts tset a si siht"`
- **Timeout**: 30 seconds

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.
