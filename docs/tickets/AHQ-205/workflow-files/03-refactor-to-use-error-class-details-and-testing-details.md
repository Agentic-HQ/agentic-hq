# AHQ-205 — Refactor To Use An Error Class: Details And Testing Details

> **Ticket:** [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — *Bug: agentic-hq CLI
> Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root*
> **Type:** Sub-task (Bug) · **Parent:** [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195)
> **Refactored:** 2026-08-16 (Claude Fable 5), on top of the fix committed as `f932cc0` and
> described in [`02-details-of-final-implementation.md`](02-details-of-final-implementation.md).

**Status (2026-08-16):** refactor **complete and verified**; **no user-visible behaviour change**.
`pnpm validate` green (37 files / 178 unit tests, +2), both `tests/integration/bin/*` files green,
all real runs (dev wrapper from every fixture; rebuilt prebuilt wrapper for the filed scenario)
identical to before. **Not yet committed** — 6 modified files + 1 new directory (`src/workflow-discovery/errors/`);
run `/git:02-…` when ready.

---

## 1. Why This Refactor

The committed fix (02 doc, §1 edit 1) made `WorkflowRegistryImpl.register()` **silently return** when
the short name was already a subcommand. The human's view, reaffirmed after hearing the case
against changing it: a duplicate `shortId` **is an exception to normal operation** — no user wants
two workflows with the same `shortId`, and even the U = P-adjacent case (listing inside the AHQ repo
with the npm build present) is "a slightly weird, unknown situation". A silent return was too muted a
response and an anti-pattern; the registry should say so by name and let the caller decide.

The assessment given at the time (recorded in the 02 doc, §6) argued the opposite on proportionality
grounds — a duplicate is the expected outcome of the "first wins" policy, no caller can do anything
but continue, and it adds a `try/catch` on a hot path. Having built it, the honest verdict is
**marginally in favour of this version**, for two things that assessment underweighted:

1. **The contract is now explicit and enforceable.** `WorkflowRegistry.register()` documents, next
   to its signature, "short names are unique; a duplicate is rejected by name". A future second
   `WorkflowRegistry` implementation (or test double) gets that right by reading the interface; the
   silent version relied on one JSDoc sentence on one implementation.
2. **The policy has a proper owner.** Registry = *enforces uniqueness*. `PluginImpl` = *decides*
   "skip it, the first registration wins, carry on". The registry no longer knows that skipping is
   acceptable — which it had no business knowing — and the error carries the colliding name so a
   future caller could log, count or refuse instead of skip without touching the registry.

The costs, stated plainly: exception-as-control-flow on a path that runs on every invocation in
the filed scenario (one `try/catch` per workflow); and any `WorkflowSearchResults` implementation
now carries an implicit obligation to tolerate the throw (which is why test P1 had to stop using a
stub that bypassed `PluginImpl` — see §3). Neither is visible to a user.

**Decision (the human, 2026-08-16): keep it.**

---

## 2. What Changed — The Code As Landed

Three production files modified, one new file. Behaviour identical to `f932cc0`.

### 2.1 New: `src/workflow-discovery/errors/short-id-already-registered-error.ts`

The first custom `Error` class in `src/`, so this sets two conventions:

- **Name:** `…Error` (not `…Exception`) — the JS/TS idiom for a class that `extends Error`.
- **Home:** a new `src/workflow-discovery/errors/` directory. It was first placed in
  `workflow-discovery/interfaces/` beside the `WorkflowRegistry` contract it belongs to; the human
  pointed out that directory is for interfaces, not errors, and proposed `errors/`. Noted tension:
  an `errors/` directory groups by code-type, which the repo's "directory structure by entity, not
  code-type" preference argues against — but `interfaces/` in this same package already sets that
  precedent, and the *concept* directory (a registry directory) does not exist (its interface is in
  `interfaces/`, its implementation in `src/cli/`), so `errors/` is the consistent, discoverable
  choice. It cannot live in `src/cli/` beside `WorkflowRegistryImpl`: `PluginImpl`
  (workflow-discovery) catches it, and discovery must not import from the CLI layer.

```ts
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

/**
 * ShortIdAlreadyRegisteredError — Thrown by a WorkflowRegistry when it is
 * asked to register a workflow whose short name is already a registered
 * subcommand (AHQ-205). Two workflows can never share a `shortId` on the
 * CLI, so the registry rejects the second one by name and leaves the
 * decision about what to do to its caller (see PluginImpl.registerWorkflowsWith).
 *
 * SRP Does: Carry the colliding short name and a message naming it.
 * SRP Knows About: The WorkflowShortName that collided.
 * SRP Knows Nothing About: Which registration came first, why the names
 * collided, or what the caller decides to do about it.
 */
export class ShortIdAlreadyRegisteredError extends Error {
  constructor(private readonly shortName: WorkflowShortName) {
    super(`shortId '${shortName.toString()}' is already registered as a subcommand`);
    this.name = 'ShortIdAlreadyRegisteredError';
  }

  /** Return the short name that was already registered. */
  getShortName(): WorkflowShortName {
    return this.shortName;
  }
}
```

It carries the `WorkflowShortName` **value object** (not a raw string) and exposes it through a
getter, matching the codebase's stored-primitives-are-value-objects and getter conventions.
`tsconfig` targets ES2023, so `instanceof` on the subclass is reliable.

### 2.2 `src/cli/workflow-registry-impl.ts` — the guard now throws

```ts
  /**
   * Register a Commander subcommand for the given workflow.
   *
   * @throws {ShortIdAlreadyRegisteredError} if the short name is already a subcommand — the
   * first registration wins (AHQ-205). Thrown by name here rather than left to Commander's
   * generic `cannot add command 'x' as already have command 'x'`, so the caller can recognise
   * and handle exactly this case. (Commander's own duplicate check also matches aliases;
   * nothing here uses aliases — add `cmd.aliases().includes(...)` to the check if that changes.)
   */
  register(workflow: AhqWorkflow): void {
    const shortName = workflow.getShortName();
    const shortNameString = shortName.toString();
    if (this.program.commands.some((cmd) => cmd.name() === shortNameString)) {
      throw new ShortIdAlreadyRegisteredError(shortName);
    }
    // ...unchanged: description, fullCommand, this.program.command(shortNameString)...
```

SRP header: *Does* now reads "…is rejected with ShortIdAlreadyRegisteredError — the first
registration wins and is never replaced (AHQ-205); what to do about the rejected one is the
caller's decision" (was "silently not registered").

### 2.3 `src/workflow-discovery/interfaces/workflow-registry.ts` — the contract says so

```ts
export interface WorkflowRegistry {
  /**
   * Register a workflow as a CLI subcommand.
   *
   * @throws {ShortIdAlreadyRegisteredError} if the workflow's short name is already
   * registered; the existing registration is left untouched.
   */
  register(workflow: AhqWorkflow): void;
}
```

SRP *Does* gains "rejecting (by throwing ShortIdAlreadyRegisteredError) a workflow whose short name
is already registered — two workflows can never share a `shortId` on the CLI"; *Knows About* gains
"short names must be unique among registrations"; *Knows Nothing About* gains "what the caller does
about a rejected registration".

### 2.4 `src/workflow-discovery/plugin/plugin-impl.ts` — the direct caller decides

```ts
  /**
   * Register each discovered workflow with the registry. A workflow the registry rejects
   * because its short name is already registered is skipped — the first registration wins
   * (AHQ-205) and `agentic-hq list` shows the loser as DISABLED — and registration carries
   * on with the next workflow. Any other error propagates.
   */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    for (const workflow of this.getWorkflows()) {
      try {
        registry.register(workflow);
      } catch (error) {
        if (error instanceof ShortIdAlreadyRegisteredError) {
          continue;
        }
        throw error;
      }
    }
  }
```

SRP header: *Does* gains "skipping any the registry rejects as already registered (first
registration wins, AHQ-205) and carrying on with the rest"; *Knows About* gains "that a
WorkflowRegistry signals a duplicate short name with ShortIdAlreadyRegisteredError"; *Knows Nothing
About* now says "how the registry creates subcommands" (was "how registration works" — it now knows
one thing about it).

### 2.5 Shape of the design, in one line

Throw at the point of knowledge (`WorkflowRegistryImpl`, the only class that can see the subcommand
table), handle at the point of decision (`PluginImpl`, the loop that owns "next workflow"), propagate
everything else. Nothing above `PluginImpl` catches it; nothing returns a status code as well.
Layering arrow unchanged: the error lives in `workflow-discovery/`, is thrown by `cli/` and caught
by `workflow-discovery/plugin/` — CLI → discovery, never the other way.

### 2.6 What did NOT change

`WorkflowSearchResultsImpl` (local-first order), `ClaudeCommandBuilder` (user's `--plugin-dir` first),
`ListingFormatter` / `colors.ts` (the DISABLED flag and its first-claim walk), `agentic-hq-program.ts`
(`list` registered first, `LIST_SUBCOMMAND_NAME` exported), `StubWorkflowRegistry` (still a plain
recording stub — S1 relies on it not deduping), all fixtures, the integration test, the dev-doc
sentence. Every AHQ-205 comment elsewhere ("WorkflowRegistryImpl keeps the first registration of a
short name", "what is flagged DISABLED here is exactly what registration skipped") was re-read and
still holds.

---

## 3. Testing Details

Everything here was executed; every quoted observation is from a real run. TDD throughout — each
changed or new test was run **before** the production change and seen failing for the stated
reason; no test was edited between its RED run and its post-implementation run. (Exception,
deliberate and stated: P1 was *re-expressed before* GREEN because it would otherwise have gone red
for the wrong reason — see 3.1.)

### 3.1 Tests changed and added

| # | File | Test (abridged) | What happened |
| --- | --- | --- | --- |
| R1′ | `tests/unit/cli/workflow-registry-impl.unit.test.ts` | should throw ShortIdAlreadyRegisteredError for a second workflow with the same short name, keeping the first | **Re-expressed** from R1: `not.toThrow()` → `toThrow(ShortIdAlreadyRegisteredError)` + `toThrow("'add-feature'")` (message names the shortId). Kept unchanged: exactly one `add-feature` subcommand; `parseAsync` runs the **first** one's full command. |
| R2′ | same | should throw ShortIdAlreadyRegisteredError for a name the program already has (a workflow named "list" does not shadow the built-in) | **Re-expressed** from R2: `not.toThrow()` → `toThrow(ShortIdAlreadyRegisteredError)`. Kept: built-in `list` action runs, `builder.build` never called. |
| PL1 | `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts` | should skip a workflow the registry rejects as already registered and still register the rest | **New.** A `RejectingWorkflowRegistry` (records like the stub, but throws `ShortIdAlreadyRegisteredError` for `reversal`) over the standard fixture's `test-plugin-alpha` → no throw; registered short names `=== ['math']`. |
| PL2 | same | should let any other registry error propagate unchanged | **New**, negative control: a registry throwing `new Error('registry is on fire')` → `registerWorkflowsWith` throws that same error. |
| P1′ | `tests/unit/cli/agentic-hq-program.unit.test.ts` | should survive a discovered workflow named "list", keep the built-in list, and still register the others | **Re-expressed** from P1. The old P1's stub `WorkflowSearchResults` called `registry.register` directly — bypassing `PluginImpl`, where the handling now lives — so under the throwing design it would have failed for the wrong reason (a stub that violates the new contract, not a defect in `createProgram`). It now runs `createProgram` over the **real** `WorkflowSearchResultsImpl` + a tmpdir fixture holding workflows `list` and `reversal` (cwd stubbed to the fixture, U = P): no throw; exactly one `list` in `program.commands`; `reversal` registered; running `list` prints the real listing containing `Available workflows` and `DISABLED — shortId 'list'`; `builder.build` not called. Intent preserved and strengthened — it now exercises register → reject → skip → listing end to end. |

Everything else in the suite is untouched: I1 (integration), S1/S2, C1, F1–F5, the two original
registry tests, and the five earlier program tests.

### 3.2 RED / GREEN / REFACTOR / VERIFY, as observed

| Step | Command | Observed |
| --- | --- | --- |
| RED 1 (registry, module missing) | `pnpm test tests/unit/cli/workflow-registry-impl.unit.test.ts` | `Error: Cannot find module '…/short-id-already-registered-error.js'` — file fails to load (a valid RED: the class does not exist yet). |
| — | create the error class | — |
| RED 2 (registry, not thrown) | same | R1′, R2′: `AssertionError: expected function to throw an error, but it didn't` (2 failed, 2 passed). |
| RED 3 (PluginImpl) | `pnpm test tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts` | PL1: `expected [Function] to not throw an error but 'ShortIdAlreadyRegisteredError: shortId 'reversal' is already registered as a subcommand' was thrown` (1 failed, 6 passed — PL2 passes trivially, nothing catches yet). |
| P1 re-expressed (pre-GREEN, by design) | `pnpm test tests/unit/cli/agentic-hq-program.unit.test.ts` | 6/6 green — the guard still returns silently at this point, so the real chain survives; this pins the intent before the behaviour underneath changes. |
| GREEN | registry throws; interface `@throws`; `PluginImpl` catch-and-continue → `pnpm test` on the three files | 3 files, 17/17 green. |
| REFACTOR | grep for stale wording (`silently`, `first registration`, `not registered`) across `src/` and the dev doc | all remaining mentions still true; SRP headers of the three classes updated as in §2. |
| VERIFY | `pnpm validate` | `tsc` clean, `eslint .` clean, `prettier . --check` clean, **37 files / 178 tests** (was 176: +PL1, +PL2). |
| Move to `errors/` (human review) | `mv` + repoint 4 imports + the class's own `WorkflowShortName` import; `pnpm lint:check` | 3 × `import/order` (errors/ now sorts before interfaces/) in three files all written this session — scope confirmed, so `npx eslint --fix` on **those three files only**; then `pnpm validate` again: clean, 37 / 178. |

### 3.3 Integration and real-program verification (after the move)

- `pnpm test:integration tests/integration/bin/agentic-hq-list-from-a-workspace-with-a-colliding-short-id.integration.test.ts` — 1/1 pass (I1 unchanged: dev wrapper `list` from a colliding temp workspace, exit 0, exactly one DISABLED in the package block).
- `pnpm test:integration tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` — 2/2 pass (U = P regression check).
- Dev wrapper, real runs, output compared with the pre-refactor runs in the 02 doc §3.5 —
  **identical**: `repro-workspace` (`list`: one DISABLED on the package's `add-feature`, local block
  clean; `add-feature --help`: "A LOCAL workflow that happens to share a name with a shipped one");
  `variant-b` (`plugin-two`'s `dup` flagged only); `variant-c` (`list` workflow flagged; `--help`
  still lists the built-in `list`); repo root (U = P: zero DISABLED, "Same as Agentic HQ Package").
- **The filed scenario, rebuilt:** `pnpm build` (nothing else using `release/`), then from the repo
  root `node release/bin/agentic-hq-prebuilt.cjs list` → exit 0, `add-feature` and `math` flagged in
  the release package block, local block clean; `… add-feature --help` → exit 0. Same as 02 doc §3.5.

### 3.4 What was NOT tested, and why

- **The e2e suite** — not run (needs the globally-linked binary and, mostly, live Claude); nothing in
  this refactor changes any output, and the e2e listing assertions were already checked against
  the flag in the 02 doc §3.6.
- **A live Claude run** — unchanged from the 02 doc: the flag order Claude receives is pinned by C1
  and was read off the real command line in Cycle 3; nothing here touches it.
- **A second `WorkflowRegistry` implementation honouring the new contract** — none exists; the
  contract is documented on the interface and enforced by the one implementation's tests (R1′/R2′).
- **`ShortIdAlreadyRegisteredError.getShortName()`** has no dedicated test: it is a one-line getter
  over a constructor parameter, exercised indirectly through the message assertion in R1′; a test
  that only re-reads a stored field would fail the repo's "tests must verify behaviour" rule.

---

## 4. Files Changed (this refactor only, on top of `f932cc0`)

**Source — `src/` (3 modified, 1 added)**

| File | Change |
| --- | --- |
| `src/workflow-discovery/errors/short-id-already-registered-error.ts` | **added** (new directory) |
| `src/cli/workflow-registry-impl.ts` | guard throws `ShortIdAlreadyRegisteredError`; JSDoc `@throws`; SRP header |
| `src/workflow-discovery/interfaces/workflow-registry.ts` | `@throws` on `register()`; SRP header |
| `src/workflow-discovery/plugin/plugin-impl.ts` | `try/catch` skip-and-continue in `registerWorkflowsWith`; SRP header |

**Tests — `tests/` (3 modified)**

| File | Change |
| --- | --- |
| `tests/unit/cli/workflow-registry-impl.unit.test.ts` | R1 → R1′, R2 → R2′ (`toThrow`) |
| `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts` | + PL1, PL2, `RejectingWorkflowRegistry` |
| `tests/unit/cli/agentic-hq-program.unit.test.ts` | P1 → P1′ (real discovery over a fixture) |

**Docs (2)**

| File | Change |
| --- | --- |
| `docs/tickets/AHQ-205/workflow-files/03-refactor-to-use-error-class-details-and-testing-details.md` | this file (**added**) |
| `docs/tickets/AHQ-205/workflow-files/02-details-of-final-implementation.md` | status note + closing §8 pointing here (the body is left as the record of `f932cc0`) |

Not touched: `docs/dev/how-agentic-hq-works.md` — its item-5 sentence ("first registration of a
`shortId` wins … later ones are not registered and `agentic-hq list` shows them flagged `DISABLED`")
is still exactly true.
