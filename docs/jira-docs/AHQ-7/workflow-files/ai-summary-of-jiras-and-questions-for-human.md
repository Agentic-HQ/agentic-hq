# AI Summary: AHQ-7

**Jira**: [AHQ-7](https://agentic-hq.atlassian.net/browse/AHQ-7)
**Title**: Add Code Quality Tools (Linting, Prettier etc)
**Status**: Transitioned to In Progress
**Generated**: 2026-01-23

---

## My Understanding of This Task

This Jira is about adding code quality tooling (ESLint and Prettier) to the main Agentic HQ project. The goal is to have automated formatting and linting checks that run as part of the `pnpm validate` command, ensuring code quality is maintained consistently across the project.

The key deliverables are:
1. **ESLint v9 Flat Config** - Using the latest stable ESLint with TypeScript support
2. **Prettier 3.x** - For code formatting
3. **pnpm scripts** - `lint:check`, `lint:fix`, `format:check`, `format:fix`
4. **Updated `validate` script** - Should run typecheck + lint + unit tests (but NOT auto-fix)
   - **Note**: Currently `validate` only runs `pnpm typecheck` - it's missing unit tests too!
   - Final command should be: `pnpm typecheck && pnpm lint:check && pnpm test`
5. **Update commit.md** - Add a requirement to run `pnpm validate` before committing

**Important constraint**: The Jira explicitly states that certain strict rules should be **disabled/downgraded** during this phase because the system is still being developed empirically:
- `@typescript-eslint/no-explicit-any` - should be warn, not error
- `@typescript-eslint/no-floating-promises` - should be warn, not error
- `no-console` - should be warn, not error

This is intentional and documented - the rationale is that enforcing strict typing/async discipline now would force premature design decisions. These rules will be re-enabled later (tracked in AHQ-5).

The Jira references config files from the Spike-00 project as a starting point, but I notice the Spike-00 config has these rules set to **error** (strict), which contradicts what the Jira says to do. I need to clarify this with you.

## Research Findings

### ESLint v9 Flat Config Ignores (Perplexity MCP - 2026-01-23)

I asked Perplexity about recommended ESLint v9 ignores for TypeScript Node.js projects. Summary:

| Pattern | Status | Notes |
|---------|--------|-------|
| `dist/**` | **Keep** | Standard for compiled output |
| `coverage/**` | **Keep** | Standard for test coverage |
| `**/*.d.ts` | **Keep** | Declaration files shouldn't be linted |
| `node_modules/**` | **Redundant** | Use only `**/node_modules/**` which covers both root and nested |
| `**/node_modules/**` | **Keep** | Covers root + nested (pnpm workspaces) |
| `scripts/**` | **Optional** | Only if scripts contain unlintable code |

**Recommendation**: The attached config has both `node_modules/**` AND `**/node_modules/**` - I could simplify by removing the redundant `node_modules/**`. Otherwise the ignores are good.

### Review of Attached eslint.config.FOR_MAIN_PROJECT_START.mjs

I've reviewed the attached file and it's **excellent** - ready to use with one minor simplification:

**What's great:**
- Relaxed rules (`no-floating-promises`, `no-explicit-any` commented out; `no-console` set to `warn`)
- Outstanding inline documentation explaining WHY each relaxation exists
- Clear references to AHQ-5 for when these will be tightened
- Test files have `'no-console': 'off'` (appropriate for test debugging)
- vitest/valid-expect disabled with explanation of the plugin bug
- Prettier conflict prevention via `eslint-config-prettier` (must be last)

**Suggested minor change:**
- Remove redundant `'node_modules/**'` line (line 31) since `'**/node_modules/**'` already covers it

**Verdict**: Use this file as `eslint.config.mjs` with that one simplification.

## Questions for Human

### Question 1: Spike-00 config has strict rules, but Jira says to relax them - which should I follow?

The Jira description says:
> "The following rules are intentionally **downgraded or disabled** during this Epic:
> - `@typescript-eslint/no-explicit-any`
> - `@typescript-eslint/no-floating-promises`
> - `no-console`"

However, the Spike-00 `eslint.config.mjs` I read has these set to `error`:
```javascript
'@typescript-eslint/no-floating-promises': 'error',
'@typescript-eslint/no-explicit-any': 'error',
'no-console': 'error',
```

Which configuration should I use?
- **Option A**: Follow the Jira text - set these to `warn` (allowing flexibility during early development)
- **Option B**: Follow the Spike-00 config - set these to `error` (stricter)

**Human's Response**:
> A please - and make sure to include the full comments provided that explain why.  I've put the file that was attached to the Jira in docs/jira-docs/AHQ-7/workflow-files/jira-attachments/eslint.config.FOR_MAIN_PROJECT_START.mjs

---

### Question 2: The Jira mentions an attachment file - do you have its contents?

The Jira has an attachment: `eslint.config.FOR_MAIN_PROJECT_START.mjs` (5478 bytes) which I couldn't retrieve through the API.

Do you have access to this file's contents? If so, should I use it as the basis for the main project's eslint config instead of adapting from Spike-00?

**Human's Response**:
> make sure to include the full comments provided in the file that explain why.  I've put the file that was attached to the Jira in docs/jira-docs/AHQ-7/workflow-files/jira-attachments/eslint.config.FOR_MAIN_PROJECT_START.mjs  Please see whether this is what you think we should put live - or any changes?

---

### Question 3: Should tests have `no-console` allowed?

In the Spike-00 config, test files have `'no-console': 'off'` allowing console usage in tests. Should I maintain this pattern for the main project, or should tests also use the logger?

**Human's Response**:
> See section in attached file docs/jira-docs/AHQ-7/workflow-files/jira-attachments/eslint.config.FOR_MAIN_PROJECT_START.mjs about "no-console" rules being relaxed and why.

---

## Files I Reviewed

- `package.json` - Current project config; has only `typecheck` in validate script, no lint/format tools yet
- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/package.json` - Spike's package.json with full lint/format scripts to use as template
- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/eslint.config.mjs` - ESLint v9 flat config with TypeScript, import ordering, vitest rules, and Prettier conflict prevention
- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/.prettierrc` - Prettier config with sensible defaults (semi, singleQuote, 100 printWidth, etc.)
- `.claude/commands/agentic-hq-commands/commit.md` - The commit command that needs to be updated to require `pnpm validate`
- `README.md` - Currently minimal; will need commands documentation added

**Key findings from Spike-00 config:**
- ESLint uses `typescript-eslint` parser with project-aware type checking
- Import ordering enforced with `eslint-plugin-import`
- Vitest rules enabled for test files
- `eslint-config-prettier` used to prevent conflicts
- Ignores: `dist/`, `coverage/`, `*.d.ts`, `node_modules/`, `scripts/`

**AI Response to Human's Question about Ignores:**
> I asked Perplexity MCP - see Research Findings section above. Summary: The ignores are good and NOT outdated. Only change: remove redundant `node_modules/**` since `**/node_modules/**` covers it.

- Test files have relaxed rules (no-console off, vitest/valid-expect off due to bug)

## Ready for Next Step

Once you've read this file and answered the questions and completed your discussion with me about the Jira, please run the next command (in this session so context is retained):
```
/agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test AHQ-7 unit
```
