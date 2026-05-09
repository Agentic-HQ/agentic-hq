# Additional Doc Improvements (review pass, 2026-05-07)

A walkthrough of the current docs surfaced four more concrete issues to bundle into this ticket.

## What's already working (preserve through any rewrite)

These are the parts of the docs that are genuinely good and shouldn't be lost
in a refactor:

- `README.md` — prerequisites → quick start → working examples is well-paced.
  The auto-approved-permissions caution box (`README.md:55`) is exactly the
  right call given the security implications.
- `docs/workflow-descriptions/overview-of-workflows.md` is the standout doc:
  TOC, the "source of truth = `agentic-hq list`" callout
  (`overview-of-workflows.md:19`), per-workflow source-file links, and the
  "Why this workflow exists" / "Real-world usage in this repo" boxes
  (`overview-of-workflows.md:118`, `overview-of-workflows.md:158`) give context
  most projects skip.
- Cross-linking is consistent — README → workflow descriptions → MCP setup
  guide chain cleanly.

## Item 1 — `docs/dev/how-agentic-hq-works.md` is stale (pre-plugin layout)

This doc has not been updated since the plugin restructuring. It will quietly
mislead anyone arriving for the architecture story:

- `how-agentic-hq-works.md:47` — says custom commands live at
  `.claude/commands/`. The current layout puts them under
  `.agentic-hq/plugins/<plugin>/commands/`.
- `how-agentic-hq-works.md:117` — instructs readers to `cp src/demo/cli/math-workflow-demo-cli.ts ...`.
  The real path per the README is
  `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts`,
  and the recommended approach for new workflows is now
  `agentic-hq create-workflow`, not manual copying.
- `how-agentic-hq-works.md:140-160` — the directory-structure block shows a
  pre-plugin `src/tools/...` / `src/demo/...` layout that no longer matches
  the repo.

Options: either rewrite to match the current plugin layout, or mark the file
as historical and link to a fresh "How AHQ Works" doc. The "Why PTY?" section
(`how-agentic-hq-works.md:40`) and the file-based-I/O design rationale should
survive whichever route we pick.

HUMAN: Please rename this to how-agentic-hq-works-OLD.md and change the title, then create a whole new doc.  We'll do this now and after I've reviewed it, you can plan to delete the OLD one.

## Item 2 — README step numbering glitch

`README.md` Quick Start steps go `1, 2, 3, 4, 5, 6, 9` — the second example
block is numbered `9.` (`README.md:100`) instead of `7.`. Trivial fix.

HUMAN: Please fix.

## Item 3 — `docs/` has no index

Opening `docs/` shows nine folders with no map of what is user-facing vs
internal artifact vs historical:

```
ARCHIVED/    LATER/    dev/    jira-docs/    mission-docs/
project-docs/    user-docs/    workflow-creation-docs/    workflow-descriptions/
```

`jira-docs/` alone has 38 per-ticket folders; `mission-docs/` is workflow-run
output; `ARCHIVED/` and `LATER/` are self-explanatory but mixed in with live
docs. A one-screen `docs/README.md` index — one line per folder, marked as
"user", "developer", "internal artifact", or "historical" — would orient
visitors immediately and make the live docs easier to find.

HUMAN: Please create new README.md having sections with Internal Artifact and Historical at the bottom.

## Item 4 — `CONTRIBUTING.md` still missing

`README.md:232` already acknowledges this is pending pre-public-release. Worth
listing here so it isn't forgotten when the repo opens up.

HUMAN: I've created https://agentic-hq.atlassian.net/browse/AHQ-133 to do this before release.
