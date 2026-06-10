# RED Phase Complete: AHQ-155 (manual test)

**Jira**: [AHQ-155](https://agentic-hq.atlassian.net/browse/AHQ-155)
**Test Type**: manual
**Phase**: RED (Manual Testing Approach)
**Generated**: 2026-06-10 20:39

---

## Manual Testing Approach

No automated tests will be created for this work. The AI will implement the requirements, and the human will manually test the result.

**Decision**: Human confirmed no automated tests needed (manual testing only). The Jira explicitly specifies `test-type: manual` and states: *"The human will run the first couple of stages of the workflow to test it runs and read the docs. No other testing required."*

This is a rename + documentation-reframing task (`add-feature` → `add-feature-detailed-example`) with no new production logic. `src/**` and `tests/**` contain no references to the workflow name (workflow discovery is dynamic), so there is nothing for automated unit/integration/smoke/e2e tests to drive. The one fragile coupling — the 7 chained slash-command constants in the CLI must stay in lockstep with the renamed command directory — fails only at runtime, which is exactly what the manual run will exercise.

### Manual testing steps the human will perform (after GREEN implementation)

1. Run `agentic-hq list` and confirm the workflow now appears as `add-feature-detailed-example` with the new "Worked example of a detailed, opinionated seven-stage…" description, and that there is no stale `add-feature` entry.
2. Start the workflow: `agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-XXX` and confirm it launches and that **Command 01 (Ticket Creator) → Command 02 (Interrogator)** run and chain correctly (this proves the 7 renamed slash-command constants resolve — the thing unit tests can't catch).
3. Read the bundled help docs (`00-…-user-help-doc.md` and a couple of agent docs) and confirm the framing now reads as a *detailed example* (not the recommended default) and points to the simple `add-feature` / `create-workflow --using=add-feature` paths.

---

## Ready for GREEN Phase

Run the next command for AI implementation (human will manually test):
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-155 manual
```
