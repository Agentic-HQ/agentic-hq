# AI Summary: AHQ-6

**Jira**: [AHQ-6](https://agentic-hq.atlassian.net/browse/AHQ-6)
**Title**: Project/Stack Setup & Hello World Typescript
**Status**: Transitioned to In Progress
**Generated**: 2026-01-19 20:36 UTC

---

## My Understanding of This Task

This is the **first real development code** of the Agentic HQ project (not a spike). The goal is to set up a modern TypeScript project stack at the root of the repository with a simple "Hello World" program that demonstrates the project structure, testing conventions, and build tooling.

The deliverable is a TypeScript project that:
1. Has a `HelloWorld.ts` file with a function that returns "Hello world"
2. Can be run via `pnpm hello-world` to print "Hello world" to console
3. Has a unit test (`pnpm test:hello-world`) that tests the HelloWorld function
4. Has a smoke test (`pnpm smoke:hello-world`) that actually runs the CLI and verifies the output
5. Uses the latest stable versions of the tech stack (TypeScript 5.9.x, Node.js 22.x, pnpm 10.x, Vite 7.x, Vitest 4.x)
6. Uses separate Vitest config files per test type (vitest.unit.config.ts, vitest.smoke.config.ts)

**What's explicitly OUT of scope:**
- Linting/formatting (AHQ-7)
- Splitting into packages/components (too early)
- Gold-plating or making code "beautiful" - it should be "intentionally temporary"

**Key constraints from the Epic (AHQ-1):**
- TDD mandatory (Red-Green-Refactor)
- No scope creep - minimal tests, minimal error handling
- Code is expected to be thrown away or heavily rewritten

## Research Findings

### Library Version Verification

The Jira specified versions that Claude Code researched on Jan 16, 2026. I verified these with Perplexity:

| Technology | Jira Says | Research Confirmed | Notes |
|------------|-----------|-------------------|-------|
| TypeScript | 5.9.x | **5.9.x** | Correct. 6.0 is final JS-based, 7.0 native is experimental |
| Node.js | 22.x LTS | **22.x LTS** | Correct. Active LTS until 2027-04-30 |
| pnpm | 10.x | **10.x** | Correct. 10.28.1 is latest (9.x no longer maintained) |
| Vite | 7.x | **7.x** | Correct. Spike project uses 7.1.12 |
| Vitest | 4.x | **4.x** | Correct. 4.0 released Oct 2025, spike uses 4.0.2 |
| ESLint | v9 Flat Config | **9.x** | Correct. Flat config is default |
| Prettier | 3.x | **3.x** | Correct. 3.8.0 or 3.3.3 depending on patch |

**Verdict**: The versions in the Jira are correct and match what's already being used in the spike project at `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/`.

### Vitest 4.x Config Structure

The Jira mentions using separate config files per test type. I found in the spike project:
- `vitest.unit.config.ts` - for unit tests
- `vitest.integration.config.ts` - for integration tests
- `vitest.e2e.config.ts` - for e2e tests

For this Jira, we need:
- `vitest.unit.config.ts` - for the HelloWorld unit test
- `vitest.smoke.config.ts` - for the HelloWorld smoke test (or could be called `vitest.e2e.config.ts`)

## Questions for Human

### Question 1: Directory structure for source code

The current root `package.json` is minimal and the `src/` directory contains only experiments. Should I:

**Option A**: Create the HelloWorld code directly in `src/` at the root (e.g., `src/HelloWorld.ts`)

**Option B**: Follow the spike pattern with a `components/` structure (but this feels like over-engineering for a Hello World)

**Human's Response**:
> I've updated the Jira to rename it.  I now says: I can run: pnpm hello-world from the root of the workspace and it runs the hello-world.ts code and prints “Hello world”
Script is located at: src/misc/hello-world.ts

---

### Question 2: Smoke test naming convention

The Jira acceptance criteria says `pnpm smoke:hello-world` but also mentions `pnpm test:smoke:hello-world`. Which naming convention should I use?

**Option A**: `pnpm smoke:hello-world` (shorter, matches AC)

**Option B**: `pnpm test:smoke:hello-world` (consistent with `test:` prefix pattern)

**Human's Response**:
> pnpm test:smoke:hello-world (I've fixed the Jira mistake)

---

### Question 3: What to do with existing root package.json dependencies

The current root `package.json` has some dependencies (`claude`, `cmd-ts`, `node-pty`, `tsx`). Should I:

**Option A**: Keep these and add the new dev stack alongside them

**Option B**: Remove them if they're not needed (they appear to be from experiments)

**Option C**: Ask you about each one

**Human's Response**:
> Option A - Keep them - add a comment above them saying they are for existing scripts at: src/experiments/claude-tool-experiments/typescript

---

## Files I Reviewed

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/package.json` - Reference for the tech stack setup, pnpm scripts structure, and dependency versions. This is the most relevant reference for how to structure the new project.

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/tsconfig.json` - Reference for TypeScript configuration with strict mode, ESNext modules, and Vitest globals.

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/vitest.unit.config.ts` - Reference for Vitest 4.x config file structure with separate project configs.

- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/package.json` - Current root package.json (minimal, needs expansion).

**Key learnings from spike project:**
- Uses `"type": "module"` for ESM
- Has `engines` field specifying Node.js and pnpm versions
- Has `packageManager` field for pnpm version pinning
- Uses `workspace:*` for internal dependencies (not needed for this simple setup)
- Has a comprehensive scripts section with `validate` running typecheck + lint + test:unit
- Watch mode is explicitly disabled (causes AI test execution to hang)

## Ready for Next Step

Once you've read this file and answered the questions and completed your discussion with me about the Jira, please run the next command (in this session so context is retained):
```
/agentic-hq-commands:workflow:jira-story-workflow:02-write-failing-tests AHQ-6
```
