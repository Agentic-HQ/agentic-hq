# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Please Don't Rush Things - Do Them Well (Quality Over Speed)

- You will be given comprehensive instructions which involve comprehensive reading.  Please **do not skip anything** to save time or speed things up. We have almost unlimited time and unlimited token use.  The priority here is **quality** and **instruction following** and **not** speed.  An example of where this was not followed was when the Agent said "This is taking a while, so let me speed things up by focusing on what's actually relevant" at which point I interrupted and said "Don't speed up.  Do it properly please.".  

## Don't Invent Things That Aren't In The Spec

If something critical isn't defined in the spec: Stop, Ask The Human.  Don't just make stuff up.  Example: while doing a story to create and End To End test the output directory wasn't defined in the spec, so AI decided to make it "docs/mission-docs/<missionId>/project-output/".   In a later story for implemnting the Agents as it wasn't in the spec a new AI decided to just use "current working directory".  This made the system have a bug where the test would check in one directory and the code would write it to a different directory.  (NOTE: I'm not sure how to enforce this - maybe by having a Story Checking Agent that checks that everything before implementation in a Story Definition has a reference to the original spec where that thing was defined - and if the reference isn't there - FAILS the review???  I doubt that this rule will actually stop this happening...)