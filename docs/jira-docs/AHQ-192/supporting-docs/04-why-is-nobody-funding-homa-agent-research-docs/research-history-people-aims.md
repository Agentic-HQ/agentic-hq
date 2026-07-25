# Homa Transport Protocol — History, People, Aims, and Use Cases (Research Notes)

Research date: 2026-07-23. Compiled from web sources only (no repos cloned). Every factual claim carries a source link. Unverified items are collected in the Gaps section at the end.

---

## 1. Origins

### 1.1 The RAMCloud lineage (2009–2015)

Homa did not appear from nowhere — it grew directly out of Stanford's **RAMCloud** project, a DRAM-based distributed storage system led by John Ousterhout that aggregated the memories of thousands of servers into a single coherent key-value store, targeting capacities of 1 PB or more with all data held in DRAM at all times ([RAMCloud project wiki](https://ramcloud.atlassian.net/wiki/spaces/RAM/overview), [The RAMCloud Storage System, ACM TOCS, September 2015](https://dl.acm.org/doi/10.1145/2806887), [TOCS PDF at Stanford](https://web.stanford.edu/~ouster/cgi-bin/papers/ramcloud-tocs.pdf)).

RAMCloud's defining obsession was latency: remote reads in **as little as 5 µs** and writes in **under 15 µs** over a datacenter network ([USENIX HotOS XIII](https://www.usenix.org/conference/hotosxiii/its-time-low-latency), [RAMCloud TOCS paper](https://web.stanford.edu/~ouster/cgi-bin/papers/ramcloud-tocs.pdf)). The group's May 2011 HotOS position paper **"It's Time for Low Latency"** (Stephen Rumble, Diego Ongaro, Ryan Stutsman, Mendel Rosenblum, John Ousterhout) argued that datacenter RPC latencies of 5–10 µs were achievable and that the whole stack — including the transport protocol — was the obstacle ([USENIX HotOS XIII page](https://www.usenix.org/conference/hotosxiii/its-time-low-latency), [slides](https://www.usenix.org/legacy/event/hotos/tech/slides/rumble.pdf)). Homa is the transport-layer answer to that manifesto: RAMCloud needed a network protocol whose tail latency matched its microsecond-scale storage latency. The RAMCloud project itself is now inactive — "the students working on RAMCloud have graduated" ([RAMCloud wiki](https://ramcloud.atlassian.net/wiki/spaces/RAM/overview)).

### 1.2 The SIGCOMM 2018 paper

**"Homa: A Receiver-Driven Low-Latency Transport Protocol Using Network Priorities"** by Behnam Montazeri, Yilong Li, Mohammad Alizadeh (MIT), and John Ousterhout (Stanford) was published at ACM SIGCOMM 2018 ([ACM DL](https://dl.acm.org/doi/10.1145/3230543.3230564), [paper PDF](https://people.csail.mit.edu/alizadeh/papers/homa-sigcomm18.pdf)). A "Complete Version" (18 pages + 2 pages references, restoring material cut for the conference page limit) was first posted to arXiv on **26 March 2018**, revised 27 June 2018 ([arXiv:1803.09615](https://arxiv.org/abs/1803.09615)).

**Problem it set out to solve:** provide the lowest possible latency for short messages at high network load in datacenters — the RPC pattern that dominates datacenter traffic — where TCP's tail latencies are orders of magnitude worse than the hardware allows ([arXiv abstract](https://arxiv.org/abs/1803.09615)).

**Key mechanisms** ([complete version, HTML](https://ar5iv.labs.arxiv.org/html/1803.09615), [micahlerner.com Part I summary](https://www.micahlerner.com/2021/08/15/a-linux-kernel-implementation-of-the-homa-transport-protocol.html)):
- **Receiver-driven flow control**: the receiver, not the sender, schedules incoming data via GRANT packets, since the receiver's downlink is the usual congestion point.
- **In-network priority queues**: uses up to **8 Ethernet priority levels** (typically 4 for unscheduled, 4 for scheduled packets), dynamically allocated by receivers; performance was "almost as good with 4 priority levels as with 8" ([complete version](https://ar5iv.labs.arxiv.org/html/1803.09615)).
- **SRPT-like scheduling** (shortest remaining processing time): favours messages with fewest bytes left, giving short messages near-ideal latency.
- **Blind/unscheduled transmission** of the first RTT-worth of bytes (~10 KB region) so short messages never wait for a grant.
- **Controlled overcommitment** of receiver downlinks to sustain high utilization.

**Headline results claimed** ([arXiv:1803.09615](https://arxiv.org/abs/1803.09615), [ar5iv HTML](https://ar5iv.labs.arxiv.org/html/1803.09615)):
- **99th-percentile round-trip time < 15 µs** for short messages on a **10 Gbps** network at **80% load** — "almost 100x lower than the best published measurements of an implementation".
- 99th-percentile slowdown of **2–3.5x** vs an unloaded network across message sizes and workloads.
- In simulation, latency roughly equal to pFabric and significantly better than pHost, PIAS, and NDP, while sustaining higher loads than pFabric/pHost/PIAS.

**Implementation and evaluation setup** ([ar5iv HTML](https://ar5iv.labs.arxiv.org/html/1803.09615)): implemented as a **RAMCloud transport, ~3,660 lines of C++, using DPDK kernel bypass with polling**; measured on a CloudLab testbed of **16 nodes (8 clients, 8 servers) on a single 10 Gbps Ethernet switch**, plus an Infiniband cluster with Mellanox ConnectX-2 NICs at 24 Gbps. Workloads **W1–W5** were derived from production traces: W1 Facebook memcached (>70% of bytes in messages <1 KB), W2 Google search, W3 aggregated Google datacenter traffic, W4 Facebook Hadoop, W5 a heavy-tailed web-search workload (>95% of bytes in messages >1 MB).

---

## 2. People

### 2.1 John Ousterhout (mini-bio)

- Born **15 October 1954** (Solano County, CA); **B.S. Physics, Yale, 1975**; **Ph.D. Computer Science, Carnegie Mellon, 1980** ([Wikipedia](https://en.wikipedia.org/wiki/John_Ousterhout)).
- Professor at **UC Berkeley (1980–1994)**, where he led the **Sprite** network operating system project, co-authored the first **log-structured file system** work with Mendel Rosenblum, created the **Magic** VLSI CAD tool, and created **Tcl** and the **Tk** toolkit ([Wikipedia](https://en.wikipedia.org/wiki/John_Ousterhout), [Tcler's Wiki](https://wiki.tcl-lang.org/page/John+Ousterhout), [Stanford homepage](https://web.stanford.edu/~ouster/cgi-bin/home.php)).
- Industry: joined **Sun Microsystems Labs in 1994** for Tcl development; co-founded **Scriptics in January 1998** (renamed Ajuba Solutions, acquired by Interwoven October 2000); founded **Electric Cloud** with John Graham-Cumming ([Wikipedia](https://en.wikipedia.org/wiki/John_Ousterhout)).
- Joined **Stanford in 2008**; led **RAMCloud** ([RAMCloud wiki](https://ramcloud.atlassian.net/wiki/spaces/RAM/overview)); co-inventor of the **Raft consensus algorithm** with his PhD student **Diego Ongaro** — the Raft paper "In Search of an Understandable Consensus Algorithm" (Ongaro & Ousterhout) appeared at USENIX ATC 2014 ([raft.github.io](https://raft.github.io/), [USENIX ATC14](https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro)); Ongaro is listed among the RAMCloud collaborators ([RAMCloud search summary](https://ramcloud.atlassian.net/wiki/spaces/RAM/overview)).
- Author of **"A Philosophy of Software Design" (2018)** ([Wikipedia](https://en.wikipedia.org/wiki/John_Ousterhout), [SE Radio episode 520, July 2022](https://se-radio.net/2022/07/episode-520-john-ousterhout-on-a-philosophy-of-software-design/)).
- Awards: **Grace Murray Hopper Award (1987)**, **ACM Fellow (1994)**, **ACM Software System Award (1997)**, **National Academy of Engineering (2001)** ([Wikipedia](https://en.wikipedia.org/wiki/John_Ousterhout)).
- Current status: his Stanford homepage says *"My current research is focused primarily around the Homa transport protocol"*, that he is building the Linux kernel driver, that he has **retired from regular teaching** (last course Spring 2024) and is **no longer accepting research students** ([Stanford homepage](https://web.stanford.edu/~ouster/cgi-bin/home.php)).

### 2.2 The co-authors

- **Behnam Montazeri** — lead student author of the SIGCOMM 2018 paper at Stanford; now at **Google** ([ResearchGate profile "Google Inc."](https://www.researchgate.net/scientific-contributions/Behnam-Montazeri-2008743356), [Google Scholar](https://scholar.google.com/citations?user=vIqv2F0AAAAJ&hl=en), [dblp](https://dblp.org/pid/168/3489.html)).
- **Yilong Li** — Stanford PhD student on Homa and RAMCloud ([Platform Lab student page](https://platformlab.stanford.edu/student-yilong-li.php), [Google Scholar](https://scholar.google.com/citations?user=321lunwAAAAJ&hl=en)).
- **Mohammad Alizadeh** — professor at MIT CSAIL, congestion-control specialist (DCTCP, pFabric lineage); hosts the Homa paper on his page ([MIT CSAIL page hosting the paper](https://people.csail.mit.edu/alizadeh/papers/homa-sigcomm18.pdf)).

### 2.3 Who works on the kernel module today

- The Linux kernel module ([PlatformLab/HomaModule on GitHub](https://github.com/PlatformLab/HomaModule)) is written and maintained essentially single-handedly by **John Ousterhout** — the README speaks in the first person ("Please contact me if you have any problems using this repo") ([HomaModule README](https://github.com/PlatformLab/HomaModule)). Phoronix describes the patches as posted by "developers from Stanford and MIT who have been developing Homa since 2019" ([Phoronix, 16 Oct 2025](https://www.phoronix.com/news/Linux-Homa-2025-Patches)).
- On the netdev list, the November 2022 "Upstream Homa?" thread drew responses from kernel developers including **Stephen Hemminger and Andrew Lunn** ([lore.kernel.org thread](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/), [spinics mirror](https://www.spinics.net/lists/netdev/msg859492.html)).
- LWN's coverage of upstreaming was written by **Jonathan Corbet** ([LWN, 30 Dec 2024](https://lwn.net/Articles/1003059/)) and the netdev 0x16 talk coverage by **Jake Edge** ([LWN, 9 Nov 2022](https://lwn.net/Articles/914030/)).

### 2.4 Industry collaborators / interest

- **Missing Link Electronics (MLE)**, an FPGA IP-core and design-services company, has been presenting Homa work (TCP/Homa coexistence, hardware acceleration, Homa over Time-Sensitive Networking) at SNIA's Storage Developer Conference in **2023, 2024, and upcoming SDC 2026 (28–30 Sept 2026, Santa Clara)**; they cite datacenter/AI-cluster, storage, zone-based automotive, industrial automation, robotics and aerospace use cases ([MLE news page](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/)).
- **Red Hat Enterprise Linux 8 and 9.5 backports** of the Homa module were released in **March 2026** per the HomaModule README news ([HomaModule README](https://github.com/PlatformLab/HomaModule)) — indicating someone is packaging Homa for RHEL kernels (see Gaps: who did the backports is not stated).
- Homa was assigned **official IANA IP protocol number 146 in October 2024** ([HomaModule README](https://github.com/PlatformLab/HomaModule), [IANA protocol numbers registry](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml)).
- No hyperscaler has publicly announced a Homa deployment (see Gaps). The 2024 Hacker News thread situates Homa alongside industry alternatives being built instead: AWS's SRD, the Ultra Ethernet Consortium's UEC transport with multipath packet-spraying, RoCE deployments, etc. ([HN discussion, Nov 2024](https://news.ycombinator.com/item?id=42168997)).

---

## 3. Aims — why replace TCP, and the pushback

### 3.1 The claims: "It's Time to Replace TCP in the Datacenter"

Ousterhout's position paper was posted to arXiv on **3 October 2022** (v1) and revised ([arXiv:2210.00714](https://arxiv.org/abs/2210.00714), [v1](https://arxiv.org/abs/2210.00714v1), [v2](https://arxiv.org/abs/2210.00714v2)); he delivered it as the keynote at **Netdev 0x16** ([session page](https://netdevconf.info/0x16/sessions/keynote/keynote-ousterhout.html), [keynote slides PDF](https://netdevconf.info/0x16/pub/slides/keynote/netdev0x16-keynote.pdf)). Its thesis: "every significant element of TCP, from its stream orientation to its expectation of in-order packet delivery, is wrong for the datacenter", and TCP's problems are "too fundamental and interrelated to be fixed" ([arXiv:2210.00714](https://arxiv.org/abs/2210.00714)).

The five specific TCP indictments (as presented at Netdev 0x16 and summarized by LWN, [part 1](https://lwn.net/Articles/913260/) and [part 2](https://lwn.net/Articles/914030/)):
1. **Stream orientation** — datacenter apps exchange discrete messages (RPCs), not byte streams; streams cause head-of-line blocking and prevent NIC-level message dispatch and thread load-balancing.
2. **Connection orientation** — per-connection state is expensive when an app talks to thousands of peers; Homa is connectionless and "uses ~1 socket per application, whereas TCP requires a separate socket for each peer" ([Phoronix quoting the patch cover letter](https://www.phoronix.com/news/Linux-Homa-2025-Patches)).
3. **Bandwidth-fair scheduling** — TCP shares bandwidth "fairly", which is exactly wrong for tail latency; SRPT (run-to-completion, shortest-first) is better for short messages.
4. **Sender-driven, buffer-occupancy congestion control** — TCP needs buffers to fill before it reacts; Homa's receiver-driven grants plus switch priority queues react without building queues.
5. **In-order delivery expectation** — forces flow-consistent (per-flow ECMP) routing, causing core-link hot spots; Homa tolerates out-of-order packets, enabling per-packet spraying.

Performance claims at the keynote: **3–7x** better short-message latency at P50 and **19–72x** at P99 versus TCP (Linux kernel module measurements) ([LWN part 2](https://lwn.net/Articles/914030/)); the upstream patch cover letters claim "**10–100x reductions in tail latency for short messages relative to TCP**" ([LWN, Nov 2024](https://lwn.net/Articles/997858/), [Phoronix](https://www.phoronix.com/news/Linux-Homa-2025-Patches)). The earlier USENIX ATC '21 paper **"A Linux Kernel Implementation of the Homa Transport Protocol"** had already shown the kernel implementation outperforming TCP and DCTCP on the SIGCOMM workloads, while documenting Linux-side bottlenecks: load-balancing overhead across cores, a pacer thread that "cannot keep up at high bandwidth", and kernel design decisions optimized for TCP ([USENIX ATC '21 page](https://www.usenix.org/conference/atc21/presentation/ousterhout), [paper PDF](https://www.usenix.org/system/files/atc21-ousterhout.pdf), [micahlerner.com Part II](https://www.micahlerner.com/2021/08/29/a-linux-kernel-implementation-of-the-homa-transport-protocol.html), [talk video](https://www.youtube.com/watch?v=qu5WDcZRveo)). Notably, the paper argues small-message throughput is capped by per-packet software overheads and suggests transports may ultimately need to move to userspace or the NIC ([micahlerner.com Part II](https://www.micahlerner.com/2021/08/29/a-linux-kernel-implementation-of-the-homa-transport-protocol.html)).

### 3.2 The pushback (presented fairly)

**Ivan Pepelnjak (ipSpace.net, 10 January 2023)** — ["Is It Time to Replace TCP in Data Centers?"](https://blog.ipspace.net/2023/01/data-center-tcp-replacement/) is the most cited direct rebuttal. His objections:
- The measurement setup is unrealistic: multiplexing many parallel messages onto "a single TCP session" manufactures head-of-line blocking that "does not correspond to how TCP is used in most application stacks".
- The paper ignores that receivers often cannot safely process messages out of order.
- It ignores prior art: "What's wrong with Infiniband? What's wrong with RoCE?... several existing message-oriented transport protocols."
- Some TCP claims are wrong: "IP never guaranteed in-order delivery, so TCP never assumed in-order packet arrival", and bandwidth sharing "is just a side-effect of running many independent TCP sessions", not a designed-in fairness scheduler.
- He doubts the core-congestion hypothesis: with server links an order of magnitude slower than core links, "it takes significant bad luck to get core congestion solely based on flow-consistent routing".
- Verdict: he "can't take Homa seriously based on the arguments made in this position paper" — while explicitly acknowledging the implementation work is solid.

**George Michaelson (APNIC blog, 22 May 2023)** — ["Death of TCP predicted: News at 11"](https://blog.apnic.net/2023/05/22/death-of-tcp-predicted-news-at-11/):
- Historical precedent is against special-purpose local protocols (e.g. DEC's LAT), which died as networks became routed and complex.
- Modern datacenters are not flat L2 fabrics but "large, complex and often internally-routed constructs" (BGP in the DC), weakening Homa's assumptions.
- Modern congestion-control advances (e.g. BBR) can "rectify perceived mismatches for the DC context" without protocol replacement.
- Deployment gravity: quoting Mike Lesk, it's "harder to push matter aside than fill a vacuum"; even QUIC's success was only partial. Prediction: incremental adjustment, not replacement.

**Hacker News** — the paper was discussed repeatedly: an [October 2022 thread](https://news.ycombinator.com/item?id=33088928) and a large [November 2024 thread (156+ comments)](https://news.ycombinator.com/item?id=42168997). Recurring critic points: standardization/ecosystem cost across "firewalls, switches, routers, load balancers, traffic shapers, proxies"; "only 1% of customers have this problem, and only 1% of those can invest in solving it"; existing alternatives (RDMA/RoCE, InfiniBand, SCTP, QUIC, DCTCP per [RFC 8257](https://www.rfc-editor.org/rfc/rfc8257)) already cover much of the ground; TCP tuning plus modern NIC offloads is usually sufficient; Homa requires application rewrites (message API); and a claimed DoS risk via receiver-grant manipulation. Supporter points: receiver-driven control could largely eliminate core congestion; industry is already moving this direction anyway (AWS SRD since ~2014 EBS research, Ultra Ethernet Consortium's UEC transport with packet spraying for up to 1M endpoints) — which cuts both ways ([HN Nov 2024](https://news.ycombinator.com/item?id=42168997)).

- **No formal academic rebuttal paper was found** (see Gaps); the pushback lives in blogs, mailing lists, conference Q&A ([LWN's account of Netdev 0x16 Q&A](https://lwn.net/Articles/914030/) records questions about UDP, InfiniBand/RDMA, gaming of SRPT by non-cooperative flows, and WAN unsuitability), and news aggregators.

---

## 4. Use cases once in the Linux kernel

### 4.1 Who benefits

- **RPC-heavy datacenter workloads**: Homa targets "data center environments" with "large numbers of small messages between many locally connected hosts"; biggest wins are for **mixed workloads of short and long messages under high load** ([LWN, Dec 2024](https://lwn.net/Articles/1003059/), [LWN, Nov 2024](https://lwn.net/Articles/997858/)). Microservice fan-out patterns (memcached-style, search-style — literally workloads W1–W3 of the paper) are the canonical beneficiaries ([ar5iv](https://ar5iv.labs.arxiv.org/html/1803.09615)).
- **Storage systems**: the RAMCloud heritage (µs-scale storage RPC) is the founding use case ([HotOS 2011](https://www.usenix.org/conference/hotosxiii/its-time-low-latency)); MLE presents Homa at the *Storage* Developer Conference, plus AI clusters at Terabit line rates, automotive zonal networks, industrial automation, robotics, aerospace ([MLE](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/)).
- **Coexistence with TCP** is a design goal of the ongoing work: a new **homa_qdisc queuing discipline (January 2026)** improves performance when Homa and TCP run on the same host/network ([HomaModule README](https://github.com/PlatformLab/HomaModule)); MLE demonstrated Homa and TCP "co-exist in the same network peacefully" ([MLE](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/)).
- Not a WAN/Internet protocol: Ousterhout himself scopes Homa to the datacenter; WAN suitability was raised as a limitation at Netdev 0x16 ([LWN part 2](https://lwn.net/Articles/914030/)).

### 4.2 What applications must change

- Homa is **message-oriented and connectionless**, exposing RPCs rather than byte streams, so applications cannot just switch a socket type: code written to the streaming sockets API must be adapted to message/RPC semantics ([LWN, Dec 2024](https://lwn.net/Articles/1003059/) — noting the Unix socket interface "is not a perfect fit for Homa"; [HN critics on rewrite cost](https://news.ycombinator.com/item?id=42168997)).
- The strategic answer is to hide Homa **inside RPC frameworks** so most applications change nothing: this is the explicit purpose of the gRPC work below ([Netdev 0x16 keynote slides](https://netdevconf.info/0x16/pub/slides/keynote/netdev0x16-keynote.pdf), [LWN part 2](https://lwn.net/Articles/914030/)).

### 4.3 gRPC integration

- **[PlatformLab/grpc_homa](https://github.com/PlatformLab/grpc_homa)** lets gRPC applications use Homa instead of TCP by swapping channel credentials. **C++ support is functional (without encryption); Java support was partially implemented.** Development was **suspended in late 2023**; head is based on **gRPC v1.57.0** ([grpc_homa README](https://github.com/PlatformLab/grpc_homa)).
- Measured result: short RPCs complete **~40% faster with Homa than TCP (~55 µs round trip vs ~90 µs)** ([grpc_homa README](https://github.com/PlatformLab/grpc_homa)); Ousterhout gave a talk "Integrating gRPC with the Homa Transport Protocol" ([YouTube](https://www.youtube.com/watch?v=xQQT8YUvWg8)). Notably, much of gRPC's own overhead dominates, which limits Homa's visible benefit at the gRPC level ([Netdev 0x16 slides](https://netdevconf.info/0x16/pub/slides/keynote/netdev0x16-keynote.pdf)).

### 4.4 Kernel upstreaming status (the gate for all of this)

- **November 2022**: Ousterhout opens the ["Upstream Homa?"](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/) netdev thread (10 Nov 2022) after Netdev attendees encouraged him; Homa was then ~13K lines, too big for one patch set ([lore thread](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/), [spinics mirror](https://www.spinics.net/lists/netdev/msg859492.html)).
- **October–November 2024**: upstreaming formally begins; a **12-patch series of ~7,500 lines** ("the bare minimum functionality capable of actually executing remote procedure calls") posted 11 Nov 2024; initial performance "about the same as TCP" by design, with performance patches to follow ([LWN "Begin upstreaming Homa"](https://lwn.net/Articles/997858/), [v2 series on linux-api](https://www.spinics.net/lists/linux-api/msg59671.html)).
- **December 2024**: LWN's Jonathan Corbet analyzes the protocol and observes four postings had produced protocol discussion but no detailed code review — "initial merge of Homa is not imminent" ([LWN, 30 Dec 2024](https://lwn.net/Articles/1003059/)).
- **July 2025**: LWN notes Homa "remains unmerged after 11 revisions posted over nine months" ([LWN "QUIC for the kernel", 22 Jul 2025](https://lwn.net/Articles/1029851/)).
- **October 2025**: **v16** of the first series posted (adds a HOMAIOCINFO ioctl) ([Phoronix, 16 Oct 2025](https://www.phoronix.com/news/Linux-Homa-2025-Patches)).
- **As of this research (23 July 2026)**: no source found stating Homa has been merged into mainline; the out-of-tree module remains the production vehicle, tracking Linux **6.17.8 (Nov 2025)**, with RHEL backports in March 2026 ([HomaModule README](https://github.com/PlatformLab/HomaModule)). See Gaps.

---

## 5. Timeline (2011/2014 → 2026)

| Date | Event | Source |
|---|---|---|
| May 2011 | HotOS XIII: "It's Time for Low Latency" — RAMCloud team argues for 5–10 µs datacenter RPC | [USENIX](https://www.usenix.org/conference/hotosxiii/its-time-low-latency) |
| 2014 | Raft paper (Ongaro & Ousterhout) at USENIX ATC '14 — same lab, same era; RAMCloud project in full swing | [USENIX ATC14](https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro) |
| Sept 2015 | "The RAMCloud Storage System" in ACM TOCS | [ACM DL](https://dl.acm.org/doi/10.1145/2806887) |
| 26 Mar 2018 | Homa complete version v1 on arXiv | [arXiv:1803.09615](https://arxiv.org/abs/1803.09615) |
| Aug 2018 | Homa published at ACM SIGCOMM 2018 | [ACM DL](https://dl.acm.org/doi/10.1145/3230543.3230564) |
| 2019 | Work begins on the Linux kernel implementation (HomaModule) | [Phoronix](https://www.phoronix.com/news/Linux-Homa-2025-Patches), [GitHub](https://github.com/PlatformLab/HomaModule) |
| July 2021 | USENIX ATC '21: "A Linux Kernel Implementation of the Homa Transport Protocol" | [USENIX](https://www.usenix.org/conference/atc21/presentation/ousterhout) |
| 3 Oct 2022 | "It's Time to Replace TCP in the Datacenter" posted to arXiv | [arXiv v1](https://arxiv.org/abs/2210.00714v1) |
| Oct 2022 | Netdev 0x16 keynote of the same title; kernel module working on Linux 5.17/5.18; gRPC C++ working | [Netdev 0x16](https://netdevconf.info/0x16/sessions/keynote/keynote-ousterhout.html), [LWN](https://lwn.net/Articles/914030/) |
| 10 Nov 2022 | "Upstream Homa?" thread on netdev (~13K LoC at the time) | [lore.kernel.org](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/) |
| 10 Jan 2023 | Ivan Pepelnjak's ipSpace rebuttal | [ipSpace](https://blog.ipspace.net/2023/01/data-center-tcp-replacement/) |
| 22 May 2023 | APNIC blog rebuttal (George Michaelson) | [APNIC](https://blog.apnic.net/2023/05/22/death-of-tcp-predicted-news-at-11/) |
| 2023–2024 | MLE presents Homa/TCP coexistence + FPGA work at SNIA SDC 2023 and 2024 | [MLE](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/) |
| Late 2023 | grpc_homa development suspended (C++ functional, Java partial) | [grpc_homa README](https://github.com/PlatformLab/grpc_homa) |
| July 2024 | TCP-hijacking mode added to module for better TSO utilization | [HomaModule README](https://github.com/PlatformLab/HomaModule) |
| Oct 2024 | IANA assigns Homa IP protocol number **146**; upstreaming begins | [HomaModule README](https://github.com/PlatformLab/HomaModule), [IANA](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
| 11 Nov 2024 | 12-patch, ~7,500-line minimal series posted to netdev/linux-api | [LWN](https://lwn.net/Articles/997858/) |
| 30 Dec 2024 | LWN deep-dive: merge "not imminent" | [LWN](https://lwn.net/Articles/1003059/) |
| May 2025 | Major API refactor in module (private RPCs, memory caps) | [HomaModule README](https://github.com/PlatformLab/HomaModule) |
| 22 Jul 2025 | LWN: still unmerged after 11 revisions over 9 months | [LWN](https://lwn.net/Articles/1029851/) |
| 16 Oct 2025 | v16 patch series posted | [Phoronix](https://www.phoronix.com/news/Linux-Homa-2025-Patches) |
| Nov 2025 | Module tracks Linux 6.17.8 | [HomaModule README](https://github.com/PlatformLab/HomaModule) |
| Jan 2026 | homa_qdisc added for TCP coexistence | [HomaModule README](https://github.com/PlatformLab/HomaModule) |
| Mar 2026 | RHEL 8 / 9.5 backports released | [HomaModule README](https://github.com/PlatformLab/HomaModule) |
| 28–30 Sept 2026 | MLE to present "Real-Time Networking with Stanford's HOMA Protocol" at SDC 2026 (upcoming) | [MLE](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/) |

---

## 6. Gaps — things I could NOT verify or find

1. **Mainline merge status as of July 2026.** No source confirms Homa has (or has not) been merged into mainline Linux in 2026. Latest hard data: v16 under review [Oct 2025 (Phoronix)](https://www.phoronix.com/news/Linux-Homa-2025-Patches); the module README's continued out-of-tree milestones through [March 2026](https://github.com/PlatformLab/HomaModule) strongly imply it is still out of tree, but that is inference. lore.kernel.org blocked direct fetching (Anubis 403), so I could not check for v17+ series.
2. **Origin of the name "Homa".** Presumably the Persian mythical [Huma bird](https://en.wikipedia.org/wiki/Huma_bird) (lead author Behnam Montazeri is Iranian-named), but no authoritative source states this; the papers and wiki I could reach never explain the name.
3. **Homa Confluence wiki content** ([homa-transport.atlassian.net](https://homa-transport.atlassian.net/wiki/spaces/HOMA/overview)) could not be fetched (content truncated/empty via fetcher), so roadmap/collaborator details there are unverified.
4. **USENIX ATC '21 exact benchmark numbers** — the USENIX page returned HTTP 403 and the PDF wasn't parsed; I relied on [micahlerner.com's summary](https://www.micahlerner.com/2021/08/29/a-linux-kernel-implementation-of-the-homa-transport-protocol.html) and [LWN's talk coverage](https://lwn.net/Articles/914030/) (3–7x P50, 19–72x P99) rather than the paper's own tables.
5. **Who did the RHEL backports** (Red Hat itself, MLE, or Ousterhout) — README doesn't say.
6. **Named industry deployments** — no evidence of any production Homa deployment at a hyperscaler or elsewhere; interest is limited to MLE (FPGA/storage), RHEL backport availability, and conference/list discussion. Whether Behnam Montazeri's Google work relates to Homa-style transports (e.g. Falcon) is unverified — only his Google affiliation is documented.
7. **Formal academic rebuttal papers** to "It's Time to Replace TCP in the Datacenter" — none found; all substantive pushback located is in blogs ([ipSpace](https://blog.ipspace.net/2023/01/data-center-tcp-replacement/), [APNIC](https://blog.apnic.net/2023/05/22/death-of-tcp-predicted-news-at-11/)), [Hacker News](https://news.ycombinator.com/item?id=42168997), and conference Q&A.
8. **Whether a version of the TCP essay was republished** in CACM or ;login: — not found/checked successfully.
9. **Diego Ongaro's Raft PhD supervision** — asserted from the Raft paper authorship ([ATC14](https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro)) and RAMCloud collaborator listings; the Wikipedia bio page I fetched did not itself mention Raft/Ongaro.
10. **Exact date Homa research started inside RAMCloud (2014–2016 window)** — the first public artifact is the March 2018 arXiv posting; earlier internal start date not documented in reachable sources.
