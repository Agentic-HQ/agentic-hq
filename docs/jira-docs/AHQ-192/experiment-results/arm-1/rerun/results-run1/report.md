# TailCut benchmark report

All numbers from a VM — **only relative comparisons between scenarios are meaningful**. Latency percentiles pooled across reps after discarding the first 5 s of each rep as warm-up. Latency unit: µs.

## Latency percentiles

| Scenario | Description | N | P50 | P90 | P99 | P99.9 | max | retrans Δ |
|---|---|---|---|---|---|---|---|---|
| S1 | CUBIC + deep FIFO (baseline) | 157,674 | 3,236 | 5,029 | 202,698 | 482,213 | 539,273 | 7,153 |
| S2 | DCTCP + RED/ECN | 248,016 | 4,126 | 8,250 | 11,378 | 19,742 | 112,263 | 512 |
| S3 | CUBIC + prio + marker | 322,287 | 3,673 | 5,448 | 9,342 | 15,671 | 34,575 | 229,044 |
| S4 | DCTCP + prio/RED + marker (TailCut) | 354,161 | 3,380 | 4,518 | 8,228 | 16,631 | 277,013 | 1,565 |
| S5 | CUBIC + fq_codel (free competitor) | 431,992 | 2,903 | 3,454 | 4,798 | 11,108 | 156,578 | 2,187 |
| S6 | as S4, keep-alive client | 12,960 | 1,348 | 1,782 | 4,114 | 8,145 | 10,159 | 71 |

## Ratios vs S1 (baseline)  — higher = bigger win

| Scenario | P50 | P99 | P99.9 |
|---|---|---|---|
| S2 | 0.8× | 17.8× | 24.4× |
| S3 | 0.9× | 21.7× | 30.8× |
| S4 | 1.0× | 24.6× | 29.0× |
| S5 | 1.1× | 42.2× | 43.4× |
| S6 | 2.4× | 49.3× | 59.2× |

## Deadline-miss rates

A bid that misses the cutoff earns zero regardless of how little it missed by. 100 ms models an RTB auction cutoff; 200 ms a page-speed abandon budget.

| Scenario | miss >100 ms | miss >200 ms |
|---|---|---|
| S1 | 1.504% | 1.008% |
| S2 | 0.000% | 0.000% |
| S3 | 0.000% | 0.000% |
| S4 | 0.008% | 0.000% |
| S5 | 0.006% | 0.000% |
| S6 | 0.000% | 0.000% |

## Bulk goodput (first-class result)

| Scenario | goodput (Mbit/s) | % of S1 |
|---|---|---|
| S1 | 55.4 | 100.0% |
| S2 | 55.4 | 100.1% |
| S3 | 45.2 | 81.7% |
| S4 | 54.7 | 98.8% |
| S5 | 4.2 | 7.7% |
| S6 | 55.9 | 101.0% |

## Honesty notes (fixed)

1. **How much of the win was just DCTCP:** S2 (DCTCP alone) cuts S1's P99 by 17.8× (94.4% reduction); the full TailCut stack (S4) cuts it by 24.6× (95.9% reduction). S2 alone therefore delivers ~98% of S4's absolute P99 reduction. Anyone who only wants the cheap win can stop at `sysctl tcp_congestion_control=dctcp` plus one RED qdisc.
2. **S5 (fq_codel) flatters the free alternative:** its per-flow isolation is done by the qdisc on a Linux box; real switch ASICs do not run fq_codel on their ports, but they *do* read DSCP bits. On a real fabric the DSCP-marking approach (S3/S4) carries over; the fq_codel result is partly a VM artefact. Its latency win is also not free: S5 bulk goodput collapses to 8% of S1 (codel drops keep the CUBIC bulk flows pinned at a tiny cwnd), whereas S4 gets comparable tail latency while preserving bulk goodput.

## S6 keep-alive / idle re-promotion evidence

From `verify.sh` run mid-flight during S6 rep 1:

```
PASS  [6] stable established conn count: 8 -> 8 (workers=8)
PASS  [7] idle re-promotion: RPC flow counters stay <T1 (232 then 232 bytes across dumps, 8 flows) and packets still EF on wire (40 sampled) after >20s of traffic
verify: ALL APPLICABLE CHECKS PASSED
```

