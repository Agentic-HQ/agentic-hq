# G10 · Strategic, Not Tactical

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

**Load-bearing — one of the five Guides this workflow leans on hardest.** Every other Guide is a specific design rule; this one is the disposition they all depend on.

## The rule

Working code is not the finish line, and the run is not being timed. Tactical programming asks "what is the smallest change that does what I need?" — and each answer seems a reasonable compromise, which is exactly how complexity accumulates. Where a shortcut and a clean structure would both pass the checks, take the clean structure. Any shortcut you *do* consciously keep goes in the decisions register with its reason — a known debt, not a discovered one. The book's archetype for the tactical extreme — prolific, fast, working code, no stake in what comes next — is an uncomfortably exact description of an unattended coding agent, which is why this Guide applies to every stage that builds anything.

## In Ousterhout's words

> "The first step towards becoming a good software designer is to realize that working code isn't enough. It's not acceptable to introduce unnecessary complexities in order to finish your current task faster. The most important thing is the long-term structure of the system."

> "Unfortunately, when developers go into existing code to make changes such as bug fixes or new features, they don't usually think strategically. A typical mindset is 'what is the smallest possible change I can make that does what I need?'"

> "If you program tactically, each programming task will contribute a few of these complexities. Each of them probably seems like a reasonable compromise in order to finish the current task quickly. However, the complexities accumulate rapidly."

## Example

The tax thresholds go in one named module with a comment citing their source in the spec — even though pasting them inline in the calculator would pass every check today. The clean structure cost one extra file and bought every future change one obvious home.

## Counterexample

The thresholds are pasted inline "to get the check green", and nothing is recorded. The check passes; the debt exists; nobody knows. The next slice finds the numbers by accident, mid-bug — the discovered kind of debt, which is the kind this rule forbids.

## Checked by

No single sensor — deliberately. The decisions register's shortcut entries are its audit trail, **S13 · Documentation Honesty** (big review) catches the unrecorded kind, and the whole big review is its retrospective judge. Findings that trace back to tactical shortcuts rank high in severity.
