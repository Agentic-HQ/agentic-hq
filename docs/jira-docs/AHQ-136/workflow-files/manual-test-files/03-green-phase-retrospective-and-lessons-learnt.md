# AHQ-136 — Upgrade Retrospective & Lessons Learnt

**Jira**: [AHQ-136](https://agentic-hq.atlassian.net/browse/AHQ-136) — Upgrade pnpm From 10 To 11 As Global Default
**Phase**: GREEN (manual test)
**Written**: 2026-05-16

> A deliberate retrospective on the AHQ-136 pnpm 10 → 11 upgrade. The upgrade *succeeded*
> and the end result is correct and verified — but the path there was bumpier and far more
> expensive than it should have been. **Cost of the journey: 3 context compactions,
> ~600,000 tokens, and 7 distinct unexpected issues** (5+ of them surfaced one error message
> at a time). This doc records what went wrong, how each was resolved, and — most
> importantly — what to do differently next time.
>
> It is written to be **referred back to before the next package-manager / global-tooling
> upgrade** (the imminent Node upgrade in particular). The companion GREEN summary is
> [`03-green-phase-summary-of-what-was-implemented.md`](./03-green-phase-summary-of-what-was-implemented.md).

---

## Section 1 — Problems Hit, Workarounds, and Opinion

### Every problem we hit, and how we got round it

| # | Problem | Root cause | How we got round it |
|---|---------|-----------|---------------------|
| 1 | `corepack use pnpm@11.1.2` aborted: `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` | pnpm 11 wants to purge the pnpm-10-era `node_modules` and needs an interactive TTY to confirm | Ran `CI=true pnpm install` (one-shot env var, no file mutated) |
| 2 | Sub-project installs failed: `[ERR_PNPM_IGNORED_BUILDS]`; pnpm even overwrote the hand-written `allowBuilds` map | In pnpm 11, `pnpm install --ignore-workspace` skips the *local* `pnpm-workspace.yaml` too → `allowBuilds` never read → `strictDepBuilds` fails | Dropped `--ignore-workspace` everywhere; gave each sub-project its own `pnpm-workspace.yaml` with `packages: ['.']` (replan mid-GREEN) |
| 3 | A 6th `ts-workflow` sub-project was not in scope | The AI summary said "5 sub-projects"; the e2e-fixture copy under `tests/e2e/fixtures/` was never counted | Found it mid-GREEN; migrated it too (would otherwise break the e2e suite) |
| 4 | Install script failed: global bin directory `$PNPM_HOME/bin` not in PATH | pnpm 11 moved the global bin dir from `$PNPM_HOME` to `$PNPM_HOME/bin` | Maintainer ran `pnpm setup` once to update the shell PATH |
| 5 | `pnpm setup` itself failed: `[ERR_PNPM_BAD_SHELL_SECTION]` | `~/.zshrc` still held the old pnpm-10 `# pnpm` block; pnpm 11 refuses to rewrite a foreign block | Backed up `~/.zshrc`, ran `pnpm --force setup` (diff confirmed: only the PATH line changed) |
| 6 | Install script *still* failed: `[ERR_PNPM_LINK_BAD_PARAMS]` | pnpm 11 **removed** the bare `pnpm link --global` form; `pnpm link` now requires a `<dir>` arg | Switched the script to `pnpm add -g .` (pnpm 11's documented replacement); verified it produces a live-source symlink |
| 7 | 5 e2e tests had a latent wrong-PATH bug | Their PATH fallback prepended `$PNPM_HOME` (pnpm 10 layout), not `$PNPM_HOME/bin` | Fixed all 5 while touching the install path |
| 8 | `cd /tmp; pnpm list -g` errored and did not list `agentic-hq` | corepack resolves pnpm version per-directory; outside a pinned project its **global default** was still pnpm 10.33.0 | Scope widened: maintainer ran `corepack install -g pnpm@11.1.2` to make pnpm 11 the global default |
| — | A research contradiction: Gemini vs Perplexity disagreed on whether to clean up old pnpm-10 globals | Two AI tools, two opinions; one of Gemini's claims was initially (wrongly) dismissed as a hallucination but turned out correct | Reconciled empirically — checked the actual PATH after `pnpm --force setup`; old shims are unreachable, so "leave them" won |

### Honest opinion — could we have prepared better?

**Yes — meaningfully so, on roughly half of these.** The final result is sound and the
mid-GREEN replan discipline did catch everything. But the *process* was inefficient, and
the inefficiency has a clear, repeating shape: **we discovered breaking changes one error
message at a time** instead of front-loading them. Each discovery meant a diagnose →
research → replan → sometimes-compact loop. That loop is what burned 600k tokens and forced
3 compactions.

Breaking it down honestly:

- **Preventable by reading pnpm 11's migration guide / changelog *in full* up front
  (issues 2, 4, 6).** The `--ignore-workspace` behaviour, the `$PNPM_HOME/bin` move, and the
  removal of `pnpm link --global` are all *documented pnpm 11 changes*. We knew about
  `onlyBuiltDependencies` → `allowBuilds` because it was in the plan — but we stopped there
  instead of reading the whole breaking-changes list. Three separate mid-flight replans
  could have been one upfront planning paragraph.
- **Preventable by a codebase grep sweep during planning (issues 3, 7).** The 6th
  `ts-workflow` and the 5 wrong e2e PATH fallbacks were each a 30-second `grep`
  (`grep -rl 'ts-workflow'`, `grep -rn 'PNPM_HOME'`, `grep -rn 'pnpm link'`,
  `grep -rn 'ignore-workspace'`). The plan was built from the AI summary's prose ("5
  sub-projects") rather than from the actual file tree. **A config/tooling upgrade should
  always start with an exhaustive grep for every string being changed.**
- **Arguably foreseeable (issue 8).** "We pinned the *project* to pnpm 11" is not the same
  as "pnpm 11 is the machine default". Thinking about corepack's per-directory resolution
  up front would have caught this — it became a scope change instead.
- **Genuinely emergent — fine as handled (issues 1, 5, and the Gemini/Perplexity clash).**
  The TTY-abort and the `ERR_PNPM_BAD_SHELL_SECTION` depend on this specific machine's
  pre-existing state and were reasonable to meet reactively. The research contradiction is
  just the nature of using two advisory tools.

So: **not a disaster, but not "we did fine" either.** A more thorough up-front pass —
*read the entire migration guide, then grep the entire codebase for every affected string*
— would likely have collapsed ~5 of the 8 surprises into the original plan, avoided at
least one or two of the compactions, and saved a large fraction of the 600k tokens.

The maintainer's instinct is also correct on one more point: **global machine state was the
real risk, not the repo.** Reverting the repo is trivial (`git checkout`); reverting
`~/.zshrc`, `$PNPM_HOME/`, and the corepack global default is *not* version-controlled.
We backed up `~/.zshrc` — but only *reactively*, at the moment the error hit, not as planned
preparation. That is luck, not process.

---

## Section 2 — Lessons Learnt For The Next Upgrade

A checklist to run **before** the next package-manager / global-tooling upgrade. It is
written generically — it applies directly to the imminent Node upgrade as much as to any
future pnpm bump.

1. **Read the entire migration guide and the full breaking-changes changelog first** — not
   just the one setting you already know about. List *every* breaking change as a numbered
   item in the plan, even the ones you think don't apply. Most of AHQ-136's surprises were
   in pnpm 11's published notes. (For Node: read the changelog for every major between the
   current and target version, and check the `engines` ranges and any native-addon ABI
   bumps.)
2. **Grep the whole codebase for every string you're about to change**, during planning,
   before writing the plan: old command names, env-var names, config keys, file paths,
   version numbers. For AHQ-136 that would have been `pnpm link`, `--ignore-workspace`,
   `onlyBuiltDependencies`, `PNPM_HOME`, `ts-workflow`. Build the plan's file list from
   `grep` output, never from a prose summary's "there are 5 of these". (For Node: grep for
   the version string, `engines.node`, `.nvmrc`, CI workflow `node-version`, Dockerfiles.)
3. **Back up global / machine state outside the repo before starting** — it is not under
   version control and reverting it is not trivial. For a pnpm upgrade: timestamped copies
   of `~/.zshrc` (and `~/.bashrc` if used), plus a record of `echo $PATH`, `echo $PNPM_HOME`,
   `pnpm list -g`, `corepack --version`, and the corepack global default. For a Node
   upgrade: record `nvm ls`, the current default alias, `which node`/`node --version`, and
   the global npm/pnpm package list. Do this as *step 1 of preparation*, not reactively when
   an error appears.
4. **Distinguish "project pin" from "machine default" explicitly.** Version managers
   (corepack, nvm) resolve the tool version per-directory or per-shell; pinning the repo
   does not change what runs elsewhere. If the upgrade should be machine-wide, make that an
   explicit, planned requirement from the start (it became a mid-flight scope change here).
5. **Verify the install / dev-tooling path early, not last.** The dev-install script and
   the e2e tests that depend on it were touched late and surfaced issues 4–7 in sequence.
   Smoke-test the install path as soon as the core config is migrated, so its breakages land
   while there is still context budget to absorb them.
6. **When a tool's command or API might be removed (not just deprecated), check it
   explicitly.** "`pnpm link --global` still works, it just warns" was an assumption that
   cost a replan. Run `<tool> <subcommand> --help` against the *new* version before relying
   on a command. (For Node: check that no removed/deprecated APIs are used.)
7. **Budget context deliberately for upgrades.** This one took 3 compactions / ~600k tokens
   largely because of the discover-by-error loop. Front-loading research and the grep sweep
   (lessons 1–2) is also the single biggest lever on token cost — fewer surprises means
   fewer diagnose/replan cycles means fewer compactions.
