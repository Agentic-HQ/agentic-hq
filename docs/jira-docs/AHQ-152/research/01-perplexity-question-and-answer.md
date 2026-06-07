# Research: Safely updating dependencies after locking versions (supply-chain)

**For:** AHQ-152 — Emergency Security Fix: PNPM changes to avoid supply-chain attacks
**Date:** 2026-06-03
**Status:** ✅ Answered (2026-06-03). Key takeaway: the "minimum release age / > X days" instinct is
correct and now mainstream — pnpm has a native `minimumReleaseAge` setting; ~7 days is a sensible
default. Findings folded into AHQ-152 "Effect of the freeze" §2.

---

## Question (paste into https://perplexity.ai)

I maintain a small open-source TypeScript/Node CLI tool called "Agentic HQ" (a thin wrapper around
Claude Code). It's distributed to users who clone/download it and run `pnpm install`. It also has
several self-contained sub-projects (plugin "ts-workflows") that each run their own `pnpm install`.

To reduce supply-chain attack risk, I've just locked things down with pnpm 11:
1. **`frozen-lockfile=true`** in `.npmrc` for every install root — so `pnpm install` uses the committed
   `pnpm-lock.yaml` exactly (with its SHA-512 integrity hashes) and won't silently resolve newer
   versions.
2. **`allowBuilds: <pkg>: false`** in `pnpm-workspace.yaml` — so third-party dependencies'
   `install`/`postinstall` lifecycle scripts are blocked from running during install.

My questions, please answer with **current (2025–2026) best practice** and cite official docs where
possible:

1. **The freezing trade-off.** Now that everything is pinned to the committed lockfile, my dependencies
   are effectively frozen until I deliberately update them. (a) For a maintainer, what is the
   recommended *workflow* for periodically updating dependencies safely without losing the
   frozen-lockfile protection? (b) Does pinning like this actually meaningfully reduce supply-chain
   risk, or does it just shift the risk to "update time"?

2. **"Minimum release age" / cooldown idea.** My instinct is to only adopt a new dependency version
   once it has existed on the registry for more than X days (so that a malicious release has time to be
   detected and yanked before I adopt it). (a) Is this a real, recommended technique? (b) What is a
   sensible value of X (3 days? 7? 14?) and what's the trade-off of larger X? (c) Which tools implement
   this natively — e.g. pnpm's `minimumReleaseAge` config, npm's cooldown/`--before`, Renovate's
   `minimumReleaseAge`, Dependabot cooldown, Socket.dev? Brief pros/cons of each.

3. **What most people actually do.** For a *small* OSS project (not a bank — I want simple, low-effort
   process, but I genuinely do not want to compromise my users' computers), what is the realistic,
   commonly-adopted combination of measures to limit supply-chain exposure? (e.g. lockfile + integrity
   + Dependabot/Renovate with cooldown + `pnpm audit` + minimal dependencies + ignoring/auditing
   install scripts). What's the 80/20 — the few things that give most of the protection for least
   effort?

4. **Downstream users.** When users download/install my tool they get my committed, pinned versions —
   and then they too are "frozen" on whatever I shipped. (a) Is that a feature (they get exactly what I
   vetted) or a problem (they're stuck on potentially-stale/vulnerable versions until I release an
   update)? (b) How should I think about getting security *patches* out to users vs. protecting them
   from malicious *new* releases — are these in tension, and how do people balance them?

5. **Automation.** Is there a simple way to wire a "security scan / cooldown check" into a manual
   `update` command or CI so that updates are only accepted if they pass an audit AND meet the minimum
   release age? Concretely, what would the simplest realistic setup look like for a pnpm project?

Keep recommendations practical and proportionate to a small open-source dev tool.

---

## Answer

For a small OSS Node CLI, your current direction is broadly the right one: commit the lockfile, keep installs frozen by default, and use a release-age gate plus an allowlist for build scripts. The main best-practice nuance in 2025–2026 is that you should treat frozen installs as the *steady-state* and use a separate, intentional update workflow to refresh the lockfile on a schedule. [pnpm](https://pnpm.io/settings)

## 1. Freezing trade-off

A good maintainer workflow is: update on a cadence in a dedicated branch, run `pnpm update` or Renovate/Dependabot PRs, verify with `pnpm install --frozen-lockfile`, then test, audit, and merge the lockfile only after review. pnpm’s docs explicitly separate frozen installs from lockfile updates, and `pnpm update` is the path for changing the committed lockfile rather than normal user installs. [pnpm](https://pnpm.io/cli/install)

Pinning does meaningfully reduce supply-chain risk, because it stops surprise resolution of newer versions on user machines and preserves the exact tarball hashes recorded in the lockfile; pnpm 11.4+ also treats tarball integrity mismatches as a hard failure instead of silently re-resolving. The risk mostly shifts to the moments when *you* choose to update, which is exactly where you want the risk concentrated because that is where review, test, and cooldown checks can happen. [pnpm](https://pnpm.io/settings)

## 2. Minimum release age

Yes, release-age gating is a real and now mainstream technique rather than a niche idea. pnpm added `minimumReleaseAge`, Renovate documents `minimumReleaseAge`, and GitHub added Dependabot cooldown support in 2025, all for the same basic reason: give the ecosystem time to detect and remove malicious releases before you adopt them. [pnpm](https://pnpm.io/blog/releases/10.16)

For a small OSS tool, a sensible default is usually 7 days, with 3 days as a more permissive “keep things moving” setting and 14 days as a more conservative one. pnpm’s docs say many malicious releases are removed within about an hour, so the biggest practical gain comes from moving from zero delay to *some* delay; larger values increase safety but also slow legitimate patch adoption and can leave you with older vulnerable versions for longer. [docs.renovatebot](https://docs.renovatebot.com/presets-security/)

Tool-by-tool, the trade-offs look like this:

| Tool | Native cooldown? | Strengths | Weaknesses |
|---|---|---|---|
| pnpm `minimumReleaseAge` | Yes, package-manager enforced | Applies to all installs, including transitive deps; simple once configured; can exclude specific packages.  [pnpm](https://pnpm.io/settings) | If too strict, updates can stall; strict fallback can break installs when no aged version exists.  [pnpm](https://pnpm.io/settings) |
| npm `--min-release-age` / age gating | Yes in recent npm releases | Built into the package manager; purpose-built for supply-chain protection.  [github](https://github.com/jdx/mise/discussions/9042) | Evolving quickly; older npm versions used other mechanisms, and ecosystem support is less uniform than pnpm docs.  [github](https://github.com/jdx/mise/discussions/9042) |
| Renovate `minimumReleaseAge` | Yes | Great for PR-based workflows; flexible per package/update type; strong fit for maintainer review.  [docs.renovatebot](https://docs.renovatebot.com/presets-security/) | Only affects Renovate suggestions, not users’ local installs. |
| Dependabot cooldown | Yes | Native GitHub integration; low-effort for OSS repos; good for automating version PRs.  [github](https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/) | It gates PR creation, not runtime installs; more limited than package-manager enforcement.  [github](https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/) |
| Socket.dev | Yes, as a scanning/product layer | Adds advisory and policy signals beyond age alone.  [socket](https://socket.dev/blog/npm-introduces-minimumreleaseage-and-bulk-oidc-configuration) | Usually more of a platform/scanner than a core install gate; not the simplest path for a small project. |

## 3. What most people do

The 80/20 for a small OSS CLI is: committed lockfile, frozen installs for users and CI, `minimumReleaseAge` in pnpm, an allowlist for lifecycle scripts, regular dependency update PRs, and a quick audit pass before merge. pnpm’s docs also recommend `pnpm audit` and, when needed, overrides or `--fix=update` to move off vulnerable versions. [pnpm](https://pnpm.io/cli/audit)

That combination is realistic because it covers the main risks without making maintenance painful: reproducibility from the lockfile, integrity checking from pnpm, less exposure to fresh malicious releases from cooldown, and less script-based attack surface from `allowBuilds`. pnpm’s current docs describe `allowBuilds`/`approve-builds` as the supported replacement for the old build-script controls, so your choice there is aligned with current best practice. [pnpm](https://pnpm.io/cli/approve-builds)

## 4. Downstream users

For downstream users, being “frozen” is usually a feature, not a bug: they get exactly the dependency graph you tested and published. The downside is that they do not automatically inherit later security fixes, so your release process becomes the place where patches are delivered. [pnpm](https://pnpm.io/cli/install)

The practical balance is to keep user installs reproducible, but maintain a fairly regular update cadence yourself, especially for direct and transitive vulnerabilities that matter to a CLI tool running on user machines. In other words, protect users from surprise new releases at install time, but do not leave them stranded on old versions for too long; the usual compromise is scheduled dependency refreshes plus fast patch releases when `pnpm audit` or advisories show a real issue. [github](https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/)

## 5. Simple automation

The simplest realistic setup is a manual `update` script or CI job that runs `pnpm update`, then `pnpm audit`, then `pnpm install --frozen-lockfile` in a clean environment, and only merges if the lockfile remains valid and the audit passes. If you want the age check enforced by the package manager, put `minimumReleaseAge` in `pnpm-workspace.yaml` so the same rule applies during normal installs and in CI. [pnpm](https://pnpm.io/cli/audit)

A very practical small-project workflow is:
1. Run a scheduled Renovate or Dependabot PR.
2. Let pnpm apply `minimumReleaseAge` during resolution.
3. Review the diff and run tests.
4. Run `pnpm audit` and fix or override as needed.
5. Merge only after `pnpm install --frozen-lockfile` succeeds. [docs.renovatebot](https://docs.renovatebot.com/presets-security/)

For your specific project, the most proportionate posture is: frozen lockfile, `allowBuilds` deny-by-default, `minimumReleaseAge` around 7 days, a small allowlist for essential build tools, and automated update PRs rather than ad hoc manual bumps. That gives you most of the supply-chain protection available to a tiny OSS CLI without turning maintenance into a full-time security program. [github](https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/)
