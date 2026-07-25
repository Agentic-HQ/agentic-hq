# Research Notes: Corporate Funding Precedents for Linux Kernel Networking — and What Happens Without a Sponsor

**Research date:** 2026-07-23
**Purpose:** Feeds AHQ-192 analysis of why nobody is visibly funding Homa's upstreaming (v19, ~21 months in, sole author John Ousterhout, no corporate reviewers) despite plausible large savings for the best-placed adopters.
**Method:** WebSearch + WebFetch (28 calls). Every claim carries a clickable source link and a date. Items that could not be verified before the session's web-access budget ran out are listed in "Gaps" at the end.

---

## 1. Success precedents — who paid, and what made them pay

### 1.1 DCTCP — Microsoft Research + Stanford; drop-in congestion module

- DCTCP was published at [ACM SIGCOMM 2010 by Mohammad Alizadeh, Albert Greenberg, David A. Maltz, Jitendra Padhye, Parveen Patel, Balaji Prabhakar, Sudipta Sengupta, and Murari Sridharan](https://docs.kernel.org/networking/dctcp.html) — a Stanford + Microsoft Research collaboration (paper dated 2010; kernel doc current).
- It was merged in **Linux 3.18 (December 2014)** as a congestion-control algorithm: "[Linux 3.18 added the Data Center TCP (DCTCP) congestion control algorithm](https://kernelnewbies.org/Linux_3.18)".
- The key structural property: it lives entirely in [`net/ipv4/tcp_dctcp.c`](https://github.com/torvalds/linux/blob/master/net/ipv4/tcp_dctcp.c) as a **pluggable congestion-control module** behind the existing TCP socket API — zero application changes, selectable per-socket or via sysctl. The [IETF standardised it as RFC-track work with Microsoft co-authors](https://datatracker.ietf.org/doc/draft-ietf-tcpm-dctcp/10/) (draft series 2015–2017).
- Microsoft had already shipped DCTCP in Windows Server and ran it in Bing datacenters before/alongside the Linux merge — the sponsor was the primary production beneficiary (per the [SIGCOMM authorship and IETF draft affiliations](https://datatracker.ietf.org/doc/html/draft-ietf-tcpm-dctcp-01)).

### 1.2 BBR — Google; drop-in, sender-side-only, merged in weeks

- "[Google recently contributed BBR ('Bottleneck Bandwidth and RTT'), a new congestion control algorithm, to the Linux kernel TCP stack](https://lwn.net/Articles/701165/)" — LWN, September 2016. Patches posted by **Neal Cardwell (Google)** with signoffs including **Van Jacobson and Eric Dumazet** (both Google).
- Submitted and merged in **September–December 2016, shipping in Linux 4.9** ([LWN, Sept 2016](https://lwn.net/Articles/701165/); [GÉANT eduPERT knowledge base](https://wiki.geant.org/pages/releaseview.action?pageId=121340614)).
- Why it merged fast: (a) Google had **already deployed it in production** ("Google has been using BBR for some time, and is evidently happy with the results" — [LWN, Sept 2016](https://lwn.net/Articles/701165/)); (b) it is another **drop-in congestion module** — "BBR works fine when only one side of the connection is using it" ([LWN, Sept 2016](https://lwn.net/Articles/701165/)) — no API change, no peer coordination, no new protocol number; (c) the submitters **were** the TCP maintainers' colleagues — Google employs kernel TCP's most active maintainers (see 1.7). Quick-start docs live in [google/bbr on GitHub](https://github.com/google/bbr/blob/master/Documentation/bbr-quick-start.md).

### 1.3 MPTCP — a *decade* out-of-tree, merged only when three companies staffed it

- The first MPTCP Linux implementation was an **out-of-tree fork from ~2010–2011 by UCLouvain researchers**, serving as the IETF reference implementation ([multipath-tcp.org](https://www.multipath-tcp.org/); the fork is now archived: "[Deprecated. Out-of-tree Linux Kernel implementation of MultiPath TCP](https://github.com/multipath-tcp/mptcp)").
- Mainline code **first landed in Linux 5.6, March 2020** — roughly a decade later ("[Multipath TCP Support Is Working Its Way Upstream — First Bits Landing With Linux 5.6](https://www.phoronix.com/news/Linux-5.6-Starts-Multipath-TCP)", Phoronix, January 2020; "[MPTCP is supported in the official Linux kernel starting with version 5.6](https://www.mptcp.dev/faq.html)").
- The upstreaming push was **corporate-staffed**: "a bigger effort of upstreaming with Tessares, Intel, Oracle and some others", led by **Mat Martineau (Intel)** and **Matthieu Baerts (Tessares)** ([mptcp.dev FAQ](https://www.mptcp.dev/faq.html); [Baerts' IETF affiliation tessares.net](https://datatracker.ietf.org/person/matthieu.baerts@tessares.net); upstreaming talk slides: [Multipath TCP Upstreaming, 2020](https://www.slideshare.net/slideshow/multipath-tcp-upstreaming/232051502)).
- **Tessares** is a UCLouvain spin-off founded March 2015 by Olivier Bonaventure's lab specifically to commercialise MPTCP (hybrid-access broadband), i.e. a company whose *product* was the protocol ([Tessares company page](http://tessares.lademo.be/company/)).
- Demand-side pull existed too: **Apple has shipped MPTCP on iPhones since 2013 for Siri** ([mptcp-apps documentation, 2022](https://mptcp-apps.github.io/mptcp-doc/mptcp-linux.html); [Wikipedia: Multipath TCP](https://en.wikipedia.org/wiki/Multipath_TCP)).
- Lesson: even an IETF-standardised protocol with Apple-scale deployment took **~10 years and a dedicated multi-company engineering team** to get into mainline — and the out-of-tree fork carried real users the whole time.

### 1.4 io_uring — the "company employs the maintainer" model

- **Jens Axboe** is "the current Linux kernel maintainer of the block layer and other block devices" and the author of io_uring ([Wikipedia: Jens Axboe](https://en.wikipedia.org/wiki/Jens_Axboe)).
- Employment chain, per [Wikipedia](https://en.wikipedia.org/wiki/Jens_Axboe): Oracle → **Fusion-io (May 2010)** → announced January 24, 2014 he was "leaving Fusion-io after 3.5 years to **join Facebook**" (now Meta). His [LinkedIn confirms "Software Engineer at Meta"](https://www.linkedin.com/in/jens-axboe-60a11b1/) (checked 2026-07-23); [Phoronix coverage of his 2022 Kernel Recipes talk](https://www.phoronix.com/news/KR2022-IO_uring) likewise identifies him at Meta.
- io_uring was merged in **Linux 5.1 (2019)** (background knowledge; see Gaps — direct citation not fetched before budget ran out; his own [Kernel Recipes 2022 slide deck](https://kernel.dk/axboe-kr2022.pdf) covers the io_uring timeline).
- The model: Meta (like Google with Dumazet, Red Hat with Abeni) **pays the salary of the maintainer of infrastructure it depends on**, and the maintainer's upstream work is their day job.

### 1.5 eBPF / XDP / AF_XDP — a whole corporate consortium

- The **eBPF Foundation** was launched under the Linux Foundation in **August 2021** by "[Facebook (Meta), Google, Isovalent, Microsoft and Netflix](https://www.linuxfoundation.org/press/press-release/facebook-google-isovalent-microsoft-and-netflix-launch-ebpf-foundation-as-part-of-the-linux-foundation)". Platinum members today include CrowdStrike, Google, Huawei, Isovalent, Meta and Microsoft ([eBPF Foundation BSC page](https://ebpf.foundation/bsc/), checked 2026-07-23).
- Production pull: "Meta is using eBPF as the primary software-defined load balancer in its data centers, and Google is using Cilium to bring eBPF-based networking to GKE and Anthos" ([Isovalent Series B press release, September 2022](https://www.prnewswire.com/news-releases/isovalent-raises-40m-series-b-as-cilium-and-ebpf-transform-cloud-native-service-connectivity-and-security-301619134.html)).
- **Cisco paid over $600M for Isovalent** (announced December 2023; [ThreatX analysis](https://www.threatx.com/blog/cisco-acquires-isovalent-creator-of-ebpf-why-it-matters/)) — an entire acquisition premised on eBPF expertise.
- **AF_XDP** was merged in **Linux 4.18 (2018)**, built by **Björn Töpel and Magnus Karlsson of Intel** ([LWN: "Introducing AF_XDP support", January 2018](https://lwn.net/Articles/745934/); [LWN: "AF_XDP, zero-copy support", May 2018](https://lwn.net/Articles/754659/); [their LPC 2018 paper](http://oldvger.kernel.org/lpc_net2018_talks/lpc18_paper_af_xdp_perf-v2.pdf)). Intel's motive: sell NICs into DPDK-class workloads without leaving the kernel.

### 1.6 In-kernel QUIC — the current test case for "new transport, but with in-kernel consumers"

- **Xin Long** posted "[net: implement the QUIC protocol in linux kernel](https://lore.kernel.org/netdev/cover.1725935420.git.lucien.xin@gmail.com/)" in **September 2024** ([LWN coverage, Sept 2024](https://lwn.net/Articles/989623/)), after an earlier RFC "[In-kernel QUIC implementation with Userspace handshake](https://lwn.net/Articles/965134/)" (March 2024). Follow-ups: "[QUIC for the kernel](https://lwn.net/Articles/1029851/)" (LWN, July 2025) and "[net: introduce QUIC infrastructure and core subcomponents](https://lwn.net/Articles/1034269/)" (LWN, August 2025); a talk was accepted at [Netdev 0x1A, 2026](https://netdevconf.info/0x1A/sessions/talk/linux-quic-bringing-a-modern-secure-transport-into-the-kernel.html).
- Its stated justification is telling: not "datacenter apps should switch", but that **kernel subsystems (SMB and NFS) need QUIC** so they can operate over it "with minimal changes" ([patch cover letter, Sept 2024](https://lore.kernel.org/netdev/cover.1725935420.git.lucien.xin@gmail.com/)) — i.e., a new kernel transport is being sold on *in-kernel consumers*, not on applications adopting a new socket type. Even so, it has been under review for ~2 years and counting.

### 1.7 Kernel TCP itself is corporately maintained — by Google

- **Eric Dumazet is a Google Principal Engineer** ([LinkedIn](https://www.linkedin.com/in/eric-dumazet-ba252942/), checked 2026-07-23) and the dominant TCP-stack contributor/maintainer; he presented **BIG TCP** with Coco Li **@ Google** at [Netdev 0x15, July 2021](https://netdevconf.info/0x15/slides/35/BIG%20TCP.pdf) — a feature motivated by Google's own 100–400Gbit fleet needs ([Backend Engineering Show episode on BIG TCP and Google, 2022](https://creators.spotify.com/pod/profile/hnasr/episodes/Linux-Big-TCP-might-be-a-game-changer-for-Google-and-other-cloud-providers-e1j5vsr)).
- The netdev maintainer group as of 2024 (Kicinski, Abeni, Dumazet, plus new members Andrew Lunn and Simon Horman) is documented in Kicinski's "[netdev in 2024](https://people.kernel.org/kuba/netdev-in-2024)" retrospective (January 2025). (Kicinski's Meta employment and Abeni's Red Hat employment are common knowledge but were not re-verified — see Gaps.)

### 1.8 The extracted pattern — what predicts corporate kernel-networking investment

Across every success story, at least two of three conditions hold; Homa currently satisfies **none** visibly:

1. **Drop-in-ness**: the change hides behind an existing API (DCTCP, BBR = congestion modules; BIG TCP = transparent; AF_XDP = new API but for a small expert audience Intel itself served). Homa is a **new socket protocol with a message/RPC API** — Ousterhout himself identified "the huge number of applications that directly use TCP via the socket interface" as the adoption blocker ([LWN: "Moving past TCP in the data center, part 2", November 2022](https://lwn.net/Articles/914030/)).
2. **The sponsor is the primary production beneficiary and deploys first, upstreams second**: Microsoft/Bing (DCTCP), Google (BBR, BIG TCP), Apple+Tessares (MPTCP), Meta (io_uring, eBPF), Intel (AF_XDP), Oracle (RDS). Nobody has publicly claimed production Homa deployment — the [HomaModule README documents no production users](https://github.com/PlatformLab/HomaModule) (checked 2026-07-23).
3. **The maintainer is on a corporate payroll for exactly this work**: Dumazet/Google, Axboe/Meta, Martineau/Intel + Baerts/Tessares, Töpel & Karlsson/Intel. Homa's sole author is a Stanford professor with no announced corporate maintainer succession.

---

## 2. The graveyard — protocols that merged and went nowhere

### 2.1 DCCP: merged 2005, deleted 2025 — the canonical cautionary tale

- DCCP shipped in the kernel from the mid-2000s (2.6.x era; [kernel DCCP doc](https://docs.kernel.org/6.8/networking/dccp.html)) and was **removed in Linux 6.16** ("[Linux 6.16 Expected To Remove Datagram Congestion Control Protocol](https://www.phoronix.com/news/Linux-6.16-Net-Next-Drops-DCCP)", Phoronix, **15 April 2025**), deleting **~14,000 lines**.
- Verbatim reasons from the removal (as reported by [Phoronix, April 2025](https://www.phoronix.com/news/Linux-6.16-Net-Next-Drops-DCCP)):
  - "DCCP was orphaned in 2021" (commit 054c4610bd05), the last maintainer inactive for five years;
  - it became "**a playground for syzbot**", with most changes being syzbot-triggered bug fixes;
  - "**Maintaining DCCP for a decade without any real users has become a burden**";
  - only **one person** contacted netdev since the 2023 deprecation notice;
  - removal lets TCP "freely reorganize the layout of struct inet_connection_sock" to cut cachelines in the TCP fast path.
- This is the exact experience the current netdev maintainers carry into any review of a new, sponsor-less transport protocol: an unfunded merged protocol is a 20-year liability that ends up **taxing TCP itself**.

### 2.2 SCTP: 20+ years in-tree, still a telco niche

- SCTP has been in the kernel since the 2.5/2.6 era ([kernel SCTP doc](https://docs.kernel.org/networking/sctp.html)) yet its use is confined to telecom signalling — SS7 adaptation layers (M3UA/SUA) and the LTE S1 interface ([Red Hat Developer: "An easier way to go: SCTP over UDP in the Linux kernel", June 2021](https://developers.redhat.com/articles/2021/06/04/easier-way-go-sctp-over-udp-linux-kernel)).
- General-internet adoption was killed by middleboxes: "The filtering by middleboxes makes the addition of new protocols difficult" ([LWN: "Transport-level protocols in user space", 2016](https://lwn.net/Articles/691887/)); RFC 6951 UDP-encapsulation was a retrofitted workaround ([Red Hat Developer, June 2021](https://developers.redhat.com/articles/2021/06/04/easier-way-go-sctp-over-udp-linux-kernel)). (Datacenter-internal protocols like Homa dodge the middlebox problem but not the app-API problem.)

### 2.3 TIPC: one company's cluster protocol

- TIPC was "originally designed by Jon Maloy at Ericsson", open-sourced in 2000, mainlined **2006**, and used "in carrier grade cluster applications for many years within Ericsson" ([Linux Foundation TIPC wiki](https://wiki.linuxfoundation.org/networking/tipc); [OLS 2004 paper](https://www.landley.net/kdocs/ols/2004/ols2004v2-pages-61-70.pdf)). It survives, but has never spread meaningfully beyond its sponsor's niche.

### 2.4 RDS: Oracle-only, and a recurring CVE factory

- RDS (Oracle, merged **Linux 2.6.30, June 2009**) serves essentially one customer base — Oracle RAC clustering ([Wikipedia: Reliable Datagram Sockets](https://en.wikipedia.org/wiki/Reliable_Datagram_Sockets)).
- Its main visibility since has been vulnerabilities in code almost nobody runs but everybody compiles: **CVE-2010-3904** local privilege escalation ([Wikipedia](https://en.wikipedia.org/wiki/Reliable_Datagram_Sockets)), **CVE-2019-11815** use-after-free ([Trend Micro, May 2019](https://www.trendmicro.com/en_us/research/19/e/cve-2019-11815-a-cautionary-tale-about-cvss-scores.html)), **CVE-2024-23849** off-by-one ([writeup, 2024](https://windowsnews.ai/article/cve-2024-23849-linux-rds-kernel-off-by-one-dos-vulnerability-explained.402484)), **CVE-2026-43230** ([SentinelOne DB, 2026](https://www.sentinelone.com/vulnerability-database/cve-2026-43230/)), and **CVE-2026-43494 "PinTheft"** local root chaining RDS with io_uring ([TuxCare, 2026](https://tuxcare.com/blog/cve-pintheft/)). Hardening guides simply tell admins to blacklist the module ([DISA STIG for Oracle Linux](https://www.tenable.com/audits/items/DISA_STIG_Oracle_Linux_6_v1r17.audit:e823316bdaa03a12c9f629e16e495088)).
- Lesson maintained protocols with one user impose security cost on everyone — a rational reason for reviewer conservatism toward single-user transports.

### 2.5 Filesystem analogies: reiserfs and bcachefs — lone-author subsystems

- **reiserfs**: merged 2001 (kernel 2.4.1) via Hans Reiser's company Namesys; development stagnated after 2008 when Namesys folded; deprecated Linux 5.18 (May 2022); **deleted in Linux 6.13, removing 32.8k lines** ("[ReiserFS Has Been Deleted From The Linux Kernel](https://www.phoronix.com/news/ReiserFS-Deleted-Linux-6.13)", Phoronix, November 2024; [Wikipedia: ReiserFS](https://en.wikipedia.org/wiki/ReiserFS)). Even a *default SUSE filesystem* died in-tree once its (small corporate) sponsor vanished.
- **bcachefs** is the best precedent for "lone crowdfunded developer merges an 8K+++ line subsystem": Kent Overstreet funded development **via Patreon** ([his Patreon](https://www.patreon.com/bcachefs); [funding-situation update post, 2023](https://www.patreon.com/bcachefs/posts/your-irregular-89670830)), got bcachefs **merged in Linux 6.7** (merged October 2023, released January 2024; [HandWiki: Bcachefs](https://handwiki.org/wiki/Bcachefs)) — and then the single-maintainer model collapsed socially: Torvalds blocked 6.13 changes over a CoC dispute ([Phoronix, November 2024](https://www.phoronix.com/news/Bcachefs-Uncertain-Kernel-Issue); [The Register, November 2024](https://www.theregister.com/2024/11/22/bcachefs_linux/)), announced ejection in June 2025, and **all bcachefs code was removed from mainline starting 6.17** (September 2025; [Hacker News: "Bcachefs removed from the mainline kernel"](https://news.ycombinator.com/item?id=45423004)).
- Net: **"merged into mainline" ≠ adoption or permanence.** The kernel has now removed a transport protocol (DCCP), a former default filesystem (reiserfs), and a recently-merged lone-author subsystem (bcachefs) within ~12 months of each other (late 2024–2025). Reviewer skepticism toward Homa's bus-factor is empirically grounded, and the DCCP commit message is the maintainers saying so in their own words.

---

## 3. "Companies that wanted Homa could already be running it" — mainline is not the gate

- **Google**: its production kernel ("Prodkernel") consists of "**around 9000 patches on top of an older upstream Linux kernel**", rebased painfully every ~2 years; Project Icebreaker aims to get closer to mainline ([LWN: "Moving Google toward the mainline", October 2021](https://lwn.net/Articles/871195/)). A company carrying 9,000 out-of-tree patches does not need Homa in mainline to run Homa.
- **Meta**: runs a kernel team supporting "a fleet of hundreds of thousands of machines" and pursues upstream-first *by choice* to reduce internal churn — i.e., it demonstrably can and does carry non-mainline code between rebases ([Engineering at Meta: "Improving the Linux kernel with upstream contributions", October 2015](https://engineering.fb.com/2015/10/05/open-source/improving-the-linux-kernel-with-upstream-contributions/)).
- "Upstream first" policies (e.g. [ChromiumOS](https://www.chromium.org/chromium-os/chromiumos-design-docs/upstream-first/), [Android per Phoronix, September 2021](https://www.phoronix.com/news/Android-Linux-Upstream-First)) exist precisely *because* the default state of large fleets was heavy out-of-tree patching ([LWN: "Backports and long-term stable kernels", 2016](https://lwn.net/Articles/700530/)).
- **Homa is already available out-of-tree, packaged for enterprise kernels**: the [PlatformLab/HomaModule repo](https://github.com/PlatformLab/HomaModule) (checked 2026-07-23) reached "complete functionality for running real applications" by **August 2020**, tracks current kernels ("upgraded to Linux 6.17.8", November 2025), obtained an **official IANA IP protocol number (146) in October 2024**, and — critically — was **backported to Red Hat Enterprise Linux 8 and 9.5 in March 2026** (branches `rhel8`, `rhel9.5`).
- Implication for the analysis: for 5+ years, any hyperscaler that believed the eight-to-nine-figure savings case could have deployed the module on its own kernels — the way Google ran BBR and Microsoft ran DCTCP pre-merge. **The absence of any known production deployment is therefore a demand signal, not an artifact of upstream delay.** (No production users are documented in the [HomaModule README](https://github.com/PlatformLab/HomaModule).)

---

## 4. Where the datacenter-transport money actually went, 2023–2026

- **Ultra Ethernet Consortium (UEC)**: founded mid-2023 under the Linux Foundation by **AMD, Arista, Broadcom, Cisco, Eviden, HPE, Intel, Meta and Microsoft** ([Linux Foundation press release, July 2023](https://www.linuxfoundation.org/press/announcing-ultra-ethernet-consortium-uec); [UEC's own announcement](https://ultraethernet.org/leading-cloud-service-semiconductor-and-system-providers-unite-to-form-ultra-ethernet-consortium/)). The **UEC 1.0 specification landed June 2025** — 562 pages, with **Ultra Ethernet Transport (UET)** as its backbone ([Datacenter Dynamics, June 2025](https://www.datacenterdynamics.com/en/news/ultra-ethernet-consortium-launches-10-specification/)). Note the membership overlap: Meta and Microsoft — the most plausible Homa beneficiaries — put their transport-protocol engineering budget *here*, into an RDMA-adjacent hardware transport for AI/HPC.
- **Google's equivalent**: rather than a kernel RPC transport, Google contributed **Falcon**, its "reliable low-latency **hardware** transport", to the Open Compute Project at the 2023 OCP Summit, first shipping in the **Intel IPU E2000** ([Google Cloud blog, October 2023](https://cloud.google.com/blog/topics/systems/introducing-falcon-a-reliable-low-latency-hardware-transport); [OCP Falcon spec v1.0/1.1](https://www.opencompute.org/documents/falcon-spec-v1-1-pdf-1)).
- **Capex scale**: Dell'Oro forecasts **data-center switch spending in AI back-end networks to exceed $100B over 2025–2029** ([Dell'Oro press release, February 2025](https://www.delloro.com/news/data-center-switch-sales-in-ai-back-end-networks-to-exceed-100-b-over-the-next-five-years/)); by 3Q 2025 total Ethernet DC switch sales hit a record **>$8B per quarter**, with **Ethernet now over two-thirds of AI back-end switch sales** ([Dell'Oro, November 2025](https://www.delloro.com/news/ai-back-end-networks-continue-their-shift-to-ethernet-now-accounting-for-over-two-thirds-of-3q-2025-switch-sales-in-ai-clusters/)).
- **SmartNIC/DPU consolidation**: AMD bought Pensando for **$1.9B** (announced April 2022, closed May 2022; [AMD press release](https://ir.amd.com/news-events/press-releases/detail/1071/amd-expands-data-center-solutions-capabilities-with-acquisition-of-pensando); [SDxCentral analysis](https://www.sdxcentral.com/articles/analysis/why-amd-spent-1-9b-for-pensandos-dpu-biz/2022/04/)); Cisco bought Isovalent for **>$600M** ([ThreatX, 2024](https://www.threatx.com/blog/cisco-acquires-isovalent-creator-of-ebpf-why-it-matters/)); Marvell, Intel (IPU) and NVIDIA (BlueField) all shipped competing DPUs ([Network World, April 2022](https://www.networkworld.com/article/970912/amd-grabs-dpu-maker-pensando-for-a-cool-19b.html)).
- **Ousterhout himself points the same direction**: LWN reports his view that "the real future for Homa... may be inside the networking hardware itself" rather than in software Linux deployments ([LWN: "The Homa network protocol", December 30, 2024](https://lwn.net/Articles/1003059/)). Consistent with that, the only visible commercial Homa activity found is FPGA vendor **Missing Link Electronics presenting "Real-Time Networking with Stanford's HOMA Protocol" at Storage Developer Conference 2026** ([MLE news page, 2026](https://www.missinglinkelectronics.com/company/news/mle-presents-real-time-networking-with-stanfords-homa-protocol-at-storage-developers-conference-2026/)) — hardware interest, not kernel-upstreaming sponsorship.
- Argument this supports: the industry's 2023–2026 transport-innovation budget went to **hardware-offloaded, RDMA-class transports for AI clusters** (UET, Falcon, DPUs) — not to general-purpose kernel RPC transports requiring application rewrites.

---

## 5. Homa specifically — timeline, review state, and the funding vacuum

### 5.1 Verified upstreaming timeline

- **November 2022**: Ousterhout asks netdev "[Upstream Homa?](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/)" — Homa was ~13K lines, "likely too large for a single patch set". This followed his Netdev 0x16 talks ([LWN part 1, November 2022](https://lwn.net/Articles/913260/); [LWN part 2, November 2022](https://lwn.net/Articles/914030/)). The one thread reply verified (lore itself is Anubis-blocked; mirror used) was **Andrew Lunn's technical** response on ancillary data/zero-copy, November 13, 2022 ([spinics mirror](https://www.spinics.net/lists/netdev/msg859492.html)) — constructive, but no maintainer said "yes, we want this".
- **October–December 2024**: first real patch series, ~7,500–8,000 lines stripped down from ~22K, "functional but its performance is not very interesting (about the same as TCP)" ([LWN, November 11, 2024](https://lwn.net/Articles/997858/); [LWN, December 9, 2024](https://lwn.net/Articles/1001624/)). Corbet's assessment: "The initial merge of Homa is not imminent", and the four submissions to that date had "generated protocol discussions but lack detailed code review" ([LWN, December 30, 2024](https://lwn.net/Articles/1003059/)).
- **Patchwork (netdev/bpf project), checked 2026-07-23** ([patchwork query "Homa"](https://patchwork.kernel.org/project/netdevbpf/list/?state=*&q=Homa)): v13 RFC July 30, 2025 → v14/v15 August 18, 2025 → v16 October 15, 2025 ([Phoronix coverage, October 16, 2025](https://www.phoronix.com/news/Linux-Homa-2025-Patches)) → v17 March 16, 2026 → v18 April 10, 2026 → **v19 April 28, 2026, all 15 patches in state "Changes Requested"**. Submitter on every series: John Ousterhout, sole. That is **~21 months** from first submission (October 2024) to v19 with no series ever reaching "Accepted" — consistent with the caller's premise. (Per-patch Ack inspection not possible before budget cutoff — see Gaps.)
- The out-of-tree module meanwhile keeps advancing independently: `homa_qdisc` added January 2026, RHEL backports March 2026 ([HomaModule README](https://github.com/PlatformLab/HomaModule)).

### 5.2 Funding signals — what exists and what conspicuously doesn't

- The only funding attribution found: Homa "originates at Stanford University, **with support from a number of technology companies**" — unnamed ([LWN, December 30, 2024](https://lwn.net/Articles/1003059/)).
- The likely referent is the **Stanford Platform Lab** industrial-affiliate program (Ousterhout's lab), whose members have included **Cisco, Ericsson, Facebook, Google, Huawei, Samsung and VMware**, at **$500K/yr (premium) or $150K/yr (regular)** ([Platform Lab affiliates page](https://platformlab.stanford.edu/affiliate.php); [Equinix joining, 2016 press release](https://investor.equinix.com/news-events/press-releases/detail/389/equinix-joins-stanford-platform-lab-to-help-drive); [Stanford Daily on the program, December 2019](https://stanforddaily.com/2019/12/09/inside-the-program-that-partners-stanford-labs-with-private-companies/)). This is **research-affiliate money — generic lab sponsorship — not upstreaming/maintainership sponsorship**; none of these companies has assigned engineers to the patch series (every series is single-submitter, per [patchwork](https://patchwork.kernel.org/project/netdevbpf/list/?state=*&q=Homa)).
- **No evidence found** of: any company publicly offering to fund Homa upstreaming; any Linux Foundation project or consortium around Homa; any netdev message volunteering co-maintainership. (Searches conducted 2026-07-23; note this is absence of evidence — see Gaps.)
- Skepticism was present from day one in the community record: LWN commenters on the 2022 talks — "This sounds like a case where academics don't understand the current Linux TCP stack" (shemminger, a veteran networking developer) and "It's like nuclear fusion: it's always 10 years away... competition prevents cooperation" (marcH) ([LWN comments, November 2022](https://lwn.net/Articles/913260/)).
- Adoption-blocking structural facts from Ousterhout's own account: Homa's message/RPC API is incompatible with the TCP socket interface used by "the huge number of applications" ([LWN part 2, November 2022](https://lwn.net/Articles/914030/)), and mainline success "depends on whether operators of large data centers decide that it is worth using" ([LWN, December 30, 2024](https://lwn.net/Articles/1003059/)) — the exact operators who instead joined UEC (§4).

### 5.3 Synthesis for the AHQ-192 argument

1. Every kernel-networking transport success had a **corporate sponsor who was also the first production user**, usually employing the upstream maintainer; Homa has neither (§1.8, §5.1–5.2).
2. The maintainers' new-protocol skepticism is **rationally priced from the graveyard**: DCCP ("a decade without any real users has become a burden", removed 6.16), SCTP (telco niche), TIPC (one vendor), RDS (one vendor + CVE stream), bcachefs (lone author, merged then removed) (§2).
3. Mainline is **not the gate** for the best-placed adopters: Google carries ~9,000 out-of-tree patches; Meta runs its own fleet kernel; Homa's module has been deployable since 2020 and RHEL-backported since March 2026. Non-adoption is a choice, not a queue (§3).
4. The 2023–2026 transport budget of exactly those adopters went to **UEC/UET, Falcon, and DPU hardware transports** for AI clusters — a competing answer to the same latency problem that comes with vendor ecosystems and no kernel-API migration (§4).

---

## Gaps — could not verify

Web access was cut off mid-session (monthly spend limit) after 28 search/fetch calls; the following remain unverified or unfetched:

1. **Full "Upstream Homa?" (Nov 2022) thread content** — lore.kernel.org blocked the fetch (Anubis anti-bot); only Andrew Lunn's technical reply was verified via the spinics mirror. Reported maintainer remarks that upstreaming was premature absent significant usage could not be confirmed verbatim.
2. **Per-patch Acked-by/Reviewed-by tags on Homa v1–v19** — the claim "no maintainer Acks" is supported only indirectly by every series sitting in patchwork state "Changes Requested" with none Accepted; individual patch mails were not inspected.
3. **Who reviewed which Homa revisions and their exact objections** (e.g. Paolo Abeni's or Jakub Kicinski's specific review comments) — searches did not surface quotable review text before cutoff.
4. **Ousterhout's own statements on whether anyone offered funding/help** — LWN comment threads (he posts as a commenter) and any interviews were not retrieved.
5. **Kernel DCTCP implementation authorship/affiliations** (believed: Daniel Borkmann, Florian Westphal, Glenn Judd/Morgan Stanley) — kernel docs list only the paper authors; commit authorship not fetched.
6. **Xin Long's employer** for the QUIC series (believed Red Hat, as long-time SCTP maintainer) — not verified.
7. **io_uring merge version/date** (Linux 5.1, 2019) and **DCCP merge version/date** (2.6.14, 2005) — stated from background knowledge; the linked sources discuss the subsystems but the exact merge-version citations were not fetched before cutoff.
8. **Jakub Kicinski's current Meta affiliation and Paolo Abeni's Red Hat affiliation** — common knowledge in the community, and Kicinski's ["netdev in 2023"](https://people.kernel.org/kuba/netdev-in-2023) stats post (reviewer/company breakdowns) could not be fetched.
9. **UEC "steering members" list as distinct from founding members** — sources verified the nine founding members; steering-committee composition not separately confirmed.
10. **Whether any hyperscaler runs Homa in production privately** — nothing found either way; the HomaModule README documents no production users, but private deployment cannot be excluded.
11. **The "eight-to-nine-figure annual savings" premise** — taken from the caller's framing; not evaluated or sourced in this research.
12. **Stanford Platform Lab's current (2026) member list and whether Platform Lab money specifically funds the Homa upstreaming effort** — affiliate page fetched earlier lists members without dates; the Lab-to-Homa funding link is inference from Ousterhout's lab affiliation.
