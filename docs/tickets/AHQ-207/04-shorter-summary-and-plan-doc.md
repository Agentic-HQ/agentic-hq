# AHQ-207 — Short Version: What's Wrong And The Plan To Fix It

*(The long evidence trail is in `02-claude-response.md` if it's ever needed. This is the readable one.)*

---

## The finding, in five lines

- npm is locking down install scripts. **npm 11 warns; npm 12 blocks.** npm 12 shipped 8 July 2026 and
  is already `latest` on the registry.
- Agentic HQ needs two install scripts to run: `node-pty` compiling on Linux, and our own `chmod` that
  makes `spawn-helper` executable on macOS.
- **On npm 12 both are blocked, the install still reports success (exit 0), and Agentic HQ is broken.**
- Fix: install with `--allow-scripts`. One command, both platforms, every npm version. **Verified
  working** on npm 11.12.1, 11.16.0 and 12.0.2.
- **Nothing is broken today on npm 11** — which is why your VM run worked fine. This is about the users
  already on npm 12, and everyone once Node starts bundling it.

**Why it breaks differently per platform** (this is why the fix isn't Linux-only):

| | Linux on npm 12 | macOS on npm 12 |
| --- | --- | --- |
| What breaks | `node-pty` can't compile — no binary at all | `spawn-helper` left non-executable |
| `agentic-hq list` | **Crashes** (exit 1) | **Passes** ← looks fine! |
| First workflow | never gets there | **`posix_spawnp failed`** |

macOS is the sneakier one: install succeeds *and* the verification step succeeds, so the user has no
reason to suspect anything until a workflow dies.

---

## The fix

```bash
npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
```

---

## The plan — 5 changes

*(Changes 1–4 below. Change 5 is a one-line docs addition, explained in
[Should we just move everything to npm 12?](#should-we-just-move-everything-to-npm-12) — it only
makes sense alongside that reasoning.)*

### 1. `README.md:45` — change the install command

```diff
- npm install -g agentic-hq
+ npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
```

### 2. `README.md` — add a note directly beneath it

> Older versions of npm may report `Unknown cli config "--allow-scripts"`. This can be safely
> ignored — the install still completes correctly.

*(Needed because npm before 11.16 doesn't know the flag. It warns, but installs fine — confirmed.)*

### 3. `docs/user-docs/troubleshooting.md` — two entries

**3a. Fix the existing `posix_spawnp failed` entry (line 58).** It currently gives one cause — macOS
older than 13.5 — and one fix: **upgrade macOS**. On npm 12 that same error has a second, more likely
cause, so a Mac user could go and upgrade their OS for nothing. Add the npm 12 cause *above* the
existing one, with the `--allow-scripts` reinstall as the fix.

**3b. Add a new entry** for the Linux crash, headed with the exact error text a user will paste into
a search box:

```
Failed to load native module: pty.node, checked: build/Release, build/Debug, prebuilds/linux-x64
```

Both entries say the same thing: reinstall with the `--allow-scripts` command.

*(These two exist for people who install with the **old** command — from muscle memory, a bookmark,
or a stale copy of the README.)*

### 4. `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — add the flag

Lines 211 and 419 install the tarball with the dev machine's npm and no flag. Add
`--allow-scripts=agentic-hq,node-pty`. Two reasons:

- It stops a **mystery red build** the day CI or a contributor's npm reaches 12.
- It makes the test **honest** — it should install the way we document installing.

---

## What we decided NOT to do

Swapping `node-pty` for a prebuilt-only version would remove the problem at the root (and would let us
delete the `build-essential` + `python3` prerequisite). **Deferred, no Jira raised** — the only viable
candidate is on a beta release line, its macOS behaviour is unverified, and it would put a
non-Microsoft package in the process-spawning slot against AHQ-170's pinning policy. Too much
supply-chain risk for a problem that already has a working one-line answer.

Deferred, not ruled out — if users start reporting either of the errors above, that is the signal to
look at it again.

**Accepted risk:** the docs fix only protects people who read the docs. Someone using the plain old
command on npm 12 still gets a broken install. Partly covered by the troubleshooting entries — and by
npm 12's own message, which helpfully names the right fix.

---

## Then: re-run the VM test

Reset to **Snapshot 5** and follow the updated README as written. Expected: the `--allow-scripts`
install succeeds with no warnings on npm 11.16.0, `agentic-hq list` works, and the AHQ-207 four-agent
run proceeds normally.

---

## Should we just move everything to npm 12?

Considered and **rejected** — with one small piece kept. (Question raised 2026-08-23: should we
upgrade npm on the Mac, on the Ubuntu VM, and declare npm 12 as the supported version in the docs?)

**Don't upgrade either machine:**

1. **It buys nothing.** The `--allow-scripts` command already works on npm 11.12.1, 11.16.0 **and**
   12.0.2 — all verified. Upgrading fixes nothing that change 1 doesn't already fix.
2. **Real risk on the Mac, at the worst possible moment.** npm 12 also deprecated granular access
   tokens that bypass 2FA — so it touches the **publish** path, and AHQ-195 is a publishing ticket
   with an already-fiddly passkey/EOTP flow. Whether npm 12 changes that flow is **unverified**, and
   discovering it during a release is exactly the multi-hour churn we're avoiding. Meanwhile the repo
   installs with **pnpm**, so npm 12 offers the dev environment no upside to offset the risk.
3. **The VM should stay on npm 11.16.0 because that is what real users have.** No released Node
   bundles npm 12 (Node 24 → npm 11.x, Node 26 → 11.18.0), so testing on 11.16.0 *is* testing the
   majority case. Upgrading it would also break AHQ-207's AC 1, which requires following the README
   as written.

**And a trap in the docs half specifically:** declaring "npm 12 required" would force **every** user
to upgrade npm before installing, since no Node ships it — adding a step to a Quick Start whose whole
appeal is being short, for a step nobody needs, because the flag works on npm 11 regardless.

**What we keep:** the observation that the docs currently say **nothing** about npm versions is a fair
hit. Fixed with one line rather than a version bump — see change 5.

### 5. `README.md` Prerequisites — state the supported npm range

> **npm** — any version from npm 11 onwards (npm 12 included). The install command below works on both.

No user action required, and it quietly explains why the install command looks unusual.


---

## Approve?

Say go and I'll make all 5 changes, then run `pnpm validate`.

Two things worth deciding at the same time:

1. **Do these edits belong here, or in AHQ-199's own workflow run?** (AHQ-199 is the docs restructure
   ticket — it may want to own README/troubleshooting changes.)
2. **Does this affect AHQ-195 go-live?** My read: **no.** The documented install path works on every
   npm version once change 1 lands.
