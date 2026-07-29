# G2 · Information Hiding

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

**Load-bearing — one of the five Guides this workflow leans on hardest.**

## The rule

Every design decision — a constant, a format, a layout, an ordering — is known in exactly **one** place. If two modules must both know it, the boundary between them is in the wrong place. The most common way this goes wrong is **temporal decomposition**: structuring the system by *when things happen* (read, then validate, then compute, then write) instead of by *what each piece must know* — the steps of a sequence usually share knowledge, and splitting by step scatters that knowledge across all of them. Leakage does not require the secret to appear in an interface: two modules that silently both depend on the same format are already coupled.

## In Ousterhout's words

> "When designing modules, focus on the knowledge that's needed to perform each task, not the order in which tasks occur."

> "Suppose two classes both have knowledge of a particular file format (perhaps one class reads files in that format and the other class writes them). Even if neither class exposes that information in its interface, they both depend on the file format: if the format changes, both classes will need to be modified."

## Example

Only `parseTimesheetLine` knows the timesheet CSV's column order. Everything downstream receives `TimesheetEntry` values. When a column is added, one function changes and every caller survives untouched.

## Counterexample

The parser knows column 3 is hours-worked — and so does the report writer, which re-reads the raw line "for display". The column order now lives in two files; adding a column is a two-file change, and one of the two will eventually be missed. That is Ousterhout's reader/writer example, in payroll clothing.

## Checked by

**S11 · Information Leakage** and **S9 · Change Amplification & Near-Duplicates** (big review), filing under the red flags **Information Leakage** and **Temporal Decomposition**. At every slice, the Refactorer repairs leaks by moving the boundary — never by synchronising the copies.
