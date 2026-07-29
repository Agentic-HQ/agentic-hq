# Master Design Doc

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example content below
> comes from an imaginary payroll calculator CLI. The real document is created skeletal by P2
> (major modules only, whiteboard level), extended by exactly one slice at a time by L2, made true
> again by L6, and finally updated by E2.
>
> **The absolute rule this document lives by: it never describes a slice that has not been
> undertaken.** No "in a future slice", no roadmap, no interfaces for modules nothing needs yet.

---

## Rough Shape (written by P2 — whiteboard level, no interfaces)

- **Input Reader** — turns timesheet files into records the calculator understands.
- **Pay Calculator** — the rules: gross pay, overtime, deductions.
- **Report Writer** — renders a pay run as human-readable output.
- **CLI** — one command wiring the three together.

---

## Slice 1 — Walking Skeleton: one timesheet line to one pay line (designed at L2, reconciled at L6)

### Interfaces

**`parseTimesheetLine(line: string): TimesheetEntry`**
> Interface comment (written before implementation): Parses one CSV timesheet line
> (`employeeId,date,hours`) into a `TimesheetEntry`. Rejects malformed lines at this edge — callers
> never see raw strings, so no later module revalidates.

**`calculateGrossPayCents(entry: TimesheetEntry, hourlyRateCents: number): number`**
> Interface comment: Gross pay for one entry, in integer cents (see decisions register D1).

### Rejected alternative (Design It Twice)

A streaming pipeline (reader emits events, calculator subscribes) was sketched and rejected: the
spec's volumes are a few thousand lines, so streaming buys nothing and costs every module an
event-protocol dependency. The chosen shape is three functions composed by the CLI.

### Reconciliation note (L6)

As built, `parseTimesheetLine` also normalises date formats — contact with real fixture data showed
two formats in the wild; the design entry above was updated to make validation-at-the-edge cover it.
