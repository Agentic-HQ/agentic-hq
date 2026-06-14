# Naming And Shape Of The New Simple add-feature Workflow

> **Build spec for AHQ-157.** This is the Codex spec (formerly `02-codex-new-simple-add-feature-workflow.md`, renamed to this file) with the agreed Decision Register changes applied as minimal edits. (The register lived in `06-fables-self-prompt-response.md`, since deleted — see `05-06-docs-summarised.md`; original in git history.)

## Purpose

This document expands the recommendation from the [main Codex report](01-codex-report-on-what-im-doing-wrong-etc.md): Agentic HQ should not launch with the current seven-agent, highly opinionated `add-feature` workflow as the universal default.

The new recommendation is:

- `agentic-hq add-feature` should be a simple flagship starter workflow (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-157 - "Create Minimal add-feature Workflow")
- The current seven-agent workflow should become `add-feature-detailed-example`: a detailed, opinionated worked example of a highly personalized workflow, not a recommended escalation path for most users. (COMPLETED: https://agentic-hq.atlassian.net/browse/AHQ-155 "Rename add-feature Workflow To add-feature-detailed-example" — merged to main)
- `create-workflow --using=add-feature` should be added before launch as the supported workflow-customization path and suggested to users when they complete the simple add-feature workflow (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-159 - "Add --using Option To create-workflow To Allow It To Use Existing Workflow")

## One-Line Summary

`add-feature` is a short, generic, customizable workflow that helps a developer research a small feature, make a lightweight plan, implement it with tests, and finish with a concise review summary plus a path to customize the workflow for future runs.

## One-Paragraph Summary

The new simple `add-feature` workflow should be the first serious workflow a new Agentic HQ user runs. It should avoid Steve-specific process ideas, Jira assumptions, heavyweight design audits, and other creator-specific process defaults. Instead, it should guide the developer through the minimum useful AI-assisted feature loop: research the feature request using the human prompt, local codebase, local docs, and bounded external research when needed; produce a short implementation plan; implement with appropriate tests; review the result; and write a brief durable summary. At the end, once the user has seen the value, it should point them to `create-workflow --using=add-feature` so they can clone and adapt the workflow to their own development process. It will also point to `add-feature-detailed-example`, but only as a worked example of a very detailed personal workflow, not as the workflow most developers should adopt directly.

## Naming Recommendation

### Recommended Names

Use:

- `add-feature` for the new simple flagship workflow.
- `add-feature-detailed-example` for the current seven-agent workflow.
- `create-workflow --using=add-feature` for the supported customization path.

### Why The `add-feature` Name Should Belong To The Simple Workflow

Defaults carry product meaning. If the command is called `add-feature`, users will assume:

- this is the recommended starting point,
- this is the normal workflow,
- this is what the project thinks most users should try first.

So the default command should be the workflow that has the best chance of giving a first-time user a fast win.

## Product Positioning

The launch story should be:

1. See value quickly.
2. See depth and possibility.
3. Customize for your own process.

Each command has a distinct job:

- `add-feature`: "Start here. This is deliberately small. Run it once. Then make it yours."
- `add-feature-detailed-example`: "This is a worked example of how far AHQ workflows can go when customized around one creator's personal development process."
- `create-workflow --using=add-feature`: "Clone an existing workflow and adapt it to your own process."

Bill `add-feature-detailed-example` as an example, not as a recommendation. It should show how Steve encoded his own development process into AHQ: the stages he wants, the artifacts he wants, the checks he wants, and the handoffs he wants. It becomes a concrete proof point: "Here is what a powerful personalized workflow looks like after someone has made AHQ fit their own way of building software."

Recommended docs phrasing:

```text
The detailed example add-feature workflow is included as a worked example of a heavily customized development workflow. It is intentionally opinionated around the creator's own process. Most users should start with the simple add-feature workflow, then customize that workflow to fit their own process.
```

## Exact Shape Of The New Flagship Workflow

### High-Level Flow

The new simple `add-feature` should have four agents:

1. **Researcher**
2. **Planner**
3. **Implementer**
4. **Reviewer**

Four is the right number because it preserves the core AHQ idea without making the workflow feel heavy.

It keeps:

- a front-loaded bounded research stage,
- a plan-before-code stage,
- a focused implementation stage,
- a final review/summary stage.

It ditches:

- separate initial discovery stages,
- large design-requirements audit,
- repeated split/re-split complexity,
- mandatory detailed TDD ceremony.

### Typescript Command Line Parameters

The TypeScript workflow should only have one, mandatory command line parameter: `ticket-id`

This keeps the workflow simple as it means the human manages the ticket-id, not the Agent.

The README.md should just state that the human must provide a ticket id, and if they haven't got one from an issue management system they should make one up.  It's recommended to use 3 or 4 digit indexes to keep file ordering numeric e.g.:-

`agentic-hq add-feature -- --ticket-id=PROJ-123`

### Stage Outcome Contract (Researcher → TypeScript Program)

The TypeScript program builds the variables string itself (workspace root + ticket-id) and passes the **same string** to all four commands. The outputs of commands 02-04 are ignored. Command 01's (the Researcher's) returned output is the stage outcome: after trimming whitespace it must be exactly one of:

- `CONTINUE_WORKFLOW` — the program proceeds to run agents 02, 03, 04 in order.
- `TERMINATE_WORKFLOW` — the program prints exactly "Got TERMINATE_WORKFLOW response from agent. Terminating workflow." and exits 0. Termination is a success path, not an error. The Researcher explains everything to the user (why the workflow ended, rerunning `add-feature` for each Sub-Task) before returning this value — none of that logic or reasoning is duplicated into the TypeScript code.
- Any other value — the program prints an error **including the actual value received** and exits 1. No silent fallback.

The Researcher must return one of the two values in **every** run, including the ordinary no-split happy path (which returns `CONTINUE_WORKFLOW`).

No tests for individual TypeScript workflow code (for now) — workflow CLIs are mind-numbingly simple and none of the existing ones have tests; this can be revisited later if deemed a good idea. Verification is by actually running the workflow. This branch is the only real logic in the TypeScript program and requires no engine changes — the existing detailed-example CLI already receives each command's output string from `tool.execute(...)`.

### Agent 01: Researcher

Responsibility: turn the human's feature request into `01-feature-brief.md` using bounded research, document-based clarification, and an explicit size decision.

The Researcher works in `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md`. As a verification check near the start, that file must not exist: if it does, that's a signal the whole workflow is being run again for this ticket-id — the Researcher must flag this and ask the human what to do before proceeding. The Researcher creates the directory and the file with the empty `Human Prompt` section if they don't exist. The human writes the initial request in a `Human Prompt` section, and the Researcher then:
- Reads the Human Prompt
- Inspects the relevant code
- Reads local project docs
- Web/Perplexity Research section - Optionally: does external web or Perplexity research - only when local context is not enough to understand an external API, library, framework, standard, or domain concept. Any external research should be short, targeted, and recorded in the feature brief with source links or a short note about what was checked.  If no research required "Web/Perplexity Research" section just has a single short sentence explaining why none required.
- Creates a section under the Human Prompt: "My Understanding of This Task" - Contains a paragraph (maximum 2) with its understanding of the task of implementing this feature (can refer to Research Finding for full details of anything it discovered)
- Creates a section: "Research Findings" sections under the Human Prompt with the details of what it discovered that is relevant to the task/feature during research: e.g. relevant code, relevant docs, relevant constraints discovered, relevant web/Perplexity research results etc.

If the Researcher needs answers from the Human, it writes questions into a `Questions And Answers` section below the `Research Findings` section.

It then pauses, and asks the human to answer by filling in the answers in the doc.

Questions should be usually be limited to 2-3, but for genuinely complex or underspecified feature up to 8 are acceptable.

Each question must include an `AI Recommendation` which the human can default to by saying "Yes".

Use this format inside `Questions And Answers`:

```markdown
### Question 1

**Question:** Should this feature support X, or only Y for the first version?

**AI Recommendation:** Start with Y only. It keeps this feature small, testable, and easier to validate in one run.

**Human Answer ('Yes' means follow AI Recommendation):** 
```
NOTE: These questions and answers should never be edited or "Folded In" to the rest of the doc - they should be retained verbatim (they can have additional clarifications/update added if necessary).  Same for "Human Prompt" - should be preserved verbatim, and if AI deems necessary - can have UPDATES added to it.

Once the human has answered, the Researcher reads the updated file and:
- Optionally fixes/updates any parts of the "My Understanding of This Task" or "Research Findings" sections based on the answers, referring to the Question Index if necessary (don't duplicate text from answers - as that just creates extra, unnecessary reading for the human)
- Does any additional work/research based on answers, and even asked more Questions if necessary - then updates Research Finding etc.

Once it has everything it needs it adds to the top of the document the following:-
- One Sentence Outcome
- User Story (Optional)

and adds to the bottom of the file (in this order, with Acceptance Criteria as the **very last section in the document**):

- Relevant Files Reviewed (order by decreasing relevance)
- Acceptance Criteria — a **short, scannable checklist** (~3–5 one-line bullets) of the **key, observable outcomes** that mean the feature is done. It is a quick checklist, **not** a re-spec: most of this detail is already in the Human Prompt and Questions And Answers, so it must not be restated at length (that just tires the human). Each bullet states *what* is observably true, not *how* it is built — file names, paths, code seams, and script names are the Planner's job. Merge near-duplicate bullets (e.g. the unit- and e2e-test versions of one requirement) into one.

The Researcher then decides whether the feature is a good size for one run. If it is, the feature brief does not include `Split Suggestion`; the Researcher ends, returns `CONTINUE_WORKFLOW` to the TypeScript workflow program, and the workflow continues to the Planner.

If the feature is obviously too large/complex to do easily in one hit, the Researcher pauses, explains why, and add to the end of `01-feature-brief.md` a `Split Suggestion` section. That section suggests 2-6 smaller Sub-Tasks, usually with an early or first slice labelled `Tracer Bullet / Walking Skeleton` when that framing fits. It then tell the human the following (the Why and Split Suggestion must be updated depending on the situation):

```text
This feature is too large/complex for the simple add-feature workflow.

Why:
- It touches multiple areas.
- It has several independently valuable outcomes.
- It would be hard to validate in one pass.

Split Suggestion:
1. Tracer Bullet / Walking Skeleton: prove the end-to-end happy path with the smallest useful behavior.
2. Add the main user-facing controls.
3. Add persistence or integration behavior.

Recommendation: terminate this workflow and split the feature.
```

The human then chooses **using the `AskUserQuestion` tool** (not a plain-text menu). Supply exactly two options, with **Option 1 listed first and its label ending `(Recommended)`** so it is the recommended, default-highlighted choice:

1. Terminate workflow and split feature `(Recommended)`.
2. Continue with oversized feature implementation.

If the human chooses option 1:
- the agent changes the "Split Suggestion" -> "Split Suggestion (Accepted)" and records at the top of that section that Researcher flagged the feature as oversized, recommended termination/splitting, and that the human accepted the suggestion and terminated the workflow, and will perform each Sub-Task as a single feature implementation.
- the agent tells them to run the `add-feature` again for each chosen Sub-Task, and in the Human Prompt for each Sub-Task refer to the file at `{full-path}/01-feature-brief.md` as the Parent feature brief.  
- The Researcher then returns `TERMINATE_WORKFLOW` to the TypeScript workflow program which terminates the workflow.

If the human chooses option 2:
- the agent changes the "Split Suggestion" -> "Split Suggestion (Rejected)" and records at the top of that section that Researcher flagged the feature as oversized, recommended termination/splitting, and that the human explicitly chose to continue with higher risk.
- the agent tells them that the Researcher has completed and the Planner will run next.  
- the workflow returns "CONTINUE_WORKFLOW" to the Typescript workflow program and the workflow continues on to the Planner.
- When the Planner agent runs it can decide to optionally use `Split Suggestion` as an implementation sequencing guidance.

#### Important Rules

- Substantive questions must go in the Q&A section of the file, not chat. Quick approvals/choices in chat are fine, but must be recorded in the doc.
- Important information from human in chat should be added as UPDATE entries to their Human Prompt - quoting them verbatim.

### Agent 02: Planner

Responsibility: turn `01-feature-brief.md` into an approved `02-implementation-plan.md` before any code is written.

Planner starts by reading the finalized feature brief and inspecting the most relevant code. It then decides the minimum useful implementation approach and the minimum useful tests needed to satisfy the brief's acceptance criteria (and anything else the brief specifies). If the Researcher recorded a `Split Suggestion` because the human chose to continue with an oversized feature, Planner may use that split as sequencing guidance, but not as actual Sub-Task artifacts.

Planner writes `docs/tickets/{ticket-id}/workflow-files/02-implementation-plan.md`. The plan should stay compact and include the following sections:

- Tests Being Created (where a test links to an acceptance criterion, make that link explicit)
- Implementation Changes
- Risks/Unknowns/Concerns (say "None" if none)
- Follow-up Ideas (say "None" if none)
- Human Approval Confirmation

Planner should plan and sequence the work **test-first** when that makes sense to the Planner and the human — phrased pragmatically, not as a doctrine, and not a hard requirement. If test-first is chosen, the plan includes a brief justification and sequences the work as RED → GREEN: write/run the planned tests first to confirm they fail (RED), implement the changes, then run the code to confirm they pass (GREEN). If the human rejects the TDD element of the plan, the Planner works with them to satisfy their preferences.

If no automated test is practical, Planner should say so explicitly and define a concrete manual validation step (that the human or the Implementer can run) instead.

The plan must explicitly state that it does **not** include the third REFACTOR stage of TDD: that would involve changing the implementation and adds too much complexity for this simple add-feature workflow. A team that wants a refactor step should add a Refactor agent to its own customized version of the workflow.

Planner ends by asking for human approval before code is written and recording it in Human Approval Confirmation when given. Teams that want stricter methodology can later customize this stage to add design audits, stronger TDD rules, or architecture review.

#### Must Not Do

- Write code or change files.
- Move on without explicit Human Approval and it being recorded in Human Approval Confirmation section.

### Agent 03: Implementer

Responsibility: implement the approved plan with appropriate tests and record exactly what was done and what changed in `03-implementation-summary.md`.

Implementer starts by reading the approved implementation plan. It writes or updates the planned tests, and where appropriate runs them first to confirm they fail for the expected reason. It then implements the minimum code needed for the approved feature, runs the planned tests, and runs a quick validation command if one exists.

Implementer follows the approved plan. It implements planned work only. If implementation reveals useful work outside the plan, it records that as a follow-up.

If the planned tests will not go green within the scope of the approved plan, Implementer keeps iterating within plan scope; if still blocked, it stops and asks the human to agree a plan change (recorded as an UPDATE in `02-implementation-plan.md` and under Approved Deviations From The Plan) rather than deviating silently. Implementer never weakens, deletes, or skips a failing test to make it pass — a failing test is information for the human, not an obstacle for the agent.

At the end, Implementer writes `docs/tickets/{ticket-id}/workflow-files/03-implementation-summary.md` with the following sections:

- Summary Of Work Done
- Files Changed/Added/Deleted
- Tests Added/Updated And Test Results (include any manual testing done by AI, e.g. running the CLI by hand to test it)
- Approved Deviations From The Plan ("None" if none)
- Out Of Plan Follow-up Ideas/Concerns ("None" if none)
- Approval Gate Changes — added only if the Approval Gate discussion (below) results in code changes: what was discussed, what was changed, and why

#### Implementor Approval Gate

Before the command ends, the Implementer pauses for a brief human approval gate. The rationale: if the human sees problems with the code or has questions, the best agent to explain *why* it was built the way it was is the agent that actually built it — not the downstream Reviewer, which did not make the change and so understands it less well. This keeps the workflow fast (on most runs the human simply presses Enter to approve) while giving one cheap checkpoint with the implementing agent still in context. It is a deliberately light touch for this minimal workflow; teams wanting heavier gates add them via `create-workflow --using=add-feature`.

Once the code is implemented, the tests are green, and `03-implementation-summary.md` is written, the Implementer gives the human a short recap plus the path to the summary and the changed files, then asks via `AskUserQuestion`:

- **Implementation Approved** — the default, selected if the human simply presses Enter: the command finishes and hands on to the Reviewer.
- **Implementation Not Approved - Discuss Further** — the Implementer asks the human what they would like to discuss or change, and works through it with them: answering questions about what was done and why, and making any requested changes. Changes within the approved plan's scope are made directly; a change that deviates from the approved plan is treated as a human-consented plan change (recorded as an UPDATE in `02-implementation-plan.md` and under Approved Deviations From The Plan). A failing test is still never weakened, deleted, or skipped.

If the discussion results in any changes to the code, the Implementer adds a new "Approval Gate Changes" section to `03-implementation-summary.md` detailing what was discussed, what was changed, and why. The Approval Gate `AskUserQuestion` is then repeated, and keeps repeating until explicit human approval is obtained — the command must not end without it.


#### Note On This Agent (Don't Include In Implementer Agent)

Teams that want more ceremony can later split this stage into more granular stages with `create-workflow --using=add-feature`, but the simple workflow keeps implementation in one focused pass.

#### Must Not Do

- Broaden scope beyond the approved plan without explicit Human approval.
- Deviate from the plan without stopping and getting human consent to modify the plan.
- Weaken, delete, or skip failing tests to force a pass.
- End the command without explicit Human Approval at the Approval Gate

### Agent 04: Reviewer

Responsibility: perform a concise code review, write `04-review-summary.md`, and ask the human whether to fix any selected findings.

Reviewer starts by reading the feature brief, implementation plan, implementation summary, and the actual changed files. It reviews the work like a pragmatic senior developer: did the intended behavior ship, were the tests and regression checks good enough, what is the risk of this change, and what could be improved?

Reviewer is not allowed to fix issues silently. It first writes `04-review-summary.md` with its findings, risks, and improvement suggestions, split into a **Checks Passed** table (things that are fine, no `Fix?` column) and a **Potential Fixes** table (things that could be fixed or improved, with a `Fix?` column). The human then chooses what to fix by editing the file: they write `Yes` in the `Fix?` column of any Potential Fixes row they want fixed now, save, and say "done".

If any rows are marked `Yes`, Reviewer agrees a small fix plan with the human, applies only those fixes, then re-runs the tests the Implementer recorded in `03-implementation-summary.md` to confirm they all still pass (the regression guard that the fixes broke nothing), and records what it changed and the test result in `04-review-summary.md`. If no rows are marked, Reviewer records that no fixes were chosen; the unmarked findings simply stand in the table and are not tracked as separate follow-ups (if the human does not want it fixed now by the Reviewer, it is forgotten).

#### Does Not Do

- Implement fixes silently.
- Apply unapproved review fixes.
- Rubber-stamp without evidence and recommendations.
- Do a full redesign.
- Do an exhaustive architecture audit.

### Review Output

Reviewer only adds value if it produces evidence-backed judgment. It should not be allowed to write generic "looks good" summaries.

Reviewer writes `docs/tickets/{ticket-id}/workflow-files/04-review-summary.md` using this structure:

```markdown
## Review Summary

Short outcome summary.

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| Acceptance criterion that passed | File, behavior, test, or manual-check evidence | Pass |
| Test evidence | Exact command, automated test, or manual check and its result | Pass |
| Regression coverage | Changed areas reviewed, and why existing coverage is good enough | Good enough |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| Acceptance criterion not fully met | File, behavior, test, or manual-check evidence | Fail / Not validated | Do now / defer / do nothing |  |
| Regression coverage gaps | Changed areas reviewed; where regression tests were missing or insufficient; suggested concrete tests | Weak / Missing | Do now / defer / do nothing |  |
| Highest-risk changed area | Specific changed file, behavior, or dependency, and why it is the riskiest part of the change | Low / Medium / High, with reason | Do now / defer / do nothing |  |
| Improvement suggestion 1 (RECOMMENDED) | Specific possible improvement | Worth doing, with reason | Do now / defer / do nothing |  |
| Improvement suggestion 2 (NOT RECOMMENDED) | Specific possible improvement | Not worth it, with reason | Do now / defer / do nothing |  |

## Selected Fixes Applied

What Reviewer fixed at the fix gate (files touched + check results), or "None" if the human marked no rows `Fix? = Yes`.

## Final Human Confirmation

Record the human's final decision.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

```
Each row goes in the right table: Checks Passed for an evidence-backed pass with nothing to do, Potential Fixes for anything that could be fixed or improved. Every acceptance criterion must appear in one table or the other (Checks Passed if it passed, Potential Fixes if it failed or cannot be validated); test evidence must appear (Checks Passed if it ran and passed, Potential Fixes otherwise); regression coverage must be assessed (Checks Passed if good enough, Potential Fixes if weak or missing); and the single highest-risk changed area must appear (Checks Passed if genuinely low risk, otherwise Potential Fixes). Potential Fixes must include at least two possible improvement suggestions, and each improvement suggestion's Area label must end with `(RECOMMENDED)` or `(NOT RECOMMENDED)` so the human can quickly skip the ones that are not recommended. The regression coverage gaps row must not merely repeat the test commands. It must name the changed areas Reviewer inspected; if regression coverage is missing or weak, it must suggest concrete tests; if it is good enough, it must explain why. If Reviewer cannot point to evidence, it must say `Not validated`. If it recommends "do nothing", it must explain why the risk/cost does not justify more work. Reviewer leaves the `Fix?` column blank for the human to fill in.



## How The New Workflow Satisfies Every Starter Requirement

| Requirement | How The New Workflow Satisfies It |
| --- | --- |
| Short | Four agents instead of seven. One concise document per stage. No long appendices by default. |
| Fast | Uses one bounded Researcher stage, removes extra mandatory stages, and keeps review concise. |
| Conservative | No code before approved plan; pauses if the feature is too large, provides a mandatory advisory `Split Suggestion`, and requires explicit human choice before continuing. |
| Few stages | Four stages: Researcher, Planner, Implementer, Reviewer. |
| Few philosophy assumptions | No mandatory OO audit, no mandatory strict TDD lecture, no Jira assumption, no creator-specific development methodology. |
| Clear extension points | Each stage maps to an obvious customization area: research, planning, implementation, review. |
| Customization path | Point to `create-workflow --using=add-feature`; keep customization instructions in create-workflow help docs rather than cluttering runtime add-feature steps. |
| Links to detailed example workflow | Reviewer points to `add-feature-detailed-example` as a heavily customized worked example. Docs frame it as a showcase, not as the recommended next workflow. |
| Universal for developers | Uses local Markdown files and repo-native tests; no Jira, Linear, GitHub Issues, or specific design method required. |
| Demonstrates AHQ | Still shows fresh context per stage and artifact handoff, without overwhelming the first run. |

## What Gets Kept From The Old Add Feature Workflow (Which Has Been Renamed To `add-feature-detailed-example`)

The AI creating this workflow should read the Commands, the Docs and the Typescript code from the add-feature-detailed-example workflow and use similar file naming, organisation etc - but obviously with the changes/simplications detailed in this file.

The following are being kept because they are broadly useful and not too Steve-specific:

- Fresh context per agent.
- Markdown artifact handoff between agents.
- Local `docs/tickets/{ticket-id}/workflow-files/...` structure.
- "Tell Me More" as optional help.
- Human approval before and after review.
- Focus on creating a *minimal* code implementation.
- Test-awareness.
- Recording commands run and test results.
- Final review summary.
- Help docs as optional deeper explanation.
- The idea that the next agent reads the compressed file from the previous agent.
- The user can use any issue tracker or none.

Being kept, but simplifing:

- Splitting/decomposition: reduce to "this is too big; here are 2-6 informal slice suggestions; recommended action is to stop and rerun add-feature for each smaller slice" rather than more complex Epic/Sub-Task handling.
- TDD: present test-first as the recommended safe path, not as a mandatory doctrine.
- Scope discipline: Implementer follows the approved plan and implements planned work only. No refactoring stage. If the human wants a refactor phase, they add it using `agentic-hq create-workflow --using=add-feature`.  Reviewer fixes missing requirements or missing/limited tests or anything else that is broken.
- External research: allowed when local context is insufficient, but bounded and recorded.

## What Gets Ditched From The Simple Workflow

The following elements of add-feature-detailed-example are being ditched in this simple add-feature workflow:

- Seven mandatory agents.
- Separate initial discovery stages.
- Mandatory first split and later re-split decision.
- Epic/Sub-Task ticket rewriting.
- Long project design requirements audit.
- English Language Description appendix.
- Acceptance criteria audit table (replaced by the Reviewer's slimmer Checks Passed / Potential Fixes tables).
- Heavy TDD terminology.
- Instructions to hit Ctrl-C multiple times to control branching (replaced by the Stage Outcome Contract).
- Wording that implies Steve's design philosophy is the default requirement.

## Proposed File Layout

Runtime files:

```text
docs/tickets/{ticket-id}/workflow-files/
├── 01-feature-brief.md
├── 02-implementation-plan.md
├── 03-implementation-summary.md
└── 04-review-summary.md
```

Bundled workflow docs:

```text
.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/
└── workflow-help-docs/
    ├── 00-add-feature-user-help-doc.md
    ├── 01-researcher-help-doc.md
    ├── 02-planner-help-doc.md
    ├── 03-implementer-help-doc.md
    └── 04-reviewer-help-doc.md
```

## Suggested `agentic-hq list` Entries

```text
agentic-hq add-feature -- --ticket-id=PROJ-123
  Add a small feature using a simple four-stage research/plan/implement/review workflow

agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
  Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process
```

This makes the difference obvious without apologizing for the detailed example workflow or implying most users should adopt it directly.

## Additional Details Of Implementation

This will be implemented by the human running the create-workflow flow and them pointing at this spec file at when the:

01-explain-to-user-how-workflows-work-and-get-workflow-details.md

is run.

The agent doesn't have to explain how workflows work (I wrote the system)

The Spec should not duplicate all the details from this spec file - but mainly point at it (with any clarification).  I don't want to have to update in 2 places if we need to change/fix things as we go.  This file is the "source of truth" - the workflow spec should mainly defer to it (and we modify this file if we need to).

### UPDATE: Rename of old workflow files

When the create-workflow runs the first agent will have to git rename:
docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature
->
docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature-detailed-example

and create a file explaining the rename at:

docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature-detailed-example/README-RE-RENAME.md

This will free up:
docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/add-feature
for all the artefacts of this workflow creation.


### Structure Of Each Command

As is made clear in this doc - this add-feature workflow is based on the original, more complex, add-feature-detailed-example workflow.
I want the elements that are in each of the commands, and the structure of each command, to be retained i.e.:
- Intro To Give The Agent Context
- Step 0a: Read Input
- Step 0b: Establish Variables
- Step 1: Validate Input
- Step 2a: Read Context (if applicable)
- Step 2b: Check Pre-requisites
- ...
- Step X: Write Output
- Step X+1: Self-Terminate
and based on those in the add-feature-detailed-example workflow

### Plan For Whole Build Out

So, in the 02-confirm-spec-approved-and-build.md stage, I want the Agent to build in stages:
- Stage 0 - The typescript and all 4 agents as a skeleton structure that just pass on and build the essential variables and each Agent just gives a quick summary of what it *would* do using those basic/essential variables (the key few).  Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 0b - The typescript and all 4 agents as a skeleton structure that just pass on and build *ALL* the variables and each Agent gives a quick summary of what it *would* do and lists all the variables it will use and their name, value and what it will do with them (very briefly). Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 1 - Agent build in full the Researcher (including its `01-researcher-help-doc.md`). Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 2 - Agent build in full the Planner (including its `02-planner-help-doc.md`). Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 3 - Agent build in full the Implementer (including its `03-implementer-help-doc.md`). Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 4 - Agent build in full the Reviewer (including its `04-reviewer-help-doc.md`). Human tests to confirm works well.
- AI summarises for next agent what to do next into /tmp/guidance-for-agent-after-compaction.md and human compacts.
- Stage 5 - Agent builds the overall `00-add-feature-user-help-doc.md` on its own (so it gets its own context). Human tests to confirm works well.
- Build is complete.

Note on help docs: each agent's help doc (`01`–`04`) is built inside that agent's own stage (Stages 1–4) so it stays in sync with the agent it documents; the overall `00-add-feature-user-help-doc.md` is built last, in its own dedicated Stage 5.
