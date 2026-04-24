# GREEN Phase Implementation Plan: AHQ-120 (e2e test)

## Context

The RED-phase e2e test
(`temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts`)
currently fails with `ENOENT` because the four Classwitch Override wiring files do not exist yet
in project 002. The test installs the override globally via `pnpm link --global`, creates a fresh
temp workspace, runs `temp-agentic-hq-with-colours list`, and asserts:
- green-wrapped header `"Available workflows (with colours):"`
- blue ANSI code somewhere (AHQ section)
- red ANSI code somewhere (user section)
- `create-workflow` visible (proves A's workflow discovery still works through the override)

Project 001 (`test-agentic-hq-classwitch-override-project-001-with-colours/`) already contains
working versions of all four files from the AHQ-117 temp test. The GREEN-phase work is:
lift those four files, apply the minimal deltas needed (file naming is identical, paths are
the same depth — `temp-test-workspaces/<proj-dir>/`), and add optional-with-defaults to the
impl's constructor so that classwitch's no-arg `new Klass()` call site works at e2e run-time.

Once GREEN passes, REFACTOR will tackle README, eslint.config.js, prettier config, how-to-guide
review — those are **NOT** part of this GREEN phase per the Jira.

## Jira Requirements (Numbered)

Going through the key details in AHQ-120 and the RED-phase spec that must be satisfied by
the GREEN code (REFACTOR-phase deliverables explicitly excluded):

1. **Override project binary is globally linkable** — install script must exist at
   `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` and run `pnpm install && pnpm link --global`.
   → [Step 3: Create install script]
2. **Global binary name** — `temp-agentic-hq-with-colours` (package.json `bin` field already points to
   `bin/temp-agentic-hq-with-colours.cjs`, so the .cjs file must exist).
   → [Step 4: Create bin wrapper]
3. **Bin wrapper uses tsx from local node_modules** — must `execFileSync` `node_modules/.bin/tsx` with
   `src/cli/main.ts` and forward `process.argv.slice(2)`.
   → [Step 4: Create bin wrapper]
4. **Bin wrapper MUST NOT set `AGENTIC_HQ_WORKSPACE_ROOT`** — load-bearing absence (AHQ-117 Add-On §9).
   Comment block in file must explain why.
   → [Step 4: Create bin wrapper — design-intent comment]
5. **`main.ts` side-effect-imports override registry BEFORE `import { app } from 'agentic-hq/cli'`** —
   import order is load-bearing. Comment block in file must explain why.
   → [Step 5: Create main.ts]
6. **Override registry calls `rootServiceRegistry.overrideExistingServices({ WorkflowSearchResultsImpl: ... })`** —
   registers `ColourfulWorkflowSearchResultsImpl` as the replacement service. Service key is the concrete class name
   (not the interface name). Comment block must explain this.
   → [Step 6: Create override-registry.ts]
7. **`ColourfulWorkflowSearchResultsImpl` constructor must accept no args** — classwitch calls
   `new WorkflowSearchResultsClass()` in `agentic-hq/src/cli/app.ts:72`, so constructor args
   must be optional with default `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` instances (both
   exported from `agentic-hq`). Captured as "REFACTOR NOTE" in the impl file during unit-GREEN.
   → [Step 7: Add optional-with-defaults to impl constructor]
8. **Header text** — `"Available workflows (with colours):"` (WITH colon, per resolved Q1=b). Already
   correct in the impl file. → N/A (no change).
9. **ANSI codes emitted unconditionally** — no TTY detection, no `FORCE_COLOR` handling. Already correct
   in the impl file. → N/A (no change).
10. **`create-workflow` must appear in listing** — proves A's workflow discovery still works through
    the override. This is an emergent property: if wiring is correct, agentic-hq's own workflow
    discovery populates the `ahqWorkspace` section → `getWorkflowListingString()` returns it → it
    ends up in the blue-wrapped AHQ section. Nothing extra to implement.
    → [Verification: automated e2e assertion, no separate step]
11. **`package.json` e2e test script** — `"test:e2e": "vitest run --config vitest.e2e.config.ts"`.
    Already present (added in RED phase).
    → N/A (no change).
12. **`vitest.e2e.config.ts`** — already present (RED phase).
    → N/A (no change).
13. **Design-intent comments already present in 001** — lift verbatim (per feedback memory
    "Classwitch Root Project files must comment the design intent"; same principle for Override
    Project files, as all four files have 001 exemplars with full comment blocks).
    → [All four file steps: lift comments verbatim, minor wording updates for AHQ-120 context]
14. **Not for publishing, practice run for AHQ-121/122** — no GitHub push, no npm publish, `private: true`
    in package.json already. → N/A (already correct).

**Explicitly OUT OF SCOPE for this GREEN phase (deferred to REFACTOR per Jira/RED doc):**
- `README.md`
- `eslint.config.js`
- prettier config (`.prettierrc` etc.)
- How-to-guide review/TODO markers
- Extending `pnpm validate` to include e2e

## Project Design Requirements Compliance

File found at `docs/dev/project-design-requirements.md`. Relevant requirements and how this plan
addresses them (noting that AHQ-120 introduces **no new concepts** — it re-uses
`WorkflowSearchResults`, `Workspace`, `WorkflowRegistry` which were all established in AHQ-106/117):

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|-------------------|---------------------------|-------|
| D.1 | Interface/class pair per concept | Step 7: `ColourfulWorkflowSearchResultsImpl implements WorkflowSearchResults` | Naming follows `Impl`-suffix convention. Third-party devs can easily write their own `CustomColourfulWorkflowSearchResults` to swap us out. |
| D.2 | Tell, don't ask | Step 7: impl asks each `Workspace` to `getWorkflowListingString()`, doesn't extract/manipulate state | Already correct in existing impl file. No change needed. |
| D.3 | Avoid cached state | Step 7: workspaces stored once in constructor, listing string freshly derived per call | Already correct. The optional-with-defaults change does NOT introduce caching — it only provides defaults for the two workspace refs which are stored the same way. |
| D.4 | Classwitch Root/Override files carry "why" design-intent comments | Steps 4, 5, 6: `bin/*.cjs`, `main.ts`, `override-registry.ts` lifted verbatim from 001 WITH their comment blocks | Feedback memory `feedback_classwitch_root_project_comments.md` covered. |
| D.5 | Concept Table / Data Dictionary / ELD during planning | N/A for this Jira | The Jira introduces no new concepts — it's a 4-file wiring job reusing AHQ-117's concept set (`Workspace`, `WorkflowRegistry`, `WorkflowSearchResults`). Design-requirements doc explicitly says "balance" and "no new concepts" is a valid reason to skip a full ELD. |
| D.6 | Constructor injection + optional-with-defaults | Step 7: `ahqWorkspace?: Workspace = new AhqWorkspaceImpl()`, `currentUserWorkspace?: Workspace = new CurrentUserWorkspaceImpl()` | Matches the pattern in `WorkflowSearchResultsImpl` (no-arg constructor internally building defaults), but preserves the injected-stubs path for unit tests. |

**GREEN-phase minimalism note**: this GREEN implementation does the minimum necessary to make the
e2e test pass. No extra abstractions, no helper classes for ANSI codes, no `ColourConstants` value
objects. ANSI-string wrapping is arguably a concept candidate (`ColouredSection`?), but that would
be premature — every design requirement that already applies (D.1-D.4, D.6) is met, and the test
passes without new abstractions. REFACTOR can revisit if the colour handling turns out to duplicate
elsewhere; for GREEN, ugly-but-working is acceptable.

## Implementation Steps

### Step 0: Save the approved plan

Copy this plan to
`/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`
BEFORE doing anything else.

### Step 1: Run the e2e test once to confirm RED

Run `pnpm test:e2e` in project 002 — expect the same ENOENT failure documented in the RED doc.
This is a "before" measurement per CLAUDE.md "always run code before and after modifications".

Command:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120 && pnpm test:e2e
```

### Step 2: Run the unit tests once as a baseline

Unit tests were passing at end of unit-GREEN — quick sanity check that they are still passing
before any changes. Same "before" measurement principle.

Command:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120 && pnpm test:unit
```

### Step 3: Create the install script

Path: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`

Lift **verbatim** from 001's
`temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`.
Content is identical — same override name, same cd logic, same corepack check, same smell warning.

After creating, `chmod +x` it so it's bash-executable.

### Step 4: Create the bin wrapper

Path: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/bin/temp-agentic-hq-with-colours.cjs`

Lift **verbatim** from 001's `bin/temp-agentic-hq-with-colours.cjs` (48 lines). The full design-intent
comment block (explaining why `process.env[…WORKSPACE_ROOT…]` is deliberately NOT set, referencing
AHQ-117 Add-On §9) must be included — that comment is load-bearing so a future contributor doesn't
re-introduce the silent-failure bug.

After creating, `chmod +x` it so it's node-executable.

### Step 5: Create the main.ts

Path: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/cli/main.ts`

Lift **verbatim** from 001's `src/cli/main.ts` (31 lines). The 3-line body plus the 25-line header
comment explaining the load-bearing import order. Order is:
```
import '../classwitch-registry/override-registry.js';
import { app } from 'agentic-hq/cli';
app.run();
```

### Step 6: Create the override registry

Path: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/classwitch-registry/override-registry.ts`

Lift **verbatim** from 001's `src/classwitch-registry/override-registry.ts` (47 lines). The full
comment block (explaining why this file exists as a side-effect-only import, why the key is the
concrete class name `WorkflowSearchResultsImpl` not the interface name, and the load-bearing import
order in `main.ts`) must be included.

### Step 7: Add optional-with-defaults to ColourfulWorkflowSearchResultsImpl constructor

Path (edit existing):
`temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

The unit-GREEN left a REFACTOR NOTE in the file:
> REFACTOR NOTE: constructor args are required in GREEN (strict minimum to pass the unit tests).
> Optional-with-defaults (needed for Classwitch's no-arg `new Klass()` call site) will be added in
> the e2e GREEN cycle when that wiring is actually exercised.

This is that cycle. The concrete change:

1. Import `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` as values (currently types aren't imported
   as values — they're type-only imports).
2. Change constructor signature from:
   ```ts
   constructor(
     private readonly ahqWorkspace: Workspace,
     private readonly currentUserWorkspace: Workspace
   ) {}
   ```
   to:
   ```ts
   constructor(
     private readonly ahqWorkspace: Workspace = new AhqWorkspaceImpl(),
     private readonly currentUserWorkspace: Workspace = new CurrentUserWorkspaceImpl()
   ) {}
   ```
3. Update the REFACTOR NOTE comment block to reflect that optional-with-defaults has now been added.
   Per the "Do not delete existing comments" feedback memory, I will keep the context/history part
   of the comment and update the tense: "was added in the e2e GREEN cycle" rather than "will be added".
   Do NOT remove the explanation of WHY optional-with-defaults is needed (classwitch no-arg call site).

This must NOT break the existing unit tests — they pass two stub workspaces as positional args,
which still works identically when the parameters are optional (optional params with defaults
still accept positional values).

### Step 8: Run the e2e test — expect GREEN

Command:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120 && pnpm test:e2e
```

Expected: PASS. If it fails, read the log at `/tmp/e2e-temp-agentic-hq-with-colours-list.log`,
read the error carefully, fix only what the failure message points to, re-run. No speculative
changes.

Known risk during e2e: `pnpm link --global` mutates global pnpm state — the test is smelly
(AHQ-79). This is acceptable per the Jira.

### Step 9: Run the unit tests again — expect all still passing

The constructor change is optional-with-defaults, which is source-compatible with the unit tests
(they pass positional args). Still verify.

Command:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120 && pnpm test:unit
```

Expected: 2/2 pass (both Test 1 `wraps the header in green, AHQ section in blue, and user section
in red ANSI codes` and Test 2 `registerWorkflowsWith delegates to both workspaces with the registry`).

### Step 10: Run `pnpm validate` — expect green

Command:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120 && pnpm validate
```

Expected: typecheck passes + 2/2 unit tests pass. (Note `validate` deliberately does NOT run e2e
per the RED doc — extending validate to include e2e is a REFACTOR/VALIDATE decision, not GREEN.)

### Step 11: Re-read `03-jira-minimal-implementation.md` command instructions — TODO

After step 10 passes, re-read the command file
`/Users/stevepersonal/.claude/plugins/cache/agentic-hq/commands/agentic-hq-demos-plugin/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md`
(or wherever the command lives — will re-read via grep) and execute the remaining steps 7c onwards:
- Handle any manual acceptance tests from Jira AC (Step 7c)
- Create the GREEN phase document at
  `docs/jira-docs/AHQ-120/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` (Step 8)
- Add comment to Jira AHQ-120 (Step 9)
- Present to human (Step 10)
- Write command-output.json (Step 11)
- Self-terminate (Step 12)

## Critical Files To Be Modified or Created

**Created (new):**
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/bin/temp-agentic-hq-with-colours.cjs`
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/cli/main.ts`
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/classwitch-registry/override-registry.ts`

**Modified:**
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`
  (constructor signature + REFACTOR NOTE tense update)

## Reused code / references

- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/bin/temp-agentic-hq-with-colours.cjs` — verbatim source for Step 4
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/cli/main.ts` — verbatim source for Step 5
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/classwitch-registry/override-registry.ts` — verbatim source for Step 6
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` — verbatim source for Step 3
- `agentic-hq/src/index.ts` — confirms `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` are exported as values (needed for Step 7)
- `agentic-hq/src/cli/app.ts:71-72` — confirms the no-arg `new WorkflowSearchResultsClass()` call site that requires optional-with-defaults in Step 7

## Verification

- **Automated**: `pnpm test:e2e` passes all 5 assertions (green header literal, blue ANSI, red ANSI, plain header text, `create-workflow`).
- **Automated**: `pnpm test:unit` passes 2/2 tests (no regression from Step 7's constructor change).
- **Automated**: `pnpm validate` passes (typecheck + unit tests).
- **Manual review**: confirm all four created files carry their design-intent comment blocks (D.4).
- **Manual review**: confirm the REFACTOR NOTE in the impl file has been updated (not deleted — per the "do not delete comments" feedback memory).

No manual acceptance tests from the Jira for this e2e phase — the e2e test itself IS the acceptance
test. Manual-test handling is handled by the REFACTOR/VALIDATE phases (and the how-to-guide review).
