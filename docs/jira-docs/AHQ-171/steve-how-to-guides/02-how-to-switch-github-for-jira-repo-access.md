# Steve How To… Switch GitHub-for-Jira To "Only Select Repositories"

**Plan step:** 10 (Phase C) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** after the local rewrites are verified (steps 5–9), **before any new repo is created**.

## Why this must come first

The org's GitHub-for-Jira connection currently has **"All repos" access** — it auto-connects
every new repository. Left as-is, the archive repo + renamed private repo + public repo would
all sync to Jira and produce **triple dev-panel entries** per AHQ. Switching to "Only select
repositories" first means the new repos connect only when *you* select them (and only the
public repo ever gets selected, at step 13).

## Steps (GitHub side — you need org admin)

1. Go to the **Agentic-HQ org** → **Settings** → **GitHub Apps** (under Third-party Access /
   Integrations) → find the **Jira** app → **Configure**.
2. Under **Repository access**, change **All repositories** → **Only select repositories**.
3. In the repository picker, select **only** the current repo (`agentic-hq` — at this point
   it hasn't been renamed yet). This keeps existing Jira sync working until the cutover.
4. Save.

*(Alternative route if you prefer the Jira side: the GitHub for Atlassian configuration page —
URL in guide 05 — has a Settings column per organization; look for repository access there.)*

## Verify

Open the GitHub for Atlassian configuration page (URL in guide 05) — Repository access for
the Agentic-HQ org should now show "Only select repositories" with 1 repo, not "All repos".
