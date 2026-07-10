# Steve How To… Run The Jira Manual Backfill On The Public Repo

**Plan step:** 13 (Phase C) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** after the public repo is connected to the GitHub-for-Jira app (guide 04) and its
automatic initial sync has finished.

## Why

A newly connected repo only gets backfilled **6 months** deep (and only the latest 50 commits
on non-default branches). The project's first commit is **2025-08-01**, so without a manual
backfill the older, Done AHQs get no dev-panel links in Jira.

## Steps (needs org/site admin)

1. Open the **GitHub for Atlassian configuration page** (verified URL):
   `https://agentic-hq.atlassian.net/plugins/servlet/ac/com.github.integration.production/spa-index-page?ac.from=homepage`
   (Menu route: Jira **Settings (gear) → Jira apps** → **GitHub for Atlassian** in the left
   sidebar. Don't follow Atlassian's backfill doc's own navigation — its "Apps → Manage apps"
   path is retired.)
2. Click the **settings (gear) icon** next to the **Agentic-HQ** GitHub organization, then
   **Continue backfill**.
3. **Select the date to start importing from:** `2025-08-01` (or earlier) → **Backfill data**.
4. Leave the **"Restart the backfill"** checkbox **unticked** — default is additive (adds the
   pre-6-month history); ticking it would wipe and re-import everything instead.

## Verify (plan step 13's test, with the AI session)

- Backfill status on that page reaches **FINISHED** with "Backfilled from" ≤ 2025-08-01.
- Open an old, Done AHQ (e.g. AHQ-6) in Jira — the dev panel shows its commits.
- Then the live test: one commit on `main` against a test Jira, and one branch + PR +
  squash-merge against another — both should appear in their dev panels.
