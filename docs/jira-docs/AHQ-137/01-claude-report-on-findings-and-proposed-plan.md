# AHQ-137 — Claude Report: Findings and Proposed Plan (No Changes Made Yet)

> **Jira:** [AHQ-137](https://agentic-hq.atlassian.net/browse/AHQ-137) — "LaunchDay: When GitHub Repo Goes Public: Enable Privately reporting a security vulnerability"
> **Date:** 2026-07-18 (launch day — the repo was flipped public earlier the same day)
> **Written by:** Claude (Fable 5), in an interactive Claude Code session with Steve
> **Status of this doc:** investigation + proposal only. **Nothing has been changed** — no GitHub settings, no repo files (other than creating this report).

## 1. Steve's Original Prompt (Verbatim)

> Please read directly using MCP tool AHQ-137 and investigate and tell me what you'd plan to do to sort this out, without making any changes yet

followed by:

> Actually, please put all your findings and proposed changes (including updating docs that refer to this) at: docs/jira-docs/AHQ-137/01-claude-report-on-findings-and-proposed-plan.md

## 2. What the Jira Asks For

Enable **GitHub Private Vulnerability Reporting (PVR)** on
`Agentic-HQ/agentic-hq` now that the repo is public. When enabled, a
**"Report a vulnerability"** button appears in the repo's
[Security tab](https://github.com/Agentic-HQ/agentic-hq/security), giving
researchers a private, GitHub-native reporting channel that exposes no
personal contact info. This is one of the two SECURITY.md report channels
chosen under AHQ-133 (Q16); the other is the agentichq.ai contact form. The
ticket notes it could not be enabled while the repo was private, so it was
slotted into the public-launch checklist.

## 3. Findings

### 3.1 GitHub state (verified 2026-07-18, via authenticated `gh` CLI)

- **Repo visibility:** `PUBLIC` (`gh repo view --json visibility,isPrivate` →
  `{"isPrivate": false, "visibility": "PUBLIC"}`). The blocker named in the
  Jira is gone.
- **Private Vulnerability Reporting:**
  `GET /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting` →
  **`{"enabled": false}`** — not yet enabled. This is the gap.
- **Security policy:** GitHub already serves SECURITY.md at
  <https://github.com/Agentic-HQ/agentic-hq/security/policy>
  (`securityPolicyUrl` is set), so the Security tab exists and points
  researchers at SECURITY.md — whose *preferred* channel is currently a
  dead-end (no "Report a vulnerability" button until PVR is enabled).

### 3.2 One correction to the Jira description — RESOLVED (Steve fixed the Jira, 2026-07-18)

The ticket originally said *"It's a settings UI click, not a file change.
Nothing in this repo can enable it for you."* The UI click works, but there
is also a supported API route, so it **can** be done from this session with
the already-authenticated `gh` CLI:

```
PUT /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting   (returns 204)
```

**Steve corrected the Jira description on 2026-07-18 (14:50 BST):** the old
sentence is struck through in place, followed by an *UPDATED:* note stating
that merging the PR can't enable it but the settings UI click or the
`gh api --method PUT` call above can. Verified by re-fetching the issue.

Per the norm agreed in the AHQ-140 report (§4) earlier today, Claude will
**not** apply GitHub settings mutations without explicit approval — hence
this proposal-first doc.

### 3.3 Repo files that refer to this (full audit)

| File | What it says | Needs changing? |
|---|---|---|
| [`SECURITY.md`](../../../SECURITY.md) lines 9–11 | A NOTE block: PVR *"isn't possible to enable"* until the repo is public, links AHQ-137, and offers the agentichq.ai form as the fallback while the button is missing. | **Yes — remove once PVR is enabled.** It becomes false the moment the button exists. (Minor: the NOTE also quotes the ticket title as "PostLaunch: …" but the Jira summary is now "LaunchDay: …" — moot once the block is deleted.) |
| [`SECURITY.md`](../../../SECURITY.md) lines 13–15 | "Preferred — GitHub Private Vulnerability Reporting" channel with Security-tab instructions. | No — becomes fully accurate once PVR is enabled. |
| [`CODE_OF_CONDUCT.md`](../../../CODE_OF_CONDUCT.md) line 46 | Offers "GitHub's private vulnerability-reporting mechanism" as a CoC-violation report channel. | No — becomes fully accurate once PVR is enabled. |
| [`README.md`](../../../README.md) line 249 | Just links to SECURITY.md. | No. |
| [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) line 58 | Just links to SECURITY.md. | No. |
| [`docs/jira-docs/AHQ-133/03-summary-of-what-was-done.md`](../AHQ-133/03-summary-of-what-was-done.md) line 87 | AHQ-133's follow-ups table lists enabling PVR (owner: Steve, Jira: AHQ-137) as outstanding. | No — historical record of the AHQ-133 work; jira-docs are left as written. |
| `docs/jira-docs/AHQ-185/…`, `AHQ-157/…`, `AHQ-160/…` | Mention the SECURITY.md NOTE in passing (review/audit snapshots). | No — historical records. |

## 4. Proposed Plan (Awaiting Steve's Go-Ahead)

**Step 1 — Enable PVR** (one of, Steve's choice):

- **(a) Claude runs it** (after approval):
  `gh api --method PUT /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting`
  — expected response: HTTP 204, no body.
- **(b) Steve clicks it**: <https://github.com/Agentic-HQ/agentic-hq/settings/security_analysis>
  → find **"Private vulnerability reporting"** → **Enable**.

Free, reversible (same endpoint with DELETE, or the same UI toggle), and
nothing becomes public — reports land in a Security Advisories area visible
only to repo admins.

**Step 2 — Verify:**

- `GET /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting` returns
  `{"enabled": true}`.
- Steve eyeballs the [Security tab](https://github.com/Agentic-HQ/agentic-hq/security)
  in a browser: the **"Report a vulnerability"** button should appear under
  Advisories within seconds.

**Step 3 — Update SECURITY.md** (the only file change; do it only after
Steps 1–2 succeed, otherwise the NOTE is still true): delete the
now-obsolete NOTE block, i.e. remove lines 9–11:

```markdown
NOTE: Until the Agentic HQ repo has been made public, it isn't possible to enable "Private Vulnerability Reporting".  This is due to be done under Jira:
https://agentic-hq.atlassian.net/browse/AHQ-137 - PostLaunch: When GitHub Repo Goes Public: Enable Privately reporting a security vulnerability
as soon as the project is made public.  If the links below don't work, please report this via the contact form at https://agentichq.ai/
```

No replacement text is needed — the surrounding sections already describe
both channels correctly, and the fallback the NOTE offered (agentichq.ai
form) is already the documented "Alternative" channel immediately below it.

**Step 4 — Wrap-up (Steve's call):**

- Commit the SECURITY.md change via the `/commit` command.
- Comment on / transition AHQ-137 in Jira.

## 5. Optional Items (Not Required by the Jira — Flagged Separately)

- **Notifications:** the Jira description itself notes PVR *"doesn't email
  you by default — check the Security tab, or set up notifications under
  your GitHub notification settings."* Since Steve is the only admin, it may
  be worth checking that new private reports will actually surface somewhere
  he looks (GitHub notification settings → watching/security alerts). This
  is a personal-account settings check, so it is Steve-only either way.
- Nothing else. Per the "fix only the gap" convention, the plan above is
  deliberately minimal: enable, verify, remove the one stale doc block.
