# {ticket-id} - Refactoring Plan

> This plan proposes refactors only — it does NOT modify any code. The Refactoring Executor (agent 06)
> executes the **approved** items. Surface every potential refactor here (both recommended and unsure);
> the human decides.

## Refactor Suggestion List

<!--
GUIDANCE FOR THE AI — do NOT copy any of this comment into the document the human reads. It explains what
to do with this list; it is not content to show the human.

- Surface ALL potential refactors in the subsections below — both the ones you recommend AND ones you are
  unsure about or even think shouldn't be done. The human decides; your job is to surface them all with
  honest opinions. (Keep this reasoning to yourself — don't write it into the plan.)

- HEADINGS / STRUCTURE (so the plan renders with a clear visual hierarchy when the human previews it):
  - Each **category** below is an `##` (H2) heading, e.g. `## Category — From Requirements`. Keep the
    `Category — ` prefix. (Empty categories — e.g. an audit with no failures — are still an `##` heading
    followed by their table/prose and no refactor items.)
  - Each **individual refactor item** inside a category is an `###` (H3) heading prefixed with a 🔧 and an
    em-dash: `### 🔧 Refactor <id> — {Title}`. This makes each refactor render clearly LARGER than the
    `**Type**` / `**Description**` bold field labels beneath it.
  - Put a horizontal rule `---` on its own line immediately BEFORE each `### 🔧 Refactor` heading, so each
    refactor reads as its own separated "card".

- BOLD FIELDS: leave a **blank line between every bold field** (and let each field's own text wrap
  naturally). Without the blank lines, Markdown bunches `**Type**` / `**Description**` /
  `**AI Recommendation**` / `**Risk**` / `**Files affected**` into a single run-on paragraph — each must
  render as its own separate line/paragraph.

- Each individual refactor item uses this exact format:

    ---

    ### 🔧 Refactor <id> — {Title}

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
-->

## Category — From Requirements

<Additions/changes that were in the requirements but, as they weren't driven by tests, were left until
now (e.g. documentation and other artefacts). Add Refactor Suggestions here using the format above, or
state that there are none.>

## Category — From "REFACTOR:" Notes

<Search the tests, code and docs that were changed, and all files written so far under {workflow-files},
for "REFACTOR:" strings. Also check the Implementation Plan's "Appendix D - List For Refactor Planner"
and include every refactor mentioned there. List each as a Refactor Suggestion using the format above.>

## Category — Magic Constants Audit (Bulk Approval)

<Audit for magic constants that should be extracted to named constants. These are NOT auto-approved,
but are lumped together for a single BULK approval: the human gives one approval for all of these
refactors, or comments to say which ones are not approved.>

**Bulk Decision** (APPROVE ALL / see comments):  ____________

**Comments** (which, if any, are not approved): ____________

## Category — Missing Comments (e.g. TSDoc)

<For each file changed, check and audit the standard documentation that goes in this type of code
(e.g. TSDoc in TypeScript). List any missing-comment refactors here, or state that none are needed.>

## Category — Project Design Requirements Compliance Audit

<Audit the changed code against the project's design requirements (e.g. CLAUDE.md rules). List any
non-compliance as Refactor Suggestions, or state that the code is compliant.>

## Category — Basic Refactoring Audit

The AI checks all code added (and existing, related code that surrounds it) for the following, and
records the results in the Audit Table below:

```
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Long functions - simplify into multiple functions or introduce new types/abstractions to push out complexity.
- Overly complex classes - simplify into multiple classes each following Single Responsible Principle
```

| Check Name | Items Checked (with results) | Check Result | Comment |
| --- | --- | --- | --- |
| Poor variable or function names | <e.g. print.ts lines 24-29> | PASS / FAIL | <comment> |
| Duplication within a file |  | PASS / FAIL |  |
| Overly complex conditionals |  | PASS / FAIL |  |
| Dead code |  | PASS / FAIL |  |
| Long/complex sequences |  | PASS / FAIL |  |
| Long functions |  | PASS / FAIL |  |
| Overly complex classes |  | PASS / FAIL |  |

<For every check that FAILED, add a Refactor Suggestion sub-heading (using the format above) here.>

## Category — Documentation

<If this feature should be documented in some way not already covered under "From Requirements"
(e.g. User, Developer, or API documentation), log those as Refactor Suggestions here. If no
documentation is required, state that and add no suggestions.>

## Category — Human-Identified Potential Refactors

<Space for the human to add any refactors they have identified, for discussion with the AI.>

---

## Large Refactor Suggestion

<!--
This section comes LAST — it is the final section of the plan, after the whole Refactor Suggestion List above.

If suggest-large-refactor was FALSE (false in parameters AND no `suggest-large-refactor=true` line in the
ticket): the short block immediately below this comment IS the finished text for this case — output it
**verbatim** (do NOT reword, expand, shorten, or add sentences of your own), and do NOT ask the human for
any further input (no "AI Recommendation", no "Your Decision" placeholder, no "Comments" line). There is
nothing to decide when the option is off.

If suggest-large-refactor was TRUE: replace the short block below with a real suggestion — identify a "Set"
of code surrounding (and including) part of the change, then document, one at a time:
  - The files involved and the structure/relationships within the Set
  - Simplicity score out of 10 + comment
  - Understandability score out of 10 (naming of entities and of relationships/methods) + comment
  - SRP score out of 10 for each entity in the Set
  - Combined score for the Set + comment
  - A concrete suggestion for how the code could be improved (easier to understand, simpler, better
    decomposed, entities better obeying SRP)
  - OBLIGATORY: highlight the aspects you are unsure about and any alternative options, and ask the human
    for advice (human/AI collaboration)
  Then assess risk/work vs benefit and make ONE recommendation — and ONLY in this true case add the
  decision placeholder:
    **AI Recommendation**: <now | ticket | reject - and why>
    **Your Decision** (now / ticket / reject):  ____________
    **Comments** (optional): ____________
-->

suggest-large-refactor = false

Recommendation: consider enabling this for **some** tickets to pay off technical debt.

To change your mind add `suggest-large-refactor=true` to the ticket and let the AI know.
