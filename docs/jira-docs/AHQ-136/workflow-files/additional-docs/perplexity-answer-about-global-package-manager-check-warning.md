# Perplexity question — `[WARN] Using --global skips the package manager check`

Paste the question below into https://perplexity.ai, then paste the answer into the
"Answer" section at the bottom.

---

## Question

CONTEXT: an open-source TypeScript CLI called `agentic-hq`, distributed by `git clone`
(not published to the npm registry). pnpm 11.1.2, corepack-managed — the pnpm version is
pinned via the `packageManager` field in the repo's root `package.json`. Node 22.20.0,
macOS (Apple-Silicon and Intel users both exist).

The project ships a developer install script (`scripts/infra/install-dev-agentic-hq.sh`)
whose job is to put the `agentic-hq` command on the developer's PATH, pointing at the
**live repo checkout** (dev mode — edits to the source must take effect immediately).
Under pnpm 10 the script used `pnpm link --global`. pnpm 11 removed the `pnpm link --global`
form (`pnpm link` now requires a `<dir>` argument and has no `--global` flag), so we are
switching the script to `pnpm add -g .` run from the repo root. That works and correctly
creates a live symlink to the repo.

THE ISSUE: every `--global` pnpm command we run from inside the repo directory prints this
warning:

```
[WARN] Using --global skips the package manager check for this project
```

It appears for `pnpm add -g .`, `pnpm root -g`, `pnpm ls -g`, etc. — always when the
current working directory is inside the `agentic-hq` repo (which declares a `packageManager`
field in its `package.json`). Example:

```
$ pnpm add -g .
[WARN] Using --global skips the package manager check for this project
Already up to date

global:
+ agentic-hq 0.1.0 <- /Users/<me>/dev/agentic-hq/agentic-hq

Done in 501ms using pnpm v11.1.2
```

QUESTIONS — we want the proper, idiomatic pnpm 11 approach, not a hack:

1. What exactly is "the package manager check" that `--global` skips? Is it the
   verification of the `packageManager` field in `package.json` (the corepack-style "are
   you running the pinned pnpm version" check, related to the `manage-package-manager-versions`
   setting)? Please cite the pnpm 11 docs.

2. Why does the warning appear specifically here — is it purely because the `--global`
   command is being run while the current working directory is inside a project that
   declares a `packageManager` field?

3. Is there a proper, supported way to perform a global install under pnpm 11 that does
   NOT trigger this warning? For example:
   - Running the command from a directory outside any pnpm project (e.g. `$HOME` or
     `/tmp`) and passing an absolute path: `pnpm add -g /absolute/path/to/repo`?
   - A config option or setting (in `.npmrc`, `pnpm-workspace.yaml`, or a CLI flag) that
     makes the global install clean?

4. Is the warning purely informational/cosmetic and safe to ignore, or does "skipping the
   package manager check" have any real consequence for the resulting global install?

5. For a dev-install script that must add the **current repo** as a global package, what
   is the cleanest pnpm-11-idiomatic invocation that avoids the warning? Is `pnpm add -g .`
   from the repo root the right command at all, or is there a better one?

6. Please cite the official pnpm 11 docs / release notes / `pnpm add` / `pnpm link` docs
   wherever possible.

---

## Answer

_(paste Perplexity's answer here)_



Yes: in pnpm 11, `pnpm link --global` is gone, and the official replacement for exposing a local package’s binaries system-wide is `pnpm add -g .` from the package directory. pnpm’s docs also say `pnpm link` no longer uses the global store and that `pnpm add -g .` is the supported way to register a local package’s bins globally. [irshath](https://irshath.com/blog/02-monorepo-using-pnpm-workspaces/)

## 1) What the warning means

The warning is about pnpm’s **package manager version check** for projects that have a `packageManager` field, which is the Corepack-style pin to a specific package-manager version. pnpm 11 tightened this behavior, and the warning text explicitly says that `--global` skips that check. [pnpm](https://pnpm.io/blog/releases/11.0)

So yes, your interpretation is the right one: it is not about the global install itself failing, but about pnpm choosing not to enforce the repo’s pinned package-manager version for that particular global command. [pnpm](https://pnpm.io/blog/releases/11.0)

## 2) Why it appears in your case

It appears because the command is being run **from inside a directory that is part of a project declaring `packageManager`**. pnpm treats that as a project context, and when you add `--global`, it warns that it is bypassing the project’s package-manager verification. [pnpm](https://pnpm.io/blog/releases/11.0)

In other words, the warning is tied to the current working directory being inside the repo, not specifically to `add -g` versus `root -g` versus `ls -g`. Any global command launched from that project context can trigger it. [pnpm](https://pnpm.io/blog/releases/11.0)

## 3) Can you avoid the warning cleanly?

The cleanest supported way is to run the global command from a directory **outside** the pnpm project context, such as `$HOME` or `/tmp`, while still pointing at the repo via an absolute path. pnpm’s docs require a path for local-package linking/registration, and `pnpm add -g .` is specifically documented as the global-registration form for a local package’s binaries. [irshath](https://irshath.com/blog/02-monorepo-using-pnpm-workspaces/)

A command like this is the most likely way to avoid the warning while keeping the same behavior:

```sh
cd /tmp
pnpm add -g /absolute/path/to/agentic-hq
```

I did not find an official pnpm 11 config flag in the docs that disables this warning for global commands while preserving the repo’s `packageManager` checks; the docs instead position the warning as a consequence of using `--global` in a project context. The only related knobs I found are about package-manager strictness in general, not a dedicated “make global install quiet” switch. [github](https://github.com/pnpm/pnpm/issues/7956)

## 4) Is it safe to ignore?

Yes, the warning is effectively informational for your use case. The installed result is still the live symlinked/global registration you want, and pnpm’s docs describe `pnpm add -g .` as the supported way to make a local package’s binaries available system-wide. [irshath](https://irshath.com/blog/02-monorepo-using-pnpm-workspaces/)

The practical consequence is that pnpm is telling you it is **not enforcing** the repo’s pinned package-manager version for that global operation. That matters for policy/consistency, but it does not imply the resulting global link is broken or non-live. [pnpm](https://pnpm.io/blog/releases/11.0)

## 5) Best invocation for your script

For a dev-install script whose goal is “install the current checkout globally, live,” the pnpm-11-idiomatic command is still:

```sh
pnpm add -g .
```

That is exactly what pnpm’s `link` docs recommend as the replacement for `pnpm link --global` . If you want to minimize the warning, the best refinement is to execute it from outside the repo’s project context while passing an absolute path:

```sh
cd /tmp
pnpm add -g /absolute/path/to/agentic-hq
```

That preserves the same supported mechanism while avoiding the “inside a project with `packageManager`” context that triggers the warning. [pnpm](https://pnpm.io/blog/releases/11.0)

## 6) Practical recommendation

For your script, I would use one of these patterns:

- **Keep `pnpm add -g .`** if you value simplicity and can tolerate the warning. [irshath](https://irshath.com/blog/02-monorepo-using-pnpm-workspaces/)
- **Run from a neutral directory with an absolute repo path** if you want a clean terminal with the same install effect. [pnpm](https://pnpm.io/blog/releases/11.0)

So the short answer is: `pnpm add -g .` is the correct supported replacement for pnpm 11, but if your goal is to avoid the warning specifically, run the same command from outside the repo context and point it at the absolute repo path. [irshath](https://irshath.com/blog/02-monorepo-using-pnpm-workspaces/)

Would you like a shell-script snippet that resolves the repo path robustly and runs the clean no-warning variant?




HUMAN'S INPUT: seems to me the best course is to use "pnpm add -g ." as planned and update the warning that we output from "scripts/infra/install-dev-agentic-hq.sh" to briefly explain that the warning about "skips the package manager check for this project" is expected and is only happening because we are running pnpm from the root directory of the project (it wouldn't warn if we added it from a different directory)