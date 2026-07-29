# Slice Register

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example entries below
> come from an imaginary payroll calculator CLI. The register describes **the build** (the design
> doc describes the system). Created by P2 with the candidate backlog; L1 scopes slices and revises
> the backlog; L3 records observed check failures; L6 updates planned-vs-delivered; L7 marks done.
>
> **The current slice is the newest `in-progress` entry** — there is no separate current-slice file.

Statuses: `scoped` · `in-progress` · `done` · `failed` · `dropped` · `re-scoped`

---

## Candidate Backlog (ordered, explicitly provisional — revised every pass by L1)

1. ~~Walking skeleton: one timesheet line → one pay line~~ (slice 1, done)
2. Overtime calculation *(slice 2, in-progress)*
3. Deductions (tax bands, fixed deductions)
4. Multi-employee pay run from a records file
5. Pay-run summary report

**Backlog changes this pass (L1, pass 2)**: split "overtime + deductions" into two slices — the
deduction rules turned out to be half the spec's complexity and deserve their own design pass.

---

## Slice 1 — Walking Skeleton: one timesheet line to one pay line

- **Status**: done
- **Planned**: thinnest end-to-end path — one hardcoded-rate entry parsed, calculated, printed;
  harness stood up (build, linter with size/complexity rules, test runner, one check command)
- **Delivered**: as planned, plus date-format normalisation (see design doc reconciliation note)
- **Checklist entries satisfied**: R1
- **Check failure observed (L3)**: 3 checks written; all failed with `MODULE_NOT_FOUND` on
  `payCalculator` — valid failure, module did not exist yet
- **Sensor findings summary (L5→L6)**: 2 findings — S2 flagged an unused parameter (fixed);
  S15 pass: rejected alternative recorded. coverage-delta=1

## Slice 2 — Overtime calculation

- **Status**: in-progress
- **Planned**: weekly-hours aggregation and the 1.5× rule (checklist R2); targets R2, R3
