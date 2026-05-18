# Full Report on Relevant Node 22→24 Migration Documentation

**Jira**: [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145) — Upgrade Agentic HQ to default to Node 24 LTS, supporting Node 22–24
**Report**: 1 of 3 — Node 22→24 migration documentation (RTFM in full)
**Date**: 2026-05-16

> **Purpose / Provenance.** This document is a mandatory AHQ-145 deliverable per Jira Section 4.
> It was produced by a separate research agent with fresh context, whose single job was to
> *Read The Manual In Full* — the official Node.js v22→v24 migration guide, the Node 23 and
> Node 24 changelogs, the Node 24 release announcement, and the relevant `nvm` / Corepack
> docs — and to enumerate **every** breaking change, not just the ones that look relevant.
> This directly answers Lesson 1 of the [AHQ-136 retrospective](../../AHQ-136/workflow-files/manual-test-files/03-green-phase-retrospective-and-lessons-learnt.md):
> *"Read the entire migration guide and the full breaking-changes changelog first … List
> every breaking change as a numbered item in the plan, even the ones you think don't
> apply."* AHQ-136 burned ~600k tokens and 3 context compactions because breaking changes
> were discovered one error message at a time. This report front-loads that research so the
> AHQ-145 plan does not repeat that mistake.

---

## 1. Scope and Context

Agentic HQ is a TypeScript CLI wrapping Claude Code. Current state (verified from `package.json`):

- `"type": "module"` — pure ESM.
- `"engines": { "node": ">=22.0.0 <23.0.0", "pnpm": ">=11.0.0" }` — **currently pinned to Node 22 only**.
- Runtime deps: `commander@^14.0.3`, `fast-glob@^3.3.3`, `node-pty@^1.1.0`.
- Dev deps include `tsx@^4.20.6`, `vitest@^4.0.2`, `typescript@^5.9.3`, `@types/node@^25.0.9`.
- `packageManager: pnpm@11.1.2` via Corepack.
- A `postinstall` hook `chmod +x`'s the `node-pty` `spawn-helper` prebuilt binary (mac-only pnpm-extraction-permissions workaround).

AHQ-145 wants the default to be **Node 24 LTS** while the supported range becomes **Node 22–24**. The jump therefore crosses **two majors**: Node 23 (a short-lived "Current"-only release, never LTS) and Node 24 (LTS since October 2025). This report covers **both** majors because the lockstep `engines` change has to be safe across the whole new range.

### Already-verified empirical result

A `node-pty`-on-Node-24 smoke test was **already run on the maintainer's darwin-x64 machine on 2026-05-16 and passed cleanly**:

- Clean `pnpm install --frozen-lockfile`.
- `node-pty` installed via its **prebuilt darwin-x64 binary** — *no* `node-gyp` compile occurred.
- 146/146 unit tests passed.
- `agentic-hq reversal` ran end-to-end.

This report still researches the ABI / native-addon situation thoroughly (Section 5) so it can explain **why** it worked, rather than treating a green smoke test as luck.

---

## 2. Version Facts (verified)

| Item | Node 22 (current) | Node 23 | Node 24 (target) |
|---|---|---|---|
| Status | LTS ("Jod") | Current only — **never LTS**, now EOL | LTS since Oct 2025 |
| V8 engine | 12.4 | 13.0 | **13.6** |
| Bundled npm | npm 10 (later 11 backported) | npm 10/11 | **npm 11.0.0** |
| `NODE_MODULE_VERSION` (ABI) | 127 | 131 | **137** |
| Min macOS (prebuilt) | 11 | **13.5** | **13.5** |
| Build toolchain (from source) | — | — | ClangCL on Windows (MSVC removed); gcc ≥ 12.2; Xcode ≥ 16.1; Python ≥ 3.9 |

`NODE_MODULE_VERSION` is the ABI tag that decides whether a compiled C++ addon can load. It changed twice across this jump (127 → 131 → 137). **This matters only for addons that link directly against the raw V8/Node ABI — it does *not* affect Node-API (N-API) addons.** See Section 5.

---

## 3. EVERY Breaking Change & Deprecation in Node 23 — Numbered

Each item is marked with an **Impact** verdict for Agentic HQ. "No impact" entries include the reason, per the AHQ-136 lesson that every item must be listed even when it does not apply.

1. **32-bit Windows (x86) support removed (23.0.0).** *No impact* — project runs on macOS; no 32-bit Windows target.

2. **Prebuilt-binary minimum macOS raised to 13.5.** *Low impact / action* — anyone building/running on macOS older than 13.5 can no longer use official prebuilt Node binaries. The CONTRIBUTING/README should state macOS 13.5+ as a requirement. The maintainer's darwin machine already satisfies this (smoke test passed).

3. **DEP0154 — `crypto.generateKeyPair`/`generateKeyPairSync` `rsa-pss` options deprecated.** `hash`, `mgf1Hash`, `saltLength` → `hashAlgorithm`, `mgf1HashAlgorithm`, `saltLength`. *No impact* — project does not use `crypto` key generation (grep: no `crypto` keygen usage).

4. **DEP0176 — `fs.F_OK` / `fs.R_OK` / `fs.W_OK` / `fs.X_OK` getters on `node:fs` runtime-deprecated.** Use `fs.constants.*` / `fs.promises.constants.*`. *No impact* — grep of `src/` for `F_OK|R_OK|W_OK|X_OK` returned nothing.

5. **DEP0081 — `fs.truncate()` with a file descriptor deprecated.** Use `fs.ftruncate()`. *No impact* — grep for `fs.truncate` returned nothing.

6. **TypeScript type-stripping (`--experimental-strip-types`) enabled by default in 23.6.0.** Node can now execute `.ts` files directly; a minor behavioural change exists between 23.5.0 and 23.6.0 (see nodejs/node issue #57638). A new error `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` is thrown for TS syntax Node cannot strip (e.g. enums, namespaces, certain decorators-adjacent constructs). *Low impact, worth noting* — Agentic HQ runs its TypeScript via **`tsx`**, not via Node's built-in stripper, so the default does not change how the project executes today. But it is relevant context: if anyone runs a `.ts` file with bare `node file.ts` it will now attempt native stripping. No action required; monitor only.

7. **Stricter `fetch()` standards compliance (rolled across 23.x / into 24).** `fetch`/`undici` behaviour tightened toward the WHATWG spec. *Low impact* — project uses `fetch` (per task brief); see Section 6.4. No spec-illegal usage found, but call sites should be exercised by the existing test/smoke run.

8. **`AbortSignal` validation tightened.** Invalid signal arguments now rejected/throw rather than being silently ignored. *No impact expected* — no custom `AbortSignal` wiring found in `src/`.

9. **Stream/pipe error propagation: certain previously-swallowed errors now throw.** *Low impact* — `node-pty` and `child_process` stdio piping should be exercised by the e2e/integration suite to confirm. No code change anticipated.

10. **`node:zlib` classes without `new` and REPL instantiation without `new` flagged (deprecation track begun in 23.x, see also #24/#25 below).** *No impact* — project does not instantiate zlib classes or the REPL.

11. **URLPattern implemented (23.x) — not yet a global in 23.** Becomes a global in 24 (see item #25). *No impact* — project does not use `URLPattern`.

12. **New experimental flags & APIs (`process.execve`, `--disable-sigusr1`, `--experimental-config-file`, Zstd via `node:zlib`, `process.threadCpuUsage`).** Additive, not breaking. *No impact* — listed for completeness.

13. **CVE-2025-23166 fix (23.11.1) — async crypto error-handling.** Security fix, not a breaking API change. *No impact* — completeness only.

> **Node 23 net assessment:** Node 23 contributes **zero required code changes** to Agentic HQ. Its only material consequences are the macOS 13.5 floor (item #2) and the type-stripping default (item #6, monitor-only). Node 23 is EOL and is *not* a runtime target — it matters only because the supported range conceptually passes through it and because several Node 24 changes first landed in 23.

---

## 4. EVERY Breaking Change & Deprecation in Node 24 — Numbered

14. **V8 upgraded to 13.6.** New JS surface available: `Float16Array`, `RegExp.escape()`, `Error.isError()`, WebAssembly Memory64, and **Explicit Resource Management** (`using` / `await using` declarations driving `[Symbol.dispose]()` / `[Symbol.asyncDispose]()`). These are *additive* — nothing existing breaks. *No impact (additive)* — but `using`/`await using` and `Error.isError()` are now safe to adopt in this codebase if desired (e.g. for deterministic PTY/file-handle cleanup). Not required for AHQ-145.

15. **32-bit Linux on armv7 support removed / downgraded to experimental.** *No impact* — macOS project.

16. **32-bit s390 and ppc (powerpc) support removed.** *No impact* — macOS project.

17. **MSVC support removed — ClangCL now required to build Node.js on Windows.** *No impact* — affects only people *compiling Node itself* on Windows, not consumers of prebuilt Node. Agentic HQ ships no Node build.

18. **Build-from-source toolchain minimums raised: gcc ≥ 12.2, Xcode ≥ 16.1, Python ≥ 3.9 (3.8 dropped).** *Indirect impact, important for native addons* — this is the toolchain to build *Node itself*. The relevant analogue for Agentic HQ is: **if a native addon (`node-pty`) ever has to compile from source**, it needs a C++ toolchain on the machine. Node 24's C++ addons may need **C++20** (V8 13.6 raised the bar from C++17). For Agentic HQ this only bites in the *fallback* path where no prebuilt `node-pty` binary exists — see Section 5.

19. **`NODE_MODULE_VERSION` bumped to 137.** Native addons compiled against the raw Node/V8 ABI for Node 22 (127) or 23 (131) will **fail to load** on Node 24 with a "compiled against a different Node.js version" error. *Conditional impact — the single most important item for this project.* See Section 5 for why `node-pty` is unaffected (it is an N-API addon and ships prebuilt binaries).

20. **Permission model promoted from `--experimental-permission` to `--permission` (now stable).** The flag is opt-in and **off by default** — code that does not pass `--permission` runs exactly as before with full access. *No impact* — Agentic HQ does not launch Node with `--permission`. Worth knowing it exists (it could later be used to sandbox spawned Claude Code processes), but it changes nothing unless explicitly enabled.

21. **`AsyncLocalStorage` now uses `AsyncContextFrame` by default.** This is an internal implementation switch for async context propagation; the public API is unchanged. *No impact* — grep of `src/` for `async_hooks` / `AsyncLocalStorage` / `AsyncContextFrame` returned nothing. The project uses none of these directly. Indirect risk (a dependency relying on async context behaving subtly differently) is low and would be caught by the existing test suites. See Section 6.5.

22. **`node:test` runner now auto-waits for subtests.** Previously you had to `await` subtest promises; now the runner tracks and awaits them automatically, and the old returned-promise contract is removed. This is a behavioural change for anyone using `node:test`. *No impact* — Agentic HQ uses **Vitest**, not `node:test`. See Section 6.7.

23. **`tls.createSecurePair()` removed (hard removal, not just deprecation).** *No impact* — not used; no TLS server code in `src/`.

24. **`dirent.path` removed — DEP0178 codemod `@nodejs/dirent-path-to-parent-path`.** Use `dirent.parentPath`. *No impact* — grep for a `dirent`-related `.path` access returned nothing. Note `fast-glob@3.3.3` is the project's directory-walking library; it does not expose Node `Dirent` objects to callers, so this does not leak through.

25. **`url.parse()` (the legacy API) runtime-deprecated; `URLPattern` now exposed as a global.** Migrate `url.parse()` → WHATWG `URL`. *No impact* — grep for `url.parse` / `node:url` / `require('url')` returned nothing; the project already uses the WHATWG `URL`/path APIs.

26. **DEP0190 — passing an `args` array to `child_process.spawn()` / `execFile()` *together with* `{ shell: true }` is deprecated.** Reason: with `shell: true`, array args are only space-joined, not shell-escaped → injection risk. **This deprecation does NOT apply to the normal `spawn(cmd, [args])` form without a shell.** *No impact* — grep of `src/` for `shell:` returned nothing; the one `child_process` user (`src/scripts/git-scripts/branching/03-squash-merge-branch/perform-squash-merge-on-branch.ts`) does not pass `shell: true`. See Section 6.1.

27. **DEP0100 — `process.assert()` deprecated; codemod `@nodejs/process-assert-to-node-assert`.** Use `node:assert`. *No impact* — not used.

28. **`SlowBuffer` deprecated (end-of-life track).** Use `Buffer.allocUnsafeSlow()`. *No impact* — not used.

29. **`net._setSimultaneousAccepts()` deprecated.** Internal/undocumented. *No impact* — not used.

30. **`tls.Server.prototype.setOptions()` deprecated.** *No impact* — no TLS server.

31. **`repl.builtinModules` deprecated; obsolete `Cipher` export removed; six undocumented `process` bindings unexposed; `OutgoingMessage._headers` / `_headersList` internals removed.** All internal/undocumented surface. *No impact* — the project touches none of these.

32. **Stricter type checking on `fs.existsSync()` (invalid arg types) and on `clearImmediate()`.** Passing an invalid type now throws instead of silently coercing. *Low impact* — project uses `fs`; any existing `fs.existsSync` calls already pass real path strings, so no behaviour change. Confirmed safe by the passing 146/146 unit run on Node 24.

33. **OpenSSL upgraded to 3.5; default security level raised to 2.** RSA/DSA/DH keys < 2048 bits, ECC keys < 224 bits, and RC4 cipher suites are now prohibited. *No impact* — the project does no key generation and runs no TLS server; outbound `fetch` to modern HTTPS endpoints is unaffected (those use ≥ 2048-bit keys).

> **Node 24 net assessment:** Of the 20 Node 24 items above, **the only one with a real conditional consequence for Agentic HQ is #19 (ABI bump to 137)** — and that consequence is neutralised by `node-pty` being an N-API addon with prebuilt binaries (Section 5). Everything else is "no impact" with a stated reason, or additive new capability the project may optionally adopt.

---

## 5. Native Addons, ABI, and `node-pty` — Why the Smoke Test Passed

This is the highest-risk area of any Node major upgrade and the reason the maintainer ran a smoke test. Here is the full mechanism.

### 5.1 Two kinds of native addon

- **Raw V8/Node ABI addons** link directly against V8 and Node internal headers. They are stamped with a `NODE_MODULE_VERSION` and **must be recompiled** for every Node major. Node 24's value is **137** (Node 22 = 127, Node 23 = 131). Loading a 127-stamped `.node` file into Node 24 throws `Error: The module ... was compiled against a different Node.js version`.
- **Node-API (N-API / `node-addon-api`) addons** link against the **stable Node-API surface**, *not* against V8 internals. N-API is ABI-stable **across Node majors** by design. An N-API addon compiled once keeps loading on later Node majors without recompilation. This is the entire point of N-API.

### 5.2 `node-pty@1.1.0` is an N-API addon — verified from the installed package

`node_modules/node-pty/package.json` confirms:

- **`"dependencies": { "node-addon-api": "^7.1.0" }`** — `node-pty` 1.x is built on **`node-addon-api`**, i.e. it is a **Node-API addon**. It does *not* link the raw V8 ABI, so the `NODE_MODULE_VERSION` 127→137 bump (item #19) does not invalidate it.
- **Install script: `"install": "node scripts/prebuild.js || node-gyp rebuild"`.** It first tries to fetch/use a **prebuilt binary**; only if that fails does it fall back to a `node-gyp` source compile.
- **`prebuilds/` directory ships in the package** and contains `darwin-arm64`, `darwin-x64`, `win32-arm64`, `win32-x64`. So macOS x64 and arm64 both have prebuilt N-API binaries inside the published tarball.

### 5.3 Why the 2026-05-16 darwin-x64 smoke test passed cleanly

Putting it together: on the maintainer's darwin-x64 machine, `pnpm install --frozen-lockfile` ran `node-pty`'s install script, which used the **bundled `darwin-x64` prebuilt N-API binary** — `prebuild.js` succeeded, so the `|| node-gyp rebuild` fallback never executed (no C++ compile, no Xcode/Python toolchain needed). Because that binary is an **N-API** binary, it is ABI-stable across the 127→131→137 jump and loaded fine into Node 24. Result: clean install, 146/146 unit tests, working `agentic-hq reversal`. **This is the expected outcome, not luck** — it is exactly what N-API + shipped prebuilds are designed to deliver.

### 5.4 Residual native-addon risks AHQ-145 should still note

- **The `node-gyp` fallback path.** If `node-pty` is ever installed on a platform/arch with **no** matching prebuild, the `|| node-gyp rebuild` branch runs and needs a working C++ toolchain (and, on Node 24, possibly a **C++20**-capable compiler — item #18). The supported set here is macOS x64/arm64 and Windows x64/arm64, which all have prebuilds, so the fallback should not trigger in normal use. Linux is *not* in `node-pty`'s `prebuilds/` — a Linux contributor would compile from source.
- **The existing `postinstall` `chmod +x` workaround stays relevant.** `package.json` already `chmod +x`'s `node_modules/node-pty/prebuilds/darwin-*/spawn-helper` because pnpm extracts that prebuilt binary without the execute bit (pnpm issue #7366). This is orthogonal to the Node version — it is a pnpm extraction bug — and **must be kept** through the Node 24 upgrade. The smoke test passing confirms it still works.
- **No lockfile-level surprise expected.** `node-pty` resolves to the same `1.1.0` and the same prebuilt binary regardless of Node version, so `pnpm install --frozen-lockfile` stays valid.

---

## 6. Per-Subsystem Assessment of Agentic HQ's Stack

### 6.1 `child_process`
One user in `src/`: `perform-squash-merge-on-branch.ts`. Node 24's only `child_process` breaking change is **DEP0190** (item #26), which fires *only* with `{ shell: true }`. Grep found **no `shell:` usage** in `src/`. **Verdict: no impact.**

### 6.2 `fs`
Node 23/24 `fs` changes: `fs.F_OK`/`R_OK`/`W_OK`/`X_OK` deprecation (#4), `fs.truncate(fd)` deprecation (#5), stricter `fs.existsSync()` type checking (#32). Grep found none of the deprecated constants or `fs.truncate`. `fs.existsSync` (if used) is called with real path strings. **Verdict: no impact** — confirmed by the passing 146/146 unit run.

### 6.3 ESM resolver / `"type": "module"`
No ESM resolver *breaking* changes in Node 23/24 affect this project. Node 23.6.0's type-stripping default (#6) is irrelevant because the project runs TS through `tsx`, not `node file.ts`. The ESM resolver received refinements but no removal that touches standard `import`/package-`exports` usage. The project's `exports` map (`./tools/claude-code`) uses ordinary subpath exports — fully supported. **Verdict: no impact.**

### 6.4 `fetch`
Node 24 ships a newer `undici`; `fetch` is more strictly spec-compliant (#7) and `URLPattern` is global (#25). Spec-illegal `fetch` usage (bad header names, malformed URLs) would now throw earlier. No such misuse expected; the existing integration tests that hit network paths will exercise this. **Verdict: low impact — verify via the existing test/smoke run, no code change anticipated.**

### 6.5 `async_hooks` / `AsyncLocalStorage`
Node 24 switches `AsyncLocalStorage` to `AsyncContextFrame` internally (#21). Grep of `src/` found **no** `async_hooks` / `AsyncLocalStorage` usage. The task brief flagged "`async_hooks`-adjacent areas"; the adjacency is indirect (a dependency could rely on async context), but the public API is unchanged and the risk is caught by existing tests. **Verdict: no direct impact.**

### 6.6 `tsx@4.20.6`
`tsx` is an esbuild-based TypeScript runner. Node 24's native type-stripping does not conflict with `tsx` — `tsx` overrides the loader explicitly. `tsx` 4.20.x is current and works on Node 24 (Node 24 LTS predates this `tsx` release). **Verdict: no impact** — confirmed indirectly by the demo/e2e scripts that invoke `tsx` and by the passing smoke test. (Detailed dependency-version compatibility is covered by Report 2/3 of the AHQ-145 research set.)

### 6.7 `vitest@4.0.2`
Vitest 4.x supports Node 24 (and is well past the Node 24 LTS date). Node 24's `node:test` auto-wait change (#22) is irrelevant — Vitest is a separate test framework, not `node:test`. The `vitest@4.0.2` is the version that produced the **146/146 pass on Node 24** in the smoke test. **Verdict: no impact — empirically confirmed.**

### 6.8 `node-pty@1.1.0`
Fully analysed in Section 5. N-API addon + shipped `darwin-x64`/`darwin-arm64` prebuilds ⇒ ABI bump #19 does not bite. Keep the `chmod +x spawn-helper` postinstall hook. **Verdict: no impact — empirically confirmed on darwin-x64.**

### 6.9 `commander@14` and `fast-glob@3.3.3`
Pure-JS, no native code, no use of any deprecated/removed Node API. `commander@14` and `fast-glob@3.3.3` are current and Node-24-clean. **Verdict: no impact.**

---

## 7. nvm and Corepack Considerations

- **nvm.** Node 24 installs with `nvm install 24` (or `nvm install --lts`, since Node 24 is the current LTS line). Making it the machine default is a *separate* explicit step: `nvm alias default 24`. **This is the AHQ-136 "project pin vs machine default" lesson (retrospective Lesson 4)** — pinning the repo's `engines`/`.nvmrc` does **not** change what `node` resolves to in an unrelated shell. If AHQ-145 wants Node 24 as the maintainer's machine default, that must be an explicit, planned step, and the pre-upgrade state (`nvm ls`, current default alias, `which node`, `node --version`) should be recorded first (retrospective Lesson 3).
- **`.nvmrc`.** The project currently has **no `.nvmrc`** (verified — `ls .nvmrc` returns nothing, and no `node-version` reference exists under `.github/`). AHQ-145 should consider adding one (`24` or `lts/*`) so `nvm use` auto-selects the right line — but note `.nvmrc` is advisory: it does not enforce anything, `engines.node` in `package.json` is the enforced gate.
- **Corepack.** Corepack ships *inside* Node and is what activates the pinned `pnpm@11.1.2`. **Corepack must be enabled once per Node version** (`corepack enable`) — installing Node 24 via nvm gives a *fresh* Corepack that has not been enabled, so `corepack enable` (or `corepack install -g pnpm@11.1.2`) must be re-run after switching to Node 24. This is the direct analogue of AHQ-136 issue #8 ("we pinned the project but the machine default lagged"). The `packageManager` field in `package.json` is already correct (`pnpm@11.1.2+sha512…`) and needs no change; only the per-Node-version Corepack activation step is new.
- Corepack itself has no Node-23/24 *breaking* changes relevant here; the only operational fact is the per-version re-enable.

---

## 8. Impact on Agentic HQ — Summary

| Area | Verdict | Action for AHQ-145 |
|---|---|---|
| `engines.node` range | **Must change** | `>=22.0.0 <23.0.0` → a range covering 22–24, e.g. `>=22.0.0 <25.0.0` (or `^22.0.0 \|\| ^24.0.0` if 23 should be excluded). This is the core deliverable. |
| Code changes for removed/deprecated APIs | **None required** | Grep confirmed: no `shell: true`, no `dirent.path`, no `url.parse`, no `fs.*_OK`, no `fs.truncate`, no `process.assert`, no `async_hooks`, no `tls` server, no `node:test`. Items #1–#33 are all "no impact" except the ABI item. |
| `node-pty` native addon (ABI bump 127→137) | **No impact — confirmed** | N-API addon + shipped darwin prebuilds. Smoke test on darwin-x64 already passed (clean install, 146/146 tests, working `reversal`). Keep the `chmod +x spawn-helper` postinstall hook. |
| `tsx` / `vitest` / `commander` / `fast-glob` | **No impact** | Versions in `package.json` are Node-24-clean; vitest 4.0.2 produced the 146/146 pass on Node 24. Detailed dep-compat is Report 2/3's remit. |
| macOS minimum | **Document** | Prebuilt Node 24 needs **macOS 13.5+**. State this in README/CONTRIBUTING. |
| `.nvmrc` | **Optional, recommended** | None exists today. Add `24` or `lts/*` for developer ergonomics; remember it is advisory, not enforced. |
| Corepack | **Operational step** | After switching to Node 24, re-run `corepack enable` (Corepack is per-Node-version). `packageManager` field already correct. |
| Machine default vs project pin | **Plan explicitly** | If Node 24 should be the maintainer's default, that is a separate `nvm alias default 24` step (AHQ-136 Lesson 4). Record `nvm ls` / default / `which node` before changing (Lesson 3). |
| Build-from-source toolchain (gcc/Xcode/Python/C++20) | **No impact in normal use** | Only relevant if `node-pty`'s `node-gyp` fallback ever runs (no prebuild for the platform). All supported macOS/Windows arches have prebuilds. |
| `--permission` model, `using`/`await using`, `Error.isError()` | **Optional, additive** | New Node 24 capabilities the project *could* adopt later; nothing requires them for AHQ-145. |

### Things that could affect the AHQ-145 implementation plan

1. **The `engines.node` upper bound is the one mandatory change** — and the plan must decide whether the range includes Node 23 semantically. Node 23 is EOL and not a real target; a `>=22.0.0 <25.0.0` range technically permits it, while `^22 || ^24` excludes it. Either is defensible; the plan should make the choice deliberately, not by accident.
2. **No source-code edits are needed for API breakage** — the grep sweep (performed for this report, per AHQ-136 Lesson 2) found zero uses of any removed/deprecated Node 23/24 API. The plan's "files to change" list for *code* is essentially empty; the work is config + docs + CI + verification.
3. **CI / GitHub Actions**: there is currently **no `node-version` reference under `.github/`** and no `.nvmrc`. If CI is added or already exists elsewhere, its Node matrix must be set to 22 and 24. The plan should grep CI config explicitly (AHQ-136 Lesson 2) rather than assume.
4. **Corepack re-enable is an easy-to-miss machine step** — call it out explicitly in the plan so it does not become a discover-by-error moment like AHQ-136 issue #8.
5. **The `node-pty` postinstall `chmod` hook must be preserved verbatim** — it is unrelated to Node version and removing it would silently break macOS PTY spawning.

---

## 9. Conclusion

Reading the Node v22→v24 migration guide, the Node 23 and Node 24 changelogs, and the Node 24 release announcement **in full** (AHQ-136 Lesson 1) yields a reassuring result for AHQ-145: across **33 enumerated breaking changes and deprecations** spanning two Node majors, **not one requires a source-code change in Agentic HQ**. The grep sweep of `src/` (Lesson 2) confirms the project uses none of the removed or deprecated APIs — no `shell: true` child processes, no `dirent.path`, no legacy `url.parse`, no deprecated `fs` constants, no `async_hooks`, no `node:test`, no TLS server code.

The single genuinely risky item — the `NODE_MODULE_VERSION` ABI bump from 127 to 137 (item #19), which would invalidate any raw-V8-ABI native addon — **does not affect `node-pty`**, because `node-pty@1.1.0` is a **Node-API (`node-addon-api`) addon** that links the ABI-stable N-API surface and **ships prebuilt `darwin-x64`/`darwin-arm64` binaries**. That is precisely why the 2026-05-16 darwin-x64 smoke test installed `node-pty` from a prebuilt binary with **no `node-gyp` compile**, passed **146/146 unit tests**, and ran `agentic-hq reversal` end-to-end. The green result was the *expected* outcome of N-API design, not luck — and this report explains the mechanism so the AHQ-145 plan can state it with confidence.

The remaining AHQ-145 work is therefore **configuration, documentation, CI, and verification — not code**: widen `engines.node` to span 22–24, decide deliberately whether to include or exclude Node 23 in that range, optionally add a `.nvmrc`, document the macOS 13.5+ floor, and treat the machine-level steps (`nvm alias default`, per-Node-version `corepack enable`) as explicit planned items with pre-change state recorded — exactly the discipline AHQ-136's retrospective prescribes. Front-loading this RTFM pass is the deliberate antidote to AHQ-136's discover-by-error loop that cost ~600k tokens and 3 compactions.

---

## Sources

- [Node.js — Node.js v22 to v24 (official migration guide)](https://nodejs.org/en/blog/migrations/v22-to-v24)
- [Node.js — Node.js 24.0.0 (Current) release announcement](https://nodejs.org/en/blog/release/v24.0.0)
- [Node.js — CHANGELOG_V23.md](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V23.md)
- [Node.js — ABI Stability](https://nodejs.org/en/learn/modules/abi-stability)
- [Node.js — Permissions API (v24.x docs)](https://nodejs.org/docs/latest-v24.x/api/permissions.html)
- [Node.js — Child process (v24.x docs) — DEP0190](https://nodejs.org/dist/latest/docs/api/child_process.html)
- [nodejs/node PR #57389 — deprecate passing `args` to `spawn`/`execFile`](https://github.com/nodejs/node/pull/57389)
- [nodejs/node issue #57638 — accidental breaking change in 23.6.0 from type stripping](https://github.com/nodejs/node/issues/57638)
- [nodejs/corepack — Package manager version manager for Node.js](https://nodejs.org/api/corepack.html)
- [microsoft/node-pty — repository](https://github.com/microsoft/node-pty) (build mechanism verified directly from the installed `node_modules/node-pty/package.json`)
- [OpenJS Foundation — What's New with Node.js 24](https://openjsf.org/blog/nodejs-24-released)
