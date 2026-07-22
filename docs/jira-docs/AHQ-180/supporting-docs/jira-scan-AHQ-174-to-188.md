# Raw Scan Findings: Jira AHQ-174 to AHQ-188

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 14 issues were retrieved in full (description + all comments + attachment lists), and all 6 image attachments (AHQ-184: 1, AHQ-187: 5) were visually inspected.

### AHQ-186 — RED-FLAG
- Where: description
- What: "Emails drafted in private Google Doc at: https://docs.google.com/document/d/REDACTED/edit..." (doc ID redacted here; live in the description)
- Why: Link to a private Google Doc explicitly containing drafted launch emails to specific people — if link-sharing is (or ever becomes) enabled, it leaks recipient names/addresses; even if locked, publishing the URL invites access requests and reveals the doc exists. I could not inspect the doc's contents.
- Suggested action: Remove the URL from the issue (replace with "drafted in a private doc"), and verify the doc's sharing setting is restricted.

### AHQ-ALL (site-wide, observed on every comment/attachment in AHQ-176, 179, 182, 184, 185, 187) — RED-FLAG
- Where: comment/attachment author metadata (Jira user profile), e.g. comment by Steve Halso on 2026-07-11 (AHQ-176)
- What: `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` is returned in the author block of every comment and attachment via the API
- Why: This is Atlassian profile metadata, not issue text — but if the profile's email visibility is "Anyone", the address becomes publicly harvestable via UI/API the moment the site goes public, undoing the repo scrub that removed this address.
- Suggested action: Before flipping Jira public, set Atlassian account profile "Contact → Email address" visibility to private (this is a one-time account setting, not a per-issue edit).

### AHQ-184 — MORE-EMBARRASSING
- Where: attachment "image-20260718-131740.png" (embedded in comment by Steve Halso, 2026-07-18)
- What: Screenshot of the now-public GitHub repo includes the full browser bookmarks bar: a personal-domain Gmail bookmark plus personal to-do and calendar bookmarks (names deliberately not repeated here — open the attachment), and Jira/Confluence/Claude bookmarks
- Why: Reveals personal browsing setup and hints at the personal mail domain that the pre-launch scrub deliberately kept out of the repo; no secrets visible, but more than the screenshot needed to show.
- Suggested action: Re-crop the screenshot to just the GitHub page (drop the browser chrome/bookmarks bar) and replace the attachment.

### AHQ-174 — SLIGHTLY-EMBARRASSING
- Where: description — candid self-critique quoted from the codex report ("That mismatch creates a credibility problem: the repo says 'lightweight wrapper', while the surrounding artifacts say 'massive private process universe'"); harmless honesty, likely fine to leave.

Attachment inventory (for the record):
- AHQ-184: image-20260718-131740.png (reviewed — see finding above)
- AHQ-187: image-20260718-142830.png, image-20260718-142854.png, image-20260718-142923.png, image-20260718-143001.png, image-20260718-143007.png — all reviewed visually; plain GitHub "Secret Protection"/"Push protection" settings toggles and confirmation dialog, no account info, no secrets. Clean.
- All other issues: no attachments.

Notes on things checked and deliberately NOT flagged: "Stephen Halsey" in AHQ-185 is the owner's name already public in the repo LICENSE; AHQ-183's broad-permissions trust concern is a design discussion already published in the repo's own docs, not an exploitable unfixed vulnerability; AHQ-188 disclosing CodeQL "Needs setup" is not exploitable detail; the many references to `docs/jira-docs/AHQ-160/01-...codex-report...md` are local paths that may be dead links post-slimming but leak nothing; AHQ-180's raw Atlassian account ID is non-sensitive.

CLEAN: AHQ-175, AHQ-176, AHQ-177, AHQ-178, AHQ-179, AHQ-180, AHQ-182, AHQ-183, AHQ-185, AHQ-187, AHQ-188

(No failures — all 14 issues retrieved successfully. AHQ-176, AHQ-179, AHQ-182, AHQ-185, AHQ-187 are content-clean but carry the site-wide author-email metadata exposure noted above; AHQ-184's only finding is its screenshot.)
