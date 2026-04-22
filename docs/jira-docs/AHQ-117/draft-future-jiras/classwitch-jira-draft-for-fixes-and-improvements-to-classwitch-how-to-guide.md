# Draft Jira: Classwitch how-to-guide fixes and improvements surfaced by AHQ-117

**Status**: DRAFT — not yet a real Jira. Create it in the classwitch project (or equivalent tracker), then use this file as the description and commit message body for the classwitch-repo commit.
**Target repo**: `classwitch` (not agentic-hq)
**Origin**: AHQ-117 conversion experience
**Suggested commit title**: `Improve how-to-guide based on AHQ-117 conversion feedback`

---

## Summary

While converting agentic-hq to a Root Classwitch Project under [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117), six issues with `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` were identified and fixed in a single classwitch-side change. This Jira records what was done and why; the commit itself is ready to create once this Jira is filed.

---

## What was changed

All changes are to `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md`.

### 1. Running example expanded from 5 services to 6

Previously the guide covered 5 agentic-hq services (`DefaultClaudeCodeTool`, `DefaultCLICommand`, `ClaudeWorkflowCommandBuilder`, `DefaultWorkflowCommand`, `MarshalledCLITool`). AHQ-117 added `WorkflowSearchResultsImpl` as the 6th. The guide's intro table, Step 2 picks-list, Step 3 file-location table, Step 4 registry code block, Step 5 grep + "repeat for each" sentence, Step 7 "all X classes are switchable" summary, Step 8 README template table, and Common-pitfalls grep have all been updated to cover 6 classes.

Consequence for readers: the running example now matches agentic-hq's real post-AHQ-117 state.

### 2. `DefaultClaudeCodeTool` interface corrected to `Tool`

Earlier revisions of the guide had `DefaultClaudeCodeTool` paired with a `ClaudeCodeTool` interface. AHQ-117 retired that standalone interface (`DefaultClaudeCodeTool extends MarshalledCLITool`, and `MarshalledCLITool implements Tool` — so `DefaultClaudeCodeTool` is structurally a `Tool` via inheritance). The intro table, Step 3 file-location table, Step 4 registry block + explanation, Step 4 "Convention" paragraph, Step 5 "What changed" bullet about typed return, and Step 8 README template table now all show `Tool` as the interface for `DefaultClaudeCodeTool`.

Consequence for readers: the shared-interface case (`DefaultClaudeCodeTool` and `MarshalledCLITool` both implementing `Tool`) is now visible right in the intro table, motivating the service-naming convention that follows. This strengthens what was previously only an abstract "could happen" parenthetical.

### 3. Step 3 grep-expected-output reflects `extends` + inherited-interface reality

The Step 3 code-block showing a grep example for the class declaration previously asserted `export class DefaultClaudeCodeTool implements ClaudeCodeTool`. The real shape is `export class DefaultClaudeCodeTool extends MarshalledCLITool`. The expected-output comment now reflects this, and a short explanation was added clarifying that classwitch is happy with either direct `implements` or inherited-via-`extends` structural typing.

### 4. `package.json` `exports` widening — realistic multi-subpath example

Step 6 previously showed a 2-line `exports` map with a single `./registry` subpath. In practice a real conversion needs **3–5 subpaths**: a public barrel (for interfaces and default classes), the registry subpath, the bootstrap entry point, and often one or two helper-class subpaths. The example was expanded to agentic-hq's real shape (4 subpaths), annotated per line, and a "rule of thumb" paragraph added explaining when to add versus consolidate subpaths.

### 5. Step 8 "Gotchas to tell your override authors" sidebar

Three silent-failure footguns encountered during AHQ-117's override-project build were added as a bullet list under the Step 8 override example:

- **Import order is load-bearing** — the override-registry side-effect import must precede any module that reads the registry. Linters' `import/order` autofixers will silently flip this.
- **Override constructors must be optional-with-defaults** — classwitch instantiates services via no-arg `new Klass()`; required-arg constructors throw at runtime.
- **Override projects must not mutate root-project globals** — env-vars, singletons, ambient state resolved from the root project's own install location. Documented via agentic-hq's `AGENTIC_HQ_WORKSPACE_ROOT` footgun generalised.

All three are noted as *silent* failures specifically because that's what makes them worth calling out — a reader who only gets loud errors doesn't need the warning.

### 6. Step 5 ESLint enforcement pointer

A short callout was added at the end of Step 5 pointing readers at the `no-restricted-syntax` ESLint rule pattern (with a working example in agentic-hq's `eslint.config.mjs`) for anyone who wants the "did I miss a `new DefaultX()` call site?" check enforced at lint time rather than hoped-for at review time. This was discovered during AHQ-117 Refactor 2.1; agentic-hq's `eslint.config.mjs` now carries the rule.

---

## Out of scope

- Changes to classwitch's API (`serviceThatImplements`, `addNewServices`, `overrideExistingServices`, `loadClass`) — this Jira only touches the how-to guide's *content*.
- Changes to the classwitch README or demo `src/demo/` tree — if parallel updates are needed there, file them separately.
- Changes to agentic-hq itself — done in AHQ-117, not here.

---

## Test plan

- [ ] Visual review of the diff
- [ ] `pnpm exec prettier --check docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` passes

No runtime code changes → no unit/integration tests to run on the classwitch side.

---

## Cross-references

- AHQ-117: [https://agentic-hq.atlassian.net/browse/AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
- AHQ-117 override-side how-to guide (agentic-hq repo): `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`
- Existing classwitch guide touched by this Jira: `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md`
