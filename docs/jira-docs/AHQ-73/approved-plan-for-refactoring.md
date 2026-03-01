# AHQ-73: Refactor - Make Override Of Default Reversal String Less Confusing/Messy

## Context

When running `pnpm demo:agentic-hq-cli:string-reversal --string-to-reverse="custom string"`, the output shows **both** the default string AND the user's string being passed:

```
--string-to-reverse='this is the default string to reverse' '--string-to-reverse=custom string'
```

The override works (Commander takes the last value), but it looks confusing/messy. The root cause is that the default value is hardcoded in the **pnpm script** (package.json line 28), and pnpm can only **append** user args — it cannot replace them.

## Solution: Move the default to where it belongs

The default value `'this is the default string to reverse'` should live in the code that **uses** it (`string-reversal-demo-cli.ts`), not in the pnpm script that **invokes** it. This way, when no `--string-to-reverse` is provided, the CLI uses its built-in default. When the user provides one, it cleanly overrides — no duplication.

## Files Modified (3 files)

### 1. `string-reversal-demo-cli.ts` — Add default value as a named constant

**File:** `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts`

Added a constant and changed `requiredOption` to `option` with that default:

```typescript
const DEFAULT_STRING_TO_REVERSE = 'this is the default string to reverse';

.option('--string-to-reverse <string>', 'The string to reverse', DEFAULT_STRING_TO_REVERSE)
```

### 2. `package.json` — Remove hardcoded defaults from demo scripts

**File:** `package.json`

- Updated comment to say "override the built-in default"
- Removed `-- --string-to-reverse='this is the default string to reverse'` from `demo:agentic-hq-cli:string-reversal`
- Removed `--string-to-reverse='this is the default string to reverse'` from `demo:plugin-direct:string-reversal`

### 3. `docs/dev/npm-commands.md` — Update stale demo section

**File:** `docs/dev/npm-commands.md`

- Updated Demo CLIs section to reflect current script names (was referencing deleted `pnpm hello-world` and `pnpm demo:string-reversal`)
- Fixed E2E test section that incorrectly showed a demo script instead of `pnpm test:e2e:agentic-hq-cli-string-reversal`

## Files NOT Needing Changes (confirmed)

- `src/cli/agentic-hq-cli.ts` — passthrough mechanism works correctly; empty `cmd.args` handled fine
- `src/cli/command/workflow-command.ts` — already handles empty passthroughArgs
- Unit and E2E tests — unaffected by this change

## Verification

- `pnpm validate` passes (typecheck + lint + format + unit tests)
- Manual test: override with custom string shows only ONE `--string-to-reverse` (no duplication)
- Manual test: default string (no args) uses built-in default correctly
