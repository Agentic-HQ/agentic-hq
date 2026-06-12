# Fable's Self-Prompt Response: Build-Ready add-feature Spec (v2) With Decision Register

## How To Use This Document

This document answers the prompt in `05-fables-self-prompt.md`. It contains:

- **Part 1 — Decision Register.** Every place where v2 changes or completes the 02 spec, in AHQ's own in-file Q&A format. Each entry maps back to its finding ID in `04-fables-response.md`, so answering an entry here also closes the corresponding Decision field in 04. Answer `Yes` to accept the AI Recommendation; answer anything else and I will revise the spec to match.
- **Part 2 — The Spec (v2).** A fully self-contained build input for AHQ-157. It does not reference the 02 document; the AI that builds the workflow gets this spec plus the repository.
- **Part 3 — What I Deliberately Did Not Change.**
- **Part 4 — Conflict Check** against your earlier statements (01, 01b, planning docs), per rule 10 of the prompt.
- **Part 5 — 04 Decisions Not Covered Here**, so nothing silently drops off the list.

Once the register is answered, promote Part 2 (with any revisions) to wherever the AHQ-157 build spec should live, and the next prompt is: build it.

---

## Part 1: Decision Register

### Applied Without A Decision: The Four Text Errors (04 → S1)

These are corrections of plain defects, not judgment calls, so they are simply applied in v2:

1. "the Planner ends and the workflow continues to the Planner" → "the **Researcher** ends and the workflow continues to the Planner" (02 line 148).
2. The section "Things **Planner** Does Not Do That add-feature-detailed-example Did" sat under Agent 01 and described the Researcher → retitled "Things The **Researcher** Does Not Do" and kept under Agent 01 (02 lines 190-197).
3. "Research: allow permitted if necessary" → "External research: allowed when local context is insufficient, but bounded and recorded" (02 line 357).
4. "add-workflow-detailed-example" → "add-feature-detailed-example" (02 line 361).

One additional defect found on the re-read, also simply fixed: 02 names the Q&A section `Questions And Answer List` in the prose but the artifact structure implies `Questions And Answers`. v2 standardises on **`Questions And Answers`** everywhere.

*Steve answered S1 in 04: **Fix** — confirmed.*

### Decision 1: Bootstrap — Who Creates The Feature Brief? (04 → S2)

**What 02 said:** "The human writes the initial request in a `Human Prompt` section" of `01-feature-brief.md` — with no statement of who creates the directory or file, or when the human writes into it. The implied first-run experience was: human manually runs `mkdir -p`, creates a markdown file with a correctly named section, writes their prompt, then runs the CLI.

**What v2 says:** The Researcher bootstraps. On start it checks for `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md` with a non-empty `Human Prompt` section. If found, it uses it (supporting power users and re-runs). If not, the Researcher creates the directory and file, asks the human in chat for the feature request, and records the request **verbatim** into `Human Prompt`. Both paths are first-class.

**Why:** The flagship's pitch is "see value quickly"; its first sixty seconds cannot be manual directory ceremony. Recording the chat request verbatim is consistent with the existing rule that substantive chat input is quoted verbatim into the document.

**AI Recommendation:** Accept — Researcher bootstraps from chat, pre-existing file honoured.

**Human Answer ('Yes' means follow AI Recommendation):** Researcher bootstraps from chat *(transferred from 04/S2)*. Steve's comment: "I'm sure this would not have been a problem, the AI writing this would have picked up on it."

*Fable note on a sliver this leaves open:* 04's options separated "bootstraps from chat" from "pre-existing file honoured"; this register entry had bundled both. Unless you say otherwise, the build keeps minimal file-exists handling anyway — a brief left by a previous or crashed run is used, not clobbered.

### Decision 2: Document Trimming — Merged Sections And The "None" Rule (04 → S3, part 1)

**What 02 said:** ~25 mandatory sections across the four artifacts, several existing only to say "None", including a mandatory sentence explaining *why no external research was needed*, a separate "Web/Perplexity Research" section, a separate "Manual Testing Done By AI" section, and "at least two improvement suggestions" in the review.

**What v2 says:**
- "Web/Perplexity Research" is folded into "Research Findings" as an optional **External Research** subsection; if no external research was needed, the subsection is simply omitted — no explanation owed.
- "Manual Testing Done By AI" is folded into a single **Tests And Results** section in the implementation summary.
- "At least two improvement suggestions" relaxes to "any improvements worth listing, including none".
- Empty optional sections are **omitted**, not filled with "None" — with two deliberate exceptions that must say "None" explicitly: the Planner's **Risks/Unknowns/Concerns** and the Implementer's **Approved Deviations From The Plan**. For those two, an explicit "None" is an attestation ("I considered this and there are none"), whereas absence is ambiguous ("did the agent forget?"). For everything else, the next agent gains nothing from a "None" row and the human gains less.

**Why:** This is the trimming pass from S3. Note one refinement versus 04, which recommended omit-when-empty across the board: the two attestation sections keep an explicit "None" because they are the workflow's risk record and its scope-discipline record — the two places where silence and absence must not be confusable.

**AI Recommendation:** Accept, including the two-attestation-section exception.

**Human Answer ('Yes' means follow AI Recommendation):** Partially — transferred from 04/S3:
- **Keep `Web/Perplexity Research` as its own section** (rejects the fold-in): "makes it clearer none was done and takes 0.5 seconds to scan over."
- **Yes** to folding "Manual Testing Done By AI" into Tests And Results ("overkill").
- The improvement-suggestion minimum is handled under Decision 3.

**Still open (answer here):** the omit-empty-sections vs explicit-"None" rule, including the two attestation exceptions — 04's S3 comment didn't address it.  Human: keep the "explicit-"None"" rule

### Decision 3: The Review Evidence Table — Kept, Slimmed, And Honestly Labelled (04 → S3, part 2)

**What 02 said:** The "What Gets Ditched" list includes "Acceptance criteria audit table" — and the Reviewer section then mandates a six-row acceptance-criteria-plus-evidence table governed by a paragraph of population rules, including a mandatory minimum of two improvement-suggestion rows.

**What v2 says:** The table is **kept** — it is the mechanism that stops the Reviewer rubber-stamping — but slimmed: mandatory rows are one per acceptance criterion, one test-evidence row, one regression-coverage row, and one highest-risk-changed-area row; improvement suggestions are optional rows (zero or more). And the ditched list is corrected to ditch what is actually being ditched: the detailed example's *long project design requirements audit*, not the evidence table v2 keeps.

**Why:** A sceptical user comparing the ditched list to the Reviewer spec would catch the contradiction; better that the spec is honest that the creator's favourite artifact survived — in slimmer form — because it earns its place.

**AI Recommendation:** Accept — keep slim table, fix the ditched list.

**Human Answer ('Yes' means follow AI Recommendation):** Modified — transferred from 04/S3: **keep the minimum of two improvement suggestions** (do NOT relax to zero-or-more): "I've seen too many Agents just do a quick pass and come up answer 'All looks great. Review passed. :-)' — this technique forces the AI to do some real searching and at least come up with suggestions (even if they are overkill)." To make the minimum cheap for the human: each suggestion's Area label must end with **(RECOMMENDED)** or **(NOT RECOMMENDED)** so not-recommended ones can be skipped at a glance. The ditched-list honesty fix and the other mandatory rows stand as specified.

### Decision 4: Command File Line Budgets (04 → S3, part 3)

**What 02 said:** Nothing checkable. "Short" and "compact" appear as adjectives only.

**What v2 says:** Each of the four command files must be **≤ 150 lines**. Each runtime artifact must be readable in under two minutes. These are stated in the spec as checkable build constraints and appear in the Definition of Done.

**Why:** The detailed example's command files average 289 lines; "the simple one is around half as long" is a claim the builder, the reviewer, and CI can all verify. Without a number, instruction-creep wins — it always does.

**AI Recommendation:** Accept the 150-line budget.

**Human Answer ('Yes' means follow AI Recommendation):** **No** — transferred from 04/S3: no hard line budgets. "We can tune that kind of thing once we have **real** feedback from **real** people doing **real** work. Doing it based on what you think is the right length now — with zero experience — is a waste of time (this is what I'm trying to avoid here!!!!)" Consequence: the ≤150-line constraints drop from the spec, the builder guidance, and the Definition of Done; "short" stays as direction, not a checkable number.

### Decision 5: Implementer's Failing-Test Path (04 → S4)

**What 02 said:** The Implementer "runs the planned tests" — nothing about what happens when they fail and cannot be made green within the approved plan's scope.

**What v2 says:** Three rules, verbatim in the Implementer's spec: iterate within plan scope until green; if blocked, **stop and ask the human** (the agreed change is recorded as an UPDATE in the plan and under Approved Deviations) rather than deviating silently; and **never weaken, delete, or skip a failing test to make it pass** — a failing test is information for the human, not an obstacle for the agent.

**Why:** A red test that won't go green is the most common real outcome of an AI implementation pass and the moment agents do their worst damage. The never-weaken rule is the one piece of test philosophy that genuinely is universal, so it costs the workflow no "unopinionated" credibility.

**AI Recommendation:** Accept all three rules.

**Human Answer ('Yes' means follow AI Recommendation):** Yes *(transferred from 04/S4: "Add")*.

### Decision 6: The Stage Outcome Contract (04 → S5) — *the one item that is new behaviour*

**What 02 said:** The Researcher "returns `TERMINATE_WORKFLOW` to the TypeScript workflow program which terminates the workflow" / "returns CONTINUE_WORKFLOW … and the workflow continues" — with no exact string format, no exit-code semantics, and no rule for unexpected values.

**What v2 says:** A precise contract (Part 2, "Stage Outcome Contract"): the Researcher's returned output is, after trimming whitespace, **exactly** `TERMINATE_WORKFLOW` or `CONTINUE_WORKFLOW` in every run — including the no-split happy path, which returns `CONTINUE_WORKFLOW`. The TS program: on `TERMINATE_WORKFLOW`, prints a clear message and exits **0** (termination is a success path, not an error); on `CONTINUE_WORKFLOW`, runs agents 02-04; on **anything else, prints the unexpected value and exits 1** — fail fast, no silent fallback, per the house rule. The build must include fake-claude-cli tests driving both branches plus the unexpected-value case.

Per rule 9 of the prompt, flagged explicitly: this is the only item in v2 that is **new behaviour** rather than editing. It requires **zero engine changes** — the existing detailed-example CLI already receives Command 01's output string from `tool.execute(...)`; the new CLI simply branches on it. It is the first real control flow in any AHQ workflow, the start of the structured-outcomes system Codex asked for (point 14), and the proper retirement of "hit Ctrl-C multiple times".

**AI Recommendation:** Accept — contract as specified, with the fake-CLI tests mandatory in the build.

**Human Answer ('Yes' means follow AI Recommendation):** Yes — Specify + fake-CLI test *(transferred from 04/S5: "Good spot!!")*.

### Decision 7: Reviewer Fix Scope (04 → S6) — RESOLVED BY DIRECT EDIT TO 02

The contradiction is gone: Steve edited 02 line 356 from "Reviewer only fixes missing requirements or missing/limited tests" to "Reviewer fixes missing requirements or missing/limited tests or anything else that is broken." — which now agrees with the Agent 04 section (human selects from the written findings; Reviewer applies only selected fixes). No spec patch needed for this item.

### Decision 8: ticket-id Validation (04 → S7) — DITCHED AT STEVE'S INSTRUCTION

Steve rejected this entirely (it was AI-proposed machinery, not anything from 02): no validation regex, no rejection behaviour, no validation test case. `ticket-id` stays a human-managed mandatory parameter, unvalidated, with 02's existing README guidance unchanged. All validation references have been removed from this document. 04's S7 is closed the same way: **ditch**.

### Decision 9: Chat-Interaction Policy (04 → S8.1) — RESOLVED BY DIRECT EDIT TO 02

Steve edited 02's Important Rules line to: "Substantive questions must go in the Q&A section of the file, not chat. Quick approvals/choices in chat are fine, but must be recorded in the doc." That removes the contradiction (the rule no longer bans the approvals the spec elsewhere requires). The six-moment enumeration proposed here was gold-plating and is dropped. No spec patch needed for this item.

### Decision 10: Artifacts In The User's Repo, And The Missing Commit Step (04 → S8.2, S8.3) — DELETED

Nit-picky, not worth looking at now — real feedback will reveal it if it matters.

### Decision 11: Expectation-Setting In The User Help Doc (04 → S8.4) — DELETED

Nit-picky, not worth looking at now — and "it felt slow" arriving unprompted from the friend is exactly the kind of real feedback the share is for.

---

## Part 2: Spec v2 — The Simple add-feature Workflow (Build Input For AHQ-157)

> **Status:** REFERENCE ONLY — written before the register was answered, with every AI Recommendation applied as the default. The register answers now diverge from it in places (Decisions 2, 3, 4). This Part will not be hand-corrected; the actual build input will be a **surgically patched copy of the 02 spec**, applying the answered register decisions as minimal edits, reviewable as a diff against 02. Read this Part for orientation, not as the source of truth.
>
> **Self-containment:** This spec is the complete build input. The builder AI needs this document plus the repository (see "Guidance To The Builder AI") and nothing else.

### Purpose

`agentic-hq add-feature` is the flagship starter workflow: the first serious workflow a new Agentic HQ user runs. It is deliberately small, generic, and customizable. It avoids creator-specific process ideas, issue-tracker assumptions, heavyweight design audits, and methodology lectures. It demonstrates the core AHQ ideas — fresh context per stage, human-readable markdown artifact handoff, human approval gates, in-file Questions And Answers — on the minimum useful AI-assisted feature loop.

It is one of three related commands:

- `add-feature` — "Start here. This is deliberately small. Run it once. Then make it yours."
- `add-feature-detailed-example` — "A worked example of how far AHQ workflows can go when customized around one creator's personal development process." An example, not a recommendation.
- `create-workflow --using=add-feature` — "Clone an existing workflow and adapt it to your own process." (AHQ-159; until it ships, the customization pointer names the manual-clone path instead.)

### One-Line Summary

`add-feature` is a short, generic, customizable four-stage workflow that helps a developer research a small feature, make a lightweight plan, implement it with tests, and finish with a concise evidence-backed review.

### One-Paragraph Summary

The workflow runs four agents — **Researcher, Planner, Implementer, Reviewer** — each in a fresh context, each reading the previous stage's markdown artifact and writing its own. The Researcher turns the human's request into a feature brief using bounded research and in-file Q&A, and decides whether the feature is the right size for one run (terminating the workflow with a split suggestion if not). The Planner produces a compact implementation plan that the human must approve before any code is written. The Implementer implements the approved plan with the planned tests and records exactly what changed. The Reviewer reviews the work like a pragmatic senior developer, writes an evidence-backed summary, and fixes only what the human selects. At the end, the user is pointed at the customization path: clone this workflow and make it match their own process.

### High-Level Flow

```text
human request
    │
    ▼
01 Researcher ──► 01-feature-brief.md ──► TERMINATE_WORKFLOW (split & rerun)
    │                                          or
    ▼ CONTINUE_WORKFLOW
02 Planner ──► 02-implementation-plan.md (human approval gate — no code before this)
    │
    ▼
03 Implementer ──► 03-implementation-summary.md (code + tests)
    │
    ▼
04 Reviewer ──► 04-review-summary.md (evidence table, human-selected fixes)
```

Four agents is the deliberate number: a front-loaded bounded research stage, a plan-before-code stage, a focused implementation stage, and a fresh-eyes review stage. Not three (the plan-approval gate deserves its own fresh context, and the fresh-eyes Reviewer is the live demonstration of the AHQ thesis) and not more (everything heavier belongs in the detailed example or a customized clone).

### The TypeScript Workflow Program

#### Command Line Contract

The TS program (`add-feature-cli.ts`, mirroring the naming and structure of the existing `add-feature-detailed-example-cli.ts`) has exactly one mandatory parameter:

```text
agentic-hq add-feature -- --ticket-id=PROJ-123
```

There is no verbosity parameter and no other option. The human manages the ticket-id, not the agent.

Startup requirements, in order:

1. `AGENTIC_HQ_WORKSPACE_ROOT` must be set; if not, print a clear error and exit 1 (same as the existing workflows).
2. `--ticket-id` must be supplied (a mandatory option). The human manages the ticket-id; the workflow does not validate or interpret it.

The program builds the variables string itself (workspace root + ticket-id) and passes the **same string** to all four commands. Unlike the detailed example, no re-inject/broadcast of Command 01's output is needed: the ticket-id is human-supplied, so the program already knows every variable. Command 01's output is reserved for the outcome contract below. The outputs of commands 02-04 are ignored.

#### Stage Outcome Contract

The Researcher's returned output string is the stage outcome. After trimming whitespace it must be exactly one of:

- `CONTINUE_WORKFLOW` — the program proceeds to run agents 02, 03, 04 in order.
- `TERMINATE_WORKFLOW` — the program prints a clear, friendly message (the workflow ended at the user's request following a split suggestion; rerun `add-feature` for each sub-task) and exits **0**. Termination is a success path, not an error.

Any other value: the program prints an error **including the actual value received** and exits 1. No silent fallback, no "assume continue" — an unexpected outcome means the workflow is broken and the human must see it.

The Researcher must return one of the two values in **every** run, including the ordinary no-split happy path (which returns `CONTINUE_WORKFLOW`).

This contract is the first real control flow in any AHQ workflow. It requires no engine changes: the workflow's TS program already receives each command's output string from `tool.execute(...)`; it simply branches on Command 01's.

#### Required Tests For The TS Program

The build must include behavioural tests using the existing fake-claude-cli fixture pattern from the current test suite (no real Claude invocations). Minimum cases:

1. **Continue branch:** Researcher fixture returns `CONTINUE_WORKFLOW` → all four commands invoked, in order, with the same variables string.
2. **Terminate branch:** Researcher fixture returns `TERMINATE_WORKFLOW` → commands 02-04 are never invoked; exit code 0; termination message printed.
3. **Unexpected outcome:** Researcher fixture returns anything else → exit code 1; error names the received value.
4. **Missing `AGENTIC_HQ_WORKSPACE_ROOT`:** exit 1 with clear message.

This branch is the only real logic in the TS program; it is the one thing that must have deterministic tests.

### Rules Shared By All Four Agents

1. **Fresh context per agent.** Each agent starts clean and reads the artifacts of the stages before it. The artifact is the handoff; there is no other channel between stages.
2. **The file is the system of record; chat is for prompts-to-act and approvals.** Exactly six chat interactions are sanctioned:
   1. The Researcher's bootstrap request for the feature description (when no usable `Human Prompt` exists yet).
   2. The Researcher's "I've written questions into the brief — please answer them in the file, then tell me to continue."
   3. The Researcher's split-decision options prompt.
   4. The Planner's request for plan approval.
   5. The Reviewer's "Do you want me to fix any of this?" and the selection of fixes.
   6. The Reviewer's final confirmation.
   Every decision made in chat is recorded into the relevant document immediately afterwards. Substantive *information* the human gives in chat (beyond yes/no/selection) is quoted **verbatim** as an `UPDATE` entry in the `Human Prompt` section. No other interactive questioning — substantive Q&A goes through the in-file Questions And Answers mechanism.
3. **Verbatim preservation.** The `Human Prompt` section and the `Questions And Answers` section are never edited, summarised, or "folded in". They are preserved verbatim for the life of the document. Clarifications are appended as `UPDATE` entries, never rewrites.
4. **Section economy.** A section with nothing to say is omitted — except the two attestation sections, which must say "None" explicitly: the Planner's `Risks/Unknowns/Concerns` and the Implementer's `Approved Deviations From The Plan`. (For those two, "None" means "considered, and there are none"; absence would be ambiguous.)
5. **Budgets.** Each command file: **≤ 150 lines**. Each runtime artifact: readable by the human in under two minutes. If a section does not change what the next agent or the human does, it does not exist.
6. **"Tell Me More".** Each stage offers optional deeper help by pointing at its bundled help doc; it never inlines that material into the runtime flow.
7. **No version control actions.** The workflow never runs `git add`, `git commit`, or `git push`. Committing is deliberately left to the human.

### Agent 01: Researcher

**Responsibility:** turn the human's feature request into `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md` using bounded research and in-file clarification, and make an explicit size decision that determines whether the workflow continues.

#### Bootstrap

On start, the Researcher checks for `docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md` containing a non-empty `Human Prompt` section.

- **Found:** use it as the feature request (this supports power users who pre-write the brief, and re-runs).
- **Not found (no file, or file without a usable Human Prompt):** the Researcher creates the directory and the file, asks the human in chat to describe the feature, and records the description **verbatim** into the `Human Prompt` section.

Either way, the human never has to create directories or files by hand.

#### Research

The Researcher then:

- Reads the `Human Prompt`.
- Inspects the relevant code.
- Reads relevant local project docs.
- Optionally does **bounded external research** (web / Perplexity) — only when local context is not enough to understand an external API, library, framework, standard, or domain concept. Any external research is short, targeted, and recorded inside `Research Findings` as an `External Research` subsection with source links or a short note of what was checked. If no external research was needed, the subsection is simply omitted.

It writes:

- `My Understanding Of This Task` — at most two paragraphs; may refer to Research Findings for details.
- `Research Findings` — what it discovered that is relevant: relevant code, relevant docs, relevant constraints, external research results.

#### Questions And Answers

If the Researcher needs answers from the human, it writes them into a `Questions And Answers` section below `Research Findings`, then pauses (sanctioned chat moment 2) and asks the human to answer **in the file**. Usually 2-3 questions; up to 8 for a genuinely complex or underspecified feature. Each question must include an `AI Recommendation` the human can adopt by answering "Yes":

```markdown
### Question 1

**Question:** Should this feature support X, or only Y for the first version?

**AI Recommendation:** Start with Y only. It keeps this feature small, testable, and easier to validate in one run.

**Human Answer ('Yes' means follow AI Recommendation):**
```

After the human answers, the Researcher re-reads the file and:

- Updates `My Understanding Of This Task` and `Research Findings` where the answers change them — referring to questions by number rather than duplicating answer text.
- Does any follow-up research the answers require, and may ask further questions the same way if genuinely necessary.

#### Finalising The Brief

When it has what it needs, the Researcher adds to the **top** of the document:

- `One Sentence Outcome`
- `User Story` (optional — omit when it adds nothing)
- `Acceptance Criteria`

and to the **bottom**:

- `Relevant Files Reviewed` (ordered by decreasing relevance)
- `Open Assumptions` (omit if none)

#### The Size Decision

The Researcher then decides whether the feature is a good size for one run.

**Right-sized:** the brief contains no `Split Suggestion`; the Researcher ends and returns `CONTINUE_WORKFLOW`; the workflow continues to the Planner.

**Oversized:** the Researcher pauses (sanctioned chat moment 3), explains why, and appends a `Split Suggestion` section to the brief proposing 2-6 smaller sub-tasks — usually with an early slice labelled `Tracer Bullet / Walking Skeleton` when that framing fits. It then presents (adapting the Why and the suggestions to the actual situation):

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

Option 1 is the default if the human hits Enter.

**Human chooses option 1 (split):**
- Retitle the section `Split Suggestion (Accepted)` and record at its top that the Researcher flagged the feature as oversized, recommended splitting, and the human accepted and terminated the workflow, intending to run each sub-task as its own feature.
- Tell the human to run `add-feature` again for each sub-task, and in each sub-task's `Human Prompt` to reference `{full-path}/01-feature-brief.md` as the parent feature brief.
- Return `TERMINATE_WORKFLOW`.

**Human chooses option 2 (continue anyway):**
- Retitle the section `Split Suggestion (Rejected)` and record at its top that the Researcher flagged the feature as oversized, recommended splitting, and the human explicitly chose to continue with higher risk.
- Tell the human the Researcher is complete and the Planner runs next.
- Return `CONTINUE_WORKFLOW`. (The Planner may use the rejected split as sequencing guidance.)

#### Things The Researcher Does Not Do

- Design the implementation or do deep implementation planning. Its focus is what code already exists that is relevant, and — minimally, at a high level — how it could change to implement the feature.
- Create an Epic/Sub-Task system or actual sub-task artifacts.
- Force issue-tracker behaviour.
- Do open-ended research or broad investigation.

Those heavier behaviours belong in `add-feature-detailed-example` or in customized clones.

#### `01-feature-brief.md` — Final Structure

```text
One Sentence Outcome
User Story                      (optional — omit if not useful)
Acceptance Criteria
Human Prompt                    (verbatim; UPDATE entries allowed)
My Understanding Of This Task   (max 2 paragraphs)
Research Findings               (with optional External Research subsection)
Questions And Answers           (verbatim; only present if questions were asked)
Relevant Files Reviewed         (decreasing relevance)
Open Assumptions                (omit if none)
Split Suggestion (Accepted|Rejected)   (only present if the size decision flagged a split)
```

### Agent 02: Planner

**Responsibility:** turn the finalised feature brief into an approved `02-implementation-plan.md` **before any code is written**.

The Planner reads the feature brief, inspects the most relevant code, and decides the minimum useful implementation approach and the minimum useful tests. If the brief contains a `Split Suggestion (Rejected)`, the Planner may use it as sequencing guidance — but never as actual sub-task artifacts.

It writes `docs/tickets/{ticket-id}/workflow-files/02-implementation-plan.md`, compact, with these sections:

```text
Tests Being Created
Implementation Changes
Risks/Unknowns/Concerns         (attestation section — must say "None" explicitly if none)
Follow-up Ideas                 (omit if none)
Human Approval Confirmation
```

The Planner recommends test-first when it is the safest path, phrased pragmatically rather than as doctrine:

> The safest path is to write/confirm these tests first.

If no automated test is practical, the plan says so and defines a manual validation step instead.

The Planner ends by asking for human approval (sanctioned chat moment 4) and recording the approval in `Human Approval Confirmation`. Teams that want stricter methodology customize this stage later — design audits, stronger TDD rules, architecture review all belong in clones.

#### Must Not Do

- Write code or change any files other than its own plan document.
- Move on without explicit human approval recorded in `Human Approval Confirmation`.
- Write long appendices, run a project design requirements audit, add English Language Description ceremony, or use mandatory TDD terminology the user has not opted into.

### Agent 03: Implementer

**Responsibility:** implement the approved plan with the planned tests, and record exactly what was done in `03-implementation-summary.md`.

The Implementer re-reads the approved plan, then:

1. Writes or updates the planned tests. Where practical it runs them **before implementing**, confirming they fail for the expected reason.
2. Implements the minimum code needed for the approved feature.
3. Runs the planned tests; iterates **within plan scope** until green.
4. Runs the repo's quick validation command if one exists.

**When tests will not go green within plan scope:** the Implementer stops and asks the human (this falls under the plan-approval gate — the plan is being amended, so the amendment is agreed in chat, recorded as an `UPDATE` in `02-implementation-plan.md`, and listed under `Approved Deviations From The Plan`). It does not silently deviate. And it **never weakens, deletes, or skips a failing test to make it pass** — a failing test is information for the human, not an obstacle for the agent.

The Implementer implements planned work only. Useful work discovered outside the plan is recorded as a follow-up, not done.

It writes `docs/tickets/{ticket-id}/workflow-files/03-implementation-summary.md`:

```text
Summary Of Work Done
Files Changed/Added/Deleted
Tests And Results               (automated test commands + results; any manual testing the AI did, e.g. running a CLI by hand)
Approved Deviations From The Plan   (attestation section — must say "None" explicitly if none)
Follow-up Ideas/Concerns        (omit if none)
```

Teams wanting more ceremony can split this stage into granular stages in a customized clone; the simple workflow keeps implementation as one focused pass.

#### Must Not Do

- Broaden scope beyond the approved plan.
- Deviate from the plan without stopping and getting the human's consent to amend it.
- Weaken, delete, or skip failing tests to force a pass.

### Agent 04: Reviewer

**Responsibility:** review the shipped work with fresh eyes, write an evidence-backed `04-review-summary.md`, and fix only what the human selects.

The Reviewer reads the feature brief, the implementation plan, the implementation summary, and the **actual changed files**. It reviews like a pragmatic senior developer: did the intended behaviour ship, were the tests and regression checks good enough, what is the risk of this change, what could be improved?

The Reviewer never fixes anything silently. It first writes the full review summary, then asks (sanctioned chat moment 5): *"Do you want me to fix any of this?"* The human may select **any finding written in the summary** — the findings list itself is the boundary of fixable scope. For selected findings, the Reviewer agrees a small fix plan with the human, applies only those fixes, runs the relevant checks, and records what changed under `Selected Fixes Applied`. Unselected findings remain as follow-ups.

#### `04-review-summary.md` — Required Structure

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
| Improvement suggestion (optional, zero or more rows) | Specific possible improvement | Worth doing / not worth it, with reason | Do now / defer / do nothing |

## Selected Fixes Applied

Only include if the human approved review fixes.

## Remaining Follow-Ups

Short list, or "None".

## Final Human Confirmation

Record the human's final decision.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process: run
`agentic-hq create-workflow --using=add-feature` to make a copy and add your own stages,
rules, and approval gates. To see a worked example of a very detailed personal workflow,
inspect or try out `agentic-hq add-feature-detailed-example`.
```

Table rules: mandatory rows are one per acceptance criterion, the test-evidence row, the regression-coverage row, and the highest-risk row; improvement rows are optional (zero or more). The regression row must not merely repeat test commands — it names the changed areas inspected, suggests concrete tests where coverage is weak or missing, and explains why coverage is good enough where it is. If the Reviewer cannot point to evidence, the result is `Not validated`. Every "do nothing" recommendation must explain why the risk/cost does not justify more work. Generic "looks good" summaries are not acceptable output.

(If AHQ-159 has not shipped when this workflow is built, `Customization Next Step` instead points to the manual-clone instructions in the user help doc, and is updated when `--using` lands.)

#### Does Not Do

- Implement fixes silently or apply unapproved fixes.
- Rubber-stamp without evidence and recommendations.
- Do a full redesign or an exhaustive architecture audit.

### File Layout

Runtime artifacts (in the **user's** repo):

```text
docs/tickets/{ticket-id}/workflow-files/
├── 01-feature-brief.md
├── 02-implementation-plan.md
├── 03-implementation-summary.md
└── 04-review-summary.md
```

Bundled workflow files (in the AHQ plugin, mirroring the detailed example's layout — command files at the plugin's `commands/` level, skill + TS workflow under `skills/`):

```text
.agentic-hq/plugins/agentic-hq-demos-plugin/
├── commands/add-feature/
│   ├── 01-researcher.md
│   ├── 02-planner.md
│   ├── 03-implementer.md
│   └── 04-reviewer.md
└── skills/add-feature/
    ├── ts-workflow/src/add-feature-cli.ts        (plus tests per the TS contract above)
    └── docs/workflow-help-docs/
        ├── 00-add-feature-user-help-doc.md
        ├── 01-researcher-help-doc.md
        ├── 02-planner-help-doc.md
        ├── 03-implementer-help-doc.md
        └── 04-reviewer-help-doc.md
```

### User Help Doc Requirements

`00-add-feature-user-help-doc.md` must cover, briefly and honestly:

1. **Positioning:** `add-feature` is for features big enough to want a plan. On a trivial change it will be slower than just asking Claude directly — you are paying for fresh-context stages and human approval gates, which is the point. Give a rough wall-clock expectation for a typical run.
2. **ticket-id:** the guidance exactly as 02 already states it — the human provides a ticket id (made up if they have no issue tracker); 3 or 4 digit indexes keep file ordering numeric (e.g. `PROJ-123`).
3. **Artifacts:** the workflow writes its files into your repo under `docs/tickets/`. Commit them or `.gitignore` them — your choice; both are fine.
4. **No commit step:** the workflow never commits; committing is deliberately left to you. Nothing was forgotten.
5. **Customization:** pointer to `create-workflow --using=add-feature` (or, until AHQ-159 ships, the manual-clone instructions: copy the skill and commands directories, rename, edit).

### What Gets Kept From add-feature-detailed-example

The builder AI should read the detailed example's commands, docs, and TypeScript and reuse its file naming and organisation — with the changes and simplifications in this spec.

Kept because broadly useful and not creator-specific:

- Fresh context per agent.
- Markdown artifact handoff; the next agent reads the compressed file from the previous agent.
- Local `docs/tickets/{ticket-id}/workflow-files/...` structure.
- "Tell Me More" as optional help.
- Human approval before code and after review.
- Focus on a *minimal* code implementation.
- Test-awareness; recording commands run and test results.
- Final review summary, including a slim evidence table.
- Help docs as optional deeper explanation.
- The user can use any issue tracker or none.

Kept but simplified:

- **Splitting/decomposition:** reduced to "this is too big; here are 2-6 informal slice suggestions; recommended action is terminate and rerun `add-feature` per slice" — no Epic/Sub-Task handling.
- **TDD:** test-first presented as the recommended safe path, not mandatory doctrine.
- **Scope discipline:** the Implementer follows the approved plan and implements planned work only; no refactoring stage (add one via a customized clone if you want it). The Reviewer fixes only human-selected findings from its written summary.
- **External research:** allowed when local context is insufficient, but bounded and recorded.

### What Gets Ditched

Ditched from the simple workflow (all remain visible in `add-feature-detailed-example`):

- Seven mandatory agents.
- Separate initial discovery stages.
- Mandatory first split and later re-split decisions.
- Epic/Sub-Task ticket rewriting.
- The long project design requirements audit.
- The English Language Description appendix.
- Heavy TDD terminology.
- Instructions to hit Ctrl-C multiple times to control branching (replaced by the Stage Outcome Contract).
- Wording that implies the creator's design philosophy is the default requirement.

### How The Workflow Satisfies Every Starter Requirement

| Requirement | How It Is Satisfied |
| --- | --- |
| Short | Four agents instead of seven. One concise document per stage. Command files ≤ 150 lines. No appendices. |
| Fast | One bounded Researcher stage; no extra mandatory stages; concise review. |
| Conservative | No code before an approved plan; pauses on oversized features with a mandatory advisory `Split Suggestion` and an explicit human choice. |
| Few stages | Researcher, Planner, Implementer, Reviewer. |
| Few philosophy assumptions | No mandatory OO audit, no TDD lecture, no Jira assumption, no creator-specific methodology. |
| Clear extension points | Each stage maps to an obvious customization area: research, planning, implementation, review. |
| Customization path | `create-workflow --using=add-feature` (with a documented manual-clone fallback until it ships). |
| Links to the detailed example | The Reviewer's `Customization Next Step` frames it as a showcase, not the recommended next workflow. |
| Universal for developers | Local markdown and repo-native tests; no Jira, Linear, GitHub Issues, or specific design method required. |
| Demonstrates AHQ | Fresh context per stage, artifact handoff, in-file Q&A, approval gates — without overwhelming the first run. |

### Suggested `agentic-hq list` Entries

```text
agentic-hq add-feature -- --ticket-id=PROJ-123
  Add a small feature using a simple four-stage research/plan/implement/review workflow

agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
  Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process
```

(The second entry is already live post-AHQ-155 and is unchanged.)

### Guidance To The Builder AI

1. Read the `add-feature-detailed-example` command files, help docs, and `add-feature-detailed-example-cli.ts` first, and mirror their naming, layout, and conventions — then apply this spec's simplifications. Where this spec and the detailed example's conventions conflict, this spec wins.
2. Command `.md` files must be self-contained: no "see the spec" back-references — the runtime agent gets the command file only.
3. Reuse the existing fake-claude-cli fixture pattern from the repo's test suite for the TS program tests. Do not modify engine code (`src/`) — the Stage Outcome Contract is implemented entirely inside the workflow's own TS program.
4. Respect the line budgets. If a command file cannot fit in 150 lines, that is a sign instructions are creeping in that belong in the help docs — move them, don't grow the file.
5. Follow the repo's TDD and validation rules (`pnpm validate` green before done; run the actual CLI, not just the unit tests).

### Definition Of Done For AHQ-157

1. `agentic-hq list` shows `add-feature` with the agreed description and example invocation above.
2. The four command files exist, each ≤ 150 lines; the five help docs exist and cover the User Help Doc Requirements.
3. The TS program tests pass, covering all four required cases (continue, terminate, unexpected outcome, missing env var).
4. `pnpm validate` passes.
5. One end-to-end manual smoke run is performed on a real scratch repo and its outcome recorded: one run through the happy path to the final review summary, and one run that exercises the split/terminate path. (House rule: tests passing is not the same as the program working.)
6. `docs/user-docs/workflow-descriptions/overview-of-workflows.md` is updated to describe `add-feature` (and to mention `add-feature-detailed-example`) — closing the existing doc-drift gap rather than widening it.

---

## Part 3: What I Deliberately Did Not Change

So the register doesn't read as "everything moved": the load-bearing decisions in 02 survive untouched.

- **The four-agent shape.** Researcher / Planner / Implementer / Reviewer, with the plan-approval gate before any code. (04 already argued against merging to three; that stands.)
- **The in-file Questions And Answers pattern**, the `AI Recommendation` + "Yes" default, and the verbatim-preservation rules. This is the most differentiated thing in the product and v2 strengthens its consistency (Decision 9) rather than touching its substance.
- **The naming**: `add-feature`, `add-feature-detailed-example`, `create-workflow --using=add-feature`, and the three-step positioning story (see value → see depth → make it yours).
- **One mandatory CLI parameter** (`ticket-id`), human-managed.
- **The split-suggestion flow** including the Tracer Bullet framing, the option texts, and the Accepted/Rejected recording — only its return-value plumbing was formalised (Decision 6).
- **The `agentic-hq list` entries**, including the detailed-example description already shipped under AHQ-155.

## Part 4: Conflict Check (Prompt Rule 10)

Checked v2 against your earlier statements; two items worth flagging, neither blocking:

1. **01b: "leaving workflow-TS validation".** In 01b you deprioritised Codex's workflow-TypeScript validation item — which in the Codex report meant repo-wide typechecking/CI of scaffolded workflow TS (`typecheck:workflows`). The fake-claude-cli tests this spec mandates are a different thing: behavioural tests of the one piece of real logic in the new flagship's own CLI, run by the ordinary existing test suite. I do not read these as conflicting, but since the words are close, confirm: requiring tests for `add-feature-cli.ts` is in scope even though `typecheck:workflows` remains deferred. *(If you answer "No" here, Decision 6's test requirement drops to "recommended".)*
2. **AHQ-143 planning doc as source of truth.** Your standing rule is that the AHQ-143 planning doc stays in sync with decision changes for the detailed-example workflow. Nothing in v2 changes the detailed example — its name, list entry, and positioning text are reused verbatim from what already shipped — so no sync is required. Flagging only so the rule is visibly considered.

No conflicts found with your HUMAN COMMENTs in 01: v2's direction (simple flagship, customization path, example framing for the seven-agent workflow) is the direction those comments accepted.

## Part 5: 04 Decisions Not Covered By This Register

Answering the register above closes 04's **S1-S8** Decision fields. Still open in 04 and needing your answers separately (none block the AHQ-157 build):

- **F1** — `--using` fallback doc (manual-clone instructions before/alongside AHQ-159). *Partially pre-empted: the spec's help-doc requirement 5 includes the manual-clone pointer.*
- **F2** — per-workflow allowed-tools, and when (before YouTubers / before public / never).
- **F3** — OO ceremony deferral (agree/disagree).
- **F4** — ~~PTY failure semantics before Phase 1~~ **Answered: leave.** Steve's months of real runs have never hit a non-zero Claude exit (only whole-terminal/whole-machine crashes, which no exit-code check would catch), and the live PTY means any Claude error is visible on screen anyway. Logging will be added later, driven by real feedback. Removed from the prompt queue in 05.
- **F5** — docs archive + privacy pass before public alpha.
- **The ordered plan items 1-8** in 04's "What I Would Do, In Order".
