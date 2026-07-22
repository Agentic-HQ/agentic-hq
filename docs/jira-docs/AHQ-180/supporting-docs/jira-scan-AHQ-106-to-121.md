# Raw Scan Findings: Jira AHQ-106 to AHQ-121

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues retrieved in full (description + comments + attachments). None of the 16 issues has any comments. Two issues have attachments, both of which I inspected directly: AHQ-119's `chat-transcript.txt` (downloaded and read in full — a clean technical Claude Code session about classwitch npm packaging; only reveals hostname "Steves-MacBook-Pro-3", username "stevepersonal", and a "Claude Max" subscription banner, no secrets or personal data) and AHQ-120's `image-20260424-183811.png` (viewed — terminal screenshot of a coloured workflow listing; same hostname/username/paths only, no secrets).

### AHQ-109 — RED-FLAG
- Where: description
- What: "https://chatgpt.com/share/REDACTED" (share ID redacted here; live in the description)
- Why: Public share link to a private ChatGPT conversation whose content I cannot verify; anyone reading the public Jira can open it and it may contain personal context.
- Suggested action: Open the shared conversation, confirm its content is fine for public, or delete/unshare the link.

### AHQ-116 — SLIGHTLY-EMBARRASSING
- Where: description ("Technical Details" section)
- What: "This workflow will be created by User:712020:0b47121b-b20b-4181-8ec7-9688b90cc1cd running the create-workflow workflow" — a broken @-mention rendered as Steve's raw Atlassian account ID; cosmetic gibberish for public readers, not sensitive.
- Suggested action: Optionally replace with "the maintainer" or leave as-is.

### AHQ-119 — SLIGHTLY-EMBARRASSING
- Where: attachment "chat-transcript.txt" (61 KB, uploaded 2026-04-18)
- What: Full Claude Code session transcript (inspected in full — purely technical discussion of classwitch package exports/npm publishing; reveals only machine hostname "Steves-MacBook-Pro-3", username "stevepersonal", and "Claude Max" plan banner — no secrets, no personal data).
- Suggested action: Leave as-is, or remove if publishing raw AI-session transcripts publicly feels untidy.

### AHQ-120 — SLIGHTLY-EMBARRASSING
- Where: attachment "image-20260424-183811.png"
- What: Terminal screenshot of the coloured `list` output (inspected — shows hostname "Steves-MacBook-Pro-3", username, local paths only; no secrets).
- Suggested action: Leave as-is; nothing sensitive visible.

CLEAN: AHQ-106, AHQ-107, AHQ-108, AHQ-110, AHQ-111, AHQ-112, AHQ-113, AHQ-114, AHQ-115, AHQ-117, AHQ-118, AHQ-121

Notes for the aggregator: AHQ-114 links to a Confluence page on the same Atlassian site (agentic-hq.atlassian.net/wiki) — not flagged because it leaks nothing if the wiki stays private, but if the Confluence space is also being made public it should get its own audit. AHQ-117 references a scratch file `/tmp/ahq-120-add-on.md` and AHQ-119's description contains only placeholder author metadata (`<your name / email>`) — neither leaks anything.
