# Raw Scan Findings: Jira AHQ-73 to AHQ-88

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these issues in full (descriptions + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.

All 16 issues read in full (descriptions + all comments + attachment lists). Only AHQ-83 has an attachment. Findings:

### AHQ-74 — RED-FLAG
- Where: description (section "Things I Realised During Discussion With Claude / Gemini")
- What: "[discussion with Gemini](https://gemini.google.com/app/96c62ad540b06765)" — link to a private Gemini conversation
- Why: Link to a private Google resource; almost certainly only resolves for the owner's Google account, but it is a private-resource URL of the class flagged for review
- Suggested action: Remove or de-link the URL (keep the plain-text mention of the Gemini discussion if wanted)

### AHQ-74 — SLIGHTLY-EMBARRASSING
- Where: description ("Big Ask" / "End Result - UPDATED") and comment by Steve Halso 2026-03-03
- What: "I'm leaning heavily on you, the AI... This is your chance to shine", "I have a **LOT** of spare tokens and a lot of time", "Ended up realising I am overthinking and overplanning all this" — rambling/self-deprecating planning notes
- Why: Mild self-deprecation and personal-time context; harmless
- Suggested action: Leave as-is or lightly trim

### AHQ-83 — RED-FLAG
- Where: attachment "AHQ-83_conversation_including_beads_install.txt" (160,887 bytes, text/plain, uploaded 2026-03-15)
- What: Full raw Claude Code conversation transcript including the install of the third-party "Beads" tool
- Why: Raw session transcripts routinely capture environment details, config output, tool responses, and potentially tokens/credentials; 160KB is too large to have been reviewed casually. I could not scan it: the file exists only as a Jira attachment (not in the local repo — confirmed by searching agentic-hq, agentic-hq-private, agentic-hq-archive-001, agentic-hq-beads), and the MCP download tool returns it only as inline base64, which is not inspectable
- Suggested action: Manually review the transcript before go-public, or simply delete the attachment (the issue is Abandoned; the distilled outcome is already in docs/jira-docs/AHQ-83/beads-implementation/)

### AHQ-83 — SLIGHTLY-EMBARRASSING
- Where: description
- What: "I got completely lost and confused and overwhelmed with over-thinking and over-designing and 'analysis paralysis'... so I ended up asking Claude Code for HELP!!!"
- Why: Candid self-deprecation about analysis paralysis
- Suggested action: Leave as-is or soften

### GENERAL (instance-level, not issue content) — RED-FLAG
- Where: comment/attachment author metadata on every issue (returned by the API)
- What: Author profile resolves to email "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"
- Why: Whether anonymous public viewers see this depends on the Atlassian profile "Email visibility" setting, not on the issue text — worth verifying it is set to private before go-public
- Suggested action: Check Atlassian account profile visibility settings (Profile → Privacy → Email address → "Only you and admins")

Notes on things checked and deliberately not flagged: pervasive `/Users/stevepersonal/...` paths, `stevepersonal@Steves-MacBook-Pro` shell prompts, "Claude Max" plan banner, `/tmp/tmp-Steve-Workspace-001` paths, the `--allowedTools`/settings.local.json auto-approve test setup (design fact, mirrored in the public repo), "credit saving" test-skip notes, and cross-links to the Confluence wiki and TEST-70 (dead links for outsiders unless those spaces/projects are also made public — if Confluence is going public too, the AHQ-83 "ChatGPT Conversation" wiki pages deserve their own review, but that's outside this Jira scan).

CLEAN: AHQ-73, AHQ-75, AHQ-76, AHQ-77, AHQ-78, AHQ-79, AHQ-80, AHQ-81, AHQ-82, AHQ-84, AHQ-85, AHQ-86, AHQ-87, AHQ-88

FAILED: none
