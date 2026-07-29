# G11 · Different Layers, Different Abstractions

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

## The rule

Each layer of a system should present a genuinely different abstraction from the layers adjacent to it — that difference is the layer's reason to exist. A method that does little except forward its arguments to another method with a similar signature has added a layer and no abstraction: one more interface to learn, nothing hidden in return. Remove it, or give it a real job — translation, validation, aggregation, a changed vocabulary.

## In Ousterhout's words

> "When adjacent layers have similar abstractions, the problem often manifests itself in the form of pass-through methods. A pass-through method is one that does little except invoke another method, whose signature is similar or identical to that of the calling method."

> "If a system contains adjacent layers with similar abstractions, this is a red flag that suggests a problem with the class decomposition."

## Example

The CLI layer turns `argv` into a validated `PayRunRequest` — defaults filled, paths resolved, bad input rejected with usage text — before calling `runPayRun(request)`. Below it, the calculator speaks in entries and cents, never in flags and strings. Two layers, two genuinely different vocabularies: each one earns its keep.

## Counterexample

`PayService.calculatePay(entry, rate)` whose entire body is `return PayCalculator.calculatePay(entry, rate);`. Same abstraction on both faces, nothing translated, nothing hidden — a toll booth on the call path. Deleting the layer would make the system strictly simpler.

## Checked by

**S8 · Module Depth & Layer Abstraction** (big review), filing under the red flag **Pass-Through Method**.
