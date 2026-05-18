# Documentation Thorough Audit (AHQ-42)

## How to use this doc

This is a triage document. Three Claude Code agents went through every maintained doc in this repo (excluding the things listed under "Out of scope" below) looking for: stale facts, wrong facts, unclear writing, inconsistent terminology/style, awkward file/dir organisation, missing docs, and anything else that would trip up a fresh "AI-interested TypeScript dev" reading the project for the first time.

For each finding you'll see:
- **Severity** — STALE / WRONG / UNCLEAR / INCONSISTENT / ORG / MISSING / NOTE
- **Location** — file path and line range (line numbers may shift if the doc has been edited since this audit was generated on 2026-05-07)
- **Issue** — what's wrong, in one or two sentences
- **Claude Recommendation** — what I'd do
- **Human Decision And Optional Comment** — blank line for you to fill in: `approve` / `defer` / `leave` (+ optional one-line comment)

When you fill in the Human Decisions, this file becomes the work-list for one or more follow-on Jiras.

## Out of scope

Per the AHQ-42 audit brief:

- **All classwitch-related docs** — `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` and the entire `docs/workflow-creation-docs/agentic-hq-classwitch-plugin/` tree. These will be torn out under [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131); auditing them now would create wasted decisions. (Findings about classwitch *references* inside non-classwitch docs ARE included.)
- **Auto-generated**: `docs/jira-docs/` (workflow execution records), `docs/mission-docs/` (mission output).
- **Cordoned-off historical**: `docs/ARCHIVED/`, `docs/LATER/`. A surface listing was checked; nothing leaks into main docs in a confusing way.

## Triage summary

Per-file findings: ~ 110 across 17 files.
Cross-file observations: 10.
Missing-doc candidates: 9.
Other repo-level observations: 7.

Highest-leverage items if you only do one pass:

1. **Wrong `pnpm validate` description in CLAUDE.md L675-678** — says 3 checks; package.json + npm-commands.md confirm 4 (typecheck + lint + format + unit tests). Fixing once removes a recurring source of confusion.
2. **Two broken relative links** in `docs/dev/potential-feature-ideas.md` L28 + L51 (`docs/project-docs/...` should be `../project-docs/...`).
3. **Wrong class-name capitalisation** in `docs/dev/project-design-requirements.md` L24: `MarshalledCliTool` should be `MarshalledCLITool`.
4. **Wrong fact** in `docs/user-docs/workflow-descriptions/overview-of-workflows.md` L172 — says `agentic-hq-utilities-plugin` ships utility *skills*; it actually only has `agents/`, no `skills/` directory.
5. **Node engine claim mismatch** in top-level `README.md` L29 — says "v22 LTS or higher"; package.json constrains to `<23.0.0`.
6. **Personal paths/names** in top-level `README.md` L165 (`/Users/stevepersonal/...`) and L211-216 (`Steve-Workspace-001`). Will look like leaked artefacts to a fresh public reader.
7. **`agentic-hq list` snippet** pasted into `README.md` L162-194 includes the now-defunct classwitch plugin and a dev-only `steve-test-plugin`. Regenerate after AHQ-131 lands.

## Severity legend

- **STALE** — was true when written, now isn't
- **WRONG** — never been correct, or contradicts another source of truth
- **UNCLEAR** — a fresh reader would not understand on first pass
- **INCONSISTENT** — contradicts another doc or uses different terminology for the same concept
- **ORG** — file/section/directory layout that hurts findability or comprehension
- **MISSING** — a doc/section that should exist and doesn't
- **NOTE** — informational; not necessarily a bug, often a "worth thinking about"

---

# Per-file findings

## `README.md` (top-level)

### Finding 1 — "Skill" mid-sentence terminology

- **Severity:** UNCLEAR
- **Location:** README.md L3
- **Issue:** "thin Typescript wrapper around Claude Code that allows you to create and run Typescript programs that chain together multiple Claude Code Skills" — `how-agentic-hq-works.md` L15 says "chain together multiple Claude Code sessions". Each step actually runs a custom Claude *command* (`.md` files under `commands/`); the `SKILL.md` is just the entry-point launcher. "Skills" alone is misleading.
- **Claude Recommendation:** Either say "chain together multiple Claude Code sessions" (matching `how-agentic-hq-works.md`), or "chain together Claude Code skills/commands" and introduce the skill-vs-command distinction once.
- **Human Decision And Optional Comment:** leave _(approve/defer/leave)_

### Finding 2 — Skill/command/workflow casing inconsistent across the file

- **Severity:** INCONSISTENT
- **Location:** README.md L9 and throughout
- **Issue:** Sometimes "Skill", sometimes "skill", sometimes "Workflow", sometimes "command". The same concept appears in three casings.
- **Claude Recommendation:** Pick a casing convention — proposal: lowercase `skill` / `command` / `workflow` except at sentence start — and apply across this file (and ideally the wider doc set; covered as a cross-file observation below).
- **Human Decision And Optional Comment:** leave _(approve/defer/leave)_

### Finding 3 — Confluence link is private and gives an auth wall

- **Severity:** NOTE
- **Location:** README.md L9
- **Issue:** "Point Of AHQ - 14th Feb 2026" links to a private Confluence wiki. A fresh public reader hits an auth wall.
- **Claude Recommendation:** Either gate the link with "(private wiki, contributors only)" wording, or pull the punchline into the README itself and demote the link to a footnote.
- **Human Decision And Optional Comment:** leave - planning on making Confluence Public when project goes public. _(approve/defer/leave)_

### Finding 4 — "AI Based Software System" sentence is vague

- **Severity:** UNCLEAR
- **Location:** README.md L13
- **Issue:** "create an AI Based Software System that executes a multi-stage workflow process, with human in the loop" — reads as a paraphrase of the previous sentence; no concrete example.
- **Claude Recommendation:** Tighten to one sentence with a concrete example, or link to a worked example (e.g. the math-workflow demo).
- **Human Decision And Optional Comment:** leave _(approve/defer/leave)_

### Finding 5 — Primary "Uses" example is the abandoned classwitch workflow

- **Severity:** STALE
- **Location:** README.md L15
- **Issue:** Cites the classwitch conversion workflows as the only example, then says they've been abandoned. Not a doc bug per se (AHQ-131 will tear classwitch out) but reads oddly to a fresh reader: a top-level "Uses" section whose primary example is "we're not actually using this any more".
- **Claude Recommendation:** Once AHQ-131 lands, drop this NOTE entirely. Meanwhile, optionally reword as "AHQ has the primitives for this but the only example was the (now-abandoned) classwitch conversion".
- **Human Decision And Optional Comment:** leave _(approve/defer/leave)_

### Finding 6 — Node engine claim contradicts package.json (and we should widen to support Node 24 LTS)

- **Severity:** WRONG
- **Location:** README.md L29 + `package.json` `engines`
- **Issue:** "Requires Node.js v22.x (LTS) or higher" — `package.json` `engines` is `"node": ">=22.0.0 <23.0.0"`, so Node 23/24/25 all fail the engines check despite the README implying they'd work. Separately: as of May 2026, **Node 22 is Maintenance LTS** (EOL 2027-04-30) and **Node 24 is Active LTS** (EOL 2028-04-30). For an open-source TypeScript CLI going public in 2026, the conventional posture is to support **both LTS lines simultaneously**, not Node 22 alone.
- **Status:** ✅ **RESOLVED under [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145) (2026-05-17).** The Node 22 + 24 dual-LTS upgrade was carried out. `package.json` `engines.node` is now `"^22.0.0 || ^24.0.0"` (the two supported LTS lines, Node 22 and 24 — Node 23 deliberately excluded as an EOL Current-only line), and the affected docs were corrected in the same pass — `README.md` (Node.js + Mac OS sections), `CONTRIBUTING.md`, `docs/dev/npm-commands.md`, `docs/user-docs/troubleshooting-quickstart.md` and `CLAUDE.md` — covering Findings 6, 7 and 8 together. The `node-pty`-on-Node-24 smoke test passed earlier (2026-05-16), so no Node-22-only fallback was needed. (Originally tracked in AHQ-135; delivered under AHQ-145.)
- **Human Decision And Optional Comment:** approve — resolved under AHQ-145

### Finding 7 — "to install to go https://nodejs.org…" typo and wrong claim about nvm

- **Severity:** UNCLEAR
- **Location:** README.md L31
- **Issue:** "to install to go https://nodejs.org/en/download and follow the instructions to install nvm". Two issues: typo ("to install to go"), and the nodejs.org page does not "install nvm" — nvm is a separate project.
- **Claude Recommendation:** Replace with: *"To install Node.js v22 LTS or v24 LTS, see <https://nodejs.org/en/download> or use a version manager like nvm / fnm / asdf."*
- **Status:** ✅ **RESOLVED — re-verified under [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145) (2026-05-17).** The `README.md` Node.js paragraph has no doubled-word typo, and it was reviewed and reworded in the AHQ-145 Node-24 pass. No further work needed.
- **Human Decision And Optional Comment:** human fixed

### Finding 8 — pnpm version pinned in prose, will drift

- **Severity:** NOTE
- **Location:** README.md L51
- **Issue:** "currently 10.33.0" hard-codes a version that drifts.
- **Claude Recommendation:** Replace with "the version pinned by `packageManager` in `package.json`" (which is the source of truth).
- **Status:** ✅ **RESOLVED — re-verified under [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145) (2026-05-17).** `README.md` now reads "should show the version from `package.json`" (pointing at the source of truth) rather than hard-coding a version as a standalone claim. No further work needed.
- **Human Decision And Optional Comment:** approve — resolved under AHQ-145

### Finding 9 — Caution + soft "we recommend" mix

- **Severity:** UNCLEAR
- **Location:** README.md L60 (the auto-approved-tools warning)
- **Issue:** "We recommend you check the full list at..." reads as soft caution, but the surrounding admonition is forceful. Mixed signal.
- **Claude Recommendation:** Either lean fully into the warning or shorten the soft sentence and link to the WARNING doc.
- **Human Decision And Optional Comment:** leave

### Finding 10 — Repo URL may not work pre-public

- **Severity:** NOTE / WRONG-when-public
- **Location:** README.md L66
- **Issue:** `git clone https://github.com/Agentic-HQ/agentic-hq` — if the repo isn't public yet, this clone will 404 for fresh readers.
- **Claude Recommendation:** Confirm public/private status before merging the public-share commit; if still private at share time, hedge ("once the repo is public, clone with…") or share a private invite path.
- **Human Decision And Optional Comment:** leave

### Finding 11 — Install script side-effects undocumented

- **Severity:** NOTE
- **Location:** README.md L79 (`scripts/infra/install-dev-agentic-hq.sh`)
- **Issue:** A fresh reader has no idea what this script does — does it modify global pnpm? require sudo? touch shell config?
- **Claude Recommendation:** Add a one-line summary inline ("modifies the global pnpm install dir, installs CLI symlink"), or link to the script header for the explanation.
- **Human Decision And Optional Comment:** fixed (added one-line note after the script command in README Quick Start step 3 explaining it uses `pnpm link --global`, doesn't require sudo, and doesn't modify shell config)

### Finding 12 — Skill/command/workflow terminology introduced without definition

- **Severity:** UNCLEAR
- **Location:** README.md L100 (`[Claude Skill](.../SKILL.md)`, `[Typescript program](...)`, `[Claude Command](...)`)
- **Issue:** First mention of these terms; no inline definition. Reader has to deduce.
- **Claude Recommendation:** Either add a one-line definition before this line, or restructure so the terms are defined in `how-agentic-hq-works.md` and the README links there. (See Missing-doc candidates: Glossary.)
- **Human Decision And Optional Comment:** leave

### Finding 13 — "Agentic HQ workspace" assumed-defined

- **Severity:** UNCLEAR
- **Location:** README.md L119
- **Issue:** "I suggest you run this command in the Agentic HQ workspace so the workflow is created in that workspace." A fresh reader doesn't know what "Agentic HQ workspace" precisely means.
- **Claude Recommendation:** Replace with "from inside this repo" or link to a definition.
- **Human Decision And Optional Comment:** leave

### Finding 14 — "Skill 'docs' directory" implementation detail

- **Severity:** NOTE
- **Location:** README.md L132
- **Issue:** "These will be bundled with the workflow in its Skill 'docs' directory" — undocumented convention, no link.
- **Claude Recommendation:** Either link to where the convention is described, or drop the implementation detail at this level.
- **Human Decision And Optional Comment:** leave

### Finding 15 — "Sooperset" first mention without context

- **Severity:** NOTE
- **Location:** README.md L134
- **Issue:** "Setting Up Sooperset Atlassian MCP Server For Jira" — Sooperset is the maintainer's GitHub handle (the repo is `sooperset/mcp-atlassian`). Capitalising as a proper noun is fine, but a fresh reader can't search for it.
- **Claude Recommendation:** Add a parenthetical first time: "(`sooperset/mcp-atlassian` package)".
- **Human Decision And Optional Comment:** leave

### Finding 16 — Pasted `agentic-hq list` output is dirty

- **Severity:** STALE / INCONSISTENT
- **Location:** README.md L162-194
- **Issue:** The pasted listing includes (a) `agentic-hq-classwitch-plugin` (will be removed under AHQ-131), (b) `steve-test-plugin` (developer-only with toy skills like `give-star-sign`), (c) an empty `agentic-hq-utilities-plugin`. Looks messy to a fresh reader.
- **Claude Recommendation:** Regenerate the snippet after AHQ-131 tear-out. Meanwhile decide whether to ship `steve-test-plugin` publicly, or omit it from this snippet with a `[…dev plugins omitted…]` placeholder.
- **Human Decision And Optional Comment:** leave

### Finding 17 — Pasted output contains a personal home directory path

- **Severity:** NOTE — personal info
- **Location:** README.md L165
- **Issue:** Pasted listing hard-codes `/Users/stevepersonal/dev/agentic-hq/agentic-hq` — clearly the maintainer's path.
- **Claude Recommendation:** When regenerating the snippet (Finding 16), replace with `/path/to/agentic-hq` or `<your repo>` so it doesn't read as a leak.
- **Human Decision And Optional Comment:** leave

### Finding 18 — Section ordering: Usage after Listing Available Workflows

- **Severity:** ORG
- **Location:** README.md L201-204
- **Issue:** "Usage" heading comes after "Listing Available Workflows" but is more general.
- **Claude Recommendation:** Move "Usage" before "Listing Available Workflows", or rename to "Running A Workflow" and reorder.
- **Human Decision And Optional Comment:** leave

### Finding 19 — `mkdir /tmp/tmp-Steve-Workspace-001` example uses a personal name

- **Severity:** NOTE — personal info
- **Location:** README.md L211-216
- **Issue:** Demo uses `Steve-Workspace-001` as the example workspace name.
- **Claude Recommendation:** Replace with a generic name: `/tmp/agentic-hq-demo-workspace`.
- **Human Decision And Optional Comment:** fixed (replaced with `/tmp/my-temp-workspace` per human comment)

### Finding 20 — Support section duplicates intent

- **Severity:** NOTE
- **Location:** README.md L227-229
- **Issue:** Two paragraphs in the Support section duplicate the "private contact + future Jira" message.
- **Claude Recommendation:** Merge into one paragraph.
- **Human Decision And Optional Comment:** leave

### Finding 21 — Forward-looking AHQ-133 (CONTRIBUTING.md)

- **Severity:** NOTE
- **Location:** README.md L235
- **Issue:** Forward-references AHQ-133 for CONTRIBUTING.md. Fine — the user has flagged CONTRIBUTING.md is being added in another Jira. Just confirm the Jira ID is right when CONTRIBUTING actually lands.
- **Claude Recommendation:** Recheck the Jira ID at CONTRIBUTING merge time; otherwise leave.
- **Human Decision And Optional Comment:** leave


NOTE: Claude.md clean up deferred to https://agentic-hq.atlassian.net/browse/AHQ-134 later.


## `docs/README.md`

### Finding 30 — Backtick-vs-link-text mismatch in spike list

- **Severity:** WRONG
- **Location:** docs/README.md L34-36
- **Issue:** `[`project-spikes`](project-docs/project-spikes)` — backticked text inside link doesn't match the link target's path. Cosmetic, but noisy.
- **Claude Recommendation:** Replace with `[project spikes](project-docs/project-spikes)` (drop the backticks) or `[`project-docs/project-spikes/`](project-docs/project-spikes)`.
- **Human Decision And Optional Comment:** leave

### Finding 31 — Hardcoded count "37 AHQ-N folders" will rot

- **Severity:** STALE
- **Location:** docs/README.md L44
- **Issue:** "37 `AHQ-N` folders" — verified at audit time but will drift as more Jiras complete.
- **Claude Recommendation:** Drop the count or hedge: "dozens of `AHQ-N` folders". (Or accept the drift and update opportunistically.)
- **Human Decision And Optional Comment:** leave

### Finding 32 — `Internal Artifacts` section conflates auto-gen and hand-written

- **Severity:** ORG
- **Location:** docs/README.md L42-49
- **Issue:** Lumps `jira-docs/` (auto-generated workflow output) and `workflow-creation-docs/` (hand-written design docs) together. Different lifecycles.
- **Claude Recommendation:** Either split into two sub-sections, or annotate each bullet ("(autogen)" / "(hand-written)") so a reader knows the difference.
- **Human Decision And Optional Comment:** leave

### Finding 33 — Missing link to `setting-up-jira-mcp-server.md`

- **Severity:** MISSING
- **Location:** docs/README.md User Documentation list
- **Issue:** The doc index doesn't list `docs/user-docs/workflow-descriptions/setting-up-jira-mcp-server.md`, even though README links to it. A reader navigating from `docs/README.md` would miss it.
- **Claude Recommendation:** Add a bullet alongside the overview-of-workflows.md entry.
- **Human Decision And Optional Comment:** leave

### Finding 34 — Missing link to `dev/how-to-guides/`

- **Severity:** MISSING
- **Location:** docs/README.md
- **Issue:** No link to `docs/dev/how-to-guides/` (currently contains the classwitch-override how-to). If `how-to-guides/` survives AHQ-131 (e.g. with non-classwitch how-tos), it should be linked from the index.
- **Claude Recommendation:** Defer until AHQ-131 lands. After tear-out, decide whether `how-to-guides/` is worth keeping; if so, link it.
- **Human Decision And Optional Comment:** leave

### Finding 35 — `FOCUS.md` not referenced anywhere

- **Severity:** MISSING / NOTE
- **Location:** Root of repo (not directly in docs/README.md, but could be linked here)
- **Issue:** `FOCUS.md` lives at the repo root, ~12kb, actively updated. Either it's intended to be public-facing (then link it from README/docs/README) or it's internal (then move under `docs/` or out of the public path).
- **Claude Recommendation:** Decide intent. If public-facing: add a one-line entry under "Developer Documentation" linking to `FOCUS.md`. If internal: move to a non-public path or add a header comment saying "internal note, not stable".
- **Human Decision And Optional Comment:** Fixed. Deleted and moved to Steve's private Google Docs at https://docs.google.com/document/d/12YzfMH4uxy0NRJKmc2IcSv91c-XiSHi52dBhE69-eXg/edit?tab=t.0 and linked to from Confluence at https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/1835188/Tactics+For+Getting+To+Launch+Fast#Steve%E2%80%99s-Private-%E2%80%9CFocus.md%E2%80%9D-Doc

---

## `docs/dev/how-agentic-hq-works.md`

> Generally the strongest doc in scope — clear, links validated to real code, terminology consistent.

### Finding 36 — "Plugin format" sentence is awkward

- **Severity:** UNCLEAR
- **Location:** docs/dev/how-agentic-hq-works.md L66
- **Issue:** "Plugins have been designed/structured using the standard Claude Code Plugin format so they can be used within Claude Code." "Used within Claude Code" is opaque — does it mean installable via Plugin Marketplace? (Yes, but reader has to deduce.)
- **Claude Recommendation:** Replace with: *"AHQ plugins follow Claude Code's Plugin format — meaning they can also be installed/distributed as standard Claude Code plugins or via Plugin Marketplaces (basics tested, not yet published)."*
- **Human Decision And Optional Comment:** leave

### Finding 37 — Class name `AhqWorkflowImpl` not verified

- **Severity:** WRONG (potentially)
- **Location:** docs/dev/how-agentic-hq-works.md L168
- **Issue:** "Each match is wrapped as an `AhqWorkflowImpl`" — the codebase has `src/workflow-discovery/workflow/` directory but the audit didn't confirm the exact class name. May now be `WorkflowImpl` or similar.
- **Claude Recommendation:** Spot-check actual class name in source; rename if drifted.
- **Human Decision And Optional Comment:** leave

### Finding 38 — British "focussed" inconsistent

- **Severity:** INCONSISTENT
- **Location:** docs/dev/how-agentic-hq-works.md L243
- **Issue:** Uses "focussed" (British). Other docs use "focused". (Wider British/US spelling inconsistency is a cross-file observation below.)
- **Claude Recommendation:** Standardise on one — recommend "focused" for international/public audience.
- **Human Decision And Optional Comment:** fixed (replaced both `focussed` instances at lines ~292 and ~306 with `focused` — file is now self-consistent with its existing `focused` at L72)

### Finding 39 — Punctuation/title style in Key Design Principles list

- **Severity:** UNCLEAR
- **Location:** docs/dev/how-agentic-hq-works.md L256 (Markdown as memory point)
- **Issue:** Title "Markdown as memory" reads as a noun phrase; body is a paragraph; no separating punctuation.
- **Claude Recommendation:** Add sentence-ending punctuation: `**Markdown as memory.** The information that needs to flow…`. Apply same fix to other principle headings if affected.
- **Human Decision And Optional Comment:** fixed

### Finding 40 — "compaction" jargon undefined

- **Severity:** UNCLEAR
- **Location:** docs/dev/how-agentic-hq-works.md L243
- **Issue:** "compaction is less likely" — Claude Code's auto-context-compaction concept; jargon a fresh reader won't know.
- **Claude Recommendation:** Add a parenthetical first time: "(Claude Code's automatic context summarisation when the conversation gets long)".
- **Human Decision And Optional Comment:** leave

### Finding 41 — Transitional Design Notes references private Jiras

- **Severity:** NOTE
- **Location:** docs/dev/how-agentic-hq-works.md L266-298
- **Issue:** Excellent section for a developer reader, but references AHQ-102, AHQ-117, AHQ-120, AHQ-124. Fresh public reader hits an auth wall on each.
- **Claude Recommendation:** Either make AHQ Jira project publicly readable (cross-cutting), or add a top-of-section note: "Some links go to a private Jira; if you can't access, ignore — narrative below stands alone."
- **Human Decision And Optional Comment:** leave (I'm opening up Jira to the public)

### Finding 42 — "Classwitch Root Project pattern" bullet

- **Severity:** STALE
- **Location:** docs/dev/how-agentic-hq-works.md L284
- **Issue:** "**Classwitch Root Project pattern.** ... `agentic-hq-with-colours` repo planned in [AHQ-120]…" — AHQ-131 will tear classwitch out, so this bullet (and the rationale around it) becomes wrong.
- **Claude Recommendation:** Defer until AHQ-131 lands; then remove or rewrite.
- **Human Decision And Optional Comment:** defer

---

## `docs/dev/initial-aims-of-the-project.md` (renamed to the founder's [Project Philosophy & Origin Story](docs/dev/initial-aims-of-the-project.md))

> Founder's narrative essay — the doc itself flags it as "rambling" and tells the reader they can skip. Findings are light-touch.

### Finding 43 — "(rambling)" self-deprecation

- **Severity:** NOTE
- **Location:** docs/dev/initial-aims-of-the-project.md L3
- **Issue:** "(rambling)" — endearing but invites readers to skip a doc that's actually motivating.
- **Claude Recommendation:** Optional: replace with "(personal narrative — feel free to skim)".
- **Human Decision And Optional Comment:** leave

### Finding 44 — "in it's context" — its-vs-it's

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L5 (now `project-philosophy-and-origin-story.md`)
- **Issue:** "in it's context" — `it's` should be `its`.
- **Claude Recommendation:** Fix.
- **Human Decision And Optional Comment:** fixed (and bonus sweep: spotted a second `it's→its` typo in the same paragraph at user's request — "wait for it to fill it's context" → "its context" — and one more in `project-design-requirements.md` L157 "knows it's workspace root" → "its workspace root". A wider sweep of `it's WORD` patterns across all maintained non-spike docs confirmed no other possessive misuses.)

### Finding 45 — Multiple typos in opening paragraph

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L6
- **Issue:** "what AHQ is: a framework what allows you write" — `what` should be `that`; `you write` should be `you to write`.
- **Claude Recommendation:** Replace L6 with: *"a framework that lets you write and run a simple TypeScript program that chains together Skill invocations in Claude Code."*
- **Human Decision And Optional Comment:** fixed

### Finding 46 — Long single paragraph on code-review philosophy

- **Severity:** UNCLEAR
- **Location:** docs/dev/initial-aims-of-the-project.md L19-20 (now `project-philosophy-and-origin-story.md`)
- **Issue:** Single ~600-word paragraph. The "UPDATE:" sentence is a natural break.
- **Claude Recommendation:** Break into 2-3 paragraphs at the natural breaks.
- **Human Decision And Optional Comment:** fixed (split into 3 paragraphs at the natural breaks: before "UPDATE:" and before "Overall I think it's possible". No wording changes.)

### Finding 47 — Awkward "Part of the reason for this question" sentence

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L20
- **Issue:** "I think part of the reason for this question is that whatever you are trying to fix at the Code Review stage can partly be pushed back into the actual coding process." Awkward.
- **Claude Recommendation:** Replace with: *"Part of the reason they ask is: whatever you'd catch at code review can usually be pushed earlier into the coding process itself."*
- **Human Decision And Optional Comment:** leave

### Finding 48 — Spelling: "examplar" → "exemplar"

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L22 (now `project-philosophy-and-origin-story.md`)
- **Issue:** "examplar" — non-word.
- **Claude Recommendation:** Replace with "exemplar".
- **Human Decision And Optional Comment:** fixed

### Finding 49 — Spelling: "develope" → "develop"

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L24 (now `project-philosophy-and-origin-story.md`)
- **Issue:** Non-word.
- **Claude Recommendation:** Replace with "develop".
- **Human Decision And Optional Comment:** fixed

### Finding 50 — Title-case mismatch for book title

- **Severity:** INCONSISTENT
- **Location:** docs/dev/initial-aims-of-the-project.md L26 vs L13 (now `project-philosophy-and-origin-story.md`)
- **Issue:** "A Philosophy Of Software Design book" (L26) vs "A Philosophy of Software Design" link text (L13).
- **Claude Recommendation:** Standardise on the canonical book title: "A Philosophy of Software Design" (lowercase "of").
- **Human Decision And Optional Comment:** fixed

### Finding 51 — Stray "it's" should be "its"

- **Severity:** WRONG
- **Location:** docs/dev/initial-aims-of-the-project.md L28 (now `project-philosophy-and-origin-story.md`)
- **Issue:** "Building a highly complex bit of AI powered software using Skills has it's limits".
- **Claude Recommendation:** Fix to "its".
- **Human Decision And Optional Comment:** fixed

### Finding 52 — Mixed second/first-person voice

- **Severity:** UNCLEAR
- **Location:** docs/dev/initial-aims-of-the-project.md (throughout L19-28)
- **Issue:** Mixes "you have" / "I think". Loose.
- **Claude Recommendation:** Pick one voice — first person is fine for this founder's-essay file. Replace "you" → "we/I".
- **Human Decision And Optional Comment:** leave

### Finding 53 — Doc title doesn't set expectations

- **Severity:** NOTE
- **Location:** docs/dev/initial-aims-of-the-project.md (whole file)
- **Issue:** Currently linked from README as one of "Further Documentation" — reader expects docs, gets a wall of narrative.
- **Claude Recommendation:** Optional: rename file or section title to something like "Project Philosophy & Origin Story" so reader knows what they're getting.
- **Human Decision And Optional Comment:** human fixed by renaming to the founder's [Project Philosophy & Origin Story](docs/dev/initial-aims-of-the-project.md) and updating links.

---

## `docs/dev/npm-commands.md`

### Finding 54 — `pnpm validate` 4-step listing is correct (cross-check note)

- **Severity:** NOTE
- **Location:** docs/dev/npm-commands.md L21
- **Issue:** This file correctly lists 4 steps (typecheck + lint + format + unit tests). CLAUDE.md L675-678 lists 3. This is the source-of-truth.
- **Claude Recommendation:** Leave as-is. (CLAUDE.md is the one to fix — see Finding 25.)
- **Human Decision And Optional Comment:** leave

### Finding 55 — Brittle leading-spaces grep

- **Severity:** NOTE
- **Location:** docs/dev/npm-commands.md L83-84
- **Issue:** `pnpm run | grep '^  demo:'` — leading-spaces match assumes pnpm's current indentation; could break with pnpm changes.
- **Claude Recommendation:** Optional: switch to `pnpm run | grep demo:` (no anchor). Trade-off: less precise but more portable.
- **Human Decision And Optional Comment:** leave

### Finding 56 — "10 minutes" hard-coded

- **Severity:** NOTE
- **Location:** docs/dev/npm-commands.md L122
- **Issue:** "the longest single e2e test takes approx 10 minutes" — verifiable but rots; the same number appears in `overview-of-workflows.md` L120 and AHQ Jiras.
- **Claude Recommendation:** Either drop the number, or hedge ("as of 2026-05; current value lives in the test file").
- **Human Decision And Optional Comment:** leave

### Finding 57 — Watch-mode policy duplicated with CLAUDE.md

- **Severity:** STALE / DUPLICATION
- **Location:** docs/dev/npm-commands.md L143-147
- **Issue:** "Watch Mode Disabled" section duplicates `CLAUDE.md` rules (L54, L667-ish).
- **Claude Recommendation:** Keep this file as the canonical doc-place for the policy (it's where humans look); delete the redundant CLAUDE.md rule when the workflow engine enforces tests.
- **Human Decision And Optional Comment:** leave

### Finding 58 — "Test Order for TDD" section out of place

- **Severity:** ORG
- **Location:** docs/dev/npm-commands.md L150-157
- **Issue:** Opinionated TDD-ordering guidance doesn't fit a "npm-commands reference".
- **Claude Recommendation:** Move to a TDD docs page (or to CLAUDE.md), or rename this file `dev/scripts-and-test-conventions.md` to acknowledge it's a hybrid.
- **Human Decision And Optional Comment:** human has fixed

### Finding 59 — Missing `pnpm install` mention

- **Severity:** MISSING
- **Location:** docs/dev/npm-commands.md (top of file)
- **Issue:** No mention of `pnpm install` itself, the first thing a fresh reader runs.
- **Claude Recommendation:** Add one line near the top: *"Use `pnpm install` (not `npm install`) — corepack will auto-fetch the pinned pnpm version from `package.json`'s `packageManager` field."*
- **Human Decision And Optional Comment:** fixed (added a "One-time setup" callout near the top of npm-commands.md framing `pnpm install` as a one-time-on-fresh-checkout step, not a recurring command)

---

## `docs/dev/potential-feature-ideas.md`

### Finding 60 — Broken relative link to spike-02

- **Severity:** WRONG
- **Location:** docs/dev/potential-feature-ideas.md L28
- **Issue:** Link `docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime` — relative path is wrong from `docs/dev/`. Should be `../project-docs/project-spikes/spike-02-dynamic-prompt-runtime`.
- **Claude Recommendation:** Fix the relative path.
- **Human Decision And Optional Comment:** fixed (already corrected to `../project-docs/...` in an earlier edit pass — verified during this batch)

### Finding 61 — Broken relative link to spike-00

- **Severity:** WRONG
- **Location:** docs/dev/potential-feature-ideas.md L51
- **Issue:** Same bug: `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system` should be `../project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system`.
- **Claude Recommendation:** Fix the relative path.
- **Human Decision And Optional Comment:** fixed (already corrected to `../project-docs/...` in an earlier edit pass — verified during this batch)

### Finding 62 — MPE spelled out only inline

- **Severity:** UNCLEAR
- **Location:** docs/dev/potential-feature-ideas.md L28
- **Issue:** "MPE" referenced; fresh reader doesn't know what it is.
- **Claude Recommendation:** Spell out on first mention: "Markdown Preview Enhanced (a VSCode extension)".
- **Human Decision And Optional Comment:** fixed (already spelled out in an earlier edit pass — first mention reads "VSCode's Markdown Preview Enhanced (MPE) extension")

### Finding 63 — Codex experiment branch may not exist on a fresh clone

- **Severity:** NOTE
- **Location:** docs/dev/potential-feature-ideas.md L66-68
- **Issue:** References `experiments/codex-slack-spike-one-shot-01` branch — fresh cloner of public repo will need to fetch it explicitly (`git fetch origin experiments/codex-slack-spike-one-shot-01`).
- **Claude Recommendation:** Add a parenthetical "(branch in this repo's GitHub remote — `git fetch origin <branch>` to inspect)".
- **Human Decision And Optional Comment:** leave

### Finding 64 — `notify-human-via-slack.sh` path not given

- **Severity:** NOTE
- **Location:** docs/dev/potential-feature-ideas.md L66
- **Issue:** References the helper script but doesn't include the path.
- **Claude Recommendation:** Add path: `.agentic-hq/agent-files/spike-agent-files/scripts/notify-human-via-slack.sh`.
- **Human Decision And Optional Comment:** human fixed

### Finding 65 — Contact info duplicated across docs

- **Severity:** NOTE
- **Location:** docs/dev/potential-feature-ideas.md L77 (and README.md, etc.)
- **Issue:** "please contact Steve (the repo owner) via the contact form at https://agentichq.ai/" — duplicated in README. Three+ places now.
- **Claude Recommendation:** One canonical contact paragraph (in README); other docs link to it. Or accept duplication and grep/replace when contact info changes.
- **Human Decision And Optional Comment:** leave

### Finding 66 — AHQ vs Agentic HQ inconsistent

- **Severity:** INCONSISTENT
- **Location:** docs/dev/potential-feature-ideas.md (throughout)
- **Issue:** Mixes "AHQ" and "Agentic HQ" — cross-file inconsistency below covers this in full.
- **Claude Recommendation:** Pick a primary form for this doc — "Agentic HQ" first mention, "AHQ" subsequently.
- **Human Decision And Optional Comment:** leave

### Finding 67 — Spelling: "muliple" → "multiple"

- **Severity:** WRONG
- **Location:** docs/dev/potential-feature-ideas.md L42
- **Issue:** Typo.
- **Claude Recommendation:** Fix.
- **Human Decision And Optional Comment:** fixed

---

## `docs/dev/project-design-requirements.md`

### Finding 68 — Title may mislead audience

- **Severity:** NOTE
- **Location:** docs/dev/project-design-requirements.md L7-9
- **Issue:** "Project Design Requirements" reads as a design-philosophy doc but is actually prescriptive coding conventions for AI agents doing TDD.
- **Claude Recommendation:** Optional: re-title to "Design Conventions for AHQ Code" or "Code Design Guidelines" so the audience is clearer.
- **Human Decision And Optional Comment:** leave

### Finding 69 — First-person voice in early section

- **Severity:** NOTE
- **Location:** docs/dev/project-design-requirements.md L21
- **Issue:** "Early in the project I spent many weeks refactoring..." — first-person; could be tightened for public.
- **Claude Recommendation:** Optional: rephrase to third-person/passive ("Early in the project, several weeks were spent refactoring...") or leave as personal-voice if the file's tone is intentional.
- **Human Decision And Optional Comment:** leave

### Finding 70 — Wrong class-name capitalisation: `MarshalledCliTool` → `MarshalledCLITool`

- **Severity:** WRONG
- **Location:** docs/dev/project-design-requirements.md L24
- **Issue:** "concrete class MarshalledCliTool in marshalled-cli-tool.ts" — the actual class name is `MarshalledCLITool` (uppercase `CLI`).
- **Claude Recommendation:** Fix to `MarshalledCLITool`.
- **Human Decision And Optional Comment:** fixed

### Finding 71 — Classwitch motivation paragraph

- **Severity:** STALE
- **Location:** docs/dev/project-design-requirements.md L62-67 (and continuing through L77)
- **Issue:** "Part of the reason for making everything ... is that we are soon going to be using the framework I've also written: classwitch ..." Per AHQ-131, classwitch is being torn out; this rationale becomes wrong.
- **Claude Recommendation:** Defer until AHQ-131 lands. Then rewrite the paragraph removing classwitch motivation; the OO reasoning may stand on its own.
- **Human Decision And Optional Comment:** defer

### Finding 72 — Spelling: "deveoped" → "developed"

- **Severity:** WRONG
- **Location:** docs/dev/project-design-requirements.md L73-74
- **Issue:** Typo.
- **Claude Recommendation:** Fix.
- **Human Decision And Optional Comment:** fixed

### Finding 73 — Long sentence in single paragraph

- **Severity:** NOTE
- **Location:** docs/dev/project-design-requirements.md L77
- **Issue:** "As has been known for 50 years..." — one long sentence.
- **Claude Recommendation:** Optional: break into two sentences.
- **Human Decision And Optional Comment:** leave

### Finding 74 — Concept Table example references private Jira

- **Severity:** NOTE
- **Location:** docs/dev/project-design-requirements.md L165-178
- **Issue:** Example refers to AHQ-106 (private Jira); fresh public reader hits auth wall.
- **Claude Recommendation:** Either drop the Jira link or describe what AHQ-106 was ("dynamic workflow discovery — see history under `docs/jira-docs/AHQ-106/`").
- **Human Decision And Optional Comment:** leave as Jira is going to be public

### Finding 75 — "STEVE TO DO LATER" section reads as personal todo

- **Severity:** STALE
- **Location:** docs/dev/project-design-requirements.md L189-213
- **Issue:** Section "STEVE TO DO LATER — Design Rules Captured In Memory, Not Yet Folded Into This Doc" includes references to Steve's `~/.claude/projects/...` memory files. Awkward in a public doc.
- **Claude Recommendation:** Either fold the rules into the body (the section title already implies this), or move to a private notes location. Recommend: fold the 9 bullets into proper sub-sections of this doc.
- **Human Decision And Optional Comment:** leave

### Finding 76 — Reconstruction note about lost memory files

- **Severity:** STALE
- **Location:** docs/dev/project-design-requirements.md L213
- **Issue:** "Note (2026-05-07): The first 7 memory files in the list above were lost during a laptop move and have been reconstructed" — meta-history that undermines confidence for a fresh reader.
- **Claude Recommendation:** Drop once Finding 75 is resolved (folding the rules in makes this note moot).
- **Human Decision And Optional Comment:** leave

---

## `docs/user-docs/WARNING-re-auto-approved-claude-permissions.md`

### Finding 77 — Filename "re-auto-approved" parses oddly

- **Severity:** ORG
- **Location:** Filename
- **Issue:** `WARNING-re-auto-approved-claude-permissions.md` — "re-auto-approved" reads like it's auto-approving things again. Awkward.
- **Claude Recommendation:** Rename to `WARNING-auto-approved-claude-permissions.md` (drop "re") or `auto-approved-permissions.md`. One cross-reference exists in `setting-up-jira-mcp-server.md` L25.
- **Human Decision And Optional Comment:** leave

### Finding 78 — `claude` CLI undefined for fresh reader

- **Severity:** UNCLEAR
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L3
- **Issue:** "passing the list in the `--allowedTools` flag to the `claude` CLI command" — newcomer may not know what the `claude` CLI is.
- **Claude Recommendation:** Add a one-line first-mention: "(`claude` = the Claude Code CLI, installed alongside Anthropic's Claude Code)".
- **Human Decision And Optional Comment:** leave

### Finding 79 — `.claude/settings.local.json` undefined

- **Severity:** UNCLEAR
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L5
- **Issue:** "You do **not** need to create `.claude/settings.local.json`" — fresh reader has no context for that file.
- **Claude Recommendation:** Add parenthetical: "(the per-workspace permissions file Claude Code would otherwise prompt you to populate)".
- **Human Decision And Optional Comment:** human fixed by removing.

### Finding 80 — Duplicated NOTE and typo

- **Severity:** INCONSISTENT
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L18, L30
- **Issue:** "NOTE: Only relevant when running Jira related workflows e.g. full-jira-tdd-story-workflow" appears twice. L30 missing space after `e.g.` ("e.g.full-jira...").
- **Claude Recommendation:** Fix typo; consider linking the workflow name to overview-of-workflows.md.
- **Human Decision And Optional Comment:** leave

### Finding 81 — "Jira related" hyphenation

- **Severity:** INCONSISTENT
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L18, L30
- **Issue:** "Jira related" — should be hyphenated to match "Jira-driven" used elsewhere.
- **Claude Recommendation:** Use "Jira-related".
- **Human Decision And Optional Comment:** leave

### Finding 82 — "added at runtime" ambiguity

- **Severity:** UNCLEAR
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L35
- **Issue:** "File-system Read access (added at runtime)" — "runtime" of what?
- **Claude Recommendation:** Replace with "added per workflow run" or "appended dynamically when the CLI launches a workflow".
- **Human Decision And Optional Comment:** leave

### Finding 83 — Long sentence front-loads AHQ-102 caveat

- **Severity:** UNCLEAR
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md L37-41
- **Issue:** Sentence is long; newcomer just wants to know what's approved before learning the eventual fix is tracked elsewhere.
- **Claude Recommendation:** State the rule plainly first; move "tracked in AHQ-102" into a trailing sentence.
- **Human Decision And Optional Comment:** leave

### Finding 84 — Missing "why" rationale

- **Severity:** MISSING
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md
- **Issue:** No mention of *why* the auto-approval exists (so unattended workflow steps don't pause for permission prompts). The security tradeoff is implicit.
- **Claude Recommendation:** Add a one-paragraph "Why we auto-approve these tools" section near the top.
- **Human Decision And Optional Comment:** human has fixed by adding "This means you don't have to manually set the permissions required for each workspace you run the AHQ workflows in, but also means you should understand what permissions the workflow are given."

### Finding 85 — Missing call-out of what's NOT auto-approved

- **Severity:** MISSING
- **Location:** docs/user-docs/WARNING-re-auto-approved-claude-permissions.md
- **Issue:** Reader sharing this publicly will want reassurance that e.g. `WebFetch`, `WebSearch`, deletion-style tools are not in this list.
- **Claude Recommendation:** Add a bullet: "Notably absent: `WebFetch`, `WebSearch`, deletion-related tools — these still prompt as normal."
- **Human Decision And Optional Comment:** leave

---

## `docs/user-docs/workflow-descriptions/overview-of-workflows.md`

### Finding 86 — Source-file links verified, all exist

- **Severity:** NOTE
- **Location:** L53, L77, L93, L130, L162
- **Issue:** All six source-file links use `../../../.agentic-hq/...` — verified all paths exist on disk. Good.
- **Claude Recommendation:** Leave.
- **Human Decision And Optional Comment:** leave

### Finding 87 — "See also AHQ-99" / private Jira link

- **Severity:** NOTE
- **Location:** L57 (and L158)
- **Issue:** "See also AHQ-99" / "first one was AHQ-6" — fresh public reader has no context if AHQ Jira is private.
- **Claude Recommendation:** Either ensure AHQ project is public, or summarise relevant content inline so the link is supplementary.
- **Human Decision And Optional Comment:** leave - Jiras will be made public post launch

### Finding 88 — Doc didn't explain where workflow names come from

- **Severity:** UNCLEAR
- **Location:** overview-of-workflows.md L70, L86, L102, L139
- **Issue:** Doc uses short ids (`reversal`, `math`, etc.) without explaining the naming convention or that the `shortId` is the only form the CLI accepts.
- **Status:** ✅ **Done (2026-05-09)** — added a "Naming convention" callout to overview-of-workflows.md.
- **Human Decision And Optional Comment:** approve — done

### Finding 89 — "step" undefined on first use

- **Severity:** UNCLEAR
- **Location:** L73
- **Issue:** "Single-step (~20 second) workflow" — newcomer doesn't yet know "step" = Claude command run.
- **Claude Recommendation:** Either define in a glossary at top, or rephrase as "Single Claude invocation".
- **Human Decision And Optional Comment:** leave

### Finding 90 — Non-ASCII math operators

- **Severity:** NOTE
- **Location:** L89 (`× 2 → + 3 → ÷ 5`)
- **Issue:** Multiplication/division signs may render differently in some terminals/editors.
- **Claude Recommendation:** Optional: keep — they render fine in modern markdown viewers; minor concern.
- **Human Decision And Optional Comment:** leave

### Finding 91 — "validation-level choice" jargon

- **Severity:** UNCLEAR
- **Location:** L107
- **Issue:** "human-in-the-loop pauses (plan reviews, refactor approval, validation-level choice)" — "validation-level choice" isn't defined anywhere.
- **Claude Recommendation:** Replace with "test-types choice (which test types to run: unit / integration / e2e)" or drop entirely.
- **Human Decision And Optional Comment:** leave

### Finding 92 — "custom e2e sequencer" detail in user doc

- **Severity:** NOTE
- **Location:** L120-122
- **Issue:** "custom e2e sequencer" + "10 minutes" runtime — somewhat in the weeds for a user doc.
- **Claude Recommendation:** Optional: move to a separate "testing" doc and keep a short pointer here.
- **Human Decision And Optional Comment:** leave

### Finding 93 — Truncated section opener

- **Severity:** UNCLEAR
- **Location:** L142
- **Issue:** Section begins "The fuller TDD-by-Jira workflow." — slightly truncated/teasing.
- **Claude Recommendation:** Lead with one-line plain-English description before that.
- **Human Decision And Optional Comment:** leave

### Finding 94 — "command 01 / 02 RED" naming convention undefined

- **Severity:** NOTE
- **Location:** L148
- **Issue:** Numbered-command convention is internal AHQ. Newcomer reading top-down hasn't met it.
- **Claude Recommendation:** Add a footnote or one-line preamble: "Workflows are made of numbered commands; each command is a Claude invocation."
- **Human Decision And Optional Comment:** leave

### Finding 95 — "test types" Jira-field ambiguous

- **Severity:** NOTE
- **Location:** L156
- **Issue:** "Test types you don't list on the Jira are simply skipped" — assumes reader understands the Jira-field convention. Doesn't say *which* Jira field holds the list.
- **Claude Recommendation:** Cross-link to the field name (custom field?) or to where this is documented.
- **Human Decision And Optional Comment:** leave

### Finding 96 — "37 such folders at time of writing" will rot

- **Severity:** STALE
- **Location:** L158
- **Issue:** Verified count today: 37 (matches). Will drift.
- **Claude Recommendation:** Drop the count or hedge: "(many such folders at time of writing — see the directory)".
- **Human Decision And Optional Comment:** leave

### Finding 97 — Wrong: utilities-plugin says it ships "skills"

- **Severity:** WRONG
- **Location:** L172
- **Issue:** "`agentic-hq-utilities-plugin` — utility skills used by other workflows (e.g. the Jira verbatim content extractor)". Actually only has `agents/` (no `skills/`); the verbatim extractor is at `agents/jira-verbatim-content-extractor.md`.
- **Claude Recommendation:** Change "skills" → "agents (Claude Code subagents)".
- **Human Decision And Optional Comment:** leave

### Finding 98 — `steve-test-plugin` may be unprofessional for public

- **Severity:** NOTE — personal/repo-organisation
- **Location:** L173 (and the plugin itself in `.agentic-hq/plugins/steve-test-plugin/`)
- **Issue:** Plugin shipped in repo with toy skills (`give-star-sign`, `calculate-age`). Reads as personal scratch.
- **Claude Recommendation:** For public release, decide whether to (a) ship as-is and leave the docs honest about it, (b) move out of the public repo, or (c) rename to something like `agentic-hq-internal-smoke-test-plugin` with clearer skill names.
- **Human Decision And Optional Comment:** leave

### Finding 99 — Missing "Mental model" preamble

- **Severity:** MISSING
- **Location:** Top of file
- **Issue:** Page jumps straight into per-workflow descriptions. Fresh TS dev hasn't internalised plugin → skill → workflow → command.
- **Status:** ✅ **Done (2026-05-09)** — added "Mental model — what runs what" callout to overview-of-workflows.md, between the "Source of truth" and "Naming convention" callouts.
- **Human Decision And Optional Comment:** approve — done

### Finding 100 — Missing "How a workflow actually executes"

- **Severity:** MISSING
- **Location:** Top of file
- **Issue:** No mention of: the CLI launches Claude Code in a fresh session per command, output of N becomes input of N+1, etc. Massive comprehension boost for newcomers.
- **Claude Recommendation:** Add a 2-3 sentence paragraph explaining lifecycle, or link to a new "how-a-workflow-runs.md" page.
- **Human Decision And Optional Comment:** leave

### Finding 101 — Missing prerequisites at top of page

- **Severity:** MISSING
- **Location:** Top of file
- **Issue:** No prerequisites callout — reader has to back out to README. Common failure: forgetting `pnpm install` first.
- **Status:** ✅ **Done (2026-05-09)** — added "Prerequisites" callout to overview-of-workflows.md (placed before the "Source of truth" callout so reader has the install context before being told to run `agentic-hq list`).
- **Human Decision And Optional Comment:** approved — done

---

## `docs/user-docs/workflow-descriptions/setting-up-jira-mcp-server.md`

### Finding 102 — Cross-link will break if filename Finding 77 lands

- **Severity:** NOTE
- **Location:** L25
- **Issue:** Links to `../WARNING-re-auto-approved-claude-permissions.md`. If we rename per Finding 77, this link needs updating.
- **Claude Recommendation:** Update if/when the rename happens.
- **Human Decision And Optional Comment:** leave

### Finding 103 — "Why Sooperset?" duplicates install-script header

- **Severity:** NOTE
- **Location:** L29-33
- **Issue:** This text and the install-script header (L1-9 of `install-or-update-sooperset-mcp-atlassian.sh`) tell the same story. Two sources of truth.
- **Claude Recommendation:** Make this doc canonical; have the script header point here.
- **Human Decision And Optional Comment:** leave

### Finding 104 — Three near-duplicate statements about static API token

- **Severity:** INCONSISTENT
- **Location:** L23, L29, L31
- **Issue:** "static API token configured once in `~/.claude.json`" / "user scope in `~/.claude.json`" / "static API token in the config" — three near-identical statements.
- **Claude Recommendation:** Tighten to one canonical sentence.
- **Human Decision And Optional Comment:** leave

### Finding 105 — Awkward phrasing "paste from once"

- **Severity:** UNCLEAR
- **Location:** L47
- **Issue:** "Keep it somewhere you can paste from once" — awkward for non-native readers.
- **Claude Recommendation:** Replace with: "Have it ready to paste — the script will prompt for it once."
- **Human Decision And Optional Comment:** fixed

### Finding 106 — `uvx` install hint missing for macOS

- **Severity:** NOTE
- **Location:** L48
- **Issue:** Links to `https://docs.astral.sh/uv/`. Could give a one-liner for macOS users.
- **Claude Recommendation:** Add: "macOS quick-start: `brew install uv`."
- **Human Decision And Optional Comment:** fixed

### Finding 107 — Claude Code CLI install link missing

- **Severity:** NOTE
- **Location:** L49
- **Issue:** "Claude Code CLI must be installed (since the script uses `claude mcp add-json`)." No install link.
- **Claude Recommendation:** Link to Claude Code install docs.
- **Human Decision And Optional Comment:** leave

### Finding 108 — Install script lacks a shebang

- **Severity:** WRONG-ish
- **Location:** L53 + the script itself at `scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh`
- **Issue:** Doc tells reader to run `scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh`. The script has no `#!/bin/bash` shebang. If the file isn't executable, direct invocation fails.
- **Claude Recommendation:** Either prefix the command with `bash` in the doc (`bash scripts/mcp-scripts/...`), or add a shebang line to the script. Recommend the shebang for robustness.
- **Human Decision And Optional Comment:** fixed (added `#!/bin/bash` as line 1; `bash -n` syntax check passes; script already had executable bit `-rwxr-xr-x`)

### Finding 109 — Default Jira URL is the Agentic HQ project's own

- **Severity:** UNCLEAR — public-share concern
- **Location:** L61
- **Issue:** "The default is `https://agentic-hq.atlassian.net` — press Enter to accept it." For a public audience, this default is the maintainer's Jira instance.
- **Claude Recommendation:** Add explicit guidance: *"The default is the Agentic HQ project's own Jira instance — replace with your org's URL unless you specifically have access to ours."*
- **Human Decision And Optional Comment:** leave - Jira will be public

### Finding 110 — Vague "you may see an 'error'"

- **Severity:** UNCLEAR
- **Location:** L65
- **Issue:** "you may see an 'error' if there wasn't one — that is safe to ignore". Reader can't match against a specific string.
- **Claude Recommendation:** Paste the actual error verbatim: e.g. *"you may see `Error: MCP server 'mcp-atlassian' not found` — safe to ignore on first run".*
- **Human Decision And Optional Comment:** leave

### Finding 111 — JSON sample suggests two separate tokens

- **Severity:** WRONG-ish
- **Location:** L78-84
- **Issue:** Sample JSON shows `JIRA_API_TOKEN` and `CONFLUENCE_API_TOKEN` as separate entries, suggesting two tokens. The script actually uses the **same** token for both env vars (Atlassian uses one token across both products).
- **Claude Recommendation:** Add one-line note: *"The same API token is used for both `JIRA_API_TOKEN` and `CONFLUENCE_API_TOKEN` — Atlassian uses one token across both products."*
- **Human Decision And Optional Comment:** fixed (added the note immediately after the JSON sample)

### Finding 112 — `claude mcp list` output may differ between versions

- **Severity:** NOTE
- **Location:** L99
- **Issue:** "mcp-atlassian: uvx mcp-atlassian — Connected" — the format may differ between Claude Code releases.
- **Claude Recommendation:** Hedge: "you should see something containing `mcp-atlassian` and `Connected`."
- **Human Decision And Optional Comment:** leave

### Finding 113 — Missing troubleshooting: no-tty `getpass`

- **Severity:** MISSING
- **Location:** Troubleshooting section
- **Issue:** No entry for `getpass`/no-tty issues (running over SSH, in CI).
- **Claude Recommendation:** Add: "Must be run in an interactive terminal — `getpass` cannot prompt over a non-tty stream."
- **Human Decision And Optional Comment:** leave

### Finding 114 — Missing uninstall instructions

- **Severity:** MISSING
- **Location:** Whole file
- **Issue:** No "Removing it" section.
- **Claude Recommendation:** Optional: add a brief uninstall section.
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/README.md`

### Finding 115 — Spike-00 bullet is one very long sentence

- **Severity:** NOTE
- **Location:** docs/project-docs/project-spikes/README.md L7
- **Issue:** Single ~1500-character bullet ("first end-to-end attempt..." through to "...not carried forward."). A skim-reader benefits from sub-bullets.
- **Claude Recommendation:** Optional: break the four bolded clauses into a sub-bulleted list under spike-00.
- **Human Decision And Optional Comment:** leave

### Finding 116 — "early 2026" anchor for fresh reader

- **Severity:** NOTE
- **Location:** docs/project-docs/project-spikes/README.md L9
- **Issue:** "early 2026" — a fresh public reader has no anchor.
- **Claude Recommendation:** Optional: leave as-is for primary audience; consider absolute date if doc rewritten.
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/README.md`

### Finding 117 — Honest "not currently runnable" framing

- **Severity:** NOTE
- **Location:** L56
- **Issue:** Mentions `stories/story-12a-...` and `project/` "still contains a (probably not currently runnable) snapshot". Honest framing, fine.
- **Claude Recommendation:** Leave.
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/spike-01-slack/README.md`

### Finding 118 — "May 2026 update" but body says "August 2025"

- **Severity:** INCONSISTENT
- **Location:** L1, L10, L47, L49
- **Issue:** Title and section say "May 2026 update", body says "In August 2025, Steve got Codex...". The August date is when the experiment happened; "May 2026" is when this README was rewritten.
- **Claude Recommendation:** Rename the H2 to "May 2026 status update on the August 2025 Codex experiment" so reader can tell time-of-doc-update vs time-of-event apart. (User flagged in earlier session that they'd consider leaving this; including for visibility.)
- **Human Decision And Optional Comment:** fixed (renamed H2 and matching ToC anchor link)

### Finding 119 — Personal path callout placement

- **Severity:** NOTE
- **Location:** L54 (Steve's machine path) vs L71 (where it's flagged as personal)
- **Issue:** Personal path appears at L54; the "this path is Steve-specific" framing only appears at L71.
- **Claude Recommendation:** Move the "personal/non-portable path" callout to immediately above L54.
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime/README.md`

### Finding 120 — Title style differs from spike-00/01

- **Severity:** INCONSISTENT
- **Location:** L1, L4
- **Issue:** Spike-00 uses em-dash subtitle ("Spike 00 — Fail-Fast Minimal Whole System"); spike-01 same; spike-02 uses colon ("Spike 02: Dynamic Prompt Runtime - ABANDONED..."). Three styles.
- **Claude Recommendation:** Align spike-02's title and badge style with spike-00/01.
- **Human Decision And Optional Comment:** leave

### Finding 121 — Demo-version listing uses ellipses

- **Severity:** UNCLEAR
- **Location:** L25-30
- **Issue:** `000-ARCHIVED/`, `001-...`, `002-...` etc. Reader doesn't know what fills the ellipses.
- **Claude Recommendation:** Either give each version a 1-line subtitle, or drop the ellipses and say "see directory listing".
- **Human Decision And Optional Comment:** leave

### Finding 122 — Resume instructions verified

- **Severity:** NOTE
- **Location:** L60-62
- **Issue:** "To Resume This Work" instructs reading `conditional-elements/001-conditional-include-inside-document/`'s README.md — verified exists and matches.
- **Claude Recommendation:** Leave.
- **Human Decision And Optional Comment:**leave

### Finding 123 — Missing cross-link to potential-feature-ideas

- **Severity:** NOTE
- **Location:** Top of file
- **Issue:** Spike-00 and spike-01 READMEs mention `docs/dev/potential-feature-ideas.md` as where the idea is tracked; spike-02 does not, even though parent README L11 says "Tracked alongside the broader Composible Commands/Skills idea in [potential-feature-ideas]".
- **Claude Recommendation:** Add a "Tracked in" line near top mirroring spike-00/01 pattern.
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime/docs/test-markdown-files/mpe-nested-conditional-demo/README.md`

### Finding 124 — Two READMEs disagree on which demo dir is canonical

- **Severity:** STALE
- **Location:** L66 (this file) vs spike-02 README L29
- **Issue:** This README describes the long-named directory `expandable-content-3-levels-...` as "Latest and most complete implementation". The parent spike-02 README L29 says `005-with-filename-data-field-and-fragment-header-class/` is "latest/best version". Disagreement.
- **Claude Recommendation:** Update this README to point at `005-...` as the latest; demote the long-named directory to "earlier version, kept as a stepping stone".
- **Human Decision And Optional Comment:** leave

### Finding 125 — Filenames listed are from the early ARCHIVED versions

- **Severity:** STALE
- **Location:** L62, L82-88
- **Issue:** Lists `fragment-level1.md`, `fragment-level2.md`, etc. — those are from `000-ARCHIVED/` versions. `005-...` uses `fragment-A.md` / `fragment-B.md` (alpha names).
- **Claude Recommendation:** Update the file references to match the canonical (post-Finding 124) version.
- **Human Decision And Optional Comment:** leave

### Finding 126 — VS Code/Cursor mention vs VSCode-only

- **Severity:** NOTE
- **Location:** L114
- **Issue:** Says preview via "VS Code/Cursor with MPE extension"; spike-02 main README L9 only mentions VSCode.
- **Claude Recommendation:** Optional: align both files. (Cursor does support MPE, so adding to the parent is fine; or remove from this file. Pick one.)
- **Human Decision And Optional Comment:** leave

---

## `docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime/docs/test-markdown-files/mpe-nested-conditional-demo/conditional-elements/001-conditional-include-inside-document/README.md`

### Finding 127 — AHQ-1 reference

- **Severity:** NOTE
- **Location:** L4
- **Issue:** "[AHQ-1]" reference. Verified link format consistent with other docs.
- **Claude Recommendation:** Leave.
- **Human Decision And Optional Comment:** leave

### Finding 128 — Code block uses `...` ellipses

- **Severity:** NOTE
- **Location:** L16-26
- **Issue:** Code block contains `...` which would confuse anyone trying to MPE-preview the example.
- **Claude Recommendation:** Either remove the ellipses (it's inside a fence so it won't render anyway) or note "(snippet abridged)".
- **Human Decision And Optional Comment:** leave

---

# Cross-file observations

### Finding 129 — Skill / command / workflow / step terminology drift

- **Severity:** INCONSISTENT
- **Location:** README.md L3, L9, L100; docs/dev/how-agentic-hq-works.md L15-16; docs/dev/initial-aims-of-the-project.md L6, L9; docs/dev/potential-feature-ideas.md (multiple)
- **Issue:** Same concept referred to with mixed casing ("Skill" vs "skill", "Command" vs "command", "Workflow" vs "workflow") and sometimes blurred meaning ("chains together Skills" vs "chains together Claude Code sessions" vs "Skill invocations").
- **Claude Recommendation:** Add a Glossary doc (covered as Missing-doc Finding 139) defining: AHQ workspace, plugin, workflow, command (per-step `.md`), skill (entry-point launcher), step, marshalling. Then standardise casing as lowercase except at sentence start.
- **Human Decision And Optional Comment:** leave

### Finding 130 — `pnpm validate` step count: CLAUDE.md disagrees with npm-commands.md

- **Severity:** WRONG
- **Location:** CLAUDE.md L675-678 (3 steps) vs docs/dev/npm-commands.md L21 (4 steps) vs package.json L17 (4 steps confirmed)
- **Issue:** CLAUDE.md misses the `format:check` step.
- **Claude Recommendation:** Fix CLAUDE.md (covered by Finding 25). npm-commands.md is correct.
- **Human Decision And Optional Comment:** leave

### Finding 131 — Two separate repo URL claims

- **Severity:** NOTE
- **Location:** README.md L66 (`Agentic-HQ/agentic-hq`); classwitch how-to L299 (out of scope) — confirm both work post-public.
- **Issue:** Ensure GitHub URLs work when repos go public.
- **Claude Recommendation:** Pre-public-share check.
- **Human Decision And Optional Comment:** leave

### Finding 132 — British vs US spelling

- **Severity:** INCONSISTENT
- **Location:** docs/dev/how-agentic-hq-works.md L243 ("focussed"), docs/dev/npm-commands.md L3 ("organized"), docs/README.md L48 ("organised")
- **Issue:** Mixed throughout.
- **Status:** ✅ **Done (2026-05-09)** — only one of the three identified locations was actually US: `docs/dev/npm-commands.md` L3 "organized" → "organised". The other two were already British (no change): `docs/README.md` L49 (was L48) "organised"; `docs/dev/how-agentic-hq-works.md` L243 "focussed" (valid British double-s variant). **Note for a future spelling-sweep Jira:** `how-agentic-hq-works.md` has internal drift — L23 uses "focused" but L243 + L257 use "focussed". Worth a wider doc-wide normalisation pass at some point, but out of scope here per "only change the ones identified".
- **Human Decision And Optional Comment:** approve — done

### Finding 133 — "AHQ" vs "Agentic HQ"

- **Severity:** INCONSISTENT
- **Location:** Throughout
- **Issue:** Mixed across all in-scope docs. README opens with "Agentic HQ"; subsequent docs interleave.
- **Claude Recommendation:** Convention sentence: *"Agentic HQ" in titles and first mention per doc; "AHQ" as informal abbreviation thereafter.*
- **Human Decision And Optional Comment:** leave

### Finding 134 — First-person ("I") vs collective ("we")

- **Severity:** INCONSISTENT
- **Location:** README.md L119, L121; initial-aims-of-the-project.md (intentional); potential-feature-ideas.md L7, L18, L41
- **Issue:** Public-facing docs read as personal blog when they use "I". Acceptable for `initial-aims` (it's the founder's note); jarring elsewhere.
- **Claude Recommendation:** Convert "I" → "we"/imperative in README and potential-feature-ideas.
- **Human Decision And Optional Comment:** leave

### Finding 135 — Forward-looking private Jira links

- **Severity:** NOTE
- **Location:** README.md, docs/dev/*.md, docs/user-docs/*.md (multiple)
- **Issue:** Private Jira links to AHQ-7, AHQ-79, AHQ-99, AHQ-102, AHQ-117, AHQ-120, AHQ-122, AHQ-124, AHQ-131, AHQ-133. Auth wall for public readers.
- **Claude Recommendation:** Either (a) make the Jira project publicly readable (low effort, biggest win), (b) add a note at the top of affected docs ("some links go to a private Jira; if you can't access, ignore"), or (c) prefer prose descriptions in user-facing docs and keep Jira IDs in dev/internal docs.
- **Human Decision And Optional Comment:** leave - Jira will be make public

### Finding 136 — Spike references inconsistent

- **Severity:** NOTE
- **Location:** docs/dev/how-agentic-hq-works.md (no mention); potential-feature-ideas.md (refs spike-00/-01/-02); docs/README.md (refs all three)
- **Issue:** Internal-architecture readers will follow the trail; fresh public reader gets puzzled.
- **Claude Recommendation:** Optional: a one-line note at top of `how-agentic-hq-works.md`: *"Spikes are exploratory R&D directories under `docs/project-docs/project-spikes/`; you can ignore them on first read."*
- **Human Decision And Optional Comment:** leave

### Finding 137 — Run a markdown link checker

- **Severity:** ORG / process
- **Location:** Whole doc tree
- **Issue:** At least 2 broken relative links (Findings 60, 61) and a backtick-link mismatch (Finding 30) — likely more.
- **Status:** ✅ **Done (2026-05-09)** — wrote a small Python link-checker (no third-party install needed); scanned 126 `.md` files excluding `docs/project-docs/`, `docs/jira-docs/`, `docs/ARCHIVED/`, `docs/LATER/`, `docs/mission-docs/`, `docs/workflow-creation-docs/`, `node_modules/`, `temp/`. **5 real broken links found and fixed:** `docs/README.md` (philosophy-link half-edited fragment), `docs/dev/potential-feature-ideas.md` ×3 (two `docs/...` paths needed to be `../...`; one `PAUSED_SPIKE_STATUS.md` link pointed to a file renamed earlier this session to `README.md`). After fixes: **zero broken links in maintained docs.** Remaining hits in the scan are all false positives or out-of-scope: 8 are `[text](url)` markdown-syntax demos / `{jira-url}` template placeholders in plugin command files (intentional); 13 are in a legacy `.claude/commands/agentic-hq-commands/spike-agent-07-task-list-creator.md` Claude Code command file (spike-related, same legacy status as the spike projects themselves). **Remaining work for a separate Jira:** wire the checker into CI so this stays green automatically — could be the existing `lychee` GitHub Action, or commit a tiny `scripts/check-markdown-links.py` and run it in `pnpm validate`.
- **Human Decision And Optional Comment:** approve — done

### Finding 138 — "Sooperset" / "MCP server" / "Jira-driven" terminology drift

- **Severity:** INCONSISTENT
- **Location:** docs/user-docs/* (cross-file)
- **Issue:** "Sooperset" vs "sooperset", "MCP server" vs "MCP Tool" vs "MCP Atlassian MCP Tool", "Jira-driven" vs "Jira-aware" vs "Jira related". Across both user-docs files.
- **Claude Recommendation:** Standardise:
  - "Sooperset" for prose, `sooperset/mcp-atlassian` for repo handle
  - "Sooperset Atlassian MCP server" (no "MCP" twice)
  - "Jira-driven" (preferred) when referring to workflows; "Jira-related" generic
- **Human Decision And Optional Comment:** leave

---

# Missing-doc candidates

(Excluding CONTRIBUTING.md per task brief.)

### Finding 139 — Missing: Glossary

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/dev/glossary.md` or `docs/glossary.md`
- **Issue:** No single source of truth for: AHQ workspace, plugin, workflow, command, skill, step, marshalling, agent (subagent vs workflow agent), `agentic-hq install dir`. Cross-doc terminology drift would resolve naturally with a glossary.
- **Claude Recommendation:** Create a 1-page `docs/glossary.md` and link from README + docs/README.md + how-agentic-hq-works.md.
- **Human Decision And Optional Comment:** fixed (created `docs/glossary.md` and linked from README, `docs/README.md`, and `docs/dev/how-agentic-hq-works.md`)

### Finding 140 — Missing: Quickstart troubleshooting

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/user-docs/troubleshooting-quickstart.md`
- **Issue:** README's quickstart has 7 numbered steps but no "what to do if step 4 fails" guide. Common failure modes: wrong Node, corepack disabled, `chmod` postinstall not running on Linux, MCP server not configured.
- **Claude Recommendation:** Create a short troubleshooting page with the top 5-10 failure modes and fixes.
- **Human Decision And Optional Comment:** fixed (created `docs/user-docs/troubleshooting-quickstart.md`, organised by README Quick Start step number; linked from README "Further Documentation" and end of Quick Start)

### Finding 141 — Missing: Architecture diagram or 10-minute tour

- **Severity:** MISSING
- **Location:** N/A — proposed addition to `docs/dev/how-agentic-hq-works.md` or new `docs/dev/architecture-overview.md`
- **Issue:** `how-agentic-hq-works.md` is excellent for top-to-bottom readers but lacks a single overview image / ASCII diagram. Even a textual "CLI → Plugin discovery → Skill resolution → Marshalled steps" diagram would help fresh readers.
- **Claude Recommendation:** Add an ASCII / mermaid diagram near the top of `how-agentic-hq-works.md`.
- **Human Decision And Optional Comment:** fixed (added "Architecture at a glance" mermaid diagram near the top of `docs/dev/how-agentic-hq-works.md`)

### Finding 142 — Missing: Skill vs Command callout

- **Severity:** MISSING
- **Location:** N/A
- **Issue:** Referenced repeatedly (README L100, L108) but never defined.
- **Claude Recommendation:** Either covered by glossary (Finding 139), or add a callout in `how-agentic-hq-works.md`.
- **Human Decision And Optional Comment:** leave (Skills are the new name for Commands in Claude Code - but I still like "command" sometimes)

### Finding 143 — Missing: How to publish a plugin

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/dev/how-to-guides/how-to-publish-a-plugin.md`
- **Issue:** Plugin format compatibility with Claude Code Plugin Marketplaces is mentioned but no doc explains "I built one — how do I share it?"
- **Claude Recommendation:** Low priority pre-public; flag for after public share.
- **Human Decision And Optional Comment:** defer as haven't tested/tried this with a proper workflow yet - will do in future if people need it.

### Finding 144 — Missing: Codebase tour

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/dev/codebase-tour.md`
- **Issue:** Only "where does the code live" entry is a bullet-list in `how-agentic-hq-works.md` L88-99. A standalone tour walking `src/` directories would help bug-fixers.
- **Claude Recommendation:** Optional medium-effort add post-public.
- **Human Decision And Optional Comment:** defer

### Finding 145 — Missing: `docs/user-docs/README.md`

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/user-docs/README.md`
- **Issue:** No landing page for the user-docs section. A fresh reader arriving deep-linked has no orientation.
- **Claude Recommendation:** 10-line orientation: what's in the folder, who it's for, where to start.
- **Human Decision And Optional Comment:** leave (as only one doc in there)

### Finding 146 — Missing: `docs/user-docs/getting-started.md`

- **Severity:** MISSING
- **Location:** N/A — proposed `docs/user-docs/getting-started.md`
- **Issue:** Install + first-workflow walkthrough lives in root README. For a polished public release it's normal to mirror in user-docs.
- **Claude Recommendation:** Mirror or hyperlink the README's quickstart from a user-docs landing page.
- **Human Decision And Optional Comment:** leave

### Finding 147 — Missing: A real "Roadmap-lite" line

- **Severity:** MISSING
- **Location:** README.md
- **Issue:** `potential-feature-ideas.md` exists but explicitly says it's not a roadmap. README never sets expectations.
- **Claude Recommendation:** One line in README: *"Roadmap is informal and idea-driven; see `docs/dev/potential-feature-ideas.md`."*
- **Human Decision And Optional Comment:** leave

---

# Other repo-level observations

### Finding 148 — `.DS_Store` files committed

- **Severity:** ORG
- **Location:** `docs/.DS_Store`, `docs/ARCHIVED/.DS_Store`, `docs/LATER/.DS_Store`, `docs/project-docs/.DS_Store`, `docs/project-docs/project-spikes/.DS_Store`, plus several inside spike dirs
- **Issue:** macOS metadata files committed.
- **Claude Recommendation:** Add `.DS_Store` to `.gitignore` and remove the tracked instances (`git rm --cached`). Low priority pre-private; do before public share.
- **Human Decision And Optional Comment:** already done (verified 2026-05-09: `.DS_Store` is in `.gitignore` L157 and `git ls-files | grep .DS_Store$` returns no tracked files. The on-disk `.DS_Store` files exist but are correctly ignored — must have been untracked in an earlier commit.)

### Finding 149 — Personal info leakage: `/Users/stevepersonal/...`

- **Severity:** NOTE — personal info
- **Location:** README.md L165 (in pasted `agentic-hq list` output); spike-01 README L54 (personal Codex working-copy path); CLAUDE.md L692 (mission-doc example timestamp); L774-797 (real-example refs)
- **Issue:** Maintainer's home-directory path appears multiple times in user-facing docs.
- **Claude Recommendation:** Single grep+replace pass before public share: `/Users/stevepersonal` → `/path/to` or appropriate placeholder. Spike-01's path is intentional (it explicitly explains it's a personal hook); the others are leaks.
- **Human Decision And Optional Comment:** leave

### Finding 150 — Personal info: "Steve" in example workspace name

- **Severity:** NOTE — personal info
- **Location:** README.md L211-216 (`Steve-Workspace-001`)
- **Issue:** Example demo workspace name uses "Steve".
- **Claude Recommendation:** Replace with neutral placeholder (`agentic-hq-demo-workspace` or `my-workspace`).
- **Human Decision And Optional Comment:** This is a duplicate of "### Finding 19 — `mkdir /tmp/tmp-Steve-Workspace-001` example uses a personal name"

### Finding 151 — `steve-test-plugin` in public repo

- **Severity:** NOTE — repo organisation
- **Location:** `.agentic-hq/plugins/steve-test-plugin/` (and visible in `agentic-hq list` output, overview-of-workflows L173)
- **Issue:** Plugin shipped publicly with personal-name and toy skills (`give-star-sign`, `calculate-age`). Reads as scratch.
- **Claude Recommendation:** For public share, decide: (a) ship as-is and own the candid framing, (b) move out of public repo, (c) rename to `agentic-hq-internal-smoke-test-plugin` and rename skills to neutral test names.
- **Human Decision And Optional Comment:** leave

### Finding 152 — Private Jira links — global decision needed

- **Severity:** NOTE
- **Location:** Across all docs
- **Issue:** Many AHQ-NN links across the doc set assume the reader has Atlassian access.
- **Claude Recommendation:** Pick a global policy:
  - (a) Make AHQ Jira project publicly readable. Highest leverage; one-time config change.
  - (b) Replace with prose descriptions in user-facing docs; keep Jira IDs in dev-internal docs only.
  - (c) Add a banner at top of every affected doc: "Some links go to a private Jira; if you can't access, ignore."
- **Human Decision And Optional Comment:** leave

### Finding 153 — Hardcoded numbers/dates that will rot

- **Severity:** STALE
- **Location:** Multiple — README.md L51 ("currently 10.33.0"); docs/README.md L44 ("37 folders"); overview-of-workflows.md L158 (same "37 folders"); npm-commands.md L122 ("10 minutes"); CLAUDE.md L692 (Nov-2025 timestamp); docs/dev/project-design-requirements.md L213 (2026-05-07 reconstruction note)
- **Issue:** Numbers/dates that need maintenance.
- **Claude Recommendation:** Replace with "see source file" pointers where possible; keep dates only when the date is the point.
- **Human Decision And Optional Comment:** leave

### Finding 154 — `temp-test-workspaces/` ambiguity

- **Severity:** WRONG
- **Location:** Several classwitch docs reference it as "in this repo" but it's actually a sibling directory at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/` (outside the repo). Mostly classwitch-related, which we're skipping per AHQ-131. Flagging here for completeness in case any non-classwitch doc picks up the same wording.
- **Issue:** Mostly classwitch — handled by AHQ-131. Audit cross-checked and found no non-classwitch docs with the same issue.
- **Claude Recommendation:** No action needed in this audit — covered under AHQ-131.
- **Human Decision And Optional Comment:** leave

---

# Notes for the user

- This audit was generated 2026-05-07 by three Claude Code agents reading the doc tree and cross-checking against `package.json`, source files, and `claude-command-builder.ts`. Findings are line-numbered; line numbers may shift if the doc has been edited since.
- Not auditing classwitch docs and `docs/jira-docs/` / `docs/mission-docs/` was a deliberate scope choice — re-running with those included is straightforward if the user changes their mind.
- Severity tags are advisory; the user's Human Decision is the only thing that determines whether a finding becomes work.
- The Cross-file observations and Missing-doc candidates sections are the highest-leverage to triage — they each often resolve multiple per-file findings at once (e.g. Finding 139 Glossary resolves Findings 1, 2, 12, 78, 89, 94 simultaneously).
- Recommended order to fill in Human Decisions: skim the **Triage summary** first (top of doc); pick a few wins; then go file-by-file.

---

# Completion summary (2026-05-09)

All findings the human approved have now been actioned. The remaining `leave` / `defer` items are intentionally not done — `defer` items are tracked in follow-on Jiras (AHQ-131 classwitch tear-out, AHQ-134 CLAUDE.md cleanup, AHQ-135 Node 24 upgrade pass).

## Findings completed in this audit

**Big-ticket (substantive additions):**
- F139 — created `docs/glossary.md` (linked from README, `docs/README.md`, `how-agentic-hq-works.md`)
- F140 — created `docs/user-docs/troubleshooting-quickstart.md` (organised by README Quick Start step number)
- F141 — added "Architecture at a glance" mermaid diagram near the top of `how-agentic-hq-works.md`
- F88 / F99 / F101 — added "Naming convention", "Mental model", and "Prerequisites" callouts to `overview-of-workflows.md`
- F132 — fixed the one US-spelling instance identified (`organized` → `organised`); flagged the wider `focussed`/`focused` drift for a future spelling sweep
- F137 — wrote a small Python markdown link checker; scanned 126 maintained `.md` files; **5 real broken links found and fixed** to zero broken links across maintained docs
- F46 — split the ~600-word code-review paragraph in `project-philosophy-and-origin-story.md` into 3 paragraphs at natural breaks (no wording changed)

**Per-file fixes (small additions / typos / link / casing):**
- F11 — install-script side-effects note added to README Quick Start step 3
- F19 — replaced `Steve-Workspace-001` with `/tmp/my-temp-workspace` in README example
- F38 — `focussed` → `focused` (both instances) in `how-agentic-hq-works.md`
- F44 / F48 / F49 / F50 / F51 — 5 typos / casing fixes in `project-philosophy-and-origin-story.md`
- F59 — added one-time-setup callout for `pnpm install` to `npm-commands.md`
- F60 / F61 / F62 — verified already-fixed in earlier session (relative links + MPE spelled out)
- F67 — `muliple` → `multiple` in `potential-feature-ideas.md`
- F70 — `MarshalledCliTool` → `MarshalledCLITool` in `project-design-requirements.md`
- F72 — `deveoped` → `developed` in `project-design-requirements.md`
- F106 — added `brew install uv` macOS quick-start to `setting-up-jira-mcp-server.md`
- F108 — added `#!/bin/bash` shebang to `install-or-update-sooperset-mcp-atlassian.sh` (`bash -n` syntax check passes)
- F111 — added "same Atlassian token used for both env vars" note to `setting-up-jira-mcp-server.md`
- F118 — renamed spike-01-slack H2 + matching ToC anchor to "May 2026 status update on the August 2025 Codex experiment"
- F148 — verified already-done (`.DS_Store` in `.gitignore` L157, no tracked instances)

**Human-completed (noted in audit for reference):**
- F7 — README L31 Node-install copy (human fixed)
- F35 — `FOCUS.md` removed from repo / moved to private Google Doc (human fixed)
- F39 — Key Design Principles punctuation in `how-agentic-hq-works.md` (human fixed)
- F45 — opening-paragraph typos in philosophy doc (human fixed)
- F53 — file renamed to `project-philosophy-and-origin-story.md` (human fixed)
- F58 — "Test Order for TDD" reorganisation in `npm-commands.md` (human fixed)
- F64 — `notify-human-via-slack.sh` path added (human fixed)
- F79 — `.claude/settings.local.json` mention removed from WARNING doc (human fixed)
- F84 — auto-approval rationale added to WARNING doc (human fixed)
- F105 — "paste from once" phrasing in `setting-up-jira-mcp-server.md` (human fixed)

## Bonus sweep
While fixing F44 (`in it's context`), spotted a second `it's→its` typo in the same paragraph ("wait for it to fill it's context"). At human's request, did a wider sweep of `it's WORD` patterns across all maintained non-spike docs and fixed:
- `project-philosophy-and-origin-story.md` L5 second instance — "fill it's context" → "fill its context"
- `project-design-requirements.md` L157 — "knows it's workspace root" → "knows its workspace root"

No other possessive misuses found in maintained docs (excluded: spikes, jira-docs, mission-docs, ARCHIVED, LATER, workflow-creation-docs).

## Items intentionally left
Everything still marked `leave` is a conscious decision (terminology drift to be resolved at glossary-link time, private-Jira concerns to be resolved by making Jira public, etc.). `defer` items live in the three follow-on Jiras above.

---

(end of audit document)
