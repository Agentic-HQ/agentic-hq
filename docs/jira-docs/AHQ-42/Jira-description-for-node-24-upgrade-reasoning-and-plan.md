# Jira description: Widen Node.js engines support to Node 22 + 24 LTS

> **Use:** Copy/paste this whole doc into the Jira description body when creating the ticket. It's self-contained — someone reading the Jira (human or AI agent) does not need to read the AHQ-42 audit doc to understand or execute it.

---

## Summary

Widen `package.json` `engines` from `">=22.0.0 <23.0.0"` (Node 22 LTS only) to `">=22.0.0 <25.0.0"` (Node 22 LTS **and** Node 24 LTS) and update the README accordingly — but only after a quick smoke test confirms `node-pty` installs cleanly on Node 24. Should be done **before** the public-share launch so the project ships supporting both currently-supported LTS lines.

---

## 1. Why this Jira came up

This came out of the documentation audit in [AHQ-42](https://agentic-hq.atlassian.net/browse/AHQ-42), specifically Finding 6: the top-level `README.md` line 29 says *"Requires Node.js v22.x (LTS) or higher"* — but `package.json` `engines` is locked to `"node": ">=22.0.0 <23.0.0"`. That's a contradiction in two ways:

1. **The README is wrong about what works today.** Anyone with Node 23/24/25 installed reads "v22 or higher" and assumes they're fine, then `pnpm install` fails the engines check.
2. **The `engines` itself is too narrow for a 2026 public release.** Node 22 LTS entered Maintenance LTS in October 2025; Node 24 has been Active LTS since late 2025. An open-source TypeScript CLI shipping publicly in 2026 conventionally supports both currently-supported LTS lines, not just one.

So this Jira exists because we want the public release to:

- Be honest about what Node versions actually work.
- Support Node 24 LTS users out of the box (the largest currently-supported LTS line by remaining lifetime).
- Keep Node 22 LTS users working (current stable line, still supported until 2027-04-30).

---

## 2. Perplexity research findings (2026-05-07)

Asked Perplexity to summarise the Node.js LTS landscape, Node 24 readiness for our stack, and the conventional `engines`-range strategy for an open-source TypeScript CLI in May 2026. Key findings:

### 2a. LTS landscape as of May 2026

| Major | Status | Key dates |
|---|---|---|
| Node 22 | **Maintenance LTS** | Active LTS: 2024-10-29 → Maintenance: 2025-10-21 → EOL: 2027-04-30 |
| Node 24 | **Active LTS** | Current: 2025-05-06 → Active LTS: 2025-10-28 → Maintenance: 2026-10-20 → EOL: 2028-04-30 |
| Node 26 | Not yet released as of the official release schedule. The Node project has announced a release-cadence change starting with Node 27 (one major release per year, every release becomes LTS). |

The Node.js project itself states production apps should use Active LTS or Maintenance LTS releases — both 22 and 24 qualify; 24 has the longer remaining horizon.

### 2b. Node 24 readiness for our stack

For a general TypeScript CLI in May 2026, **Node 24 is broadly a good production target**. Most of our stack is fine:

- ✅ `pnpm` 10.x — fine
- ✅ `vitest` — fine
- ✅ `commander` — fine
- ✅ `log4js` — fine
- ✅ ESM-first TypeScript, `tsx` / `ts-node` — fine
- ✅ Standard `child_process`, `fs`, `fetch`, `async_hooks` usage — no breaking changes that affect us
- ⚠️ **`node-pty` — single risk area** (see below)

Node 24 itself ships with V8 upgrades, `npm` 11, a stable permissions model, and Windows build-toolchain changes — none of which are typically breaking for a standard CLI unless we relied on deprecated behaviours. The risk is **not Node 24's stability** — Node 24 itself is ready. The risk is **whether all our native dependencies have caught up with prebuilt binaries for Node 24**.

### 2c. The `node-pty` risk

`node-pty` is a native module with a per-Node-major ABI. The package relies on prebuilt binaries published per-platform / per-Node-version. When prebuilts aren't available for a given combination, install falls back to compiling from source via `node-gyp` — which requires platform build tools (Xcode Command Line Tools on macOS).

Perplexity found ecosystem reports of Node 24 support issues tied to missing prebuilt binaries and manual compilation failures in projects depending on `node-pty`-style native packages. Upstream `node-pty` was still actively shipping releases in late 2025, but that doesn't guarantee every platform/Node-major combination has painless installs today.

The most common failure modes are:

- macOS Intel (`darwin-x64`) + Node 24 — prebuild missing → falls back to gyp build → fails if Xcode CLT not installed.
- macOS ARM64 (`darwin-arm64`) + Node 24 — usually has prebuilds; verify.
- Linux musl (Alpine, etc.) — historically the most likely to lack prebuilds.

### 2d. Conventional `engines` strategy in May 2026

For an open-source TypeScript CLI aiming for "stable, no surprises, latest LTS", the conventional 2026 posture is to **support the latest two LTS lines simultaneously** — Node 22 and Node 24. That gives users on the previous LTS a stable runway while validating on the current LTS.

In practice that means widening from `">=22.0.0 <23.0.0"` to **`">=22.0.0 <25.0.0"`** (both LTS lines, locks out non-LTS Node 23 and unverified future Node 25/26).

---

## 3. Recommended actions and upgrade plan

The work is small (~5 file edits + one CI matrix change) but gated on a manual smoke test of `node-pty` on Node 24.

### Step 1 — Verify `node-pty` installs and runs on Node 24

Run on **at least** the platform the verifying-human has. The maintainer's local environment is **macOS 15.7.5 / Intel (`darwin-x64`)** — verifying there proves the worst-case prebuild path. If CI is set up (or can be added quickly), also verify `darwin-arm64` and `linux-x64`.

```bash
# In a scratch shell, separate from your normal Node version:
nvm install 24    # or fnm install 24 / asdf install nodejs 24
nvm use 24
node --version    # confirm v24.x

cd /path/to/agentic-hq
pnpm install      # ← watch carefully: does node-pty postinstall succeed silently?
                  #   If it errors with "node-gyp: missing Xcode CLT" → install Xcode CLT and retry.
                  #   If it errors with "no prebuild for node 24 darwin-x64" → that's the fail case.
pnpm test:unit    # ← confirms basic runtime
agentic-hq reversal -- --string-to-reverse='hello node 24'
                  # ← confirms the demo workflow works end-to-end via PTY

nvm use 22        # ← back to the normal pinned version
```

**Pass criteria:** all four commands above complete without errors.

### Step 2a — If Step 1 PASSES: widen engines + update README

Make these edits:

#### Edit 1 — `package.json`

Change `"engines"`:

```diff
- "engines": { "node": ">=22.0.0 <23.0.0" }
+ "engines": { "node": ">=22.0.0 <25.0.0" }
```

Range covers Node 22 LTS and Node 24 LTS; locks out non-LTS Node 23 and future Node 25/26 until they're explicitly verified.

#### Edit 2 — `README.md` line 29

```diff
- Requires Node.js v22.x (LTS) or higher.
+ Requires Node.js v22.x or v24.x (LTS lines). Other Node majors (23, 25+) are not currently supported — see `engines` in `package.json`.
```

#### Edit 3 — `README.md` line 31 (typo fix, while we're in the area)

The "to install" sentence currently has a typo and a wrong claim about nvm:

```diff
- to install to go https://nodejs.org/en/download and follow the instructions to install nvm
+ To install Node.js v22 LTS or v24 LTS, see https://nodejs.org/en/download or use a version manager like nvm / fnm / asdf.
```

(This is also Finding 7 from AHQ-42 — bundled here because it's adjacent.)

#### Edit 4 — `README.md` line 51 (`pnpm` version drift)

```diff
- ... currently 10.33.0 ...
+ ... the version pinned by `packageManager` in `package.json` ...
```

(Also Finding 8 from AHQ-42 — bundled because we're touching this paragraph anyway.)

#### Edit 5 — CI matrix (if applicable)

If GitHub Actions / similar CI exists, add Node 24 to the matrix so dual-support stays green automatically. Example:

```yaml
strategy:
  matrix:
    node-version: [22, 24]
```

If no CI exists yet, defer this to a follow-up Jira and note it in the project.

#### Verify

- Run `pnpm validate` on the maintainer's machine (Node 22, since that's their pinned version) — should still pass.
- (Optional but ideal) Run the same smoke test from Step 1 again to confirm both Nodes work post-edit.

### Step 2b — If Step 1 FAILS: keep current engines + document the block

If `pnpm install` fails on Node 24 due to `node-pty` prebuild issues that aren't easily resolved (e.g. compile fails even with Xcode CLT, or an underlying ABI incompatibility):

#### Edit 1 — `package.json`

Leave `engines` unchanged at `">=22.0.0 <23.0.0"`.

#### Edit 2 — `README.md` line 29

Still fix the wrong "or higher" claim, but explain Node 24 is blocked:

```diff
- Requires Node.js v22.x (LTS) or higher.
+ Requires Node.js v22.x (LTS). Node 24 LTS support is planned but currently blocked on `node-pty` prebuild compatibility — see [tracking issue].
```

#### Edit 3 — Open a follow-up Jira: "Unblock Node 24 LTS support — `node-pty` prebuild issue"

Capture in that Jira:
- The exact error message from `pnpm install` on Node 24
- Platform tested (`darwin-x64` macOS 15.7.5)
- `node-pty` version pinned in `pnpm-lock.yaml`
- Link to the upstream `node-pty` issue tracker / any open issue covering Node 24

#### Verify

- `pnpm validate` on Node 22 still passes.
- README accurately reflects the constraint.

---

## 4. Complete map of Node-version references across the repo

This is the exhaustive list of every place the repo mentions Node version, what's there now, and what should change. It was generated by grepping for `Node`, `node`, `engines`, `v22`, `v24` across all maintained docs and config in May 2026, excluding:

- `node_modules/`, `pnpm-lock.yaml` (transitive deps — auto-managed)
- `docs/jira-docs/`, `docs/mission-docs/` (auto-generated)
- `docs/ARCHIVED/`, `docs/LATER/` (cordoned historical)
- **All `docs/project-docs/project-spikes/` content (legacy — not maintained, out of scope)**
- The entire classwitch plugin tree (per [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131))

### 4a. Files that MUST change (success path)

These are the load-bearing edits. If the smoke test in Section 3 Step 1 passes, all of these get updated together so the project ends in a consistent state.

| File | Line(s) | Current state | Post-upgrade state |
|---|---|---|---|
| `package.json` | `engines` field | `"node": ">=22.0.0 <23.0.0"` | `"node": ">=22.0.0 <25.0.0"` |
| `README.md` | L29 | *"Requires Node.js v22.x (LTS) or higher."* | *"Requires Node.js v22.x or v24.x (LTS lines). Other Node majors (23, 25+) are not currently supported — see `engines` in `package.json`."* |
| `README.md` | L31 | *"to install to go https://nodejs.org/en/download and follow the instructions to install nvm"* (typo + wrong nvm claim) | *"To install Node.js v22 LTS or v24 LTS, see <https://nodejs.org/en/download> or use a version manager like nvm / fnm / asdf."* |
| `README.md` | L41 | *"pnpm, which is already included in Node.js 22 or higher"* | *"pnpm, which is already included in Node.js 22 LTS and 24 LTS"* (or simpler: *"pnpm, which is already included in modern Node.js LTS versions"*). Sense-check the surrounding sentence after edit. |
| `README.md` | L51 | *"… currently 10.33.0 …"* (pnpm version pin) | *"… the version pinned by `packageManager` in `package.json` …"* |
| `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` (open-ended) | `"node": ">=22.0.0 <25.0.0"` (mirror root range, for consistency and to lock out unverified majors) |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` | `"node": ">=22.0.0 <25.0.0"` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` | `"node": ">=22.0.0 <25.0.0"` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` | `"node": ">=22.0.0 <25.0.0"` |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` | `"node": ">=22.0.0 <25.0.0"` |
| `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/package.json` | `engines` field | `"node": ">=22.0.0"` | `"node": ">=22.0.0 <25.0.0"` (mirror; this fixture is a copy of the demo for cross-workspace e2e testing — must stay in sync) |

> **Note on the open-ended `>=22.0.0` plugin ranges:** they were never explicitly upper-bounded. Tightening them now to mirror the root range serves two purposes: (a) the root and the plugin manifests express the *same* support claim, so a fresh contributor copying a plugin manifest as a template inherits the right policy; (b) installing a plugin under a future Node 25/26 will fail loudly at the plugin level rather than silently relying on the root's check. If we'd rather keep them permissive, drop the upper bound — but state that as a deliberate decision.

### 4b. Files that SHOULD be touched (alongside the above, low-cost wins)

| File | What to do | Why |
|---|---|---|
| `CLAUDE.md` L832 | Replace the generic *"…running the latest Long Term Support version of what is available…"* sentence with *"…the project supports Node 22 LTS and Node 24 LTS as of <date>; aim to track the latest two LTS lines simultaneously when widening compatibility…"* (or a similarly concrete one-liner). | Currently the rule is so generic it's useless to a future AI — pinning the current LTS pair gives concrete grounding while keeping the rule. |
| `.nvmrc` *(new file)* | Create at repo root containing `22` (or `lts/jod` for the v22 alias). | nvm/fnm/asdf users get a one-command-to-correct-Node experience. Mirror Node 22 (the maintenance LTS) since that's the lowest-friction default for new contributors; people on Node 24 can still install thanks to the widened `engines`. **Decision needed in the Jira:** pin to `22` or pin to `24` (latest active LTS)? Recommend `22` for stability — Node 22 is what existing CI / docs already target and Node 24 is allowed via `engines`. |
| CI workflow file *(new — none currently exists)* | Add a minimal GitHub Actions workflow at `.github/workflows/ci.yml` running `pnpm validate` on a Node 22 + 24 matrix. | This converts the dual-LTS claim from "we tested it once" to "we keep testing it on every PR". Without CI, the dual-LTS support will silently rot. **If creating CI from scratch is too big for this Jira:** split it into a follow-up Jira and just note the plan here. The check `.github/` directory currently only contains `pull_request_template.md`. |
| `docs/dev/npm-commands.md` | Add (or update) one line near the top: *"Use `pnpm install` (not `npm install`) — corepack will auto-fetch the pinned pnpm version. Project supports Node 22 LTS and Node 24 LTS."* | Currently the doc doesn't mention Node version at all. After widening, fresh contributors landing on this doc should know what runtime they need. (This is also Finding 59 in AHQ-42 — single edit covers both.) |

### 4c. Files NOT to change (verified by grep)

These were checked and confirm there's nothing to update — recording explicitly so the implementer doesn't re-search later:

- `pnpm-lock.yaml` — contains `engines` for transitive deps only; auto-managed by `pnpm install`. Will refresh naturally.
- `pnpm-workspace.yaml` — no Node version reference.
- `scripts/infra/install-dev-agentic-hq.sh` — no Node version reference.
- `scripts/infra/install-prod-agentic-hq.sh` — no Node version reference (only the `chmod +x` postinstall comment about node-pty).
- `docs/dev/how-agentic-hq-works.md`, `docs/dev/initial-aims-of-the-project.md`, `docs/dev/potential-feature-ideas.md`, `docs/dev/project-design-requirements.md` — none mention Node version directly.
- `docs/user-docs/WARNING-re-auto-approved-claude-permissions.md`, `docs/user-docs/workflow-descriptions/*.md` — no Node version references.
- `docs/project-docs/project-spikes/**/*` — **legacy / out of scope.** Spikes are paused/abandoned exploratory projects (per their own READMEs); their Node references are correctly historical and the maintainer has confirmed they should not be touched as part of this upgrade.
- `docs/jira-docs/AHQ-N/**/*` — auto-generated workflow output. Don't touch.

### 4d. Plugins NOT to change (out of scope)

- `.agentic-hq/plugins/agentic-hq-classwitch-plugin/skills/*/ts-workflow/package.json` — classwitch is being torn out under [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131). Don't update its `engines`; AHQ-131 will delete the whole plugin.

### 4e. Verification after all edits

After applying everything in 4a + 4b:

1. `pnpm install` from the repo root — should succeed on the maintainer's pinned Node version.
2. `pnpm validate` — typecheck + lint + format + unit tests should all pass (zero changes to actual code).
3. `agentic-hq reversal -- --string-to-reverse='post-upgrade smoke'` — confirms the demo workflow still works end-to-end.
4. Switch to Node 24 (`nvm use 24`); rerun steps 1-3. Both Nodes should be green.
5. (If CI was added) push a branch and confirm the matrix job runs both Node 22 and Node 24, both green.

---

## 5. Acceptance criteria

**Always (regardless of smoke-test outcome):**

- [ ] `node-pty` smoke-tested on Node 24 on at least `darwin-x64` (the maintainer's local machine — macOS 15.7.5 / Intel).
- [ ] `README.md` line 29 no longer claims "or higher" — it states the actual supported Node majors (or, in the fallback path, accurately explains the Node 24 block).
- [ ] `README.md` line 31 nvm-install typo and wrong nvm claim fixed.
- [ ] `README.md` line 41 ("pnpm, which is already included in Node.js 22 or higher") updated to match the new support claim.
- [ ] `README.md` line 51 `pnpm` version no longer hard-codes `10.33.0`.
- [ ] `pnpm validate` passes on the maintainer's machine.
- [ ] AHQ-42 audit doc Findings 6, 7, 8 marked as resolved.

**Success path (Step 2a — smoke test passes):**

- [ ] `package.json` (root) `engines` widened to `"node": ">=22.0.0 <25.0.0"`.
- [ ] All 5 plugin `ts-workflow/package.json` `engines` updated from `">=22.0.0"` to `">=22.0.0 <25.0.0"` (core-plugin/create-workflow, demos-plugin × 4 workflows). Classwitch plugin **not** touched.
- [ ] Test fixture `tests/e2e/fixtures/string-reversal-copy-for-test/skills/.../ts-workflow/package.json` `engines` updated to mirror.
- [ ] `CLAUDE.md` L832 generic Node-freshness sentence replaced with a concrete "Node 22 LTS + Node 24 LTS as of <date>" line.
- [ ] `.nvmrc` file added at repo root (recommend pin to `22`; record decision in the Jira).
- [ ] `docs/dev/npm-commands.md` mentions Node 22 + 24 LTS support near the top (also resolves AHQ-42 Finding 59).
- [ ] CI matrix includes Node 24 — **either** the workflow file is added now (`.github/workflows/ci.yml` with a `node-version: [22, 24]` matrix running `pnpm validate`), **or** a follow-up Jira is opened explicitly to add it.
- [ ] Both Node 22 and Node 24 verified locally: `pnpm install && pnpm validate && agentic-hq reversal -- --string-to-reverse=hello` succeeds on both.

**Fallback path (Step 2b — smoke test reveals `node-pty` block on Node 24):**

- [ ] `package.json` `engines` left at `">=22.0.0 <23.0.0"`.
- [ ] No plugin/fixture `engines` widening (they remain at `">=22.0.0"`).
- [ ] README explains the block honestly (linking to the follow-up Jira).
- [ ] Follow-up Jira opened: "Unblock Node 24 LTS support — `node-pty` prebuild issue", containing the exact error from `pnpm install`, platform tested (`darwin-x64` macOS 15.7.5), `node-pty` version pinned in `pnpm-lock.yaml`, and any relevant upstream issue links.

---

## 6. Risks and dependencies

- **`node-pty` Node-24 prebuild availability** is the single load-bearing unknown. Step 1 resolves it in ~5 minutes.
- **Maintainer platform** is macOS 15.7.5 / Intel (`darwin-x64`). Verifying there exercises the highest-risk combination (Intel macOS prebuilds tend to lag ARM64). ARM64 macOS and Linux x64 are lower-risk and can be verified later via CI without blocking this Jira.
- **Apple's Intel-Mac wind-down** (macOS 26 / Tahoe announced as last macOS supporting Intel) means Intel-Mac + newer-Node will get less ecosystem testing over time. Not a blocker today, but reinforces that the smoke test should happen *now*, not be deferred.
- **No breaking-change risk** identified between Node 22 and Node 24 for our stack's actual API usage (`child_process`, `fs`, `fetch`, ESM resolver, async_hooks all stable across both).

---

## 7. Out of scope (for this Jira)

- **All `docs/project-docs/project-spikes/` content** — these are legacy/abandoned exploratory projects. Their Node-version references are correctly historical and must not be edited as part of this upgrade.
- **All `docs/workflow-creation-docs/agentic-hq-classwitch-plugin/`** and the `agentic-hq-classwitch-plugin` itself — being torn out under [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131); don't update its `engines`.
- **All auto-generated content** (`docs/jira-docs/`, `docs/mission-docs/`, lock files, `temp/test-files/`).
- **Adding Node 26 LTS support** — Node 26 isn't released yet (per the official release schedule as of May 2026); revisit when it lands.
- **Changing the release-cadence policy** (Node 27+ moves to one-major-per-year, every release becomes LTS) — that's a future-of-Node policy question, not a near-term action.
- **Building CI from scratch** if no `.github/workflows/` exist yet — recommended in 4b but can be split into a follow-up Jira if too big. Updating an existing matrix to include Node 24 is in scope; creating one from zero is borderline and the implementer may decide to defer.
- **Other AHQ-42 findings beyond 6, 7, 8** — those are tracked individually in the AHQ-42 audit doc and will be handled in their own pass(es). Findings 6, 7, 8 are folded into this Jira because they all touch the same README paragraph and are cheaper to fix together.

---

## 8. References

- AHQ-42 audit doc: [`docs/jira-docs/AHQ-42/documentation-thorough-audit-doc.md`](./documentation-thorough-audit-doc.md) Findings 6, 7, 8.
- Node.js release schedule: <https://github.com/nodejs/Release>
- `node-pty` upstream: <https://github.com/microsoft/node-pty>
- Perplexity research conducted 2026-05-07; key findings summarised in section 2 above (no live link — research was prompted from this project's session).
