This is a edited copy of:

docs/jira-docs/AHQ-157/01-initial-chats/01-codex-report-on-what-im-doing-wrong-etc.md

with comments to track what I'm planning on doing and not doing from the recommendations ChatGPT made.


TODO POSTLAUNCH JIRA - https://agentic-hq.atlassian.net/browse/AHQ-175: "PostLaunch: Update Docs To Emphasise Expansion/Compressions Story"
 ???Check in-depth docs to make sure this "strongest idea" about expansion/compression is clearly expressed???:-

## Executive Summary

Agentic HQ is a real project with a real thesis. The strongest idea is not "multi-agent workflows" in the abstract; it is the tighter claim that AI development work improves when each stage expands context with the human, compresses decisions into files, and hands a focused artifact to a fresh agent context. That is a genuinely valuable pattern, and the repo demonstrates that you have dogfooded it heavily.

TODO: Fix the permission trust issue by improving the docs/README:-

Launch when a stranger can clone the repo, understand the single compelling use case, run one meaningful workflow, and trust what permissions it is taking. 

TODO: Fix clutter/personal tailoring:-

Right now the project is close to that, but the launch story is still too cluttered and too personally tailored.





## Launch Readiness: What Is Not Right Yet

### 1. The public repo still reads like a private workshop

There are still launch-blocking public-facing placeholders:

- `README.md` says "While this repo is still private..." in Support and Developer Documentation.


- `CONTRIBUTING.md` contains `<DISCORD_INVITE_URL>`.
DONE - See https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/98009089/Discord+Admin - permanent invite link is https://discord.gg/fnR7SJt2d7 - also set up community server and onboarding in https://agentic-hq.atlassian.net/browse/AHQ-139

- `.github/ISSUE_TEMPLATE/config.yml` contains `<DISCORD_INVITE_URL>`.
DONE

- `.claude-plugin/marketplace.json` contains `made-up-email-for-testing@agentichq.ai`
DONE - removed (since https://code.claude.com/docs/en/plugin-marketplaces says it's optional - in future, if start using Plugin properly set up anthropic-plugin-email@agentichq.ai and email forwarding)

- `SECURITY.md` says private vulnerability reporting cannot be enabled until the repo is public and references a post-launch Jira.
TODO ON LAUNCH DAY - Tracked by https://agentic-hq.atlassian.net/browse/AHQ-137 

- `scripts/infra/install-prod-agentic-hq.sh` is explicitly a placeholder / not implemented script.
DONE - Deleted

These are not deep technical issues, but for launch they matter because they say "this is not quite ready" to a stranger in the first five minutes. The project can be pre-1.0 and rough; it should not look accidentally unfinished.



TODO IN JIRA - https://agentic-hq.atlassian.net/browse/AHQ-174 - "Reduce Size Of Repo By Archiving To Separate Repo":-
### 2. The docs volume is much too high for a public first impression

Measured locally:

- `git ls-files docs` returns 966 tracked files.
- Around 752 of those are internal Jira/spike/artifact/LATER/ticket-style files.
- Tracked docs are about 92M.
- The full local `docs/` tree is about 536M because of ignored historical/generated material.

The tracked docs are probably valuable to you because they are the fossil record of the project and proof that AHQ was dogfooded. But a public repo has a different job: it must help a new person understand what to run and why to care.

The current docs tree does the opposite: it makes Agentic HQ feel bigger, older, and more internally complicated than the actual product. The production TypeScript is tiny by comparison, roughly 2.6k lines under `src`. That mismatch creates a credibility problem: the repo says "lightweight wrapper", while the surrounding artifacts say "massive private process universe".

Recommendation:

- Keep a small curated `docs/` tree for public docs.
- Move historical Jira/spike/workflow artifacts into one clearly named archive, or out of the public repo entirely.
- If you keep them, add a top-level explanation: "These are dogfooding artifacts, not required reading."
- Do not make new users wade through `docs/jira-docs`, `docs/project-docs`, `docs/artifacts`, and `docs/LATER` to work out what is product and what is history.


DONE:
### 3. The docs must make `add-feature` the product path, but the default workflow may be too opinionated

The README currently starts with the real concept, then the Quick Start leads users through string reversal and math demos. Those demos are useful smoke tests, but they are not the reason the project exists.

Your actual flagship claim is now `add-feature`: a generic, issue-tracker-agnostic development workflow that implements the expansion/compression/fresh-context idea. But the README does not yet teach that as the main product path.

You noted that part of AHQ-143 is already to re-orient the documentation around `add-feature` as the flagship first-time workflow. That is the right direction, but it does not fully solve the product problem. The deeper issue is not only "which workflow do the docs point at?" It is "which workflow deserves to be the default experience for a new user?"

#### Human Comment Incorporated

> Great doc (so far) - one thing to consider is that part of AHQ-143 I'm going to re-orient all the documentation to focus on this workflow as the "flagship" one that people follow first time.
>
> I really, really appreciate your point that it's probably got too much personalised, opinionated ideas that will not appeal to a lot of potential users. For that reason it may be worth having an `add-feature-quickly` version that is minimal and only includes the absolute basics that 90% of devs would like (and less steps and more simplicity), with the `add-feature` one being a showcase of how a complex workflow could be built with very personalised ideas.
>
> So people who want a very different workflow take the `add-feature` workflow and add their own customisations? I haven't got time to do a lot of work on this `add-feature-quickly` workflow (maybe name should be `minimal-add-feature`?). If you are leaning towards this being the flagship (and my `add-feature` being the "how I would do it" demo). Also could rename current to `add-feature-detailed` and other one to `add-feature-simple`? Lot of choices.

Updated launch decision:

- `agentic-hq add-feature` should be the new simple flagship workflow.
- The current seven-agent workflow should be renamed to `add-feature-detailed-example`.
- `add-feature-detailed-example` should be billed as a worked example of a deeply customized, opinionated add-feature workflow that contains the development preferences of the project founder, not as the recommended workflow for most users.
- `agentic-hq create-workflow --using add-feature` should be the supported customization path.
- The create-workflow help docs should explain `--using`, with `add-feature` as the primary example.

This is cleaner than the earlier `CUSTOMIZE_THIS_WORKFLOW.md` idea. The simple workflow should not carry a standalone customization manual. It should finish the user's feature, then point to `create-workflow --using add-feature` and suggest they create their own workflow that fits their own development process (and try out add-feature-detailed-example to see how a complex, detailed workflow can work)

That gives the product a clear launch story:

1. Start with `add-feature`.
2. Inspect (or try out) `add-feature-detailed-example` to see how detailed a personalized workflow can become.
3. Run `create-workflow --using add-feature` to build your own version.

A launch user should quickly see:

1. What problem AHQ solves.
2. Why Claude Code Skills alone are not enough for that problem.
3. The smallest meaningful workflow they can run.
4. What files it writes and why.
5. What permissions it takes.

The toy demos should be moved into a separate "Smoke tests / examples" section. Do not let the first product experience be "Claude reverses a string".




DONE:
### 4. The workflow overview doc is already stale

`agentic-hq list` currently shows:

- `create-workflow`
- `add-feature`
- `full-jira`
- `math`
- `quick-jira`
- `reversal`

But `docs/user-docs/workflow-descriptions/overview-of-workflows.md` does not document `add-feature`. It also links to `README#installation`, while the README has `Prerequisites` and `Quick Start`, not an `Installation` heading.

That doc drift is exactly the kind of small issue that makes early users distrust a project. If a user sees `add-feature` in the CLI but cannot find it in the workflow overview, the project feels inconsistent.





TODO IN JIRA: https://agentic-hq.atlassian.net/browse/AHQ-176 - Add Minimal CI (Continuous Integration) Tests (Without Real Claude Code)
### 5. There is no visible CI

There are issue templates and a PR template, but no `.github/workflows/*`.

Local `pnpm validate` passing is good. Public launch without CI is not good. Contributors need a visible green check. Users browsing the repo need evidence that the project is not just locally working on your machine.

Minimum launch CI:

- Install with Corepack and the pinned pnpm.
- Run `pnpm validate`.
- Run a non-Claude smoke test such as `node bin/agentic-hq.cjs list`.
- Add a separate optional/manual workflow for slow e2e tests that need Claude/Jira credentials - to do later in https://agentic-hq.atlassian.net/browse/AHQ-177 - Later: Improve CI To Include Tests That Use Real Claude Code



TODO POSTLAUNCH - https://agentic-hq.atlassian.net/browse/AHQ-178 - PostLaunch: Add Validation Of Workflow Typescript
### 6. The root validation misses shipped workflow TypeScript

Root `pnpm validate` excludes plugin TypeScript workflow programs:

- `.agentic-hq/plugins/**/ts-workflow/src/**`
- `tests/e2e/fixtures/**/ts-workflow/src/**`

I checked them manually with:

```bash
for d in .agentic-hq/plugins/*/skills/*/ts-workflow; do
  node_modules/.bin/tsc -p "$d/tsconfig.json" --noEmit
done
```

That passed. But the need to invent this check is the problem. Shipped workflow code is product code. It should be covered by an obvious validation command before public launch.

Recommendation:

- Add `pnpm typecheck:workflows`.
- Include it in `pnpm validate` or `pnpm validate:all`.
- If you intentionally keep root `validate` fast, document clearly that `validate:all` is required before release.


TODO JIRA - https://agentic-hq.atlassian.net/browse/AHQ-179 - Improve Documentation About Auto-Approved Permissions
### 7. The launch trust story is hurt by broad auto-approved permissions

You are honest about this in `README.md` and `docs/user-docs/WARNING-re-auto-approved-claude-permissions.md`, which is good.

But the actual model is broad:

- `Bash`
- `Edit`
- `Write`
- `MultiEdit`
- Jira MCP tools
- Confluence MCP tools
- `Skill(agentic-hq-core-plugin:self-termination)`
- extra read access to the AHQ install `.agentic-hq` directory

This is a serious trust barrier. The careful developers most likely to appreciate your process are also the developers most likely to pause at broad auto-approval. The fact that Jira and Confluence tools are auto-approved for workflows that do not need Jira is especially hard to defend.

Recommendation:

- Make per-workflow permissions a launch-priority feature, not a later nicety.
- At minimum, split "generic local-code workflows" from "Jira workflows" in the permission set.
- Print the permission set before first run, or provide `agentic-hq explain-permissions <workflow>`.

HUMAN COMMENT: I'm going to improve the docs in https://agentic-hq.atlassian.net/browse/AHQ-179 - "Improve Documentation About Auto-Approved Permissions" and will decide then whether to create a PostLaunch Jira for any potential improvements.  I don't agree this is so critical it needs to be done before launch, but will talk to developers about it once it has been launched to get real feedback.

DONE (script deleted):-
### 8. The dev install story knowingly mutates global machine state

`scripts/infra/install-dev-agentic-hq.sh` is very honest that `pnpm add -g .` is "smelly" and mutates global pnpm state. That honesty is good engineering culture, but it is not an ideal first-run experience.

For launch, you need either:

- a clean public install path, or
- a very clearly framed "developer preview" install path.

Do not make users feel they are running your internal dev workaround unless you explicitly brand the launch as a developer preview.


DONE (See above)
### 9. The repo is prepped for community, but not quite connected

Good:

- MIT license.
- Code of conduct.
- Contributing guide.
- Security policy.
- Bug and feature issue templates.
- PR template with AI-assistance disclosure.

Missing or incomplete:

- Discord URL placeholder.
- Security private-reporting instructions still written around private repo status.
- No CI.
- No public roadmap document that separates "launch", "soon", and "later" - NOT DOING
- HUMAN added: No pnpm update process to updated to newer, more secure versions (due to recent freeze on versions to help prevent Supply Chain Attacks) - doing this later (post launch) in https://agentic-hq.atlassian.net/browse/AHQ-146 and https://agentic-hq.atlassian.net/browse/AHQ-154

This is close. It needs one cleanup pass before launch.

## Architecture, Code, Tests, And AHQ-143

NOT DOING:
### 10. The core engine is better than the surrounding launch surface

NOT DOING:
### 11. Your object-oriented discipline helps in places, but you are over-applying it
...
Recommendation:

- Keep the object-heavy pattern for real extension points and domain concepts with behavior.
- Be more selective for tiny immutable string wrappers.
- Document the intended public extension points explicitly, so contributors know which abstractions matter and which are internal style.
- Consider allowing simple data objects or plain functions in low-risk leaf areas, even if the rest of the system remains OO.

NOT DOING:
### 12. The testing culture is strong, but the test boundary is incomplete

NOT DOING:
### 13. `PtyCLIWrapper` probably needs better failure semantics

NOT DOING:
### 14. The self-termination mechanism is clever but brittle

NOT DOING:
### 15. AHQ-143 is the right flagship idea, but the current workflow is not yet finished

DONE:
### 16. The current `add-feature` workflow is probably too heavy as a default
### 17. The workflow command files are powerful, but too long and instruction
### 18. You are right about "tokens are cheap, human attention is expensive"

### 19. Your supply-chain posture is unusually good

Good decisions:

- Frozen lockfile.
- pnpm 11 build-script approvals.
- Third-party build scripts blocked where prebuilt binaries are available.
- 7-day minimum release age.
- Node 22/24 support explicitly documented.
- `@types/node` pinned to the oldest supported Node major.

This is better than many early open-source projects. Keep it.

The main gap is not supply-chain intent; it is validation and public trust around runtime permissions.

HUMAN NOTE: Avoiding Supply Chain attacks it high quality - but at a cost: frozen lockfiles mean dependencies don't get latest security fixes until I manually update them (currently). Need to establish safe and regular updating process (this is in https://agentic-hq.atlassian.net/browse/AHQ-154 )



TODO MAYBE - as part of https://agentic-hq.atlassian.net/browse/AHQ-175:-
## Concept, Market, And Strategy

### 20. The concept is strong

The core concept is worth pursuing.

The valuable insight is:

> A long AI coding task should not be one swollen conversation. It should be a controlled sequence of focused contexts, with durable artifacts between stages.

That is real. It matches the problems people actually hit with AI coding:

- Context gets polluted.
- The AI forgets or underweights rules.
- Human review becomes boring and late.
- Plans disappear into chat history.
- Refactoring gets skipped or treated as a cosmetic afterthought.
- A single agent tries to do discovery, planning, execution, review, and validation in one context.

AHQ's best answer is the expansion/compression loop:

- Expand: explore code, ask the human, research, compare options.
- Compress: write the decision, plan, or summary to a focused file.
- Reset: hand that compressed artifact to a fresh Claude Code session.

That is a good mental model, and it is clearer than generic "multi-agent" language.

### 21. The strategy risk: Claude Code itself is moving into your territory

This is not a reason to stop. It is a reason to sharpen the wedge.

Current Claude Code docs already frame plugins as shareable, versioned, reusable packages for teams and marketplaces. The official plugin docs say plugins are for sharing functionality across projects/teams, versioned releases, and marketplace distribution:

- <https://code.claude.com/docs/en/plugins>
- <https://code.claude.com/docs/en/discover-plugins>
- <https://code.claude.com/docs/en/plugin-marketplaces>

Claude Code also has subagents as a context-management mechanism. The docs explicitly say subagents preserve context by handling side tasks in their own context window and returning summaries:

- <https://code.claude.com/docs/en/sub-agents>

So AHQ cannot be positioned merely as:

- "Claude Code plugins"
- "Claude Code Skills"
- "fresh context"
- "agent workflows"

Those words are no longer enough. They are becoming platform primitives.

AHQ's defensible position is more specific:

- deterministic TypeScript control flow around Claude Code,
- durable file-based workflow state,
- human approval gates,
- composable developer workflows,
- reusable workflow templates,
- process quality for AI-assisted software engineering.

Put another way:

> Claude Code gives you the agent substrate. AHQ gives you a programmable workflow harness around it.

That is the strategic sentence I would optimize around.

### 22. There is competition from AI-native workflow frameworks

BMAD, for example, publicly positions itself as an open-source AI-native development framework with agents, workflows, and skills:

- <https://www.bmadcode.com/bmad-method/>

Whether or not BMAD is directly comparable, it proves the category is forming. There will be many projects offering "AI development workflows." AHQ needs a sharp differentiator.

Possible differentiators:

- **Thin wrapper, not a platform.** AHQ does not replace Claude Code; it orchestrates it.
- **File artifacts as the contract.** Every stage leaves readable Markdown/JSON behind.
- **Human collaboration, not blind automation.** Approval gates and document comments are first-class.
- **Fresh contexts by design.** Each stage starts clean and loads only what it needs.
- **Workflow authoring in TypeScript.** Control flow lives in real code, not a giant prompt.

The "TypeScript wrapper around Claude Code" line is not glamorous, but it is strategically useful because it fights framework bloat. Keep it.

HUMAN COMMENT: I used BMAD extensively early in the project and was a big fan.  Big gap in it's implementation is that is no automation of workflows (you run each of the commands in the workflow manually).  Also it focusses heavily on Spec Driven Development that create large, heavy weight specs before starting coding.  I tried it and there are big problems with creating and managing large specs as things change during implementation.  I'm now preferring much more light-weight, iterative, minimal specs for just the tiny part you're working on now, with a tree of minimal specs leading to that spec.

DONE:
### 23. Your biggest product risk is over-personalization

DONE:
### 24. The launch wedge should be narrower
Recommended launch wedge:

> Agentic HQ lets you run Claude Code development workflows as small, fresh-context stages with durable Markdown artifacts between them.

Actually:

> Agentic HQ gives you control of your AI development workflow.
> It does this by allowing you to chain together a series of Claude Code Skills, each of which start in a new session and load only the context they need for their particlular task.
> The workflow is run using a simple Typescript program that runs Skills and passes variables between them. The Skills use these variables and markdown files to save and load context.
> To try it out follow the Quick Start to get installed, then add a feature to an existing project and create your own customised workflow.


Then show one workflow:

- "Add a feature" as the real workflow.
- Reversal/math as smoke tests only.
- Jira workflows as advanced/legacy/dogfooding examples.
- Create-workflow as "build your own later", not the first thing users should do.

DONE:
### 25. Do not over-index on "workflow builder" at launch
...
So put `create-workflow` later in the docs. It is a power-user path, not the primary launch story.

NOT DOING:
### 26. You should explicitly embrace "developer preview"

NOT DOING:
### 27. The target user is narrower than "developers"

NOT DOING:
### 28. The current name "Agentic HQ" is acceptable but slightly generic

DONE:
### 29. The real product is not the TypeScript wrapper; it is the workflow library
...
For launch, spend disproportionate time on the flagship workflow and its docs.

## Prioritized Recommendations

### Launch Blockers

1. **Finish AHQ-143 honestly.**
   Do not launch with Stage 2 skeleton notes, `STUBBED` sections, or help docs 04-07 still stubbed if `add-feature` is presented as real.

2. **Ship the decided `add-feature` split.**
   Launch should present:
   - `add-feature` = simple/default flagship workflow.
   - `add-feature-detailed-example` = current seven-agent opinionated workflow, billed as a detailed example rather than a recommended default.

   This removes the ambiguity around whether the current personal workflow is the public default. It becomes a proof point for customization depth.

3. **Add `create-workflow --using <workflow>` and help docs.**
   This should be launch scope if `add-feature` is the flagship. The simple workflow needs a clear answer to: "My process is different; how do I make this mine?"

   The answer should be `agentic-hq create-workflow --using add-feature`, backed by proper create-workflow help docs rather than a standalone `CUSTOMIZE_THIS_WORKFLOW.md` file inside the add-feature workflow.

4. **Rewrite the README around the real workflow.**
   Reversal/math should be smoke tests. The main path should explain `add-feature`, what files it writes, why fresh contexts matter, and how to inspect the artifacts.

5. **Clean public placeholders.**
   Remove or resolve:
   - "repo is still private" language,
   - `<DISCORD_INVITE_URL>`,
   - fake marketplace email,
   - private-repo security caveats,
   - placeholder production install script confusion.

6. **Add CI.**
   At minimum run `pnpm validate` and `node bin/agentic-hq.cjs list`.

7. **Add workflow TypeScript validation.**
   Add a checked command that typechecks `.agentic-hq/plugins/*/skills/*/ts-workflow`.

8. **Fix or clearly frame permissions.**
   Ideally implement per-workflow permissions. If not, make the warning unavoidable and split generic local workflows from Jira workflows as soon as possible.

### Should Do Before Launch If Time Allows

8. **Reduce docs clutter or explain it.**
   Move internal history out of the main path or add a clear "dogfooding artifacts" explanation.

9. **Update workflow overview docs.**
   Include `add-feature`; fix stale anchors and examples.

10. **Improve failure messages around child process failure.**
    Reject on non-zero PTY exit and include useful diagnostic context.

11. **Add a public roadmap.**
    Separate:
    - launch,
    - soon,
    - later,
    - experimental ideas.

12. **Make launch explicitly "developer preview."**
    This gives you permission to be macOS-first and rough while still being credible.

### Do Not Do Before Launch

13. **Do not build a big plugin marketplace story yet.**
    The marketplace can come later. First prove one workflow is useful.

14. **Do not over-polish internal architecture.**
    The code is good enough to launch. The product surface needs more work than `src`.

15. **Do not write more philosophy docs before pruning/curating existing docs.**
    You already have enough philosophy. The launch needs compression.

16. **Do not let the new simple `add-feature` become thin or perfunctory.**
    The decided split is right, but the new flagship still needs to be genuinely useful. It should be simpler than the detailed example workflow, not shallow.

## What You Are Doing Right

This section matters because the critique is fairly harsh.

You are doing several things unusually well:

- You have a real thesis, not just a wrapper around an API.
- You are dogfooding the project deeply.
- You care about human understanding, not just AI throughput.
- You have strong instincts about context management.
- You understand that human attention, not tokens, is the scarce resource.
- You have a serious test culture.
- You are documenting design intent, not just API usage.
- You are willing to encode a real engineering process instead of chasing demos.
- You are being honest about security and install tradeoffs.
- You have avoided building a giant platform; the core is still thin.

The best version of Agentic HQ is not a generic "agent framework." It is a pragmatic tool for developers who already use Claude Code and want to make multi-stage AI development work less chaotic, more reviewable, and more aligned with their standards.

## Where You Are Going Wrong

In one sentence:

> You are letting the artifact trail and personal methodology overwhelm the first-user product experience.

More specifically:

- You are treating internal proof-of-work as public documentation.
- You are overloading launch with too many workflows and too much history.
- You are letting the flagship workflow carry both onboarding and "Steve's full process" at once.
- You are underestimating how much the permission model will scare good users.
- You are relying on local validation where public CI is needed.
- You are building excellent process but not yet enough product packaging.

The fix is not to make AHQ less opinionated everywhere. The fix is to put the opinionated parts in the right layer:

- simple default path for first users,
- detailed example workflow as a showcase,
- workflow builder for advanced users,
- historical dogfooding docs as optional evidence, not the front door.

## My Overall Judgment

I think Agentic HQ is worth launching, but not as "finished software." Launch it as a developer preview with a clear flagship workflow, a narrow target user, and an honest security/install story.

If you launch the repo in its current shape plus a merely completed AHQ-143, the idea may still attract the right people, but many will bounce because the project feels too internal and too heavy.

If you do one serious compression pass first, the project becomes much stronger:

- one clear use case,
- one clear command,
- one clear warning,
- one clear architecture explanation,
- one clear path to customize.

The project does not need more intelligence before launch. It needs more editing.

That is the brutal version.

## Additional Human Response

> I'm halfway through reading your report, and I have one important thing to say.
>
> What you are saying about the workflow being over-opinionated triggered a memory of me talking to someone back in January at an AI meetup, five months ago, about my idea for this project. He was clearly very intelligent and was using AI a lot. When I told him about using it to build workflows that would automate what developers are doing, here's a response that every developer has their own unique workflow, and so he seemed fairly sceptical about this idea. That mirrors exactly what you're saying about this ad feature workflow being too specific to me. You say that you think it is maybe too "opinionated". I think this is a very valid criticism.
>
> It may be that it's better to have a much less opinionated and simpler workflow that the average developer would run and see the value in, and more importantly they would see the potential in it to be customised to do what *they* want. If I just give them my workflow with my stuff in it, then they may look at it and think:
>
> 1. that it takes a long time to run and is too complex
> 2. that it's going to take them a lot of work to modify it to remove all my stuff They just may not be bothered to do that and just go and do something else.
>
> If I give them a simple, fast, unopinionated workflow, then I think we should really lean into the idea that they are meant to then customise and add to that workflow.
>
> I have a Create Workflow workflow that is there for developers to build a workflow from scratch. They could use that and say we could make that create workflow. Put a note in saying that at the beginning, the developer can point at an existing workflow, and that will be used as the template that's expanded on.
>
> Another alternative is we build in to the Add this new simpler add-feature-basic workflow prompts to allow the developer to ask the AI to add in the features to the workflow that they want (ideally on the 2nd pass after trying it once). This would involve providing a separate document that's bundled with the workflow that the AI refers to and gives the AI confidence and instructions in how to modify the workflow and add the features that the developer wants. I think I actually prefer this to them having to run a separate create workflow and point at this original workflow. I think we should bundle in with the simpler add-feature-basic workflow: this ability to, while running the workflow, modify it to do what the developer wants. I'd like your advice on whether you prefer the create workflow pointed out by the ad feature workflow or the inbuilt modify it while you are running it version. It's a difficult choice; both have their advantages.

### Reaction

This comment strengthens the central recommendation. The skeptic at the AI meetup was probably right in a narrow sense: every developer does have their own workflow. But that does **not** invalidate AHQ. It changes the product promise.

The product promise should not be:

> Here is the workflow developers should use.

It should be:

> Here is a small working workflow that shows the pattern. Run it once, see the value, then make it yours.

That is a much better wedge.

My recommendation is a hybrid of your two options:

1. **Do not make live workflow mutation part of the first run.**
   The first run should be boringly reliable. The user is already trusting a new tool, a new workflow, broad local permissions, and an AI agent editing their repo. If the workflow also starts modifying itself while running, the cognitive load goes up and the failure modes get muddy.

2. **Do not bundle a standalone customization guide into `add-feature`.**
   The earlier `CUSTOMIZE_THIS_WORKFLOW.md` idea is now superseded by the cleaner `create-workflow --using` path. The simple workflow should stay focused on adding the feature.

   The create-workflow workflow should own the customization docs, including help docs that explain:
   - what `--using` does,
   - how `create-workflow --using add-feature` clones/adapts the starter workflow,
   - what kinds of stages, rules, approval gates, artifacts, and help docs users can add.

3. **Add a post-run customization path, not mid-run mutation.**
   After a successful first run, the final agent can ask, or just tell the user:

   > "For future runs, you can customize this workflow. Recommended next step: run `agentic-hq create-workflow --using add-feature`."

   This command is now part of the launch plan, not a future nice-to-have.

4. **Enhance `create-workflow` to support `--using`.**
   This is the cleaner long-term architecture:

   ```bash
   agentic-hq create-workflow --using add-feature
   ```

   `create-workflow` is the right place for workflow mutation because it is explicitly a workflow-building workflow. The `add-feature` workflow should remain focused on adding a feature.

5. **The simple workflow should be designed as a starter kit.**
   That means:

   - Short.
   - Fast.
   - Conservative.
   - Few stages.
   - Few philosophy assumptions.
   - Clear extension points.
   - A final pointer to `create-workflow --using add-feature`.
   - Links to the detailed example workflow as an example of what a heavily customized version can look like.

### Naming Recommendation After This Comment

I would use:

- `add-feature` = simple starter workflow.
- `add-feature-detailed-example` = your full seven-agent workflow, clearly billed as a worked example.
- `create-workflow --using add-feature` = supported customization route.

I would not use `add-feature-basic` as the final name if it is the default. "Basic" can sound underpowered. The default should just be `add-feature`.

### The Strategic Shift

This response points to a better launch strategy:

> AHQ is not selling one perfect workflow. AHQ is selling a way to turn your own development process into executable AI-assisted workflows.

The simple `add-feature` workflow is the demo and starter template. The detailed example workflow is the proof that the system can express a serious, personalized process. The `create-workflow` workflow is the customization engine.

That trio is much stronger than making the detailed example workflow carry all three jobs.

## Third Human Comment

> I haven't yet read the entire doc, but looks **very** good (intelligent) so far. I'm impressed.
>
> I agree that it's better (and a very good idea) to have the add-feature workflow point the user at the "create-workflow" workflow with the `--from` parameter at the *end* of the workflow (once they have run it once). Much better than cluttering up the simple add-feature workflow with "how to modify yourself" junk. I think that is definitely worth modifying the create-workflow workflow to support the `--from` parameter **before launch**.
>
> You said the following:
>
> > The simple workflow should be designed as a starter kit. That means:
> >
> > - Short.
> > - Fast.
> > - Conservative.
> > - Few stages.
> > - Few philosophy assumptions.
> > - Clear extension points.
> > - Bundled customization guide.
> > - Links to the detailed workflow as an example of what a heavily customized version can look like.
>
> Have you incorporated details of this suggested workflow in the doc? If not I'd like you create a new doc:
>
> `02-on-naming-and-opinionated-ideas-for-and-shape-of-new-simple-add-feature-workflow.md`
>
> Please include sections on:
>
> - a one line summary of this new workflow does
> - a one paragraph summary of what this new workflow does
> - what you think current workflow should be renamed to (`add-feature-opinionated`?)
> - what new "flagship", simple add-feature should do exactly and how exactly that satisfies *every one* of the requirements you listed above.
> - what the numbered agents should be called and how many
> - what each should do
> - what gets kept from my current add-feature workflow (that is good, simple, quick, universal for developers)
> - what gets ditched
> - other sections you think should be included/added
>
> Remember: this is partly still an assessment of your intelligence (as well as now appearing to be a "pivot" away from an over-opinionated flagship workflow...!)

### Brief Response

Yes: this comment changes the launch recommendation. If the simple workflow is the flagship, `create-workflow --using <workflow>` should move into launch scope. It directly answers the strongest objection: every developer's workflow is different.

I have created the requested deeper document here:

- [Naming And Shape Of The New Simple Add Feature Workflow](02-codex-report-on-naming-and-opinionated-ideas-for-and-shape-of-new-simple-add-feature-workflow.md)

My short version, updated after the later naming discussion and final `--using` decision: the current workflow should be renamed `add-feature-detailed-example`, not `add-feature-opinionated`. "Opinionated" is useful analysis prose, but it is a poor CLI name because it sounds like a warning label. `add-feature-detailed-example` makes the important thing explicit: this is an example of how a detailed personal workflow can be built. The flagship command should be plain `add-feature`, and it should be simple enough to run once successfully before inviting customization via `create-workflow --using add-feature`.

## Follow-Up On Positioning `add-feature-detailed-example`

> Re "before inviting customization via create-workflow --from add-feature." - how about also inviting (as another alternative) trying a more detailed, opinionated workflow (as a second option?)
>
> I'd prefer that add-feature-detailed is billed as an **example** of a very detailed workflow, but one that is very opinionated about how to develope software. I'm almost avoiding recommending people actually use it to develope software themselves - but it **does** show (powerfully) how I have created a powerful workflow that is useful to **me** because it does everything I want my agent to do, in the way **I** want it done.

### Brief Response

This is the right correction. `add-feature-detailed-example` should not be billed as the "advanced" or "recommended next" version of `add-feature`. That would imply the simple workflow is merely a lightweight subset and the detailed example workflow is the mature destination.

Better framing:

- `add-feature` = recommended first workflow.
- `create-workflow --using add-feature` = recommended next step if the user wants their own process.
- `add-feature-detailed-example` = worked example/showcase of a deeply personalized workflow, useful primarily because it proves that AHQ can encode a real creator-specific development process.

So the post-run invitation should prioritize customization. The detailed example workflow can be mentioned as something to inspect or run if the user wants to see how far workflow design can go, not as something most users should copy directly.

## Naming Decision: `add-feature-detailed-example`

Final naming recommendation:

- `add-feature` = the recommended starter workflow.
- `add-feature-detailed-example` = the detailed example add-feature workflow.
- `create-workflow --using add-feature` = the recommended path for users to make their own version.

This name is better than `add-feature-detailed` because it removes the accidental implication that the detailed workflow is the serious/production upgrade. It says what the workflow actually is: an example of how a creator can encode a very specific development process into AHQ.
