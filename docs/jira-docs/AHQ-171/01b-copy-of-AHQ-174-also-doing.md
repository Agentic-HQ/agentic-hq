# AHQ-174 - Reduce Size Of Repo By Archiving To Separate Repo

URL: https://agentic-hq.atlassian.net/browse/AHQ-174
Status: Backlog · Type: Story · Priority: Medium · Copied here: 2026-07-04

> **Why this copy lives in the AHQ-171 folder:** the AHQ-171 scrub plan has been revised (2026-07-04) to solve **both** Jiras together in one pre-public operation, since they share the same one-time window (before the repo goes public) and the same mechanism (history rewriting). The revised three-repo plan is in `Fable/03-Fable-report-and-questions.md` §5: `agentic-hq-private` (renamed original, unscrubbed, private forever) → `agentic-hq-archive-001` (complete scrubbed snapshot, public read-only — satisfies this Jira's "one clearly named archive") → `agentic-hq` (scrubbed AND slimmed go-live repo, junk paths filtered out of history — satisfies this Jira's "small curated docs tree").
>
> **Deliberately deferred:** the plan fixes the *mechanism* only. The detailed curation list — exactly which docs/paths are removed from the go-live repo vs kept — is **not yet decided** and will be worked out at a later point.

## Description (verbatim from Jira)

From:

docs/jira-docs/AHQ-160/01-task-tracking-doc-copy-of-01-codex-report-on-what-im-doing-wrong-etc.md

```
### 2. The docs volume is much too high for a public first impression

Measured locally:

- `git ls-files docs` returns 966 tracked files.
- Around 752 of those are internal Jira/spike/artifact/LATER/ticket-style files.
- Tracked docs are about 92M.
- The full local `docs/` tree is about 536M because of ignored historical/generated material.

The tracked docs are probably valuable to you because they are the fossil record of the project and proof that AHQ was dogfooded. But a public repo has a different job: it must help a new person understand what to run and why to care.

The current docs tree does the opposite: it makes Agentic HQ feel bigger, older, and more internally complicated than the actual product. The production TypeScript is tiny by comparison, roughly 2.6k lines under `src`. That mismatch creates a credibility problem: the repo says "lightweight wrapper", while the surrounding artifacts say "massive private process universe".

Recommendation:

- Keep a small curated `docs/` tree for public docs.
- Move historical Jira/spike/workflow artifacts into one clearly named archive, or out of the public repo entirely.
- If you keep them, add a top-level explanation: "These are dogfooding artifacts, not required reading."
- Do not make new users wade through `docs/jira-docs`, `docs/project-docs`, `docs/artifacts`, and `docs/LATER` to work out what is product and what is history.
```

*(Figures re-verified 2026-07-04, slightly grown since the Codex measurement: 1,008 tracked files / ~93 MB under `docs/`; `jira-docs` 386 + `project-docs` 378 + `ARCHIVED` 203 = 967 of the 1,008; `src` is 2,582 lines of TypeScript; 1,351 tracked files repo-wide.)*
