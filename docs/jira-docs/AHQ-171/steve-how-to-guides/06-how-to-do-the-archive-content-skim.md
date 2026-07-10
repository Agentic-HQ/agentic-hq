# Steve How To… Do The Archive Repo Content Skim

**Plan step:** 15 (Phase D) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** after the final machine scans pass (step 14), before flipping the archive repo
public (guide 07).

## What this is (and is not)

Flipping the archive repo public publishes **everything** — every branch, every pasted
transcript, every working doc. Machines have already checked for secrets (three scans: the
step-2 audit, the email/domain blob-scan, the step-14 re-scan). **This pass is the human
judgement call the machines can't make**: anything embarrassing, private to *other people*,
or not-yours-to-publish.

## Where to look (the big content categories, by size)

- `docs/project-docs/` (378 files) — spikes, planning docs, workflow-run records
- `docs/jira-docs/` (386 files) — per-Jira TDD working docs (incl. this AHQ-171 folder)
- `docs/ARCHIVED/` (203 files) — incl. the ringtone-website test project and its transcripts
- `docs/LATER/`, `docs/artifacts/` — parked thoughts, workflow-creation records
- Branch-only content: the 37 `archive/*` branches carry old versions of the above

## What to look for

- **Pasted AI/Perplexity/Claude conversations** — check for anything personal captured in
  terminal output (the known status-bar email is already scrubbed; look for surprises).
- **Other people's data** — names, emails, or content from third parties that isn't yours to
  publish (e.g. quoted private correspondence).
- **Third-party material** — large verbatim excerpts of copyrighted content.
- **Tone check** — internal notes you wrote candidly; would you be comfortable with them public?

## Practical method (~30–60 min)

1. Skim directory listings first (`tree`-style or GitHub UI), not file-by-file.
2. Spot-open the transcript-like files (anything named `*transcript*`, `*conversation*`,
   `*verbatim*`, `*chat*` — the AI session can list them for you on request).
3. Note anything questionable in a comment to the AI session — individual files can be added
   to the scrub's removal list and the archive re-pushed before the flip (cheap while private).

When you're satisfied, say so — that's the green light for guide 07.
