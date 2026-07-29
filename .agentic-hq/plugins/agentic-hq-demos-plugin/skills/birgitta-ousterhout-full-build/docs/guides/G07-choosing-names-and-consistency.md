# G7 · Choosing Names & Consistency

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

One concept, one name, everywhere — across every file and every language in the repo. Names are documentation: precise ones reduce the need for every other kind. A name that is hard to choose is not a writing problem, it is a design signal: the thing being named is probably not one thing. And existing conventions are not to be "improved" on mid-run — the value of consistency is almost always greater than the value of a locally better idea.

## In Ousterhout's words

> "Good names are a form of documentation: they make code easier to understand. They reduce the need for other documentation and make it easier to detect errors."

> "If it's hard to find a simple name for a variable or method that creates a clear image of the underlying object, that's a hint that the underlying object may not have a clean design."

> "Having a 'better idea' is not a sufficient excuse to introduce inconsistencies. Your new idea may indeed be better, but the value of consistency over inconsistency is almost always greater than the value of one approach over another."

## Example

The thing a timesheet line becomes is a `TimesheetEntry` — in the parser, the calculator's signatures, the test names and the design doc. A reader who learns the word once can follow it through the whole system without re-proving what it means.

## Counterexample

`entry` in the parser, `record` in the calculator, `timesheetLine` in the tests — one concept wearing three names, so every reader must keep re-establishing that they are the same thing. Worse: a later slice "upgrades" to `WorkLogItem` because it seemed clearer, and now the vocabulary itself has drifted mid-system.

## Checked by

**S16 · Naming Consistency** (big review), filing under the red flags **Vague Name** and **Hard To Pick Name**.
