# Arm 1 — exact launch procedure (one-shot, no workflow)

> Written at plan step 5.4/5.5, **before** the `tailcut-01-baseline` snapshot, so that run-day is copy-paste only.
> Lives in this repo rather than in the VM's home directory **because of the Snapshot Law** — anything not pushed does not survive the restore that precedes each arm.
>
> The prompt below is the frozen wording from [doc 13 §2.5](../../13-experiment-protocol-and-judging-rubric.md), **including amendment AM7** (2026-08-04: commit to `main`, no branches/PRs, use the configured git identity). Do not improvise it.

## Step 1 — launch

Run in the VM, from arm 1's workspace:

```bash
cd ~/dev/claude/agentic-hq/tailcut-no-workflow

claude --allowedTools="Bash Edit Write MultiEdit mcp__mcp-atlassian__jira_get_issue mcp__mcp-atlassian__jira_create_issue mcp__mcp-atlassian__jira_add_comment mcp__mcp-atlassian__confluence_get_page mcp__mcp-atlassian__confluence_search mcp__mcp-atlassian__jira_get_transitions mcp__mcp-atlassian__jira_transition_issue mcp__mcp-atlassian__jira_search mcp__mcp-atlassian__jira_update_issue"
```

**Why exactly this grant** (doc 13 §2.2): it is the AHQ CLI's `DEFAULT_ALLOWED_TOOLS` verbatim — four core tools plus the nine Atlassian MCP tools — **minus** the two arm-2-only entries (`Skill(agentic-hq-core-plugin:self-termination)` and `Read(<ahq-install>/.agentic-hq)`), which exist to make the workflow machinery work and grant nothing toward building TailCut.

**Do not add `--dangerously-skip-permissions`.** Arm 2 is confined to this list; a blanket flag would hand arm 1 strictly more freedom and quietly invert the comparison.

**Do not pass `--model`.** Neither arm does; both inherit the VM default (`claude-opus-5[1m]`, effort `high`), which is what makes them identical.

`WebSearch`/`WebFetch` are deliberately **not** in this flag — they come from `.claude/settings.local.json` in the workspace, the same mechanism used for arm 2.

## Step 2 — paste this prompt verbatim, then leave it alone

```
Build the system described in ./tailcut-benchmark-spec.md, in this repository.

You are running fully autonomously — there is no human available for the whole
run. Do not ask questions and do not wait for approval. Wherever you would
normally ask, choose the option you would have recommended, write the decision
and its reason down, and continue.

Deliverables:
  - Everything listed in the spec's "Deliverables & acceptance criteria" section.
  - RESULTS.md at the repo root containing: what you built; how to build and run
    it from a clean clone; your measured headline numbers (per-scenario P50, P99,
    P99.9, deadline-miss rates, bulk goodput); a pass/fail self-assessment
    against the spec's acceptance criteria 1-7; and a list of known gaps and
    shortcuts.
  - All of it committed and pushed to this repository's GitHub remote (gh is
    installed and authenticated). Work that is not pushed will be lost.
    Commit directly to the main branch - do not create feature branches and do
    not open pull requests. Use the git identity already configured in this
    repository; do not set user.name or user.email yourself.

Run the benchmark yourself and report the real numbers. If a target is not met,
report that honestly rather than adjusting the measurement to reach it.

Stop when the deliverables are complete and pushed.
```

## Step 3 — on completion (plan step 6.2)

1. Record wall-clock start/end and how it ended (completed / stalled / crashed) into doc 13 §2.6.
2. Confirm the work is pushed: `git -C ~/dev/claude/agentic-hq/tailcut-no-workflow log origin/main --oneline | head`.
3. Capture `RESULTS.md` + `results/` into `../arm-1/`.
4. `/git:02`, verify pushed, **then** snapshot `tailcut-02-arm1-complete` and restore `tailcut-01-baseline`.
