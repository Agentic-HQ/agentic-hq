# Research: Scanning/vetting a new dependency version BEFORE adopting it (pre-download checks)

**For:** AHQ-152 — Emergency Security Fix: PNPM changes to avoid supply-chain attacks
**Date:** 2026-06-04
**Status:** ⏳ Question ready — paste into https://perplexity.ai and paste the answer below.

> **How this differs from `01-…`:** Research doc 01 settled the *update workflow* and the
> *release-age cooldown* (`minimumReleaseAge`) — i.e. "wait X days so the ecosystem can catch a bad
> release." This doc is the complementary angle: when I *do* decide to update, what is the simplest
> way to **actively scan/verify the candidate new versions for malicious code BEFORE I download and
> run them**, with high confidence they don't contain hacks — in a 1–2 hour, manual-first budget.

---

## Question (paste into https://perplexity.ai)

I maintain a small open-source TypeScript/Node CLI tool ("Agentic HQ", a thin wrapper around Claude
Code), distributed to users who clone it and run `pnpm install` (pnpm 11). It also has several
self-contained sub-projects that each run their own `pnpm install`.

I have **already** locked things down (this part is done, please don't re-litigate it):
- `frozen-lockfile=true` in `.npmrc` at every install root (committed lockfile + SHA-512 integrity).
- `allowBuilds: <pkg>: false` in `pnpm-workspace.yaml` — third-party install/postinstall scripts
  blocked by default.
- `minimumReleaseAge: 10080` (7-day cooldown) in every `pnpm-workspace.yaml`.

Now I need the **other half**: a simple, repeatable process for the moments when I *deliberately
update* dependencies (bump versions / refresh the lockfile). I want to be **highly confident the new
versions do not contain malicious code (hacks/backdoors/obfuscated payloads/malicious install
scripts)** — ideally *checking or scanning the candidate versions BEFORE I download and run them*, not
just trusting the 7-day cooldown. I am one person, this is a small OSS tool, and I do **not** have
hours — I want a process I can learn and run manually in **max 1–2 hours each time**, manual at first,
possibly automated later.

Please answer with **current (2025–2026) best practice** and cite official docs where possible:

1. **Pre-download / pre-install scanning — does it exist and how good is it?** Is it actually possible
   to scan a *specific candidate npm package version* for malicious behaviour **before** installing/
   running it (e.g. inspect its tarball, install scripts, network/filesystem access, obfuscation,
   typosquatting)? Which tools do this, and how trustworthy are they for catching *novel* malware (not
   just known CVEs)? Please cover at least **Socket.dev** (incl. the `socket` CLI / install wrapper),
   **`npq`**, **OSV-Scanner**, **OpenSSF Scorecard**, and anything else mainstream. For each: what it
   catches, what it misses, free/paid, and how much setup/run effort.

2. **Known-vuln scanning vs novel-malware scanning — the crucial distinction.** I understand
   `pnpm audit` / `npm audit` / OSV-Scanner mostly catch *already-known, published* vulnerabilities,
   whereas a fresh supply-chain *hack* is novel and unpublished. (a) Is that distinction correct? (b)
   Which tools actually attempt to detect *novel/zero-day malicious behaviour* (behavioural/static
   analysis of install scripts, network calls, obfuscation) rather than just matching a CVE database?
   (c) For protecting against *hacks* specifically, which category matters more, and what's the
   realistic detection rate — should I treat these as "catches the obvious stuff" rather than a
   guarantee?

3. **The simplest concrete manual process for a pnpm project.** Give me a concrete, ordered,
   copy-pasteable checklist I can run in ≤1–2 hours when I update, e.g. something like: bump in a
   branch → `pnpm update` (cooldown applies) → run scanner X on the diff → `pnpm audit` →
   review lockfile diff for new/changed packages & new install scripts → `pnpm install
   --frozen-lockfile` in a clean env → test → merge. Tell me the *exact commands* for the recommended
   scanner(s) and where they slot in. What is the **80/20** — the 2–3 steps that give most of the
   protection for least effort?

4. **Reviewing only what changed.** When I update, usually only a few packages move. Is there a clean
   way to **diff the dependency set** (direct + transitive) and scan/review *only the added or changed
   packages and any newly-introduced install scripts*, rather than re-vetting everything every time?
   What's the pnpm-friendly way to see "what new code/packages am I about to trust" from a lockfile
   diff?

5. **Provenance / signing — is it worth it yet?** Do npm provenance / Sigstore attestations /
   `npm audit signatures` / signed releases meaningfully help me verify a version is the genuine,
   untampered artefact from the real maintainer? Is it mature enough in 2025–2026 to be part of a
   small-project process, or still too patchy to rely on?

6. **Cost/effort tiers.** Sketch a "good / better / best" for a solo OSS maintainer: (a) the absolute
   minimum (lockfile + cooldown + audit + eyeball the diff), (b) a sensible middle (add one
   behavioural scanner like Socket on the diff), (c) the thorough version (provenance checks +
   Scorecard + CI gating). For each tier, roughly how much per-update time, and is it free?

Keep it practical and proportionate to a tiny one-maintainer OSS dev tool. I care most about catching
*deliberately malicious* updates (supply-chain hacks), with the least ongoing effort.

---

## Answer

Yes: the **known-vuln** distinction is correct, and for deliberately malicious npm updates you should treat most scanners as “catch the obvious badness” rather than a guarantee. The most practical 2025–2026 workflow for a solo pnpm maintainer is: keep your current lockfile/cooldown protections, then on update review the lockfile diff, run a behavioral/package-health scanner on only the changed packages, and verify provenance/signatures where available. [pnpm](https://pnpm.io/supply-chain-security)

## 1) Pre-download scanning

**Short version:** true pre-download scanning exists, but it is uneven. Socket is the closest to a “stop before install” workflow; `npq` is a lighter gate; OSV-Scanner is for known vulnerabilities only; Scorecard is repo-health, not package-malware detection. [socket](https://socket.dev/features/cli)

| Tool | What it does well | What it misses | Free / paid | Effort |
|---|---|---|---|---|
| Socket CLI / wrapper | Blocks or flags suspicious packages, typosquats, install scripts, protestware, telemetry; can wrap package-manager commands and scan package health; can inspect package scores and scans from the terminal.  [socket](https://socket.dev/features/cli) | Not a guarantee against novel malware; it is still probabilistic and policy-based, and some checks depend on Socket’s service/signals.  [socket](https://socket.dev/features/cli) | CLI is available; commercial platform/features exist. Docs describe CLI and wrapper use; practical usage is often tied to Socket account/API for full workflows.  [docs.socket](https://docs.socket.dev/docs/socket-cli) | Moderate: minutes to set up, then low ongoing effort. |
| `npq` | Lightweight pre-install gate focused on suspicious package names, maintainer reputation/history, and obvious red flags in behavior.  [trevorlasn](https://www.trevorlasn.com/blog/npq-protects-npm-installs-from-malicious-packages) | Not a deep sandbox; will miss clever, novel, or delayed payloads, and it is less authoritative than a full security platform.  [trevorlasn](https://www.trevorlasn.com/blog/npq-protects-npm-installs-from-malicious-packages) | Open source; package available on npm.  [npmjs](https://www.npmjs.com/package/npq) | Low: quick to try, simple to run. |
| OSV-Scanner | Excellent for detecting *known* vulnerabilities in your dependency graph, lockfile, or SBOM.  [google.github](https://google.github.io/osv-scanner/) | Does not try to detect malicious intent or unknown backdoors; it is database matching, not malware analysis.  [google.github](https://google.github.io/osv-scanner/) | Free/open source.  [google.github](https://google.github.io/osv-scanner/) | Low: easy CLI run in CI or locally. |
| OpenSSF Scorecard | Assesses project/security posture signals like branch protection, release hygiene, pinned dependencies, etc.  [openssf](https://openssf.org/projects/scorecard/) | Not a malware scanner and not package-version specific; it won’t tell you if a new tarball contains a payload.  [openssf](https://openssf.org/projects/scorecard/) | Free/open source.  [openssf](https://openssf.org/projects/scorecard/) | Low to moderate. |
| Other mainstream tools | Snyk/SCA, Dependabot, GitHub alerts, osv.dev ecosystem, and package health tools help with known vulnerabilities and metadata risk.  [google.github](https://google.github.io/osv-scanner/) | Mostly still vulnerability/health tooling, not novel malware detection.  [google.github](https://google.github.io/osv-scanner/) | Mixed. | Low to moderate. |

**Best practical answer:** for your use case, Socket-style scanning is the most relevant “pre-install” option, while `npq` is the lightweight alternative. OSV-Scanner and Scorecard are still useful, but they are not substitutes for malicious-code screening. [google.github](https://google.github.io/osv-scanner/)

## 2) Known-vuln vs novel-malware

Yes: `pnpm audit`, `npm audit`, and OSV-Scanner are primarily about **already-known vulnerabilities** in published advisories and databases. They are very useful, but they do not meaningfully solve “a fresh supply-chain hack landed today” by themselves. [osv](https://osv.dev)

Tools that try to detect **novel malicious behavior** are the behavioral/static-analysis class: Socket’s CLI/wrapper is the clearest mainstream example here, and `npq` is a lighter-weight version of the same general idea. Socket’s docs explicitly describe protection from malware, typosquats, install scripts, and similar package risks. [docs.socket](https://docs.socket.dev/docs/socket-cli)

For *hacks* specifically, the “novel malware” category matters more than CVE scanning. Realistically, though, even the best tools mostly catch the obvious, reputation-adjacent, or policy-violating cases; they are not a guarantee against a well-crafted malicious release. [openssf](https://openssf.org/projects/scorecard/)

## 3) Manual update checklist

For a solo maintainer, the 80/20 is: **lockfile diff review + one behavioral/package-health scan + clean frozen install/test**. That gives most of the protection for the least time, and it fits your 1–2 hour budget. [pnpm](https://pnpm.io/supply-chain-security)

### Recommended workflow

1. Create a branch and update one small set of deps.
```bash
git checkout -b deps/update-2026-06
pnpm update
git diff -- pnpm-lock.yaml
```

2. Review the lockfile diff for:
- new packages,
- changed versions,
- new `hasInstallScript` entries,
- new tarball URLs / exotic sources,
- major maintainer changes or sudden package additions.  
pnpm explicitly highlights using `allowBuilds`, `blockExoticSubdeps`, and `minimumReleaseAge` to reduce risk, and it warns that malware often appears in newly published versions. [pnpm](https://pnpm.io/supply-chain-security)

3. Run known-vuln scanning on the updated tree.
```bash
osv-scanner --lockfile=pnpm-lock.yaml
```
OSV-Scanner supports lockfile scanning and is meant for existing vulnerabilities, not malware. [google.github](https://google.github.io/osv-scanner/)

4. Run a behavioral/package-health scan on the changed packages.
- If you choose **Socket**, use its CLI/wrapper or package-scoring workflow to inspect package risk before install or while resolving installs. [docs.socket](https://docs.socket.dev/docs/safe-npm-faq)
- If you choose **npq**, use it as a pre-install gate for the specific packages you are about to bring in. [trevorlasn](https://www.trevorlasn.com/blog/npq-protects-npm-installs-from-malicious-packages)

5. Install in a clean environment and keep the lockfile frozen.
```bash
pnpm install --frozen-lockfile
pnpm test
```

6. Only then commit the lockfile and merge.

### Example 80/20 split
- **Step 1:** inspect the lockfile diff.
- **Step 2:** run Socket or `npq` on the newly introduced packages.
- **Step 3:** run `osv-scanner` plus your tests.  
That is usually the highest-value triage for a small OSS tool. [trevorlasn](https://www.trevorlasn.com/blog/npq-protects-npm-installs-from-malicious-packages)

## 4) Reviewing only what changed

The pnpm-friendly way is to treat `pnpm-lock.yaml` as the source of truth and review the diff for added or changed importers/packages, especially anything with scripts or exotic sources. pnpm documents protections like `allowBuilds`, `blockExoticSubdeps`, and `minimumReleaseAge`, which line up well with this diff-based review model. [pnpm](https://pnpm.io/supply-chain-security)

A practical pattern is:
- diff the lockfile in git,
- extract only added/changed package entries,
- flag new packages with install scripts,
- then scan just those package names/versions with your behavioral tool.  
This is especially effective because a dependency refresh usually changes only a small slice of the graph. [socket](https://socket.dev/features/cli)

If you want a quick manual heuristic, prioritize:
- any package with a new script,
- any package from a new maintainer or suddenly renamed namespace,
- anything with an exotic source,
- anything that was published very recently, even with cooldown. [socket](https://socket.dev/features/cli)

## 5) Provenance and signing

Provenance is now genuinely useful, but it is still **one signal**, not the whole answer. npm’s docs say provenance verification checks registry signatures and attestations, and npm provenance surfaces build environment, source commit, and workflow details for packages that have it. [docs.npmjs](https://docs.npmjs.com/viewing-package-provenance/)

In practice:
- **Good:** helpful for confirming a package version was produced from a specific source and CI workflow. [docs.npmjs](https://docs.npmjs.com/viewing-package-provenance/)
- **Not enough alone:** provenance does not prove the code is benign; it only helps verify that the artifact is genuine and traceable. [docs.npmjs](https://docs.npmjs.com/viewing-package-provenance/)
- **Still patchy:** availability varies by package, maintainer, and ecosystem maturity, so you cannot depend on it as universal coverage yet. [socket](https://socket.io/blog/npm-package-provenance/)

For a small project, provenance is worth using as an additional trust signal where available, especially for high-impact dependencies. `npm audit signatures` is the npm-supported verification path described in the docs. [docs.npmjs](https://docs.npmjs.com/viewing-package-provenance/)

## 6) Cost and effort tiers

| Tier | What to do | Effort per update | Free? |
|---|---|---:|---|
| Minimum | Keep your lockfile, use cooldown, run `pnpm install --frozen-lockfile`, run `osv-scanner`, eyeball the lockfile diff.  [pnpm](https://pnpm.io/supply-chain-security) | ~10–20 min | Yes |
| Better | Add Socket or `npq` on the changed packages before install, then frozen install and tests.  [trevorlasn](https://www.trevorlasn.com/blog/npq-protects-npm-installs-from-malicious-packages) | ~20–45 min | `npq` yes; Socket has both free and paid offerings/features. |
| Best | Add provenance/signature checks, Scorecard, and CI gates for lockfile diffs and suspicious scripts.  [docs.npmjs](https://docs.npmjs.com/viewing-package-provenance/) | ~45–90 min upfront, then low ongoing | Mostly yes, with some platform features possibly paid |

For your threat model, the best return is: **diff the lockfile, scan the new packages with a behavioral tool, and verify provenance where present**. That is the most proportionate setup for a one-person OSS CLI that wants to avoid obviously malicious dependency updates without turning maintenance into a second job. [docs.socket](https://docs.socket.dev/docs/socket-cli)

Would you like a concrete copy-pasteable shell script for the update checklist, tuned for pnpm 11?
