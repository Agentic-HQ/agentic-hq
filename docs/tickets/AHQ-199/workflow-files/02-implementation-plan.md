# AHQ-199 — Implementation Plan

Turns the approved feature brief into concrete doc changes: README gets a short npm Quick Start
for Normal Users, the full contributor setup moves to a new `docs/dev/setting-up-agentic-hq-for-development.md`,
and every doc still written for the clone-era Quick Start is brought in line. Docs-only — no
production code changes. All docs are written against the live `agentic-hq@0.2.0`
(`dist-tags.latest`, published + registry-verified 2026-08-22).

**Already done (verified, no work planned):** the AHQ-195 parent-brief housekeeping — AHQ-201/208/209
marked done ("Sub-Tasks 1–7 are complete", line 512; "Done (2026-08-22)", line 543) and the sequence
corrected to AHQ-208 → AHQ-209 → AHQ-199 → AHQ-207 (line 605–606) — was applied during the
Researcher stage. The final AC bullet is satisfied; the Implementer only re-verifies it.

## Tests Being Created

**No automated test is practical** — this is a prose/docs restructure and the repo has no
markdown-link or docs-content test suite (verified by grep of `tests/unit|integration|e2e`).
Adding one would be brittle gold-plating. Instead, a **scripted verification sweep** serves as the
RED/GREEN check, run verbatim before the changes (expect hits = RED) and after (expect clean = GREEN):

```bash
# S1 — no user-facing doc tells Normal Users to use the dev binary or clone tooling
#      (README user sections, troubleshooting npm path, overview-of-workflows)
grep -n "agentic-hq-dev" README.md docs/user-docs/workflow-descriptions/overview-of-workflows.md
# S2 — README Quick Start no longer contains clone-era steps
grep -n -i "git clone\|corepack\|pnpm install\|npm link" README.md
# S3 — no stale version text anywhere live
grep -rn "v0\.1\.0\|currently v0" README.md CONTRIBUTING.md docs/README.md docs/glossary.md docs/user-docs docs/dev --include="*.md"
# S4 — glossary no longer links to the per-ticket AHQ-200 artifact
grep -n "tickets/AHQ-200" docs/glossary.md
# S5 — the new dev doc exists and CONTRIBUTING links to it
grep -n "setting-up-agentic-hq-for-development" CONTRIBUTING.md docs/README.md
# S6 — the old troubleshooting filename is gone from every live doc and test
grep -rn "troubleshooting-quickstart" README.md CONTRIBUTING.md docs/README.md docs/user-docs docs/dev tests
```

Maps to the ACs: S1+S2 → AC 1 & 3 ("no live doc tells tool users to clone / wrong binary"),
S3 → AC 3 (stale version), S4 → AC 4 (glossary), S5 → AC 2 (dev doc + CONTRIBUTING link),
S6 → AC 3 (troubleshooting rename fully propagated).
Expected RED state today: S1 ≈ 15 README hits + 1 overview hit isn't expected (overview is clean —
its hit list must stay empty), S2 ≈ 5 hits, S3 ≈ 1 hit (CONTRIBUTING:26), S4 = 1 hit, S5 = 0 hits
(S5 is the one sweep that *passes by becoming non-empty*), S6 = 8 hits (README ×2, CONTRIBUTING,
docs/README, four e2e hint strings — verified by grep).

**Manual validation** (after GREEN):

- **M1 — link/anchor check:** every relative link and `#anchor` added or touched in the edited
  files resolves (in particular `README.md#installation` / `#quick-start` from the renamed
  `troubleshooting.md`, and all links into/out of the new dev doc and the renamed file).
- **M2 (optional, needs your go-ahead — it installs 0.2.0 globally on this Mac):** follow the new
  README Quick Start literally from `/tmp/agentic-hq-test-workspaces/<fresh-dir>`:
  `npm install -g agentic-hq` → `agentic-hq list` → `agentic-hq reversal -- --string-to-reverse=…`.
  AHQ-207 remains the definitive fresh-Ubuntu-VM validation; M2 is a cheap macOS smoke of the words.

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

Sequencing is test-first in spirit: run the sweep first to record the RED state, make the changes,
re-run for GREEN. Justification: the sweep is the closest thing prose has to a failing test — it
pins the exact defects (wrong binary, clone steps, stale version, artifact link) before any edit.

## Implementation Changes

In build order (each numbered doc-step below is one commit-sized edit):

### 1. New `docs/dev/setting-up-agentic-hq-for-development.md`

Full contributor setup, moved (largely verbatim) from today's README Installation steps 2–6 plus
the dev-flavoured smoke test, with numbered steps (the CI table in step 5 below keys to these):

1. Prerequisites (Claude Code, git, gh — gh is contributor-only: PRs + the `gh run` CI-log
   commands; Linux `build-essential python3` for node-pty; macOS ≥ 13.5)
2. Install Node 22/24 LTS (nvm; root `.nvmrc` pins 24)
3. Clone + `cd agentic-hq`
4. `corepack enable` (with the existing re-run-per-Node-version NOTE)
5. `pnpm install`
6. `npm link` → installs **`agentic-hq-dev`** (keeps the existing Linux-warnings NOTE verbatim) → verify `agentic-hq-dev list`
7. `pnpm validate`
8. Smoke test: `agentic-hq-dev reversal -- --string-to-reverse="…"` (folder-trust NOTE)

Plus: a one-liner that wherever user docs say `agentic-hq`, contributors substitute `agentic-hq-dev` 
and the **Appendix "The Two Types Of Agentic HQ User"** (Normal Users = npm install, `agentic-hq`,
never clone; Contributors = clone, `agentic-hq-dev`) — exactly as the Human Prompt UPDATE specifies.

Also a **dual-install NOTE**: a contributor who *also* has the npm-installed package gets both
binaries on PATH — `agentic-hq` runs the npm-installed framework and its shipped workflows, so
edits made in the workspace have **zero effect** when run through it; always use `agentic-hq-dev`
for workspace code. Cross-links to Contributor Troubleshooting's "Why aren't my changes having any
effect?" entry (step 4 below).

### 2. `README.md` — npm Quick Start

- **Heading names `## Quick Start` / `### Prerequisites` / `### Installation` kept** so existing
  `#quick-start`/`#installation` anchors keep resolving.
- Prerequisites become tool-user facts: Claude Code CLI (installed **and authenticated**) and git
  (workflows operate inside project repos; the README advises committing before `add-feature`),
  plus the Linux toolchain note (reworded: node-pty compiles from source during
  **`npm install -g agentic-hq`**); macOS ≥ 13.5 already covered by the OS section.
  **`gh` is removed from Normal-User prerequisites** (decided 2026-08-22): verified by exhaustive
  grep that no shipped workflow under `.agentic-hq/plugins/` references `gh`, and it is not in the
  auto-approved tools list — its only users are maintainer commands (`.claude/commands/git/`) and
  the CI-log examples in `ci-configuration.md`, so it moves to the dev doc's contributor
  prerequisites (step 1 above).
- Installation collapses to:

  ```markdown
  1. **Install Node.js 24 LTS** … confirm `node -v` (22 or 24 only — unchanged text)
  2. **Install Agentic HQ:** `npm install -g agentic-hq` — then verify: `agentic-hq list`
  3. **Run the simplest workflow:** `agentic-hq reversal -- --string-to-reverse="wow this is amazing"`
     (folder-trust NOTE + auto-approved-permissions NOTE kept verbatim, links unchanged)
  ```

  with a one-line npx alternative under step 2 (`npx --yes agentic-hq …` — registry-verified in AHQ-198/209).
- All Normal-User sections (`add-feature`, `create-workflow`, Running Workflows From Your Own
  Workspaces, Further Exploration) switch `agentic-hq-dev` → `agentic-hq`; "After completing the
  Quick Start above, the `agentic-hq` command is available globally."
- The TIP about running add-feature "from within the Agentic HQ workspace" is reworked: any fresh
  empty directory works (same hello-world Human Prompt example kept).
- Developer Documentation section gains one line linking to the new dev setup doc.

### 3. `CONTRIBUTING.md`

- "Local development setup" repurposed per approved Q3: two or three lines introducing the two user
  groups and linking to `docs/dev/setting-up-agentic-hq-for-development.md`; its current summary
  bullets move into the dev doc.
- "currently v0.1.0" → "currently v0.2.0" (line 26).
- CI section sentence "same steps a new contributor follows in the README Quick Start" → retargeted
  to the dev setup doc.

### 4. `docs/user-docs/troubleshooting-quickstart.md` → renamed to `docs/user-docs/troubleshooting.md`

Renamed and restructured into three audience-scoped sections, each opening with a one-line
"who this is for":

- **Setup Troubleshooting** — all Normal-User install/initial-setup problems, whenever they occur
  (not only mid-Quickstart): `npm install -g agentic-hq` failures (Linux node-pty gyp/toolchain —
  reuse existing text with `pnpm install` → `npm install -g` substitution; `EACCES`;
  unsupported-engine; macOS < 13.5 `posix_spawnp`), `agentic-hq: command not found` (npm global
  bin PATH), `claude: command not found` (moved here — a missing prerequisite, even though it
  surfaces at first run), the registry note (0.1.0 is deprecated — npx crash; 0.1.1+ is the
  working line; latest is 0.2.0), Windows unsupported.
- **Tool Troubleshooting** — using the npm `agentic-hq` tool once set up: the folder-trust prompt
  (recurs in every new folder, so it lives here rather than Setup), workflow hangs on
  non-auto-approved permissions, Jira MCP setup.
- **Contributor Troubleshooting** — everything contributor-specific *including contributor setup*:
  today's corepack/pnpm/`npm link`/`pnpm validate` content retargeted to the dev doc's step numbers
  instead of README steps; the "Listing is empty" entry (fix text corrected while moving — shipped
  plugins are found via the invoked binary's package root, so the real cause is a stale/failed
  link, not cwd; Implementer verifies the wording against actual `agentic-hq list` behaviour); and
  a new **"Why aren't my changes having any effect?"** entry — with both binaries installed,
  `agentic-hq` silently runs the npm-installed framework and shipped workflows, so workspace edits
  do nothing until run via `agentic-hq-dev`; diagnostic: check which binary you invoked
  (`which agentic-hq`). Cross-linked with the dev doc's dual-install NOTE (step 1 above).

Rename mechanics (references verified by grep): update the referencing docs — README (×2),
CONTRIBUTING, `docs/README.md`, all being edited in this ticket anyway — plus **four e2e test
files** (`tests/e2e/demo/cross-workspace-*.e2e.test.ts` and
`cross-workspace-demo-math-…`/`…quick-jira-…`) whose assertion failure-hint strings cite the old
path *and* the now-stale "README Quick Start step 5 (`npm link`…)" wording — message-text-only
edits, no behaviour change; `pnpm validate` covers them (running the full Claude e2e suite for
hint-string edits is not warranted). **No stub** is left at the old path (pre-1.0; all live
references updated; old external permalinks will 404).

### 5. `docs/dev/ci-configuration.md`

- The step-mapping table's "README step" column → "Dev setup step" keyed to the new doc's numbers;
  intro sentence retargeted ("what a contributor does following the dev setup doc").
- Line 28 stale name fixed: `npm link` installs the **`agentic-hq-dev`** binary.
- "Reproducing CI Locally" README references → dev doc.

### 6. `docs/glossary.md` + `docs/dev/how-agentic-hq-works.md` (root-model retarget)

Recommended option (parent brief's first-listed): add a compact durable subsection **"The two
roots"** to `how-agentic-hq-works.md` (§Builds area, next to "The four combinations") distilling
the AHQ-200 analysis to today's two-root reality (~10–15 lines: `ahq-package-root` set structurally
by the invoked bin wrapper; local workspace = cwd; overlap case), then replace `glossary.md:94-96`'s
parenthetical AHQ-200-ticket link with a link to that section. Fallback if you prefer less new
text: drop the parenthetical entirely — the glossary's own AHQ-package/local-workspace entries
already explain how the roots relate, including the overlap case.

### 7. Small knock-ons

- `docs/README.md`: list the new dev doc under Developer Documentation; intro line becomes
  audience-aware ("Normal Users start with the README Quick Start; contributors with the dev setup doc").
- `docs/user-docs/workflow-descriptions/overview-of-workflows.md:21`: prerequisites line drops
  `pnpm` ("complete the README Quick Start — Node.js, the `agentic-hq` CLI from npm, and Claude Code").

### UPDATE (2026-08-22, human-approved at the Implementer's Approval Gate)

Two small fixes outside the original file list, surfaced by the Implementer as out-of-plan
findings and explicitly approved by the human ("pls do"), were added to scope:

1. `docs/user-docs/workflow-descriptions/overview-of-workflows.md:147` — pre-existing broken
   source link fixed: `string-reversal-demo-cli.ts` → `string-reversal-cli.ts` (stale filename
   from the AHQ-208/209 migrations).
2. `.github/workflows/ci.yml` — the stale comment mapping to old README step numbers re-keyed to
   the new setup doc's step numbers (comment-only change; both the header block and the matching
   per-step inline comments).
3. Terminology: the human ruled the prose shorthand "dev setup" ambiguous (all users are devs) —
   replaced with **"contributor setup"** everywhere it appeared (ci-configuration.md's table
   column and prose, ci.yml comments, troubleshooting.md's step references, docs/README.md's link
   text). The filename `docs/dev/setting-up-agentic-hq-for-development.md` and its H1 stay as
   specified in the Human Prompt, as does CONTRIBUTING.md's pre-existing "Local development
   setup" heading (anchor stability; its body already says "contributor setup").

## Risks/Unknowns/Concerns

- **AHQ-207 is the real test** — any npm-flow step this plan words wrongly on a fresh Ubuntu VM
  comes back as an AHQ-199 defect. M2 (macOS walk-through) mitigates but can't fully de-risk Linux.
- **Troubleshooting "Listing is empty" entry**: the existing fix text ("cd back into the clone")
  looks wrong under the two-root model; the Implementer must verify actual `agentic-hq list`
  behaviour before rewording rather than trusting either version.
- The npx one-liner is included on the strength of AHQ-198/209 registry verification; if you'd
  rather the README stay single-path (`npm install -g` only), it's one line to drop.

## Follow-up Ideas

- An automated markdown link/anchor checker in CI (would have caught the anchor risks here permanently).
- A `docs`-scoped grep guard (like AHQ-209's grep-clean AC) asserting user docs never mention `agentic-hq-dev`.
- Deprecating `agentic-hq@0.1.1` on the registry once 0.2.0 has soaked (registry housekeeping, not docs).

## Human Approval Confirmation

**Approved by the human on 2026-08-22** ("approved"), with no conditions attached, after three
feedback rounds were incorporated into this plan:

1. Troubleshooting doc renamed to `docs/user-docs/troubleshooting.md` and restructured into three
   audience-scoped sections (proposed by the human; e2e hint-string knock-ons added).
2. First section scoped as **Setup Troubleshooting** (all Normal-User install/setup problems, not
   only Quickstart steps), with contributor setup staying in Contributor Troubleshooting.
3. **`gh` removed from the README's Normal-User prerequisites** (verified unused by all shipped
   workflows) and moved to the dev setup doc's contributor prerequisites.

The approval covers the full plan as written above: the scripted RED/GREEN verification sweep
(S1–S6) plus manual validations M1 and (optional, human go-ahead still required at run time) M2,
and the seven doc-step Implementation Changes, including the new
`docs/dev/setting-up-agentic-hq-for-development.md` with its dual-install NOTE and "The Two Types
Of Agentic HQ User" appendix.
