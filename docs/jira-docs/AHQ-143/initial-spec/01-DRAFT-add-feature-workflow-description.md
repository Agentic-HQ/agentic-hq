# AHQ-143 - Implement "Add Feature" Workflow

> **DRAFT — converted from Confluence.** Source page: [AHQ-143 - Implement "Add Feature" Workflow](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/67436545)
> This Markdown is the working copy for editing; the Confluence page is the original.

## About This Page

A comprehensive description of what I want done for the new add-feature workflow, which will be the flagship demo workflow for the Agentic HQ project. The Jira for this work is at:

[AHQ-143](https://agentic-hq.atlassian.net/browse/AHQ-143)

## CRITICAL: The Add-Feature Workflow Must Be Entirely Self-Sufficient

This document refers to other workflows (especially the Full Jira TDD Story Workflow) and to example files (e.g. AHQ-104 docs) in many places — phrases like “same as `01-jira-read-and-question.md`” or “see `04a-jira-refactor-analysis.md`”.

**Those references exist ONLY to guide the AI that builds this workflow** — they tell the build AI what existing behaviour to copy or adapt. They are **build-time guidance, not runtime links.**

The finished add-feature workflow must be **completely self-contained**:

- When building it, the AI must **inline (copy/adapt) the needed content from any referenced file INTO the new command/help-doc** that needs it.
- At runtime, an add-feature agent must **never need, or refer to, another workflow’s commands or any external doc** to do its job. It may not have access to them, and having two sources of truth lets them drift apart.

## Build Inputs For The `create-workflow` Agent (Read This First)

This add-feature workflow will be **built by running the `create-workflow` workflow** (not by running the add-feature workflow itself). When `create-workflow`’s first command asks for its inputs, the answers will be:

- **plugin-id** = `agentic-hq-demos-plugin`
- **workflow-id** = `add-feature`
- **workflow-short-id** = `add-feature`  *(the normal/long id and the short id are deliberately the same here)*

> **Build-time identifiers vs runtime variables — don’t confuse them.** The three values above are inputs to **`create-workflow`** at build time. They are different from `current-workflow-id`, which is an **internal variable used by the add-feature agents at runtime** to hold this workflow’s own id. For paths to resolve, `current-workflow-id` must equal the build-time `workflow-id` (both `add-feature`) — that is why the generated skill lives at `{demos-plugin-dir}/skills/add-feature`, and the agents look there for their help-docs and templates.

## Pre-Filled `create-workflow` Spec Sections (Workflow Metadata, Variable Flow, TypeScript CLI)

> **To the execution agent:** When `create-workflow` Command 01 drafts its **own** spec, its template requires three sections that this planning doc can answer up-front. They are pre-filled below so the Command 01 agent **translates** them into its template rather than inventing them (the template's other sections — Plugin Metadata, Workflow Overview, Commands, What Success Looks Like — are covered by the rest of this document). All three were checked against the actual `create-workflow` Command 01 template and `create-workflow-cli.ts`.

### Workflow Metadata

- **workflow-short-id**: `add-feature`
- **exampleParameters**: `-- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123`
  - Must start with `-- `. All three params are **optional**; the values shown are the documented examples/defaults — `verbosity` defaults to `low`, `suggest-large-refactor` defaults to `false`, and `ticket-id` is generated or asked for if omitted (see "01 - Ticket Creator").

### Variable Flow & Runtime Context

- **Roots used**:
  - `project-root` — the user's primary working directory: the codebase the feature is being added to.
  - `agentic-hq-workspace-root-dir` — read by the TS CLI from `AGENTIC_HQ_WORKSPACE_ROOT`; used to locate this workflow's skill-bundled assets (templates under `resources/`, help docs under `docs/`). See "Help Docs, Verbosity=medium…" for the resolution pattern.
- **Env vars consumed by the TS CLI**: `AGENTIC_HQ_WORKSPACE_ROOT`.
- **CLI passthrough parameters** (after `-- `): `--verbosity` (optional, default `low`), `--suggest-large-refactor` (optional, default `false`), `--ticket-id` (optional).
- **Skill-bundled assets read at runtime**: the 5 template files under `{templates-dir}`, the user + agent help docs under `{workflow-help-docs-dir}`, and the developer help doc under `{developer-help-docs-dir}` (see Build Deliverables Checklist).
- **Per-command variable flow**:
  - **01 Ticket Creator** — *reads*: the **same four variables every agent reads** — `agentic-hq-workspace-root-dir`, `verbosity`, `suggest-large-refactor`, `ticket-id` — from the input string. At agent 01 **only**, `ticket-id` is **optional** (may be absent → 01 generates/obtains it); `verbosity` and `suggest-large-refactor` are always present (Commander-defaulted by the CLI to `low` / `false`). *Writes*: the `allVariables` string — the constants above **plus** `ticket-id` (which it generates or obtains from the user if not supplied).
  - **02–07 (Interrogator … Validator)** — each *reads* the **same** `allVariables` string, which always carries **all four** variables (`agentic-hq-workspace-root-dir`, `verbosity`, `suggest-large-refactor`, `ticket-id`) — and here **all four are required and present** (01 has guaranteed `ticket-id`; the other two were Commander-defaulted). None of them emit new variables; everything else they need is obtained by reading the files written by earlier agents under `{workflow-files}`. Their command output is **ignored** by the CLI.

### TypeScript CLI

- **Pattern to follow**: **`create-workflow-cli.ts`**. Its verified behaviour: read `AGENTIC_HQ_WORKSPACE_ROOT`, call Command 01, **capture Command 01's return value as `allVariables`**, then pass that **same** string to every later command and **ignore** their outputs.
- **One required difference from `create-workflow-cli.ts`**: that CLI takes **no** CLI parameters; this workflow does. So the add-feature CLI must additionally **parse the passthrough params** (`--verbosity`, `--suggest-large-refactor`, `--ticket-id`), applying defaults (`verbosity=low`, `suggest-large-refactor=false`) and passing `ticket-id` through only if supplied, then include them in the input string it builds for Command 01. Everything else (capture-01-output-then-broadcast) is copied as-is.
- **Initial input string passed to Command 01** (example shape): `The variables used in this workflow are: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot} and verbosity=${verbosity} and suggest-large-refactor=${suggestLargeRefactor} and ticket-id=${ticketId}`.
- **Output handling**: capture Command 01's output (`allVariables`); re-inject that same string into Commands 02–07; ignore 02–07's outputs.
- **Command invocation order**: linear — `01` Ticket Creator → `02` Interrogator → `03` Planner → `04` Executor → `05` Refactoring Planner → `06` Refactoring Executor → `07` Validator.

### Commands Section — Summarise In The DRAFT, Defer To This Spec As Source Of Truth

The `create-workflow` Command 01 template also requires a **"Commands"** section describing each command and exactly how it works. That detail is large and already lives, authoritatively, in **this** document (see the per-command sections below — "01 - Ticket Creator", "02 - Interrogator", etc.). **Do not duplicate it into the DRAFT spec** — a second copy will drift out of sync with this one.

> **To the Command 01 agent (drafting the DRAFT workflow spec):** In the DRAFT spec's "Commands" section, write only a **brief one-paragraph summary per command** (`01`–`07`: its name, its role, what it reads, what it writes). Do **not** transcribe the full per-command instructions. Immediately after the summaries, include the callout below **verbatim** so the build agent (Command 02) knows where the real detail is:
>
> > **To the execution agent (Command 02, building the commands):** The brief summaries above are NOT the full command specs. The **authoritative, complete per-command detail** lives in the add-feature planning doc at:
> > `{agentic-hq-workspace-root-dir}/docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md`
> > **Read that document in full before building the command `.md` files**, and bake each command's detail **into the command file itself** so every generated command is fully self-contained. Do **NOT** leave a "see the planning doc" back-reference inside the generated command files — the runtime agent may not have access to it, and two sources of truth is confusing. The planning doc is a build-time input only.

**Consequence to be aware of:** because the DRAFT (and later APPROVED) workflow spec only summarises the commands and points here, that archived artifact is **not** a standalone record — this planning doc in `docs/jira-docs/AHQ-143/` remains the permanent source of truth for the per-command detail. That is intentional.

## Build Deliverables Checklist (What The Build Must Produce)

> **To the execution agent:** When `create-workflow` Command 02 builds this workflow, it only scaffolds a **fixed** set of files — the command `.md` files, `ahq-workflow.json`, the TypeScript CLI, `SKILL.md`, `package.json` + `pnpm-workspace.yaml` + `tsconfig.json`, and the plugin manifest. It does **not** create the template files or help-doc files that this workflow depends on. Those are first-class runtime dependencies — the agents **read** them and the commands **reference** them by variable, so if they are missing the workflow is broken on first run. **You must therefore also create the template files and help-doc files listed below**, with at least skeleton content so that every variable path resolves and the workflow runs end-to-end.

**Scaffolded automatically by `create-workflow` Command 02** (you do not need to do anything extra for these, but verify they exist):

- **7 command files** — `01` Ticket Creator … `07` Validator (in `{commands-dir}`)
- `ahq-workflow.json`, the TypeScript CLI, `SKILL.md`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, plugin manifest

**You (the build agent) must ADDITIONALLY create these — 5 template files** (in `{templates-dir}`):

- `split-feature.TEMPLATE.md` → `{split-feature-template-file}`
- `unsplit-feature.TEMPLATE.md` → `{unsplit-feature-template-file}`
- `refactoring-plan.TEMPLATE.md` → `{refactoring-plan-template-file}`
- `refactoring-execution.TEMPLATE.md` → `{refactoring-execution-document-template-file}`
- `validator-summary.TEMPLATE.md` → `{validator-summary-template-file}`

**…and 9 help-doc files:**

- `00-add-feature-workflow-user-help-doc.md` → `{add-feature-workflow-user-help-doc}` (in `{workflow-help-docs-dir}`)
- `developer-help-doc.md` → `{developer-help-doc}` (in `{developer-help-docs-dir}` — its own directory, a sibling of `{workflow-help-docs-dir}`)
- `01-ticket-creator-help-doc.md` → `{ticket-creator-help-doc}`
- `02-interrogator-help-doc.md` → `{interrogator-help-doc}`
- `03-planner-help-doc.md` → `{planner-help-doc}`
- `04-executor-help-doc.md` → `{executor-help-doc}`
- `05-refactoring-planner-help-doc.md` → `{refactoring-planner-help-doc}`
- `06-refactoring-executor-help-doc.md` → `{refactoring-executor-help-doc}`
- `07-validator-help-doc.md` → `{validator-help-doc}`

(The 7 agent help docs `01`–`07` all live in `{workflow-help-docs-dir}`.)

> **Help-doc depth — stub first, flesh out later.** In the **first** build, create all 9 help-doc files as **skeletons/stubs** only — enough structure (a title and the section headings each doc will have) that every variable path resolves and the workflow runs end-to-end. Do **not** try to write the full help-doc content during the first build. The 8 user/agent help docs (`00`–`07`) are fleshed out in a **follow-up pass**, once the workflow is running and can be exercised. The **Developer Help Doc is deferred further still** — to its own Jira, **[AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)** — so its stub body is simply a **pointer to AHQ-149** (not just empty headings). The template files, by contrast, **do** need real content in the first build, because the agents write real documents from them on the very first run.
>
> **Stubbing the help docs does NOT mean stubbing their wiring in the commands.** Even in the first build, every command file must contain the **full help-doc wiring**, exactly as described in "Help Docs, Verbosity=medium And 'Tell Me More' Command" below — i.e. each agent still: (1) **points the user** to its help doc (and the main user help doc) by path, (2) **reads** its help doc for context, and (3) honours `verbosity=medium` / "Tell Me More" by reading the help doc and explaining. The main user help doc must still **link** to each agent help doc. Only the *prose content inside the help-doc files* is deferred to the follow-up pass — the commands' references to those files are part of the first build and must be present and correct from day one.

## Build Order — Walking Skeleton (Two Passes) First, Then Deepen One Agent At A Time

This workflow has **7 substantial commands**. Building all seven to full depth in a single uninterrupted pass risks shallow command files and context exhaustion. So the build is **staged into three stages** (the walking skeleton is itself **two passes**), using the gates that `create-workflow` Command 02 already provides (it is an interactive command that pauses for the human). The split follows a real fault line: Stage 1 de-risks the **chain mechanism** with the smallest possible investment; Stage 2 completes and reviews the **variable/data-flow scaffolding** (which doesn't affect whether the chain *runs*, but is where path bugs hide); Stage 3 adds the **real per-agent work**.

> **To the execution agent (Command 02, building this workflow):** Do **not** build all 7 commands to full depth in one go. Build in three stages, pausing at the gate between each:
>
> **Stage 1 — Bare-chain skeleton (confirm the mechanism runs).** Build all 7 command files **thin** — correct read/write of `command-input.json` / `command-output.json`, correct self-termination, correct order, and just enough Step 0a/0b to flow the inter-command variables (especially `ticket-id`) — with the actual per-agent work stubbed (a placeholder step). Each thin stub briefly tells the human **what that agent _will_ do once built** — a one/two-sentence "when complete, this agent will …", based on that agent's per-command summary in the DRAFT workflow spec at `docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature/01-DRAFT-workflow-spec.md` (the "Commands" section). Build the TypeScript CLI, `SKILL.md`, `ahq-workflow.json`, `package.json` / `pnpm-workspace.yaml` / `tsconfig.json`, and plugin manifest **in full**. The goal: the chain **runs end-to-end** and variables (including `ticket-id`) flow correctly, even though no agent does real work yet and the full variable blocks aren't present. Then **pause at the build-review gate** and tell the human to do a **test run of the skeleton** in a separate session to confirm the chain (CLI wiring, command order, `ticket-id` flow, self-termination) executes cleanly.
>
> **Stage 2 — Full-variable skeleton (complete + review the data flow).** Now fill in each command's **complete Step 0b "Establish Variables" block** — the full chain, each variable building in tiny increments on earlier ones (this is one of the workflow's "Keep" highlights, see "Things To Be Sure To Keep"). Expand each agent's "what I will do" explanation so it **narrates what the agent will do _with those concrete variables_** (referencing them by name — e.g. "I'll read `{interrogator-help-doc}` and write the plan to `{implementation-plan}` under `{planner-directory}`"). **Also create every _skill-bundled asset_ file that these variables point to, so every path resolves:** the 5 template files under `{templates-dir}` and the 9 help-doc files under `{workflow-docs-dir}` / `{workflow-help-docs-dir}` (help docs as **stubs** per Q4; the Developer Help Doc stub is a **pointer to [AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)**; templates created here too). **Do NOT create the _runtime artifacts_** the agents produce at runtime (the prompt/ticket files, plans, execution docs, etc. under `{project-root}/docs/tickets/{ticket-id}/workflow-files/…`) — those don't exist at build time (there's no `ticket-id` yet) and are created when the workflow actually runs, including the human's skeleton test run. Then **pause at the gate** so the human can review the whole variable/data-flow / file-layout / naming in one focused pass (and catch path errors early — e.g. the `ticket-creator-directory` typo class). Still no real per-agent work.
>
> **Stage 3 — Deepen one agent at a time.** After the full-variable skeleton is confirmed, flesh out the commands **one agent at a time, in order (`01` → `07`)**. After each agent is built to full depth, **pause at the gate** so the human can review it (and optionally test-run it). The human will then **compact the conversation** before telling you to proceed to the next agent — this keeps context fresh across all seven. (Template real content, where not already written in Stage 2, must be complete before that agent's first real run.)
>
> **When deepening each agent, add a dedicated `## Step 2a: Read Context` step** (and rename that command's `## Step 2: Check Pre-requisites` to `## Step 2b: Check Pre-requisites`) that loads, at startup, the context files the agent needs to begin work. Take that agent's exact file list — the **AI recommendation _and_ the human's decisions** — from `docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature/additional-prompts/02-report-and-recommendations-on-file-reads-by-each-agent-on-startup.md`, and bake it **inline** into the step so the command stays self-contained. (Each Stage-2 skeleton command already carries a `STAGE 3 BUILD — ADD A DEDICATED "READ CONTEXT" STEP` build-note pointing at that report; **delete that note** once the step is built.) **Research files (Perplexity/web) are not startup reads** — the producing agent already summarises them in its own document; downstream agents read the summary they load anyway and open an individual research file only on-demand.
>
> **Re-read inputs from disk at the start of every deepen step — do NOT rely on what's in your context.** Compaction is lossy, and the human compacts between agents, so treat your context as **disposable**. Before fleshing out Agent NN, **re-read from disk**: (a) the **skeleton command file** for Agent NN from Stages 1–2, and (b) **this planning doc's section for Agent NN** (e.g. "## 04 - Executor"). The authoritative per-command detail lives in this doc on disk — see the "Commands Section" callout above — so a fresh or compacted context loses nothing: you simply re-fetch the detail for the one agent you are about to build. The same recovery works if a session ever dies mid-build: start a fresh session and re-read the skeleton + this doc's section for the next un-built agent.

## Allocating This Document's Content (Command vs User Help Doc)

> **To the execution agent:** This planning document deliberately mixes content aimed at different places — some passages are task instructions that belong in an agent's **command file**, others are background/explanation that belongs in a **user-facing help doc**. The line between them is blurry on purpose, so **don't try to tag or pre-classify every passage**. Instead, as you build **each** command, decide **at that moment** where each piece of the text I've provided for that agent should go. The destinations are **not mutually exclusive** — a passage can go to one, the other, **or both**:
>
> - **Relevant to the task the agent performs →** put it in the **command file** (keep the command short and focused on the task).
> - **Background / reasoning / "why it works this way" a user would want while running the workflow →** put it in the **user-facing help docs** (the agent points the user to them and reads them for `verbosity=medium` / "Tell Me More"). Per "Help Docs, Verbosity=medium And 'Tell Me More' Command" below: whole-workflow material goes in the main user help doc (`00-…`), per-agent material goes in that agent's help doc (`01–07`).
> - **Useful in BOTH →** this is common and fine. Put a **cut-down** version in the command (just enough for the agent to do the task correctly — the minimum context it needs) and the **fuller** version in the help doc (for the user, and for the agent to re-read on "Tell Me More"). Don't dump the full background into the command just because it's also relevant context — trim it to what the task needs and let the help doc carry the rest.
>
> **Do NOT worry about the Developer Help Doc during the build.** It is deferred to its own Jira, **[AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149) — "Create add-feature Developer Docs"**, to be written **after** this workflow is built and running — it does **not** affect the workflow commands, so you don't need to route any of this document's content into it. (Per Q4, you still create the stub file so its path resolves; its body is just a **pointer to AHQ-149** until that Jira fills it in.)

## Stopping Overthinking

I was overthinking things with by previous plan for this at:

[!!TEMPORARILY ABANDONED!! - Atomic Story Workflow](https://agentic-hq.atlassian.net/wiki/spaces/AH/pages/64978945)

so I’m abandoning that for now. It created a whole massive ticketing system with “atomic” tickets and non-atomic tickets for breaking features down.

This “add-feature” workflow is much more basic and manual, for use as demo feature workflow. I’m going to leave the Atom tasks and super-fast RED-GREEN-REFACTOR sub-workflows and incorporating a third party Task Management System to “later”….

## Great Things About Existing AHQ TDD Jira Workflow To Show Off In This Add Feature Workflow

I already have a “Story” workflow for adding feature, which is called the Full Jira TDD Story Workflow and the commands for it are at:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow

It is locked into the Jira issues tracking system, whereas I want a generic add-feature workflow that anyone can use (with any issue tracking system, or even without one). It also has some things about it that I want to get rid of or improve.

It has a number of good features that we are interested in re-using in this add-feature workflow.

The following tables goes through them:-

| **Thing** | **Quick Summary** | **How?** | **Example** | **Notes** |
| --- | --- | --- | --- | --- |
| Pin sharp focussed context<br><br>(AHQ specific) | Each command loads only the context it needs to do the next, **single** thing. Any previous discussion that isn’t relevant isn’t included and anything that is needed/useful has been **compressed** into **documents** to the right level of details in order to do a good job. | Context required by a future Agent is obtained through exploration and discussion with the user and then compressed by **this** Agent into exactly what is required for the **future** Agent in a markdown file. The **future** Agent uses that compressed context + just the files it needs to load from the file system (e.g. code) without having to search for it. | Planner does a lot of exploration and thinking and discussing with the human, resulting in an Implementation Plan. Executor reads all that, reads the code it was pointed to, and any additional code it thinks it needs to complete the task, and then executes. | The agent **before** should help out the agent **after** by pointing to all the relevant code/doc files, with a one line summary, in its write-up, but make it **clear** that list isn’t exhaustive. |
| Questioning and clarification<br><br>(not really AHQ specific - questions could be included in any Skill) | Some things about the Story aren’t understood, known or clear to the Agent, or it notices things that haven’t been thought about. The Questions seems to be powerful way of dealing with this and provoking more thought/discussion with the human. | In the TDD workflow the AI summarises what it understands about the Story from the Jira, the code and research it does. This give the chance for the human to see how/what could be misunderstood or not clear enough.<br><br>It then also asks a series of Questions with Recommended Answers and a space for the human to fill in. This works really well. | N/A | Very similar to [/grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md) Skill by Matt Pocock (NOTE: He recently [replaced this for development](https://www.youtube.com/watch?v=6BB6exR8Zd8) with the [/grill-with-docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) Skill which uses a glossary in the file called CONTEXT.md - sounds very useful and should try it soon…) |
| Perplexity Research | Powerful use of “second opinion” - should add Skill that puts question in file in “additional-research“ folder and awaits human answer pasted from <https://perplexity.ai> - then refers to it in other docs. |  |  |  |
| Shipping code that matches your expectations and standards<br><br>(AHQ specific, because doing all this manually is much harder and bloats context in one command) |  | The audit of design principles met from project-design-requirements.md document (done on the Plan and the Refactor phases). |  |  |
| Refactoring.<br><br>(AHQ specific, because doing all this manually is much harder and bloats context if attempted in the same Skill as the implementation) |  |  |  | If you try to get Claude to refactor by just *asking* it, or including a section in an existing Skill - it glazes over it and pretends to do the basics, but doesn’t really do it well. Here we can really **teach it** what is involved and train it to do useful changes/refactoring, and **audit things** (e.g. conversion to constants). |
| Documenting for the future (AHQ specific, because we chain commands and compress and pass info using markdown) | All the documentation produced by the workflow Agents is useful for future agents working on the codebase, to help them understand why things were done. | By forcing the process to document everything in markdown that is used by the agent to do the work at each stage - we are creating a very detailed record of what was done and why. If everything was done in one big Skill then this would all be lost, as it would accumulate in the Agent’s context, used to do the work, then wiped. The important decisions, changes, chats with the human - all lost. We avoid that loss here. | Best example is refactoring stage, where we discuss and plan the refactoring in a document, but **don’t actually do it.** The execution is done by the next agent which does it based on the refactoring document produced by the previous agent. This forces every decision about the refactoring to be fully documented, including the “why” of it. | Documents are what the AI feeds off of. It is all valuable context for the future (Why was the code written like this? How do I reimplement these features on an newer version of the project I forked? What could have caused this bug and why was the system changed to do it this way?) |

## Things To Improve On When Compared To Existing Jira TDD Workflow

The following is a list of things that were done in the Jira TDD workflow that I don’t like and want to ditch:

- RED and GREEN stage done by separate Agents - in the old Jira TDD workflow we planned and created the failing RED tests before considering and planning the actual implementation. This ended up not working very well because for unit tests we would have to know what classes/entities we were creating before writing tests for them, and so we ended up planning the code structure for RED and then (again) for GREEN. So this time we’ve lumped the test creation and code creation into one Planner agent who plans both in a single plan.
- Refactor stage - the old Jira TDD workflow created a big table of refactors, then created a separate list of recommendations that duplicated a lot of stuff from the table. Too complex - meant human reading things twice (= waste of time). This time we have only one list of Refactor Suggestions.
- Refactor stage - Tier 1 (auto-approved) and Tier 2 are confusing and complex and hard to understand (Claude came up with this naming and process, and it’s not easy). E.g. Tier 1’s are auto-approved unless marked Skip by human. In this workflow there is no concept of “auto approval” - but we do lump together similar refactors for a single approval (e.g. extraction of constants).
- Validation stage - seemed over-engineered and unnecessary in old Jira TDD workflow. The version we created here is simpler and quicker, and focusses more on highlighting things the human should check/run/test before giving final approval.

## Things To Be Sure To Keep Or Improve

Keep:

- Really good variable naming and sharing that flows through all the commands. The “`Establish Variables`" stage should have a **complete** list of all variables and each ones builds in tiny increments on existing variables.
- Use of Templates showing format of file that AI writes - e.g. the `ai-summary-of-jiras-and-questions-for-human.md` document that 01-jira-read-and-question.md writes. In this workflow we improve this by having a separate templates directory which contains individual TEMPLATE files. This avoid cluttering up the main command file with the template.
- Minimal tests - Agent is ***only*** allowed to plan enough tests to **force the feature into existence** (no more!!) - this keeps tests **minimal**.
- Minimal implementation code - Agent is ***only*** allowed to write enough code to **force the tests to pass** (no more!!) - this keeps code **minimal**.
- Refactor stage - if additional changes or improvements are specified that aren’t the minimum needed to make the tests go green they get left as optional refactorings that the human has to review and approve with the Refactoring Planner.

## Principles To Remember

### Tokens Are Cheap, Human Attention Is Expensive

I’ve previously used Claude to help me write Jira tickets (often for doing later) which have been **extremely verbose** and include lots of technical detail. This was because Claude had done lots of research and accumulated a lot of data/info while I was discussing the ticket. It then splurged out a massive set of requirements and technical details which I pasted into the Jira, without reading them (thinking I’ll read the detail in the Plan when it’s made). But then the Planner thinks all those are **hard** requirements (from a human) and sticks to them, even if I don’t agree with them or they are wrong. Lesson Learnt: Only get the AI to discuss and write the amount the human is **actually going to read** (not more). I was getting the AI to write **all** of what it had learned because I thought it would be a waste of tokens to throw that information away. That was **incorrect**. Throwing away information that isn’t going to be reviewed straight away by human is the **right thing to do** because tokens are cheap. That information will have to be collected again by the agent later (during planning), but at that stage the human **will read the plan**.

In this workflow I’m going to force the Ticket to be short - only what the human has discussed (that can’t be ditched) and just enough to guide the Planning agent in the right direction. If the Ticket ends up seeming to need a lot of detail - that’s a clear sign it should be **split** into multiple Sub-Tasks. It must be short enough to be a **summary** of what is going to be done, and a **summary** of the requirements, together with some technical **pointers** (short ones that the Planner will expand on and questions and research in full).

### Make It Fast! (Means Not Much Text For Human To Read)

The text the human is presented with (about the process, about the spec, about the code) should be **minimal** and if they want to know more they just type Tell Me More, or read the docs/help in the Skill directory.

This is because we want the time and cognitive overhead of running the entire add-feature workflow to add a single, small feature to be **very small,** to encourage the human to split features up into sub-tasks where possible.

Keeping the whole thing as fast and minimal as possible (“Less Is More” & “KISS” principles) is what will help give us what Martin Fowler called “our best form of leverage” i.e. “reduced cycle time”. For details see:

*Martin Fowler in a recent* [*interview about AI Software Engineering on the Pragmatic Engineer*](https://www.youtube.com/watch?v=CQmI4XKTa0U)*channel said: “Just try to constantly improve (reduce) that cycle time. And I still feel that's our best form of leverage at the moment, it's improving cycle time”. Similar to "faster = better” finding that Dave Farley talks about and Dora report stats show.*

This current planning document is **huge** and detailed, and so we must hide the complexity and the verbosity from the developer when they run this add-feature workflow because we need them to be able to do each iteration **fast**, so they are OK with making the code changes **small**.

To deal with this we’ll have a “verbosity” command line parameter that defaults to “low”. In the README.md we’ll recommend they set it to verbosity=medium for the first time they run the workflow to get Extra Guidance on the process, but for normal usage we’ll recommend they leave the setting out or set it to “low”.

### Decomposition

3 “giants” of software engineering have all focussed a lot of their efforts on one thing: **decomposition**:

- Martin Fowler - in this [*interview about AI Software Engineering on the Pragmatic Engineer*](https://www.youtube.com/watch?v=CQmI4XKTa0U) says reducing cycle time is our best form of leverage (see above for quote and details). This is about decomposing work into smaller chunks and running the whole cycle very quickly across each of those small chunks.
- John Ousterhout - in a [Pragmatic Programmer YouTube Interview](https://www.youtube.com/watch?v=lz451zUlF-k&t=879s) says "the most important idea in all of computer science is... 🥁🥁🥁…Decomposition". He’s talking more about the actual design of the system, rather than splitting up the work - but they are related.
- Dave Farley - In his video <https://youtu.be/XavrebMKH2A?si=5D1_vBF7gDdPN8oA&t=385> says “*If you're asking the AI to write a whole feature and then you're reviewing it once, you're violating the sampling theory. Ask for and work in smaller chunks, get feedback faster*”

The Ticket Creator in this add-feature workflow works with the human to try to decompose larger chunks of work into smaller chunks. Both the Ticket Creator **and** the Interrogator investigate and attempt to break the task into smaller Sub-Tasks. The result of this should be:

- Tasks that both the human **and** the AI can fit inside their brains and easily understand (for the AI the “brain” is its context window and we all know that if you try to squeeze too much in you end up in the “dumb zone”. Humans are the same - if you try to work on a highly complex tasks without breaking it down first, you just aren’t going to be as effective)
- Tasks that allow you to get much faster **feedback** on your ideas and your implementation, so you can “embrace change” more easily and quickly.

The downside of decomposition is **overhead** (per feature). This is the time/effort that is built into running the whole add-feature cycle per task. If it takes 1 hour to run the whole add-feature workflow, even for changing the colour of a single button on the UI - then **this is a problem**. It will discourage the human from choosing smaller tasks because they know that their development speed will slow down.

This whole process is about **balance**. We want the overhead of running a single add-feature workflow to be both:

- small enough to encourage reasonably small tasks
- big enough to do useful analysis and work on those tasks

IMPORTANT: The first version of this add-feature workflow will inevitably get that balance **wrong**. It will probably add **too much** overhead for most people’s taste (as I’m a “gold plater”). I’m going to try to keep the speed up by:

- Giving the human the option of a default verbosity=low option, so they don’t get things explained unless they ask for it. This reduces the reading they have to do.
- Not splitting the RED-GREEN phase like in the Full Jira TDD Workflow - all in one to speed it up. And not enforcing TDD.
- Understanding that the AI will have to spend time re-loading into its context code/research each time, but that we may be able **speed that up** in future by using a form of context caching and reload (see future Jira: [AHQ-148](https://agentic-hq.atlassian.net/browse/AHQ-148) )

The aim is that, as myself and other people use the workflow we can:

- Modify it to reduce overhead if that seems a good idea
- Possibly add command line parameters that can optionally reduce the overhead e.g. speed = fast|normal|slow (slow meaning more thorough)
- Certain people may just copy the workflow and strip out a lot of the overhead
- In the future, to support even faster feedback on smaller code additions a “sub-workflow” could be introduced that takes the small code additions for the feature and does a super-fast, low-overhead TDD (RED-GREEN-REFACTOR) cycle on each of them? This fits within the overall, slower add-feature cycle but speeds up the cycle time for the feedback on actual code additions.

### Expansion And Compression

The process that this add-feature workflow goes through seems to be one of cycles of **expansion** and **compression**. We start with something small: an initial idea and we end up with working code and other artefacts like tests and documentation. But during the process we also see a process of expansion and compression of information at each stage.

**Expansion**: The information expands as we look at all the code that may be relevant and do research that may or may not be relevant. We may consider multiple possible ways of doing the work and compare them. We may express our initial ideas/plans in ways that are not very clear and quite messy or even incoherent. This is where we see a small amount of information expand.

**Compression**: Once we’ve done our thinking and considered the options we discard the bad ideas and focus on and refine the good ideas until we can express them a clear and understandable, coherent and **concise** manner. This is where the information is **compressed** and then stored in a document for the following agents to load into their context.

Each Agent does some form of expansion as it explores the solution space with the human, and the documents that it produces then compress that information for the following Agents to use.

### Ditching “Master/Slave” Dynamic

The current methodologies people employ for AI software development are often either:

- Too structured - master/slave - spec driven - “write me a spec”, “implement this code using this spec”, “review this code and fix things that are wrong”
- Too unstructured - “Let’s just vibe together and we’ll get there in the end”

This add-feature workflow is trying to created a more balanced approach, where the AI and human collaborate continuously and iteratively and where they can both fully utilise their strengths.

Examples of AI strengths:

- Finding things in files at high speed
- Working through checklists
- Knowing how things work (libraries etc) without having to look them up
- Writing code/docs quickly

Example of Human strengths:

- Good judgement about how to keep things minimal and leave out unnecessary things.
- Seeing how to simplify complex/messy chunks of the system
- Understanding and knowledge of the large “context” the system is being built in (that the AI hasn’t been told about).

The workflow tries to retain the valuable, quick interaction and feedback of vibe coding, but to also benefit from the structure provided by documents, checklists, audits and workflows.

## Differences From “Full Jira TDD Story Workflow”

There are many things that are similar to, or copied from the Full Jira TDD Story Workflow at:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow

but a number of things that are very different.

Some of the big differences:

- This workflow (currently) has no access to an issue management system MCP and so will not be adding comments to the tickets to update progress. This is something that may be added back in in future versions (possibly as an optional, configurable extra?)
- This workflow is simpler - just a single linear sequence of 7 Agents. There is no loop for each of the different test-types like in the Jira workflow. Instead the Planner plans all the different types of tests that should be created and the code that will be driven by the test. The Executor then writes the tests followed by the code. Similarly the refactoring stage has separate Planner and Executor agents.

## Summary Of “Add Feature” Workflow

The workflow is for adding a feature to an existing code base.

It is as single sequence of 7 Agents run in the following order:

- **01 - Ticket Creator -** Attempts to split feature into smaller Sub-Tasks and then creates the Ticket
- **02 - Interrogator** - summarises understanding of feature and asks list of questions.
- **03 - Planner** - plans the implementation (including tests and code)
- **04 - Executor** - executes the plan
- **05 - Refactoring Planner** - plans the refactoring
- **06 - Refactoring Executor** - executes the planned refactoring
- **07 - Validator** - validates the feature has been implemented, tests pass and human is happy.

## Every Command - Common Elements

We’ll be following very similar format to the commands in the Full Jira TDD Story workflow at:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow

and defined as the way commands should be created in the commands at:

.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow

In this add-feature workflow we’ll have the same kind of intro as the commands in the Full Jira TDD Story workflow — and as the `create-workflow` and `math-workflow` commands, whose opening paragraphs are **agent-facing context, not text to copy out to the user** — but each one will have an explicit heading:

`## Intro To Give The Agent Context`

This Intro section is **context for the agent** (not the user) and is **not** an instruction or a Step — `## Step 0a: Read Input` is the first actual Step the agent performs. The agent reads the Intro to understand the situation, the background, where it sits in the 7-agent flow, and what it is responsible for. Rules for **every** command’s Intro:

- It **must begin with one sentence explaining what the workflow is and what system runs it** — what the Add Feature workflow does, and that it is run by the **Agentic HQ framework, which automates AI command workflows** (chaining multiple Claude Code commands together so each agent does its part and hands its work on to the next). Keep this opening sentence the **same in every command**, so a fresh agent — with no memory of the other commands — always knows what it has woken up into.
- It then states this agent’s responsibility, beginning “**As the &lt;Agent Name&gt; your responsibility is …**” — a crisp statement of that responsibility, naming the agent (e.g. “As the Ticket Creator your responsibility is …”).
- It then gives the context/background and where the agent sits in the flow: state its position in the 7-agent sequence and name the agents immediately before and after it **together with what each contributes** — what the previous agent has handed this one, and what the next agent does with this one’s output (e.g. “the Interrogator before you has established a shared understanding of the feature, and the Executor after you turns the plan you write into working code”).
- It must contain **no** task instructions or numbered steps — those live under the `## Step …` headings.
- It **ends by instructing the agent to introduce itself to the user**:
    - by default (`verbosity=low`): a **single sentence**, ending with exactly: `(to find out more about my role, stop me and say "Tell Me More")`
    - if `verbosity=medium`: a **longer (more than one sentence)** introduction to its role, then the same closing pointer.
  (The agent knows `verbosity` once it has completed `## Step 0a` / `## Step 0b`.)

After that, every command should have the usual:

`## Step 0a: Read Input`

`## Step 0b: Establish Variables`

`## Step 1: Validate Input`

`## Step 2a: Read Context` — **added when the agent is deepened in Stage 3** (see "Build Order"). It loads, at startup, the context files the agent needs *before it begins work*. The exact per-agent file list (the AI recommendation **and** the human's decisions) is recorded in `docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature/additional-prompts/02-report-and-recommendations-on-file-reads-by-each-agent-on-startup.md` (bake that list **inline** so the command stays self-contained). Note: research files (Perplexity/web) are **not** startup reads — the producing agent's summary covers them; they're opened on-demand. In the Stage 1/2 skeletons this step is **absent** — adding it splits the old single `## Step 2: Check Pre-requisites` into `## Step 2a: Read Context` + `## Step 2b: Check Pre-requisites`.

`## Step 2b: Check Pre-requisites` (this is just `## Step 2: Check Pre-requisites` in the Stage 1/2 skeletons, before Read Context is inserted)

like:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/02-jira-write-failing-test.md

does.

### Help Docs, Verbosity=medium And “Tell Me More” Command

Help docs are a fairly new addition/idea for workflows (don’t think I’ve done them before)

As you can see below, the Help Docs for the workflow are stored *with the workflow* skill in a docs subdirectory (see the "01 - Ticket Creator" section below for the full set of variables).

This means that if we start shipping/versioning Skills using the Claude Plugin Marketplace the Help Docs will be shipped with the Skill and available in the same directory as the Skill file.

The agents locate that directory by deriving it from `{agentic-hq-workspace-root-dir}` plus `plugin-id` and `current-workflow-id` — exactly as the variable list does it:

- `demos-plugin-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin`
- `current-workflow-skills-dir = {demos-plugin-dir}/skills/{current-workflow-id}`

`{agentic-hq-workspace-root-dir}` is read by the CLI from the `AGENTIC_HQ_WORKSPACE_ROOT` environment variable and passed into the first agent (see how `create-workflow`'s `01-explain-to-user-how-workflows-work-and-get-workflow-details.md` parses it). This is the **same pattern `create-workflow` itself uses** to locate skill-bundled assets, so it's a known-good approach — no need to invent anything.

> **The one remaining limitation** (left for later, not blocking): this resolves the skill directory *via the workspace root*, which requires the workflow to be run with `AGENTIC_HQ_WORKSPACE_ROOT` set — i.e. from within the Agentic HQ workspace. Resolving a plugin's *own* skill root independently of the workspace (so a marketplace-installed skill could find its bundled docs anywhere) is a future improvement. Fine for now.

The whole add-feature workflow will have its main User Help Doc at:

{add-feature-workflow-user-help-doc}

which will have information about the whole workflow and explain how it works, based on a lot of the stuff in this Spec.  It will be the information that is important and relevant to a User *while they are running the workflow* or just before - when they want to understand the point of it and how it works.

This {add-feature-workflow-user-help-doc} is **user facing** and the workflow agents will point the user to it.

There will also be a Developer Help Doc at:

{developer-help-doc}

This will contain information for any developer who wants to understand more deeply how and why this workflow was developed the way it was, if they are thinking of modifying it or adding to it.  A lot of the sections of this spec that don't seems that relevant to the AI building this workflow, or the user using it - but do seem useful to anyone wanting to understand the deeper reasons for how it will be done, will be copied into that Developer Help Doc.

> **Deferred to [AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149) — "Create add-feature Developer Docs".** Writing the Developer Help Doc properly was judged too much work/complexity to do as part of AHQ-143, so it is deferred to a separate Jira to be done **after** the workflow is built and running. In **this** (AHQ-143) build the build agent only creates a **stub** file at `{developer-help-doc}` whose body is a **pointer to [AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)** (i.e. "This Developer Help Doc has not been written yet — it will be created under AHQ-149: …"), so the variable path resolves and the workflow runs. Do **not** write the real content during the AHQ-143 build.


Each Agent will have its main Command file which contains the main instructions for the agent. This is what Claude is invoked with to run the Agent.

In addition each command will have an associated Help Doc. There is one dedicated Help Doc per Agent (see the variable list below for the names).

The main {add-feature-workflow-user-help-doc} will have (file based, relative) clickable links to the help docs for each agent, which explain to the user how each agent works, in detail.

Use of these Help Docs:

- The user will be given the path to these Help Docs by the Agent while it is running the workflow. The 01 agent should introduce itself and tell the user to read the {add-feature-workflow-user-help-doc} in a markdown friendly tool (e.g. VSCode) for more information. Each agent after that should do the same and tell the user about its agent-specific help doc.
- The agent will also **read** the Help Doc to gain an understanding of what it is doing
- By default the Agent will be **succinct in order to keep the amount the human has to read to a minimum**.
- If verbosity=medium (the default is low), the agent will also read the Help Doc and then tell the user all about the reasoning behind the way the Agent is working, so the user can understand better what is going on (the user will usually only do this the first time they use the workflow).
- If the user at any point says “Tell Me More” the agent will re-read the Help Doc and then give the Human more details/background and explanation about what the Agent is doing - especially the current stage of the process.

In the following descriptions of each agent I point out what parts that should be documented in the Help Doc for the Agent, rather than in the main Command file. That will keep the main Command file **shorter and more focussed on the task** the agent has carry out.

## The Actual Typescript Workflow Program

I’m not sure yet how exactly the Typescript workflow program will work, but I think it will be similar to “create-workflow” one at:

.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts

but it will have more command line parameters that are provided and passed in to the first “01 - Ticket Creator” agent, which are currently the optional command line parameters:

- ticket-id
- verbosity

Also:

- agenticHqWorkspaceRoot - provided by the framework (not a command line parameter provided by the user)

If there is no ticket-id provided on the command line, then the Ticket Creator agent obtains one from the user (or generates one itself). This then has to be passed on to all the other agents. At the moment, there are no variables that those other agents generate that I want passed on as variables. Those values should be obtained from the specs/files produced by the previous agents (unless that seems like a bad idea and I change my mind).

So currently, the idea is that:

- command line parameter are passed in to the first agent
- the first agents processes these and may add further ones
- the first agent returns the “`allVariables`" string which are then used as inputs (same inputs) to all other agents (like in the create-workflow typescript program)
- The others agents just return “Command completed” with no variables and the typescript program ignores what they return (like in the create-workflow typescript program)

## Related Things For You To Read

I will be creating this add-feature workflow using the:

create-workflow

workflow. The 5 commands for this workflow

are at:

.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow

and include a number of specifications for how to create a new workflow.

*Some* of those specifications may contradict the plans in this doc. It’s **important** that these contradictions are highlighted in this doc, so that what gets produced in the final add-feature workflow is what I actually want.

## 01 - Ticket Creator

The Ticket Creator is responsible for attempting to split the feature into smaller Sub-Tasks and then creating the Ticket for the feature.

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> The idea is that the human can start this workflow without having properly defined or thought about what they want done, how to do it or even whether it’s a good idea. The Ticket Creator will work with them in this first stage of the add-feature workflow to work out whether the feature should be split into Sub-Tasks or done in one hit, and it will create a Ticket containing a very brief description of the feature and its requirements.
>
> It will help them work out whether it is small enough to be done easily, quickly and with sufficiently low complexity in one hit. If not it will recommend that the ticket becomes an Epic - which is just a pointer to a list of Sub-Tasks and the workflow will end after this Epic is created. The Epic is a bullet list of Sub-Task headers and Single Sentence Outcomes and after creation the user ends the current workflow and then runs each of the Sub-Tasks through the Add Feature workflow individually. Some of those Sub-Tasks may also then be split up into small Sub-Tasks themselves etc etc.
>
> The Ticket Creator includes a **mandatory** “Break It Up” stage which breaks the feature into smaller Sub-Tasks (first one often being a Tracer Bullet). The user will have the option of rejecting this split and continuing with it as one task. This step is mandatory because I agree with Martin Fowler who says “our best form of leverage” is “reduced cycle time” - which means smaller tasks are better.

### Ticketing System (To Be Detailed In Agent Help Doc)

As people use many different issue tracking systems for organising their work (Jira, Linear, GitHub and others) we will implement this workflow using the assumption that the developer uses an issue tracking system, but the AI doesn’t have a direct link to it (yet).

Instead tickets will be created and edited locally using a Ticket ID, which can be provided as the input to the workflow, or provided/generated at the start of the workflow.

As an example, I use Jira, so this would involve me:

- Creating a Jira Issue in my Agentic HQ project with e.g.:
    - Title: “DRAFT: Make CLI UI More Colourful”
    - Description: TBA (To Be Advised)
- Jira would auto-generate a new id in my AHQ project e.g. AHQ-123 and I would copy that and run the Agentic HQ CLI workflow by running the following in my terminal:
    - agentic-hq add-feature -- --ticket-id=AHQ-123

### Flow Of This Command

When the

- **01 - Ticket Creator**

agent is started it sets up the following list of variables (and more):-

ticket-id = provided by user as command line parameter (optional)

agentic-hq-workspace-root-dir = (parsed from input - see .agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md for example of how this is done)  
project-root = (your primary working directory)  
demos-plugin-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin

current-workflow-id = add-feature

current-workflow-skills-dir = {demos-plugin-dir}/skills/{current-workflow-id}

skill-resources-dir = {current-workflow-skills-dir}/resources

templates-dir = {skill-resources-dir}/templates

workflow-docs-dir = {current-workflow-skills-dir}/docs

developer-help-docs-dir = {workflow-docs-dir}/developer-help-docs

developer-help-doc = {developer-help-docs-dir}/developer-help-doc.md

workflow-help-docs-dir = {workflow-docs-dir}/workflow-help-docs

add-feature-workflow-user-help-doc = {workflow-help-docs-dir}/00-add-feature-workflow-user-help-doc.md

ticket-creator-help-doc = {workflow-help-docs-dir}/01-ticket-creator-help-doc.md

interrogator-help-doc = {workflow-help-docs-dir}/02-interrogator-help-doc.md

planner-help-doc = {workflow-help-docs-dir}/03-planner-help-doc.md

executor-help-doc = {workflow-help-docs-dir}/04-executor-help-doc.md

refactoring-planner-help-doc = {workflow-help-docs-dir}/05-refactoring-planner-help-doc.md

refactoring-executor-help-doc = {workflow-help-docs-dir}/06-refactoring-executor-help-doc.md

validator-help-doc = {workflow-help-docs-dir}/07-validator-help-doc.md

split-feature-template-file = {templates-dir}/split-feature.TEMPLATE.md

unsplit-feature-template-file = {templates-dir}/unsplit-feature.TEMPLATE.md

docs-directory = {project-root}/docs

tickets-directory = {docs-directory}/tickets

ticket-directory={tickets-directory}/{ticket-id}

workflow-files = {ticket-directory}/workflow-files

ticket-creator-directory = {workflow-files}/01-ticket-creator

prompt-file = {ticket-creator-directory}/01-A-prompt.md

ticket-file = {ticket-creator-directory}/02-ticket-file.md

research-files-directory = {workflow-files}/research-files

If ticket-id wasn’t provided as a command line parameter the Ticket Creator provides the following 2 options:

1. User Provides Ticket ID - user should create a ticket on their issue tracking system with “DRAFT:” at the start of the title and “TBA” in the description and provide the auto generated ticket id now. Or user can make one up and provide it (recommended format <PROJECT SHORT ID>-001 e.g. PROJ-001).
2. AI Searches And Increments - AI will search {tickets-directory} to find all the ticket ids, work out what the highest index is and increment the index by 1.

### The Kick Off Prompt

The AI creates a file at {prompt-file} with a:

- A heading “{ticket-id} - Kick Off Prompt”
- A sentence describing what the files contains (i.e. the kick off prompt that gets the whole add-feature workflow going)
- A placeholder section for the user to fill in.

and the user is told the relative file path asked to open and fill in the kick off prompt file.

They are told that this prompt shouldn’t be a complete spec, but just their initial idea(s) on the feature and any potential ideas they have about it, its requirements and how it could work. They must be told that typing Tell Me More will give them more info about this.

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> - Length - Prompt can be any length. It can be as little as 3 words e.g. “Make more colourful” or a 50 sentence brain dump. It’s up to them, but it’s advised that full details and planning about implementation are best left to the Planner who will work on them then.
> - Can optionally include: Whatever the user thinks would be useful or is on their mind. e.g.:
>     - motivation for the idea
>     - who’s going to find it useful
>     - what inspired it etc etc etc.
>     - initial ideas on the technical details
>     - ideas on what research to do
>     - ideas on whether this may be a bad idea or a good idea
>     - whether it maybe could/should be split into sub-tasks
> - The AI will attempt to split it up into sub-tasks (regardless of the size of the feature)
> - Example kick-off-prompt: *I’d like to make the CLI UI more colourful. Not sure how, but it’s a bit drab at the moment. I don’t know anything about CLI colouring, but maybe there are some libraries that could be used - or maybe it could be done natively (I prefer that option, if it’s nice and simple). Aim is to make it look more attractive and also make the different types of things (e.g. plugins, workflows, folder) use the same colour so the structure of the output is clearer to the user.”*

### The Initial Analysis

The AI reads the prompts and does the following:

- Looks around the code base and any previous relevant tickets or files to gain basic context about the feature
- If necessary/useful: Does researching (online or using Perplexity) to understand better the scope of the feature and what technologies/libraries could be used.
- If necessary/useful for scoping: Asks the user questions (limited to 3 quick questions and only related to creating the initial ticket, not about the details of implementation)
    - **UPDATE (recorded during the Stage-3 Agent-01 build):** these scoping questions must be **written into the `{prompt-file}` under a `## Quick AI Scoping Questions` heading** — a numbered list, each question with a placeholder for the human's answer — rather than only being asked ephemerally in the chat. This permanently records the questions **and** the human's answers, making them an **extension of the Prompt** that the downstream agents read (so nothing important is lost when the agent's context is later wiped). The AI then points the human to that section and **stops** to wait for the answers (skipping the stop if it has no questions). This mirrors how the Interrogator records its Questions For Human.

NOTE: It’s important that the Ticket Creator understands that we are *not* planning the implementation at this stage. We don’t want to duplicate that work here. We are just doing enough to be able to understand the requirements and scope of the feature and gain enough understanding to try to split the feature and create the final, basic ticket description. If verbosity=medium we should also tell the human this reasoning, otherwise it should just get on with (optionally) doing the research and asking the questions.

### Attempt To Split The Feature Into Sub-Tasks

No matter how small or simple the feature is the AI must make an **attempt** to split the Feature into Sub-Tasks. The human must understand that this is just to make sure they are always working on a ticket that can be done as **fast** and as **easily** as possible, without getting overwhelmed with complexity/problems (**remember**: tickets often mysteriously expand as you’re working on them due to unforeseen problems or complexities). The human is always allowed to reject the Split Suggestion and go ahead with doing it in One Shot.

The AI will split the Feature up into Sub-Tasks.

The aim should be to make the first (or one of the early) Sub-Tasks be a Tracer Bullet Task.

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> ### Tracer Bullet Feature
>
> A Tracer Bullet is a super-cut-down, skeletal version of the full Feature that does the whole thing end-to-end, but with minimal features. The idea behind a Tracer Bullet is to get feedback/learning as soon as possible, and to also have a working skeleton of the change to build additional changes onto in following tasks.
>
> An example of this could be:
>
> - Full Feature: Colourful CLI - Improve the entire CLI to be colourful with configurable colour schemes.
> - Tracer Bullet Feature: Change the colour of **just** the welcome screen text using **hard coded** colours.
>
> The Anti-Pattern here is to break the Full Feature into normal, sequential Sub-Tasks like the following, where we never get a fully running version of the system until all tasks are complete:
>
> - Implement a Config Subsystem
> - Implement the Colour Scheme Config Subsystem
> - Implement CLI pages to use the Colour Config Subsystem
>
> This doesn’t give us feedback about how the system works, how it looks or how the parts integrate until the last Task, which means we only learn once almost all the code has already been written (i.e. too late).
>
> Sometimes the first Sub-Task may not be a Tracer Bullet and instead be some kind of setup or research that then moves on to the main Tracer Bullet task.
>
> So, the AI should create a list of Sub-Tasks that this Feature work could be split into.
>
> Sub-Tasks must **not** be created as full tickets (or even short prompts). They must be limited to **only**:
>
> - Sub-Task Name e.g. “Tracer Bullet: Hard Coded Colouring Of Welcome Screen”
> - Sub-Task Single Sentence Outcome e.g. “The workflow listing screen text should be coloured so that entities that are of the same type (e.g. plugins, workflows, paths) are displayed with the same hard coded colour”
>
> The reason for strictly **hard-limiting** the Sub-Tasks to just a Name and a Single Sentence Outcome is:
>
> - We want the human to read **every word** of this list and agree with or fix it. If it’s too long, it will be skim read or not read at all.
> - We want to leave as much room as possible for change to the point when that Sub-Task is implemented using the Feature Workflow. That’s the place for detail, not here.
> - Critically - as we work through the Sub-Tasks we are **expecting (**[**and embracing**](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)**) Change.** This means that the Sub-Task list is likely to be changed around and editing and revised. If it’s short and sweet - it’s **much easier and much less effort to read and change**. We want to **minimise the cost of change** (I know about this very well from my Spike 00 where I wrote [very long and detailed specs **before coding**](https://github.com/Agentic-HQ/agentic-hq/tree/0d23b8f6ba37485c99eb9d72de130a133bb486c9/docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/planning-docs) and then spent hours and days confusing the AI with my changes to all the specs once I started coding and realising things had to be changed. The cost of change there was **extraordinarily high** and the process was very painful)
>
> For example for the “Colourful CLI” feature the list of Sub-Task Names and Sentences could be:

| **Name** | **Single Sentence Outcome** |
| --- | --- |
| Research And Assess Colouring And Config Libraries | Research Document containing Perplexity and Web research about what libraries we could use for colouring our CLI and whether a library is even a good idea, and details of potential Config libraries that would be good choices for storing colour schemes in. |
| Tracer Bullet: Hard Coded Colouring Of Workflow Listing Screen | The 3 entity types (plugins, workflows, paths) on the Workflow Listing Screen are coloured. |
| Implement Colour Scheme Config File | The colours on the Workflow Listing Screen are configurable in a Colour Scheme Config file that maps the 3 entity types to a colour. |
| Colour All Screens | The Colour Scheme Config file map entities to colours for all the pages in the CLI app and those pages use the mapped colours. |

If verbosity=low we don’t tell the human about all of this - we just do the splitting. If verbosity=medium or they say “Tell Me More” we tell them about the reasoning here.

### The Attempt At Splitting

The AI must attempt to split the story up into Sub-Tasks (see previous section). If it struggles to do this because the tasks is already small, simple and well contained then this is a sign that splitting may not be best option - **but the AI must still attempt it as best it can** (and then recommend that the split isn’t performed)

Once the AI has done the splitting it should assess the resulting Sub-Tasks vs the original Feature and choose one of the following options:

- Splitting Recommended - The feature was easily split into reasonable complexity Sub-Tasks and so should not be done as a single Feature but instead done as an Epic which is made of Sub-Tasks. If some of the Sub-Tasks still seem too large, that’s fine: when they are run through the Feature Workflow again they will be split further into Sub-Tasks at that stage.
- Splitting Not Recommended - The AI struggled to create multiple reasonably sized Sub-Tasks and so it’s recommended the human perform the Feature as a single Feature Task.
- Borderline - If the Sub-Tasks created seem OK, but may be a little bit trivial and there aren’t many of them (e.g. just 2) then explain why you can’t decide.

Once the AI has made this assessment then it should presents the list of Sub-Tasks to the human.

It should then do the following:

- If a clear recommendation has been decided on it should present a multi choice menu:
    - AI Recommended Option <THE OPTION> - <Single Sentence explanation of assessment>. ← This is the default option that if they hit Enter - it will do it.
    - <THE OPPOSITE OPTION> - If the human selects this they want to **override** the AI and go against its recommendation.
- If the AI assessment is Borderline it should tell the human why it’s borderline and say it doesn’t have a recommendation and present the options:
    - Split (Default if they hit Enter)
    - Don’t Split

The AI should remember the choice as a variable:

splitting-choice = (split|dont-split)

### The Ticket File

The ticket file is created at:

{ticket-file}

and its contents are determined based on whether it is being split or not (see next sections).

### Writing The Ticket - If Splitting

If splitting-choice=split then the ticket that is going to be written will have the following template file which is stored at:

{split-feature-template-file}

======START TEMPLATE================

```markdown
# {ticket-id} - EPIC: <Feature Name>

## Single Sentence Outcome

<What the outcome of implementing the feature will be - NOTE: Avoid technical implementation details if possible>

## Sub-Tasks

- HUMAN_REPLACES_SUB_TASK_TICKET_ID_HERE - <Name1> - <SingleSentenceOutcome1>
- HUMAN_REPLACES_SUB_TASK_TICKET_ID_HERE - <Name2> - <SingleSentenceOutcome2>
- …
```

**IMPORTANT**: Implementation and requirement details of Sub-Tasks are **not** stored in or considered in this Epic ticket. Only the Single Sentence Outcome and the list of Sub-Tasks. All requirements and implementation details **must** be stored in the Sub-Tasks ticket and **not** duplicated (apart from the Single Sentence Outcomes) onto this ticket.

======END TEMPLATE================

### Writing The Ticket - If Not Splitting

If splitting-choice=dont-split then the ticket that is going to be written will have the following template file which is stored at:

{unsplit-feature-template-file}

======START TEMPLATE================

```markdown
# {ticket-id} - <Feature Name>

## Single Sentence Outcome

<What the outcome of implementing the feature will be - NOTE: Avoid technical implementation details if possible>

## User Story

As A: <fill in person/role>

I want to: <fill in things I want>

So that: <fill in benefits I get as a result of getting the thing I want>

## Acceptance Criteria

<List of acceptance criteria - that must not limit the implementation, but define the outward facing behaviour of the system>
```

(NOTE: In future we may change these to a list of Acceptance Test definitions that are executable - see <https://www.youtube.com/watch?v=knB4jBafR_M&t=165s> )

**IMPORTANT**: This ticket must **not** include **any** details about implementation/code as those will be recorded in the Coding Plan later and will be discussed with the human **only** at that point. Duplication here will create **confusion** and **waste time.** If the human provided implementation/code pointers in the Prompt file then those will still be made available to the other agents, but those details should not be duplicated into this ticket.

======END TEMPLATE================

### Reviewing Ticket With Human

The AI should discuss the ticket with the human until the human confirms they are happy with it.

### Instructing Human On Next Steps

The next step depend on whether the ticket was split or not:

- Split - The AI must instruct the human to exit out of the workflow by hitting Ctrl-C multiple times and tell them that after doing that they should do the following for each Sub-Task in the list:
    - create a ticket on their ticketing system with the Name as the title and the Single Sentence Outcome in the Description
    - update the ticket file for this feature to replace HUMAN_REPLACES_SUB_TASK_TICKET_ID_HERE with the ticket number
    - run the add-feature workflow with the ticket number as a parameter.
- No Split - The Human should copy the ticket description to their ticketing system (if they are using one) and then just hit Enter to continue, which will continue with the workflow.

## 02 - Interrogator

The Interrogator’s responsibility is to work with the human to build up a shared understanding of the feature being built and fill in any holes in the understanding of what needs to be done and how it will be done.

The Interrogator uses the same list of variables (duplicated into this command) from the 01 command and some additional ones may be added.

### Variables

Some (not all) variables (added by this Interrogator stage, on top of the shared list from 01):

workflow-files = {ticket-directory}/workflow-files

interrogator-directory = {workflow-files}/02-interrogator

interrogation-summary = {interrogator-directory}/01-interrogation-summary.md

The Interrogator reads all the files from the 01 stage, including the initial prompt, the ticket produced and any other files.

The Ticket Creator researched the codebase and did Perplexity/Web research in order to work out roughly how much complexity was involved in doing the feature, and to work out how to split it, and then whether to recommend to split or not split.

Some of that research may have been recorded under `{research-files-directory}`. So **before doing any further research of its own, the Interrogator should check `{research-files-directory}` for research files left by the previous (Ticket Creator) agent** — there may be none, and what's there may or may not be relevant — list what's there, decide which (if any) are worth reading, read those, and only **then** decide whether further (optional) research is needed (so it doesn't repeat work already done).

The Interrogator must also research the code and do Perplexity/Web research but this time it does enough to then produce:

- **Summary Of My Understanding Of Feature** - the AI’s understanding of the feature and a high level view of what could be involved technically to complete the task (**WARNING**: This must ***not*** be a detailed plan because if it is then the human will learn to either skim read this, or skim read the plan created by the Planner in the next stage. We **MUST** keep this Summary reasonably high level so the human actually reads it **ALL** and spots any problems early before we move on to the Planner). This summary should show the human what the AI understands (so far) about the feature being added. Things like (but not limited to): what it will change about the functionality and/or the structure/code of the system and what value that adds, how it could be implemented (**not a full plan,** just roughly what it could involve doing). The summary should include a “Testing” subsection that summaries the automated and manual tests that the AI thinks should be done (the AI should be encouraged in the command to include details of e2e tests if applicable and unit tests, at a minimum. If the prompt/ticket don’t mention any tests, the AI can include questions (see below) asking about tests with details of its recommended tests). Underneath the Summary Of My Understanding Of Feature there should be the following sub-section:
    - Testing (see above)
    - Human Comments On Summary Of AI’s Understanding Of Feature - this acts as a placeholder for **optional** comments from the human to provide clarification/correction. The human should be encouraged to also place their comments inline, on new lines in the summary using “HUMAN:” as the identifier (The AI will be instructed to check for these comments when it reviews the Human’s answers).
- Questions For Human
    - This section contains a numbered list (Q1, Q2) of Questions. Questions should:
        - Include details of the options (A), (B)… if applicable. See Question 2 on docs/jira-docs/AHQ-104/workflow-files/ai-summary-of-jiras-and-questions-for-human.md for an example of this.
        - If the AI has a preference, mention it in the Question.
        - **Human’s Response (“Yes” means go with AI’s preference)**: - leave this as just the label (with a trailing space) for the human to type their answer directly after — **no** placeholder text for them to overwrite (quicker and easier).
    - NOTE: This format has successfully been implemented and followed in the Jira TDD Story Workflow at:
        - .agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md
        - For an example see: docs/jira-docs/AHQ-104/workflow-files/ai-summary-of-jiras-and-questions-for-human.md
- Perplexity/Web Research Done
    - A section containing a quick summary of any Perplexity / Web Research done and the findings and the relevance to the Feature.
    - If Perplexity research was done manually (i.e. using the human as the copy/paster) the file containing the Question for pasting into <https://perplexity.ai> and the placeholder for the answer should be in {research-files-directory}/<index>-<subject>-Perplexity-Manual-Research.md and summarised and referred to in this section. Perplexity MCP research (automatic) should **also** be recorded, with the full Question and Answer in: {research-files-directory}/<index>-<subject>-Perplexity-MCP-Research.md and summarised and referred to here
- Code/Files I Reviewed
    - A section containing a list of the files reviewed and a sentence summarising the file and its relevance to the feature (just a sentence per file).
    - The code/files reviewed should be ordered by relevance and each sentence should be followed by one of the following:
        - Relevance: (HIGH|MEDIUM|LOW|NONE)
    - NOTE: The human is not expected to review this list, but they can if they are curious. Its main point is that it can save time/effort for the Code Planner agent who can read it and get helpful pointers to what **may** be most/least relevant.
- NEW: Re-Split Decision (*ONLY AFTER ALL QUESTIONS ANSWERED AND CLARIFICATIONS DISCUSSED)
    - This is a **new** section. Only once the AI and Human have worked through this feature and uncovered any additional complexity/work, this should be the final stage before command completion.
    - If a lot of additional complexity/uncertainty (a sign of this can be lots of questions (>= 5) and lots updates/discussions about the technical aspects), then the AI should consider:
        - Whether the complexity of this feature is now great enough to recommend re-splitting it.
        - What Sub-Tasks it would re-split the Feature into, using the “Walking Skeleton”/”Tracer Bullet” first-Sub-Task technique — a minimal end-to-end first Sub-Task, then Sub-Tasks that put meat on the bones of that skeleton (or shoot real bullets that follow that initial [Tracer Bullet](https://en.wikipedia.org/wiki/Tracer_ammunition)!!!). **This splitting guidance is baked _inline_ into the `02` command (a cut-down reminder) and its help doc (the fuller version) — the runtime agent must NOT be told to read the separate “01 - Ticket Creator” command (a cross-command runtime back-reference the self-sufficiency rule forbids).**
    - This section should either:
        - Summarise why the feature is still considered low complexity and require minimal work, and can easily be covered by one simple set of tests (e.g. 1 e2e test and 1 set of unit tests)
        - or:
        - Justify re-splitting and provide the potential list of Sub-Tasks (see above).
    - In the Command this is the **last stage**: the AI writes this section and then **branches asymmetrically** — it must **not** hassle the human with a survey when there is nothing to decide:
        - **If the AI concludes the feature should NOT be re-split** (the common case) — it simply **records that decision** in the document (summarising why it remains low complexity) and **moves on**; it does **not** present any menu/choice to the user.
        - **If the AI concludes the feature SHOULD be re-split** — it documents the planned re-split (the proposed Sub-Tasks, see above) and **only then presents the choice** to the user in the interactive chat:
            - (1) **Split** (recommended by the AI) — the **default / pre-selected** option
            - (2) **Don’t Split**
    - If the user chooses “Don’t Split” (overriding the AI’s recommendation to split) - the AI records the decision in the document and the workflow continues
    - If the user chooses “Split” - the AI updates the original ticket (written by the “01 - Ticket Creator” stage) into an **Epic** describing the Sub-Tasks, writing it from the **split-feature template** (`{split-feature-template-file}`) **directly** — it does **not** read the “01 - Ticket Creator” command (the Epic format + template path are baked inline into the `02` command). It then updates the Summary file to record the decision and the change made to the original ticket file, then tells the user to Ctrl-C multiple times out of the workflow and start working on each of the Sub-Tasks as individual Features using the add-feature workflow.

The AI produces all of the above, and then prompts the human to review the file and answer the questions and then the AI **stops** and waits for human to say it has done it.

The AI must:

- Review all the answers
- IMPORTANT: Keep the questions and answers in place and unchanged (don’t delete them or replace with a summary)
- Update the Summary with any new information based on answers
- Discuss anything still not clear with the human and clarify it.
- Add a Summary Of Discussions section containing a summary of any discussions/decisions that came out of the discussions with the human. *Don’t* duplicate the information in the main Summary section or in the Questions/Answers.
- Ask the human to review the final file and wait for Approval to continue on to the Planner agent and **STOP** and wait for their response.
- Once approval obtained, end this command by terminating.

## 03 - Planner

The Planner is responsible for working with the human to generate and finalise the Implementation Plan.

### Variables

Some (not all) variables (added by this Planner stage, on top of the shared list from 01):

workflow-files = {ticket-directory}/workflow-files

planner-directory = {workflow-files}/03-planner

implementation-plan = {planner-directory}/01-implementation-plan.md

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> The Implementation Plan is a document containing all the details of the plan for the tests, code, documentation and any other artefact that the Executor (the next Agent) will generate. (NOTE: documentation and code changes that aren’t driven by tests will be listed in their own section in the Implementation Plan which the Refactoring Planner then picks up and plans in detail later. Only **tests and code driven by the tests** will be planned in full by this Planner agent).
>
> Crucially the Planner is not allowed to generate any of these artefacts itself, only the Implementation Plan (and any supporting planning related documents). All the context that it builds up in its memory during planning has to be lost when the agent finishes (by design). At first this may seem like a bad idea, because the conversations between the human and the AI could seem very useful for actually carrying out the implementation. But often those conversations go through various topics and options, and end up settling on one outcome/decision/realisation. This final outcome/decision/realisation is really the **only valuable information we need the Executor to have**, and we want all the other stuff **ditched**, so that the context is as clean (compressed) as possible for the Executor.
>
> Apart from this desire for the Executor to have **only the context it needs** there is another, important reason for forcing the Planner to write down everything that the Executor will use to execute the plan. This is because it forces the AI to store every important decision that the human and AI discuss onto disk, in the Implementation Plan file. Without this restriction the human and AI could discuss something important and that decision (and the reasoning behind it) are stored only in the context and then used to implement the feature - and then the context is wiped and that crucial information is lost for ever. Forcing the plan to be written into files, together with reasoning behind those decisions, ensure this crucial information is retained and committed with the code change. A later AI/human can find the exact git commit the code change was made in, and then read the Implementation Plan to understand the full “why” and “how” of the change.
>
> So the Planner's job is to compress into the Implementation Plan everything of use that the Executor will need (apart from, obviously, all the code that the Executor reads again to understand what its going to change), as well as some explanation (not too much!) for a future reader to understand the reason for decisions and the changes being implemented.

### Use Of Appendices For Additional Reasoning/Discussion/Background Information

The Implementation Plan document will consist of:

- The Main Section
- Appendices (at the end)

> WARNING: Too much information in the Main Section of the Implementation Plan document will make the human **skim read it**. That is a **bad** thing because we want the human to feel like it’s worth them reading the whole Main Section properly. To help keep the document short we should watch out for any long/complex reasoning of decisions and move those into the Appendices at the bottom of the document. The main section of the document should have a summary of any planned change and any bits about reasoning should be a quick summary, with an optional link to an Appendix if more detailed reasoning/discussion should be documented for the next Agent or future humans/AIs. The key thing to understand here is that the human **just had this discussion with the AI** and so they will feel it’s a waste of their time having all the reasoning explained back to them. They only want to know that the decision has been recorded accurately, so that the Executor will make the right changes and have a reasonable understanding of the reason for those changes.
>
> This means the human can then happily read the **entire**, short Main Section of the document to confirm the plan looks good, and **skim read** the Appendices to confirm that the detailed reasoning is documented (which the Executor may find useful as it gives it additional understanding, and future humans/AIs could find **very** interesting as it will explain why the change was made in this way vs another way).

### Background Reading

The Planner has to read into its context all the files from the previous stages to understand what’s been learnt and decided so far, and then, obviously, do any additional reading of the code or perform web/Perplexity research if there’s any final things it’s not sure about.

### Testing - TDD As Default

The Planner should tell the human that it’s going to use TDD as a default mode, and explain that this means writing a minimal set of tests first, then writing the minimum code required to pass those tests (without doing anything to make the code “good”). Improving the code to make it “good” - i.e. better for the long term **must** be left to the Refactoring agents.

If either the human or the AI spot ways in which the code could be improved/refactored - but are not “minimal” implementations they should put:

REFACTOR:

notes in **both** the plan and as comments in the code.

The Refactoring planner will be greping all documents and all implemented code for this label and then including those refactors when it decides whether/what to refactor later.

**Non-TDD Option:** The human should be informed that if they want to use a different testing methodology, they should just instruct the AI to modify this Planner agent command on disk **for them — the human does not hand-edit the command file themselves** — and then have the AI reload from the edited file and continue the workflow.

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> This TDD methodology is being used and is thought to be effective for AI coding workflows because:-
>
> - AI Coding Specific Reason: If AI is left to its own devices it will often:
>     - Write too many tests, many of which are useless/redundant/gold plating. Forcing it to write a simple, minimal set of tests first makes it focus on only writing tests that will drive (i.e. force into existence) the code. Too many tests causes problem - the main one being the human skim reads them before committing. Minimal tests get the human’s attention and interest: “Does this small set of tests really cover and drive our implementation”?
>     - Write too much code. If it’s not directed to **only** write enough code to make the tests pass the AI succumbs to temptation to add features or “nice to have” elements to the code, or include elaborate mechanisms for solving the problem.
> - If we realise we need lots of tests and it’s overly complex writing them all, that’s a “smell” that our Feature is too large and should be broken down into Sub-Tasks.
> - If we find it’s hard to write tests for the feature, then that shows our code isn’t modular enough to be testable. Stopping the implementation and refactoring to make it easier to test is an option here. If we skip the tests at this stage we are building up technical debt (which is fine for now, but we’ll pay for it in the medium term as our system gets harder and harder to change).

### For The Future (NOTE: Don’t Include This In any of the Agent Commands - just leave it in this Workflow Planning Document)

This workflow is not a “purist” TDD workflow - as it doesn’t force a single test per cycle. That’s because the cycle currently has too much overhead to make that feasible. This may be addressed in future version by adding a tiny, fast “sub-workflow” for each RED-GREEN-REFACTOR cycle.

It’s also not purist in that the Planner gets to work out what code it wants written when it knows all the context and understands the entire plan.

A purist implementation of TDD would **hide** from the GREEN implementing agent everything except the failing tests and the most minimal context explaining the point of the work it’s about to do. Its job would then be to do **absolutely** and **only** what gets the tests to pass. Once it has got the tests to pass the ball would be passed back to the Test Planner again and the question asked “Did your tests force the implementation agent to completely implement the feature?”. If the tests were not enough to force the implementation, then the Test Planner has to plan some more tests and the cycle continues. Only once the RED-GREEN loop has been done to the point where the tests and the code minimally implement all the requirements do we move on. This is a game that is used by human in Pair Programming and can be a fun way to do TDD and build up tests that only exist because they forced code into existence (and so are always relevant) and code that only exists in order to satisfy tests (and nothing more).

This is a great way of forcing the tests to fully **drive** the implementation and for no code to be written without a test that forces that code into existence. But it’s complex and forces many cycles, and so I’m going to leave it for “The Future”…. 🙂

### Appendix A - English Language Description

This is something that I found useful to help me and the AI create entities/objects/relationships in the code with good names, and get a good understanding of what the plan is, and whether it has any gaps or problems.

The instruction for the agent that was put in:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/02-jira-write-failing-test.md

is as follows:

Write a paragraph describing how the system will work, walking through the main scenarios step by step (start to finish). Use class/interface names **bolded** and *italicize* ONLY verbs that represent actual method calls between objects (e.g. *getWorkflowListingString*, *registerWorkflowsWith*). Do NOT italicize narrative verbs like "creates", "checks", "delegates to" — those are plain text describing flow, not method names. ANTI-PATTERN: "*delegatesToAWorkspaceImpl*" — this is narrative, not a method name. Correct: "delegates to a **WorkspaceImpl**". PHRASING: Use "asks X to *doThing*" not "asks X for its *doThing*" — reads more naturally as English. See `docs/dev/project-design-requirements.md` for full ELD formatting rules. Example English Language Description:

- "When the user runs `agentic-hq list`, the CLI asks the **WorkflowSearchResults** to *getWorkflowsListingString*. The **WorkflowSearchResultsImpl** prints an 'Available workflows:' header, then tells each of its two **Workspace**s to *getWorkflowListingString*. The **AhqWorkspaceImpl** creates a **WorkspaceImpl** with 'Agentic HQ Workspace' as the display name and delegates to it. The **WorkspaceImpl** prints a workspace header, then scans for plugin directories. For each plugin found, it creates a **PluginImpl** and tells it to *getPluginListingString*. Each **PluginImpl** creates a **PluginDirectoryImpl** and tells it to *findWorkflowFiles*..."

This English Language Description is useful for the human to review for many reasons:

- It gives us a quick and easy to read description of what the planned system will be doing.
- If it *doesn’t* read very naturally that gives us an indication that maybe we (or the AI) doesn’t have a good understanding of what the system does, or that we can improve the naming of the entities and methods to make is read better (NOTE: If we are creating these entities/method now we should change them in this plan. If the entities/methods are existing ones we should add a section to the REFACTOR heading for the Refactor Planner to consider later)
- If we see **things** that aren’t in **bold** it makes us realise maybe we need a new object/abstraction that is currently missing
- If we see *actions* that aren’t in *italic* that makes us realise that maybe we need a new method that is currently missing.

### Appendix B - Project Design Requirements Compliance Audit

This is to ensure and audit the agent is following whatever project design requirements are in place for this project.

If `docs/dev/project-design-requirements.md` file exists locally in current workspace that must be used - otherwise the user must be asked whether they want:

- Create one and put at `docs/dev/project-design-requirements.md` in the local workspace and continue
- Use the Agentic HQ Typescript Object Oriented design requirements at {agentic-hq-workspace-root-dir}/docs/dev/project-design-requirements.md.
- Don’t do an Project Design Requirements Audit

Create an audit table of all of the Design Requirements with the following columns:

- Design Requirement ID - E.g. D.1.
- Relevant? - Yes / No - and a few works on why.
- Plan Section Addressing Requirement - the ID(s) of the section in this Plan that addresses this requirement (if relevant). N/A otherwise.
- How Requirement Met - How the plan meets this requirement (if relevant). N/A otherwise.

### Appendix C - Acceptance Criteria Audit

A table listing all the Acceptance Criteria defined in earlier stages with details of which sections of this plan satisfy those criteria and how.

### The Process For The Planner

The process is:

- Gather information
- Create Implementation Plan, with sections indexed by Step number, which includes:
    - Step 1 - Write Tests - Detailed plan for writing minimal tests that will force/drive the implementation (but nothing more!). Subsection for each test type e.g.:
        - 1.A. - E2E Test
        - 1.B - Unit Tests (could be multiple?)
        - 1.C - Integration Test (if applicable?).
        - 1.D - Manual Test (avoid these, but if automation isn’t possible…)
    - Step 2 - Run Tests Before Code Changes (RED) - A concise list of the above tests that must all give RED (failure) including any manual ones (if not all are automated).
    - Step 3 - Write Code - Plan for writing the code that must do nothing more than get those tests to pass (leave other stuff for Refactoring, including Docs and other artefacts). Can include excerpts of the changes for the key parts with explanations for those changes.
    - Step 4 - Run Tests After Code Changes (GREEN) - Plan for running the tests that must all give GREEN (success) - should refer back the same list of tests run before.
    - Appendices:
        - Appendix A - English Language Description - see above
        - Appendix B - Project Design Requirements Compliance Audit - see above
        - Appendix C - Acceptance Criteria Audit - see above
        - Appendix D - List For Refactor Planner - a list of items we **don’t** want the Executor to do, but know we want the **Refactor Planner** to consider (e.g. name changes in existing code, documentation, other things in Acceptance Criteria not forced into existence by the tests).
- Then iteratively:
    - Tell the human the plan is ready
    - Ask them to review and either put “HUMAN:” comments inline or discuss interactively.
    - Keep iterating and check “HUMAN:” commented until the human gives explicit Approval of the plan and confirms that and all comments have been addressed. At this stage mark the Plan as Approved and end this Planner agent.

### Important Notes (End Of Command) — recorded during the Stage-3 Agent-03 build

The Planner command should **end with a short `## Important Notes` section** (placed last, after Write Output / Self-Terminate, as a pure reference block — not a numbered Step). This mirrors the `## Important Notes` sections that close the Full Jira TDD Story commands (e.g. `03-jira-minimal-implementation.md`): a handful of bulleted do’s/don’ts that crystallise the rules a busy agent is most likely to skim past. For the Planner these are (at least):

- **Plan only — generate NO code or other artefacts.** The Planner writes the Implementation Plan (and supporting planning docs) only; the Executor turns it into working code.
- **Minimal tests** — only enough tests to force the feature into existence, no more.
- **Minimal code** — the planned code must do nothing beyond making those tests pass; improvements are deferred to the Refactoring agents.
- **TDD by default** — Write Tests → RED → Write Code → GREEN. For a different methodology, the human **asks the AI to modify this Planner command (`03-planner.md`) for them** (the human does not hand-edit it); the AI edits it, reloads, and continues.
- **`REFACTOR:` notes** — anything good-but-not-minimal is recorded as a `REFACTOR:` note in **both** the plan and as a code comment, for the Refactoring Planner to grep later.
- **Keep the Main Section short** — push long reasoning into the Appendices so the human reads the whole Main Section.
- **Human approval gate is mandatory** — never finish without the human’s explicit approval of the plan.

(This is an Agent-03-only decision for now; whether the other agents’ commands should each gain a tailored `## Important Notes` block is left open — the built `01`/`02` currently have none.)

## 04 - Executor

The Executor’s responsibility is to execute the Implementation Plan, handle any unexpected problems, document the execution and obtain approval from the human before completing.

There isn’t very much interaction with the human during this stage, but the human is expected to:

- Track what code is getting generated and see if it’s what they expected and whether they like it. If they don’t they can either:
    - Put a “REFACTOR:” comment in the code that will be picked up by the Refactor Planner
    - Stop the agent and tell them how they want it done differently (the Agent should also add an update about the change/correction to the Implementation Plan)
    - Wait until the Approval Gate for this command and explain the problem then.
- Do a quick review of the Execution Document (detailed reading isn’t required as this is mainly for future AI/humans to reference).
- Approve the implementation if they are happy with it.

As with all the commands the Executor has to initialise all the variables and read the files from the previous agents to help it understand what it needs to do and the context for the feature implementation.

The key file is the Implementation Plan (including all Appendices) and any documents explicitly referred to by that Plan.

If there are lots of large additional documents (e.g. lots of Perplexity Research documents) that are not referred to explicitly by the Plan, the Executor can skip reading them if it wishes.

Once the Executor thinks it is ready to start coding it must:

- Confirm it has read “Appendix B - Project Design Requirements Compliance Audit” and that it understands exactly how to satisfy all these requirements (if it doesn’t it must STOP and ask the human for guidance).
- Confirm it has read “Appendix C - Acceptance Criteria Audit” and that it understands exactly how to satisfy all these requirements (if it doesn’t it must STOP and ask the human for guidance).

(no need to stop to get human’s approval to continue if all the above have been satisfied).

The Executor must then follow the Steps in the Implementation Plan in order.

Some of the variables:

workflow-files = {ticket-directory}/workflow-files

executor-directory = {workflow-files}/04-executor

execution-document = {executor-directory}/01-execution-document.md

The Execution Document {execution-document} will contain the section for each Step of the execution and an Brief Summary Of What Was Done at the end.

The AI must be instructed to fill in the Execution Document **as it executes** and not at the end (this is because compaction could occur at any time, wiping out the memory of what it did). This means that after every Step it must:

- Add a new section to the Execution Document
- Summarise what it did (including any details of deviations from the plan or interesting additions) for that Step
- Move on to the next Step.

### If Problems Are Hit

Often the Implementation Plan is incomplete or incorrect and so when the tests or code are written and executed a problem/bug/inconsistency is found. This is to be expected, but it must be handled carefully.

**The anti-pattern** - often the AI will think that its job is to try to work around the problem, and change things (including doing something different from what was in the Implementation Plan) to get things working in the way it thinks the system should work. This could involve downloading and installing an alternative library, or refactoring a whole set of existing code to get things working. The human **doesn’t want this**, because they could be off making a cup of tea and come back to a code base that is a mess, with half the changes being ones they expected and the other half being ones they didn’t expect and (possibly) didn’t want.

**The correct way** - If the Implementation Plan won’t work then:

- Investigate the problem as far as possible **without changing things**
- Come up with a plan to either fix things by doing things differently, or investigate further by making changes (which require human approval)
- Document the problem in a new section under Problems Hit with details of the problem, a suggested solution, and a placeholder for the human to fill in their feedback.
- **STOP** and summarise the problem to the human, point them to the document section and wait for them to fill in the section and let you know.
- Once told, discuss the change with the human and then if there is a fix to the plan, add an update to the original plan (may involve deleting incorrect bits), get approval for the updated plan from the human and then continue with the implementation.

### The Approval Gate

After completing all the Steps the Executor must write a brief summary of what was done to the human in a section called:

Brief Summary Of What Was Done

and output that section to the human and ask them to review:

- The tests and code
- The execution document

and either type “Approved” or discuss anything else with the AI.

This repeats until the AI get an Approved from the human, at which point it:

- Adds a status to the bottom of the docs “Status: Human **APPROVED** implementation. Moving on to Refactoring agents…”

and completes.

### Important Notes (End Of Command) — recorded during the Stage-3 Agent-04 build

Like the Planner, the Executor command should **end with a short `## Important Notes` section** (placed last, after Write Output / Self-Terminate, as a pure reference block — not a numbered Step), mirroring the `## Important Notes` sections that close the Full Jira TDD Story commands: a handful of bulleted do’s/don’ts that crystallise the rules a busy agent is most likely to skim past. For the Executor these are (at least):

- **Execute the approved plan — don’t deviate silently.** Follow the Implementation Plan’s Steps in order; if it won’t work, STOP and document the problem rather than quietly doing something else.
- **Document the Execution Document as you go**, not at the end — a section per Step, written the moment the Step is done, because compaction can wipe the agent’s memory at any time.
- **If a problem is hit, STOP and document it** in a `Problems Hit` section and wait for the human. Never work around it, install a library, or mass-refactor existing code to force it through.
- **Minimal code only** — just enough to pass the tests; anything good-but-not-minimal becomes a `REFACTOR:` note in **both** the code (as a comment) and the Execution Document, for the Refactoring Planner to grep.
- **The human approval gate is mandatory** — never finish without the human’s explicit “Approved” of the implementation.

(Agents 03 and 04 now both close with a tailored `## Important Notes` block; whether 05–07 each gain one is decided per-agent at its build gate. The built `01`/`02` currently have none.)

## 05 - Refactoring Planner

The Refactoring Planner is responsible for planning the refactoring in the Refactoring Plan document which is then executed by the Refactoring Executor (the following Agent).

### Variables

Some (not all) variables:

workflow-files = {ticket-directory}/workflow-files

refactoring-planner-directory = {workflow-files}/05-refactoring-planner

refactoring-plan = {refactoring-planner-directory}/01-refactoring-plan.md

refactoring-plan-template-file = {templates-dir}/refactoring-plan.TEMPLATE.md

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> ### A Comment On The Power Of Refactoring
>
> The main complaint about AI coding that I’m seeing on YouTube is that it’s just not that good.
>
> I can see the point, but I think the people saying this are missing something fundamental. Someone got close when they said that humans “care” about the quality of the code going into the system, because they are likely to be there 6 months later when it has become harder and harder to change. They noticed that the AI doesn’t seem as concerned about the long term, structural quality of the overall system. The AI’s focus is almost entirely on getting the one task they have been given done, and done fast. That makes sense because if AI by default wrote code using 10 times the tokens it does currently it would suddenly seem 10 times more expensive per feature, and 10 times slower.
>
> Another factor is that AI, on its own, may not be that good at assessing how hard to understand a set of code is, or how badly structured. It may not be that good at seeing ways of simplifying the code. Humans could be quite good at that, in comparison. It’s not a good selling point for the LLM providers to say “Our models can churn out code real fast, but you’ll need humans to help keep the code from becoming painfully complex and messy”. But maybe that’s the current state of things? Maybe we’re still at the stage where the formula (human+AI=sustainably growing system) is the one that we need to use? Maybe we haven’t quite reached the “Dark Factory” stage where humans aren’t required to write a well designed system?
>
> So, in summary, AI doesn’t have the same motivation to constantly simplify and improve the system, and it also may not be that good at it compared to humans.
>
> For that reason, I’m adding a new option to this refactoring agent which attempts planning a large, structural refactoring (which can be rejected by the human). This will cost a lot of extra tokens and time, but as every experienced software developer knows: if you don’t pay off your technical debt you’ll usually end up regretting it…

### What Gets Done In Refactoring Stage

As well as code refactoring we do some additional things in this stage:

- Documentation and other artefacts that aren’t driven by tests. As there are no tests to drive documentation we don’t do that during implementation stage, and so it gets deferred to this Refactoring stage. These gets put as suggestions under a new Documentation section (see below).
- As we are keeping our tests and the implementation driven by those tests to their **absolute minimum** in the Implementation stage, any untested requirements or improvements have to be deferred to this Refactoring stage. An example of this would be that the simplest/easiest/quickest way of getting a test to pass was to put the variables in an array and sort them, but during the coding we realised it would be better to use an existing CustomQueue class in the codebase to do this. The simplest code still gets written in the previous stage and a “REFACTOR:” comment or note gets written so we consider the Refactor at this stage.

### Suggest Large Refactor Option

The add-feature workflow will have an optional command line parameter called:

suggest-large-refactor

which defaults to “false”.

To make it clear this is an option, we’ll include it in the command line docs with its value set to false (the default):-

```
agentic-hq add-feature -- --suggest-large-refactor=false --ticket-id=PROJ-123
```

This will make it clearer to people that it’s an option and they are then more likely to see it and try it out one time by setting it to “true”.

If the person runs the workflow, but realises they forgot to change this to “true” they can add the following line in the Ticket:

```
suggest-large-refactor=true
```

and the Refactoring agent will check for it there as well.

### If suggest-large-refactor=false

If it’s set to false the Refactoring Plan will include a **short** “Large Refactor Suggestion” section, placed **last** (after the Refactor Suggestion List — it is the final section of the plan). It must be **brief** and must **not** ask the human for any further input — no “AI Recommendation”, no “Your Decision”, no “Comments” placeholder — because there is nothing to decide when the option is off. It simply notes the option was false and recommends enabling it for **some** tickets to pay off technical debt, plus how to opt in.

The canonical wording for this OFF block lives in **one place only — the refactoring-plan template** (`refactoring-plan.TEMPLATE.md`, under its `## Large Refactor Suggestion` heading). The Refactoring Planner command does **not** reproduce that text; it instructs the agent to **copy the template’s block into the plan verbatim — exactly as written, word for word** (no paraphrasing, rewording, expanding or shortening). Keeping the wording in a single source of truth is deliberate: when the agent paraphrased a command-inlined copy, the output drifted from the intended form. The agreed short form (as it appears in the template) is:

```
suggest-large-refactor = false

Recommendation: consider enabling this for **some** tickets to pay off technical debt.

To change your mind add `suggest-large-refactor=true` to the ticket and let the AI know.
```

(If the human later edits the ticket to add `suggest-large-refactor=true` on its own line and informs the AI, this section is regenerated as a real Large Refactor Suggestion — see the “If suggest-large-refactor=true” subsection.)

> **INFO**: The reason for setting the **suggest-large-refactor** option to **false** by default is that it will add significant additional overhead to the workflow, which then encourages people to avoid splitting tasks into much smaller features, which contradicts the idea of having short, low-complexity features. This is a tension that will have to be worked on over time.
>
> **FUTURE**: Hopefully in the future we can combine a longer workflow that has the **suggest-large-refactor** option defaulting to **true** with multiple, high velocity, simplified RED-GREEN-REFACTOR smaller cycles that don’t.

### If suggest-large-refactor=true

If suggest-large-refactor=true then the

Large Refactor Suggestion

section should have details described in this section.

During the Refactoring stages I’ve done before I’ve noticed the agent almost always focusses **only** on refactoring the code that has been added by the current changes. This actually misses the main benefit of refactoring which is to identify the opportunities that exist in the existing code (combined with the new code) for changing the structure of the system to either:

- simplify it (reduce [accidental complexity](https://en.wikipedia.org/wiki/No_Silver_Bullet))
- or make it easier to understand/change for future developers

We obviously want to limit this to code that is at least **related** to or involved in the current change (we don’t go off and refactor entire subsystems that are unrelated to the change).

> **If verbosity=medium or they type “Tell Me More” the AI should tell them the following, which is detailed fully in the Help Doc:**
>
> This Large Refactor is not a simple/easy thing to do, since it involves looking at the structure of the system around the code we are changing and seeing whether we find it overly complex or hard to understand. If we analyse the structure and the naming and find it doesn’t really correspond well to what we know the system is doing, then this is an opportunity to refactor.
>
> The best example of this is when we add a new feature, stand back and look at how the system works and realised we have just added more complexity to a “rats nest” of intertwined and hard to understand logic and relationships. Anything that seems messy or hard to understand automatically qualifies for a possible refactoring - because (even if it’s very hard to do) it’s always possible to decompose what the the system is trying to do, untangle and rename dependencies and create simpler and more easy to understand abstractions. Ideally, if you understand what the system is trying to achieve well you should be able to look at the code and each component is easily and simply described by its entities and the relationships between them (indicated by the method calls). Any one entity or component that takes a lot of complexity to understand/describe is an opportunity to “push” some of that complexity away into new objects/abstractions and thereby make that entity/component much simpler to describe in terms of the new objects.
>
> AI has enough power/intelligence to do this pattern matching and structural work, but won’t do it voluntarily, since its job is to “get the task completed”. It won’t even do it if you try to explain to it what good refactoring “is” and ask it to do it - because it will find the easy ways of refactoring and go ahead and do them (extract method, rename variables, extract class if you’re lucky???).

So in this stage we force the AI to suggest a large, structural refactoring by getting it to do the following explicit stages, one at a time, and document each one:

- Identifying a set of code, which will will call the “Set”, which forms a structure surrounding (and including) some part of the change that was made (either a subsystem or group of classes/files that work together in a coherent way).
- Describing the structure and relationships within that Set, including which files are involved.
- Giving the Set a score out of 10 for simplicity - and a comment
- Giving the Set a score out of 10 for understandability (good naming of entities and good naming of relationships in the form of methods) - and a comment.
- Giving the Set a score out of 10 for each of the entities in terms of how well it meets the Single Responsibility Principle (SRP)
- Giving a combined score for the Set - and a comment on this Set of code.
- Coming up with a suggestion for how this code could be improved so that, for example, it is:
    - Easier to understand (naming of relationships/entities etc)
    - Simpler
    - Better decomposed (so one complex object pushes complexity out to existing or new abstractions)
    - Composed of entities which better obey the Single Responsibility Principle
- **Obligatory** - The AI must highlight the aspects of the suggested refactoring that it is not sure about and about any alternative options that could be considered, and ask the human for advice on this (humans may be better at simplifying complexity??? - This is an example of the **AI/Human Teamwork**/**Collaboration** that we are aiming for in this Workflow**)**

The AI should assess the amount of risk/work involved in the change vs the benefit and the improvement in the code and the reduction in technical debt.

If the change is **large and complex** the AI should recommend that it produces a prompt file which can be used to drive the next “add-feature” workflow where the feature is purely this refactoring work, rather than completing the refactor as part of this ticket. If the change is not too complex/risky the AI should instead recommend that the refactoring get done now.

The AI should assess the refactoring it has suggested and then either:

- Recommend it is done now (not too large/complex)
- Recommend it be done in a separate Refactoring ticket once this feature is committed
- Recommend that the refactoring isn’t worth doing at this stage because, in its opinion, the work and risk outweigh the benefits.

It should leave a placeholder for the Human to feedback with choice:

- now
- ticket
- reject

and an optional comment.

> **REFERENCE**: See 6 mins 50 seconds in at:
>
> <https://youtu.be/-vPlLwtVU5g?si=EmzKcfmCfgXtHD4z>
>
> for an example of where a Large Refactor Suggestion could have helped the Claude Code developer - the 3,167 line print function in the leaked Claude Code source code.
>
> Original article: <https://www.youtube.com/watch?v=-vPlLwtVU5g&t=410s>

### The Refactor Suggestion List

The main content of the Refactoring Plan is the:

“Refactor Suggestion List”

section, which contains a list of Refactor Suggestions. This comes **first** — it is the one list the human reads and approves. The “Large Refactor Suggestion” section is placed **last**, after this list — it is the final section of the plan.

The AI must search through the following looking for “REFACTOR:” strings:

- the tests, code and docs that were changed
- all the files written so far (all under {workflow-files})

and understand what each one is are related to.

Specifically the Implementation Plan section:

- Appendix D - List For Refactor Planner

must be checked and all the refactors mentioned there included in the Refactor Suggestion List

The Refactor Suggestion List comes in multiple subsections. **Each subsection is an `##` (H2) heading with a `Category — ` prefix** — e.g. `## Category — From Requirements`, `## Category — Magic Constants Audit (Bulk Approval)` — so the plan renders with a clear visual hierarchy when the human previews it (the H2 category headings sit clearly above the H3 refactor items beneath them):

- **From Requirements** - these are additions/changes that were in the requirements but as they weren’t driven by tests were left until here - e.g. documentation and other artefacts.
- **From “REFACTOR:” Notes** - the ones mentioned above.
- **Magic Constants Audit** - See “`6b. Magic Constants Audit`" of .agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md - **NOTE**: Not “auto approved”, but should be lumped together in one section for “Bulk Approval” - i.e. human gives one approval for all these refactors or puts comment in saying which ones are not approved.
- **Missing Comments (e.g. TSDoc)** - the standard set of documentation that goes in this type of code (e.g. TSDoc in Typescript) should be checked and audited for each file changed.
- **Project Design Requirements Compliance Audit** - see “`### 6f. Project Design Requirements Compliance Audit`" in .agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md
- **Basic Refactoring Audit** - see below
- **Documentation** - if the AI thinks this feature should be documented in some way that hasn’t been covered already in the From Requirements section (maybe User documentation, or Developer documentation, or API documentation) then those should be logged as Refactor Suggestions here. If no documentation is required, just state that here and don’t add any Refactor Suggestions.
- Human-Identified Potential Refactors - same idea as in 04a-jira-refactor-analysis.md

### Basic Refactoring Audit

The AI should check all code added (and existing, related code in the files that surround it) for the following list of things:

```
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Long functions - simplify into multiple functions or introduce new types/abstractions to push out complexity.
- Overly complex classes - simplify into multiple classes each following Single Responsible Principle
```

and create an Audit Table containing:

- Check Name (from above)
- Items Checked - the list of things checked and the results of the check. For example if checking “Overly complex conditionals”:
    - print.ts - if..then..else conditional from lines 24-29
    - delete.ts - do…while conditional from lines 234-292
- Check Result - PASS or FAIL
- Comment - a comment on the code that was checked. E.g. “Only 5 lines long and easy to read“

Any that were checked and got a FAIL results should result in a new “Refactor Suggestion” section added as a sub-heading in this “Basic Refactoring Audit” section.

### The Process

The process takes some things from:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md

but **importantly** does not split the analysis the human has to read into 2 sections. That splitting into 2 sections in 04a-jira-refactor-analysis.md created a lot of duplication for the human and so we are simplifying things for this Refactoring Planner agent by having only one Refactor Suggestion List.

> **Clarification (read + approve ONE list; the summary table is a record produced afterwards).** The duplication being removed is that the old `04a` flow made the human read **two overlapping sections** — an up-front analysis that categorised every opportunity (with Skip / recommendation options) and then a separate Agreed Refactors Summary Table that re-listed many of the same items. In this workflow the human reads and approves exactly **one** thing: the single **Refactor Suggestion List**, marking each item APPROVE / REJECT / DISCUSS (plus one bulk decision for the Magic Constants) inline and discussing with the AI until it is finalised. **Only once everything is decided** does the AI produce a short **Agreed Refactors Summary Table** — a *record* of the final decisions (and the hand-off the Refactoring Executor reads). The human does **not** have to read or approve anything in that table; it is produced *after* approval purely as a quick-reference summary they can glance at if they wish. So "Produce the Agreed Refactors Sections" / "Review Status: COMPLETE" below are kept — but as an after-the-fact record, **not** a second section the human must wade through before approving.

Things that do get done:

- Steps 0 to 3 are pretty much the same (may be some difference to match this workflow)
- Step 5 - read context - yes, like all other agents, but obviously a different set of files as this is a different workflow
- Step 6 - Analyse Code and check other sources for refactors - including all the ones that will be in the Refactor Suggestion List (see above) and including the Large Refactor Suggestion (if suggest-large-refactor=true in parameters or in the ticket)
- `Create Refactoring Plan`
- `Present to Human and WAIT for Review` - similar to 04a-jira-refactor-analysis.md
- `Discussion and Agreed Refactors` - similar to 04a-jira-refactor-analysis.md
- `Produce the Agreed Refactors Sections` - similar to 04a-jira-refactor-analysis.md
- Similar to 04a-jira-refactor-analysis.md:
    - `Mark Review Complete`
    - `Review Status: COMPLETE`
    - `Write Output`
    - `Self-Terminate`
    - ` Important Notes` like this (I removed some that were no longer relevant):
        ```
        - **Analysis only**: This command does NOT modify any code - it only proposes changes
        - **No speculation**: Don't propose refactors "for future flexibility" - that's gold-plating
        - **Previous phases matter**: The most valuable analysis comes from mining previous phase documents - don't skip Step 6a
        - **Human gate is mandatory**: NEVER proceed past "Present to Human and WAIT for Review" without human confirmation - even if not AI identified refactors exist.
        ```

Not doing:

- Step 4 - **not** going to run tests - the Refactoring Executor already does that.
- `6c. Audit To Confirm Methods Used In Production Code (Not Just Tests)` - not bothering in this flow (too many things already)
- Auto approved refactors - not doing. But we ***are*** lumping together Magic Constants audit approvals together to obtain a single approval.
- `Step 8: Add Comment to Jira` - no access to Jira MCP - so ditching this.

### Format Of A Refactor Suggestion

Use similar format for each Refactor like the following.

**Headings / structure** (so the plan renders with a clear visual hierarchy when the human previews it):

- Each **category** subsection is an `##` (H2) heading with a `Category — ` prefix, e.g. `## Category — From Requirements`.
- Each **individual refactor item** within a category is an `###` (H3) heading prefixed with a 🔧 and an em-dash: `### 🔧 Refactor <id> — {Title}`. This makes each refactor render clearly larger than the `**Type**` / `**Description**` bold field labels beneath it.
- Put a horizontal rule `---` on its own line immediately **before** each `### 🔧 Refactor` heading, so each refactor reads as its own separated “card”.
- Leave a **blank line between every bold field** (Type / Description / AI Recommendation / Risk / Files affected) — without the blank lines, Markdown bunches them into a single run-on paragraph when the human previews the plan, instead of each field rendering on its own line.

```markdown
## Category — From Requirements

---

### 🔧 Refactor 2.1 — {Title}

**Type**: {e.g., "Create new abstraction", "Extract to new file"}

**Description**: {What the refactor would do}

**AI Recommendation**: {RECOMMEND / UNSURE / NOT RECOMMENDED - and why. Be honest.}

**Risk**: {Why this might be gold-plating or cause problems}

**Files affected**: `{file1}`, `{file2}`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### 🔧 Refactor 2.2 — {Title}

{Same structure as above}
```

Note re naming:

- the list is called “Refactor Suggestion List”
- each category subsection is an H2 named “## Category — {name}”
- each item is an H3 named “### 🔧 Refactor <id> — {Title}”

Differences of this Agent when compared to 04a-jira-refactor-analysis.md:-

- {refactoring-plan-template-file} will contain the template file (not embedded in the command like the existing 04a-jira-refactor-analysis.md)

> **The template's guidance is for the AI, not the human.** The template carries instructional prose (HTML comments `<!-- … -->` and angle-bracket placeholders `<…>`) telling the AI what to put in each section — e.g. "Surface ALL potential refactors here, both ones you recommend and ones you're unsure about". That guidance is for the AI's understanding of what to produce; the AI must **not** copy it into the Refactoring Plan the human reads. The human should see the finished plan (the actual refactors and audit results), not the instructions for writing it. (Observed during the TEST-100 run: the agent echoed the "Surface ALL…/The list is gathered from the subsections below" guidance as visible prose — it belongs in a comment, omitted from the output.)

## 06 - Refactoring Executor

The Refactoring Executor is responsible for executing the Refactoring Plan. It must run the main (quick) validation tests before and after each refactoring and await human approval at the end of the process.

Similar to 04b-jira-refactor-execute.md the initial sections are:

- Have the “Intro” section.
- Read Input
- `Establish Variables`
- `Validate Input`
- `Check Pre-requisites`
- `Check for Existing Completion File`

Not bothering with:

- `Step 4: Validate Human Review is Complete` - We’ll leave this - if the Refactoring Planner forgets to ensure this we’ll fix that command, not add a check in this command…

### Variables

Some (not all) variables:

workflow-files = {ticket-directory}/workflow-files

refactoring-planner-directory = {workflow-files}/05-refactoring-planner

refactoring-plan = {refactoring-planner-directory}/01-refactoring-plan.md

refactoring-executor-directory = {workflow-files}/06-refactoring-executor

refactoring-execution-document = {refactoring-executor-directory}/01-refactoring-execution.md

refactoring-execution-document-template-file = {templates-dir}/refactoring-execution.TEMPLATE.md

### Testing Between Refactors

In the:

04a-jira-refactor-analysis.md

workflow we knew we were running Typescript tests and had to run “pnpm validate”. We did this before and after the whole refactoring, and between refactors. As well as this we had other directives relating to other types of test (e.g. manual, e2e, integration).

In this new workflow there are some important differences:

- We **don’t know** what coding language or test system the user is using, so we can’t say things like “run pnpm validate”

So, to start with we are going to keep it very simple. We’ll just say that the AI must:

- Identify what **New Tests** were created/updated by the Executor
- Identify what **Quick Validation or Quick Unit Test** command is run that does a very quick automated validation of the whole system. For example in a Typescript pnpm system there may be a “pnpm validate” command that runs all the unit tests and also runs linting, formatting and type checks, or if that doesn’t exist a “pnpm unit” command that runs all the unit tests. If the AI can’t determine this through the CLAUDE.md or the package management system for the project/system it should STOP and ask the human what command it should run to validate the system before, between and after every refactor that will be done (must be **quick** e.g. a few seconds max).
- Before the whole Refactoring and also once all refactoring has been completed run:
    - The New Tests (may be slower)
    - The Quick Validation or Quick Unit Test command
- Between every Refactoring:
    - Run the Quick Validation or Quick Unit Test command

### Large Refactor

If a large refactor has been planned then this should be done **last** and:

- Before the Large Refactor starts the human should be recommended to commit locally, so that if problems are hit, the changes can be reverted and the refactor retried or abandoned.
- The AI should then wait until the human confirms it’s OK to continue.

Details of the Large Refactor (even if it wasn’t done) must be recorded in a “Large Refactor” section near the end of the refactoring-execution-document

### Failed Refactors

If the AI can’t follow the exact plan for a refactoring in the Refactoring Plan document it should:

- Revert the attempted refactoring
- Record the refactoring as FAILED in the refactoring-execution-document “`Refactors Executed`" section.
- Be sure to highlight and discuss this with the human in the “Plan Deviation Discussion Gate” stage.

The AI should **not**:

- Deviate from the plan and try a different (unplanned) refactoring until the code works and a refactoring has been carried out. This silently and secretly introduces changes to the system that the human had **not** agreed on and may miss during the review stage - and may cause problem later. This is an **anti-pattern** and so must be avoided.

### Template File

The

{refactoring-execution-document-template-file}

will be a separate template file, similar to the `refactor-complete-file` doc in

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04b-jira-refactor-execute.md

but it won’t have “Tier 1” and “Tier 2” but instead follow the structure of the plan file which was executed.

It should retain the “`Code Changes Made`” section as well.

NOTE: It should **only** include details of Refactors that were Approved in the Refactoring Plan document. It won’t include “skipped” refactors.

Should also include sections:

- Details And Results Of “New Tests” Run Before And After Refactoring
- Details Of Quick Validation or Quick Unit Tests Run Between **Every** Refactor

### Plan Deviation Discussion Gate

Any deviation from the plan must be recorded and highlighted in the document’s “`Refactors Executed`" section.

If there was a deviation then it must be highlighted and discussed with the human in the:

Plan Deviation Discussion Gate

If there was no deviation and all refactors were executed without issue, that should just be recorded in the summary of the `Refactors Executed`section and mentioned to the human and the AI continue to the Human Approval Gate

Plan Deviations include:

- Refactors that were not possible to carry out as planned - with details of why

These should each be discussed with the human and either an alternative plan devised for doing the refactoring or that particular Refactor be marked as ABANDONED with the human’s agreement and note as to why it was abandoned in the Refactors Executed table.

### Human Approval Gate

Unlike 04a-jira-refactor-analysis.md we are going to have a Human Approval Gate at the end.

The human must be asked to review the Refactoring Execution document and all the code changes before giving approval.

The AI must STOP until the human gives Approval (or discusses any issues).

Once approval obtained it must be recorded in its own section called:

Human Approval Details

at the end of the document (this should have a <Placeholder> section until the approval is obtained).

### Important Notes Section At The End Of The Command

This section should exist at the end of the Command instructions and contain the following directives (should be discussed with human if need editing/changing):

```
- **Batch Constant Extraction** - Extracting constants is trivial and very low risks and so should be batched into one group, with tests run before and after, and *not* between every constant creation.
- **One at a time**: Execute ONE refactor, run Quick Validation or Quick Unit Tests, then proceed. Never batch (except trivial constant extractions - see above).
- **Revert on failure**: If tests fail after a refactor, IMMEDIATELY revert that change and Flag for human review.
- **Don't force it**: If a refactor keeps failing, skip it and note in the report.
- **Time limit**: If stuck for >5 minutes, stop and ask for help.
- **No new features**: Refactoring changes structure, NOT behavior.
- **Test new artifacts**: If a refactor creates new scripts, commands, or entry points, you MUST actually run them to verify they work — don't just run existing tests. Existing tests may not exercise the new artifacts at all. Example: two new `demo:*` scripts were created in package.json but not tested. One of them failed immediately when run due to a pnpm `--` argument passing issue.
- **Document as you go**: Fill in the Refactoring Execution Document the moment each refactor (and each test run) is done — never leave it to the end, because compaction can wipe your memory of what you did at any time.
```

## 07 - Validator

The Validator’s responsibility is to do a final, quick check with the Human’s assistance that the feature in the original ticket has been implemented as specified and that all the required tests pass.

> **BUILD-TIME DECISION CONTEXT ONLY — do NOT surface this to runtime agents or users, and do NOT put it in the command file or the Help Doc.** The note below records *why* this Validator was designed to be minimal/quick (a comparison against another workflow's validate command). It is decision history for whoever builds the workflow; the runtime Validator agent and the end user have no need for this reasoning or the cross-workflow comparison, so it must not be propagated into any generated file.
>
> ### Note About The Older “Jira Validate” Command Vs This Validator Agent
>
> The validate command in the Full Jira TDD Story Workflow at:
>
> .agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/05-jira-validate.md
>
> seemed to not do much of use. It didn’t seem to ever catch anything useful, or find any problems, and so seemed a bit redundant. It felt like a “box ticking” exercise where the AI just went: “yes, all works fine. Tick. Tick. Tick” and then finished. I never asked it to run all the e2e tests because that took 20 minutes and used most of my Claude Token budget, so that was a waste of time including that as on option. This is a waste of tokens and a waste of time for the human.
>
> So this Validator will be more minimal, quick and will be a last, quick double-check that the main, important, quick tests pass and for the AI to help the human verify that everything that was required in the ticket actually got done before that is documented and the add-feature workflow finishes. It will also (new) ask the human to run the system manually to verify the feature works as expected.

### Variables

Some (not all) variables:

workflow-files = {ticket-directory}/workflow-files

validator-directory = {workflow-files}/07-validator

validator-summary = {validator-directory}/01-validator-summary.md

validator-summary-template-file = {templates-dir}/validator-summary.TEMPLATE.md

### Things This Validator Will Do

After doing the usual stages that each Agent does including reading the ticket docs and the implementation and refactoring docs, it will:

- Final Double Check Of Tests:
    - Run the tests that were new/updated during the code execution (just the individual tests)
    - Run the Quick Validation or Quick Unit Test command - to confirm nothing broken.
- Read the initial Prompt and Ticket files and quickly summarise for the human:
    - How the main feature was implemented so that the Prompt/Ticket can now be marked as Done.
    - List each of the Acceptance Criteria and for each one give a quick summary of how we know it was achieved
- Ask the Human to:
    - Check the list above
    - If deemed necessary by the human: Run the system manually and verify the feature has been implemented correctly (this **manual testing of the feature**)
    - If deemed necessary by the human: Run the system manually and verify that the functionality of the system **around the parts that were changed** haven’t broken (this is quick and **basic manual regression testing**).
    - Check the tests/code/docs are all good.
    - Confirm to the AI they are happy the feature has been implemented fully and correctly.

These will all be detailed in the Validator Summary document in their own sections (based on {validator-summary-template-file})

## Things To Add To This add-feature Workflow In “The Future”

### Regression Testing

When we add a feature, we can break existing functionality without knowing and without any of our existing (or new) automated tests failing. This is dangerous, because it means the system we just wrote may get sent to users and cause problems. I’m not adding it now, but a good thing to include in the above would be:

- Adding (or just running) automated regression tests that test that functionality of the system related to the code that was changed pass before and after the change. These tests should be written before the code change, and give GREEN before the code change, and then be confirmed as still giving GREEN after the code change.
- Manual regression tests - If there aren’t a good set of automated regression tests and for some reason adding new automated regression tests is too difficult or too much work, a short list of manual tests that exercise the system **around** the code that was changed should be created and run **before** and then **after** the change. What these tests involve depends on the parts of the system that were changed, e.g. if we added a new feature to our Single Sign On system, then the basic existing functions of our our Sign On and Sign Off flow should be confirmed as working before and after our change.
