# Deep Research Report: SRP Refactoring Workflow Design

**Date**: 2026-03-17
**Research method**: Parallel Perplexity MCP queries + codebase exploration (5 parallel research agents)

---

## Table of Contents

0. [**CRITICAL: Study of the AHQ-83 Refactoring Process — What Worked and Why**](#0-critical-study-of-the-ahq-83-refactoring-process--what-worked-and-why)
1. [SRP Analysis Techniques for Identifying Refactoring Candidates](#1-srp-analysis-techniques-for-identifying-refactoring-candidates)
2. [Iterative Refactoring Conversation Patterns](#2-iterative-refactoring-conversation-patterns)
3. [SRP Documentation Patterns](#3-srp-documentation-patterns)
4. [Refactoring Workflow Design -- Lessons From the Industry](#4-refactoring-workflow-design----lessons-from-the-industry)
5. [Composing Workflow Steps as Reusable Commands (Codebase Research)](#5-composing-workflow-steps-as-reusable-commands-codebase-research)
6. [Discussion: Questions, Answers & Additional Research](#discussion-questions-answers--additional-research)

---

## 0. CRITICAL: Study of the AHQ-83 Refactoring Process — What Worked and Why

**Source documents studied (in order):**
- `docs/jira-docs/AHQ-83/beads-implementation/03-steve-suggestion-for-further-refactoring-of-ClaudeCodeTool.md` — Human's initial prompt
- `docs/jira-docs/AHQ-83/beads-implementation/04-claude-response.md` — AI's architectural analysis and proposed decomposition
- `docs/jira-docs/AHQ-83/beads-implementation/05-Steves-additional-prompts.md` — Human's follow-up refinements
- `docs/jira-docs/AHQ-83/beads-implementation/06-steve-to-do-later-list.md` — Deferred items
- `docs/jira-docs/AHQ-83/beads-implementation/07-verbatim-copy-of-plan.md` — Final agreed plan
- `docs/jira-docs/AHQ-83/beads-implementation/08-document-detailing-what-was-done-in-additional-refactoring.md` — Post-refactoring record

---

### 0.1 What Made This Process Effective

#### Key Findings

**The "Seed → Expand → Prune" Collaboration Pattern**

The conversation followed a distinctive three-phase pattern:

| Phase | Who | What Happened |
|-------|-----|---------------|
| **Seed** | Human | 12-line suggestion proposing 1 abstraction (`MarshalledIOTool`) with an open question: "Any Questions / ideas / thoughts?" |
| **Expand** | AI | 370-line comprehensive response: generic-vs-specific analysis, ASCII architecture diagrams, 4 new abstractions (`MarshalledCLITool`, `CLICommandBuilder`, `IOMarshallerSession`, `CLICommand`), SRP headers for every class/interface, design decisions with rationale, file locations |
| **Prune** | Human | Two short follow-ups that caught three design flaws the AI missed: leaked file-system concerns, ambiguous naming, global state code smell |

This was not a typical "approve/reject" workflow. The human's initial prompt was deliberately open ("any questions/ideas/thoughts?") — inviting the AI to go deep. The AI's response was *comprehensive but not final* — it presented decisions as made but left room for challenge. The human then challenged three specific points, each improving the design.

**Why the AI Response (Doc 04) Was Excellent**

The AI response worked because it was structured as an *architectural proposal document*, not just a code diff or list of changes. It contained:

1. **Generic vs. Specific analysis** — a clean table showing which concerns belong to which component
2. **Architecture diagram** — ASCII art showing composition relationships
3. **Interface definitions** — actual TypeScript code for new interfaces
4. **Design decision rationale** — each decision explicitly stated with "why"
5. **File locations** — where every new/modified/deleted file would go
6. **SRP headers** — responsibility documentation for EVERY class and interface, written before any implementation

This format gave the human enough concrete detail to identify problems ("IOMarshaller leaks file-system concerns into the interface") while being high-level enough to discuss architecture rather than implementation minutiae.

**The "Different Tool" Thought Experiment**

The human's most powerful move was asking (in Doc 03): *"What would happen if I wanted to create a new Codex tool class?"* This single question forced the entire design to be *genuinely* generic. Without it, the refactoring might have extracted `ClaudeCodeTool` into cleaner pieces but still with Claude assumptions baked in. The thought experiment exposed leaky abstractions that wouldn't have been visible from examining Claude alone.

---

### 0.2 The Iterative Deepening Pattern

#### Key Findings

**Five Rounds of Deepening**

| Round | Who | What Changed | What Drove the Iteration |
|-------|-----|-------------|--------------------------|
| **1** | Human (Doc 03) | Proposed 1 abstraction: `MarshalledIOTool` | "What if I wanted to create a Codex tool?" |
| **2** | AI (Doc 04) | Expanded to 4 abstractions with full architecture. Introduced SRP header pattern. Made explicit design decisions (CWD ownership, session self-initialization, composition over inheritance) | Professional analysis revealed the original suggestion was undersized — the problem had more dimensions than initially visible |
| **3** | Human (Doc 05a) | Challenged `IOMarshaller` — leaks file-system concerns. Proposed per-execution session with GUID, `getMarshallingId()` returning implementation-specific identifiers | Applied the "Codex test" to the interface itself: *would this interface work for a DB-based marshaller?* Answer was no — `createExecutionDir` is file-specific |
| **4** | Human (Doc 05b) | Renamed `command` → `activityID` for genericity. Flagged `getAgenticHqWorkspaceRoot()` as global state code smell | Naming sensitivity ("command" means two things) + testability concern (global state = hard to mock) |
| **5** | Human (Doc 06) | Deferred `activityID` rename and Config injection to a "to do later" list | Pragmatic scoping — good enough for now, don't gold-plate |

**What Triggered Each Push for More:**

- **Round 3 trigger**: The human applied the genericity test *to an interface the AI had designed*. The AI had made `IOMarshallerSession` "generic" in name but not in contract — `createExecutionDir` leaks the assumption that marshalling happens via files. The human spotted this by asking: "What would `getMarshallingId()` return for a DB marshaller?" This revealed the interface needed redesign, not just renaming.

- **Round 4 trigger**: Naming collision — `command` in `CLICommandBuilder.build(command, marshallingId)` is semantically ambiguous when the builder returns a `CLICommand`. What's a "command" — the user's instruction? The CLI invocation? Both? The human caught the double meaning and proposed `activityID` to distinguish the two. The same round caught global state — `getAgenticHqWorkspaceRoot()` called inside a method makes it impossible to test with different workspace paths.

- **Round 5 (deferral) trigger**: Pragmatic judgment. The human decided the remaining items (activityID rename, Config injection) were genuine improvements but not blockers for the current refactoring. They captured them as deferred items rather than expanding scope further.

**Pattern insight**: Each round of iteration was driven by the human applying a *different quality lens*:
1. Genericity ("would this work for Codex?")
2. Interface purity ("does this interface leak implementation details?")
3. Naming clarity ("could this name be confused with something else?")
4. Testability ("can I mock this easily?")
5. Scope discipline ("is this necessary now or later?")

A workflow should explicitly prompt for each of these lenses.

---

### 0.3 The Human's Role: Active Design Shaper, Not Just Approver

#### Key Findings

The human contributed four distinct types of design input:

| Contribution Type | Example | Impact |
|-------------------|---------|--------|
| **Genericity test** | "What if I wanted to create a Codex tool?" | Forced the entire architecture to be tool-agnostic |
| **Boundary enforcement** | "IOMarshaller leaks file-system concerns" | Triggered redesign of `IOMarshallerSession` interface |
| **Naming precision** | `command` → `activityID` for genericity | Eliminated semantic confusion between user command and CLI command |
| **Code smell detection** | `getAgenticHqWorkspaceRoot()` is global state | Identified testability problem the AI hadn't flagged |

**Each contribution required domain knowledge the AI lacked:**

- The "Codex test" required knowing that Codex exists and has different CLI conventions. The AI knew Claude's flags but couldn't independently generate a realistic "what if different tool?" scenario.
- The file-system leak required understanding that `createExecutionDir` is an implementation detail, not a fundamental marshalling concept. The AI designed a "generic" interface that was actually Claude-shaped.
- The naming issue required sensitivity to how the word "command" is used in multiple contexts within the codebase. The AI, focused on the current class, didn't notice the collision.
- The global state concern required testing experience — knowing that static function calls make unit tests fragile. The AI had written the code correctly (it worked) but not testably.

**How a workflow should encourage this kind of participation:**

1. **Structured challenge prompts** at each design review gate:
   - "Name a completely different system this design should support. Does it?"
   - "For each interface: does any method name or parameter type reveal the implementation?"
   - "Are there any names used in two different contexts?"
   - "Can every component be unit tested with trivial mocks?"
2. **Human-driven review checkpoints** — not just "approve/reject" but structured templates that prompt for specific types of feedback.
3. **Make the human's job easier by presenting the right information** — Doc 04 was excellent because it gave the human concrete interfaces and design decisions to react to, not abstract descriptions.

---

### 0.4 The SRP Documentation Pattern: "Does / Knows About / Knows Nothing About"

#### Key Findings

**Written During Design, Not After Implementation**

The most striking thing about the SRP headers in Doc 04 is that they were written *before any code existed*. They served as **design specifications**, not retroactive documentation. Every class and interface got a header stating:

1. **What it does** (one sentence — the single responsibility)
2. **What it knows about** (the concerns within its boundary)
3. **What it knows nothing about** (the concerns deliberately excluded)

This meant the human could review *responsibility allocation* without reading implementation code.

**"Knows Nothing About" as an Enforcement Mechanism**

The "Knows Nothing About" clause creates a **falsifiable assertion**. For example:

> `MarshalledCLITool`: *"Knows nothing about which AI tool is being run (that's the builder's job) or how I/O is marshalled (that's managed by the MarshallerSession and the AI tool), or how the CLI is spawned and wrapped (that's the job of the CLIWrapper)"*

This makes code review mechanical:
- Does `MarshalledCLITool` import anything from `claude-code/`? → SRP violation
- Does `MarshalledCLITool` reference `JSON`, `fs`, or `path`? → SRP violation (it shouldn't know about file-based marshalling)
- Does `MarshalledCLITool` reference `pty` or `spawn`? → SRP violation (it shouldn't know about process spawning)

Each "Knows Nothing About" item maps to a set of imports/references that should NOT appear in the code. This could be automated with `dependency-cruiser` rules.

**The Pattern as a Design Discovery Tool**

When the human pointed out that `IOMarshaller` leaked file-system concerns (Doc 05a), they were effectively saying: "The 'Knows Nothing About' clause for `IOMarshallerSession` should say 'knows nothing about file systems, directories, or any specific storage mechanism' — but the current interface violates this because it has `createExecutionDir`."

The pattern made the design flaw *articulable*. Without it, the feedback would have been vaguer: "this interface doesn't feel generic enough."

**Cross-Reference with External Research (Section 3)**

The external research (Section 3.2) found that this exact triad is NOT a named pattern in mainstream literature but is a direct extension of CRC cards with the novel addition of explicit "Knows Nothing About" boundaries. The AHQ-83 process validates the research finding: the "Knows Nothing About" clause is the most valuable part because it converts implicit assumptions into explicit, falsifiable assertions.

---

### 0.5 The Plan-Then-Execute-Then-Document-Deviations Pattern

#### Key Findings

**Doc 07 (The Plan) — Structure That Worked**

The plan (Doc 07) was a 278-line document structured as:

| Section | Purpose |
|---------|---------|
| Context | Why this refactoring, what it addresses |
| What Changes (before/after table) | 5-row table: Old → New → Why |
| Microkernel Loader Change | Specific technical change with code snippets |
| Implementation Steps (8 steps, TDD) | Each step: RED → GREEN → REFACTOR → VERIFY |
| Key Files table | 20 rows: file path, action (NEW/MODIFY/DELETE) |
| SRP Header Comments | Reminder to add headers per doc 04 |

**What made this plan effective:**

1. **Before/after table**: A 5-row table showing `Old → New → Why` for each component. This is the fastest way to communicate scope — you can see the entire refactoring in 30 seconds.
2. **Bottom-up dependency ordering**: Steps 1-3 create new components (no dependencies on old code). Step 4 creates the orchestrator using those components. Steps 5-6 wire everything up. Step 7 deletes old code. Step 8 verifies. This ordering means each step can be tested independently.
3. **File-level granularity**: Every file that would be created, modified, or deleted was listed. This prevents scope creep ("while I'm in here, I'll also fix...") and enables accurate effort estimation.
4. **TDD at every step**: Not just "write tests" but explicitly "RED (write failing test) → GREEN (implement) → REFACTOR → VERIFY (pnpm validate)".

**Doc 08 (What Actually Happened) — Honest Post-Mortem**

Doc 08 was a 152-line document structured as:

| Section | Content |
|---------|---------|
| Summary | 1-paragraph overview of what was done |
| What Changed vs. Plan (deviation table) | 3-row table showing plan vs. reality |
| Files Created (table) | 6 new source, 3 new test files with descriptions |
| Files Modified (table) | 12 source + 14 test files with change descriptions |
| Files Deleted (table) | 4 source + 2 test files |
| Final Architecture diagram | 5 pluggable seams |
| Test Results | 21 files, 87 tests passing |
| SRP Header Comments | Confirmation that headers were added |

**The deviations were minor but instructive:**

| Planned | Actual | Lesson |
|---------|--------|--------|
| Rename `tests/unit/claude-code-tool/` → `tests/unit/tools/` | Kept as-is to avoid churn | Sometimes the plan is right in theory but wrong in practice — renaming would touch many import paths for minimal benefit |
| E2E test with `microkernel.override.json` | Skipped | Visual/manual tests are easily skipped under time pressure — a workflow should flag these |
| Delete `io-marshaller.unit.test.ts` and `json-file-io-marshaller.unit.test.ts` separately | Both deleted together | Plan was overly granular on this point |

**Value of the "Plan → Execute → Document Deviations" pattern:**

1. **Plan forces upfront thinking** — Writing 8 concrete steps revealed dependencies and ordering constraints that wouldn't be visible from "just start coding."
2. **Plan enables review before any code is written** — The human could have challenged the plan; no wasted implementation effort.
3. **Deviation documentation creates institutional learning** — Future refactoring can learn from the delta: "we consistently overestimate the value of test directory renames."
4. **File-level inventory prevents surprise** — Listing every file touched makes the blast radius concrete and reviewable.
5. **It's honest** — Recording what was skipped (E2E test) prevents false confidence that everything was verified.

---

### 0.6 What Could Be Improved

#### Key Findings

**1. Deferred Items Were Never Revisited**

Doc 06 captured two items: rename `command` → `activityID` and inject `getAgenticHqWorkspaceRoot()` into Config. Neither has been completed. A workflow should:
- Create Beads tasks (or equivalent) for deferred items immediately
- Link them as "unblocked by" the current task
- Surface them in `bd ready` after the current task closes

**2. No Blast Radius Assessment Before Planning**

The plan (Doc 07) listed files but didn't quantify the blast radius upfront. The actual changes touched **32 source files**, **14 test files**, and **2 config files**. Knowing this number before starting would have helped estimate effort and risk. A workflow should include a "blast radius scan" step that counts affected files and rates risk before planning begins.

**3. No Before/After Metrics**

The plan didn't capture quantitative metrics before refactoring (e.g., number of responsibilities in `ClaudeCodeTool`, LCOM score, constructor parameter count) and compare after. Doc 08 describes the architecture but doesn't prove quantitatively that it improved. A workflow should capture at least:
- Class size (lines/methods) before and after
- Constructor parameter count before and after
- Number of "concerns" (import domains) before and after

**4. Human Refinements Were Unstructured**

Doc 05 contains two separate refinements in a single short file — one about IOMarshaller genericity and one about naming + global state. A workflow should provide structured templates for refinement feedback:
- **Boundary challenge**: "I believe [interface X] leaks [concern Y] because [method Z reveals implementation detail]"
- **Naming challenge**: "I believe [name A] should be [name B] because [reason]"
- **Code smell flag**: "I believe [pattern X] in [location Y] is a code smell because [reason]"

**5. The E2E Verification Step Was Skipped**

Step 8 in the plan called for testing with `microkernel.override.json` to verify the colourful wrapper still worked. This was skipped. When a plan has explicit verification steps, a workflow should enforce completion or require explicit acknowledgement of skipping with justification.

**6. No Explicit "Session Start" Context Setting**

The conversation started with Doc 03 (Steve's suggestion). But there was no explicit step where both parties agreed on: goals, constraints, what's in scope, what's out of scope. The conversation worked because Steve and Claude implicitly aligned, but a repeatable workflow should make this explicit.

---

### 0.7 Distilled Patterns for a Repeatable Workflow

#### Recommendations

Based on the AHQ-83 analysis, a repeatable SRP refactoring workflow should include these elements:

**1. The "Seed → Expand → Prune" conversation structure:**
- Human provides a short, open-ended suggestion (the seed)
- AI responds with comprehensive architectural analysis (the expansion)
- Human applies quality lenses to prune/refine (boundary enforcement, naming, testability)

**2. The "Different System" genericity test:**
- At every design review point, explicitly ask: "Name a completely different tool/system. Would this design work for it without changes to the generic components?"

**3. Five quality lenses for human review:**

| Lens | Question |
|------|----------|
| Genericity | "Would this work for a completely different tool/system?" |
| Interface purity | "Does any interface method or type reveal the implementation?" |
| Naming clarity | "Could any name be confused with another concept in this codebase?" |
| Testability | "Can every component be unit tested with trivial mocks?" |
| Scope discipline | "Is everything here necessary now, or should some items be deferred?" |

**4. SRP headers as design tool (not just documentation):**
- Write "Does / Knows About / Knows Nothing About" headers DURING design, before implementation
- Use "Knows Nothing About" clauses as falsifiable assertions for code review

**5. Plan with file-level granularity:**
- Before/after table (Old → New → Why)
- Bottom-up dependency ordering
- TDD at every step (RED → GREEN → REFACTOR → VERIFY)
- Every file listed: NEW, MODIFY, DELETE

**6. Post-execution deviation record:**
- What was planned vs. what happened
- Why deviations occurred
- What was skipped and why
- File inventory (created, modified, deleted) with descriptions

**7. Deferred items → immediate task creation:**
- Anything deferred during discussion becomes a tracked task immediately
- Not in a markdown file — in the task tracker (Beads)

#### Sources

All findings derived from primary source analysis of:
- `docs/jira-docs/AHQ-83/beads-implementation/03-*.md` through `08-*.md`

Cross-referenced with external research in Sections 1-5 of this report. Key validating sources:
- Martin Fowler's "Workflows of Refactoring" (validates the plan-then-execute pattern)
- CRC Cards / Ward Cunningham & Kent Beck (validates the Does/Knows/Nothing pattern as CRC extension)
- Google's LSC process (validates file-level planning and deviation documentation)

---

## 1. SRP Analysis Techniques for Identifying Refactoring Candidates

### 1.1 Heuristics and Code Smells for Identifying SRP Violations

#### Key Findings

**Reasons-to-Change Analysis (The Gold Standard)**
- SRP defines a module as having "one reason to change," tied to a single actor or concern. Multiple independent change triggers signal a violation.
- Subtle sign: a class that gets modified for unrelated triggers. For example, a `ReportService` changing both when the business rules for report content change AND when the output format changes.
- If you cannot describe the class's responsibility in a single sentence without using "and" or "or," it likely violates SRP.

**Naming Heuristics**
- **Conjunctions in names**: `ReportCompilerAndPrinter`, `DataProcessorAndValidator` -- the "And" reveals dual duties.
- **Vague "god" suffixes**: `Manager`, `Handler`, `Processor`, `Service` often mask multiple responsibilities.

**Coupling and Cohesion Metrics**

| Metric | SRP-Violation Threshold | Interpretation |
|--------|-------------------------|----------------|
| LCOM (Lack of Cohesion of Methods) | > 0.5 (normalized) | Mixed field usage across methods |
| Fan-out | > 10 dependencies | Excessive dependencies |
| Constructor params | > 3-5 | Too many injected dependencies |

**Method Grouping Analysis**
- Group methods by the fields they access. If distinct clusters of methods share no fields, those clusters represent separate concerns.
- **Pure vs. Effectful**: A class with both `calculateTotal()` (pure) and `saveToDB()` (effectful) has mixed concerns.

**Testability Heuristics (The "Secret Weapon")**
- If a class requires extensive mocking of unrelated collaborators to test, it has too many responsibilities.
- "Mock roles, not objects" -- if you are mocking implementation details rather than role interfaces, SRP is likely violated.

#### Recommendations

1. Start with a **naming audit**: grep for classes/interfaces with `Manager`, `Handler`, `Service`, `Processor` and review each.
2. Apply the **"describe in one sentence" test** to every class in core domain packages.
3. Check **constructor parameter counts** -- anything above 4-5 is a candidate.
4. Use **method-field access analysis** (via ts-morph) to detect low cohesion programmatically.

#### Sources
- [Heuristics to Determine Unit Boundaries (codesai.com)](https://codesai.com/posts/2025/07/heuristics-to-determine-unit-boundaries)
- [Why SRP Matters for Secure Code (xygeni.io)](https://xygeni.io/blog/why-the-single-responsibility-principle-matters-for-secure-code/)
- [Single Responsibility Principle (Wikipedia)](https://en.wikipedia.org/wiki/Single-responsibility_principle)

---

### 1.2 Deciding Which SRP Violations to Fix vs. Accept

#### Key Findings

**When "Good Enough" Is Truly Good Enough**
- A class handling related but stable tasks is acceptable if splitting adds complexity without value.
- If a class has not changed in 6+ months and has no pending feature requests, it is stable regardless of SRP purity.
- Overzealous adherence leads to "nano-classes" -- excessive modularization creating tightly layered code harder to navigate than the original violation.

**The "Axis of Change" Concept (Robert C. Martin)**
- Each distinct reason a class might evolve is an "axis of change." Each axis warrants separation.
- A report compiler-printer violates SRP only if content and format change for different actors. If the same person always changes both, the violation is theoretical.

**Team Size and Project Phase Impact**
- **Small teams / early phases**: Accept violations for rapid iteration.
- **Large teams / late phases**: Fix aggressively to enable parallel work and clear ownership.
- **Maintenance phases**: Prioritize based on **change frequency** over theoretical purity.

**Prioritization Decision Matrix**

| Factor | Low Priority (Accept) | High Priority (Fix) |
|--------|-----------------------|---------------------|
| Change frequency | < 5 changes/year | > 20 changes/year |
| Number of actors | Single team/person | Multiple teams |
| Test difficulty | Easy to test as-is | Requires 10+ mocks |
| Bug density | Low defects | High defect cluster |
| Team conflicts | No merge conflicts | Frequent conflicts |
| Stability | Stable for 6+ months | Changes every sprint |

#### Recommendations

1. Use **git history as primary signal**: high change-frequency files with multiple unrelated changes are top priority.
2. Apply the **"two teams" test**: if two different sub-teams would modify the same class for different reasons, split it.
3. **Track merge conflicts**: files with frequent merge conflicts are strong SRP-violation indicators.
4. **Do not split stable utility classes** just because they have multiple methods -- stability trumps purity.

#### Sources
- [SRP for Better Code Quality (dev.to)](https://dev.to/mohitkadwe19/embracing-the-single-responsibility-principle-for-better-code-quality-in-object-oriented-programming-20f4)
- [SRP Explained (towardsaws.com)](https://towardsaws.com/the-single-responsibility-principle-srp-explained-why-your-code-still-stinks-and-how-to-fix-it-3193c88722ab)

---

### 1.3 Tools and Static Analysis for TypeScript/JavaScript

#### Key Findings

**Important caveat**: No tool directly detects SRP violations programmatically, because SRP is about "reasons to change" -- a semantic concept. All tools measure **proxy metrics** that correlate with SRP violations.

**Complexity Metrics**

| Tool | Metric | SRP Relevance | Threshold |
|------|--------|---------------|-----------|
| ESLint `complexity` | Cyclomatic complexity | High paths = multiple decision responsibilities | > 10-15 |
| SonarQube | Cognitive complexity | Nested blocks and mental load | > 15 |
| ESLint `max-lines` | File/function length | Long units likely mix responsibilities | > 250 lines (file) |

**Dependency and Coupling Analysis**
- **Madge**: Dependency graphs + circular dependency detection for JS/TS.
- **Dependency Cruiser**: Configurable dependency rules and enforcement for TS/JS monorepos.
- **Nx `dep-graph`**: Project-level dependency visualization.

**Custom ts-morph Analysis**

No native LCOM tool exists for TypeScript. Build custom analysis with ts-morph for:
- LCOM computation (method-to-field-access cohesion)
- Constructor dependency counting (>3-5 non-primitive params)
- I/O vs. pure logic mixing detection
- Import domain analysis (too many unrelated domains)

Example LCOM computation:
```typescript
import { Project, SyntaxKind, ClassDeclaration } from "ts-morph";

function computeLCOM(classDecl: ClassDeclaration): number {
  const methods = classDecl.getMethods();
  if (methods.length <= 1) return 0;

  const methodFieldAccess = new Map<string, Set<string>>();
  methods.forEach((method) => {
    const fields = new Set<string>();
    method.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .filter((access) =>
        access.getExpression().getKind() === SyntaxKind.ThisKeyword)
      .forEach((access) => fields.add(access.getName()));
    methodFieldAccess.set(method.getName(), fields);
  });

  let intersectingPairs = 0;
  const totalPairs = methods.length * (methods.length - 1) / 2;
  if (totalPairs === 0) return 0;

  const methodNames = Array.from(methodFieldAccess.keys());
  for (let i = 0; i < methodNames.length; i++) {
    for (let j = i + 1; j < methodNames.length; j++) {
      const fields1 = methodFieldAccess.get(methodNames[i]) || new Set();
      const fields2 = methodFieldAccess.get(methodNames[j]) || new Set();
      const intersection = new Set([...fields1].filter(f => fields2.has(f)));
      if (intersection.size > 0) intersectingPairs++;
    }
  }
  return 1 - (intersectingPairs / totalPairs);
}
// LCOM > 0.5 indicates poor cohesion and potential SRP violation.
```

**Git History Analysis (Adam Tornhill's "Code as a Crime Scene" Approach)**
- **Change frequency hotspots**: Files changed most often are the biggest maintenance burden.
- **Logical coupling**: Files that always change together (co-change analysis) indicate hidden dependencies.
- **Tool**: `code-maat` (Ruby) or custom scripts with `simple-git`.

#### Recommendations

1. Enable **ESLint rules**: `complexity` (max 10), `max-lines` (250), `max-lines-per-function` (50).
2. Add **Madge or Dependency Cruiser** to CI for coupling visualization.
3. Build a **custom ts-morph script** for LCOM and constructor-dependency analysis.
4. Use **git log analysis** to find change-frequency hotspots.
5. Consider **SonarCloud** for continuous quality monitoring.

#### Sources
- [ts-morph documentation](https://ts-morph.com)
- [AST-based Refactoring with ts-morph (kimmo.blog)](https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/)
- [SOLID Design Principles in JS/TS (Strapi)](https://strapi.io/blog/solid-design-principles-javascript-typescript-guide)

---

### 1.4 Assessing the "Blast Radius" of Refactoring

#### Key Findings

**Coupling Metrics**

| Metric | Definition | Risk Interpretation |
|--------|-----------|---------------------|
| Afferent Coupling (Ca) | Inbound dependencies | Ca > 10 = wide impact, brittle |
| Efferent Coupling (Ce) | Outbound dependencies | Ce > 15 = fragile to refactor |
| Instability Index (I) | Ce / (Ca + Ce) | I > 0.5 = unstable, high change risk |

**Blast Radius Score (BRS)**

| Score | Coverage | Coupling (Ca) | Dependents | Risk Level | Strategy |
|-------|----------|---------------|------------|------------|----------|
| 0-2 | > 90% | < 5 | 0-1 pkgs | Low | Refactor freely |
| 3-5 | 70-90% | 5-10 | 2-3 pkgs | Medium | Refactor with care |
| 6-8 | 50-70% | 10-20 | 4-6 pkgs | High | Incremental strategy required |
| 9-10 | < 50% | > 20 | 7+ pkgs | Critical | Strangler Fig + feature flags |

**Incremental Refactoring Strategies**

| Strategy | When to Use |
|----------|-------------|
| **Strangler Fig** | Large classes with many consumers -- gradually replace behind a facade |
| **Adapter Pattern** | Breaking interface changes -- wrap new impl preserving old API |
| **Feature Flags** | High-risk production changes -- toggle between old and new |
| **Extract and Delegate** | Medium-risk, clear responsibility boundary |

#### Recommendations

1. Before refactoring, **run `tsc --noEmit` and the full test suite** to establish a green baseline.
2. Use **"Find All References"** to count consumers of the target class/interface.
3. **Generate a dependency graph** with Madge for the target module.
4. Check **test coverage** on target and all consumers. If below 70%, write tests FIRST.
5. For BRS > 5, use the **Strangler Fig pattern** with incremental consumer migration.

#### Sources
- [Isolate Your Testing Blast Radius (curiositysoftware.ie)](https://www.curiositysoftware.ie/blog/testing-too-big-isolate-your-testing-blast-radius)
- [Limiting Blast Radius in Software Delivery (Altimetrik)](https://www.altimetrik.com/blog/limiting-blast-radius-in-software-delivery/)

---

## 2. Iterative Refactoring Conversation Patterns

### 2.1 Best Practices for Human-AI Iterative Refactoring

#### Key Findings

- **Human starts, AI proposes, human reviews, AI refines.** The human identifies targets and provides goals/constraints; the AI generates specific, atomic proposals; the human accepts/modifies/rejects with reasoning; the AI iterates.
- **One PR = one intent.** If a diff exceeds what a reviewer can comprehend in under a minute, split further.
- **Lock existing behavior with characterization tests** before refactoring. Require those tests to pass after each round.
- **Maintain shared context** by including in each prompt: goals, boundaries (what must NOT change), examples of desired patterns, adjacent code snippets, and references to prior discussion rounds.
- **Rollback safety enables forward momentum.** Feature flags, version control discipline, and separate refactoring commits make each step reversible.

#### Recommendations

1. Structure each round as: **Human goal/constraint -> AI atomic proposal -> Human specific feedback -> AI revision -> Tests -> Repeat or approve.**
2. Keep a running **"refactoring plan" document** that both human and AI reference.
3. Start with **non-critical, low-risk areas** to build trust and calibrate before tackling core architecture.
4. Set explicit **"stop conditions"** for each discussion.

#### Sources
- [Augment Code: AI Code Refactoring](https://www.augmentcode.com/tools/ai-code-refactoring-tools-tactics-and-best-practices)
- [LinearB: AI Coding Agents & Code Refactoring](https://linearb.io/blog/ai-coding-agents-code-refactoring)
- [CodeGeeks: Best Practices for AI Refactoring Legacy Code](https://www.codegeeks.solutions/blog/best-practices-for-ai-refactoring-legacy-code)

---

### 2.2 Pair/Mob Programming Applied to Human-AI Refactoring

#### Key Findings

- **Roles invert**: AI becomes the **driver** (generating code), human becomes the **navigator** (providing direction, context, and review).
- **Strong-style pairing maps directly**: "For an idea to go from your head into the computer, it MUST go through someone else's hands." AI proposes; human approves before anything enters the codebase.
- **Ping-pong TDD with AI**: Human writes failing refactoring test, AI implements minimal fix, human reviews/refines.
- **Known pitfalls**: Context blindness (AI misses project-specific constraints), over-reliance on AI suggestions, navigator fatigue, weakness on architectural debt.

#### Recommendations

1. Explicitly assign roles at session start: "I (human) navigate, you (AI) drive." Switch when needed.
2. Apply the **strong-style rule**: never let AI code go directly into the codebase without human review.
3. Use **ping-pong TDD** for refactoring: human writes desired-behavior test, AI implements.
4. For **architectural refactoring**, have the human drive and use AI as research/analysis advisor.

#### Sources
- [Talent500: Pair Programming Guide](https://talent500.com/blog/pair-programming-guide-techniques-benefits-ai-integration/)
- [Crisp Blog: Mob Programming with AI](https://blog.crisp.se/2025/06/02/michaelgothe/mob-programming-with-ai-inside-a-high-performing-teams-journey)
- [Graham Brooks: Pair/Mob Programming & AI Co-pilots](https://www.grahambrooks.com/post/2023-07-05-pair-mob-programming-ai-co-pilots/)

---

### 2.3 What Makes a Good Refactoring Proposal Document

#### Key Findings

Essential sections:
1. **Current State Analysis**: Code smells, dependencies, metrics, pain points, business context.
2. **Proposed Changes**: Specific refactorings at high level with goals.
3. **Alternatives Considered**: 2-3 options with trade-offs in comparison matrix format.
4. **Risks and Mitigations**: Regressions, security, performance implications.
5. **Migration/Implementation Plan**: Phased breakdown, PR ordering.
6. **Success Metrics**: Measurable targets (e.g., "cyclomatic complexity < 10").

**Alternatives comparison matrix format:**

| Option | Pros | Cons | Risk | Effort | Recommendation |
|--------|------|------|------|--------|----------------|
| A: Extract to module | Clean boundaries | Interface changes | Medium | 2 days | Recommended |
| B: Inline simplification | Low risk, quick | Doesn't fix root cause | Low | 0.5 days | Backup |
| C: Full rewrite | Cleanest result | High risk, blocks work | High | 5 days | Not recommended |

#### Recommendations

1. Always include a **"Do Nothing" option** with its costs to force honest assessment.
2. Keep proposals to **1-2 pages** for typical refactoring.
3. Include a **"Rollback Plan"** section.
4. Lead with a **recommended option** to reduce cognitive load.
5. Use proposals as **living documents** -- update after each implementation round.

#### Sources
- [Augment Code: AI Code Refactoring](https://www.augmentcode.com/tools/ai-code-refactoring-tools-tactics-and-best-practices)
- [Yardstick: AI-Assisted Code Refactoring Evaluation](https://yardstick.team/work-samples/effective-work-samples-for-evaluating-ai-assisted-code-refactoring-skills)

---

### 2.4 Avoiding Analysis Paralysis

#### Key Findings

- **Martin Fowler**: "In almost all cases, I'm opposed to setting aside time for refactoring. Refactoring is something you do all the time in little bursts."
- **Preparatory refactoring**: "When you need to make a change, first make the change easy, then make the easy change." This reframes from "should we refactor?" to "what's the minimum refactoring for my current task?"
- **Rule of Three**: Duplicate code once without refactoring, but refactor before a third duplication. A concrete, mechanical rule that eliminates debate.
- **Reversible vs. irreversible decisions**: Most refactoring is highly reversible. Reserve deep analysis for public API changes, database schema migrations, etc. For everything else, "just start."
- **Spikes and tracer bullets**: When you can't decide, build a minimal proof-of-concept for 1-2 hours. Converts abstract analysis into concrete evidence.
- **Kent Beck**: "Make it work, make it right, make it fast." Stop "make it right" when code is clean enough, not when it is perfect.

#### Recommendations

1. **Timebox AI analysis**: "You have 5 minutes to propose 3 options with trade-offs. Then I decide."
2. Use **Fowler's preparatory framing**: "what's the minimum change that makes our current task easier?"
3. **When stuck, spike it**: 1-2 hours on a minimal prototype of the top candidate.
4. Apply the **reversibility test**: "Can we undo this easily?" If yes, just pick and go. If no, invest more.
5. Set **"good enough" criteria** before starting so you know when to stop.

#### Sources
- [Martin Fowler quotes](https://softwarequotes.com/author/martin-fowler)
- [Nulab: Stopping Analysis Paralysis](https://nulab.com/learn/strategy-and-planning/8-steps-stopping-analysis-paralysis-tracks/)
- [DaedTech: Avoiding Paralysis by Analysis](https://daedtech.com/the-secret-to-avoiding-paralysis-by-analysis/)

---

### 2.5 Right Level of Granularity for Presenting Refactoring Options

#### Key Findings

- **Too broad** ("should we use microservices or monolith?") provides no actionable choice.
- **Too narrow** ("should this be `userList` or `users`?") causes decision fatigue.
- **Goldilocks zone**: module/component level with measurable outcomes. E.g., "To reduce complexity in the auth module, we can (A) extract validation, (B) simplify with guard clauses, or (C) rewrite with strategy pattern."
- **Decision fatigue is real**: developers who make many sequential decisions start taking shortcuts (copy-paste instead of refactoring).

**AI Autonomy Ladder:**

| Level | AI Behavior | Examples |
|-------|-------------|---------|
| 1: AI decides silently | Formatting, import ordering, trivial renames |
| 2: AI decides, informs human | Extract method, inline variable, dead code removal |
| 3: AI proposes, human approves | Structural refactoring, pattern introduction |
| 4: AI presents options, human decides | Architectural changes, API changes |
| 5: Human decides, AI assists | Cross-team changes, technology choices |

#### Recommendations

1. Present options at **module/component level** -- each implementable in 1-3 PRs.
2. Limit to **2-3 options maximum** plus a "do nothing" baseline.
3. **Always include a recommended option** with clear rationale.
4. **Anchor each option to a measurable outcome**: "reduces cyclomatic complexity from 15 to 6."
5. **State the stakes**: "easily reversible" vs. "requires migration of 15 consumers."

#### Sources
- [PMC: Refactoring Categorization Model](https://pmc.ncbi.nlm.nih.gov/articles/PMC10621946/)
- [Decision Fatigue & Programmers (effectivesoftwaredesign.com)](https://effectivesoftwaredesign.com/2011/08/23/how-decision-fatigue-affects-the-efficacy-of-programmers/)

---

## 3. SRP Documentation Patterns

### 3.1 Established Conventions for Documenting SRP at Class Level

#### Key Findings

- **There are no widely established standards** for explicitly documenting SRP at the class/interface level. Standard style guides do not include SRP-specific docstring recommendations.
- **The gap is real**: Most SRP resources show well-factored code examples but none show documentation patterns that capture and preserve the reasoning behind responsibility splits.
- Some teams use informal conventions like "Responsible for X; delegates Y to Z; does not handle W" in class-level docstrings, but this is ad-hoc.

#### Recommendations

1. Since no standard exists, you have freedom to define your own convention. Consistency matters most.
2. Any SRP documentation pattern adopted will be novel enough to be worth documenting in the project's contributing guide.
3. Combine code-level docstring patterns with architectural tests for enforcement.

---

### 3.2 The "Does / Knows About / Knows Nothing About" Pattern

#### Key Findings

- **This exact triad is NOT a named or established pattern** in mainstream software engineering literature.
- **However, it is a direct extension of CRC cards** (Class-Responsibility-Collaborator), invented by Ward Cunningham and Kent Beck in the late 1980s:
  - CRC "Responsibilities" = "Does"
  - CRC "Collaborators" = "Knows About"
  - **"Knows Nothing About" is the novel addition** -- CRC cards leave boundaries implicit; this makes them *explicit*.

**Strengths:**

| Strength | Explanation |
|----------|-------------|
| Explicit boundaries | "Knows Nothing About" prevents scope creep |
| Review-friendly | Reviewers instantly see if a change introduces a concern the class shouldn't know about |
| Onboarding aid | New developers immediately understand what a class does and does NOT do |
| Testability | Helps derive unit tests (test "Does" items) and mocks (mock "Knows About" items) |
| Lightweight | Fits naturally into TSDoc/JSDoc class-level comments |
| CRC heritage | Builds on a 35+ year respected technique |

**Weaknesses:**

| Weakness | Explanation |
|----------|-------------|
| Maintenance overhead | Lists must be updated as code evolves; risk of documentation drift |
| Subjectivity | Teams may disagree on what constitutes a separate "responsibility" |
| Scalability | For very simple classes, the full triad may be overkill |
| No enforcement | No tooling validates format or content |

#### Recommendations

1. **Adopt the pattern but be pragmatic**: full triad for core domain classes; skip for trivial data classes.
2. **Keep lists short**: 3-7 bullet points per section maximum. If "Does" has 10+ items, the class probably violates SRP.
3. **"Knows Nothing About" is the most important section** -- prioritize it.
4. Consider naming it **"CRC+" or "Extended CRC"** in team documentation.

#### Sources
- [CRC Cards overview (agilemodeling.com)](https://agilemodeling.com/artifacts/crcmodel.htm)
- [Ward Cunningham / Kent Beck origin (Agile Alliance)](https://agilealliance.org/glossary/crc-cards/)
- [CRC on Wikipedia](https://en.wikipedia.org/wiki/Class-responsibility-collaboration_card)

---

### 3.3 Other SRP/Cohesion Documentation Patterns

#### Key Findings

| Technique | Granularity | Embedded in Code? | Captures "Why"? | Maintenance Cost |
|-----------|-------------|-------------------|-----------------|------------------|
| CRC Cards | Class | No (transient) | No | Low (disposable) |
| Responsibility-Driven Design (RDD) | Class | Possible | Partially | Medium |
| Role Stereotypes (Controller, Entity, etc.) | Class | Yes (annotations) | No | Low |
| DDD Bounded Contexts | Module/Service | No (separate docs) | Yes | High |
| Architecture Decision Records (ADRs) | Decision | No (separate files) | Yes | Medium |
| Stakeholder/Actor Mapping | Class | Possible | Yes | Medium |
| LCOM Metrics | Class | No (tool output) | No | Low (automated) |
| **Does/Knows/Nothing** | Class/Interface | Yes (docstrings) | Partially | Medium |

#### Recommendations

1. **Does / Knows About / Knows Nothing About** fills a gap none of the other techniques address well -- lightweight, embeddable, and makes boundaries explicit.
2. **Complement with ADRs** for major responsibility allocation decisions.
3. **Use Role Stereotypes** as quick shorthand (annotating as "Repository" or "Service" communicates expected responsibilities).
4. **Track LCOM metrics** in CI to catch cohesion drift automatically.

#### Sources
- [Uncle Bob's SRP](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
- [Riccardo Cardin on SRP](https://dev.to/riccardo_cardin/single-responsibility-principle-done-right-15eo)
- [HackerNoon practical SRP](https://hackernoon.com/making-the-single-responsibility-principle-practical)

---

### 3.4 Maintaining SRP Documentation as Code Evolves

#### Key Findings

**Layered enforcement approach:**

| Layer | What It Does | Tools |
|-------|-------------|-------|
| **Structural enforcement** (automated) | Enforce module dependency boundaries | `dependency-cruiser`, `ts-arch` |
| **Documentation format** (automated) | Check for presence of Does/Knows/Nothing sections | Custom ESLint rule or pre-commit hook |
| **Semantic review** (manual) | Verify documentation accuracy during code review | Code review checklist item |
| **Periodic audits** (manual) | Review LCOM metrics and dependency graphs for drift | SonarQube, quarterly reviews |

**dependency-cruiser example:**
```javascript
// .dependency-cruiser.js
module.exports = {
  rules: [
    {
      name: "enforce-srp-user-scope",
      from: { path: "^src/user" },
      notTo: { path: "^src/payment" }
    }
  ]
};
```

#### Recommendations

1. Use `dependency-cruiser` in CI for **structural enforcement** (highest ROI, fully automated).
2. Write a custom pre-commit hook to check that class-level TSDoc contains required sections.
3. Include "SRP documentation updated?" as a **code review checklist item**.
4. Quarterly: review LCOM metrics and dependency graphs for drift.

#### Sources
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [ArchUnit](https://www.archunit.org/userguide/html/000_Index.html)

---

## 4. Refactoring Workflow Design -- Lessons From the Industry

### 4.1 Established Multi-Step Refactoring Workflows

#### Key Findings

**Martin Fowler identifies six distinct refactoring workflows:**

| Workflow | Trigger | Process |
|----------|---------|---------|
| **TDD Refactoring** | Red-Green-Refactor cycle | Clean up code written minutes ago |
| **Litter-Pickup** | Spotting minor mess during unrelated work | Fix small issues immediately |
| **Comprehension** | Code is hard to understand | Refactor locally to aid understanding |
| **Preparatory** | Upcoming feature needs better structure | Refactor structure first, then add feature |
| **Planned** | Larger problematic areas need time | Schedule as stories/tasks |
| **Long-Term** | Major architectural shift | Orient all regular work toward goal over weeks/months |

**Fowler's "Two Hats" principle**: Never mix adding functionality with refactoring in the same commit.

**Google's Large-Scale Changes (LSC) process:**
1. Submit an LSC document (scope, rationale, risks, testing strategy, rollout steps)
2. Get approval from relevant code OWNERS
3. Split large changes into smaller CLs along ownership boundaries
4. Execute parallel review and submission
5. At Google, 10-20% of all project changes come from LSCs by non-owning teams

**Google's ClangMR tool**: Automated large-scale C++ refactoring using AST analysis + MapReduce. Updated 35,000+ call sites across 100M lines. The JS/TS equivalent is **codemods/jscodeshift** and **Semgrep**.

#### Recommendations

1. **Adopt Fowler's workflow taxonomy explicitly.** Name which workflow you're in so the team understands context and scope.
2. **For large refactoring, follow Google's LSC model**: document upfront, split into reviewable chunks, require approval.
3. **Prefer incremental over big-bang.** Research shows 60% fewer bugs with incremental changes.
4. If most refactoring is "planned," that's a smell -- opportunistic refactoring isn't happening enough.

#### Sources
- [Fowler: Workflows of Refactoring](https://martinfowler.com/articles/workflowsOfRefactoring/)
- [Chromium LSC Process](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/process/lsc/large_scale_changes.md)
- [Google ClangMR Paper (2014)](https://research.google.com/pubs/archive/41342.pdf)

---

### 4.2 What a Good Refactoring Plan Looks Like

#### Key Findings

**Core sections:**

| Section | Content |
|---------|---------|
| Executive Summary | What, why, expected outcomes (1 paragraph) |
| Current State Assessment | Code smells, metrics (complexity, coverage, coupling) |
| Goals and Success Metrics | Specific, measurable targets |
| Scoped Tasks (Ordered) | Numbered list, each independently testable |
| Timeline and Milestones | Phased delivery with checkpoints |
| Risks and Mitigations | Regression risk, rollback plan |
| Communication | How progress will be reported |

**Level of detail**: "concise yet actionable" -- 1-5 pages. Avoid exhaustive code-level specifics before execution. Detail emerges iteratively.

**Scoping principle**: Use the 80/20 rule -- analyze for pain points and focus on the 20% of code yielding 80% of benefit.

#### Recommendations

1. Start every plan with a **"Current State / Target State" comparison**.
2. Break tasks into **independently-committable steps**.
3. Include a **"Definition of Done"** for each task.
4. Keep plans as **living documents** -- update as you learn.
5. For AI-assisted work, add a **"Verification Strategy"** section.

#### Sources
- [ContextFirst: Refactoring Plan Template](https://contextfirst.dev/templates/refactoring-plan-template)
- [Manifest.ly: Refactoring Checklist](https://www.manifest.ly/use-cases/software-development/refactoring-checklist)

---

### 4.3 Post-Refactoring Documentation

#### Key Findings

Three complementary practices:
1. **Structured commit messages** with `refactor:` prefix and category
2. **Architecture Decision Records (ADRs)** for significant structural changes
3. **Changelog entries** under "Internal Improvements"

**Commit message convention:**
```
refactor: [Category] - [Specific Operation]

What: [e.g., Extract method from long function]
Why: [e.g., Improve readability, reduce duplication]
Changes: [Brief before/after summary]
Tests: [Confirmation that tests passed]
```

**Categories** (from academic research at RIT): Internal QA, Code Smell Resolution, Functional, External QA, Bug Fix.

**Critical principle**: Keep refactoring commits **separate** from feature/bug fix commits.

#### Recommendations

1. Use `refactor:` commit prefix consistently for automated tracking.
2. Write an ADR for any refactoring changing module boundaries.
3. Include **before/after metrics** where available.
4. Never mix refactoring commits with feature commits ("Two Hats" in version control).

#### Sources
- ["How We Refactor and How We Document It" (RIT)](https://repository.rit.edu/context/article/article/3100/viewcontent/ASOC_20___How_We_Refactor_and_How_We_Document_it_.pdf)

---

### 4.4 Pitfalls of AI-Assisted Refactoring

#### Key Findings

**Six major failure modes:**
1. **Inconsistent code style**: AI mixes patterns, making the codebase disjointed
2. **Hidden security vulnerabilities**: Omitted auth, improper sanitization
3. **Over-engineering**: Unnecessary abstraction layers, extraneous error handling
4. **Subtle behavioral drift**: Semantics shift without interface changes
5. **Mirrored tests**: AI-generated tests duplicate implementation logic ("asserting the same mistake twice")
6. **Scope creep**: AI generates sweeping changes beyond intended scope

**Mitigation strategies:**

| Risk | Mitigation |
|------|------------|
| Code quality | Limit AI to small, focused tasks; track metrics |
| Security | Mandatory secure-coding reviews; staging monitoring |
| Skill erosion | Developers must trace code manually; senior audits |
| Behavioral drift | Define SLO targets; canary analysis; error budgets |
| Context loss | Document business logic before refactoring; pre-AI context prompts |
| Scope creep | Strict scoping in prompts; reject out-of-scope changes |

**Human review process:**
- Mandate **30-minute minimum reviews** for AI-generated PRs
- Require developers to **manually adjust** AI output before submitting
- **Never let AI generate tests that validate its own refactoring** (mirrored test anti-pattern)

#### Recommendations

1. **Scope AI refactoring to single files or single concerns.** Never entire modules at once.
2. **Run existing tests BEFORE and AFTER.** Don't rely on AI to verify behavior preservation.
3. **Treat AI refactoring as a first draft**, not a final product.
4. **Document the "why" BEFORE giving AI the task** -- write constraints and invariants.
5. **Track quality metrics over time** to detect slow degradation.
6. **Establish a "context document"** listing business rules and edge cases for each effort.

#### Sources
- [Jellyfish: Risks of Generative AI](https://jellyfish.co/library/ai-in-software-development/risks-of-using-generative-ai/)
- [Nobl9: Risks of AI-Generated Code](https://www.nobl9.com/resources/risks-of-ai-generated-code)
- [InfoWorld: Refactoring AI Code](https://www.infoworld.com/article/3610521/refactoring-ai-code-the-good-the-bad-and-the-weird.html)
- [Augment: AI Code Refactoring](https://www.augmentcode.com/tools/ai-code-refactoring-tools-tactics-and-best-practices)

---

## 5. Composing Workflow Steps as Reusable Commands (Codebase Research)

### 5.1 Existing Multi-Step Workflows

The codebase has four workflow implementations:

**A. Quick Jira Workflow (5 steps)**
Location: `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/`

| Step | Purpose |
|------|---------|
| 01 | Read Jira, extract test types |
| 02 | RED: Write failing test (loops per test type) |
| 03 | GREEN: Minimal implementation (loops per test type) |
| 04 | REFACTOR (loops per test type) |
| 05 | Transition Jira to done |

**B. Full Jira TDD Story Workflow (6 steps)**
Location: `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/`

| Step | Purpose |
|------|---------|
| 01 | Read Jira, ask questions, get test types |
| 02 | RED: Write failing test (includes Plan Mode) |
| 03 | GREEN: Implement code |
| 04a | REFACTOR analysis: propose refactors, get approval |
| 04b | REFACTOR execute: apply approved refactors |
| 05 | Validate and prepare for commit |

**C. Math Workflow (3 steps)** -- Simple linear pipeline demo.

**D. Research-Plan-Implement (incomplete)** -- Only step 01 exists.

---

### 5.2 How State Is Passed Between Steps

**Three levels of state:**

1. **Step-to-step (ephemeral)**: Via `command-input.json` / `command-output.json` in temp directory. Each step receives a string like `"Your variables for use in this command are jira-id = AHQ-123 and test-type = unit"` and returns a summary string.

2. **Persistent documentation (durable)**: Files in `docs/jira-docs/{jira-id}/workflow-files/`. Each step reads previous step's output files and writes its own. This is the primary context mechanism.

3. **CLI orchestrator logic**: The TypeScript CLI controls sequencing and looping (e.g., `for (const testType of testTypes) { ... }`).

**Variable parsing pattern**: Every step extracts variables from the input string:
```typescript
function buildVariablesString(jiraId: string, testType?: string): string {
  let variablesString = `Your variables for use in this command are jira-id = ${jiraId}`;
  if (testType) variablesString += ` and test-type = ${testType}`;
  return variablesString;
}
```

---

### 5.3 Patterns That Work Well

| Strength | Explanation |
|----------|-------------|
| **Loose coupling** | Steps don't call each other; orchestrator controls sequence |
| **Persistent context via files** | Human-readable documentation trail; supports review between steps |
| **Clear variable passing** | Plain English variable strings are human-readable and easily parsed by Claude |
| **Directory structure mirrors logic** | `{jira-id}/workflow-files/{test-type}-test-files/` segments by concern |
| **Interactive support** | Full Jira TDD uses PTY for human interaction (Plan Mode, approvals) |
| **TTL-friendly** | Temp files disposable; persistent state in docs/ (git-tracked) |

---

### 5.4 Limitations and Awkward Patterns

| Limitation | Impact |
|------------|--------|
| **String-only input/output** | Complex multi-part data requires string parsing on both sides |
| **File paths hardcoded in prompts** | Repeated in every step; fragile if structure changes |
| **No checkpointing/resume** | If a step partially completes, no automatic recovery |
| **Loop logic in CLI, not prompts** | Steps don't know they'll be called multiple times |
| **No schema validation** | If a step forgets to write output, CLI gets `undefined` |
| **No dependency graph** | Dependencies are implicit in execution order |
| **Context loss over many steps** | Each step redundantly re-reads the summary file |
| **Brittle human approval parsing** | Step 04b must parse APPROVE/REJECT marks manually |

---

### 5.5 Recommendations for a Refactoring Workflow

**Proposed directory structure:**
```
.agentic-hq/plugins/agentic-hq-demos-plugin/commands/refactoring-workflow/
  01-refactoring-identify-targets.md
  02-refactoring-analyze-codebase.md
  03-refactoring-propose-changes.md
  04-refactoring-get-approval.md
  05-refactoring-execute-changes.md
  06-refactoring-verify-tests.md
```

**State passing for "which class are we refactoring?":**
- Encode `target-class` and `refactoring-scope` in the input string.
- Create a target-specific docs directory: `docs/refactoring-workflow-docs/{class-name}_{scope}/`
- Each step writes numbered artifacts (01-target-identification.md, 02-codebase-analysis.md, etc.)
- Use structured markdown tables for approval tracking.

**Key design principles:**
1. Encode identifying information in the input string
2. Create class-specific documentation directory
3. Store intermediate state in markdown files
4. Use structured data in output files (markdown tables or JSON)
5. Validate prerequisites at step start
6. Use CLI return value for summary only; details in files
7. Support human review/approval at explicit gates
8. Keep to 6 steps maximum

---

## Cross-Cutting Themes

Four principles appear consistently across the AHQ-83 case study and all five external research areas:

### Theme 1: Small, Incremental Steps Are Universally Recommended
Fowler's workflows, Google's LSC process, refactoring plans, AI mitigation strategies, and the existing codebase workflow patterns all converge: **break refactoring into the smallest independently-verifiable steps possible.** This reduces risk, enables rollback, simplifies review, and produces better documentation.

### Theme 2: Intent Documentation Is the Most Undervalued Practice
Research shows developers inconsistently document *why* refactoring was done. AI makes this worse because it cannot infer business context. The single highest-leverage practice is documenting motivation and constraints *before* refactoring and recording rationale *after* -- in commit messages, ADRs, or the "Does / Knows About / Knows Nothing About" pattern.

### Theme 3: Separation of Concerns in Commits Is Critical
The "Two Hats" principle (never mix refactoring with feature work in the same commit) is reinforced by documentation needs, AI mitigation strategies, and version control best practices. This is already well-aligned with the project's TDD workflow.

### Theme 4: The Human's Role Is Design Shaper, Not Just Approver
The AHQ-83 case study (Section 0) provides concrete evidence for what the external research hints at: the human's highest-value contribution is *boundary detection* — spotting leaked abstractions, naming collisions, testability problems, and scope creep that the AI misses. A workflow must actively prompt for this kind of input with structured quality lenses, not just offer "approve/reject" gates. This connects directly to the AI Autonomy Ladder (Section 2.5) — SRP refactoring sits at Level 3-4, where the human must actively shape the design.

---

## Discussion: Questions, Answers & Additional Research

_This section captures back-and-forth discussion between the human and the research agent after the initial report was read._

---
