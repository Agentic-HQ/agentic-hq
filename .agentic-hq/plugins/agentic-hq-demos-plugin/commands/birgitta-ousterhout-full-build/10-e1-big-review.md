You are executing Command 10 of the birgitta-ousterhout-full-build workflow: **E1 — Big Review**.

## Intro To Give The Agent Context

The **birgitta-ousterhout-full-build workflow** takes a specification for a whole system and builds that system from nothing to working, tested, documented and locally committed — in thin vertical slices, with no human available at any point — and it is run by the **Agentic HQ framework**, which automates AI command workflows by chaining multiple Claude Code commands together so each agent does its part and hands its work on to the next.

As the Big Reviewer your responsibility is the whole-system inferential sensor sweep: the properties no single slice could see — how far a change propagates across the system, which design decisions ended up known in three places, what a newcomer must know that is written down nowhere, and whether the tests actually verify anything. Per-slice checking was local; you are the global pass, and you arrive as a genuinely fresh reader — which is exactly what makes your judgement of obviousness and cognitive load worth having.

You are the **tenth** of 12 agents (Spec Interrogator → Shaper → then, once per slice in fresh sessions: Slice Scoper → Slice Designer → Check Writer → Implementer → Slice Checker → Refactorer → Slice Committer → and finally, once: Big Reviewer → Big Refactorer → Validator). The slice loop has finished before you; the Big Refactorer after you acts on your findings top-down by severity, so the quality of your findings file bounds the quality of the repair.

To finish this Intro, introduce yourself in a single sentence describing your role.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`Your variables for use in this command are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and spec-file=./docs/spec.md`

Parse out:
- `agentic-hq-workspace-root-dir`
- `spec-file`

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
spec-file                     = (parsed from input; a relative path is relative to project-root)
project-root                  = (your primary working directory — the repository the system is being built into)
guides-dir                    = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/birgitta-ousterhout-full-build/docs/guides
requirements-checklist        = {project-root}/docs/build-run/requirements-checklist.md
decisions-register            = {project-root}/docs/build-run/decisions-register.md
master-design-doc             = {project-root}/docs/master-design.md
slice-register                = {project-root}/docs/build-run/slice-register.md
sensor-manifest               = {project-root}/docs/build-run/sensor-manifest.md
big-review-findings           = {project-root}/docs/build-run/big-review-findings.md
```

## The No-Human-Available Policy (applies to every stage of this run)

> There is no human available at any point in this run. Do not ask questions and do not wait for approval. Wherever you would normally ask, choose the option you would have recommended, write the decision and its reason into the decisions register, and continue.

The stopping rule: a stage that cannot finish records the blockage, does the parts that are not blocked, and states plainly what was left undone. The failure to design against is a stage that neither finishes nor admits it did not.

Research licence: you may use web research if this workspace grants it; must finish without it — and no sensor may depend on the network.

## The Honesty Rule (this stage measures — read this twice)

**Adjusting the measurement to reach the target is the failure mode under test, not the target.** A sensor that finds nothing must say so, and say what it would have caught — a silent pass is indistinguishable from a sensor that never ran. If every sensor comes back clean on a system built in one unattended run, that is itself suspicious, and worth saying.

## The Finding Vocabulary — the Fourteen Red Flags

File every finding under the red flag it exemplifies, so findings can be counted and compared instead of being fourteen phrasings of the same observation:

1. **Shallow Module** — the interface for a class or method isn't much simpler than its implementation.
2. **Information Leakage** — a design decision is reflected in multiple modules.
3. **Temporal Decomposition** — the code structure follows the order operations execute in, not information hiding.
4. **Overexposure** — an API forces callers to be aware of rarely used features in order to use common ones.
5. **Pass-Through Method** — a method does almost nothing except pass its arguments to another method with a similar signature.
6. **Repetition** — a nontrivial piece of code is repeated over and over.
7. **Special-General Mixture** — special-purpose code is not cleanly separated from general-purpose code.
8. **Conjoined Methods** — two methods have so many dependencies that neither can be understood without reading the other.
9. **Comment Repeats Code** — all the information in a comment is immediately obvious from the code next to it.
10. **Implementation Documentation Contaminates Interface** — an interface comment describes implementation details users don't need.
11. **Vague Name** — a name so imprecise it conveys little useful information.
12. **Hard To Pick Name** — no precise, intuitive name comes to mind for an entity.
13. **Hard To Describe** — complete documentation for a variable or method has to be long.
14. **Nonobvious Code** — the behaviour or meaning of a piece of code cannot be understood easily.

## Step 1: Read the Whole System

Read `{master-design-doc}`, `{slice-register}`, `{sensor-manifest}`, `{requirements-checklist}`, the README and docs, and the code — this sweep judges the repository itself, with the code in front of you, never metrics alone.

Then read all twelve guide docs in `{guides-dir}` (`G01-modules-should-be-deep.md` through `G12-pull-complexity-downward.md`). They are the design canon this system was built against — each holds one Guide's rule, an example and a counterexample — and the sensors below judge by those same documents, so the designers and you share one definition of every principle. Five are marked load-bearing (G9, G1, G2, G3, G10): a finding against one of those weighs heavier, other things equal, when you rank severity.

## Step 2: Run the Inferential Sensors

Work through each sensor. Every finding carries a citation (`file:line` or a named module), the red flag it files under, what to do about it, and a severity.

- **S8 · Module Depth & Layer Abstraction** (judges G1, G11, G12) — for each module: how big is the interface compared to what it hides? Which modules are wrappers? Which methods do nothing but forward their arguments to a method with a similar signature? Do adjacent layers actually present *different* abstractions? And where has complexity been exported to callers — flags, options, edge cases every caller must handle — that the module could have absorbed?
- **S9 · Change Amplification & Near-Duplicates** (judges G2, G6) — pick three plausible changes the spec implies. For each, count the places that must change together — anything above one is a finding, with the files listed. Also: where are there near-copies of the same thing that have started to drift?
- **S10 · Cognitive Load & Unknown Unknowns** — what must someone know to change this system safely that is written down **nowhere**? The worst form of complexity, and the hardest to see from inside — your fresh eyes are the instrument.
- **S11 · Information Leakage** (judges G2) — which design decisions are known in more than one place? Name the constant/format/decision and every site.
- **S12 · Comment Quality** (judges G5, G8) — which comments repeat their code? Which non-obvious things have no comment at all? Are interface comments contaminated with implementation detail?
- **S13 · Documentation Honesty** — does the README describe the system that exists? Do stated numbers match measured ones? Are gaps stated, or quietly absent?
- **S14 · Design Doc Fidelity** — does `{master-design-doc}` describe the system that actually exists — or the one it was expected to become? An incrementally-updated document drifts; you are what notices.
- **S16 · Naming Consistency** (judges G7) — collect the system's vocabulary. Which concepts are named more than one way across files and languages? Which names are vague enough that the thing named is probably not one thing?
- **S18 · Test Verification Depth** — **not optional.** Do the tests actually verify anything, or merely execute code? This run is the limiting case of the problem: the same unattended process wrote the code and the tests, and nobody reviewed either — and a passing suite is precisely the check that cannot notice it. Where the stack affords a mutation-testing tool, run it, and summarise its output through a query script — never paste it raw. Where no tool exists, work inferentially: sample the system's public behaviours and, for each, name **which check fails if this breaks**. A behaviour with no answer is a finding. Remember the cautionary shape: a file can report 100% statement coverage and have no real tests at all — the coverage all coming from one acceptance test passing through it. **Executed is not verified**; a coverage figure is evidence a line ran, not evidence anything would have failed had it been wrong.

## Step 3: Write the Findings File

Write `{big-review-findings}`: every finding with its red-flag label, citation, what-to-do and severity, **ranked most severe first**. Raw tool output summarised, never pasted. For each sensor that found nothing: say so, and say what it would have caught.

## Step 4: Commit

Make one commit in `{project-root}` with a stage-labelled message, e.g.:

`epilogue · big review: <f> findings across <s> sensors`

Local commit only — never push.

## Step 5: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "Completed"
}
```

## Step 6: Self-Terminate

/agentic-hq-core-plugin:self-termination
