# Arm 2 — exact launch procedure (`birgitta-ousterhout-full-build`)

> Written at plan step 5.4/5.5, **before** the `tailcut-01-baseline` snapshot. Kept in this repo for the same Snapshot-Law reason as arm 1's.

## Step 1 — launch

Run in the VM, from arm 2's workspace:

```bash
cd ~/dev/claude/agentic-hq/tailcut

agentic-hq full-build -- --spec-file=./tailcut-benchmark-spec.md
```

**The `cd` is load-bearing, not cosmetic.** The AHQ CLI launches Claude Code with `cwd = process.cwd()` (verified in source: `ClaudeWorkflowCommandBuilder` receives `getCurrentUserWorkspace()`, whose `getRoot()` is `process.cwd()`). That is what makes arm 2's `.claude/settings.local.json` — and therefore its `WebSearch`/`WebFetch` grant — take effect. Launch from the AHQ repo instead and arm 2 silently loses web access that arm 1 has, breaking parity in exactly the dimension doc 13 §2.2 exists to pin down.

**No `--model` flag**, as everywhere else. The tool grant is fixed by the CLI and must not be varied.

**Spec path:** the workflow's own default is `./docs/spec.md`; we pass `--spec-file` explicitly so both arms read a byte-identical file at an identical path (`tailcut-benchmark-spec.md`, md5 `f2309082dc009aa0b46454b436317a50`).

## Step 2 — leave it alone

There is no prompt to paste. The workflow interrogates the spec and drives itself through 2 + 7N + 3 stages in fresh sessions. The three properties doc 13 §2.5 requires of both arms reach arm 2 through the workflow itself, not through an operator prompt:

| Property | How arm 2 gets it |
|---|---|
| Full autonomy, no human available | *The No-Human-Available Policy* section, present in every one of the 12 command files |
| `RESULTS.md` required | Command 12 (E3), Step 3 |
| Commit to `main`, no branches | Structural — `branch`, `checkout`, `PR` and `pull request` appear **nowhere** in the 12 command files; every stage commits in place on the checked-out branch |
| Push | **It does not push — see below** |

## Step 3 — ⚠️ THE OPERATOR MUST PUSH (plan step 6.4)

**Arm 2 never pushes.** Command 12 (E3) Step 4 is titled *"Final Commit — No Push"* and states: *"Pushing is the operator's deliberate post-run step; the run has zero network/auth dependency by design."*

Under the Snapshot Law an unpushed arm-2 run is **destroyed** by the restore that follows it, and cannot be regenerated. So, once the run ends:

```bash
cd ~/dev/claude/agentic-hq/tailcut
git log --oneline | head -20          # confirm the run's commits exist locally
git push -u origin main
git log origin/main --oneline | head  # confirm they are actually on GitHub
```

**The driving agent must not say "safe to snapshot" or "safe to restore" for arm 2 until `git log origin/main` shows the run's commits.** This is recorded in doc 13 §10 as well, because forgetting it is unrecoverable.

## Step 4 — on completion (plan step 6.4/6.5)

1. Record wall-clock start/end and how it ended into doc 13 §2.6; note the pass count and whether `MAX_PASSES` was hit (a silent truncation reads as completion).
2. Capture `RESULTS.md` + `results/` into `../arm-2/`.
3. `/git:02`, verify pushed, then snapshot `tailcut-03-arm2-complete`.
