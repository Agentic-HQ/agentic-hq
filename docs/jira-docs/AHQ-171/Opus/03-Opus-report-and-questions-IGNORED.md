# AHQ-171 — Opus Report: Scrubbing Personal Email From Git


HUMAN NOTE: This answer was IGNORED as Fable came up with a better plan in:
docs/jira-docs/AHQ-171/Fable/03-Fable-report-and-questions.md
which involves keeping the original repo private and entirely the same and intact, but renaming it, and then creating new repo that is scrubbed and public.






















**Author:** Claude (Opus 4.8)
**Date:** 2026-07-04
**Status:** Investigation only — **no changes made** to the repo, history, or GitHub.

---

## 0. TL;DR (read this first)

- **Recommendation: do the scrub now.** It's cheap (~half a day with the safety experiment, ~1–2 hrs without), the repo is in the *ideal* state for it (private, solo, **0 forks**, no tags, no signed commits), and this is the **last clean, reversible window** before going public. Once public, anything scraped can't be recalled.
- **The Jira↔GitHub links will NOT break** from the email change. They're keyed on the `AHQ-nnn` text in commit messages, which we leave untouched, and GitHub re-indexes on push. (Confirmed by mechanism, below.)
- **The real subtleties are three**, none of them showstoppers: (1) every commit **SHA changes**, so any local clone (your Ubuntu VM / other Macs) must **re-clone**; (2) GitHub may keep the **old SHAs reachable by direct URL** for a while after force-push unless you ask Support to purge — relevant because you're going public; (3) the scrub must also cover **file content** (2 current files) and **one commit message**, not just the author/committer fields.
- **Backup plan: yes, take the online mirror clone — it is NOT gold-plating.** A `git clone --mirror` pushed to a private backup repo is your one-command, exact-SHA rollback. I'd do that *plus* a local mirror on disk.
- **Scope is bigger than just your Gmail.** History contains **5** distinct author/committer emails and **2** names. Since we're rewriting anyway, mapping *all* of them to one no-reply identity is essentially free — decision needed on how far to go (see §7).

---

## 1. What's actually in the repo (verified facts, not guesses)

All figures below are from the local repo today, across **all refs** (branches + working tree). Numbers are commit-instances (a commit on N branches counts N times), which is what matters for the rewrite.

### 1.1 Emails baked into commit author/committer fields

| Email | Author uses | Committer uses | Notes |
|---|---|---|---|
| `<your.real.name>@<your.personal.domain>` | 287 | 248 | **The personal Gmail — the whole point of this Jira.** |
| `stevepersonal@Steves-MacBook-Pro.local` | 152 | 153 | Not a routable email (`.local`), but leaks your Mac username `stevepersonal`. Not scrapable as an address. |
| `git-no-reply@<your.personal.domain>` | 7 | 7 | A no-reply, but still exposes your **personal domain `<your.personal.domain>`** — from which `<your.real.name>@<your.personal.domain>` is trivially guessable. |
| `stevepersonal@MacBookPro.homenet.telecomitalia.it` | 1 | 1 | Not routable. Leaks ISP (**Telecom Italia** → you were on an Italian home connection). Mild location signal. |
| `git-no-reply@agentichq.ai` | 1 | 1 | The **new/good** address you set in `~/.gitconfig`. Keep. |
| `noreply@github.com` | 0 | 38 | GitHub's committer identity on squash-merges. Keep — it's fine and expected. |

**Total `<your.real.name>@<your.personal.domain>` instances across all refs: 535** (author + committer).

### 1.2 Names in history

| Name | Count | Notes |
|---|---|---|
| `halso` | 295 author / 256 committer | Your public handle. Keep. |
| `Steve Personal` | 153 author / 154 committer | Leaks first name; pairs with the `.local` emails. Optional to normalise → `halso`. |
| `GitHub` | 38 committer | Squash-merge identity. Keep. |

### 1.3 Email in file *content* (survives even a perfect author-field rewrite)

Two files in the **current** working tree contain `<your.real.name>@<your.personal.domain>`:

1. `docs/jira-docs/AHQ-171/01-Jira-Description.md` — this very ticket (it quotes the address).
2. `docs/ARCHIVED/test-projects/ringtone-website/docs/workflow-docs/idea-workflow/01-problem-definer/OLD-ARCHIVED/01-ARCHIVED/TEMP-full-conversation-transacript.md` — line 13, in a pasted Claude Code UI banner: `Opus 4.5 · Claude Max · <your.real.name>@<your.personal.domain>'s`.

**Important:** rewriting author/committer identity does **nothing** to these — they are file *contents*. They need a separate content scrub (or edit/delete).

### 1.4 Email in a commit *message body*

Exactly **one** commit message body mentions the address:
- `f3319169` — *"WIP: Make Jira MCP script generic … of hardcoding agentic-hq.atlassian.net / <your.real.name>@<your.personal.domain>"*.

`git filter-repo`'s default identity rewrite does **not** touch message bodies, so this one needs `--replace-text` too, or it survives.

### 1.5 Everything that makes this the *easy* case

- **0 tags** — nothing to re-sign or re-point.
- **0 GPG/SSH-signed commits** (gpg isn't even installed) — no signatures to invalidate.
- **0 forks**, **repo is PRIVATE** (`Agentic-HQ/agentic-hq`).
- Only **2 open PRs**, both **DRAFT experiment branches** explicitly marked "do not merge" (`#3` codex-spike-00, `#1` codex-slack-spike). 38 other PRs already merged/closed.
- No submodules; the only uncommitted work is the untracked `docs/jira-docs/AHQ-171/` folder.
- **448 unique commits** across **~40 branches** (mostly `archive/*` and `experiment*`).

### 1.6 Internal doc references to this repo's own commit SHAs (minor)

4 doc files hard-code a full 40-char SHA of *this repo's own* commits (e.g. `docs/jira-docs/AHQ-131/03-summary-of-what-was-done.md`). After the rewrite those SHAs no longer exist, so those references become dead. **Cosmetic** — they're historical notes, nothing depends on them functionally. (Other 40-char SHAs found in docs are *external* repos like ACE-Step and are unaffected.)

---

## 2. Answering your specific questions

### 2.1 Amount of time / work

| Phase | Effort | Notes |
|---|---|---|
| Install `git-filter-repo` | 5 min | **Not installed.** Needs your approval (per your CLAUDE.md rule). It's the standard, git-recommended tool; Python 3.13 is present. Alternatives if you'd rather not install it: BFG Repo-Cleaner (needs Java) or built-in `git filter-branch` (slow, error-prone, officially discouraged). |
| Build the mailmap + dry-run on a throwaway clone | 15–30 min | Verify counts go to zero, diff a few commits. |
| Backups (mirror → private GitHub repo + local mirror on disk) | 15 min | See §4. |
| **The safety experiment** (your 3-commit test) | 1–2 hrs | Most of this is *waiting* for GitHub/Jira to re-index. Optional but reassuring. |
| Actual scrub + force-push all refs + verify | 30–60 min | |
| (Optional) Ask GitHub Support to purge old SHAs | async | Minutes to write; days for their reply. |

**Hands-on total: ~half a day with the experiment; ~1–2 hours if you trust the analysis and skip it.** Nearly all the "long" numbers are wall-clock waiting, not active work.

### 2.2 Risk if you skip it and leave the email in

**Honest assessment: the practical risk is low-to-moderate, but it's *permanent and irreversible* once public — and that asymmetry is the whole argument for doing it now.**

- **Bot scraping is real.** Public GitHub commit emails are a known, actively-harvested source (recruiters, "we analysed your GitHub" cold-mail, and spam lists all scrape commit metadata via the API and `.patch` endpoints). So yes, it *will* be collected.
- **But your instinct about Gmail is right.** Gmail's spam/phishing filtering is genuinely excellent, so the day-to-day nuisance is likely small — some recruiter/marketing mail, occasional phishing that mostly gets filtered.
- **The bigger, quieter cost is correlation, not spam.** Publishing history permanently links your public `halso` / `agentichq.ai` identity to your **real personal Gmail** *and* your **personal domain `<your.personal.domain>`**. That's a privacy reduction you can't undo — you can delete the repo later, but not un-scrape what mirrors/archives already grabbed.
- **Net:** even at low probability, the downside is a permanent, un-recallable leak, while the fix right now is cheap and clean. That's a classic low-regret decision: **scrub now.** If you genuinely don't care about the Gmail↔project linkage and trust Gmail's filter, skipping is *defensible* — but you're trading a few hours now for something you can never take back later.

### 2.3 Will the PR/commit/other links break? (SHA concerns)

Short version: **the important link — Jira↔GitHub — survives.** Some cosmetic things degrade. Nothing functional breaks.

| Thing | Effect of the rewrite | Verdict |
|---|---|---|
| **Jira ↔ commit/PR links** | Keyed on `AHQ-nnn` **text** in branch/commit/PR title, *not* on SHA or email. GitHub-for-Jira **re-syncs on push** and re-links the new SHAs by that text. | ✅ Survives (as long as the integration stays connected). |
| **Every commit SHA** | Changes (new author field → new hash → cascades to all descendants). | ⚠️ Expected; drives the items below. |
| **Local clones** (Ubuntu VM, other Macs) | Their history no longer matches origin; a naive `git push` would *re-introduce* the old commits. | ⚠️ **Must re-clone** after the force-push. Coordinate. |
| **2 open draft PRs** | Force-pushing their branches updates the PR head; or deleting those experiment branches auto-closes the PRs. They're "do not merge". | ✅ No real loss. |
| **38 merged/closed PRs** | Pages still render; their "merged as `<sha>`" links point at now-orphaned commits. | 🟡 Cosmetic. |
| **Contribution graph / "authored by" avatar** | **Preserved only if** you rewrite to your GitHub no-reply `988157+halso@users.noreply.github.com`. If you rewrite to `git-no-reply@agentichq.ai` (not attached to your GitHub account), commits show the name but **lose the account link/graph**. | ⚠️ **Decision — see §7 Q1.** |
| **Internal doc SHA references** (4 files, §1.6) | Become dead references. | 🟡 Cosmetic. |
| **CI / Actions run history** | Old runs reference old SHAs; just history. | ✅ Fine. |
| **Old SHAs on GitHub after force-push** | Become unreferenced but may stay **reachable by direct URL** until GitHub garbage-collects (not immediate). | ⚠️ **The one to plan for — see §5.** |

### 2.4 How to back up for full recovery — see §4. Short answer: **yes, do the online mirror; it's not gold-plating.**

---

## 3. My opinion on the Jira

- **The Jira is well-scoped and the timing is right.** Doing this while private, solo, and fork-free is the difference between a 2-hour clean job and a "contact GitHub Support and hope" job later.
- **You're slightly under-scoping it.** The ticket frames it as "my Gmail + one text file." Reality: **5 emails, 2 names, 2 content files, 1 commit message.** The Gmail is the only *scrapable* one, but since a history rewrite is all-or-nothing effort, mapping the lot to one no-reply identity costs the same and closes the `<your.personal.domain>`-domain side-door.
- **Your "am I overthinking this?" is fair — and the answer is "a bit, on impact; no, on timing."** The impact is probably minor (Gmail filters well). But the *cost to fix* is minor too, and the *window* is closing. When both impact and fix-cost are low, do the low-regret thing.
- **The experiment you designed is sound but arguably optional.** The Jira↔GitHub re-link behaviour is well-understood (it re-indexes on push by issue key). The experiment mainly buys *peace of mind*. If you want it, do the minimal version (one main-branch test commit + one branch→squash-merge PR) rather than an elaborate setup.
- **One thing the ticket doesn't ask but should:** since you're going public, this is also the moment for a **secrets/PII sweep of full history** (API keys, tokens, your Atlassian instance URL, etc.). The email is one PII item; there may be others. Cheap to run in the same pass. (Flagging only — out of scope for AHQ-171 unless you want it folded in.)

---

## 4. Backup & recovery (your "bulletproof" requirement)

**Goal:** be able to restore the *exact* pre-scrub state — every ref, every original SHA — with one command.

**Recommended, layered:**

1. **Online mirror to a private backup repo (do this — not gold-plating).**
   - `git clone --mirror https://github.com/Agentic-HQ/agentic-hq.git` → push to a new **private** repo, e.g. `Agentic-HQ/agentic-hq-prescrub-backup`.
   - A `--mirror` captures **all** branches, tags, and refs exactly. Rollback = force-push the mirror back to `origin`, restoring original SHAs. This is your bullet-proof, exact-state, off-your-laptop copy.
2. **Local mirror on disk** (belt-and-braces, and drop a zip in Google Drive as you already do).
   - Same `--mirror` clone, kept in a folder outside the working repo.
3. **Leave `origin` untouched until the very last step.** Until you force-push, GitHub itself *is* a backup of the original.
4. **Tag the pre-scrub tip locally** (`git tag prescrub-backup-2026-07-04` on each branch you care about) before rewriting — a cheap extra anchor.

**Recovery honesty:** these restore the *git state* perfectly while the repo is still private. Once you've gone public, "recovery" can restore SHAs but **cannot un-leak** anything already scraped — which is exactly why the clean window is *now*.

---

## 5. The one gotcha that actually matters for going public: old SHAs lingering on GitHub

After a force-push, the old commit objects (with your real email) are **unreferenced** but **not immediately deleted**. On GitHub they can remain accessible via a direct URL like `github.com/Agentic-HQ/agentic-hq/commit/<old-sha>` until GitHub runs garbage collection — which it does on its own schedule, not on demand. For a repo about to go **public**, that means a residual, low-probability path to the old email (someone would need the old SHA, but they leak via cached Jira dev panels, old clones, and the merged-PR "merged as `<sha>`" text).

**Two ways to close it:**

- **(a) In-place rewrite + ask GitHub Support to run `gc`/purge** the unreachable objects before you flip to public. Standard request; they do this.
- **(b) Nuclear, but a hard guarantee: delete-and-recreate.** Push the scrubbed history to a **brand-new** repo (object store starts clean → old SHAs simply don't exist anywhere), then delete the old one. Cost: you lose the 40 PRs' discussion threads and any issue history. Given the repo is private, solo, 0 forks, and the PRs are mostly experiments, this is *genuinely viable* and gives certainty (a) can't fully promise. **Decision — §7 Q3.**

I lean **(a)** if you value keeping PR/issue history, **(b)** if you value a cast-iron guarantee over that history.

---

## 6. Other risks & operational notes

- **Force-push blast radius.** One wrong refspec can clobber refs. Mitigated by the §4 mirror — with it, any mistake is recoverable.
- **`filter-repo` operates on a fresh clone by design.** It refuses to run on a repo with a configured remote / stashes, to protect you. So the real procedure is: mirror-clone → rewrite the clone → push. Your working repo stays untouched until the deliberate force-push.
- **Content scrub is a separate step from identity scrub.** The 2 content files (§1.3) and 1 commit message (§1.4) need `--replace-text` (a `regex==>replacement` file), not just the mailmap. Easy to forget → the email survives. I'll make sure both passes run.
- **Consider whether `docs/jira-docs/**` should be public at all.** This AHQ-171 folder *documents* the email and the scrub itself. If the jira-docs are meant to ship publicly, we either scrub the address from them or exclude the folder. Worth a quick decision before public (broader than AHQ-171).
- **Coordinate the two machines.** After the force-push, the Ubuntu VM and any other Mac clone must `git fetch` + hard-reset or (cleaner) delete and re-clone. Doing this while nobody else is mid-work avoids a re-introduction of old SHAs.
- **The `.local` / `telecomitalia.it` emails aren't scrapable** (not routable domains) — but they leak your Mac username and that you were on an Italian ISP. Low stakes; free to fold into the same mailmap.

---

## 7. Questions / decisions I need from you

**Q1 — Which no-reply email should ALL rewritten commits map to?** (This is the main one.)
- **(a) `988157+halso@users.noreply.github.com`** (your GitHub no-reply) → commits **stay linked to your GitHub account**: avatar, "authored by halso", contribution graph all preserved on the public repo. *My recommendation if you want attribution kept.*
- **(b) `git-no-reply@agentichq.ai`** (the one now in your `~/.gitconfig`) → commits show the name but are **not linked to your GitHub account** (unless you add that address to it). More "project-branded", less personal-account linkage.
- *(You could also use (b) but add it to your GitHub account's verified emails to get the linkage back.)*

**Q2 — How wide a scrub?**
- **(a) Minimal:** rewrite only `<your.real.name>@<your.personal.domain>` → chosen no-reply. Leaves `git-no-reply@<your.personal.domain>` (domain still visible) and the `.local`/`telecomitalia` machine emails.
- **(b) Recommended:** map **all** non-GitHub, non-agentichq personal emails (`<your.real.name>@<your.personal.domain>`, `git-no-reply@<your.personal.domain>`, both `stevepersonal@…` machine addresses) → chosen no-reply, and optionally normalise name `Steve Personal` → `halso`. Same effort, closes the `<your.personal.domain>` side-door.

**Q3 — Old-SHA cleanup strategy (for going public):**
- **(a)** In-place rewrite + force-push, then ask GitHub Support to purge old objects (keeps all PR/issue history). *My lean.*
- **(b)** Delete-and-recreate into a fresh repo (hard guarantee, loses PR/issue history).

**Q4 — Run the safety experiment, or trust the analysis?**
- **(a)** Do your 3-commit test-Jira experiment first (peace of mind; ~1–2 hrs mostly waiting).
- **(b)** Skip it — the Jira↔GitHub re-link behaviour is well-understood; go straight to backup + scrub after a dry-run diff.

**Q5 — Approve installing `git-filter-repo`?** (Per your rule, I won't install anything without a yes. It's the standard tool; alternative is BFG (needs Java) or the discouraged `filter-branch`.)

**Q6 — Also fold in a full-history secrets/PII sweep** before going public (tokens, keys, Atlassian URL)? Separate from AHQ-171 but this is the natural moment. Yes / no / separate ticket.

---

## 8. What I have NOT done

Per your instruction, **no changes** beyond writing this report. No installs, no history rewrite, no force-push, no edits to any tracked file. The working tree is unchanged except for this `docs/jira-docs/AHQ-171/Opus/` folder.

If you'd like extra external confirmation on the one genuinely GitHub-side-behaviour claim (old SHA reachability + how to force purge), I've dropped a ready-to-paste Perplexity question at:
`docs/jira-docs/AHQ-171/research-files/Q1-github-old-sha-reachability-after-force-push.md` — optional; I'm confident in the answer, but it's outward-facing and irreversible, so a second source is reasonable.
