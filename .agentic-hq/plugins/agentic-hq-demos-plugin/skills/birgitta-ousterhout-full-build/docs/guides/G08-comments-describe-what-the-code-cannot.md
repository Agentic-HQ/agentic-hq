# G8 · Comments Describe What The Code Cannot

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Comments exist to carry what code cannot express: the *why*, the constraint that came from outside, the units, the non-obvious ordering requirement, the rejected obvious approach. A comment that restates what the adjacent code visibly does adds noise, not information. Keep the two kinds separate: **interface comments** say what a caller needs to know and define the abstraction; **implementation comments** say how the inside works — and interface comments must never leak implementation detail, because everything they mention becomes something callers think they must understand.

## In Ousterhout's words

> "The overall idea behind comments is to capture information that was in the mind of the designer but couldn't be represented in the code."

> "The guiding principle for comments is that comments should describe things that aren't obvious from the code."

> "The first step in documenting abstractions is to separate interface comments from implementation comments. … It's important to separate these two kinds of comments, so that users of an interface are not exposed to implementation details."

## Example

`// Round half-up at the final total only — the spec forbids per-line rounding (spec §4).` Nothing in the code could tell a reader that per-line rounding was considered, is forbidden, and by whom. The comment carries exactly the knowledge that was in the designer's head and nowhere else.

## Counterexample

`// add the entry's hours to the total` above `total += entry.hours;`. Every word is visible in the line below it — the comment is maintenance load with no information. Its sibling failure: an interface comment for `calculateNetPayCents` that explains the internal deduction-table layout callers never touch.

## Checked by

**S12 · Comment Quality** (big review), filing under the red flags **Comment Repeats Code** and **Implementation Documentation Contaminates Interface**.
