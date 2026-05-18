# Perplexity Q&A — AHQ-145: is pnpm bug #7366 (`node-pty` `spawn-helper` not executable) fixed in pnpm 11?

## Purpose / Provenance

Supporting research artefact for Jira **AHQ-145** (Node 24 LTS upgrade). Raised because the
`postinstall` `chmod +x spawn-helper` hook in root `package.json` (lines 14–15) was being marked
"preserve verbatim" in the implementation plan, and AHQ-136 (the pnpm 10→11 upgrade) had explicitly
left open the question of whether pnpm 11 still needs this workaround. The Perplexity MCP was not
available, so the question was answered by the maintainer pasting it into perplexity.ai (2026-05-17).

## Context

A TypeScript CLI project uses `node-pty@1.1.0` and pnpm `11.1.2` (via Corepack) on macOS. It carries
a `postinstall` workaround: `chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper`. The
workaround was added (commit `40640a1`, 2026-01-24, under AHQ-23) when the project was on pnpm
10.28.1, to fix `Error: posix_spawnp failed` caused by pnpm extracting the prebuilt `spawn-helper`
binary without the execute bit. Question: can the workaround now be removed on pnpm 11?

## Question asked

> I have a Node.js project on macOS using pnpm 11.1.2 and the `node-pty` package (v1.1.0). It carries
> a `postinstall` workaround that runs `chmod +x` on `node_modules/node-pty/prebuilds/darwin-*/spawn-helper`,
> because pnpm was extracting that prebuilt native binary without its executable file mode — causing
> `node-pty` to fail at runtime with `Error: posix_spawnp failed`. This is tracked as **pnpm issue
> #7366** on GitHub.
>
> Questions:
> 1. What exactly is pnpm GitHub issue #7366 — does pnpm fail to preserve the executable file mode on
>    files inside a package (e.g. prebuilt binaries) when it extracts/links packages into its
>    content-addressable store and `node_modules`?
> 2. What is the current status of pnpm #7366 — open, fixed, or closed? If fixed, in which pnpm version?
> 3. Is the bug fixed as of pnpm 11.x (ideally 11.1.2 or earlier)? From which pnpm version onward is a
>    manual `chmod +x` postinstall workaround no longer needed?
> 4. Did pnpm 11's store/installation changes affect executable-bit preservation for prebuilt native binaries?
> 5. Are there related pnpm issues about executable-bit / file-mode preservation for native addon binaries?
> 6. Is there anything about `node-pty` 1.1.0's own packaging on recent Node versions that interacts with this?
>
> Please give a clear verdict on whether the `chmod +x spawn-helper` postinstall workaround is still
> required with pnpm 11.x, with version numbers and sources.

## Perplexity's Answer

The chmod workaround still appears to be needed for **pnpm 11.1.2** in the specific
`node-pty`/`spawn-helper` case, because the underlying pnpm permission bug was reported in `pnpm`
issue #7366 and is still open there in the source I found; I did not find evidence that it was fixed
in pnpm 11.x. The more general executable-permission preservation bug for binaries restored from
pnpm's store is also documented in pnpm issue #8546, and that issue shows a separate fix landed for a
**side-effects-cache**-related executable-bit problem, but not a clear closure of #7366 itself.

**What #7366 was.** Issue #7366 is a permission-denied / executable-bit problem reported against pnpm
8.11.0, where installation/linking could produce files that were not executable when the package
expected them to be, leading to runtime failures such as `EACCES` or "permission denied" during
package use. That fits the description of a prebuilt helper binary losing its execute bit when pnpm
extracts or links it into `node_modules` from the content-addressable store.

**Current status.** From the pnpm issue page retrieved, #7366 is still marked **Open**. No newer
authoritative pnpm release note or closing comment was found showing #7366 was fixed and shipped in a
specific version. Safest status: **open / not clearly fixed**.

**pnpm 11.x impact.** No evidence found that pnpm 11.1.2 or earlier fixed #7366 specifically. The only
pnpm 11 material found was the 11.1 release announcement, which lists unrelated changes and does not
mention executable-bit preservation for stored packages. Do not treat pnpm 11.x as a version line
where the `chmod +x` workaround is guaranteed unnecessary for this `node-pty` setup.

**Related pnpm permission bugs.** Closely related issue #8546 concerns a post-installed binary losing
executable permissions on reinstall from the pnpm store, triggered by `postinstall` plus restrictive
umask behavior; a fix was committed for detecting executables in the side-effects cache. It also
notes `pnpm pack` / `pnpm publish` could strip executable permissions from the archive.

**node-pty interaction.** For `node-pty`, the failure mode is that its macOS `spawn-helper` needs
execute permission; without it, `posix_spawnp failed` is the expected runtime symptom. A newer
node-pty issue explicitly describes "spawn-helper shipped without execute bit in npm tarball causes
posix_spawnp failures (pnpm)", confirming this failure class is actively recognised.

**Verdict.** **Yes, keep the `chmod +x spawn-helper` postinstall workaround on pnpm 11.1.2** unless
the helper has been independently verified to arrive executable in the install path. No pnpm version
where #7366 is definitely fixed could be verified; the evidence does not support removing the
workaround in pnpm 11.x generally. Most conservative stance: treat the workaround as still required
until the upstream pnpm issue is closed with a release note tied to a version in use.

Sources cited by Perplexity: pnpm issues #7366 / #8546 / #11579 (github.com/pnpm/pnpm), the pnpm 11.1
release blog (pnpm.io/blog/releases/11.1), and node-pty issue #670 (github.com/microsoft/node-pty).

## Decision

**Keep the `postinstall` `chmod +x spawn-helper` hook (root `package.json` lines 14–15) verbatim.**
pnpm bug #7366 is not confirmed fixed in pnpm 11.x, so the workaround is still required on the
project's pnpm 11.1.2. This **confirms** the AHQ-145 implementation plan's existing stance
(Requirement 24: "preserve verbatim — do NOT touch"). Removing the hook is **not** done in AHQ-145.
If pnpm later closes #7366 with a release-note-backed fix, removing the hook can be revisited as a
separate pnpm-maintenance follow-up — out of scope for this Node-24 upgrade.
