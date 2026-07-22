# Raw Scan Findings: Confluence — Strategy/Planning/Personal-Notes Cluster (14 pages)

> Output of the scan agent (lightly redacted for public committing — ⚠️ follow the Redaction Policy at the top of `../01-claude-report-on-public-jira-confluence-red-flags.md` before editing this file) that read these pages in full (bodies + all comments + attachments) ahead of making Jira/Confluence public (AHQ-180). Aggregated conclusions live in `../01-claude-report-on-public-jira-confluence-red-flags.md`.
>
> Pages covered: Agentic HQ (622798), Agentic HQ Point And Direction (20152323), Point Of AHQ - 14th Feb 2026 (20414465), Stuff To Add To README Docs (found at 104202243, tree listed stale id 25034753), Learnt From Classwitch Project Time Wasted (60489729), Project Principles (60948495), Planning (2392065), Tactics For Getting To Launch Fast (1835188), Life Changing ChatGPT Conversation About Moving Faster (63242241), Launch YouTube Video Plan (1376284), Things To Remember While Doing This Project (1376317), Ideas For Agentic HQ (622841), AI Prototype Driven Development (1343501), Claude Edited Duplicate Of: AI Prototype Driven Development (131078).

All pages, comments, and attachments have now been fully reviewed. Coverage statement: I read 100% of every retrievable page body (including the full 70K-char transcript page 1343501, and verified page 131078 is byte-identical to it), all comment threads (every page has zero comments), all attachment lists, and visually inspected all 11 image attachments across the cluster. One task-list id (25034753) does not exist, but the page with that exact title was found at id 104202243 and fully scanned.

---

### Tactics For Getting To Launch Fast (id 1835188) — RED-FLAG
- Where: body, "Log Of Things I Get/Got Distracted Onto" bullet
- What: Link to private Google Doc labelled "[DRD](https://docs.google.com/document/d/REDACTED/edit...) (private)" (doc ID redacted here; live on the page)
- Why: Google Docs share links leak the doc to anyone if link-sharing is on; even if not, it publishes the private doc ID
- Suggested action: Remove the link (or verify doc is restricted-access and remove the "(private)" label)

### Tactics For Getting To Launch Fast (id 1835188) — RED-FLAG
- Where: body, final section "Steve's Private 'Focus.md' Doc"
- What: "See private Google Doc: https://docs.google.com/document/d/REDACTED/... about how to stay focussed, and what things to avoid doing." (doc ID redacted here; live on the page)
- Why: Explicitly advertises a personal private document and publishes its doc ID; leaks content if link-sharing is enabled
- Suggested action: Delete this whole section (it's a pointer to a personal doc, adds nothing public-facing)

### Tactics For Getting To Launch Fast (id 1835188) — SLIGHTLY-EMBARRASSING
- Where: body — "punishment list", all-caps "YOU'VE FAILED, AS YOU'VE BEEN DOING IT TOO WELL AND GOING TOO SLOW!!!", and a chatgpt.com conversation link (owner-only, won't leak to others)
- What: Self-flagellating motivational notes plus a private ChatGPT convo link
- Why: Candid but harmless; ChatGPT /c/ links 404 for anyone but the owner
- Suggested action: Leave (optionally strip the chatgpt.com link)

### Stuff To Add To README Docs (id 104202243 — NOT 25034753 as listed) — RED-FLAG (borderline)
- Where: attachment "image-20260318-183916.png" (embedded mid-page after the Primeagen quote)
- What: Full-desktop browser screenshot showing Steve's personal bookmarks bar and tab strip: a personal-domain Gmail bookmark (ties to the personal email address), a family-related booking bookmark and other personal bookmarks (names deliberately not repeated here — open the attachment), Jira/Confluence/Outlook/personal tabs, plus an in-page find dialog searching a swear word
- Why: Leaks personal browser environment / personal-domain and family-adjacent bookmarks to the public; only the video-player area was the intended content
- Suggested action: Replace with a cropped screenshot of just the video/transcript, or delete the image

### Stuff To Add To README Docs (id 104202243) — MORE-EMBARRASSING
- Where: body, section about a company floated as a potential partner
- What: A blunt one-line insult of the named company's web design (name/quote deliberately not repeated here — easy to find on the page)
- Why: Public insult of a named company he simultaneously floats as a partner
- Suggested action: Delete the insult sentence

### Stuff To Add To README Docs (id 104202243) — MORE-EMBARRASSING
- Where: body, conference-talk paragraph (pasted three times)
- What: A dismissive two-sentence remark about a named conference speaker's talks (name/quote deliberately not repeated here — see the thrice-pasted paragraph on the page)
- Why: Dismissive remark about a named person in a community he wants to engage; also duplicated 3x
- Suggested action: Soften or cut; dedupe the triple paste

### Stuff To Add To README Docs (id 104202243) — SLIGHTLY-EMBARRASSING
- Where: body throughout — attributed quotes containing "horseshit", "slop", "bunch of idiots" (all quoting named YouTubers, not Steve's words); duplicated link pastes; "gstack … released by Garry Tan (the CEO of Y Combinator)" (AI-pasted text of dubious accuracy)
- What: Messy quote-dump formatting and quoted swearing
- Why: Reads as raw notes; quotes are attributed so low risk
- Suggested action: Leave (or tidy duplicates)
- Note: other 7 attachments verified benign (public conference/YouTube/article screenshots: 1000036953.jpg, Screenshot_20260413_140838_YouTube.jpg, Screenshot_20260422_135025_YouTube.jpg, image-20260416-122632/122810/123334/123457.png)

### Learnt From Classwitch Project Time Wasted (id 60489729) — SLIGHTLY-EMBARRASSING
- Where: body
- What: Candid post-mortem of 2 months "pure waste of time", "dull as ditchwater"
- Why: Honest self-critique of an abandoned sub-project; nothing personal
- Suggested action: Leave

### Things To Remember While Doing This Project (id 1376317) — SLIGHTLY-EMBARRASSING
- Where: body
- What: Unfinished placeholder "&lt;fill in here&gt;"
- Why: Obviously incomplete note page
- Suggested action: Leave or fill in

### AI Prototype Driven Development (id 1343501) — SLIGHTLY-EMBARRASSING
- Where: body, top
- What: Link "https://claude.ai/chat/77d45a31-1866-491e-a2a6-eca83969ace5" plus 60K+ chars of raw pasted Claude transcript (incl. candid detail that his BMad spec effort "collapsed", and chit-chat praising the model)
- Why: claude.ai/chat links are owner-only (no leak); transcript is verbose personal-workflow musing but contains nothing sensitive
- Suggested action: Leave (optionally strip the claude.ai link)

### Claude Edited Duplicate Of: AI Prototype Driven Development (id 131078) — SLIGHTLY-EMBARRASSING
- Where: whole page
- What: Byte-identical duplicate of page 1343501 (verified by diff)
- Why: Redundant duplicate with a confusing title; doubles the surface of the same content
- Suggested action: Delete this duplicate page

### Life Changing ChatGPT Conversation About Moving Faster (id 63242241) — SLIGHTLY-EMBARRASSING
- Where: body, top
- What: Private ChatGPT project conversation link (chatgpt.com/g/g-p-.../c/696a4d1c-...); attachment "image-20260507-095101.png" verified benign (screenshot of his own AHQ-1 Jira text, which itself repeats the same ChatGPT link)
- Why: Despite the dramatic title this page is NOT personal — it's product-development philosophy; the ChatGPT link is owner-only so no data leak
- Suggested action: Leave (optionally strip the chatgpt.com links)

---

CLEAN: Agentic HQ space home (622798 — Confluence template boilerplate only); Agentic HQ Point And Direction (20152323 — page exists but has an EMPTY body, container page only); Point Of AHQ - 14th Feb 2026 (20414465); Project Principles (60948495 — mild "Pi ... you'd need to pay full API pricing" competitor comment, non-defamatory, fine); Planning (2392065 — empty container page); Launch YouTube Video Plan (1376284); Ideas For Agentic HQ (622841 — both attachments verified benign: cropped Fowler-article and own-planning-doc text).

FAILED: 25034753 ("Stuff To Add To README Docs") — API error "no content with the given id, or no permission" on two attempts; however the page with that exact title was located by title search at id 104202243 and fully scanned (findings above). The task list's id appears stale — worth confirming no second page exists under 25034753 with restricted permissions.

Overall: the two feared "deeply personal" pages (Tactics, Life Changing ChatGPT) contain no health/financial/family content — the only genuine pre-public blockers are the two private Google Docs links on 1835188 and the full-desktop screenshot on 104202243.
