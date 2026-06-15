# RED Phase Complete: AHQ-149 (manual test)

**Jira**: [AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)
**Test Type**: manual
**Phase**: RED (Manual Testing Approach)
**Generated**: 2026-06-14 21:16 BST

---

## Manual Testing Approach

No automated tests will be created for this work. The AI will implement the requirements, and the human will manually test the result.

**Decision**: Human confirmed no automated tests needed (manual testing only).

This is explicitly specified in the Jira: *"Test type: manual (the only test will be me reading it)."* The deliverable is a single Markdown document — the real content of the `add-feature-detailed-example` Developer Help Doc, replacing the current stub. There is no code, class, or runtime logic to assert against, so the only meaningful test is the human reading the finished doc.

**Manual test the human will perform (after GREEN):**
1. Open the finished `developer-help-doc.md` in a Markdown-friendly viewer.
2. Read it end-to-end and confirm it accurately explains *how and why* the `add-feature-detailed-example` workflow was built the way it was, from the perspective of someone wanting to modify or extend it.
3. Confirm it doesn't merely duplicate the User Help Doc, uses the correct `add-feature-detailed-example` naming throughout, and that all internal links (and the pointer to the AHQ-143 planning doc) resolve.
4. Confirm the curated content selection matches what was wanted (right planning-doc sections in, build-time-only noise out).

**The "failing test" (RED) state:** the doc currently exists only as a 6-line stub pointing at this Jira — reading it does not yet satisfy "a developer can understand the deeper how/why," so the manual test "fails" until the content is written.

---

## Ready for GREEN Phase

Run the next command for AI implementation (human will manually test):
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-149 manual
```
