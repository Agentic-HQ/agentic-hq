# 14 — `birgitta-ousterhout-full-build` — Kick-Off Guidance (Not Plan)

> **This is a Kick-Off Guidance, not a plan.** It is a **frozen input**, handed over once, at the start of the `create-workflow` session that builds this workflow ([AHQ-193](https://agentic-hq.atlassian.net/browse/AHQ-193), Phase 3 of [12-plan-of-action.md](12-plan-of-action.md)).
>
> **The source-of-truth rule.** The `create-workflow` agent drafts **its own Workflow Spec / Plan with Steve, in its own session**. From the moment that spec exists, *it* is the source of truth for the workflow build. Changes land **there**, never back here. If the two disagree, **the create-workflow spec wins**. This document is never updated to compete with it — plans that control plans that control code rot, and this is how that is avoided.
>
> **Status:** frozen at plan step 3.3. Nothing below is a specification; it is the reasoning and the raw material the build should start from. Where it says *candidate*, *option* or *open*, it means it. **Section 3 is the exception** — the slice model is a decision, not a candidate.
>
> **One instruction that is not negotiable, for the create-workflow agent: do not read [doc 13](13-experiment-protocol-and-judging-rubric.md), and do not read anything that quotes it.** Doc 13 is the frozen measuring instrument for the experiment this workflow will be tested by. A workflow built by someone reading the marking scheme measures the marking scheme. Everything from doc 13 that legitimately constrains this build is restated in §4 below.
>
> **In practice that means three files, not one.** Alongside doc 13 itself: **`supporting-docs/fable-review-and-recommendations-for-opus-5.md`**, whose Part A is entirely doc 13 amendments and reproduces rubric detail; and **`supporting-docs/experiment-handoff/`**, which is what the *arms* receive and is none of this workflow's business. The safe rule is the simple one — **in this folder, read doc 12, this document, and [supporting-docs/full-jo-research-notes.md](supporting-docs/full-jo-research-notes.md); ask before opening anything else.**

---

## 1. What is being built, in one paragraph

An Agentic HQ workflow named **`birgitta-ousterhout-full-build`**: a chain of Claude Code Skills, each running in its own fresh context, that takes **a specification for a whole system** and **builds that system from nothing to working, tested, documented and pushed**, in a single fully-automated run. It builds **in thin vertical slices** (§3), driven by failing tests, with the design revised on every pass. Its distinguishing content is a **harness** in Birgitta Böckeler's sense — named **Guides** that steer the agent *before* it writes code, and named **Sensors** that check the work *after* it exists and drive self-correction — with the Guides drawn from John Ousterhout's *A Philosophy of Software Design* (APoSD). The name states what makes it different from everything else in Agentic HQ: **full build**, not one more feature on an existing codebase.

**Proposed identity** (the `create-workflow` session will ask for exactly these four things; all four are open to change there):

| Field | Proposed value | Why |
|---|---|---|
| `plugin-id` | `agentic-hq-demos-plugin` | Where the comparable showcase workflow (`add-feature-detailed-example`) already lives. A new plugin adds a manifest and a registration surface for no benefit — but see Q1. |
| `workflow-id` | `birgitta-ousterhout-full-build` | Fixed by the plan (doc 12, Phase 3). |
| `workflow-short-id` | `full-build` | Free — verified against every existing `ahq-workflow.json` (`create-workflow`, `quick-jira`, `full-jira`, `math`, `add-feature`, `add-feature-detailed-example`, `reversal`). |
| `one-sentence-description` | *"Builds a whole system from a specification in thin vertical slices, steered by APoSD Guides and checked by Böckeler-style Sensors."* | Appears in `agentic-hq list`. |
| `exampleParameters` | `-- --spec-file=./docs/spec.md` | **Decided (Q3).** One passthrough parameter, and `./docs/spec.md` is also its **default when not passed**. Keeps the invocation a single self-documenting line. |

---

## 2. The Ousterhout Design Principles List

**This section is the naming authority for the rest of the document.** Every Guide in §6 and every Sensor in §7 refers to these principles by the **canonical names fixed here**, in Title Case — *Modules Should Be Deep*, *Define Errors Out Of Existence*, *Comments As Design*. Where a Guide name and a principle name disagree, this list wins and the Guide gets renamed.

It sits before anything about the workflow, for two reasons.

**It is the outer ring of the coverage audit.** §7.5 checks that every Guide has a Sensor that would notice it being ignored. That audit cannot check the thing that matters more — whether every principle worth having became a Guide *at all* — because a principle nobody wrote down leaves no empty row to spot. Fixing the principle list first, **from the book rather than from whatever happened to get written**, is what makes that visible. The resulting three-column map, **Principle → Guide → Sensor**, is in §7.5.

**Red flags are the sensor-facing half of each principle.** APoSD states each principle positively, but it also names the *symptom* that shows up when one has been violated — what Ousterhout calls a **red flag**. That pairing is exactly the Guide/Sensor split (§6.1, §7.1): **a Guide states the principle to an agent that has not yet acted; a Sensor looks for the red flag in what the agent produced.** The fourteen red flags are in §2.4.

> **Four namespaces, deliberately distinct.** **O**n = an Ousterhout principle (this section). **G**n = a Guide (§6). **S**n = a Sensor (§7). **P**n / **L**n / **E**n = a workflow stage — prologue, loop, epilogue (§5). Nothing shares a prefix, so a bare `G3` or `O10` is never ambiguous in a command file.

> **The full research behind this section — every source, every quotation in full, and what was *not* checked — is in [supporting-docs/full-jo-research-notes.md](supporting-docs/full-jo-research-notes.md).** Only one quotation per principle survives into this document; a good deal of the rest is directly useful when writing command-file wording, and several quotations bear on decisions this document takes. That file is the place to look before rewording any Guide.

### 2.1 The principles

Sixteen entries, taking APoSD's own *Summary of Design Principles* and chapter structure as the backbone, consolidated where the book treats two statements as one idea. Chapter numbers are first-edition.

Each entry reads **name** — *(chapter · red flags · the Guide that carries it)* — then what it requires, then one quotation. **Unless another source is named, quotations are from the book and can be checked against [this collection of verbatim excerpts](https://www.goodreads.com/work/quotes/61938796-a-philosophy-of-software-design);** where a quotation comes from Ousterhout's own writing on the web it is linked in place.

**O1 · Complexity Is Incremental** — *ch. 2 · no red flag of its own · no Guide (§2.2)*
Complexity arrives in small increments, none of which looks like the problem by itself, and surfaces as three symptoms: change amplification, cognitive load, unknown unknowns.
> *"Complexity comes from an accumulation of dependencies and obscurities. As complexity increases, it leads to change amplification, a high cognitive load, and unknown unknowns."*

**O2 · Strategic, Not Tactical** — *ch. 3 · — · **G10***
Working code is not enough. Invest continuously in the design instead of paying later for each task's shortcut. The archetype it warns against is the **tactical tornado**: prolific, fast, and leaving the cleanup to whoever comes next.
> *"If you program tactically, each programming task will contribute a few of these complexities. Each of them probably seems like a reasonable compromise in order to finish the current task quickly."*

> **Why this is the most on-point principle in the list.** It is the closest thing in the book to a description of an autonomous coding agent — fast, prolific, produces working code, has no stake in the next six months. Reporting on its interview with Ousterhout, *The Pragmatic Engineer* reaches for exactly that phrase, describing current AI coding tools as *"akin to 'tactical tornadoes' that code fast, fix issues fast… while creating new issues and adding tech debt"* ([interview](https://newsletter.pragmaticengineer.com/p/the-philosophy-of-software-design)). A harness whose whole purpose is to make an agent work strategically should say so in a Guide rather than imply it.

**O3 · Modules Should Be Deep** — *ch. 4 · Shallow Module · **G1***
Few modules, small interfaces, substantial machinery behind them, and the common case made simplest of all. Interface size is the cost; hidden functionality is the benefit. The named failure mode is *classitis* — the assumption that more classes are better.
> *"Methods containing hundreds of lines of code are fine if they have a simple signature and are easy to read."*

**O4 · Information Hiding** — *ch. 5 · Information Leakage, Temporal Decomposition, Overexposure · **G2***
Every design decision known in exactly one place. Decompose by what each piece must *know*, never by the order in which things happen.
> *"When designing modules, focus on the knowledge that's needed to perform each task, not the order in which tasks occur."*

**O5 · General-Purpose Modules Are Deeper** — *ch. 6 · Special-General Mixture, Repetition · **G6***
Aim for *somewhat* general-purpose, and keep special-purpose code cleanly separated from general-purpose code.
> *"the sweet spot is to implement new modules in a somewhat general-purpose fashion. The phrase "somewhat general-purpose" means that the module's functionality should reflect your current needs, but its interface should not."*

**O6 · Different Layers, Different Abstractions** — *ch. 7 · Pass-Through Method, Pass-Through Variable · **G11***
Adjacent layers must not present the same abstraction. A method that only forwards its arguments has added a layer and no abstraction.
> the red flag, verbatim: *"a method does almost nothing except pass its arguments to another method with a similar signature"* — *Summary of Red Flags*

**O7 · Pull Complexity Downward** — *ch. 8 · — · **G12***
Where complexity cannot be removed, absorb it inside the module rather than exporting it to every caller.
> *"Most modules have more users than developers, so it is better for the developers to suffer than the users."*

**O8 · Better Together Or Better Apart** — *ch. 9 · Repetition, Conjoined Methods · no Guide (§2.2)*
Bring code together when it shares information, is always used together, or removes duplication; separate it only when that makes the whole system simpler.
> *"You shouldn't break up a method unless it makes the overall system simpler"*

**O9 · Define Errors Out Of Existence** — *ch. 10 · — · **G4***
Prefer designs in which the error cannot arise over designs that handle it in every caller: idempotent teardown, setup that cannot half-succeed, validation once at the edge. Distinct from omitting checks that are genuinely needed — the interview makes that caveat explicitly.
> *"Define errors out of existence"* — *Summary of Design Principles*

**O10 · Design It Twice** — *ch. 11 · — · **G3***
Produce a genuinely different second approach to any significant design decision, and compare before committing. The book's emphasis falls on *how different* the alternatives must be, which is why G3 and S15 both insist on **materially** different rather than a variation.
> *"Try to pick approaches that are radically different from each other; you'll learn more that way. Even if you are certain that there is only one reasonable approach, consider a second design anyway"*

**O11 · Comments Describe What The Code Cannot** — *ch. 12–13 · Comment Repeats Code, Implementation Documentation Contaminates Interface · **G8***
Comments carry what code cannot express — intent, rationale, units, ordering constraints — and interface comments stay separate from implementation comments.
> *"The overall idea behind comments is to capture information that was in the mind of the designer but couldn't be represented in the code."*

**O12 · Comments As Design** — *ch. 15 · Hard To Describe · **G5***
Write each interface's comment *before* its implementation. A comment that is hard to write is a design problem, not a writing problem, and the fix is to change the design. The book's chapter title is the operative instruction: *Write The Comments First*.
> *"Writing the comments first makes documentation part of the design process. Not only does this produce better documentation, but it also produces better designs"*

**O13 · Choosing Names** — *ch. 14 · Vague Name, Hard To Pick Name · **G7***
Precise, unambiguous names. A name that is hard to choose is evidence that the thing being named is not one thing.
> *"Good names are a form of documentation: they make code easier to understand. They reduce the need for other documentation and make it easier to detect errors."*

**O14 · Consistency** — *ch. 17 · — · **G7***
One concept, one name, one pattern, everywhere — and existing conventions are not to be "improved" on.
> *"Consistency creates cognitive leverage: once you have learned how something is done in one place, you can use that knowledge to immediately understand other places that use the same approach."*

**O15 · Code Should Be Obvious** — *ch. 18 · Nonobvious Code · no Guide (§2.2)*
Software is designed for ease of reading, not ease of writing — and obviousness is judged by the reader, never by the author.
> *"If your code is undergoing review and a reviewer tells you that something is not obvious, don't argue with them; if a reader thinks it's not obvious, then it's not obvious."*

**O16 · Increments Are Abstractions, Not Features** — *ch. 16 & 19 · — · **G9***
Incremental development is right; incremental *feature accretion* is not. Each increment should add or improve an **abstraction**, and every visit to existing code should leave the design slightly better than it was.
> *"Developing incrementally is generally a good idea, but the increments of development should be abstractions, not features."*

> This is the principle §3 is built on — and Ousterhout also supplies the warning about what the slice loop could degenerate into: *"One of the risks of agile development is that it can lead to tactical programming. Agile development tends to focus developers on features, not abstractions."* The loop's answer is L6, a refactor stage in every single pass whose remit is to change the design rather than add to it.

### 2.2 Principles deliberately not made Guides

Four are carried by no Guide, and that is a decision rather than an oversight: every Guide added is text the agent must read before it can start, and a wall of principles gets skimmed instead of followed. Each is still **sensed** — none is simply dropped.

| Principle | Why no Guide | Still watched by |
|---|---|---|
| **O1 · Complexity Is Incremental** | The premise of the whole harness rather than an instruction. "Keep complexity down" tells an agent nothing actionable that G1–G12 do not say more precisely. | S10 |
| **O8 · Better Together Or Better Apart** | Its actionable half is already covered from both sides — G1 pushes against over-splitting, G6 against under-generalising. A separate Guide would mostly repeat them. | S9, E1 |
| **O15 · Code Should Be Obvious** | Sensor-shaped by nature: it is judged by a reader, and the only honest test is someone who did not write it saying so. Cannot be usefully asserted in advance. | S10, S12 |
| **Separate What Matters From What Doesn't** *(APoSD's sixteenth principle; not given an O-number above)* | A restatement of O3 and O4 at system scale rather than an independent instruction. | S8, S11 |

### 2.3 Test-first, but not TDD — and the difference matters

> **Settled (Q5, Steve, 2026-07-27): the L3-before-L4 ordering stays; the *TDD* label goes.** The development is driven by the **design**, not by the tests. Every stage of this workflow — and every command file it produces — must say so. This section is the reasoning; §5.4 is the operative version.

L3 writes an executable check and L4 makes it pass, which *looks* like TDD from the outside. **Ousterhout rejects TDD** — and not mildly:

> *"The problem with test-driven development is that it focuses attention on getting specific features working, rather than finding the best design. This is tactical programming pure and simple, with all of its disadvantages. Test-driven development is too incremental: at any point in time, it's tempting to just hack in the next feature to make the next test pass. There's no obvious time to do design, so it's easy to end up with a mess."* — *APoSD*, ch. 19

and, in his own words online:

> *"However, I am not a fan of Test-Driven Development (TDD) … The fundamental problem with TDD is that it forces developers to work too tactically, in units of development that are too small; it discourages design thinking."* — [aposd-vs-clean-code](https://github.com/johnousterhout/aposd-vs-clean-code)

His stated alternative is to work in larger units — *"perhaps a few methods or a class"* — writing code first and unit tests after. He allows exactly one test-first case: *"One place where it makes sense to write the tests first is when fixing bugs."*

**Read what he is actually objecting to.** Every one of those sentences is about *what decides the design*: "too tactical", "units of development that are too small", "no obvious time to do design", "thinks only about the next test". The objection is to **letting tests drive design**. It is not an objection to knowing that a check fails before the code exists.

**This workflow does not let tests drive the design.** Its unit of development is a whole vertical slice; **L2 designs that slice, in full, against the Guides, before a single check is written**; and L4's instruction is *build what L2 designed*, not *write the minimum to go green*. The moment-to-do-design that Ousterhout says TDD lacks is a named stage that the orchestrator always runs.

**So the ordering stays and the label goes.** The failing check earns its place on a much narrower claim — that a check which has never been observed failing is not yet evidence of anything, which in a run where the same process writes both the code and the checks, reviewed by nobody, is worth a stage. Calling that "TDD" would import a design philosophy the workflow does not follow and its namesake rejects. **§5.4 states the cycle without the label.**

**One consequence to hold onto:** nothing in this document, in any command file, or in the built system's own docs should describe the process as test-driven. The honest description is *design-driven, with a failing check as the entry condition for writing code*.

### 2.4 The fourteen red flags — the sensors' shared vocabulary

APoSD names fourteen symptoms whose presence *"suggests that there is a problem with the system's design"*. Naming them here has a practical payoff: **an inferential sensor that files findings in the book's own vocabulary produces findings that can be counted and compared across slices and runs**, instead of fourteen phrasings of the same observation.

| Red flag | Appears when | Sensor |
|---|---|---|
| **Shallow Module** | the interface is not much simpler than the implementation | S8 |
| **Information Leakage** | one design decision is reflected in several modules | S11 |
| **Temporal Decomposition** | structure follows execution order rather than knowledge | S11, E1 |
| **Overexposure** | common uses force awareness of rarely used features | S8 |
| **Pass-Through Method** | a method does nothing but forward its arguments | S8 |
| **Repetition** | a non-trivial fragment appears over and over | S9 |
| **Special-General Mixture** | special-purpose code is entangled with general-purpose code | S9 |
| **Conjoined Methods** | neither can be understood without reading the other | S9, S10 |
| **Comment Repeats Code** | the comment adds nothing the adjacent code did not say | S12 |
| **Implementation Documentation Contaminates Interface** | interface comments leak internals users do not need | S12 |
| **Vague Name** | a name carries little useful information | S16 |
| **Hard To Pick Name** | no precise, intuitive name comes to mind | S16 |
| **Hard To Describe** | complete documentation for one thing has to be long | S12, S14 |
| **Nonobvious Code** | behaviour or meaning cannot be understood easily | S10 |

**Where these belong: in E1's prompt, as the finding taxonomy — not as fourteen more sensors.** Fourteen more sensors would be fourteen more passes; one shared vocabulary across the nine that already exist costs nothing.

And a caution the book supplies about itself, which matters more in an unattended run than a supervised one — it is §7.7's feedback-overload failure, stated by the source of the principles:

> *"When applying the ideas from this book, it's important to use moderation and discretion. Every rule has its exceptions, and every principle has its limits. If you take any design idea to its extreme, you will probably end up in a bad place."*

---

## 3. The core idea — thin vertical slices, not design-everything-then-build-everything

**Steve's decision, 2026-07-27. This is the defining shape of the workflow and it is not one of the open questions.**

The workflow does **not** design the whole system and then build it. It:

1. Forms **a rough idea of the major modules** and **a list of *potential* vertical slices** — deliberately shallow, explicitly revisable, and nothing more.
2. Builds **slice 1 as a walking skeleton**: the thinnest end-to-end path that touches every layer and actually runs.
3. Then **loops** — each pass scoping, designing, test-driving, building, checking and refactoring **one slice**, then committing it — and reports back either **`more_slices`** or **`no_more_slices`**.
4. Ends with a **big review and a big refactor** over the whole system, then final validation, report and push.

The system **gets fatter and fatter until it is finished**. The design is not a thing decided at the start and then implemented; it is a thing that is revised on every pass, in the light of code that now exists.

### 3.1 What deliberately does *not* happen up front

This is the part that is easy to backslide on, because designing everything feels responsible:

- **No full module decomposition.** A sketch of the major pieces, at the level of a whiteboard diagram. That is all.
- **No interfaces designed for modules that do not exist yet.**
- **No detailed design for slices 2…N.** The slice list is a set of candidate headings, not a plan. Later slices are designed when they are reached, by an agent that can see what slice 1…K actually built.
- **No commitment to the slice list.** Slices get added, dropped, split and resequenced as understanding grows. A slice list that survives the whole run unchanged is evidence the workflow was not paying attention.

### 3.2 Why this shape, and not the obvious one

**Because you cannot design what you have not built.** The genuinely hard parts of a spec reveal themselves on contact — a toolchain that will not do what the documentation implies, an interface that only looks clean until something has to use it. An up-front design is written at the moment of least knowledge.

**Because the run is unattended, and this is the failure mode that matters.** Design-everything-then-build-everything discovers integration failure at the very end, with nobody there to rescue it. Slices give the run a **monotonically improving artefact**: at any moment it dies, there is a working system, just a thinner one than intended. That difference is the difference between a result and nothing.

**Because it is what APoSD actually argues for.** Ousterhout's objection to feature-by-feature agile is not that increments are wrong; it is that the increments should be **abstractions, not features** (§2.1, O16) — accreting features without revisiting the design is the tactical programming that produces shallow modules. The slice loop answers that directly: **every pass includes a refactor stage whose remit is to change the design, not just add to it** (Guide G9). The loop without that stage would be exactly the failure Ousterhout warns about; with it, it *is* incremental design.

He puts the positive case in one sentence, and it happens to describe this loop exactly:

> *"it isn't possible to visualize a complex system well enough at the outset of a project to determine the best design. The best way to end up with a good design is to develop a system in increments, where each increment adds a few new abstractions and refactors existing abstractions based on experience."*

"Adds a few new abstractions" is L2; "refactors existing abstractions based on experience" is L6. The shape in §3 is not a compromise with APoSD — it is the shape APoSD asks for, provided L6 is real.

**Because generalisation needs a second example.** APoSD warns against special-purpose code and against speculative generality in the same breath. You cannot see the right axis of variation from one case. Slice 2 is what reveals what slice 1 should have been — which is an argument for slicing, not against it (Guide G6).

### 3.3 The walking skeleton

Slice 1 is not "the first feature". It is the **thinnest possible end-to-end path that exercises every architectural layer and actually executes** — Cockburn's walking skeleton, Hunt and Thomas's tracer bullet. It should do almost nothing, and it should do that nothing all the way through.

Its job is to prove the risky integrations early, while there is still run left to react. **It also stands up the harness** — the build, the checks, the test runner that every later slice will be policed by. That is an explicit part of slice 1's remit, not a separate prologue stage (decided, Q4; rationale in §7.2).

---

## 4. Hard constraints — the short list of things that are *not* open

Everything else in this document is guidance. These six are requirements, and each one exists for a stated reason.

### 4.1 The workflow must be **task-agnostic**

**No TailCut content anywhere in the workflow.** No eBPF, no DSCP, no ECN, no network namespaces, no mention of the benchmark rig, its scenarios or its acceptance criteria. Not in a command file, not in a bundled template, not in an example.

This is the single most important constraint in this document, and it needs saying loudly because **doc 12 — which the `create-workflow` session is pointed at for context — names specific TailCut implementation pitfalls verbatim.** Baking any of them into the workflow would be teaching to the test: the workflow would score well on a task it was hand-fitted to, and the result would mean nothing.

The legitimate, generic version of the same idea is not only allowed but wanted: **"extract every constraint and stated pitfall from the spec you are given into an explicit checklist, and verify each entry has both an implementation site and a runtime evidence step."** That is a real harness behaviour, it works on any spec, and it is what a good build process does. Naming a specific bitmask is not.

Sanity test before shipping any command file: *would this sentence still make sense if the workflow were pointed at a spec for a payroll system?* If no, it is task-specific — take it out.

### 4.2 It must run **fully unattended, end to end**

For this experiment there is **no human available for the entire run** (doc 12, TL;DR). Every stage must therefore be able to finish without asking anything. That is a design constraint on each stage, not a flag to set at the end — a stage written around a review conversation cannot be de-HITL'd by deleting the question.

The policy every stage inherits is in §8.

### 4.3 It must not depend on Jira, Confluence, or any ticket

The experiment run has no ticket. Stages may not require one, and must not stall trying to create one. (Jira MCP tools happen to be in the tool grant — see 3.5 — but that is not permission to build a dependency on them.)

### 4.4 It must run on the AHQ mechanics as they actually are

- **Every command runs in a fresh Claude Code session.** Nothing survives between stages except what is written to disk. All hand-off is by file.
- **The orchestrator is a real TypeScript program, and the chain is as expressive as you make it.** `tool.execute(command, input)` returns that command's output string, and the CLI is free to parse it and then branch, skip, repeat or loop on what it says. `full-jira-tdd-story-workflow-demo-cli.ts:55-81` is the worked example: command 01 returns a comma-separated list of test types, and the CLI runs a four-command RED → GREEN → REFACTOR-analysis → REFACTOR-execute cycle **once per test type**, with the count discovered at runtime. A `do…while` that repeats a group of stages until a command returns a sentinel is equally available and **does not need the count up front at all** — which is exactly what the slice loop needs.
- **Loop bounds and stop conditions belong in the TypeScript, not in a prompt.** An iteration cap written in the CLI is deterministic and cannot be reasoned away; the same cap written into a command file is advice an agent may talk itself out of. For an unattended run that difference is the whole safety margin.
- **Inter-command data flow — two established patterns, neither of them a platform rule.** `add-feature-detailed-example-cli.ts:93-101` uses **broadcast**: command 01 returns the combined variables string, and that same string is re-injected into every later command, whose own outputs are ignored. `full-jira` instead **builds a fresh input string per invocation** and consumes command 01's output as data — which is the pattern the slice loop needs, since the loop-control command's output is a control signal. What is true either way: **the inter-command string is small — identity, configuration, control signals.** Work product travels in files (§5.5, §5.6).
- **Each command ends by self-terminating** via `/agentic-hq-core-plugin:self-termination`.
- **Command files must be self-contained.** No "see the spec for details", no back-references to this document. The runtime agent may not have access to either, and two sources of truth is worse than one long file.

### 4.5 It runs inside a fixed tool grant

The `agentic-hq` CLI launches every command with a fixed `--allowedTools` list: `Bash`, `Edit`, `Write`, `MultiEdit`, nine Atlassian MCP tools, `Skill(agentic-hq-core-plugin:self-termination)` and `Read(<ahq-install>/.agentic-hq)`.

**Web research is not a property of this workflow — it is a property of the workspace a given run happens to sit in.** `WebSearch` and `WebFetch` are outside AHQ's built-in grant, so the **default state for any run, by any user, is: not available**. A run only gets them if that particular workspace has been granted them by hand. For the AHQ-192 experiment specifically — and only there — they are granted by a one-off `.claude/settings.local.json` written into each run workspace before the run. AHQ's own default tool list is untouched by that, so no other workflow, user or run gains anything from it.

Two rules follow, and they point in opposite directions, so both are needed:

- **The workflow may use web research, but must never *require* it.** No stage may be written so that it cannot finish when the web tools are unavailable.
- **That rule is not, by itself, protection.** Nothing stops an agent choosing to reach for a tool it does not have — and AHQ drives Claude Code through an interactive PTY, so an ungranted tool produces a **permission prompt that waits indefinitely** for a human. In an unattended run that is a hang, not a graceful degradation. The protection is the settings file being present in the run workspace and verified before the run starts, which is an operator responsibility, not something a command file can fix.

Practical consequence for §7: **the Sensors have to be things `Bash` can run, or things a Claude session can judge by reading.** There is no third category — and neither category should depend on the network.

### 4.6 It must be honest about the two things that are hard to be honest about

Baked in, not left to the agent's mood on the day:

- **Unmet targets are reported as unmet.** A stage that measures anything must be told, in the command file, that adjusting the measurement to reach the target is the failure mode under test — not the target.
- **A sensor that finds nothing says so, and says what it would have caught.** Böckeler: *"If they're always green, that's suspicious, because they never catch anything."* A silent pass is indistinguishable from a sensor that never ran.

---

## 5. The stage shape

Three parts: a short **prologue**, the **slice loop**, and an **epilogue**. The prologue and epilogue run once; the loop body runs once per slice, in fresh sessions every time.

### 5.1 Candidate stages

**Prologue — runs once**

| # | Stage | Owns | Writes |
|---|---|---|---|
| P1 | **Spec Interrogation** | Reads the spec. Extracts every requirement, constraint and stated pitfall into a **numbered requirements checklist**. Surfaces ambiguities and contradictions and resolves them under the §8 policy. | Requirements checklist; decisions register; the run-artifacts directory. |
| P2 | **Rough Shape & Slice Backlog** | The whiteboard pass. A rough sketch of the major modules — no interfaces, no detail. A candidate list of **vertical** slices, ordered, with slice 1 identified as the walking skeleton. Explicitly provisional. | Skeletal master design doc (§5.5); slice register (§5.6). |

**Slice loop — runs once per slice**

| # | Stage | Owns | Writes |
|---|---|---|---|
| L1 | **Slice Scoping & Loop Control** | Reads the requirements checklist, the slice register and the master design doc. Decides: is the system complete? If yes → **`no_more_slices`**. If no → picks and scopes the next slice, revising the backlog if what was learned demands it → **`more_slices`**. | Loop verdict (the CLI parses it); this slice's scope. |
| L2 | **Slice Design** | Designs *this slice's increment only*, against the Guides — interfaces first, errors defined out of existence, interface comments written before code. May revise existing abstractions; that is the point. **Writes the design straight into the master design doc** (§5.5) — that document *is* this stage's deliverable, not a summary of it. | Master design doc, extended by this slice; any revised interfaces. |
| L3 | **Failing Check** | Writes the executable checks for this slice **first**, runs them, and confirms they fail **for the right reason** (§5.4). Derived from L2's design — the check records the design's expectations, it does not invent them. | Failing checks; the recorded failure reason. |
| L4 | **Implementation** | Builds **what L2 designed**, scoped to this slice — not the minimum that turns the check green (§5.4). Runs the checks. **Runs the actual system**, not only the checks. | Working code; run evidence. |
| L5 | **Slice Check** | Runs the computational sensors (§7.3) — including **every earlier slice's tests**, which is the regression net that makes incremental building safe. Produces remediation-ready findings. | Findings list: `file:line`, what is wrong, what to do, severity. |
| L6 | **Refactor & Reconcile** | Acts on L5's findings. Improves the design as a design — Guide G9. **Re-runs the tests afterwards.** **Reconciles the master design doc with what was actually built** — L2 wrote the intent, this stage makes it true (§5.5). | Refactored code; reconciled master design doc; updated slice register. |
| L7 | **Commit** | Commits this slice with a message that says what the slice added, what changed in the design and why, and what the sensors caught (§5.7). | One commit per slice. |

**Epilogue — runs once**

| # | Stage | Owns | Writes |
|---|---|---|---|
| E1 | **Big Review** | The whole-system inferential sensor sweep (§7.4). Cross-cutting properties that no single slice could see. | Severity-ranked findings with citations. |
| E2 | **Big Refactor** | Acts on E1, top-down by severity, with a stated stopping point. **Re-runs the full test suite afterwards.** Records what it consciously did not do, and why. | Repaired system; remediation record; final design-doc update. |
| E3 | **Validate, Report, Commit & Push** | Full clean-clone run. Self-assessment against the spec's own acceptance criteria. Writes `RESULTS.md`. Final commit and push. | `RESULTS.md`; a pushed repo. |

Twelve command files; 2 + 7N + 3 invocations. **The seven-stage loop body stands as written** (decided, Q2) — the merges considered and rejected are recorded there.

### 5.2 The loop-control contract

This is the part the TypeScript actually depends on, so it needs to be exact.

- **L1's output carries a verdict the CLI can parse** — `more_slices` or `no_more_slices` — alongside the slice it scoped. Everything else L1 produces goes to files.
- **The CLI shape:**

  ```
  do {
    verdict = execute(L1_SCOPE)
    if (verdict is no_more_slices) break
    execute(L2_DESIGN);  execute(L3_CHECK_FAILS); execute(L4_CODE)
    execute(L5_CHECK);   execute(L6_REFACTOR); execute(L7_COMMIT)
  } while (++passes < MAX_PASSES)
  ```

- **Completion is decided against an objective oracle, not a feeling.** L1 may only return `no_more_slices` when every entry in P1's requirements checklist is either **satisfied** or **explicitly recorded as unreachable, with a reason**. "It feels done" is not a verdict.
- **A hard cap lives in the CLI.** `MAX_PASSES` is a runaway guard, not a target — suggest something generous like 20. If it is ever hit, the run says so loudly in `RESULTS.md`; a silent truncation reads as completion.
- **No progress is a stop condition.** A pass that satisfies no new checklist entry and changes nothing material ends the loop and records why. Without this, a confused L1 can return `more_slices` forever.
- **A slice may fail without killing the run.** Record the failure, leave the last good commit as the tip, and let L1 decide whether to re-scope it smaller or drop it. Design this deliberately — the alternative is a run that dies at slice 4 of 9 with nothing said.

### 5.3 Why the epilogue still exists

Per-slice refactoring is **local** — it sees this slice and its immediate neighbourhood. The properties that matter most in APoSD terms are **global**: how far a change propagates across the whole system, which design decisions ended up known in three places, what a newcomer to the finished repo has to know that is written down nowhere. None of that is visible from inside a slice. The big review is where it gets seen; the big refactor is where it gets fixed.

Two rules keep the epilogue from becoming a rewrite: **severity order**, and **a stated stopping point** with what was left recorded rather than quietly dropped.

### 5.4 The design drives the development — and the failing check comes first anyway

> **This workflow does not do TDD, and should never describe itself as doing TDD.** *(Steve's decision, 2026-07-27, Q5.)* The distinction is not pedantry — it is the whole argument for the loop's shape, and getting it wrong in a command file would push the runtime agent towards exactly the behaviour §2.3 says to avoid.

**What drives the development is the design.** P2 produces the rough shape; L2 designs this slice, in full, against the Guides, before anything executable exists. By the time a test is written, the decisions a test could have influenced have already been made deliberately, in a stage whose only job was to make them.

**What the failing check is for is proving the check can fail.** That is a much narrower claim than TDD makes, and it is the only claim being made here:

| | TDD's use of a failing test | This workflow's use |
|---|---|---|
| **Purpose** | Drive the design, one test at a time | Prove the check is capable of failing, before the code exists to satisfy it |
| **Unit** | One test | One vertical slice, already designed |
| **When design happens** | Emergent, between tests — Ousterhout's *"no obvious time to do design"* | L2, explicitly, before L3 |

Ousterhout's objection is to the first column. It does not reach the second: a check written after the implementation is a check that has only ever been observed agreeing with code that already existed, and **in this run nobody is ever going to review either the code or the test.** Writing the check first is the one cheap way to establish that it is capable of failing at all — which is S18's concern (§7.4.1), one stage earlier and for free.

So the ordering stays as it is, and the **name** goes. The cycle is:

**DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY.**

- **DESIGN (L2)** — the slice is designed, against the Guides, and written into the master design doc. This is the stage that drives everything after it.
- **CHECK-FAILS (L3)** — write the executable check, run it, confirm it fails **for the right reason**. A compilation error because the module does not exist yet **is** a valid failure; a check that fails because the check itself is broken is not. The check is derived *from the design*, not a substitute for having one.
- **CODE (L4)** — the code the design calls for, and no more scope than this slice. Then run the checks **and run the actual system**. Checks passing is not the same as the thing working, and for a system with real runtime behaviour the difference is most of the risk.
  **Note the difference from TDD here too:** the instruction is *build what L2 designed*, **not** *write the minimum that makes the test go green*. Ousterhout's specific complaint — *"TDD explicitly prohibits developers from writing more code than is needed to pass the current test; this discourages the kind of strategic thinking needed for good design"* — is about that minimality rule, and this workflow does not have it. The design is the specification for L4; the check is the evidence.
- **REFACTOR (L6)** — improve the design.
- **VERIFY (L6, after refactoring)** — run the checks **again**. Refactoring breaks things; a cycle that ends at REFACTOR does not know whether it did.
- **REGRESSION (L5)** — every earlier slice's checks run on every later slice. This is the safety net that makes "the system gets fatter" a safe operation rather than a hopeful one, and it is Böckeler's point that *"tests help us detect regressions — they tell us when we break pre-existing functionality with a change."*

**Executed is not verified.** Every stage that touches tests should carry this sentence. A passing suite proves the tests ran and agreed; a coverage number proves a line executed. Neither proves anything would have failed had the code been wrong — and in a run where the same process writes the code and the tests, with nobody reviewing either, that gap is the largest unexamined assumption in the whole build. **S18 (§7.4.1) is the sensor that examines it.**

**Stacks without a test framework:** the requirement is an **executable check that fails first and passes after** — a unit test where the stack affords one, an end-to-end assertion or a verification script where it does not. What must not happen is implementation first and a check written afterwards to agree with it.

> **Agentic HQ's own TDD rule is untouched.** This repository's `CLAUDE.md` mandates Red-Green-Refactor for code written *in Agentic HQ*, and that still stands in full — including for the work of building this workflow. §5.4 governs something else entirely: the process the workflow imposes on **the separate repository it builds from a spec**. The two never meet. The same distinction is already drawn for commits in §5.7, and for the same reason: a rule about the built system read as a rule about AHQ would be a bad misreading in both directions.

### 5.5 The master design doc — design-as-you-go, and the spine of the whole thing

**One document**, in the built system's repo, created skeletal by P2 and **touched twice per slice** — by L2 and again by L6. There is deliberately no separate per-slice design note: a second artefact means a hand-off between two fresh sessions, and the *why* of a decision ends up somewhere other than the design it explains.

**The two touches, and why they are different:**

- **L2 writes the design into it.** This is not a summary written after designing — **it is how the design gets done.** APoSD's comments-as-design (G5), at system scale: write the entry first, and if the new shape cannot be described cleanly, the design is wrong. Finding that out before implementing is the entire value; finding it out afterwards is archaeology. The rejected alternative from G3 goes here too, with its reason.
- **L6 reconciles it with what was actually built.** Designs change on contact with code. L2 wrote intent; L6 makes the document true.

**The two rules it lives by are separate, and only one of them is absolute:**

1. **It never describes a slice that has not been undertaken.** Absolute, always. No "in a future slice", no roadmap, no interfaces for modules nobody has needed yet. **This is the rule that stops big-design-up-front creeping back in through the documentation** — and it is compatible with L2 writing forward, because L2 writes forward by exactly one slice, the one being built right now.
2. **It matches what actually exists — at every slice boundary.** Not continuously: between L2 and L4 it legitimately describes something being built. What matters is that it is true again by L6, because the boundary is when the next fresh session reads it.

**Why the doc is load-bearing, not a chore:** every stage starts in a context that has never seen this system. The master design doc, the slice register and the code are the entire inheritance. A stage that writes it badly is not being untidy — it is degrading the next five sessions.

**The commit boundary is the reconciliation boundary.** L7 commits code and design doc together, so the two are never separately versioned. It also handles the abandoned-slice case for free: if a slice is dropped after L2, its design-doc changes were never committed, so nothing has to be manually unwound.

**The diff across the two touches is itself evidence.** Where L2's intent and L6's reality differ is precisely where the design had to change on contact with the code — which is worth something both to the final review and to anyone reading the finished repo afterwards.

**It is checked.** Sensor S14 asks whether it describes the system that actually exists. An incrementally-updated document drifts; something has to notice.

### 5.6 The slice register — process state, kept separate

Distinct from the design doc, and worth keeping distinct: the design doc describes **the system**, the register describes **the build**.

Per slice: what was planned, what was actually delivered, which checklist entries it satisfied, what the sensors caught, and any slice added, dropped, split or resequenced — with the reason. L1 reads it to decide what happens next; the epilogue reads it to write an honest `RESULTS.md`.

### 5.7 Commits — the history is part of the deliverable

**One commit per slice (L7), plus the final commit at E3.** A reader who was not there should be able to run `git log` and watch the system grow: walking skeleton first, then each slice thickening it.

That makes the commit message part of the product, not an afterthought. Each slice's message should say **what the slice added**, **what changed in the design and why**, and **what the sensors caught**. A message reading `wip` throws away most of the value of having committed at all.

Keep it to roughly one commit per slice. Fifty micro-commits per slice tell the same story far less legibly.

> **The AHQ repo's own commit rule is untouched.** Everything in §5.7 is about **the repository the workflow builds**, which is not this one. The project rule that only Steve commits the Agentic HQ repo, via `/git:02` and `/git:03`, still stands.

### 5.8 Sub-questions to settle in the create-workflow session

- Does P1 rewrite the spec into a form later stages read, or does every stage read the original? (Rewriting risks lossy paraphrase; not rewriting means every stage re-derives the same understanding.)
- Where does research (web, docs) belong — a stage of its own, or a licence any stage has?
- How thin is slice 1 allowed to be before it stops proving anything?
- Should L1 be allowed to declare the run unsalvageable and stop cleanly, rather than pushing a broken system through the epilogue?

---

## 6. Guides — the feedforward half

> *"Guides (feedforward controls) — anticipate the agent's behaviour and aim to steer it **before** it acts. Guides increase the probability that the agent creates good results in the first attempt."* — Böckeler, *Harness Engineering*

### 6.1 What a Guide is, in AHQ terms

A Guide is **content injected into a command file, or a bundled resource document the command file tells the agent to read, before the agent does the work of that stage.** It is not a checklist run at the end — that is a Sensor. The distinction is *timing*, and it is the whole point of the pairing.

Böckeler splits **both Guides and Sensors** into **computational** (deterministic — scripts, bootstrap tooling, language servers) and **inferential** (semantic — convention docs, skills, LLM judgement). It is a 2×2, and this document uses it as one: the Guides below are mostly inferential, the in-loop sensors of §7.3 mostly computational, the epilogue sensors of §7.4 inferential. A greenfield build starts with no computational guides at all, which is why the walking skeleton's second job is to create some (§3.3, §7.2).

### 6.2 Candidate Guides

**Each Guide's name is the canonical principle name from §2** — that is the rule, not a preference, because a Guide called something else quietly becomes a second, competing statement of the same idea. What is still worth arguing about is the *pairing of principle to the moment it bites*, and the wording of the middle column.

| Guide | Principle | What it tells the agent, before it acts | Bites at |
|---|---|---|---|
| **G1 · Modules Should Be Deep** | O3 | Prefer few modules with small interfaces hiding substantial machinery over many thin ones. A module whose interface is nearly as big as its implementation is not carrying its weight. **Do not mistake "small" for "good"** — the book's named failure here is *classitis*, and it is a failure agents are prone to. | L2, E2 |
| **G2 · Information Hiding** | O4 | Every design decision — a constant, a format, a layout — is known in exactly one place. If two modules must both know it, the boundary is in the wrong place. Do not decompose by *when things happen*. | L2, L6, E2 |
| **G3 · Design It Twice** | O10 | For any non-trivial slice, produce a **materially different** second approach and compare them against these Guides before committing. Record the rejected one and why. Two variations on the same idea is not designing it twice. | L2, E2 |
| **G4 · Define Errors Out Of Existence** | O9 | Prefer designs where the error cannot arise over designs that handle it everywhere. Idempotent teardown; setup that cannot half-succeed; validate once at the edge. **This is not licence to drop checks that are genuinely needed.** | L2 |
| **G5 · Comments As Design** | O12 | Write each interface's comment **before** its implementation. If the comment is hard to write, the interface is wrong — fix the interface, not the comment. **The same rule at system scale:** write this slice's entry in the master design doc before building it — a shape that cannot be described cleanly is a shape that needs changing (§5.5). | L2 |
| **G6 · General-Purpose Modules Are Deeper** | O5 | Functionality sized to today's need; interface general enough to support more than today's use. Do not generalise from one case — **do** generalise the moment a second case reveals the axis of variation. Keep special-purpose code cleanly separated from general-purpose code. | L6, E2 |
| **G7 · Choosing Names & Consistency** | O13, O14 | One concept, one name, everywhere, across every language in the repo. A name that is hard to choose is a signal the thing is not one thing. Existing conventions are not to be "improved" on mid-run. | L2, L4 |
| **G8 · Comments Describe What The Code Cannot** | O11 | Every non-obvious constant, every ordering requirement, every constraint the spec called out — documented where it will bite. Interface comments stay separate from implementation comments. | L4 |
| **G9 · Increments Are Abstractions, Not Features** | O16 | Each slice may **change** the design, not merely add to it. If a slice made an existing abstraction wrong, fix the abstraction — do not work around it and move on. Deferring this is how the loop degenerates into tactical programming. | L6 |
| **G10 · Strategic, Not Tactical** | O2 | Working code is not the finish line. Where a shortcut and a clean structure both pass the tests, take the clean structure; the run is not being timed. Record any shortcut you *do* take in the decisions register, so it is a known debt rather than a discovered one. | every build stage |
| **G11 · Different Layers, Different Abstractions** | O6 | Adjacent layers must not present the same abstraction. A method that only forwards its arguments to a method with a similar signature has added a layer and no abstraction — remove it or give it a reason to exist. | L2, L4, E2 |
| **G12 · Pull Complexity Downward** | O7 | Where complexity cannot be removed, absorb it inside the module rather than exporting it to callers as configuration, flags or edge cases they must each handle. | L2, E2 |

**G9 is load-bearing.** It is the single Guide that separates this workflow from feature-accretion, and it is the one an agent under time pressure will quietly skip. It deserves the strongest wording in the command file.

**G10 is the one that names what is actually being tested.** APoSD's *tactical tornado* — prolific, fast, working code, no stake in the consequences — is an uncomfortably exact description of an unattended coding agent (§2.1, O2). Every other Guide is a specific design rule; G10 is the disposition the rest of them depend on, and it is the reason a harness is being built at all.

**Twelve is close to the ceiling.** Guides are text the agent reads before it can start, and past some length they get skimmed rather than followed — which is why §2.2 records the four principles deliberately left to Sensors instead. If more are wanted later, something should come out.

**Honesty note for the write-up:** these Guides come from APoSD, and the output's design quality will be assessed partly against APoSD ideas. That overlap is inherent to the experiment — it *is* the hypothesis — and nothing needs doing about it in this build **except** the one thing §4.1 requires: keep the Guides at the level of principles, never at the level of this task's answers.

### 6.3 Delivery

1. **Inline in each command file** — simplest, matches every existing AHQ workflow, guarantees the runtime agent sees it. Costs duplication across stages that share a Guide.
2. **Bundled resource docs** under `{skills-dir}/docs/`, referenced by path — single definition, but a pointer is only as good as the agent's willingness to follow it. Böckeler found that a Markdown instruction telling the agent to consult her sensors CLI was *"quite unreliable"*; that was specifically about getting agents to run sensors rather than a general finding about resource docs, but the direction of the evidence is not encouraging for pointers of any kind.
3. **Hybrid** — operative instruction inline, fuller rationale bundled.

Given §4.4's self-contained rule, **(3) leaning heavily on (1)**. Duplication in prompts is much cheaper than a pointer the agent skips.

---

## 7. Sensors — the feedback half

> *"Sensors (feedback controls) — observe **after** the agent acts and help it self-correct. Particularly powerful when they produce signals that are optimised for LLM consumption, e.g. custom linter messages that include instructions for the self-correction — a positive kind of prompt injection."* — Böckeler, *Harness Engineering*

### 7.1 Why both halves have to exist

Böckeler's argument for the pairing: *"you get either an agent that keeps repeating the same mistakes (feedback-only) or an agent that encodes rules but never finds out whether they worked (feed-forward-only)."*

Guides without Sensors is a workflow that *asserts* quality. Sensors without Guides is a workflow that finds the same problems every run. **The pairing is the product.**

**And a structural advantage worth stating, because it is the strongest one this shape has.** Böckeler's closing difficulty is not *what* to sense but **getting the agent to actually consult the sensors at all** — she works through markdown instructions (which she found unreliable), post-edit hooks, pre-commit hooks and a custom harness extension, and treats it throughout as a compliance problem to be solved against an agent that may simply not bother.

**A staged workflow dissolves that problem instead of solving it.** The sensors run in dedicated stages — L5 every slice, E1 at the end — that the TypeScript orchestrator *always* executes. Whether the agent felt like running them is not a question the design has to ask. Nothing is being asked of the agent's compliance, because the sensor pass is not the agent's decision. That is a real difference between a staged harness and a single well-prompted session, and it is worth building deliberately rather than stumbling into.

### 7.2 The greenfield sensor problem

Böckeler's sensors are mostly **tooling**: type checkers, linters, dependency rules, SAST, coverage, mutation testing. Every one presupposes a codebase that already has a toolchain. **A greenfield build has none of it.**

Hence the walking skeleton's second job: **stand up the harness while standing up the skeleton.** Detect the stack, configure the build with warnings-as-errors, add whatever static analysis that stack affords, create the test runner, wire it all into one runnable check command, and **write down which sensors exist and which do not** — a manifest that admits its gaps is worth more than one that implies coverage it does not have.

Three specifics for that remit, each of which comes from something Böckeler observed rather than from taste:

- **Turn on the size and complexity rule family explicitly** — maximum function length, maximum file length, cyclomatic complexity, maximum argument count — **even though the stack's default preset will probably leave them off.** She found precisely that: the rules targeting the failure modes agents actually exhibit *"weren't even active in ESLint's default preset, I had to configure maximums for them first."* This is cheap on any stack and it is the highest-yield configuration decision available.
- **Make the failure messages carry what-to-do text**, wherever the tooling allows a custom message. Her natural experiment is unusually clean: cyclomatic complexity was the one rule the agent kept evading by raising the threshold instead of refactoring, and it was *"the only category where it did that"* — and the only rule for which she had not written self-correction guidance. Her conclusion: *"an indicator that the custom lint messages can indeed make quite a difference."* This is §7.6's output-shape rule applied to the **computational** sensors, not just the inferential ones.
- **Wire in a clone detector if the stack has one** (jscpd, PMD CPD and kin). Near-duplication is one of the few APoSD symptoms with genuine deterministic tooling, and it gives S9's near-duplicates question a computational half instead of leaving it entirely to judgement. Skip it if the stack has nothing usable — it is not worth building one.

Doing all this inside slice 1 rather than before it means the stack is **real** rather than guessed from the spec. **Decided (Q4).** If slice 1 proves too heavy in practice, splitting it out is a later edit.

### 7.3 In-loop sensors (computational, run at L5 every slice)

| Sensor | What it checks |
|---|---|
| **S1 · Clean Build** | Builds with warnings-as-errors at the strictest reasonable setting for the stack. The cheapest real signal in existence. |
| **S2 · Static Analysis** | Whatever linter / type checker / shell checker / formatter the stack affords. Zero-config-available beats perfect-config-eventually — **plus the handful of size and complexity rules the presets leave off** (§7.2), which are the ones that target how agents actually fail. |
| **S3 · This Slice's Checks Pass** | The failing checks written at L3 now pass. |
| **S4 · Regression** | **Every earlier slice's tests still pass.** The net that makes incremental thickening safe. |
| **S5 · Runs From Clean** | The documented build-and-run path works from a fresh clone, not from the working tree. Catches "works in the agent's directory". |
| **S6 · Idempotence & Re-run** | Setup/teardown-style operations survive being run twice; a second run works. Pairs with G4. |
| **S7 · Constraint Coverage Delta** | Which requirements-checklist entries this slice satisfied — the number L1 needs to decide whether the system is complete. This is what makes P1's checklist load-bearing rather than decorative. |
| **S15 · Design-It-Twice Evidence** | For a **non-trivial** slice, does its master-design-doc entry record a **materially different** alternative and why it was rejected? Carries G3's own qualifier deliberately: **"trivial slice — no alternative required" is a passing outcome, stated as such.** Demanding a rejected alternative from every slice, including the walking skeleton, trains fabricated strawmen — which is the failure G3's own wording warns about. Partly inferential, not merely greppable: the *presence* of an entry is mechanical, but whether the alternative was **materially** different is a judgement. Guards **G3**, per slice, while there is still run left to correct it. |
| **S17 · Design Drift vs Accretion** | Did this slice **modify existing abstractions**, or only add new files? Pure accretion — a run in which every slice only ever adds — is precisely the failure **G9** exists to prevent, and the per-slice commits (§5.7) make it visible as a diff. **Advisory, not a failure:** a genuinely orthogonal slice may legitimately only add. It exists to make L6 *consider* whether an abstraction should have moved. Wired as a hard check it becomes a false-positive generator (§7.7). |

### 7.4 Epilogue sensors (inferential, run once at E1)

Each produces citations, not impressions.

**File findings in the red-flag vocabulary of §2.4.** *Shallow Module*, *Information Leakage*, *Temporal Decomposition*, *Conjoined Methods* and the rest are the book's own names for these symptoms, and a finding filed under a shared name can be counted, compared across slices, and matched to the Guide that should have prevented it. Fourteen extra sensors would be fourteen extra passes; one shared vocabulary across the nine below costs nothing.

| Sensor | Symptom | The question |
|---|---|---|
| **S8 · Module Depth & Layer Abstraction** | Shallow Module; Overexposure; Pass-Through Method; complexity pushed upward | For each module, how big is the interface compared to what it hides? Which are wrappers? **Which methods do nothing but forward their arguments to a method with a similar signature**, and do adjacent layers actually present *different* abstractions? **And where has complexity been exported to callers** — flags, options and edge cases every caller must handle — that the module could have absorbed? Carries three Guides (G1, G11, G12); see the concentration note in §7.5. |
| **S9 · Change Amplification & Near-Duplicates** | Change amplification; special-general mixture | Pick three plausible changes the spec implies. For each, count the places that must change together — anything above one is a finding, with the files listed. **Also: where are there near-copies that have started to drift?** Two or more variants of the same thing, differing in small ways, is the symptom **G6** exists to prevent, and it only becomes visible once a second example exists. |
| **S10 · Cognitive Load & Unknown Unknowns** | Cognitive load; unknown unknowns | What must someone know to change this safely that is written down **nowhere**? APoSD's worst symptom, and the hardest to see from inside. |
| **S11 · Information Leakage** | Duplicated design decisions | Which design decisions are known in more than one place? Name the constant and every site. |
| **S12 · Comment Quality** | Comments that restate code; missing *why* | Which comments repeat their code? Which non-obvious things have no comment at all? |
| **S13 · Documentation Honesty** | — | Does the README describe the system that exists? Do stated numbers match measured ones? Are gaps stated, or quietly absent? |
| **S14 · Design Doc Fidelity** | Drift | Does the master design doc (§5.5) describe the system that actually exists — or the one it was expected to become? |
| **S16 · Naming Consistency** | Inconsistent naming; vague names | Collect the system's vocabulary. Which concepts are named more than one way across files and languages? Which names are vague enough that the thing they name is probably not one thing? Guards **G7**, and cross-language consistency is exactly what a single long context tends to lose. |
| **S18 · Test Verification Depth** | Tests that execute code without verifying it | **Do the tests actually verify anything, or merely run things?** Where the stack affords a mutation-testing tool, run it — incrementally, and through a query script so its output does not flood the next stage's context (§7.6). Where no tool exists, ask it inferentially: sample the system's public behaviours and, for each, name **which test fails if this breaks**. A behaviour with no answer is a finding. See §7.4.1 — this sensor exists for a specific reason. |

#### 7.4.1 Why S18 is not optional

Every other sensor here can be traded against time. This one should be the last to go, because **this workflow is the limiting case of the problem it detects**: the same unattended process writes the code *and* writes the tests that check the code, and no human reviews either. A test suite written by the thing it is testing, never reviewed, and asserted to be green is the softest evidence in the whole run — and S3 and S4 check only that tests **pass**, which is precisely the check that cannot notice this.

Böckeler's concrete case is worth carrying into the command file because it is so unambiguous: a file reporting **100% statement coverage and 75% branch coverage turned out to have no unit tests at all** — the coverage came from a single acceptance test passing through it — and mutation testing reported **13 surviving mutants**. Nothing in a coverage number distinguishes that file from a well-tested one.

Hence the rule that belongs alongside the cycle in §5.4: **executed is not verified.** A coverage figure is evidence that a line ran, not evidence that anything would have failed had it been wrong.

Cut freely; eighteen named sensors is a menu, not a requirement — **S18 excepted, for the reason above.** **Böckeler's finding on repeat runs is worth remembering for the one or two that matter most:** *"the second run of the analysis (without context of the first one) surfaced yet another issue that the first run did not find."*

### 7.5 Principle → Guide → Sensor coverage — the anti-encode-and-forget audit

**A Guide with no Sensor is a rule nobody ever finds out was ignored. A principle with no Guide is worse — nothing was even asked for.** §7.7's first failure mode is the former; §2 exists because of the latter. Both rings are audited here, in one table, with the gaps stated rather than quietly left.

| Principle (§2) | Guide | Sensor(s) that would notice it being ignored | Coverage |
|---|---|---|---|
| **O1 · Complexity Is Incremental** | — *(deliberate, §2.2)* | S10 | ✅ sensed, not guided |
| **O2 · Strategic, Not Tactical** | G10 | S17 Design Drift vs Accretion; S10; decisions register | ⚠️ **partial** — the observable trace of tactical work is an abstraction that should have moved and didn't (S17, advisory) or knowledge that lives nowhere (S10). Neither is a direct measure of disposition. This is the least well-sensed Guide in the set, and it is the one G10 says matters most. Known, accepted, not closed. |
| **O3 · Modules Should Be Deep** | G1 | S8 Module Depth & Layer Abstraction | ✅ direct |
| **O4 · Information Hiding** | G2 | S11 Information Leakage; S9 Change Amplification | ✅ strong |
| **O5 · General-Purpose Modules Are Deeper** | G6 | S9 (near-duplicates half) | ✅ |
| **O6 · Different Layers, Different Abstractions** | G11 | S8 (pass-through / layer half) | ✅ — *Pass-Through Method* is one of the more mechanically detectable red flags, so this is stronger than most inferential coverage. |
| **O7 · Pull Complexity Downward** | G12 | S8 (complexity-pushed-upward half) | ✅ |
| **O8 · Better Together Or Better Apart** | — *(deliberate, §2.2)* | S9 (*Repetition*, *Conjoined Methods*); E1 | ✅ sensed, not guided |
| **O9 · Define Errors Out Of Existence** | G4 | S6 Idempotence & Re-run | ⚠️ **partial** — S6 catches idempotent teardown and re-runnability, which is unusually valuable because it is *computational* and runs every slice. It does **not** catch "validate once at the edge rather than in every caller"; that is picked up only incidentally by S10/S11. Accepted, not closed. |
| **O10 · Design It Twice** | G3 | S15 Design-It-Twice Evidence | ✅ per slice |
| **O11 · Comments Describe What The Code Cannot** | G8 | S10 Cognitive Load & Unknown Unknowns; S12 | ✅ direct |
| **O12 · Comments As Design** | G5 | S12 Comment Quality; S14 Design Doc Fidelity | ✅ — these check the *result*, not the process. Whether the comment was genuinely written first is not observable, and the result is what matters. |
| **O13 · Choosing Names** | G7 | S16 Naming Consistency | ✅ |
| **O14 · Consistency** | G7 | S16 Naming Consistency | ✅ |
| **O15 · Code Should Be Obvious** | — *(deliberate, §2.2)* | S10; S12 | ⚠️ sensed, not guided — and weakly, since the book's only stated test is *another reader*, which an unattended run does not have until the work is finished. |
| **O16 · Increments Are Abstractions, Not Features** | G9 | S17 Design Drift vs Accretion | ✅ advisory — the detector is advisory by design, so this Guide is *watched* rather than *enforced*. Given G9 is load-bearing (§6.2), that residual risk is worth knowing about. |

**Two structural observations this table makes visible, which the old Guide-only version could not:**

- **S8 now carries three Guides** (G1, G11, G12). That is coherent — all three are questions about interface versus what sits behind it — but it is a concentration: one sensor having a bad run takes three principles' coverage with it. Splitting S8 is the obvious remedy if E1 proves to have room.
- **O2 is the weakest-sensed principle and the most important Guide.** Worth saying plainly rather than leaving it to be inferred from a table cell.

**Sensors with no corresponding Guide are fine and expected** — S1–S5, S7, S13 and S18 check that the thing works, is honestly described and is genuinely verified, none of which is a design principle. That direction of the audit does not need to close.

> **Know what this table still cannot tell you.** It now finds principles with no Guide as well as Guides with no Sensor — but only for principles **someone thought to list**. The list in §2 is sixteen entries drawn from one book; a design idea outside APoSD leaves no empty row here either. S18 remains the worked example of the class: test verification depth is not an APoSD principle at all, so it appears nowhere in the left-hand column, and no re-run of this audit at any level would surface it. A clean table is evidence that the declared principles are watched, and evidence of nothing else.

### 7.6 Sensor output shape

A Sensor's output is **an input to a self-correcting agent**, not a report for a human:

- **Every finding carries `file:line`** or a named function/module. A finding with no location is not actionable — drop it rather than file it.
- **Every finding carries what to do about it.** Böckeler's *"custom linter messages that include instructions for the self-correction"* — "complexity too high" is a complaint; "extract this condition into a named predicate" is a sensor doing its job.
- **Findings are severity-ranked.** L6 and E2 will not get through all of them and should spend their budget at the top.
- **Raw tool output is summarised, not pasted.** Böckeler wrote a script specifically to stop a tool's JSON *"clogging the context window"*. A sensor that floods the next stage's context has made things worse.

### 7.7 The failure modes, named so they can be designed against

- **Encode-and-forget.** Guides never checked — and, one ring further out, principles never made into Guides. **§7.5 is that audit, already done in both directions**: every principle mapped to its Guide, every Guide to the Sensor that would notice, with the four residual gaps (G10's partial, G4's partial, G9's advisory-only, O15's weak) stated rather than papered over. Redo it if the principles, Guides or Sensors change; a mapping table that is not maintained is itself an encode-and-forget.
- **Always green.** *"If they're always green, that's suspicious."* §4.6 makes saying so mandatory.
- **False positives on legitimate patterns.** Böckeler's coupling analysis produced two of them: it called her deliberate dependency-injection factory one of the biggest issues in the codebase, and separately declared a deliberately shared schema *"a 'god module'"*. Both were purposeful. Let L6/E2 record an **accepted** finding with a reason, rather than only fix-or-drop — otherwise the noise trains the next agent to ignore the sensor.
  **The encouraging half of the same story:** a richer semantic review over the actual code — rather than over coupling metrics alone — recognised those patterns as purposeful. Her conclusion was that *"the coupling data only is too shallow and lacks context of the full code"*. That is an argument for giving an inferential sensor **the code, not just the numbers**, and it is why §7.4's sensors are framed as questions about the repository rather than as thresholds over metrics.
- **Feedback overload.** Her exact worry: *"sending it into a spiral of over-engineered refactorings."* This is the characteristic failure of a fully-automated run with nobody to say "enough". Severity ranking plus an explicit stopping rule at L6 and E2 is the cheap defence.

---

## 8. The no-human-available policy

Every stage inherits the same policy, and it should appear in **every** command file in close to these words — a stage unsure whether it may proceed will stall, and a stalled run is a dead one:

> There is no human available at any point in this run. Do not ask questions and do not wait for approval. Wherever you would normally ask, choose the option you would have recommended, write the decision and its reason into the decisions register, and continue.

Two things make this more than a slogan:

1. **A decisions register**, created by P1 and appended to by every later stage: what was decided, the alternatives, why, and which stage decided it. It is how a reader afterwards tells a considered choice from an accident — and it is what makes "fully automated" defensible rather than opaque.
2. **A stopping rule.** A stage that cannot finish records the blockage, does the parts that are not blocked, and states plainly what was left undone. The failure to design for is a stage that neither finishes nor admits it did not.

**HITL is explicitly out of scope for this build.** Real workflows would have human review points, and this one may grow them later. Build the autonomous version only, and **mark in the stage documentation where a human review point would naturally go** — L1's scoping verdict and E1's findings are the obvious two — so a HITL variant later is an edit rather than a redesign.

---

## 9. What "done" looks like for the workflow build itself

Not for the system the workflow builds — for the workflow, at the end of Phase 3:

1. It exists under `{plugin-dir}/commands/{workflow-id}/` and `{plugin-dir}/skills/{workflow-id}/`, with `ahq-workflow.json`, `SKILL.md`, the TypeScript CLI and its `package.json` / `tsconfig.json` / `.npmrc` / `pnpm-workspace.yaml`.
2. `agentic-hq list` shows it and its short id resolves.
3. **The loop actually loops.** The CLI's `do…while`, the `more_slices` / `no_more_slices` parse, the `MAX_PASSES` guard and the no-progress stop are all exercised at least once — ideally against a tiny throwaway spec, which is the only honest way to know the control flow works before the real run.
4. Each command file stands alone: variables established at the top, work in the middle, output written, self-termination at the end.
5. Documented the way other AHQ workflows are — a user help doc, and per-command help docs if the shape warrants them.
6. Smoke-tested as far as the Mac allows. The full proof that it runs in the VM is plan step 4.6, not this phase.
7. The workflow produces, in the system it builds: a **master design doc** kept current, a **slice-by-slice commit history**, and **`RESULTS.md`** at the repo root — what was built, how to build and run it from a clean clone, measured headline results, a pass/fail self-assessment against the spec's own acceptance criteria, and known gaps and shortcuts. All committed and pushed. Unpushed work does not exist.

---

## 10. Open questions for Steve

*(doc-01 convention: recommendation first, answer in place.)*

### Q1. Which plugin should it live in?

`agentic-hq-demos-plugin` holds every existing demo workflow including `add-feature-detailed-example`. A new plugin (say `agentic-hq-harness-plugin`) would signal this is a real workflow rather than a demo, at the cost of a new manifest and another registration surface.

**Recommended answer: `agentic-hq-demos-plugin`.** It is where the comparable showcase already lives, it is the create-workflow default, and a plugin boundary buys nothing here. Moving it later is a rename plus a manifest edit.

**Answer:**. Agree

### Q2. Seven stages in the loop body — too many?

Seven stages × N slices is the bulk of the run. The candidate merges: **L1+L2** (scope and design together — but then the loop-control verdict shares a context with design work), **L5+L6** (check and fix together — but a stage that both judges and fixes is marking its own homework in one context, which is exactly what a fresh session prevents), and **L6+L7** (refactor then commit — cheap and low-risk, since committing is a small deterministic act).

**Recommended answer: take seven in as the straw man and cut in that order — L6+L7 first, L1+L2 second, and resist L5+L6 hardest.** Merging refactor and commit costs almost nothing; merging check and fix costs the independence that makes the check worth having.

**Answer:** 7 in the loop body is fine. Leave as is.

### Q3. Does the workflow take the spec as a CLI parameter, or find it?

A passthrough parameter (`agentic-hq full-build -- --spec-file=./spec.md`), or a convention (a fixed filename in `project-root`).

**Recommended answer: a `--spec-file` passthrough parameter with a sensible default.** Explicit, matches how `full-jira` takes `--jira-id`, and it keeps the run's invocation a single self-documenting line that can be pasted verbatim into the write-up.

**Answer:** Agree. Just change to --spec-file=./docs/spec.md and if not passed, use that as the default.

### Q4. Does the walking skeleton stand up the sensor harness, or does a prologue stage do it?

Inside slice 1, the stack is real and the harness can be fitted to what exists — but slice 1 gets heavy. As a prologue stage it is cleanly separated, but it has to guess the stack from the spec before any code exists.

**Recommended answer: inside slice 1, as an explicit part of its remit.** "The walking skeleton includes the harness that will police everything after it" is a clean rule, it fits the tooling to a stack that actually exists, and it saves a stage. If slice 1 proves too heavy in practice, splitting it is a later edit.

**Answer:** Agree

### Q5. TDD is in the loop, and Ousterhout rejects TDD. What do we do?

*(Raised 2026-07-27, from the research in §2.3. This one was not visible until the principles were sourced properly.)*

§5.4 orders **L3 failing tests → L4 implementation**. Ousterhout calls that ordering *"tactical programming pure and simple"* and says TDD *"discourages design thinking"* (§2.3 quotes both, at length). His alternative — *"design first, then code, then write unit tests"* — is the same seven stages with two swapped.

**In the workflow's favour:** its unit of development is a whole slice, and L2 designs that slice before any test exists. Ousterhout's specific objection is that TDD leaves *"no obvious time to do design"*; a dedicated design stage answers exactly that. The remaining disagreement is narrow — but it sits in the part of the loop that runs N times.

The three options:

| | Shape | Cost |
|---|---|---|
| **(a) Keep test-first** | L2 design → **L3 tests** → **L4 code** | Ships a stage ordering the workflow's namesake has published against. If the write-up reaches John, it is the first thing he notices. |
| **(b) Switch to bundling** | L2 design → **L3 code** → **L4 tests** | Loses the RED-proves-the-test-can-fail property — which matters *more* here than in normal development, because one unattended process writes both the code and the tests and nobody reviews either. That is precisely what S18 exists for. |
| **(c) Hybrid** | Bundling as the default; test-first retained for bug fixes, which is the one case Ousterhout explicitly endorses | Two orderings in one loop is more to specify, and the loop body has to make the choice unambiguous rather than leaving it to judgement. |

**Recommended answer: (a), with the disagreement stated openly** — in the workflow's own documentation, not only here. The RED step's guarantee is worth more in an unattended run than the stylistic alignment is, and the honest version ("we kept test-first, here is why, here is what he says about it") is a stronger position than either quietly ignoring him or quietly obeying him. But this is a judgement call about a workflow bearing his name, so it is Steve's.

**Answer:** I agree (a).  This is because we are getting the AI to properly do the Design first (big, minimal design first - then a design for each slice) before writing the failing test.  So the failing test is not being used to force the design of the code, it's being used to force us to know the test fails before the code is written.  So - leave it - but with big caveat that this isn't Test Driven Dev - the Dev is driven by the Design (not the Test).  We should update this whole doc to get rid of the idea it implements TDD - the design drives the development, not the tests.

---

## 11. Sources

- Birgitta Böckeler, [**Harness Engineering**](https://martinfowler.com/articles/harness-engineering.html) — Guides and Sensors, feedforward and feedback, computational vs inferential, the steering loop, and the failure modes in §7.7.
- Birgitta Böckeler, [**Maintainability sensors for coding agents**](https://martinfowler.com/articles/sensors-for-coding-agents.html) — the sensor taxonomy by timing, the deterministic/LLM-judge trade-off, the preset-gap and custom-message findings in §7.2, the coverage-versus-mutation-testing case in §7.4.1, and the practical findings on noise, cost and sensors being ignored.
- John Ousterhout, [***A Philosophy of Software Design***](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) — the sixteen principles in §2.1, the fourteen red flags in §2.4, every Guide in §6.2, and the incremental-design argument in §3.2. Quotations are checkable against [this collection of verbatim excerpts](https://www.goodreads.com/work/quotes/61938796-a-philosophy-of-software-design), which also carries the book's two summary appendices in full.
- John Ousterhout & Robert C. Martin, [**A Philosophy of Software Design vs. Clean Code**](https://github.com/johnousterhout/aposd-vs-clean-code) — Ousterhout's own words, published by him on the open web: deep versus shallow methods, entanglement, why comments are load-bearing, and the fullest statement of his position on TDD (§2.3).
- Gergely Orosz, [**The Philosophy of Software Design – with John Ousterhout**](https://newsletter.pragmaticengineer.com/p/the-philosophy-of-software-design) (*The Pragmatic Engineer*, April 2025) — Ousterhout on why design matters *more* as agents write more code, and the "tactical tornadoes" framing applied to AI tools (§2.1, O2). Note the takeaways are Orosz's summary of the conversation rather than verbatim Ousterhout, and are attributed that way.
- [**supporting-docs/full-jo-research-notes.md**](supporting-docs/full-jo-research-notes.md) — the full research pile behind §2: every source with its provenance, every quotation collected in full and organised by principle, the complete TDD dossier, and an explicit list of what was *not* checked. Read this before rewording any Guide.
- Alistair Cockburn, *walking skeleton*; Andrew Hunt & David Thomas, *The Pragmatic Programmer*, *tracer bullets* — §3.3.
- `full-jira-tdd-story-workflow-demo-cli.ts` — the proof that runtime-length loops work in an AHQ CLI (§4.4), and the precedent for splitting write-the-check, write-the-code and refactor into separate commands. **Its RED/GREEN/REFACTOR naming is that workflow's, not this one's** — see §2.3 and §5.4 for why this workflow does not use TDD vocabulary.
- `add-feature-detailed-example` — the reference for **AHQ mechanics only**. Its command files for the command-file shape; its CLI for the broadcast pattern. Not a template to mutate: it encodes a per-feature shape, which is the thing this workflow is not.
