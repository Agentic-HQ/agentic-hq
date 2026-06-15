# Add Feature Detailed Example Workflow — Developer Help

> **⚠️ Heads up — this is a long, essay-length deep dive, not a quick reference.** It works through the
> *ideas and reasoning* behind the `add-feature-detailed-example` workflow in full, from end to end — the
> deeper *"why"*: the design choices behind how the workflow was built, written for developers who want to
> **modify or extend** it (so they can change it with their eyes open). It is really only for someone who
> genuinely wants that full deep-dive. **If you just want to _run_ the workflow — or just want a quick
> overview — this is _not_ the doc for you:** read the
> [User Help Doc](../workflow-help-docs/00-add-feature-detailed-example-workflow-user-help-doc.md) instead,
> which explains what the workflow does and how to drive it.

This doc is a **curated summary** of the design thinking. The complete, granular archive — every decision,
alternative, and aside considered while the workflow was being built — lives in the **AHQ-143 planning
doc** in the Agentic HQ repository:

[`docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md`](../../../../../../../docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md)

Whenever this doc says "see the planning doc", that is where to look. The intent here is to give you the
*main reasoning and philosophy* — enough to grasp the point of each design choice and then modify it
yourself — without drowning you in the build-time history.

> **A note on the name.** This workflow was originally called `add-feature` and was renamed to
> `add-feature-detailed-example` (AHQ-155) when a separate, lightweight `add-feature` workflow was created.
> So everything below uses **`add-feature-detailed-example`**. The planning doc predates the rename and
> still says `add-feature` in many places — read those as referring to *this* workflow.

---

## 1. What this doc is & who it's for

The `add-feature-detailed-example` workflow ships with three kinds of documentation:

- **The [User Help Doc](../workflow-help-docs/00-add-feature-detailed-example-workflow-user-help-doc.md)** —
  for someone *running* the workflow to add a feature.
- **The 7 per-agent help docs** (`01`–`07` in
  [`../workflow-help-docs/`](../workflow-help-docs/)) — each explains how one agent works, surfaced to the
  user via `verbosity=medium` or "Tell Me More".
- **This Developer Help Doc** — for someone *changing* the workflow: adding an agent, retuning the
  overhead, swapping the testing methodology, wiring in an issue tracker, and so on.

Because the three docs have different audiences and depths, there is some deliberate overlap — for example
the design principles below also appear, in short form, in the User Help Doc. Where that happens, this doc
goes **deeper** and cross-links to the short version rather than repeating it word for word.

If you are about to modify the workflow, the two most useful things to read first are this doc (for the
*why*) and the AHQ-143 planning doc (for the exhaustive *what was considered*).

---

## 2. Why this workflow exists & its philosophy

This is a **deliberately opinionated worked example** — a showcase of how far an Agentic HQ workflow can be
shaped around one creator's personal way of building software. It is **not** the recommended starting point
(that's the simple `add-feature` workflow). Its job is to demonstrate the full range of ideas — sharp
pinned context, questioning, research, minimal TDD, a dedicated refactoring stage, audits, and
documenting n everything — in one coherent chain so you can see the patterns and borrow what fits you.

The single idea everything orbits is **balance**. Decomposition — splitting work into small chunks — gives
faster feedback and keeps each task inside both your head and the AI's context window. But decomposition
has a cost: **per-feature overhead**. If running the whole seven-agent cycle to change one button colour
takes an hour, people stop choosing small tasks, which defeats the point. So the workflow aims to be:

- **small enough** in overhead to encourage genuinely small features, and
- **big enough** to do useful analysis and produce useful artifacts.

**The first version intentionally errs toward _too much_ overhead.** That is a conscious choice, not an
oversight: it is easier to see what to trim from a thorough workflow than to know what to add to a thin
one. Trimming it down — fewer agents, lighter steps, optional speed knobs — is expected and encouraged.
The levers the design anticipates for that are described in [§8 "The Future"](#8-deferred-to-the-future).

---

## 3. Design principles (the deeper versions)

These are the principles that shaped the workflow. The
[User Help Doc](../workflow-help-docs/00-add-feature-detailed-example-workflow-user-help-doc.md#principles-that-shape-the-workflow)
lists the first three in brief; here is the fuller reasoning behind all of them.

### Tokens are cheap, human attention is expensive

The workflow deliberately shows you the **minimum** text and writes only what you will actually read. The
lesson behind this: capturing *everything* the AI learns into a ticket or spec — because "throwing tokens
away feels wasteful" — backfires. A human pastes a wall of AI-generated detail into a ticket without
reading it; the Planner then treats every line as a *hard human requirement* and faithfully implements
things the human never actually wanted. **Discarding information that won't be read right now is the right
move** — it's cheap for the AI to re-gather it later, at the point where the human *will* read it (the
plan). This is why the ticket is forced to be short, and why each agent only surfaces what's relevant to
the step in front of you.

### Make it fast → reduced cycle time

The text presented to the human about the process, spec, and code should be **minimal**; if they want more
they type "Tell Me More" or read the help docs. Keeping each iteration fast is what makes small features
attractive. This follows Martin Fowler's point that *reduced cycle time* is "our best form of leverage"
([interview](https://www.youtube.com/watch?v=CQmI4XKTa0U)), echoed by Dave Farley's "faster = better" and
the DORA findings. The whole verbosity/help-doc mechanism exists to hide this workflow's considerable
complexity behind a fast default path.

### Decomposition

Three giants of software engineering each put decomposition at the centre:

- **Martin Fowler** — reducing cycle time by working in smaller chunks
  ([interview](https://www.youtube.com/watch?v=CQmI4XKTa0U)).
- **John Ousterhout** — "the most important idea in all of computer science is… decomposition"
  ([interview](https://www.youtube.com/watch?v=lz451zUlF-k&t=879s)), aimed more at *system design*.
- **Dave Farley** — "if you're asking the AI to write a whole feature and reviewing it once, you're
  violating the sampling theory. Ask for and work in smaller chunks, get feedback faster"
  ([video](https://youtu.be/XavrebMKH2A?si=5D1_vBF7gDdPN8oA&t=385)).

This is why both the Ticket Creator *and* the Interrogator push to split work into the smallest sensible
Sub-Tasks (ideally a Tracer Bullet first) — small enough to fit in a human's head and the AI's context
window, and to give fast feedback so change is cheap to embrace.

### Expansion and compression

The workflow is a rhythm of **expansion** and **compression**. Each agent *expands*: it explores
potentially-relevant code, does research, weighs options, and produces messy intermediate thinking. Then it
*compresses*: it discards the dead ends and refines what's left into a clear, concise document for the next
agent to load. The compression step is what keeps each agent's context sharp and permanently records the
decisions (and their reasoning) on disk, instead of letting them evaporate when the context is wiped.

### Ditching the "master/slave" dynamic

Common AI-development styles fall into two unsatisfying extremes: over-structured "master/slave" /
spec-driven ("write me a spec", "implement this spec", "review and fix"), and over-loose "let's just vibe".
This workflow aims for a balanced middle where AI and human collaborate continuously, each playing to their
strengths.

### Human + AI collaboration

- **The AI** is strong at finding things in files fast, working through checklists, knowing how libraries
  work without looking them up, and writing code/docs quickly.
- **The human** is strong at judgement about keeping things minimal, spotting how to simplify messy parts,
  and the wider context the AI was never told about.

The workflow keeps the quick feedback of vibe coding but adds the structure of documents, checklists,
audits, and explicit human approval gates. The clearest expression of this is the refactoring stage's
*obligatory* "things I'm unsure about — what do you think?" hand-back to the human (see [§6](#6-per-agent-design-rationale)).

---

## 4. Lineage: how it differs from the Full Jira TDD Story Workflow

This workflow is a descendant of the **Full Jira TDD Story Workflow** (the project's older,
Jira-locked story workflow). Many ideas are inherited; several were deliberately changed. Understanding the
split helps when you decide what to keep or revert in your own variant.

**Kept (the good ideas worth carrying forward):**

- **Sharply-pinned context** — each command loads only what it needs; everything else has been compressed
  into documents by the previous agent.
- **Questioning & clarification** — the AI summarises its understanding and asks numbered questions with
  recommended answers and inline space for the human to respond.
- **Perplexity / web research** — captured into research files and summarised, rather than left in volatile
  context.
- **Templates** — the format of each document the AI writes lives in a separate `*.TEMPLATE.md` file, so
  command files stay short and the templates are a single source of truth.
- **Minimal tests and minimal code** — only enough tests to force the feature into existence, and only
  enough code to pass them.
- **Plan-then-execute refactoring** — refactoring is *planned* in a document by one agent and *executed* by
  the next, which forces every refactoring decision (and its "why") to be written down.
- **Documenting for the future** — the chain of Markdown artifacts becomes a permanent record of *why* the
  code is the way it is, committed alongside it.

**Changed or dropped (deliberate design choices):**

- **RED and GREEN merged into one Planner.** The old workflow planned the failing tests in one agent and
  the implementation in another — which forced the code structure to be worked out twice (once to write
  tests against, once to implement). Here a single **Planner** plans the tests *and* the code those tests
  drive, in one plan. (Note: this means it is not "purist" single-test-cycle TDD — see [§8](#8-deferred-to-the-future).)
- **One Refactor Suggestion List instead of two overlapping sections.** The old flow made the human read an
  up-front analysis *and* a separate agreed-refactors table that re-listed much of it. Here the human reads
  and approves exactly **one** list; a summary table is produced *afterwards* purely as a record.
- **No "Tier 1 / Tier 2" auto-approval.** That naming and process were confusing. This workflow has no
  concept of auto-approval — though it does *batch* similar trivial refactors (e.g. constant extraction)
  into a single approval.
- **A simpler, quicker Validator** that focuses on highlighting what the human should check/run, rather
  than an over-engineered box-ticking pass.
- **No issue-tracker MCP.** The old workflow was locked to Jira and posted progress comments. This one is
  **issue-tracker-agnostic**: tickets are local Markdown files identified by a `ticket-id`, so it works
  with any tracker, or none. (Re-adding an optional MCP integration is a possible future extension — see
  [§8](#8-deferred-to-the-future).)

The result is a **single linear sequence of 7 agents** with no per-test-type loop — much simpler than the
old workflow's structure.

---

## 5. Runtime architecture

### The TypeScript CLI: capture-01, broadcast, ignore-the-rest

The CLI ([`ts-workflow/src/add-feature-detailed-example-cli.ts`](../../ts-workflow/src/add-feature-detailed-example-cli.ts))
follows the same pattern as `create-workflow-cli.ts`:

1. Read `AGENTIC_HQ_WORKSPACE_ROOT` from the environment and parse the passthrough params (`--verbosity`,
   `--suggest-large-refactor`, `--ticket-id`), applying defaults (`low` / `false`; `ticket-id` only passed
   through if supplied).
2. Build Command 01's input string and run it. **Capture Command 01's return value as `allVariables`.**
3. Re-inject that *same* `allVariables` string into Commands 02–07, and **ignore** their outputs.

The one difference from `create-workflow-cli.ts` is that this CLI takes passthrough parameters; everything
else is copied as-is.

### The variable-flow chain

Only **Command 01 (Ticket Creator)** adds a variable to the broadcast string: `ticket-id` (which it
generates or obtains from the user if it wasn't supplied). Every other variable an agent needs is derived
from the shared roots or **read from the files written by earlier agents** under
`{ticket-directory}/workflow-files/`. Agents 02–07 emit no new variables. This is deliberate: keeping the
broadcast payload tiny means the data flow is easy to reason about, and it forces agents to communicate
through documents on disk (which is also what creates the permanent record). Each command's "Establish
Variables" step rebuilds the full variable list, each variable a tiny increment on earlier ones — that
verbose-but-explicit chain is one of the patterns the workflow deliberately keeps.

### Skill-bundled asset resolution

Help docs and templates ship *with the skill* in its `docs/` and `resources/` directories, so they travel
with it if the skill is versioned/distributed. Agents locate that directory by deriving it from
`AGENTIC_HQ_WORKSPACE_ROOT` plus `plugin-id` and the workflow id — the same known-good pattern
`create-workflow` itself uses. (Current limitation, left for later: this resolves the skill dir *via the
workspace root*, so the workflow must run with `AGENTIC_HQ_WORKSPACE_ROOT` set. Resolving a plugin's own
skill root independently of the workspace — so a marketplace-installed skill finds its bundled docs
anywhere — is a future improvement.)

### Help docs, `verbosity=medium`, and "Tell Me More"

Each agent both **points the user to** its help doc and **reads it** for context. By default
(`verbosity=low`) it introduces itself in one sentence and gets on with the work. At `verbosity=medium`, or
whenever the user says **"Tell Me More"**, the agent re-reads its help doc and explains the reasoning behind
the current stage before continuing. The main User Help Doc links to all 7 per-agent help docs. This is how
the workflow hides its complexity behind a fast default while keeping the depth one keystroke away.

### Templates as separate files

Every document the agents write (split/unsplit ticket, refactoring plan, refactoring execution, validator
summary) has its format defined in a `*.TEMPLATE.md` file under
[`resources/templates/`](../../resources/templates/), not embedded in the command. This keeps commands
short and makes each template a single source of truth. One template subtlety worth knowing if you edit
them: a template may carry **instructional prose for the AI** (HTML comments, `<…>` placeholders) telling
it what to produce — that guidance must **not** be echoed into the document the human reads.

---

## 6. Per-agent design rationale

The *principle* behind each of the seven agents (the granular per-agent build history is in the planning
doc; each agent's user-facing explanation is in its own help doc under
[`../workflow-help-docs/`](../workflow-help-docs/)).

1. **[Ticket Creator](../workflow-help-docs/01-ticket-creator-help-doc.md)** — its defining feature is a
   **mandatory attempt to split** the feature into Sub-Tasks, no matter how small the feature looks, ideally
   with a **Tracer Bullet** first (a skeletal end-to-end slice that gives feedback early and gives later
   Sub-Tasks something to build onto). The human can always reject the split. The split is mandatory
   because reduced cycle time is the best leverage — but the ticket itself is kept deliberately short
   (a summary plus pointers), because a ticket that *needs* lots of detail is a signal it should be split.

2. **[Interrogator](../workflow-help-docs/02-interrogator-help-doc.md)** — builds a shared understanding and
   asks clarifying questions. Its summary is kept **deliberately high-level**: if it became a detailed plan,
   the human would learn to skim it (and then skim the Planner's plan too). Keeping it high-level means the
   human actually reads it all and catches misunderstandings *early*, before planning. It also revisits the
   split decision once the real complexity is known.

3. **[Planner](../workflow-help-docs/03-planner-help-doc.md)** — produces the Implementation Plan and is
   **forbidden from writing any code**. This is the heart of the "compress to disk" idea: all the
   exploration and discussion that happens during planning must be distilled into the plan document, so the
   Executor gets *only* the clean context it needs and every important decision survives the context wipe.
   It uses **TDD by default** (minimal tests → RED → minimal code → GREEN) and carries design **appendices**
   (see [§7](#7-the-planners-design-appendices)). Anything good-but-not-minimal is recorded as a `REFACTOR:`
   note for later.

4. **[Executor](../workflow-help-docs/04-executor-help-doc.md)** — turns the plan into working code. Three
   disciplines define it: **document the Execution Document as you go** (a section per step, written the
   moment it's done, because compaction can wipe memory at any time); **STOP and document when a problem is
   hit** rather than silently working around it; and **no silent deviations** — never install an alternate
   library or mass-refactor existing code to force things through. The anti-pattern it guards against is the
   human coming back from a tea break to a codebase full of unexpected changes.

5. **[Refactoring Planner](../workflow-help-docs/05-refactoring-planner-help-doc.md)** — plans refactoring
   into a single **Refactor Suggestion List** (the one list the human approves). It exists because AI, left
   alone, optimises for "task done fast" and won't voluntarily pay down structural debt — so the workflow
   *forces* a structured refactoring pass (basic audit, magic-constants, missing comments, design-
   requirements, documentation, and `REFACTOR:` notes). The optional **`suggest-large-refactor`** flag adds
   a deeper, *structural* refactoring suggestion that looks at the system *around* the change for
   opportunities to simplify or clarify it — and **obligatorily** asks the human for advice on the parts the
   AI is unsure about. This is the workflow's strongest expression of human+AI collaboration.

6. **[Refactoring Executor](../workflow-help-docs/06-refactoring-executor-help-doc.md)** — executes the
   approved refactors **one at a time**, running a quick validation between each, reverting any that fail,
   and (like the Executor) never silently substituting a different, unplanned refactoring. Trivial constant
   extractions are the one thing it batches. A large refactor, if planned, is done **last**, after
   recommending the human commit first so it can be reverted.

7. **[Validator](../workflow-help-docs/07-validator-help-doc.md)** — a deliberately **minimal, quick** final
   double-check: re-run the new tests plus a quick validation command, summarise how each requirement /
   acceptance criterion was met, and ask the human to verify the feature manually (and do a quick manual
   regression check around the changed area) before approving. It is intentionally light because a heavy
   validation pass tends to become box-ticking that catches little while costing tokens and time.

---

## 7. The Planner's design appendices

The Implementation Plan keeps its long reasoning in **appendices**, so the human can read the short Main
Section in full and skim the appendices. Three appendices are themselves design tools worth understanding
if you modify the Planner:

- **Appendix A — English Language Description.** A paragraph describing how the system will work, scenario
  by scenario, with **class/interface names bolded** and *only true method-call verbs italicised*. It's a
  fast way to sanity-check a design: if it doesn't read naturally, the team probably doesn't understand the
  system well or the naming is poor; a noun that isn't bold hints at a missing abstraction; an action
  that isn't italic hints at a missing method. (Formatting rules: `docs/dev/project-design-requirements.md`.)
- **Appendix B — Project Design Requirements Compliance Audit.** A table auditing the plan against the
  project's design requirements (using `docs/dev/project-design-requirements.md` if present, otherwise the
  Agentic HQ defaults, or skipped by choice) — relevance, which plan section addresses each requirement,
  and how.
- **Appendix C — Acceptance Criteria Audit.** A table mapping each acceptance criterion to the plan
  section(s) that satisfy it.

There is also **Appendix D — List For Refactor Planner**: items the Executor deliberately should *not* do
(name changes in existing code, documentation, untested-requirement improvements) but that the Refactoring
Planner should pick up later. It is the explicit hand-off between the implementation and refactoring halves
of the workflow.

---

## 8. Deferred to "The Future"

The workflow was designed knowing it is a first cut. These are the extensions it deliberately leaves for
later — useful to know if you're deciding what to add:

- **Purist single-test TDD.** A strict cycle would hide everything from the implementing agent except the
  failing tests and minimal context, get them passing, then ask the Test Planner "did your tests force a
  complete implementation?" and loop. It's powerful but high-overhead, so this workflow merges RED+GREEN
  into the Planner instead.
- **A fast RED-GREEN-REFACTOR sub-workflow.** A tiny, low-overhead inner cycle for each small code addition,
  nested inside this slower outer cycle — the intended way to get purist-TDD feedback speed without the
  per-feature overhead.
- **Context caching** ([AHQ-148](https://agentic-hq.atlassian.net/browse/AHQ-148)) — to avoid each agent
  re-loading the same code/research into context every run.
- **Regression testing** — automated (write a related test that's green before the change and confirm it's
  still green after) and/or a short list of manual regression checks around the changed area.
- **Executable acceptance criteria** — replacing prose acceptance criteria with executable acceptance
  tests.
- **Optional issue-tracker MCP integration** — re-adding the Jira-style "post progress to the tracker"
  behaviour, but as a configurable extra rather than a hard dependency.
- **Speed / overhead tuning knobs** — e.g. a `speed = fast|normal|slow` parameter, or simply copying the
  workflow and stripping out overhead, to find the right balance for different users and tasks.

For the complete reasoning behind any of the above — and the full build history of every agent — see the
[AHQ-143 planning doc](../../../../../../../docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md)
in the Agentic HQ repository.
