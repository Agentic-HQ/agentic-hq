# AHQ-198 — Review Summary

## Review Summary

The publish shipped and every acceptance criterion is met, with one human-consented deviation:
`0.1.1` (not `0.1.0`) is `latest`, because registry verification of `0.1.0` exposed a real npx
crash (hoisted node-pty, non-executable spawn-helper) that was TDD-fixed and republished per the
checklist's own §6 failure protocol. I independently re-verified the registry state, `pnpm
validate` (165/165), and the new publish-guards test (3/3) today; the code matches the approved
plan closely, and the summary's file list matches the commit exactly. One new gap found: the
shipped add-feature workflow's closing "Customization Next Step" points registry users at
`create-workflow` and `add-feature-detailed-example`, both of which are excluded from the
artifact until AHQ-201.

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| AC: publish live as `latest`, published by `halso` from the staged tree | `npm view agentic-hq versions dist-tags` re-run at review time: versions `[0.0.1, 0.1.0, 0.1.1]`, `latest: 0.1.1`. The `0.1.0`→`0.1.1` deviation was human-consented and recorded (plan UPDATE 2; summary §Approved Deviations) after `0.1.0`'s npx defect — the §6 protocol (fix → bump patch → restart checklist) was followed as written | Pass |
| AC: registry verification matrix (Node 22 + 24, npx + global, macOS) | All four combos recorded green in the implementation summary (run in-session with Steve's consent): `list` shows only math + add-feature, math run ends `Output number: 5` every time; Linux deferred to AHQ-199 per brief Q3 | Pass |
| AC: root stays private; published manifest un-private; wrong tree/packer fail loudly | Root `package.json` has `private: true` + always-fail `prepack` (read); generated manifest omits `private` (build-release.cjs:146-148, asserted by e2e `tarballManifest.private` toBeUndefined); `pnpm test:integration:publish-guards` re-run at review time — 3/3 (root `npm pack` fails, release `npm pack` fails, release `pnpm pack` succeeds) | Pass |
| AC: documented checklist exists and was actually followed | `docs/dev/publish-checklist.md` (215 lines, full-instruction style: pnpm-pin check, actual-tarball-manifest inspection, §6 never-republish rule), linked from `docs/README.md`; the summary records it being followed for both publishes, including exercising §6 for real on the `0.1.0` failure | Pass |
| AC: five unmigrated workflows excluded per recorded Planner decision; safety nets green | `EXCLUDED_UNMIGRATED_SKILLS` filter in build-release.cjs; freshly staged `release/` at review time ships only `add-feature` + `math-workflow` under demos skills (ls-verified); e2e asserts the exact plugin→skills map and list-output exclusions | Pass |
| Test evidence | Re-run at review time: `pnpm validate` — typecheck/lint/format/165 unit tests ✅; `pnpm test:integration:publish-guards` — 3/3 ✅ (including a fresh `pnpm build`). Recorded green at completion on this exact tree (clean, all work in commit a2565b4): tarball e2e 4/4 incl. real math run + new hoisted-install test; build-determinism; cross-workspace math e2e | Pass |
| Regression coverage | Changed areas each have a net: staging filter → e2e exact shipped-skills map (catches any future skill shipping unannounced); lifecycle-script strings → publish-guards (both wrong surfaces + pnpm positive control, with the clever npm_* env-strip so the test's own pnpm parentage can't mask a guard failure); two-path postinstall → new hoisted-install exec-bit test reproducing the exact 0.1.0 crash layout (npm project-local/npx; the same `../node-pty` relative path also covers pnpm's sibling layout); dev mode untouched → discovery is filesystem-driven against the repo tree, cross-workspace e2e green | Good enough |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| Shipped add-feature points at excluded workflows | Grep of the freshly staged `release/` tree: `commands/add-feature/04-reviewer.md` ("Customization Next Step") and both add-feature help docs tell users to run `agentic-hq create-workflow -- --using=add-feature` and inspect `agentic-hq add-feature-detailed-example` — both excluded from the artifact. A registry user completing add-feature is directed to commands that don't exist in their install | Gap — low impact (cosmetic dead-end at the very end of the workflow; nothing crashes) | Defer — AHQ-201 restores both workflows, and AHQ-202's interactive registry-install add-feature proof would surface this naturally; fixing now means conditional wording in shipped files that AHQ-201 immediately reverts |  |
| Highest-risk changed area: generated-manifest lifecycle scripts in `scripts/build-release.cjs` | The string-built `prepack`/`postinstall` ship inside every user install; the postinstall chmod deliberately swallows all errors (`2>/dev/null \|\| true` — it must never fail installs), so a future layout change would regress silently, exactly like 0.1.0's npx crash; npm also warns `Unknown publishConfig config "executableFiles"` "will stop working in the next major version of npm" | Medium — every-user blast radius, silent-by-design failure mode; mitigated by the tarball e2e, the hoisted-install test, and the 4-combo matrix covering all known layouts | Do nothing now — the known layouts are all test-covered, and the npm-major `executableFiles` watch item is already recorded in the summary's follow-ups for the release-automation ticket |  |
| Improvement 1 (RECOMMENDED): deprecate the broken `0.1.0` | `agentic-hq@0.1.0` is immutable on the registry and crashes every npx run (`posix_spawnp failed`); the Implementer's own follow-ups propose `npm deprecate agentic-hq@0.1.0 "npx runs crash (posix_spawnp) — use >=0.1.1"` | Worth doing — one command, permanently warns anyone pinning `0.1.0`; note it is a registry write, so it needs Steve's npm auth (passkey hand-off → real Terminal, same as publish day) | Do now | Yes (verbal, in-session: "please do the recommended fixes") |
| Improvement 2 (NOT RECOMMENDED): strip unmigrated workflows' dead `commands/` dirs from the artifact | The exclusion decision covered `skills/` only, so `commands/` for create-workflow, quick-jira, full-jira, string-reversal, add-feature-detailed-example (plus two skill-less drafts) still ship as dead weight (summary follow-ups; e2e proves none of them list) | Not worth it — dead weight, not breakage: discovery is skills-driven, nothing can invoke them, and AHQ-201 restores most of them anyway; extra staging-filter churn now buys zero user-visible change | Do nothing (fold into AHQ-201 or a hygiene follow-up) |  |

## Selected Fixes Applied

One fix applied — the `Yes`-marked Improvement 1 row (decision given verbally in-session:
"please do the recommended fixes"; the other three rows stand unfixed as recommended):

- **`agentic-hq@0.1.0` deprecated on the registry (2026-08-14).** Steve ran
  `npm deprecate agentic-hq@0.1.0 "npx runs crash (posix_spawnp failed) — use >=0.1.1"` in a
  regular Terminal window (fresh `npm login` first — the 2-hour session had expired — then the
  browser passkey ceremony on the deprecate itself). No repo files were touched.
- **Registry verification (agent-run):** `npm view agentic-hq@0.1.0 deprecated` returns the
  exact message; `npm view agentic-hq@0.1.1 deprecated` is empty; `dist-tags.latest` still
  `0.1.1`.
- **Regression guard:** the fix changed zero repo files, so the automated nets are unaffected —
  `pnpm validate` (165/165) and `pnpm test:integration:publish-guards` (3/3) had been freshly
  re-run green on this exact tree during this review. Agreed proportionate substitute for
  re-running the two multi-minute-Claude e2es: a registry smoke from the trusted workspace
  parent — `npx --yes agentic-hq list` → only `math` + `add-feature` listed, no deprecation
  warning (npx resolves `latest` = un-deprecated `0.1.1`).

## Final Human Confirmation

Steve approved the applied fix on 2026-08-14 (verbatim: "approved"), after the second-gate
presentation of the results: the `0.1.0` deprecation verified on the registry, `0.1.1`
un-deprecated and still `latest`, the npx `list` smoke clean, and zero repo files changed. The
fix decision itself had been given verbally in-session ("please do the recommended fixes") —
Improvement 1 only; the three other Potential Fixes rows stand unfixed as recommended.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow -- --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.
