# AHQ-185 — Grammar/Logic Errors: Top 10 Remaining

Follow-up to [01-report-on-grammar-logic-errors.md](01-report-on-grammar-logic-errors.md).
The 5 serious findings in that report are all fixed (commit `7a82b84`). This report
ranks the top 10 *remaining* grammar/logic errors found by re-scanning all `*.md`
files in `docs/` (excluding `docs/jira-docs/`) and the prose files in the repo root
(2026-07-18), ordered by seriousness with a score out of 10. Findings 1–10 were all marked
**Fix** by Steve (2026-07-18) and have been applied (finding 8 with amended
wording). The below-the-cut items (11–16) have not been decided or applied.

---

## 1. README tells users Node "22 or higher" is fine — but 25+ is unsupported (Score: 7/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `README.md`, Installation step 1 (line 40).

### Before text

```
If you already have Node.js, please confirm it is version 22 or higher (version 23 is unsupported).
```

### After fix text (proposed)

```
If you already have Node.js, please confirm it is version 22 or 24 (the only supported lines — other versions, including 23 and 25+, are unsupported).
```

### Details

The project's `engines` constraint is `^22.0.0 || ^24.0.0` (stated in
`troubleshooting-quickstart.md` line 33), and `CONTRIBUTING.md` line 72 says "Node 22
and 24 LTS are both supported (not Node 23)". "Version 22 or higher" tells a user on
Node 25 or 26 they're fine — they then hit the `Unsupported engine` error at
`pnpm install`. This is the highest-traffic doc's install step 1, so the wrong
guidance has the widest reach.

---

## 2. npm-commands doc gives an "equivalent" CLI command that actually errors (Score: 6/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/dev/npm-commands.md`, Demo CLIs section (line 81).

### Before text

```
# (equivalent: agentic-hq reversal --string-to-reverse="hello there")
```

### After fix text (proposed)

```
# (equivalent: agentic-hq reversal -- --string-to-reverse="hello there")
```

### Details

Verified by running it (2026-07-18): without the `--` separator the CLI exits
immediately with `error: unknown option '--string-to-reverse=hello there'` (exit
code 1). The workflow subcommands declare no options of their own — everything
intended for the workflow must come after `--`
(`src/cli/workflow-registry-impl.ts:35-43`, and the README's Usage section:
`agentic-hq <short-name> -- [passthrough args]`). So the doc's claimed equivalent
is a command that fails.

---

## 3. Design-requirements worked example renames its own method mid-example, in a garbled sentence (Score: 6/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/dev/project-design-requirements.md`, "Important Requirement About State" (line 136).

### Before text

```
then in displaySearchResults we "push"/delegate the work of displaying to the results to the individual workspaces result objects:
```

### After fix text (proposed)

```
then in displayToUser() we "push"/delegate the work of displaying the results to the individual workspace result objects:
```

### Details

Two problems in one sentence. (1) The example's own code at line 120 calls
`workflowSearchResult.displayToUser()` — this line then describes the same method
as `displaySearchResults`, so a reader (and the workflow agents that consume this
doc as binding design requirements) can't tell whether these are one method or
two. (2) "the work of displaying **to** the results to the individual
**workspaces** result objects" has a stray "to" and a wrong plural — the intended
meaning is delegating the display work *to* the workspace result objects.

---

## 4. Design-requirements bullet: "The list fields is used … until it used to print" (Score: 5/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/dev/project-design-requirements.md`, "Important Requirement About State" (line 106).

### Before text

```
- The list fields is used to temporarily store the list from the search until it used to print
```

### After fix text (proposed)

```
- The list field is used to temporarily store the list from the search until it is used to print
```

### Details

Two grammar errors in one bullet: "fields is" (should be singular "field"), and
"until it used to print" (missing "is" — as written it accidentally reads as
past-habitual "it used to print"). Same agent-consumed doc as finding 3, so
garbling costs comprehension on every `full-jira` workflow run that loads it.

---

## 5. Troubleshooting doc claims "pnpm ships with Node.js 22+" — it's Corepack that does (Score: 5/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/user-docs/troubleshooting-quickstart.md`, `pnpm: command not found` entry (lines 22–23).

### Before text

```
- **Cause:** Corepack is not enabled. pnpm ships with Node.js 22+ but is
  inactive until you turn corepack on.
```

### After fix text (proposed)

```
- **Cause:** Corepack is not enabled. Corepack ships with Node.js 22+ but is
  inactive until you turn it on; once enabled it provides the pnpm version
  pinned in `package.json`.
```

### Details

pnpm does not ship with Node — Corepack does, and Corepack then fetches the
pinned pnpm on demand. The repo's other docs state it correctly
(`CONTRIBUTING.md` line 73: "corepack ships with Node 22 and 24; it auto-installs
the pinned pnpm version"), so this entry contradicts them, in the exact place a
confused user lands when `pnpm` isn't found.

---

## 6. SECURITY.md: "Until the Agentic HQ has been made public" — missing noun (Score: 4/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `SECURITY.md`, Reporting a vulnerability (line 9).

### Before text

```
NOTE: Until the Agentic HQ has been made public, it isn't possible to enable "Private Vulnerability Reporting".
```

### After fix text (proposed)

```
NOTE: Until the Agentic HQ repo has been made public, it isn't possible to enable "Private Vulnerability Reporting".
```

### Details

"The Agentic HQ" needs a noun — it's the *repo* being made public (matching the
Jira title quoted on the next line: "When GitHub Repo Goes Public"). A security
policy is one of the docs outsiders judge the project by, so a broken sentence in
its second paragraph is worth the one-word fix.

---

## 7. Permissions doc headings: "Sooperset MCP Atlassian MCP Tool" (Score: 4/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/user-docs/WARNING-re-auto-approved-claude-permissions.md`, two section headings (lines 25 and 37).

### Before text

```
## Jira (via Sooperset MCP Atlassian MCP Tool)
...
## Confluence (via Sooperset MCP Atlassian MCP Tool)
```

### After fix text (proposed)

```
## Jira (via the Sooperset Atlassian MCP server)
...
## Confluence (via the Sooperset Atlassian MCP server)
```

### Details

The name is garbled — "MCP" appears twice and it's a *server*, not a tool. Every
other doc uses the correct name (e.g. `setting-up-jira-mcp-server.md`'s title:
"the Sooperset Atlassian MCP Server"). Verified (grep, 2026-07-18): no other doc
links to these two headings' anchors, so changing them breaks no links.

---

## 8. README: Windows users "encouraged to either:" — followed by three options (Score: 3/10)

**Human Decision (Fix/Leave):** Fix with amended wording (Steve, 2026-07-18) — applied as "Windows users are encouraged to do one of the following:" instead of the proposed after-text.

**File:** `README.md`, Operating Systems Supported (line 22).

### Before text

```
Windows users are encouraged to either:
```

### After fix text (proposed)

```
Windows users are encouraged to:
```

### Details

"Either" implies exactly two alternatives; three bullets follow (VMware, WSL, ask
Claude + submit a PR). Dropping "either" fixes it without touching the bullets.

---

## 9. CONTRIBUTING.md: "GREEN involve writing only enough code" (Score: 3/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `CONTRIBUTING.md`, TDD section (line 117).

### Before text

```
The RED stage in TDD involves writing a single test that must fail, and GREEN involve writing only enough code (no more) to make that test pass.
```

### After fix text (proposed)

```
The RED stage in TDD involves writing a single test that must fail, and GREEN involves writing only enough code (no more) to make that test pass.
```

### Details

Simple subject–verb agreement: "GREEN involve" → "GREEN involves". Contributor-facing
top-level doc.

---

## 10. Philosophy doc: "into the rules using **during** coding" (Score: 3/10)

**Human Decision (Fix/Leave):** Fix (Steve, 2026-07-18) — applied.

**File:** `docs/dev/project-philosophy-and-origin-story.md`, UPDATE paragraph (line 22).

### Before text

```
then incorporate those style requirements into the rules using **during** coding rather than waiting for the code review.
```

### After fix text (proposed)

```
then incorporate those style requirements into the rules used **during** coding rather than waiting for the code review.
```

### Details

"the rules using during coding" is a broken phrase — "using" should be "used"
("the rules used during coding"). The bolding of **during** can stay; it's the
verb form that's wrong. Low score only because the doc describes itself as
rambling founder thoughts, but the sentence as written doesn't parse.

---

## Below the cut — minor items that didn't make the 10

One-line issues, all cosmetic. Mark the Decision column if you want any applied.

| # | File:line | Issue | Proposed fix | Score | Human Decision (Fix/Leave) |
|---|---|---|---|---|---|
| 11 | `README.md:113` | "used as a directory name in (`docs/tickets/…`)" — parenthesis placement | "used as a directory name (in `docs/tickets/<ticket-id>/workflow-files/`)" | 2/10 | |
| 12 | `README.md:178` | "requires human in the loop" / "with human in the loop" — missing article ×2 | "requires a human in the loop" / "with a human in the loop" | 2/10 | |
| 13 | `CONTRIBUTING.md:7` | "Human oversight and understanding … is required" — compound subject | "…are required" | 2/10 | |
| 14 | `docs/dev/ci-configuration.md:69` | "Frozen lockfile plus pnpm's build-script blocking … bound what dependency code can execute" | "…bounds what dependency code can execute" | 2/10 | |
| 15 | `docs/dev/potential-feature-ideas.md:47` | Declarative sentence ends with "?" ("…if you want this resumable workflow?") | End with "." | 1/10 | |
| 16 | `README.md:232` | Missing comma: "…forked version of the project we'd appreciate it…" | "…of the project, we'd appreciate it…" | 1/10 | |
