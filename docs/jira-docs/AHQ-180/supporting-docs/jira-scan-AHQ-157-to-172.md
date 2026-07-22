# Raw Scan Findings: Jira AHQ-157 to AHQ-172

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues retrieved in full (description + all comments + attachment field). None of the 16 issues has any attachments.

### SITE-LEVEL — RED-FLAG (applies to every issue, not issue content)
- Where: comment/reporter author metadata on every issue (returned by the Jira API)
- What: "email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS" appears in every comment author block for account 712020:0b47121b...
- Why: This is the Atlassian profile email-visibility setting, not issue text — if profile visibility is "Anyone", the personal email AHQ-171 is trying to scrub will be exposed via the public site/API on every comment.
- Suggested action: Before going public, set the Atlassian profile email visibility for this account to private/admins-only and re-verify via anonymous API call.

### AHQ-171 — MORE-EMBARRASSING
- Where: description
- What: "My personal email address was set for a period of time in my .gitconfig… I've also discovered it in a single, current text file in the repo… Full contents of this Jira stored at: docs/jira-docs/AHQ-171/01-Jira-Description.md"
- Why: The issue itself does NOT contain the email (verified), but it publicly advertises that a personal email exists in git commit metadata and in a repo text file, and points to a repo doc that may contain the full unscrubbed detail — an invitation to go hunting.
- Suggested action: Verify docs/jira-docs/AHQ-171/01-Jira-Description.md is absent from (or scrubbed in) the public repo, confirm the git-history scrub landed, and consider trimming this description before public.

### AHQ-161 — SLIGHTLY-EMBARRASSING
- Where: description
- What: YouTube link carrying a `?si=MX9IWB…` share-tracking parameter — harmless but ties the link to the sharer's account/session; strip `?si=` if tidying.

### AHQ-157 — SLIGHTLY-EMBARRASSING
- Where: description
- What: raw un-rendered mention "( User:712020:0b47121b-b20b-4181-8ec7-9688b90cc1cd )" for "the founder" — cosmetic; resolves to the owner's own name, could be replaced with plain text.

### AHQ-162 — SLIGHTLY-EMBARRASSING
- Where: description ("Scope of change")
- What: quotes the SKILL.md banner "INFO FOR YOU ONLY (Don't tell user):" — optics of instructing the AI to hide info from users, though the hidden content (a symlink fix note) is benign and ships in the public repo anyway.

### AHQ-160 — SLIGHTLY-EMBARRASSING
- Where: description (also referenced in AHQ-157)
- What: repeated references to the self-deprecating doc filename "01-codex-report-on-what-im-doing-wrong-etc.md" — harmless, owner will likely leave as-is.

### AHQ-167 — SLIGHTLY-EMBARRASSING
- Where: description
- What: abandoned ticket with a sentence that cuts off mid-thought ("I'm going to snapshot the Ubuntu VM I've installed then") — messy but harmless.

Notes on specifically-requested checks:
- AHQ-168 (settings.json commit): the only quoted config is OTEL/telemetry env vars pointing at `http://localhost:4317` plus an autocompact override — no keys, tokens, or endpoints of value. Nothing sensitive quoted.
- AHQ-165/AHQ-166 link to Confluence pages on agentic-hq.atlassian.net/wiki (no tokens in URLs) — these will just 404/permission-wall for the public unless the wiki space is also opened; not a data leak.
- Usernames in paths/prompts (`/home/steve-personal/...`, `steve-personal@ubuntu-vm1` in AHQ-169/AHQ-172) are the owner's own machines — not flagged per instructions.
- AHQ-159/AHQ-164 GitHub commit links point at the Agentic-HQ/agentic-hq repo itself — no leak beyond what the public repo will show.
- No secrets, credentials, webhook URLs, third-party private individuals, employer/client references, or exploitable open vulnerabilities found in any of the 16 issues (AHQ-170's node-pty issue is described as fixed/Done).

CLEAN: AHQ-158, AHQ-159, AHQ-163, AHQ-164, AHQ-165, AHQ-166, AHQ-168, AHQ-169, AHQ-170, AHQ-172
