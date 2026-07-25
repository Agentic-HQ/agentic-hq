# TailCut — Full Conversation Transcript

**Claude (Fable 5) & Steve — Saturday 25 July 2026**

*Voice-transcribed messages are marked (voice). Tool actions shown in brackets. The benchmark spec produced during this conversation: [tailcut-benchmark-spec.md](tailcut-benchmark-spec.md)*

> *Edit note (25 Jul 2026): the spec file has since been renamed `pias-lite-benchmark-spec.md` → `tailcut-benchmark-spec.md` (and lightly revised), per the advice near the end of this conversation. Spec links in this transcript point to the new filename; the dialogue text itself is left verbatim, so in-conversation mentions of "PIAS-lite" remain as spoken. Originals backed up locally by Steve (outside the repo).*

---

**Steve** *(voice)*: Hi. Um, can you tell me a little about the Homa, project? I'm thinking of, uh, get writing a Linux something to, uh, do something almost the same as Homa, but, um, a lot more easily.

**Claude:** Hmm, just to make sure I point you the right way — do you mean Homa, the datacenter network transport protocol by John Ousterhout, the alternative to TCP? Let me have a quick look.

*[searched: Homa transport protocol Linux kernel John Ousterhout]*

Right, so Homa is a datacenter transport protocol from John Ousterhout at Stanford — basically a TCP replacement designed for low tail latency, especially with lots of small messages. It's receiver-driven and uses network priorities to avoid congestion. There's a Linux kernel module for it that's been going through upstreaming.

What's the "more easily" angle you're imagining?

---

**Steve** *(voice)*: I don't know anything about how Linux kernels work. I am a programmer. I know a little bit about c, and I'm a Java programmer. But I don't care because I'm gonna get Fable to do the work and come up with a plan. So I really just need to know, well, is there something that could get you know, I heard that homework can get seventy times improvements, seventy x improvements, but I'm happy if I get three to five x or a bit more, but I want it to be completely transparent to all applications and just something you can toggle on and toggle off through configuration on the Linux system, and it'll either use this thing or just use the normal TCP, but it apps has to be completely transparent.

**Claude:** Ahh, okay, here's the honest bit you need to know up front. That seventy-x figure is tail latency in a datacenter, not raw speed, and it only shows up under heavy load with lots of tiny messages between machines. On a normal setup you might see nothing.

And the transparency goal is actually the hard part. Homa deliberately isn't a drop-in for TCP sockets. It uses a message-based API, so apps have to be rewritten to use it. Want me to explain why fully transparent is so tricky?

---

**Steve** *(voice)*: Um, I'd like, first of all, to know whether it's possible to get this, uh, tail latency down for very high loads of, um, small traffic. If it's possible to get it down using what I'm talking about, uh, where something just loads into the kernel without, uh, any apps or anything else having to be modified. Is that even a possible thing to do.

**Claude:** Yeah, so it's genuinely possible, but with real caveats. Let me be straight with you.

The transparent approaches do exist. You can intercept things at the socket layer or below without touching apps. But here's the rub: a lot of TCP's tail latency comes from its very nature, the single ordered byte stream, so one lost packet blocks everything behind it, plus its congestion control. If you keep the TCP socket semantics apps expect, you inherit some of those same limits.

So you can definitely improve things, better queueing, priorities, smarter congestion control, all transparently. But you probably won't get Homa's full headroom without changing how apps talk. Does that trade-off make sense?

---

**Steve** *(voice)*: Yeah. I see what you're talking about. Um, so if, uh, say I am Facebook, apparently, that's the... or Meta, and, uh, I have, uh, thousands of servers, and they're all chatting to each other every time a message arrives from an Instagram account or something, it spreads out. It fans out. And the time that it takes for that message to get... that user to get a response is basically the slowest time the... any of those found out remote procedure calls takes.

*(voice, continued)*: and that is what, uh, Meta want to keep low. And, apparently, they use a lot of servers with quite a lot of idle time in order to get that low response time to kind of guarantee it. And, uh, if you start reducing this tail latency, especially for small messages, then the idea is that you can provision less servers to get the same response time for those messages. Is that something that's true?

**Claude:** Yeah, that's exactly right, and you've nailed the economics of it. The fan-out pattern means your response time is hostage to the slowest RPC, the ninety-ninth or even ninety-nine-point-nine percentile. So people over-provision, keeping servers lightly loaded, because tail latency explodes as utilisation climbs. If you flatten that tail, you can run each server hotter for the same user-facing latency, which means fewer machines for the same work. And at Meta scale, even a few percent is enormous money. That's precisely the promise Homa's pitching.

---

**Steve** *(voice)*: Okay. So I can see why Homa, could be useful to them. But why can't or can it be possible for you to create something that is transparent to all of Meta's applications?

*(voice, continued)*: gets

**Claude:** Right, so here's the core tension, and it's worth being precise about.

The thing that makes Homa fast is partly the thing that breaks transparency. TCP guarantees a single, ordered byte stream per connection. That ordering is exactly what creates head-of-line blocking, one lost packet stalls everything behind it. Homa throws that away, it does out-of-order, message-based delivery with no long-lived connection. But apps written for TCP assume ordering and a stream, so if you silently swap it underneath, you'd break their assumptions.

Now, you can get partway transparently, better priorities, smarter congestion control, load-aware scheduling under the socket. That buys you some tail reduction. But the biggest wins need the app to say "I'm sending discrete messages and I don't care about order," and TCP's API can't express that. Shall I go into what a realistic transparent design might actually look like?

---

**Steve** *(voice)*: Yeah. I really just need to understand what you're talking about. So, basically, say my Instagram message arrives into one of Meta's servers, and that fans out to a hundred servers. And each of those calls is one of a hundred remote procedure calls that are done over TCP. And the average response time is two hundred milliseconds. But one of those takes seven hundred milliseconds. The user has to wait seven hundred milliseconds. How does, um, Meta... not Meta. How does, um, this, um, what's it called? Well, I can't remember what it's called now. How does Homer help with this?

**Claude:** Okay, so picture that one slow RPC. Why is it slow? Usually not because the server was busy computing, but because the message got stuck in a queue somewhere in the network, waiting behind other traffic. That's the tail.

Homa attacks that a few ways. First, priorities: short messages jump ahead of long ones, so a quick RPC doesn't get trapped behind some big bulk transfer. TCP treats everything roughly equally, so your little request waits its turn.

Second, no connection setup and no head-of-line blocking, so a single dropped packet doesn't freeze the whole exchange. And third, it's receiver-driven, the receiver hands out permission to send, which stops many senders from all flooding one machine at once and forming those queues in the first place.

So that seven-hundred-millisecond outlier, which was really "stuck in a queue," largely disappears. Make sense?

---

**Steve** *(voice)*: k. I'm gonna pin you down here. Let's take, uh, this particular message. Um, you're... we're saying that it's going seven hundred milliseconds, but that's not because the server at the other end took seven hundred milliseconds to respond because it had no CPU. We're saying it took seven hundred milliseconds because of what... let's say, um, it sent using TCP and it takes... it's, say... so it's a very short message. It's just a little RPC on a Java socket. It just sends one packet out. Well, no. Maybe it has to be more than one packet for our scenario to work. Let's... tell me what's a realistic scenario for a short, very short message. Does it have multiple packets? Is that what we're talking about here for this seven hundred millisecond RPC, the slowest one?

**Claude:** Good, let's get concrete. A short RPC might be, say, a few hundred bytes up to maybe ten kilobytes. So it could be a single packet, or a handful, but crucially it fits well under what TCP calls its congestion window. So multiple packets, but not many.

Now here's the thing: for a message that small, the seven hundred milliseconds almost certainly isn't the packets themselves in flight. That's microseconds of actual transmission. The delay is queueing. Your little packet arrives at a switch, or at the receiving server's network card, and it's sitting in a buffer behind a big fat bulk transfer, someone shipping a hundred kilobytes or a megabyte. It waits its turn. That's your tail. Does that match the scenario you had in mind?

---

**Steve** *(voice)*: Sorry. Is this a scenario the Homer fixes?

**Claude:** Yes, exactly that scenario is Homa's bread and butter. That's precisely the problem it's built to kill.

The queueing-behind-big-transfers problem is what priorities solve. Homa lets your tiny packet leapfrog the megabyte transfer instead of waiting behind it. And because it's receiver-driven, the receiver controls who gets to send, so buffers don't build up in the first place. That's where the big tail-latency wins come from.

---

**Steve** *(voice)*: Okay. So let me get this straight. This... let's give a fixed number of packets and a fixed number of bytes to this message that is taking seven hundred milliseconds. Gone. Give me a realistic number for those two things for this example message.

**Claude:** Right, let's fix it. Say the message is ten kilobytes. With a standard packet size of about fifteen hundred bytes on the wire, that's roughly seven or eight packets. So: ten kilobytes, eight packets. That's a very typical "short RPC" in this world. Shall we run that through the seven-hundred-millisecond scenario?

---

**Steve** *(voice)*: Yeah. Let's create a realistic situation with the whole stack. You don't have to go through the whole stack, just the main bits. We need to know this one pathway, this one scenario, what's happening, why is it taking seven hundred milliseconds, what switches are involved, what happens on the remote server, what happens on the local server. Just a quick run through of all that.

**Claude:** Okay, let's trace it. Your ten-kilobyte, eight-packet RPC leaves the sending server. It goes out the network card, up into the top-of-rack switch, maybe across to a spine switch, then down to the top-of-rack switch above the destination, and finally into the receiving server's card and up its stack. In a datacenter, all of that, physically, is well under a millisecond.

So where do the seven hundred milliseconds come from? Queueing, at one of those hops. Picture the destination's top-of-rack switch. At the very moment your eight packets arrive, some other machine is halfway through shipping a one-megabyte bulk transfer out that same port, to that same server. That's roughly seven hundred packets sitting in the switch buffer ahead of yours. Your little RPC waits behind the whole lot. Drain time on a typical link? Hundreds of milliseconds. There's your tail.

And it can get worse: if that buffer overflows, TCP drops a packet, and now you wait for a retransmit timeout, which can be another big chunk on its own.

Homa's fix, in this exact spot: priorities mean your short message is marked to jump ahead of the bulk transfer's packets, and the receiver-driven bit means it wouldn't have let that buffer pile up so deep in the first place. Want me to show how the same trace plays out under Homa?

---

**Steve** *(voice)*: No. Thanks. But I'd like you to tell me whether any of this stuff that's causing the seven hundred millisecond delay is baked into, like, let's get concrete on the client app and the server app. Let's say the client app is a Java application, and the server app is a Java Tomcat server application. They're both running on Linux. Um, my question is, do either of these Java applications that are running on those servers Manage any of this.

*(voice, continued)*: stuff that involved the stuff that involved causing this delay or not.

**Claude:** Great question, and the answer is basically no. Neither Java app touches any of it.

Think about what your Java client actually does: it opens a socket, calls write with your ten kilobytes, and blocks waiting for a response. That's it. The moment it hands those bytes to the socket, everything after is the kernel's TCP stack, the network card, and the switches. The switch buffering, the queueing behind the bulk transfer, the packet drops, the retransmit timeouts, none of that is visible to or controlled by the Java code. Same on the Tomcat side: it's just reading from a socket.

That's actually the good news for your transparency dream. The delay lives below the app, in the kernel and network. So in principle you can attack it without the apps knowing. The catch, as I said, is how much you can fix while still pretending to be a faithful TCP stream.

---

**Steve** *(voice)*: You're not making sense to me at all because if your Tomcat... if your Java app on both end and you are being... pretending to do TCP, and all you're doing is sending ten kilobytes. If I just rip out everything in this Linux kernel, replace the entire thing between the two things, all the network stuff, just completely rip all that out and replace it with something that fixes all this tail, long tail problems, then my Java app doesn't need to be changed, does it?

**Claude:** You're right, and that's a real insight. If the Java app just writes tenkilobytes and reads a reply, and you replace everything below the socket, the app doesn't change. That much is true. Here's the sharp edge, though. It's not the Java code that constrains you, it's the contract the socket promises. A TCP socket guarantees: bytes arrive in order, none missing, as one continuous stream. If your replacement keeps that promise, the app never knows. And you can absolutely do better underneath, priorities, receiver-driven scheduling, and win a lot of the tail. That part works. Where it bites: some of Homa's biggest gains come from not keeping that promise, delivering messages out of order, no connection state. A Java app doing simple request-response won't notice. But other apps lean on stream ordering, and for those, out-of-order would break them. So "transparent for request-response RPC apps" is very achievable. "Transparent for literally every TCP app" is where it gets hairy. Does that distinction land?

---

**Steve** *(voice)*: We're not talking about delivering stuff out of order, are we? The whole point is that under the hood, Linux responds with everything in order. That's the idea.

**Claude:** Exactly, and if you hold that line, you're on solid ground. Keep the in-order promise at the socket, and the app is genuinely none the wiser. That's a legitimate design. Here's the one honest caveat, then I'll stop hedging. When you keep strict in-order delivery per connection, you keep head-of-line blocking within that one connection, if packet three is lost, packets four onward wait. Homa sheds some of its tail precisely by escaping that. So you'd capture a big share of the win, the priorities, the receiver-driven scheduling, no buffer pileups, but not quite all of it. And honestly? For your three-to-five-x goal rather than seventy, that's completely fine. You're aiming at the achievable sweet spot.

---

**Steve:** Ok so how to do this completely transparently to the 2 Java apps?

**Claude:** Let me verify a couple of technical details before I lay out the approach, because there's a specific piece of prior art that's almost exactly what you're describing.

*[searched: PIAS practical information-agnostic flow scheduling datacenter priority queues transparent]*

Good news first: the thing you're describing already exists as a known design, and it's genuinely transparent. It's called PIAS. So you're not chasing a fantasy, and Fable will have real prior art to work from.

Here's the shape of it. The trick is that you don't rewrite the transport at all. You keep TCP, in-order and all, exactly as your two Java apps expect. What you add is a thin layer underneath the socket that watches each connection and counts bytes. While a flow is small, you mark its packets high priority. Once a flow has sent a lot of bytes, you demote it. Short RPCs stay high, bulk transfers sink to the bottom. PIAS mimics shortest-job-first without knowing flow sizes in advance, purely by demoting flows as they grow. That's what kills your seven-hundred-millisecond queueing case, and the Java apps never know it happened.

Now the honest part, the catch you have to hear. This works in two places, and only one of them lives inside Linux:

The host side is the easy, transparent, toggleable bit. You swap the congestion control to DCTCP with one sysctl. Then you do the flow-size classification and priority marking with eBPF, hooking the network stack from a small program you load and unload at will. No kernel module to write, no app changes, flip it on or off by config. That matches your dream almost exactly.

The switch side is the part you can't fake from the Linux box. Priorities only do anything if the switches actually honour them, meaning they need priority queues and ECN turned on. PIAS needs the switches to have priority queues and ECN enabled, which are standard built-in features, but someone has to configure them. On your own hardware, fine. At Meta, that's the network team's cooperation, not a thing you drop into a server.

So the accurate version of your pitch is: "host-side, it's a loadable, transparent, toggleable thing that needs no app changes," which is true, plus "it assumes the switches are configured to respect priorities," which is the dependency. And on the numbers, PIAS gets roughly 40 to 50 percent better completion times for short flows over DCTCP, and DCTCP is already a big jump over plain TCP, so compounded against vanilla TCP under load, your three-to-five-x on the tail is a realistic target.

Want me to pull the PIAS paper and sketch the actual eBPF-plus-sysctl plan you'd hand to Fable?

---

**Steve:** Sorry but isn't this already all "done"¿ Won't Meta already have done all this? Please research the answer in depth

**Claude:** *[no visible reply — research didn't trigger]*

**Steve:** Please research

**Claude:** I'll dig into what Meta and the other hyperscalers have actually deployed here — whether this problem is already "solved" in production, and where the real gaps are.

*[launched deep research task]*

Your research report on transparent datacenter tail-latency reduction for small RPCs at hyperscalers is ready. It examines production deployments at Meta (DCTCP via eBPF/NetEdit), Google (Snap, Aequitas, Falcon), Microsoft Azure (RoCEv2/DCQCN), and AWS (SRD/Nitro), alongside the status of Homa, eTran, and Ultra Ethernet. The report identifies a genuine whitespace for a transparent, TCP-preserving, software-only eBPF solution targeting non-hyperscaler operators, and provides staged recommendations with concrete validation thresholds and honest caveats about performance claims and deployment realities.

*[The full research report artifact follows]*

> # Is Transparent Datacenter Tail-Latency Reduction for Small RPCs Already a Solved Problem at Hyperscalers?
>
> ## TL;DR
> - **Partly solved, but not in the exact form you're describing.** Every major hyperscaler already runs transparent, app-agnostic tail-latency machinery for small-message RPC — Meta runs DCTCP (ECN-based) fleet-wide, enabled invisibly to applications via eBPF; Google runs Aequitas/Swift/Snap+Pony Express and has moved congestion control into the Falcon hardware transport; Microsoft Azure runs RoCEv2/DCQCN for ~70% of its traffic; AWS runs SRD in Nitro hardware. So a naïve "priority marking + ECN + DCTCP, no app changes" concept is *already commoditized* at the hyperscaler tier.
> - **But there is a genuine, defensible gap for an accessible open-source project.** The hyperscaler solutions are either proprietary and not released as usable code (Meta's NetEdit, Google's Snap/Falcon), hardware-locked (SRD/Nitro, Falcon/IPU, RoCE NICs), or not transparent (Homa uses a brand-new non-TCP API and has stalled in Linux upstreaming). There is no turnkey, TCP-transparent, toggleable, software-only Linux package that a non-hyperscaler can drop in to get a 3–5× tail improvement. eBPF makes this newly feasible and nobody has shipped it as a usable product.
> - **The industry trend is toward hardware transport (Falcon, SRD, Ultra Ethernet), which paradoxically strengthens the case for a software-only project** aimed at the vast majority of operators who run commodity NICs, cannot buy IPUs/DPUs, and cannot rewrite apps off the TCP sockets API.
>
> ## Key Findings
>
> **1. Meta runs DCTCP in production, deployed transparently via eBPF — this is the closest thing to your target system that actually exists.** Meta's NSDI 2024 paper "A large-scale deployment of DCTCP" (Dhamija, Madhavan et al.) documents that Meta migrated in-region datacenter traffic from CUBIC to DCTCP starting in 2018, using ECN marking on top-of-rack switches. Crucially, Meta enables it *transparently* using an eBPF `sockops` program attached to the root cgroup that selects the congestion control algorithm per-connection at connection setup — no application changes. This is orchestrated by a BPF platform called NetEdit. Meta does NOT run PIAS, and does NOT run Homa in production. Meta uses RoCEv2 (not Homa) for its AI training backend network.
>
> **2. Google has the most advanced stack and has explicitly moved beyond software.** Google runs Snap (userspace networking microkernel) + Pony Express (custom transport), Swift (delay-based CC), and Aequitas (RPC admission control using commodity WFQ QoS queues for RPC-level SLOs). Most importantly, Google built and open-sourced (via OCP) **Falcon**, a hardware-assisted reliable transport implemented in the Intel IPU E2000, explicitly targeting "low tail latency" for RPC and other workloads. Google's Amin Vahdat has stated RoCE "is better suited for niche use cases than general purpose datacenters," and Falcon was developed with help from Meta, Microsoft, and Nvidia.
>
> **3. Microsoft originated both DCTCP and PIAS (via MSR/MSR Asia) and now runs RoCEv2 + DCQCN at scale.** Per Microsoft Research's NSDI 2023 paper "Empowering Azure Storage with RDMA" (Bai et al., MSR-TR-2023-13): "Today, around 70% of traffic in Azure is RDMA and intra-region RDMA is supported in all Azure public regions" (traffic measured Jan 18–Feb 16, 2023 via ToR switch counters). This is congestion-controlled by DCQCN, primarily for storage. PIAS itself (Bai/Chen, NSDI 2015) was a research system and was never reported as a fleet-wide production deployment.
>
> **4. AWS runs SRD (Scalable Reliable Datagram) in Nitro hardware.** SRD is a TCP-alternative implemented in the Nitro NIC ASIC, using multipath packet spraying and hardware retransmission, exposed via EFA's kernel-bypass libfabric interface for HPC/ML, and also underpinning ENA Express and EBS io2 Block Express. Per the AWS News Blog (Jeff Barr, Nov 29 2022): "ENA Express reduces P99 latency of traffic flows by up to 50% and P99.9 latency by up to 85% (in comparison to TCP), while also increasing the maximum single-flow bandwidth from 5 Gbps to 25 Gbps." It is hardware-locked and not a general TCP-transparent RPC transport.
>
> **5. Homa is NOT transparent and its Linux upstreaming has stalled.** Homa (Ousterhout, SIGCOMM 2018; Linux kernel module ATC 2021) delivers dramatic tail-latency wins in benchmarks. But it is explicitly NOT API-compatible with TCP — it is connectionless and message/RPC-oriented, requiring a new API. Adoption requires either rewriting apps or adding Homa support to RPC frameworks (gRPC/Thrift). The gRPC-Homa integration was suspended in late 2023. The latest patch series (v12, July 2025) has NOT been merged into mainline Linux and has received no detailed reviewer engagement across multiple reposts. Ousterhout himself has suggested Homa's real future may be in networking hardware, not software.
>
> **6. There is active 2023–2025 research on eBPF-based transport, but nothing shipped as a transparent product.** eTran (NSDI 2025, Chen/Meng et al., Harvard) implements TCP+DCTCP and Homa in eBPF/XDP: "eTran (Homa) achieves 3.9–7.5× lower P99 tail latency and 1.4–3.6× lower P50 latency compared to Linux (Homa)" — but it's a research prototype using AF_XDP and a custom userspace library, not transparent TCP. Meta's NetEdit is the only large-scale production eBPF transport-tuning platform, and it is not open-source as a turnkey system.
>
> ## Details
>
> ### What Meta actually runs (the core of your question)
>
> Meta's production datacenter transport is **TCP, with DCTCP congestion control for in-region traffic** and CUBIC for cross-region/backbone traffic. This is documented in Meta's own NSDI 2024 operational-track paper, "A large-scale deployment of DCTCP." Key production facts:
>
> - The migration from CUBIC to DCTCP began in earnest in 2018 and rolled out region-by-region over a four-month period.
> - DCTCP uses ECN marking on top-of-rack switches (shallow-buffered), reacting to the *fraction* of ECN-marked bytes proportionally, which suits Meta's bursty mix of large throughput flows and small latency-sensitive flows sharing shallow buffers.
> - Measured production wins: "We compared the overall volume of retransmissions for each region after deploying DCTCP... and observed a reduction of around 75%." One data-intensive service saw read latency at P90/P99 drop 38% (65ms→40ms and 130ms→80ms). Disabling DCTCP in one region caused "around a 10% drop in throughput and 4.5× increase in retransmissions."
> - **Transparency mechanism:** Meta could not use `sysctl` (too coarse, couldn't separate in-region from cross-region) or `setsockopt` (required coupling into thousands of services). Instead they use an eBPF `sockops` program on the root cgroup that negotiates ECN and sets `TCP_CONGESTION` to "dctcp" or "cubic" per connection based on an IP-based in-region classifier — entirely transparent to applications. On older cgroup-v1 hosts they combined sysctl with a TC program that clears ECN bits on inter-region SYNs.
>
> This is essentially a production-grade, transparent, toggleable, DCTCP-based tail-latency system — but it is bespoke to Meta and built on Meta's internal **NetEdit** platform (SIGCOMM 2024, "NetEdit: An Orchestration Platform for eBPF Network Functions at Scale"), which has been in production ~5–6 years, supports 13 network functions, and reportedly improved average service performance 3× and network performance 4.6×. NetEdit implements experimental CCAs (including a DCTCP reimplementation) directly in eBPF using struct_ops, and pushes a new version almost weekly. Meta uses `bpf-iter` to swap the CCA on every active socket without draining datacenters.
>
> Meta does **not** run PIAS (no priority-queue MLFQ byte-demotion scheme is reported in production). Meta does **not** run Homa. For AI training, Meta uses RoCEv2 over a dedicated Ethernet backend network (SIGCOMM 2024, "RDMA over Ethernet for Distributed AI Training at Meta Scale").
>
> ### Google
>
> Google's stack is the deepest and demonstrates the industry's trajectory most clearly:
> - **Snap + Pony Express** (SOSP 2019): userspace "microkernel" networking with a custom transport (Pony Express), deployed since ~2016 on over half of Google's fleet, ~3× Gbps/core improvement over kernel TCP, transparent upgrades. Not the Linux kernel stack.
> - **Swift** (SIGCOMM 2020): delay-based congestion control.
> - **Aequitas** (SIGCOMM 2022): distributed sender-driven admission control that maps RPCs to commodity Weighted-Fair-Queuing QoS classes to guarantee RPC-level tail-latency SLOs. Per the paper: "Aequitas achieves a latency SLO that is 3.8× lower than the state-of-art congestion control at the 99.9th-p and admits up to 2× more PC RPCs meeting SLO when compared with pFabric, Qjump, D3, PDQ, and Homa. Results in our fleetwide production deployment show a 10% latency improvement." This is the closest published hyperscaler analog to "PIAS-style priority scheduling," but it is QoS/admission-based and RPC-aware, not a transparent byte-counting MLFQ.
> - **Falcon** (2023, contributed to OCP): a hardware-assisted reliable transport in the Intel IPU E2000, built on Carousel, Snap, Swift, PLB, and CSIG, supporting RDMA and NVMe ULPs, targeting low tail latency at scale. This is Google explicitly moving transport into hardware.
>
> ### Microsoft
>
> Microsoft Research (with MSR Asia affiliations) originated **DCTCP** (2010) and **PIAS** (Bai, Chen et al., NSDI 2015). In production today, Azure runs **RoCEv2 with DCQCN** congestion control — ~70% of all Azure traffic (bytes and packets) is RDMA, supported in all public regions, primarily for disaggregated storage (NSDI 2023). This is transparent to applications (offloaded to NIC hardware) but is RDMA, not TCP, and is storage-focused rather than a general small-RPC TCP transport. RDMA reduces CPU utilization by up to 34.5% vs TCP for storage frontend traffic. PIAS remains a research artifact, not a reported fleet deployment.
>
> ### AWS
>
> AWS runs **SRD (Scalable Reliable Datagram)**, implemented in the Nitro networking card ASIC. SRD sprays packets across up to 64 paths, does not preserve order (leaving reordering to the libfabric userspace layer), and does hardware retransmission in microseconds. It's exposed via EFA (kernel-bypass, for HPC/ML/MPI) and also powers ENA Express and EBS io2 Block Express. SRD is fundamentally hardware-locked to Nitro and is not a transparent TCP-sockets RPC transport.
>
> ### The hardware trend and Ultra Ethernet
>
> The clear industry direction is **hardware transport**: Google Falcon (IPU), AWS SRD (Nitro), Nvidia/Mellanox RoCE NICs, and the **Ultra Ethernet Consortium** (founded July 2023 by AMD, Arista, Broadcom, Cisco, Eviden, HPE, Intel, Meta, Microsoft; Nvidia joined later). UEC released its 1.0 specification in June 2025 (a 562-page spec; the term "tail latency" appears dozens of times), defining Ultra Ethernet Transport (UET) — a hardware-centric, RDMA-based, libfabric-API transport for AI/HPC. The reasoning (per Ousterhout's own ATC 2021 analysis) is that CPUs can no longer keep up: neither Homa nor TCP can use more than ~1/3 of a 25 Gbps link for short messages even with 20 cores, because software per-packet overhead dominates once congestion is solved.
>
> ### Homa's status and the transparency problem
>
> Homa is the most-cited academic answer to small-RPC tail latency:
> - SIGCOMM 2018: receiver-driven, uses in-network priority queues + SRPT, connectionless, message-oriented.
> - ATC 2021 Linux kernel module: per the paper, "Homa's P99 latencies for short messages are 19–72x lower than those for TCP and 7–83x lower than DCTCP"; in a 40-node cluster benchmark Homa beat both for all message sizes. The upstreaming cover letter claims "10–100x reductions in tail latency for short messages relative to TCP."
> - **The transparency killer:** Homa is explicitly "not API-compatible with TCP." It requires a new message/RPC API (or RPC-framework integration). This is precisely the problem your project would avoid by keeping TCP socket semantics. (Ousterhout notes RPC frameworks like gRPC/Thrift could in principle offer transparent Homa support, but this has not materialized.)
> - **Upstreaming status:** The latest series is [PATCH net-next v12] (July 24, 2025), 15 patches. Nothing has merged to mainline Linux; successive versions report "no comments"/"no reviews," indicating the review has stalled for roughly a year. Homa remains an out-of-tree loadable module. The gRPC-Homa integration was suspended late 2023 (its early benchmark: ~55µs round trip with Homa vs ~90µs TCP, ~40% faster). LWN's Jonathan Corbet (Dec 2024) summarized Ousterhout's view: "even in a kernel with less overhead than Linux, CPUs simply are not fast enough to keep up with the increases in networking speed. The real future for Homa, he suggests, may be inside the networking hardware itself."
>
> ### eBPF / transparent research (2023–2026)
>
> - **eTran** (NSDI 2025): extensible kernel transport via eBPF/XDP; implements TCP+DCTCP and Homa; achieves up to 4.8×/1.8× higher throughput and 3.7×/7.5× lower latency than existing kernel implementations. But it uses AF_XDP + a userspace library and targets Mellanox NICs — not transparent to unmodified TCP apps, and a research prototype.
> - Related eBPF flow-scheduling/priority-marking work exists (inter-DC flow splitting with eBPF; DINT/Electrode from the same Harvard group), but none ships a transparent, TCP-preserving, PIAS-style MLFQ in eBPF as a usable product.
> - **No one has shipped "PIAS-in-eBPF" as a transparent, drop-in package.** This is the whitespace.
>
> ## Recommendations
>
> **Assessment: There IS real room for a novel, accessible open-source contribution — but the differentiator must be transparency + deployability, NOT raw performance or novelty of mechanism.** The mechanisms (ECN/DCTCP, priority queues, MLFQ demotion, QoS marking) are all well-known and deployed at hyperscalers. What is missing is a packaged, TCP-transparent, software-only, toggleable system that a normal operator (not a hyperscaler with a networking org) can actually deploy on commodity Linux + commodity switches.
>
> Staged next steps:
>
> 1. **Validate the gap concretely first (weeks).** Reproduce the baseline: on a small commodity-switch testbed, measure small-RPC P99/P99.9 under load with stock CUBIC vs. kernel DCTCP (already in Linux since 2014). If simply turning on kernel DCTCP + switch ECN gets most of the 3–5× win, your contribution is *packaging/automation*, not a new algorithm — be honest about that. **Threshold:** if stock DCTCP+ECN alone yields ≥3× P99 improvement, pivot your value proposition to "transparent, safe, automated enablement" (the Meta NetEdit problem) rather than a new scheduler.
>
> 2. **Position against the true gap: transparent PIAS-style priority scheduling in eBPF that preserves TCP sockets (months).** Implement byte-based MLFQ demotion via DSCP/priority marking in a TC/eBPF egress program keyed to per-flow bytes sent, combined with switch priority queues and DCTCP. This is the "PIAS-in-eBPF, no app changes" idea that genuinely does not exist as a product. Differentiators: (a) zero application changes (unlike Homa); (b) software-only, commodity NICs (unlike Falcon/SRD/RoCE); (c) toggleable per-connection like Meta's sockops approach; (d) open-source and documented for non-hyperscalers.
>
> 3. **Benchmark honestly against the right baselines (ongoing).** Compare against kernel DCTCP (not just CUBIC) and, if possible, eTran. **Threshold that would change the plan:** if you cannot beat stock kernel DCTCP by a meaningful margin on realistic mixed workloads, the project's value is purely operational (ease of deployment/observability), which is still legitimate but should be framed that way.
>
> 4. **Watch the hardware wave and scope accordingly.** Ultra Ethernet 1.0, Falcon, and SRD will absorb the AI/HPC and hyperscale-storage segments. **Do not** aim at those. Aim at the long tail: enterprises, smaller clouds, on-prem clusters, and microservice/RPC workloads on commodity gear that will never get IPUs/DPUs and cannot rewrite onto a new API. That market is real and underserved.
>
> 5. **Consider contributing to/hardening existing efforts rather than greenfield.** eTran is open-source (github.com/eTran-NSDI25/eTran); the biggest missing piece is transparency + productization. A credible contribution could be a transparency shim or a deployment/orchestration layer, echoing what NetEdit does internally at Meta.
>
> ## Caveats
>
> - **Production vs. research distinction:** Meta DCTCP, Azure RoCEv2/DCQCN, Google Snap/Aequitas/Falcon, and AWS SRD are confirmed production deployments (via first-party papers/blogs). PIAS, Homa, and eTran are research artifacts with no confirmed general production deployment.
> - **Performance numbers are largely author-reported.** Homa's 7–83× (ATC21) and 10–100× (cover letter) figures come from Ousterhout/PlatformLab benchmarks on CloudLab, not independent production telemetry. Meta's DCTCP wins and Aequitas's 10% fleetwide improvement are first-party but real production measurements. Treat all "Nx improvement" claims as workload- and testbed-specific.
> - **"Transparent" is doing a lot of work.** Meta's DCTCP is transparent to apps but required an enormous internal engineering effort (kernel bugs, switch ECN inconsistencies, fairness with CUBIC, cgroup heterogeneity). A "just toggle it" project will hit the same deployment realities — the hard part is not the algorithm but safe fleet-wide enablement, switch configuration, and coexistence.
> - **The DCTCP algorithm is already in mainline Linux** (since kernel 3.18/2014) and switch ECN is standard. So the transport primitive you'd build on is free and ubiquitous; your differentiation is orchestration, transparency, priority scheduling on top, and accessibility — not the CC algorithm itself.
> - I could not find a Homa patch version newer than v12 (July 2025), nor any evidence of Homa in real production at any company as of mid-2026.

---

**Steve:** I'll read it later. What's the TLDR and potential x speed up for our 700ms RPC?

**Claude:** Short version: mostly already solved at the hyperscaler tier, but *not* in the transparent-Linux form you want, and that gap is real.

Meta already runs exactly this shape of thing in production — TCP with DCTCP congestion control, switched on invisibly to apps via eBPF. Google, Microsoft and AWS have gone further into custom or hardware transports (Snap/Falcon, RoCE/DCQCN, SRD-in-Nitro). So the *mechanisms* are commoditised. But none of it ships as a drop-in, TCP-transparent, toggleable open-source package a normal operator can just deploy. Homa isn't transparent (new API, upstreaming stalled) and the hardware stuff needs IPUs/DPUs you can't buy off the shelf. That's your genuine whitespace: PIAS-style priority marking in eBPF, keeping TCP semantics, for people who aren't Meta.

On your 700ms RPC specifically — the honest breakdown:

- **DCTCP + ECN alone** (already free in the Linux kernel): kills most of the queue buildup. This is the bulk of the win. Meta saw ~75% fewer retransmits and P99s dropping ~40%. On a queue-dominated 700ms tail you'd plausibly land around 100–200ms, so roughly **3–5x**.
- **Adding priority marking** (your PIAS-in-eBPF layer, so the small RPC leapfrogs the bulk transfer): squeezes the tail further. Realistically pushes toward **5–10x** on that specific outlier, since you're directly attacking the "stuck behind a megabyte" case.
- **Homa's full 70x**: needs the non-transparent message API. Off the table if you're keeping TCP.

The uncomfortable catch: a big chunk of your 3–5x is just turning on DCTCP, which already exists. So your project's real value isn't the algorithm — it's the transparent priority-scheduling layer on top *plus* making the whole thing deployable by non-hyperscalers. Worth being clear-eyed about that before you sink time in.

Want me to sketch the eBPF + sysctl plan for Fable?

---

**Steve:** First tell me how and where the code fits and what it does, and why no one else has done this already. Seems a no brainer, no?

**Claude:** Let me split it, because the "no-brainer" feeling comes from looking at only one layer.

**Where the code sits.** Below the socket, above the NIC, in the kernel's egress datapath. Your Java app writes bytes to a normal TCP socket; kernel TCP does its normal thing; and as packets head out the door, a small eBPF program stamps them. That program is a TC (traffic-control) eBPF hook on the egress path. It keeps a map keyed by socket — "bytes sent so far on this flow" — and on each outgoing packet it increments that counter, decides which band the flow is in, and writes the DSCP priority bits in the IP header. Small flow → high DSCP. Once a flow crosses a byte threshold, demote it → low DSCP. That's the whole MLFQ trick. Plus one sysctl to select DCTCP. So the host side is genuinely tiny: a few hundred lines of eBPF C, a BPF map, and a userspace loader. Java never knows.

That tininess is exactly why it *feels* like a no-brainer. And at the code layer, it is.

**Why nobody's shipped it.** Because the value doesn't live in the code. It lives in the parts that aren't code:

1. **The DSCP bits do nothing until the switches are configured to honour them.** Priority queues, DSCP-to-queue mapping, ECN thresholds, consistent across the whole fabric — per-vendor, per-model, fiddly. That's the actual product, and it's unglamorous config work. Hyperscalers have network teams; a normal operator doesn't. So a "drop-in" package can't be drop-in for the part that matters most.

2. **The thresholds are workload-specific and fragile.** Set them wrong and you either don't differentiate at all, or you starve long flows and trigger retransmit storms. PIAS itself had to bolt on anti-starvation logic. Tuning it safely across shifting traffic is ongoing ops, not a weekend.

3. **The incentives left the middle empty.** The people who feel this pain acutely — hyperscalers — already solved it internally (NetEdit, Snap, Falcon) and those are competitive moats, so zero reason to open-source the productised version. The people who'd use an open version — mid-size operators — mostly don't feel it acutely enough to fund building it, and just over-provision or move to cloud. Real need, but diffuse and under-resourced. That's *why* the whitespace exists.

4. **Most of the easy win is already free.** Turn on kernel DCTCP + switch ECN and you've got the bulk of your 3–5x. The extra priority layer is more work for diminishing returns unless you're at scale — and at scale, you're the hyperscaler building it in-house. Classic missing middle.

5. **"Transparent" hides the real cost.** Meta's DCTCP rollout was a multi-year fight with kernel bugs, switch ECN quirks, CUBIC/DCTCP fairness, host heterogeneity. The algorithm is the easy 10%; safe fleet-wide enablement is the hard 90%. A clean demo on two hosts is a different universe from something safe in production.

So the resolution to your instinct: it's a no-brainer at the code layer and decidedly not at the operational layer, and those two come apart. Which is actually good news for you — the unclaimed ground isn't "invent the mechanism," it's "make the mechanism deployable by people who aren't Meta." That's a real, honest contribution, and it's the kind of thing where an accessible open-source package plus genuinely good docs and switch-config tooling would be the differentiator. Whenever something in systems looks like a pure no-brainer, the catch is almost always hiding one layer down — here it's sitting in the switches.

Want the eBPF + sysctl plan for Fable, framed around that deployability angle?

---

**Steve:** So the actual code bit is just an open source DSCP program. Has no one written that yet?

**Claude:** *[no visible reply — message resent]*

**Steve:** So the actual code bit is just an open source DSCP program. Has no one written that yet?

**Claude:** Good question to pin down — let me actually check rather than guess.

*[searched: eBPF DSCP marking bytes sent flow priority github]*

Here's the honest answer: pieces of it exist, the actual thing doesn't.

The closest is a project called qosify, from OpenWrt — it's an eBPF classifier daemon that sets DSCP fields on packets, with bulk-flow detection based on packets per second and priority boosting. So yes, "eBPF program that marks DSCP based on flow behaviour" has been written. But look at where it lives: home routers. It's built for shaping your broadband connection with CAKE, classifying by port and hostname. It's not byte-count MLFQ demotion, it's not paired with DCTCP and datacenter switch priority queues, and nobody's pointing it at RPC tail latency.

The original PIAS code from the paper also exists on GitHub, but it's a decade-old kernel module from the research, not maintained, not eBPF, not packaged.

So the state of play is: the eBPF DSCP-marking *technique* is proven and lying around in examples and router projects, the PIAS *algorithm* is published with dead reference code, and the combination — byte-based demotion, in eBPF, tuned for datacenter east-west traffic, shipped with the switch-config recipes and DCTCP toggle — genuinely hasn't been assembled. Which fits the story from the research: everyone who needed it badly built something private and bigger, and nobody productised the small version.

One caveat worth keeping: "nobody's written it" and "it's a good weekend project" aren't the same claim. The code is maybe a few hundred lines, and Fable will produce it easily. The credibility of the project will live in the benchmark rig that proves the 3–5x — that's the part that takes real effort and is also what nobody else has published.

---

**Steve:** Can I do an attempt at modelling a benchmark (not a real one) inside a single Ubuntu instance inside VMWare on a Mac? That's all I have

**Claude:** Yes — and it's actually the standard way this kind of thing gets prototyped. You don't need real hardware; you need Linux network namespaces, which give you an entire virtual datacenter inside one kernel.

The shape of it:

- **Virtual hosts:** network namespaces (`ip netns`) act as your "servers" — client, server, plus a bulk-traffic sender.
- **Virtual switch:** another namespace (or bridge) in the middle, with veth cables connecting everything.
- **The crucial trick:** use `tc` to throttle the "switch" links down to, say, 100 Mbps with a realistic buffer. That's what makes queueing delays big and visible — your 700ms-style tail appears on demand when a 10KB RPC lands behind a 1MB transfer.
- **The mechanisms:** ECN marking via a `red` or `codel` qdisc on the bottleneck (that's your switch ECN), DCTCP via sysctl per namespace, and priority bands via a `prio` qdisc mapped from DSCP — which is exactly what your eBPF marker feeds. All the real machinery, no real network.
- **Traffic + measurement:** iperf3 for the bulk flow, netperf TCP_RR or a tiny Java client for the RPCs, log P50/P99/P99.9.

Then you run the same scenario four ways — CUBIC, DCTCP+ECN, DSCP priorities alone, both together — and you've got your comparison chart.

The honest caveat: absolute numbers from a VM are meaningless. VMware adds scheduling jitter, and everything shares one kernel. But *relative* results are valid and that's what you're modelling — "P99 dropped 8x when marking was on" is a real demonstration of the mechanism even if the microseconds are fake. This is essentially what Mininet does for networking research papers.

It's also a perfect Fable task: the whole rig is a couple of shell scripts plus your eBPF program. Want me to write the spec for it?

---

**Steve:** Yes please

**Claude:** *[Created the benchmark spec: [tailcut-benchmark-spec.md](tailcut-benchmark-spec.md) — at the time named pias-lite-benchmark-spec.md]*

Here's the spec, ready to hand to Fable. A few design choices worth knowing about:

The scenario matrix is the heart of it — four runs (CUBIC baseline, DCTCP alone, priorities alone, both together) so you can attribute exactly where the win comes from, plus an optional fq_codel scenario as the honest "what Linux gives you for free" competitor. S2 sitting next to S4 in the report is your built-in honesty check on how much was just DCTCP.

I've also baked in the traps that would otherwise eat a day each: preserving ECN bits when writing DSCP (get this wrong and DCTCP silently dies), turning off TSO/GSO so packets are real-sized, and keeping the baseline a dumb FIFO so the comparison stays clean. And acceptance criterion #2 makes Fable prove the rig actually manufactures a tail before measuring anything else.

---

**Steve:** Who's the perfect market for this?

**Claude:** The sharp filter first: your buyer must **own their switches**. Cloud tenants can't configure priority queues on AWS's fabric, so the entire public-cloud VM world is out. That leaves people running their own gear — and among them, the ones doing fan-out RPC under load with a P99 they care about.

Concretely, the best-fit profiles:

- **Bare-metal Kubernetes shops** — especially the cloud-repatriation crowd. A couple of racks, own ToR switches, service mesh doing exactly the fan-out pattern we traced, and no dedicated network team to build this themselves. This is the bullseye.
- **Ad-tech / real-time bidding** — hard 100ms response budgets, massive fan-out, famously run on owned hardware for cost. Tail latency is literally revenue.
- **Self-hosted distributed databases and storage** — Ceph, Cassandra, ClickHouse clusters, where one slow replica drags every quorum read.
- **Gaming backends and telcos/ISPs** — latency-sensitive east-west traffic on commodity Ethernet.

The economic pitch to all of them is the one you spotted with Meta: they're over-provisioning to protect P99, so "run the same boxes hotter" is deferred hardware spend. And explicitly not your market: hyperscalers (built their own), HFT (already on kernel bypass), and anyone on managed cloud.

One more honest observation: the *first* market is arguably developers and researchers, not operators — a reproducible open-source rig with clean benchmarks is the kind of thing that travels on HN and gives Agentic HQ-style credibility long before any ops team deploys it in anger. That's a legitimate return even if adoption is slow.

---

**Steve:** What about large AI clusters with mixture of experts. Do they do fan out and be affected by tail latency? Please check online

**Claude:** *[searched: mixture of experts all-to-all communication tail latency GPU cluster network]*

Yes and no — and the split matters for you.

Yes, MoE is extreme fan-out. Every MoE layer does two all-to-all exchanges — tokens dispatched out to experts spread across GPUs, results gathered back — and DeepSeek-V3 has 58 MoE layers, each needing two all-to-alls, per token batch. And it's brutally tail-sensitive: the layer can't proceed until the *last* transfer lands, so unbalanced routing and communication skew directly show up as tail latency and lost throughput. The scale of the pain is real too — Meta found expert-routing traffic accounts for 10–30% of per-token latency in production MoE serving, and DeepSeek reported GPUs spending as much time communicating as computing. So conceptually it's your 700ms RPC story on steroids.

But — it's not your market, for the reason we hit earlier: none of this rides on kernel TCP. These clusters run NCCL over RoCE, InfiniBand, or NVLink, with the transport increasingly pushed into NICs and GPUs themselves. Your eBPF layer sits in the Linux TCP stack, which this traffic never touches. The MoE world is being fought over by Ultra Ethernet, Nvidia, and scheduled-fabric vendors with billions behind them — the one place you'd least want to compete.

The useful takeaway is narrative, not market: MoE is the loudest proof that tail latency in fan-out is *the* scaling problem of the decade. Your pitch is the humble echo of it — "the same physics applies to your boring Kubernetes RPC traffic, and here's the version you can deploy without buying an AI fabric."

---

**Steve:** Ok. So pick an ideal target company. Name it and describe why

**Claude:** *[searched: Criteo on-premise datacenters infrastructure real-time bidding latency]*

Criteo. The French ad-tech company. It's almost a laboratory-perfect fit, and here's the case:

**They own the metal.** Their stack runs on-premises across roughly 40,000 servers in seven datacenters, orchestrated with Kubernetes and Mesos. So they control the switches — the disqualifier that kills most candidates doesn't apply.

**Their workload is your exact scenario.** They respond to 20 million bid requests per second, each auction completing in under 100 milliseconds, and every bid fans out internally — peaking at 290 million key-value queries per second against their data layer. That's small-message RPC fan-out under a hard deadline: the 700ms trace we walked through, industrialised.

**The tail is literally revenue.** In RTB, a late bid isn't slow — it's discarded from the auction. P99.9 directly converts to lost money, which makes the "run your servers hotter for the same tail" pitch a CFO conversation, not just an engineering one. And they've shown they'll buy exactly this shape of value: they replaced their caching layer partly to cut server count while holding sub-millisecond latency.

**They're the right size.** Big enough to feel hyperscaler-class pain, not big enough to have built a Snap or a Falcon. No custom transport, no IPU fleet — commodity Linux on commodity Ethernet. And culturally they're a good door to knock on: active engineering blog, heavy open-source users, Paris-based so reachable from London.

The realistic framing: not "Criteo adopts your GitHub repo," but "Criteo is the archetype you design for." Every requirement — transparent to a zoo of C#/Java/C services, toggleable per rack, no app rewrites across thousands of services — falls straight out of imagining their environment. Runner-up archetypes: booking platforms and the 37signals-style cloud-repatriation crowd, same shape at smaller scale.

---

**Steve:** They may have written this already and be running it. Closed source?

**Claude:** Fair challenge — let me see what's publicly visible about their network stack.

*[searched: Criteo engineering DCTCP ECN network QoS tail latency datacenter]*

Possibly, but the evidence says probably not — and the nuance is instructive.

Nothing public suggests Criteo has built anything like this. They run a prolific engineering blog and talk openly about their infrastructure — databases, Kubernetes, ML serving — and there's no trace of a custom transport layer or PIAS-style priority scheme in any of it. What competent shops at their tier *do* commonly deploy is the standard-practice layer: ECN and QoS classes configured on switches, maybe DCTCP — it's an established pattern, Morgan Stanley, for instance, documented a deployment using DSCP bits to segregate DCTCP traffic from normal TCP with different queue treatments. So assume the "free win" tier may already be switched on there.

But here's the pattern that matters: companies like Criteo overwhelmingly attack tail latency at the *application* layer — hedged requests, replica fallbacks, aggressive timeouts, over-provisioning — because that's within reach of normal backend teams. Building a byte-counting transport-priority layer sits in a no-man's-land: too kernel-y for app teams, too custom for network teams whose job is keeping vendor gear stable. That organisational gap, not technical impossibility, is why the thing goes unbuilt even at companies that would benefit. Same story as before, one tier down from the hyperscalers.

And strategically it barely matters if Criteo specifically has it. They're the archetype, not the sole customer — if they built it internally, it's closed, unmaintained-for-outsiders, and the thousand smaller companies shaped like them still have nothing. An open, documented version has value even in the world where three companies quietly did it first. The bigger genuine risk to your project isn't secret prior art — it's that "turn on DCTCP and fq_codel" gets 80% of the benefit with 20% of the novelty, which is exactly what your S2-versus-S4 benchmark is designed to settle.

---

**Steve:** 2 things: please dig further into exactly what this layer is, where it sits in Linux OS and what it does: "Building a byte-counting transport-priority layer sits in a no-man's-land: too kernel-y for app teams, too custom for network teams whose job is keeping vendor gear stable." And after that: I don't understand this (yet) - "turn on DCTCP and fq_codel" gets 80% of the benefit with 20% of the novelty, which is exactly what your S2-versus-S4 benchmark is designed to settle.

**Claude:** **1. What the layer actually is and where it sits**

Trace a packet leaving your Java app. The app calls write() on a socket — that's the last thing it ever sees. The kernel then takes over: the TCP layer chops bytes into segments and applies congestion control, the IP layer wraps each segment with a header, and then — right before the packet is handed to the network card driver — it passes through Linux's traffic-control (TC) layer, the kernel's last checkpoint on the way out.

That checkpoint is where this code hooks in. It's an eBPF program: not a kernel module you compile into Linux, but a small sandboxed program the kernel verifies for safety and then runs natively. You load it with one command, unload it with another — that's your toggle. At that hook it sees every outgoing packet, fully formed.

What it does per packet is almost embarrassingly small: look up the packet's flow (source/destination/ports) in a little in-kernel hash table, add the packet's size to that flow's running byte count, and then rewrite six bits in the IP header — the DSCP field — based on the count. Under 100KB sent? Stamp it "high priority." Over a megabyte? Stamp it "bulk." Fix the checksum, done. The program never queues, drops, or delays anything. All the actual queue-jumping happens later, inside the switches, which read those six bits and put the packet in a fast or slow queue accordingly.

Now the no-man's-land. Your Java team lives *above* the socket — this layer is invisible to them and eBPF/kernel networking is a foreign country. The network team lives *below* the host — they configure switch gear, they don't ship code onto thousands of servers; that's someone else's deployment pipeline. So the marker needs a person who spans host kernels, switch config, and fleet rollout at once — a role that exists at Meta and basically nowhere else. The gap is organisational, not technical.

**2. The 80/20 worry, unpacked**

Your 700ms tail has two fixes stacked in the design. DCTCP+ECN stops switch queues getting deep in the first place — senders back off early, so there's less queue for anyone to wait in. Priority marking then lets small flows jump whatever queue remains. The uncomfortable question: once DCTCP has shrunk the queues, how much is left for the marker to jump?

And there's a second boring hero: fq_codel, a queueing discipline that's shipped in the Linux kernel for a decade. One tc command, and it gives every flow its own queue with fair servicing — small flows stop waiting behind elephants automatically, no byte counting, no eBPF, no DSCP. It independently delivers a chunk of what your clever layer does.

So the risk is: sysctl DCTCP + one-line fq_codel — zero novel code — might take the tail from 700ms to, say, 120ms, and your marker only takes it from 120 to 90. Then you've built the least valuable slice. That's precisely why the spec runs the scenarios separately: S2 is "just DCTCP," S5 is "just fq_codel," S4 is the full stack. If S4 beats S2 by a wide margin, your layer earned its place; if not, you learned it cheaply before building a product around it.

One counterweight in your favour, though: fq_codel only exists on Linux boxes. Real datacenter switch chips don't run it — but they *do* all have priority queues that read DSCP bits. So in a real fabric, your marker drives hardware that actually exists, while fq_codel can't follow the packet past the host. Even if S5 shines in the VM, that's partly an artefact of the switch being simulated by Linux.

---

**Steve:** Remind me what DCTCP+ECN are

**Claude:** ECN — explicit congestion notification — is the switch politely raising its hand. Normally a switch only signals "I'm overloaded" by dropping packets, which the sender learns about painfully via timeouts. With ECN, when a switch's queue starts building past a threshold, it flips a bit in packets as they pass through: "I'm getting busy." The receiver echoes that bit back to the sender in its ACKs. No drops, no waiting — early warning.

DCTCP — datacenter TCP — is what listens to those warnings, on the sending server. It's a congestion-control algorithm, a drop-in replacement for the default (CUBIC) that lives in the kernel; you pick it with one sysctl setting, apps none the wiser. Regular TCP with ECN reacts crudely — any congestion signal, big back-off. DCTCP instead measures *what fraction* of its packets came back marked and backs off proportionally: 10% marked, ease off a little; 80% marked, brake hard.

The combined effect: senders throttle just enough, just in time, so switch queues stay almost empty instead of filling to the brim. And since your 700ms was mostly "sitting in a full queue," keeping queues near-empty deletes most of the tail. That's the whole trick — and both halves already exist: ECN in the switches as a standard feature to turn on, DCTCP in the Linux kernel since 2014.

The pairing is non-negotiable, mind: DCTCP without switch ECN marking is deaf — it hears no signals and just behaves like a strangely aggressive TCP, which is why the switch config matters as much as the sysctl.

---

**Steve:** Ok, so would Criteo, our perfect customer, probably have this DCTCP+ECN enabled already. Can you research this please

**Claude:** *[searched: Criteo network engineering datacenter fabric Clos BGP switches blog — too generic]*

That was too generic — let me go at Criteo directly.

*[searched: Criteo "network" infrastructure SRE talk "ECN" OR "DCTCP" OR "congestion control" — still generic]*

One more angle — their conference talks and blog directly.

*[searched: Criteo medium.com engineering blog network team datacenter switches tuning kernel]*

Really useful dig, this — I found their actual engineering posts, and the picture is telling.

What's confirmed: they have a serious network team. Their datacenter LAN is a Clos matrix design leaning heavily on ECMP, probed with a custom tool they open-sourced, so the fabric is modern and the switches are exactly the commodity kind with priority-queue and ECN features sitting in them. They're also genuinely kernel-literate — they sponsor and attend Kernel Recipes, and they've evaluated kernel-level trade-offs like CPU mitigation tuning against their own threat model.

Here's the revealing bit though. They've written publicly about Linux traffic control — a whole "Demystification of TC" post — and what do they use it for? Bandwidth isolation between Mesos containers competing for host resources, with pfifo_fast defaults and fq_codel mentioned only as an alternative option. Per-container fairness shaping. Not a word, there or anywhere I can find, about DCTCP, ECN marking on the fabric, or flow-priority scheduling for tail latency.

So my honest read: probably not enabled, and that absence is the interesting datapoint. Here's a company with a real network team, kernel expertise, TC knowledge on the host, latency-critical revenue, and switches that support ECN — and the visible evidence says they run classic drop-tail queues and use TC for a different problem entirely. Which fits the wider industry pattern: DCTCP outside hyperscalers is rare, because it demands coordinated ECN config across every switch plus host changes in one motion, and the RFC itself warns it degrades badly on any congested drop-tail link in the path. Nobody wants to be the person who half-deploys it.

Two implications for you. First, the market thesis strengthens: if even the archetype customer hasn't switched on the "free win," the packaging-and-safe-enablement story is the product, more than the eBPF marker. Second, a caveat in fairness — absence from a blog isn't absence from production; companies rarely blog about switch QoS config. But the TC post is exactly where you'd expect DCTCP to get a mention if it were part of their world, and it isn't there.

---

**Steve:** What's the danger here: "Nobody wants to be the person who half-deploys it."

**Claude:** The danger is that a partial deployment isn't just "less benefit" — it's actively worse than doing nothing, in ways that are hard to trace back to you.

- **Mixed traffic starves the innocent.** DCTCP and normal TCP react to congestion signals completely differently — DCTCP eases off gently, CUBIC slams the brakes. Put both on the same ECN-marking queue and DCTCP flows bully the CUBIC ones. So halfway through a rollout, *unmigrated* services mysteriously slow down. The victims are the teams who changed nothing.
- **One dumb switch poisons a path.** DCTCP needs every hop marking ECN. If a flow crosses one switch that isn't configured — or a device that strips ECN bits — DCTCP falls back to loss-based behaviour against deep buffers, which is the exact thing you were escaping. Meta literally had to add code scrubbing ECN off traffic leaving the region.
- **Thresholds are a knife edge.** Set the switch marking threshold too low and bulk throughput collapses; too high and you get no latency win. And the right value differs per link speed, so it's a fleet of individually wrong-able settings.
- **The failure mode is fog, not fire.** Nothing crashes. You get retransmit weirdness, throughput dips in services three teams away, dashboards that don't point anywhere. Weeks of "the network feels off" — and your change is in the ticket history.

That's the career asymmetry: succeed and you've improved a percentile chart nobody looks at; botch it and you've caused a diffuse, unattributable incident spanning switch configs and host settings that can't be rolled back in one motion. Rational engineers decline that bet — which is precisely why the safe-enablement tooling, staged rollout and verification story *is* the product, not an accessory to it.

---

**Steve:** Sounds horrible. Let's give our simple program a proper name. What are the options? Then, is it risky to half deploy or could cause other problems (eating CPU in the client?)

**Claude:** **Names first.** The honest description is "small flows jump the queue," so:

- **TailCut** — my favourite: says exactly what it does to your P99, short, clean verb energy. Only wrinkle is sounding vaguely like Tailscale.
- **QueueJump** — wonderfully British and self-explanatory, but there's a known research collision: QJump was a 2015 Cambridge system doing datacenter latency via priority levels. You'd live in its shadow.
- **Leapfrog** — friendly, memorable, describes the mechanism.
- **FastLane** — instantly understood, but generic and heavily used across tech.
- **PIAS-lite** stays fine as the working title, credits the lineage, but it's a spec name, not a product name.

I'd take TailCut, with a quick GitHub/npm collision check before committing.

**Now the risk question — and here's the pleasant surprise: the marker is the *gentle* half of the system.** The horror stories from last message were all DCTCP/ECN's; the marker half-deploys rather gracefully:

- **Switches not configured yet?** The DSCP stamps are inert ink — nobody reads them, nothing changes. Safe no-op, deploy hosts first in any order.
- **Only some hosts running it?** Marked small flows jump ahead of unmarked traffic — mild unfairness during rollout, but bounded: the high band only ever carries the first 100KB of any flow, so no one can hog it, and it fades as rollout completes.
- **CPU on the client?** Genuinely negligible. Per packet it's one hash lookup, an add, and a six-bit write — tens of nanoseconds. And in production you leave TSO on, so the kernel hands the program big 64KB super-packets, meaning far fewer invocations. Fractions of a percent of one core.
- **Can it crash the kernel?** No — that's eBPF's whole deal: the verifier proves the program safe before loading. Worst case you unload it, one command, per host. Instant rollback, no fabric-wide state.

Two real dangers to respect, though. First, **strict-priority starvation**: if a config bug lets bulk flows keep high marks, the bottom queue can starve outright — mitigate by rate-limiting the top band on switches, standard practice. Second, and sneakier: **DSCP bits may already mean something** in a given network — storage or voice classes with existing QoS maps. Stamping over someone's existing scheme is the one way this "harmless" program causes a genuine incident, so an audit of current DSCP usage belongs in the deployment checklist.

The strategic read: risk lives almost entirely on the switch/DCTCP side, safety lives on the marker side — so the product's staged story writes itself: marker first (inert), verify marks on the wire, then enable switch priorities, then DCTCP last.

---

**Steve:** Ok. Let's call it TailCut. I found this https://ieeexplore.ieee.org/document/10113134 that has " Second, we apply a HLL register compression technique called TailCut to the On-vHLL sketch, which can save memory cost by 50%" but not that worried about that. Please research the name and let me know what you think. There isn't a GitHub project called TailCut

**Claude:** *[searched: "tailcut" software project]*

Verdict: it's clean enough to use. Here's the full collision map:

- **The name's been reused academically three times already, in three unrelated fields** — your HLL sketch paper, plus a DAC 2022 paper where TailCut is an SSD state-encoding scheme improving NAND flash lifetime and read latency. Ironically, multiple reuses is a *good* sign: it means nobody owns the word, no trademark, no living project defending it. Academic paper names die with the paper.
- **The nearest neighbour worth knowing about:** "TailCutter," an IEEE journal paper on cutting tail latency in cloud CDNs by scheduling chunk downloads across multiple clouds under cost constraints. Same problem *space* as yours, similar name — so anyone searching "tailcut tail latency" will bump into it. But it's a ~2019 academic framework, not a product, no code presence to speak of. You'd cite it in a related-work footnote and move on.
- **Detritus:** a dead Windows shareware "TailCutter" from 2015, and the hashtag namespaces are dog-grooming videos, which is honestly on-brand for a queue-trimming tool.
- One niche wrinkle: "tailcut" is jargon in gamma-ray astronomy image-cleaning pipelines. Different galaxy, literally. No conflict that matters.

So: no GitHub squat, no npm package, no trademark, no active product anywhere. The only real-world confusable is Tailscale by vibe, and that fades once "tailcut: eBPF tail-latency cutter for Linux" is what search engines index. My advice — take it, and register the github org and a domain (tailcut.dev or .io) this weekend before the name appears in any public repo or post, since that's the cheap insurance. Lowercase `tailcut` as the CLI name reads nicely too: `tailcut enable`, `tailcut status`, `tailcut off`. The toggle you wanted from the very first message, as a command.

---

**Steve:** which is best tailscale.dev or tailscale.io

**Claude:** Assuming you mean tailcut.dev vs tailcut.io — go with **.dev**, and here's the reasoning:

- **.dev fits the audience exactly.** It's become the default for developer tooling and open-source project sites. Your users live in terminals; the TLD signals "this is infrastructure for you."
- **.dev is cheaper** (~£10-12/yr vs ~£30-50 for .io) and Google-run with enforced HTTPS baked into browsers — the whole TLD is HSTS-preloaded, so it can't even be served insecurely. Nice hygiene signal for a networking tool.
- **.io carries a small but real cloud over it.** It's technically the country code for the British Indian Ocean Territory, and the UK's handover of the Chagos Islands to Mauritius raised genuine questions about the TLD's long-term future. The likely outcome is it survives — too much money in it — but "likely" is a strange bet for a project about reliability.

The pragmatic move: register tailcut.dev as the home, and if you're feeling protective, grab .io too while it's unclaimed and redirect it. Ten quid a year for squatter insurance. But if you're buying one, .dev is the one.

---

**Steve:** all gone already. see https://tailscale.com/ and tailscale.dev websites. Think I'll just create the GitHub project inside Agentic-HQ namespace. Not planning on doing much with it anyone. It's a sample project to test whether an Agentic-HQ workflow improves quality much vs just one-shotting without Agentic-HQ workflow

**Claude:** Small catch: you checked the wrong name! Those sites are **tailscale** — the VPN company, very much alive. Your project is **tailcut** — different word, and tailcut.dev was showing no signs of life when I researched it. Easy mix-up since I flagged the similar vibe earlier. Worth a fresh look before you rule out the domain — though for a test project, skipping the domain entirely is obviously fine.

And the Agentic-HQ namespace plan makes sense — but let me say, you've accidentally picked a *superb* benchmark task for that workflow-vs-one-shot experiment. Better than most coding evals, actually:

- It has a written spec with binary acceptance criteria (rig produces a real tail, S4 beats S1 by 3x, verify.sh passes) — so "did it work" isn't a vibe judgment.
- It spans multiple hard domains at once — eBPF, tc qdisc plumbing, namespaces, C, measurement scripts — exactly where one-shotting tends to quietly break something.
- And crucially, the spec contains booby traps we identified in advance (ECN-bit preservation, TSO-off, the RED bandwidth param). You can literally score whether each approach dodged them. A one-shot that clobbers the ECN bits will *appear* to work while silently killing DCTCP — the perfect trap for measuring whether the workflow catches what the single pass misses.

One suggestion for experimental fairness: give both runs the identical spec file as input, and define your quality rubric before running either — acceptance criteria met, traps avoided, does verify.sh pass, code review count of subtle bugs. Otherwise hindsight bias will favour whichever you ran second.

---

**Steve:** Yup, all makes sense. tailcut.dev registered just now for 1 year for £15

**Claude:** Excellent — £15 well spent, and honestly a tidy story: from "I heard homework gets 70x" to a named, domained, specced project in one conversation.

State of play, since it's all now real: **tailcut.dev** registered, repo destined for the Agentic-HQ namespace, spec file in hand (worth renaming to `tailcut-benchmark-spec.md` and swapping "PIAS-lite" for tailcut in the text before handing it over — inconsistent naming between spec and repo is exactly the kind of thing that confuses agent workflows), and a doubling as a controlled experiment: workflow versus one-shot, scored against the pre-defined acceptance criteria and the planted traps.

When you run it, the one extra artefact worth capturing is a short RESULTS.md from each attempt — which criteria passed, which traps got sprung — because that turns "I reckon the workflow helped" into a table, and it becomes content for the Agentic HQ story itself: a real, gnarly, multi-domain benchmark rather than another todo app demo.

Enjoy the build — and when the S2-versus-S4 numbers land, I'll be curious whether the clever layer earns its keep or DCTCP quietly takes 80% of the glory.

---

**Steve:** I need (verbatim) this **WHOLE** conversation in a markdown file I can download please. Please just refer to the pias-lite-benchmark-spec.md by a clickable link as I've already downloaded it and will it in the same directory

**Claude:** *[produced this file: tailcut-conversation.md]*
