This task is at:

https://agentic-hq.atlassian.net/browse/AHQ-192

This Jira is going to end up being a Sub-Task of another Jira (which will provide context).  To start with though - I want the research to be done without any context as that will pollute the research output (this is an idea provided by Dex Horthey in his Research Plan Implement methodology).

The task here is to do a thorough research into the Homa Linux Module project.  

Details of the research required and the output docs are in this doc.

I want to understand everything about the HOMA project and especially details of its technical implementation and status.

This should include information about:
- the history of the project
- the people who thought it up and are working on it
- the main aims of the project
- the main use cases of the technology once it's built into the Linux kernel
I'm also particularly interested in alternatives to this technology to achieve the same aims and what kind of speeds you can get out of those technologies in terms of messages per second, and especially what the way you would measure success of this projectso, things like: what benchmarks would you run to test this system and to call it successful? What would you expect? Is it the number of messages per second across a large number of clients in a network within the same data centre? Is it successful when it gets high message counts when applied to very small messages? What's the current best-in-class method of doing this kind of messaging? Is it TCP/IP?

I'd like to know the status of the project. How far away from completion is it? How close to being included in the Linux kernel?

And finally, I'd like a deep dive on the actual implementation and how it has been architected, what the code looks like, what are the novel ideas here, and how do they work?  Also: how fast it goes - what it makes fast, what is makes slower/same.  What are the benchmarks and how are they run.  Note: I'm not a networking specialist, but I have a basic understanding of the network stack and how it works. A brief refresher on that as part of this would be useful to provide context.  I also know how to code in C (and any reader should be assumed to know C and other programming languages).

Finally - I know that Dave Farley did a lot of work on the London Multi Asset Exchange (LMAX) https://lmax-exchange.github.io/disruptor/disruptor.html which could do "25 million messages per second and latencies lower than 50 nanoseconds".  It did this by getting rid of concurrency in the core elements of the system and processing data single threaded (I think...?).  Is there any similar thinking that has been put into a module like Homa or other alternatives that involve really understanding the CPUs in the computers in use and avoiding multi-threading or working to maximise the benchmark results by working directly at the lowest levels with the CPU registries and architecture (probably would involve writing it for a particular CPU and then saying this system will run super fast if all your computers in your data centre use that CPU....?)

I'd like you to do this research on:
- The internet / blog posts etc.
- The Linux kernel forums and git repos (you can use my gh commad line to check out things to temp/AHQ-192 subdirectories in this current repo and they won't get committed)
- If you think Perplexity AI can help: create a question in supporting-docs/Perplexity-q-and-a.md and I'll get it answered in the placeholder.
- Any other source you think could be useful.

I'd like two documents produced please:

02-homa-detailed-research-document.md - a detailed document containing all the research results.
03-homa-summary-reserach-documents.md - a document still with the main sections - but a TLDR section at the top with the main findings, and then each section is just a paragraph or two and points to the relevant sections in the main detailed doc if I want to dive deeper.

NOTE: I'll probably just read the 03 doc, but the AI that does work based on this research will read the whole doc.

Please:
- Write your research findings in supporting-docs/temp-research-notes.md - as you go.  Then you won't lose anything you auto compact suddenly.  Once the reserach is complete, write the 02 doc using that, then write 03 using that.
- Include all references to places you got info from as clickable links embedded.
- I'd like a nice mermaid diagram or two for the architecture bits in the 02 doc pls
- Any additional sections you think I would find fascinating as you write this: please add them :-)
- First, write Questions about this task in this doc, numbered, with recommended answers and I'll answer them in a placeholder you provide (you may want to understand what Homa actually is before asking the questions...?)

---

## Additional section proposal (from Claude, 2026-07-23): "Mechanical sympathy — LMAX-style design in Homa and its alternatives"

Agreed addition in response to the LMAX/Disruptor paragraph above. The 02 doc will include a dedicated section covering:

1. **LMAX Disruptor primer + calibration.** What the Disruptor actually is (single-writer ring buffer, no locks, cache-line padding, memory barriers, busy-spin waiting — the design Martin Thompson coined "mechanical sympathy" for, with Dave Farley on the LMAX team). Key calibration: its 25M msgs/sec and sub-50ns latencies are *inter-thread* messaging inside one process on one box — everything at memory speed. Across a datacenter network there's a physics-and-hardware floor (~1–2µs one-way even for the best RDMA/kernel-bypass NICs; kernel TCP more like 15–30µs RTT). So the transferable thing is the *philosophy* (kill contention, own the core, cache-friendly layouts, single-writer), not the numbers.

2. **Where Homa is — and isn't — mechanically sympathetic.** Homa is a fascinating partial counter-example: as a kernel-resident, multi-core module it *must* share state across cores, and Ousterhout's ATC'21 paper quantifies exactly what that costs — the protocol was never the bottleneck; the multi-core software overheads were (spreading packets across cores via RSS/GRO/SoftIRQ, cache misses, thread wakeups on busy cores). Covers Homa's mitigations (dedicated pacer thread, sk_buff/frag management, batching) and their limits, from the actual code.

3. **The run-to-completion school — LMAX thinking applied to network RPC.** eRPC (one thread per core, zero fast-path locks, per-core state, ~10M small RPCs/sec *per core*, ~2µs median RTT), Seastar/ScyllaDB (shared-nothing, one shard per core), DPDK poll-mode (dedicated busy-polling cores, no interrupts, cache-aligned rings), Google Snap (engines pinned to cores), Shenango/Caladan (microsecond-scale core reallocation), and io_uring (literally Disruptor-shaped: single-producer ring buffers with memory barriers between user and kernel).

4. **"Buy this specific hardware and it's fast."** The industry mostly did NOT go CPU-model-specific; production code is microarchitecture-*aware* (cache-line padding, NUMA pinning, Intel DDIO) rather than compiled for one CPU. But the "homogeneous special hardware" strategy is real one level down — at the NIC: AWS Nitro cards running SRD, Google's Falcon going into hardware, Nvidia BlueField DPUs offloading the transport entirely.

5. **Homa with vs without mechanical sympathy — a direct comparison.** The original Stanford implementation ([PlatformLab/Homa](https://github.com/PlatformLab/Homa)) was a user-space, DPDK-based transport before the kernel module existed — so we can compare the same protocol built with run-to-completion freedom vs built under kernel constraints.

---

Additional Section Proposal By Steve

I don't know what P99 and other terms means - please put a Terms Explained section at the top with a table with rows for each terms like this.  No need to explain basic things like TCP/IP (I know them) but anything more in-depth related to this tech or networking - please include.


## Questions (from Claude, 2026-07-23)

Context for these questions: Homa is a datacenter transport protocol designed by John Ousterhout's group at Stanford (SIGCOMM 2018 paper, then a Linux kernel module implementation — [PlatformLab/HomaModule](https://github.com/PlatformLab/HomaModule), ~13K lines of C). Upstreaming into the mainline kernel [began in October 2024](https://lwn.net/Articles/997858/) and is still in progress in stages, so "status" is a moving target. That shapes several questions below.

### Q1. Which alternative technologies should the comparison cover?

The realistic candidate list: (a) TCP as-is (the incumbent baseline), (b) datacenter-tuned TCP (DCTCP, BBR), (c) RDMA / RoCEv2 / InfiniBand, (d) kernel-bypass user-space stacks (DPDK-based, e.g. eRPC, which is the msg/sec record-holder territory), (e) Google's production stack (Snap/Pony Express, Swift, Falcon), (f) QUIC, (g) research-only peers (NDP, pHost, dcPIM, SIRD).

**Recommended answer:** Cover (a)–(e) properly with messages/sec and tail-latency numbers where published; give (f) a paragraph (it's the wrong tool for this job and I'll say why); mention (g) briefly as "the research landscape Homa sits in". This keeps the doc focused on things you could actually deploy.

**Answer:** Agree

### Q2. How deep should the code analysis go — and what gets checked out?

**Recommended answer:** Shallow-clone `PlatformLab/HomaModule` into `temp/AHQ-192/HomaModule` and read the actual source (it's only ~13K lines — very tractable). For the kernel side, do NOT clone the Linux tree (huge); instead read the upstream patch series and review discussion on lore.kernel.org/netdev via the web. Deep-dive the core files (`homa_incoming.c`, `homa_outgoing.c`, `homa_grant.c`, pacer, skb management) and describe the architecture from the real code, not just from papers.

**Answer:** Agree

### Q3. Should I attempt to build or run anything?

Building/loading the module requires a Linux kernel dev environment; this machine is macOS. The benchmark tools (`cp_node`, `cperf` scripts) need a multi-node Linux cluster to produce meaningful numbers.

**Recommended answer:** No builds, no runs — documentation only. But include a practical "how you would run the benchmarks" section (exact tools, workloads W1–W5, metrics) so a future task could reproduce them on real Linux hosts.

**Answer:** Agree

### Q4. Perplexity — when should I use it?

**Recommended answer:** Only if gaps remain after web + repo research — most likely candidates are "current upstreaming status as of July 2026" (netdev list traffic is fresher than blog posts) and "real-world adoption outside Stanford". If gaps exist I'll write 1–3 tightly-scoped questions into `supporting-docs/Perplexity-q-and-a.md` with answer placeholders and pause there.

**Answer:** Agree

### Q5. How long should the 02 (detailed) doc be?

**Recommended answer:** No hard cap — completeness wins since an AI is the main reader — but structured so sections are independently skimmable. My guess at natural size is roughly 8–15K words plus code excerpts and 2–3 mermaid diagrams. The 03 doc stays at 2–3 pages max.

**Answer:** Agree

### Q6. Status claims: date-stamping and re-checking

Homa's upstream status changes month to month (e.g. IANA protocol number 146 assigned Oct 2024; a new `homa_qdisc` appeared Jan 2026). Anything I write about "how close to mainline" will rot.

**Recommended answer:** Date-stamp every status claim ("as of 2026-07-23"), and include a short "How to re-check current status" section (links to the netdev patch series, LWN, and the repo's news file) so the docs stay useful after they stale.

**Answer:** Agree

### Q7. Extra sections I think you'd find fascinating — pre-approval

Candidates: (a) the "It's Time to Replace TCP in the Datacenter" paper and the public pushback/rebuttals it drew; (b) John Ousterhout mini-bio and the RAMCloud lineage that led to Homa (he's also the Tcl and Raft-supervision and *A Philosophy of Software Design* guy); (c) the sociology of getting a new protocol into the Linux kernel — what the netdev maintainers pushed back on and how the patch series evolved; (d) a "network stack refresher" sidebar early in the doc (you asked for this one already).

**Recommended answer:** All four — (c) in particular is genuinely instructive about why upstreaming takes years.

**Answer:** Agree

### Q8. Output file name — typo check

The prompt names the summary doc `03-homa-summary-reserach-documents.md` (typo "reserach", plural "documents").

**Recommended answer:** Use the corrected `03-homa-summary-research-document.md`.

**Answer:** Agree

### Q9. Confirm locations

**Recommended answer:** All outputs live in `docs/jira-docs/AHQ-192/`: the 02 and 03 docs at the top level, working notes at `supporting-docs/temp-research-notes.md`, Perplexity Q&A (if needed) at `supporting-docs/Perplexity-q-and-a.md`. Code checkouts go to `temp/AHQ-192/` at the repo root (gitignored). Note this folder is destined for a public repo, so the docs will contain nothing personal — just technical content and public links.

**Answer:** Agree
