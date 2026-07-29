# Workflow Implementation Approval List: birgitta-ousterhout-full-build

**Spec**: docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/birgitta-ousterhout-full-build/02a-APPROVED-workflow-spec.md
**Generated**: 2026-07-29

## Checklist

| # | Spec Requirement | Status | Notes |
|---|------------------|--------|-------|
| 1 | All 12 spec commands exist as .md files in commands-dir | PASS | `01-p1-spec-interrogation.md` … `12-e3-validate-report-commit.md` — exactly 12 files, names match the spec's command list 1:1 |
| 2 | Per-command inputs match the spec's variable-flow table | PASS | All parse `agentic-hq-workspace-root-dir` + `spec-file`; 03–09 additionally `pass-number`; 12 additionally `loop-exit-reason` + `passes-completed`; 10/11 take no extras |
| 3 | Per-command output strings match the spec | PASS | 01: `Completed` (or `env_check_failed: …` on self-test failure); 03: bare verdict sentinel only; 07: `coverage-delta=<n>` only; all others: `Completed` |
| 4 | TS CLI chains commands in spec order with spec control flow | PASS | P1 (prefix-check `env_check_failed` → throw) → P2 → loop [cap gate → L1 exact-match verdict → L2→L7] → E1/E2 (skipped only on `run_unsalvageable`) → E3 always, with `loop-exit-reason` + `passes-completed` |
| 5 | L1 verdict is exact-matched, never substring-matched | PASS | `birgitta-ousterhout-full-build-cli.ts:209` — `===` against the three sentinels on trimmed output; comment records the `no_more_slices`-contains-`more_slices` trap |
| 6 | Coverage-delta parsed strictly; 2 consecutive zero deltas → `no_progress` | PASS | `COVERAGE_DELTA_PATTERN = /^coverage-delta=(\d+)$/` on trimmed output, throw on mismatch; `NO_PROGRESS_LIMIT = 2`; streak resets on non-zero; pass always completes through L7 first |
| 7 | Pass cap 40 default, `--max-passes` option, `y` extends by 20, EOF/non-TTY = No | PASS | `DEFAULT_MAX_PASSES = 40`, `CAP_EXTENSION = 20`, `parseMaxPasses` throws on NaN/<1, `askToExtendCap` returns false on non-TTY stdin; prompt wording matches spec |
| 8 | Malformed control outputs throw uncaught with full command output | PASS | P1/L1/L5 throws include full output; no boundary catch anywhere in the CLI (AHQ convention) |
| 9 | SKILL.md exists and references the CLI via the math-workflow pattern | PASS | `disable-model-invocation: true`; pnpm install + `ln -sfn $AGENTIC_HQ_WORKSPACE_ROOT` + tsx invocation of `src/birgitta-ousterhout-full-build-cli.ts`; INFO note; self-terminate |
| 10 | package.json + tsconfig.json exist with correct deps | PASS | deps: `agentic-hq: link:../../../../../..`, `tsx`, `commander`; engines Node 22/24; postinstall chmod fix; TEMPORARY-LOCAL-DEPENDENCY block; tsconfig matches math-workflow (strict, ES2023, noEmit) |
| 11 | ahq-workflow.json valid with 7 fields matching spec | PASS | Parsed as valid JSON; `pluginId`, `skillId`, `shortId` (`full-build`), `description`, `exampleParameters` (starts `-- `), `version` (`1.0.0`), `author.name` — all match spec |
| 12 | Plugin manifest valid (pre-existing, left untouched) | PASS | `.claude-plugin/plugin.json`: valid JSON, 4 fields, `name` == `agentic-hq-demos-plugin` |
| 13 | Six SAMPLE docs bundled at skills-dir/docs/sample-docs | PASS | requirements-checklist, decisions-register, master-design-doc, slice-register, sensor-manifest, RESULTS — each a payroll-domain shape template with "not content to copy" header |
| 14 | No-human-available policy verbatim in every command | PASS | Identical blockquote + stopping rule + research licence in all 12; 07/10 add "no sensor may depend on the network" |
| 15 | Guides inline at their spec-mandated stages | PASS | 04: G1–G5, G7, G10–G12 · 06: G7, G8, G10, G11 · 08: G9 (load-bearing wording), G2, G6, G10 · 11: G1–G3, G6, G10–G12 + moderation quotation |
| 16 | Sensors at their spec-mandated stages | PASS | 07 (L5): S1–S7, S15, S17 (S17 advisory-never-failure) · 10 (E1): S8–S14, S16, S18 (S18 "not optional") + the fourteen red flags inline |
| 17 | Honesty rules present at measuring/judging/reporting stages | PASS | 03 (unreachable-ruling), 07, 10, 12 (unmet-reported-as-unmet, exit reason prominent) |
| 18 | Cycle never described as TDD; single disclaimer in 05 | PASS | Repo grep: only TDD mention is 05's mandated "This is not test-driven development…" section |
| 19 | Per-stage local commits, never push | PASS | Every repo-changing command has a stage-labelled commit step ending "Local commit only — never push"; 12 states pushing is the operator's post-run step |
| 20 | Self-containment: no AHQ-192 / doc-14 / TailCut references | PASS | Repo grep over commands + skills: zero matches; all `{placeholders}` resolve to variables established in each file's Step 0b |

## Convention Compliance

| Convention | Status | Notes |
|------------|--------|-------|
| Command structure (Step 0a read input / Step 0b establish variables) | PASS | All 12 commands parse `command-input.json` then establish a self-contained variable chain |
| Kebab-case variable naming + `$0` convention | PASS | All variables kebab-case; every command carries the `command-input-output-files-directory = $0` line |
| Self-termination at end of every command | PASS | All 12 end with `/agentic-hq-core-plugin:self-termination`; SKILL.md likewise |
| File-based I/O (command-input.json / command-output.json) | PASS | Every command reads input and writes `{"command-output-string": …}` per the spec's per-command table |
| Context loading in commands beyond the first | PASS | 02–12 each begin work by reading their inherited run artifacts (checklist, registers, design doc, findings) |
| ahq-workflow.json present and valid | PASS | See checklist #11 |
| Plugin manifest present and valid | PASS | See checklist #12 — pre-existing, left untouched per spec |
| Generated TS CLI installs and typechecks cleanly | PASS | `pnpm install` clean (agentic-hq link + commander 14.0.3 + tsx 4.23.1, postinstall ran); `tsc 5.9 --noEmit` — zero errors |

## Summary

All 20 spec-compliance checks and all 8 convention checks PASS with no deviations found. The implementation matches the APPROVED spec: 12 commands with the shared Intro convention, control signals confined to TypeScript (prefix-check, exact-match sentinel, strict coverage-delta regex), Guides and Sensors at their mandated stages, honesty rules where stages measure, and a fully local, never-pushing commit cadence.

## Amendments After Review Gate

Approved at the 03b review gate and applied after the checks above were recorded:

- **Refactorings 1 and 2** (TS CLI: `parseSliceVerdict` free function; `passNumber` named once in `runNextPass`) — done, typecheck clean. Refactoring 3 rejected; CLI unchanged for it.
- **Refactoring 4 (human-suggested)** — supersedes checklist row 15's "Guides inline" reading of the spec. The spec decision is amended to "stage application inline; canon in per-guide docs read at the stage": 12 guide docs now live in `{skills-dir}/docs/guides/` (`G01`–`G12`, five marked load-bearing), and commands 02, 04, 06, 07, 08, 10, 11 read them via a `guides-dir` variable while keeping only one-line stage application notes — quotes and general definitions removed from the command files so nothing is duplicated. Full detail and status in 03b Refactoring 4.
- **Re-verification after wiring**: compliance sweep re-run clean over the seven changed commands and the guides directory — no AHQ-192/doc-14/TailCut references, TDD only in 05's disclaimer, all placeholder variables established in Step 0b, every guide filename referenced by a command exists on disk, and commands 01, 03, 05, 09, 12 are byte-unchanged.
