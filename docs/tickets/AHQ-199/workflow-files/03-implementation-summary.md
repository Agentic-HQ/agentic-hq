# AHQ-199 — Implementation Summary

## Summary Of Work Done

Restructured the documentation around the two user groups, exactly per the approved plan's seven
doc-steps: the README Quick Start is now a three-step npm install-and-run guide for Normal Users
(with an npx alternative and `gh` dropped from user prerequisites); the full contributor setup
moved into the new `docs/dev/setting-up-agentic-hq-for-development.md` (8 numbered steps, the
dual-install NOTE, and the appendix "The Two Types Of Agentic HQ User"); CONTRIBUTING.md's
"Local development setup" was repurposed to introduce the two groups and link to the dev doc;
`troubleshooting-quickstart.md` was renamed to `troubleshooting.md` and restructured into
Setup / Tool / Contributor sections; `ci-configuration.md`'s step table was re-keyed to the dev
doc's step numbers; the glossary's two-roots link now targets a new durable "The two roots"
subsection in `how-agentic-hq-works.md`; and the small knock-ons (docs index, overview
prerequisites line) were applied. All docs are written against the live `agentic-hq@0.2.0`.

The plan's pre-verified item was re-verified: the AHQ-195 parent brief records AHQ-201/208/209 as
done with the corrected sequence AHQ-208 → AHQ-209 → AHQ-199 → AHQ-207.

## Files Changed/Added/Deleted

- `docs/dev/setting-up-agentic-hq-for-development.md` — **added** (plan step 1)
- `README.md` — **changed** (plan step 2: npm Quick Start; `agentic-hq` in all user examples; TIP
  reworked to "any fresh empty directory"; dev-doc link in Developer Documentation;
  troubleshooting links retargeted)
- `CONTRIBUTING.md` — **changed** (plan step 3: repurposed setup section; v0.2.0; CI sentence
  retargeted to the dev doc — including correcting its stale `agentic-hq list` to
  `agentic-hq-dev list`, matching what `ci.yml` actually runs)
- `docs/user-docs/troubleshooting.md` — **added**; `docs/user-docs/troubleshooting-quickstart.md`
  — **deleted** (plan step 4 rename + three-section restructure, no stub)
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`,
  `…cross-workspace-list-workflows.e2e.test.ts`,
  `…cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`,
  `…cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` — **changed**
  (plan step 4 rename mechanics: message-text-only edits to the failure-hint strings *and* the
  matching precondition comments, both of which carried the stale "README Quick Start step 5" /
  old-path wording; three comments also wrongly said `agentic-hq` where the code checks
  `agentic-hq-dev` — corrected while updating that wording)
- `docs/dev/ci-configuration.md` — **changed** (plan step 5: table re-keyed to dev setup steps
  2–8; `npm link` row now names the `agentic-hq-dev` binary; smoke-test row now reads
  `agentic-hq-dev list` matching `ci.yml`; "Reproducing CI Locally" and the build-toolchain
  absence note retargeted)
- `docs/dev/how-agentic-hq-works.md` — **changed** (plan step 6: new "The two roots" subsection in
  the Builds area, next to "The four combinations")
- `docs/glossary.md` — **changed** (plan step 6: AHQ-200-ticket parenthetical replaced with a link
  to `how-agentic-hq-works.md#the-two-roots`)
- `docs/README.md` — **changed** (plan step 7: audience-aware intro; dev doc listed;
  troubleshooting entry renamed/redescribed)
- `docs/user-docs/workflow-descriptions/overview-of-workflows.md` — **changed** (plan step 7:
  prerequisites line drops `pnpm`, points at the Quick Start; plus the Approval Gate fix below)
- `.github/workflows/ci.yml` — **changed** (Approval Gate fix below — comment-only)

## Tests Added/Updated And Test Results

Per the approved plan, no automated tests were added; the plan's scripted verification sweep
S1–S6 was the RED/GREEN check, run verbatim before and after the changes:

- **RED (before):** S1 = 14 README hits (overview clean, as the plan requires); S2 = 8 clone-era
  hits; S3 = 1 (`CONTRIBUTING.md:26`); S4 = 1 (`glossary.md:96`); S5 = 0; S6 = 8 (README ×2,
  CONTRIBUTING, docs/README, four e2e hint strings) — matching the plan's expected RED state.
- **GREEN (after):** S1 = 0, S2 = 0, S4 = 0, S6 = 0, S5 non-empty (4 hits across CONTRIBUTING.md
  and docs/README.md). S3's stale-version alternative (`v0\.1\.0`) = 0 hits; note that S3's
  second alternative (`currently v0`) still matches `CONTRIBUTING.md:26` **by construction**,
  because the plan itself dictates the replacement text "currently v0.2.0" — a false positive of
  the sweep's regex on the corrected text, not stale version text. The doc was not contorted to
  dodge the regex.
- **M1 (link/anchor check):** wrote a checker script (scratchpad, not committed) that validated
  all **180 relative links and anchors** across the nine touched markdown files, using GitHub's
  anchor rules — all resolve. One pre-existing broken link was found in an untouched part of
  `overview-of-workflows.md` (subsequently fixed with human approval — see
  `## Approval Gate Changes`). While rewriting the README's folder-trust NOTE I
  also fixed a **pre-existing broken anchor** it contained: `#running-the-add-feature-workflow`
  → `#run-the-add-feature-workflow` (the actual heading).
- **`pnpm validate`:** passed — typecheck, lint, format, and 190/190 unit tests (38 files). Per
  the plan, the full Claude e2e suite was not run for the message-text-only e2e edits.
- **Manual runtime verification** (required by the plan before rewording the "Listing is empty"
  entry): ran `agentic-hq-dev list` from a directory outside the AHQ workspace — all shipped
  plugins listed, confirming shipped plugins are found via the invoked binary's package root, not
  cwd. The entry was reworded accordingly (real cause: stale/failed `npm link`).
- **M2 (optional macOS npm walk-through):** **not run** — the plan requires the human's go-ahead
  at run time since it installs 0.2.0 globally on this Mac. Offered at the Approval Gate.

## Approved Deviations From The Plan

One, agreed with the human at the Approval Gate (recorded as an UPDATE in
`02-implementation-plan.md`): the two out-of-plan findings below were pulled into scope on the
human's explicit instruction ("pls do") — the stale `string-reversal-demo-cli.ts` link in
`overview-of-workflows.md` and the stale README-step comment mapping in `.github/workflows/ci.yml`.
Details in `## Approval Gate Changes`.

## Out Of Plan Follow-up Ideas/Concerns

- ~~Pre-existing broken `string-reversal-demo-cli.ts` link in `overview-of-workflows.md`~~ and
  ~~stale README-step comment mapping in `.github/workflows/ci.yml`~~ — both raised here
  originally, then approved and done at the Approval Gate (see `## Approval Gate Changes`).
- The plan's own follow-up ideas stand (markdown link checker in CI — the M1 script could seed
  it; a docs-scoped grep guard; deprecating 0.1.1 once 0.2.0 has soaked).

## Approval Gate Changes

At the Approval Gate the human reviewed the two out-of-plan findings surfaced in this summary and
instructed both be done ("pls do"). Changes made (also recorded as an UPDATE in
`02-implementation-plan.md`):

1. `docs/user-docs/workflow-descriptions/overview-of-workflows.md:147` — the string-reversal
   source link fixed from `string-reversal-demo-cli.ts` to the real filename
   `string-reversal-cli.ts` (verified against the actual `ts-workflow/src/` contents).
2. `.github/workflows/ci.yml` — all stale "README step N" comments re-keyed to the dev setup
   doc's step numbers: the header mapping block (now "Dev setup step 2–8", pointing at
   `docs/dev/setting-up-agentic-hq-for-development.md`) **and** the matching per-step inline
   comments (the same mapping continued through the file — half-fixing it would have left the
   file self-inconsistent). Comment-only; no workflow behaviour change.

3. **Terminology rename, "dev setup" → "contributor setup"** (human raised that all users are
   devs, so "dev setup" was ambiguous; the term usage was ~half-and-half, and CONTRIBUTING.md
   plus the e2e strings already said "contributor setup"). Prose-only sweep across
   `ci-configuration.md` (table column "Contributor setup step" + prose), `ci.yml` comments,
   `troubleshooting.md` step references, and `docs/README.md` link text. Kept unchanged, as
   agreed: the filename `docs/dev/setting-up-agentic-hq-for-development.md` and its H1 (specified
   in the Human Prompt, linked from seven places) and CONTRIBUTING.md's pre-existing "Local
   development setup" heading (anchor stability; its body already says "contributor setup").

4. **"The two roots" bullet reworded in `how-agentic-hq-works.md`** (human request): it now
   states the AHQ package root is always one of exactly two places — the `agentic-hq` package
   root in the npm installation directory, or the root of a checked-out repo workspace — and the
   misleading "compiled framework / shipped plugins" phrasing is corrected: contents arrive
   prebuilt only in the npm package, while in a checkout the framework is compiled on every
   `agentic-hq-dev` invocation and `build-first` workflows at run time; "shipped" became
   "bundled", matching the four-combinations table.

The human also made direct hand-edits to `README.md` (prerequisites trimmed to Claude Code only —
git removed; npx wording reworked, including a no-install variant of the smoke test) and
`CONTRIBUTING.md` (minor wording) during the gate; those stand as the current state.

Verification after the changes: the M1 link checker reports **0 broken** across all 180 relative
links/anchors in the touched markdown files; `grep -i "dev setup" / "README step"` over the live
docs, ci.yml, and tests returns only CONTRIBUTING's deliberate heading; the ci.yml YAML structure
is untouched (comment-only edits); `pnpm validate` re-run and passing (190/190).

## Human Approval Confirmation

**Approved by the human on 2026-08-22** ("Implementation Approved" chosen at the Approval Gate).
The approval covers the full implementation of the approved plan **plus** the four Approval Gate
changes recorded above (stale string-reversal link fix, ci.yml comment re-keying, the
"dev setup" → "contributor setup" terminology rename, and the "The two roots" rewording), and
stands alongside the human's own hand-edits made during the gate (README, CONTRIBUTING,
troubleshooting, and the contributor setup doc), which are part of the final state.

**Note from the human at approval:** the **Reviewer stage (agent 04) of this workflow is being
skipped** for this ticket, as the change is documentation-only. No `04-review-summary.md` will be
produced for AHQ-199.
