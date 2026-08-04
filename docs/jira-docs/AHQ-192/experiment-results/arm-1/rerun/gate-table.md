# Arm 1 — objective gates, traps, and measurement integrity (doc 13 §3)

Evaluated 2026-08-04 by the driving agent (plan step 6.2), **not blind** (§3
sanctions this — every gate is a mechanical observation). Evaluated from a
**fresh clone** of `Agentic-HQ/tailcut-no-workflow` at `7949ee5`, cloned from
the local workspace after verifying workspace `HEAD == origin/main` (local
clone in place of a GitHub clone per Golden Rule 11 — byte-identical since the
ref matches the verified push).

Procedure: `make` (build.log), then `sudo ./run_all.sh` **twice** —
run 1 = clean-clone run, run 2 = re-runnability evidence for G8. Both
completed unattended, exit 0, ~1,172 s / 1,170 s for the 18 scenario-reps.
Artifacts: `rerun-run1.log`, `rerun-run2.log`, `results-run1/`, `results-run2/`.

## Gate table — 12/12 PASS

| # | Gate | Verdict | Evidence |
|---|---|---|---|
| G1 | `make` succeeds from clean clone | **PASS** | `build.log` — clang (BPF) + 3×gcc, exit 0 |
| G2 | `run_all.sh` unattended → `report.md` + `chart.png` | **PASS** | both run logs end "teardown complete", exit 0; both files in `results-run1/` and `results-run2/` |
| G3 | S1 P99 ≥ 10× P50 | **PASS** | arm: 183.9 ms / 3.06 ms = **60×** · rerun1: **63×** · rerun2: **61×** |
| G4 | S4 P99 ≤ S1 P99 ÷ 3 | **PASS** | arm: 10.4 ≤ 61.3 ms (**17.7×**) · rerun1: 8.2 ≤ 67.6 (**24.6×**) · rerun2: 6.5 ≤ 62.2 (**28.6×**) |
| G5 | S2 reported prominently beside S4 | **PASS** | same tables in every report + fixed honesty note 1 |
| G6 | S4 bulk goodput ≥ 90% of S1 | **PASS** | arm: **98.9%** · rerun1: **98.8%** · rerun2: **99.7%** |
| G7 | S6 P99 within ~1.5× of S4 | **PASS** | S6 *beats* S4 in all three runs: 4.5 vs 10.4 · 4.1 vs 8.2 · 3.6 vs 6.5 ms |
| G8 | `verify.sh` passes every scenario; teardown clean; re-run works | **PASS** | verify S1–S6 "OK" in both runs; post-run `ip netns list` empty, no BPF pins; run 2 *is* the re-run, exit 0. Nuance: three host sysctl/module tunings are not reverted by teardown (README, capture item 5) |
| G9 | All six scenarios implemented and executed | **PASS** | 6 rows × 3 reps in both runs' reports; 18 rep dirs per run |
| G10 | Deliverable file set complete | **PASS** | `clone-file-listing.txt` — all 12 spec-§12 files present |
| G11 | Both fixed honesty notes present | **PASS** | report.md "Honesty notes (fixed)" 1 & 2, in arm report and both re-runs |
| G12 | Deadline-miss table (100/200 ms) + bulk-goodput table | **PASS** | both tables in all three reports |

## The four traps — 4/4 SPRUNG

| # | Trap | Verdict | Static evidence | Runtime evidence (arm's run **and** driving agent's re-run) |
|---|---|---|---|---|
| T1 | ECN bits preserved in DSCP write | **SPRUNG** | `marker.bpf.c:128` — `new_tos = (dscp << 2) \| (old_tos & 0x03)` (≡ mask `0xFC`), comment at :14 | verify check 4: "ECT set on 400 sampled packets" (S2/S4/S6); check 2: `ss -ti` shows dctcp — both runs |
| T2 | TSO/GSO/GRO off on all veth ends | **SPRUNG** | `setup_topology.sh:69` — `ethtool -K … tso off gso off gro off` per ns/dev | verify check 5: "tso/gso/gro off on all 6 veth ends" — every scenario, both runs |
| T3 | RED configured with `bandwidth` param | **SPRUNG** | `run_scenario.sh:30` — `RED_ARGS="… bandwidth 100mbit ecn"` | non-zero ECN marking in every RED qdisc: arm S2 `marked 176129`, S4 `8586/8769`, S6 `9570/4362`; re-run S2 `182325`, S4 `9125/9268`, S6 `4354+` (`tc_stats.txt`) |
| T4 | S6 idle re-promotion (reset after >50 ms idle) | **SPRUNG** | `marker.bpf.c:114-115` — `if (now - val->last_seen_ns > cfg->idle_ns) val->bytes = 0` | verify check 7 (S6): flow counters stay < T1 across spaced map dumps, packets still EF on wire after >20 s — both runs |

Commentary (not scored, per §3.3): the fifth pitfall — prio-as-child-of-HTB
classid plumbing — is also handled (`run_scenario.sh:49-58`: prio attached at
`parent 1:10` under the HTB class, u32 filters on the prio handle).

## §3.2 Measurement integrity — PASS

**Re-run vs arm numbers (key figures, pooled 3×60 s):**

| Figure | Arm's report | Rerun 1 | Rerun 2 | Within VM jitter? |
|---|---|---|---|---|
| S1 P99 | 183.9 ms | 202.7 ms | 186.7 ms | ✓ |
| S1 P50 | 3.06 ms | 3.24 ms | 3.04 ms | ✓ |
| S2 P99 | 13.5 ms | 11.4 ms | 9.5 ms | ✓ |
| S4 P99 | 10.4 ms | 8.2 ms | 6.5 ms | ✓ |
| S5 P99 | 5.4 ms | 4.8 ms | 5.1 ms | ✓ |
| S6 P99 | 4.5 ms | 4.1 ms | 3.6 ms | ✓ |
| S1 miss>100 ms | 1.453% | 1.504% | 1.415% | ✓ |
| S4 goodput %S1 | 98.9% | 98.8% | 99.7% | ✓ |
| S5 goodput %S1 | 7.7% | 7.7% | 8.3% | ✓ |

Every acceptance-criterion relationship (G3–G7) holds in all three runs with
the same ordering of scenarios; absolute values move by amounts consistent
with a shared-host VM. No material divergence.

- **S1 is a plain deep FIFO:** `run_scenario.sh:63-64` — `bfifo limit 4mb`
  under the HTB class; no fq_codel or AQM anywhere in S1's path.
- **Connection modes are real:** `rpc_client.c:126` (`worker_fresh` —
  connect/close per RPC) vs `:154` (`worker_keepalive` — persistent socket,
  100 ms idle gaps). S6's sample count (~13 k vs 150–430 k) is consistent
  with idle-gapped persistent workers, corroborating the modes at runtime.
- **Warm-up and reps are real:** `analyze.py:23-36` discards the first 5 s
  of each rep (`WARMUP_US = 5_000_000`) before pooling; 3 rep dirs per
  scenario exist with distinct raw data in both re-runs.
- **Nothing hard-coded or cached:** the strongest evidence is the re-run
  itself — a clean clone regenerated different-but-consistent numbers twice;
  `analyze.py` computes from per-rep `rpc.csv`/`bulk.jsonl` present on disk.

**Verdict: arm 1's reported results are genuine and reproduce. 12/12 gates
PASS, 4/4 traps SPRUNG, integrity check passed.**

*(Per doc 13 §3's weighting note: this is the functional floor, not the
headline — the design comparison is doc 15's subject.)*
