# TailCut benchmark report

All numbers from a VM — **only relative comparisons between scenarios are meaningful**. Latency percentiles pooled across reps after discarding the first 5 s of each rep as warm-up. Latency unit: µs.

## Latency percentiles

| Scenario | Description | N | P50 | P90 | P99 | P99.9 | max | retrans Δ |
|---|---|---|---|---|---|---|---|---|
| S1 | CUBIC + deep FIFO (baseline) | 171,567 | 3,042 | 4,235 | 186,680 | 464,986 | 533,131 | 6,350 |
| S2 | DCTCP + RED/ECN | 256,453 | 3,829 | 8,057 | 9,476 | 16,520 | 24,149 | 583 |
| S3 | CUBIC + prio + marker | 300,069 | 3,806 | 5,992 | 12,041 | 25,492 | 322,887 | 232,850 |
| S4 | DCTCP + prio/RED + marker (TailCut) | 367,519 | 3,328 | 4,349 | 6,537 | 13,200 | 50,910 | 1,171 |
| S5 | CUBIC + fq_codel (free competitor) | 425,222 | 2,923 | 3,575 | 5,125 | 11,129 | 192,276 | 2,414 |
| S6 | as S4, keep-alive client | 12,960 | 1,357 | 1,752 | 3,639 | 7,866 | 9,003 | 46 |

## Ratios vs S1 (baseline)  — higher = bigger win

| Scenario | P50 | P99 | P99.9 |
|---|---|---|---|
| S2 | 0.8× | 19.7× | 28.1× |
| S3 | 0.8× | 15.5× | 18.2× |
| S4 | 0.9× | 28.6× | 35.2× |
| S5 | 1.0× | 36.4× | 41.8× |
| S6 | 2.2× | 51.3× | 59.1× |

## Deadline-miss rates

A bid that misses the cutoff earns zero regardless of how little it missed by. 100 ms models an RTB auction cutoff; 200 ms a page-speed abandon budget.

| Scenario | miss >100 ms | miss >200 ms |
|---|---|---|
| S1 | 1.415% | 0.954% |
| S2 | 0.000% | 0.000% |
| S3 | 0.007% | 0.001% |
| S4 | 0.000% | 0.000% |
| S5 | 0.007% | 0.000% |
| S6 | 0.000% | 0.000% |

## Bulk goodput (first-class result)

| Scenario | goodput (Mbit/s) | % of S1 |
|---|---|---|
| S1 | 55.6 | 100.0% |
| S2 | 55.8 | 100.3% |
| S3 | 46.3 | 83.2% |
| S4 | 55.4 | 99.7% |
| S5 | 4.6 | 8.3% |
| S6 | 55.9 | 100.5% |

## Honesty notes (fixed)

1. **How much of the win was just DCTCP:** S2 (DCTCP alone) cuts S1's P99 by 19.7× (94.9% reduction); the full TailCut stack (S4) cuts it by 28.6× (96.5% reduction). S2 alone therefore delivers ~98% of S4's absolute P99 reduction. Anyone who only wants the cheap win can stop at `sysctl tcp_congestion_control=dctcp` plus one RED qdisc.
2. **S5 (fq_codel) flatters the free alternative:** its per-flow isolation is done by the qdisc on a Linux box; real switch ASICs do not run fq_codel on their ports, but they *do* read DSCP bits. On a real fabric the DSCP-marking approach (S3/S4) carries over; the fq_codel result is partly a VM artefact. Its latency win is also not free: S5 bulk goodput collapses to 8% of S1 (codel drops keep the CUBIC bulk flows pinned at a tiny cwnd), whereas S4 gets comparable tail latency while preserving bulk goodput.

## S6 keep-alive / idle re-promotion evidence

From `verify.sh` run mid-flight during S6 rep 1:

```
PASS  [6] stable established conn count: 8 -> 8 (workers=8)
PASS  [7] idle re-promotion: RPC flow counters stay <T1 (232 then 232 bytes across dumps, 8 flows) and packets still EF on wire (40 sampled) after >20s of traffic
verify: ALL APPLICABLE CHECKS PASSED
```

