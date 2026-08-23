# AHQ-205 — Bug Jira

**Created:** 2026-08-14 by the human at
[https://agentic-hq.atlassian.net/browse/AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205),
as the last Sub-Task of [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195).

**Issue type:** Bug

**Title:** agentic-hq CLI Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root

---

## Description (as filed in the Jira)

### Summary

When the npm-installed `agentic-hq` CLI is run from a directory whose local workspace defines a workflow with the same name as one shipped in the installed package, the CLI crashes at startup with an uncaught Commander error — before any subcommand runs. **Every** invocation from such a directory fails: `list`, `add-feature`, even `add-feature --help`.

```
Error: cannot add command 'add-feature' as already have command 'add-feature'
    at Command._registerCommand (.../node_modules/commander/lib/command.js:655:13)
    at Command.command (.../node_modules/commander/lib/command.js:174:10)
    at WorkflowRegistryImpl.register (.../dist/src/cli/workflow-registry-impl.js:30:14)
    at PluginImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/plugin/plugin-impl.js:38:22)
    at WorkspaceImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/workspace/workspace-impl.js:47:20)
    at CurrentUserWorkspaceImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/workspace/current-user-workspace-impl.js:35:31)
    at WorkflowSearchResultsImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/workflow-listing/workflow-search-results-impl.js:40:35)
    at createProgram (.../dist/src/cli/agentic-hq-program.js:35:19)
```

### Environment

- `agentic-hq@0.1.1` installed from the npm registry (prefix-global install; standard `npm install -g` exercises the identical code path)
- Node.js v24.15.0, macOS

### Steps To Reproduce

1. Install the CLI from the registry: `npm install -g agentic-hq` (or the prefix-global form).
2. `cd` into any directory whose local workspace defines a workflow named the same as a shipped one — e.g. a clone of the agentic-hq repo itself, whose `.agentic-hq/plugins/agentic-hq-demos-plugin` defines `add-feature` and `math`.
3. Run any command with the installed binary: `agentic-hq list`, `agentic-hq add-feature --help`, etc.

### Actual Behaviour

Uncaught `Error: cannot add command 'add-feature' as already have command 'add-feature'` with a full stack trace; exit code 1. The crash happens during CLI program construction (workflow discovery registers workflows from **both** the installed package's workspace **and** the local workspace at the current directory, with no name-collision handling), so no subcommand — including `--help` — ever runs.

### Expected Behaviour

A deliberate collision policy instead of a crash. Candidate behaviours (decision needed):

- **Local overrides package** — the local workspace's workflow wins, ideally with a notice; or
- **Qualified registration** — collide-free naming/namespacing so both remain runnable; or
- **Graceful, actionable error** — at minimum, a clear message naming the colliding workflow and both source workspaces, instead of an uncaught stack trace.

### Impact

- Anyone who clones the agentic-hq repo **and** npm-installs the CLI cannot use the installed binary anywhere inside the clone — a plausible path for contributors and evaluators.
- Any user whose own project's local workspace defines a workflow named the same as a shipped one (`add-feature`, `math`) hits the same hard crash in their project.
- No workaround exists other than changing directory or renaming the local workflow.

### Discovery Context

Found 2026-08-14 during the AHQ-202 proof run (verifying the interactive add-feature flow from a registry install). The proof itself is unaffected — its planned contexts (neutral directory, scratch project with no local plugins) cannot collide — so this was split out as its own bug rather than triggering AHQ-202's contingent republish path. Reproduced twice against the registry-installed 0.1.1: `agentic-hq list` and `agentic-hq add-feature --help`, both from the repo clone root.

### Notes For Fixing

- The registration chain is `WorkflowSearchResultsImpl.registerWorkflowsWith` → `CurrentUserWorkspaceImpl` → `WorkspaceImpl` → `PluginImpl` → `WorkflowRegistryImpl.register`, which calls Commander's `program.command()` — Commander throws on the duplicate name.
- A failing automated test reproducing the collision (two workspaces offering the same workflow name) should be feasible without any interactive surface.
