# Raw Scan Findings: Confluence — Experiments/Abandoned/Side-Project Cluster (15 pages)

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these pages in full (bodies + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.
>
> Pages covered: Experiments (22970370), Experimenting With Ditching The Workflow (23068673), ABANDONED - Plugin Architecture (37191681), ABANDONED - Refactor System To Microkernel - Main (34275329), ABANDONED - Subpage - ChatGPT Conversation (31948801), ABANDONED - Subpage - Initial Analysis Notes (34537499), Plugin Architecture Spike Projects (37289985), Codex (54231049), Codex Installation On Intel Mac (54001669), Codex Experiments (54362115), classwitch (56983553), classwitch Alternatives (57081857), AHQ Demo Workflows (64913410), !!TEMPORARILY ABANDONED!! - Atomic Story Workflow (64978945), Trying Out taskmd Markdown Based Task System (65536002).

All 15 pages, their comments, and attachments have been read in full, and all 6 image attachments were downloaded and visually inspected. No page had any comments. Findings below.

## Findings

### classwitch Alternatives (id 57081857) — RED-FLAG (verify before public)
- Where: body, "Perplexity" section
- What: Link `https://www.perplexity.ai/search/REDACTED` (thread ID redacted here; live on the page's "Perplexity" section)
- Why: Perplexity thread URLs are identical whether private or made shareable/discoverable — if this thread is shareable, the link exposes the full conversation; I could not verify (fetch returned 403, likely bot-blocking, inconclusive). Content risk is low (the thread topic is already pasted on the page), but it should be checked.
- Suggested action: Owner opens the link in a logged-out browser; if it renders, unshare the thread or remove the link.

### !!TEMPORARILY ABANDONED!! - Atomic Story Workflow (id 64978945) — MORE-EMBARRASSING
- Where: body, "Possible Tools To Use" section
- What: "Backlog.md - doesn't have docs directory and UI looks painful"; also beads dismissed as "not designed for human use"
- Why: Mildly negative opinions about named open-source projects (MrLesk/Backlog.md, gastownhall/beads) whose maintainers could read this once public; non-defamatory.
- Suggested action: Soften "UI looks painful" or leave as honest tool-evaluation notes.

### Experimenting With Ditching The Workflow (id 23068673) — SLIGHTLY-EMBARRASSING
- Where: body, "Overall" section
- What: Personal self-description: "I'm more of a procedural - step, by boring step type of person. Happy in the comfort of slow but steady progress." — leave; harmless reflection.

### ABANDONED - Refactor System To Microkernel (Plugin) Architecture - Main (id 34275329) — SLIGHTLY-EMBARRASSING
- Where: body, "ABANDONED" banner
- What: "abandoned because AI couldn't work out how to implement this properly" plus celebratory "Whoop" and typos ("Microkernal", "Anaylsis") — leave; honest abandoned-work notes.

### ABANDONED - Subpage - ChatGPT Conversation... (id 31948801) — SLIGHTLY-EMBARRASSING
- Where: body, "ChatGPT Conversation" section
- What: Private link `https://chatgpt.com/c/69ac58cd-...` — ChatGPT `/c/` URLs are owner-only (shared links use `/share/`), so it is just a dead link for the public; leave or delete the line. Attachment `image-20260314-143216.png` reviewed: ChatGPT output text only, no account/personal info visible.

### ABANDONED - Subpage - Initial Analysis Notes... (id 34537499) — SLIGHTLY-EMBARRASSING
- Where: body, final line
- What: "God. I am lost!" at the end of long rambling analysis notes — leave; harmless self-deprecation.

### Plugin Architecture Spike Projects (id 37289985) — SLIGHTLY-EMBARRASSING
- Where: body, "Spike 001" section
- What: Page trails off mid-sentence at "First prompt:" and links `github.com/Agentic-HQ/agentic-hq-spike-plugin-architecture-001` which now 404s publicly (private/deleted — dead link, not a leak) — leave or tidy/delete.

### Codex Installation On Intel Mac (id 54001669) — SLIGHTLY-EMBARRASSING
- Where: body, "Installation" section
- What: Private ChatGPT link `https://chatgpt.com/c/69eca443-...` — owner-only, dead link for the public; leave.

### classwitch Alternatives (id 57081857) — SLIGHTLY-EMBARRASSING
- Where: body, "ChatGPT" and "Gemini" sections
- What: `chatgpt.com/g/g-p-688c62f8...-agentic-hq/c/...` and `gemini.google.com/app/428efe2314a971e7` — both owner-only URL formats, dead links for the public (the ChatGPT one reveals only the project name "agentic-hq", already public); leave. All 4 attachments (`image-20260428-204030.png`, `image-20260428-075641.png`, `image-20260428-075302.png`, `image-20260428-075107.png`) reviewed: AI-chat answer text only, no account names/emails/secrets.

## Attachment inventory (all inspected, none contain secrets or personal info)
- 31948801: image-20260314-143216.png (ChatGPT screenshot — clean)
- 57081857: image-20260428-204030.png, image-20260428-075641.png, image-20260428-075302.png, image-20260428-075107.png (Perplexity/Gemini/ChatGPT answer screenshots — clean)
- 64978945: image-20260510-172737.png (screenshot of public taskmd Medium article Q&A — clean)
- 65536002: image-20260510-172737.png (same image — clean)
- All other pages: no attachments

## Specifically checked and NOT found
- No API keys, tokens, passwords, webhook URLs, or connection strings anywhere (the Codex Experiments page pastes a `token_expired` MCP error message, but no token value is present — not a finding).
- No email addresses (STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS does not appear on any page), phone numbers, or addresses.
- No employer/client references, no health/financial/legal content, no pasted personal-life AI conversations — the ChatGPT/Perplexity extracts are purely technical.
- Terminal pastes show only hostname "Steves-MacBook-Pro" / user "stevepersonal" (pervasive local-path class, not flagged per instructions).

CLEAN: Experiments (22970370), ABANDONED - Plugin Architecture (37191681, body is just "Root page."), Codex (54231049, empty), Codex Experiments (54362115), classwitch (56983553, empty), AHQ Demo Workflows (64913410, empty), Trying Out taskmd Markdown Based Task System (65536002)

FAILED: none — all 15 pages retrieved successfully.
