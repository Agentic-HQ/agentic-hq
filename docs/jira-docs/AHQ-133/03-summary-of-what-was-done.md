# AHQ-133: Summary of what was done

Jira: https://agentic-hq.atlassian.net/browse/AHQ-133

Date completed: 2026-05-12

This is the record of the work delivered against AHQ-133 ("Create CONTRIBUTING.md"). Research and decisions are captured in [`01-working-on-CONTRIBUTING.md`](./01-working-on-CONTRIBUTING.md) and [`02-perplexity-response.md`](./02-perplexity-response.md). The implementation plan is at `~/.claude/plans/resilient-frolicking-dove.md`.

## Deliverables

### New files (root)

| File | Purpose | Notes |
|---|---|---|
| [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) | Primary deliverable | ~1,750 words. 14 sections: Welcome → One Rule → Status & bandwidth → Ways to contribute → Reporting issues → Proposing changes → Local setup → `pnpm validate` → TDD → Submitting a PR → AI-assisted contributions → Code of Conduct → License → FAQ. |
| [`CODE_OF_CONDUCT.md`](../../../CODE_OF_CONDUCT.md) | Community standards | **Contributor Covenant v3.0** (upgraded from the §3 default of v2.1 — v3.0 adds "Failing to credit sources" as a restricted behaviour, which sits well next to AHQ's AI-attribution stance). Both `[NOTE: …]` placeholders filled. |
| [`SECURITY.md`](../../../SECURITY.md) | Vulnerability disclosure | Two private report channels (GitHub Private Vulnerability Reporting + agentichq.ai contact form). Explicit in/out-of-scope. Calls out the auto-approved Claude permissions surface (matching the warning in README.md). No bug bounty. |
| [`AGENTS.md`](../../../AGENTS.md) | Cross-vendor AI-agent pointer | 5 lines. Points at CLAUDE.md for binding rules and CONTRIBUTING.md for human contributors. Q27 option (a) — least disruptive; CLAUDE.md remains the source of truth. |

### New files (`.github/ISSUE_TEMPLATE/`)

| File | Purpose | Notes |
|---|---|---|
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug report form | Fields ordered: Summary → Steps → Expected (after following steps) → Actual (after following steps) → Environment → Output → One-Rule checkbox. Title prefix `bug: `. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Feature proposal form | Problem → Proposal → Alternatives → Audience → Scope acknowledgement. Title prefix `feat: `. |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue-chooser config | `blank_issues_enabled: false`. Two contact links: Discord (placeholder URL `<DISCORD_INVITE_URL>` pending AHQ-139) + Security policy. Includes a comment block at the top explicitly flagging the placeholder. |

### Edited files

| File | Change |
|---|---|
| `.github/pull_request_template.md` | Replaced 3 generic checkboxes ("All tests pass", "Code follows project style guidelines", "Ready for review") with: One Rule comprehension, `pnpm validate` passes locally, TDD for behavioural changes, docs updated, Conventional Commits PR title. Added a new "AI assistance disclosure" section with three radio-style options (no AI / AI used / built with an AHQ workflow). |
| `README.md` (line 228) | Replaced the pre-launch placeholder ("Before making the repo public we'll be adding a CONTRIBUTING.md … see AHQ-133") with working links to `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md`. |

## Decisions locked in

Reproduced from the plan for posterity. All 30 questions from [`01-working-on-CONTRIBUTING.md`](./01-working-on-CONTRIBUTING.md) §4 are resolved.

| Q | Decision |
|---|---|
| Q1 | GitHub Issues primary, mirror to Jira internally |
| Q2 | Discord (not GitHub Discussions) — server created, setup tracked under [AHQ-139](https://agentic-hq.atlassian.net/browse/AHQ-139), launch in week before public release |
| Q3 | Discussion-first for features; bug-fix PRs welcome direct |
| Q4 | Conventional Commits for PR titles |
| Q5 | `/commit` not required for external contributors |
| Q6 | Squash on merge, no commit-count rule |
| Q7 | TDD = hard rule for behavioural PRs; reviewer enforces |
| Q8 | `pnpm validate` must pass locally — hard rule |
| Q9 | No CI yet; follow-up Jira to be filed for CI |
| Q10 | AI-generated contributions welcome |
| Q11 | Meaningful AI use must be disclosed (PR template checkbox) |
| Q12 | No Prettier-style threat tone — positive quality bar instead |
| Q13 | Light-touch encouragement to say if AHQ workflows were used |
| Q14 | Neither CLA nor DCO |
| Q15 | Contributor Covenant **v3.0** (upgraded from the §3 default of v2.1) |
| Q16 | Both GitHub Private Vulnerability Reporting + agentichq.ai contact form |
| Q17 | Inbound = outbound under MIT, no explicit assignment |
| Q18 | Skipped — stylistic refactors welcome if behaviour unchanged |
| Q19 | Skipped — plugin policy handled case-by-case, not documented |
| Q20 | Nothing else explicitly out-of-scope |
| Q21 | Changelog / releases deferred until 1.0 |
| Q22 | Skipped — no recognition section |
| Q23 | "Currently one maintainer; response in days, not hours" included |
| Q24/Q25 | No extras beyond what's already specified |
| Q26 | Pi-style One Rule (comprehension) adopted, surfaced prominently |
| Q27 | New `AGENTS.md` that points at `CLAUDE.md` (option a) |
| Q28 | Short FAQ at end of CONTRIBUTING.md — 5 Q&As |
| Q29 | Open at launch; future-Jira to revisit if AI-spam materialises |
| Q30 | Skipped — no changelog rule |

## Validation

`pnpm validate` passes from the repo root:

- `pnpm typecheck` ✅
- `pnpm lint:check` ✅
- `pnpm format:check` ✅ (after one-pass `prettier --write` scoped to the three new YAML issue-template files only — no unrelated files touched)
- `pnpm test:unit` ✅ — 131/131 unit tests passing across 31 test files

## Pre-launch items still to action

These are deliberately out of scope for this PR but are required before the repo goes public.

| Item | Owner | Tracked under | Notes |
|---|---|---|---|
| Replace `<DISCORD_INVITE_URL>` placeholder in `.github/ISSUE_TEMPLATE/config.yml` and in `CONTRIBUTING.md` "Reporting issues" section | Steve | [AHQ-139](https://agentic-hq.atlassian.net/browse/AHQ-139) | Two locations. Generate a permanent/never-expiring Discord invite link first. |
| Enable GitHub Private Vulnerability Reporting in repo settings | Steve | [AHQ-137](https://agentic-hq.atlassian.net/browse/AHQ-137) | Settings → Code security → "Private vulnerability reporting" → Enable. Until enabled, the "Report a vulnerability" button doesn't appear in the Security tab and SECURITY.md's preferred channel is a dead link. |
| Update README.md "Support" and "Developer Documentation" sections (lines 218–226) | Steve | Public-launch sweep | Currently say "while the repo is private…" and route to the agentichq.ai contact form. Will want updating to route bugs → GitHub Issues, community → Discord, security → SECURITY.md. |
| Add CI that runs `pnpm validate` on PRs | TBD | New Jira to be filed (Q9 default) | Until CI lands, the `pnpm validate` gate is enforced manually by reviewers. |
| Watch for AI-spam volume and revisit Pi-style auto-close-by-default | Steve | Future-Jira reminder (Q29 default) | Day-one stance is open; revisit only if/when AI-spam materialises. |

## Reference projects studied

Captured here so the next person doesn't have to re-discover them:

- **VS Code** — https://github.com/microsoft/vscode/blob/main/CONTRIBUTING.md
- **Vite** — https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md
- **Prettier** — https://github.com/prettier/prettier/blob/main/CONTRIBUTING.md
- **Pi (earendil-works)** — https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md — closest in spirit; source of the "One Rule" framing and the AGENTS.md pattern

Full analysis in [`01-working-on-CONTRIBUTING.md`](./01-working-on-CONTRIBUTING.md) §1.
