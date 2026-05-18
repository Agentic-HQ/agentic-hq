# Follow-up Jira — Automate keeping the project's Node.js version current with security updates

HUMAN created Jira at: https://agentic-hq.atlassian.net/browse/AHQ-146

> **Status:** Created as **[AHQ-146](https://agentic-hq.atlassian.net/browse/AHQ-146)** by the maintainer (2026-05-17).
> **Origin:** Follow-up spun out of **[AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145)**
> (Upgrade Agentic HQ to default to Node 24 LTS). Deliberately kept out of AHQ-145's scope — see
> "Why this is a separate ticket" below.

## Summary

The repo now pins its Node.js runtime to an **exact patch** in the root `.nvmrc`
(`24.15.0`, set under AHQ-145 — see **Decision E** in that Jira's plan and in
[`../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md`](../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md)).

An exact pin is the right call for reproducibility — but a pinned file goes **stale**: it will not
pick up Node.js security and patch releases on its own. This ticket adds an **automated mechanism**
that keeps the pinned Node version current, while preserving the property that *nobody's machine
changes Node version except as a deliberate, reviewed, committed repo change*.

## Background / reasoning

AHQ-145 chose to pin `.nvmrc` to an exact patch (Decision E) rather than float the major line `24`.
The reasoning, researched via Perplexity and recorded in
[`../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md`](../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md):

- A floating line (`.nvmrc` = `24`) lets an incidental `nvm install` silently resolve to the newest
  published 24.x — the runtime can move under contributors/CI with nobody realising, making test
  failures hard to explain.
- An exact pin makes every Node version change explicit, diffable and reviewable.
- The trade-off of an exact pin: it must be **actively kept fresh**, or the project falls behind on
  Node security/patch releases.

The Perplexity research recommended closing that gap with **automation**: a tool that opens a
pull request whenever a newer Node version is available, so the bump is visible, CI-tested, and
merged only after review.

## The hard requirement — machines change only via the repo

**A contributor's (or the maintainer's) machine must never have its Node version changed *by* this
automation directly.** The automation operates **only on the repository**:

1. The automation opens a PR that edits the committed `.nvmrc` (and any related version references).
2. CI runs the full test suite against the proposed version.
3. A human reviews and merges the PR.
4. A contributor's local Node version changes **only** when they `git pull` the updated `.nvmrc`
   and then run `nvm install` / `nvm use` themselves.

So the flow is always: **upstream repo update → contributor pulls → contributor opts in.** There is
no path by which the automation reaches into anyone's environment. This is the same model as any
other dependency change in the repo.

## Not tied to a specific tool

The Perplexity research named **Renovate** (it supports `.nvmrc` natively), and Dependabot or a
scheduled GitHub Actions workflow that opens a PR are equally valid. **Do not treat "Renovate" as a
requirement** — pick whatever automation best fits the project. The requirement is the *outcome*
(the project stays current with Node security updates via reviewed PRs), not the tool.

## Scope

- Choose and configure an automation mechanism (Renovate / Dependabot / scheduled Action / other)
  that detects newer Node.js releases within the supported LTS lines (currently 22 and 24) and opens
  a PR updating the root `.nvmrc`.
- Decide the update policy: e.g. follow the latest patch of the pinned major (24.x), and how/whether
  to propose major-line moves (22 → 24 etc.).
- Ensure CI runs against the proposed version so a bad bump is caught before merge.
- Consider a **CI Node version matrix** (test Node 22 *and* Node 24) so the supported-majors claim
  in `engines.node` (`"^22.0.0 || ^24.0.0"`) is actually exercised — this is the companion piece
  the Perplexity research recommended alongside the pinned `.nvmrc`. (If the repo has no CI yet,
  setting up CI may itself be a prerequisite — split out if needed.)
- Update contributor docs (`CONTRIBUTING.md` / `README.md`) to explain that Node version bumps
  arrive as reviewed PRs and that contributors pick them up on pull.

## Acceptance criteria

1. An automation mechanism is configured and opens a PR when a newer supported Node.js version is
   available.
2. The automation only ever modifies the repository (the `.nvmrc` and related files via PR) — it
   never alters any developer's or CI runner's installed Node version directly.
3. PRs raised by the automation trigger CI, which tests the proposed Node version.
4. Documentation explains the model: machines change Node version only by pulling repo updates and
   running `nvm install`/`nvm use`.
5. CI exercises the full supported Node range (22 and 24), or a separate explicit decision is
   recorded if the matrix is deferred.

## Out of scope

- Changing the pinning strategy chosen in AHQ-145 (exact-patch `.nvmrc`) — that stays.
- Auto-merging bump PRs without human review — review is required by the hard requirement above.

## Why this is a separate ticket (not part of AHQ-145)

AHQ-145 is a config + documentation Jira run as a minimal GREEN-phase TDD story; its scope
**explicitly excludes a CI matrix** and any new automation infrastructure. Adding Renovate/CI
matrix work there would be gold-plating. AHQ-145 does exactly the right minimal thing — pin the
version correctly — and hands the "keep it fresh" infrastructure to this follow-up.

## References

- AHQ-145 Jira: <https://agentic-hq.atlassian.net/browse/AHQ-145>
- Research & decision: [`../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md`](../additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md)
- AHQ-145 GREEN-phase plan — **Decision E** (`.nvmrc` exact-patch pin) and **Decision D**
  (`engines.node` range).
