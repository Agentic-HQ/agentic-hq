# Perplexity question (OPTIONAL) — GitHub old-SHA reachability after a history rewrite

**Why this file exists:** The one claim in the AHQ-171 report that depends on GitHub's *server-side* behaviour (not plain git) is whether old commit SHAs remain publicly reachable after a force-push, and how to force their removal before a repo goes public. Opus is confident in the answer, but because this step is outward-facing and irreversible, a second source is prudent. Paste the block below into https://perplexity.ai and drop the answer under "ANSWER" at the bottom.

---

## Question to paste into Perplexity

> I have a **private** GitHub repository that I'm about to make **public**. Before that, I'm going to rewrite its entire git history with `git filter-repo` to change the author/committer email on all commits (removing a personal email), then force-push all branches. There are 0 forks and I'm the only contributor.
>
> Please answer precisely, with sources where possible:
>
> 1. After I force-push the rewritten history, do the **old commit objects (old SHAs)** remain **reachable via direct URL** (e.g. `github.com/org/repo/commit/<old-sha>`) on GitHub, even though no branch points to them anymore? For how long?
> 2. Does GitHub run garbage collection automatically, and can I **trigger removal on demand**, or must I **contact GitHub Support** to purge unreachable/stale commits? What exactly should I ask them?
> 3. If old SHAs can linger, what are the **paths by which someone could still obtain an old SHA** (e.g. cached PR "merged as" references, cached third-party integrations, prior clones)?
> 4. Is **deleting the repo and recreating it** (pushing only the scrubbed history to a fresh repo) the only way to *guarantee* the old commit objects are unreachable, or is the Support-purge route equally reliable?
> 5. Does making the repo public **before** the old objects are purged create any window where the old email is exposed, and how do I sequence the steps (rewrite → force-push → purge → make public) to avoid that?
>
> Context tool: `git filter-repo` (not `filter-branch`). No tags, no signed commits.

---

## ANSWER (paste here)

_(waiting for Steve to paste the Perplexity answer)_
