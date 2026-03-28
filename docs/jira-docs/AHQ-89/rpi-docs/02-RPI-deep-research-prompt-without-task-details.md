# Deep Research Prompt: SRP Refactoring Workflow Design

You are a research agent in a FRESH session. Your job is to do deep research on the topics below and write your report to:

`docs/jira-docs/AHQ-89/rpi-docs/03-RPI-deep-research-prompt-without-task-details.REPORT.md`

**IMPORTANT: This prompt deliberately does NOT include any task details. Do NOT solutionise — just research and report.**

---

## Context

This project is a TypeScript monorepo (Agentic HQ) with a microkernel plugin architecture. The codebase has interfaces and classes that follow a Single Responsibility Principle (SRP) documentation pattern — each class/interface has a TSDoc header stating what it **does**, what it **knows about**, and what it **knows nothing about**.

The project recently completed a successful refactoring exercise (AHQ-83) that took a "god class" (`ClaudeCodeTool`) and decomposed it into several clean, single-responsibility components. That process was iterative, discussion-driven, and produced excellent results.

We want to understand best practices so we can create a **reusable, generic workflow** for performing SRP refactoring on any part of any codebase — not just this one.

---

## Research Areas

### 0. CRITICAL: Study the AHQ-83 Refactoring Process — What Worked and Why

**Read ALL of the following documents in order** — they capture a real, successful SRP refactoring exercise that we want to distil into a repeatable workflow:

- `docs/jira-docs/AHQ-83/beads-implementation/03-steve-suggestion-for-further-refactoring-of-ClaudeCodeTool.md` — The human's initial prompt suggesting the refactoring, proposing new abstractions
- `docs/jira-docs/AHQ-83/beads-implementation/04-claude-response.md` — The AI's detailed response: architectural analysis, proposed decomposition, SRP header comments for every class/interface, file locations, decision rationale
- `docs/jira-docs/AHQ-83/beads-implementation/05-Steves-additional-prompts.md` — The human's follow-up refinements: renaming for genericity, identifying code smells (global state function calls), pushing for better design
- `docs/jira-docs/AHQ-83/beads-implementation/06-steve-to-do-later-list.md` — Deferred items captured during the discussion
- `docs/jira-docs/AHQ-83/beads-implementation/07-verbatim-copy-of-plan.md` — The final agreed plan with TDD steps, file-by-file changes, implementation order
- `docs/jira-docs/AHQ-83/beads-implementation/08-document-detailing-what-was-done-in-additional-refactoring.md` — Post-refactoring record of what actually happened vs. what was planned

After reading these, research and report on:

- **What made this process effective?** Analyse the specific patterns in the conversation flow — how the human and AI collaborated, the back-and-forth, the gradual deepening of the design.
- **The iterative deepening pattern**: The discussion started with a simple suggestion ("we need a MarshalledIOTool") but through ~5 rounds of back-and-forth evolved into creating entirely new abstractions (`IOMarshallerSession`, `CLICommandBuilder`, `CLICommand`). What drove each round of iteration? What triggered the human to push for more?
- **The human's role**: The human didn't just approve — they actively shaped the design by: (a) asking "what if I wanted to create a Codex tool?", (b) spotting that the IOMarshaller leaked file-system concerns, (c) renaming `command` to `activityID` for genericity, (d) flagging global state function calls as a code smell. How should a workflow encourage this kind of active human participation?
- **The SRP documentation pattern**: Every class/interface got a TSDoc header with three sections: "SRP Does:", "SRP Knows About:", "SRP Knows Nothing About:". This makes cohesion concrete and reviewable. Analyse this pattern — what's powerful about it? How does the "Knows Nothing About" clause act as an enforcement mechanism?
- **The plan-then-execute pattern**: Doc 07 is a detailed plan (with TDD steps, file lists, before/after tables). Doc 08 records what actually happened vs. the plan. What's the value of this "plan → execute → document deviations" pattern?
- **What could be improved?** Were there any inefficiencies, missed opportunities, or things that could have gone smoother?

**This is the MOST IMPORTANT research area.** The goal is to extract the essence of what made this work so we can bottle it into a repeatable workflow.

### 1. SRP Analysis Techniques for Identifying Refactoring Candidates

Research and report on:

- What are the most effective heuristics and code smells for identifying classes/interfaces that violate SRP? Go beyond the obvious "it's too big" — what are the subtle signs?
- How do experienced architects decide which SRP violations are worth fixing vs. acceptable pragmatic compromises?
- What tools or static analysis approaches exist (for TypeScript/JavaScript specifically) that can help identify SRP violations programmatically? (e.g., complexity metrics, coupling analysis, cohesion metrics like LCOM)
- How should you assess the "blast radius" of refactoring a class — i.e., how many other things it touches and how risky the change is?

### 2. Iterative Refactoring Conversation Patterns

Research and report on:

- What are best practices for **iterative, discussion-based** refactoring where a human and an AI agent work together over multiple rounds?
- How do pair programming / mob programming techniques translate to human-AI refactoring collaboration?
- What makes a good "refactoring proposal" document — what should it contain, how detailed should it be, and how should alternatives be presented?
- How do you avoid "analysis paralysis" in refactoring discussions while still being thorough enough?
- What's the right level of granularity for presenting refactoring options — too broad means meaningless choices, too narrow means death by a thousand decisions?

### 3. SRP Documentation Patterns

Research and report on:

- Are there established conventions or standards for documenting SRP at the class/interface level in code? (Beyond just general JSDoc/TSDoc)
- Specifically research the "Does / Knows About / Knows Nothing About" pattern — is this a known technique? Has anyone written about it? What are its strengths and weaknesses?
- What other SRP/cohesion documentation patterns exist? (e.g., "responsibility-driven design" cards, CRC cards, etc.)
- How should SRP documentation be maintained as code evolves — should it be validated/enforced somehow?

### 4. Refactoring Workflow Design — Lessons From the Industry

Use Perplexity or web research to find:

- Are there established **multi-step refactoring workflows** that teams use? (e.g., Martin Fowler's refactoring catalog, but more about the *process/workflow* than individual refactoring moves)
- What does a good "refactoring plan" look like before execution? What level of detail is enough?
- How do teams document what was done AFTER a refactoring — what's the best "post-refactoring record" format?
- What are the pitfalls of AI-assisted refactoring and how do teams mitigate them?

### 5. Composing Workflow Steps as Reusable Commands

Research in the codebase:

- Look at the existing command files under `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/` — study the patterns used for multi-step workflows (especially `quick-jira-workflow/` and `full-jira-tdd-story-workflow/`)
- How do these commands handle state between steps? (file-based handoff, directories, etc.)
- What patterns work well and what seems awkward or limiting?
- How should a multi-step refactoring workflow pass context between steps (e.g., "which class are we refactoring?" needs to be known by all subsequent steps)?

---

## Output Format

Please write your report with clear sections matching the research areas above. For each area:

1. **Key findings** — bullet points of the most important discoveries
2. **Recommendations** — your specific recommendations for this project
3. **Sources** — links or references for further reading

---

## Discussion Section

At the bottom of your report, include an empty section:

```markdown
## Discussion: Questions, Answers & Additional Research

_This section captures back-and-forth discussion between the human and the research agent after the initial report was read._

---
```

This is where the human will add follow-up questions and you'll add responses after they've read the report.
