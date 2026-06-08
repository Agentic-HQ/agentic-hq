# Naming And Shape Of The New Simple Add Feature Workflow

## Purpose

This document expands the recommendation from the main Codex report: Agentic HQ should not launch with the current seven-agent, highly opinionated `add-feature` workflow as the universal default.

The new recommendation is:

- `agentic-hq add-feature` should be a simple flagship starter workflow (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-157 - "Create Minimal add-feature Workflow"")
- The current seven-agent workflow should become `add-feature-detailed-example`: a detailed, opinionated worked example of a highly personalized workflow, not a recommended escalation path for most users. (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-155 "Rename add-feature Workflow To add-feature-detailed-example")
- `create-workflow --using add-feature` should be added before launch as the supported workflow-customization path (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-159 - "Add --using Option To create-workflow To Allow It To Use Existing Workflow")

## One-Line Summary

`add-feature` is a short, generic, customizable workflow that helps a developer clarify a small feature, make a lightweight plan, implement it with tests, and finish with a concise summary plus a path to customize the workflow for future runs.

## One-Paragraph Summary

The new simple `add-feature` workflow should be the first serious workflow a new Agentic HQ user runs. It should avoid Steve-specific process ideas, Jira assumptions, heavyweight design audits, and mandatory multi-stage refactoring. Instead, it should guide the developer through the minimum useful AI-assisted feature loop: capture the feature idea, ask only necessary clarification questions, produce a short implementation plan, implement with appropriate tests, validate the result, and write a brief durable summary. At the end, once the user has seen the value, it should point them to `create-workflow --using add-feature` so they can clone and adapt the workflow to their own development process. It will also point to `add-feature-detailed-example`, but as a worked example of a very detailed personal workflow, not as the workflow most developers should adopt directly.

## Naming Recommendation

### Recommended Names

Use:

- `add-feature` for the new simple flagship workflow.
- `add-feature-detailed-example` for the current seven-agent workflow.
- `create-workflow --using add-feature` for the supported customization path.

### Why Plain `add-feature` Should Belong To The Simple Workflow

Defaults carry product meaning. If the command is called `add-feature`, users will assume:

- this is the recommended starting point,
- this is the normal workflow,
- this is what the project thinks most users should try first.

So the default command should be the workflow that has the best chance of giving a first-time user a fast win.

## Product Positioning

The simple workflow should say:

> Start here. This is deliberately small. Run it once. Then make it yours.

The detailed example workflow should say:

> This is a worked example of how far AHQ workflows can go when customized around one creator's personal development process.

It should not say:

> Use this when the simple workflow is not enough.

That wording would accidentally make it sound like a recommended second step. The better meaning is: study this, inspect it, run it if you are curious, then build your own version around your own process.

The create workflow path should say:

> Clone an existing workflow and adapt it to your own process.

Together, those three tell a coherent story:

1. See value quickly.
2. See depth and possibility.
3. Customize for your own process.

## How To Bill `add-feature-detailed-example`

Bill `add-feature-detailed-example` as an example, not as a recommendation.

The pitch should be:

> This is a worked example of a very detailed, highly opinionated workflow. It shows how Steve has encoded his own development process into AHQ: the stages he wants, the artifacts he wants, the checks he wants, and the handoffs he wants.

The pitch should not be:

> If the simple workflow is too small, use this one.

That second message turns Steve's process into the product's implied best practice. The stronger message is that AHQ lets each developer create their own best practice.

This also makes the detailed example workflow more valuable, not less valuable. It becomes a concrete proof point: "Here is what a powerful personalized workflow looks like after someone has made AHQ fit their own way of building software."

Recommended docs phrasing:

```text
The detailed example add-feature workflow is included as a worked example of a heavily customized development workflow. It is intentionally opinionated around the creator's own process. Most users should start with the simple add-feature workflow, then customize that workflow to fit their own process.
```

## Exact Shape Of The New Flagship Workflow

### High-Level Flow

The new simple `add-feature` should have four agents:

1. **Scoper**
2. **Planner**
3. **Executor**
4. **Validator**

Four is the right number because it preserves the core AHQ idea without making the workflow feel heavy.

It keeps:

- a front-loaded clarification/context stage,
- a plan-before-code stage,
- a focused implementation stage,
- a final verification/summary stage.

It ditches:

- separate Ticket Creator and Interrogator stages,
- mandatory refactoring planner,
- mandatory refactoring executor,
- large design-requirements audit,
- repeated split/re-split complexity,
- mandatory detailed TDD ceremony.

### Required Input Convention

For the simple TypeScript workflow, `ticket-id` should be mandatory.

Reason:

- It keeps the workflow implementation simple.
- The human owns ticket-id choice, numbering, and record management.
- The workflow just uses the provided id.
- The README can use `PROJ-001` as the example and tell users to increment from there.
- Three-digit numbering keeps local ticket folders in useful order up to `PROJ-999`.


### Agent 01: Scoper

Purpose:

Create a short, durable feature brief from the user's initial idea.

Responsibilities:

- Get the human to fill in a `Human Prompt` section in `01-feature-brief.md` and then read it and research the code and feature.
- Add clarification questions to `Questions And Answer List` inside `01-feature-brief.md` (no clarification questions in chat).
- For each clarification question, include an `AI Recommendation` field.
- Pause for the human to answer the questions by editing `01-feature-brief.md`.
- Keep questions bounded: usually 2-3, but allow up to roughly 8 when complexity and lack of detail genuinely requires it.
- Update the `01-feature-brief.md` to finalise things by adding/updating all the things listed below and summarising the conversation (don't remove Question or Answers, they are an important record)
- Decide whether the feature is obviously too large; if it is, write a `Split Suggestion` section at the end of `01-feature-brief.md` with an informal split list, with an early or first slice labelled `Tracer Bullet / Walking Skeleton` when that framing fits.


Output:

- `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md`

The brief should include:

- one-line outcome,
- optional user story,
- acceptance criteria,
- `Human Prompt`,
- `Questions And Answer List`,
- relevant files/code areas reviewed,
- open assumptions,
- oversize warning only if the feature is too large,
- `Split Suggestion` section if the feature is too large

Clarification pattern:

Scoper should keep clarification in the document, not in transient chat.

Use this pattern inside `Questions And Answer List`:

```markdown
### Question 1

**Question:** Should this feature support X, or only Y for the first version?

**AI Recommendation:** Start with Y only. It keeps this feature small, testable, and easier to validate in one run.

**Human Answer:** _(human fills this in)_
```

After Scoper writes questions, the workflow should pause and ask the human to answer them in `01-feature-brief.md`. Once the human has answered, Scoper reads the updated file and continues. Do not rely on "AI asks in chat, human answers in chat, AI later records the result"; that pattern loses information and produces weaker artifacts.

If the feature is a good size for one run, Scoper should not include a `Split Suggestion` section. It should write the normal feature brief and continue to Planner.

Oversized feature behavior:

- Scoper should treat an obviously too-large feature as a decision point before Planner.
- It should not pass a too-large feature to Planner by default.
- It should explain why the feature is too large in practical terms.
- It must end `01-feature-brief.md` with a `Split Suggestion` section.
- The `Split Suggestion` section should suggest 2-6 informal smaller slices.
- One early slice should usually be labelled `Tracer Bullet / Walking Skeleton` if that framing fits.
- It should ask the user to choose whether to terminate-and-split or continue with the oversized feature, and record the decision under `Split Suggestion`.

`Split Suggestion` belongs only to this oversized-feature decision path. It should not appear for ordinary features that are small enough to plan and implement in one run.

The choice should be framed like this:

```text
Recommendation: terminate this workflow and split the feature.

Options:
1. Terminate workflow and split feature. Recommended.
2. Continue with oversized feature implementation. Not recommended.
```

If the user chooses option 1:

- The user is advised before this command terminates that they should run `add-feature` again for each chosen smaller slice, referring to `{full-path}/01-feature-brief.md` as the parent feature brief.
- The workflow stops by returning `TERMINATE_WORKFLOW` output that the TypeScript workflow checks for.

If the user chooses option 2, the workflow continues, but `01-feature-brief.md` must record:

- Scoper flagged the feature as oversized.
- The recommendation was to terminate and split.
- The human explicitly chose to continue.
- Risk is higher because the workflow is proceeding with an oversized feature.
- Planner will use the `Split Suggestion` as an implementation sequencing aid, not as actual Sub-Task artifacts.

Example:

```text
This feature is too large for the simple add-feature workflow.

Why:
- It touches multiple areas.
- It has several independently valuable outcomes.
- It would be hard to validate in one pass.

Split Suggestion:
1. Tracer Bullet / Walking Skeleton: prove the end-to-end happy path with the smallest useful behavior.
2. Add the main user-facing controls.
3. Add persistence or integration behavior.

Recommended first slice: option 1.

Recommendation: terminate this workflow and split the feature.

Options:
1. Terminate workflow and split feature. Recommended.
2. Continue with oversized feature implementation. Not recommended.
```

What it should not do (which is what the add-feature-detailed-example workflow does):

- Create an Epic/Sub-Task system.
- Create actual Sub-Task tickets or workflow artifacts.
- Force issue-tracker behavior.
- Do deep implementation planning.
- Do detailed research unless necessary.
- Teach the full philosophy of decomposition.

Why this satisfies the starter requirements:

- **Short:** one document, one stage.
- **Fast:** only necessary questions.
- **Conservative:** pauses if the feature is too large rather than pushing on; any split list is advisory text only unless the human explicitly chooses to continue.
- **Few assumptions:** no Jira, no TDD doctrine, no OO design audit.
- **Clear extension point:** teams can later add richer ticketing, decomposition, or issue-tracker sync here.

### Agent 02: Planner

Purpose:

Turn the feature brief into a short implementation plan.

Responsibilities:

- Read the feature brief.
- Inspect the most relevant code.
- Decide the minimum useful tests.
- Decide the minimum implementation approach.
- Write a short `02-implementation-plan.md`.
- Ask for human approval before code is written.

Output:

- `docs/tickets/{ticket-id}/workflow-files/02-implementation-plan.md`

The plan should include:

- "Tests to write/run"
- "Implementation changes"
- "Files likely touched"
- "Risks/unknowns"
- "Optional follow-up refactors"
- "Human approval"

What it should not include:

- Long appendices.
- Full project design requirements audit.
- English Language Description with bold classes and italic method calls.
- Acceptance criteria audit table unless the feature is complex enough to need it.
- Mandatory TDD terminology if the user has not opted into it.

TDD handling:

- Use test-first as a recommendation, not as a philosophical lecture.
- Phrase it pragmatically: "The safest path is to write/confirm these tests first."
- If no automated test is practical, say so and define a manual validation step.

Why this satisfies the starter requirements:

- **Short:** one compact plan.
- **Fast:** avoids duplicating the current Interrogator/Planner split.
- **Conservative:** no code before human approval.
- **Few philosophy assumptions:** test-first is presented as a practical default.
- **Clear extension point:** teams can add design audits, TDD strictness, or architecture review here later.

### Agent 03: Executor

Purpose:

Execute the approved plan and keep the work understandable.

Responsibilities:

- Re-read the approved implementation plan.
- Write or update the planned tests.
- Run the tests to confirm failure where appropriate.
- Implement the minimum code.
- Run the planned tests.
- Run a quick validation command if one exists.
- Write a concise `03-execution-summary.md`.

Output:

- Changed code/tests.
- `docs/tickets/{ticket-id}/workflow-files/03-execution-summary.md`

The execution summary should include:

- files changed,
- tests added/updated,
- commands run and results,
- deviations from the plan,
- follow-up refactors or concerns.

What it should not do:

- Conduct a full separate refactoring phase.
- Add broad improvements not required by the plan.
- Run an unbounded full suite unless that is the repo's normal quick validation.
- Hide plan deviations.

Refactoring handling:

- Allow tiny local cleanup required to keep the implementation sane.
- Record larger refactors as follow-up items.
- Optionally ask the human whether to do one small obvious refactor if it is directly adjacent and low risk.

Why this satisfies the starter requirements:

- **Short:** one implementation stage.
- **Fast:** no separate refactor planner/executor.
- **Conservative:** minimal implementation and explicit deviations.
- **Few assumptions:** works with the repo's existing test style.
- **Clear extension point:** teams can later split this into RED/GREEN/REFACTOR stages if they want.

### Agent 04: Validator

Purpose:

Check the result, do a lightweight quality review, summarize what shipped, and point the user toward customization.

Responsibilities:

- Read the feature brief, implementation plan, and execution summary.
- Confirm the acceptance criteria or intended outcome.
- Confirm test/validation results.
- Do a lightweight code review for obvious correctness, maintainability, and safety issues.
- Flag any suspicious implementation choices, missing tests, or follow-up refactors.
- Ask the human for final approval.
- Write a short `04-validation-summary.md`.
- At the end, point to customization via `create-workflow --using add-feature`.

The Validator is a final quality gate, not a second implementation agent. It should cover:

- **Acceptance criteria:** did the intended behavior ship?
- **Testing:** were appropriate automated or manual checks run, and did they pass?
- **Code review:** are there obvious defects, risky shortcuts, missing edge cases, or maintainability problems?

It should not do a full redesign, broad refactor, or exhaustive architecture audit. If it finds larger issues, it should record them as follow-ups or ask whether to reopen implementation.

### How To Stop Validator Becoming A Tick-Box Exercise

The Validator only adds value if it is evidence-based and allowed to fail the work. It should not be allowed to write generic "looks good" summaries.

Minimum useful behavior:

- Read the actual changed files, not only the executor's summary.
- Compare each acceptance criterion or intended behavior against concrete evidence.
- Report test commands exactly, with pass/fail/not-run status.
- If no test was run, say why and whether that is acceptable.
- Identify at least the highest-risk changed area and explain why it is or is not concerning.
- Look for one or two specific edge cases, not a generic list of possible problems.
- Always identify one or two things that could potentially be addressed.
- For each potential action, recommend one of: do now, defer, or do nothing.
- If the recommendation is "do nothing", explain why the risk/cost does not justify more work.
- Mark anything uncertain as "not validated", not "probably fine".
- If it finds a real issue, either send the work back to Executor or ask the human whether to reopen implementation.

The validation summary should have a small table like:

| Check | Evidence | Result | Recommendation |
| --- | --- | --- | --- |
| Acceptance criterion 1 | File/behavior/test evidence | Pass/Fail/Not validated | Do now / defer / do nothing |
| Test evidence | Exact command and result | Pass/Fail/Not run | Do now / defer / do nothing |
| Code review risk | Specific changed file or decision | OK/Concern | Do now / defer / do nothing |
| Potential improvement | Specific possible improvement | Useful / not worth it | Do now / defer / do nothing |

This makes the Validator useful because it has to produce falsifiable evidence. If it cannot point to evidence, it should say so. That is much better than pretending a review happened.

Output:

- `docs/tickets/{ticket-id}/workflow-files/04-validation-summary.md`

The validation summary should include:

- outcome achieved,
- acceptance criteria / intended behavior check,
- tests run,
- manual checks if any,
- lightweight code review findings,
- remaining follow-ups,
- final human confirmation,
- customization next step.

The final customization message should be short:

> If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow --using add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

Why this satisfies the starter requirements:

- **Short:** one final summary.
- **Fast:** quick verification and review, not a second planning or refactoring exercise.
- **Conservative:** confirms before declaring done.
- **Few assumptions:** validates against the user's brief, not Steve's full methodology.
- **Clear extension point:** ends by showing how to customize.
- **Links to detailed example workflow:** points to `add-feature-detailed-example` as a worked example, not as a recommended upgrade.

## How The New Workflow Satisfies Every Starter Requirement

| Requirement | How The New Workflow Satisfies It |
| --- | --- |
| Short | Four agents instead of seven. One concise document per stage. No long appendices by default. |
| Fast | Combines Ticket Creator + Interrogator into one Scoper stage, removes mandatory two-agent refactor phase, keeps validation quick. |
| Conservative | No code before approved plan; pauses if the feature is too large, provides a mandatory advisory `Split Suggestion`, and requires explicit human choice before continuing. |
| Few stages | Four stages: Scoper, Planner, Executor, Validator. |
| Few philosophy assumptions | No mandatory OO audit, no mandatory strict TDD lecture, no Jira assumption, no mandatory refactoring methodology. |
| Clear extension points | Each stage maps to an obvious customization area: briefing, planning, execution, validation. |
| Customization path | Point to `create-workflow --using add-feature`; keep customization instructions in create-workflow help docs rather than cluttering runtime add-feature steps. |
| Links to detailed example workflow | Validator points to `add-feature-detailed-example` as a heavily customized worked example. Docs frame it as a showcase, not as the recommended next workflow. |
| Universal for developers | Uses local Markdown files and repo-native tests; no Jira, Linear, GitHub Issues, or specific design method required. |
| Demonstrates AHQ | Still shows fresh context per stage and artifact handoff, without overwhelming the first run. |

## What Gets Kept From The Current Add Feature Workflow

Keep these because they are broadly useful and not too Steve-specific:

- Fresh context per agent.
- Markdown artifact handoff between agents.
- Local `docs/tickets/{ticket-id}/workflow-files/...` structure.
- Low verbosity by default.
- "Tell Me More" as optional help.
- Human approval before implementation.
- Minimal implementation bias.
- Test-awareness.
- Recording commands run and test results.
- Follow-up refactor list.
- Final validation summary.
- Help docs as optional deeper explanation.
- The idea that the next agent reads the compressed file from the previous agent.
- The user can use any issue tracker or none.

Keep, but simplify:

- Splitting/decomposition: reduce to "this is too big; here are 2-6 informal slice suggestions; recommended action is to stop and rerun add-feature for one smaller slice" rather than full Epic/Sub-Task handling.
- TDD: present test-first as the recommended safe path, not as a mandatory doctrine.
- Refactoring: record follow-ups by default; make a full refactor stage optional or part of the detailed example workflow.
- Research: allow only if necessary, and require a short summary.

## What Gets Ditched From The Simple Workflow

Ditch these from the simple/default workflow:

- Seven mandatory agents.
- Separate Ticket Creator and Interrogator.
- Mandatory first split and later re-split decision.
- Epic/Sub-Task ticket rewriting.
- Long project design requirements audit.
- English Language Description appendix.
- Acceptance criteria audit table by default.
- Separate Refactoring Planner.
- Separate Refactoring Executor.
- Large refactor suggestion option.
- `REFACTOR:` comments in code as a required convention.
- Heavy TDD terminology.
- Instructions to hit Ctrl-C multiple times to control branching.
- Deep help-doc prose inside runtime command files.
- Any wording that implies Steve's design philosophy is the default requirement.

Do not delete these ideas from the project. Move them to `add-feature-detailed-example` and bill that workflow as a creator-specific worked example.

## Proposed File Layout

Runtime files:

```text
docs/tickets/{ticket-id}/workflow-files/
├── 01-feature-brief.md
├── 02-implementation-plan.md
├── 03-execution-summary.md
└── 04-validation-summary.md
```

For the simple flagship workflow, do not use agent-specific subdirectories.

Reason:

- There is only one primary artifact per stage.
- The numeric filename already shows ordering.
- The filename already shows purpose.
- Fewer directories makes the first-run artifact trail easier to inspect.
- Extra nesting makes the simple workflow feel more ceremonious than it is.

Agent-specific directories are still reasonable in `add-feature-detailed-example` or other heavier workflows where a stage produces multiple files.

Bundled workflow docs:

```text
.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/
└── workflow-help-docs/
    ├── 00-add-feature-user-help-doc.md
    ├── 01-scoper-help-doc.md
    ├── 02-planner-help-doc.md
    ├── 03-executor-help-doc.md
    └── 04-validator-help-doc.md
```

The simple `add-feature` workflow should not carry a separate workflow-customization file. Customization belongs in `create-workflow`.

Create-workflow docs should add help coverage for `--using`:

```text
.agentic-hq/plugins/agentic-hq-demos-plugin/skills/create-workflow/docs/
└── workflow-help-docs/
    ├── 00-create-workflow-user-help-doc.md
    └── using-existing-workflow-help-doc.md
```

Those help docs should explain `agentic-hq create-workflow --using add-feature`, how it copies/adapts an existing workflow, and how users can add stages, rules, approval gates, artifacts, and help docs.

## Suggested `agentic-hq list` Entries

```text
agentic-hq add-feature -- --ticket-id=PROJ-123
  Add a small feature using a simple four-stage brief/plan/execute/validate workflow

agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
  Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process
```

This makes the difference obvious without apologizing for the detailed example workflow or implying most users should adopt it directly.

## Suggested README Framing

Recommended structure:

1. "What Agentic HQ does"
2. "Run the simple add-feature workflow"
3. "Inspect the artifacts it created"
4. "Customize the workflow"
5. "Inspect or try out a detailed example workflow"
6. "Smoke tests: reversal and math"
7. "Build your own workflow"

The important shift:

- first show a useful real workflow,
- then show customization,
- then show depth as an example of workflow design,
- then show toy examples.

## What `create-workflow --using add-feature` Should Do

Minimum viable behavior:

```bash
agentic-hq create-workflow --using add-feature
```

It should:

1. Locate the source workflow by short id.
2. Copy its commands, skill, TypeScript workflow, templates, and help docs into a new workflow location.
3. Ask the user for:
   - new workflow id,
   - new short id,
   - one-line description,
   - what they want to add/change/remove.
4. Update IDs and command references.
5. Ask the AI to modify the copied workflow according to the user's requested process.
6. Run checks.
7. Tell the user how to run the new customized workflow.

This is probably a non-trivial feature, but it is product-important because it turns "everyone has their own workflow" from an objection into the point of the product.

For launch, `--using` does not need to solve every possible customization request. It does need to make the path credible:

- accept the `--using` option,
- copy the source workflow to a new id,
- update metadata,
- explain how the copied workflow can be adapted,
- provide help docs for the workflow-template behavior.

## Opinion On Launch Scope

Prioritize in this order:

1. Finish current AHQ-143 enough to preserve the work as `add-feature-detailed-example`.
2. Build the simple four-agent `add-feature`.
3. Add `create-workflow --using add-feature`.
4. Rewrite README around the simple workflow.
5. Clean placeholders/CI/permissions docs.

The decided launch story is the simple workflow plus a customization path. The detailed example workflow supports that story by showing how deep a personalized workflow can become.

## The Deeper Product Insight

The January meetup skeptic's objection is the key:

> Every developer has their own workflow.

AHQ should agree:

> Yes. That is why workflows should be executable, inspectable, and customizable.

The simple `add-feature` workflow is not the answer to every developer's process. It is the starter template that proves the mechanism and invites customization.

The detailed example workflow is not the default. It is proof that a serious personalized process can be encoded.

The workflow builder is not a side feature. It is the bridge from "Steve's workflows" to "your workflows."
