# New: Focussing In On The Targets

> Written 2026-07-25. Trigger: the web-agent conversation that produced TailCut turned out to have had its middle missing from the first export; the complete transcript is now at [supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md](supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md) (spec: [tailcut-benchmark-spec.md](supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md)). This doc locks in the two targets that the recovered middle establishes: **target company = Criteo (as archetype)** and **target scenario = the 700 ms queue-stuck RPC** described in both conversations.

## 1. The situation, now we have the full conversation

The recovered middle fills in the whole reasoning chain that the fragment had jumped over:

- **The 700 ms trace, built step by step.** A short RPC is pinned down as ~10 KB / ~8 packets; the 700 ms is not transmission (microseconds) but **queueing** — the packets park in a switch egress buffer behind a ~1 MB bulk transfer (~700 packets ahead; drain time = hundreds of ms on a contended link), with packet-drop + retransmit-timeout as the even-worse variant. Crucially confirmed: **the Java apps on both ends touch none of this** — the delay lives entirely below the socket, which is what makes a transparent fix possible at all.
- **The mechanism has prior art: PIAS** (NSDI 2015). Keep TCP exactly as apps expect; add a thin layer that counts bytes per flow and marks DSCP priority bits — small flows stamped high, flows demoted as they grow. Shortest-job-first behaviour without knowing sizes in advance. Host side = one sysctl (DCTCP) + a small eBPF TC-egress program, loadable/unloadable at will. Switch side = priority queues + ECN, standard features someone must configure.
- **The deep research verdict** (full report in the transcript): the mechanisms are commoditised at hyperscaler tier — Meta runs DCTCP fleet-wide, enabled transparently via eBPF sockops under their NetEdit platform; Google has Snap/Aequitas and moved transport into Falcon hardware; Azure runs RoCEv2/DCQCN for ~70% of traffic; AWS runs SRD in Nitro. **But nobody has shipped the turnkey, TCP-transparent, software-only, open-source version** for people who aren't hyperscalers. Closest existing artifacts: qosify (OpenWrt home routers) and PIAS's decade-old dead reference code. That's the whitespace TailCut sits in.
- **The honest numbers:** DCTCP+ECN alone ≈ **3–5x** on a queue-dominated tail (already free in Linux since 2014 — the built-in humility check); adding the priority marker pushes toward **5–10x** on the specific stuck-behind-bulk outlier. Homa's 70x stays off the table by design (needs the non-transparent API).
- **Why nobody's done it:** the value lives outside the code — switch config is the real product, thresholds are workload-fragile, and the **organisational no-man's-land**: too kernel-y for app teams, too custom for network teams. (This independently confirms the "teams in the critical path" analysis in [doc 10 §2](10-claude-notes-on-continued-conversation.md) — the gap is organisational, not technical.)
- **Deployment risk is asymmetric, and helpfully so:** half-deploying DCTCP is genuinely dangerous (CUBIC/DCTCP unfairness, one unmarked switch poisons a path, knife-edge thresholds, fog-not-fire failure modes) — but **the marker is the gentle half**: inert until switches are configured, graceful under partial rollout, nanoseconds of CPU, verifier-safe, one-command rollback. The staged story writes itself: *marker first (inert) → verify marks on the wire → enable switch priorities → DCTCP last.* Two real dangers to checklist: audit existing DSCP usage first; rate-limit the top priority band on switches.
- **Project state:** named **TailCut**, name-collision-checked (clean), **tailcut.dev registered**, spec renamed to `tailcut-benchmark-spec.md` and revised on 2026-07-25 (see its revision note), repo destined for the Agentic-HQ namespace, doubling as the workflow-vs-one-shot experiment with pre-planted traps and binary acceptance criteria.

**What this changes in our docs:** nothing structural — the failure map and transparency map in [doc 10](10-claude-notes-on-continued-conversation.md) stand, and are strengthened (the no-man's-land analysis is the transparency table's bottom row in narrative form). One correction to record: the web research reported Homa's upstreaming stalled at v12 (July 2025); our deeper Patchwork-verified research ([02 §12](02-homa-detailed-research-document.md#12-upstream-status-as-of-2026-07-23)) found v19 (April 2026, changes-requested) — ours is authoritative; no conclusion changes.

## 2. Target Company: Criteo (and why)

*(Figures below are from Criteo's public engineering materials as surfaced in the web-agent research; treat exact numbers as approximate.)*

**Who:** French ad-tech (retargeting/commerce media), Paris HQ, active engineering blog, heavy open-source users, kernel-literate (they sponsor Kernel Recipes and have published Linux traffic-control deep-dives).

**The fit, trait by trait:**

1. **They own the metal.** ~40,000 servers, on-premises, across seven datacenters, orchestrated with Kubernetes and Mesos — so they control the switches. The disqualifier that eliminates the entire public-cloud world (no fabric access) doesn't apply.
2. **Commodity everything.** Linux on commodity Ethernet, a modern Clos/ECMP fabric — no RDMA estate, no IPUs, no custom transport. Exactly the substrate TailCut assumes.
3. **Their workload IS the target scenario, industrialised.** ~20 million bid requests per second, each auction completing in under ~100 ms, each bid fanning out internally — peaking at ~290 million key-value queries per second against their data layer. Small-message RPC fan-out under a hard deadline, at scale.
4. **The tail is literally revenue.** In real-time bidding a late bid isn't slow — **it's discarded from the auction**. P99.9 converts directly to lost money, which makes "flatten the tail" a CFO conversation, not just an engineering one. They've already shown they buy this shape of value: they replaced their caching layer partly to cut server count while holding sub-millisecond latency.
5. **They're the right size.** Big enough to feel hyperscaler-class pain; not big enough to have built a Snap or a Falcon. The tier the 04 research identified as the public-goods gap — genuine beneficiaries who never build kernel plumbing themselves.

**The profile-collapse insight (ties the whole research arc together):** Homa's ideal-beneficiary profile ([02 §14.4](02-homa-detailed-research-document.md#144-the-economics-who-would-actually-save-money-and-how-much)) needed **five** traits, and the fifth — *controls one internal RPC framework in a monorepo, so you can port every app in one place* — exists only because Homa requires porting apps. **TailCut's transparency deletes that trait.** Criteo runs a heterogeneous zoo of C#/Java/C services and would fail Homa's profile on exactly that point; on TailCut's reduced four-trait profile they score four-for-four. The trait Homa needs and Criteo lacks is precisely the one transparency removes — Criteo is almost the *designed counterexample* to Homa's adoption model.

**Have they already done it?** Probably not, and the evidence is instructive: their published traffic-control work is about *bandwidth isolation between Mesos containers* (pfifo_fast defaults, fq_codel mentioned only as an alternative) — TC expertise pointed at a different problem. No public trace of DCTCP, fabric ECN, or flow-priority scheduling anywhere in their prolific engineering output, which fits the industry pattern: companies at this tier attack tail latency at the application layer (hedged requests, timeouts, over-provisioning) because the transport-priority layer sits in the organisational no-man's-land. Honest caveat: absence from a blog isn't absence from production — but the TC post is exactly where DCTCP would appear if it were part of their world, and it isn't there.

**The framing that keeps us honest:** Criteo is the **archetype we design for, not a sales target**. Every requirement falls out of imagining their environment — transparent across a polyglot service zoo, toggleable per host, no app team in the critical path, staged and reversible for a network team that answers for stability. If Criteo quietly built something similar internally, the thousand smaller Criteo-shaped companies still have nothing open.

## 3. Target Scenario (pinned down)

*(The apps are Java/Tomcat because Steve knows them, not because Criteo runs them — and the full conversation confirmed the apps genuinely don't matter: they hand bytes to a socket and everything that causes or cures the delay happens below it.)*

### The cast

- **BidGateway** — a Java app on server A. Receives a bid request from an ad exchange. Hard deadline: the exchange discards bids arriving after its cutoff (~100 ms), and the end-user's page moves on regardless (~200 ms browser-abandon budget in the ad-agency variant). Late = worthless, both ways.
- **100 leg services** — Java Tomcat apps on 100 other physical servers in the same datacenter (user profile, features, budgets/pacing, model scores, brand safety…). Each leg: a small RPC — **~10 KB response, ~8 packets on the wire**. The bid can't be computed until the slowest leg returns.
- **The aggressor** — somebody else's ~1 MB+ bulk transfer (log shipping, cache warm, model push) sharing a switch egress port with one leg's response path. Nothing malicious; just Tuesday.

### The normal day

Each leg: sub-millisecond network + ~20 ms Tomcat processing ≈ **21 ms**. BidGateway assembles and responds in ≈ **50 ms**. Bid enters the auction. Everyone's dashboards are green.

### The bad day (the 700 ms trace)

One leg's 8 response packets arrive at the top-of-rack switch egress port just as ~1 MB of bulk transfer (~700 packets) is queued ahead of them in a drop-tail FIFO. Drain time at the contended link: **hundreds of milliseconds**. The leg completes at ~700 ms network + 20 ms processing = **720 ms**; BidGateway's response goes out at ~720 ms — past the exchange cutoff and past the browser budget. If the buffer overflowed instead, a retransmit timeout makes it worse. **Revenue for that auction: zero.** The server did nothing wrong; the packet sat in a queue.

### Why this is money at Criteo scale (illustrative arithmetic, assumptions stated)

Criteo's revenue is on the order of $2 bn/year, earned by winning auctions it can only win by bidding **before the cutoff**. Assume revenue opportunity is roughly proportional to auctions actually entered. Then **every 0.1% of bids lost to tail-latency excursions forfeits on the order of ~$2 M/year of bid opportunity** — and queue-stuck legs are exactly the kind of event that lives in the 0.1–1% band on a busy fabric (one leg in a 100-way fan-out only has to be unlucky once: at a 0.999-per-leg success rate, ~9.5% of *bids* have at least one stuck leg; the fan-out multiplies leg-level rarity into bid-level frequency). The point of the arithmetic isn't precision — it's that the loss is *recurring, per-event, and attributable*, which is a far easier money conversation than "run the fleet hotter someday" (that second, bigger-but-softer saving — reduced over-provisioning — remains available on top).

### How TailCut stops the loss (same trace, replayed)

1. **Marking (the TailCut eBPF marker, on every host):** the leg's RPC flow has sent well under 100 KB → its packets carry the high-priority DSCP stamp. The bulk transfer blew through the demotion threshold within its first milliseconds → its packets are stamped bulk-class. Cost per packet: a hash lookup, an add, a six-bit write — nanoseconds, invisible to the Tomcats.
2. **Priority queues (one-time switch config):** at the contended egress port, the switch serves the high-priority queue first. The RPC's 8 packets **jump the ~700-packet bulk queue** — queueing delay falls from ~700 ms to ~microseconds. The bulk transfer loses almost nothing (8 packets' worth of its link time).
3. **DCTCP + ECN (sysctl + switch ECN):** senders back off *before* queues get deep, so the 700-packet pile-up mostly never forms in the first place — this is the free 3–5x layer that protects every flow, marked or not.
4. **Result:** the leg returns in ~21 ms like its 99 siblings; the bid goes out at ~50 ms; the auction is entered; the revenue that was silently leaking on every unlucky fan-out is kept.

**Why the marker matters commercially and not just scientifically:** DCTCP alone takes the 700 ms outlier to roughly 150–200 ms — a huge relative win that **still misses a ~100 ms auction cutoff**. Against a hard deadline, 3–5x on the worst outliers isn't enough; queue-*jumping* is what gets the leg back inside the budget. That is the business version of the S2-vs-S4 comparison the benchmark spec is built to settle.

### Deployment fit (why Criteo's platform team could actually say yes)

Zero changes to the C#/Java service zoo; enable/disable is per-host and instant; the staged rollout is safe-by-construction (marker ships first and is *inert* until switches read DSCP → verify marks with tcpdump → enable switch priority queues → DCTCP last, the only step needing fleet-level care); pre-flight checklist: audit existing DSCP/QoS maps, rate-limit the top band on switches. The one hard dependency is the network team performing one-time, standard-feature switch configuration — which the full conversation identified, correctly, as the real product surface: not the 300 lines of eBPF, but making those 300 lines *safely deployable* by organisations that aren't Meta.

### Honest limits (so this doc can't oversell)

TailCut fixes queue-stuck legs (rows 1–2 of the [doc 10 failure map](10-claude-notes-on-continued-conversation.md), with DCTCP nudging row 3). It does nothing for a leg that's late because its *server* was slow (GC pause, saturated pool) — that remains hedging/deadline territory, which Criteo-tier companies already practise at the app layer. The collectable win is the residual *network-queueing* share of their tail — real at their traffic mix, but the benchmark rig (relative numbers only, VM-modelled) is how we demonstrate the mechanism, not how we prove Criteo's production delta.
