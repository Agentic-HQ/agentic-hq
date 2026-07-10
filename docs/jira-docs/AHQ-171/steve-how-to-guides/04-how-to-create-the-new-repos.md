# Steve How To… Create The Archive Repo And The Public Repo

**Plan steps:** 12–13 (Phase C) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** after the private repo is renamed and archived (guide 03).

Division of labour: **you create the empty repos and set their GitHub settings** (this guide);
the AI session pushes the prepared histories into them and prepares the README header commits
(approved drafts are in plan §5 steps 11–12).

## 1. Create the archive repo (plan step 12)

1. Agentic-HQ org page → **New repository**.
2. Name: `agentic-hq-archive-001` · Visibility: **Private** (flips public later, guide 07).
3. **Do NOT initialise** with README/.gitignore/licence — the scrubbed history gets pushed in.
4. Description suggestion: `Scrubbed read-only historical snapshot of Agentic HQ — the live
   project is Agentic-HQ/agentic-hq`.
5. Hand over to the AI session: it pushes all 42 scrubbed branches + the README header commit.
6. Do **not** select this repo in the GitHub-for-Jira app.

## 2. Create the public repo (plan step 13)

1. Org page → **New repository** · Name: `agentic-hq` (the old name is free after the rename;
   note: reusing it kills the old rename-redirect, which is intended) · Visibility: **Private**
   for now.
2. Again **do NOT initialise** — the AI pushes the slimmed `main`.
3. After the push, re-apply the repo settings you care about: description, topics/tags,
   branch protection on `main`, and check Settings → Webhooks / Deploy keys / Actions if any
   existed on the old repo (issue/PR templates travel with the code, nothing to do there).
4. **Connect to Jira**: GitHub org → Settings → GitHub Apps → Jira → Configure → Repository
   access → add `agentic-hq` to the selected repositories. (You can also deselect
   `agentic-hq-private` here at the same time — the old repo no longer needs to sync.)
5. Then run the manual backfill — guide 05.

## Verify

- Archive repo: 42 branches visible, README header on top, NOT in the Jira app's selected list.
- Public repo: only `main`, tree = the ~313 curated files, in the Jira app's selected list.
