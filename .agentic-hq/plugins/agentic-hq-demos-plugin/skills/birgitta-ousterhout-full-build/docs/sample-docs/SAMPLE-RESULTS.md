# RESULTS

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example content below
> comes from an imaginary payroll calculator CLI. Written by E3 at the repo root on **every** exit
> path — including failed runs. Unmet targets are reported as unmet; the loop exit reason is stated
> prominently whenever it is anything other than `no_more_slices`.

---

## Loop exit reason

**`no_more_slices` after 5 passes** — every requirements-checklist entry is satisfied or recorded
unreachable with a reason. *(If the reason were `max_passes_reached`, `no_progress` or
`run_unsalvageable`, it would be stated here at the top, with what that means for completeness.)*

## What was built

A payroll calculator CLI: reads timesheet CSVs, applies gross-pay, overtime and deduction rules,
and renders per-employee pay statements and a pay-run summary. Five slices, from a walking skeleton
to the full report.

## Build and run from a clean clone

```bash
git clone <repo> payroll && cd payroll
npm install
npm test          # full check suite
npm start -- --timesheet fixtures/week-27.csv
```

(Validated by E3 in a clean local clone, not the working tree.)

## Measured headline results

- 41/41 checks pass, including 6 end-to-end checks
- Full pay run over the 3,000-line fixture: 0.4s
- Rounding property check: 10,000 random pay runs, final-total-only rounding held in all

## Self-assessment against the spec's acceptance criteria

| Criterion (spec §6) | Verdict | Evidence |
|---|---|---|
| Correct gross pay incl. overtime | **pass** | checks `grossPay.test`, e2e `week-27` |
| Rounding pitfall never violated | **pass** | property check above |
| Configurable tax bands | **fail — unmet** | fixed 2-band table shipped; spec's YAML config not built (checklist R11 unreachable: format undefined by spec, decision D9) |

## Known gaps and shortcuts

- Tax bands hardcoded (above) — the one failed criterion.
- Records file path was a fixed CSV until slice 4 (decision D3, since repaid).
- Error messages are terse; spec is silent on wording, none polished.
