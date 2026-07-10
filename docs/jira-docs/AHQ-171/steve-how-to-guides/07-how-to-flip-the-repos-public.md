# Steve How To… Flip The Archive Repo Then The Public Repo Public (Launch)

**Plan steps:** 16–17 (Phase D) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** after the step-14 scans are clean AND you've done the content skim (guide 06).
**Order matters:** archive repo first — the public repo's docs link into it, so it must be
public before launch for those links to resolve.

## 1. Archive repo public + read-only (plan step 16)

1. `github.com/Agentic-HQ/agentic-hq-archive-001` → **Settings** → **General** → **Danger Zone**.
2. **Change repository visibility** → **Public** (type the repo name to confirm).
3. Then, same Danger Zone: **Archive this repository** → confirm. It now shows the read-only
   badge; pushes/issues/PRs are locked (reversible via Unarchive if ever needed).

## 2. Public repo public — launch (plan step 17)

Prerequisites — confirm these two Jiras are Done before flipping (not part of this plan):
**AHQ-176** (minimal CI tests) and **AHQ-179** (improve auto-approved-permissions docs).

1. `github.com/Agentic-HQ/agentic-hq` → **Settings** → **General** → **Danger Zone**.
2. **Change repository visibility** → **Public** (type the repo name to confirm).
3. Do **not** archive this one — it's the live repo.

## Verify

- Both repos load logged-out (private/incognito browser window).
- In the public repo's README, click a couple of the archive-repo links (the re-pointed
  historical links from plan step 4) — they should resolve.
- The archive repo shows the "archived / read-only" badge; the public repo doesn't.

## Rollback

Before this point: delete the new repos, rename `agentic-hq-private` back — ~2 min, zero loss.
After flipping public: treat as launched — public git history gets mirrored quickly; a
re-scrub of anything missed is no longer reliably possible (that's why steps 14–15 gate this).
