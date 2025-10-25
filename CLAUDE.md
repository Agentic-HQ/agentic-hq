# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: NEVER COMMIT WITHOUT EXPLICIT APPROVAL 🚨

**RULE: NEVER run `git add`, `git commit`, or `git push` commands directly!**

- The user has a custom `/commit` command that handles the entire commit workflow
- The `/commit` command creates commit messages, gets approval, then stages/commits/pushes
- **ONLY commit when the user explicitly runs the `/commit` command**
- If you commit without approval, you bypass the review process and may commit unwanted changes
- **NO EXCEPTIONS** - even for "simple fixes" or "quick cleanups"

If you need to commit something, STOP and tell the user:
> "These changes are ready to commit. Please run the `/commit` command when you're ready."

## Project Overview

Agentic HQ is a modular open source framework for orchestrating agentic software development teams. NOTE: It is being developed using the BMAD (Breakthrough Method of Agile AI-driven Development) framework which has been installed in .bmad-core and also in .claude/commands/BMad.  These are the files that provide structured workflows for agile AI-driven planning and development, but they are not part of the project that is being worked on.

## BMAD Framework Architecture

The project uses the BMAD methodology which separates development into two phases:

### Planning Phase (Web UI recommended)
- **Analyst**: Creates project briefs, conducts market research, competitor analysis
- **Product Manager (PM)**: Creates Product Requirements Documents (PRDs) from briefs
- **UX Expert**: Creates front-end specifications and optionally generates AI UI prompts
- **Architect**: Creates technical architecture from PRD and UX specs
- **Product Owner (PO)**: Runs master checklist to ensure document alignment

### Development Phase (IDE-based)
- **Scrum Master (SM)**: Reviews previous notes, drafts stories from sharded epics
- **Quality Assurance (QA)**: Reviews story drafts and performs senior dev reviews
- **Developer (Dev)**: Sequential task execution, implementation, testing, validation

## Key Configuration Files

- `.bmad-core/core-config.yaml`: Core BMAD configuration
- `.bmad-core/install-manifest.yaml`: Installation metadata and file tracking

## Document Structure

Based on core configuration:
- `docs/prd.md`: Product Requirements Document (sharded to `docs/prd/`)
- `docs/architecture.md`: Technical architecture (sharded to `docs/architecture/`)
- `docs/stories/`: Story files following pattern `epic-{n}*.md`
- `.ai/debug-log.md`: Development debug log

### Always Load Files for Development
- `docs/architecture/coding-standards.md`
- `docs/architecture/tech-stack.md`
- `docs/architecture/source-tree.md`

## Workflow Commands

The framework uses YAML-based workflow definitions in `.bmad-core/workflows/`:
- `greenfield-fullstack.yaml`: New full-stack applications
- `greenfield-ui.yaml`: New UI-only projects
- `greenfield-service.yaml`: New service/API projects
- `brownfield-*.yaml`: Existing project modifications

## Agent Teams

Pre-configured agent teams available in `.bmad-core/agent-teams/`:
- `team-all.yaml`: Full team including all roles
- `team-fullstack.yaml`: Full-stack development team
- `team-no-ui.yaml`: Backend/service-focused team
- `team-ide-minimal.yaml`: Minimal IDE-focused team

## BMAD Slash Commands

Slash commands use prefix: `BMad`

## Development Notes

- Documents should be sharded before development begins
- **TDD MANDATORY**: All code must follow Red-Green-Refactor cycle - write failing test first, verify it fails correctly, then implement, then refactor
- Story acceptance criteria must include "TDD Methodology Followed"
- **Everything automated: ONE COMMAND RULE**: Everything must run in 1 command - if it takes 2+ commands, create a script
- **DOCUMENTATION REQUIRED**: Every script needs usage comments, every folder needs README, update docs with code changes
- All validation and linting must pass before story completion
- The workflow is designed for AI agent orchestration with human oversight
- **WATCH MODE BANNED**: NEVER create `test:watch` scripts or use `--watch` flags - they hang AI test execution. Always use `vitest run` (never `vitest` alone), `jest --no-watch` (never `jest --watch`)

## CRITICAL: Never Update Code Without Running Tests First

**RULE: ALWAYS run tests BEFORE making changes to "fix" them.**

This is fundamental to Test-Driven Development but easily violated when making "obvious" fixes:

### ❌ WRONG Approach:
1. See code that "looks wrong"
2. Decide to "fix" it
3. Make changes
4. Run tests to verify

### ✅ CORRECT Approach:
1. See code that "looks wrong"
2. **RUN THE TEST FIRST** to confirm it actually fails
3. ONLY IF IT FAILS, then make changes
4. Run tests again to verify the fix

### Real Example (2025-10-22):

While working on fixing unit test failures, AI identified that `infrastructure.integration.test.ts` was using `process.cwd()` at line 156 for accessing `docs/mission-docs/`. AI thought this was wrong and should use `ConfigManager.getAgenticHqProjectRoot()` instead.

**What AI Almost Did:**
- Add `import { ConfigManager } from '@spike-00/config-manager'`
- Change `process.cwd()` to `configManager.getAgenticHqProjectRoot()`
- Break a working test

**What Actually Happened:**
- User asked: "Can you run it to make sure it fails first?"
- AI ran the test: **11/11 tests PASSED**
- The test was **CORRECT** - it was testing spike project infrastructure, not repo root infrastructure
- AI's "fix" would have **BROKEN** a working test

**Key Lesson:**
Even when you're "sure" something is wrong, **RUN THE TEST FIRST**. The test might be correct, and your "fix" might break it.

**This applies to:**
- Bug fixes
- Refactoring
- Code cleanup
- "Obvious" corrections
- Everything

**No exceptions.**

## Before Deleting/Renaming/Moving Files: Search for References First

**RULE: Use Grep to search for references BEFORE deleting, renaming, or moving files.** Even files named `.BACKUP`, `DELME`, or `test-*` may be active test fixtures. Grep is faster than running tests and prevents breakage.

## Notes On Refactoring Stage Of Test Driven Development

Perplexity says REFACTOR phase of TDD means:
    - Improving code structure (modularity, readability, removing duplication) - not just of the code written, but of the whole code base that relates to and includes the code written.
    - Optimizing performance (less important unless we know it's very slow)
    - Applying design patterns (only if we know they are relevant and important for the code written)
    - Updating internal documentation (inline comments, TSDoc)

If you write a bunch of code and then do proper Refactoring, your output at the end of the Refactor stage should be something like the following, which shows that it did improve the code after doing it:

⏺ Excellent! All 14 tests still pass. The REFACTOR phase is complete with significant improvements:

  Refactoring Summary:
  1. CRITICAL: Replaced all synchronous file operations with async (coding standards compliance)
  2. Extracted constants for magic numbers and directory names
  3. Created helper methods to eliminate code duplication
  4. Added UnknownTaskTypeError for better error handling
  5. Added comprehensive TSDoc documentation
  6. Improved overall code structure and readability



## Please Don't Rush Things - Do Them Well (Quality Over Speed)

- You will be given comprehensive instructions which involve comprehensive reading.  Please **do not skip anything** to save time or speed things up. We have almost unlimited time and unlimited token use.  The priority here is **quality** and **instruction following** and **not** speed.  An example of where this was not followed was when the Agent said "This is taking a while, so let me speed things up by focusing on what's actually relevant" at which point I interrupted and said "Don't speed up.  Do it properly please.".  

## Don't Invent Things That Aren't In The Spec

If something critical isn't defined in the spec: Stop, Ask The Human.  Don't just make stuff up.  Example: while doing a story to create and End To End test the output directory wasn't defined in the spec, so AI decided to make it "docs/mission-docs/<missionId>/project-output/".   In a later story for implemnting the Agents as it wasn't in the spec a new AI decided to just use "current working directory".  This made the system have a bug where the test would check in one directory and the code would write it to a different directory.  (NOTE: I'm not sure how to enforce this - maybe by having a Story Checking Agent that checks that everything before implementation in a Story Definition has a reference to the original spec where that thing was defined - and if the reference isn't there - FAILS the review???  I doubt that this rule will actually stop this happening...)



## Always Make Sure Modules And Tools Version Are NOT Outdated

When starting (or continuing) a project you MUST make sure you are not using outdated libraries, modules or tool version (e.g. Node.js).  Usually the aim is to be running the latest Long Term Support version of what is available, and to avoid bleeding edge, new versions that may be unstable.  Running with outdated or incompatible libraries has wasted **HUGE** amounts of time on previous projects where bugs caused lots of time to be wasted trying to work round the bugs (when they were fixed in recent versions) and so running things like "pnpm outdated" and checking the output and working with the human to decide whether we should upgrade is *critical* - especially when starting up a new project, or starting a big, new chunk work on an existing project.  Please, as standard, do these checks and let the human know the risks/situation when you start a big, new chunk of work on an existing project - or especially when creating a new project.