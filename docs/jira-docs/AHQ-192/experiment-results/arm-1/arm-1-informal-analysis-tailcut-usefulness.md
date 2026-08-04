# Arm 1 — informal analysis: what the results say about TailCut's usefulness

> **Status: informal, non-blind commentary — NOT a judging input.** Written 2026-08-04 (Mac driving session, at Steve's request) after arm 1 completed and before arm 2 ran or any blind judging. It interprets arm 1's *benchmark findings* for the target-customer question; it contains **no cross-arm comparison and no design-quality opinion** — per plan step 7.2 those come only after the blind scores are in. Judges never see this repo (doc 13 §5.1), so this note cannot leak into scoring. Source: arm 1's self-reported `RESULTS.md` at `7949ee5`; the driving agent's independent gate re-run (plan 6.2) was still pending when this was written.

## The question

Criteo is the **archetype customer** TailCut was designed against — not a literal sales target. The research framed it: *"not 'Criteo adopts your GitHub repo,' but 'Criteo is the archetype you design for'"* — and pre-registered the project's biggest risk: *"'turn on DCTCP and fq_codel' gets 80% of the benefit with 20% of the novelty, which is exactly what your S2-versus-S4 benchmark is designed to settle."*

Steve's question, 2026-08-04: **if Criteo just switch on the standard settings (S2), how much does deploying TailCut as well (S4) give them?**

## What arm 1's numbers say (S2 → S4 increment, fresh connections)

| Measure | S2 (standard settings) | S4 (+ TailCut) | Increment |
|---|---|---|---|
| P99 latency | 13.5 ms | 10.4 ms | ~23% better (3.1 ms) |
| P99.9 latency | 25.1 ms | 20.4 ms | ~19% better |
| Requests missing 100 ms deadline | 0.016% | 0.004% | **4× fewer** |
| Bulk goodput (% of baseline) | 99.6% | 98.9% | essentially unchanged |

In share-of-the-problem terms: baseline (S1) P99 was 183.9 ms. S2 alone removed ~98% of the excess; TailCut mops up part of the remaining ~2%. The increment that plausibly matters commercially is the **deadline-miss rate** — a missed auction deadline is lost revenue, and 4× fewer misses at billions of auctions/day could still be real money. That arithmetic is the customer's to do, not the benchmark's.

## The honest "we don't know" — the missing control

The realistic Criteo-shaped scenario is **keep-alive** (persistent connections), and there TailCut posted its best number: S6 P99 = 4.5 ms with full bulk goodput. But the spec's scenario matrix contains **no "S2 + keep-alive" control** (standard settings, persistent connections, no marker), so S6's win confounds two effects: keep-alive's inherent benefit (no handshake/slow-start per request) and the marker's contribution. What S6 strictly proves is narrower but still valuable: **idle re-promotion works, so TailCut does not punish long-lived connections** — the known failure mode of the whole byte-counting approach. This is a spec-design gap, not an arm 1 failure; arm 1 followed the matrix it was given.

**Future-work note (for doc 15 if TailCut is ever pitched for real):** add the S2+keep-alive control scenario — it is the single measurement that would isolate TailCut's incremental value in the pinned target scenario.

## Caveats

- All numbers are from a simulated network inside one VM; only **cross-scenario comparisons** are meaningful, never the absolute milliseconds (arm 1's own RESULTS.md says the same).
- n=1, synthetic workload, and (at time of writing) the arm's self-report — the independent fresh-clone re-run at 6.2 is the verification.

## The fair one-liner (Steve-endorsed wording, 2026-08-04 — copied verbatim)

> "Flip the standard switch settings first — that's 98% of the win for free. TailCut then buys you ~4× fewer blown deadlines at near-zero cost, and probably helps most on your real keep-alive traffic — but proving that last claim needs one more scenario this benchmark didn't include."
