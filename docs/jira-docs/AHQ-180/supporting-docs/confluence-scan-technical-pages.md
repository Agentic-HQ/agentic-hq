# Raw Scan Findings: Confluence — Technical Cluster (15 pages)

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these pages in full (bodies + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.
>
> Pages covered: Technical (1638401), Analysing How Best To Do Software Development With AI (1671188), Claude Code (393435), Claude Code MCP Servers (917534), Using "Commander" Library (13991937), Claude Code Monitoring Tools (18939912), Claude Code OpenTelemetry (18677761), Monitoring Claude Usage Using claude-trace (19070990), Documenting Agentic HQ At Early Stage (14680066), Resumable Workflows (15761409), Using Temporal For Resumable Workflows (15892481), Connecting To Slack (20643880), Claude Code Plugins And Marketplaces (20611154), Installing Agentic HQ On Ubuntu In VMware (94470146), Linux Options Research (94109705).

All high-risk attachments verified. Audit complete — final findings below.

## Findings

### Analysing How Best To Do Software Development With AI (id 1671188) — MORE-EMBARRASSING
- Where: body, "Aim Within One Year" section
- What: An anecdote identifying a close family member's niche, identifiable business and quoting one of its customers (specifics deliberately not repeated here — read that section on the page)
- Why: Personal family context — identifies a family member's business and quotes a customer.
- Suggested action: Redact or generalize the anecdote (e.g. "a company I know") before going public.

### Analysing How Best To Do Software Development With AI (id 1671188) — SLIGHTLY-EMBARRASSING
- Where: body — "As Fred Boyles said…" (misnames Fred Brooks, twice implies it), plus closing "WARNING - got to keep this short and minimal or I'll be doing it until October!!!" and stream-of-consciousness "Look!!! She said the same thing" passages; six attached screenshots are excerpts of third-party articles (Martin Fowler / Medium) republished without the surrounding article.
- Why: Messy personal notes + wrong name for a famous author; article screenshots are a minor copyright/politeness question, not a data leak.
- Suggested action: Leave, or fix "Boyles"→"Brooks"; optionally replace article screenshots with links.

### Using "Commander" Library… (id 13991937) — SLIGHTLY-EMBARRASSING
- Where: body, "Research With Gemini"
- What: "https://gemini.google.com/app/5ac5c4ffc4b19a5f" — private Gemini chat link (dead for anyone else)
- Why: Non-functional private link; exposes only a conversation ID, no data.
- Suggested action: Leave or delete the link.

### Using Temporal For Resumable Workflows (id 15892481) — SLIGHTLY-EMBARRASSING
- Where: body (twice)
- What: private ChatGPT chat links "https://chatgpt.com/c/696603bb-59ec-8327-a91c-ae87a6fd9a24"; also a ChatGPT-quoted mention of an otherwise-unpublished project name alongside Agentic HQ (name deliberately not repeated here — it appears mid-page).
- Why: Dead private links; the quoted name may be a project the owner hasn't announced.
- Suggested action: Leave, or remove the project-name mention if it should stay private.

### Claude Code OpenTelemetry (id 18677761) — SLIGHTLY-EMBARRASSING
- Where: body ("How To Guide" link) and attachment "image-20260211-214105.png" (verified)
- What: private ChatGPT project link (chatgpt.com/g/g-p-688c62f8…); the settings screenshot shows `.claude/settings.local.json` with permissions "allow": ["Bash", "Edit", "Write"] (blanket allow on his personal machine). Verified: no tokens/emails in any of the 11 screenshots (usage-quota bar, Jira tool-call snippets, Prometheus/Grafana dashboards, localhost-only endpoints).
- Why: Dead private link; blanket-allow permissions is a mild "do as I say not as I do" security-posture reveal, not exploitable.
- Suggested action: Leave (optionally crop/remove the settings screenshot).

### Claude Code Plugins And Marketplaces (id 20611154) — SLIGHTLY-EMBARRASSING
- Where: body, "How Marketplaces Are Configured"
- What: private ChatGPT project chat link (chatgpt.com/g/g-p-688c62f8…/c/6991dbfc-…); terminal captures also show "Welcome back Steve! … Opus 4.6 · Claude Max" (subscription plan visible).
- Why: Dead private link; plan name is harmless but personal.
- Suggested action: Leave.

### Installing Agentic HQ On Ubuntu In VMware (id 94470146) — SLIGHTLY-EMBARRASSING
- Where: body ("Clone the repo") + orphaned attachments "image-20260629-182846.png", "image-20260629-183116.png"
- What: "first time I had to enter my github username and the Personal Access Token from above - which is then saved in this" — dangling reference: no PAT section exists "above" anymore, but two orphaned GitHub token-creation UI screenshots (verified: no token value visible, just the "Generate new token" menu and repo-scope checkboxes) remain attached and reachable via the attachments view. Also two inline comments are notes-to-self about VMware snapshots ("Snapshot-5 after node install…").
- Why: Doc inconsistency + leftover screenshots from a removed section; no secret present (verified), passwords in installer screenshots are masked dots.
- Suggested action: Fix/delete the dangling PAT sentence and delete the two orphaned attachments; leave comments or delete as housekeeping.

### Linux Options Research (id 94109705) — SLIGHTLY-EMBARRASSING
- Where: body
- What: "Docker is ruled out by fact that companies over 250 employees can't use it without paying for licence" (imprecise — applies to Docker Desktop, 250+ employees OR >$10M revenue); plus private Gemini/ChatGPT research links.
- Why: Mildly inaccurate claim about a named company's licensing; dead private links.
- Suggested action: Leave or add "Docker Desktop" qualifier.

## Attachment inventory (filenames per page; ✔ = downloaded and visually verified clean of secrets/personal data)
- 1671188: image-20260104-124630/124429/124005/123839/123551/120517.png — third-party article screenshots (see finding above).
- 18677761: image-20260211-214308.png, 214211.png (Grafana/Prometheus dashboards), 214105.png ✔ (settings.local.json), 210039/210024/210012/210003/205953/205940 ✔ (Claude Code Jira tool-call snippets), 205914.png, 205902.png ✔ (plan-usage bar, 10% used, no account info).
- 19070990: image-20260211-215547.png (screenshot of public GitHub issue #48) — benign.
- 20643880 (Slack): image-20260214-225711.png ✔ (Slack MCP "not authenticated" error panel — no tokens), image-20260214-225412.png ✔ (/mcp server list — no tokens).
- 20611154: 16 screenshots of plugin/marketplace UI and docs; image-20260215-144817.png ✔ (ChatGPT answer text only). Rest are Claude Code UI/docs captures — low risk.
- 94470146: 16 screenshots; image-20260628-190954.png ✔ and 185217.png ✔ (account-creation screens — passwords masked, shows "Steve Personal"/"steve-personal" only), 185043.png ✔, 185125.png ✔ (VMware wizard), image-20260629-182846/183116.png ✔ (orphaned GitHub PAT UI — no token; see finding), remainder are Ubuntu installer/desktop screenshots referenced in body.
- All other pages: no attachments.

## Notable non-findings (verified absent)
- No occurrence of STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS or any personal email on any page (the only email is the deliberate GitHub noreply "988157+halso@users.noreply.github.com" in git config instructions — designed to be public).
- No API keys, Atlassian tokens, Slack tokens/webhooks, passwords, or connection strings in any body, comment, or verified screenshot. The MCP Servers page (917534) contains only the official `claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse` command — no credential-based config.
- Comments exist only on 94470146 (two, both benign snapshot notes); all other pages have zero comments.

CLEAN: Technical (1638401), Claude Code (393435), Claude Code MCP Servers (917534), Claude Code Monitoring Tools (18939912), Documenting Agentic HQ At Early Stage (14680066), Resumable Workflows (15761409), Monitoring Claude Usage Using claude-trace (19070990), Connecting To Slack (20643880)

FAILED: none — all 15 pages, comments, and attachment lists retrieved successfully.

Bottom line: no RED-FLAG items found on these 15 pages. The riskiest artifacts (Slack auth screenshot, settings.local.json screenshot, Ubuntu/VMware credential screens, orphaned GitHub PAT screenshots) were each downloaded and visually confirmed to contain no secrets. The only edit actively recommended before going public is the family-member's-business anecdote (1671188) and deleting the two orphaned PAT screenshots plus the dangling PAT sentence (94470146).
