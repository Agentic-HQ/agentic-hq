# Raw Scan Findings: Confluence — Admin/Security/Jira-Notes Cluster (14 pages)

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these pages in full (bodies + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.
>
> Pages covered: Admin (6586369), Jira Admin (104235012), Discord Admin (98009089), Security - Avoiding npm Supply Chain Attacks (85196801), Jira Notes (21135361), AHQ-43 (20611129), AHQ-56 (23592962), AHQ-143 - Implement "Add Feature" Workflow (67436545), Jira Technical Documents (8847361), AHQ-18 Technical Analysis (8912898), AHQ-21 (10092545), Template - Troubleshooting article (622823), Template - How-to guide (622811), Installation (94502913).

All 14 pages retrieved (bodies, comments, attachment lists). Comments were empty on every page. Here are the findings.

### Jira Admin (id 104235012) — RED-FLAG
- Where: body, section "Upload Backups To Drive"
- What: Link "[Jira & Confluence Agentic HQ Backups](https://drive.google.com/drive/u/0/folders/REDACTED_FOLDER_ID)" (folder ID redacted here; live on the page)
- Why: Public link to the private Google Drive folder holding full Jira + Confluence backups; if the folder is link-shared, anyone gets the entire backup set, and even if not it leaks the backup location/folder ID.
- Suggested action: Remove the link (or whole section); verify the Drive folder is restricted-access; consider restricting the page instead of publishing.

### Jira Admin (id 104235012) — RED-FLAG
- Where: body, section "AHQ Field Configs"
- What: URL containing `atl_token=REDACTED` (token value redacted here; live on the page in the "AHQ Field Configs" section)
- Why: An Atlassian XSRF/session token embedded in an admin URL — credential-shaped material, even if session-bound/expired.
- Suggested action: Redact the `atl_token=` query parameter from the URL.

### Jira Admin (id 104235012) — RED-FLAG
- Where: attachments (27 PNGs: image-20260117-115402/115430/115456/115726/115750/120022/120057/120153/120953/121355/121629/121746/121814/121952/122019/123458/123555.png, image-20260118-173252/173652/173936.png, image-20260130-081731/082003/084528/084604.png, image-20260207-181904/190529/193034.png)
- What: Screenshots of the Jira admin console (field/workflow/screen schemes), the CloudExport/backup-manager pages, and terminal sessions (incl. an MCP auth-error screenshot and `claude mcp list` output)
- Why: Admin-console and terminal screenshots commonly capture the logged-in account name/email, avatar menu, and config detail; none have been content-verified.
- Suggested action: Review each screenshot before go-public, or restrict/keep this page private (it is purely internal admin runbook material).

### Jira Admin (id 104235012) — SLIGHTLY-EMBARRASSING
- Where: body (multiple sections)
- What: Private AI chat links (`gemini.google.com/app/9e89a3c4...`, `chatgpt.com/c/697c6696-...`) plus raw terminal dumps showing machine name `Steves-MacBook-Pro`; note the MCP token/email config blocks are already properly redacted ("the-token", "MY_REDACTED_EMAIL_ADDRESS")
- Why: The chat links are account-private (dead for other viewers) and the page reads as messy internal notes.
- Suggested action: Leave, or remove dead links if tidying; overall recommendation stands to restrict this page rather than scrub it.

### Discord Admin (id 98009089) — RED-FLAG
- Where: body, final section "Enabling Server Discovery"
- What: A sentence disclosing an account-security gap on the Discord server owner account (specifics deliberately not repeated here — it is the final sentence of the page)
- Why: Publicly discloses a security-posture weakness on infrastructure the project runs.
- Suggested action: Redact the sentence (or remediate the gap now and then delete the sentence).

### Discord Admin (id 98009089) — RED-FLAG
- Where: body, section "Permanent Invite Link"
- What: "Link is: https://discord.gg/REDACTED_INVITE_CODE" (permanent, presumably unlimited-use invite — code redacted here; live on the page)
- Why: Bucket rules say flag Discord invite links; this one appears intentionally public (launch invite), but confirm — if it was meant for controlled sharing, a permanent invite on a public wiki can't be selectively revoked later without breaking the published link.
- Suggested action: Confirm it is the intended public invite; leave if so, otherwise regenerate the invite and redact.

### Discord Admin (id 98009089) — SLIGHTLY-EMBARRASSING
- Where: body + attachments (16 PNGs: image-20260702-212331/212401/212406/212453/213111/213127/213159.png, image-20260704-120526/120532/120753/121203/121329/121355/121610/123007/123409.png)
- What: Reveals private moderation channels (`#mod-logs`, `moderator-updates` with channel URLs), a pasted Gemini private chat link, and unreviewed Discord server-settings screenshots (invite-management and settings screens may show the owner account/email)
- Why: Channel links are permission-gated and low risk, but the settings screenshots haven't been content-checked.
- Suggested action: Skim the screenshots for account email/private detail; otherwise leave.

### AHQ-18 - jira-verbatim-content-extractor ... Technical Analysis (id 8912898) — RED-FLAG
- Where: attachment "mcp-atlassian-getJiraIssue-1769164133762.txt" (160KB, text)
- What: Raw, unredacted Jira API response export for AHQ-6 with `expand=renderedFields,names,changelog` — the page itself notes the changelog contains "verbose author data"
- Why: Raw Jira API exports carry Atlassian accountIds, display names, avatar URLs and potentially `emailAddress` fields for every author/commenter (not verified by download, but high likelihood).
- Suggested action: Delete the attachment — the analysis is complete and the file has no ongoing value; if kept, grep it for emails/accountIds first.

### Security - Avoiding npm Supply Chain Attacks (id 85196801) — SLIGHTLY-EMBARRASSING
- Where: body, "Jira" section
- What: "a follow up Jira due to still be done under: AHQ-154" (plus two private AI chat links)
- Why: Reveals a security-hardening follow-up is still outstanding, but with zero exploitable detail on this page — the detail (if any) lives in the linked Jiras; check AHQ-152/AHQ-154 content if Jira is also going public.
- Suggested action: Leave, or drop the "still to be done" clause once AHQ-154 closes.

### AHQ-43 (id 20611129) — SLIGHTLY-EMBARRASSING
- Where: body — "Not sure if I'm doing these any more…?" with abandoned sub-task list; messy working notes. Suggested action: leave.

### AHQ-56 (id 23592962) — SLIGHTLY-EMBARRASSING
- Where: body — pasted private ChatGPT project link (dead for other viewers) plus verbatim AI Q&A notes. Suggested action: leave.

### AHQ-21 - Create Integration Test for Unix CLI Process Kill Script (id 10092545) — SLIGHTLY-EMBARRASSING
- Where: body — two private ChatGPT links and typos ("GREED phase", "phease"); otherwise clean technical spec. Suggested action: leave.

### Template - Troubleshooting article (id 622823) — SLIGHTLY-EMBARRASSING
- Where: whole page — untouched default Confluence template. Suggested action: leave or delete.

### Template - How-to guide (id 622811) — SLIGHTLY-EMBARRASSING
- Where: whole page — untouched default Confluence template. Suggested action: leave or delete.

Cross-cutting notes for the aggregator:
- STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS appears NOWHERE in these 14 pages — all email/token spots in Jira Admin were already placeholder-redacted before pasting.
- No live API tokens, passwords, or webhook URLs found in any page body; the only token-shaped string is the `atl_token` CSRF value above.
- The two admin pages (Jira Admin, Discord Admin) are pure internal runbooks with 43 unreviewed screenshots between them; the lowest-effort safe fix is to restrict both pages rather than scrub them item-by-item.
- All pages returned zero comments; attachments exist only on Jira Admin (27), Discord Admin (16), and AHQ-18 (1), all listed above.

CLEAN: Admin (6586369, empty body), Jira Notes (21135361, empty body), AHQ-143 - Implement "Add Feature" Workflow (67436545, pointer stub), Jira Technical Documents (8847361, empty body), Installation (94502913, one-line stub)
