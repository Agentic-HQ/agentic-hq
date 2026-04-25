# Plan: AHQ-128 — Fix `create-workflow` So It Can Create A Brand New Plugin

**Jira:** https://agentic-hq.atlassian.net/browse/AHQ-128
**Test type:** `manual` (no automated tests; human runs `create-workflow` twice after implementation)
**Repo:** `/Users/stevepersonal/dev/agentic-hq/agentic-hq`

---

## Context

The `create-workflow` workflow (built in AHQ-99) currently assumes the chosen `plugin-id` already exists. None of its 5 commands or the orchestrator TS CLI create a new plugin. This blocks AHQ-116 and AHQ-123, which both need to put new workflows into a brand-new `agentic-hq-classwitch-plugin` that doesn't exist yet.

A plugin consists of two things, both required for the new workflow to be visible:
1. **Plugin directory** at `.agentic-hq/plugins/{plugin-id}/` — Agentic HQ's own discovery uses `readdirSync` on the plugins dir (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:119-129`), so the directory alone is enough for AHQ-side discovery.
2. **Claude Code manifest** at `.agentic-hq/plugins/{plugin-id}/.claude-plugin/plugin.json` — required for Claude Code's `--plugin-dir` flag to load the plugin's commands/skills.

Without manifest creation, a workflow scaffolded into a new plugin would be silently invisible to Claude Code.

**Outcome:** `create-workflow` should work uniformly whether the plugin already exists or needs to be created — same UX, same code path, just sourcing plugin metadata differently at the start.

---

## Design Principles (Agreed With User)

1. **One code path, no new-vs-existing branching.** Always treat plugin metadata as first-class; the only difference is *where* metadata is sourced at the start of Command 01.
2. **No re-confirming existing metadata.** If the plugin already exists, silently read its metadata. The user doesn't care who originally authored a pre-existing plugin.
3. **Spec section name is just "Plugin Metadata"** — neutral, not "New Plugin Metadata".
4. **Plugin metadata lives in the spec only — NOT in the inter-command variable string.** Description (a free-text sentence) plus version and author name are recorded under "Plugin Metadata" in the DRAFT/APPROVED spec. Command 02 reads them from the spec when creating `plugin.json`. The variable string passed between commands stays at today's 4 fields (`agentic-hq-workspace-root-dir`, `plugin-id`, `workflow-id`, `workflow-short-id`) — no changes.

---

## Plugin Metadata Fields (Recorded In Spec)

Five fields. Grouping all plugin-level data together in one section keeps the spec self-contained:

- `plugin-id` — the plugin identifier (also flows through the variable string; recorded here as well so the Plugin Metadata section is complete on its own).
- `plugin-dir` — `{project-root}/.agentic-hq/plugins/{plugin-id}` (derived; recorded for clarity / so the spec is unambiguous about where the plugin lives).
- `plugin-description` — one sentence (free text). Used for the `description` field of `plugin.json`.
- `plugin-version` — defaults to `"0.0.1"` for new plugins; otherwise read from existing manifest. Used for the `version` field of `plugin.json`.
- `plugin-author-name` — defaults to `"Agentic HQ"` for new plugins; otherwise read from existing manifest. Used for the `author.name` field of `plugin.json`.

---

## Variable String (Unchanged)

Today's format stays exactly as-is:

```
The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir={...} and plugin-id={...} and workflow-id={...} and workflow-short-id={...}
```

No new fields. No CLI changes. No Step 0a/0b changes in Commands 03/04/05.

---

## Files To Modify

All paths under `/Users/stevepersonal/dev/agentic-hq/agentic-hq`.

### 1. `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`

**Step 3a — after collecting `plugin-id`:**
- Check whether `{plugin-dir}/.claude-plugin/plugin.json` exists.
  - **Exists** → silently read it; extract `description` → `plugin-description`, `version` → `plugin-version`, `author.name` → `plugin-author-name`. No prompt.
  - **Missing** → tell user "That plugin doesn't exist yet — I'll create it as a new plugin", then ask for `plugin-description`. Use silent defaults `plugin-version="0.0.1"` and `plugin-author-name="Agentic HQ"` (only ask if the user wants to override).

**Step 4 (Establish Derived Variables)** — record the plugin-metadata fields in the variables block (so they're available when writing the spec).

**Step 5 (Spec Template)** — add a **Plugin Metadata** section under the workflow header:

```markdown
## Plugin Metadata

- **plugin-id**: {plugin-id}
- **plugin-dir**: {plugin-dir}
- **plugin-description**: {plugin-description}
- **plugin-version**: {plugin-version}
- **plugin-author-name**: {plugin-author-name}

If the plugin does not yet exist, Command 02 will create `{plugin-dir}/.claude-plugin/plugin.json` from these values.
```

**Step 6 (Output)** — unchanged (no new fields in the output string).

### 2. `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`

**Step 0a/0b** — unchanged (no new fields in the input string).

**Step 1 (Read All Context)** — already reads the APPROVED spec. Add a sub-step: parse the **Plugin Metadata** section and record `plugin-description`, `plugin-version`, `plugin-author-name` in the variables block (same way `exampleParameters` is read from the "Workflow Metadata" spec section today).

**New Step 4f — Ensure plugin manifest exists:**
- Compute `plugin-manifest-file = {plugin-dir}/.claude-plugin/plugin.json`.
- If it doesn't exist, create it with `name = plugin-id`, `description = plugin-description`, `version = plugin-version`, `author.name = plugin-author-name` (the latter three sourced from the APPROVED spec). Tell the user "Created new plugin: {plugin-id} (manifest at .claude-plugin/plugin.json)".
- If it already exists, leave it untouched and log "Plugin already exists; manifest left as-is".

**Step 3 (Plan Mode)** — add a bullet for the manifest step so the user sees it in the plan before approving.

### 3. `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`

**Step 0a/0b** — unchanged.

**Step 2 (Check Spec Compliance)** — add a check: `{plugin-dir}/.claude-plugin/plugin.json` exists, parses as JSON, has the four fields (`name`, `description`, `version`, `author.name`), and `name` equals `plugin-id`. Applies regardless of whether the manifest was created in this run.

**Convention Compliance table** — add row: `Plugin manifest (plugin.json) present and well-formed`.

### 4. `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`

**No changes expected.** Will read through to confirm the `{plugin-id}` already flows correctly into the user-facing help doc. Light tweak only if a clearer mention of the plugin would help.

### 5. `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`

**No changes.**

### 6. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts`

**No changes.**

---

## Existing Patterns / Utilities Being Reused

- **Spec-as-source-of-truth pattern** — Command 02 already reads the "Workflow Metadata" section of the APPROVED spec to source `exampleParameters` for `ahq-workflow.json`. Adding a "Plugin Metadata" section that's read the same way to source `plugin.json` is the same pattern, applied consistently.
- **`{plugin-dir}` variable** — already established in every command's Step 0b; reused unchanged.
- **`plugin.json` shape** — exact same fields used by all existing manifests (`agentic-hq-core-plugin`, `agentic-hq-demos-plugin`, `agentic-hq-utilities-plugin`, `steve-test-plugin`). Confirmed identical schema across all four.
- **Plugin discovery** — `claude-command-builder.ts:119-129` `addPluginDirsFrom` already picks up any new directory under `.agentic-hq/plugins/`; no change needed there.

---

## Order Of Work

1. Edit Command 01.
2. Edit Command 02.
3. Edit Command 03.
4. Light read-through of Command 04 (only update if needed).
5. Run `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm validate` — doc-only changes, expected to be a clean no-op; mandatory per CLAUDE.md before any commit.
6. Hand back to human for the two manual test runs.
7. After human confirmation → human runs `/commit`.

---

## Verification

**Validation gate (AI-side, mandatory before handing back):**
```
cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm validate
```
Doc-only edits, so typecheck/lint/unit-tests should all stay green.

**Manual test plan (human-side, per Jira AC — `test-type=manual`):**

1. **Existing-plugin run** — execute `create-workflow`, supply `plugin-id=agentic-hq-demos-plugin` (or any existing plugin). Expected: identical UX to today; no plugin-description prompt; existing `plugin.json` left untouched; new workflow scaffolded inside the plugin.
2. **New-plugin run** — execute `create-workflow`, supply a brand-new `plugin-id` (e.g. `agentic-hq-classwitch-plugin`, the eventual home for AHQ-116/123). Expected:
   - User is told the plugin doesn't exist and asked for `plugin-description`.
   - `agentic-hq` CLI's `agentic-hq list` shows the new workflow under the new plugin after completion.
   - `.agentic-hq/plugins/{new-plugin-id}/.claude-plugin/plugin.json` exists, has all 4 fields, `name` equals `{new-plugin-id}`.
   - Workflow files (commands/, skills/) are scaffolded inside the new plugin directory.

---

## Risks / Things To Watch

- **Idempotency** — Command 02 must NOT clobber an existing `plugin.json`. The "exists → leave alone" check guards this.
- **Spec section parsing in Command 02** — the "Plugin Metadata" section is parsed by AI in plain Markdown, same as "Workflow Metadata" today. No structural change to how Command 02 reads the spec.
- **Discovery cache** — Claude Code's CLI invocation re-reads `--plugin-dir` flags each run; no caching concern. AHQ's own plugin discovery is per-invocation.
