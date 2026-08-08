# AHQ-196 — Implementation Plan

> Tracer Bullet: prove a prebuilt, npm-installed agentic-hq runs `agentic-hq list` and a full
> non-interactive math-workflow from a clean directory, with the cloned repo out of the picture.

## The Core Design Decisions (read this first)

**Import resolution — mechanism (c), package self-reference.** The compiled math-workflow JS is
emitted under `dist/` **inside the agentic-hq package** (not into the skill's `ts-workflow/` dir).
Walking up from `dist/…/math-workflow-demo-cli.js`, the nearest `package.json` is the **root
manifest** (`"name": "agentic-hq"` + `exports`), so Node package self-reference resolves
`import 'agentic-hq/tools/claude-code'` against the root `exports` map — which, in the shipped
artifact, points at compiled `dist/` JS. This also dissolves the "nested `package.json` must not
ship as-is" wrinkle: the nested manifest still ships inside `.agentic-hq/` but is never an ancestor
of the compiled JS, and npm ignores nested manifests at install time. `commander`/`node-pty`/
`fast-glob` resolve by Node's normal upward `node_modules` walk. No bundler, no import rewriting,
no new devDependency.

**Dev stays untouched via `pnpm pack` + `publishConfig` overrides.** Two facts collide: the dev
`exports` map must keep pointing at `.ts` source (all other workflows still run via symlink + tsx),
and the dev `bin` must keep launching tsx — but the shipped artifact needs both pointing at
compiled JS. pnpm's documented `publishConfig` field overrides `bin`/`exports` (among others) **at
pack time only**: the working-tree manifest is untouched; the tarball's manifest gets the prebuilt
values. So we pack with **`pnpm pack`** (npm's packer does not apply these overrides).

> ⚠️ **Deviation from the brief's AC wording:** the AC says "`npm pack` tarball". This plan uses
> `pnpm pack` (contributor-side only — pnpm is already the contributor toolchain) to produce the
> tarball, which is then **installed with npm** into the temp prefix. The alternative (keep
> literal `npm pack`) would need a script that temporarily rewrites `package.json` around the pack
> — hackier. Please confirm you accept `pnpm pack` here.

HUMAN: I confirm I accept `pnpm pack`

**A minimal `files` whitelist is unavoidable.** `dist/` is gitignored (`.gitignore:92`), and with
no `files` field the packer excludes gitignored paths — the tarball could never contain the build
output. `files: ["bin", "dist", "scripts/run-workflow.cjs", ".agentic-hq"]` fixes that (the
`files` field wins over `.gitignore`). The runner is whitelisted as a single file, not the whole
`scripts/` dir — `scripts/mcp-scripts/` is a dev-machine installer that must not ship (Perplexity
flagged the whole-dir risk; verified against the actual dir contents). This pre-does a slice of
AHQ-198 (it also drops `tests/`, `src/`, dev configs and
the pnpm-only `.npmrc` from the tarball as a side-effect); AHQ-198 still owns hygiene proper
(`steve-test-plugin` exclusion, un-private, publish guards). Recorded as a finding.

## File Map — What's New, What Changes, What Ships

Markers: `[NEW]` created by this ticket · `[MODIFIED]` edited by this ticket · `[GENERATED]`
build output, never committed · `[LEGACY]` mechanism being retired. **No files are deleted in
this ticket** — the only legacy things going away *now* are inside the math-workflow SKILL.md;
the rest are marked and retired by later sub-tasks.

```
agentic-hq/  (repo root = the npm package root)
├── package.json                        [MODIFIED] + "build" script, + "files" whitelist,
│                                       + "publishConfig" (prebuilt bin/exports, tarball-only)
├── tsconfig.json                       (untouched — dev typecheck config, noEmit)
├── tsconfig.build.json                 [NEW] emit config: compiles src/** + the math
│                                       workflow → dist/
├── bin/
│   ├── agentic-hq.cjs                  (untouched — dev entry point, runs TS via tsx)
│   └── agentic-hq-prebuilt.cjs         [NEW] shipped entry point: sets the env var, then
│                                       dynamic-imports dist/src/cli/main.js (plain node)
├── scripts/
│   ├── mcp-scripts/…                   (existing dev-machine installer — NOT shipped)
│   └── run-workflow.cjs                [NEW] minimal shared runner:
│                                       --ahq-package-root= + --workflow-js= + passthrough
│                                       args → runs the compiled workflow JS under node
├── src/…                               (untouched — the 65-file CLI source the build compiles)
├── dist/                               [GENERATED] by `pnpm build`; gitignored; ships in
│   │                                   the tarball via the `files` whitelist
│   ├── src/…                           compiled CLI JS (cli/main.js + the whole graph)
│   └── .agentic-hq/…/math-workflow/ts-workflow/src/
│       └── math-workflow-demo-cli.js   compiled workflow JS — imports
│                                       'agentic-hq/tools/claude-code' via package
│                                       self-reference against the root manifest
├── .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/
│   ├── SKILL.md                        [MODIFIED] now returns the run-workflow.cjs command
│   │                                   [LEGACY, gone now] the old returned command:
│   │                                   `pnpm install` + `ln -sfn` + tsx
│   └── ts-workflow/
│       ├── src/math-workflow-demo-cli.ts  (untouched — the source the build compiles)
│       ├── package.json                [LEGACY, stays for now] its `link:` dep is unused on
│       │                               the prebuilt path and inert in the tarball; retired
│       │                               when later sub-tasks lock the pattern down
│       └── pnpm-lock.yaml, pnpm-workspace.yaml, .npmrc, tsconfig.json
│                                       (dev-only; ship inertly — hygiene is AHQ-198's)
├── tests/
│   ├── integration/build/
│   │   └── build-determinism.integration.test.ts   [NEW] build twice → identical hashes
│   └── e2e/npm-package/
│       └── prebuilt-tarball-install-runs-math-workflow.e2e.test.ts
│                                       [NEW] pack → npm install into temp prefix →
│                                       artifact-shape asserts → list → full math run
└── temp/AHQ-196/                       (human-created scratch tree, gitignored — spike
                                        tarball installs live here)
```

And what the installed artifact looks like after `npm install <tarball> --prefix <temp>` —
i.e. what an end user's machine gets:

```
<temp prefix>/lib/node_modules/agentic-hq/
├── package.json                 ← the pnpm-pack-REWRITTEN manifest: bin → prebuilt wrapper,
│                                  exports → dist JS (this is what makes it all resolve)
├── bin/                           both wrappers ship; the manifest's bin points at the
│                                  prebuilt one, so `agentic-hq` on PATH = prebuilt
├── scripts/run-workflow.cjs
├── dist/…                         compiled CLI + workflow JS (as above)
├── .agentic-hq/plugins/…          shipped plugins: SKILL.md + command .md files (scanned at
│                                  runtime for --plugin-dir flags)
└── node_modules/                  commander, node-pty, fast-glob — installed by npm from the
                                   registry; no pnpm, no tsx, nothing else
```

Not shown above but part of the legacy story: the `AGENTIC_HQ_WORKSPACE_ROOT` env var itself is
`[LEGACY, stays for now]` — this ticket's new seams use the `ahq-package-root` *name*, and the
env var is eliminated by AHQ-200's zero-change refactor.

## Tests Being Created

Test-first (RED → CODE → GREEN) is proposed: both tests assert externally observable outcomes
(tarball behaviour, byte-identical builds), so they can be written and seen to fail before any
infrastructure exists — the failure itself confirms the harness is honest.

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

1. **`tests/integration/build/build-determinism.integration.test.ts`** *(AC: "build is
   deterministic")* — runs the build twice (`tsc -p tsconfig.build.json --outDir <tmpA|tmpB>`,
   temp dirs under `temp/AHQ-196/`), computes SHA-256 per file, asserts the two trees have
   identical relative-path → hash maps. Fast, no Claude.

2. **`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`** — modeled
   on the existing cross-workspace math e2e. `beforeAll`: `pnpm build` → `pnpm pack` →
   `npm install --prefix <temp/AHQ-196/…>` of the tarball → snapshot the installed package's
   recursive file listing. Then, sequentially:
   - **artifact shape is right** *(Perplexity recommendations; fast fail before any run)* — the
     tarball's `package/package.json` has `bin` → `bin/agentic-hq-prebuilt.cjs` and `exports` →
     `./dist/…/index.js` with **no `.ts` targets** (proves the `publishConfig` overrides really
     applied — never inferred from the source manifest); and in the installed tree, **no
     `package.json` exists on the directory path between the compiled workflow JS and the package
     root** (guards the Node package self-reference mechanism against a nested manifest ever
     sneaking into an ancestor position).
   - **`list` works from the install** *(AC 1)* — runs the installed bin's `agentic-hq list` from
     a clean temp directory; asserts math-workflow appears. No Claude, fast.
   - **full math run, read-only package** *(ACs 2 + 3)* — runs
     `agentic-hq math -- --input-number=11` (installed bin) from a clean temp workspace; asserts
     `Output number: 5`, asserts the io-files dir appears under the **user** workspace, and
     asserts the installed package's file listing is unchanged (nothing written inside it). Slow
     (3 real Claude commands, ~minutes) — same timeout pattern as the existing e2e.

AC 4 (mechanism + determinism *recorded*) is satisfied by the Findings write-up (below); AC 5
(committed on the feature branch) is the human's `/commit` at the end.

Side-effect on an existing test: the current
`test:e2e:cross-workspace-demo-math-workflow` now needs `dist/` to exist (the SKILL.md switches to
the prebuilt runner), so its npm script gains a leading `pnpm build && `. Interim state, replaced
by AHQ-197's `build-first` mode.

## Implementation Changes

All new seams are born with the `ahq-package-root` name (parent Q10); the env-var mechanism itself
stays for this ticket (brief scope guard).

1. **`tsconfig.build.json`** (new) — extends the root config; one tsc invocation emits both build
   surfaces, mirroring the repo layout under `dist/`:
   ```jsonc
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "noEmit": false, "rootDir": ".", "outDir": "dist",
       "types": ["node"],
       // typecheck-only mapping so the workflow's self-referencing import resolves
       // without a node_modules symlink; does not affect emitted specifiers
       "paths": { "agentic-hq/tools/claude-code": ["./src/tools/marshalled-io-tools/claude-code/index.ts"] }
     },
     "include": [
       "src/**/*",
       ".agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/**/*"
     ]
   }
   ```
   Emits `dist/src/**` (CLI) and
   `dist/.agentic-hq/plugins/…/math-workflow/ts-workflow/src/math-workflow-demo-cli.js` (workflow).
   Source relative imports already carry `.js` suffixes, so plain ESM emit just works. No
   sourcemaps/declarations (nothing consumes them; keeps determinism trivial).

2. **`package.json`** — add `"build": "rm -rf dist && tsc -p tsconfig.build.json"` (clean build
   every time, so outputs of since-deleted sources can never linger into an artifact — Perplexity
   recommendation); add the `files` whitelist
   (above); add:
   ```jsonc
   "publishConfig": {
     "bin": { "agentic-hq": "bin/agentic-hq-prebuilt.cjs" },
     "exports": { "./tools/claude-code": "./dist/src/tools/marshalled-io-tools/claude-code/index.js" }
   }
   ```
   Dev-facing `bin`/`exports` values are byte-for-byte untouched.

3. **`bin/agentic-hq-prebuilt.cjs`** (new) — the shipped entry point; sibling of the untouched dev
   wrapper. Same env-var write, then a direct dynamic import of the compiled ESM entry (no tsx —
   and, unlike the dev wrapper, no child process is needed since there's no separate tsx binary
   to spawn; Perplexity suggested this simpler form):
   ```js
   process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');
   import(url.pathToFileURL(path.join(__dirname, '..', 'dist', 'src', 'cli', 'main.js')).href);
   ```
   Commander reads `process.argv` itself, so args flow without forwarding; failures throw
   uncaught with a full stack trace, per this repo's catastrophic-failure convention. Which
   artifact you invoked is the truth — no filesystem sniffing (parent Update 2 principle).

4. **`scripts/run-workflow.cjs`** (new) — the minimal shared runner (plain CJS, run by node;
   AHQ-197 hardens it with `build-mode`). Parses `--ahq-package-root=<dir>` and
   `--workflow-js=<path relative to that root>`; every remaining arg passes through to the
   workflow program:
   ```js
   execFileSync(process.execPath, [path.join(ahqPackageRoot, workflowJs), ...passthroughArgs], { stdio: 'inherit' });
   ```
   Both options required — missing either is a loud error (fail fast, no defaults).

5. **math-workflow `SKILL.md`** — the `command-output-string` becomes (replacing
   `pnpm install` + `ln -sfn` + tsx):
   ```
   node "$AGENTIC_HQ_WORKSPACE_ROOT/scripts/run-workflow.cjs" --ahq-package-root="$AGENTIC_HQ_WORKSPACE_ROOT" --workflow-js=dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js
   ```
   The CLI appends the user's shell-escaped passthrough args to this string
   (`claude-workflow-command-builder.ts:32-35`) and bash-executes it from the user's workspace —
   trailing args therefore reach the workflow program via the runner. The env var expands from the
   CLI process's inherited environment, exactly as today. The SKILL.md's info-panel note about
   `ln -sfn` is replaced with a runner explanation.

6. **Spike/verification work** (in `temp/AHQ-196/`, per Q1 standing approval): tarball installs
   into temp prefixes, and the **first** action of the CODE phase is a 5-minute check that
   `pnpm pack` really applies the `publishConfig` `bin`/`exports` overrides — it gates the whole
   design (fallback recorded in Risks).

**Sequencing:** RED — write tests 1 and 2, run them, verify both fail for the right reason (no
`tsconfig.build.json` / no `build` script → the build step itself fails). CODE — items 1–5 above
(after the item-6 gate check). GREEN — run test 1, then test 2 (the e2e *is* the real end-to-end
run: real tarball, real npm install, real Claude ×3), then `pnpm validate`. Finally record
**Findings For Later Sub-Tasks** in `03-implementation-summary.md`: the proven resolution
mechanism, the determinism result (hash comparison), the `pnpm pack`/`publishConfig` mechanism,
the `files` whitelist slice taken from AHQ-198, and the interim build-before-e2e caveat AHQ-197
must retire.

## Risks/Unknowns/Concerns

- **`pnpm pack` + `publishConfig` overrides is the load-bearing assumption** — Perplexity's
  review confirmed it against pnpm's docs (`bin`/`exports` listed as overridable at pack time,
  and npm's packer explicitly does *not* do this), but we still live-verify it first, before any
  other CODE work, and the e2e asserts the tarball manifest rather than inferring. Fallback if it
  fails: a small pack script that swaps in the prebuilt `bin`/`exports` values around a plain
  `npm pack` and restores them after.
- **In-tree ignore files under `.agentic-hq/` can distort packing** (Perplexity). Swept the tree:
  the only one is string-reversal's `ts-workflow/.gitignore`, containing just `node_modules/` —
  harmless (packers always exclude `node_modules`). The e2e's install-and-run proves the needed
  files ship.
- **TypeScript self-reference during the workflow-file compile** — mitigated up front by the
  `paths` mapping (typecheck-only; emit keeps the bare specifier).
- **node-pty in an npm temp-prefix install on macOS**: the repo's chmod postinstall works around a
  pnpm-only extraction bug; npm should preserve the prebuild's +x bit. Proven live by the e2e; if
  wrong, that's exactly the class of finding this tracer exists to surface.
- **The dist path in the SKILL.md is long and mirrors the repo layout** — deliberate (one tsc
  invocation, zero path-rewriting logic). Cosmetic; AHQ-197 can restructure when the runner grows
  `build-mode`.
- **Math-workflow dev-mode now goes via the prebuilt path** (build needed before a dev run) —
  explicitly accepted in brief Q2. All other workflows untouched and working.
- The e2e depends on three real Claude runs behaving (same exposure as the existing cross-workspace
  math e2e — its timeout/diagnostic pattern is reused).

## Follow-up Ideas

Deliberately out of scope (owned by later sub-tasks): `build-mode`/`ahq-package-root` explicit
parameter chain and dev `build-first` parity (AHQ-197); tarball hygiene, un-private,
publish guards, real publish (AHQ-198); docs/README (AHQ-199); add-feature conversion (AHQ-202);
env-var elimination (AHQ-200); remaining workflows + scaffolder (AHQ-201).

From the Perplexity review, deferred items (release guard against `npm pack`/`npm publish` on the
source tree and pnpm pinning → AHQ-198; registry-level `npx`/global-install verification and
Linux coverage → AHQ-198/AHQ-199) have been recorded **where those sub-task runs will actually
read them**: as Sub-Task addenda in an UPDATE at the bottom of the parent brief,
`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`.

## What You'll Be Able To Do When This Ticket Is Done

Written for the human: hands-on proof, no TypeScript knowledge needed. From the repo root:

```bash
pnpm build                # compile everything to dist/
pnpm pack                 # produce the tarball: agentic-hq-0.1.0.tgz (this file IS what
                          # npm would host — the registry just serves tarballs like it)

# Install it the way npm would, into a throwaway prefix:
npm install -g --prefix temp/AHQ-196/try-it ./agentic-hq-0.1.0.tgz
```

Then pretend to be a brand-new user in an empty directory:

```bash
mkdir -p temp/AHQ-196/my-play-workspace
cd temp/AHQ-196/my-play-workspace
export PATH="$(cd ../try-it/bin && pwd):$PATH"   # this terminal session only

agentic-hq list                        # workflows listed — from the installed copy,
                                       # your cloned repo plays no part
agentic-hq math -- --input-number=11   # three real Claude steps → "Output number: 5"
```

That `agentic-hq` is the installed package's prebuilt binary: no pnpm, no tsx, no install
steps at runtime, nothing written inside the installed package directory. It is the **same
experience an npm user gets** — installing a local tarball and installing from the registry
are the same npm operation; only the download source differs.

**Not yet possible after this ticket** (deliberately): `npx agentic-hq` / `npm install -g
agentic-hq` *from npmjs.org* — that requires the real publish (AHQ-198); and only
math-workflow + `list` work from the installed copy — the other workflows are migrated in
later sub-tasks. In dev mode everything keeps working as today, except a math-workflow dev
run now needs `pnpm build` first (accepted in brief Q2; AHQ-197 automates it).

## Human Approval Confirmation

**Approved by the human on 2026-08-06** ("yes, all approved") — the full plan as it stands at
approval time: the amended version incorporating the Perplexity-review changes, the File Map,
and the "What You'll Be Able To Do" section. The two explicitly flagged decisions were both
individually confirmed: the `pnpm pack` deviation from the brief's literal "`npm pack`" wording
(inline note above: "HUMAN: I confirm I accept `pnpm pack`") and the minimal `files` whitelist
pre-doing a slice of AHQ-198. No conditions were attached. Context the human gave: they have
deliberately not absorbed the full technical detail yet — they will review the code, ask
questions, and possibly modify things once they see it working end-to-end.




## Update From Human 01 - Request For Second Opinion From Perplexity

before I read this plan and try and understand it, I'd like to let you know that I don't actually know how to develop TypeScript or JavaScript or any of that stuff. I just wanted to 
  get a second opinion from Perplexity before you go ahead and before I read this plan.  Please create a question for perplexity in new directory                                        
  docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions called 01-perplexity-q-and-a-about-plan.md where you Explain the situation to Perplexity 
  and tell it what your plan is. Defend your decision to do the build in this way and defend that this is a standard way of doing things. Also explain that this is a                    
  more-than-average-complexity build. It's a workflow system within an existing system. It's quite a challenging thing to explain in one simple question, but I'm sure you'll do well.   
  The main aim is to get from Perplexity confidence that it understands what we're trying to do here and it can give a second opinion on whether this is a standard way of doing it and  
  a good way of doing it. Please put the question in there between a start and an end block, and I'll copy it to Perplexity and put a placeholder for its answer. I'll put the answer in 
  that placeholder. 

## Update From AI 01 — Perplexity's Second Opinion, And What Changed

Q&A file:
`02-implementation-plan-supporting-docs/perplexity-questions/01-perplexity-q-and-a-about-plan.md`.
**Verdict: "a good and fairly standard solution"** for this package shape; it explicitly endorsed
tsc + package self-reference + `publishConfig` overrides over every rejected alternative
(bundling, import rewriting, conditional exports), and confirmed the pnpm `publishConfig`
behaviour against pnpm's docs.

**Adopted into the plan above:**

1. Clean build — `rm -rf dist` before every compile (stale outputs can't reach an artifact).
2. `files` whitelists `scripts/run-workflow.cjs` as a single file, not `scripts/` — the dir also
   holds `mcp-scripts/`, a dev-machine installer that must not ship.
3. New fast-fail e2e assertions: the tarball's actual manifest has the prebuilt `bin` and
   dist-JS `exports` (no `.ts` targets) — proven, never inferred; and no nested `package.json`
   sits between the compiled workflow JS and the package root (guards self-reference).
4. The prebuilt bin wrapper uses a direct dynamic `import()` of the compiled entry instead of
   spawning a child node process.
5. Verified its in-tree-ignore-file warning: the only ignore file under `.agentic-hq/` is
   string-reversal's `node_modules/`-only `.gitignore` — harmless.

**Considered but deferred to later sub-tasks** (recorded in Follow-up Ideas): release guard
against `npm pack`/`npm publish` on the source tree + pinned pnpm in the pipeline (AHQ-198);
registry-level npx/global-install and Linux/node-pty platform testing (AHQ-198/199).

**Already handled by the plan as written:** nested-manifest risk (its "biggest hidden risk") is
structurally avoided by emitting workflow JS under `dist/` — the assertion in point 3 now also
enforces it; determinism was already defined as extracted-tree hashes, not tarball bytes (it
warned tarball bytes embed timestamps — matching the brief's guidance); all runtime deps are
already in `dependencies`; testing happens via the real extracted tarball install, not
`node dist/…` from the repo.

## Update From Human 02 — Approval Gate: Two Fixes Approved (2026-08-08)

During the Implementer's approval gate the human ran the system by hand and surfaced two defects
this plan had not anticipated. Both fixes below were explicitly approved at the gate.

1. **Dev-path resolution broken → build now generates `dist/package.json`.** The plan assumed a
   dev-mode math run works after `pnpm build`. In reality the compiled workflow JS, run under
   plain node from the dev tree, self-references the **working-tree** root manifest, whose
   `exports` still point at `.ts` source (kept that way for the tsx dev flow) →
   `ERR_MODULE_NOT_FOUND` on the `.js`-suffixed relative imports inside the loaded `.ts` barrel.
   The installed tarball was unaffected (its manifest is rewritten at pack time), which is why the
   e2e passed while `agentic-hq math` failed. **Amendment:** `pnpm build` now copies
   `scripts/dist-package.json` to `dist/package.json` (`name: agentic-hq`, `type: module`,
   `exports` → compiled JS). As the nearest manifest above the compiled workflow JS it makes
   self-reference resolve to compiled JS **identically in dev-tree and installed runs**. The
   plan's "no nested manifest" e2e assertion is re-expressed accordingly: `dist/package.json`
   must exist with those values, and no OTHER manifest may sit between the workflow JS and
   `dist/`. The `publishConfig` exports override stays (still correct for the tarball's root
   manifest and external consumers).
2. **Shipped plugin scripts arrive non-executable → postinstall chmod.** `pnpm pack` records
   non-`bin` files as 0644 in the tarball (verified: 755 on disk and in git, 644 in the tarball),
   so scripts that skills execute directly at runtime (e.g. self-termination's
   `kill-current-cli-process.sh`) fail with exit 126 from an npm install — observed live by the
   human; the in-step agent's `bash <script>` fallback had masked it. **Amendment:** the shipped
   `postinstall` also runs `find .agentic-hq/plugins -name '*.sh' -exec chmod +x {} +` (same
   idiom as the existing node-pty spawn-helper chmod; no-op in the dev repo). New e2e assertion:
   every shipped `.sh` under the installed plugins tree is executable.
3. **Test-list expansion (human instruction):** a manual `agentic-hq math` run (dev binary from a
   clean workspace) joins the things-to-test list alongside the two e2es and `pnpm validate` —
   the tarball e2e alone cannot catch dev-path regressions (it stayed green while the CLI was
   broken).