# Raw Scan Findings: Jira AHQ-36 to AHQ-53

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues retrieved in full (description + all comments + attachment field requested). None of the 16 issues has any attachments.

### PROJECT-WIDE — RED-FLAG (flagged once, applies to all 16 issues)
- Where: comment author metadata on every comment (API read-back), all issues
- What: `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` is returned in the author block of every comment by the Atlassian API
- Why: This is Atlassian profile metadata, not issue content — but the task explicitly lists STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS as red-flag contact data; whether anonymous visitors to a public project see it depends on the Atlassian profile "email visibility" setting
- Suggested action: Before going public, set Atlassian profile email visibility to "Only you and admins" (or verify it already is); no issue-content edits needed

### AHQ-50 — SLIGHTLY-EMBARRASSING
- Where: comment by Steve Halso on 2026-02-16 (raw terminal paste)
- What: Claude Code startup banner in the pasted session: "Opus 4.6 · Claude Max ... $50 free extra usage"
- Why: Reveals personal subscription tier/promo details inside an otherwise technical evidence paste
- Suggested action: Optionally trim the banner lines from the paste; harmless otherwise

### AHQ-53 — SLIGHTLY-EMBARRASSING
- Where: description
- What: "the inventor of OpenClaw (Peter Steinburger in [this] video)"
- Why: Names a real public figure with a (likely) misspelled surname (Steinberger) and a loose attribution ("inventor of OpenClaw") — positive/neutral, not defamatory, but worth a spelling/accuracy check before public
- Suggested action: Correct spelling/attribution or leave as-is

Notes on things checked and deliberately NOT flagged:
- Atlassian account ID `712020:0b47121b-...` appears in AHQ-41, AHQ-47, AHQ-53 descriptions ("User:...(me)") — opaque ID, already public on any public Jira, not sensitive.
- AHQ-45 (Slack spike): describes credential-setup scripts by location only; no webhook URLs, tokens, or channel/workspace identifiers appear. Local codex spike paths are pervasive-path noise.
- AHQ-50 and AHQ-52 terminal pastes: reviewed line-by-line — only local paths, test output, and git status; no secrets, tokens, or third-party names.
- Shell prompt hostname "Steves-MacBook-Pro" and username "stevepersonal" throughout pastes — owner-identifying only, per instructions not flagged.
- Confluence links (agentic-hq.atlassian.net/wiki) in AHQ-46/47 — plain links without tokens; will simply 404 for outsiders unless the wiki is also opened up.
- No unfixed exploitable security vulnerabilities, no other real people's names (besides the public figure above), no financial/legal/health content, no negative comments about companies found in any of the 16 issues.

CLEAN: AHQ-36, AHQ-37, AHQ-38, AHQ-40, AHQ-41, AHQ-42, AHQ-43, AHQ-44, AHQ-45, AHQ-46, AHQ-47, AHQ-48, AHQ-51, AHQ-52
FAILED: none
