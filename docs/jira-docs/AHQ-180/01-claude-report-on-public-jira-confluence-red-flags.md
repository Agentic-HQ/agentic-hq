# AHQ-180: Red-Flag Scan Report — Making Jira & Confluence Public

> ## ⚠️ REDACTION POLICY — READ BEFORE EDITING ANY FILE IN THIS FOLDER ⚠️
>
> **This report and everything under `supporting-docs/` are committed to the PUBLIC GitHub repo.** All sensitive values have been redacted, and every future edit — by humans or by AI agents, **including post-compaction / fresh-context agents that never saw this instruction being given** — MUST apply the same redactions before writing:
>
> - Steve's personal email → `STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS`; his personal domain → `STEVES_REDACTED_PERSONAL_DOMAIN`.
> - Google Doc/Drive IDs, tokens (`atl_token` etc.), ChatGPT `/share/` IDs, Perplexity thread IDs, Discord invite codes → `REDACTED` (keep the host/path shape so the finding stays meaningful).
> - Family, financial and personal-life specifics (bookmark names, family businesses, etc.) → generic descriptions only.
> - Embarrassing quotes about, or names of, third parties in pending findings → describe generically and point at the Jira issue / Confluence page where the original lives — never republish the quote/name here.
>
> Rule of thumb: these files describe **WHERE** sensitive things are, never **WHAT** they literally are. If you paste any value from Jira/Confluence into a file in this folder, redact it per the above first.

**Date:** 2026-07-18
**Scope:** All 174 issues in the AHQ Jira project (AHQ-1 → AHQ-188, gaps are deleted issues) and all 58 pages in the `ahq` Confluence space — descriptions/bodies, **all** comments, and attachments (most images/text attachments were downloaded and visually inspected; the few that couldn't be are explicitly flagged below).
**Method:** 15 parallel scan agents (11 Jira batches, 4 Confluence clusters), each reading content in full. Raw per-batch findings are in [`supporting-docs/`](supporting-docs/) — see index at the bottom.

**Headline:** No live credentials, API keys, passwords, or webhook URLs were found anywhere in Jira or Confluence content. The real risks were: your **Atlassian profile email visibility** (R1), one comment with your **email pasted in the body** (R2), the two **admin runbook pages** on Confluence (R3/R4 — Drive backup link, an `atl_token`, ~43 unreviewed screenshots), a handful of **public/verify-me share links** (R6 ChatGPT, R7 Google Docs, R9 Perplexity), three **full-desktop screenshots** showing your personal bookmarks bar (R5), and a few **unverified attachments** (R8). Everything else is cosmetic.

**Status (2026-07-20 triage):** **All ten red flags are resolved.** R1, R2, R5, R6, R7, R8, R9 and R10 are **closed and verified** (see each item's Comment). R3/R4 (and R7's Tactics page) are now **API-verified as restricted**: on 2026-07-20 Steve moved the whole private area under a "Restricted" parent page (id 105578514) whose read restriction — his account only — IS visible to the API and cascades to all descendants (descendancy proven by CQL ancestor search). Only the belt-and-braces post-public logged-out spot-check remains — tracked as launch-day Jira [AHQ-190](https://agentic-hq.atlassian.net/browse/AHQ-190) (see X4). **Every item in this report (R, M, S and X) now has a recorded decision; triage is complete.**

**Status (2026-07-22 — public flip complete):** Jira and Confluence are now **live public**. The permission setup used is documented step-by-step in [How To: Set Up Permissions For Public Jira (In July 2026)](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/105349138/How+To+Set+Up+Permissions+For+Public+Jira+In+July+2026). The X4 post-flip logged-out verification has been **run and all four checks passed** (evidence in [Claude's comment on AHQ-190](https://agentic-hq.atlassian.net/browse/AHQ-190?focusedCommentId=14492); see R1/R3/R4/R7/X1/X4 below). The Atlassian open-source licence has been **applied for** ([AHQ-189](https://agentic-hq.atlassian.net/browse/AHQ-189), 2026-07-22) — the only remaining step is waiting for Atlassian's approval. **Nothing in this report is outstanding.**

---

## How To Read This Report

- **🔴 RED FLAGS** — fix before flipping public (data/privacy/security actually at stake).
- **🟠 MORE EMBARRASSING** — worth a quick edit if you have 10 minutes; nothing leaks.
- **🟡 SLIGHTLY EMBARRASSING** — listed for awareness; you said you won't have time/effort to fix these, and none of them need it.
- Every item has **Details / Recommendation / Decision / Comment** — fill in Decision/Comment as you triage.
- ⚠️ Before editing any Jira text based on a quote in this report, check the issue in the **Jira UI** first — MCP read-back is known to mangle formatting (escaped `**`, dropped `+`), so quotes here may differ cosmetically from what the UI shows.

---

## 🔴 RED FLAGS — Do Before Going Public

### R1. Atlassian profile email visibility (site-wide) — personal email in all author metadata

- **Details:** Every one of the 15 scan agents observed `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` in the author metadata of every comment/attachment via the REST API. It is **not** in issue text (except R2). This is controlled by your Atlassian **account profile** setting, not by any issue — if it is set to "Anyone", the moment the site is public the address is harvestable from every comment via the API/UI, undoing the repo email scrub (AHQ-171).
- **Recommendation:** Atlassian account → Profile and visibility → Contact → Email address → set to "Only you and admins". After flipping public, verify from a logged-out browser/incognito API call that the email no longer appears.
- **Decision:** [x] Already private — setting confirmed by Steve 2026-07-19
- **Comment:** The scan agents saw the email because the MCP server authenticates as Steve's own account, and Atlassian always returns the address to the profile owner (and admins) regardless of the visibility setting — so the observation was expected and says nothing about the anonymous view. Residual step: the anonymous view can't be checked from a logged-in session (or at all while the site is private), so do the one-time logged-out/incognito check after flipping public. R2 (email in comment *body text*) is unaffected by this setting and still stands.
  - **Post-flip verified (Claude, 2026-07-22):** The logged-out check is done. AHQ-72 (a heavily-commented issue) fetched anonymously via both the rendered UI and the REST API: **zero** `emailAddress` fields anywhere in the anonymous issue/comment JSON, and no email or personal domain in the rendered page — only the public display name. R1 is fully closed. Evidence: [AHQ-190 comment](https://agentic-hq.atlassian.net/browse/AHQ-190?focusedCommentId=14492).

### R2. AHQ-72 — your email pasted in a comment body

- **Details:** Comment by you on 2026-03-01 ("Manual test results:", comment id 11779) pastes MCP terminal output containing `"reporter": ... "email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` as literal text. R1's profile setting does **not** fix this one — it's content.
- **Recommendation:** Edit the comment and delete/redact the reporter block from the pasted JSON.
- **Decision:** [x] Edit comment — done by Steve 2026-07-19
- **Comment:** I've replaced the email address with: STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS. Please confirm this is fixed and double check there is **NO** history this can be found from.
  - **Verified (Claude, 2026-07-19):** Re-fetched comment id 11779 — the pasted JSON now reads `"email": "STEVES_REDACTED_PERSONAL_EMAIL_ADDRESS"` (literal placeholder), edit timestamp confirms today's change; no other AHQ-72 comment contains the email in body text. History checks: Jira Cloud keeps **no comment version history** (UI or REST — unlike Confluence pages), only current bodies are served; the AHQ-72 changelog contains only status/resolution entries and today's edit added nothing to it; the comment will show an "(edited)" marker but the prior text is not retrievable by any user. Outside Jira: the original text exists only in (a) the private Google Drive Jira backups taken before this edit (see R3 — keep that folder private) and (b) any email notification from the original 2026-03-01 post (your own inbox). The pre-redaction drafts of these report files were never committed to git (folder untracked, no commits on any branch).

### R3. Confluence "Jira Admin" page (id 104235012) — Drive backup link, `atl_token`, 27 unreviewed screenshots

- **Details:** The page contains (a) a link to the private Google Drive folder holding **full Jira + Confluence backups** (`drive.google.com/drive/u/0/folders/REDACTED_FOLDER_ID` — folder ID redacted here, live on the page); (b) an admin URL embedding `atl_token=REDACTED` (Atlassian XSRF/session token — credential-shaped even if expired); (c) 27 attached screenshots of the Jira admin console, backup manager, and terminal sessions that were **not** content-verified. Body email/token config blocks were already placeholder-redacted ("the-token", "MY_REDACTED_EMAIL_ADDRESS").
- **Recommendation:** Don't scrub item-by-item — **restrict this page** (page restrictions → only you). It's a personal admin runbook with zero public value. If you'd rather publish it: remove the Drive link, strip the `atl_token` param, and review all 27 screenshots. Note also the version-history risk in the Residual Risks section — if those redactions were made by editing the page, the unredacted originals live in page history, which is public on a public space; restricting the page sidesteps that too.
- **Decision:** [x] Restrict page — under the "Admins Only" folder inside the read-restricted "Restricted" page since 2026-07-20 (✅ restriction API-verified, see below)
- **Comment:** I've restricted this in a folder called "Admins Only" which will be for Jira Admins only (currently only myself) - see https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/104235012/Jira+Admin
  - **Verified (Claude, 2026-07-19):** The move is confirmed — "Admins Only" (id 104169546) is a real Confluence **folder** (created 2026-07-18) and both this page and Discord Admin now sit under it. **However, the restriction itself could not be confirmed from the API:** the restrictions endpoint reports **no read restrictions** on the folder or on either page (it shows direct page restrictions only and may simply not expose folder-level restrictions for the new folder content type — inconclusive, not proof of failure). Because this page still carries the live Drive folder ID and `atl_token`, do not treat this as closed until: (a) the folder/pages show the restricted-lock indicator in the Confluence UI, and (b) immediately after flipping public, both page URLs are checked from a logged-out/incognito browser (expect access-denied). Belt-and-braces option: also set explicit view restrictions on the two pages themselves — that IS API-verifiable. If the restriction holds, the page-history risk (X1) is sidestepped for this page.
  - **Steve's decision (2026-07-19):** Folder restriction is enough — no page-level locks. Remaining close-out steps are his: confirm the restricted-lock indicator on the folder in the UI now, and do the logged-out/incognito check of both admin page URLs immediately after flipping public.
  - **Update (2026-07-20) — restriction now API-verified:** Steve restructured the private area under a new top-level page "**Restricted**" (id 105578514), which now holds all the private folders ("Admins Only", "Steve Private", "Steve Private Planning Docs", "Steves Random Stuff", "Launch", "YouTube Video"). Unlike folder restrictions, **page restrictions ARE API-visible**: the Restricted page reports read and update both limited to exactly one account, confirmed to be Steve's, and Confluence view restrictions cascade to all descendants. This page's descendancy is proven by a CQL `ancestor = 105578514` search, which returns it along with Discord Admin, the Tactics page and the rest of the private tree. The 2026-07-19 "not API-verifiable" caveat is closed. A logged-out browser check today shows this URL serving an Atlassian login wall — though that currently proves only that the whole site is still private (a should-be-public control page is walled too), so the X4 post-flip check remains as belt-and-braces.
  - **Post-flip verified (Claude, 2026-07-22):** With the site now public, this page returns **HTTP 404** to anonymous API requests and "Page Not Found" in a logged-out browser — no content, no hint it exists — while the public control page (105087037) renders normally, proving the wall is a real restriction and not a broken site. R3 is fully closed.

### R4. Confluence "Discord Admin" page (id 98009089) — 2FA disclosure, invite link, 16 unreviewed screenshots

- **Details:** (a) The final section ("Enabling Server Discovery") discloses an account-security gap on the Discord owner account that should not be public until remediated (specifics deliberately not repeated here — read the page's final sentence); (b) a permanent invite link (`discord.gg/REDACTED_INVITE_CODE` — code redacted here, live in the page's "Permanent Invite Link" section) — fine **if** it's the intended public launch invite, but confirm; (c) names private moderation channels (`#mod-logs`, `moderator-updates`); (d) 16 Discord server-settings screenshots not content-verified (settings screens can show the owner account email).
- **Recommendation:** Remediate the disclosed account-security gap now (good idea regardless), then either restrict the page or delete the disclosing sentence and skim the 16 screenshots. Confirm the invite link is the one you want permanently public.
- **Decision:** [x] Restrict page — under the "Admins Only" folder inside the read-restricted "Restricted" page since 2026-07-20 (✅ restriction API-verified, see below)
- **Comment:** I've restricted this in a folder called "Admins Only" which will be for Jira Admins only (currently only myself) - see https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/98009089/Discord+Admin
  - **Verified (Claude, 2026-07-19):** Same status as R3 — the move into the "Admins Only" folder is confirmed, but the restrictions endpoint reports no read restrictions on the folder or this page (inconclusive for folder-level restrictions; see R3 for the two decisive checks). If the restriction holds, the disclosure sentence, invite link, channel names and 16 screenshots are all hidden.
  - **Update (2026-07-20) — restriction now API-verified:** Same as R3 — the page is proven (CQL ancestor search) to sit under the read-restricted "Restricted" page (105578514, Steve's account only), and inherits its view restriction. Logged-out browser today: Atlassian login wall (whole site still private). X4 post-flip check remains as belt-and-braces. Two things restriction does **not** cover: (a) the underlying account-security gap on the Discord owner account is still worth remediating on the Discord side regardless — it just stops being a go-public blocker; (b) the invite code keeps working for anyone who already has it, which is fine if it's the intended public invite.
  - **Post-flip verified (Claude, 2026-07-22):** Same result as R3 — anonymous HTTP 404 / "Page Not Found" for this page while the public control renders. R4 is fully closed (the two restriction-doesn't-cover notes above still apply on the Discord side).

### R5. Full-desktop screenshots exposing personal bookmarks bar (3 places)

- **Details:** Three screenshots capture your whole browser window instead of just the intended content (specific bookmark names deliberately not repeated here — open each attachment to see them):
  1. **AHQ-139** attachment `image-20260512-195345.png` — the worst: bookmarks bar shows personal-domain mail, **two banking bookmarks**, a family-related booking bookmark and personal to-do list, plus the Discord left rail with your other servers and **avatars of private individuals** (DM contacts).
  2. **Confluence "Stuff To Add To README Docs"** (id 104202243) attachment `image-20260318-183916.png` — bookmarks bar (personal-domain Gmail, the same family-related bookmark, personal tabs) plus an in-page find dialog searching a swear word.
  3. **AHQ-184** attachment `image-20260718-131740.png` — mildest: bookmarks bar with personal-domain Gmail plus to-do and calendar bookmarks.
- **Recommendation:** Delete each attachment or replace with a tight crop of the intended content. Items 1 and 2 are the priority (banking + family-adjacent bookmarks + third-party avatars); item 3 is borderline More-Embarrassing.
- **Decision:** [x] Replace all 3 with crops — done by Steve 2026-07-19; all three verified, item 2's leftover original deleted
- **Comment:** Done. Please check them all.
  - **Verified (Claude, 2026-07-19):** Checked all three live:
    1. **AHQ-139** ✅ original deleted (attachment list no longer contains it); replacement `image-20260719-220411.png` viewed — browser chrome/bookmarks bar completely gone (it's the Discord app view). One nuance: the Discord **left rail is still visible** with other-server icons and a few small face avatars — far milder than before (no bookmarks, no DM list), your call whether to crop tighter.
    2. **Confluence 104202243** ✅ replacement `image-20260719-220704.png` viewed and is fine (no readable bookmarks or personal email; the in-page find dialog searching a swear word is still visible top-right, matching the attributed quote you already chose to keep — cosmetic). The original flagged attachment initially remained attached (removing an image from the page body does not delete the attachment) — with Steve's approval it was **deleted via the API on 2026-07-19, including all its versions, and confirmed gone** from the page's attachment list.
    3. **AHQ-184** ✅ original deleted; replacement `image-20260719-220806.png` viewed — tight crop of the GitHub repo header only, clean.

### R6. Public ChatGPT `/share/` links — conversations you haven't re-reviewed (4)

- **Details:** Unlike the many dead owner-only `chatgpt.com/c/...` links, these are **world-readable share links**; publishing the Jira hands the URL to everyone, and the conversation content hasn't been reviewed for personal material:
  - **AHQ-1** (comment, 2026-01-22): `chatgpt.com/share/REDACTED`
  - **AHQ-15** (description): `chatgpt.com/share/REDACTED` — agent noted it includes project strategy / funding & licensing rationale discussion
  - **AHQ-27** (description): `chatgpt.com/share/REDACTED`
  - **AHQ-109** (description): `chatgpt.com/share/REDACTED`

  *(All four share IDs redacted here; the live links are in the issues themselves.)*
- **Recommendation:** Open each of the 4, skim for anything personal, then either deliberately keep it, or unshare it in ChatGPT (Settings → Data controls → Shared links) and/or delete the URL from the issue.
- **Decision:** [x] Unshare all 4 — done by Steve 2026-07-19, all four verified dead
- **Comment:**
  - **Progress (verified by Claude, 2026-07-19):** AHQ-27's description was edited by Steve — the `/share/` link is gone from the current text (the remaining `chatgpt.com/g/g-p-.../c/...` project link is owner-only/dead for others, fine). ⚠️ **However, description edit history cannot be deleted in Jira Cloud** — the old description including the share link is still in AHQ-27's History tab (confirmed via the changelog API), which is publicly readable once the project is public. The decisive fix for all four items is **unsharing the links in ChatGPT** (Settings → Data controls → Shared links) — a revoked link 404s for everyone, making Jira history exposure harmless. Same history caveat applies if AHQ-15/AHQ-109 descriptions are edited; AHQ-1's link is in a comment, which has no version history (see R2).
  - **Verified dead (Claude, 2026-07-19):** Steve deleted all his ChatGPT shared links. All four share URLs (AHQ-1 comment, AHQ-15 old-description via history, AHQ-27 old-description via history, AHQ-109 description) were then tested from a **fully logged-out browser**: each one serves no conversation content and redirects to the ChatGPT homepage — identical behaviour to a known-nonexistent control ID. All four are dead for anonymous visitors, so the copies remaining in Jira text/history (AHQ-109's is still in the current description; AHQ-15/27's are in edit history) are now harmless dead strings. AHQ-15's description had also already been edited by Steve to remove its link.

### R7. Private Google Doc links published (doc IDs leak; contents leak if link-sharing is on)

- **Details:** Four private Google Docs are linked from public-bound content. If any has "anyone with the link" sharing, its contents go public; even if locked, the doc IDs/titles are advertised and invite access requests:
  - **AHQ-186** (description): the **drafted launch emails** doc (`docs.google.com/document/d/REDACTED`) — recipient names/addresses would leak if shared.
  - **AHQ-15** (description): `docs.google.com/document/d/REDACTED`
  - **Confluence "Tactics For Getting To Launch Fast"** (id 1835188), twice: the "DRD (private)" doc and the whole final section pointing at "Steve's Private 'Focus.md' Doc" (all doc IDs redacted here; live in the issue/page).
- **Recommendation:** For each: verify sharing is restricted (not "anyone with link"), then remove the URL from the issue/page (replace with "in a private doc"). On the Tactics page, delete the Focus.md section entirely — it's a pointer to a personal doc with no public value.
- **Decision:** [x] Verified sharing restricted (Steve, 2026-07-19); Tactics page moved to private area; links left in place
- **Comment:** Google docs confirmed private.  https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/1835188/Tactics+For+Getting+To+Launch+Fast has been moved to Steve Private area.
  - **Verified (Claude, 2026-07-19):** The Tactics page's move is confirmed in the page tree — it now sits under "Planning" inside the "**Steve Private Planning Docs**" folder (created 2026-07-18). Same caveat as the R3/R4 "Admins Only" folder: folder-level restriction isn't verifiable via the API, so add this page's URL to the post-public logged-out check too. With the docs confirmed locked, the doc links remaining in AHQ-186/AHQ-15 expose only doc IDs/titles (worst case: someone clicks and Google shows them a request-access page with your account name on the receiving end) — acceptable, and removal stays optional cosmetics.
  - **Update (2026-07-20) — restriction now API-verified:** The Tactics page is returned by a CQL `ancestor = 105578514` search, proving it now sits under the read-restricted "**Restricted**" page (Steve's account only, API-visible — see R3). The folder caveat is closed; its URL stays on the X4 post-flip list as belt-and-braces only.
  - **Post-flip verified (Claude, 2026-07-22):** The Tactics page returns HTTP 404 / "Page Not Found" to logged-out visitors. R7 is fully closed.

### R8. Unverified attachments — three quick manual checks

- **Details:** Everything else attached to Jira/Confluence was inspected and is clean. These three could not be verified by the scan:
  1. **AHQ-83** `AHQ-83_conversation_including_beads_install.txt` (160 KB raw Claude session transcript incl. third-party tool install) — transcripts of this size routinely capture environment/config output; couldn't be read via MCP (base64-only). - STEVE: Attachment moved to private Google Doc.
  2. **AHQ-151** `PROJ-002.zip` → `01-A-prompt.md` (~5 KB) — zip arrived corrupted through MCP; the other file in the zip was verified benign. - STEVE: Attachment moved to private Google Doc.
  3. **Confluence "AHQ-18 … Technical Analysis"** (id 8912898) attachment `mcp-atlassian-getJiraIssue-1769164133762.txt` (160 KB) — raw unredacted Jira API export with `changelog` expansion; the page itself notes it contains "verbose author data", which very likely includes account email fields. STEVE: I've deleted it
- **Recommendation:** (1) and (3): just **delete** them — both issues/analyses are closed and the distilled outcomes live elsewhere; that's faster than reviewing 320 KB. (2): open the zip locally, 30-second glance at `01-A-prompt.md`.
- **Decision:** [x] All three removed by Steve 2026-07-19 — (1) and (2) moved to a private Google Doc first, (3) deleted outright
- **Comment:**
  - **Verified (Claude, 2026-07-19):** API-checked all three locations — AHQ-83 has zero attachments, AHQ-151 has zero attachments, and Confluence page 8912898's attachment list is empty. Item 3 was findable only via the page's hidden attachments view (it was never embedded in the body), which is why it wasn't visible on the page — confirmed present before deletion and gone after. Item 2's "30-second local check" is moot now the file is no longer public-bound.

### R9. Perplexity thread links — share state unverifiable (2)

- **Details:** Perplexity URLs look identical whether private or shared, and unauthenticated fetches returned 403 (inconclusive — likely bot-blocking): **AHQ-154** description ("Perplexity Advice" section) and **Confluence "classwitch Alternatives"** (id 57081857, "Perplexity" section) — thread IDs redacted here; the links are live in that issue/page. In both cases the useful content is already pasted/screenshotted alongside, so the links add nothing.
- **Recommendation:** Open each in a logged-out browser; if it renders, unshare or just delete the links (zero information loss).
- **Decision:** [x] Checked both logged-out — both verified PRIVATE (Claude, 2026-07-19); no action needed
- **Comment:**
  - **Verified (Claude, 2026-07-19):** Opened both thread URLs in a fully logged-out browser (Playwright, fresh profile). Both display Perplexity's "**This session is private** — Sign in if you are the owner of this session, or to request access" dialog and render no thread content. The earlier 403s were indeed bot-blocking; the links are private and dead for anonymous visitors, so they can stay in the issue/page harmlessly.

### R10. Third-party privacy: family member's business anecdote (borderline)

- **Details:** Confluence "Analysing How Best To Do Software Development With AI" (id 1671188), "Aim Within One Year" section: an anecdote identifying a close **family member's niche, identifiable business** and quoting one of its customers (specifics deliberately not repeated here — read that section of the page). Flagged Red as it's a third party's privacy, though the content is entirely positive.
- **Recommendation:** Generalize to "a company I know" (30-second edit) — keeps the point, drops the family identification.
- **Decision:** [x] Generalize — done by Steve 2026-07-20 (edit + copy to a fresh page + delete the original, which also removed the old version history)
- **Comment:** Fixed by editing page and copying and renaming.  Please check https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/105087037/Analysing+How+Best+To+Do+Software+Development+With+AI and it's history.
  **Verified (Claude, 2026-07-20):** The new page (id 105087037) is clean — the anecdote now opens "A customer of a company I know", with no name and no family connection. Its history is clean too: version 1 (the fresh copy, still titled "Copy Of …") **already contains the generalized wording**, and version 2 is just the rename — so the original text exists in no version of the new page. The old page (id 1671188), whose history did retain the original wording, no longer resolves via the API (deleted), and a Confluence-wide search found no page referencing the old id, so nothing links to it. The deleted page sat in the Confluence trash until Steve emptied it on 2026-07-20 — the original wording is now permanently unrecoverable.

---

## 🟠 MORE EMBARRASSING — Worth a Quick Edit, Not Blocking

### M1. AHQ-58 / AHQ-57 — ReDoS repro for an unfixed third-party bug

- **Details:** AHQ-58's description is a full exploit-grade repro (evil-regex PoC) of an apparently unreported catastrophic-backtracking bug in `sooperset/mcp-atlassian`; AHQ-57's description *is* the live trigger string (fun side-effect: anyone reading AHQ-57 through that MCP client hangs ~4 minutes). Severity is low (client-side self-DoS), but publishing a repro before telling the maintainer is a responsible-disclosure courtesy issue.
- **Recommendation:** File a quick upstream issue with sooperset before/at launch, then these are fine as-is.
- **Decision:** [x] Leave as-is (Steve, 2026-07-20)
- **Comment:** Leave

### M2. Confluence "Stuff To Add To README Docs" (104202243) — remarks about named people/companies

- **Details:** (a) a blunt one-line insult of a named company's web design, in the same breath as floating them as a future partner; (b) a dismissive remark about a named conference speaker's talks, pasted **three times**. (Names/quotes deliberately not repeated here — both are easy to find on the page: the partner-company section and the thrice-pasted talk paragraph.)
- **Recommendation:** Delete the web-design insult sentence; soften/dedupe the speaker paragraph.
- **Decision:** [x] Edit both — done by Claude 2026-07-20, result reviewed and kept by Steve
- **Comment:** Both fixed on the live page (now v4): (a) the insult sentence was deleted outright; (b) the thrice-pasted talk paragraph was deduplicated to a single copy and its personal remark generalized so it is no longer aimed at the speaker (the "we're still in the learning phase" point is kept). The edit was made in raw storage format on a byte-copy of the page, so all other content — including the embedded Jira-issue macros, images and attachments — is untouched (verified by re-fetching and diffing v4; the only other deltas are Confluence's own cosmetic macro-parameter reordering). Residual: the original wording remains in page versions 1–3 history; if that ever matters, the R10 copy-page-and-delete-original trick clears it — left as-is since M-class is non-blocking.

### M3. AHQ-68 — outreach plan naming a well-known industry figure

- **Details:** The description says to do this "before sharing with [a named well-known industry figure] and others" — reveals a private outreach/marketing plan naming a real person before it has happened. (The same person's podcast quote elsewhere in the issue is public material and fine; name deliberately not repeated here — see AHQ-68.)
- **Recommendation:** Soften to "before sharing more widely".
- **Decision:** [x] Resolved another way — AHQ-68 deleted by Steve as a duplicate (verified via API 2026-07-20: issue no longer exists)
- **Comment:** Deleted Jira (it was a duplicate)

### M4. AHQ-99 — personal-sounding test workflow name

- **Details:** The "Testing update" section quotes a test command referencing a workflow whose name could read as a personal-life hint (or just a joke name; only you know). Name deliberately not repeated here — see AHQ-99.
- **Recommendation:** If it's nothing, leave; if it hints at anything real, edit the name in the issue text.
- **Decision:** [x] Leave — Steve confirms the name hints at nothing (2026-07-20)
- **Comment:**  No problem with this one.

### M5. AHQ-154 — dated "overdue security refresh" warning on an open ticket

- **Details:** "WARNING: Should not leave this for months after 4th Jun 2026 - as packages will get older (and less secure)" — still open on 2026-07-18, so it publicly advertises the dependency refresh is overdue. Not exploitable (the lockfile is public anyway), hence not Red.
- **Recommendation:** Remove the dated sentence, or just schedule AHQ-154 soon after launch.
- **Decision:** [x] Reworded — dated sentence replaced by Steve (verified live in AHQ-154's description, 2026-07-20)
- **Comment:** Changed wording to: "WARNING: Should not leave this for a long time after launch date: 18th July 2026 - as packages will get older (and less secure) so should be implemented ideally within the next weeks/months."

### M6. AHQ-171 — description advertises where a personal email once lived

- **Details:** The issue (which contains **no** email itself — verified) explains your personal email was in `.gitconfig` history and "a single, current text file in the repo", and points to `docs/jira-docs/AHQ-171/01-Jira-Description.md`. **Verified locally today:** no personal-email occurrences in any tracked `.md` in the go-live repo, and the AHQ-171 docs folder is clean — so the pointer leads nowhere harmful given the rebuilt history. Residual: it's an "invitation to go hunting" narrative.
- **Recommendation:** Optionally trim the description's forensic detail; the hunt now finds nothing, so this is presentation only.
- **Decision:** [x] Leave (Steve, 2026-07-20)
- **Comment:** Leave

### M7. Confluence "!!TEMPORARILY ABANDONED!! - Atomic Story Workflow" (64978945) — blunt tool reviews

- **Details:** "Backlog.md - … UI looks painful"; beads "not designed for human use" — named OSS projects whose maintainers may read this.
- **Recommendation:** Soften or own it as honest evaluation notes; non-defamatory either way.
- **Decision:** [x] Softened Backlog.md remark; beads remark kept as fair comment (Steve, 2026-07-20 — old wording no longer found by site search)
- **Comment:** Changed to "Backlog.md - doesn’t have docs directory and UI looks difficult to use.".  Beads comment is fair - as it's a project for AI to use (not humans)

---

## 🟡 SLIGHTLY EMBARRASSING — For Awareness Only

*(You said you'll leave these; none of them leak anything. Grouped; full detail in the supporting docs.)*

### S1. Dead private AI-chat links (large group — safe)

- **Details:** Dozens of `chatgpt.com/c/...`, `chatgpt.com/g/g-p-.../c/...` (project chats), `gemini.google.com/app/...`, and `claude.ai/chat/...` links across issues (AHQ-1, 5, 7, 11, 21, 27, 61, 74, 139, 140…) and Confluence pages (Jira Admin, Tactics, classwitch Alternatives, Codex pages, Commander, Temporal, OpenTelemetry, Plugins…). All are **login-gated to your account** — dead links for the public, no data leak. They just look untidy and reveal internal conversation UUIDs.
- **Recommendation:** Leave. (If ever tidying, delete rather than fix.)
- **Decision:** [x] Leave (Steve, 2026-07-20)
- **Comment:** No problem. Leave.

### S2. Candid self-talk, rambling notes, abandoned plans

- **Details:** e.g. AHQ-31 ("Don't know how to do line by line debugging…"), AHQ-74 ("overthinking and overplanning"), AHQ-83 ("completely lost… analysis paralysis… HELP!!!"), AHQ-97, AHQ-130 (forkle naming musings), AHQ-132 typos, AHQ-167 mid-sentence cutoff; Confluence: "God. I am lost!", "punishment list… YOU'VE FAILED…", Learnt-From-Classwitch post-mortem ("pure waste of time", "dull as ditchwater"), Microkernel "abandoned because AI couldn't work out how to implement this properly", "codex-report-on-what-im-doing-wrong-etc.md" filename references (AHQ-155/157/160/174).
- **Recommendation:** Leave — reads as honest build-in-public working notes, which matches the project's whole vibe.
- **Decision:** [x] Leave (Steve, 2026-07-20)
- **Comment:** Mainly funny for me.  If people want to go digging around old Jiras - I'm OK with this. Thanks for pointing out, but: No problem. Leave (too much effort to delete/change now)

### S3. Machine/subscription details in terminal pastes

- **Details:** "Claude Max" plan banners (+"$50 free extra usage" AHQ-50), hostnames `Steves-MacBook-Pro(-3/-4)`, username `stevepersonal`, local session UUIDs (AHQ-136), machine specs (AHQ-145) — across many pastes and two verified-clean transcript attachments (AHQ-92, AHQ-119).
- **Recommendation:** Leave; owner-identifying only, same class as the pervasive local paths.
- **Decision:** [x] Leave (Steve, 2026-07-20)
- **Comment:** Leave as is - not worth fixing.

### S4. Accuracy nits about named people/companies

- **Details:** "Peter Steinburger" spelling + loose "inventor of OpenClaw" attribution (AHQ-53); "Fred Boyles" for Fred **Brooks** (Confluence 1671188 — page since recreated as 105087037 for R10; misattribution fixed by Steve on the new page, verified 2026-07-20); Docker licensing claim missing the "Docker Desktop" qualifier (Linux Options Research); secondhand "I hear he has blocked AI only contributions" re the `pi` maintainer (AHQ-133); AI-pasted "gstack … Garry Tan" claim of dubious accuracy; AHQ-32 "Abandoned" label vs "Completed" comments.
- **Recommendation:** Fix opportunistically if ever in those docs; none are defamatory.
- **Decision:** [x] Fred Brooks fixed by Steve (verified 2026-07-20 — site search finds no trace of the misspelling); others left
- **Comment:**. Fred Brooks fixed. Leave others.

### S5. Cosmetic/housekeeping

- **Details:** Raw un-rendered account-ID mentions "User:712020:0b47…" (AHQ-90, 103, 116, 157, 180); byte-identical duplicate Confluence page 131078 (suggest delete); untouched default templates (622823, 622811) and empty stub pages; Ubuntu-install page's dangling PAT sentence + 2 orphaned PAT-UI screenshots (verified: no token visible) — suggest delete; YouTube `?si=` tracking param (AHQ-161); pasted third-party newsletter with UTM link (AHQ-153); AHQ-67 attachment reveals private archive-repo name + old "ringtone-website" side project; an unpublished project name quoted by ChatGPT on the Temporal page (name redacted here — see that page); AHQ-64 summarises topics of your private `~/.claude/CLAUDE.md`; AHQ-162 quotes the "INFO FOR YOU ONLY (Don't tell user)" skill banner (optics only — content benign and shipped in the repo); quoted swearing from named YouTubers ("horseshit", "slop") in Stuff-To-Add page — attributed quotes, not your words.
- **Recommendation:** Leave, except the two suggested deletions (duplicate page, orphaned PAT screenshots) which are 1-minute wins.
- **Decision:** [x] All suggested deletions done — duplicate page + default templates by Steve; five orphaned screenshots + dangling-sentence fix by Claude with Steve's approval (2026-07-20)
- **Comment:** Deleted 131078.  Deleted untouched default templates (622823, 622811)
  - **Expanded (Claude, 2026-07-20):** "Orphaned" = attached to the page but not embedded in the body, so invisible when viewing the page — they only appear in the hidden attachments view (`/wiki/pages/viewpageattachments.action?pageId=94470146`) yet are downloadable by anyone who can see the page. A fresh diff of the 16 attachments vs the body found **five** orphans, all downloaded and inspected: the two PAT ones (`image-20260629-182846.png` — GitHub "Generate new token" menu; `image-20260629-183116.png` — repo-scope checkboxes; **no token visible in either**), plus three from a leftover install-wizard sequence (`image-20260628-185043.png`, `image-20260628-185125.png` — benign VMware dialogs; `image-20260628-185217.png` — the Easy Install credentials screen with VM account name and **masked** password dots, nothing readable). All five are safe to delete in one pass from the attachments view. The dangling PAT sentence is in the "Clone the repo" section — "…the Personal Access Token from above - which is then saved in this" — referring to a PAT walkthrough that no longer exists (gh auth now uses browser login + keyring); reword to "…my GitHub username and a Personal Access Token" or similar.
  - **Done (Claude, 2026-07-20, approved by Steve):** All five orphaned attachments permanently deleted via the API — the page now lists exactly its 11 embedded images. The dangling sentence was replaced with "Clone repo (git authentication was already set up by the gh auth login step above; if you do get prompted, enter your GitHub username and a Personal Access Token):-" via a storage-format section edit (page v32); verified by re-fetch — the heading's inline comment, all code blocks and the rest of the page are unchanged.

---

## Residual Risks & Things This Scan Could NOT Cover

### X1. Confluence page **version history** (most important residual)

- **Details:** Public Confluence spaces expose every page's full version history to viewers. This scan read only **current** versions. Any page that once contained something sensitive and was later edited still exposes the original in history. The one page where we *know* redaction happened at some point is **Jira Admin** (body shows "the-token" / "MY_REDACTED_EMAIL_ADDRESS" placeholders) — if those were edits rather than pre-redacted pastes, the raw values are in history.
- **Recommendation:** Restricting the two admin pages (R3/R4) closes the worst of this. For any other page you remember editing something sensitive out of, delete old versions (page → ⋯ → Page history → delete versions) or recreate the page fresh.
- **Decision:** [x] Admin pages restricted (API-verified via the "Restricted" parent — see R3/R4); the one other known-edited page's history was cleared by the R10 recreate-and-delete
- **Comment:** **Jira Admin** and **Discord Admin** are both now restricted.
  - **Post-flip verified (Claude, 2026-07-22):** Anonymous page history behaves as expected on the live public site — the control page's (105087037) history renders logged-out showing exactly v. 1–3 with no emails and only the expected content, and the restricted subtree (where any unredacted history would live) is invisible anonymously (see R3/R4/R7).

### X2. Jira issue changelogs

- **Details:** Public Jira exposes issue history (old field values) via the History tab/API. Old description versions weren't scanned. Risk is low — the agents saw no sign sensitive text was ever typed and later removed — but it's unverifiable at this scale. *(Mechanics confirmed 2026-07-19: description edits DO retain the full old text in History — seen on AHQ-15/AHQ-27, whose old versions contain the now-dead ChatGPT share links; comments, by contrast, keep no history — see R2.)*
- **Recommendation:** Accept, given the clean current-state scan.
- **Decision:** [x] Accept (Steve, 2026-07-20)
- **Comment:** Accept

### X3. Not scanned (out of scope of content API)

- **Details:** Jira board/sprint/filter/dashboard names, project-level metadata, Jira & Confluence **trash/archived** items, space blog posts (none appear to exist), and your avatar/display name (already public by design). Also: two Confluence tree parents (ids 1245194, 360450) aren't in the page listing — **1245194 was identified on 2026-07-20 as the "YouTube Video" folder, now inside the Restricted subtree (resolved)**; only 360450 (likely the templates parent) remains unaccounted for — and the tree listed "Stuff To Add To README Docs" under a stale id (25034753) while the live page is 104202243 — worth confirming in the UI there's no second, restricted page under the old id, and emptying both trashes before flipping (public users can't see trash, but admins-only clutter costs nothing to clear).
- **Recommendation:** 5-minute UI sweep: check board/sprint/filter names look fine, empty Jira + Confluence trash, confirm the 25034753 oddity is just a moved page.
- **Decision:** [x] Accept (Steve, 2026-07-20) — plus the Confluence trash was emptied by Steve on 2026-07-20 (permanently purging the deleted R10 page and templates); Jira trash / board-name sweep otherwise skipped
- **Comment:** Accept.  Confluence trash emptied (Steve, 2026-07-20).

### X4. Post-flip verification

- **Details:** Several findings (R1 profile email, X1 history, anonymous API behaviour) can only be truly confirmed **after** the site is public, from a logged-out session.
- **Recommendation:** After flipping: in an incognito browser, (a) open a commented issue and check no email shows; (b) hit `https://agentic-hq.atlassian.net/rest/api/3/issue/AHQ-72/comment` and search for the personal email/domain; (c) open a Confluence page's history as anonymous; (d) confirm the Restricted subtree is walled while public content renders — Jira Admin (104235012), Discord Admin (98009089) and Tactics (1835188) URLs should show login/denied, using a public page (e.g. 105087037) as the rendering control. (Claude can run this whole list in ~30 seconds via the logged-out Playwright browser — just ask.)
- **Decision:** [x] DONE — checks run post-flip by Claude 2026-07-22; **all four passed** (evidence: [AHQ-190 comment](https://agentic-hq.atlassian.net/browse/AHQ-190?focusedCommentId=14492))
- **Comment:** Please create a "LaunchDay: fdas fdasfd" type Jira with a LauchDay lable and put details of it here and a Description of what I should do "post public" flip.
  - **Done (Claude, 2026-07-20):** Created **[AHQ-190](https://agentic-hq.atlassian.net/browse/AHQ-190)** — "LaunchDay: After Public Flip: Run Logged-Out Verification Checks On Jira & Confluence" (Task, `LaunchDay` label, matching the AHQ-137/AHQ-140 convention). Its description holds the full logged-out checklist — author-email check in the UI, AHQ-72 comment-API check, anonymous page-history check, and the Restricted-subtree wall test (Jira Admin / Discord Admin / Tactics URLs walled, with public page 105087037 as the rendering control) — plus what to do if any check fails. Written public-safe: no personal email/domain appears in it.
  - **Done (Claude, 2026-07-22):** All four checks run from a fully logged-out browser plus unauthenticated REST, on the now-public site: (a) AHQ-72 renders anonymously as read-only with no email/personal domain anywhere on the page; (b) the AHQ-72 comment API returns all 8 comments with no personal email/domain and **zero** `emailAddress` fields in the whole anonymous issue JSON; (c) the control page's version history renders anonymously with expected content only (v. 1–3, no emails); (d) Jira Admin (104235012), Discord Admin (98009089) and Tactics (1835188) all return HTTP 404 / "Page Not Found" anonymously while control page 105087037 renders (200). Full evidence posted as a [comment on AHQ-190](https://agentic-hq.atlassian.net/browse/AHQ-190?focusedCommentId=14492). One observation, not a failure: AHQ-72 comment 11779's pasted terminal output shows a shell prompt with machine username/hostname — S3-class material Steve has already accepted (leave).

---

## Verification Done Locally During This Scan

- The personal email appears in **no tracked `.md` file** in the go-live repo (grep of working tree, 2026-07-18) — other than as the redaction placeholder now used in these AHQ-180 audit docs.
- `docs/jira-docs/AHQ-171/` (all 17 tracked files) contains no occurrence of the personal email or domain — the AHQ-171 issue's pointer to it is harmless (see M6).
- Confluence pages 1343501 and 131078 confirmed byte-identical (duplicate — see S5).

## Coverage Statement

- **Jira:** 174/174 issues read in full (descriptions + all comments + attachment lists). All image attachments viewed except the three items in R8. No retrieval failures.
- **Confluence:** 58/58 pages read in full (bodies + comments + attachment lists), including the page whose tree id was stale. All image attachments viewed except the Jira Admin (27) and some Discord Admin (16) screenshots — see R3/R4 — and the raw API export in R8.
- **Found nowhere:** live API keys/tokens/passwords/webhooks/connection strings; other private individuals' contact details; employer/client references; health/financial/legal content (beyond the bookmark hints in R5); defamatory statements.

## Supporting Docs Index (raw per-agent findings)

| File | Coverage |
|---|---|
| `supporting-docs/jira-scan-AHQ-001-to-018.md` | AHQ-1–18 |
| `supporting-docs/jira-scan-AHQ-019-to-035.md` | AHQ-19–35 |
| `supporting-docs/jira-scan-AHQ-036-to-053.md` | AHQ-36–53 |
| `supporting-docs/jira-scan-AHQ-054-to-072.md` | AHQ-54–72 |
| `supporting-docs/jira-scan-AHQ-073-to-088.md` | AHQ-73–88 |
| `supporting-docs/jira-scan-AHQ-089-to-105.md` | AHQ-89–105 |
| `supporting-docs/jira-scan-AHQ-106-to-121.md` | AHQ-106–121 |
| `supporting-docs/jira-scan-AHQ-122-to-139.md` | AHQ-122–139 |
| `supporting-docs/jira-scan-AHQ-140-to-156.md` | AHQ-140–156 |
| `supporting-docs/jira-scan-AHQ-157-to-172.md` | AHQ-157–172 |
| `supporting-docs/jira-scan-AHQ-174-to-188.md` | AHQ-174–188 |
| `supporting-docs/confluence-scan-strategy-planning-pages.md` | Strategy/planning cluster (14 pages) |
| `supporting-docs/confluence-scan-admin-security-pages.md` | Admin/security cluster (14 pages) |
| `supporting-docs/confluence-scan-technical-pages.md` | Technical cluster (15 pages) |
| `supporting-docs/confluence-scan-experiments-pages.md` | Experiments/abandoned cluster (15 pages) |
