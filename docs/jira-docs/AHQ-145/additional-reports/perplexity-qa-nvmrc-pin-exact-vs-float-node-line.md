# Perplexity Q&A — AHQ-145: pin an exact Node patch vs float the major line (`.nvmrc` + nvm default)

## Purpose / Provenance

Supporting research artefact for Jira **AHQ-145** (Node 24 LTS upgrade). Raised mid-upgrade
(2026-05-17) while the maintainer was running the manual machine-upgrade script. The script sets the
nvm `default` alias to the bare line `24`, and the repo's new root `.nvmrc` also contains the bare
line `24`. The maintainer asked whether that floating-line choice is right, or whether the exact
patch (e.g. `24.10.0`) should be pinned instead — the concern being a 24.x patch silently moving
under them (e.g. `nvm install` resolving `24` to the latest-published 24.x) and causing tests to
break with no obvious cause.

The Perplexity MCP is not available, so this question is to be answered by the maintainer pasting it
into perplexity.ai. **The "Perplexity's Answer" and "Decision" sections below are placeholders to be
filled in once the answer is pasted back.**

## Context

- Open-source TypeScript CLI tool, npm-distributed, ESM, package manager pnpm 11.
- Supports the two LTS lines **Node 22 and Node 24** (`engines.node` = `"^22.0.0 || ^24.0.0"`).
- Has a committed root **`.nvmrc`** (read by nvm/fnm, and by contributors and CI) and the
  maintainer's machine has an nvm **`default`** alias.
- Mechanics already understood by the maintainer:
  - A bare-line value (`24`) in `.nvmrc` / the `default` alias is a *selector* — `nvm use` picks the
    newest **installed** 24.x; it never downloads.
  - `nvm install` against a bare-line `24` resolves to the newest 24.x **available on the Node
    mirror** and downloads it — so an incidental `nvm install` (run to "set up the repo") can pull a
    newer patch without the maintainer consciously deciding to upgrade.
  - An exact patch (`24.10.0`) in `.nvmrc` / the alias makes every command resolve to exactly that
    version — a patch bump then only happens via a deliberate, reviewable, committed edit.
- Priorities, in tension: (a) **stay secure** — pick up Node patch/security releases reasonably
  promptly; (b) **no surprise breakage** — the team should not have a Node version shift under them
  and waste time debugging a failure whose real cause is an unannounced runtime change.

## Question asked

> I maintain an open-source TypeScript CLI tool (npm-distributed, ESM, package manager pnpm 11). It
> officially supports the Node.js 22 and 24 LTS lines. The repo has a committed root `.nvmrc` that
> contributors and CI read, and contributors use nvm/fnm locally.
>
> I'm deciding what to put in `.nvmrc` (and, relatedly, what to set as the local nvm `default`
> alias):
>
> - (A) A **bare major line**, e.g. `24`. `nvm use` then selects the newest installed 24.x; but
>   `nvm install` resolves `24` to the latest 24.x published on the Node mirror and downloads it —
>   so a patch version can move without an explicit, intentional decision.
> - (B) An **exact patch**, e.g. `24.10.0`. Every nvm command resolves to exactly that version; a
>   patch upgrade only happens when someone deliberately edits `.nvmrc` and commits it.
>
> My two priorities are in tension: I want to **stay reasonably current with Node security/patch
> releases**, but I also **don't want the Node version to change under contributors or CI without
> anyone realising** — i.e. I don't want tests to start failing for a reason nobody can see, because
> the runtime quietly moved.
>
> Questions:
> 1. For a project like mine, what is the **standard, best-practice** choice for `.nvmrc` — pin an
>    exact patch, or float the major line — and why?
> 2. Does the best-practice answer differ between the committed `.nvmrc` (shared with contributors
>    and CI) and a developer's personal nvm `default` alias? Should they match?
> 3. What do well-maintained open-source projects actually commit in `.nvmrc` today?
> 4. If I pin an exact patch for reproducibility, what is the recommended way to **not fall behind**
>    on security patches — e.g. an automated dependency bot (Renovate / Dependabot) raising a PR to
>    bump `.nvmrc`, a scheduled review, or something else? How do projects keep a pinned `.nvmrc`
>    fresh without it going stale?
> 5. How does CI fit in — should CI test a fixed pinned version, a matrix of supported majors, or
>    both? Does that change what `.nvmrc` should contain?
> 6. Is there a sensible **middle ground** (e.g. pin major+minor `24.10`, or pin exact but automate
>    the bump) that gets most of the security benefit with most of the reproducibility benefit?
>
> Please give a clear recommendation with reasoning for a project that values staying secure but is
> strongly averse to things breaking without people knowing why.

## Perplexity's Answer

For your constraints, the best-practice choice for a committed `.nvmrc` is usually an **exact patch pin**, not a floating major, while CI should still test the supported majors you claim in `engines`/docs. That gives contributors and CI a stable local default and makes Node upgrades explicit and reviewable, which matches your strong preference against “silent” runtime changes. [docs.renovatebot](https://docs.renovatebot.com/modules/manager/nvm/)

## What `.nvmrc` should contain

A committed `.nvmrc` is best treated as a **project lockfile for the runtime**: pin `24.10.0`, not `24`. The reason is exactly the tradeoff you described: with a bare major, `nvm install` can move to a newer patch without an intentional edit, while an exact patch keeps the runtime change visible in diffs and PR review. In practice, that makes test failures easier to explain because “the Node version changed” is an explicit event rather than an implicit one. [nvmnode](https://www.nvmnode.com/extend/nvmrc.html)

A floating major line is still defensible for teams that want the newest patch automatically, but it is more operationally convenient than reproducible. For a project that is “strongly averse to things breaking without people knowing why,” exact pinning is the cleaner default. [ludeeus](https://www.ludeeus.dev/notes/keeping-nvmrc-up-to-date/)

## `.nvmrc` vs default alias

They do **not** need to match. The committed `.nvmrc` is shared state for contributors and CI, while a personal `nvm alias default` is just an individual convenience setting for a developer’s shell, so it can point to a newer or older version without affecting the repo. A common pattern is: repo `.nvmrc` is exact and stable, personal default alias is “whatever you like,” often the latest installed LTS or the same version as the current project you work on most. [docs.netgen](https://docs.netgen.io/projects/lds/en/latest/macos/nodejs.html)

## What projects actually do

Open-source projects vary, but there are two common patterns: some commit a major/LTS line like `lts/iron` or `v16`, while others pin a full patch such as `20.11.1`. The tooling ecosystem also supports both styles: Renovate explicitly supports `.nvmrc` updates, which suggests that pinned files are a normal maintenance target rather than an anti-pattern. [dev](https://dev.to/theodo/effective-nodejs-version-management-for-the-busy-developer-40fn)

In newer projects with a strong reproducibility mindset, exact patch pins are increasingly common, especially when maintainers want CI and local development to match closely. [makandracards](https://makandracards.com/makandra/74193-documenting-projects-node-js-version-nvmrc)

## Keeping pinned `.nvmrc` fresh

If you pin exact patches, the usual way to avoid going stale is to **automate the bump**. Renovate supports `.nvmrc` directly and can open PRs when a newer Node version is available, which keeps the update process visible and reviewable. If you prefer, a scheduled GitHub Action can also create a PR that updates `.nvmrc` on a cadence, which is a common pattern for teams that want explicit control over merge timing. [docs.renovatebot](https://docs.renovatebot.com/modules/manager/nvm/)

For your use case, the best operational model is: automated PR opens for each security/patch release, CI runs the full test suite, and maintainers merge only after review. That preserves reproducibility without letting the file rot. [ludeeus](https://www.ludeeus.dev/notes/keeping-nvmrc-up-to-date/)

## CI setup

CI should test the **supported Node majors** you claim, typically a matrix like Node 22 and 24, because that proves compatibility across the supported range rather than just the local default. Your committed `.nvmrc` can still pin one exact version inside that supported set; those are separate concerns: `.nvmrc` is the contributor/default runtime, while CI matrix coverage is your compatibility contract. [blog.stackademic](https://blog.stackademic.com/optimizing-gitlab-ci-cd-for-multi-version-node-js-testing-e9ec5309175d?gi=dde9d3fde5e0)

So the best pattern is usually: one pinned `.nvmrc` for day-to-day work, plus a CI matrix over the supported majors, plus a “current pinned patch” job if you want to ensure the repo’s default version stays healthy. [docs.renovatebot](https://docs.renovatebot.com/node/)

## Middle ground

The strongest middle ground is **exact patch pinning plus automation**. Pinning only major+minor, like `24.10`, is not a great compromise because it still allows patch drift if tooling resolves it loosely, and it does not buy you the explicitness you want from a full patch pin. If you want most of the security benefit with most of the reproducibility benefit, the best answer is exact pin + automated PRs + CI matrix, not partial pinning. [nvmnode](https://www.nvmnode.com/extend/nvmrc.html)

## Recommendation

For your project, I would do this:

- Commit an exact patch in `.nvmrc`, for example `24.10.0`. [docs.renovatebot](https://docs.renovatebot.com/modules/manager/nvm/)
- Keep your personal `nvm alias default` separate and unconstrained by the repo. [codex](https://codex.so/guide-to-nvm)
- Use CI to test Node 22 and 24 in a matrix, with the repo’s pinned version included as one of the jobs or as the primary local default. [blog.stackademic](https://blog.stackademic.com/optimizing-gitlab-ci-cd-for-multi-version-node-js-testing-e9ec5309175d?gi=dde9d3fde5e0)
- Automate `.nvmrc` bumps with Renovate or a scheduled PR workflow, and merge only after tests pass. [ludeeus](https://www.ludeeus.dev/notes/keeping-nvmrc-up-to-date/)

That setup is the best fit when you want security updates, but also want the version change to be deliberate, visible, and reviewable. [docs.renovatebot](https://docs.renovatebot.com/modules/manager/nvm/)



## Decision

This becomes **Decision E** of the AHQ-145 GREEN-phase plan (a second researched, maintainer-approved
deviation from the Jira AC's literal text, alongside Decision D for `engines.node`).

**Pin the root `.nvmrc` to the exact patch `24.15.0`** — not the floating major line `24`.

- `24.15.0` is the Node 24 version installed on the maintainer's machine during the AHQ-145 upgrade
  (`node --version` → `v24.15.0`, 2026-05-17).
- This **deviates from the Jira AC's literal text**, which mandates `.nvmrc` containing `24`
  (AHQ-145 Requirement 3). The deviation is deliberate and maintainer-approved: a committed `.nvmrc`
  is treated as a *runtime lockfile* so every Node version change is an explicit, diffable,
  reviewable, committed edit — directly serving the project's "no surprise breakage" priority. It is
  called out in the Jira comment and the GREEN phase summary; the maintainer may optionally update
  the Jira AC text to match.
- The personal `nvm alias default` is **left unchanged** (the floating line `24`). Per the research,
  it need not match `.nvmrc` — it is an individual shell convenience, not shared/committed state. The
  AHQ-145 manual upgrade script's `nvm alias default 24` step is therefore **not** modified.

**Out of scope for AHQ-145 — raised as follow-up Jira AHQ-146.** Keeping a pinned `.nvmrc` fresh
(automated bump PRs so the project still picks up Node security releases, plus a CI Node 22/24
matrix) is real new infrastructure beyond a minimal GREEN phase, and AHQ-145's scope already
excludes a CI matrix. It is tracked in
[AHQ-146](https://agentic-hq.atlassian.net/browse/AHQ-146), described in:
`docs/jira-docs/AHQ-145/follow-up-jiras/Renovate-automation-jira-description.md`.
