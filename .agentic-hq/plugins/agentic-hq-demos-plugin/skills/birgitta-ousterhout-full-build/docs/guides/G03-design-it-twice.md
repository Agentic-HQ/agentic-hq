# G3 · Design It Twice

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

**Load-bearing — one of the five Guides this workflow leans on hardest.**

## The rule

For any substantial design decision, produce a **materially different** second approach and compare the two before committing. Record the rejected one and the reason it lost. Two variations on the same idea is not designing it twice. The comparison is cheap — a sketch of the most important interfaces, not a second implementation. Where something is genuinely trivial, an honest recorded ruling of "trivial — no alternative required" beats a fabricated strawman that teaches the next reader nothing.

## In Ousterhout's words

> "Designing software is hard, so it's unlikely that your first thoughts about how to structure a module or system will produce the best design. You'll end up with a much better result if you consider multiple options for each major design decision: design it twice."

> "Try to pick approaches that are radically different from each other; you'll learn more that way."

> "You don't need to pin down every feature of each alternative; it's sufficient at this point to sketch out a few of the most important methods."

## Example

Payslip rendering, sketched twice: (A) template files rendered by an engine; (B) direct string building in one writer module. B wins — the spec has exactly two output shapes, and A costs a dependency plus an indirection for flexibility nothing needs. The loser and the reason go in the design doc; a later slice that suddenly needs six output shapes can see exactly which assumption expired.

## Counterexample

"Considered Handlebars vs Mustache, chose Handlebars." Two brands of the same approach — templating was never questioned, nothing was learned, and the record only pretends the thinking happened.

## Checked by

**S15 · Design-It-Twice Evidence** (slice check): is a materially different rejected alternative recorded — or the explicit "trivial slice — no alternative required" ruling, which is a passing outcome? Whether the alternative was *materially* different is judged against this document.
