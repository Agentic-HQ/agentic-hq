# Homa Transport Protocol — Linux Kernel Upstreaming Status (as of 2026-07-23)

Research notes compiled 2026-07-23. Primary sources: [Patchwork (netdevbpf project)](https://patchwork.kernel.org/project/netdevbpf/list/?q=homa&state=*&archive=both), lore.kernel.org (links below; note lore's Anubis bot-protection blocks automated fetches but the links work in a normal browser), [PlatformLab/HomaModule](https://github.com/PlatformLab/HomaModule), [LWN.net](https://lwn.net/), [kernel.org releases](https://www.kernel.org/releases.json), the [GitHub mirror of mainline](https://github.com/torvalds/linux), and the [torvalds/linux GitHub contents API](https://api.github.com/repos/torvalds/linux/contents/net/homa).

---

## 0. Executive summary

- **Nothing has been merged.** As of 2026-07-23 there is no `net/homa` in mainline, net-next, or linux-next, and no HOMA entry in MAINTAINERS (verification details in §2).
- The first-series submission ("Begin upstreaming Homa transport protocol") has gone through **19 versions** between 2024-10-28 (v1) and 2026-04-28 (v19). All 19 are by John Ousterhout (`ouster@cs.stanford.edu`). The latest, [v19](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/), sits in Patchwork state **"changes-requested"** ([Patchwork series 1087148](https://patchwork.kernel.org/project/netdevbpf/list/?series=1087148&state=*)).
- Review has been slow and stop-start: substantive human review rounds happened at v1–v6 (Oct 2024–Feb 2025), v9 (Jun 2025), v15 (Aug–Sep 2025, the deepest round, mostly Paolo Abeni), and v17–v19 (Mar–Apr 2026, now including netdev's **AI-generated reviews**). Long silences in between; Ousterhout publicly asked on 2025-08-22 whether the series was ["stuck in limbo"](https://lore.kernel.org/netdev/CAGXJAmywHL=y1pqgMsBwFttdiMP-hVVNPtfPcSr4Nn8Jcuaj5Q@mail.gmail.com/).
- The out-of-tree module remains very active (commits through **2026-07-02**, [commit list](https://github.com/PlatformLab/HomaModule/commits/main)); late-June 2026 commits fix issues raised by the v19 AI review (e.g. ["Fix kernel stack info leak in homa_recvmsg"](https://github.com/PlatformLab/HomaModule/commits/main), 2026-06-29), which looks like preparation for a v20.

---

## 1. Timeline of the upstreaming patch series

### 1.1 Pre-history

- **2022-10 (netdev 0x16, Lisbon):** Ousterhout gives the keynote ["It's Time to Replace TCP in the Datacenter"](https://netdevconf.info/0x16/sessions/keynote/keynote-ousterhout.html) ([Pengutronix trip report, 2022-11-07](https://pengutronix.de/en/blog/2022-11-07-netdevconf-0x16.html)). LWN covered the argument in ["Moving past TCP in the data center, part 1"](https://lwn.net/Articles/913260/) (Nov 2022).
- **2022-11-10:** Ousterhout opens the ["Upstream Homa?"](https://lore.kernel.org/netdev/CAGXJAmxKM5a95uhBwbmm1Z427=bGyZhcCUopycLMTEfc4dHnew@mail.gmail.com/T/) thread on netdev, saying conference attendees encouraged him to upstream and noting Homa was ~13K lines, "far too large for a single patch set" (also indexed at [lists.openwall.net netdev 2022/11/10](https://lists.openwall.net/netdev/2022/11/10/)). Andrew Lunn replied on 2022-11-13 suggesting `msg_control` ancillary data instead of new APIs and urging that zero-copy/NIC offload be designed into the uAPI from the start ([spinics mirror msg859492](https://www.spinics.net/lists/netdev/msg859492.html)).
- **2024-10:** Per the [HomaModule README](https://github.com/PlatformLab/HomaModule/blob/main/README.md), "the process of upstreaming Homa into the Linux kernel has begun" and Homa gets **IANA IP protocol number 146** (verified in the [IANA protocol-numbers registry](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml): `146, Homa, [HomaModule][John_Ousterhout]`, checked 2026-07-23).

### 1.2 The "Begin upstreaming Homa transport protocol" series, v1–v19

All data below from the [Patchwork netdevbpf project](https://patchwork.kernel.org/project/netdevbpf/list/?q=homa&state=*&archive=both) (series metadata, cover-letter contents, and per-patch review comments retrieved via the Patchwork REST API on 2026-07-23). Change summaries are from the cumulative changelog in the [v19 cover letter](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/).

| Ver | Date | Patches | Cover letter (lore) | Patchwork | What changed / notes |
|----|------|---------|---------------------|-----------|----------------------|
| v1 | 2024-10-28 | 12 (7,519 ins.) | [v1 cover](https://lore.kernel.org/netdev/20241028213541.1529-1-ouster@cs.stanford.edu/) | [903993](https://patchwork.kernel.org/project/netdevbpf/list/?series=903993&state=*) | Initial stripped-down submission (~8,000 LOC of a then-15,000-LOC module); "functional but its performance is not very interesting (about the same as TCP)". LWN carried the posting as ["Begin upstreaming Homa transport protocol"](https://lwn.net/Articles/997858/). |
| v2 | 2024-11-11 | 12 | [v2 cover](https://lore.kernel.org/netdev/20241111234006.5942-1-ouster@cs.stanford.edu/) | [908592](https://patchwork.kernel.org/project/netdevbpf/list/?series=908592&state=*) | Removed kernel-wrapper functions and `sockaddr_in_union` from uAPI; sparse/checkpatch fixes; removed unit-test residue; portability (do_div, uintptr_t); dropped `get_cycles` for `sched_clock`. |
| v3 | 2024-12-09 | 12 | [v3 cover](https://lore.kernel.org/netdev/20241209175131.3839-1-ouster@cs.stanford.edu/) | [916070](https://patchwork.kernel.org/project/netdevbpf/list/?series=916070&state=*) | `SO_HOMA_SET_BUF`→`SO_HOMA_RCVBUF`; getsockopt support; module autoload alias; many error-path and robustness fixes. |
| v4 | 2024-12-17 | 12 | [v4 cover](https://lore.kernel.org/netdev/20241217000626.2958-1-ouster@cs.stanford.edu/) | [918410](https://patchwork.kernel.org/project/netdevbpf/list/?series=918410&state=*) | ICMP handling refactor (v6 path was incorrect); `homa_` prefixes on wire structs; poll shutdown check. |
| v5 | 2025-01-06 | 12 | [v5 cover](https://lore.kernel.org/netdev/20250106181219.1075-1-ouster@cs.stanford.edu/) | [922654](https://patchwork.kernel.org/project/netdevbpf/list/?series=922654&state=*) | uAPI type hygiene (`__u64`, `__user` annotations); homa_interest refactor; removed obsolete helpers. |
| v6 | 2025-01-15 | 12 | [v6 cover](https://lore.kernel.org/netdev/20250115185937.1324-1-ouster@cs.stanford.edu/) | [925822](https://patchwork.kernel.org/project/netdevbpf/list/?series=925822&state=*) | GFP_ATOMIC fixes, homa_rpc_reap API refactor. Triggered the big Paolo Abeni "far from mergeable" review (§3). |
| v7 | 2025-03-31 | 14 | [v7 cover](https://lore.kernel.org/netdev/20250331234548.62070-1-ouster@cs.stanford.edu/) | [948714](https://patchwork.kernel.org/project/netdevbpf/list/?series=948714&state=*) | Huge rework in response to v6 review: RCU usage overhauled, `homa_rpc_hold/put` refcounting, `homa_interest.c` waiting rewrite on `wait_event_*`, per-netns support, wmem accounting (`wmem_max` sysctl), `SO_HOMA_SERVER` opt-in for servers, docs `reap.txt`/`sync.txt`. 2.5-month gap = rework time. |
| v8 | 2025-05-02 | 15 | [v8 cover](https://lore.kernel.org/netdev/20250502233729.64220-1-ouster@cs.stanford.edu/) | [959268](https://patchwork.kernel.org/project/netdevbpf/list/?series=959268&state=*) | "There were no reviews of the v7 patch series"; pacer split into own files; homa_pool API refactor. |
| v9 | 2025-05-26 | 15 | [v9 cover](https://lore.kernel.org/netdev/20250526042819.2526-1-ouster@cs.stanford.edu/) | [966314](https://patchwork.kernel.org/project/netdevbpf/list/?series=966314&state=*) | homa_net per-netns objects; homa_clock abstraction; peer limits + rhashtable peer table. Jakub Kicinski bounced it with the net-next-closed form letter (6.16 merge window) on 2025-05-27 ([msg](https://lore.kernel.org/netdev/20250527191615.57502235@kernel.org/)). |
| v9 repost | 2025-06-09 | 15 | [v9 repost cover](https://lore.kernel.org/netdev/20250609154051.1319-1-ouster@cs.stanford.edu/) | [969901](https://patchwork.kernel.org/project/netdevbpf/list/?series=969901&state=*) | Same v9, reposted when net-next reopened. Simon Horman review 2025-06-13 (§3). |
| v10 | 2025-07-03 | 15 | [v10 cover](https://lore.kernel.org/netdev/20250703031445.569-1-ouster@cs.stanford.edu/) | [978442](https://patchwork.kernel.org/project/netdevbpf/list/?series=978442&state=*) | Resend-mechanism refactor (`homa_request_retrans`); socket-cleanup race fixes via `struct proto` destroy. |
| v11 | 2025-07-14 | 15 | [v11 cover](https://lore.kernel.org/netdev/20250714044448.254-1-ouster@cs.stanford.edu/) | [981886](https://patchwork.kernel.org/project/netdevbpf/list/?series=981886&state=*) | "No comments on v10"; buffer-pool wakeup starvation fix; RPC refcount cleanup. |
| v12 | 2025-07-24 | 15 | [v12 cover](https://lore.kernel.org/netdev/20250724184050.3130-1-ouster@cs.stanford.edu/) | [985672](https://patchwork.kernel.org/project/netdevbpf/list/?series=985672&state=*) | "No comments on v11." Kuniyuki Iwashima raised SPDX licensing (GPL-2.0 compatibility) ([msg](https://lore.kernel.org/netdev/20250724194001.1623075-1-kuniyu@google.com/)). |
| v13 (RFC) | 2025-07-30 | 15 | [v13 cover](https://lore.kernel.org/netdev/20250730234544.4357-1-ouster@cs.stanford.edu/) | [987198](https://patchwork.kernel.org/project/netdevbpf/list/?series=987198&state=*) | RFC during the closed 6.17 merge window; SPDX changed to include GPL-2.0+ option. |
| v14 | 2025-08-18 | 15 | [v14 cover](https://lore.kernel.org/netdev/20250818202756.1881-1-ouster@cs.stanford.edu/) | [992729](https://patchwork.kernel.org/project/netdevbpf/list/?series=992729&state=*) | Superseded same day by v15 (broken Author email addresses in commits). |
| v15 | 2025-08-18 | 15 | [v15 cover](https://lore.kernel.org/netdev/20250818205551.2082-1-ouster@cs.stanford.edu/) | [992742](https://patchwork.kernel.org/project/netdevbpf/list/?series=992742&state=*) | Resubmit of v14. Received the deepest human review of the whole effort (Paolo Abeni ~10 detailed per-patch reviews, Eric Dumazet, Andrew Lunn — §3). |
| v16 | 2025-10-15 | 14 | [v16 cover](https://lore.kernel.org/netdev/20251015185102.2444-1-ouster@cs.stanford.edu/) | [1012035](https://patchwork.kernel.org/project/netdevbpf/list/?series=1012035&state=*) | **Removed `homa_pacer.c` entirely** (Paolo had said the pacer "does not fit mergeable status"); homa_peer refcount cleanup; `HOMAIOCINFO` ioctl; `refcount_t`; `consume_skb`/`kfree_skb_reason`; bit-op helpers. Phoronix coverage: ["Latest Linux Patches For Homa Posted"](https://www.phoronix.com/news/Linux-Homa-2025-Patches) (Oct 2025). |
| v17 | 2026-03-16 | 14 | [v17 cover](https://lore.kernel.org/netdev/20260316223228.2611-1-ouster@cs.stanford.edu/) | [1067602](https://patchwork.kernel.org/project/netdevbpf/list/?series=1067602&state=*) | 5-month gap after v16 (module work: 6.17.8 rebase, homa_qdisc). "Only minor changes to reflect changes elsewhere in the kernel" (`kmalloc_obj`, `struct sockaddr_unsized`). First round reviewed by netdev's **AI review bot** (7 AI reviews forwarded by Paolo Abeni on 2026-03-18, §3). |
| v18 | 2026-04-10 | 15 | [v18 cover](https://lore.kernel.org/netdev/20260410200310.1915-1-ouster@cs.stanford.edu/) | [1079912](https://patchwork.kernel.org/project/netdevbpf/list/?series=1079912&state=*) | Fixes from AI review + Paolo: two homa_peer reclamation races; zero unused fields in outgoing packets; Linux type conventions; `kzalloc_obj`; **new patch exporting `skb_attempt_defer_free`** (hence back to 15 patches). Jakub flagged a `coccicheck` warning ([msg](https://lore.kernel.org/netdev/20260412134531.21341692@kernel.org/)). |
| v19 | 2026-04-28 | 15 (8,325 ins.) | [v19 cover](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/) | [1087148](https://patchwork.kernel.org/project/netdevbpf/list/?series=1087148&state=*) | ioctl numbers moved to unused range; "Fix several bugs found by AI review." **Latest series as of 2026-07-23**; Patchwork state "changes-requested"; no v20 posted yet. |

Growth note: v1 described the full module as ~15,000 lines; by v19 the cover letter says ~20,000 lines, with the upstream subset ~8,000 lines ([v19 cover](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/)).

---

## 2. What has actually been merged (as of 2026-07-23): NOTHING

Precise, independently verifiable checks, all run 2026-07-23:

1. **Mainline (torvalds/linux master, 7.2-rc era):** [`net/homa`](https://github.com/torvalds/linux/tree/master/net/homa) does not exist — the GitHub contents API returns 404 for [`/repos/torvalds/linux/contents/net/homa`](https://api.github.com/repos/torvalds/linux/contents/net/homa). There is no `include/uapi/linux/homa.h`, and [MAINTAINERS](https://raw.githubusercontent.com/torvalds/linux/master/MAINTAINERS) contains no HOMA entry (grep performed on the raw file).
2. **net-next:** the [net-next `net/` tree listing](https://git.kernel.org/pub/scm/linux/kernel/git/netdev/net-next.git/tree/net) (fetched HTTP 200 on 2026-07-23) contains no `homa` directory.
3. **linux-next:** the [linux-next `net/` tree listing](https://git.kernel.org/pub/scm/linux/kernel/git/next/linux-next.git/tree/net) (fetched 2026-07-23, next-20260723 era per [kernel.org releases.json](https://www.kernel.org/releases.json)) contains no `homa` directory.
4. **Patchwork:** no Homa patch has ever reached state "accepted"; every series is "changes-requested", "superseded", or "rfc" ([Patchwork query](https://patchwork.kernel.org/project/netdevbpf/list/?q=homa&state=*&archive=both)).

Because Homa has never entered any maintainer tree, **no Linux release contains it** — that covers 6.13 (Jan 2025), 6.14, 6.15, 6.16 (Jul 2025), 6.17, 6.18, and the 2026 releases up through 7.1 (current stable 7.1.4, released 2026-07-18, per [kernel.org releases.json](https://www.kernel.org/releases.json); mainline is at 7.2-rc4, 2026-07-19). Note the kernel major-version bump from 6.x to 7.x happened in 2026 (see Gaps re: exact transition).

---

## 3. Maintainer and reviewer feedback

All review content below was retrieved from the Patchwork comments API on 2026-07-23 (282 comments across the 19 series); lore links are constructed from message-ids and work in a browser.

### 3.1 Who reviewed, and when

Comment counts by author across all series (excluding Ousterhout's own 124 replies): Paolo Abeni 56, Andrew Lunn 22, kernel test robot 21, D. Wythe 13, Jakub Kicinski 10, Eric Dumazet 9, Simon Horman 7, Edward Cree 5, Przemek Kitszel 3, Jason Xing 3, Cong Wang 2, Randy Dunlap 2, Arnd Bergmann 2, Stephen Hemminger 1, Joe Damato 1, Kuniyuki Iwashima 1.

### 3.2 Early rounds (v1–v2, Oct–Nov 2024): process on-ramp + first technical flags

- **Andrew Lunn (v1, 2024-10-29/30):** uAPI struct sizing for 32-bit userspace ([msg](https://lore.kernel.org/netdev/6a2ef1b2-b4d4-41c5-9a70-42f9b0e4e29a@lunn.ch/)); "no inline functions in .c files" ([msg](https://lore.kernel.org/netdev/dfadfd49-a7ce-4327-94bd-a1a24cbdd5a3@lunn.ch/)); look at page pool / get MM review for the buffer-pool allocator ([msg](https://lore.kernel.org/netdev/67c42f72-4448-4fab-aa5d-c26dd47da74f@lunn.ch/)); look at BQL for pacing ([msg](https://lore.kernel.org/netdev/55bc21b1-2f37-4ade-8233-b30a9e0274c7@lunn.ch/)); don't spam the log / DoS risk ([msg](https://lore.kernel.org/netdev/a109d5c6-76d6-47c5-834d-9f263f254b5c@lunn.ch/)); predicted `tt_record` timetracing "will be rejected… look at tracepoints" ([msg](https://lore.kernel.org/netdev/1ec74f2a-3a63-4093-bea8-64d3d196eac6@lunn.ch/)).
- **Eric Dumazet (v1, 2024-10-30):** "kmalloc() can return NULL. This will crash your host" and "get_cycles() is not generally available, and can go backward anyway. There is a reason it is not used at all in net" ([msg](https://lore.kernel.org/netdev/e99174c4-7c09-486b-b1f0-9c57b1582232@gmail.com/)); an unsafe socket-table walk: "homa_socktab_next() will access possibly freed data" ([msg](https://lore.kernel.org/netdev/94840d1d-f051-4c07-8262-a17f0d5ce300@gmail.com/)).
- **Edward Cree (v1, 2024-11-07/08):** questioned baking IP-only addressing into the uAPI and userland wrapper prototypes in `homa.h`; pointed to the libbpf model for packaging library functions ([msg 1](https://lore.kernel.org/netdev/174d72f1-6636-538a-72d2-fd20f9c4cbd0@gmail.com/), [msg 2](https://lore.kernel.org/netdev/6467b078-4ee9-ecb2-6174-825c3a2d5007@gmail.com/)); Stephen Hemminger added that liburing is the better analogy and "It took several years for BPF to get to run anywhere status" ([msg](https://lore.kernel.org/netdev/20241108143208.2a08d972@hermes.local/)).
- **Joe Damato (v2, 2024-11-12):** asked for proper per-revision changelogs ([msg](https://lore.kernel.org/netdev/ZzKeCJZoEIFoiJyO@LQ3V64L9R2/)).
- **Jakub Kicinski (v2, 2024-11-12):** friendly heads-up: "we're operating at 50% maintainer capacity for the next 2 weeks so the reviews may be more muted than usual" ([msg](https://lore.kernel.org/netdev/20241112174834.43231a32@kernel.org/)).
- **Cong Wang (v2, 2024-11-13):** asked for checkpatch cleanliness, socket diagnostics (`inet_diag`-style), and selftests; later agreed diagnostics need not block the first series ([msg 1](https://lore.kernel.org/netdev/ZzTcx8nmEKIJpaCR@pop-os.localdomain/), [msg 2](https://lore.kernel.org/netdev/Z0D62cS7DgkHYEDr@pop-os.localdomain/)).

### 3.3 The v6 verdict (Paolo Abeni, 2025-01-24): "quite far from a mergeable status"

The single most consequential review of the effort ([full msg](https://lore.kernel.org/netdev/637049f6-f490-445b-8493-218b68d438a3@redhat.com/)):

> "I haven't completed reviewing the current iteration yet, but with the amount of code inspected at this point, the series looks quite far from a mergeable status. Before the next iteration, I strongly advice to review (and possibly rethink) completely the locking schema, especially the RCU usage, to implement rcvbuf and sendbuf accounting (and possibly even memory accounting), to reorganize the code for better reviewability … to use more the existing kernel API and constructs and to test the code with all the kernel/configs/debug.config knobs enabled."

Ousterhout's v7 (2025-03-31) was the direct answer: RCU overhaul, generic `homa_rpc_hold/put` refcounting, standard `wait_event_*` waiting, per-netns support, and wmem accounting ([v7 changelog inside v19 cover](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/)).

### 3.4 v9 round (Simon Horman, 2025-06-13): tooling hygiene

Remove the unusual `__context__` sparse macro ([msg](https://lore.kernel.org/netdev/20250613144055.GI414686@horms.kernel.org/)); reuse `murmurhash3_128()` from `drivers/md/dm-vdo` by moving it to `lib/` — Horman offered to help ([msg](https://lore.kernel.org/netdev/20250613171833.GN414686@horms.kernel.org/)); clang `-Wunused-but-set-variable`, checkpatch codespell, reverse-xmas-tree ordering ([msg](https://lore.kernel.org/netdev/20250613143958.GH414686@horms.kernel.org/)).

### 3.5 The v15 deep review (Paolo Abeni, Eric Dumazet, Andrew Lunn; 2025-08-26 – 2025-09-02)

The most thorough technical round; ~10 per-patch reviews from Paolo Abeni on 2025-08-26 alone:

- **Pacer not mergeable:** "IMHO this does not fit mergeable status: the static init (@25Gbs), never updated on link changes, assumes a single link in the whole system. I think it's better to split the pacer part out of this series" ([msg](https://lore.kernel.org/netdev/3b432e20-cca3-4163-b7ac-139efe6a8427@redhat.com/)). → pacer removed in v16.
- **Custom clock rejected:** Paolo: "Both tsc() and ktime_get_mono_fast_ns() suffer of various inconsistencies… I strongly advice against this early optimization" ([msg](https://lore.kernel.org/netdev/ce4f62a8-1114-47b9-af08-51656e08c2b5@redhat.com/)); Eric Dumazet: "Using get_cycles() in networking is simply a big no from us. We do not want to deal with all these #ifdef CONFIG_X86_TSC games" ([msg](https://lore.kernel.org/netdev/CANn89i+yjrhykQ1FEaKoq4tPAutR44o3FbdNH_sw2R9dm2jMkw@mail.gmail.com/)); Paolo suggested instrumentation belongs behind debug builds or ftrace/BPF ([msg](https://lore.kernel.org/netdev/5ef10a85-3b2a-468e-8a67-200c6ad63dfe@redhat.com/)).
- **Latency hazards:** "there are several points that could cause much greater latency – i.e. the long loops under BH lock with no reschedule. I'm surprised they don't show as ms-latency bottlenecks under stress test" ([msg](https://lore.kernel.org/netdev/6d99c24c-a327-471b-964f-cfe02aef7ce2@redhat.com/)); cond_resched needs in socket scans ([msg](https://lore.kernel.org/netdev/180be553-8297-4802-972f-d73f30da365a@redhat.com/)).
- **RCU/refcount simplification:** "The free schema is quite convoluted… Why don't you simply call_rcu() … Please use refcount_t" ([msg](https://lore.kernel.org/netdev/66dff631-3f6d-4a7c-b0f2-627c25c49967@redhat.com/)).
- **TX skb sharing:** "Pushing skbs with refcount > 1 into the tx stack calls for trouble. You should instead likely clone the tx skb" ([msg](https://lore.kernel.org/netdev/31aab5bd-7775-4fec-90a1-59e3120d500b@redhat.com/)).
- **Input validation / malicious peers:** "I could not find where `message_length` is validated… What if an evil/bugged peer set message_length to a random value?" ([msg 1](https://lore.kernel.org/netdev/a2dec2d0-84be-4a4f-bfd4-b5f56219ac82@redhat.com/), [msg 2](https://lore.kernel.org/netdev/6efc1a99-b5b1-4a22-9655-fb9193e02a7f@redhat.com/)).
- **Eric Dumazet, kfree_skb vs consume_skb discipline** and `kfree_skb_reason` for bug hunting ([msg](https://lore.kernel.org/netdev/CANn89iJ26WjmTBrEKwMJbQCKWYFmz2h25T+kOgLASXPvsDR1BQ@mail.gmail.com/)); later (Sept 2025) he doubted `skb_attempt_defer_free()` is a win without GRO (quoted in Ousterhout's v18 follow-up, [msg](https://lore.kernel.org/netdev/CAGXJAmwfszU5dLnpeb_vO9=NuLa1ii7_cmEQ+czFR0dJSjCE4g@mail.gmail.com/)).
- **Andrew Lunn, function length/coding style** (quoting the coding-style doc at length) ([msg](https://lore.kernel.org/netdev/04716a9e-9dad-47e6-9298-5b5cf6efe7cb@lunn.ch/)).

### 3.6 2026 rounds (v17–v19): AI review era

- **2026-03-18:** Paolo Abeni sent **seven AI-generated reviews** against v17, each prefaced "This is an AI-generated review of your patch. The human sending this email has considered the AI review valid, or at least plausible" with reproduction steps at [netdev-ai.bots.linux.dev](https://netdev-ai.bots.linux.dev/ai-local.html). Substantive AI findings included: partially-initialized `homa_rpc_unknown_hdr` leaking 15 bytes of kernel stack to the network ([msg](https://lore.kernel.org/netdev/20260318072136.269073-1-pabeni@redhat.com/)), possibly-uninitialized `kfree_skb_reason()` reason ([msg](https://lore.kernel.org/netdev/20260318072144.269088-1-pabeni@redhat.com/)), a missing `rcu_read_lock()` around `list_for_each_entry_rcu` ([msg](https://lore.kernel.org/netdev/20260318072149.269101-1-pabeni@redhat.com/)), a sparse-breaking `__must_hold` annotation ([msg](https://lore.kernel.org/netdev/20260318072124.268931-1-pabeni@redhat.com/)), and peer-count locking questions ([msg](https://lore.kernel.org/netdev/20260318072119.268920-1-pabeni@redhat.com/)). Paolo pointed Ousterhout to the prompts at [masoncl/review-prompts](https://github.com/masoncl/review-prompts) for local runs ([msg](https://lore.kernel.org/netdev/9cb6cc7c-5859-4be7-a3af-bd02232f0536@redhat.com/)).
- **Human follow-ups in v17:** Paolo on kmem_cache vs kzalloc performance surprise ([msg](https://lore.kernel.org/netdev/6fb603dd-7bc2-4b60-bf93-7247d05f3250@redhat.com/)) and confirming the `skb_attempt_defer_free` export is acceptable "as long as such export is bundled with the module user – i.e. this series" ([msg](https://lore.kernel.org/netdev/7145f530-3adc-409f-bfc4-583e42be50ee@redhat.com/), 2026-04-07).
- **v18 (2026-04-12):** Jakub Kicinski: "make coccicheck says: net/homa/homa_peer.c:213:21-22: WARNING opportunity for swap()" ([msg](https://lore.kernel.org/netdev/20260412134531.21341692@kernel.org/)). Ousterhout documented on-the-record which AI findings he accepted/declined ([msg](https://lore.kernel.org/netdev/CAGXJAmwfszU5dLnpeb_vO9=NuLa1ii7_cmEQ+czFR0dJSjCE4g@mail.gmail.com/), 2026-04-15).
- **v19 (2026-04-30):** Ousterhout: "The sashiki-gemini review has found a bunch of issues, which look super-helpful (and a little sobering at how many there are :-()" — and asked how to respond to AI reviews "on the record" ([msg](https://lore.kernel.org/netdev/CAGXJAmwuqj1YFSgwMwBfdjofEzC8nU2X_zv3mzq6by2K7mGufQ@mail.gmail.com/)). **No further list activity on the series was found between 2026-04-30 and 2026-07-23** (Patchwork shows no v20 and no further comments).

### 3.7 The sociology

- Long no-review stretches: v7, v10, v11, v12, v13 got essentially zero human comments (per the cover-letter changelogs themselves, e.g. "There were no comments on the v13 patch series", [v19 cover](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/)). On 2025-08-22 Ousterhout wrote: "This patch series appears to be stuck in limbo: I have not received any comments since the v9 patch in early June. Is there anything I can do to move this series towards closure?" ([msg](https://lore.kernel.org/netdev/CAGXJAmywHL=y1pqgMsBwFttdiMP-hVVNPtfPcSr4Nn8Jcuaj5Q@mail.gmail.com/)) — which did trigger the big v15 review.
- LWN ([Jonathan Corbet, "The Homa network protocol", 2024-12-30](https://lwn.net/Articles/1003059/)) framed it: "academic work often does not successfully make the transition from interesting prototype into production-quality code that can be accepted into Linux"; merge "not imminent" though "likely to happen at some point", contingent on datacenter operators caring.
- No maintainer has NACKed the concept; the friction is code-quality/kernel-idiom convergence plus scarce reviewer bandwidth for an 8K-line new protocol from a first-time kernel contributor (albeit a famous one).

---

## 4. The staging strategy: `__STRIP__` and what's deliberately excluded

- The [HomaModule README](https://github.com/PlatformLab/HomaModule/blob/main/README.md) (Significant changes, October 2024 entry) explains: "The sources in this repository contain '#ifndef \_\_STRIP\_\_' directives, which separate functionality being upstreamed from functionality that is not currently upstreamed (some things, such as development aids, may never be upstreamed)."
- [`util/strip.py`](https://github.com/PlatformLab/HomaModule/blob/main/util/strip.py) generates the upstream-bound tree: it removes timetracing (`tt_record*`), `#ifdef __UNIT_TEST__` blocks, `UNIT_LOG`/`UNIT_HOOK`, `INC_METRIC`, and `IF_NO_STRIP` statements, and supports three modes (normal dev build / statically-stripped upstreaming copy / compile-time `__STRIP__=y`). A companion [`util/strip_decl.py`](https://github.com/PlatformLab/HomaModule/blob/main/util/strip_decl.py) exists. The repo also keeps a [`net-next` branch](https://github.com/PlatformLab/HomaModule/branches) tracking the upstream submission.
- **Deliberately excluded from the first upstream series** (per the [v19 cover letter](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/) and review history): unit tests, application-level library functions ("need to go in glibc?"), man pages, benchmarking/instrumentation code, timetracing, metrics; the **pacer** (dropped in v16 after Paolo's objection, [msg](https://lore.kernel.org/netdev/3b432e20-cca3-4163-b7ac-139efe6a8427@redhat.com/)); **GRO/GSO optimizations** (Ousterhout: "Maybe the performance benefits will increase when I upstream Homa's GRO support?", [msg](https://lore.kernel.org/netdev/CAGXJAmwfszU5dLnpeb_vO9=NuLa1ii7_cmEQ+czFR0dJSjCE4g@mail.gmail.com/)); grant-based SRPT scheduling and TCP hijacking are also module-only today. Result: the upstream candidate is "the bare minimum functionality capable of actually executing remote procedure calls… performance is not very interesting (about the same as TCP)" ([v19 cover](https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/)).

---

## 5. Out-of-tree module milestones (from the [README "Significant changes"](https://github.com/PlatformLab/HomaModule/blob/main/README.md) unless noted)

- **Jun 2024:** refactored sk_buff management to use frags ("improves efficiency significantly").
- **Jul 2024:** "TCP hijacking" — Homa packets sent as legitimate TCP segments and reclaimed from TCP at the destination, to exploit TSO and RSS.
- **Oct 2024:** upstreaming begins; IANA IP protocol number **146** ([IANA registry](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml)).
- **Feb–May 2025:** server sockets opt-in (`SO_HOMA_SERVER`); private RPCs (API change); outgoing-message memory cap; grant-management refactor; Linux 6.13.9; netns support; peer-memory capping; removal of `homa_api.c` (no more `homa_send/homa_reply` wrappers).
- **Oct 2025:** `HOMAIOCINFO` ioctl.
- **Nov 2025:** upgraded to **Linux 6.17.8**.
- **Jan 2026:** **`homa_qdisc`** queuing discipline for TCP+Homa coexistence — "homa_qdisc improves Homa short message P99 3x when running together with TCP" (100 Gbps c6620 CloudLab results).
- **Mar 2026:** **backported to RHEL 8 and 9.5** via branches `rhel8` and `rhel_9.5` (RHEL 8 = the 4.18 kernel line; the repo also carries a [`linux_4.18.0` branch](https://github.com/PlatformLab/HomaModule/branches), verified 2026-07-23).
- **Jun–Jul 2026 (from the [commit log](https://github.com/PlatformLab/HomaModule/commits/main), not yet in README):** 2026-06-29 batch of fixes tracking v19 AI-review findings (kernel stack info-leak fix in `homa_recvmsg`, lockdep annotations, Kconfig/Makefile/SPDX conformance); 2026-07-02: first version of `INSTALL.md` + GSO sizing fix. Repo is clearly being prepped for a v20 submission.

---

## 6. Realistic assessment (2026-07-23)

- **Distance to mainline:** closer than ever in code-quality terms — v17–v19 review items are mostly mechanical (ioctl numbers, coccicheck, type conventions, AI-flagged bugs) versus the architectural objections of v6/v15 — but the series has now been in flight for 21 months over 19 revisions with no Acked-by/Reviewed-by from a core maintainer visible in any collected thread, and no maintainer has ever said "this is on track to be applied".
- **Immediate state:** v19 is "changes-requested" (AI-review fixes), the fixes are landing in the GitHub repo (June 2026 commits), and a v20 is the obvious next step. Nearly three months (2026-04-30 → 2026-07-23) have passed without a new posting — consistent with the project's earlier cadence around merge-window closures and rework periods.
- **Remaining blockers:** (1) reviewer bandwidth — the recurring silent rounds; Homa reviews now lean on netdev's AI tooling, which generates work faster than humans sign off; (2) no visible corporate user/backer on the list — LWN's point that merging depends on datacenter operators wanting it ([LWN, 2024-12-30](https://lwn.net/Articles/1003059/)); (3) the first-series scope question is settled (minimal, TCP-equivalent performance) but acceptance still needs a maintainer decision to take an 8K-line new protocol with a single (academic) maintainer — the MAINTAINERS patch names Ousterhout alone ([v19 patch 15](https://lore.kernel.org/netdev/20260428231520.1857-16-ouster@cs.stanford.edu/), inferred from series diffstat); (4) after the first series lands, the performance-critical parts (grants/SRPT, pacing, GRO, qdisc integration) all still have to go through the same process.
- **Timelines:** no one has committed to one. Ousterhout has consistently said remaining code comes "in smaller batches once this patch series has been accepted" (every cover letter, v1→v19). Corbet's Dec 2024 assessment ("not imminent… likely to happen at some point") remains the most honest public forecast; nothing found in 2025–2026 supersedes it.

---

## 7. How to re-check current status (copy-paste guide)

| What | URL |
|------|-----|
| All Homa series + states (Patchwork) | `https://patchwork.kernel.org/project/netdevbpf/list/?q=homa&state=*&archive=both` |
| Patchwork REST (scriptable, no bot-block) | `https://patchwork.kernel.org/api/1.2/series/?project=netdevbpf&q=homa&order=-date` |
| lore full-text search (browser; Anubis blocks bots) | `https://lore.kernel.org/netdev/?q=homa` and `https://lore.kernel.org/netdev/?q=%22Begin+upstreaming+Homa%22` |
| Latest series thread (v19) | `https://lore.kernel.org/netdev/20260428231520.1857-1-ouster@cs.stanford.edu/` |
| Is it merged? (mainline) | `https://github.com/torvalds/linux/tree/master/net/homa` (404 = not merged) / `https://api.github.com/repos/torvalds/linux/contents/net/homa` |
| Is it in net-next? | `https://git.kernel.org/pub/scm/linux/kernel/git/netdev/net-next.git/tree/net` |
| Module repo + README news | `https://github.com/PlatformLab/HomaModule` (README "Significant changes" section; `net-next` branch tracks the submission) |
| LWN search | `https://lwn.net/Search/DoSearch?words=homa` — key articles: [997858](https://lwn.net/Articles/997858/) (Oct/Nov 2024 posting), [1003059](https://lwn.net/Articles/1003059/) (Corbet feature, 2024-12-30), [913260](https://lwn.net/Articles/913260/) (2022 keynote coverage) |
| Kernel release facts | `https://www.kernel.org/releases.json` |
| Netdev AI review bot docs | `https://netdev-ai.bots.linux.dev/ai-local.html` and `https://github.com/masoncl/review-prompts` |

---

## 8. Gaps — things I could NOT verify (2026-07-23)

1. **lore.kernel.org direct fetches were blocked** by Anubis bot-protection (both WebFetch and curl → 403). All lore links above are constructed from Patchwork-provided message-ids (Patchwork's own `list_archive_url` format), so they should resolve, but I could not click-verify each one. All quoted review text comes from the Patchwork comments API, which mirrors list traffic — content is verified; the lore URL rendering is not.
2. **The v19 AI reviews ("sashiki-gemini") themselves** were not retrievable: Patchwork recorded only one comment on the v19 series (Ousterhout's 2026-04-30 reply). The AI review messages evidently exist on the list (Ousterhout responds to them) but were not ingested as Patchwork comments, so I could not quote them or count the findings.
3. **Exact 6.x→7.x version transition:** kernel.org shows longterm 6.18 and stable 7.0/7.1 in July 2026, but I could not confirm whether a 6.19 ever existed between 6.18 and 7.0 (an EOL'd release would have dropped out of releases.json). Irrelevant to the Homa conclusion (never merged into any tree), but flagged for precision.
4. **Netdevconf 2024/2025 Homa talks:** I confirmed the netdev 0x16 (2022) keynote, but grep of the netdev 0x18 sessions page found no Homa session, and the 0x19 sessions URL patterns I tried returned nothing usable — I cannot say whether Homa featured at 0x18/0x19/0x1A. Unverified either way.
5. **LWN paywalled coverage in 2025–2026:** searches surfaced no dedicated LWN Homa article newer than [1003059](https://lwn.net/Articles/1003059/) (Dec 2024), but recent LWN content is subscriber-only for ~2 weeks and site search from here is limited; a brief mention in a 2026 weekly edition could have been missed.
6. **Private/maintainer-side intentions:** no public statement from Kicinski/Abeni/Dumazet on whether or when they would apply the series; any off-list conversations are invisible to this research.
7. **The claimed "MAINTAINERS names Ousterhout alone"** is inferred from the series diffstat (7-line MAINTAINERS change) and v1 cover; I did not fetch the individual v19 MAINTAINERS patch body to confirm no co-maintainer was added in later revisions.
