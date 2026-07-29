# G6 · General-Purpose Modules Are Deeper

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Aim for **somewhat general-purpose**: functionality sized to today's need, interface general enough to support more than today's use. Do not generalise from one case — a single example cannot show you the axis of variation. **Do** generalise the moment a second case reveals it — and then design the abstraction properly in one go rather than accreting it patch by patch. Keep special-purpose code cleanly separated from general-purpose code: the general mechanism in one module, the specific uses outside it.

## In Ousterhout's words

> "the sweet spot is to implement new modules in a somewhat general-purpose fashion. The phrase 'somewhat general-purpose' means that the module's functionality should reflect your current needs, but its interface should not. Instead, the interface should be general enough to support multiple uses."

> "Once you discover the need for an abstraction, don't create the abstraction in pieces over time; design it all at once (or at least enough to provide a reasonably comprehensive set of core functions)."

## Example

Slice 2 wrote a payslip CSV writer. Slice 4 needs a summary-report CSV and finds itself copying it. That second case is the trigger: extract one `writeCsvFile(path, rows)` that owns quoting and line endings, and keep the payroll-specific row-shaping in the callers. General mechanism, special uses, clean seam.

## Counterexample

Two failures, one per direction. Premature: slice 2's writer grows delimiter, encoding and streaming options "for later" — speculative generality nobody asked for, all interface, no benefit. Overdue: slice 6 hand-rolls a *third* CSV writer because extracting felt like scope creep — now quoting bugs get fixed in three places.

## Checked by

**S9 · Change Amplification & Near-Duplicates** (big review), filing under the red flags **Repetition** and **Special-General Mixture**. The Refactorer's per-slice remit is the enforcement point: the second case appears on its watch.
