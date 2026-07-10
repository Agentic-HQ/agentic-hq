# Steve How To… Rename The Current Repo To agentic-hq-private And Make It Read-Only

**Plan step:** 11 (Phase C) — `../Fable/03-Fable-report-and-questions.md` §5
**When:** immediately after the Jira-app access switch (guide 02). Order within this step
matters: **rename → README header commit → archive** (you can't push once it's archived).

## 1. Rename

1. Go to `github.com/Agentic-HQ/agentic-hq` → **Settings** → **General**.
2. In **Repository name**, change `agentic-hq` → `agentic-hq-private` → **Rename**.
3. Leave visibility as **Private**. Don't connect it to anything new.

## 2. README warning header

The AI session prepares the commit (the approved draft header is in plan §5 step 11 — frozen
unscrubbed original, do-not-share warning, links to the live repo/Jiras/plans). It's one
commit on `main` of the renamed repo; push it before the next part. (Your normal `/commit`
approval flow applies.)

## 3. Make it read-only

1. Still in **Settings → General**, scroll to the **Danger Zone**.
2. Click **Archive this repository** and confirm.
3. This is **reversible**: same place → **Unarchive this repository**.

Side-effect to expect: open PRs #1 and #3 become frozen-open (read-only) — correct for a
fossil record.

## Verify

- Repo page shows the **archived** (read-only) badge and the new name.
- `git ls-remote https://github.com/Agentic-HQ/agentic-hq-private.git | head -3` works.
- The README shows the warning header at the top.
