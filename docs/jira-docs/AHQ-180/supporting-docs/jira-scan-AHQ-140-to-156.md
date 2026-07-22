# Raw Scan Findings: Jira AHQ-140 to AHQ-156

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues read in full (descriptions, all comments, attachment lists), all 4 images visually inspected, and the AHQ-151 zip downloaded and inspected. Findings:

### GENERAL — RED-FLAG
- Where: Jira account metadata on every comment/attachment (all issues)
- What: `STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS` is returned as the author email in the API metadata for every comment and attachment
- Why: This comes from the Atlassian profile, not issue text — but if profile email visibility is set to "Anyone", it becomes readable by the public once the site is public
- Suggested action: Before go-public, check Atlassian account settings > Profile and visibility > Contact > Email address is NOT set to "Anyone"

### AHQ-151 — RED-FLAG
- Where: attachment "PROJ-002.zip"
- What: Zip contains 2 files. `02-ticket-file.md` inspected — benign (AI-generated epic draft for resumable workflows, no personal data). `01-A-prompt.md` (~5KB) could NOT be read — the base64 payload arrived corrupted through the MCP transfer (decompression fails at byte 71; the original zip on Jira is probably intact)
- Why: One file in a public-visible attachment is unverified; prompt-capture files can embed local/session context
- Suggested action: Owner opens the zip locally and glances at `01-A-prompt.md` (30-second check); context strongly suggests benign

### AHQ-154 — RED-FLAG
- Where: description, "# Perplexity Advice" section
- What: "https://www.perplexity.ai/search/REDACTED" (thread ID redacted here; live in the description)
- Why: Perplexity thread links are world-readable if sharing was ever enabled on the thread; my unauthenticated fetch got 403 (inconclusive — could be bot-blocking rather than privacy)
- Suggested action: Verify the thread's share setting is private, or delete the link (the two screenshots already capture the useful content — both inspected, benign)

### AHQ-154 — MORE-EMBARRASSING
- Where: description, top
- What: "WARNING: Should not leave this for months after 4th Jun 2026 - as packages will get older (and less secure)" — and the ticket is still open/"Later" as of 2026-07-18
- Why: Publicly advertises that the dependency security-refresh process is overdue; not actually exploitable (the lockfile is public in the repo anyway, so dep ages are computable by anyone) — hence not RED
- Suggested action: Soften/remove the dated warning, or do AHQ-154 before/soon after go-public

### AHQ-140 — SLIGHTLY-EMBARRASSING
- Where: description
- What: Links to owner-private AI chats (`chatgpt.com/c/...`, `gemini.google.com/app/...`, `claude.ai/chat/...`) — these require the owner's login, so they leak nothing, but will be dead links for the public. (Both PNG attachments inspected: benign — GitHub branch-protection banner and Claude advice text.)

### AHQ-150 — SLIGHTLY-EMBARRASSING
- Where: description
- What: Names a real person + employer ("Priscila Andre de Oliveira ... at Sentry") — but it's a verbatim copy of a public AI Engineer conference-talk description, complimentary in tone; arguably no action needed

### AHQ-153 — SLIGHTLY-EMBARRASSING
- Where: description
- What: A third-party newsletter (AI Tinkerers guest post about Homecrew) pasted verbatim including its marketing UTM link — reproduced content, no secrets/tokens; owner may want to trim to just the tool link

### AHQ-155 — SLIGHTLY-EMBARRASSING
- Where: description
- What: References repo file "01-codex-report-on-what-im-doing-wrong-etc.md" — mild self-deprecation in a filename (which is in the public repo anyway)

Notes on issues checked and deliberately not flagged: AHQ-142 contains a pasted shell prompt with machine name "Steves-MacBook-Pro-4"/user "stevepersonal" (owner's own info, same class as local paths); AHQ-152 was specifically checked for exploitable detail — it documents implemented defenses plus generic residual risks only, nothing open/exploitable; AHQ-145 mentions the maintainer's machine specs (harmless dev context). All comments on all 16 issues are workflow-status updates by the owner — no third-party names, secrets, or venting anywhere.

CLEAN: AHQ-142, AHQ-143, AHQ-144, AHQ-145, AHQ-146, AHQ-147, AHQ-148, AHQ-149, AHQ-152, AHQ-156

FAILED: none — all 16 issues retrieved successfully.
