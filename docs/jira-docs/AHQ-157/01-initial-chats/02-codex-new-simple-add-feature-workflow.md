# Naming And Shape Of The New Simple add-feature Workflow

## Purpose

This document expands the recommendation from the [main Codex report](01-codex-report-on-what-im-doing-wrong-etc.md): Agentic HQ should not launch with the current seven-agent, highly opinionated `add-feature` workflow as the universal default.

The new recommendation is:

- `agentic-hq add-feature` should be a simple flagship starter workflow (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-157 - "Create Minimal add-feature Workflow")
- The current seven-agent workflow should become `add-feature-detailed-example`: a detailed, opinionated worked example of a highly personalized workflow, not a recommended escalation path for most users. (Jira created: https://agentic-hq.atlassian.net/browse/AHQ-155 "Rename add-feature Workflow To add-feature-detailed-example")
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


### Agent 01: Researcher

Responsibility: turn the human's feature request into `01-feature-brief.md` using bounded research, document-based clarification, and an explicit size decision.

The Researcher works in `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md`. The human writes the initial request in a `Human Prompt` section, and the Researcher then:
- Reads the Human Prompt
- Inspects the relevant code
- Reads local project docs
- Web/Perplexity Research section - Optionally: does external web or Perplexity research - only when local context is not enough to understand an external API, library, framework, standard, or domain concept. Any external research should be short, targeted, and recorded in the feature brief with source links or a short note about what was checked.  If no research required "Web/Perplexity Research" section just has a single short sentence explaining why none required.
- Creates a section under the Human Prompt: "My Understanding of This Task" - Contains a paragraph (maximum 2) with its understanding of the task of implementing this feature (can refer to Research Finding for full details of anything it discovered)
- Creates a section: "Research Findings" sections under the Human Prompt with the details of what it discovered that is relevant to the task/feature during research: e.g. relevant code, relevant docs, relevant constraints discovered, relevant web/Perplexity research results etc.

If the Researcher needs answers from the Human, it writes questions into a `Questions And Answer List` below the `Research Findings` section.

It then pauses, and asks the human to answer by filling in the answers in the doc.

Questions should be usually be limited to 2-3, but for genuinely complex or underspecified feature up to 8 are acceptable.

Each question must include an `AI Recommendation` which the human can default to by saying "Yes".

Use this format inside `Questions And Answer List`:

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
- Acceptance Criteria

and adds to the bottom of the file:

- Relevant Files Reviewed (order by decreasing relevance)
- Open Assumptions

The Researcher then decides whether the feature is a good size for one run. If it is, the feature brief does not include `Split Suggestion`; the Planner ends and the workflow continues to the Planner.

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

Options:
1. Terminate workflow and split feature. Recommended.
2. Continue with oversized feature implementation. Not recommended.
```
Option 1 is the default (if they hit Enter).

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

- Interactive questions must be avoided as we want all Questions and Answers recorded in the file.  
- Important information from human in chat should be added as UPDATE entries to their Human Prompt - quoting them verbatim.


#### Things Planner Does Not Do That add-feature-detailed-example Did

- Design the implementation or do deep implementation planning.  It's main focus is on researching what code exists that is already relevant to the feature, and (minimally and at a a high level) how it could be changed to implement the feature.
- Create an Epic/Sub-Task system or actual Sub-Task artifacts.
- Force issue-tracker behavior.
- Do open-ended research or broad investigation.

Those heavier behaviors belong in `add-feature-detailed-example`, or in customized workflows that add richer ticketing, decomposition, or issue-tracker sync.

### Agent 02: Planner

Responsibility: turn `01-feature-brief.md` into an approved `02-implementation-plan.md` before any code is written.

Planner starts by reading the finalized feature brief and inspecting the most relevant code. It then decides the minimum useful implementation approach and the minimum useful tests. If the Researcher recorded a `Split Suggestion` because the human chose to continue with an oversized feature, Planner may use that split as sequencing guidance, but not as actual Sub-Task artifacts.

Planner writes `docs/tickets/{ticket-id}/workflow-files/02-implementation-plan.md`. The plan should stay compact and include the following sections:

- Tests Being Created
- Implementation Changes
- Risks/Unknowns/Concerns (say "None" if none)
- Follow-up Ideas (say "None" if none)
- Human Approval Confirmation

Planner should recommend test-first when that is the safest path, but phrase it pragmatically rather than as a doctrine:

> The safest path is to write/confirm these tests first.

If no automated test is practical, Planner should say so and define a manual validation step.

Planner ends by asking for human approval before code is written and recording it in Human Approval Confirmation when given. Teams that want stricter methodology can later customize this stage to add design audits, stronger TDD rules, or architecture review.

#### Must Not Do

- Write code or change files.
- Move on without explicit Human Approval and it being recorded in Human Approval Confirmation section.

#### Things that are in the add-feature-detailed-example workflow that we aren't doing here:

- Write long appendices.
- Do a full project design requirements audit.
- Add English Language Description ceremony.
- Use mandatory TDD terminology if the user has not opted into it.

### Agent 03: Implementer

Responsibility: implement the approved plan with appropriate tests and record exactly what was done and what changed in `03-implementation-summary.md`.

Implementer starts by re-reading the approved implementation plan. It writes or updates the planned tests, and where appropriate runs them first to confirm they fail for the expected reason. It then implements the minimum code needed for the approved feature, runs the planned tests, and runs a quick validation command if one exists.

Implementer follows the approved plan. It implements planned work only. If implementation reveals useful work outside the plan, it records that as a follow-up.

At the end, Implementer writes `docs/tickets/{ticket-id}/workflow-files/03-implementation-summary.md` with the following sections:

- Summary Of Work Done
- Files Changed/Added/Deleted
- Tests Added/Updated And Test Results
- Manual Testing Done By AI (e.g. running CLI manually to test it - "None" if none)
- Approved Deviations From The Plan ("None" in none)
- Out Of Plan Follow-up Ideas/Concerns ("None" in none)

Teams that want more ceremony can later split this stage into more granular stages with `create-workflow --using=add-feature`, but the simple workflow keeps implementation in one focused pass.

#### Must Not Do

- Broaden scope beyond the approved plan.
- Deviate from the plan without stopping and getting human consent to modify the plan.

### Agent 04: Reviewer

Responsibility: perform a concise code review, write `04-review-summary.md`, and ask the human whether to fix any selected findings.

Reviewer starts by reading the feature brief, implementation plan, implementation summary, and the actual changed files. It reviews the work like a pragmatic senior developer: did the intended behavior ship, were the tests and regression checks good enough, what is the risk of this change, and what could be improved?

Reviewer is not allowed to fix issues silently. It first writes `04-review-summary.md` with findings, risks, and improvement suggestions. Then it asks the human: "Do you want me to fix any of this?"

If the human says yes, Reviewer agrees a small fix plan with the human, applies only the selected fixes, runs the relevant checks, and records what it changed in `04-review-summary.md`. If the human says no, Reviewer leaves the findings as follow-ups.

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

## Evidence And Recommendations

| Area | Evidence | Result / Risk | Recommendation |
| --- | --- | --- | --- |
| Acceptance criterion 1 | File, behavior, test, or manual-check evidence | Pass / Fail / Not validated | Do now / defer / do nothing |
| Test evidence | Exact command, automated test, or manual check and result | Pass / Fail / Not run | Do now / defer / do nothing |
| Regression coverage gaps | Changed areas reviewed; where regression tests were missing or insufficient; suggested concrete tests | Good enough / Weak / Missing | Do now / defer / do nothing |
| Highest-risk changed area | Specific changed file, behavior, or dependency, and why it is the riskiest part of the change | Low / Medium / High, with reason | Do now / defer / do nothing |
| Improvement suggestion 1 | Specific possible improvement | Worth doing / not worth it, with reason | Do now / defer / do nothing |
| Improvement suggestion 2 | Specific possible improvement | Worth doing / not worth it, with reason | Do now / defer / do nothing |

## Selected Fixes Applied

Only include if the human approved review fixes.

## Remaining Follow-Ups

Short list, or "None".

## Final Human Confirmation

Record the human's final decision.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

```
The table must include all acceptance criteria, one test evidence row, one regression coverage gaps row, one highest-risk changed area row, and at least two possible improvement suggestions. The regression coverage gaps row must not merely repeat the test commands. It must name the changed areas Reviewer inspected; if regression coverage is missing or weak, it must suggest concrete tests; if it is good enough, it must explain why. If Reviewer cannot point to evidence, it must say `Not validated`. If it recommends "do nothing", it must explain why the risk/cost does not justify more work.



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

## What Gets Kept From The Current Add Feature Workflow (Which Is Being Renamed To `add-feature-detailed-example`)

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
- Scope discipline: Implementer follows the approved plan and implements planned work only. No refactoring stage. If the human wants a refactor phase, they add it using `agentic-hq create-workflow --using=add-feature`.  Reviewer only fixes missing requirements or missing/limited tests.
- Research: allow permitted if necessary

## What Gets Ditched From The Simple Workflow

The following elements of add-workflow-detailed-example are being ditched in this simple add-feature workflow:

- Seven mandatory agents.
- Separate initial discovery stages.
- Mandatory first split and later re-split decision.
- Epic/Sub-Task ticket rewriting.
- Long project design requirements audit.
- English Language Description appendix.
- Acceptance criteria audit table.
- Heavy TDD terminology.
- Instructions to hit Ctrl-C multiple times to control branching.
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

