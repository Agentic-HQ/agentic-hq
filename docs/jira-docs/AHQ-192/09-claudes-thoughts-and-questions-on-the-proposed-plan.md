# Claude's Thoughts and Questions on the Proposed Plan

> Written 2026-07-23, in response to [08-now-the-fun-bit----the-big-reveal.md](08-now-the-fun-bit----the-big-reveal.md). Context read: all AHQ-192 docs (01–08) plus the add-feature-detailed-example workflow CLI ([add-feature-detailed-example-cli.ts](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts)) the birgitta-ousterhout-dev workflow would be based on.
>
> Format follows the doc-01 convention: thoughts first, then numbered questions with recommended answers and **Answer:** placeholders.

## Overall reaction

I like this plan a lot, and the reveal retroactively improves the research: a benchmark task *derived from genuine domain research* has realistic texture that toy benchmarks ("build a todo app") never have. Three things make it a genuinely good experiment:

- **The problem is design-rich.** Schedulers, queues, instrumentation, benchmark harnesses — this is exactly the kind of system that punishes shallow modules, leaky abstractions and missing information hiding. If an APoSD-encoded workflow can't show a difference *here*, it can't show one anywhere. A CRUD app would have been a much weaker test.
- **The symmetry is delicious.** John's design philosophy, encoded as Guides and Sensors, tested on a problem derived from John's own protocol, with the results sent to John. The experiment is also a live 2026 question in its own right: does encoded process beat raw model capability? (Birgitta's harness-engineering article is exactly this bet.)
- **The honesty instinct is right.** Running arm 2 fully automated (no HITL) to keep it fair, and planning a HITL follow-up as a separate question, is the correct experimental discipline.

But there are two load-bearing problems to solve before either arm runs, several fairness confounds worth deciding consciously, and some workflow mechanics that need prerequisite work. Those are the bulk of this document.

## The load-bearing problem #1: the benchmark must be runnable truth, not plausible fiction

The research itself establishes the trap ([02 §9.4](02-homa-detailed-research-document.md#94-reproducing-what-a-future-task-would-need)): real Homa-class numbers need a multi-node Linux cluster with configured switches — "single-machine runs are meaningless" *for wire-level transport work*. Neither arm can produce a genuinely Meta-ready artifact with verified 3x numbers, and an AI agent under pressure to satisfy a "3x" acceptance criterion in an environment where 3x can't be measured will do the natural thing: build a benchmark that *appears* to show 3x. Then the comparison in step (3) judges which repo wrote better fiction.

The fix is to scope Amoh so that **the 3x claim is honestly achievable and mechanically verifiable on the machine the agents actually have**. The good news: tail-latency-under-load is one of the few systems phenomena that reproduces beautifully on a single box, *provided the system under test is user-space queueing/scheduling rather than wire-level networking*. Small requests stuck behind large ones, tails exploding as load approaches saturation, P99 improving dramatically under smarter scheduling — all of that is queueing theory, measurable with client/server processes over localhost or network namespaces, no cluster required. A 3x P99 improvement against a naive baseline *in the same harness* is realistic, honest, and re-runnable by the evaluator.

This suggests the acceptance criteria should be (concrete wording for the requirement doc):

> *Under sustained high load in the provided benchmark harness, small-RPC P99 latency must be at least 3x better than the baseline implementation in the same harness, while throughput and mean latency for all other traffic must degrade by no more than 10%. The harness, the baseline, and a one-command reproduction script are part of the deliverable; claimed numbers must reproduce when the evaluator re-runs them.*

That last sentence is the anti-fiction mechanism, and it matters more than the 3x number itself. "Ready to drop in at a test system at Meta" stays in the doc as the *vision statement* — it's motivating and shapes the documentation quality — but must not be an acceptance criterion, because no agent can verify it.

## The load-bearing problem #2: what exactly is Amoh?

Doc 08 deliberately leaves the design out — correct — but *which class of artifact Amoh is* is a requirements-level decision that has to be made, because it determines platform, testability, and how design-rich the task is. The candidates, from the research:

| Class | Example from research | Runnable on one box? | Design-rich? |
|---|---|---|---|
| Kernel module / qdisc | homa_qdisc extraction (06 §3C) | No (needs Linux root, kernel headers, real NICs to mean anything) | Yes, but untestable → bad benchmark task |
| eBPF / sched_ext | scx_rpc (06 §3B) | Only on Linux 6.12+, privileged | Yes, but environment-fragile |
| Diagnostic tool | p99scope (06 §3A) | Partly | Yes, but "3x improvement" doesn't fit a diagnostic |
| **User-space tail-aware RPC serving system** | The queueing/scheduling core of the whole research | **Yes — fully** | **Yes — scheduler, queues, protocol-ish framing, instrumentation, harness** |

My strong recommendation is the last one: Amoh as a user-space system (server + client library + load generator + benchmark harness) that demonstrably fixes tail latency for mixed-size RPC workloads over ordinary TCP, on one machine. It keeps every interesting design problem, drops every environmental blocker, makes the 3x honest, and both arms can complete it fully — including actually running their performance tests — inside an automated session.

## Fairness confounds to decide consciously

1. **The global CLAUDE.md contaminates — and would actually break — arm 1.** An "empty workspace" still inherits `~/.claude/CLAUDE.md`, which (a) already teaches TDD discipline (diluting the workflow's advantage — arguably fine, it makes a *harder* baseline and thus a stronger result if the workflow still wins), but (b) contains rules written for interactive sessions that will sabotage an unattended run: *never commit without the /commit command*, *never install tools without approval*, *stop and ask the human when blocked*. A fully-autonomous arm 1 that obeys those rules stalls or delivers an uncommitted repo. Arm 1 needs a clean environment (fresh HOME or equivalent) with minimal, purpose-built settings that permit autonomous work — and arm 2 needs the equivalent autonomy settings, so neither arm is differentially hobbled.
2. **The compute confound.** The workflow arm gets 7+ fresh contexts and inherently more tokens. That's fine — "structure + more compute beats one context" is still a valid and interesting claim — but record tokens, cost, and wall-clock for both arms and report them, so the result can be stated honestly as quality-per-dollar as well as absolute quality. (A third arm — one-shot Fable told to iterate and self-review with a matched token budget — would isolate structure from compute, but I'd defer it: cost, and the two-arm result is the headline.)
3. **Web access parity.** Both arms will likely notice Amoh is Homa backwards and can find the papers. That's fine — real developers google — as long as *both* arms have equal access. Decide it, write it down.
4. **Judging bias — the step (3) protocol matters as much as the runs.** As written, "Fable and Steve compare, hoping the workflow version is much better" is a motivated evaluation by an interested party (and note *my* conflict: a Fable-with-full-context judging Fable-vs-Fable). The fix is cheap and standard:
   - **Pre-register the rubric** before either arm runs (a frozen scoring doc in this folder). Include objective gates first — does it build? do tests pass? does the benchmark reproduce the claimed numbers when re-run? — then design-quality criteria.
   - **Blind the judges**: fresh Fable sessions with no AHQ-192 context, given `repo-a`/`repo-b` (assignment randomised), scoring against the rubric. Two or three independent judge sessions, order swapped.
   - **Watch the tautology**: judging purely by APoSD criteria favours the APoSD workflow by construction. Keep APoSD criteria (they're the hypothesis!) but pair them with framework-neutral ones ("would a senior engineer accept this PR?", correctness, reproducibility, docs accuracy).
5. **n=1 per arm is weak evidence.** Two runs of the *same* arm can differ a lot. One run each is fine for a first pass and the writeup should say so plainly; keep the option of a second round if the result is close (if it's a blowout, n=1 is more persuasive).

## Workflow mechanics: prerequisite work before arm 2 can run

From reading the CLI it would be based on:

- **The birgitta-ousterhout-dev workflow doesn't exist yet** — building it (presumably via create-workflow) is a real prerequisite task, and honestly the most valuable artifact of this whole exercise: the mapping of APoSD ideas onto named Guides (deep modules, information hiding, define-errors-out-of-existence, design-it-twice, comments-as-design) and Sensors (complexity symptoms: change amplification, cognitive load, unknown unknowns; comment-quality checks; module-depth review) is the design work that makes AHQ's case.
- **Scope mismatch to resolve**: the add-feature-detailed-example is explicitly "a single small feature to an existing codebase," run once per feature. Amoh is a greenfield *system*. One pass of a per-feature workflow over a whole system is off-label usage and could make arm 2 *underperform* for structural rather than philosophical reasons. The greenfield variant probably wants the Planner to produce a feature list and the Executor stage to loop over it (or the 7 stages re-interpreted at system granularity). Worth deciding deliberately rather than discovering mid-run.
- **Fully-automated needs an answer policy.** The workflow skills ask AskUserQuestion-style questions (that's their job — the Interrogator especially). For the no-HITL run each skill needs an explicit "no human available: choose the recommended option and record the choice" rule, so the run doesn't stall and the choices are auditable afterwards.

## On sending it all to John

Closing the loop by emailing John is a lovely ending, with three conscious decisions first:

1. **Tone check on the research docs.** Docs 02/04 contain frank passages — the single-maintainer analysis, the review-cadence story, the blunt funding verdicts. I believe they're respectful and he seems remarkably unprecious (he publicly thanked an AI bot for finding his bugs), but sending someone eight documents that repeatedly analyse the project's sustainability risks is a choice to make deliberately, perhaps with a framing line in the email acknowledging the bluntness.
2. **The names.** "birgitta-ousterhout-dev" uses two real people's names, neither of whom has endorsed anything. For a private email experiment that's charming homage; if the repos go public (this folder is destined for a public repo), a courtesy heads-up to both — Birgitta's Guides/Sensors terminology should be attributed to her article regardless — would be both polite and a good excuse to start the conversation with John you're clearly angling for.
3. **Set expectations in the email**: n=1, fully automated, no HITL, first experiment — so the result (either way) is read as a datapoint, not a verdict on his book or on Fable.

## Questions

### Q1. What class of artifact is Amoh?

**Recommended answer:** A user-space tail-aware RPC serving system (server + client + load generator + benchmark harness) over ordinary TCP, runnable and benchmarkable on a single machine. Kernel/eBPF artifacts make the performance claims untestable in the run environment and the experiment un-judgeable (see load-bearing problems #1/#2).

**Answer:** Sounds good

### Q2. Target platform for building and benchmarking?

**Recommended answer:** Plain Linux (a devcontainer/Docker on your Mac is fine — it's a real Linux VM) as the required platform, macOS-portability optional. Language unconstrained (letting each arm choose is itself an interesting design decision to observe) — though if you want maximum comparability, pin it in the requirement doc; if pinning, I'd pick a systems-capable language the judges can assess well (Go, Rust, or modern C++; TypeScript would work but caps the realism of a "performance" system).

**Answer:** I have Ubuntu 26.04 LTS installed in VMWare on my Mac and would like to use that. I'm familiar with C++ and John writes in C so that sounds ideal.

### Q3. Acceptance criteria: adopt the in-harness formulation?

**Recommended answer:** Yes — the boxed wording in load-bearing problem #1: ≥3x P99 small-RPC improvement vs a baseline implementation in the same harness under sustained load; ≤10% degradation for other traffic; harness + baseline + one-command reproduction script are part of the deliverable; numbers must reproduce when re-run by the evaluator. "Meta test system" stays as vision, not acceptance.

**Answer:** Sounds good.

### Q4. How much "why/how it would work" goes in the requirement doc?

**Recommended answer:** Phenomenon, not mechanism. Describe the problem (small requests trapped behind large ones; tails exploding near saturation; why P99 matters — the fan-out argument) and the goal, but do NOT name the known solution ideas (SRPT, receiver-driven credit, priority queues, hedging). Naming mechanisms hands both arms the core design for free and shrinks exactly the design space the experiment is supposed to measure. This needs discipline from me as the doc's author, since I know the research — flag anything you think leaks.

**Answer:** Sounds good.

### Q5. Arm 1's environment: clean HOME or your normal setup?

**Recommended answer:** Clean environment (fresh HOME / no global CLAUDE.md) with minimal purpose-built settings allowing autonomous work (git allowed, installs allowed within the workspace), and equivalent autonomy settings for arm 2 — because your global CLAUDE.md's never-commit / never-install / stop-and-ask rules would break an unattended run outright (fairness confound #1). Record both configurations in the report.

**Answer:** Sounds good. "gh" tool allowed and GitHub repo pre-created by me.

### Q6. Web research: allowed in both arms?

**Recommended answer:** Yes, both, equally — real conditions, and un-enforceable to prevent anyway once an agent notices Amoh spelled backwards. State it explicitly in both run configs.

**Answer:** Sounds good.

### Q7. Judging protocol: pre-registered rubric + blind fresh-session judges?

**Recommended answer:** Yes: rubric frozen in this folder *before* either arm runs (I can draft it as a next doc — objective gates first, then APoSD criteria, then framework-neutral quality criteria); 2–3 fresh blind judge sessions scoring randomised repo-a/repo-b; you and I do our own opinionated comparison *after* the blind scores are in, not before.

**Answer:** Sounds good.

### Q8. Runs per arm?

**Recommended answer:** 1+1 for this first pass, with the variance limitation stated plainly in the writeup; pre-commit to a second round only if the result is close.

**Answer:** Sounds good.

### Q9. Workflow prerequisites: build birgitta-ousterhout-dev first, adapted for greenfield + no-HITL?

**Recommended answer:** Yes — separate task(s) before the experiment: scaffold via create-workflow; decide the greenfield adaptation (Planner emits feature list, execution loops over it); give every skill an explicit no-human-available policy (take the recommended option, record it). The Guides/Sensors-to-APoSD mapping deserves its own short design doc — it's the intellectual heart of AHQ's side of the experiment.

**Answer:** Sounds good.

### Q10. The email package to John: everything, with a framing note?

**Recommended answer:** Send it all (the transparency *is* the charm), with a short framing note that (a) acknowledges the research docs are blunt in places and were written by an AI for an engineering audience, (b) states the experiment's limits (n=1, automated, no HITL), and (c) asks the courtesy question about using his name on the workflow — same courtesy to Birgitta if/when it goes public.

**Answer:** Yes — send everything. Before packaging, we did a light editorial pass (2026-07-25) across all the top-level docs, tidying some personal wording so the writing stays focused on the project and its sustainability rather than on individuals. 04-a (a raw chat transcript) was tidied in place and stays in the package. The email's framing note should still say the docs are frank in places about project risks and were written by an AI for an engineering audience.

## Proposed next steps (once the answers land)

1. I write `10-amoh-requirement-doc.md` — self-contained, no references to Homa/this research/AHQ, phenomenon-not-mechanism, with the Q3 acceptance criteria. (Both arms receive *only* this file.)
2. I draft the judging rubric doc, frozen before any run.
3. The birgitta-ousterhout-dev workflow gets built (separate task, probably its own Jira).
4. Arms run; blind judging; comparison report; email to John.
