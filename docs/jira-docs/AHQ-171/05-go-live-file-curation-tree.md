# AHQ-171 + AHQ-174 — Go-Live File Curation Tree (KEEP / DELETE)

Produced: 2026-07-08 · Status: **APPROVED (Steve, 2026-07-10)** — review pass complete; every proposal accepted as-is (overall `Decision:` after Part B).

> **THIS TREE IS THE SOURCE OF TRUTH.** The `git filter-repo` paths file for step 9 of the
> plan (`Fable/03-Fable-report-and-questions.md` §5) is derived **mechanically** from this
> document — the **overall `Decision:` at the end is APPROVED (Steve, 2026-07-10)**. Nothing
> else feeds that paths file. Review rule applied: every `[KEEP]`/`[DELETE]` was a proposal;
> an empty `Human Comment:` accepted it as-is.

## 1. What KEEP and DELETE mean here

This is a **history-level** decision, not a working-tree cleanup:

- **KEEP** — the path survives in the go-live repo (`agentic-hq`, `main` only) **with its full
  git history**.
- **DELETE** — the path **never existed** in the go-live repo. Not "deleted in a commit" (that
  would leave every old version in `.git` forever) — filtered out of history entirely, so no
  commit in the go-live repo ever contains it.

Everything DELETE'd here still exists, scrubbed, in `agentic-hq-archive-001` — nothing is lost,
it just doesn't ship in the go-live repo.

**The mechanical step (decided — plan step 9):** the slim pass uses a **KEEP whitelist**
(`git filter-repo` `--paths-from-file` with the KEEP paths derived from this approved tree),
not a DELETE blacklist with `--invert-paths`. Both are equivalent given this doc enumerates
every path that ever existed on `main`, but the whitelist fails safe: any path missed by this
analysis is dropped rather than accidentally kept.

**The derived paths file:** [`06-step-9-keep-whitelist-paths.txt`](06-step-9-keep-whitelist-paths.txt)
(374 lines) — the 313 exact current-tree KEEP paths outside `docs/jira-docs`, one
`docs/jira-docs` directory-prefix line (filter-repo keeps everything ever under a listed
directory: its 386 current files, its 12 historical paths, and the AHQ-171 files the step-4
commit adds), and the 60 rename-ancestor paths from §5.1. Every count was re-verified against
this document at derivation time (1,946/1,351/595 path sets, 306 renames, all per-node totals,
0 ancestry conflicts).

## 2. How this document was generated (verified 2026-07-08)

- All paths ever on `main`: `git log main --name-only --format= --no-renames | sort -u` → **1,946 paths**
- Current tree: `git ls-tree -r --name-only main` → **1,351 files**
- Historical-only (existed once, no longer in the tree): the difference → **595 paths**
- Rename ancestry: every rename ever on `main` (`git log main --diff-filter=R --find-renames
  --name-status`, 306 renames), transitively closed from the proposed-KEEP current files →
  **60 historical-only paths are prior locations of kept files** and are proposed KEEP so their
  history doesn't truncate at the rename (`git filter-repo` path filters do not follow renames).
- Reference safety: every proposed-DELETE dir was grepped for references from proposed-KEEP
  files (`src/`, `tests/`, `README.md`, `package.json`, plugin commands, user docs, settings).
  Findings are in §6 (Consequences to accept).
- **Consistency check passed:** no proposed-KEEP file has rename-ancestry passing through a
  proposed-DELETE current path (0 conflicts).

Sizes: Part A uses **checkout size** (current blob size). Part B uses **history weight** — the
sum of all unique blob versions of the path across `main`'s history, uncompressed, with each
blob attributed to the path where it was first seen (so a moved-but-identical file can show
`0 B`; treat Part B sizes as approximate).

## 3. Summary of the proposal

| Set                                        | Files | Size    |
| ------------------------------------------ | ----- | ------- |
| Current tree — proposed **KEEP** (incl. `docs/jira-docs`, Steve's decision) | 699 | 5.3 MB |
| Current tree — proposed **DELETE**         | 652   | 86.8 MB |
| Historical-only — proposed **KEEP** (60 rename ancestors of kept files + 12 deleted jira-docs files) | 72 | — |
| Historical-only — proposed **DELETE**      | 523   | ~3.3 MB history weight |

Net effect on the go-live repo: tracked files **1,351 → 699**; checkout **~92 MB → ~5.3 MB**;
of `main`'s **106.4 MB** total uncompressed blob history, **~10.0 MB (9.4%) is kept** and
**~96.4 MB (90.6%) is purged**.

**Review mechanics:** an empty `Human Comment:` means the node's proposal is accepted as-is.
The review pass is complete — the **overall `Decision:` at the end of Part B is `APPROVED`**
(Steve, 2026-07-10).

---

## 4. Part A — Current tree (1,351 files)

```text
agentic-hq/
│
├── (root files — 3 groups)
│   ├── build & tooling config ················· [KEEP] 13 files, 140 KB
│   │       .gitignore .npmrc .nvmrc .prettierignore .prettierrc eslint.config.mjs
│   │       package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json
│   │       vitest.e2e.config.ts vitest.integration.config.ts vitest.unit.config.ts
│   │       Reason: the product doesn't build/test without them
│   │       Human Comment:
│   ├── community / GitHub files ················ [KEEP] 5 files, 38 KB
│   │       README.md LICENSE CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md
│   │       Reason: the public face of the repo; all AHQ-160 pre-launch work
│   │       Human Comment:
│   └── AI-agent instruction files ·············· [KEEP] 2 files, 10 KB
│           CLAUDE.md AGENTS.md
│           Reason: contributors using Claude Code/other agents get the project rules;
│                   also dogfooding evidence. (Genuine judgement call — some projects
│                   treat these as internal.)
│           Human Comment:
│
├── .agentic-hq/
│   ├── agent-files/ ···························· [DELETE] 7 files, 27 KB
│   │       instruction-sets/idea-workflow/ (2), spike-agent-files/ (5, incl.
│   │       notify-human-via-slack.sh + notify-long-command-finished.sh)
│   │       Reason: support files for the internal spike/idea .claude commands
│   │               (also proposed DELETE below) — nothing else references them
│   │               except one link in docs/dev/potential-feature-ideas.md (see §6.1)
│   │       Human Comment:
│   └── plugins/
│       ├── agentic-hq-core-plugin/ ············· [KEEP] 18 files, 146 KB
│       │       Reason: the create-workflow product feature
│       │       Human Comment:
│       ├── agentic-hq-demos-plugin/ ············ [KEEP] 104 files, 600 KB
│       │       Reason: all shipped demo workflows (add-feature, add-feature-detailed-
│       │               example, string-reversal, math, quick-jira, full-jira);
│       │               referenced by README, package.json demo scripts, tests
│       │       Human Comment:
│       ├── agentic-hq-utilities-plugin/ ········ [KEEP] 2 files, 10 KB
│       │       Reason: jira-verbatim-content-extractor agent used by Jira workflows
│       │       Human Comment:
│       └── steve-test-plugin/ ·················· [KEEP] 15 files, 8 KB
│               Reason: shipped via .claude-plugin/marketplace.json and documented in
│                       overview-of-workflows.md as "internal smoke-test skills". Tiny.
│                       But the name and contents (mood/star-sign/age test commands)
│                       are clearly personal-dev artifacts — DELETE is defensible if
│                       marketplace.json + overview-of-workflows.md are edited
│               Human Comment:
│
├── .claude-plugin/
│   └── marketplace.json ························ [KEEP] 1 file, 553 B
│           Reason: Claude Code plugin marketplace definition; its only entry points
│                   at steve-test-plugin — decision is coupled to that plugin
│           Human Comment:
│
├── .claude/
│   ├── settings.json ··························· [KEEP] 1 file, 3 KB
│   │       Reason: shared Claude Code permissions + autoMode git rules for the repo;
│   │               its autoMode text names /commit and the /git:* commands
│   │       Human Comment:
│   └── commands/
│       ├── git/ ································ [KEEP] 3 files, 21 KB
│       │       01-git-branch, 02-git-perform-minor-WIP-commit-on-branch,
│       │       03-git-create-PR-and-squash-merge-to-main
│       │       Reason: the sanctioned git workflow named in settings.json autoMode and
│       │               used day-to-day; useful to contributors. DELETE possible if
│       │               settings.json autoMode rule is rewritten
│       │       Human Comment:
│       └── agentic-hq-commands/
│           ├── commit.md ······················· [KEEP] 1 file, 9 KB
│           │       Reason: the /commit command that CLAUDE.md's "Never Commit Without
│           │               Explicit Approval" rule tells every agent to use — deleting
│           │               it breaks that rule's instructions for contributors
│           │       Human Comment:
│           ├── used-in-tests/ ·················· [KEEP] 4 files, 5 KB
│           │       integration/ (2: just-self-terminate-using-skill, reverse-a-string-
│           │       for-integration-test), jira-helper-commands/ (2: create-test-jira,
│           │       get-jira-status)
│           │       Reason: test fixtures — referenced by 3 integration test files
│           │       Human Comment:
│           ├── spike-agent-*.md ················ [DELETE] 11 files, 109 KB
│           │       spike-agent-01 … spike-agent-10 (incl. 03b)
│           │       Reason: Steve's pre-product internal spike/story pipeline; superseded
│           │               by the shipped plugin workflows
│           │       Human Comment:
│           ├── agent-definitions/ ·············· [DELETE] 1 file, 138 B
│           │       spike-00-agent-definitions
│           │       Reason: part of the spike pipeline above
│           │       Human Comment:
│           ├── idea-workflow/ ·················· [DELETE] 7 files, 46 KB
│           │       Reason: internal ideation pipeline, never productised as a plugin
│           │       Human Comment:
│           ├── experiment-commands/ ············ [DELETE] 3 files, 4 KB
│           │       Reason: throwaway experiments (stdin passthrough, param echo)
│           │       Human Comment:
│           ├── throwaway-prototype-workflow/ ··· [DELETE] 2 files, 13 KB
│           │       Reason: internal prototyping helper, not part of the product
│           │       Human Comment:
│           ├── utility-agents/ ················· [DELETE] 1 file, 8 KB
│           │       technology-investigation-spike.md
│           │       Reason: internal research helper
│           │       Human Comment:
│           ├── test-command.md + test-print-out-*.md
│           │   ································· [DELETE] 5 files, 1 KB
│           │       Reason: manual smoke-test commands from early development (the
│           │               tracked tests use used-in-tests/ instead)
│           │       Human Comment:
│           ├── commit.WITH_NEW_SQUASHING_MESSY_MANUAL_COMMITS_FEATURE_ADDED.md
│           │   ································· [DELETE] 1 file, 6 KB
│           │       Reason: draft variant of commit.md parked in the filename itself
│           │       Human Comment:
│           ├── analyse-context.md ·············· [DELETE] 1 file, 1 KB
│           │       Reason: personal context-inspection helper
│           │       Human Comment:
│           ├── create-a-real-world-tdd-bug-test.md
│           │   ································· [DELETE] 1 file, 331 B
│           │       Reason: personal TDD exercise helper
│           │       Human Comment:
│           └── tell-me-how-to-work-best-with-ai.md
│               ································· [DELETE] 1 file, 11 KB
│                   Reason: personal coaching prompt, not product
│                   Human Comment:
│
├── .github/ ································· [KEEP] 4 files, 5 KB
│       ISSUE_TEMPLATE/ (3) + pull_request_template.md
│       Reason: AHQ-160 pre-launch community templates
│       Human Comment:
│
├── bin/ ····································· [KEEP] 1 file, 1 KB
│       agentic-hq.cjs
│       Reason: the CLI entry point
│       Human Comment:
│
├── scripts/
│   └── mcp-scripts/ ························· [KEEP] 1 file, 5 KB
│           install-or-update-sooperset-mcp-atlassian.sh
│           Reason: referenced by docs/user-docs/…/setting-up-jira-mcp-server.md
│           Human Comment:
│
├── src/ ····································· [KEEP] 69 files, 118 KB
│       cli/ 7 · interfaces/ 9 · io/ 4 · kernel/ 1 · scripts/ 5 · tools/ 4 ·
│       workflow/ 2 · workflow-discovery/ 37
│       Reason: all production TypeScript (uniform KEEP — no mixed subdirectory)
│       Human Comment:
│
├── tests/ ··································· [KEEP] 58 files, 175 KB
│       unit/ 37 · integration/ 5 · e2e/ 16
│       Reason: the TDD test suite (uniform KEEP)
│       Human Comment:
│
└── docs/
    ├── README.md ···························· [KEEP] 1 file (with glossary: 9 KB)
    │       Reason: docs index — needs a light edit post-filter (§6.2)
    │       Human Comment:
    ├── glossary.md ·························· [KEEP] 1 file
    │       Reason: linked from README.md "Where To Go Next"
    │       Human Comment:
    ├── user-docs/ ··························· [KEEP] 4 files, 38 KB
    │       WARNING-re-auto-approved-claude-permissions, troubleshooting-quickstart,
    │       workflow-descriptions/ (overview-of-workflows, setting-up-jira-mcp-server)
    │       Reason: linked from README quick start; core public docs.
    │               overview-of-workflows.md's links into docs/jira-docs all resolve
    │               (jira-docs is KEEP — §6.1)
    │       Human Comment:
    ├── dev/ ································· [KEEP] 5 files, 55 KB
    │       how-agentic-hq-works, npm-commands, potential-feature-ideas,
    │       project-design-requirements, project-philosophy-and-origin-story
    │       Reason: 4 of 5 linked from README "Where To Go Next";
    │               project-design-requirements.md is read AT RUNTIME by the shipped
    │               full-jira / add-feature-detailed-example workflow commands.
    │               NOTE: potential-feature-ideas.md links into docs/project-docs and
    │               .agentic-hq/agent-files — needs an edit (§6.1)
    │       Human Comment:
    ├── LATER/ ······························· [DELETE] 8 files, 37 KB
    │       Reason: parked thoughts/ai-chats explicitly labelled "later"; exactly the
    │               "massive private process universe" Codex flagged
    │       Human Comment:
    ├── artifacts/ ··························· [DELETE] 22 files, 363 KB
    │       workflow-creation-artifacts/ for the add-feature + add-feature-detailed-
    │       example builds (specs, per-stage plan snapshots)
    │       Reason: historical outputs of create-workflow runs. The dir itself is the
    │               runtime output location (recreated on each run — §6.3), so deleting
    │               the tracked contents breaks nothing. These are the worked example
    │               of "a workflow that built a shipped workflow" — arguably good
    │               public evidence — but they survive in the archive repo.
    │       Human Comment:
    ├── jira-docs/ ··························· [KEEP] 386 files, 3.9 MB
    │       Reason: Steve's decision (2026-07-08) — the per-Jira TDD fossil record ships
    │               publicly as dogfooding evidence. Bonus: overview-of-workflows.md's
    │               AHQ-6 links and the 3 src code-comment pointers keep working, and
    │               commits touching jira-docs are not pruned (dev-panel links survive).
    │               NOTE this includes the AHQ-171 folder itself (scrub plans — all
    │               redacted with placeholders); exception: `AHQ-171/temp/` (session
    │               handover scratch) must be deleted before the freeze / left off the
    │               whitelist (§6.5)
    │       Human Comment: KEEP (Steve, 2026-07-08)
    ├── project-docs/ ························ [DELETE] 378 files, 59.7 MB
    │       Reason: internal planning/spike/workflow-run material; single biggest
    │               size win (⅔ of the repo). potential-feature-ideas.md link edit
    │               needed (§6.1)
    │       Human Comment:
    └── ARCHIVED/ ···························· [DELETE] 203 files, 26.5 MB
            Reason: already self-declared archive; second biggest size win
            Human Comment:
```

*(`docs/tickets/` and `docs/mission-docs/` — the runtime output dirs mentioned in README and
CLAUDE.md — have **never been tracked on `main`**; no decision needed.)*

---

## 5. Part B — Historical-only paths (595 — existed on `main` once, not in the current tree)

### 5.1 Rename ancestors of kept files — proposed **KEEP** (60 paths)

These are prior locations of files proposed KEEP in Part A. They must stay in the whitelist or
the kept files' history truncates at the rename (filter-repo does not follow renames). Sizes
are omitted — their blobs are almost entirely shared with the kept descendants.

```text
(historical, KEEP with their descendants)
│
├── plugins/steve-test-plugin/ ·················· [KEEP] 14 paths
│       Reason: original location of .agentic-hq/plugins/steve-test-plugin — stands
│               or falls with that plugin (KEEP)
│       Human Comment:
│
├── src/demo/cli/ ······························· [KEEP] 3 paths
│       full-jira-tdd-story-workflow-demo-cli.ts, math-workflow-demo-cli.ts,
│       string-reversal-demo-cli.ts
│       Reason: original locations of the demos-plugin ts-workflow CLIs
│       Human Comment:
│
├── .claude/agents/jira-verbatim-content-extractor.md
│   ············································· [KEEP] 1 path
│       Reason: original location of the utilities-plugin agent
│       Human Comment:
│
├── .claude/commands/agentic-hq-commands/used-in-demos/
│   ············································· [KEEP] 14 paths
│       full-jira (6), quick-jira (5), math-workflow (3)
│       Reason: original locations of the demos-plugin command files
│       Human Comment:
│
├── .claude/commands/agentic-hq-commands/workflow/jira-story-workflow/
│   ············································· [KEEP] 6 paths
│       Reason: even earlier location of the full-jira command files (two moves back)
│       Human Comment:
│
├── .claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md
│   ············································· [KEEP] 1 path
│       Reason: old name of reverse-a-string-for-integration-test.md
│       Human Comment:
│
└── .agentic-hq/plugins/agentic-hq-demos-plugin/ (internal restructure)
    ············································· [KEEP] 21 paths
        add-feature commands at commands/add-feature/ (7), earlier help-doc and
        template locations under skills/add-feature/ (14)
        Reason: prior in-plugin layout of kept add-feature files
        Human Comment:
```

### 5.2 Everything else (535 paths: 523 proposed **DELETE** ~3.3 MB history weight, + the 12 deleted jira-docs files proposed **KEEP**)

The DELETE'd paths' history vanishes from the go-live repo entirely (this is the "no history of deleted
files" requirement). All grouped at directory level; none is an ancestor of any kept file.

```text
(historical, DELETE)
│
├── FOCUS.md ···································· [DELETE] 1 path, ~19 KB
│       Reason: old personal working-focus note at repo root
│       Human Comment:
├── package-lock.json ··························· [DELETE] 1 path, ~31 KB
│       Reason: npm-era lockfile, replaced by pnpm-lock.yaml
│       Human Comment:
├── vitest.smoke.config.ts ······················ [DELETE] 1 path, ~2 KB
│       Reason: config for the removed tests/smoke suite (below)
│       Human Comment:
│
├── .bmad-core/ ································· [DELETE] 76 paths, ~1.1 MB
│       agents/ tasks/ templates/ checklists/ data/ workflows/ agent-teams/ utils/
│       Reason: the BMAD method toolkit tried early on and removed
│       Human Comment:
│
├── projects/ ··································· [DELETE] 171 paths, ~240 KB
│       ringtone-website/ (123), to-do-list-web-app/ (48)
│       Reason: sample target projects once committed to main for workflow testing
│       Human Comment:
│
├── .agentic-hq/
│   ├── plugins/agentic-hq-classwitch-plugin/ ··· [DELETE] 28 paths, ~183 KB
│   │       Reason: abandoned classwitch plugin (converter + override workflows)
│   │       Human Comment:
│   ├── plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.nvmrc
│   │   ········································· [DELETE] 1 path, 3 B
│   │       Reason: deliberately-removed stray .nvmrc inside an otherwise-KEEP plugin
│   │               (called out at file level precisely because the parent dir is KEEP)
│   │       Human Comment:
│   └── agent-files/spike-agent-files/spike-definition.md
│       ········································· [DELETE] 1 path, ~1 KB
│           Reason: earlier version of the (also-DELETE) agent-files content
│           Human Comment:
│
├── .claude/
│   ├── commands/ (40 misc paths) ··············· [DELETE] 40 paths, ~368 KB
│   │       Old locations/versions of the internal spike/idea/test commands, the
│   │       BMAD-era commands, and superseded one-offs — none ancestral to a kept file
│   │       Reason: internal process history
│   │       Human Comment:
│   ├── agents/dev.md ··························· [DELETE] 1 path, ~7 KB
│   │       Reason: BMAD-era agent definition
│   │       Human Comment:
│   └── hooks/ ·································· [DELETE] 1 path, ~0 KB
│           Reason: removed experiment
│           Human Comment:
│
├── docs/
│   ├── (loose historical files) ················ [DELETE] 4 paths, ~57 KB
│   │       brief.md, competitor-analysis.md, roadmap.md, temp-test-doc.md
│   │       Reason: BMAD-era planning docs + a test file
│   │       Human Comment:
│   ├── workflow-creation-docs/ ················· [DELETE] 11 paths, ~179 KB
│   │       Reason: superseded by the shipped create-workflow plugin docs
│   │       Human Comment:
│   ├── dev-notes/ ······························ [DELETE] 4 paths, ~71 KB
│   │       Reason: old internal notes (superseded by docs/dev/)
│   │       Human Comment:
│   ├── agentic-hq-workflow-building/ ··········· [DELETE] 3 paths
│   │       Reason: early notes, moved into LATER/ (which is itself DELETE)
│   │       Human Comment:
│   ├── other-notes/ + the-point-of-agentic-hq/ + help/
│   │   ········································· [DELETE] 4 paths
│   │       Reason: early notes, since relocated or retired
│   │       Human Comment:
│   ├── workflow-docs-TEMP_TEST_DELME_SOON/ ····· [DELETE] 3 paths, ~2 KB
│   │       Reason: the name says it all
│   │       Human Comment:
│   ├── dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md
│   │   ········································· [DELETE] 1 path, ~33 KB
│   │       Reason: doc for the abandoned classwitch plugin
│   │       Human Comment:
│   ├── jira-docs/ (12 historical paths) ········ [KEEP] 12 paths, ~156 KB
│   │       Reason: with docs/jira-docs KEEP (Steve, 2026-07-08), its history ships
│   │               complete — including these 12 later-deleted files (4 superseded
│   │               AHQ-157 chat docs + 8 TEST-43 test-run outputs; all scanned clean)
│   │       Human Comment: KEEP (Steve, 2026-07-08 — "surely that won't hurt")
│   ├── project-docs/ (78 historical paths) ····· [DELETE] 78 paths, ~685 KB
│   │       Reason: files deleted from project-docs over time — dies with the dir
│   │       Human Comment:
│   └── artifacts/ (10 historical paths) ········ [DELETE] 10 paths
│           Reason: prior locations of current docs/artifacts files — dies with the dir
│           Human Comment:
│
├── src/ (58 historical paths) ·················· [DELETE] 58 paths, ~466 KB
│       experiments/ 22 · scripts/ 11 · interfaces/ 5 · workspace/ 4 · demo/ 3 (the
│       non-ancestral remainder) · utils/ 3 · workflow-discovery/ 3 · loose 3
│       (index.ts, temp-test-hello-world.ts, temp-test-hello-world.cli.ts) · misc/ 2 ·
│       cli/ 2 · tools/ 1 · config/ 1 · classwitch-registry/ 1 · workflow/ 1
│       Reason: deleted/refactored-away code whose history the go-live repo doesn't
│               need (current src/ files' own history is unaffected)
│       Human Comment:
│
├── tests/ (18 historical paths) ················ [DELETE] 18 paths, ~72 KB
│       unit/ 11 · e2e/ 4 · integration/ 2 · smoke/ 1
│       Reason: deleted/renamed-away test files (current tests keep full history)
│       Human Comment:
│
├── scripts/infra/ ······························ [DELETE] 2 paths, ~9 KB
│       Reason: removed infra scripts
│       Human Comment:
│
└── tools/scripts/ ······························ [DELETE] 1 path, ~9 KB
        Reason: removed tooling
        Human Comment:
```

---

## Overall Decision (covers Parts A + B above)

Empty `Human Comment:` fields = those proposals accepted as-is. The plan's step-9 KEEP
whitelist is derived only from this decision (with the Human Comments applied first).

**Decision:** APPROVED

---

## 6. Consequences to accept (or fix before go-live)

> **Agreed remedy for broken links (Steve, 2026-07-08):** kept files that link to DELETE'd
> paths get their links re-pointed at the **archive repo** as clickable absolute URLs —
> `https://github.com/Agentic-HQ/agentic-hq-archive-001/blob/main/<same path>` — with a short
> note that the material now lives only in the archive. (Relative links can't cross repos;
> the archive is a complete snapshot, so every deleted path exists there at the same
> location.) Do these edits as a normal commit on `main` — plan step 4, **before the freeze (plan step 5)**
> so all three repos inherit them; inside the archive repo the URLs are self-referencing and
> still resolve. Caveat: the archive repo starts private and flips public only after its
> PII-review gate — if the public repo launches first, these links 404 for outsiders until
> then, so either word the note accordingly or treat the archive review as pre-launch.

1. **`docs/dev/potential-feature-ideas.md` links to DELETE'd paths** — five links across
   three idea sections: the composible-commands idea →
   `docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime`, the resumable-workflows
   idea → `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system`, and the
   Slack-notification idea → `docs/project-docs/project-spikes/spike-01-slack` (dir + its
   README) and `.agentic-hq/agent-files/spike-agent-files/scripts/notify-human-via-slack.sh`.
   Fix: all five get the archive-repo re-pointing per the remedy above (the Slack section's
   "already in `main`" wording updates too — the script only exists in the archive repo's
   `main`). The same remedy applies to the one non-doc reference: the PTY-bug doc pointer in
   `vitest.integration.config.ts`'s header comment.
   *(With `docs/jira-docs` KEEP, the links in `overview-of-workflows.md` and the three
   `src/workflow-discovery/` code comments pointing at `docs/jira-docs/AHQ-106/...` all
   resolve in the public repo — no edits needed for those.)*
2. **`docs/README.md`** indexes the docs tree — needs a light edit once the tree shrinks
   (can mention the archive repo as the home of the removed material).
3. **`docs/artifacts/` is create-workflow's runtime output directory**
   (`{project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}` in
   the core-plugin commands). Deleting the *tracked* contents breaks nothing — the dir is
   recreated on each run.
4. **Commit pruning** — commits that only touched DELETE'd paths become empty and are pruned,
   so the go-live repo has fewer commits than archive-001. With `docs/jira-docs` KEEP, most
   docs-only AHQ commits survive; only those touching solely `project-docs`/`ARCHIVED`/other
   DELETE'd trees are pruned (acceptable: they're Done, and archive-001 keeps everything).
5. **The public repo ships the AHQ-171 planning docs themselves** (they live in the KEEP'd
   `docs/jira-docs/AHQ-171/` — this curation tree, the plan, the how-to guides; all redacted
   with placeholders, verified). Exception to enforce at step 4/9:
   `docs/jira-docs/AHQ-171/temp/` (session-handover scratch) — delete before the freeze or
   leave off the KEEP whitelist. Note: the ~6 fossil docs with SHA-pinned GitHub links (§2.3
   of the report) now ship with those links dangling (new SHAs) — acceptable for historical
   working docs; only the curated docs (user-docs/dev/README) get the step-4 link pass.
6. **No shared SHAs** — the go-live repo is a second rewrite, so nothing cross-references
   archive-001 by commit hash.
7. **Rename detection caveat** — ancestry in §5.1 was found at git's default similarity
   threshold (50%). A historical move where the file was simultaneously rewritten beyond
   recognition would not be linked, and its old path would sit in §5.2. Backstop: full history
   survives in archive-001.

## 7. If a decision is ever revisited

Every reference coupling checked during the review (plugin ↔ marketplace.json, autoMode git
rules ↔ git commands, test fixtures, runtime-read docs, the freesound-credential file) is
satisfied by the approved tree — there is nothing to decide here. One rule applies to any
future change: flipping a decision means re-checking references between kept and deleted
files and recomputing the rename-ancestry closure (§2) before the step-9 paths file is
derived — a DELETE→KEEP flip can pull previously-unlisted ancestor paths into §5.1.
