# AHQ-198 — Implementation Summary

## Summary Of Work Done

Un-privated the staged release artifact, guarded both wrong publish surfaces, excluded the five
unmigrated workflows from the artifact, wrote the manual publish checklist, and published to
npmjs.org — twice. The planned `0.1.0` publish exposed a real defect during registry
verification (every npx run crashed with `posix_spawnp failed`: npm hoists node-pty to a
sibling of agentic-hq and extracts spawn-helper without its exec bit, which the shipped
nested-only `postinstall` chmod never reached). Per the checklist's own §6 failure protocol the
fix was TDD'd, the version bumped, and **`agentic-hq@0.1.1` is now live as `latest`**, verified
end-to-end from the real registry in all four matrix combos (npx + prefix-global install, each
on Node 22 and Node 24 — full math workflow, `Output number: 5` every time).

Three TDD cycles (test-first, no REFACTOR stage per the plan):

1. **Artifact shape** — e2e RED (manifest carried `private: true`; unmigrated workflows
   shipped and listed) → `build-release.cjs` omits `private` and stages plugins through an
   `EXCLUDED_UNMIGRATED_SKILLS` filter → GREEN.
2. **Publish guards** — new integration test RED (both `npm pack` runs succeeded) → always-fail
   `prepack` in the root manifest (wrong tree) + user-agent-checking `prepack` in the generated
   release manifest (wrong packer) → GREEN 3/3.
3. **Hoisted-layout postinstall (unplanned, human-consented)** — e2e RED (tarball installed as
   a hoisted project dependency leaves spawn-helper non-executable, reproducing the npx crash)
   → `postinstall` in both manifests now chmods the nested **and** the `../node-pty` sibling
   layouts → GREEN 4/4.

## Files Changed/Added/Deleted

- **changed** `package.json` — root `prepack` wrong-tree guard (+ `// PREPACK` comment);
  two-path `postinstall` fix (+ updated `// POSTINSTALL` comment); version `0.1.0` → `0.1.1`;
  new `test:integration:publish-guards` script. Root stays `private: true` permanently.
- **changed** `scripts/build-release.cjs` — generated manifest omits `private`;
  `EXCLUDED_UNMIGRATED_SKILLS` list + staging filter (AHQ-201 deletes entries as it migrates);
  generated `prepack` wrong-packer guard; two-path `postinstall`.
- **changed** `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` —
  `private`-undefined assertion; shipped-skills boundary (exact plugin→skills map); list-test
  exclusion assertions; new hoisted-dependency spawn-helper exec-bit test.
- **added** `tests/integration/build/publish-guards.integration.test.ts` — wrong tree fails,
  wrong packer fails, pnpm positive control passes.
- **added** `docs/dev/publish-checklist.md` — the full-instruction manual publish checklist,
  including the two publish-day discoveries (real-TTY requirement for the passkey hand-off;
  folder-trust prompt guidance for delegated verification runs).
- **changed** `docs/README.md` — one link line for the checklist in the Developer section.
- **changed** `docs/tickets/AHQ-198/workflow-files/02-implementation-plan.md` — the two
  human-consented UPDATE sections (see Approved Deviations).

## Tests Added/Updated And Test Results

**Automated (all green at completion):**

- `pnpm validate` — typecheck, lint, format, 165 unit tests ✅
- `pnpm test:integration:build-determinism` ✅
- `pnpm test:integration:publish-guards` (new) — 3/3 ✅. One test-side fix during the cycle:
  the spawned packers now run with the `npm_*` environment stripped, because the test itself
  runs under pnpm and the inherited `npm_config_user_agent=pnpm/…` made npm's prepack see pnpm
  and wave the wrong packer through (a real terminal carries no such variable).
- `pnpm test:e2e:prebuilt-tarball-math-workflow` — 4/4 ✅ including the real math run from the
  installed tarball and the new hoisted-install test. One assertion strengthened during RED:
  the list-exclusion substring for string-reversal is `'reversal'` (the workflow lists as
  `agentic-hq reversal`, so `'string-reversal'` was vacuously absent even before exclusion).
- `pnpm test:e2e:cross-workspace-demo-math-workflow` — dev-mode parity untouched ✅

**Manual (the publish + registry verification — the acceptance evidence):**

- `npm publish ./agentic-hq-0.1.0.tgz` via in-session `!` → failed safely with `EOTP` (no TTY
  for the passkey hand-off; registry verified unchanged) → republished from a regular Terminal
  → `+ agentic-hq@0.1.0`.
- Registry verification Step 3 (npx, Node 24): `list` correct (only `math` + `add-feature`) but
  the math run crashed `posix_spawnp failed` → root-caused in the npx cache (hoisted node-pty,
  spawn-helper `-rw-r--r--`), fixed via TDD cycle 3, bumped to 0.1.1 per checklist §6.
- `npm publish ./agentic-hq-0.1.1.tgz` from a regular Terminal → `+ agentic-hq@0.1.1`.
- `npm view agentic-hq versions dist-tags` → `[ '0.0.1', '0.1.0', '0.1.1' ]`,
  `latest: '0.1.1'` ✅
- Verification matrix (agent-run, cold npx cache, workspaces under the trusted
  `/tmp/agentic-hq-test-workspaces/`), all four combos ✅:

  | Node | Route | Command run | list | math |
  |---|---|---|---|---|
  | v24.15.0 | npx | `npx --yes agentic-hq list` / `… math -- --input-number=11` | only math+add-feature | `Output number: 5` |
  | v22.20.0 | npx | same, with `PATH` pinned to v22.20.0 | only math+add-feature | `Output number: 5` |
  | v24.15.0 | global | `npm install -g --prefix <temp> agentic-hq` + absolute-path bin | only math+add-feature | `Output number: 5` |
  | v22.20.0 | global | same, with `PATH` pinned to v22.20.0 | only math+add-feature | `Output number: 5` |

  Step 7 (unprefixed true global install) skipped per the plan default.

## Approved Deviations From The Plan

- **UPDATE (plan):** the publish command runs in a regular macOS Terminal, not via the
  in-session `!` prefix — the passkey hand-off cannot complete in a non-TTY shell (npm exits
  `EOTP`). Chosen by Steve over the Plan B token.
- **UPDATE 2 (plan):** Steve's consent ("run these and fix any problems as you find them")
  covered: the agent running the verification matrix directly (under the trusted workspace
  parent, dodging Claude's folder-trust prompt); the TDD'd hoisted-layout `postinstall` fix;
  and the §6-protocol republish as `0.1.1`.

## Out Of Plan Follow-up Ideas/Concerns

- **`npm deprecate agentic-hq@0.1.0 "npx runs crash (posix_spawnp) — use >=0.1.1"`** — 0.1.0
  is immutable and carries the npx defect; a deprecation notice would warn anyone pinning it.
- **`commands/` directories of unmigrated/dead workflows still ship** (create-workflow,
  quick-jira, full-jira, string-reversal, add-feature-detailed-example, plus
  `DRAFT-oo-refactoring-workflow` and `research-plan-implement`, which have no skills at all).
  The recorded exclusion decision covered `skills/` only, so this is dead weight, not breakage
  (discovery is skills-driven; the e2e proves none of them list). Candidate for AHQ-201 or a
  hygiene follow-up.
- **npm warns `Unknown publishConfig config "executableFiles"` and "will stop working in the
  next major version of npm"** during publish — harmless today (the field does its work at
  pnpm pack time), but worth watching when npm majors bump; relevant to the future release
  automation ticket.
- **AHQ-199 Quickstart:** first-run `npx agentic-hq` users in a fresh directory will meet
  Claude Code's folder-trust prompt before the first workflow step — worth a line in the
  Quickstart docs.
- Vitest's `-t` name filter did not actually restrict which tests ran in this e2e file (all
  tests executed despite the filter) — harmless here, worth a look someday.
- Standing plan follow-ups: AHQ-201 (migrate the five, shrink `EXCLUDED_UNMIGRATED_SKILLS`),
  AHQ-199 (Linux check + README Quickstart), AHQ-202 (patch republish + interactive
  add-feature proof from a registry install), release automation (out of scope for v1).
