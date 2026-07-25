# Steelman for Staying the Course

> Written 2026-07-23. Companion to [06-what-you-would-pivot-to-if-you-were-john.md](06-what-you-would-pivot-to-if-you-were-john.md) — this document argues the *other* side. The 06 doc recommends pivoting; this one makes the strongest honest case for continuing with Homa, so both sides are on the table.

## The question that prompted this

> "If you were John, and read all this — would it seem a 'no brainer' to pivot? Please steelman carrying on with Homa. (What's the name of that cognitive bias where once you've invested time/money/effort you don't want to give up on something?)"

## First, the bias, named

The bias is the **sunk cost fallacy**: continuing to invest in something because of what you've already spent, rather than because of what the remaining investment will return. In the organisational-behaviour literature it's called **escalation of commitment** (Barry Staw's term, from studies of why decision-makers double down on failing courses of action). Economists sometimes call it the **Concorde fallacy**, after the British and French governments who kept funding a supersonic airliner they already knew would never pay back — the name biologists adopted for the same behaviour in animals defending bad investments.

So the sharp version of the question is: *is continuing with Homa after 6.5 years and 19 patch revisions rational persistence, or is it the Concorde fallacy with better code?*

The honest answer: **it would not be a no-brainer to pivot.** The 06 recommendation stands under the preferences stated in the 05 prompt (enjoyment, speed, community energy) — but there is a genuine steelman for staying the course, and several of its arguments *survive* the sunk-cost accusation rather than being examples of it. Here they are, strongest first.

## 1. Not all of the 6.5 years is sunk cost — some of it is an asset that only pays out on completion

This is the structurally important point, because it defuses the fallacy accusation directly. The sunk cost fallacy concerns *unrecoverable* spend — money and time you cannot get back and that should therefore not influence forward-looking decisions. But some of what the 19 revisions bought is not sunk; it is an **asset with option value that is recoverable only by continuing**:

- **Reviewer trust and familiarity.** Netdev review is a gift economy ([04 doc](04-why-is-nobody-funding-homa.md)); Paolo Abeni's accumulated context on Homa's code took 21 months to build and evaporates the day the series is abandoned. Nobody inherits it.
- **A code base converged onto kernel idiom.** The objection trajectory across the series is the classic shape of convergence: **architectural** at v6 ("quite far from a mergeable status") → **infrastructure** at v15 (pacer out, custom clocks out) → **mechanical and AI-bot findings** at v17–v19 ([02 §12–13](02-homa-detailed-research-document.md#12-upstream-status-as-of-2026-07-23)). Kernel projects often look most stuck right before they merge, because "silence plus mechanical nits" is what the final approach looks like from inside.

Walking away doesn't just stop future costs; it destroys this accumulated, non-transferable asset at the moment of its maximum value. That's not sunk-cost reasoning — it's ordinary option-value reasoning.

## 2. Counterfactual impact: only one of these projects dies without John

If John pivots, mainline Homa dies. There is no successor — the research established this precisely (single maintainer, no corporate sponsor, no co-maintainer volunteers in eight years). If John pivots *to* eBPF tooling and sched_ext schedulers, he enters the most crowded, best-funded fast lane in Linux, where Red Hat already ships netstacklat, NVIDIA employs sched_ext leads, and consultancies get paid to write schedulers. He would be an excellent contributor there — one of many.

For someone optimising for "a meaningful contribution that will make a difference" (the 05 prompt's own framing), irreplaceability is worth a lot. The marginal value of John-on-Homa is the whole project; the marginal value of John-on-BPF-tooling is one strong voice in a chorus. A pivot maximises enjoyment and adoption speed; staying maximises the difference between the world with him and the world without him.

## 3. The binding constraint may be easing *right now*: the AI-review era

The 04 document's core finding was that the scarce resource blocking Homa is **reviewer bandwidth**, and that money cannot buy it. But the v17–v19 story ([02 §13.3](02-homa-detailed-research-document.md#133-the-ai-review-era-2026)) is that AI review has begun to relax exactly that constraint: netdev's AI bot performed deep review work that humans weren't providing, found real bugs (including a kernel-stack info leak), and maintainers forwarded its findings as valid. Ousterhout himself called the reviews "super-helpful."

Quitting in 2026 because of a reviewer-bandwidth famine, at the precise moment the technology arrives that ends reviewer-bandwidth famines, could be historically bad timing — like abandoning a becalmed sailing voyage the week the wind changes. If AI review keeps improving through 2026–27, the cost of shepherding both the current series *and* the follow-on performance series drops substantially. This is a genuinely new variable that none of the 21 months of precedent priced in.

## 4. Merge is a phase transition, not a milestone

The 06 doc treats "even success lands a gutted, non-performant Homa" as a reason to stop. The steelman inverts it: the first merge, however minimal, **changes the sociology of everything that follows**:

- `net/homa` in mainline means distros ship it, curious engineers try it, and the barrier to contribution collapses (patching in-tree code is a normal activity; maintaining out-of-tree modules is a specialist one).
- The "no visible corporate user" chicken-and-egg ([02 §13.2](02-homa-detailed-research-document.md#132-the-cadence-problem)) can finally break — users appear *after* availability, not before. BBR had users within weeks of merging because trying it cost nothing; out-of-tree Homa has never had that property.
- The single-maintainer objection partly self-resolves post-merge: in-tree code accretes co-maintainers and fixers in a way out-of-tree code never does.

On this view, the correct reading of "the performance layer still has to run the gauntlet afterwards" is not "years more of the same" but "years more under materially better conditions" — in-tree, visible, with AI review, and possibly with users.

## 5. The hardware trend cuts both ways

The 06 doc argues the ideas already won in hardware (UET's RCCC = receiver-driven credits, standardised), so the kernel protocol can be parked with honour. The steelman reply: **if receiver-driven transports become the industry norm in silicon that only hyperscalers and AI clusters can buy, a maintained in-kernel commodity implementation becomes more valuable, not less.** Mainline Homa would be the version everyone else gets — the same "bring hyperscaler-grade tails to the unhosted masses" thesis, strengthened by the industry's validation of the mechanism. A protocol number and an in-kernel API are also exactly what future NIC offload needs to target (the way TCP offload targets TCP): merging first, offloading later is the historically successful order.

## 6. The pivot's numbers are a thesis; Homa's are measurements

The 06 doc's "transparent path buys maybe 2–5x on tails" is an estimate — plausible, but unmeasured. Homa's 10–72x is measured, reproduced across hardware generations, and unchallenged even by the protocol's critics ([02 §8](02-homa-detailed-research-document.md#8-what-homa-makes-fast-what-it-makes-slower-and-what-limits-it)). Trading a proven artifact with a distribution problem for a plausible thesis with no artifact yet is not obviously the rational move — especially since the pivot's flagship deliverable (the diagnostic) could reveal that host-side transparent fixes recover *less* of the tail than hoped, at which point the message-semantics-on-the-wire argument (i.e. Homa) returns with new force.

## 7. The preferences in the pivot prompt may simply not be John's

The 05 prompt assumed the pivot-target persona wants fast community energy, quick feedback, and fun. But the revealed preference of John's entire career — Tcl, Raft, RAMCloud, *A Philosophy of Software Design* — is **long-arc artifacts that won through patience and clarity**, several of them initially dismissed or slow to be adopted. He chose Homa as his retirement focus, maintains it himself, and personally answers support email. Maybe the grind *is* the hobby: the craftsmanship of the module, the perf.txt lab notebook, the six-year measurement discipline. When the stated goal includes "really enjoying the process," you have to use the person's actual utility function, not the one the question projected onto them — and there is real evidence John's includes finishing hard things slowly.

## The practical kicker: continue-vs-pivot is a false dichotomy

The strongest version of "stay the course" doesn't even require rejecting the 06 pivot, because **kernel upstreaming is inherently a part-time activity**. The review cadence — months of silence punctuated by bursts of feedback ([02 §13.2](02-homa-detailed-research-document.md#132-the-cadence-problem)) — means keeping the series alive might cost a day a week on average. The rational hybrid:

1. Post v20, keep responding to review, **time-boxed** (say, ≤20% of working time);
2. Build the transparent toolkit (06 doc, deliverables A–C) with the rest;
3. Let each track feed the other — the diagnostic tool builds the constituency that could demand Homa; a merged Homa gives the toolkit a flagship customer.

This version survives the sunk-cost accusation completely: the marginal cost of continuing is small, the option value preserved is large, and no fallacy is required to justify it.

## Net position

Laid side by side:

| | Pivot (06 doc) | Stay the course (this doc) |
|---|---|---|
| Wins on | Enjoyment, speed, community energy, adoption physics, reach | Counterfactual impact, option value, proven-vs-estimated numbers, John's revealed preferences |
| Weakest point | Its headline numbers are estimates | 21 months of precedent says the grind continues |
| Sunk-cost status | N/A | **Not** inherently fallacious — points 1, 3 and 4 are forward-looking arguments |

If I were actually John: the pivot is the better expected-value use of the next five years *under the 05 prompt's stated preferences* — but continuing is defensible on grounds that survive the sunk-cost accusation entirely (irreplaceability, convergent review trajectory, AI review easing the binding constraint, merge as phase transition). It becomes a fallacy only if v20+ turns out to be another 21 months of silence under unchanged conditions.

**The evidence to watch, then, is the same in both documents:** how v20 is received. Sustained substantive review (human or AI-assisted), a first Acked-by, or any corporate reviewer appearing → the steelman is winning; finish the job (the hybrid above). Another year of silence and mechanical churn → the sunk-cost interpretation was correct all along; pivot with a clear conscience, knowing the decision was made on forward-looking evidence rather than on either bias — the one that clings, or the equally real one that quits too early just to feel decisive.
