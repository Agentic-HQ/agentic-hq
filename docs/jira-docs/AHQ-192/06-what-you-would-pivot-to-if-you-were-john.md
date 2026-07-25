# What I Would Pivot To If I Were John

> Written 2026-07-23, in answer to the question in [05-new-direction-prompt.md](05-new-direction-prompt.md): *if you were John, had read this research, and agreed with much of it — what would you pivot to?* Premises taken as given: you love programming and designing things well, you want meaningful impact on people's lives and companies' bottom line, you want to enjoy the process, and you'd like the work to move fast with real community energy — especially the Linux community and its financial backers.
>
> This builds on [02](02-homa-detailed-research-document.md) / [03](03-homa-summary-research-document.md) / [04](04-why-is-nobody-funding-homa.md). Three small validation checks were run for this document (see [§7](#7-validation-checks-run-for-this-document)).

## TL;DR

**I would stop trying to replace TCP and start making stock Linux tail-predictable — transparently.** The pivot in one line: **from "port your apps to my protocol" to "toggle this on and your existing apps get better tails."**

Why this and not something else:

1. **Homa's own data points here.** Six years of measurement kept finding the same thing: *the host, not the protocol, is where the tail lives* — cache misses, core handoffs, thread wakeups, SoftIRQ steering, C-states, SMIs. The protocol work is done and validated; the host-software problem is bigger, unclaimed, and afflicts **every** transport including TCP.
2. **The empirical law of kernel networking** (from the 04 research): *transparent wins spread; opt-in wins stall.* BBR was one sysctl and merged in months; Homa is maximally opt-in and stuck at v19. So build only things that are one toggle away from benefit.
3. **There is now a distribution channel with no gatekeeper.** eBPF and sched_ext let you ship kernel-behaviour changes *like application software* — no netdev review queue, no 21-month grind, users adopt in an afternoon. Meta literally runs a community-written BPF scheduler (built for Valve's Steam Deck) on production servers. That is the fast-moving, well-funded Linux community energy the question asks for.

**The concrete pivot is three deliverables, in order:**

- **A. The diagnostic** — an eBPF tool that answers *"where did my P99 go?"* for any Linux service: per-request attribution across NIC→GRO→SoftIRQ→wakeup→scheduler→app, with detectors for the known villains (C-state exits, SMIs, softirqd inversion, cross-core cache migration). This productises the one asset nobody else on earth has: the perf.txt/timetrace methodology.
- **B. The scheduler** — a network-aware `sched_ext` scheduler (`scx_rpc`) that applies Homa's hard-won core-placement lessons (balance.txt, Gen2/Gen3) to *all* traffic. One command to try; works with unmodified TCP applications.
- **C. The egress package** — the transparent remainder of homa_qdisc (which measurably improved *TCP running alone*) as a standalone qdisc plus a tuning profile. Smallest piece; ships first alongside A.

**What happens to Homa:** declare victory on the ideas and park the protocol with honour. The receiver-driven-credit model has already won where Ousterhout himself said transports belong — hardware: Ultra Ethernet's UET 1.0 spec includes an optional receiver-driven credit scheme with optimistic first-window transmission, which is grants + unscheduled bytes in consortium form (verified, [§7](#7-validation-checks-run-for-this-document)). The module stays public as the reference implementation; if a corporate sponsor ever materialises for v20+, hand it over gladly.

**Honest ceiling:** the transparent path probably buys 2–5x tail improvement for TCP workloads, not Homa's 10–72x. But 2–5x × everyone × zero adoption cost beats 72x × nobody — and the diagnostic has value even where no fix follows.

---

## 1. What the research constrains: any pivot must pass four tests

The 02/04 findings aren't just critique of Homa; they're a filter for what to do next.

1. **It must be transparent.** Every kernel transport that spread was a toggle (DCTCP, BBR: one sysctl); the one that preserved the sockets API but changed behaviour (MPTCP) took a decade *with* Apple shipping it; Homa — new API, new fabric config, new observability — is stalled after 19 revisions. Anything requiring applications to port fails before it starts.
2. **It must not depend on netdev reviewer bandwidth.** The 04 document's sharpest finding: the scarce resource is reviewer trust and attention, and money can't buy it. A pivot that ends in another multi-year patch-series queue reproduces the exact failure mode. The fast lanes — eBPF programs, sched_ext schedulers, user-space tooling — ship without merging.
3. **It should attack the *host*, because that's where the tail actually is.** Two independent lines of evidence converge: Homa's own measurements (the same protocol runs at P99 <15µs in user space vs ~100µs in-kernel — a 7x tax paid purely to the kernel's structure; "hotspots are the primary source of tail latency"), and the published tail-cause taxonomies cited in 04, which blame host effects (GC, daemons, C-states, scheduling) rather than the transport. Homa fixed the transport's share of the tail; the host's share is larger, unfixed, and — crucially — fixable *without* touching applications or protocols.
4. **It should serve the people the 04 doc identified as the real constituency.** The genuine beneficiaries of mainline Homa were "many mid-size own-metal firms who don't participate in kernel development." Those companies can't adopt a protocol, but they *can* run a diagnostic tool and install a scheduler. A pivot that serves them closes the public-goods gap from the demand side.

## 2. The transparency instinct in the prompt, tested against the evidence

The 05 prompt's gut feeling — *"something useful but entirely transparent to all the applications that use it; you toggle a setting and transparently get the benefits"* — is not just plausible; the research already contains three proofs it exists:

- **homa_qdisc improved TCP running alone.** The January 2026 qdisc was built for Homa/TCP coexistence, but the measurement showed even pure-TCP hosts benefit from its NIC-queue management ([02 §6.8](02-homa-detailed-research-document.md#68-output-pacing-pacer-thread--homa_qdisc)). That is a transparent, toggleable, TCP-benefiting artifact sitting inside the Homa repo today.
- **Custom SoftIRQ steering bought 20–35% P99** over default RSS ([02 §6.7](02-homa-detailed-research-document.md#67-rx-path-and-load-balancing-homa-schedules-cores-not-just-packets)). The implementation was Homa-specific, but the mechanism — choosing receive-processing cores with awareness of load and cache locality — is general, and Linux's default machinery (RSS/RPS/RFS) demonstrably does it badly.
- **The precedent class exists.** DCTCP and BBR are the historical proof that a one-sysctl networking change can sweep the industry in months.

And the ceiling, honestly: the full 10–72x needs message semantics on the wire, both endpoints cooperating, and switch priority queues — that can't be had transparently, which is exactly why Homa was designed as a new protocol. The transparent path only gets the *host-software* share of the tail. But per test 3 above, that share is the dominant one in most production taxonomies. This is the quiet inversion the whole pivot rests on: **Homa spent six years fixing the smaller (transport) share of the tail with the larger (host) share as measurement noise around it — the pivot fixes the larger share and lets the transport stay TCP.**

## 3. The pivot: "Make stock Linux tail-predictable"

One mission, three deliverables, each independently useful, each transparent, each shippable without anyone's permission.

### 3A. The diagnostic: `p99scope` — "where did my P99 go?"

An eBPF-based tool that, pointed at any Linux service, attributes tail latency per-request across the stages the kernel hides: NIC/NAPI residency → GRO → SoftIRQ handoff (and which core, and why) → socket wakeup → scheduler delay → application service time — plus detectors for the specific villains the Homa work unmasked: C-state exit latency, SMI all-core freezes (the `smi.py` trick, productised), softirqd priority inversion, cross-core cache-line migration, NIC-internal queue buildup.

Why this first:

- **It monetises the unique asset.** perf.txt + balance.txt + the timetrace/tthoma toolchain constitute the world's best dataset and methodology for microsecond-level host-tail attribution. Nobody else has spent 6.5 years doing this. Generalising it from Homa to TCP/UDP is a known-shape engineering problem, not research risk.
- **The demand is validated and the space is open.** Red Hat shipped `netstacklat` in April 2026 — an eBPF tool histogramming how long received packets sit in the RX stack ([Red Hat Developer](https://developers.redhat.com/articles/2026/04/29/boosting-speed-use-ebpf-and-netstacklat-troubleshoot-latency)). That proves a serious vendor thinks operators want exactly this. But it's RX-residency histograms; per-request cross-stage attribution with villain detection is a different altitude — closer to "the `perf` of tail latency" than a histogram.
- **It's the trojan horse.** Every operator who runs it and sees "41% of your P99 is SoftIRQ-to-app wakeup on oversubscribed cores" becomes a person who *wants* deliverable B — and, one day, maybe wants receiver-driven transports. The 04 doc showed nobody funds fixes for problems they can't see; this makes the problem visible fleet-wide. It builds the constituency Homa never had.
- **Zero gatekeepers, instant feedback.** eBPF tools ship on GitHub, load on stock kernels, and get adopted (or criticised) within days. The dev loop is minutes. This is the joy-of-programming axis: compare "iterate on a BPF program with users responding this week" to "wait four months for v20 review silence."

### 3B. The scheduler: `scx_rpc` — network-aware CPU scheduling, as a package

A `sched_ext` BPF scheduler embodying the balance.txt lessons for any RPC-serving host: keep NAPI/SoftIRQ/application stages of the same flow cache-adjacent; avoid waking threads onto network-busy cores; prefer cache-warm quiet cores for socket wakeups; on light load, collapse to few cores (the measured ideal) instead of spraying. Homa proved these placement decisions swing P99 by large factors (GRO→SoftIRQ handoff P99 71µs → 8.7µs; 17.7 → 26.3 Gbps from pinning choices alone) — and today *no* general-purpose Linux scheduler makes them, for any transport.

Why this is the right vehicle (validated, [§7](#7-validation-checks-run-for-this-document)):

- **sched_ext is the fastest-moving, best-funded corner of the kernel right now.** Merged in 6.12; NVIDIA employs a lead developer publishing a 2026 roadmap; Ubuntu/Arch/CachyOS package it with Fedora in progress; there's a community Slack and weekly office hours.
- **The Meta datapoint is decisive for this pivot's thesis:** Meta disclosed at Linux Plumbers (Tokyo, late 2025) that it runs `scx_lavd` — a scheduler written by consultancy Igalia *under contract to Valve for the Steam Deck* — on production servers. Read that sentence against the 04 document: the company that ignored Homa for eight years deploys community BPF schedulers in production. Same company, opposite outcome — because one is a port-everything protocol and the other is a loadable policy you can revert in one command. That is the adoption physics this pivot rides.
- **Distribution is `dnf install`, not MAINTAINERS.** A scheduler that misbehaves gets unloaded; the kernel falls back to EEVDF. The graveyard risk that (rationally) terrifies netdev simply doesn't apply.

### 3C. The egress package: the transparent remainder of homa_qdisc

Extract the TCP-benefiting parts of homa_qdisc — NIC-backlog estimation, keeping hardware queues shallow so scheduling decisions retain meaning, mixed-traffic refereeing — into a standalone qdisc for TCP-only hosts, honestly positioned against the prior art (`sch_fq` pacing, BQL): the pitch is not "first ever" but "the datacenter-tail-focused variant, with the measurements to justify it." Bundle it with a documented tuning profile (IRQ steering, C-state policy, coalescing) — essentially "the first hour of INSTALL.md, for people keeping TCP."

This is the smallest deliverable and the most direct answer to the 05 prompt's toggle instinct: `tc qdisc add` + a sysctl profile, benefits with zero application changes. The bufferbloat project is the encouraging precedent — a tiny community attacking "invisible queues ruin latency" with transparent qdiscs (fq_codel, CAKE) ended up in default kernels and every home router. This is the same story one level up: bufferbloat for the datacenter.

### Sequencing and the flywheel

A and C ship first (months, not years — both are mostly extraction-and-generalisation of existing measured work). B is the deeper design project — the genuinely novel scheduler research, and the one most likely to end up, like LAVD, in someone's fleet. The flywheel: A makes tails visible → visible tails create demand for B and C → B and C's measured wins (published in perf.txt style, which the community has never seen done at this standard) create the reputation and contributor base → and if the constituency one day demands message-aware transports, the Homa module is sitting right there, maintained as a reference, with its ideas already in the UET spec.

## 4. Why this fits the person in the question

- **Design joy.** A diagnostic tool's UX, a scheduler's policy model, a qdisc's algorithm — these are *A Philosophy of Software Design* problems: deep modules, simple interfaces, complexity hidden. Far more designing-things-well per week than shepherding checkpatch fixes through v20.
- **Fast feedback with real users.** The pivot trades one reviewer bottleneck for thousands of operators who install things the week they're announced. Every piece produces measurable, publishable numbers — the perf.txt culture, now with an audience.
- **Community and funders, as specified.** The question asked for Linux-community energy and buy-in from its financial supporters: eBPF and sched_ext are backed by Meta, NVIDIA, Valve-via-Igalia, Red Hat and the eBPF Foundation, with conferences, packaging, and consultancies being *paid* to write schedulers. This is the one corner of systems programming where the 04 document's public-goods gap is being actively bridged with money.
- **The single-maintainer problem dissolves instead of looming.** A protocol needs a maintainer-for-20-years (the kernel's rational fear). Tools and BPF schedulers accrete contributors, get forked, and don't depend on any one person staying involved. The single-maintainer risk that hangs over Homa becomes irrelevant.
- **Impact reaches the unreached.** The mid-size own-metal companies — the ones who'd genuinely benefit but never fund kernel plumbing — are exactly who can run a diagnostic and load a scheduler. Bottom-line impact without asking anyone to bet the fleet.

## 5. What happens to Homa itself

Not abandonment — **completion, honestly declared.**

- **The ideas have already won.** Receiver-driven scheduling is in the Ultra Ethernet spec (RCCC: receiver-issued credits, optimistic first-window transmission — grants and unscheduled bytes, standardised); SRD and Falcon embody the diagnosis in shipping silicon; the 04 doc's watch-item (e) — "ideas win while the kernel protocol loses" — is the observed outcome, and it's a *legitimate form of success* for a research protocol. The 02 doc's own words: this was always "the most likely success ending."
- **The module stays public as the reference implementation** — the executable specification of receiver-driven transport, with RHEL backports and MLE's FPGA work carrying the hardware thread. Maintenance drops to keeping it building.
- **The patch series gets an explicit open offer**: any corporate sponsor who wants v20+ gets the series, the history, and full support in taking it over. If the 04 doc's falsifiers ever fire (a hyperscaler reviewer appears, a co-maintainer volunteers), the calculus reopens — from a position of strength, with the diagnostic tool having built the demand.

## 6. Alternatives considered, and why they lose

| Pivot | Why not first |
|---|---|
| **Keep grinding v20, v21, …** | Fails tests 1 and 2: even total success lands a deliberately gutted, "not performant" Homa, followed by *the entire performance layer running the same gauntlet again* — years more of the exact process the research diagnosed as the bottleneck. Sunk cost is not a strategy. |
| **Go all-in on hardware (UEC committees, NIC vendors)** | The ideas' natural home — but consortium standards work is meetings and politics, the opposite of loving-the-programming. Do it passively: publish the definitive "mapping Homa's mechanisms onto UET" paper, advise MLE, accept the invitations. Influence without the committee life. |
| **Revive user-space Homa as a beautiful library (eRPC-but-maintained)** | Real niche, and the 15µs-P99 numbers live there — but it's opt-in again (apps adopt a library), and the eRPC lesson is that this audience is thin outside hyperscalers. Worth doing *later* as a companion artifact if storage/database projects (Ceph, ScyllaDB-adjacent) come asking after the diagnostic makes their tails visible. |
| **Revive grpc_homa / framework integrations** | The measurement already killed it: gRPC's own ~60µs overhead swamps the transport (~40% gain, not 10x). Fixing gRPC is someone else's calling. |
| **Design a new, better protocol (SIRD++)** | The world has enough unfunded datacenter transports; the 04 doc is a proof about the category, not about Homa specifically. |

## 7. Validation checks run for this document

Three quick checks (2026-07-23), each load-bearing for the recommendation:

1. **sched_ext momentum** — confirmed: 2026 roadmap talks from NVIDIA's Andrea Righi (hierarchical/composable schedulers, Rust, GPU awareness); Ubuntu official-support plans plus Arch/CachyOS packaging, Fedora in progress; community Slack + weekly office hours; and Meta's production deployment of Valve/Igalia's `scx_lavd`, disclosed at LPC Tokyo. Sources: [Phoronix on 2026 plans](https://www.phoronix.com/news/sched-ext-future-plans-2026), [Meta/Steam-Deck-scheduler coverage](https://byteiota.com/meta-uses-steam-deck-linux-scheduler-on-servers-bpf-win/), [LWN on the sched_ext patchset](https://lwn.net/Articles/972075/).
2. **Homa's ideas in Ultra Ethernet** — confirmed: UET 1.0 includes **RCCC**, an optional receiver-driven credit-assignment congestion control (receiver knows all incoming flows, issues credits; optimistic transmission lets senders start before credits arrive), alongside sender-based NSCC. Sources: [Arista, "Demystifying Ultra Ethernet"](https://blogs.arista.com/blog/demystifying-ultra-ethernet), [UE Specification 1.0.2 (PDF)](https://ultraethernet.org/wp-content/uploads/sites/20/2026/01/UE-Specification-1.0.2-1.pdf).
3. **The diagnostics gap** — partially open, demand validated: Red Hat's [`netstacklat`](https://developers.redhat.com/articles/2026/04/29/boosting-speed-use-ebpf-and-netstacklat-troubleshoot-latency) (April 2026) does eBPF RX-residency histograms — proof operators want this — but no tool found does per-request cross-stage tail attribution with host-villain detection (C-states, SMIs, softirqd inversion). If Red Hat grows netstacklat toward that, the move is to *join it* — collaboration is cheap when you hold the best methodology, and this pivot has no moat anxiety.

## 8. Risks, and what would change the answer

- **"2–5x transparent ceiling" is an estimate, not a measurement.** First real deliverable-C/B benchmarks might disappoint (TCP's protocol-level sins may dominate sooner than the host taxonomy suggests). Mitigation: the diagnostic (A) is valuable regardless of how the fix-side numbers land — it front-loads the truth.
- **The scheduler space could converge on this without us.** LAVD/others may grow network-awareness. Counter: none has the RPC-level measurement corpus; and being second-with-better-measurements is a fine outcome in a BPF world where policies compose and compete on data.
- **What would flip me back to Homa-the-protocol:** a hyperscaler reviewer doing sustained v20+ review, a co-maintainer with corporate backing, or a NIC vendor productising Homa (the 04 falsifiers). In that world, finish the upstreaming — from strength, part-time, while the transparent toolkit keeps shipping.
- **The quiet risk of the pivot: it's less romantic.** "Replace TCP" is a crusade; "make Linux tail-predictable" is a craft. But the research's verdict on the crusade is in — and the craft is the part that was working all along: the measuring, the mechanical sympathy, the lab notebook nobody else could have written. The pivot keeps exactly the parts of the last six years that were both joyful and true.
