# AHQ-170 — Perplexity Q&A: supply-chain risk of enabling `node-pty` build scripts (Fix Option 1)

> Ticket: https://agentic-hq.atlassian.net/browse/AHQ-170
> Copy the **QUESTION** block into https://perplexity.ai, then paste the response into
> the **ANSWER** section at the bottom.

---

## QUESTION (paste this into Perplexity)

I need a current (2026), security-focused assessment of the **supply-chain attack risk**
of allowing one specific npm dependency's install/build scripts to run under pnpm.

### Background

- Project: an open-source Node.js CLI (TypeScript), package manager **pnpm 11**, Node
  22/24 LTS via nvm. Targets macOS (primary), Linux, WSL.
- pnpm 10/11 **blocks dependencies' lifecycle scripts** (`preinstall`/`install`/
  `postinstall`) by default as a supply-chain protection — they only run if explicitly
  allow-listed (e.g. via `pnpm approve-builds` / `onlyBuiltDependencies`, or in our
  repo a `allowBuilds` map in `pnpm-workspace.yaml`).
- Our config currently **disables** builds for three packages:
  ```yaml
  allowBuilds: { esbuild: false, node-pty: false, unrs-resolver: false }
  ```
- Consequence (bug AHQ-170): on **x86_64 Linux**, `node-pty@1.1.0` has no `linux-x64`
  prebuilt binary (it ships prebuilds only for darwin + win32) and, because its build
  script is disabled, it never compiles from source — so the CLI crashes at startup
  with "Failed to load native module: pty.node".
- node-pty's relevant scripts are:
  ```json
  "install": "node scripts/prebuild.js || node-gyp rebuild",
  "postinstall": "node scripts/post-install.js"
  ```

### The proposed fix I'm evaluating (Option 1)

Set `node-pty: true` in the `allowBuilds` map so pnpm runs node-pty's `install`/
`postinstall` scripts, which compile `pty.node` from source on Linux (the C toolchain —
`python3`, `make`, `gcc`/`g++`, node-gyp — is available).

### My questions

1. **How much does enabling this one package's build scripts actually increase
   supply-chain attack risk?** What is the concrete threat model — i.e. what can go
   wrong that *cannot* go wrong while scripts are blocked? (arbitrary code execution at
   `pnpm install` time on dev machines and CI, with the developer's privileges, etc.)

2. **Is the allow-list per-package and tightly scoped?** If I allow-list only
   `node-pty`, do *only* node-pty's own scripts run, while every other (including
   transitive) dependency's scripts stay blocked? Or does enabling builds widen the
   surface beyond that one package?

3. **How risky is `node-pty` specifically?** It's `@microsoft/node-pty` (Microsoft-
   maintained, very widely used — e.g. by VS Code). Does its provenance/maintenance/
   download profile make running its build scripts a low, medium, or high practical
   risk? What would a realistic compromise look like (e.g. a hijacked release / account
   takeover publishing a malicious `install` script)?

4. **Option 1 (compile from source) vs Option 2 (use a prebuilt-binary fork such as
   `@homebridge/node-pty-prebuilt-multiarch`) — which is safer from a supply-chain
   standpoint?** Option 2 keeps scripts disabled but means trusting an **opaque
   precompiled native binary** from a third-party fork (which can't be source-audited
   and is a smaller, less-scrutinised project). Compare: "run a reviewable build script
   from a reputable source" vs "download an unauditable prebuilt binary from a smaller
   maintainer." Which is the lower-risk choice, and why?

5. **If I go with Option 1, what are the best-practice mitigations** to minimise the
   added risk? e.g.: pin an exact version + rely on the lockfile integrity hash, review
   `scripts/prebuild.js` / `scripts/post-install.js` before each upgrade, keep the
   allow-list as small as possible, run installs in a sandbox/container on CI, use
   `--ignore-scripts` elsewhere, Dependabot/socket.dev/`npm audit signatures` /
   provenance attestation, etc. What's the recommended baseline?

6. **What do mature projects / the ecosystem generally do here** in 2026 — keep all
   dependency build scripts blocked and allow-list only vetted natives like node-pty?
   Prefer prebuilt binaries? Something else?

Please give a concrete, opinionated recommendation for whether Option 1 is an
acceptable risk for a package like node-pty, with reasoning, the threat model spelled
out, mitigations, and up-to-date sources where possible.

---

## ANSWER (paste Perplexity's response here)

Enabling `node-pty`’s build scripts is a **bounded, acceptable risk** for most mature projects that need native compilation on Linux, and it is materially safer than swapping to an opaque third-party prebuilt-binary fork. The main tradeoff is that you re-open a real install-time code-execution path for one vetted package, so the risk becomes “trusted native build code runs during install” rather than “all lifecycle scripts remain blocked”. [pnpm](https://pnpm.io/settings)

## Threat model

With build scripts blocked, `node-pty` cannot execute its `install` or `postinstall` code during `pnpm install`; the package can only be unpacked. With `node-pty` allowed, its scripts can run as the installing user on every dev machine and CI worker that installs the lockfile, and they can invoke `node-gyp rebuild` if a prebuilt binary is unavailable. That means the realistic new failure modes are: a malicious or compromised `node-pty` release runs arbitrary code at install time, exfiltrates secrets available to that user or CI job, tampers with build outputs, or uses the install context as a foothold for lateral movement; none of those require a runtime exploit because the code already executes during installation. [pnpm](https://pnpm.io/es/blog/2025/12/05/newsroom-npm-supply-chain-security)

## Scope of allow-listing

Yes, the allow-list is tightly scoped. pnpm’s `approve-builds` writes the approved packages into the `allowBuilds` map in `pnpm-workspace.yaml`, and the docs say only the mentioned packages are affected while the rest are left untouched. So if you set `node-pty: true`, you are only allowing `node-pty`’s own lifecycle scripts; other direct or transitive dependencies remain blocked unless they are separately allow-listed. [pnpm](https://pnpm.io/blog/releases/10.26)

## Risk of node-pty

`node-pty` is not a sketchy dependency in the ordinary sense: it is a long-running Microsoft-maintained package, widely used, and its install-time build behavior is documented and expected for native modules. That lowers practical risk compared with an obscure package, but it does not eliminate supply-chain risk; the realistic compromise is still a maintainer-account takeover, a malicious release, or a tampered release process that adds a harmful install script or ships a poisoned tarball. In other words, the package’s provenance makes it **medium-to-low practical risk**, not zero risk. [note](https://note.com/zephel01/n/n73971ecbda87?hl=en)

## Option 1 vs option 2

Option 1 is safer from a supply-chain standpoint than trusting a third-party prebuilt fork. A reviewable build script from a reputable upstream lets you inspect the source, pin the exact version, and rely on the lockfile integrity hash, whereas a fork such as `node-pty-prebuilt-multiarch` requires you to trust an opaque native binary plus a smaller maintainer ecosystem. The main downside of Option 1 is that the build script itself is executable code, but the upside is that the code path is transparent and reproducible from source; for security-sensitive teams, that usually beats “download an unauditable binary from a less-scrutinised fork”. [github](https://github.com/ionic-team/node-pty-prebuilt/blob/prebuild/package.json)

## Recommended mitigations

The best baseline is: keep the allow-list minimal, pin exact versions, keep the lockfile frozen, and review `node-pty`’s install-related files before each upgrade. Use CI and local installs in least-privilege sandboxes, and treat install-time scripts as part of your trusted computing base only for the few packages you explicitly approve. pnpm’s newer supply-chain controls are also worth enabling where practical: `minimumReleaseAge` defaults to 1440 minutes in v11, and `trustPolicy` / `trustLockfile` can add extra protection against fresh or trust-downgraded releases. For CI, pair `--frozen-lockfile` with a read-only or disposable environment; pnpm also documents `frozenStore` for read-only stores on Node 22.15+/23.11+/24+. [pnpm](https://pnpm.io/cli/approve-builds)

## What mature projects do

The current ecosystem direction is to block dependency scripts by default and explicitly allow only the few vetted native packages that truly need them. pnpm’s own model is built around that pattern, with `allowBuilds` for narrow approvals and a default posture that ignores unapproved build scripts. For native modules, mature projects generally prefer source builds from trusted upstream when feasible; prebuilt binaries are convenient, but they add an extra trust layer unless the release pipeline is strongly attested and widely audited. [npmjs](https://www.npmjs.com/package/node-pty-prebuilt-multiarch)

## Recommendation

For your case, I would choose **Option 1**: allow only `node-pty` to build, pin the version, keep every other package blocked, and run installs in controlled environments. Given that `node-pty` is a mainstream native dependency and the failure is specifically that Linux x64 needs a source build, the incremental risk is justified and smaller than replacing it with a third-party prebuilt fork. The residual risk is real but manageable, and the attack surface stays narrowly scoped to one known native package rather than a broader trust in opaque binaries. [github](https://github.com/microsoft/node-pty/issues/777)

<!-- END OF ANSWER -->