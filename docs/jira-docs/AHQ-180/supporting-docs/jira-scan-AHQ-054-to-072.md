# Raw Scan Findings: Jira AHQ-54 to AHQ-72

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues read in full (description + all comments + attachments). AHQ-58's three screenshots were viewed directly; AHQ-67's text attachment was downloaded and read end-to-end. Findings:

### AHQ-72 — RED-FLAG
- Where: comment by Steve Halso on 2026-03-01 ("Manual test results:" comment, id 11779)
- What: pasted terminal output of an MCP create-issue response containing `"reporter": ... "email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` embedded in the comment body text
- Why: personal email address is in the comment content itself (not just API metadata), so it will be publicly readable
- Suggested action: edit the comment to redact the email line (or trim the reporter block from the pasted JSON)

### PROJECT-WIDE — RED-FLAG (reported once, applies to every issue)
- Where: API author/reporter metadata on every comment and attachment
- What: `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` is returned by the Jira REST API for the owner's profile on all 16 issues
- Why: Atlassian profile email visibility is set to public/anyone — once the site is public, any API consumer sees it
- Suggested action: set email visibility to "Only you and admins" in Atlassian account profile settings before going public (fixes this everywhere except the AHQ-72 comment body above)

### AHQ-58 — MORE-EMBARRASSING
- Where: description
- What: full repro + analysis of an unfixed catastrophic-backtracking (ReDoS) bug in the third-party `sooperset/mcp-atlassian` project ("Later: Fix sooperset mcp-altlasian Performance Bug", with evil-regex PoC code)
- Why: publishes an exploit-grade repro for an apparently unreported/unfixed bug in a named third-party project (low severity — client-side self-DoS — but a responsible-disclosure courtesy issue)
- Suggested action: report upstream to sooperset/mcp-atlassian first, or leave as-is if already known upstream

### AHQ-58 — SLIGHTLY-EMBARRASSING
- Where: description — link `https://gemini.google.com/app/23b2e0e4817453ea` is a private (account-only, dead-to-others) Gemini conversation link; attachments `image-20260221-111316.png`, `image-20260221-111616.png`, `image-20260221-112017.png` were viewed and are clean (timing notes, terminal snippet, Activity Monitor — no secrets/personal info).

### AHQ-57 — SLIGHTLY-EMBARRASSING
- Where: description
- What: the description IS the intentional ReDoS trigger string `(??)01234...`
- Why: minor operational note — once public, anyone reading this issue via the mcp-atlassian MCP client will hang for ~4 minutes (a booby-trap for scrapers/AI tooling); otherwise harmless
- Suggested action: leave, or note the trap in the summary

### AHQ-61 — SLIGHTLY-EMBARRASSING
- Where: description — `https://chatgpt.com/g/g-p-688c.../c/699a2bcc-...` is a private ChatGPT conversation link (inaccessible to others, just a dead link); rest is abandoned-plan content, fine.

### AHQ-64 — SLIGHTLY-EMBARRASSING
- Where: description — pastes topic summaries of the owner's private global `~/.claude/CLAUDE.md` and MEMORY.md ("User's private global instructions covering..."); nothing sensitive in the summaries themselves, owner may just prefer not to expose private-config internals.

### AHQ-67 — SLIGHTLY-EMBARRASSING
- Where: description
- What: "The few developers I share this repo with privately can have the bloat... going public first without doing AHQ-67... will be embarrassing!"
- Why: mild self-talk revealing private-sharing arrangements and pre-public anxieties
- Suggested action: leave as-is or trim the first paragraph

### AHQ-67 — SLIGHTLY-EMBARRASSING
- Where: attachment "gitCleanoutConversation.txt" (38 KB — downloaded and read in full)
- What: Claude conversation about git repo slimming; NO secrets, emails, or third-party names. It does reveal historical repo contents (archived "ringtone-website" side project, `sounds/curated-steve-likes/*.wav`) and backup strategy incl. the private archive repo name `agentic-hq-archived-fork-28th-feb-2026` and a Google Drive zip backup
- Why: reveals existence/naming of private backups and an old personal side project — low sensitivity
- Suggested action: leave, or delete attachment if the archive-repo naming feels too revealing

### AHQ-68 — MORE-EMBARRASSING
- Where: description
- What: "get the other... Jiras done first, then do this before sharing with [a named well-known industry figure] and others" (name deliberately not repeated here — see AHQ-68; the same person is also quoted from a public podcast)
- Why: reveals a private outreach/marketing plan naming a real (public-figure) person before it has happened; the quote itself is respectful and from public material
- Suggested action: owner may want to soften "before sharing with [the named figure]" to something generic; the podcast quote is fine

CLEAN: AHQ-54, AHQ-56, AHQ-59, AHQ-60, AHQ-62, AHQ-63, AHQ-69, AHQ-70, AHQ-71

Notes for the aggregator: AHQ-56's comments contain large pasted terminal test logs — only local paths and the owner's machine prompt (`stevepersonal@Steves-MacBook-Pro`), per instructions not flagged. No secrets, tokens, webhook URLs, other private individuals, or Google Docs/Drive share links were found in any of the 16 issues. Attachment inventory: AHQ-58 (3 PNGs, inspected, clean), AHQ-67 (1 TXT, inspected, see above); no other issue has attachments. FAILED: none.
