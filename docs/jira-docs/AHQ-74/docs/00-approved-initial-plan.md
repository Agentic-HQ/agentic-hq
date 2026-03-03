# Plan: AHQ-74 - Help Understand Current State Of Project And Best Next Steps

## Context

AHQ-74 is a research and documentation task. You've reached a crossroads in the project where you need an honest, "thinking big" assessment of where you are, what you've achieved, where you're heading, and what the concrete next steps should be to reach AHQ-43 ("Developer Can Install And Run Demo TDD Workflow In Their Workspace").

The project has working infrastructure (ClaudeCodeTool, PTY execution, plugin system, CLI) but the gap between "works on my machine" and "someone else can use it" needs careful planning.

---

## IMPORTANT: Everything Below Is a DRAFT

The content plans for each document below are initial drafts based on planning-phase research. As each document is written, deeper research will refine, change, or replace the ideas, questions, Jiras, and outcomes listed here. The real value comes from the research process itself, not from rigidly following this plan.

## Step 0: Copy Plan to Jira Docs

Before starting any documents, copy this approved plan to `docs/jira-docs/AHQ-74/docs/approved-initial-plan.md` so it's preserved alongside the deliverables.

## Approach: 5 Sequential Documents

Create each document in `docs/jira-docs/AHQ-74/docs/`, one at a time, pausing for your review and discussion after each. Each document ends with "Things to discuss" and "Discussion notes" sections.

**Before writing each document, the AI MUST:**
1. Re-read ALL previously completed documents in `docs/jira-docs/AHQ-74/docs/` to build on what was learned
2. Re-read the approved initial plan (`approved-initial-plan.md`) to understand the original intent
3. Note where findings differ from or refine the draft plan

### Document 1: `task-summary-questions-and-clarifications.md`
**DRAFT** - Content will be shaped by actual research. Questions may change, new ones may emerge.
**What**: My understanding of the task + questions that need answering before the remaining docs can be fully accurate.

**Key questions to surface (some already answered during planning):**
- ~~Is AHQ-43's "clone the repo" model = run workflows WITHIN the cloned repo dir, or set up a separate workspace?~~ **ANSWERED**: Clone repo -> run setup scripts (Verdaccio publish + `pnpm add -g agentic-hq`) -> developer goes to THEIR OWN workspace -> runs `agentic-hq` commands (globally installed).
- ~~**Plugin loading when globally installed**~~ **ANSWERED**: User installs plugins via Claude Code marketplace, where the marketplace is the local cloned AHQ repo (not remote). Setup script: `claude plugin marketplace add /path/to/cloned/agentic-hq` then `claude plugin install <plugin>@agentic-hq-plugins`. Plugins cached at `~/.claude/plugins/cache/` and auto-loaded by Claude Code. **Implication**: `ClaudeCodeTool` needs to stop hardcoding `--plugin-dir` flags - marketplace-installed plugins are loaded automatically.
- Which demo workflows are in scope for AHQ-43 - just string reversal, or also the Jira TDD workflow?
- Must the Jira workflow work with ANY Jira project, or just yours initially?
- What's the status of AHQ-1 ("Simple TypeScript Driven Workflow") relative to existing demos?
- Is AHQ-67 (reduce repo size: 293MB git, 460MB spike docs) needed before AHQ-43?

### Document 2: `claude-code-marketplace-plugins-and-publishing-research.md`
**DRAFT** - Research findings will refine or replace the content outlined below. The publishing strategy especially may evolve.
**Prereq**: Re-read Document 1 + discussion notes before starting.
**What**: Comprehensive research on (a) Claude Code's plugin/marketplace system and (b) the npm publishing strategy: what to build now (local dev + Verdaccio) and what to design for later (remote beta + production).

**Key findings to present:**

**Part A - Claude Code Plugins & Marketplace:**
- How `--plugin-dir` (current approach) vs marketplace installation works
- Plugin caching at `~/.claude/plugins/cache/` and what that means for bundled TypeScript code
- How the existing "agentic-hq-plugins" marketplace works and the path to users installing plugins
- Skills vs Commands evolution

**Part B - Publishing Architecture (Build Now + Design For Later):**

| Level | Tool | Purpose | Build Now? |
|-------|------|---------|-----------|
| 1: Local Dev | `pnpm link` (symlink) | Fast iteration, live source | YES - already works, just needs cleanup |
| 2: Local Verdaccio | Verdaccio on localhost:4873 | Test full npm lifecycle locally | YES - needed for AHQ-43 |
| 3: Remote Beta | npm public + `--tag beta` | Team/collaborator testing | LATER - design for, don't build |
| 4: Production | npm public + `latest` tag | General availability | LATER - design for, don't build |

**What to build now (Level 1 + 2):**
- **Level 1 - Local Dev mode:**
  - `pnpm link /path/to/agentic-hq` creates symlink in `node_modules/` (gitignored, no source changes)
  - Fast iteration - changes to agentic-hq source are instantly visible
  - Script: `setup.sh --env=dev`
- **Level 2 - Local Verdaccio mode:**
  - `verdaccio` running locally on port 4873
  - `pnpm publish --registry http://localhost:4873` to test packaging
  - `pnpm install --registry http://localhost:4873` in consuming project
  - Validates: `files` whitelist correct, `bin` commands symlink properly, no secrets leaked, package size reasonable
  - Can publish infinite times without polluting any public registry
  - Script: `setup.sh --env=local-npm`
  - **This is the key test for AHQ-43**: "can a developer install agentic-hq from a registry and have it work?"
  - **AHQ-43 developer experience**: Clone AHQ repo -> run setup scripts (starts Verdaccio, publishes package, `pnpm add -g agentic-hq` from Verdaccio) -> go to YOUR OWN project workspace -> run `agentic-hq` commands (globally installed binary on PATH). Setup scripts must be fully automated.
  - **Plugin installation**: Setup script registers local AHQ repo as marketplace, installs plugins from it. Claude Code auto-loads marketplace-installed plugins (no `--plugin-dir` needed).

**What to design for later (Level 3 + 4):**
- **Level 3** - `pnpm publish --tag beta` to public npmjs.com. Free, zero auth for consumers. Script: `setup.sh --env=remote-beta`
- **Level 4** - `npm dist-tag add agentic-hq@X.Y.Z latest` promotes beta to stable. Script: `setup.sh --env=remote-prod`
- **Architecture note**: Expanding from Level 2 to Level 3/4 is just changing the registry URL. No structural changes needed.
- **Implementation note**: Config files and scripts should include **commented-out future modes** with potentially correct values, so expansion is just uncommenting. E.g. the setup script would have `# --env=remote-beta -> registry=https://registry.npmjs.org, publish with --tag beta` and `.npmrc` would have `# FUTURE: registry=https://registry.npmjs.org` commented out. Makes the upgrade path visible and obvious.

**Clean script-driven approach (NO file rewriting, NO pnpmfile.cjs):**
```
setup.sh --env=dev         -> pnpm link /path/to/agentic-hq  (symlink, instant)
setup.sh --env=local-npm   -> pnpm install --registry http://localhost:4873
setup.sh --env=remote-beta -> pnpm install --registry https://registry.npmjs.org
setup.sh --env=remote-prod -> pnpm install --registry https://registry.npmjs.org
```
Each mode just populates `node_modules/` differently. No source files changed. Script manages all state.

**The `files` whitelist (critical for all levels >= 2):**
- Must add to root `package.json` before first Verdaccio publish
- `"files": ["src/", "bin/", "README.md", "LICENSE"]`
- Prevents 90MB of docs/tests/temp files from being included in the package

**Assessment of AHQ-61 ChatGPT advice:**
- The multi-mode concept was correct in spirit
- The `pnpmfile.cjs` hook is NOT needed - `pnpm link` is simpler and cleaner for local dev
- The `files` whitelist recommendation is critical - must do
- The ENV-driven approach is replaced by a single script with `--env` flag - cleaner, more explicit
- No dependency rewriting needed at all - just different ways of populating `node_modules/`

### Document 3: `current-project-state.md`
**DRAFT** - Actual codebase deep-dive may reveal things not captured during planning.
**Prereq**: Re-read Documents 1-2 + discussion notes before starting.
**What**: Comprehensive map of what exists, how the string reversal demo works end-to-end (step by step with file paths), and codebase health assessment.

**Key content:**
- Full end-to-end trace of string reversal: CLI -> skill -> ts-workflow -> ClaudeCodeTool -> reverse-a-string command -> self-termination -> output
- How the full Jira TDD workflow works (the 5 commands, the test-type loop)
- What works well (clean separation, good test coverage, solid plugin structure)
- What needs attention (293MB repo, 90MB node_modules bloat from `file:`, outdated docs, 37KB CLAUDE.md)

### Document 4: `direction-of-project.md`
**DRAFT** - Direction insights will be shaped by all preceding research and discussions.
**Prereq**: Re-read Documents 1-3 + all discussion notes before starting.
**What**: Where the project is heading, the architecture trajectory, what to defer.

**Key insights:**
- **Phase 1 (AHQ-43)**: Clone AHQ repo, run setup scripts (Verdaccio publish + global install + marketplace plugin install), go to YOUR OWN workspace, run the Jira TDD workflow using YOUR Jira and YOUR GitHub on YOUR code
- **Phase 2 (post AHQ-43)**: npm publish, `npm install -g agentic-hq`, marketplace plugin distribution
- **Phase 3 (future)**: Community plugins, Temporal for resumable workflows
- **What to defer**: Temporal for resumable workflows, command fragments compilation
- **Marketplace plugin distribution**: Part of AHQ-43 setup (local marketplace from cloned repo). Remote/GitHub-hosted marketplace is a future enhancement.

### Document 5: `help-with-next-steps.md`
**DRAFT** - The Jira list below is a starting point. Research will likely produce NEW Jiras, modify existing ones, or change the priority order. This document should reflect what was ACTUALLY learned, not just what was planned.
**Prereq**: Re-read Documents 1-4 + all discussion notes before starting.
**What**: Concrete priority ordering of Jiras (existing, modified, AND new) to get from here to AHQ-43, with technical details for each.

**Recommended priority order (critical path to AHQ-43 only):**

Mix of existing Jiras, modified Jiras, and NEW tasks. Document 5 will detail each with technical specifics.

1. **AHQ-61 (modified)**: Dependency resolution + Verdaccio setup + `files` whitelist + `setup.sh --env` script. The foundation everything else builds on.
2. **NEW: Refactor ClaudeCodeTool to support marketplace-installed plugins**: Remove hardcoded `--plugin-dir` flags. When plugins are marketplace-installed, Claude Code auto-loads them. The CLI should work both ways (--plugin-dir for dev, marketplace for installed users).
3. **AHQ-63 (modified)**: Get `agentic-hq` binary globally installable via Verdaccio. `pnpm add -g agentic-hq --registry http://localhost:4873` puts it on PATH.
4. **NEW: Wire Jira TDD workflow through the agentic-hq CLI**: Currently the full-jira-tdd-story-workflow is a standalone demo script. Needs to be a skill+ts-workflow that runs via `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:jira-tdd-workflow`.
5. **NEW: Create automated setup script**: Single script that: starts Verdaccio, publishes agentic-hq, installs globally, registers local marketplace, installs plugins. The "clone repo, run one script, you're ready" experience.
6. **NEW: Cross-workspace acceptance test**: E2E test that creates a fresh temp workspace, runs the setup, then runs the Jira TDD workflow. Proves AHQ-43 works.

**Defer (after AHQ-43):** AHQ-64, AHQ-67, AHQ-62, AHQ-44, AHQ-68

---

## Key Files That Will Be Referenced

- `src/cli/agentic-hq-cli.ts` - CLI entry point
- `src/tools/claude-code/ClaudeCodeTool.ts` - Core file-based I/O tool
- `src/utils/cli/pty-utils.ts` - Shared PTY runner
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/` - Skill + ts-workflow
- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` - Full Jira TDD orchestrator
- `bin/agentic-hq.cjs` - CJS entry wrapper
- `docs/roadmap.md` - Existing roadmap
- `docs/jira-docs/AHQ-59/bundling-typescript-in-claude-code-plugin-research-and-recommendation.md` - Bundling research

## Research Already Completed

- Full codebase exploration (3 parallel agents)
- AHQ-43, AHQ-56, AHQ-61 Jira content fetched
- AHQ-43 Confluence sub-tasks page fetched
- Claude Code Plugins/Marketplace Confluence page fetched
- Full open Jira backlog (30+ items) fetched
- Verdaccio research via Perplexity
- Claude Code Plugin/Marketplace documentation research
- AHQ-59 bundling research document read
- Roadmap document read

## Verification

After each document:
- Present to user for review and discussion
- Update the "Discussion notes" section with agreed points
- Only proceed to next document after user confirms

After all 5 documents:
- All deliverables in `docs/jira-docs/AHQ-74/docs/` as specified in the Jira
- User has a clear picture of project state, direction, and concrete next steps
- Ready to create follow-up Jiras based on agreed priorities
