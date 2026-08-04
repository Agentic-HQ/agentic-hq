# Arm 1 capture — doc 13 §6 (plan step 6.2)

Captured 2026-08-04 in the VM, after arm 1 completed and before the
`tailcut-02-arm1-complete` snapshot. Arm repo: `Agentic-HQ/tailcut-no-workflow`,
final commit `7949ee5` on `main` (push verified from the Mac 20:55 UTC and
re-verified locally: workspace HEAD == origin/main).

## Contents

| File / dir | What it is |
|---|---|
| `RESULTS.md` | The arm's own results + self-assessment (§2.4), extracted from commit `7949ee5` |
| `results/` | The arm's curated results tree from `7949ee5`: `report.md`, `chart.png`, `summary.json`, per-rep `verify.txt` / `meta.json` / `tc_stats.txt` / `marker_dump.txt` |
| `arm-run_all.log` | The arm's own benchmark run log — gitignored in the arm repo, so this copy is the only pushed one |
| `arm-1-final-session-message.md` | The arm's closing self-report, captured verbatim (Mac, 6.1) |
| `arm-1-informal-analysis-tailcut-usefulness.md` | Post-run informal Q&A (not part of the protocol) |
| `rerun/` | The driving agent's fresh-clone re-run (§3): build log, both full-run logs, both runs' reports, verify outputs, gate table |
| `rerun/gate-table.md` | Gates G1–G12 + traps T1–T4 + §3.2 measurement-integrity check |

## Capture-form note (AM9, doc 13 §10)

Raw per-rep data (`rpc.csv`, `bulk.jsonl`, nstat snapshots — ~41 MB, ~10 MB
compressed) is **not** committed here, per Golden Rule 11 (metered connection).
The §3.2 integrity comparison was performed in the VM against the raw data
before it was left behind. The full raw state is preserved in the
`tailcut-02-arm1-complete` VMware snapshot.

## Out-of-workspace changes by the arm (capture item 5)

`setup_topology.sh` makes three root-namespace (host-level) changes, disclosed
in the arm's RESULTS.md as "single-box realism tuning" and commented in the
script, which `teardown.sh` does **not** revert:

1. `modprobe tcp_dctcp` (module stays loaded until reboot)
2. `sysctl net.ipv4.tcp_allowed_congestion_control="reno cubic dctcp"` (host-wide)
3. `echo 0 > /sys/module/tcp_cubic/parameters/hystart` (host-wide)

Everything else is confined to the four network namespaces, which teardown
destroys. None of the three survives the snapshot restore that follows this
capture; noted for G8's "leaves the VM clean" nuance and for doc 15.

Nothing else was installed (no `apt` activity; all tools were pre-installed at
plan step 5.1). The arm never used its `WebSearch`/`WebFetch` grant (session
transcript checked — zero calls).
