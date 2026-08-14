# AHQ-206 — Later Refactor Jira: Split The Workspace Interface (PluginSource Extraction)

> Repo record of the description for
> [AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206), created by the human 2026-08-14
> from a draft written during the AHQ-200 Researcher stage. The Jira issue is the live source of
> truth; this file records what it was created from.

## Jira Title

Later: Refactor: Split The Workspace Interface (PluginSource Extraction)

## Description

### Context

AHQ-200 (a sub-task of AHQ-195) eliminated the `AGENTIC_HQ_WORKSPACE_ROOT` env var and ditched
the obsolete "AHQ workspace" concept: `AhqWorkspaceImpl` was renamed `AhqPackageImpl`, modelling
the root directory of the running agentic-hq package (the repo checkout in dev; the npm-installed
package dir in production) and exposing the shipped workflows inside it.

For zero-behaviour-change reasons, AHQ-200 deliberately kept `AhqPackageImpl` implementing the
`Workspace` interface — a pure rename that left `ClaudeCommandBuilder`, `ListingFormatter`, and
workflow registration untouched. The cost: the type system still claims the package is a
workspace. A `REFACTOR LATER:` comment on `AhqPackageImpl` points at this Jira.

### Problem

`Workspace` conflates two capabilities:

- **Plugin-source half** — genuinely shared by both implementations: `getPlugins()`,
  `registerWorkflowsWith()`, `getDotAgenticHqDir()`, `getRoot()` (as "where the plugins tree
  lives"), `getDisplayName()`, and the package-identity check (`isAhqWorkspace()` before AHQ-200;
  its renamed successor after).
- **Run-environment half** — only ever served by the user's workspace: `getTempDir()` (the
  io-files marshalling temp dir) and `getRoot()` as the spawn directory for the Claude process.
  The package side carries these methods but never serves them — and must never serve
  `getTempDir()`, because the installed package is read-only.

Consumer inventory (verified 2026-08-14; class names are pre-AHQ-200 where noted):

- **Use both sides uniformly, plugin-source methods only:** `ClaudeCommandBuilder`,
  `ListingFormatter`, `WorkflowSearchResultsImpl`, the two `CompositionRoot` workspace getters.
- **Use the user-workspace side only, run-environment methods:**
  `JsonFileIOMarshallerSessionFactory` (temp dir), `MarshalledCLITool` (spawn dir),
  `ClaudeWorkflowCommandBuilder` (spawn dir).

### Proposed Refactor (zero behaviour change)

1. Extract the shared plugin-source half into a narrower interface (working name:
   `PluginSource` — final name is the implementer's choice, honouring the repo's naming
   conventions: no "-er" agent-noun class names; directories grouped by entity).
2. `Workspace` extends the new interface, adding the run-environment methods.
   `CurrentUserWorkspaceImpl` remains a full `Workspace`.
3. `AhqPackageImpl` implements only the narrow interface — it stops being a `Workspace`.
4. Retype every consumer to the narrowest interface it actually uses (per the inventory above).
5. Decide where the package-identity check ("is this directory the AHQ package's own dir?")
   belongs in the split — it is used by both-sides consumers, so it likely lands in the narrow
   interface, but the implementer may find a cleaner home (e.g. a root-path comparison at the
   composition level).
6. Remove the `REFACTOR LATER:` comment from `AhqPackageImpl`.

### Acceptance Criteria

- `AhqPackageImpl` no longer implements `Workspace`; no type anywhere claims the package is a
  workspace.
- Only user-workspace types offer `getTempDir()` / spawn-directory semantics.
- Zero behaviour change: full validation suite green; `agentic-hq list` output byte-identical;
  existing e2e tests pass unchanged.
- The `REFACTOR LATER:` comment on `AhqPackageImpl` is retired.

### Notes

- Scheduling suggestion: after AHQ-195 completes. Related: AHQ-203 (workflows as true nested
  packages) may reshape plugin sourcing — if AHQ-203 runs first, revisit this design against its
  outcome before implementing.
- File/class names in this description reflect the codebase as of 2026-08-14 plus the AHQ-200
  renames; if drift has occurred, locate the seams by searching for the plugin-source method
  names listed above.
