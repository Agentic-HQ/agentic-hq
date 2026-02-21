# AHQ-59: Clarifications Required

## Context

This document captures questions raised during research for [AHQ-59](https://agentic-hq.atlassian.net/browse/AHQ-59) — "Research The Different Ways To Bundle TypeScript Code With A Claude Code Plugin". The answers will inform the final recommendation in the research document.

---

## Q1: Target Node.js Version Range

The Agentic HQ project currently requires `"node": ">=22.0.0 <23.0.0"` in `package.json`. Should the bundled plugin TypeScript code target the **same** Node 22 requirement, or should plugins support a **wider** range (e.g., Node 20+) to be more accessible to developers who haven't upgraded yet?

**Why this matters:** A narrower target (Node 22 only) keeps things simple and lets us use the latest features. A wider target (Node 20+) makes the plugin more accessible but adds transpilation complexity.

**Human Response:** `I would like to keep is as simple and easy as possible for this implementation - so I'm OK to keep Node 22 as a requirement - BUT I want this managed carefully and make it is explicit to the developer what version they need to have installed (min/max) and also understand how to make the system fail gracefully if the required versions aren't available`

---

## Q2: Dependency Bundling Strategy

The current demo CLIs use `commander` and `ClaudeCodeTool` (which depends on `node-pty`). When bundling TypeScript for a plugin, should we:

- **(A)** Bundle ALL dependencies inline (single file, zero `npm install` needed, but larger file size and native modules like `node-pty` cannot be bundled)
- **(B)** Bundle only pure-JS dependencies inline, require `npm install` for native modules
- **(C)** Keep dependencies external and require `npm install` in the plugin directory (simplest build, but adds install step for users)

**Why this matters:** `node-pty` is a native module that requires compilation — it **cannot** be bundled inline. This constrains the approach for any workflow that uses `ClaudeCodeTool`.

**Human Response:** `These choices are what your research doc should tell me **all** about the different options and pros/cons of each.  This is where your value is - advising me.  NOTE: I know **nothing** about how npm works and how to bundle and distribute javascript/node systems.  I'm going to need a lot of hand-holding and advice.  Treat me as a new dev learning all about these tools (I'm an experienced Java developer - but not javascript/node). I know the basics of developing using npm only from doing this project - but have **never** built or deployed a node/npm system.`

---

## Q3: Plugin Code Execution Model

From AHQ-56, the plan is:
1. `agentic-hq` CLI calls a skill to get the command to run
2. The skill returns the full command path
3. `agentic-hq` runs that command directly

For the bundled TypeScript:
- Should the bundled code be a **pre-compiled JS file** that the `agentic-hq` CLI runs with `node dist/workflow.js`?
- Or should it remain as **TypeScript** run with `tsx src/workflow.ts`?

**Why this matters:** Pre-compiled JS is more portable (no tsx dependency) but adds a build step. Raw TS with tsx is simpler during development but requires tsx to be installed.

**Human Response:** `As above - please tell me a **LOT** more about the pros/cons of each approach.  NOTE: These tools will be running on developer machine and runs by developers (not non-technical people) and so requiring that they have npx installed and working is a reasonable thing to require.  If it makes everything easier and simpler - and means the code will run more easily then maybe npx is the right way to go...? I don't know. That's what you are helping me with here :-)`

---

## Q4: Version Mismatch Error Handling

The Jira raises three important versioning questions. Our proposed approach is:

1. **Plugin code is too modern for developer's Node.js** — Add a runtime version check at the top of the entry point that compares `process.version` against a minimum requirement and exits with a clear error message.
2. **Developer's Node.js is too new for old plugin code** — This is less likely to cause issues (Node.js maintains good backwards compatibility), but we should test against the latest LTS in CI.
3. **Missing libraries/modules** — For bundled dependencies (inline), this is a non-issue. For external dependencies, run a pre-flight check that verifies `node_modules` exists before executing.

Is this approach acceptable, or do you want a more sophisticated solution (e.g., automatic dependency installation, virtual environments)?

**Human Response:** `I'm not sure yet what is the best approach - please include the full details of the different and recommended approaches in research doc and we'll discuss them more after I've read that.`

---

## Q5: Build Tooling Preference

Based on research, the top candidates for bundling are:

1. **tsup** (built on esbuild) — Zero-config, fast, designed for TS libraries, generates CJS/ESM
2. **esbuild** (direct) — Fastest, most configurable, but slightly more manual setup
3. **tsc only** — Simplest (already in project), but produces multiple files, no bundling

Do you have a preference, or should we make a recommendation in the research doc?

**Human Response:** `See answers above.  I'm starting as a beginner here so need a lot of help with understanding the different options and the pros/cons please.  And some recommendations given the project and the use case would be great as well please.`

---

## Q6: Scope of "Bundled with Plugin"

When we say the TypeScript code is "bundled with the plugin", does this mean:

- **(A)** The **source TypeScript** files live in the plugin directory and are compiled at build time
- **(B)** The **compiled JavaScript** output lives in the plugin directory (pre-built before distribution)
- **(C)** Both source and compiled output live in the plugin directory

**Why this matters:** This affects whether the plugin marketplace distributes source or compiled code, and whether a build step is needed after plugin installation.

**Human Response:** `See all answers above.  I'm not sure what the best approach is yet. Need your help to decide.  Great question to clarify at this stage though.  It sounds like one of the key decisions to make.  sounds a bit confusing to put both source and compiled version in the plugin because if the compiled version isn't run then why is it there?  We probably need to either put the source there and the command agentic-hq cli runs does the compilation and running, or put the compiled version there and that gets runs. One or the other.  If we put just the compiled version there it seems like a good idea to include a README.md with a link to where the developer can see the source code and details of exactly how it was compiled/built`
