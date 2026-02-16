# AI Summary: AHQ-47

**Jira**: [AHQ-47](https://agentic-hq.atlassian.net/browse/AHQ-47)
**Title**: Create Agentic HQ Core Plugin With Self Termination Skill
**Status**: Already In Progress (no transition needed)
**Generated**: 2026-02-16

---

## My Understanding of This Task

The goal is to create a new "Agentic HQ Core Plugin" that packages the existing self-termination functionality (from `tools/scripts/process-control/unix/kill-current-cli-process.sh`) as a Claude Code **Skill** within a **Plugin**. This is needed because the current kill script lives at a fixed repo path, which won't be available in a developer's own workspace. By packaging it as a plugin skill, the script travels with the plugin and can be used anywhere.

The deliverables are: (1) Move the existing `steve-test-plugin` from `plugins/` to `.agentic-hq/plugins/` (standardising the location), updating marketplace.json references; (2) Create a new `agentic-hq-core-plugin` at `.agentic-hq/plugins/agentic-hq-core-plugin/` modelled on the steve-test-plugin; (3) Create a `self-termination` skill inside that plugin with its own bundled copy of the kill script; (4) Create a new integration test that verifies the skill works; (5) Create a new test command `just-self-terminate-using-skill` that uses the skill instead of the script directly; (6) Temporarily modify `ClaudeCodeTool` to pass `--plugin-dir` when spawning Claude; (7) Add deprecation warnings to the old script and old test.

The scope is deliberately limited: no marketplace installation, just `--plugin-dir` for development/testing. The Jira explicitly marks the `--plugin-dir` approach as "wrong but that's OK" for now.

The test and code structure closely mirrors the existing AHQ-8 self-termination work, so I can use those as templates.

## Research Findings

### Plugin Skill Structure

From reading the steve-test-plugin's `investigate-git-stuff/SKILL.md`, skills use YAML frontmatter with `description` and `disable-model-invocation` fields, followed by markdown instructions. Skills can reference `{skill-base-dir}` to find bundled scripts relative to themselves. The Confluence page confirms that when a plugin is loaded via `--plugin-dir`, the skill base directory is the absolute path to the skill's directory within the plugin.

### ClaudeCodeTool --plugin-dir Change

Currently `ClaudeCodeTool` spawns `claude "<command> <ioDir>"`. The Jira says to change this to `claude --plugin-dir="<path>" "<command> <ioDir>"`. Looking at the code, the `args` array in `runPtyProcess` is `[...this.args, commandAndArguments]`. The `--plugin-dir` flag would need to be prepended before the command string. The cleanest approach: add an optional `pluginDirs` option to `ClaudeCodeToolOptions` that adds `--plugin-dir` arguments.

### Key Path Observations

- The Jira mentions `./agentic-hq/plugins/...` in some places (without the leading dot), but the standardised location is `.agentic-hq/plugins/...` (with the leading dot). The `.agentic-hq/` directory already exists (used for temp files), so `.agentic-hq/plugins/` is consistent.
- The kill script in the skill should be an exact copy of the existing one (same logic, same SIGINT approach).

## Questions for Human

### Question 1: --plugin-dir for multiple plugins

The Jira says to change ClaudeCodeTool to call `claude --plugin-dir="./agentic-hq/plugins/steve-test-plugin" "/command..."`. But the new agentic-hq-core-plugin will be at `.agentic-hq/plugins/agentic-hq-core-plugin`.

For the integration test of the self-termination skill, should the `--plugin-dir` point to:
- (a) Just the agentic-hq-core-plugin: `--plugin-dir=".agentic-hq/plugins/agentic-hq-core-plugin"`
- (b) Should I support multiple `--plugin-dir` flags (for when we need both plugins loaded)?
- (c) Or does `--plugin-dir` accept a parent directory containing multiple plugins?

I suspect (a) is sufficient for this test since we only need the core plugin's skill. But wanted to confirm.

**Human's Response**:
> (a) - I've fixed this in the Jira.

---

### Question 2: Path in the Jira - dot prefix consistency

The Jira description mentions both `./agentic-hq/plugins/...` (with `./`) and `.agentic-hq/plugins/...` in different places. The existing `.agentic-hq/` directory (used for temp files) has a leading dot. Should the plugin path consistently be `.agentic-hq/plugins/agentic-hq-core-plugin` (matching the existing `.agentic-hq/temp/` pattern)?

**Human's Response**:
> .agentic-hq/plugins/agentic-hq-core-plugin

---

### Question 3: ClaudeCodeTool modification scope

The Jira says to "temporarily change the ClaudeCodeTool class" to pass `--plugin-dir`. Should this be:
- (a) An optional parameter on the `execute()` method (so callers can optionally specify plugin dirs)
- (b) A constructor option on `ClaudeCodeToolOptions` (so a tool instance always uses certain plugin dirs)
- (c) Just hardcoded in the integration test (minimal change, most "temporary")

I'm leaning toward (b) as it's clean, testable, and the constructor already accepts options. But the Jira says "temporarily" which might suggest (c).

**Human's Response**:
> (d) - Hardcoded in ClaudeCodeTool itself. We'll always want this plugin available for all claude code runs going forward (for the moment) and once we need to change it, we'll work out how best to do it then (this is my new philosophy - work it out when it's needed, and only then...)
>
> **Agreed approach**: Hardcode `--plugin-dir=".agentic-hq/plugins/agentic-hq-core-plugin"` directly in ClaudeCodeTool so every `claude` invocation includes it automatically.

---

### Question 4: Test types

The Jira specifies: "Single Integration test executes successfully" and the acceptance criteria only mention an integration test. The test script name is `pnpm test:integration:real-claude-self-termination-skill`. Should I also write **unit tests** (e.g., for the ClaudeCodeTool --plugin-dir argument construction), or is a single integration test the only test type needed?

**Human's Response**:
> Single integration only type needed.

---

## Files I Reviewed

- `plugins/steve-test-plugin/.claude-plugin/plugin.json` - Plugin metadata format (name, description, version, author)
- `plugins/steve-test-plugin/skills/investigate-git-stuff/SKILL.md` - Template for skill format (YAML frontmatter + markdown with {skill-base-dir} variable)
- `.claude-plugin/marketplace.json` - Current marketplace config referencing `./plugins/steve-test-plugin`
- `src/tools/claude-code/ClaudeCodeTool.ts` - The tool that spawns Claude CLI; needs `--plugin-dir` support
- `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts` - Existing self-termination integration test (template for new one)
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md` - Existing command that calls kill script directly (template for new skill-based command)
- `tools/scripts/process-control/unix/kill-current-cli-process.sh` - The kill script to be bundled into the skill and deprecated here
- `package.json` - Existing test scripts (need to add `test:integration:real-claude-self-termination-skill`)

Key findings: The ClaudeCodeTool constructs CLI args as `[...this.args, commandAndArguments]` — adding `--plugin-dir` would go into the args array before the command string. The skill YAML frontmatter format is simple. The `.agentic-hq/plugins/` directory doesn't exist yet and needs to be created.

## Ready for Next Step

Human, please:
- Answer the questions
- Let me know you've answered them and we'll discuss until resolved.
- Then I'll tell you the next command to run
