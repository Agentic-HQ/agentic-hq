# G1 · Modules Should Be Deep

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

**Load-bearing — one of the five Guides this workflow leans on hardest.**

## The rule

Prefer a few modules with small interfaces hiding substantial machinery over many thin ones. A module's interface is its **cost** — complexity imposed on everyone who uses it; the functionality hidden behind that interface is its **benefit**. A module whose interface is nearly as big as its implementation is not carrying its weight. Do not mistake "small" for "good": the named failure is **classitis** — the assumption that more classes are always better — and it is a failure automated coders are especially prone to.

## In Ousterhout's words

> "Module depth is a way of thinking about cost versus benefit. The benefit provided by a module is its functionality. The cost of a module (in terms of system complexity) is its interface. … Interfaces are good, but more, or larger, interfaces are not necessarily better!"

> "Methods containing hundreds of lines of code are fine if they have a simple signature and are easy to read."

## Example

`calculateNetPayCents(timesheet, rates)` — one call, two arguments, one integer out. Behind it: overtime banding, deduction ordering, and the rule that rounding happens once at the total. Callers learn one signature; the payroll rules can change without any caller noticing. Deep: small surface, real machinery.

## Counterexample

`PayStrategyFactory` creates a `PayStrategy`, which needs a `PayContext`, which wraps `PayCalculatorImpl` — four classes, each a few lines forwarding to the next. Three interfaces to learn before any pay gets calculated, and no machinery hidden anywhere. Individually "clean"; collectively classitis.

## Checked by

**S8 · Module Depth & Layer Abstraction** (big review), filing under the red flags **Shallow Module**, **Overexposure** and **Pass-Through Method**.
