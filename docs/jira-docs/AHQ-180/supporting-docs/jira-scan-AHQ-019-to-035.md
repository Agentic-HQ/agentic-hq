# Raw Scan Findings: Jira AHQ-19 to AHQ-35

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues retrieved in full (description + all comments + attachment field requested on every call — no issue returned any attachments, so none of these 16 issues has attachments).

### AHQ-27 — RED-FLAG
- Where: description (top of issue)
- What: "https://chatgpt.com/share/REDACTED" (share ID redacted here; live in the description)
- Why: This is a *public* ChatGPT share link — anyone on the internet can read the full conversation, and its content has not been reviewed for personal/sensitive material.
- Suggested action: Open the shared conversation, review its content, and either unshare it in ChatGPT or remove the link from the issue before going public.

### AHQ-27 — SLIGHTLY-EMBARRASSING
- Where: description
- What: "https://chatgpt.com/g/g-p-688c62f8b1fc819199f4f57af733aeb6-agentic-hq/c/697b692e-2174-8326-bd6a-05a522755994"
- Why: Private ChatGPT project-conversation link — dead/inaccessible to the public (requires Steve's login), so just a broken reference, not a leak.
- Suggested action: Optionally delete the dead link; no security impact.

### AHQ-21 — SLIGHTLY-EMBARRASSING
- Where: description (second line)
- What: "From https://chatgpt.com/g/g-p-688c62f8b1fc819199f4f57af733aeb6-agentic-hq/c/69739790-8f90-832f-a9ed-4967d17e84fc"
- Why: Same private ChatGPT project link pattern — inaccessible to the public, just a dead reference.
- Suggested action: Optionally remove; no data leaks through it.

### AHQ-31 — SLIGHTLY-EMBARRASSING
- Where: description
- What: "Don't know how to do line by line debugging of a CLI app run using npm."
- Why: Mild self-deprecation only.
- Suggested action: Leave as-is.

### AHQ-32 — SLIGHTLY-EMBARRASSING
- Where: labels vs comments
- What: Label is "Abandoned" but the final comments say "Completed and merged branch to main" / "Closing as completed now."
- Why: Contradictory status is mildly confusing to public readers, nothing sensitive.
- Suggested action: Fix or remove the "Abandoned" label if it's wrong.

### GENERAL (all 16 issues) — RED-FLAG (site-level, not issue content)
- Where: comment author metadata on every commented issue (AHQ-21, 23, 24, 25, 26, 32, 34, 35)
- What: The Jira API returns author "email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS" (plus a gravatar hash of that email) on every comment.
- Why: This is Atlassian *profile* metadata, not text Steve typed into any issue — but if the Atlassian account's profile-visibility setting for email is not "Only you / admins", making the site public exposes the address to anyone.
- Suggested action: Before go-live, check Atlassian account privacy settings (Profile and visibility → Contact → Email address) and confirm it is not publicly visible; no issue edits needed.

Additional notes for the aggregator:
- No secrets, credentials, tokens, webhook URLs, or connection strings found in any of the 16 issues.
- No names of other private individuals, employers, or clients found — Steve Halso / "halso" / STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS appears only as owner/author.
- No open exploitable-vulnerability details found. AHQ-23/AHQ-34 contain long terminal dumps and dependency lists (including shell prompts "stevepersonal@Steves-MacBook-Pro") — per instructions these local-path/hostname artifacts were not flagged as they reveal only the owner.
- Attachments: none on any scanned issue.

CLEAN: AHQ-19, AHQ-20, AHQ-22, AHQ-23, AHQ-24, AHQ-25, AHQ-26, AHQ-28, AHQ-29, AHQ-30, AHQ-34, AHQ-35
