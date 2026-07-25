# TailCut: Single-VM Tail-Latency Benchmark Rig — Executable Spec

> **Revision note (2026-07-25):** Renamed from `pias-lite-benchmark-spec.md` — the system is now **TailCut** (named at the end of the conversation transcript alongside this file); "PIAS-lite" replaced throughout. Substantive fixes in the same edit, from what was learnt in AHQ-192 docs 09–11: **bulk throughput is now measured** with a ≤10%-degradation acceptance criterion (the "non-tail traffic must not suffer" requirement was previously untested); **deadline-miss rate** added as a reported metric (models the RTB auction cutoff in the pinned target scenario); **S5 (fq_codel) and S6 (persistent connections) promoted from optional/stretch to required**, and the marker's idle re-promotion made core — the pinned target scenario (Tomcat-style keep-alive connection pools) would be mis-modelled by fresh-connection-only results.

**Purpose:** Demonstrate, inside one Ubuntu VM, that transparent host-side mechanisms (DCTCP+ECN, and PIAS-style eBPF DSCP priority marking — the **TailCut marker**) reduce P99/P99.9 latency of small RPCs competing with bulk TCP flows — with zero application changes.

**This is a model, not a real benchmark.** Absolute numbers are meaningless in a VM. Only *relative* comparisons between scenarios matter. The deliverable is a scripted, repeatable rig that produces a comparison table.

---

## 1. Goals / Non-goals

**Goals**
- Reproduce the "small RPC stuck behind bulk transfer" tail-latency scenario on demand.
- Show the mechanism stack working end-to-end: eBPF byte-counting DSCP marker → priority queues at a bottleneck → ECN/DCTCP congestion control.
- Fully scripted: one command runs all scenarios and emits a report.
- Everything transparent to the workload programs (they use plain TCP sockets).
- Show the win does **not** come at bulk traffic's expense (bulk goodput is a first-class result).

**Non-goals**
- No real switches, NICs, multi-host networking, IPv6, or security hardening.
- No absolute performance claims. No Homa comparison.

## 2. Environment

- Ubuntu 24.04 VM (VMware on macOS), kernel ≥ 6.8, 2+ vCPUs, 4 GB RAM, run as root.
- Packages: `clang llvm libbpf-dev bpftool linux-headers-$(uname -r) iproute2 iperf3 gcc make python3 python3-matplotlib tcpdump`
- IPv4 only.

## 3. Topology (network namespaces)

Four namespaces connected by veth pairs through a central `switch` namespace containing a Linux bridge (or plain forwarding):

```
 client (10.0.0.1) ──┐
                     ├── switch ──── server (10.0.0.3)
 bulk   (10.0.0.2) ──┘      ▲
                            │
              bottleneck = switch→server egress veth
```

- `client`: runs the RPC client (the latency-sensitive workload).
- `bulk`: runs iperf3 bulk senders (the aggressor traffic).
- `server`: runs the RPC server and iperf3 server.
- `switch`: forwards packets; hosts the bottleneck qdisc on its egress veth toward `server`.

Setup script `setup_topology.sh` must: create namespaces, veths, assign IPs, enable forwarding in `switch`, disable offloads on ALL veth ends (`ethtool -K <dev> tso off gso off gro off`) so on-wire packet sizes are realistic (~1500 B MTU), and add `netem delay 1ms` on the switch→client and switch→bulk egress veths (return-path propagation delay). `teardown.sh` must be idempotent.

## 4. The bottleneck ("the ToR switch port")

All scenario differences live in the qdisc tree on the switch→server egress veth. Root is always an HTB class limiting to **100 Mbit** (the "link speed"). The child qdisc varies per scenario:

- **Deep dumb FIFO (baseline):** `bfifo limit 4mb` (≈320 ms drain time at 100 Mbit — this manufactures the tail).
- **ECN marking (DCTCP scenarios):** `red limit 400000 min 30000 max 31000 avpkt 1500 burst 21 probability 1.0 bandwidth 100mbit ecn` — min≈max approximates DCTCP's step-marking at threshold K≈20 packets.
- **Priority queues (TailCut scenarios):** `prio bands 3` with u32 filters mapping DSCP → band: ToS 0xB8 (EF/46) → band 0 (`:1`), unmarked/default → band 1 (`:2`), ToS 0x20 (CS1/8) → band 2 (`:3`). Each band's child qdisc: FIFO in CUBIC scenarios, the RED-ECN config above in DCTCP scenarios (deep FIFO only for band 2 so bulk can still buffer).

**Important confound to respect:** the baseline MUST be plain FIFO. Do not use fq_codel as the default — its per-flow isolation alone rescues small flows and would muddy attribution of the win.

## 5. Congestion control

Per-scenario, set inside client, bulk, and server namespaces:
- CUBIC scenarios: `net.ipv4.tcp_congestion_control=cubic`, `net.ipv4.tcp_ecn=0`
- DCTCP scenarios: `net.ipv4.tcp_congestion_control=dctcp`, `net.ipv4.tcp_ecn=1`

## 6. The code under test: the TailCut eBPF DSCP marker (`marker.bpf.c`)

TC egress program (clsact, direct-action) attached inside `client` and `bulk` namespaces on their veth egress.

- **Map:** `BPF_MAP_TYPE_LRU_HASH` (~16k entries), key = 5-tuple {saddr, daddr, sport, dport, proto}, value = `{u64 bytes; u64 last_seen_ns}`.
- **Config map:** array map holding thresholds T1, T2, the idle-reset window, and an enable flag, writable from the loader (tunable without recompile).
- **Per packet:** parse eth/IPv4/TCP (pass anything else untouched); `bytes += skb->len`; choose DSCP: bytes < T1 → EF (46); T1 ≤ bytes < T2 → AF31 (26, maps to default band); ≥ T2 → CS1 (8). Rewrite the DSCP bits of the ToS byte **preserving the low 2 ECN bits** (mask 0xFC), fix the IP header checksum with `bpf_l3_csum_replace`.
- **Defaults:** T1 = 100 KB, T2 = 1 MB. (10 KB RPC flows stay EF forever; bulk flows demote within milliseconds.)
- **Idle re-promotion (required, not stretch):** if `now − last_seen > 50 ms`, reset `bytes` to 0 before counting the packet. This gives long-lived persistent connections carrying intermittent RPCs their priority back (the PIAS "job" semantics). Required because the pinned target scenario (Tomcat-style keep-alive connection pools) is persistent-connection-shaped: without idle-reset the marker permanently demotes exactly the flows it exists to protect. S1–S5 use the fresh-connection client, so idle-reset is exercised and validated by S6.
- **Loader:** small C (libbpf) or bash using `tc filter add ... bpf da obj marker.bpf.o`; must support attach, detach, set-thresholds, and dump-map (top flows by bytes) for debugging.

## 7. Workloads

**RPC workload (`rpc_server.c`, `rpc_client.c`)** — plain C, blocking TCP sockets, no special socket options (that's the point: transparency).
- Server: accept loop; read 100-byte request; write 10 KB response; connection handling follows the client's mode.
- Client: N concurrent workers (default 8), closed loop, two modes:
  - `fresh` (S1–S5): each iteration connect → send 100 B → read 10 KB → close. Latency = connect() start to last byte read (includes handshake — realistic for per-request connections and captures SYN drops).
  - `keepalive` (S6): each worker opens one persistent connection and loops send → read on it, with a configurable idle gap (default 100 ms) between requests so idle re-promotion is actually exercised. Latency = send() start to last byte read.
  - Either mode: log one CSV line `timestamp_us,latency_us` per request.
- Configurable: server IP/port, workers, duration, response size, mode, idle gap.

**Bulk workload** — iperf3, 2 parallel streams, from `bulk` to `server`, two modes:
- `continuous`: `iperf3 -c 10.0.0.3 -P 2 -t <duration>` (constant standing queue).
- `bursty` (default for the headline result): loop `iperf3 -c 10.0.0.3 -n 2M; sleep 0.1` — intermittent 2 MB bursts create the classic "unlucky RPC lands behind a burst" tail.
- Always run iperf3 with `--json` and keep the output: **bulk goodput per scenario is a first-class result**, not a side note — it feeds acceptance criterion 5.

**Run protocol:** 60 s per scenario, discard first 5 s as warm-up, 3 repetitions, report per-scenario pooled percentiles. Record `nstat -az TcpRetransSegs` deltas per namespace before/after each run.

## 8. Scenario matrix

All six scenarios are required.

| ID | CC | Bottleneck qdisc | Marker | Client mode | Models |
|----|------|------------------|--------|-------------|--------|
| S1 | CUBIC | deep FIFO | off | fresh | today's default / the 700 ms world |
| S2 | DCTCP | RED+ECN | off | fresh | "just turn on DCTCP" (the free win) |
| S3 | CUBIC | prio 3-band | on | fresh | priorities alone |
| S4 | DCTCP | prio 3-band + RED-ECN per band | on | fresh | the full TailCut pitch |
| S5 | CUBIC | fq_codel | off | fresh | honest competitor: what modern Linux gives for free |
| S6 | as S4 | as S4 | on (idle-reset active) | keepalive | persistent connections — the pinned target scenario (Tomcat-style keep-alive) |

## 9. Measurement & reporting (`analyze.py`)

- Read all CSVs; compute per scenario: count, P50, P90, P99, P99.9, max (µs), plus retransmit deltas.
- **Deadline-miss rate** per scenario: fraction of RPCs slower than a configurable budget, reported at **100 ms** (models an RTB auction cutoff) and **200 ms** (models a page-speed abandon budget). This is the business metric — a bid that misses the cutoff earns zero regardless of how little it missed by.
- **Bulk goodput** per scenario from the iperf3 JSON: absolute Mbit/s and as a percentage of S1's.
- Emit `results/report.md`: comparison table + ratios vs S1 (e.g. "S4 P99 = S1 P99 / 7.2×") + deadline-miss table + bulk-goodput table. The report must include two fixed honesty notes: (a) how much of S4's win S2 already delivers (the "just DCTCP" share); (b) that S5's fq_codel result is partly a VM artefact — real switch ASICs don't run fq_codel, but they do read DSCP bits, so S5 flatters the free alternative relative to a real fabric.
- Emit `results/chart.png`: grouped bar chart, log-scale y, P50/P99/P99.9 per scenario.
- Print the table to stdout at the end of `run_all.sh`.

## 10. Sanity checks (must be scripted as `verify.sh`)

1. DSCP on the wire: `tcpdump -i <switch veth> -c 20 -v tcp` shows tos 0xb8 on RPC packets and tos 0x20 on bulk packets once demoted (S3/S4/S6).
2. DCTCP active: `ss -ti` inside client ns shows `dctcp` (S2/S4/S6).
3. Queue behaviour: `tc -s qdisc show` on bottleneck — in S3/S4/S6, band 2 backlog large while band 0 backlog ≈ 0 during bursts.
4. ECN negotiated: tcpdump shows ECT on data packets in S2/S4/S6.
5. Offloads off: `ethtool -k` verification on every veth.
6. Keep-alive really persistent: `ss -t` in client ns during S6 shows a stable connection count (no per-request churn).
7. Idle re-promotion works: during S6, the loader's dump-map shows an RPC flow's byte count resetting across an idle gap (or equivalently, its packets regaining tos 0xb8 after the gap in tcpdump).

## 11. Known pitfalls (encode these; do not rediscover them)

- Preserve ECN bits when writing DSCP or DCTCP silently breaks (mask 0xFC).
- TSO/GSO/GRO must be off on veths or "packets" are 64 KB blobs and byte thresholds misbehave.
- prio-as-child-of-HTB needs explicit classid plumbing; verify with `tc -s class show`.
- RED requires `bandwidth` param to compute averaging; wrong value = no marking.
- In S6, without idle re-promotion per-flow byte counts only ever grow — a keep-alive RPC connection demotes permanently and the marker *hurts* the flows it should protect. Verify demote→re-promote via the map dump across an idle gap.
- VMware timing jitter: never quote absolute numbers; keep the Mac quiet during runs; 3 reps minimum.
- Everything root; wrap all per-ns commands with `ip netns exec`.

## 12. Deliverables & acceptance criteria

**Files:** `setup_topology.sh`, `teardown.sh`, `marker.bpf.c`, loader, `rpc_server.c`, `rpc_client.c`, `run_scenario.sh`, `run_all.sh`, `verify.sh`, `analyze.py`, `Makefile`, `README.md`.

**Accept when:**
1. `make && sudo ./run_all.sh` completes unattended and produces `results/report.md` + chart.
2. Rig validity: S1 shows a real tail — P99 ≥ 10× P50.
3. Headline: S4 P99 ≤ S1 P99 ÷ 3 (target; if not met, report honestly and include `tc -s` band stats for diagnosis).
4. S2 result is reported prominently next to S4 — the "how much was just DCTCP" honesty check.
5. **Bulk traffic unharmed:** S4 bulk goodput ≥ 90% of S1's (the ≤10% non-tail-traffic degradation requirement). If violated, report honestly with per-band `tc -s` stats.
6. **Persistent connections work:** S6 P99 within ~1.5× of S4's (idle re-promotion doing its job on keep-alive flows), with sanity check 7's demote→re-promote evidence included in the report.
7. `verify.sh` passes in every scenario; `teardown.sh` leaves the VM clean; re-running works.
