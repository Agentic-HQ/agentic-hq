# AHQ-140 — Claude Report: Main Branch Protection (Including What Was Done)

> **Jira:** [AHQ-140](https://agentic-hq.atlassian.net/browse/AHQ-140) — "LaunchDay: Protect Main Branch From Force Push Or Deletion"
> **Date:** 2026-07-18 (launch day — the repo was flipped public earlier the same day)
> **Written by:** Claude (Fable 5), in an interactive Claude Code session with Steve

## 1. Steve's Original Prompt (Verbatim)

> OK, repo is now public. Please download AHQ-140 using MCP direct and help me check/fix/change that setting

## 2. The Situation (Research Findings)

**What the Jira asks for.** AHQ-140 says that on launch day — before adding
maintainers who have write access — the `main` branch should be protected from
force pushing and deletion. It notes this protection is only available for free
on public repos, which is why it had to wait for launch day.

**State of the repo when checked (2026-07-18, immediately after going public):**

- **Classic branch protection on `main`:** none.
  `GET /repos/Agentic-HQ/agentic-hq/branches/main/protection` returned
  `404 "Branch not protected"`. (This endpoint needs admin auth, so it isn't
  browser-clickable — the equivalent UI is
  [Settings → Branches](https://github.com/Agentic-HQ/agentic-hq/settings/branches),
  admin login required.)
- **Repository rulesets:** none.
  [`GET /repos/Agentic-HQ/agentic-hq/rulesets`](https://api.github.com/repos/Agentic-HQ/agentic-hq/rulesets)
  returned `[]`.
- **Branch flags:**
  [`GET /repos/Agentic-HQ/agentic-hq/branches/main`](https://api.github.com/repos/Agentic-HQ/agentic-hq/branches/main)
  showed `"protected": false` with protection `"enabled": false`.

(The linked `api.github.com` URLs are plain GETs that render JSON in a
browser; they are publicly readable now the repo is public — of course they
show the *current* state, not the pre-change state quoted above.)

So `main` was completely unprotected: anyone with write access (currently only
the owner, but the Jira's whole point is future maintainers) could force-push
over history or delete the branch outright.

**Mechanism chosen: repository ruleset, not classic branch protection.**
GitHub offers two mechanisms. Classic branch protection is configured via a
single PUT that requires specifying the whole config surface (status checks,
review requirements, push restrictions) even when you only want two rules.
Repository rulesets are GitHub's current recommended mechanism, are free on
public repos, and allow adding exactly the rules needed and nothing else —
which matches the Jira's narrow scope (force-push + deletion only).

## 3. What Was Done

One ruleset was created via the GitHub API (using the already-authenticated
`gh` CLI):

```
POST /repos/Agentic-HQ/agentic-hq/rulesets
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
```

Result: ruleset **`protect-main`**, id **19143091**, created
2026-07-18T14:19:18+01:00, enforcement **active**.

- **Public read-only view:** <https://github.com/Agentic-HQ/agentic-hq/rules/19143091>
- **Manage/edit (admin login):** [Settings → Rules → Rulesets](https://github.com/Agentic-HQ/agentic-hq/settings/rules)
- **Raw JSON:** [`GET /repos/Agentic-HQ/agentic-hq/rulesets`](https://api.github.com/repos/Agentic-HQ/agentic-hq/rulesets)

**Design choices in that JSON:**

- `~DEFAULT_BRANCH` rather than the literal `main` — the rule follows the
  default branch even if it is ever renamed.
- `deletion` + `non_fast_forward` only — exactly what AHQ-140 asks for; no
  bundled extras (no required PRs, no required status checks).
- **No bypass actors** (`bypass_actors: []`, so `current_user_can_bypass:
  "never"`) — even the repo owner cannot force-push while the ruleset is
  active. This is not a lockout: repo **admins** can edit, disable, or delete
  the ruleset itself at any time in Settings, whereas future maintainers with
  plain write access cannot touch it. That is precisely the
  "protect before adding maintainers" property the Jira wants.

**Verification (immediately after creation):**

- [`GET /repos/Agentic-HQ/agentic-hq/rules/branches/main`](https://api.github.com/repos/Agentic-HQ/agentic-hq/rules/branches/main)
  (the *effective rules* endpoint) returned both rules live on `main`:
  `{"ruleset_id":19143091,"type":"deletion"}` and
  `{"ruleset_id":19143091,"type":"non_fast_forward"}`.
- No test force-push was attempted: this project's rules ban Claude running
  `git push` directly, and the effective-rules endpoint is authoritative for
  what GitHub will enforce.

**To undo or change:** edit/delete the ruleset in
[Settings → Rules → Rulesets](https://github.com/Agentic-HQ/agentic-hq/settings/rules)
(admin login), or `DELETE /repos/Agentic-HQ/agentic-hq/rulesets/19143091`.
Fully reversible.

## 4. Why Claude Applied the Change Without Checking First

Steve asked for this section explicitly, so here is the honest accounting.

**The reasoning at the time:**

1. The prompt — "help me check/fix/change that setting" — read as a direct
   instruction to fix the setting, not just to investigate it. "Check" was
   done first (§2), and "fix/change" was taken as pre-authorised by the same
   sentence.
2. The change is cheaply and fully reversible (delete one ruleset, ~30
   seconds), and it is protective in direction — it *adds* a guard rail and
   cannot break the working tree, history, CI, or any collaborator's flow.
3. The operating guidance Claude runs under says to proceed without asking for
   reversible actions that follow directly from the request, and to reserve
   check-ins for destructive or scope-changing actions. This seemed to fit.

**The counterargument, acknowledged:** this was still a mutation of live
GitHub repo settings, on launch day, on a repo that had just become public —
and this project's conventions (e.g. the explicit-approval-before-commit rule)
signal that repo-state mutations deserve a confirmation step even when
technically reversible. A safer reading of the same prompt was: check the
setting, present findings plus the exact proposed ruleset JSON, and apply
after a yes. The gap between "check/fix/change" as authorisation versus as a
task list is real ambiguity, and under this project's norms the
confirm-first reading should probably have won.

**Norm going forward (unless Steve says otherwise):** for GitHub
settings/config mutations — rulesets, repo settings, integrations — Claude
will present the current state and the exact proposed change, and wait for
approval before applying, the same as the commit workflow.

## 5. Status and Follow-Ups

- AHQ-140's requested protection is **in place and verified** (§3).
- The Jira was still **In Progress** and untouched by Claude at the time of
  writing — commenting/transitioning it is Steve's call.
- Separate suggestion (Claude's proposal, *not* part of AHQ-140): once
  maintainers join, the same ruleset mechanism can also require PRs before
  merging to `main` and require the CI check to pass.
  - **Decision (Steve, 2026-07-18): not yet.** After reviewing Perplexity's
    recommendation to add require-PR/approvals/CI rules now
    ([`02-what-perplexity-says.md`](02-what-perplexity-says.md)) and Claude's
    assessment of it, Steve decided not to add a "every commit must have a PR"
    rule while he is the sole maintainer. Two reasons: it would outlaw the
    routine direct-to-main `/commit` workflow, and Perplexity's suggested
    "require 1 approval" is unworkable solo — GitHub does not let a PR author
    approve their own PR, so with no bypass actors nothing could ever merge.
  - **Revisit when the first maintainer joins:** add a `pull_request` rule
    with **0** required approvals plus `required_status_checks` requiring the
    CI job **`validate`** (shows as "CI / validate" on PRs); raise required
    approvals to 1 only when at least two people who can review exist.
