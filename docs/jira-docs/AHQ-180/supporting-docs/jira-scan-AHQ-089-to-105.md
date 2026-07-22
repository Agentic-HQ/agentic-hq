# Raw Scan Findings: Jira AHQ-89 to AHQ-105

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

Both attachments are fully scanned and are clean technical content. All 16 issues (descriptions + all comments + attachments) have now been read in full. Findings below.

### AHQ-99 — MORE-EMBARRASSING
- Where: description ("Testing update" section)
- What: a quoted test command referencing a workflow with a personal-sounding name: "agentic-hq --workflow-command-supplier /steve-test-new-plugin-001:[REDACTED-NAME]-test-workflow" (name deliberately not repeated here — visible in AHQ-99)
- Why: The workflow's name is a possible personal-life hint the owner may not want public.
- Suggested action: Rename in the Jira text to a neutral example (e.g. "example-test-workflow") or confirm owner is happy with it.

### AHQ-97 — SLIGHTLY-EMBARRASSING
- Where: description — "which was abandoned as I tried to do too much in one hit (AI doesn't do well with that) and it made a mess" — mild self-deprecation; likely fine as-is.

### AHQ-95 — SLIGHTLY-EMBARRASSING
- Where: comment by Steve Halso 2026-04-29 — "Ditching this as not doing classwitch any more." — abandoned-plan note (classwitch was earlier announced as published at github.com/Agentic-HQ/classwitch in AHQ-94); likely fine as-is.

### GENERAL (applies to all issues) — RED-FLAG (metadata, not issue text)
- Where: API metadata on every comment/attachment author object
- What: `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` is returned by the Jira REST API for the author profile (it is NOT in any description or comment text).
- Why: Whether this email is exposed to anonymous users of a public project depends on Steve's Atlassian profile "email visibility" setting, not on the issues themselves.
- Suggested action: Before going public, set Atlassian account email visibility to "Only you and admins" (Atlassian account settings → Profile and visibility → Contact → Email address).

Attachment inventory (both downloaded and fully scanned — no secrets, no emails, no personal names, no tokens found):
- AHQ-92: "jira-colocate-interfaces-claude-conversation-copy.txt" (53 KB) — Claude Code terminal transcript researching interface co-location/barrel files; only repo paths and public tech-blog URLs. Header shows "Opus 4.6 · Claude Max" (subscription tier) — trivial. CLEAN.
- AHQ-105: "ahq-105-approved-plan.md" (10 KB) — approved plan for integrating design requirements into TDD workflow commands; purely technical. CLEAN.

Notes on things checked and deliberately NOT flagged (per instructions): pervasive /Users/stevepersonal/... paths; terminal prompts showing "stevepersonal@Steves-MacBook-Pro" (AHQ-103); the owner's own Atlassian account-ID mentions ("User:712020:0b47121b-…") in AHQ-90/AHQ-103 descriptions; a well-known industry figure (public figure, complimentary mention + public Spotify link) in AHQ-99; CVE-2026-24842 in AHQ-98 (public pnpm/tar CVE, already patched — issue Done, not an AHQ vulnerability); private Confluence/GitHub links in AHQ-94 (no tokens in URLs — dead links at worst); human praise quote "Amazing. It worked really well." in AHQ-99 comments.

CLEAN: AHQ-89, AHQ-90, AHQ-91, AHQ-92, AHQ-93, AHQ-94, AHQ-96, AHQ-98, AHQ-101, AHQ-102, AHQ-103, AHQ-104, AHQ-105

FAILED: none — all 16 issues retrieved with full descriptions, all comments, and attachment lists.
