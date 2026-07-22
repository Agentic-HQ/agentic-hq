# Raw Scan Findings: Jira AHQ-122 to AHQ-139

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues were retrieved and read 100% in full (descriptions + all comments + attachment lists), including the oversized AHQ-136 payload (read completely from the saved file: 233-line description + all 11 comments). All 3 image attachments were viewed.

### AHQ-139 — RED-FLAG
- Where: attachment "image-20260512-195345.png" (full-browser Discord screenshot in description)
- What: Screenshot captures Steve's entire Chrome window, not just Discord: personal bookmarks bar showing personal-domain mail, two banking bookmarks, a family-related booking bookmark and several other personal bookmarks (names deliberately not repeated here — open the attachment), a "Work" browser profile chip, plus the Discord left rail showing other servers he belongs to and profile photos/avatars of private individuals (DM contacts)
- Why: Leaks personal-life/financial context (banking, family hints) and identifiable images of uninvolved private individuals
- Suggested action: Delete the attachment or replace with a tightly cropped screenshot of only the Discord server panel

### AHQ-139 — RED-FLAG (conditional — verify)
- Where: description + comment by Steve Halso on 2026-07-04
- What: Repeated links to Confluence page "Discord Admin" (`/wiki/spaces/ahq/pages/98009089`), described as holding the Discord server setup/admin details
- Why: If the Confluence space goes public alongside Jira (or later), that page likely exposes Discord admin configuration; the Jira links funnel readers straight to it
- Suggested action: Confirm the ahq Confluence space stays private (or scrub that page) before launch

### AHQ-139 — SLIGHTLY-EMBARRASSING
- Where: description
- What: Link to a private Gemini conversation (`gemini.google.com/app/97baa846861c4952`) — inaccessible to anyone else (dead link for the public, no data leak), just looks untidy.

### PROJECT-WIDE — RED-FLAG (metadata, not issue text)
- Where: every issue — Jira author/reporter metadata
- What: The Atlassian account profile returns `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` via the API for every comment/attachment author record
- Why: If the profile's email visibility is "Anyone", a public Jira exposes the personal email to the whole internet via API/profile pages (it never appears in any issue body text)
- Suggested action: Set Atlassian profile email visibility to private before making the project public

### AHQ-136 — SLIGHTLY-EMBARRASSING
- Where: comments by Steve Halso on 2026-05-16 (13625, 13626)
- What: Verbatim terminal transcripts exposing machine hostname/username prompt `(base) stevepersonal@Steves-MacBook-Pro-4`, local `claude --resume` session UUIDs, and "Opus 4.7 … Claude Max" subscription tier — no secrets ($PATH was already manually redacted); one line: harmless machine/plan details, leave or trim.

### AHQ-132 — SLIGHTLY-EMBARRASSING
- Where: description
- What: Informal banter with typos ("Hey, blow me away… ltos of hard to read,complex code… humuan") — casual tone only, likely fine to leave.

### AHQ-133 — SLIGHTLY-EMBARRASSING
- Where: description
- What: Unverified hearsay about a named maintainer: "I hear he has blocked AI only contributions as he was getting overwhelmed" (re the `pi` project) — mild and non-defamatory, could soften to cite the project's public policy.

### AHQ-130 — SLIGHTLY-EMBARRASSING
- Where: description + comment (same text duplicated)
- What: Rambling naming musings ("Not sure I even like forkle… sounds a bit strange, like 'fiddle'… may never be used!!!!") — messy but harmless.

Notes on things checked and deliberately NOT flagged: AHQ-122's screenshot is a plain terminal workflow listing (hostname/paths only — same class as the pervasive local paths); AHQ-137 describes security tooling that is already enabled/verified (no unfixed vulnerability detail); AHQ-136's retrospective mentions `~/.zshrc` edits but reveals nothing sensitive; Discord channel URLs in AHQ-139 are server/channel IDs, not invite links or tokens; links to private GitHub repos and the private Confluence wiki elsewhere are dead links for the public, not leaks. No API keys, tokens, webhooks, passwords, or other credentials found anywhere in the 16 issues.

CLEAN: AHQ-122, AHQ-123, AHQ-124, AHQ-127, AHQ-128, AHQ-129, AHQ-131, AHQ-134, AHQ-135, AHQ-137, AHQ-138

FAILED: (none — all 16 issues retrieved successfully)
