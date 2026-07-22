# Raw Scan Findings: Jira AHQ-1 to AHQ-18

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues read in full (descriptions + all comments), both attachments downloaded/inspected. Findings:

### AHQ-1 — RED-FLAG
- Where: comment by Steve Halso on 2026-01-22
- What: "https://chatgpt.com/share/REDACTED" (share ID redacted here; live in the comment)
- Why: Public ChatGPT share link — anyone with the URL can read the full private conversation; making the Jira public distributes the link.
- Suggested action: Review the shared conversation's content, or delete the ChatGPT share / redact the URL from the comment.

### AHQ-15 — RED-FLAG
- Where: description
- What: "https://docs.google.com/document/d/REDACTED/edit" ("I've written about in ..." — doc ID redacted here; live in the description)
- Why: Private Google Doc link — if link-sharing is enabled the doc leaks to anyone; if not, publishing invites access requests to the owner's Google account.
- Suggested action: Check the doc's sharing settings and either lock it down or remove the URL before going public.

### AHQ-15 — RED-FLAG
- Where: description
- What: "https://chatgpt.com/share/REDACTED" (share ID redacted here; live in the description)
- Why: Public ChatGPT share link exposing a full private conversation (includes project strategy, "funding / licensing rationale" discussion).
- Suggested action: Review the shared conversation content, or unshare it / redact the URL.

### AHQ-1 — SLIGHTLY-EMBARRASSING
- Where: description (also recurs in AHQ-5, AHQ-7, AHQ-11 descriptions)
- What: Private ChatGPT project chat links of the form "https://chatgpt.com/g/g-p-688c62f8b1fc819199f4f57af733aeb6-agentic-hq/c/..." plus a "(For Steve only: ...)" aside — these are login-gated (dead links for the public, no data leak), just clutter that reveals internal project UUIDs.
- Suggested action: Optionally strip or leave as-is; they resolve to nothing for outsiders.

Attachment verification (both inspected in full, content confirmed clean — no secrets/personal data):
- AHQ-7: `eslint.config.FOR_MAIN_PROJECT_START.mjs` — plain ESLint config, identical copy already committed to the public repo at `docs/jira-docs/AHQ-7/workflow-files/jira-attachments/eslint.config.FOR_MAIN_PROJECT_START.mjs`.
- AHQ-17: `claude-code-test-conversation.txt` — terminal transcript of a Claude Code session asking Perplexity about pnpm test-script naming and smoke-vs-e2e conventions; only public citation URLs, nothing sensitive.

Global note (not a per-issue finding): STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS appears throughout only as Jira account/author metadata returned by the API, never in issue text. Before going public, check the Atlassian profile email-visibility setting so the address isn't exposed via the public site/REST API. Also verified: AHQ-18 describes a fixed bug (not an exploitable open vulnerability), and the "OAuth token expired" mention in AHQ-9 contains no token value.

CLEAN: AHQ-2, AHQ-3, AHQ-6, AHQ-8, AHQ-9, AHQ-10, AHQ-12, AHQ-13, AHQ-14, AHQ-17, AHQ-18
