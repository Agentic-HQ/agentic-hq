# Steve How To… Review The Curation Tree

**Plan step:** 1 (Phase A) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** now — it gates everything else. Nothing is executed until the tree says APPROVED.

## What you're reviewing

`../05-go-live-file-curation-tree.md` — the KEEP/DELETE proposal for every path that has
**ever** existed on `main` (1,946 paths). KEEP = the path ships in the public repo with full
history; DELETE = the path never existed there (filtered out of history, not just deleted).
Everything DELETE'd still lives on in the archive repo.

## How to do the pass

1. Read the doc top-to-bottom. Under every node there's a `Human Comment:` line:
   - **Leave it empty** → you accept that node's KEEP/DELETE proposal as-is.
   - **Write a comment** → you want a change, have a question, or want to discuss.
2. Give real attention to the four **⚠ judgement call** nodes (searchable by "⚠"):
   - `steve-test-plugin` (shipped via marketplace.json + documented, but personal-dev in nature)
   - `.claude/commands/git/` + `commit.md` (your git workflow commands — public or not?)
   - root `CLAUDE.md` / `AGENTS.md` (AI instructions in a public repo?)
   - `docs/artifacts/` (the workflow-built-a-workflow record — dogfooding evidence vs junk)
3. Skim **§6 (consequences)** — mostly the broken-link fixes already agreed (archive-repo
   re-pointing) — and **§7 (decision couplings)**: if you flip one of the coupled nodes,
   §7 tells you what else must change with it. Flag flips in the node's Human Comment; the
   AI recomputes rename-ancestry before deriving the paths file.
4. When done, set the **overall `Decision:`** (end of Part B, just before §6) to `APPROVED`.

## What happens next

The AI derives the `git filter-repo` KEEP whitelist mechanically from the approved tree
(applying your Human Comments first, iterating with you if any comment needs discussion).
