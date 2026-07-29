# G12 · Pull Complexity Downward

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Where complexity cannot be removed, absorb it *inside* the module rather than exporting it to every caller as configuration parameters, flags, or edge cases each caller must handle. A module has more users than developers, so extra work inside the module is bought once, while exported complexity is paid by everyone forever. The scope is bounded: pull complexity down when it is closely related to the module's job, when doing so simplifies things elsewhere, and when it simplifies the interface — not as an excuse to swallow the whole system into one module.

## In Ousterhout's words

> "Most modules have more users than developers, so it is better for the developers to suffer than the users."

> "Thus, you should avoid configuration parameters as much as possible. Before exporting a configuration parameter, ask yourself: 'will users (or higher-level modules) be able to determine a better value than we can determine here?'"

> "Pulling complexity down makes the most sense if (a) the complexity being pulled down is closely related to the class's existing functionality, (b) pulling the complexity down will result in many simplifications elsewhere in the application, and (c) pulling the complexity down simplifies the class's interface."

## Example

Real timesheets turn out to contain two date formats. The parser absorbs that fact — it recognises both and normalises internally — so every caller sees one canonical date and no caller knows two formats ever existed.

## Counterexample

The parser instead exports a `dateFormat` option that every caller must pass, and get right, on every call. The parser's implementation stayed simple; the complexity did not go away — it was mailed to all the parser's users, who now each own a decision the parser was best placed to make.

## Checked by

**S8 · Module Depth & Layer Abstraction** (big review) — specifically its question "where has complexity been exported to callers — flags, options, edge cases every caller must handle — that the module could have absorbed?"
