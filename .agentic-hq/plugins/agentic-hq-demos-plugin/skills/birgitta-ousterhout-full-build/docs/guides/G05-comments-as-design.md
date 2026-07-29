# G5 · Comments As Design

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Write each interface's comment **before** its implementation. The comment is a test the design must pass: if it is hard to write — long, hedged, full of "and also" — the interface is wrong, and the fix is to change the interface, not to labour the comment. The same rule holds at system scale: writing a design-doc entry that describes a module cleanly *is* the act of designing it, and a shape that cannot be described cleanly is a shape that needs changing.

## In Ousterhout's words

> "Writing the comments first makes documentation part of the design process. Not only does this produce better documentation, but it also produces better designs."

> "If you write comments describing the abstractions at the beginning, you can review and tune them before writing implementation code."

> "Comments serve as a canary in the coal mine of complexity. If a method or variable requires a long comment, it is a red flag that you don't have a good abstraction."

## Example

Before any code: *"Parses one CSV timesheet line into a `TimesheetEntry`; rejects malformed lines at this edge, so callers never see raw strings."* One sentence, written first — because the interface is one thing. Implementation follows the comment.

## Counterexample

The draft comment reads: *"Parses the line, and also normalises dates, and also logs skipped rows, and also updates the row counter."* Three "and also"s — the canary is dead before a line of code exists. The wrong response is to polish that sentence; the right response is to split the design until the comment gets easy.

## Checked by

**S12 · Comment Quality** and **S14 · Design Doc Fidelity** (big review), filing under the red flag **Hard To Describe** — documentation that has to be long to be complete is evidence of a missing abstraction, not of a diligent author.
