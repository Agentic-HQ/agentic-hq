# Requirements Checklist

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example entries below
> come from an imaginary payroll calculator CLI; replace them entirely with entries extracted from
> the actual spec. Keep the structure: numbered entries, a spec-location citation on every entry,
> a status on every entry, and the two extra fields on every pitfall entry.

Statuses: `open` · `satisfied (slice N)` · `unreachable (reason)`

---

## R1 — Calculate gross pay from hours worked and hourly rate

- **Spec location**: §2 "Core Calculation", para 1
- **Status**: satisfied (slice 1)

## R2 — Overtime hours (>40/week) are paid at 1.5× the hourly rate

- **Spec location**: §2 "Core Calculation", para 3
- **Status**: open

## R3 — PITFALL: rounding must be half-up to whole cents at the final total only, never per line item

- **Spec location**: §4 "Known Pitfalls", bullet 2
- **Status**: open
- **Implementation site**: _(file/module where this is handled — filled in when implemented)_
- **Runtime evidence step**: _(the executable check that proves it at runtime — filled in when checked)_
