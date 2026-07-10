# Steve How To… Aftercare (Same Day As Launch)

**Plan step:** 18 (Phase D) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** right after launch (guide 07). All same-day items.

## 1. Fresh clones on both machines (Mac + Ubuntu VM)

The rewritten history is incompatible with your old clones — **never pull/rebase an old clone**
(it would try to merge pre-scrub commits back in).

On each machine:

```bash
cd ~/dev/agentic-hq
mv agentic-hq agentic-hq-OLD-prescrub          # keep until the new clone is proven
git clone git@github.com:Agentic-HQ/agentic-hq.git
cd agentic-hq && pnpm install
```

Carry over the untracked local files from the old clone before deleting it:

- `.claude/settings.local.json`
- any `.env` files (check skill/ts-workflow subdirs too)
- anything else `git status --ignored` shows that you care about (`temp/`, local notes)

(`node_modules` doesn't need copying — `pnpm install` rebuilds it.)

Once the new clone builds and `pnpm validate` passes, delete `agentic-hq-OLD-prescrub`.

## 2. GitHub email-protection setting

github.com → **Settings** (your account, not the repo) → **Emails** →
confirm **"Block command line pushes that expose my email"** is still ticked (and keep
"Keep my email addresses private" on). It stays enabled throughout the plan — the commit
identity `988157+halso@users.noreply.github.com` is exempt from that protection, and the
setting auto-rejects any accidental push of a personal-email commit.

## 3. Clean up audit artifacts

Delete the scan working data (gitignored, this Mac):

```bash
rm -rf ~/dev/agentic-hq/agentic-hq/temp/audit-work ~/dev/agentic-hq/agentic-hq/temp/trufflehog-report.jsonl ~/dev/agentic-hq/agentic-hq/temp/trufflehog-stderr.log ~/dev/agentic-hq/agentic-hq/temp/github-prs-backup.json
```

(If paths moved, check `temp/` for anything `audit`/`report`-named. The old pre-scrub clone
you renamed in part 1 is the other thing holding the unscrubbed history locally — deleting it
is part of this cleanup once you're confident.)

## 4. Close the Jiras

Move **AHQ-171** and **AHQ-174** to Done (both are fully delivered by this plan). The AI
session can do the transitions + closing comments via the Jira MCP if you prefer.
