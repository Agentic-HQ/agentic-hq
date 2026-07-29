# G4 · Define Errors Out Of Existence

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Prefer designs in which the error **cannot arise** over designs that handle it in every caller: validation once at the edge, setup that cannot half-succeed, teardown that is idempotent, defaults computed rather than demanded. Every exception a module throws and every special case it exposes is interface — cost paid by every caller. Redefine the operation so the special case is simply normal behaviour, and the handling code disappears system-wide. **This is not licence to drop checks that are genuinely needed** — it is a rule about *where* a necessary check lives (one edge) and how many callers must think about it (none), not about whether it exists.

## In Ousterhout's words

> "Special cases can result in code that is riddled with if statements, which make the code hard to understand and lead to bugs. Thus, special cases should be eliminated wherever possible. The best way to do this is by designing the normal case in a way that automatically handles the special cases without any extra code."

> "However, if you are having trouble figuring out what to do for the particular situation, there's a good chance that the caller won't know what to do either. Generating an exception in a situation like this just passes the problem to someone else and adds to the system's complexity."

## Example

Hours are validated once, where a timesheet line is parsed: a `TimesheetEntry` **cannot hold** negative hours, so the calculator, the report writer and the CLI never check — the error was defined out of their existence at the edge. Likewise a `resetPayRun` that deletes output files with "remove if present" semantics: running it twice is not an error, so no caller needs a did-it-already-run guard.

## Counterexample

The calculator, the report writer *and* the CLI each defensively re-check `hours >= 0` — three checks, three slightly different error messages, and the actual rule about what makes hours valid lives nowhere in particular.

## Checked by

**S6 · Idempotence & Re-run** (slice check) exercises the most common move — operations that survive being run twice. Beyond that the principle is judged qualitatively at the big review: callers wrapped in special-case handling that a deeper module could have absorbed are **S8/S10** findings.
