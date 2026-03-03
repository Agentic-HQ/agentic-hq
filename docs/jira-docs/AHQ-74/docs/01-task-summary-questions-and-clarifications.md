# Document 1: Task Summary, Questions and Clarifications

**AHQ-74 Deliverable 1 of 5**
**Date:** 2026-03-01

---

## My Understanding of AHQ-74

You've reached a crossroads. The project has real, working infrastructure — ClaudeCodeTool, PTY-based execution, a plugin system, a CLI, working demos, solid tests — but it's all "works on Steve's machine." The gap between that and "another developer can use this" is the challenge.

AHQ-74 asks me to:
1. Deeply understand what exists
2. Research the technologies involved (Claude Code plugins/marketplace, Verdaccio, npm publishing)
3. Map the current state honestly
4. Identify the direction
5. Propose concrete next steps to reach the goal

The goal is a **three-Jira progression**:

| Order | Jira | What It Achieves |
|-------|------|-----------------|
| 1st | **AHQ-76** | String reversal works from a fresh dev workspace (proves the full infrastructure: Verdaccio, global install, marketplace plugins) |
| 2nd | **AHQ-43** | Full Jira TDD workflow works from a fresh dev workspace (using AHQ's own Jira) |
| 3rd | **AHQ-75** | Same as AHQ-43 but with developer's OWN Jira and GitHub instances |

**AHQ-76 is the immediate target** — it's where the most work is (infrastructure). AHQ-43 and AHQ-75 are follow-ons that build on AHQ-76's foundation.

---

## What I've Already Learned (From Planning Phase Research)

### Questions Already Answered

These were resolved during the planning discussion:

**Q: Is AHQ-43 "run within cloned repo" or "separate workspace"?**
**A:** Clone repo → run setup scripts (Verdaccio publish + `pnpm add -g agentic-hq`) → developer goes to THEIR OWN workspace → runs `agentic-hq` commands (globally installed). The developer's workflow happens in their own project, not in the cloned AHQ repo.

**Q: How do plugins load when globally installed?**
**A:** Via Claude Code marketplace. The local cloned AHQ repo acts as the marketplace source. Setup script registers it: `claude plugin marketplace add /path/to/cloned/agentic-hq` then `claude plugin install <plugin>@agentic-hq-plugins`. Plugins are cached at `~/.claude/plugins/cache/` and auto-loaded by Claude Code — no `--plugin-dir` flags needed.

**Q: What's the publishing strategy?**
**A:** Build two levels now (local dev via `pnpm link`, local Verdaccio), design for two more later (remote beta, remote production). Clean script-driven approach: `setup.sh --env=dev|local-npm|remote-beta|remote-prod`. No file rewriting, no `pnpmfile.cjs`.

---

## Key Findings From Deep Research

### Finding 1: The Marketplace Is Nearly Empty

The marketplace configuration (`.claude-plugin/marketplace.json`) only registers **one plugin** — `steve-test-plugin`:

```json
{
  "plugins": [
    {
      "name": "steve-test-plugin",
      "source": "./.agentic-hq/plugins/steve-test-plugin",
      "category": "test"
    }
  ]
}
```

The three operational plugins (**agentic-hq-core-plugin**, **agentic-hq-demos-plugin**, **agentic-hq-utilities-plugin**) are NOT registered in the marketplace. They're loaded only via hardcoded `--plugin-dir` flags in ClaudeCodeTool.

**Implication for AHQ-43:** All plugins needed for the TDD workflow must be registered in `marketplace.json` before the marketplace-based installation path can work.

Steve Response: Yup, we'll be adding the required plugins to this marketplace.

### Finding 2: Only String Reversal Uses the Plugin Skill Architecture

The project has four working demos:

| Demo | How It Runs | Uses Plugin Skill? | Uses `agentic-hq` CLI? |
|------|-------------|-------------------|----------------------|
| String Reversal | `node bin/agentic-hq.cjs --workflow-command-supplier=...` | Yes (skill returns command) | Yes |
| Math Workflow | `tsx src/demo/cli/math-workflow-demo-cli.ts` | No (standalone CLI) | No |
| Quick Jira Workflow | `tsx src/demo/cli/quick-jira-workflow-demo-cli.ts` | No (standalone CLI) | No |
| Full Jira TDD Workflow | `tsx src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` | No (standalone CLI) | No |

Only string reversal flows through the `agentic-hq` CLI → skill → ts-workflow architecture. The Jira TDD workflows are standalone TypeScript CLIs that directly instantiate `ClaudeCodeTool` and call `tool.execute()` with plugin commands.

**Implication for AHQ-43:** The Jira TDD workflow is *already plugin-powered* (its commands live in `agentic-hq-demos-plugin`), but its **orchestrator** is standalone. To work from a globally-installed `agentic-hq` CLI, the orchestration logic needs to be accessible through the CLI entry point somehow.

Steve Response: Yup, this is work that needs doing.  Was planning on doing a Jira to convert all of these to user agentic-hq CLI **BUT** before converting want to get whole infrastructure up and running **JUST** for String Reversal workflow.  Then I know what I need to do for the others.

### Finding 3: The `agentic-hq` CLI Is a Single-Step Architecture

The current CLI pattern (`agentic-hq-cli.ts`) is:
1. Call a skill via `--workflow-command-supplier`
2. Skill returns a single bash command string
3. CLI runs that command

This works for string reversal (one command, one step). But the Full Jira TDD Workflow is a **multi-step orchestrator** — it reads the Jira, parses test types, then loops through RED → GREEN → REFACTOR-analysis → REFACTOR-execute for each test type, then runs VALIDATE.

**This is a significant architectural question:** How does the multi-step Jira TDD orchestrator get exposed through the `agentic-hq` CLI? Options include:
- (a) The skill returns a ts-workflow command that IS the orchestrator (like string reversal, but the workflow code itself handles all the steps internally)
- (b) The CLI gains a new mode for multi-step workflows
- (c) Something else entirely

Steve Response: I'm confident that (a) will work fine, and that was always the plan.  The ts-workflow runs the **WHOLE** multi-step workflow.  I'm already running my whole Jira workflow for each Jira by running a single Typescript command:  pnpm demo:full-jira-tdd-story-workflow --jira-id=<Jira I Want To Work On>
Once the Full Jira TDD Story Workflow has been migrated to the agentic-hq CLI I'll set up a new: pnpm demo:agentic-hq-cli-local-dev:full-jira-tdd-story-workflow --jira-id=<Jira I Want To Work On> that runs the agentic-hq in local dev mode.


### Finding 4: `private: true` Blocks npm Publish

The root `package.json` has `"private": true` (line 6). This flag prevents `pnpm publish` from working — even to a local Verdaccio registry. It needs to be removed or set to `false` before any publishing can happen.

Steve Response: That's fine - so long as the reason for the change is clearly commented.

### Finding 5: No `files` Whitelist = Everything Gets Published

There is no `"files"` field in `package.json`. Without it, `pnpm publish` would include the entire repository — 532MB of docs, test files, spike documentation, archived projects, everything. Adding a `files` whitelist is essential before the first Verdaccio publish.

Steve Response: Yup, agree. Need a Jira that includes this.

### Finding 6: The Full Jira TDD Workflow Is Already Well-Structured

Looking at `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`, the workflow is clean and well-designed:
- Reads Jira → gets comma-separated test types
- Loops each test type through RED → GREEN → REFACTOR-analysis → REFACTOR-execute
- Runs VALIDATE once at the end
- Uses proper ClaudeCodeTool file-based I/O throughout
- Interactive via PTY (human can participate in each step)

The commands it calls are all in the `agentic-hq-demos-plugin` (e.g., `/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:01-jira-read-and-question`). So the workflow IS plugin-based — it's just the orchestrator code that lives outside the plugin.

Steve Response: Yup.

### Finding 7: AHQ-1 Is the Epic, Not a Deliverable

AHQ-1 appears in references as the parent epic ("Epic AHQ-1: Simple TypeScript Driven Workflow"). It doesn't have its own docs folder. The existing demos collectively represent AHQ-1's goals. It's not a separate deliverable to worry about for AHQ-43.

Steve Response: Yup.  In fact - good spot! I've realised https://agentic-hq.atlassian.net/browse/AHQ-1 was already finished and so now I've set it to Done.

---

## Open Questions For Discussion

### Question 1: Which Workflow Is the AHQ-43 Demo?

AHQ-43 says: *"Developer can run the full Agentic HQ TDD workflow in their own workspace."*

AHQ-74 says: *"Getting this so it can be run by running the agentic-hq CLI npm command"* and *"Doing the same kind of work to get the full Jira workflow running from a new empty workspace."*

**My reading:** AHQ-43 requires the **Full Jira TDD Workflow** working from a globally-installed CLI in the developer's own workspace. String reversal is a stepping stone (proving the CLI + plugin architecture), not the end goal.

**Question:** Is that correct? Or is string reversal sufficient for AHQ-43, with Jira TDD being a later story?

Answer: Yes, this is correct.  Getting String Reversal working **with all of these things done properly** is the aim, then the final step is (once we are sure the simplest one-step workflow works) converting the other workflows including the full Jira Workflow.  This is because String Reversal is the fastest and simplest to test.  See answer/details in "Question 3" below for full details.

### Question 2: How Should the Multi-Step Orchestrator Work?

The string reversal demo works like this:
```
agentic-hq CLI → calls skill → skill returns one command → CLI runs it
```

The Jira TDD workflow needs:
```
agentic-hq CLI → calls skill → skill returns orchestrator command →
  orchestrator runs Step 1 (read Jira) →
  orchestrator loops test types through Steps 2-4 (RED, GREEN, REFACTOR) →
  orchestrator runs Step 5 (VALIDATE)
```

The existing `full-jira-tdd-story-workflow-demo-cli.ts` IS this orchestrator — it just runs standalone currently.

**My thinking:** Convert the Jira TDD orchestrator into a ts-workflow (like string reversal has), so the skill returns a command that runs it. The orchestrator would live in `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/jira-tdd-workflow/ts-workflow/`. It would be a self-contained mini project (per the AHQ-59 bundling pattern) with its own `package.json` pointing to the parent agentic-hq package.

**Question:** Does that sound right? Or is there a simpler approach?

Yup, this is right.  It's the identical pattern.  In fact it's still "agentic-hq CLI → calls skill → skill returns one command → CLI runs it" - it's just the "command" is one that runs a whole workflow instead of a single step workflow.  No other difference.

### Question 3: Must the Jira Workflow Work With Any Jira?

AHQ-43 says: *"linked to their own GitHub project to implement a Jira Story defined in their own Jira issue tracking system."*

This implies the developer provides their own Jira credentials and project. The existing workflow commands already take a `--jira-id` parameter.

**Question:** For AHQ-43, is it sufficient that:
- The developer configures their own Jira/Atlassian MCP connection
- The developer provides a Jira ID when running the workflow
- The workflow uses whatever Jira the developer points it at

Or are there additional setup/configuration steps needed to make this work for "any" Jira project?

Answer: I've now got a clearer picture of the sequence I want. The work has been split into three Jiras done in order:

**AHQ-76 — "agentic-hq CLI Runs String Reversal Single-Step Workflow In A New Dev Workspace"**
- The immediate, primary target where the most work happens
- Developer clones AHQ repo → runs setup script (Verdaccio, global install, marketplace plugins) → `cd` to a fresh empty workspace → runs `agentic-hq` command for string reversal
- Proves the full infrastructure end-to-end with the simplest possible workflow

**AHQ-43 (updated) — "agentic-hq CLI Runs Full Demo TDD Workflow In A Dev Workspace"**
- Follow-on from AHQ-76
- Developer runs the full Jira TDD workflow from a fresh workspace using AHQ's own Jira project
- Not as much work — the infrastructure is already proven by AHQ-76, this is mainly converting the Jira TDD orchestrator to the same ts-workflow pattern

**AHQ-75 — "Full Demo TDD Workflow Can Be Run From Custom Jira And GitHub Instances"**
- Follow-on from AHQ-43
- Allows the developer to specify their OWN Jira instance and GitHub project
- Minimal additional work beyond AHQ-43 — mainly configuration/documentation

The sequence is: **AHQ-76 → AHQ-43 → AHQ-75**. Most of the work is in AHQ-76.

### Question 4: Is Repo Size (AHQ-67) a Blocker for AHQ-43?

The repo is large:
- `.git`: 293 MB
- `docs/`: 532 MB (mostly spike documentation from earlier development phases)

But with a proper `files` whitelist in `package.json`, the **published package** would only include `src/`, `bin/`, `README.md`, and `LICENSE` — which would be small.

The large repo only affects:
- Clone time for a new developer (~293MB download)
- Disk space in the cloned repo

**My assessment:** AHQ-67 is **nice-to-have but not a blocker** for AHQ-43. The developer experience is: clone once (large but one-time), then work in their own (small) workspace. The published npm package itself would be small.

**Question:** Do you agree, or is there a reason the large repo would actually block AHQ-43?

Answer: I agree. AHQ-67 will come after AHQ-43 and be a "nice to have", depending on how much time I have.  The few developers I share this repo with privately can have the bloat - it will only mean it takes a minute longer to download.  I don't want to go public first without doing AHQ-67 as that will be embarrasing!

### Question 5: `cmd-ts` vs `commander` — Two CLI Libraries?

The `package.json` has both `cmd-ts` and `commander` as dependencies. The main CLI (`agentic-hq-cli.ts`) uses `commander`. Is `cmd-ts` still needed, or is it a leftover from earlier work?

This is a minor cleanup question but relevant because every dependency the published package carries matters.

Answer: Good spot. Created https://agentic-hq.atlassian.net/browse/AHQ-77 - Get Rid of cmd-ts Dependency If Not Needed 
and will do it soon. Please include it in the plan list.


### Question 6: Node.js >= 22 Requirement

The project requires `"node": ">=22.0.0 <23.0.0"`. Node.js 22 is the current LTS (since October 2024), so this is reasonable. But it does mean developers must be on a fairly recent version.

**Question:** Is this acceptable for your target collaborators, or should it be more permissive?

Answer: Yes, acceptable. Node 22 has been available since Apr 2024 (nearly 2 years). Developers who haven't upgraded yet will just have to...(they can use npm to switch between different versions if they need to keep old versions working)

---

## Differences From the Draft Plan

During actual research, I found the following things that differ from or refine the initial plan:

1. **Major: The goal has been split into three Jiras** — The draft plan had AHQ-43 as the single north star. Steve has now created a clearer progression: AHQ-76 (string reversal in fresh workspace) → AHQ-43 (full TDD workflow with AHQ Jira) → AHQ-75 (full TDD workflow with developer's own Jira/GitHub). AHQ-76 is the immediate target. This is a significant refinement — it means we focus ALL infrastructure work on the simplest workflow first.

2. **New finding: marketplace.json is nearly empty** — The draft plan assumed plugins were registered. They're not. This is an explicit task to add before AHQ-76 can work.

3. **New finding: `private: true` blocks publish** — Not mentioned in the draft plan. Needs to be addressed alongside the `files` whitelist.

4. **Resolved: CLI architecture is NOT a gap** — The draft plan worried about the "single-step CLI vs multi-step orchestrator" mismatch. Steve confirmed option (a): the ts-workflow IS the orchestrator. The pattern is identical — the skill returns one command, that command just happens to run a whole workflow. No CLI changes needed.

5. **New Jira: AHQ-77** — Created during this discussion to remove the unused `cmd-ts` dependency. Include in the plan list.

6. **Confirmed: AHQ-1 is not relevant** — Draft plan asked about it; research confirms it's just the parent epic. Steve has now marked it Done.

---

## Things To Discuss

All 6 original questions have been answered inline above. No outstanding questions remain.

---

## Discussion Notes

**Discussion completed 2026-03-01. All questions resolved.**

### Agreed Points

1. **Three-Jira progression confirmed**: AHQ-76 (string reversal in fresh workspace, most work) → AHQ-43 (full TDD workflow with AHQ Jira) → AHQ-75 (developer's own Jira/GitHub). Focus is on AHQ-76 first.

2. **Marketplace plugins**: All required plugins (core, demos, utilities) will be added to `marketplace.json`. Currently only `steve-test-plugin` is registered.

3. **Converting workflows to agentic-hq CLI**: String reversal first (it already works), then convert Jira TDD and others. The pattern is identical — skill returns one command that runs the whole workflow. No architectural change to the CLI needed.

4. **`private: true` and `files` whitelist**: Both need addressing in package.json before Verdaccio publish. Changes should be clearly commented.

5. **Repo size (AHQ-67)**: Not a blocker for AHQ-76/43/75. Defer until before going public.

6. **cmd-ts cleanup**: New Jira AHQ-77 created to remove the unused dependency. Include in plan.

7. **Node.js >= 22**: Acceptable for target collaborators. No change needed.

8. **AHQ-1**: Marked as Done by Steve. It was the parent epic, now complete.

### New Jiras Created During Discussion

| Jira | Summary |
|------|---------|
| **AHQ-76** | agentic-hq CLI Runs String Reversal Single-Step Workflow In A New Dev Workspace |
| **AHQ-75** | Full Demo TDD Workflow Can Be Run From Custom Jira And GitHub Instances |
| **AHQ-77** | Get Rid of cmd-ts Dependency If Not Needed |

### Jiras Updated During Discussion

| Jira | Change |
|------|--------|
| **AHQ-43** | Updated to be a follow-on from AHQ-76 (was previously the standalone north star). Now focused on "Full Demo TDD Workflow" using AHQ Jira, with AHQ-75 as the follow-on for custom Jira/GitHub. |
| **AHQ-1** | Marked as Done |
