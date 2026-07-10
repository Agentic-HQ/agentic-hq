# AHQ-171 — Fable Investigation Report & Questions

> **Redaction convention (per Steve's instruction):** the personal address being scrubbed is written throughout as `<your.real.name>@<your.personal.domain>`, and the personal domain as `<your.personal.domain>`. The following are explicitly OK to record and to leave in git history: `stevepersonal@Steves-MacBook-Pro.local`, `stevepersonal@MacBookPro.homenet.telecomitalia.it`, `git-no-reply@agentichq.ai`, `988157+halso@users.noreply.github.com`, `noreply@github.com`.

## TL;DR

1. **Do the scrub, but not the way the Jira sketches it.** Rewriting history and force-pushing the *existing* repo is **not sufficient on GitHub**: every pre-rewrite commit stays downloadable via the repo's pull-request refs and cached SHA views. GitHub's own documentation confirms this and says only GitHub Support can purge those — and they may decline, because they "won't remove non-sensitive data" and generally only act "where … the risk can't be mitigated by rotating affected credentials". An email address is not a rotatable credential, so relying on a Support ticket is a gamble.
2. **Recommended approach — "fresh-start", solving AHQ-174 at the same time** (docs bloat; copy at `../01b-copy-of-AHQ-174-also-doing.md`): keep the current repo untouched as `agentic-hq-private` (unscrubbed, private forever); publish a complete scrubbed snapshot as read-only `agentic-hq-archive-001`; derive a scrubbed **and slimmed** `agentic-hq` (junk paths filtered out of history, `main` only) as the go-live repo. No force-push ever happens; the original repo *is* the bullet-proof backup; rollback is "delete the new repos, rename back" (~2 minutes). Details in §5.
3. **Effort**: roughly **3–4 hours hands-on** once the phase-A decisions are made, including verification and re-connecting the Jira integration. The history rewrites themselves take seconds (448 commits, ~26 MiB).
4. **Risk of skipping**: genuinely low — nuisance-class (spam/marketing lists, mildly increased phishing surface), not a security exposure. But it is **permanent**: once public, the history is mirrored and archived (Software Heritage, scrapers, GH Archive events) and can never be scrubbed again. Low risk, one-way door, low cost to fix now → worth the afternoon.
5. **Jira↔GitHub linking survives** (it keys on the `AHQ-nnn` text in commit messages/PR titles, not SHAs or emails) — with one config step: the app's default backfill only indexes 6 months of history, so a manual backfill from 2025-08-01 (first commit) is needed to link the full ~11 months (§5 step 13). Things that *do* break under any rewrite: SHA-pinned URLs in ~6 doc files, "Verified" badges on the 38 squash-merge commits, and (fresh-start only) links to old PR pages. All cosmetic; detailed in §7.

---

## TL;DR Of Plan Steps

> Steps involving Steve hands-on have a **"Steve How To…" guide** in `../steve-how-to-guides/` — referenced as *(guide NN)* below and in the detailed steps.

**Phase A — finish the decisions (no repo changes)**

1. Curation tree review — **DONE 2026-07-10**: overall `Decision:` APPROVED (`../05-go-live-file-curation-tree.md`), every proposal accepted as-is. *(guide 01)*
2. Dodgy-file audit — **fully DONE 2026-07-08** (§2.4): gitleaks + trufflehog over full history/all refs; one real finding (freesound.org credentials in the archived ringtone test project). Steve deleted the app; old key verified dead (`401`). Only residue: the two dead literals go on the step-7 `--replace-text` list (scanner hygiene, not security).
3. Execution parameters — **locked** (§9): target identity = `988157+halso@users.noreply.github.com` (GH007-exempt, guaranteed attribution); the 7 `git-no-reply@<personal.domain>` commits and the single `git-no-reply@agentichq.ai` commit are mapped too; the 153 machine-local "Steve Personal" commits stay as-is; replacement text = placeholder form; machines = this Mac + the Ubuntu VM only.
4. Pre-freeze edits, one normal commit on `main`: re-point kept-file links to the archive repo (05 doc §6 remedy — `potential-feature-ideas.md`'s five links + the PTY-bug doc pointer in `vitest.integration.config.ts`'s header comment), light `docs/README.md` edit, delete `docs/jira-docs/AHQ-171/temp/` (session-handover scratch).

**Phase B — local rewrites (nothing touches GitHub)**

5. Freeze: merge the AHQ-171 branch; stop all other work on the repo.
6. Offline pre-scrub backup — **DONE 2026-07-10**: full-folder zip (all 84 refs incl. 42 `refs/pull/*`, plus all 40 PRs' titles/descriptions as JSON) uploaded to Steve's Google Backup drive. PR data cannot be lost.
7. Install `git-filter-repo` (Homebrew — approved); scrub pass on a fresh mirror: mailmap + replace-text (personal email + domain + the 2 dead freesound literals).
8. Verify the scrub locally: blob-scan re-run + author sweep → zero hits (email, domain, freesound literals).
9. Slim pass: filter the scrubbed history to the curation KEEP whitelist ([`../06-step-9-keep-whitelist-paths.txt`](../06-step-9-keep-whitelist-paths.txt)), `main` only; verify tree = the KEEP list, spot-check `git log`/`blame`.

**Phase C — GitHub cutover**

10. Switch GitHub-for-Jira repository access to "Only select repositories" (must precede any new repo). *(guide 02)*
11. Rename current repo → **private repo** (`agentic-hq-private`); push a README warning-header commit (what this is, why read-only, links to live repo + Jiras + plans); apply GitHub "Archive repository" (read-only; reversible). Stays private forever. *(guide 03)*
12. Create **archive repo** (`agentic-hq-archive-001`, private): push all scrubbed refs + README header commit (same what/why/where pattern). Flips public **and** read-only at step 16. *(guide 04)*
13. Create **public repo** (`agentic-hq`, private for now): push slimmed `main`; re-apply repo settings; connect to GitHub-for-Jira; manual backfill from ≤ 2025-08-01; test Jira dev-panel linking with a test commit + PR. *(guides 04, 05)*

**Phase D — final checks, then go public**

14. Re-run gitleaks + trufflehog + the blob scan against **both new repos** — must be clean.
15. Steve's content skim of the archive repo's doc categories (the "public archive = everything is published" bar — transcripts, pasted content, third-party material). *(guide 06)*
16. Flip archive repo public + apply GitHub "Archive repository" (read-only) — before launch, so the public repo's archive links resolve. *(guide 07)*
17. Flip public repo public. **Launch.** Prerequisites: AHQ-176 (minimal CI) and AHQ-179 (auto-approved-permissions docs) are done first. *(guide 07)*
18. Aftercare: fresh clones on all machines (carry over `.env`s, `settings.local.json`); confirm GitHub "Block command line pushes that expose my email" is still enabled; delete `temp/` audit artifacts; close AHQ-171/AHQ-174. *(guide 08)*

Nothing is deferred past launch except step 18's clean-up items, which are same-day. Rollback before steps 16–17: delete the new repos, rename the private repo back (~2 min, zero loss).

---

## 1. Changes I made during this investigation

Per the instruction not to leave the real address in committable files:

- **`docs/jira-docs/AHQ-171/01-Jira-Description.md` line 99** contained the raw personal address (inside the pasted earlier Claude conversation). I replaced it with the placeholder form. Zero raw occurrences now remain anywhere under `docs/jira-docs/AHQ-171/` (the Opus report already used placeholders when I checked it).

Nothing else was modified. Everything below is investigation only.

---

## 2. Verified facts about the repo (all checked this session)

### 2.1 Commit metadata — where the address lives

448 commits total across **all** refs. Author|committer email distribution:

| Count | Author | Committer | Notes |
|---|---|---|---|
| 248 | `<your.real.name>@<your.personal.domain>` | same | the main exposure |
| 38 | `<your.real.name>@<your.personal.domain>` | `noreply@github.com` | GitHub-UI squash merges; carry GitHub's "Verified" signature |
| 1 | `<your.real.name>@<your.personal.domain>` | `stevepersonal@Steves-MacBook-Pro.local` | |
| 152 | `stevepersonal@Steves-MacBook-Pro.local` | same | **leave as-is** (per Steve) |
| 1 | `stevepersonal@MacBookPro.homenet.telecomitalia.it` | same | **leave as-is** (per Steve) |
| 7 | `git-no-reply@<your.personal.domain>` | same | contains the personal domain — **scrubbed too** (locked, §9) |
| 1 | `git-no-reply@agentichq.ai` | same | commit `fc6efb5` — **mapped to the target identity too** (locked, §9) |

So **287 commits** carry the personal address as author, plus **7** more carry the personal domain via its `git-no-reply@` variant. Note: because every descendant of a rewritten commit gets a new SHA, **all 448 commits get new SHAs regardless of how few identities we map** — leaving the machine-local addresses in place costs nothing and reduces nothing; it's purely a content decision, and Steve has decided they stay.

**Attribution:** the target identity `988157+halso@users.noreply.github.com` is the `halso` account's canonical GitHub noreply address, so rewritten commits keep profile attribution and the contribution graph by construction (author dates are preserved by the rewrite). It is also the one address form GitHub's GH007 email-privacy push protection never blocks, so the account's **"Block command line pushes that expose my email"** setting stays enabled throughout the whole plan — a free backstop: any push containing a missed personal-email commit would be rejected by GitHub itself.

### 2.2 File contents — where the address lives inside files

I scanned **every unique blob in the entire history** (3,662 blobs, single-pass scan; script kept at the scratchpad and re-runnable for post-scrub verification). The personal domain appears in file content in only **3 paths across all of history**:

1. `docs/ARCHIVED/test-projects/ringtone-website/docs/workflow-docs/idea-workflow/01-problem-definer/OLD-ARCHIVED/01-ARCHIVED/TEMP-full-conversation-transacript.md` — **still in the current tree**, 1 occurrence (a captured Claude Code status-bar line). This is the "single, current text file" from the Jira.
2. `docs/workflow-descriptions/setting-up-jira-mcp-server.md` — historical blobs only; the path no longer exists.
3. `scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh` — historical blobs only; the current version is clean.

No `@gmail.com` addresses and no ISP-hostname strings appear in any blob content anywhere in history. So the content-side scrub is tiny: one `--replace-text` rule handles all three files in one pass.

### 2.3 Repo/GitHub surface area

- **Private**, 0 forks, 0 stars, wiki disabled, **no GitHub Issues**, **no releases**, **no tags** (local or remote), **no LFS**, **no submodules**, **no GitHub Actions workflows** (`.github/` has only issue/PR templates). This dramatically shrinks the blast radius — most things that *can* break in a history rewrite simply don't exist here.
- **42 remote branches**: `main`, 37 × `archive/*`, `experiment/ahq-117-…`, 2 × `experiments/codex-*`, `feature/claude-slack-spike-implementation-01`. Only local-only branch is the current `chore/ahq-171-…`.
- **40 PRs** (#1–#40): 38 merged, 2 open (#1, #3 — Codex spike experiments, marked "do not merge").
- **Docs referencing GitHub URLs**: ~6 files pin commit SHAs (e.g. `docs/jira-docs/AHQ-83/beads-implementation/01-…`, `docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-…` pins a `/tree/<sha>/` link, spike-00 `to-do-lists.md`, and `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/DRAFT-oo-refactoring-workflow/02-DRAFT-notes-…` which references ~8 short SHAs). Several more link to branches (`archive/feature/ahq-123-…`, `experiments/codex-slack-spike-one-shot-01`) and one links to PR #2 (`docs/project-docs/project-spikes/spike-01-slack/README.md`).
- `git-filter-repo` is **not installed yet** on this machine — `brew install git-filter-repo` is approved and happens at step 7.

### 2.4 Full-history secret scan — DONE 2026-07-08 (plan step 2)

Run with Steve's install approval: **gitleaks 8.30.1** + **trufflehog 3.95.8** (trufflehog with `--no-verification` — nothing sent over the network), against a fresh mirror clone (84 refs: all 42 branches + all 42 `refs/pull/*`), ~110 MB of history scanned. Working clone + raw reports live in the gitignored `temp/` dir until step 18 cleans them up.

- **One real finding** — freesound.org API credentials (a 40-char `CLIENT_SECRET` and a 30-char `ACCESS_TOKEN`, values deliberately not recorded here) hard-coded in the ringtone-website test project's `download-more.sh`, committed 2025-12-18 (commit `1a96223`). Exactly **one blob** (`abffda6`) carries them; the sibling scripts correctly read from an uncommitted `.env`. Reachable at `docs/ARCHIVED/test-projects/ringtone-website/download-more.sh` in the **current `main` tree**, at `projects/ringtone-website/download-more.sh` earlier in history, and via 38 branches + 36 PR refs. The `ACCESS_TOKEN` is a ~24 h OAuth token (long expired); the `CLIENT_SECRET` is the durable API key. **Remediation DONE 2026-07-08**: Steve deleted the app ("Claude/Steve Ringtone Website App") at freesound.org/apiv2/apply, and the old key was **verified dead** with a read-only test call (`401 Invalid token`). Residual work: the two dead literals still go on the step-7 `--replace-text` list, purely so the public repos never trip secret scanners (ours at step 14, GitHub's, anyone's).
- **Four false positives** — trufflehog's `JiraToken` detector matched 24-char slices of the workflow-name slugs `quick-jira-workflow` / `full-jira-tdd-story-workflow` in an old docs file. Expect the same false positives in the step-14 re-scan.
- **Nothing else**: no AWS/GitHub/Slack/Atlassian/OpenAI-style tokens anywhere in 11 months of history. A separate targeted sweep for the two literals plus the string `freesound` confirmed the credentials appear in that single blob only (18 other blobs mention freesound harmlessly — docs, licence notes, research transcripts).

---

## 3. The key finding: why "rewrite + force-push" alone is NOT a real scrub

This is the most important thing this investigation turned up, and it changes the plan in the Jira.

GitHub keeps read-only refs `refs/pull/<N>/head` for every PR ever opened. They survive branch deletion, merges, **and force-pushes**. Once the repo is public, *anyone* can run `git fetch origin 'refs/pull/*/head:refs/remotes/prs/*'` and pull down every pre-rewrite commit — with the original author emails — no SHA knowledge needed, just PR numbers 1–40. Old commits also stay reachable by direct SHA URL ("cached views").

GitHub's official guidance ("Removing sensitive data from a repository", docs.github.com) confirms this, verified this session:

> "If you only rewrite your history and force push it, the commits with sensitive data may still be accessible" — "directly via their SHA-1 hashes in cached views on GitHub" and "through any pull requests that reference them."

The fix GitHub offers is a **Support ticket** (they can dereference/delete affected PRs, remove cached views, run server-side GC). But:

> "GitHub Support won't remove non-sensitive data, and will only assist in the removal of sensitive data in cases where we determine that the risk can't be mitigated by rotating affected credentials."

An email address is arguably "non-sensitive" by their bar (it's not a secret/credential), so Support may decline — and even if they accept, you're waiting days and trusting a manual process you can't verify. **Conclusion: an in-place scrub of the existing repo has an uncertain, unverifiable endpoint. The fresh-start approach (§5) has a certain, verifiable one.**

(The previous Claude conversation pasted in the Jira flagged "GitHub may keep old commit SHAs reachable via direct URL for a while" — the reality is stronger than that caveat: PR refs make old history *systematically enumerable*, not just lingering.)

---

## 4. Options considered

| | Option 1: Skip | Option 2: In-place rewrite + force-push + Support ticket | **Option 3: Fresh-start (recommended)** |
|---|---|---|---|
| Personal email removed from public view | ❌ | ⚠️ only if Support fully purges (discretionary, unverifiable) | ✅ guaranteed, verifiable locally before anything goes public |
| Existing repo modified | No | Yes — destructive force-push of all refs | **No — untouched, becomes the archive/backup** |
| PR history publicly visible | Yes | Yes (but PR pages may show dangling/missing commits after purge) | No (preserved privately in archive — **accepted by Steve, see below**) |
| Rollback | n/a | From mirror backup only; fiddly | Delete new repo + rename archive back (~2 min) |
| Effort | 0 | 2–4 h + days waiting on Support | 2–3 h, all self-serve |
| Residual risk | Permanent exposure | Support declines / partial purge | Old PRs' `#NN` autolinks 404 in new repo (cosmetic) |

Option 2's only real advantage is keeping the 38 merged PR pages on the public repo. That advantage is now moot twice over:

- **Steve confirmed (2026-07-04)** these PRs contain no review conversation — each was essentially just the commit message plus the merge-to-main record — so losing them publicly costs nothing. If trusted contributors ever need the old PR pages, the private archive repo can simply be shared with them.
- It was largely illusory anyway: a public PR page's commit tab and diffs reference the **pre-rewrite** commits — the very objects carrying the personal address that the scrub exists to remove (§3). "Public PR history" and "scrubbed history" are inherently in tension; even the Support-purge route would leave PR pages with dangling/missing commits rather than clean ones.

Note also that the substance survives publicly either way: every squash-merge commit on `main` carries its PR title and number in the message (e.g. `… — Discord invite + OS-support messaging (#40)`), so the what-changed-in-which-PR narrative remains fully visible in the public history — only the (empty) PR pages themselves stay private.

**Adopted:** Option 3, extended into a **three-repo variant** to also solve AHQ-174 — see §5.

---

## 5. The plan — three-repo structure, everything pre-launch (solves AHQ-171 + AHQ-174 together)

> The numbered step summary is the **TL;DR Of Plan Steps** at the top of this document; the detailed steps below match its numbering one-to-one.

> **Why one operation solves both Jiras:** AHQ-174 "Reduce Size Of Repo By Archiving To Separate Repo" (copied to `../01b-copy-of-AHQ-174-also-doing.md`). Verified figures: **1,008 tracked files / ~93 MB under `docs/`** versus **2,582 lines of TypeScript under `src/`**; `jira-docs` + `project-docs` + `ARCHIVED` account for 967 of the 1,008. Both Jiras share the same one-time pre-public window and the same mechanism (history rewriting), so the scrub produces three repos:

| Short name | Repo | Contents | Visibility |
|---|---|---|---|
| **private repo** | `agentic-hq-private` | the current repo, renamed — **unscrubbed**, all PRs/conversations/history intact | **Private forever**, GitHub-archived (read-only; reversible) — carries the personal address in commits *and* `refs/pull/*`; sharing it shares the address |
| **archive repo** | `agentic-hq-archive-001` | complete **scrubbed** snapshot of today's repo — all 42 branches, full docs fossil record (dogfooding proof) | Created private; flipped **public + read-only** (GitHub "Archive repository") after PII review |
| **public repo** | `agentic-hq` | **scrubbed AND slimmed** go-live repo — junk paths filtered out of *history*, `main` only | Public at launch |

*(The short names — "private repo", "archive repo", "public repo" — are the agreed shorthand for these three throughout the AHQ-171/174 discussion and docs.)*

**Principles:**

- **Scrub once, derive twice.** One verified `git filter-repo` rewrite (mailmap + replace-text) produces the scrubbed history; both public repos derive from it.
- **Junk removal must be history-level, not a delete commit.** An `rm -rf` commit leaves all ~93 MB of docs blobs in `.git` — clone size unchanged, the whole "process universe" one `git log` away, defeating AHQ-174. The public repo comes from a **second filter-repo pass** filtering to the curation KEEP whitelist (`--paths-from-file`; fail-safe — anything missed is dropped), which keeps commit-by-commit product history — `AHQ-nnn` messages (Jira linking) and `git blame` on `src` survive — while the docs weight leaves history entirely. Consequence: the archive repo and the public repo share no SHAs (fine — nothing cross-references them).
- **The curation list lives in its own document**: exactly which paths the public repo keeps vs drops is decided in `../05-go-live-file-curation-tree.md` (overall `Decision:` **APPROVED**, Steve 2026-07-10); the filter-repo paths file for step 9 is derived mechanically from it.
- **A public archive raises the scrub bar from "emails" to "everything".** Flipping the complete fossil record public publishes every pasted transcript, Jira working doc, and experiment branch across all 42 branches. Two **mandatory gates before the archive repo goes public**: the step-14 re-scan of both new repos must be clean (the source history already scanned clean once — §2.4), and Steve's step-15 content skim of the doc categories (the human judgement pass). The archive flips public **before launch** (steps 16→17) — partly so the public repo's re-pointed archive links (step 4) resolve from day one. Nothing about the archive is deferred past launch.

**Steps (detailed)** — numbering matches the "TL;DR Of Plan Steps" at the top of this document; nothing is exposed until steps 16–17; each step verifiable before the next:

1. **Curation tree — APPROVED (Steve, 2026-07-10)**: the overall `Decision:` in `../05-go-live-file-curation-tree.md` is APPROVED with every proposal accepted as-is. The KEEP whitelist for step 9 is derived mechanically from the approved tree (including §5.1's rename-ancestor paths) — it lives at [`../06-step-9-keep-whitelist-paths.txt`](../06-step-9-keep-whitelist-paths.txt); composition and verification notes in the 05 doc §1. **Steve's guide (for reference):** [`../steve-how-to-guides/01-how-to-review-the-curation-tree.md`](../steve-how-to-guides/01-how-to-review-the-curation-tree.md).
2. **Dodgy-file audit — scan DONE 2026-07-08** (full results §2.4): gitleaks + trufflehog over a fresh mirror (84 refs incl. all PR refs). One real finding: freesound.org credentials hard-coded in the ringtone-website test project's `download-more.sh` (in the current tree under `docs/ARCHIVED/test-projects/…` and across history/branches). Remediation: (a) ✅ **DONE 2026-07-08** — Steve deleted the app at freesound.org/apiv2/apply and the old key was verified dead (`401 Invalid token`, §2.4) — the leak is neutralised everywhere, including the private repo, Google Drive zips and old clones; (b) both dead literals still go on the step-7 `--replace-text` list so neither public repo ever trips secret scanners (the public repo is additionally clean by construction — `docs/ARCHIVED/` and `projects/` are curation DELETEs); (c) the private repo keeps the dead strings — harmless, and textual removal there is impossible anyway per §3 (GitHub retains `refs/pull/*`).
3. **Execution parameters — locked** (full list in §9): the target identity for all mapped commits is `988157+halso@users.noreply.github.com` (Steve, 2026-07-10); the 7 `git-no-reply@<your.personal.domain>` commits are mapped too (hides the domain; costs nothing since all SHAs change anyway), as is the single `git-no-reply@agentichq.ai` commit — one uniform public identity; the 153 "Steve Personal"-named machine-local commits stay as-is, addresses included; file-content replacement uses the self-documenting placeholder form; machines for step 18 = this Mac + the Ubuntu VM only.
4. **Pre-freeze edits** (one normal commit/PR on `main`, so all three repos inherit them): re-point kept-file links that target DELETE'd paths at the archive repo as absolute URLs with a "now lives in the archive" note (agreed remedy, 05 doc §6). With `docs/jira-docs` KEEP, a full sweep of every KEEP'd file outside jira-docs found exactly three files needing it: `docs/dev/potential-feature-ideas.md` (five links — 05 doc §6.1), `docs/README.md` (spikes bullet + Historical section, plus a stale jira-docs folder-count fix), and the PTY-bug doc pointer in `vitest.integration.config.ts`'s header comment — `overview-of-workflows.md`'s jira-docs links resolve untouched. Also delete `docs/jira-docs/AHQ-171/temp/` (session-handover scratch — not for the public repo). The same sweep confirmed the only SHA-pinned links outside jira-docs sit in the demos-plugin's DRAFT-oo-refactoring notes — a fossil working doc that ships with dangling links as accepted (05 doc §6.5); ignore/exclude patterns naming DELETE'd dirs (`.prettierignore`, `eslint.config.mjs`, `pnpm-workspace.yaml`, `.gitignore`) stay as-is — functional in the archive repo, harmless no-ops in the public repo.
5. **Freeze**: merge this AHQ-171 branch (so the scrubbed repos contain this investigation), then stop all other work on the repo — anything committed after the snapshot would be orphaned.
6. **Belt-and-braces offline backup — DONE 2026-07-10.** `agentic-hq-prescrub-backup-2026-07-10.zip` (the whole working folder, zipped with `-y` and excluding the rebuildable `node_modules`/`.pnpm-store` caches) is uploaded to Steve's Google Backup drive. It contains everything GitHub holds and more: the working tree including untracked local files (`.env`s, `.claude/settings.local.json`), the full clone history, `temp/audit-work/` with **all 84 refs including the 42 `refs/pull/*`** (all 40 PR heads + merge refs for the 2 open PRs), and `temp/github-prs-backup.json` — all 40 PRs' titles, full descriptions, authors, dates and branch names (verified the only PR metadata that exists: 0 review comments, 0 releases, no wiki). **PR data cannot be lost**: it survives in the private repo on GitHub *and* in this offline zip. The handful of commits that land after the backup (steps 4–5) are covered by the private repo and by step 7's fresh mirror clone. Treat the zip as private-forever — it holds the unscrubbed history.
7. **Install `git-filter-repo`** (Homebrew — approved; GitHub's docs recommend v2.47+ and its dedicated `--sensitive-data-removal` mode as the canonical invocation), then the **scrub pass** on a fresh mirror clone:
   - `--mailmap`: map `<your.real.name>@<your.personal.domain>` → `988157+halso@users.noreply.github.com` (name `halso`), `git-no-reply@<your.personal.domain>` → same, and `git-no-reply@agentichq.ai` (the single commit `fc6efb5`) → same — one uniform public identity. Machine-local addresses left alone per your instruction. (Mailmap rewrites identity fields only, not file contents — that's what `--replace-text` is for.)
   - `--replace-text`: the literal personal email and the bare personal domain, each replaced with the placeholder form (`<your.real.name>@<your.personal.domain>` / `<your.personal.domain>`), **and the two freesound literals from step 2** (taken from the blob at execution time — they are deliberately recorded nowhere else). Covers every historical version of every affected file in one pass. Text blobs only — fine, all targets are markdown/shell.
   - Post-run gotcha: `git filter-repo` removes the remote URL from `.git/config` — expect to re-add the remote before pushing.
8. **Verify the scrub locally, before anything touches GitHub**: re-run the blob-scan script + `git log --all --format='%an %ae %cn %ce' | sort -u` against the rewritten clone — zero hits for the personal address, the domain, and the freesound literals. This is the step an in-place force-push (Option 2) can never truly have.
9. **Slim pass** (local): second filter-repo run over the scrubbed history using the KEEP whitelist from step 1 ([`../06-step-9-keep-whitelist-paths.txt`](../06-step-9-keep-whitelist-paths.txt), via `--paths-from-file` — fail-safe: anything missed is dropped; preferred over an `--invert-paths` blacklist). Result: the public repo's history, `main` only. Verify: `git ls-tree -r main` equals the KEEP list (expand the `docs/jira-docs` prefix line against the frozen `main` for the comparison); spot-check `git log`/`git blame` on `src/`.
10. **Switch GitHub-for-Jira repository access** from "All repos" to **"Only select repositories"** — **before any new repos exist** (GitHub side: Org **Settings → GitHub Apps → Jira → Repository access**; the Jira config page's Settings column may offer the same). Observed 2026-07-05: the org connection currently has **"All repos" access (4 repos, Full Access)** — left as-is, it would auto-connect every new repo and produce **triple dev-panel entries** per AHQ. **Steve's guide:** [`../steve-how-to-guides/02-how-to-switch-github-for-jira-repo-access.md`](../steve-how-to-guides/02-how-to-switch-github-for-jira-repo-access.md).
11. **Rename** the existing GitHub repo → **`agentic-hq-private`** (the **private repo**). Keep private; don't connect it anywhere new. Then, in this order: (a) push one commit adding a warning header to the top of `README.md` (draft below — links use in-repo relative paths since this repo contains the plan docs); (b) apply GitHub **"Archive repository"** (Settings → General) so it's read-only — reversible via Unarchive if ever needed. Side-effect: open PRs #1/#3 become frozen-open (correct for a fossil record). **Steve's guide:** [`../steve-how-to-guides/03-how-to-rename-and-archive-the-private-repo.md`](../steve-how-to-guides/03-how-to-rename-and-archive-the-private-repo.md). Draft header:

    > [!IMPORTANT]
    > **This is the frozen, pre-scrub original of Agentic HQ — private forever, archived (read-only).**
    > Its history (commits, PRs #1–#40, all branches) is unscrubbed and contains personal commit
    > email addresses — do not make public, fork to public, or share.
    > - **Live project:** https://github.com/Agentic-HQ/agentic-hq · **Public scrubbed snapshot:** https://github.com/Agentic-HQ/agentic-hq-archive-001
    > - **Why/how:** [AHQ-171](https://agentic-hq.atlassian.net/browse/AHQ-171) (email scrub) + [AHQ-174](https://agentic-hq.atlassian.net/browse/AHQ-174) (repo slimming) — plan in [docs/jira-docs/AHQ-171/Fable/03-Fable-report-and-questions.md](docs/jira-docs/AHQ-171/Fable/03-Fable-report-and-questions.md) §5; curation tree in [docs/jira-docs/AHQ-171/05-go-live-file-curation-tree.md](docs/jira-docs/AHQ-171/05-go-live-file-curation-tree.md).
    > - Read-only is reversible: Settings → General → Unarchive.

12. **Create the archive repo `agentic-hq-archive-001` (private)**: push all scrubbed refs (all 42 branches; there are no tags). Set the repo description and push one commit adding a header to the top of `README.md` (draft below) so nobody mistakes it for the product. It stays **out** of the GitHub-for-Jira selected repositories (automatic under step 10's access switch) and flips public + read-only at step 16. **Steve's guide:** [`../steve-how-to-guides/04-how-to-create-the-new-repos.md`](../steve-how-to-guides/04-how-to-create-the-new-repos.md). Draft header:

    > [!IMPORTANT]
    > **This is a scrubbed, read-only historical snapshot of Agentic HQ as of <freeze date> — not the live project.**
    > **The live project is https://github.com/Agentic-HQ/agentic-hq.**
    > This archive preserves the project's complete dogfooding fossil record — all branches, every
    > per-Jira TDD working doc, spike and planning artifact — with personal data scrubbed from
    > history. It exists so the go-live repo can stay small; nothing here is required reading for
    > using Agentic HQ.
    > - **Why/how:** [AHQ-171](https://agentic-hq.atlassian.net/browse/AHQ-171) (history scrub) + [AHQ-174](https://agentic-hq.atlassian.net/browse/AHQ-174) (slim public repo) — plan in [docs/jira-docs/AHQ-171/Fable/03-Fable-report-and-questions.md](docs/jira-docs/AHQ-171/Fable/03-Fable-report-and-questions.md) §5. (Jira links point at a private Jira workspace and won't resolve for the public — kept for the project's own reference.)
    > - Read-only via GitHub's "Archive repository" — no pushes, issues or PRs.
13. **Create the public repo `agentic-hq` (private for now)**: push the slimmed `main` from step 9. Re-apply repo settings (description, topics, branch protection, webhooks/deploy keys/Actions settings if any; issue/PR templates travel with the code). **Add this repo to the GitHub-for-Jira app's selected repositories**, then test while private: spot-check that recent `AHQ-nnn` commits appear in the dev panel; one test commit on `main` against a test Jira and one branch+PR+squash-merge against another; confirm both link. **Backfill caveat (Perplexity-verified against Atlassian docs, 2026-07-04):** the app's automatic backfill covers only the last **6 months** of history by default (and only the latest 50 commits on non-default branches). The repo's first commit is **2025-08-01**, so trigger a **manual backfill** with a start date of 2025-08-01 to link the older, Done AHQs. **Steve's guides:** [`../steve-how-to-guides/04-how-to-create-the-new-repos.md`](../steve-how-to-guides/04-how-to-create-the-new-repos.md) and [`../steve-how-to-guides/05-how-to-run-the-jira-manual-backfill.md`](../steve-how-to-guides/05-how-to-run-the-jira-manual-backfill.md).

   **How to trigger the manual backfill** (requires **org/site admin**):

   1. Open the **GitHub for Atlassian configuration page** — direct URL (verified in the live UI):
      `https://agentic-hq.atlassian.net/plugins/servlet/ac/com.github.integration.production/spa-index-page?ac.from=homepage`
      (Menu route to the same place: Jira **Settings (gear) → Jira apps**, then the **GitHub for Atlassian** entry in the left sidebar. Don't follow Atlassian's backfill doc's own navigation — its "Jira → Apps → Manage apps" path is retired, and the admin.atlassian.com Connected-apps page offers no Settings/Configure action for this app.)
   2. On that page, click the **settings (gear) icon** next to the GitHub organization, then **Continue backfill**.
   3. **Select the date to start importing history from** (here: 2025-08-01), then click **Backfill data**.

   *(In-screen labels per Atlassian's backfill doc, matching an April 2026 Atlassian Community post that describes triggering "Continue backfill" from this page. The URL's app key `com.github.integration.production` confirms it's an Atlassian Connect app.)*

   **Observed state of the current connection (from that page, 2026-07-05):** org **Agentic-HQ** connected · Repository access **"All repos" (4)** · Backfill status **FINISHED** · **"Backfilled from: 06/07/2025"** · Permissions **Full Access**. Two conclusions: (a) the existing backfill window predates the first commit (2025-08-01), so the **old repo's** history is already fully indexed — and the date is exactly what the 6-month default predicts for a connection made ~early Jan 2026; (b) a **newly connected** repo gets its own 6-month window from connection time (reaching only ~Jan 2026), so the manual backfill from ≤ 2025-08-01 **is** required on the public repo to link the older AHQs. The "All repos" access setting is handled in step 10.
   - There is also a **"Restart the backfill"** checkbox: by default a manual backfill *adds to* what's already imported; ticking the checkbox *overwrites* all existing historical data instead. For our case the default (additive) is right — we just want the pre-6-month history added.
   - Atlassian notes manual backfills are also the fix for sync issues like mismatched statuses; and (consistent with §7) bulk-updating repository URLs or remapping historical dev-panel references is **not** supported.
14. **Final scan of both new repos**: re-run gitleaks + trufflehog + the blob-scan script against the archive repo and the public repo — all must be clean (zero real findings; the known trufflehog JiraToken false positives on workflow-name slugs are expected, see §2.4).
15. **Steve's content skim of the archive repo**: the "public archive publishes everything" bar — skim the doc categories (transcripts, pasted Perplexity/AI conversations, Jira working docs, third-party content) for anything embarrassing or not-yours-to-publish. The secret side is already machine-checked (steps 2 and 14); this is the human judgement pass. **Steve's guide:** [`../steve-how-to-guides/06-how-to-do-the-archive-content-skim.md`](../steve-how-to-guides/06-how-to-do-the-archive-content-skim.md).
16. **Flip the archive repo public** and apply GitHub's **"Archive repository"** setting (read-only badge, locks pushes/issues/PRs; reversible). Done **before** launch so the public repo's archive links (step 4) resolve from day one. **Steve's guide:** [`../steve-how-to-guides/07-how-to-flip-the-repos-public.md`](../steve-how-to-guides/07-how-to-flip-the-repos-public.md).
17. **Go live**: flip the public repo public. **Launch.** Prerequisites (done before this flip; not part of this plan): **AHQ-176** (minimal CI tests) and **AHQ-179** (improve auto-approved-permissions docs). **Steve's guide:** [`../steve-how-to-guides/07-how-to-flip-the-repos-public.md`](../steve-how-to-guides/07-how-to-flip-the-repos-public.md).
18. **Aftercare** (same day): fresh clones on the Mac and the Ubuntu VM (rewritten histories are incompatible — don't rebase existing clones; carry over untracked local files first: `.claude/settings.local.json` and any `.env`s — `pnpm install` rebuilds `node_modules`). Confirm GitHub → Settings → Emails → **"Block command line pushes that expose my email"** is still enabled (it stays on throughout the plan — the target identity is GH007-exempt, and the setting auto-rejects any accidental personal-email push). Delete the `temp/` audit artifacts (working clone + scan reports). Close AHQ-171 and AHQ-174. **Steve's guide:** [`../steve-how-to-guides/08-how-to-do-aftercare.md`](../steve-how-to-guides/08-how-to-do-aftercare.md).

**Time**: ~3–4 h hands-on for phases B–D once phase A's decisions are made (the filter-repo runs themselves take seconds at this repo size). Phase A: steps 1–3 are DONE; only step 4 (pre-freeze edits) remains — minutes.

**Rollback** at any point before steps 16–17: delete the new repos, rename the private repo back. ~2 minutes, zero data loss — the original repo never receives a force-push.

---

## 6. Risk assessment of skipping (Jira question: "will it matter?")

**Likelihood of harvesting: high. Impact: low. Reversibility: none.**

- Once public, the address is exposed in ~287 commits via `git clone`, the REST API, and every commit's `.patch` URL. Commit-email harvesting from public GitHub repos is routine and industrialised — it's the very reason GitHub built the noreply-email and "block pushes that expose my email" features.
- Realistic consequences: inclusion in marketing/spam databases, cold outreach, and a modestly better-targeted phishing surface (an attacker gets a personal address tied to your name, your GitHub handle, and a project they can reference convincingly). Your instinct in the Jira is right, though: Gmail-class filtering absorbs the bulk-spam part well, and none of this is a *security* exposure — it's a nuisance exposure.
- The counterweight is **permanence**: public GitHub history gets mirrored by Software Heritage, scrapers, and event archives. After going public there is no do-over — a later scrub would clean your repo while every mirror keeps the old commits. This is the only clean window, exactly as the Jira suspects.
- One honest caveat: if this address is already widely public elsewhere (old forum posts, breach dumps — checkable at haveibeenpwned.com), the *marginal* benefit of scrubbing shrinks. Only you know its exposure history.

**My verdict**: as a pure risk decision, skipping is defensible (2/5 nuisance). But the fresh-start path costs one afternoon, carries near-zero execution risk, and the decision is irreversible in one direction only. I'd do it.

---

## 7. What breaks / what survives (Jira question on SHAs and links)

**Survives cleanly:**
- **Jira ↔ commit linking** — keyed on the `AHQ-nnn` text in commit messages/branch names/PR titles, not on SHAs or emails (Atlassian-documented; Perplexity-confirmed 2026-07-04). The GitHub-for-Jira app backfills history when a repo is added, so the new repo's rewritten commits re-link to the same issues — **but the default backfill only reaches back 6 months**; a manual backfill from 2025-08-01 is needed to index the full ~11-month history (§5 step 9). Step 9 of the plan verifies linking empirically while still private.
- **Contribution graph & profile attribution** — author dates are preserved, and the target identity `988157+halso@users.noreply.github.com` is the `halso` account's canonical GitHub noreply address, so attribution is guaranteed.
- **Branch-pinned doc URLs** (e.g. links to `archive/feature/ahq-123-…`, `experiments/codex-slack-spike-one-shot-01`) — keep working because the new repo has the same name and (recommended) the same branches.
- CI, releases, tags, packages, LFS — nothing to break; none exist.

**Breaks (all cosmetic, all under any rewrite option):**
- **SHA-pinned URLs in ~6 doc files** (§2.3) — new SHAs mean those links 404 (Option 2 would leave them resolving to *orphaned old commits*, which is arguably worse). Most of the ~6 are fossil working docs inside the KEEP'd `docs/jira-docs` — they ship with those links dangling, accepted for historical documents (05 doc §6.5). Links in the curated docs get the step-4 archive-repo re-pointing and keep working for everyone.
- **"Verified" badges on the 38 squash-merge commits** — the rewrite invalidates GitHub's signatures (filter-repo strips them). New history shows unsigned. If it bothers you, commit-signing going forward is a separate small task.
- **Old Jira dev-panel entries** pointing at old SHAs/PR URLs go stale; fresh entries appear after backfill. With the rename + name-reuse, old PR links stored in Jira will 404 (the rename redirect dies when the old name is reused). Solo project → acceptable; the content survives in the archive repo.
- **PR pages themselves** — decided: the public repo will have no PRs #1–#40 (PRs are repo-local database objects and don't travel with git history; the new repo's PR list starts empty at #1). Accepted because the old PRs held no review conversation — just merge records — and the private archive can be shared with trusted contributors if ever needed. The PR record is also preserved twice over (step 6, DONE 2026-07-10): the private repo keeps the live PR pages, and the offline Google Drive backup zip holds all 42 `refs/pull/*` plus every PR's title/description as JSON — so no PR data is lost even without GitHub. New PRs in the new repo link to Jira normally from day one.
- **`(#NN)` autolinks in squash-commit messages** — in the new repo they point at PRs that don't exist there (404 on click). Recommend leaving them as-is; they still document which PR the commit came from (title + number are in the message text), and the archive repo holds the actual pages.

**Other execution risks & mitigations:**
- *Work committed mid-scrub gets orphaned* → do it in one sitting (plan step 5's freeze).
- *Over-eager text replacement* → the `--replace-text` patterns are the full literal address, the bare domain, and the two exact 40/30-char freesound literals only; §2.2 shows exactly 3 files ever matched the email/domain; the blob-scan verification (step 8) is the backstop.
- *Local clones diverge* → fresh clones, not pulls (step 18).
- *Repo settings forgotten on the new repo* → checklist in step 13.

---

## 8. Opinion on the Jira itself

- The Jira's instincts are all correct: the risk is low-but-real, the pre-public window is the only clean chance, and Jira↔GitHub linking is not the thing to worry about. Where it needs updating: (a) the implicit plan (in-place scrub + force-push) is insufficient on GitHub per §3 — the plan should pivot to fresh-start; (b) the proposed 3-commit experiment on the live repo becomes unnecessary — the same confidence is gained more safely by testing the *new* repo while private (plan step 13); (c) the "GitHub private clone backup — gold plating?" question answers itself under fresh-start: the original repo *becomes* the backup, no extra cloning needed (a git mirror alone wouldn't capture PR conversations anyway — keeping the archive repo does).
- The previous Claude advice pasted in the Jira suggested also deciding whether to delete `archive/*` branches before going public. The plan resolves this: all 42 branches live on (scrubbed) in the archive repo, while the public repo carries `main` only — no branch-by-branch pruning decision needed.
- It also (rightly) recommended a **general secret/PII scan** over full history before flipping public — going public exposes all content, not just emails. **DONE 2026-07-08** — results in §2.4; remediation folded into plan steps 2/7/14.

---

## 9. Open items for Steve

1. **Approve the plan** — the "TL;DR Of Plan Steps", steps 1–18.
2. **Curation tree — DONE (APPROVED, Steve 2026-07-10)** — `../05-go-live-file-curation-tree.md`: every proposal accepted as-is. It covers **every path that ever existed on main** — 1,946 paths total: 1,351 current (KEEP 699 files / 5.3 MB — including `docs/jira-docs` in full — DELETE 652 files / 86.8 MB) and 595 historical-only (KEEP 72 — 60 rename-ancestors of kept files + the 12 later-deleted jira-docs files — DELETE 523). Net: ~90.6% of main's uncompressed blob history purged. Its §6 lists the consequences accepted with it; the approved tree mechanically yields the step-9 KEEP whitelist.

**Execution parameters — all locked (Steve, 2026-07-08; target identity 2026-07-10):**

- Target identity for all mapped commits: `988157+halso@users.noreply.github.com` — the `halso` account's canonical GitHub noreply address. Guaranteed attribution, and exempt from GitHub's GH007 email-privacy push protection, so **"Block command line pushes that expose my email"** stays enabled for the whole plan (backstop against any missed personal-email commit). New commits use it too (`~/.gitconfig` updated 2026-07-10).
- The 7 `git-no-reply@<your.personal.domain>` commits are mapped to the target identity too (they'd otherwise expose the personal domain, and it costs nothing since all SHAs change anyway); likewise the single `git-no-reply@agentichq.ai` commit (`fc6efb5`) — one uniform public identity.
- The 153 "Steve Personal"-named machine-local commits stay as-is, addresses included.
- File-content replacement (`TEMP-full-conversation-transacript.md` + all history) uses the placeholder form `<your.real.name>@<your.personal.domain>` — self-documenting, not `***REMOVED***`.
- `git-filter-repo` install via Homebrew: approved for step 7.
- Machines with clones: this Mac and the Ubuntu VM only.

---

## Appendix — evidence & re-runnable verification

- Commit/email census: `git log --all --format='%ae|%ce' | sort | uniq -c | sort -rn` (results in §2.1); names via `%an|%cn`.
- Full-history content scan: scratchpad script `scan_blobs.py` — single pass over all 3,662 unique blobs via `git cat-file --batch-all-objects`, mapping hits to paths via `git rev-list --all --objects`. Re-run against the rewritten clone in plan step 8; expected output: zero paths. (Script lives in the session scratchpad; it will be re-created at execution time — it's ~40 lines.)
- Attribution check: `gh api repos/Agentic-HQ/agentic-hq/commits/fc6efb5… --jq '{author_login: .author.login}'` → `halso`.
- GitHub state: `gh repo view` (private, 0 forks), `gh pr list --state all` (40 PRs), `gh issue list` (none), `git ls-remote --tags origin` (none).
- GitHub guidance verified against: `docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository` (fetched 2026-07-04; quotes in §3).
- **Perplexity cross-check (2026-07-04)**: full 23-claim fact-check + go/no-go checklist in `02c-Fable-Perplexity-double-check-question.md`. Verdict: "technically solid… the safer option compared with force-pushing the original repo". All load-bearing claims confirmed (PR-ref/cached-view persistence, Support limitations, rename/name-reuse redirect behavior, filter-repo mechanics incl. signature stripping, Archive-repository semantics, issue-key-based Jira matching, email-block setting checks the pushed commits' author emails). Key facts it contributed, now in §5: Jira backfill default is 6 months / last-50-commits on non-default branches (step 13); `--sensitive-data-removal` is the current canonical filter-repo mode (step 7); `--replace-text` is text-blobs-only and filter-repo drops the remote from `.git/config` (step 7). Two residual uncertainties it flagged: GitHub doesn't formally guarantee PR-ref retention semantics forever (our live fetch of all 40 PR heads makes the *current* behavior certain), and contribution-graph handling of identical commits in two public repos is undocumented (don't rely on it either way). It also found no documentation that Jira's dev panel stores/exposes commit author emails — reassuring for the already-synced private-repo data.
- Mirror-clone completeness verified empirically (2026-07-04), resolving the one claim Perplexity hedged on: a test `git clone --mirror` of this repo contained 84 refs including 42 `refs/pull/*` (all 40 PR heads + merge refs for the 2 open PRs). First commit date verified: 2025-08-01.
