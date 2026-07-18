# AHQ-185 — Report on Grammar/Logic Errors (Docs Scan)

A grammar/logic scan of all `*.md` docs in `docs/` and the prose files in the repo
root (2026-07-18) surfaced 5 serious findings. Findings 2–5 were fixed directly on
branch `docs/ahq-185-forking-section-and-doc-fixes`; this report covers the one
remaining finding, which needs a wording decision before it is applied.

---

## Finding 1: False claim that only `create-workflow` shares its skill id and short id

**File:** `docs/user-docs/workflow-descriptions/overview-of-workflows.md`, "Naming convention" note (line 33), last sentence.

### Before text

```
The two are usually different (only `create-workflow` happens to share the same value for both).
```

### After fix text (proposed)

```
For some workflows the two are different (e.g. `string-reversal` runs as `reversal`); for others (`create-workflow`, `add-feature`, `add-feature-detailed-example`) the short id is identical to the skill id.
```

### Details

The sentence claims the skill id and short id are "usually different" and that
`create-workflow` is the *only* workflow where they match. Verified against every
`ahq-workflow.json` (2026-07-18): 3 of the 7 shipped workflows have a `shortId`
identical to their skill id — including the flagship `add-feature`:

| Skill id | shortId | Same? |
|---|---|---|
| `create-workflow` | `create-workflow` | ✅ |
| `add-feature` | `add-feature` | ✅ |
| `add-feature-detailed-example` | `add-feature-detailed-example` | ✅ |
| `string-reversal` | `reversal` | ❌ |
| `math-workflow` | `math` | ❌ |
| `quick-jira-workflow` | `quick-jira` | ❌ |
| `full-jira-tdd-story-workflow` | `full-jira` | ❌ |

So the claim is wrong on both counts ("usually different" is 4 of 7, and
`create-workflow` is not the only match) — and it is contradicted by this very
doc's own run commands (`agentic-hq add-feature ...`, `agentic-hq
add-feature-detailed-example ...`).

### Recommendation

Replace the sentence with the proposed after-text. It deliberately avoids
"usually"/counts (which rot as workflows are added) and instead names one example
of each case. The list of three matching workflows could also rot, so an
alternative is to drop the enumeration entirely: *"For some workflows the two are
different (e.g. `string-reversal` runs as `reversal`); for others (e.g.
`add-feature`) they are the same — `agentic-hq list` always shows the runnable
short id."*

### Decision

- [x] Apply the proposed after-text (with the three-workflow enumeration)
- [ ] Apply the alternative wording (no enumeration, points at `agentic-hq list`)
- [ ] Different wording — see comment
- [ ] Leave as is

### Comment

LGTM (Steve, 2026-07-18) — proposed after-text applied.

---

## Appendix — Findings 2–5 (already fixed, for reference)

1. **Finding 2** — `quick-jira-workflow` was described as "Creates and completes a
   Jira ticket" (it only reads an existing one), and `math-workflow` as "Solves a
   math problem using an agent team" (it runs a fixed ×2 → +3 → ÷5 pipeline).
   Fixed in both `ahq-workflow.json` files (so `agentic-hq list` is correct too)
   and in `overview-of-workflows.md` headings/TOC, including the anchor links in
   that doc and `setting-up-jira-mcp-server.md`.
2. **Finding 3** — `WARNING-re-auto-approved-claude-permissions.md` stated the
   failure its extra `Read(...)` permission prevents as if it were fact; rewritten
   as the intended counterfactual ("Without this permission … Claude would not
   have access").
3. **Finding 4** — hard-coded `docs/jira-docs` folder counts ("54" in
   `docs/README.md` — actual count was 55 — and "37 such folders" in
   `overview-of-workflows.md`) removed so they can't rot.
4. **Finding 5** — `CONTRIBUTING.md` claimed AHQ is "tested on macOS (13.5+)" and
   led its setup bullet with "**macOS 15.7.5**" as if that exact version were
   required; both spots now match the README's accurate phrasing (13.5+ is the
   support floor; 15.7.5 is what's actually tested).
