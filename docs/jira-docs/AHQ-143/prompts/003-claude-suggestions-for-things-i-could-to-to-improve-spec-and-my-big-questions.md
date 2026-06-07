# AHQ-143 — Suggestions To Improve The Spec + Big Questions (before running `create-workflow`)

**What I read:** the full spec (`initial-spec/01-DRAFT-add-feature-workflow-description.md`, 1307 lines), the AHQ-143 Jira, all 5 `create-workflow` command files, and the actual `create-workflow-cli.ts`. Also confirmed the referenced files exist on disk (`full-jira-tdd-story-workflow/01–05`, `04a`/`04b`, `docs/dev/project-design-requirements.md`, the AHQ-104 example).

**Bottom line:** the spec is in good shape — the thinking is clear and most of it maps cleanly onto how `create-workflow` builds workflows. There are **two things that will definitely cause friction** during the build (the help-doc/template files, and the multi-audience interleaving), a handful of quick consistency fixes, and ~5 decisions only you can make. I've kept this short and ranked by impact. I'm not editing the spec yet — just reporting.

One thing I want to flag as **already correct** (you don't need to change it): your variable-flow plan in "The Actual Typescript Workflow Program" says the first agent returns an `allVariables` string that's used as input to all other agents "like in the create-workflow typescript program." I checked `create-workflow-cli.ts` — that's **exactly** what it does (it captures Command 01's output and passes that same string to Commands 02–05; it ignores 02–05's outputs). So if Ticket Creator generates a `ticket-id`, including it in `allVariables` will correctly propagate to all 7 agents. Your model is sound; it just needs to be recorded in the spec's "TypeScript CLI" section so the build agent copies that CLI pattern.

---

## High impact (worth fixing before you run create-workflow)

### 1. `create-workflow`'s build will NOT create your template or help-doc files ✅ DONE
`create-workflow` Command 02 scaffolds a fixed set: the command `.md` files, `ahq-workflow.json`, the TS CLI, `SKILL.md`, `package.json` + `pnpm-workspace.yaml` + `tsconfig.json`, and the plugin manifest. **That's it.** It does **not** create arbitrary resource files described in a spec.

Your workflow depends on a lot of files that aren't in that set:
- **~5 templates**: `split-feature`, `unsplit-feature`, `refactoring-plan`, `refactoring-execution`, `validator-summary` (`.TEMPLATE.md`).
- **9 help docs**: `00-…-user-help-doc.md` (main user doc), `99-…-developer-help-doc.md` (developer doc), + one per agent (`01–07`).

These are first-class runtime dependencies — the agents *read* them and the commands *reference* them by variable. If the build doesn't produce them, the workflow is broken on first run.

**Good news — there's a supported hook.** `create-workflow` Command 02 Step 1 says: *"if the spec contains any blockquote callout addressed to **'the execution agent'**, that's instructions written specifically for YOU — read it carefully and act on it."* So the spec can carry an explicit instruction to the build agent to also create the templates + help docs.

**What I could do:** add a "Build Deliverables" checklist to the spec listing every file the build must produce (commands + templates + help docs + CLI/SKILL/metadata), and add a `> **To the execution agent:**` callout telling it to create the template and help-doc files too. (See also Q4 — you may want help docs as a *second* pass rather than in the first build.)

Human: Sounds good.

**✅ DONE (2026-05-30):** Added a **"Build Deliverables Checklist (What The Build Must Produce)"** section to the spec, right after "Build Inputs" (its natural companion). It opens with a `> **To the execution agent:**` callout — the supported hook from Command 02 Step 1 — telling the build agent that `create-workflow` only scaffolds a fixed set (commands + CLI + SKILL + metadata + package files + manifest) and that it **must additionally create** the 5 template files and 9 help-doc files, "with at least skeleton content so every variable path resolves." The section then lists all three groups explicitly by filename **and** by spec variable (e.g. `split-feature.TEMPLATE.md → {split-feature-template-file}`), so the build agent can't miss one. It defers the *depth* of the help docs to Q4 but mandates that the files exist either way.

### 2. The doc interleaves multiple audiences — guide the build agent to allocate content at build time ✅ DONE
This doc mixes content aimed at different places: some is task instruction for a command, some is background a user would want in a help doc. My original suggestion was a 4-way tagging taxonomy (`[COMMAND]`/`[USER-HELP]`/`[AGENT-HELP]`/`[DEV-HELP]`) applied across the whole doc — but you flagged (correctly) that the line is **blurry** (a single section is often useful in more than one place), so mechanical tagging would be fiddly and brittle.

**Your decision (better):** don't tag anything. Instead:
- **Guide the build agent to decide at build time**, per passage, whether the text I've provided for an agent goes into the **command** (if relevant to the task) or into the **user-facing help docs** (background/reasoning). No up-front classification of the whole doc.
- **The destinations are not mutually exclusive** — a passage can go to **both**: a cut-down version as context in the command (just what the task needs) and the fuller version in the help doc (for the user + "Tell Me More").
- **Developer Help Doc → out of scope for the build.** It'll be written **separately, by a dedicated agent at the end** — it doesn't touch the workflow commands, so you'll do it later, on its own. No `[DEV-HELP]` tagging needed.

**✅ DONE (2026-05-30):** Added a `> **To the execution agent:**` callout to the spec — section **"Allocating This Document's Content (Command vs User Help Doc)"** (grouped with the other build-time guidance, just before "Stopping Overthinking"). It tells the build agent **not** to pre-tag passages, and to decide per-command, at build time, between *command file* (task-relevant → keep command short/focused) and *user-facing help docs* (background → main user help doc for whole-workflow material, per-agent help doc for that agent's `verbosity=medium` / "Tell Me More" content). It adds a third bullet making explicit that a passage can land in **both** — a trimmed/cut-down version as context in the command and the fuller version in the help doc — with a warning **not** to dump full background into the command just because it's also relevant (trim to what the task needs, let the help doc carry the rest). It explicitly says **not to worry about the Developer Help Doc** during the build — written separately by a dedicated agent at the end — while noting (per Q4) the stub file is still created so its path resolves.

### 3. The generated commands must be self-contained — don't leave "see the Jira workflow" pointers ✅ DONE
The spec tells the build to replicate behaviour from the existing full-jira commands: *"same as `01-jira-read-and-question.md`"*, *"see `6b. Magic Constants Audit` of `04a-jira-refactor-analysis.md`"*, *"see Question 2 on `AHQ-104/…`"*. Those references are instructions **to the build agent** about what to copy — but the resulting add-feature command files must **inline** that content and stand alone. A runtime agent running `add-feature` may not have the full-jira workflow or AHQ-104 docs available, and two sources of truth drift apart.

**✅ DONE (2026-05-30):** Added a top-level rule to the spec — section **"CRITICAL: The Add-Feature Workflow Must Be Entirely Self-Sufficient"** (right after "About This Page"). It states the cross-references are build-time guidance only, that the build AI must inline the needed content into the new command/help-doc, and that a runtime agent must never need or reference another workflow's commands or any external doc. One early callout covers all the scattered "same as X" / "see Y" pointers.

---

## Quick consistency fixes (low effort, prevents Command 01 confusion)

### 4. Lock the identifiers — the doc is internally inconsistent ✅ DONE
`create-workflow` Command 01 will ask you for `plugin-id`, `workflow-id`, and `workflow-short-id`. The doc currently says different things:
- `current-workflow-id = feature-workflow` (line 328)
- but invocations use `agentic-hq add-feature` (lines 312, 885) → short-id `add-feature`
- and prose calls it the "add-feature workflow" throughout.

Also `create-workflow`'s convention variable is `workflow-id`, not `current-workflow-id`.

**Decision needed (Q2).** Once decided, I can do a find-and-replace so the doc is consistent.

This was a typo.  I've fixed lin 328 from:

current-workflow-id = feature-workflow

to:

current-workflow-id = add-feature

It's a bit confusing but "current-workflow-id" is the variable that is used in every one of the "add-feature" agents to store the name of the current workflow id.

When I run the 'create-workflow' command I won't be running the add-feature' workflow, but the 'create-workflow' workflow, where we will have:
plugin-id = agentic-hq-demos-plugin
workflow-id = add-feature
workflow-short-id = add-feature

(in this case the normal/long and short ids are the same).  Please add a section with these details near the top of the doc for the create-workflow agent to read.

**✅ DONE (2026-05-30):** Line-328 typo fix confirmed (`current-workflow-id = add-feature`) and verified consistent — no bare `feature-workflow` id remains, and `current-workflow-id` now correctly resolves the skill path to `.../skills/add-feature` (matching where `create-workflow` installs it). Added a **"Build Inputs For The `create-workflow` Agent (Read This First)"** section near the top of the spec, listing `plugin-id` / `workflow-id` / `workflow-short-id` and explicitly distinguishing those build-time identifiers from the runtime `current-workflow-id` variable.


### 5. Bundled-asset directory: spec uses `resources/`, convention is `docs/` ✅ DONE
The spec puts templates + help docs under `{skills-dir}/resources/{templates,workflow-help-docs}`. But `create-workflow` (Command 01 Step 1.5 and Command 04) uses `{skills-dir}/docs/` for skill-bundled assets, and no existing workflow has a `resources/` dir (I checked — `full-jira` skill dir is just `ahq-workflow.json`, `SKILL.md`, `ts-workflow`). Not fatal, but the build AI may "correct" it to `docs/`, or leave it as `resources/` and diverge from convention. Pick one (Q3).

Good spot!!!  I've changed it so that all the read "docs" are in {current-workflow-skills-dir}/docs but as templates are not really "docs" but "resources" I've kept them in {current-workflow-skills-dir}/resources

Here are the updated variables (I've also de-duped the spec doc to remove the duplicate set of variables):

skill-resources-dir = {current-workflow-skills-dir}/resources
templates-dir = {skill-resources-dir}/templates
workflow-docs-dir = {current-workflow-skills-dir}/docs
add-feature-workflow-developer-help-doc = {workflow-docs-dir}/add-feature-workflow-developer-help-doc.md
workflow-help-docs-dir = {workflow-docs-dir}/workflow-help-docs
add-feature-workflow-user-help-doc = {workflow-help-docs-dir}/00-add-feature-workflow-user-help-doc.md
ticket-creator-help-doc = {workflow-help-docs-dir}/01-ticket-creator-help-doc.md

**✅ DONE (2026-05-30):** Verified — variable block de-duped (single definition each), no stale `00-add-feature-workflow-help-doc` name remains, paths resolve. Help docs now under `docs/` (convention-aligned); templates kept in `resources/` (explicit in spec, so the build agent follows it). **One optional sanity-check raised:** the Developer Help Doc now sits at `docs/add-feature-workflow-developer-help-doc.md` (no `99-` prefix, one level above the user/agent docs in `docs/workflow-help-docs/`) — works fine, but slightly asymmetric vs the user help doc. Symmetric alternatives if wanted: put it at `docs/workflow-help-docs/99-…` (sibling, restores 00/99 bookend) or move the user doc up to `docs/`. Judgment call — not blocking.

### 6. The help-doc-location uncertainty (line 224) is already solved ✅ DONE
The spec hedges: *"I don't yet know how to get the Skill root directory from a plugin… using `{demo-plugin-dir}`… will be something we'll have to fix later."* `create-workflow` already has the answer: derive assets from `{agentic-hq-workspace-root-dir}` (read from the `AGENTIC_HQ_WORKSPACE_ROOT` env var by the CLI) + `plugin-id` + `workflow-id`. Your own `demos-plugin-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/...` line already does this. Caveat: it requires `AGENTIC_HQ_WORKSPACE_ROOT` to be set (fine for now). **What I could do:** replace the hedge with the concrete pattern and drop the uncertainty.

Human: please do.

**✅ DONE (2026-05-30):** Replaced the "I don't yet know how to get the Skill root directory" hedge in the spec's "Help Docs, Verbosity=medium…" section with the concrete pattern: agents derive the skill dir from `{agentic-hq-workspace-root-dir}` (CLI reads it from `AGENTIC_HQ_WORKSPACE_ROOT` and passes it to the first agent) + `plugin-id` + `current-workflow-id`, shown via the existing `demos-plugin-dir` / `current-workflow-skills-dir` lines, and noted as the **same pattern `create-workflow` itself uses** (with a pointer to its `01-…` command for how the env var is parsed). Also fixed the stale `{demo-plugin-dir}` → `demos-plugin-dir` reference. Kept one honest, non-blocking residual note as a callout: this resolves *via the workspace root* (needs `AGENTIC_HQ_WORKSPACE_ROOT` set / run from the workspace); resolving a plugin's **own** skill root independently of the workspace is the genuine future improvement.

### 7. Pre-fill the sections `create-workflow` Command 01 will demand ✅ DONE
`create-workflow`'s spec template requires sections this doc doesn't yet provide in that shape: **Workflow Metadata** (`exampleParameters`), **Variable Flow & Runtime Context** (per-command reads/writes), and **TypeScript CLI** (which pattern). Pre-filling them means the Command 01 agent translates rather than invents. Concretely:
- `exampleParameters` (must start with `-- `): something like `-- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123` (ticket-id deliberately last, so an up-arrow rerun only needs the id changed).
- TS CLI pattern: **follow `create-workflow-cli.ts`** (capture Command 01 output → broadcast to 02–07).
- Per-command I/O: every command reads the same `allVariables`; only Ticket Creator adds to it; none of 02–07 emit new variables (they read prior agents' files).

**What I could do:** add a short "create-workflow mapping" section near the top capturing these, plus the Build Deliverables checklist from item 1.

Human: sounds good.

**✅ DONE (2026-05-30):** First **re-verified the facts** against the actual `create-workflow` Command 01 template and `create-workflow-cli.ts` (rather than trusting this report's summary). Confirmed: (a) the three section names match Command 01's template exactly; (b) the CLI **captures Command 01's output** as `allVariables` (cli line 54) and broadcasts that same string to 02–05 (lines 60–63), ignoring 02–05's outputs — so Command 01's output *is* used. (This surfaced a genuine bug in `create-workflow` Command 01's spec template — its "Output handling → Re-inject" bullet wrongly said "CLI ignores command outputs; each command receives the same constructed input string", which contradicts the working CLI and would break both `create-workflow` and add-feature if followed literally. **Fixed at source** in `01-explain-to-user-how-workflows-work-and-get-workflow-details.md:337` per the human's request.) Then added a **"Pre-Filled `create-workflow` Spec Sections"** section near the top of the spec (between "Build Inputs" and "Build Deliverables"), with a `> **To the execution agent:**` callout, pre-filling all three: **Workflow Metadata** (short-id + `exampleParameters`, defaults noted), **Variable Flow & Runtime Context** (two roots, env var, the 3 passthrough params, skill assets, and per-command reads/writes — 01 writes `allVariables`+`ticket-id`, 02–07 read the same string and emit nothing), and **TypeScript CLI** (follow `create-workflow-cli.ts`'s capture-01-then-broadcast). **Flagged the one real difference**: `create-workflow-cli.ts` takes no CLI params but add-feature does, so the build must add passthrough-param parsing (with defaults) and copy everything else as-is.

### 8. Tiny: brace-on-LHS variable defs ✅ DONE
A few variable definitions wrap the left side in braces (e.g. `{unsplit-feature-template-file} = …`, `{refactoring-execution-document-template-file} = …`, `{validator-summary-template-file} = …`) while the rest don't. Cosmetic, but trivially fixable for consistency.

Human: sounds good.

**✅ DONE (2026-05-30):** Removed the braces from the left side of all 3 definitions (`unsplit-feature-template-file`, `refactoring-execution-document-template-file`, `validator-summary-template-file`), matching the unbraced style of every other variable def. The right-hand `{templates-dir}/…` references were left braced (those are correct variable *usages*). Verified no braced-LHS definition remains in the spec.

Human: sounds good.

## 9. Grammar pass: fixed misused "it's" → "its" ✅ DONE

**✅ DONE (2026-05-30):** At the human's request, swept the spec (`01-DRAFT-add-feature-workflow-description.md`) for `it's` used as a possessive and fixed **13** occurrences to `its` (lines 132, 190, 204, 321, 336, 344, 398, 495, 708, 711, 747, 1060, 1340 — e.g. "in it's write-up", "it's context window", "it's main Command file", "it's requirements", "It's main point is…", "in it's opinion", "in it's own section"). Left the ~26 correct "it is" / "it has" uses untouched, and verified no possessive `it's` remains. The two prompt/report files (`002`, `003`) were also checked — their `it's` uses are all correct.


---

## Big questions for you

> Answer inline under each (a sentence is fine). These are the ones I can't decide for you.

**Q1 — Is this doc the *guidance* for `create-workflow` Command 01, or the spec itself?** ✅ ANSWERED
`create-workflow` Command 01 produces its **own** DRAFT spec (in `docs/artifacts/workflow-creation-artifacts/…`) using its own template. If you're pointing the Command 01 agent *at* this doc as guidance, then items 2 and 7 matter a lot (the agent has to translate this into its template, and detail gets lost in translation). If instead you intend this doc to be force-fed as the spec, that's a different (and slightly off-convention) path. Which is it?
**Your answer:** **Guidance** — point the Command 01 agent at this doc. It drafts its own DRAFT workflow spec from its template *as normal*, with one exception: for the heavy **"Commands"** section it writes only a brief one-paragraph summary per command and defers to this doc as the authoritative source, rather than duplicating (which would create two copies that drift).

**✅ DONE (2026-05-30):** Added a `### Commands Section — Summarise In The DRAFT, Defer To This Spec As Source Of Truth` subsection to the spec (inside the "Pre-Filled `create-workflow` Spec Sections" block). It instructs the Command 01 agent to summarise the commands and emit, **verbatim**, a `> **To the execution agent:**` callout that points Command 02 at this doc's path and tells it to **read it in full and bake the per-command detail into self-contained command files**. Two guardrails were baked in, both from verifying Command 02's actual behaviour:

1. **The pointer is targeted, not vague.** Command 02 Step 1 only auto-reads the artifacts dir (`docs/artifacts/workflow-creation-artifacts/…`), **not** `docs/jira-docs/…` where this doc lives — so the callout gives the explicit path (`{agentic-hq-workspace-root-dir}/docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md`) and an explicit "read it in full" instruction. It's delivered as a `> **To the execution agent:**` callout because Command 02 Step 1 (line 57) specifically scans the spec for those and acts on them.
2. **Generated commands stay self-contained.** The callout tells the build agent to bake the detail *into* each command file and **not** leave a "see the planning doc" back-reference in the generated commands (runtime agent may lack access; two sources of truth is confusing).

Noted consequence: the archived DRAFT/APPROVED workflow spec becomes a *stub* that points here — this doc in `docs/jira-docs/AHQ-143/` stays the permanent per-command source of truth. Intentional.

**Q2 — Final `plugin-id` / `workflow-id` / `workflow-short-id`?** ✅ ANSWERED
My suggestion: plugin `agentic-hq-demos-plugin` (where `full-jira` lives), workflow-id `add-feature-workflow`, short-id `add-feature`. OK? (See item 4.)
**Your answer:** plugin-id = `agentic-hq-demos-plugin`, workflow-id = `add-feature`, workflow-short-id = `add-feature` (long and short the same). Recorded in the spec's new "Build Inputs" section. (See item 4 ✅ DONE.)

**Q3 — Bundled assets under `docs/` (convention) or `resources/` (current spec)?** ✅ ANSWERED
My recommendation: use `docs/` to match `create-workflow` and every existing workflow. (See item 5.)
**Your answer:** Split — help docs under `docs/` (convention-aligned), templates under `resources/` (they're resources, not docs). Applied in spec. (See item 5 ✅ DONE.)

**Q4 — Are the 9 help docs in scope for the *first* build, or a follow-up pass?** ✅ ANSWERED
They're a big chunk of writing (especially the Developer Help Doc, which curates a lot of this spec's rationale). Options: (a) build agent creates them in the first run via the execution-agent callout; (b) skeleton/stub them first, flesh out later; (c) build the 7 commands first, add help docs as a second iteration using the Session A/B test loop. My lean: (b) — stub all 9 so the variable paths resolve and the workflow runs, then flesh out. (See item 1.)
**Your answer:** b — stub all 9 help docs in the first build, flesh out the content in a follow-up pass.

**✅ DONE (2026-05-30):** Baked the decision into the spec's Build Deliverables Checklist (it no longer dangles a "Q4 below" reference at the report). Added a `> **Help-doc depth — stub first, flesh out later.**` callout, which says two things:

1. **Stub the files, defer the prose.** First build creates all 9 help docs as **skeleton/stub** files (title + section headings) so paths resolve and the workflow runs end-to-end; full content (esp. the Developer Help Doc) is a **follow-up pass** once the workflow can be exercised. The contrast is made explicit: the **template** files **do** need real content in the first build, because the agents write real documents from them on the first run.
2. **Stubbing the help docs does NOT mean stubbing their wiring in the commands.** Even in the first build, every command must carry the **full** help-doc wiring (point the user to its help doc + the main user help doc, read its help doc for context, honour `verbosity=medium` / "Tell Me More"), and the main user help doc must still link to each agent help doc. Only the *prose inside the help-doc files* is deferred — the commands' references to those files are part of the first build. This stops the build agent reading "help docs are just stubs" and wrongly omitting the references from the commands.

**Q5 — 7 heavy commands in one build run, or scaffold-then-iterate?** ✅ ANSWERED
The examples `create-workflow` knows are 3 commands (math) and 5 (create-workflow). Yours is 7, each much larger. Building all 7 in one plan-mode pass risks shallow command files or running low on context. My lean: let Command 02 scaffold all 7 from the spec, then use the Command 05 Session-A/Session-B loop to deepen each command one at a time against a real run. Agree, or do you want them fully fleshed in the first pass?
**Your answer:** this is a very clever observation, and was worrying me a lot.  If I try to "one shot" this whole thing in a single pass it's going to be **waaaaaay** too much work to plan and do in one context session.   You're going to document the plan here and add a section to the spec about it as well:-

**The agreed staged build** (inside Command 02, using the gates it already has — it's an interactive command that pauses for the human):

1. **Walking skeleton first.** Build all 7 command files **thin** — correct variable chains, `command-input.json` / `command-output.json` I/O, self-termination, and order — so the chain runs **end-to-end** and variables (incl. `ticket-id`) flow, with the per-agent work stubbed. CLI, `SKILL.md`, `ahq-workflow.json`, `package.json` / `pnpm-workspace.yaml` / `tsconfig.json`, and plugin manifest are built **in full**. Then pause at the build-review gate; the human does a **test run of the skeleton** in a second session to confirm the chain executes cleanly.
2. **Deepen one agent at a time** (`01` → `07`). Flesh out each command to full depth, pausing at the gate after each so the human can review (and optionally test-run) it.
3. **Human compacts between agents.** After reviewing each agent, the human runs `/compact` to keep context fresh, then tells the agent to proceed to the next one. (The "does `/compact` work inside a spawned command session?" worry was raised and **dismissed by the human — "it will work fine."**)

**✅ DONE (2026-05-30):** Added a `## Build Order — Walking Skeleton First, Then Deepen One Agent At A Time` section to the spec, with a `> **To the execution agent (Command 02…)**` callout covering the three stages above. The one robustness rule baked in: **every "deepen Agent NN" step must re-read its inputs from disk** (the thin skeleton file for NN + this doc's "## NN - …" section) rather than trust context — so the human-driven compaction between agents (and even a dead session) loses nothing, because the authoritative per-command detail lives on disk. This ties directly to **Q1**: this planning doc is the source of truth, so recovery after any context loss is identical — a fresh read of the skeleton + this doc's section for the next un-built agent.


---

## Things that are fine as-is (no action)
- Variable-flow / CLI model — matches `create-workflow-cli.ts` exactly (see intro).
- Abandon paths (split → Epic, re-split) correctly tell the human to **Ctrl-C out** rather than self-terminate — consistent with how the workflow chain must be stopped.
- `docs/dev/project-design-requirements.md` exists, so Appendix B's default path is valid.
- Putting the verbose background in this doc (not the commands) and keeping commands/help-docs minimal is exactly the right instinct for the "fast, low-overhead" goal.

---

### If you want, I can now (pick any):
1. ~~Add the "How to read this doc" taxonomy + apply `[COMMAND]` / `[USER-HELP]` / `[AGENT-HELP]` / `[DEV-HELP]` markers (item 2).~~ ✅ DONE differently — tagging dropped (line too blurry); instead added a build-time "Command vs User Help Doc" allocation callout, Developer Help Doc deferred to a dedicated agent at the end.
2. ~~Add the "Build Deliverables" checklist + execution-agent callout (item 1).~~ ✅ DONE. *(The separate "create-workflow mapping" / metadata pre-fill is item 7 — ✅ also DONE.)*
3. ~~Add the self-containment standing instruction (item 3).~~ ✅ DONE — added the "Entirely Self-Sufficient" rule to the spec.
4. ~~Fix identifier inconsistencies once you answer Q2 (item 4).~~ ✅ DONE — typo fixed + "Build Inputs" section added to spec.
5. ~~Switch `resources/` → `docs/` (item 5).~~ ✅ DONE — help docs → `docs/`, templates kept in `resources/` (your split).
6. ~~Resolve the line-224 help-doc-location hedge (item 6).~~ ✅ DONE — hedge replaced with the concrete `{agentic-hq-workspace-root-dir}` + `plugin-id` + `current-workflow-id` pattern; one honest residual note kept.
7. ~~Normalise the brace-on-LHS variable defs (item 8).~~ ✅ DONE — all 3 defs unbraced on the LHS.

---


