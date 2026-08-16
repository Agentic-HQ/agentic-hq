# AHQ-200 — Review Summary

## Review Summary

A clean, disciplined refactor that does what it says. I independently re-verified the change rather
than trusting the summary: `pnpm validate` passes 4/4 (165 tests, 37 files), my own `agentic-hq list`
run differs from the pre-Stage-3 baseline by **exactly the two sanctioned label lines** and is
byte-identical to the recorded post-Stage-4 output, and my own greps confirm both the env-var
elimination (AC 1) and the rename completeness (AC 3). Four of the five acceptance criteria pass with
direct evidence.

**AC 5 is the one that does not.** The live add-feature run that produced this very review is still
relaying the **old** variable name — my `command-input.json` reads
`agentic-hq-workspace-root-dir=…`, not `ahq-package-root=…`. That is not a defect in the shipped
code (source, compiled artifact and all four command `.md` files are correctly renamed and in
lockstep); it is version skew inside a long-running process. It does mean AC 5 is **not yet
validated**, exactly as the plan itself anticipated ("running the *next* ticket's workflow naturally
satisfies this").

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| **AC 1** — `AGENTIC_HQ_WORKSPACE_ROOT` gone from the working system | My own `grep -rn AGENTIC_HQ_WORKSPACE_ROOT src tests bin docs/dev .agentic-hq/…/skills/add-feature .agentic-hq/…/commands/add-feature` → **zero hits** (exit 1). Whole-repo grep leaves only AHQ-201-scoped files (`create-workflow-cli.ts`, `add-feature-detailed-example-cli.ts`, the create-workflow command templates, a DRAFT notes file) plus historical `docs/jira-docs/` + `docs/tickets/` records — precisely the carve-out the brief sanctions | Pass |
| **AC 2** — zero functionality change | `diff temp/AHQ-200/list-baseline-before-stage3.txt <(./bin/agentic-hq.cjs list)` → **exactly 2 changed lines**, both the sanctioned labels; `diff` against `list-after-stage4.txt` → **no differences**. `pnpm validate` 4/4 | Pass |
| **AC 3** — "AHQ workspace" name gone from the code | Case-insensitive grep for `ahqworkspace\|isAhqWorkspace\|AHQ workspace\|Agentic HQ Workspace` over `src tests bin` + the add-feature skill/commands → **zero hits**. `docs/dev` returns only the three `AHQWorkspaceWorkflowSearchResult` pseudocode lines at `project-design-requirements.md:128/133/139` — the exact residue the plan declared out of scope. `REFACTOR LATER` comment present and correct at `src/workflow-discovery/workspace/ahq-package-impl.ts:25-44`, linking AHQ-206 | Pass |
| **AC 4** — the sanctioned listing label | Live `./bin/agentic-hq.cjs list`: header reads `Agentic HQ Package: /Users/…/agentic-hq`; footer reads `Local Workspace: Same as Agentic HQ Package (running from within the AHQ package directory)` — byte-for-byte the Question 5 wording | Pass |
| **Test evidence** (unit + static) | I re-ran `pnpm validate` at repo root myself: `tsc --noEmit` clean, `eslint .` clean, `prettier --check` clean, `vitest run --config vitest.unit.config.ts` → **37 files / 165 tests passed** (3.31s) | Pass |
| **Regression coverage — the injected classes** | The dedup guard is covered on **both** branches: `workspace-impl.unit.test.ts` asserts `isAhqPackage()` true when `rootDir` equals the injected root and false otherwise, and `current-user-workspace-impl.unit.test.ts` asserts zero registrations in the U = P case. The U = P branch is additionally proven **live** — my `list` run from the repo root rendered the "Same as…" line, i.e. the guard fired against a real injected root. `composition-root.unit.test.ts` now asserts the root comes from the supplied `AhqRuntimeParams` rather than a stubbed env var | Good enough |
| **Behaviour-preservation of the guard (AHQ-205 boundary)** | `workspace-impl.ts:75-77` — still plain string equality, now `this.rootDir === this.ahqPackageRoot.getPath()`. No path normalisation, no `resolve()`, no collision handling snuck in. The AHQ-205 bug is preserved untouched, exactly as the brief required | Pass |
| **Relay rename producer/parser lockstep** | `add-feature-cli.ts:55` emits `ahq-package-root=${runtime.getAhqPackageRoot().getPath()}`; each of the four `commands/add-feature/0?-*.md` files contains **6** `ahq-package-root` occurrences and **0** of the old name. Compiled artifact `release/dist/…/add-feature-cli.js` also carries the new string | Pass |
| **`docs/glossary.md` rewrite** (moved forward from Review stage) | Read in full: adds `AHQ package` + ``AHQ package root (`ahq-package-root`)`` entries, rewrites `Local workspace` to include the overlap case with the correct "Same as Agentic HQ Package" wording, keeps `Agentic HQ workspace` as a human-only term with no Deprecated section, and updates the `Where things live` row. The `//REFACTOR:` note is deleted as it instructed. Anchor `#the-three-root-concepts--in-depth-analysis` resolves correctly | Pass |
| **Shipped artifact carries no env-var readers** | `grep -rl AGENTIC_HQ_WORKSPACE_ROOT release/` → 3 files, **all markdown** (`commands/create-workflow/01`,`02`, a DRAFT notes file). `release/.agentic-hq/plugins/*/skills/` ships only `self-termination`, `add-feature`, `math-workflow` — all migrated. No executable code in the published tree reads the deleted env var | Pass |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| **AC 5 — live add-feature run with the renamed relay variable** | The `command-input.json` handed to *this* Reviewer reads `The variables used in this workflow are: agentic-hq-workspace-root-dir=…`, while `04-reviewer.md` instructs me to parse `ahq-package-root`. Cause is version skew, not a code defect: `ps` shows the live workflow process (PID 84180, `release/dist/…/add-feature-cli.js`) started **Fri 14 Aug 18:11:52** — before the Stage-2 rename — so it is running pre-rename JS in memory. Source and compiled artifact on disk are both correct. Consequence: the renamed relay has **never been exercised by a real end-to-end run**; the Implementer's evidence for it is a `--help` invocation only | **Not validated** | **Defer** — the plan already says the next ticket's add-feature run satisfies this naturally. If you want it closed inside AHQ-200 instead, a fresh `agentic-hq add-feature --ticket-id=AHQ-200-VERIFY` far enough to see Command 01's input string is a ~1-minute check | No — deferred; recorded in AHQ-195 (Sub-Task 6 addendum) |
| **Test evidence — what was *not* run** | Full `pnpm test:e2e` was **not** run (human-approved deviation, recorded in plan UPDATE 1); three targeted e2e-level tests ran in its place. `pnpm test:integration` has one failure, `tests/integration/build/publish-guards.integration.test.ts`, failing in `beforeAll`. The Implementer verified it is pre-existing by stashing all AHQ-200 changes and reproducing it on the clean tree, and that it passes 3/3 in isolation (suite-level `release/` contention with `build-determinism`). **I did not independently re-run either suite** — rebuilding `release/` while this workflow process is live is not worth the risk | **Partly unverified** (unit layer fully green; e2e layer sampled; one known pre-existing integration failure) | **Do nothing for AHQ-200** — the targeted trio covers this ticket's risk surface and the integration failure is provably unrelated. The `publish-guards`/`build-determinism` contention deserves its own ticket (Implementer already flagged it) | No — deferred; recorded in AHQ-195 (unfiled item 1, needs a Jira) |
| **Regression coverage gap — the bin wrappers** | `bin/agentic-hq.cjs` and `bin/agentic-hq-prebuilt.cjs` are the only two files where the env-var *write* was deleted, and neither is covered by anything inside `pnpm validate`. The **only** test that invokes `bin/agentic-hq.cjs` is `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts:43` — which is deliberately **red** (the AHQ-197 marker). The prebuilt wrapper's only proof is one manually-run tarball e2e outside `validate`. So nothing in CI would notice if the env var were reintroduced, or if a wrapper stopped passing `--ahq-package-root` | **Weak** | **Do now (cheap)** — add a Claude-free integration test that spawns `node bin/agentic-hq.cjs list` and asserts (a) stdout contains `Agentic HQ Package:` and `Same as Agentic HQ Package`, and (b) the spawned CLI sees `AGENTIC_HQ_WORKSPACE_ROOT` as `undefined`. That locks in AHQ-200's deletion permanently. ~20 lines, no Claude, runs in the existing `tests/integration/` suite | **Yes — applied** |
| **Highest-risk changed area — `bin/agentic-hq-prebuilt.cjs`** | It is the published entry point every installed user runs, it changed in this ticket (dual-write deleted), and it has zero coverage inside `pnpm validate` — a mistake here breaks every npm user, not just contributors. Mitigating evidence is strong though: the change is a pure deletion, `grep -rl … release/` proves no executable env-var reader survives in the shipped tree, and the tarball e2e's "list workflows via the installed bin from a clean workspace" test passed against a real `npm install -g` of the packed tarball, printing `Agentic HQ Package: …/lib/node_modules/agentic-hq` | **Medium** — high blast radius, low likelihood, already sampled | **Do nothing beyond the row above** — the tarball e2e already proved the prebuilt path; the standing gap is coverage-in-CI, which the previous row's applied test now closes for both wrappers' parameter chain | No — covered by the applied fix |
| **`create-workflow` is now definitively unusable until AHQ-201** | `skills/create-workflow/SKILL.md:18` builds its launcher around `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT"` and its comment calls it "the env var the `agentic-hq` CLI exports on every run" — no wrapper exports it any more. `create-workflow-cli.ts:52-58` also exits 1 on the missing env var. **Not a regression** — it was already broken by AHQ-197 (`create-workflow-cli.ts:60` calls `new DefaultClaudeCodeTool()` no-arg, but the constructor has required a `CompositionRoot` since AHQ-197, per the comment at `default-claude-code-tool.ts:25-31`). The catch: the **Customization Next Step** section at the bottom of this very review tells you to run `agentic-hq create-workflow -- --using=add-feature` | Known-broken, correctly scoped to AHQ-201 | **Defer to AHQ-201** — nothing to fix in AHQ-200. Flagging it only so the closing recommendation below isn't taken at face value today | No — deferred; recorded in AHQ-195 (Sub-Task 7 addendum) |
| **Improvement 1 (RECOMMENDED)** — glossary links a user doc into a ticket artifact | `docs/glossary.md` points readers at `tickets/AHQ-200/workflow-files/01-feature-brief.md#the-three-root-concepts--in-depth-analysis` for the root model. The link works, but a user-facing glossary depending on an AI-generated per-ticket workflow artifact is a durability risk — ticket dirs get archived/slimmed, and the brief is not written as reference documentation | Worth doing — small edit, protects a user-facing doc from a fragile dependency | **Defer to AHQ-199** (the docs pass) — retarget the link at `docs/dev/how-agentic-hq-works.md` once that section exists there, or inline the two-roots explanation into the glossary | No — deferred; recorded in AHQ-195 (Sub-Task 8 addendum) |
| **Improvement 2 (NOT RECOMMENDED)** — collapse the `AhqPackageRoot` dependency in `WorkspaceImpl` | `WorkspaceImpl` now takes `ahqPackageRoot` as a third constructor parameter used by exactly one method (`isAhqPackage()`), and `AhqPackageImpl.createDelegate()` passes it down even though `AhqPackageImpl` overrides `isAhqPackage()` to `return true` — so the delegate's copy is never meaningfully consulted. A tidier shape would move the comparison out of the generic workspace entirely | Not worth it now — this is precisely the `Workspace`/`PluginSource` split already parked as AHQ-206, and touching it here would violate the ticket's behaviour-preserving contract | **Do nothing** — it is already captured by the `REFACTOR LATER` comment and AHQ-206 | No — deferred; recorded in AHQ-195 (AHQ-206 addendum) |
| **Improvement 3 (NOT RECOMMENDED)** — normalise paths in `isAhqPackage()` | `workspace-impl.ts:76` compares raw strings, so a trailing slash or a symlinked invocation makes the dedup guard silently miss | Not worth it — deliberately out of scope. The brief mandates bit-for-bit behaviour preservation here and AHQ-205 owns dedup correctness; "improving" it now would blur which ticket changed behaviour | **Do nothing** — leave for AHQ-205 | No — deferred; recorded in AHQ-195 (Sub-Task 6 addendum) |

## Selected Fixes Applied

**One fix applied — the recommended regression guard for the bin wrappers (Potential Fixes row 3).**
Every other row was deferred, and each deferred item now has an entry in the parent brief (see below).

**Files touched**

| File | State |
| --- | --- |
| `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` | **added** — 2 tests, no Claude, 2.4s |
| `package.json` | changed — added the `test:integration:bin-wrapper` script, matching the existing per-file convention |
| `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` | changed — every deferred item recorded, and the brief's eight appended "Update …" sections consolidated into one actionable section (836 → 622 lines) at the human's request |

**What the test asserts.** The file is named and framed for the **durable** behaviour — the bin
wrapper is the single structural source of the package root and supplies it explicitly — not for the
retired env var, so it still reads sensibly to someone who never knew that variable existed.

1. **Permanent:** `node bin/agentic-hq.cjs list` exits 0 and renders `Agentic HQ Package: <repoRoot>`
   plus the `Same as Agentic HQ Package …` line. A missing `--ahq-package-root` is a fail-fast error
   in `DefaultAhqCommandLine`, so a rendered listing proves the whole explicit-parameter chain,
   including the dedup guard firing in the U = P case.
2. **Temporary (delete with AHQ-201):** setting `AGENTIC_HQ_WORKSPACE_ROOT` to a bogus path in the
   parent environment changes the output *not at all* — byte-identical stdout, bogus path absent —
   catching any reader of that variable being reintroduced during the migration window. Once
   AHQ-201's grep-clean AC holds, the name exists nowhere and this test becomes archaeology. The
   deletion instructions live both in the file header and in AHQ-201's addendum in the parent brief.

**Proof the test is not vacuous** (it guards behaviour that already works, so it was checked by
mutation rather than a natural RED):

| Mutation | Result |
| --- | --- |
| Removed `--ahq-package-root=${packageRoot}` from `bin/agentic-hq.cjs` | **Both tests failed** — exit 1, fail-fast error naming `ahq-package-root` |
| Made `AhqPackageImpl.getRoot()` return `process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? this.ahqPackageRoot.getPath()` | **Test 2 failed** — the bogus root surfaced in the listing; test 1 still passed, as designed |

Both mutations were reverted; `git diff` on `src/` and `bin/` is empty, and the tests are green again.

**Regression re-run of the Implementer's recorded checks — all still pass:**

| Check | Result |
| --- | --- |
| `pnpm validate` (repo root) | **4/4** — typecheck, lint, format, **37 files / 165 tests** |
| `./bin/agentic-hq.cjs list` vs `temp/AHQ-200/list-after-stage4.txt` | **byte-identical** — no observable change from the fix |
| `pnpm test:integration:bin-wrapper` (the new test, via its new script) | **2/2 passed** |

**One new deferred item surfaced while applying the fix**, and is recorded with the rest:
`.github/workflows/ci.yml` runs `pnpm validate` (unit tests only) plus a bare `agentic-hq list` step
that checks the **exit code alone** — so `pnpm test:integration` and `pnpm test:e2e` never run in CI.
The test added here is therefore a strong *local* guard, but CI still would not catch a label
regression or a reintroduced env var. That gap needs its own decision, not a silent assumption.

**Deferred Items Recorded** — every one, written into
`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` under *"Open Sub-Task Instructions"*, each
attached to the Sub-Task that owns it (future Sub-Task agents read that brief first):

| Deferred item | Recorded against |
| --- | --- |
| AC 5 — verify the renamed `ahq-package-root` relay on the next real add-feature run | Sub-Task 6 (AHQ-205) |
| Path normalisation in `isAhqPackage()` (trailing slash / symlink) | Sub-Task 6 (AHQ-205) |
| Unmigrated workflows now have no env-var supply at all; the `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT"` SKILL.md pattern | Sub-Task 7 (AHQ-201) |
| `create-workflow` is what Command 04 tells users to run next — re-verify that exact invocation | Sub-Task 7 (AHQ-201) |
| Delete the temporary (env-var-probing) half of the bin-wrapper test once the grep-clean AC holds | Sub-Task 7 (AHQ-201) |
| Retarget the glossary's link away from a per-ticket workflow artifact | Sub-Task 8 (AHQ-199) |
| `WorkspaceImpl`'s single-use `AhqPackageRoot` parameter as a concrete symptom | AHQ-206 |
| `publish-guards` / `build-determinism` contention on `release/` | **No Jira yet** — flagged for the human |
| CI runs unit tests only; integration/e2e never run | **No Jira yet** — flagged for the human |

## Final Human Confirmation

**Decision (2026-08-16, in chat):** *"approved to do recommended fixes only. All deferred things
**must** have an entry linked to the Jira description in
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md that you do now - or they will get
forgotten. Future Jira agents read that file first"*.

Applied accordingly: the single "do now" recommendation (the bin-wrapper regression test) was
implemented and verified; nothing else was touched; and every deferred finding — including the two
that have no Jira yet — was written into the parent brief before this command completed.

**Two rounds of human revisions at the approval gate, both incorporated:**

1. **Test naming and lifespan.** The human judged that
   *"bin/agentic-hq.cjs lists workflows without the legacy env var"* would mean nothing to a future
   reader who never knew the env var, and that the env-var test would become dead weight. The file,
   `describe` and both test names were reframed around the durable behaviour — the wrapper is the
   single structural source of the package root and supplies it explicitly — and the env-var test was
   marked temporary, with deletion instructions in both the file header and AHQ-201's entry in the
   parent brief.
2. **Brief consolidation.** The human asked for the accumulated update history in the parent brief to
   be cut back to what future agents actually need. Its eight appended "Update …" sections
   (2026-08-06 → 2026-08-16) were consolidated into one *Open Sub-Task Instructions* section
   organised by owning Sub-Task, 836 → 622 lines: decision narratives, superseded scheduling, the two
   Perplexity review write-ups, and instructions for the five completed Sub-Tasks were dropped;
   every still-actionable item was kept, the four now-dangling cross-references were fixed, and a
   `git log -p` pointer was left for anyone needing the reasoning back. One dropped item was verified
   closed rather than assumed — the `publishConfig.executableFiles` suggestion was implemented in
   AHQ-197 (`scripts/build-release.cjs:181`).

   Deliberately left in place, flagged to the human: *Human Update 1/2/3 + AI Response* and the
   ten-question Q&A, which carry durable design principles ("explicit, required, no defaults, no env
   vars") rather than process history.

**Final approval (2026-08-16):** the human approved the applied fixes — *"approved"*. Final state
re-verified at that point: `pnpm validate` **4/4** (37 files / 165 tests),
`pnpm test:integration:bin-wrapper` **2/2**, prettier clean across all changed files, and
`./bin/agentic-hq.cjs list` byte-identical to the post-Stage-4 baseline.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next
step: run `agentic-hq create-workflow -- --using=add-feature` to make a copy and add your own stages,
rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or
try out `agentic-hq add-feature-detailed-example`.
