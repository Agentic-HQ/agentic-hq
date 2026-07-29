# Workflow Potential Refactorings: birgitta-ousterhout-full-build

**Generated**: 2026-07-29

## AI-Suggested Refactorings

### Refactoring 1: Extract `parseSliceVerdict` as a free function symmetric with `parseCoverageDelta`

**What**: The CLI has two strict control-output parsers, but they live at different levels: `parseCoverageDelta` is a pure free function, while the L1 verdict exact-match sits inside the `FullBuildRun.getSliceVerdict` method. Extract the verdict parsing into a free function `parseSliceVerdict(l1Output: string): SliceVerdict` next to `parseCoverageDelta` (same throw-with-full-output contract); `getSliceVerdict` shrinks to execute-then-parse.

**Why**: The control contract — the CLI's whole reason for existing — is currently visible in two different shapes. Putting both parsers side by side as pure functions makes the contract readable in one place and makes each parser independently testable without constructing a `FullBuildRun`.

**AI Recommendation**: DO — small, behaviour-preserving, and it strengthens exactly the part of the file the spec cares most about.

**Human Decision**: APPROVE

**Status**: DONE — `parseSliceVerdict` extracted beside `parseCoverageDelta`; `getSliceVerdict` is now execute-then-parse; typecheck clean.

### Refactoring 2: Name the pass number once instead of spelling it two ways around a field mutation

**What**: In `runNextPass`, the current pass's number is spelled `this.passesCompleted + 1` for the L1 call, then `this.passesCompleted += 1` happens, then `runSliceStages` reads the freshly mutated field for L2–L7. Compute `const passNumber = this.passesCompleted + 1` once at the top, pass it explicitly to both `getSliceVerdict(passNumber)` and `runSliceStages(passNumber)`, and do the `passesCompleted` increment in a single clearly-placed spot after the stages complete.

**Why**: Today the same conceptual number is written two different ways, and correctness depends on the mutation landing between two method calls — an ordering trap for any future edit that reorders the loop body. One named value removes the trap; observable behaviour is unchanged (the cap gate and E3's `passes-completed` see identical values).

**AI Recommendation**: DO — a clarity fix to the loop body, which is the code a future maintainer is most likely to touch.

**Human Decision**: APPROVE

**Status**: DONE — `runNextPass` names `passNumber` once, passes it to `getSliceVerdict` and `runSliceStages`, increments `passesCompleted` in one place after the stages complete; typecheck clean.

### Refactoring 3: Deduplicate the workflow description shared by `ahq-workflow.json` and the CLI

**What**: The one-sentence workflow description appears verbatim in both `ahq-workflow.json` (`description`) and the CLI's `.description(…)`. A dedup would make one the source — e.g. the CLI reading `ahq-workflow.json` at startup, or a codegen step.

**Why**: Classic information leakage — one decision known in two places, free to drift apart.

**AI Recommendation**: SKIP — bridging JSON→TS needs a runtime file read (a new failure path in a deliberately dependency-light CLI) or a build step (heavy machinery for a sentence that essentially never changes). The drift risk is lower than the cost; noting it here is the right-sized response.

**Human Decision**: REJECT

## Human-Suggested Refactorings

Prompt to AI:

 The whole point of this workflow was to tell the AI a bunch of rules that must be followed and then to confirm that they've been followed, and these are John Ousterhout's rules.  I'm a bit worried that during the specs stage, the AI came up with something like 20 rules, which I think will just end up getting ignored or not. I don't know. Please tell me: go and review the places where these rules are set, and also make sure that the AI is not getting overloaded. Also make sure that the rules are very clear, and tell me about them briefly.

  I want to know about the top five that are really focused on. I want to know that every single time a slice is added, these rules are very clearly explained with examples, and then the censors use those same explanations.

  My thinking is that we should add a documentation file that contains at least probably just the key five things that we really want to make sure are in the context of the AI before it starts writing any of the slices. Before it does the main overall plan at the beginning and in the context every time the AI runs its sensor check I'm actually thinking we should make these five top five most important things very clear, and the other things we should list but not focus so much on the top five should definitely have examples and counterexamples.

Additional Prompt to AI about this after hearing the GUIDE.md suggestion:

I quite like that the rules that are applicable to that stage of development are in the command that is relevant. That is actually a powerful thing because it means that the rules or principles are very targeted and only to the agent that it applies to.  What you've said makes me think there's scope for doing somewhere halfway between what I suggested and what you're suggesting. I don't know. I'm up in the air here. Please really think about this and give me your best answer.

  Describe what this guide thing is. I think it can probably complement the per-command-specific things to focus on, and then the command actually contains the things that apply to that command. I don't know. I'm a bit worried that the guide will contain things that are completely irrelevant sometimes to the command. That's something I really want to avoid.

  Should we have a guide? Maybe we have a document per guide, and the commands are just told to load the relevant guide documents and read them. Those guide documents contain examples and counter-examples. What do you think of that as a final thing? Let me know. It's a difficult one.





### Refactoring 4 (human-suggested): One document per Guide — examples and counterexamples, loaded only where relevant

**What**: Add `{skills-dir}/docs/guides/` with twelve files, `G01-modules-should-be-deep.md` … `G12-pull-complexity-downward.md`. Each guide doc is the single home of that Guide's canon: the general rule (2–4 sentences), its Ousterhout quotation where the built texts carry one, one short concrete example, one counterexample (payroll-calculator domain, matching the SAMPLE docs), and a **Checked by** line naming the sensor(s) that judge it. The five load-bearing Guides — **G9, G1, G2, G3, G10** — carry a marker line saying so. The command files keep only short stage-specific application notes (how the rule applies at that stage) plus an instruction to read their stage's guide docs via a new `guides-dir` variable. Everything the guide docs now own — general rule definitions, the Ousterhout quotations, conceptual explanation — is **removed** from the command files, not kept alongside: any text an agent reads twice (once in the command, once in the doc it is told to read) is duplication that can drift and teaches skimming.

**Who reads what** (per-stage targeting preserved — no command ever loads an irrelevant Guide):

| Command | Guide docs read |
|---|---|
| 02 Shaper | G9, G1, G2, G3, G10 — the five load-bearing Guides, before the overall shape |
| 04 Slice Designer | G1–G5, G7, G10–G12 |
| 06 Implementer | G7, G8, G10, G11 |
| 07 Slice Checker | G3, G9 — the Guides its sensors S15/S17 judge |
| 08 Refactorer | G9, G2, G6, G10 |
| 10 Big Reviewer | all 12 — whole-system remit; findings against the five load-bearing Guides weigh heavier in severity |
| 11 Big Refactorer | G1, G2, G3, G6, G10, G11, G12 |

Commands 01, 03, 05, 09 and 12 are unchanged — they carry no Guides today and need none (env-check/extraction, loop steering, check derivation, close-out commit, reporting).

**Why**: Four problems at once. (a) The Guides were explained only inline and abstractly — no worked examples anywhere, and nine abstract principles in a row (Command 04) is the shape that gets nodded past. (b) The Shaper saw zero Guides before drawing the overall shape. (c) The sensor stages restated the same concepts in their own words in different files, so designer and checker never shared one explanation. (d) A single combined GUIDES.md — the first idea considered — would force irrelevant content into most stages, teaching agents that some of what they read doesn't apply, which licenses skimming. One doc per Guide fixes all four, and is Information Hiding (G2) applied to the rules themselves: each Guide's explanation known in exactly one place, each command importing only the knowledge it needs. The split is clean because the two layers carry different content: **definition** (rule + quote + example + counterexample) lives in the guide doc; **stage application** (how the rule bites at this stage — already genuinely different per stage in the built texts) stays inline. Nothing is duplicated, so nothing can drift.

**Top-five emphasis lives in three places**: the five docs carry the load-bearing marker; commands with long guide lists say which of their Guides are among the five; Command 10's sweep ranks findings against the five higher in severity.

**Spec amendment note**: the APPROVED spec's "Guides inline at their stages" decision is hereby amended to "stage application inline; canon in per-guide docs read at the stage". Recorded here (and noted in 03a) rather than by rewriting the approved spec artifact.

**Human Decision**: APPROVE

**Status**: DONE — 12 guide docs written in `{skills-dir}/docs/guides/` (`G01`–`G12`, each: rule · verified Ousterhout quotes · payroll example · counterexample · Checked-by sensors; the five load-bearing docs carry the marker line). Guide content sourced from the full research notes, doc 14 §6.2, and freshly fetched verified quote pages — no fabricated quotations. Seven commands wired: 02 gains the Five Load-Bearing Guides section; 04, 06, 08, 11 had their guide sections replaced with read-instructions plus one-line stage application notes (quotes and general definitions removed per the dedup instruction — the guide docs are now the single source); 07's Step 1 reads G03/G09 and its S15/S17 bullets judge by them; 10's Step 1 reads all twelve, its findings weigh the five heavier in severity, and sensors S8/S9/S11/S12/S16 are tagged with the Guides they judge. All seven get the `guides-dir` variable in Step 0b. Command 11's moderation quotation kept inline (not one of the twelve docs). Commands 01, 03, 05, 09, 12 untouched. Compliance sweep re-run clean: no AHQ-192/doc-14/TailCut references, TDD only in 05's disclaimer, every referenced guide filename exists, guide docs placeholder-free.

## Instructions

Mark each **Human Decision** above as APPROVE or REJECT (and add any of your own refactorings), then tell the AI to proceed. Approved refactorings will be implemented and marked done in this file; the workflow's output will not be written until this review is complete.
