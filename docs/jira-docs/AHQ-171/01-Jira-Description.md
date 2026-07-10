# AHQ-171 - Consider Scrubbing Personal Email Address From Git

URL: https://agentic-hq.atlassian.net/browse/AHQ-171

My personal email address was set for a period of time in my .gitconfig file which meant it got stored in the git commit metadata.   It was also set as my main email for Pull Requests etc on GitHub.  I’ve also discovered it in a single, current text file in the repo.  This Jira is about deciding whether and how to scrub and then, if I decide it's worth the time/effort/hassle - doing the scrub.

## Details

I’m worried about the risk of bots scraping this email address and spamming me or adding my email address to a database for later spamming/marketting.  It’s a Gmail address and I’ve found that Gmail is actually very good at blocking marketting/spam - so this may be low/no risk and I’m overthinking this!!!  (I’m not that concerned about private individuals interested in contacting me having the email address (I think that will be low volume and not a big problem))

This Jira is for assessing the risk, time/effort and disruption involved in scrubbing the repo and it’s history and also the risks associated with leaving this information in the repo.

The repo is currently private and unshared with anyone, but due to go public in coming days, so this is the last chance to do this cleanly, privately with minimum disruption.

## Already Fixed Going Forward

Already set in GitHub my private email address to:
988157+halso@users.noreply.github.com
and already fixed for all future commits by me setting following on my Mac and in Ubuntu VM:

(base) stevepersonal@Steves-MacBook-Pro-4 ~ % tail -2 ~/.gitconfig 
	name = halso
	email = <a no-reply agentichq.ai email address that I'm happy to have linked only to my git commits>
(base) stevepersonal@Steves-MacBook-Pro-4 ~ % 

## Things That Use The Commit SHAs

So far I'm the only person working on this, and the only integration I know of that could be affected by this is the Jira-GitHub linking (which may carry on working fine as it uses the Jira ID in the commit title to link).

I really don't know what else could be affected by recreating all these commits?  Maybe some GitHub internal stuff? Need help to understand the possible effects and the risks here.

## Backing Up

If I go ahead with this, I want a full, bullet proof, online clone of the entire repo as a backup.  I already have multiple backups of the zipped, on disk repo stored in Google Drive, but it may be a good idea to clone it on GitHub to a private backup (or is that “gold plating” the process??)

## Doing An Experiment To Test This

If I think I will go ahead with this, I would first want to:
- Do a test commit linked to a test Jira on main branch called "Test Jira For Commit On Main Branch" (Claude thinks this shouldn't break as GitHub integration will re-index based on git commit title containing Jira id, and old commit SHA won't matter)
- Branch do two test commits and then merge with a PR linked to another Jira "Test Jira For Branch And Squash Merge To Main Branch" (not clear what would happen with PR links to commits/Jira?)

Then:
- confirm all the commits and PR links are working
- run the proposed scrubbing process on the 3 commits
- wait for GitHub to re-index and re-link based on the Jira titles in the commits
- confirm all the linking still worked.

I'll then assess whether it's worth the hassle of going forward.

## Previous Feedback On This From Claude

Copy of part of previous conversation about this with Claude:-

● That's the key thing to handle before going public — and it's bigger than just main. Your remote has ~40 branches (lots of archive/* + experiments) and 190 commits, and those personal emails are baked into the author/committer fields throughout. So a real scrub means rewriting history across all refs and force-pushing everything — not a one-liner, and best done now while the repo is private with (presumably) no public forks.

  Here's what I recommend, in two parts:

Immediate, safe (no history change)

  Set this repo to use a GitHub noreply email so no future commit adds your real address. I can do this now — I just need your noreply address (GitHub → Settings → Emails → "Keep my email addresses private" shows it; format
  1234567+username@users.noreply.github.com). I'd also suggest enabling GitHub's "Block command line pushes that expose my email" there.

Scrub the existing history (the real fix for going public)

Use git filter-repo with a mail-map that rewrites all three personal addresses → your noreply email, across all branches and tags (it's not installed here — pip install git-filter-repo; Python 3.14 is present).

Then force-push all refs (--all + --tags).

  Before I touch anything, I need decisions from you, because this is destructive and outward-facing:

Your target noreply email (and the display name to keep — currently halso).

Scope: rewrite all ~40 branches, or delete the archive/* and experiment* branches first and only keep/scrub main (+ any branches you actually need public)? Deleting the historical branches makes both the scrub and the public
repo much cleaner.

Timing/coordination: a rewrite changes every commit SHA, so anyone with a clone (e.g. the Mac about to do AHQ-170 verification) must re-clone, and any open PRs break. OK to proceed, or wait until the Mac work is done?

Approval to force-push — and I'd take a safety backup of the current refs first (a mirror clone) so it's reversible.

  ⚠️  Two honest caveats: even after a rewrite, GitHub may keep old commit SHAs reachable via direct URL for a while (you can ask GitHub Support to purge); and force-pushing rewritten history is irreversible without the backup.

  Also worth doing before public

  Going public exposes everything in history, not just emails. I'd recommend a quick secret/PII scan of the full history (API keys, tokens, internal URLs, your Atlassian instance, etc.) while we're at it. I can run that (e.g.
  gitleaks/trufflehog-style scan, or a targeted grep) so there are no other surprises.

  How would you like to proceed? Tell me your noreply email + the scope (all branches vs. trim archives first), and whether to go now or after the Mac verification — then I'll lay out the exact commands and, with your go-ahead,
  run the rewrite + force-push (after taking a backup). If you'd rather run the rewrite yourself, I'll hand you the precise commands instead.


  ## Later Conversation With Claude About Jira - GitHub Issue Linking Being Unaffected


  Would scrubbing the email break the link (in general)?

  No — not because of the email. Here's the mechanism:

  1. The link is keyed on the issue key, not the email. GitHub-for-Jira associates a commit with an issue by scanning the branch name, commit message, and PR title for the string AHQ-163. The author/committer
  email plays no part in the association. Removing <your.real.name>@<your.personal.domain> leaves AHQ-163 in the message untouched, so the matching basis is intact.
  2. The real subtlety is the SHA, not the email. You can't edit an author email without rewriting history, and that changes the commit hash (e12371b… → a brand-new SHA). On force-push:
    - The old SHA ceases to exist on the remote. Any already-cached Jira link pointing at the old SHA would reference a now-dead commit.
    - But GitHub-for-Jira re-syncs on push and re-indexes the new commits by their messages. Since the rewritten commit still says AHQ-163, it gets re-linked to the same issue under its new SHA.

  Bottom line: scrubbing the email doesn't break the Jira↔commit association — that association survives on the issue-key text. The history rewrite reshuffles SHAs, but the integration re-links on re-sync as
  long as AHQ-163 stays in the commit message. For AHQ-163 today there's nothing linked anyway, so there's nothing to lose.

  One caveat worth flagging: this all assumes the GitHub-for-Jira app stays connected and re-syncs the force-pushed branch. If the integration is disconnected (which the empty panel might hint at), links are
  populated only on future syncs regardless of the scrub.

