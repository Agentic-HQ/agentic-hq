# AHQ-198 — Feature Brief

## One Sentence Outcome

The staged release artifact is deliberately un-privated, guarded against wrong-tree/wrong-packer
publishes, and quietly published to npm as `agentic-hq@0.1.0` by `halso` following a new documented
checklist — then verified from the real registry with math-workflow running end-to-end in a clean
directory on Node 22 and Node 24.

## User Story

**As a**: maintainer of Agentic HQ  
**I want:** a guarded, documented, repeatable publish process and a first real `0.1.0` on the registry  
**So that:** later sub-tasks can advertise the npm install route with confidence that a bad publish is structurally hard

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially careful to fully read and understand any relevant Addenda

## My Understanding of This Task

AHQ-198 is Sub-Task 3 of the AHQ-195 split: take the staged release artifact that AHQ-197 built
(and AHQ-204 extended with add-feature) and make it **actually publishable — then publish it**.
Concretely: deliberately flip the `private` flag (the generated release manifest currently copies
`private: true` from the root, with a comment saying AHQ-198 un-privates it), add publish guards so
the wrong tree or the wrong packer can never produce a bad publish (packing must be `pnpm pack`
from `release/` — `publishConfig.executableFiles` is pnpm-only), write the documented manual
publish checklist (pnpm version pinned, inspect the packed tarball's *actual* manifest, registry
verification via `npx --yes` and `npm install -g` on Node 22 and Node 24), then perform the quiet
0.x publish as `halso` and verify math-workflow end-to-end from the real registry in a clean
directory. The 2026-08-10 addendum means the publish now carries **two** migrated workflows
(math-workflow and add-feature), though add-feature's registry-install interactive proof stays in
AHQ-202.

Much of the originally listed scope has **already been delivered** by AHQ-197's staged-release-tree
restructure (per the 2026-08-08 addendum knock-on: the hygiene *goal* stands, the *mechanism*
became the staged tree): the `files` whitelist is retired, the leak class
(io-files/`steve-test-plugin`/dev configs/`.npmrc`) is structurally impossible and e2e-asserted,
exec bits ship via generated `publishConfig.executableFiles`, and the shipped manifest already has
`engines.node` only. What remains is the un-private decision, the guards, the version choice, the
checklist, how the five still-broken workflows appear in the published package (a Planner decision
per the parent brief), and the publish + registry verification itself. Details in Research
Findings.

## Research Findings

### What the parent brief (AHQ-195) assigns to AHQ-198, including all Addenda

From the Sub-Task list and the four dated addenda in
`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`:

- **Core scope:** package hygiene, remove `private: true`, `prepublishOnly` guards, engines
  cleanup, documented manual publish checklist, then a quiet 0.x publish as `halso`, verified from
  the real registry (`npx agentic-hq` / `npm install -g agentic-hq` in a clean directory, running
  math-workflow end-to-end). Nothing advertises the npm route until AHQ-199.
- **2026-08-06 addendum (first Perplexity review):** (a) a release guard preventing
  `npm pack`/`npm publish` being run against the source tree; (b) pin the pnpm version in the
  publish checklist (a pnpm major bump is a publish-pipeline change to re-verify); (c) publish
  checks must inspect the packed tarball's **actual** `package/package.json`, not the source
  manifest; (d) registry verification includes both `npx --yes agentic-hq` and a global install,
  on **Node 22 and Node 24**.
- **2026-08-08 addendum (second Perplexity review):** consider `publishConfig.executableFiles`
  (exact paths only — globs silently ignored) replacing the postinstall chmod — **since done by
  AHQ-197** (see below).
- **2026-08-08 Reviewer-stage addendum:** AHQ-197 took the staged-release-tree restructure, with
  the explicit knock-on that AHQ-198's `files`-whitelist wording is superseded — "hygiene work
  shrinks to 'stage the right things' plus publish guards".
- **2026-08-10 addendum (AHQ-204):** add-feature was early-migrated, so the first publish carries
  **two** migrated workflows; add-feature's registry-install interactive proof remains AHQ-202's.
- **Addendum to Sub-Task 5 (AHQ-199), explicitly left to the human's preference:** an actual Linux
  install-and-run check could happen "here or as part of AHQ-198's registry verification" —
  Question 3 below.
- **Open Planner decision recorded in the Sub-Task list:** how the not-yet-migrated workflows are
  handled in the published package — excluded vs present-but-marked.

### What AHQ-197/AHQ-204 already delivered (verified in the repo today)

- **`scripts/build-release.cjs`** (`pnpm build`) assembles `release/` — exactly what ships —
  and generates `release/package.json` from the root manifest: prebuilt `bin`
  (`bin/agentic-hq-prebuilt.cjs`), compiled-JS `exports`, node-pty-only `postinstall`,
  `engines.node` only (engines cleanup is effectively **done** — `engines.pnpm` stays root-side as
  a contributor constraint), and `publishConfig.executableFiles` enumerated fresh from the staged
  tree each build (cannot go stale). Packing runs from inside `release/`.
- **`private` today:** the generated manifest copies `private` from the root
  (`build-release.cjs` — "Kept private until AHQ-198 un-privates deliberately for the real
  publish"). Root `package.json` is `private: true`, has **no** `files` whitelist, **no**
  `publishConfig`, **no** `prepublishOnly`.
- **The leak class is structurally closed:** only three plugins are staged
  (`SHIPPED_PLUGINS = core, demos, utilities` — `steve-test-plugin` never ships), ts-workflow
  `node_modules` are filtered, and `.agentic-hq/temp/` io-files, tests, dev configs and `.npmrc`
  are simply never staged. The tarball e2e
  (`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`) asserts the
  boundary: top level exactly 7 entries, exactly 3 plugins, only `run-workflow.cjs` under
  `scripts/`, no `node_modules`, no nested manifest between the compiled JS and the package root,
  every shipped `.sh` executable — plus a full math-workflow run from the installed tarball.
- **Build determinism** is proven and permanently covered
  (`tests/integration/build/build-determinism.integration.test.ts` — byte-identical `release/`
  trees, now also asserting the staged compiled `add-feature-cli.js`).
- **Two workflows are migrated and compiled into `release/dist`:** math-workflow (AHQ-197) and
  add-feature (AHQ-204). The dev bin wrapper (`bin/agentic-hq.cjs`) is deliberately not shipped.

### Why packing/publishing must still be pnpm (guard rationale, narrowed but standing)

AHQ-196 established `pnpm pack` was required because only pnpm applies `publishConfig`
bin/exports overrides. AHQ-197 retired that override dance (the generated manifest carries the
real values), **but** `publishConfig.executableFiles` — now the only mechanism giving shipped
`.sh` scripts their exec bits — is still pnpm-only behaviour. An `npm pack`/`npm publish` run
inside `release/` would silently produce a tarball whose plugin scripts arrive non-executable
(AHQ-196 measured this failure mode: exit 126 at runtime). And at the **repo root**, `npm pack`
still works despite `private: true` (spike-proven in the parent research) and would produce a
garbage tarball since the root has no whitelist. So the guard addendum still stands, with two
distinct surfaces: wrong tree (root vs `release/`) and wrong packer (npm vs pnpm). The pnpm
version is pinned repo-wide via `packageManager` (`pnpm@11.1.2`, exact, with SHA) — the checklist
can reference that as the single source of truth.

### Registry and version state (checked live today)

- `npm view agentic-hq`: published versions = `0.0.1` only (the 2025-08-11 placeholder), dist-tag
  `latest` → `0.0.1`, owned by `halso`. Publishing is an update to an owned name, not a new claim.
- Root `package.json` version is `0.1.0` — already ahead of the registry, so publishing as-is is
  a clean forward step (Question 2).

### The five still-broken workflows will be visible in the published package

The staged demos plugin ships **all six** demo skills and the core plugin ships create-workflow,
but only math-workflow and add-feature are migrated. The other five (string-reversal,
quick-jira-workflow, full-jira-tdd-story-workflow, add-feature-detailed-example, create-workflow)
still crash at tool construction (`new DefaultClaudeCodeTool()` with no args — the accepted
AHQ-197 break, deferred to AHQ-201). As shipped today they would appear in `agentic-hq list` and
fail with a raw TypeError if a curious npm user runs one. The parent brief makes
excluded-vs-present-but-marked a **Planner decision for this Sub-Task**; the Researcher's only
addition is the factual note that exclusion would touch `build-release.cjs` staging (currently
whole-plugin copies with no per-skill logic) and that `list` is driven by the shipped plugins
tree.

### Other verified facts relevant to planning

- No publish documentation exists anywhere in `docs/` today (grep-verified) — the checklist is a
  new document (natural home: `docs/dev/`).
- The repo-root `.npmrc` (`frozen-lockfile=true`, pnpm-only) no longer ships, but it does make
  every in-repo **npm** command print an "Unknown project config" warning — a known cosmetic
  annoyance for the publish checklist to be aware of when running npm-side verification commands
  from inside the repo.
- The tarball e2e is the local pre-publish safety net; registry verification after the real
  publish is a manual checklist step (the parent brief's addendum specifies npx + global install
  on Node 22 and Node 24).
- AHQ-202 (not this ticket) retains: republish a patch version and prove the interactive
  four-agent add-feature flow from a registry install.

## Web/Perplexity Research

No external research was required: the parent brief's two Perplexity reviews (already distilled
into its addenda) plus two live local registry checks (`npm view agentic-hq`, verified owned
placeholder `0.0.1`) covered everything; all other findings came from the repo and its ticket
docs.

## Questions And Answers

### Question 1

**Question:** How should "un-private" work — should the **root** `package.json` keep
`private: true` permanently (as the structural guard against ever publishing the source tree),
with `scripts/build-release.cjs` changed to **omit** `private` from the generated release
manifest, so `release/` becomes the only publishable tree?

**AI Recommendation:** Yes. This makes the root's privateness a feature, not a leftover: `npm
publish`/`pnpm publish` at the repo root stays permanently blocked with a loud standard error,
while the artifact that was built for publishing is the only thing that can be published. It also
satisfies half of the guard addendum structurally (remaining guard work then targets the
wrong-packer surface: npm-instead-of-pnpm inside `release/`, plus a root `npm pack` guard).

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 2

**Question:** What version should the first real publish carry — publish the root's current
`0.1.0` as-is (quiet, `latest` tag, superseding the `0.0.1` placeholder)?

**AI Recommendation:** Yes — publish `0.1.0`. It is already ahead of the registry placeholder,
0.x honestly signals pre-advertised status, and the version needs no bump since nothing was ever
really published under it. (`latest` must point at it regardless, since the registry verification
uses plain `npx agentic-hq`.)

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** The parent brief's AHQ-199 addendum leaves this to your preference: should an actual
**Linux** install-and-run check be part of AHQ-198's registry verification, or deferred to
AHQ-199 (before the npm route is advertised), keeping AHQ-198's verification macOS-only?

**AI Recommendation:** Defer to AHQ-199. This publish is deliberately quiet — nothing points
users at npm until AHQ-199, which is exactly when the Linux question (node-pty
compile-from-source: build toolchain + Python) becomes user-facing. Verifying Linux now would
also require provisioning a Linux environment mid-ticket, which is a poor fit for a ticket whose
remaining risk is publish mechanics, not platform support.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the parent brief: Sub-Task 3's scope, all four dated addenda, and the open Planner decision on unmigrated workflows.
- `scripts/build-release.cjs` — the staged-tree build; carries the "Kept private until AHQ-198" seam, the generated-manifest fields, and the `executableFiles` enumeration.
- `package.json` (root) — `private: true`, version `0.1.0`, no `prepublishOnly`, `packageManager` pnpm pin, engines split (node for users, pnpm for contributors).
- `docs/tickets/AHQ-197/workflow-files/03-implementation-summary.md` — what the staged tree and explicit parameter chain delivered, plus its standing follow-ups for AHQ-198.
- `docs/tickets/AHQ-196/workflow-files/03-implementation-summary.md` — Findings For Later Sub-Tasks: pnpm-only packing rationale, exec-bit caveat, tarball hygiene ammunition.
- `docs/tickets/AHQ-197/workflow-files/04-review-summary.md` — reviewer-verified evidence for the artifact-shape and leak-class assertions.
- `docs/tickets/AHQ-204/01-work-details.md` — the add-feature early migration and its knock-on that this publish carries two workflows.
- `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — the local pre-publish safety net (existence verified; assertions per the AHQ-197 summaries).
- `.npmrc` — pnpm `frozen-lockfile`; the source of the cosmetic npm "Unknown project config" warning noted in Research Findings.
- `.agentic-hq/plugins/*/skills/` listing — confirmed which skills ship per plugin (five of seven shipped workflows unmigrated).

## Acceptance Criteria

- `agentic-hq@0.1.0` is live on npmjs.org as `latest`, published as `halso` from the staged `release/` tree.
- Registry verification passes in a clean directory: `npx --yes agentic-hq` and `npm install -g agentic-hq` run math-workflow end-to-end on Node 22 and Node 24 (macOS only; Linux deferred to AHQ-199).
- Root `package.json` stays `private: true`; the published manifest is un-private; packing or publishing from the wrong tree or with the wrong packer fails loudly.
- A documented manual publish checklist exists and was actually followed for this publish (pinned pnpm version, packed tarball's actual manifest inspected).
- The five unmigrated workflows appear in the published package per the recorded Planner decision (excluded vs present-but-marked), and the existing tarball and build-determinism safety nets stay green.