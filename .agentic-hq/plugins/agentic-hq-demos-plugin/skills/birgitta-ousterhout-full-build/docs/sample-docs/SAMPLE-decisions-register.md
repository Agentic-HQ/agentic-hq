# Decisions Register

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example entries below
> come from an imaginary payroll calculator CLI. Every stage that decides anything under the
> no-human-available policy appends an entry here: the decision, the alternatives considered, the
> reason, and which stage decided it. This register is how a reader afterwards tells a considered
> choice from an accident.

---

## D1 — Currency amounts are held as integer cents, never floats

- **Alternatives considered**: floating-point dollars; a decimal library
- **Reason**: the spec's rounding pitfall (checklist R3) is impossible to violate if fractions of a
  cent cannot be represented mid-calculation; a decimal library adds a dependency for no extra safety here
- **Decided by**: P1 — Spec Interrogation

## D2 — The spec's "weekly pay period" ambiguity resolved as Monday–Sunday

- **Alternatives considered**: Sunday–Saturday; configurable period start
- **Reason**: §3's example table starts on a Monday; configurability is scope the spec never asks for
- **Decided by**: P1 — Spec Interrogation

## D3 — SHORTCUT: slice 2 reads employee records from a fixed CSV path

- **Alternatives considered**: a `--records <path>` option (the spec's stated end state)
- **Reason**: lets slice 2 stay thin; recorded as known debt — checklist R7 stays open until the
  option exists
- **Decided by**: L2 — Slice Design (slice 2)
