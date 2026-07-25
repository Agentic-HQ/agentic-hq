# Claude Notes on Continued Conversation

> Written 2026-07-25. Notes from the conversation that followed [09-claudes-thoughts-and-questions-on-the-proposed-plan.md](09-claudes-thoughts-and-questions-on-the-proposed-plan.md), in which the Amoh idea was pressure-tested and ultimately superseded by **Tailcut** (see [supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/](supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/) — the spec and the formatted conversation).
>
> The thread this captures: could Meta just install a tail-fix and decommission servers? (no — three separate gaps) → "point Tomcat at localhost is not transparent" (correct — real transparency = kernel-level interception or below) → comparison against Tailcut (simpler, more transparent, supersedes Amoh for the experiment) → does Homa fix both the network-queue problem *and* the slow-server problem? (mostly just the first) → the two tables below.

## 1. The failure map: where an RPC gets stuck, and who fixes what

The running example (from the conversation): a customer request hits server A, fans out to 100 Tomcat servers; one leg's packets park in a switch queue behind a ~100 MB transfer draining through a ~1 Gbps choke point (~800 ms of queue), so a 20 ms server response arrives at 720 ms — past the ad-bidding 200 ms deadline, business lost.

Every mechanism discussed in AHQ-192 fixes *some* of the places an RPC can get stuck, and none fixes all of them. The map:

| Where the RPC gets stuck | Share of *production* P99 (per the [04 research](04-why-is-nobody-funding-homa.md)) | Homa | Tailcut | Amoh (proxy layer) | Hedging alone |
|---|---|---|---|---|---|
| 1. Sender's NIC/egress queue | small–modest | ✅ pacer/qdisc keep NIC queues shallow | ✅ prio qdisc at egress | ⚠️ staggers its own bursts; can't manage the NIC queue | dodges |
| 2. Switch queues in the fabric (the 700 ms scenario) | small–modest (big in benchmarks) | ✅ SRPT via DSCP — short messages overtake in-switch | ✅ same mechanism (PIAS marking + priority queues) | ⚠️ DSCP marking *if* switches configured; otherwise hedges around it | dodges |
| 3. Receiver downlink / incast (100 replies converging at once) | episodic (fan-out-heavy workloads) | ✅✅ the crown jewel: precise receiver-driven grants | ⚠️ DCTCP/ECN tempers it | ✅ coarse client-side fan-out windowing (the Meta-memcached-2013 trick) | ❌ worsens it (adds traffic) |
| 4. Host kernel delivery (SoftIRQ steering, cache-cold cores, wakeups) | meaningful | ⚠️ fights hard (custom GRO steering, polling) but the kernel's structure caps it ~7x above user-space | ❌ | **❌➖ actively pays rent here** — two extra user-space hops per RPC | dodges |
| 5. The application itself (GC pauses, saturated thread pools, slow code) | **the biggest, per the taxonomies** | ❌ by design — transport's job ends at delivery¹ | ❌ | ✅ hedging + deadline cuts + ingress request scheduling | ✅ |

¹ One genuine Homa exception at the *dispatch* boundary: because Homa is message-oriented with one socket serving all peers, any free server thread can pick up the next complete message — dissolving the TCP pattern where a request serialises behind another request on the same connection while other threads idle. But if all threads are busy or the JVM is in a stop-the-world pause, no transport can help. Homa is also *polite* about server slowness without fixing it (timeouts are treated as overload, not loss; BUSY packets suppress retry-hammering).

### How to read the table

**The column shapes are the story:**

- **Homa is top-heavy** — the deepest solution ever built for rows 1–3, fading to ⚠️ then ❌ down the table.
- **Amoh is Homa's mirror image** — weak or negative at the top (it *adds* host hops in row 4, the row Homa spent six years fighting), strongest at the bottom.
- **Tailcut is the cheap top slice** — rows 1–2 for the price of a toggle, a nudge on row 3 via DCTCP.
- **Hedging alone is Amoh's row-5 essence** — shallow but *class-agnostic*: it routes around a slow leg without ever knowing whether the cause was a switch queue, a lost packet, or a GC pause.

**And the weights column is the sting** (it's the 04 document's core finding restated spatially): production P99, per the published tail-cause taxonomies, is dominated by rows 4–5 — where Homa's column reads ⚠️/❌ and the only ✅ belongs to the hedging family. That is why hedging harvested most of the practical tail value cheaply in 2013, and why Homa's spectacular benchmark numbers — from workloads engineered to make rows 1–3 dominate (80% network load, mixed message sizes) — kept shrinking when operators asked what it would do for *their* fleet.

**Honesty note on the weights:** they describe a typical production fleet per the cited taxonomies, not a law. A memcached-style fan-out tier at high network load genuinely lives in rows 2–3 (which is exactly why Facebook's traces appear in Homa's papers). The decade-long disagreement about Homa's value is, at bottom, a disagreement about which rows describe *your* fleet.

**Conclusion drawn in conversation:** Tailcut and Amoh are not competing designs but complementary halves with near-zero overlap — Tailcut owns the rows where a transparent, cheap win exists; Amoh's ideas own the rows where the production pain concentrates. The experiment builds Tailcut first because it is the smaller, specced, trap-laden, objectively-scoreable half — not because it is the half with more of the real-world money in it.

## 2. The transparency map: what each "thing" requires you to change

Steve's hypothesis, checked here: *Amoh involves changes at multiple layers, same with Homa — and that partially explains the lack of enthusiasm. Tailcut is great in this respect.* Verdict: **confirmed, and it's sharper than "layers" — each layer is a different team.** The real currency of adoption friction is not lines of code changed but **the number of distinct organisational owners who must act before any benefit appears** (app teams, platform team, network team, security team). The 04 doc's empirical law — *transparent wins spread; opt-in wins stall* — is this table in one sentence.

| What must change | Homa | Tailcut | Amoh (proxy layer) | Hedging alone |
|---|---|---|---|---|
| **Application code** | ❌ rewrite to the message API — every service touching sockets; the gRPC escape hatch is suspended | ✅ nothing | ✅ nothing | ✅ usually nothing (framework feature) |
| **Application semantics** | ⚠️ adapt to RPC/at-most-once model | ✅ nothing | ⚠️ idempotency must be declared per route before hedging is safe — no code change, but an audit app teams must answer | ⚠️ same idempotency requirement |
| **RPC framework / libraries** | ❌ port required (grpc_homa frozen since 2023) | ✅ nothing | ✅ nothing | ⚠️ config flag if the framework ships it (gRPC/Envoy do); library work if not |
| **Host OS (per-host rollout)** | ❌ out-of-tree kernel module today; mainline someday — the 19-revision, 21-month gauntlet | ✅ **the whole deployment**: one toggle — sysctl (DCTCP/ECN) + attach eBPF marker + qdisc | ⚠️ daemon + TPROXY/iptables rules + central policy config (root, per host) | ✅ nothing |
| **Network switches** | ⚠️ DSCP strict-priority config for full benefit | ⚠️ one-time *standard* knobs: ECN marking (for DCTCP) + priority queues (for the marking to matter beyond own egress) | ⚠️ optional (only the DSCP mechanism) | ✅ nothing |
| **Both ends needed?** | ❌ yes — sender and receiver must both run Homa | ✅ mostly not: marker is sender-side; DCTCP is a trivial fleet-wide sysctl | ⚠️ full value needs client-side + server-side sidecars; partial value single-ended | ✅ client-side only |
| **Ecosystem tooling (LBs, firewalls, observability)** | ❌ nothing speaks IP protocol 146; TCP-hijack mode is dropped by security middleware | ✅ **nothing breaks — it's still plain TCP**: tcpdump, firewalls, LBs, dashboards all unchanged | ⚠️ observability must learn the proxy hop; the proxy is a new failure domain in every path | ✅ nothing breaks (adds ~1% load) |
| **TLS / encryption** | ⚠️ no integrated story | ✅ indifferent — operates on IP headers; encrypted payloads fine | ❌ must own/terminate TLS to see request boundaries → cert-distribution infrastructure | ✅ indifferent |
| **Rollback** | ❌ per-app migration back | ✅ detach + sysctl revert | ✅ host-level disable | ✅ config flag off |
| **Teams in the critical path** | **4+** — every app team, platform, network, security | **~1½** — platform, plus network team once for standard knobs | **~3** — platform, security (certs), network (optional), app teams for idempotency sign-off | **~1–2** — app/framework owners |

### How to read the table

- **Tailcut's column is why it exists.** One owning team, standard switch knobs it may already have set (DCTCP+ECN is widely deployed), nothing in the ecosystem even notices it's there — because the traffic is still ordinary TCP. It sits in the same adoption class as the historical winners: DCTCP and BBR were one sysctl, and BBR went from paper to mainline-and-deployed in months.
- **Homa's column is the 04 document in miniature.** Four-plus rows of ❌/⚠️, including the two most expensive kinds: *every application team* (hundreds of owners) and *a kernel merge* (an owner money can't buy). Maximal opt-in at every layer — the exact profile the empirical record says stalls, independent of technical merit.
- **Amoh's column shows the drift we caught in conversation.** It advertises "no app changes" but quietly accumulates owners: platform (daemon + interception), security (TLS certs), network (optional DSCP), and — the sneaky one — app teams after all, because hedging is unsafe until someone answers the idempotency question per endpoint. Transparent to application *code*; not transparent to the *organisation*.
- **Hedging alone is the historical control**: near-transparent (a framework flag), which is precisely why it's the one tail fix that actually swept the industry.

## 3. The synthesis: value and transparency are inversely arranged

Put the two tables side by side and the whole AHQ-192 story compresses into one observation:

> **The value in table 1 concentrates at the bottom rows; the transparency in table 2 concentrates in the mechanisms that only reach the top rows.** Homa demands the most from the most teams and pays into rows where production pain is smallest (and where the hyperscalers already self-served). Hedging asks almost nothing and pays into the biggest row — which is why it won a decade ago. Tailcut is the best available trade *on the cheap end* of that frontier: genuine wins in rows 1–2 at a one-team, fully-reversible price. Amoh's ideas are the *expensive-end* complement, to be considered only after the cheap end is banked.

That frontier — not any single technology — is the actual finding of this research arc, and it is also the answer to "why is nobody funding Homa" in its most compact form yet: **enthusiasm tracks the ratio between table-1 value reached and table-2 teams required, and Homa has the worst ratio of anything on the board.**. (STEVE NOTE: Ouch!!!)
