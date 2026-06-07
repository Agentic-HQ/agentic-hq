# Later: Security: Use Scanning Techniques To Upgrade Frozen Package Versions

**AHQ-154** — https://agentic-hq.atlassian.net/browse/AHQ-154
**Type:** Task / Security (follow-up — NOT urgent)
**Date:** 2026-06-04
**Status:** Planned (deferred). This is the deliberate-update half of the AHQ-152 lockdown.

> **Relationship to AHQ-152** (https://agentic-hq.atlassian.net/browse/AHQ-152): AHQ-152 *froze* the
> dependencies (committed lockfile + `frozen-lockfile=true` + `allowBuilds: false` + a 7-day
> `minimumReleaseAge` cooldown). That deliberately concentrates **all** dependency risk at one
> controllable moment — **when we choose to update**. This ticket (AHQ-154) is the process for *that
> moment*: how to upgrade the frozen versions with high confidence the new versions don't contain
> hacks. It was listed in AHQ-152's Follow-up as the deferred "safe-update workflow".

---

## Summary

As a: solo maintainer who has frozen all dependencies (AHQ-152)
I want: a simple, repeatable, **< 2 hour** manual process to safely bump the frozen versions
So that: when I *deliberately* update, I am highly confident the new versions don't contain
deliberately-malicious code (backdoors / obfuscated payloads / malicious install scripts) — by
**actively scanning the changed packages before I trust them**, not just relying on the 7-day cooldown.

## Background — what the research found

Full research + citations: **`docs/jira-docs/AHQ-152/research/02-perplexity-question-and-answer-about-future-upgrading.md`**
(complements `research/01-…` which settled the cooldown / `minimumReleaseAge` half).

Key takeaways that shape the plan below:

1. **Two different kinds of scanning — don't confuse them.**
   - **Known-vuln scanning** (`pnpm audit`, `osv-scanner`) only matches *already-published* advisories.
     It will **not** catch a fresh supply-chain hack that landed today.
   - **Novel-malware / behavioural scanning** (Socket, lighter-weight `npq`) is what actually targets
     *hacks* — it inspects install scripts, network/filesystem access, obfuscation, typosquats,
     maintainer/namespace changes. **For our threat model (deliberately malicious updates), this
     category matters most.**

2. **No tool is a guarantee.** Even the best behavioural scanners "catch the obvious badness" — treat
   them as high-value triage, not proof of safety. The cooldown (AHQ-152) and these scans are
   complementary layers: cooldown = "let the ecosystem find it"; scan = "look for it myself".

3. **Review only what changed.** A dependency refresh usually moves only a small slice of the graph.
   The `pnpm-lock.yaml` git diff is the source of truth — scan/eyeball *only* the added/changed
   packages and any newly-introduced install scripts, not the whole tree every time.

4. **Provenance is a useful extra signal, not the answer.** `npm audit signatures` / npm provenance
   can confirm an artefact genuinely came from the expected source/CI, but it does **not** prove the
   code is benign, and coverage is still patchy. Use where available, especially for high-impact deps.

5. **The 80/20** for a one-person OSS tool: **diff the lockfile → behavioural-scan the new packages →
   clean frozen install + tests.** Most protection, least time.

### Tools named by the research

| Tool | Category | Catches | Misses | Free? |
|---|---|---|---|---|
| **Socket** (CLI / install wrapper) | Behavioural / package-health | Malicious install scripts, typosquats, obfuscation, telemetry, protestware, suspicious maintainer changes | Novel well-crafted/delayed payloads (probabilistic) | CLI free; platform features paid |
| **`npq`** | Behavioural (lightweight pre-install gate) | Suspicious names, maintainer reputation, obvious red flags | Not a sandbox; clever/delayed payloads | Yes (OSS) |
| **`osv-scanner`** | Known-vuln (lockfile/SBOM) | Published CVEs in the dep graph | Any malicious *intent* / unknown backdoors | Yes (OSS) |
| **`pnpm audit`** | Known-vuln | Published advisories | Novel malware | Yes (built-in) |
| **OpenSSF Scorecard** | Repo-health posture | Project hygiene signals (review, release, pinning) | Not package-version malware | Yes (OSS) |
| **npm provenance / `npm audit signatures`** | Provenance/signing | Artefact genuinely from expected source/CI | Whether the code is benign; patchy coverage | Yes |

## Effort tiers (pick one at the time)

| Tier | What to do | ~Time / update | Free? |
|---|---|---:|---|
| **Minimum** | cooldown (already on) + lockfile-diff eyeball + `osv-scanner` + `pnpm install --frozen-lockfile` + tests | 10–20 min | Yes |
| **Better (recommended)** | Minimum **+ Socket or `npq` on the changed packages** before trusting them | 20–45 min | `npq` free; Socket free CLI |
| **Best** | Better **+ provenance/signature checks + Scorecard + CI gating** of lockfile diffs / new scripts | 45–90 min upfront, low ongoing | Mostly |

**Recommended for us: the "Better" tier** — it directly targets *hacks*, stays well under 2 hours, and
is free with `npq` (or Socket's free CLI). Start manual; consider automating (CI gate) later.

---

## The plan — a < 2 hour manual update run (review & improve at the time)

> This is the **"Better" tier**. Run it on a branch whenever you decide to bump deps. Adjust the tool
> choice (Socket vs `npq`) and depth at the time. Commands assume you're in the relevant install root
> (the repo root, or a specific ts-workflow dir — repeat per root if you bumped more than one).

### Tool setup — ONE-TIME install on Mac (dummies guide) (≈10–15 min, only the first time)

> You only do this **once** per machine. After it's set up, every future update run skips straight to
> Step 0. All commands are for macOS. Verify each tool with its `--version` line — if you get a version
> number back, it worked.

**Tool 0 — Homebrew** (the Mac package manager; needed to install `osv-scanner`). Check if you already
have it; most dev Macs do:
```bash
brew --version          # if this prints a version, skip to Tool 1
```
If it's missing, install it from the official site — **https://brew.sh** — by pasting their one-liner:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
(Homebrew's installer may ask for your password and may print a couple of `export PATH` lines to add to
your shell profile — follow its on-screen instructions.)

**Tool 1 — `osv-scanner`** (known-CVE scanner; free, Google/OpenSSF). Docs:
**https://google.github.io/osv-scanner/** · install page:
**https://google.github.io/osv-scanner/installation/**
```bash
brew install osv-scanner
osv-scanner --version          # verify
```

**Tool 2 — `npq`** (lightweight behavioural pre-install gate; free, OSS). Page:
**https://www.npmjs.com/package/npq**
You do **not** need to install this — you can run it on demand with `npx` (pnpm ships `npx` via Node):
```bash
npx npq --version              # downloads on first run, then cached
```
*(Prefer a permanent install? `pnpm add -g npq` then `npq --version`. Optional — `npx` is fine.)*

**Tool 3 — Socket CLI** (deeper behavioural scanner; free CLI, optional alternative to `npq`). Docs:
**https://docs.socket.dev/docs/socket-cli** · overview: **https://socket.dev/features/cli**
Also runnable via `npx` (no install):
```bash
npx @socketsecurity/cli --version     # downloads on first run, then cached
```
*(Permanent install alternative: `pnpm add -g @socketsecurity/cli` then `socket --version`. Some
Socket checks may prompt you to sign in / connect a free Socket account the first time.)*

**Tool 4 — `pnpm` and `npm`** — already on this machine (the repo uses pnpm 11; `npm audit signatures`
ships with Node). Quick check:
```bash
pnpm --version
npm --version
```

✅ Once all four print versions, setup is done — you never repeat this section. Future runs start at
Step 0.

### Step 0 — Prep (≈2 min)
Branch off so nothing touches `main` until it's vetted, and capture the "before" lockfile.
```bash
git checkout -b deps/update-$(date +%Y-%m)
```

### Step 1 — Update on the branch and capture the diff (≈5 min)
Let pnpm resolve new versions. The AHQ-152 **7-day cooldown still applies here** — brand-new releases
are held back automatically. Then immediately look at *what moved*.
```bash
pnpm update                       # respects minimumReleaseAge (7-day cooldown)
git --no-pager diff -- pnpm-lock.yaml > /tmp/lockfile.diff
git --no-pager diff -- pnpm-lock.yaml
```

### Step 2 — Triage the lockfile diff: list ONLY what changed (≈10–15 min)
You only need to vet the *added/changed* packages, not the whole tree. From the diff, write down:
- **new packages** and **changed versions**,
- any **new `hasInstallScript: true`** entries (highest priority — these run code at install),
- any **new/exotic tarball sources** (not the normal `registry.npmjs.org`),
- any **maintainer / namespace changes** or sudden additions.

Red flags to prioritise: a package that *gained* an install script, a brand-new maintainer/namespace, an
exotic source, or something published very recently (even past the cooldown).

### Step 3 — Behavioural scan of the changed packages (the anti-hack step) (≈10–20 min)
This is the step that targets *deliberate malice*. Pick **one** tool:

**Option A — `npq`** (lightweight, free, zero account):
```bash
# vet a specific package+version before trusting it (repeat for each changed pkg)
npx npq install <pkg>@<version> --dry-run
```

**Option B — Socket** (deeper behavioural signals; free CLI):
```bash
# scan package health / risk for the changed packages before install
npx @socketsecurity/cli scan <pkg>@<version>
# (or use Socket's install wrapper in place of pnpm add for new direct deps)
```

Investigate anything either tool flags (install scripts, network access, obfuscation, typosquat). If a
flag can't be explained, **don't adopt that version** — pin to the previous good one or wait.

### Step 4 — Known-vuln scan (catches published CVEs the behavioural tools don't) (≈5 min)
```bash
osv-scanner --lockfile=pnpm-lock.yaml
pnpm audit
```
Fix/override genuine vulns. (Reminder: this catches *known* issues, not novel hacks — Step 3 is the
hack defence; this is the complementary CVE sweep.)

### Step 5 — (Optional, high-impact deps) provenance check (≈5 min)
For any important dependency that supports it, confirm the artefact is genuinely from the expected
source/CI:
```bash
npm audit signatures
```
Treat as a *bonus* trust signal — absence isn't proof of badness, presence isn't proof of safety.

### Step 6 — Clean frozen install + full test run (≈10–20 min)
Prove the new lockfile is valid and nothing broke, with the freeze re-asserted.
```bash
rm -rf node_modules
pnpm install --frozen-lockfile
pnpm validate        # typecheck + lint + format + test
```

### Step 7 — Commit the vetted lockfile and ship (≈5 min)
Only now, after every check passed:
- review the lockfile diff one final time,
- commit `package.json` + `pnpm-lock.yaml` together (via the `/commit` command),
- merge, and cut a release so downstream users get the **vetted** patch.

**Rough total: ~50–75 min per update run** — comfortably under the 2-hour budget. The Tool-setup
section above is a **one-time ~15 min** cost on the first run only; every run after that starts at
Step 0. If you bumped multiple install roots, Steps 1–6 repeat per root (usually fast, since most roots
change little).

## Acceptance Criteria (for when this ticket is actually done)

- [ ] One chosen behavioural scanner (`npq` or Socket) is documented as the standard tool, with the
      exact command(s), in a short runbook under `docs/`.
- [ ] The step-by-step update process above is validated by running it **once for real** on a small
      dep bump (and refined based on what actually happened).
- [ ] The process is captured as a repeatable runbook (and/or a `pnpm run update:safe` helper script
      that chains the non-judgement steps: `pnpm update` → `osv-scanner` → `pnpm audit` →
      `pnpm install --frozen-lockfile` → `pnpm validate`).
- [ ] Per-update time confirmed to be < 2 hours.

## Out Of Scope

- Automating this in CI / as a scheduled bot (Renovate/Dependabot with cooldown). Start **manual**;
  automation is a later, separate decision once the manual process is proven.
- Re-vetting the *entire* dependency tree — the process only vets what changed in the lockfile diff.
- Changing the AHQ-152 freeze itself (lockfile / `frozen-lockfile` / `allowBuilds` / `minimumReleaseAge`
  are settled).
- Paid Socket platform features — the free CLI / `npq` is sufficient for the recommended tier.

## References

- Research (this work): `docs/jira-docs/AHQ-152/research/02-perplexity-question-and-answer-about-future-upgrading.md`
- Cooldown research: `docs/jira-docs/AHQ-152/research/01-perplexity-question-and-answer.md`
- The freeze it builds on: `docs/jira-docs/AHQ-152/DRAFT-Jira-Description.md` (AHQ-152)
