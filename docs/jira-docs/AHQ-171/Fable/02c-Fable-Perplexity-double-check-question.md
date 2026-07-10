# Perplexity Double-Check Question (AHQ-171 / AHQ-174 plan)

*Paste everything below the line into perplexity.ai. Response will be pasted back and used to confirm/correct the Fable report (`03-Fable-report-and-questions.md`).*

---

I'm about to take a private, solo-developer GitHub repository public, and first I'm scrubbing a personal email address out of the git history. Please fact-check the technical assumptions my plan rests on, as of July 2026, citing current GitHub/Atlassian/git documentation or other authoritative sources where possible.

**The plan (technology-relevant parts only):**
The current private repo (~448 commits, ~42 branches, 40 pull requests, no tags/releases/LFS/Actions, no forks, GitHub-for-Jira integration in use, Jira issue keys like `AHQ-123` in every commit message) will NOT be scrubbed in place. Instead:

1. Rename the existing repo to a new name; it stays **private forever, untouched** (it keeps the personal email in commit metadata and in GitHub's PR data).
2. Make a local mirror clone, rewrite it once with `git filter-repo` — `--mailmap` to change the author/committer email on ~294 commits to a no-reply address, plus `--replace-text` to scrub the literal email string from 3 historical file blobs — then push the rewritten history to a **brand-new** repo (all branches). This becomes a public, read-only "archive" repo (GitHub's "Archive repository" feature) after a secrets/PII review.
3. Run a **second** `git filter-repo` pass over the rewritten history with `--invert-paths` to remove ~93 MB of internal docs paths from all of history, and push just `main` to another **brand-new** repo with the original repo's name. This becomes the public "go-live" repo, and only this repo gets connected to the GitHub-for-Jira app.

**Please confirm, correct, or qualify each numbered claim. Where a claim is wrong or outdated, say what's actually true. Then add anything important I appear to have missed.**

## A. Why in-place scrubbing was rejected

1. GitHub keeps a read-only ref `refs/pull/<N>/head` for every pull request ever opened. These refs survive head-branch deletion, PR merge/close, and force-pushes to branches; the repo owner cannot delete or overwrite them; and anyone with read access (i.e. everyone, once public) can fetch them and obtain the original pre-rewrite commits — including author emails.
2. After a history rewrite + force-push, old commits also remain accessible on GitHub via their SHA URLs ("cached views") and via PR-associated endpoints such as `pull/<N>.patch`, `pull/<N>.diff`, and the REST API's `pulls/<N>/commits` (which returns commit author emails in JSON).
3. Only GitHub Support can truly purge this (dereference/delete affected PRs, remove cached views, run server-side GC), per GitHub's "Removing sensitive data from a repository" doc — and that doc says Support "won't remove non-sensitive data" and generally only assists where the risk "can't be mitigated by rotating affected credentials". So a request to purge a mere email address may be declined. Is there any evidence of how GitHub Support actually treats email-address-removal requests?
4. Conversely, a **brand-new repo** that only ever receives the scrubbed refs contains no old objects and no `refs/pull/*` history — there is nothing to leak, and this can be fully verified locally before anything is pushed. (Note: it's a fresh repo created from scratch, *not* a GitHub fork, so no fork-network object sharing applies.)

## B. Pre-public timing

5. Because the repo has been private its whole life, its commits/events have never been captured by public mirrors and datasets (GH Archive / BigQuery public datasets, Software Heritage, search engines, email scrapers). Scrubbing *before* the first public exposure therefore achieves a genuinely clean slate; scrubbing after going public would not (mirrors/archives would retain the old history).
6. Once public, commit author emails are trivially harvestable at scale (git clone, `commits` REST API, `<commit>.patch` URLs), and this kind of scraping for spam/marketing databases is common in practice.

## C. git filter-repo mechanics

7. `git filter-repo --mailmap` rewrites author/committer identities across all commits, and `--replace-text` rewrites matching byte strings in all blobs across all history; every affected commit and all its descendants get new SHAs (in practice, all 448 commits).
8. The rewrite strips GPG/SSH commit signatures, so the ~38 squash-merge commits currently signed by GitHub's web-flow key lose their "Verified" badge in the rewritten repos.
9. Author/committer **dates** are preserved by default, so the GitHub contribution graph rebuilds with the same dates once pushed. Related: rewritten commits attribute to the right GitHub account as long as the new author email is a verified email on that account (already verified empirically in our case).
10. Removing large paths from history with `--invert-paths` genuinely shrinks the repository (after repack), whereas merely deleting the files in a new commit leaves all historical blobs in `.git` and clone size essentially unchanged.
11. Any known gotchas with `--replace-text`/`--mailmap` worth knowing (encoding issues, binary blobs, grafts/replace refs, `--sensitive-data-removal` mode in git-filter-repo ≥ 2.47 — is that the recommended invocation now)?

## D. GitHub platform behavior

12. Renaming a repo creates a redirect from the old name, but creating a new repo under the old name afterwards kills that redirect — old saved URLs then resolve to the *new* repo (404 for paths/PRs that don't exist there). Intended in our plan; confirm this is how it behaves.
13. Pull requests are repo-local database objects: pushing the same (rewritten) history to a new repo brings zero PR pages, and PR numbering in the new repo starts again at #1. `#NN` references inside old squash-merge commit messages will autolink to (non-existent or unrelated) PRs/issues of the *new* repo.
14. GitHub's "Archive repository" setting makes a repo read-only (blocks pushes, PRs, issues), displays an "archived" badge, and is reversible at any time.
15. `git clone --mirror` of a GitHub repo fetches the `refs/pull/*` refs too (or does GitHub hide some of them, e.g. `refs/pull/*/merge`, from clones?) — I'm relying on a mirror clone as a complete local backup of the old repo including PR head commits. Correct?
16. Two non-fork repos containing near-identical commit histories (our archive repo and, before the slim-down, the go-live repo) are treated as fully independent by GitHub — no automatic linking, dedup, or fork detection. Also: do identical commits appearing in **two** public repos double-count on the author's contribution graph, or is contribution counting deduplicated by commit?
17. The account setting "Block command line pushes that expose my email" — confirm what exactly it blocks (pushes containing commits authored with a private verified email?) and that it cannot interfere with pushing the *scrubbed* history.

## E. Jira ↔ GitHub linking (GitHub-for-Jira app)

18. The GitHub-for-Jira integration associates commits/branches/PRs with Jira issues by scanning commit messages, branch names, and PR titles for issue keys (e.g. `AHQ-123`) — author email and commit SHA play no role in the matching.
19. When a repo is added to the app, it performs a historical **backfill** that indexes existing commits/branches/PRs by issue key — so a brand-new repo whose rewritten commits still contain the issue keys gets its history linked into the Jira dev panels. Question: does the backfill have a default date/depth limit (e.g. "commits from the last N months/years"), and can it be configured to cover a repo whose history spans ~1 year?
20. If two connected repos both contain commits referencing the same issue keys, the Jira dev panel shows entries from both (duplicates) — hence our choice to connect only the go-live repo. Confirm, and confirm there's no problem *disconnecting-then-never-reconnecting* the old private repo while keeping historical Jira issues intact.
21. Old dev-panel entries pointing at the previous repo's commit SHAs/PR URLs: after the rename + name-reuse, those stored links will 404 or point at the wrong repo. Is there any way this stale data causes actual problems in Jira beyond dead links (e.g. sync errors), and does it age out?

## F. Anything missed?

22. Under this plan, is there **any remaining surface on GitHub or elsewhere** through which the personal email in the *old* private repo could become publicly visible, assuming the old repo stays private forever and only the two scrubbed repos go public? (Consider: GitHub search indexing of private repos, API edge cases, Events API history, gists, GitHub's own telemetry, the GitHub-for-Jira app having already synced commit *emails* into Jira Cloud's dev-info store from the private repo — does Jira's dev panel store/expose author emails anywhere?)
23. Any other well-known pitfalls of "publish a scrubbed copy instead of force-pushing the original" that solo maintainers hit (e.g. lost stars/watchers — irrelevant here at 0 — webhooks, branch-protection, secrets, GitHub Apps needing re-install, default-branch settings)?

Please answer claim-by-claim (numbered), with sources, flagging anything where current 2026 behavior differs from older documentation, then list any additional considerations under a final "What you might have missed" heading.



Answer from Perplexity:


Below is a claim-by-claim fact check against current GitHub/Atlassian documentation as of July 2026, with corrections where needed. I’m treating your plan as technically sound overall, but several details need qualification, especially around PR refs, GitHub Support, and Jira backfill limits. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## A. Why in-place scrubbing was rejected

1. **Mostly correct, but overbroad.** GitHub documents that pull request refs exist as read-only refs and that history rewrites can leave sensitive commits accessible through cached views and pull-request references; it also says `refs/pull/*` are read-only and cannot be pushed to, so your concern is valid. GitHub’s docs do **not** explicitly guarantee that every PR’s `refs/pull/<N>/head` survives all combinations of merge, close, force-push, and branch deletion forever, so I would state this more carefully: PR refs are read-only, GitHub may retain PR-related history, and you should assume old PR-linked commits can remain reachable unless GitHub Support intervenes. [docs.github](https://docs.github.com/en/enterprise-server@3.21/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)

2. **Substantially correct, with one nuance.** GitHub says commits with sensitive data may still be accessible “directly via their SHA-1 hashes in cached views on GitHub” and “through any pull requests that reference them,” and it says history rewrites change commit hashes, which can break old links and PR views. The docs do not enumerate every endpoint you listed, but your general point is right: after a rewrite, old commit material can still surface via old SHA URLs, PR artifacts, and API responses if those PRs or cached views still exist. [docs.github](https://docs.github.com/rest/pulls/pulls)

3. **Correct on the process, but email-address requests are less clearly covered.** GitHub’s sensitive-data doc says Support can “dereference or delete any affected PRs,” “run a garbage collection,” and “remove cached views,” but also says Support “won’t remove non-sensitive data” and only assists when the risk can’t be mitigated by rotating affected credentials. That strongly suggests a pure email-removal request may be declined if GitHub classifies it as non-sensitive in context, and I did not find authoritative public evidence of a blanket policy specifically for email-address-only requests. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

4. **Correct in principle.** A brand-new non-fork repo created from scratch has no inherited PR refs, no old objects, and no fork-network sharing, so if you verify the rewritten history locally before pushing, the repo can start clean. The caveat is that once it is public, any new PRs or mirrors created later become part of the new public surface; the “clean slate” only applies at first publication. [docs.github](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/renaming-a-repository)

## B. Pre-public timing

5. **Mostly correct, but “never captured” is too strong.** If the repo has stayed private, then public web mirrors and public datasets would not normally have indexed it yet, so scrubbing before first publication is the right way to minimize exposure. However, “never captured” is stronger than the docs support: private data can still leak via collaborators, exports, apps, telemetry, or misconfigurations, and once something is public it can persist in archives and mirrors beyond your control. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

6. **Correct as a practical statement, not a formal guarantee.** Public commit emails are indeed easy to collect from clones, APIs, and patch/diff views, and GitHub’s own docs acknowledge that commits and PRs are public surfaces once a repo is public. I would avoid claiming spam-scraping is “common in practice” unless you want to cite outside security research; the important technical point is simply that public commit metadata is machine-harvestable at scale. [docs.github](https://docs.github.com/rest/pulls/pulls)

## C. git filter-repo mechanics

7. **Mostly correct, but separate identity rewriting from blob rewriting.** `--mailmap` rewrites author/committer identities, and `--replace-text` rewrites matching text in non-binary file content across history; both rewrite commit IDs for affected commits and all descendants. The only correction is that `--replace-text` does not rewrite arbitrary binary blobs, and `--mailmap` only touches identity fields, not file contents or commit messages. [github](https://github.com/newren/git-filter-repo/blob/master/Documentation/git-filter-repo.txt)

8. **Correct.** GitHub explicitly says history rewriting removes commit and tag signatures, and `git-filter-repo` removes signatures for commits that pre-date the rewrite too. So the web-flow–signed squash commits will lose their “Verified” state in the rewritten histories. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

9. **Mostly correct, with two caveats.** Commit dates are generally preserved by history-rewriting tools unless you explicitly change them, so the contribution graph should rebuild using the same dates. Attribution to the correct GitHub account depends on GitHub recognizing the rewritten author email as associated with that account, which GitHub’s merge docs confirm relies on verified email selection; your empirical result that the no-reply email already maps correctly is consistent with that behavior. [docs.github](https://docs.github.com/articles/merging-a-pull-request)

10. **Correct.** GitHub’s docs say rewriting history changes commit hashes, and GitHub’s filter-repo guidance uses `--invert-paths` to remove paths from all history, which is the right way to actually reduce stored object size. Simply deleting the files in a new commit leaves the old blobs in history, so clone size and forensic recoverability stay much larger. [docs.github](https://docs.github.com/en/enterprise-server@3.8/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

11. **The recommended invocation has changed, and `--sensitive-data-removal` is now the documented mode.** GitHub’s current docs say you need `git-filter-repo` version 2.47 or later for `--sensitive-data-removal`, and they recommend using that flag for sensitive-data cleanup. The docs also warn that `--replace-text` only affects non-binary files, that moved/renamed paths must be handled explicitly, and that `git-filter-repo` can remove remote URLs from `.git/config`, so you should expect to re-add remotes afterward. [github](https://github.com/newren/git-filter-repo/blob/master/Documentation/git-filter-repo.txt)

## D. GitHub platform behavior

12. **Correct.** GitHub says renaming a repository redirects old URLs, but if you later create a new repo using the old name, those redirects stop working. That means your “rename old repo, then reuse the original name for the go-live repo” plan behaves as you expect, including breaking old name-based redirects once the name is reused. [docs.github](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/renaming-a-repository)

13. **Correct overall.** PRs are repository-local objects, so a fresh repo gets fresh PR numbering starting at #1, and old PR pages do not carry over automatically. Old squash-merge commit messages that mention `#NN` will autolink based on the current repository context, so in the new repo they can point to a different or nonexistent issue/PR rather than the original one. [docs.github](https://docs.github.com/articles/merging-a-pull-request)

14. **Correct.** GitHub’s archive setting makes a repo read-only for normal collaboration workflows, and GitHub’s docs describe archived repositories as preventing typical editing activity while remaining reversible. It is the right mechanism for your “public archive repo” if you want people to inspect history but not mutate it. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

15. **Mostly correct, but not all `refs/pull/*` are necessarily fetchable by a normal clone.** GitHub documents `refs/pull/<N>/head` and `refs/pull/<N>/merge` as temporary read-only refs and explicitly says the `refs/pull/` namespace is read-only. A `git clone --mirror` is a good local backup strategy, but in practice you should verify whether your mirror actually has the PR refs you care about, because GitHub’s public docs explain the refs’ existence and behavior more than the precise clone-fetch behavior for every endpoint. [docs.github](https://docs.github.com/en/enterprise-server@3.21/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)

16. **Correct that the repos are independent; contribution counting is more nuanced.** GitHub treats two non-fork repos with similar histories as separate repositories unless there is an explicit fork relationship. For contribution graphs, GitHub deduplicates contributions by commit identity in ways that are not fully spelled out in the docs, so I would not rely on “identical commits in two public repos double-count” as a guarantee; the safe assumption is that duplicate commits may be recognized as the same contribution rather than counted twice. [docs.github](https://docs.github.com/articles/merging-a-pull-request)

17. **Correct.** GitHub’s docs say this setting checks the latest commit on each push and blocks the push if that commit’s author email is one of your private emails on the account. That means it should not interfere with pushing the scrubbed history, because the scrubbed history uses a non-private no-reply or otherwise non-personal address. [docs.github](https://docs.github.com/de/account-and-profile/how-tos/email-preferences/blocking-command-line-pushes-that-expose-your-personal-email-address)

## E. Jira ↔ GitHub linking

18. **Correct, with one important addition.** Atlassian documents that Jira for GitHub uses Jira issue keys in commit messages, branch names, and PR titles/descriptions to link development data; author email and commit SHA are not part of the matching rule. It also says commits, branches, pull requests, builds, and deployments can all be linked when issue keys are present. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/use-the-github-for-jira-app/)

19. **Your “default date/depth limit” assumption is only partly right.** Atlassian says automatic backfill imports **six months** of history by default, and for commits it imports only the **latest 50 commits from non-default branches**; unreachable commits are excluded. That means your ~1-year repo history is not fully covered by the default backfill, but Atlassian also says you can manually backfill from an earlier date and restart the backfill, so a 1-year span is supportable if you configure the backfill appropriately. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/github-integration-faq/)

20. **Mostly correct, but I would avoid “duplicates” as a strict rule.** Atlassian says Jira imports development data from the connected GitHub organization and recommends only one Jira site per GitHub organization to avoid sync issues; if two connected repos both contain issue keys, Jira can show development entries from both because both are valid links. Disconnecting the old private repo and leaving it disconnected should not remove historical Jira issue data already imported; Atlassian explicitly notes historical development references continue to point to the original organization/repositories until you reconnect new work sources. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-github/)

21. **Correct in essence.** Stale Jira development references can keep pointing to the old repository URLs and SHAs, and Atlassian says bulk remapping historical development-panel references is not supported. The practical effect is usually dead links or references to an old repo after rename/name reuse, rather than a catastrophic sync failure; Atlassian frames the problem as a limitation of historical references, not as an ongoing error state. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

## F. Anything missed

22. **There is still some residual surface, but your plan removes the main GitHub-visible risk.** GitHub’s docs say that even after rewriting and force-pushing, old content can still exist in clones, forks, cached views, and PR references, and that Support is needed to fully purge sensitive-data remnants from GitHub’s own storage and PR/cached-view surfaces. For Jira specifically, Atlassian documents that development data includes branches, commits, and PRs; it does not publicly say that author emails are stored in the development panel itself, so the main Jira risk is usually linkage metadata and stale repo references rather than exposed commit-email fields. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

23. **A few important operational pitfalls are worth adding.** GitHub warns that history rewrites can invalidate signatures, break or orphan open PR diffs, and require temporary removal of branch protection; it also notes that collaborators’ old clones can recontaminate the repo if they push without recloning or rebasing carefully. If you are moving from private to public, also check for secrets scanning, Actions/Secrets, deploy keys, webhooks, and any app installations or repo-scoped settings that need to be recreated on the new public repos. [docs.github](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/renaming-a-repository)

## What you might have missed

- GitHub Support’s cleanup process is the only documented way to remove GitHub-side cached PR/reference remnants, but it is explicitly limited to sensitive data and may not be granted for a plain email address. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- `git-filter-repo` removes signatures; if commit verification badges matter, you would need a separate signing strategy after the rewrite. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Atlassian’s default backfill is only six months and only the last 50 commits on non-default branches, so you should plan a manual backfill date if you need the full year of history represented in Jira. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)
- Reusing the old repo name is fine for your plan, but it permanently kills redirects from the renamed old repo, so update any external links you want to preserve before the rename. [docs.github](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/renaming-a-repository)
- The strongest remaining leak vector is not GitHub itself but any already-synced third-party systems, collaborator clones, or backups outside GitHub’s control. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

If you want, I can turn this into a concise go/no-go checklist for executing the rewrite safely.

I said:

Yes please.


It replied: 


Here’s a concise go/no-go checklist based on your plan, with the main technical points confirmed and the key caveats called out. The overall strategy is sound: scrub first, publish a clean archive copy, then publish a slim live repo under the original name. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Confirmed assumptions

- **Do not scrub in place if you want the strongest privacy outcome.** GitHub says history rewrites can still leave sensitive material reachable through cached views, PR references, and cloned copies, and Support is the only documented route to remove some GitHub-side remnants. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **A brand-new repo is the cleanest publish target.** If you create a fresh non-fork repository and push only rewritten refs, there is no inherited PR history or old object database to leak from. [docs.github](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- **Renaming the old repo, then reusing the original name later, behaves the way you expect.** GitHub says old URLs redirect after a rename, but those redirects stop if you later create a new repo under the old name. [docs.github](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- **`git filter-repo` is the right tool family for this job.** GitHub’s sensitive-data guidance now points to `git-filter-repo` as the recommended approach for full-history cleanup, and it specifically notes that deletions in a new commit do not remove old history. [docs.github](https://docs.github.com/en/repositories/working-with-files/managing-files/deleting-files-in-a-repository)

## Important corrections

- **`--replace-text` only rewrites text blobs, not arbitrary binary content.** It is appropriate for literal email strings in source/docs, but not for binary assets unless they happen to contain plain text. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **`--mailmap` changes identity fields, not file contents or commit messages.** So your email-address scrub is split across two mechanisms: identity rewriting for commits and text replacement for blobs. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **The current GitHub docs recommend `git-filter-repo`’s sensitive-data-removal mode.** If you are following GitHub’s own playbook, use the documented sensitive-data-removal flow in current `git-filter-repo` rather than assuming older invocation patterns are still the canonical one. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **Your Jira backfill assumption needs adjustment.** Atlassian says GitHub-for-Jira automatically imports six months of history by default, and for commits it only backfills the latest 50 commits from non-default branches. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

## Jira timing

- **Your one-year history is not fully covered by default backfill.** Atlassian’s manual backfill lets you choose an earlier start date and restart the backfill, so the full span should be supportable, but only if you configure it deliberately. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)
- **Issue-key matching is based on commit messages, branch names, and PR titles/descriptions.** Author email and SHA are not part of Jira’s matching rule. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/integrate-jira-software-with-github/)
- **Connecting only the go-live repo is the safest choice if you want to avoid duplicate dev-panel entries.** Atlassian’s model is repo/organization sync, so keeping the archive repo disconnected avoids importing a second source of the same issue-key history. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/integrate-jira-software-with-github/)

## Recommended execution order

1. Finish the local mirror clone and verify it contains everything you expect, especially PR refs and all branch tips. GitHub documents that PR-related refs exist and are read-only, but you should still verify your local backup rather than assume clone behavior. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
2. Run the first rewrite and push to the archive repo. Confirm that the archive repo contains only scrubbed history and that the public-facing content is acceptable. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
3. Run the second rewrite to remove internal docs paths and push only `main` to the go-live repo. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
4. Archive the archive repo, connect only the go-live repo to Jira, and manually backfill from the earliest date you need if the default six-month window is insufficient. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)
5. Recheck repo settings that often get lost in a fresh repo: default branch, branch protections, Actions settings, webhooks, deploy keys, and any GitHub App/repo-level integrations. [docs.github](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

## What I would not rely on

- **Do not rely on GitHub Support being willing to remove a plain email-address exposure.** GitHub’s docs clearly reserve stronger cleanup for sensitive data and do not promise removal of non-sensitive data. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **Do not assume old PR-linked content disappears just because the branch is rewritten.** GitHub explicitly warns that old cached or PR-referenced data can persist after a rewrite. [docs.github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- **Do not assume Jira backfills the full branch history automatically.** The default is limited, and non-default branch commit import is capped at the latest 50 commits unless you manually backfill more. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

## Final judgment

Your plan is technically solid and is the safer option compared with force-pushing the original repo. The main thing to fix is the Jira backfill assumption: default historical coverage is limited, so plan an explicit manual backfill if you need the full year indexed. [support.atlassian](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/)

Would you like a step-by-step preflight checklist for the rewrite and publication sequence?