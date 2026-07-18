# AHQ-137 — Claude Report: Execution and Testing

> **Jira:** [AHQ-137](https://agentic-hq.atlassian.net/browse/AHQ-137) — "LaunchDay: When GitHub Repo Goes Public: Enable Privately reporting a security vulnerability"
> **Date:** 2026-07-18 (launch day)
> **Written by:** Claude (Fable 5), in an interactive Claude Code session with Steve
> **Precedes this doc:** [`01-claude-report-on-findings-and-proposed-plan.md`](01-claude-report-on-findings-and-proposed-plan.md) — the investigation and the plan executed below.

## 1. Steve's Go-Ahead Prompt (Verbatim)

> OK, let's execute the plan and the testing (including my eyeballing) and put the results/details in docs/jira-docs/AHQ-137/02-claude-report-on-execution-and-testing.md

## 2. Step 1 — Enable Private Vulnerability Reporting (Done)

Executed via the already-authenticated `gh` CLI at **2026-07-18 13:52:56 GMT**:

```
gh api --method PUT /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting
```

Response: **`HTTP/2.0 204 No Content`** — exactly as predicted in the plan
(report 01, §4 Step 1a).

## 3. Step 2 — Verification / Testing (All Passed)

Three independent checks, from three different vantage points:

### 3.1 API check (authoritative)

```
GET /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting
→ {"enabled": true}
```

(Was `{"enabled": false}` when checked during the investigation, ~an hour
earlier — see report 01, §3.1.)

### 3.2 Steve's eyeball check (admin view) — passed, with a UI surprise

Steve opened the repo's Security tab while signed in as admin and initially
reported *"It looks like there is no button, but maybe UI is different???"*
— pasting the page content, which included the decisive line:

> **Private vulnerability reporting • Enabled**
> Allow users to privately report potential security vulnerabilities
> See reported vulnerabilities

**Explanation of the surprise (corrected later in the session — see §7):**
where the "Report a vulnerability" button appears depends on **who is
looking**, not on which sub-page:

- **Admins** (Steve, signed in) get a feature-status Overview at
  `/security` — it showed "Private vulnerability reporting • **Enabled**"
  plus admin-only links like "See reported vulnerabilities", but **no
  report button**.
- **The public** (verified in a signed-out browser) gets a policy-centric
  `/security` page: a green **"Report a vulnerability"** button at the top,
  with SECURITY.md rendered below it. The same button also appears on
  **Security → Advisories** (`/security/advisories`), the location GitHub's
  own docs describe.

So the absence of a button in Steve's view was the admin variant of the
page, not a failure — the audience SECURITY.md addresses does see it. Steve's paste also usefully snapshotted the neighbouring
statuses at launch: Security policy **Enabled**, Security advisories
**Enabled**, Dependabot alerts **Enabled**, Code scanning **Needs setup**,
Secret scanning **Disabled**, Code quality findings **Disabled**. (Those
last three are outside AHQ-137's scope — noted here purely as a record.)

### 3.3 Anonymous researcher view (what a reporter actually sees) — passed

Claude loaded <https://github.com/Agentic-HQ/agentic-hq/security/advisories>
in a **signed-out** Playwright browser session — i.e. exactly what an
external security researcher sees. The page showed:

- Heading **"Security Advisories"** with the text *"View known security
  vulnerabilities and report new vulnerabilities privately to maintainers."*
- A **"Report a vulnerability"** button/link → `/Agentic-HQ/agentic-hq/security/advisories/new`
- "There aren't any published security advisories" (correct — none exist).

This is the end-to-end proof: the channel SECURITY.md calls "Preferred" is
now reachable by an anonymous member of the public.

## 4. Step 3 — SECURITY.md Update (Done)

With PVR live, the stale NOTE block was deleted from `SECURITY.md`
(previously lines 9–11):

```markdown
NOTE: Until the Agentic HQ repo has been made public, it isn't possible to enable "Private Vulnerability Reporting".  This is due to be done under Jira:
https://agentic-hq.atlassian.net/browse/AHQ-137 - PostLaunch: When GitHub Repo Goes Public: Enable Privately reporting a security vulnerability
as soon as the project is made public.  If the links below don't work, please report this via the contact form at https://agentichq.ai/
```

No replacement text was added — the "Preferred" and "Alternative" channel
sections immediately below it were already accurate (report 01, §3.3
audited every other referencing file; none needed changes). A second,
unplanned SECURITY.md edit followed later in the session — see §7.

**Formatting check:** `pnpm format:check` (read-only) run after the edit —
*"All matched files use Prettier code style!"* — no drift introduced by the
SECURITY.md edit or these two report docs. No other validation was run:
this task changed no code, only Markdown and a GitHub setting.

## 5. How to Undo (For the Record)

Fully reversible at any time:

- **UI:** Settings → Advanced security → "Private vulnerability reporting" → Disable.
- **API:** `gh api --method DELETE /repos/Agentic-HQ/agentic-hq/private-vulnerability-reporting`

Disabling only removes the *intake channel*; any already-received reports
remain in the private Security Advisories area.

## 6. Status and Remaining Wrap-Up (Steve's Call)

- **AHQ-137's requested change is in place and triple-verified** (§3).
- **Uncommitted repo changes ready for `/commit`:** the two SECURITY.md
  edits (NOTE removal §4, reporting-instruction wording §7), plus the two
  AHQ-137 report docs (01 and 02).
- **Jira:** still In Progress; commenting/transitioning is Steve's call.
- **Optional (from the Jira's own "Cost / risk" note, not required):** PVR
  doesn't email by default — new private reports appear under
  Security → Advisories (admin view: "See reported vulnerabilities").
  Steve may want to check his GitHub notification settings so a report
  doesn't sit unseen; SECURITY.md promises acknowledgement within 7 days.
- **Follow-up Jiras created from this session's findings:** AHQ-187 and
  AHQ-188 — see §8.

## 7. Follow-Up (Same Session): SECURITY.md Reporting Instruction Made Accurate

Steve queried whether the `/security` link in SECURITY.md's "Preferred"
channel was wrong, given his eyeball check found no button there. Claude
loaded `/security` in the signed-out browser to settle it, and the finding
**corrected §3.2's original explanation** (now fixed above): the anonymous
public *does* get a green "Report a vulnerability" button at the top of
`/security` (element-screenshot verified, including the colour) — it is
specifically **admins** who get a different `/security` page (the
feature-status Overview) without the button.

So the link researchers follow was never broken, but the instruction's
wording didn't match what they'd see, and this supersedes report 01's §3.3
audit row that said the "Preferred" bullet needed no changes. The bullet
was updated (wording chosen by Steve from two options):

**Before:**

```markdown
- Go to the repository's [Security tab](https://github.com/Agentic-HQ/agentic-hq/security) and click **"Report a vulnerability"**.
```

**After:**

```markdown
- Go to the repository's [Security tab](https://github.com/Agentic-HQ/agentic-hq/security) (likely this page) and click the green **"Report a vulnerability"** button at the top.
```

"(likely this page)" works because the main public route to SECURITY.md
*is* the `/security` page, which renders the policy directly beneath the
button; the hyperlink is kept for readers arriving via the Code-tab file
view or a local clone. The maintainer edge case (no button on the admin
`/security` view; use `/security/advisories` instead) is documented here
rather than in SECURITY.md, whose audience is external researchers.

## 8. Follow-Up Jiras Created (Security-Tab Neighbours)

Steve's admin-view paste in §3.2 also snapshotted the *other* security
features' statuses, and he asked whether any deserved a launch-day Jira.
Claude's assessment (drafted as Jira descriptions in `~/tmp/`, outside the
repo; Steve created the issues from them on 2026-07-18):

- **[AHQ-187](https://agentic-hq.atlassian.net/browse/AHQ-187) —
  "LaunchDay: Enable Secret Scanning Alerts + Push Protection"**
  (label LaunchDay, status Selected for Development at creation).
  Judged launch-day-worthy: the leak risk started the moment the repo went
  public, push protection guards all future pushes (which no local tooling
  can), and the enable-time full-history scan doubles as an independent
  check of the AHQ-171 pre-launch scrub.
- **[AHQ-188](https://agentic-hq.atlassian.net/browse/AHQ-188) —
  "PostLaunch: Enable CodeQL Code Scanning (Default Setup)"**
  (label PostLaunch, status Backlog at creation).
  Judged not launch-critical: its value accrues over future PRs, and it
  creates an alert queue needing deliberate triage.
- **"Code quality findings" — deliberately no Jira.** It substantially
  duplicates the existing `pnpm validate` tooling (ESLint, Prettier,
  typecheck); the decision is recorded in AHQ-188's description as
  explicitly out of scope.

Both issues were verified by re-fetching them from Jira after creation.
