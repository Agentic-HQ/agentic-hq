# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic HQ is a modular open source framework for orchestrating agentic software development teams. This repository contains the core BMAD (Breakthrough Method of Agile AI-driven Development) framework installation that provides structured workflows for agile AI-driven planning and development.

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
- The framework emphasizes Test Driven Development (TDD)
- All validation and linting must pass before story completion
- The workflow is designed for AI agent orchestration with human oversight