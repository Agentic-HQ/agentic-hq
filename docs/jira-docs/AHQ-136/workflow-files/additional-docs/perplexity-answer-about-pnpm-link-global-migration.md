Question:


I'm upgrading an open-source project from pnpm 10 to pnpm 11 (pnpm 11.1.2, corepack-managed — the pnpm version is pinned via the `packageManager` field in `package.json`, just bumped from `pnpm@10.33.0` to `pnpm@11.1.2`). Node 22.20.0, macOS (Apple-Silicon and Intel users both exist).

THE PROJECT: an open-source TypeScript CLI called `agentic-hq`, currently distributed by `git clone` (not yet published to the npm registry). It ships a developer install script, `install-dev-agentic-hq.sh`, whose entire job is:

```bash
pnpm install
pnpm link --global
```

`pnpm link --global` is used to put the `agentic-hq` command on the user's PATH so they can run the CLI from any directory. (We know `pnpm link --global` mutates global state — it is a deliberate, documented trade-off for dev-mode simplicity.)

THE PROBLEM under pnpm 11: `pnpm link --global` now fails with:

```
[ERROR] The configured global bin directory "/Users/<me>/Library/pnpm/bin" is not in PATH
Run "pnpm setup" to update your shell configuration.
```

DIAGNOSTICS on my macOS machine (the maintainer):

- `PNPM_HOME=/Users/<me>/Library/pnpm` is set — it was added to `~/.zshrc` by a `pnpm setup` run some time ago (under pnpm 10).
- `/Users/<me>/Library/pnpm` IS on my PATH (also from that old `pnpm setup`).
- Under pnpm 10, `pnpm link --global` placed global binaries DIRECTLY in `~/Library/pnpm/` — e.g. `~/Library/pnpm/agentic-hq` exists and is dated before this upgrade. That worked because `~/Library/pnpm` is on PATH.
- Under pnpm 11, pnpm wants the global bin directory to be `~/Library/pnpm/bin/` — a NEW `bin` subdirectory — which is NOT on my PATH. pnpm 11 created an empty `~/Library/pnpm/bin/` and then errored.
- `pnpm config get global-bin-dir` returns `undefined` (so pnpm is using its built-in default, not an explicit config).

MY QUESTIONS — I want the *proper, correct* migration process, not just a workaround. Imagine this project has 10,000 users, each of whom has pnpm installed in some state; what is the correct migration path for all of them AND for me as the maintainer?

1. Did pnpm 11 change the default global bin directory from `$PNPM_HOME` to `$PNPM_HOME/bin`? Is this a documented breaking change in the pnpm 11 release notes / migration guide? Please cite.

2. For an EXISTING user who already has `PNPM_HOME` set and `$PNPM_HOME` (but not `$PNPM_HOME/bin`) on PATH from an old pnpm-10 `pnpm setup` — what is the correct migration step? Do they re-run `pnpm setup`? Will re-running `pnpm setup` under pnpm 11 correctly and idempotently update the shell config to add `$PNPM_HOME/bin` to PATH, or will it duplicate / conflict with the existing pnpm block in `~/.zshrc`?

3. Should the old pnpm-managed block in `~/.zshrc` (the `# pnpm` / `export PNPM_HOME` / `export PATH` lines) be manually removed BEFORE re-running `pnpm setup`, or does `pnpm setup` detect and rewrite its own managed block cleanly?

4. For a BRAND-NEW user who has never used pnpm (gets pnpm only via corepack because of the `packageManager` pin) — what is the correct one-time setup under pnpm 11 so that `pnpm link --global` works? Is `pnpm setup` still the official answer?

5. For the PROJECT (maintainer's perspective): what is the correct, robust way to handle this for many users? Should the install script run `pnpm setup` itself (it modifies the user's shell config — we are very reluctant to do that automatically)? Should it just detect the missing PATH entry and instruct the user? Is there any supported way to make `pnpm link --global` work WITHOUT a shell-config change?

6. Is there a recommended ALTERNATIVE to `pnpm link --global` for exposing a dev-mode CLI on PATH that avoids the global-bin-dir / `pnpm setup` machinery entirely (e.g. `pnpm link` semantics, `corepack`, a manually-managed symlink, `npm link`, etc.)? What would the pnpm team recommend for a CLI distributed by git clone?

7. Stale binaries: pnpm 10 left an old binary at `$PNPM_HOME/agentic-hq`. After migrating to pnpm 11 (binaries now in `$PNPM_HOME/bin/`), is the old one orphaned? Should the migration explicitly clean it up, and how?

Please cite the official pnpm 11 release notes / migration guide / `pnpm setup` and `pnpm link` docs wherever possible.


Answer:


Yes — pnpm 11 changed the global binary location to `$PNPM_HOME/bin`, and the docs explicitly call that out as a v11 change, with `pnpm setup` recommended after upgrading to update shell config so `$PNPM_HOME/bin` is on PATH. The old `pnpm link --global` flow is also gone in v11; the official replacement for making a local package’s binaries globally available is `pnpm add -g .`. [pnpm](https://pnpm.io/cli/setup)

## 1) What changed in pnpm 11

pnpm’s global packages docs say that in v11, “globally installed binaries are stored in a `bin` subdirectory of `PNPM_HOME`” and that this keeps `PNPM_HOME` clean. The setup docs repeat the same guidance and add a tip: “After upgrading to pnpm v11, run `pnpm setup` to update your shell configuration”. So this is documented behavior, not an accidental regression. [pnpm](https://pnpm.io/global-packages)

## 2) Existing users migrating from v10

For users who already have `PNPM_HOME` on PATH from a pnpm 10-era setup, the correct migration is to run `pnpm setup` again under pnpm 11. The docs explicitly position `pnpm setup` as the command that updates the shell configuration, and v11’s docs tell users to rerun it after upgrading. I did not find official documentation promising a manual PATH edit instead of `pnpm setup`, so the supported migration path is to rerun setup. [pnpm](https://pnpm.io/11.x/cli/setup)

## 3) Will `pnpm setup` duplicate the shell block?

The docs say `pnpm setup` updates the shell configuration file, but they do not spell out the exact rewrite strategy or idempotency guarantees. So the safest official answer is: rerun `pnpm setup`, and let it manage its own block. I did not find a pnpm doc instructing users to manually delete the old `# pnpm` block first. [pnpm](https://pnpm.io/cli/setup)

## 4) Brand-new users on corepack

For a brand-new user, the official one-time setup is still `pnpm setup` after pnpm is available, because v11’s docs say setup creates the home directory and adds it to PATH. Since your project is pinned via `packageManager` and is corepack-managed, the cleanest path is: enable corepack, ensure the pinned pnpm version is available, then run `pnpm setup` once so `$PNPM_HOME/bin` is on PATH. After that, `pnpm link --global` is not the right v11 command anymore; `pnpm add -g .` is the documented replacement for exposing a local package’s binaries globally. [pnpm](https://pnpm.io/cli/link)

## 5) What the project should do

From a maintainer standpoint, I would not have the install script run `pnpm setup` automatically, because that changes the user’s shell config and the docs frame setup as a user-side installation step. The robust pattern is to detect the missing PATH entry, print a targeted message, and ask the user to run `pnpm setup` under pnpm 11. There is no supported pnpm 11 path that makes `pnpm add -g .` or the old global-link flow work without either a PATH change or an equivalent manual shell change, because the executables now live under `$PNPM_HOME/bin`. [pnpm](https://pnpm.io/global-packages)

## 6) Better alternative to `pnpm link --global`

For a git-clone dev CLI, the pnpm-team-supported replacement is `pnpm add -g .` from the package directory, not `pnpm link --global`. If you want to avoid any global-bin-dir setup entirely, the other practical option is a project-local wrapper or symlink that users add themselves, but that is outside pnpm’s global-package machinery and not the pnpm-documented global install path. In short: for pnpm 11, “global binary exposure” means `$PNPM_HOME/bin` on PATH, and pnpm’s official mechanism is `pnpm add -g .`. [pnpm](https://pnpm.io/cli/link)

> **AHQ-136 follow-up:** acting on section 6 — switching `install-dev-agentic-hq.sh` from `pnpm link --global` to `pnpm add -g .` — was deliberately deferred out of AHQ-136 (GREEN-phase minimality + the switch needs verification that `pnpm add -g .` produces a live-source symlink, not a copy). Tracked as Jira [AHQ-144](https://agentic-hq.atlassian.net/browse/AHQ-144); description at `later-jira-description-for-switching-to-pnpm-add.md` (same folder).

## 7) Stale v10 binaries

Yes, the old `$PNPM_HOME/agentic-hq` binary is effectively orphaned once v11 switches global shims to `$PNPM_HOME/bin`. The docs describe the new location, but I did not find an official migration step that automatically cleans up older top-level shims. So the migration should explicitly remove stale v10-era shims if they are present, but do so carefully and only for the package you own; the official removal command for a globally linked package is `pnpm uninstall --global <package>`. [pnpm](https://pnpm.io/ja/11.x/cli/unlink)

## Recommended migration path

For your project, the cleanest v11-era messaging is:

1. Ensure the user is on pnpm 11 via corepack and the `packageManager` pin.
2. Tell existing users to run `pnpm setup` once so `$PNPM_HOME/bin` is on PATH. [pnpm](https://pnpm.io/cli/setup)
3. Replace `pnpm link --global` in the install script with `pnpm add -g .` if you want to follow pnpm 11’s documented global-binary path. [pnpm](https://pnpm.io/cli/link)
4. If you want to preserve dev-mode simplicity, keep the script from mutating shell config and instead emit an actionable error when `pnpm bin -g` is not on PATH. [pnpm](https://pnpm.io/cli/bin)
5. Optionally remove the obsolete old-style shim for `agentic-hq` if it exists, then reinstall using the new global location. [pnpm](https://pnpm.io/ja/11.x/cli/unlink)

A concise user-facing message would be: “pnpm 11 stores global binaries in `PNPM_HOME/bin`; run `pnpm setup` once, then rerun the install script”. [pnpm](https://pnpm.io/global-packages)



ADDITIONAL QUESTIONS FROM HUMAN:

Question:

For step 5 "Optionally remove the obsolete old-style shim for agentic-hq if it exists, then reinstall using the new global location." would running "pnpm uninstall --global agentic-hq" before the upgrade have worked?


Answer:

Yes, **for the old v10-style global install, `pnpm uninstall --global agentic-hq` would have been the right cleanup step** before upgrading, assuming the package had previously been installed globally by pnpm. [pnpm](https://pnpm.io/uninstall)

The official uninstall docs say global packages can be removed with `pnpm rm -g <pkg>` and that you can also inspect the global list with `pnpm ls -g`. Since the old `agentic-hq` shim lived in the old global location, removing the package before the v11 migration would have cleaned up that old global entry in the pnpm-managed way rather than leaving a stale binary behind. [pnpm](https://pnpm.io/uninstall)

Two caveats matter:

- It would only remove the pnpm-managed global package, not every manually created file that might have been left in `~/Library/pnpm`. [pnpm](https://pnpm.io/uninstall)
- In pnpm 11, the global binary location changed to `$PNPM_HOME/bin`, so the package would then need to be reinstalled or relinked using the v11 flow after PATH is updated. [pnpm](https://pnpm.io/global-packages)

So the practical migration sequence for a v10 user would have been:

1. `pnpm rm -g agentic-hq` to remove the old global install. [pnpm](https://pnpm.io/uninstall)
2. Upgrade to pnpm 11 and run `pnpm setup` so `$PNPM_HOME/bin` is on PATH. [pnpm](https://pnpm.io/cli/setup)
3. Reinstall globally using the v11-supported command, `pnpm add -g .`, from the project checkout. [pnpm](https://pnpm.io/cli/link)

If you want, I can also give you a **safe migration shell snippet** for users that removes only the old `agentic-hq` shim and reinstalls it under pnpm 11.


Question:

Is this actually the correct, pnpm recommended upgrade sequence from 10 to 11 with people who have globally installed packages?  I find it hard to believe the project expect users to **manually** run "rm -g" commands for *each* of their packages (what if they have 52 installed?) and then manually add all of them back in.  That sounds nuts.


Answer:

No — that would not be the normal upgrade expectation. pnpm’s recommended migration is to update pnpm itself and run `pnpm setup` so the new global bin location is on PATH, not to manually remove and re-add every globally installed package one by one.

For people who already have global packages, the practical upgrade path is:

1. Upgrade to pnpm 11.
2. Run `pnpm setup` once so the shell config points at the new global bin directory.
3. Leave already-installed global packages alone unless you specifically need to clean up an old shim or reinstall a broken package.

The reason is that pnpm 11 changed where it places global binaries, but that does not imply users must enumerate and reinstall their whole global package set. The migration docs point users at updating shell config, not mass-uninstalling globals. For your specific project, the only package you need to worry about cleaning up is your own `agentic-hq` dev install, because it may have left behind an old top-level shim from the v10 layout. [pnpm](https://pnpm.io/cli/setup)

So the sane interpretation is:

- **Existing global packages:** usually keep them.
- **Shell/PATH migration:** run `pnpm setup` once.
- **Your project’s old dev shim:** clean up just that one if needed.
- **Large-scale package reinstallation:** not part of the standard pnpm 10 → 11 upgrade flow.

If you want, I can help you write a precise migration note for your README that distinguishes “pnpm upgrade” from “clean up this one dev CLI install.”


Question:

Most people will just leave all these binaries that were installed in pnpm 10 on disk then I guess?  I reckon we should do the same.

Answer:


Yes — that’s the sensible default. Most users will just leave the old pnpm 10 binaries on disk, update pnpm, run `pnpm setup`, and move on; they do not need to scrub every global binary just because the global bin layout changed.

For your project, I’d recommend **not** trying to clean up arbitrary old pnpm-managed binaries automatically. It’s safer to leave users’ existing global packages alone and only address the `agentic-hq` dev install you own if it’s causing confusion or a stale command path.

A good README note would be:

- pnpm 11 stores global binaries under `PNPM_HOME/bin`.
- Existing global packages from pnpm 10 can usually stay in place.
- Run `pnpm setup` once after upgrading pnpm so the new bin directory is on PATH.
- Reinstall `agentic-hq` only if the command is missing or stale.

That keeps the upgrade low-risk and avoids turning a pnpm version bump into a broad cleanup operation.

---

## REAL-WORLD OUTCOME (recorded 2026-05-16)

Perplexity's answer to follow-up Q3 hedged: it said to "rerun `pnpm setup`, and let it manage its own block", noting the docs "do not spell out the exact rewrite strategy or idempotency guarantees". In practice, on the maintainer's macOS machine, pnpm 11's `pnpm setup` **refused** to rewrite the pre-existing pnpm-10 block:

```
[ERR_PNPM_BAD_SHELL_SECTION] The config file at "/Users/<me>/.zshrc"
already contains a pnpm section but with other configuration

If you want to override the existing configuration section, use the --force option
```

The maintainer backed up `~/.zshrc` first, then re-ran with `pnpm --force setup`, which replaced the block:

```
[WARN] using --force I sure hope you know what you are doing
Replaced configuration in /Users/<me>/.zshrc
```

A `diff` of the new vs. backed-up `~/.zshrc` showed the change was minimal and exactly as diagnosed — only the PATH `case` statement, on two lines:

```diff
<   *":$PNPM_HOME/bin:"*) ;;
<   *) export PATH="$PNPM_HOME/bin:$PATH" ;;
---
>   *":$PNPM_HOME:"*) ;;
>   *) export PATH="$PNPM_HOME:$PATH" ;;
```

`PNPM_HOME` itself was unchanged. **Conclusion:** existing pnpm-10 users upgrading to pnpm 11 must run `pnpm --force setup` (not plain `pnpm setup`), and should back up their shell rc file first. This correction is reflected in `scripts/infra/install-dev-agentic-hq.sh`, `README.md`, and the GREEN-phase plan/handoff docs.