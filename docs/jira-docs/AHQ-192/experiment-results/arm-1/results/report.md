# TailCut benchmark report

All numbers from a VM — **only relative comparisons between scenarios are meaningful**. Latency percentiles pooled across reps after discarding the first 5 s of each rep as warm-up. Latency unit: µs.

## Latency percentiles

| Scenario | Description | N | P50 | P90 | P99 | P99.9 | max | retrans Δ |
|---|---|---|---|---|---|---|---|---|
| S1 | CUBIC + deep FIFO (baseline) | 167,953 | 3,064 | 4,425 | 183,869 | 476,277 | 577,261 | 7,097 |
| S2 | DCTCP + RED/ECN | 240,357 | 4,218 | 8,359 | 13,480 | 25,137 | 197,104 | 722 |
| S3 | CUBIC + prio + marker | 309,276 | 3,746 | 5,784 | 11,482 | 19,071 | 52,238 | 223,642 |
| S4 | DCTCP + prio/RED + marker (TailCut) | 317,106 | 3,652 | 5,563 | 10,402 | 20,444 | 193,455 | 1,011 |
| S5 | CUBIC + fq_codel (free competitor) | 426,006 | 2,904 | 3,539 | 5,433 | 11,749 | 172,616 | 1,906 |
| S6 | as S4, keep-alive client | 12,966 | 1,329 | 1,839 | 4,537 | 8,066 | 13,133 | 67 |

## Ratios vs S1 (baseline)  — higher = bigger win

| Scenario | P50 | P99 | P99.9 |
|---|---|---|---|
| S2 | 0.7× | 13.6× | 18.9× |
| S3 | 0.8× | 16.0× | 25.0× |
| S4 | 0.8× | 17.7× | 23.3× |
| S5 | 1.1× | 33.8× | 40.5× |
| S6 | 2.3× | 40.5× | 59.1× |

## Deadline-miss rates

A bid that misses the cutoff earns zero regardless of how little it missed by. 100 ms models an RTB auction cutoff; 200 ms a page-speed abandon budget.

| Scenario | miss >100 ms | miss >200 ms |
|---|---|---|
| S1 | 1.453% | 0.962% |
| S2 | 0.016% | 0.000% |
| S3 | 0.000% | 0.000% |
| S4 | 0.004% | 0.000% |
| S5 | 0.006% | 0.000% |
| S6 | 0.000% | 0.000% |

## Bulk goodput (first-class result)

| Scenario | goodput (Mbit/s) | % of S1 |
|---|---|---|
| S1 | 55.6 | 100.0% |
| S2 | 55.3 | 99.6% |
| S3 | 44.9 | 80.9% |
| S4 | 55.0 | 98.9% |
| S5 | 4.3 | 7.7% |
| S6 | 56.0 | 100.7% |

## Honesty notes (fixed)

1. **How much of the win was just DCTCP:** S2 (DCTCP alone) cuts S1's P99 by 13.6× (92.7% reduction); the full TailCut stack (S4) cuts it by 17.7× (94.3% reduction). S2 alone therefore delivers ~98% of S4's absolute P99 reduction. Anyone who only wants the cheap win can stop at `sysctl tcp_congestion_control=dctcp` plus one RED qdisc.
2. **S5 (fq_codel) flatters the free alternative:** its per-flow isolation is done by the qdisc on a Linux box; real switch ASICs do not run fq_codel on their ports, but they *do* read DSCP bits. On a real fabric the DSCP-marking approach (S3/S4) carries over; the fq_codel result is partly a VM artefact. Its latency win is also not free: S5 bulk goodput collapses to 8% of S1 (codel drops keep the CUBIC bulk flows pinned at a tiny cwnd), whereas S4 gets comparable tail latency while preserving bulk goodput.

## S6 keep-alive / idle re-promotion evidence

From `verify.sh` run mid-flight during S6 rep 1:

```
PASS  [6] stable established conn count: 8 -> 8 (workers=8)
PASS  [7] idle re-promotion: RPC flow counters stay <T1 (232 then 232 bytes across dumps, 8 flows) and packets still EF on wire (40 sampled) after >20s of traffic
verify: ALL APPLICABLE CHECKS PASSED
```

