Question:


I'm upgrading a project from pnpm 10 to pnpm 11 (latest: pnpm 11.1.2, Node 22.20.0, corepack-managed).

Setup: A git monorepo. The repo root has a `pnpm-workspace.yaml` whose `packages:` list *excludes* a set of self-contained single-package sub-projects (via `!.agentic-hq/plugins/**`). Each excluded sub-project lives in its own directory (e.g. `.../skills/math-workflow/ts-workflow/`), has its own `package.json`, and historically was installed by `cd`-ing into it and running `pnpm install --ignore-workspace` — the `--ignore-workspace` flag was used to stop pnpm walking up and treating the sub-project as part of the repo-root workspace.

Under pnpm 10, each sub-project approved its native build scripts (`esbuild`, `node-pty`, and a local `link:` dependency) via a `"pnpm": { "onlyBuiltDependencies": [...] }` block inside its own `package.json`.

pnpm 11 migration: `package.json#pnpm` is no longer read, and `onlyBuiltDependencies` was replaced by `allowBuilds` (a map) which lives in `pnpm-workspace.yaml`. So I gave each standalone sub-project its own `pnpm-workspace.yaml` containing:

```yaml
allowBuilds:
  agentic-hq: true
  node-pty: true
  esbuild: true
```

The problem: Running `pnpm install --ignore-workspace` in such a sub-project directory under pnpm 11:

1. Fails with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.27.7` (because `strictDepBuilds` is `true` by default in pnpm 11).
2. pnpm overwrites my hand-written `allowBuilds` map in that directory's `pnpm-workspace.yaml`, replacing it with a placeholder `allowBuilds:\n  esbuild: set this to true or false` — i.e. it did NOT read my `esbuild: true`.

If I instead run a plain `pnpm install` (no `--ignore-workspace`) in the same directory, it succeeds (exit 0, esbuild's postinstall runs) — pnpm appears to stop at the local `pnpm-workspace.yaml`, treat that directory as its own workspace root, and honour the local `allowBuilds`.

My questions:

1. Is it correct/expected that `pnpm install --ignore-workspace` in pnpm 11 causes pnpm to ignore the `allowBuilds` config in a `pnpm-workspace.yaml` that is in the current working directory (not a parent)? The `--help` text says `--ignore-workspace` "ignores `pnpm-workspace.yaml` if it exists in the *parent directory*" — but empirically it also seems to skip `allowBuilds` from a `pnpm-workspace.yaml` in the cwd. Is `allowBuilds` simply not honoured at all when `--ignore-workspace` is set, because the install is treated as "non-workspace"?

2. Is the correct pnpm 11 way for a standalone single-package project (that needs to be isolated from an enclosing repo-root workspace) to give it its own `pnpm-workspace.yaml` and install it with a plain `pnpm install` (relying on pnpm stopping at the nearest `pnpm-workspace.yaml` and never walking up to the repo root)? Is that the officially recommended pattern, and is the isolation from the repo-root workspace fully reliable that way?

3. Is there any supported way to keep using `--ignore-workspace` AND have `allowBuilds` honoured under pnpm 11? (e.g. a CLI flag, an `.npmrc` setting, an env var.) Or is dropping `--ignore-workspace` genuinely the only correct option once each sub-project has its own `pnpm-workspace.yaml`?

4. Does a single-package `pnpm-workspace.yaml` that contains only `allowBuilds:` and no `packages:` key behave correctly in pnpm 11, or should it also declare `packages:` (e.g. `packages: ['.']`)?

5. Is pnpm 11 overwriting/rewriting a user-authored `pnpm-workspace.yaml`'s `allowBuilds` section (replacing real values with `set this to true or false`) expected behaviour when it encounters an un-approved build in a non-interactive (`CI=true`) environment? Any way to make it hard-error instead of rewriting the file?

Please cite the official pnpm 11 docs / migration guide / release notes where possible.


Answer:


Yes: in pnpm 11, `--ignore-workspace` is effectively a “do not use workspace config” mode, so `allowBuilds` from a `pnpm-workspace.yaml` in the current directory is not honored the way it is during a normal workspace install. The docs for `allowBuilds` say it is read from `pnpm-workspace.yaml`, and `approve-builds` says unlisted ignored builds are added to that file during install; the migration guide also says v11 moved build-dependency settings into `pnpm-workspace.yaml`, so `--ignore-workspace` and `allowBuilds` are pulling in opposite directions. [github](https://github.com/orgs/pnpm/discussions/11360)

## 1) `--ignore-workspace` and `allowBuilds`

The expected reading of `--ignore-workspace` is that pnpm ignores workspace configuration found in the current or parent directories, not just parents. That matches the behavior you saw: a plain `pnpm install` in the subproject can load the local workspace file, while `pnpm install --ignore-workspace` bypasses it and then treats the build as unapproved, triggering `ERR_PNPM_IGNORED_BUILDS`. [pnpm](https://pnpm.io/cli/approve-builds)

So the practical answer is: yes, `allowBuilds` is not effectively honored under `--ignore-workspace` if pnpm is intentionally skipping workspace config. The docs do not present a special exception for `allowBuilds` in ignore-workspace mode, and the migration notes make clear that v11 moved these settings into workspace config rather than `package.json`. [pnpm](https://pnpm.io/migration)

## 2) Recommended isolation pattern

For a standalone subproject inside a larger monorepo, the v11-friendly pattern is to give it its own `pnpm-workspace.yaml` and run a plain `pnpm install` from that directory. pnpm’s workspace docs say it finds the workspace root via `pnpm-workspace.yaml`, and the migration guide says settings now belong in that file, with per-subproject config supported via workspace configuration rather than `package.json#pnpm`. [pnpm](https://pnpm.io/11.x/pnpm-workspace_yaml)

That approach is the most reliable one for isolation from the repo-root workspace, because pnpm uses the nearest workspace definition as the workspace root. In other words, a local `pnpm-workspace.yaml` is the right mechanism; `--ignore-workspace` is the wrong one if you still want workspace-level settings like `allowBuilds` to apply. [pnpm](https://pnpm.io/11.x/pnpm-workspace_yaml)

## 3) Can `--ignore-workspace` be kept?

I did not find an official supported switch that means “ignore the outer workspace, but still read the local `allowBuilds` from a workspace file.” The documented knobs around build approval are `pnpm approve-builds`, manual edits to `pnpm-workspace.yaml`, and the install-time `--allow-build` flow for global installs, not a special override for `install --ignore-workspace`. [pnpm](https://pnpm.io/fr/cli/approve-builds)

So the safe answer is: dropping `--ignore-workspace` is the correct option once the subproject has its own `pnpm-workspace.yaml`. If you need isolation, rely on the nearest workspace file rather than trying to combine isolation with ignore-workspace semantics. [pnpm](https://pnpm.io/migration)

## 4) Minimal workspace file

A `pnpm-workspace.yaml` that contains only `allowBuilds:` can be valid as workspace config, because pnpm v11 reads settings from that file and the `approve-builds` docs explicitly say you can edit `allowBuilds` manually. However, if you want the directory to behave as a true workspace root, I would include `packages: ['.']` so the root package is explicitly part of the workspace, matching the documented workspace model. [pnpm](https://pnpm.io/pnpm-workspace_yaml)

So: it may work without `packages:`, but `packages: ['.']` is the clearer and more robust declaration for a single-package workspace root. [pnpm](https://pnpm.io/pnpm-workspace_yaml)

## 5) Rewriting placeholder entries

Yes, the placeholder rewrite is expected behavior for pending ignored builds. The `approve-builds` docs state that during install, packages with ignored builds that are not yet listed in `allowBuilds` are automatically added to `pnpm-workspace.yaml` with a placeholder value so you can change it to `true` or `false` later. That explains why pnpm rewrites your hand-authored value when it thinks the build is unapproved. [pnpm](https://pnpm.io/cli/approve-builds)

I did not find an official setting that changes that into a hard error while still leaving the file untouched. The supported path is to predeclare the package in `allowBuilds` before install, so pnpm has no reason to auto-insert the placeholder. [pnpm](https://pnpm.io/migration)

## Practical setup

A good v11 layout for each isolated subproject is:

```yaml
# pnpm-workspace.yaml
packages:
  - "."
allowBuilds:
  agentic-hq: true
  node-pty: true
  esbuild: true
```

Then run plain `pnpm install` in that directory, not `pnpm install --ignore-workspace`. [pnpm](https://pnpm.io/11.x/pnpm-workspace_yaml)

Would you like a migration-safe template for the repo-root workspace plus nested standalone workspaces?





I said: Yes Please 

and it gave:


Here’s a migration-safe pattern for your setup: keep the repo root workspace as the umbrella, and give each truly standalone subproject its own local `pnpm-workspace.yaml` with `packages: ['.']` plus `allowBuilds` entries for its native deps. In those subprojects, run plain `pnpm install` from the subproject directory, not `--ignore-workspace`, so pnpm can use the local workspace file as the project root and honor the build approvals. [pnpm](https://pnpm.io/pnpm-workspace_yaml)

## Root workspace

At the repo root, keep only the packages that are genuinely part of the monorepo workspace, and exclude the isolated subprojects with negated patterns in `packages:`. That keeps the root install focused on the real workspace while allowing the excluded directories to function as separate pnpm projects when entered directly. [github](https://github.com/orgs/pnpm/discussions/7256)

Example root file:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - '!**/.agentic-hq/plugins/**'
```

If you use additional nested exclusions, keep them in the root workspace file rather than trying to make the standalone projects participate in the root workspace. [pnpm](https://pnpm.io/pnpm-workspace_yaml)

## Standalone subproject

Inside each standalone project, add a local `pnpm-workspace.yaml` that explicitly includes the current directory and declares the approved build list. [pnpm](https://pnpm.io/cli/approve-builds)

Example subproject file:

```yaml
packages:
  - '.'

allowBuilds:
  agentic-hq: true
  node-pty: true
  esbuild: true
```

That is the most reliable v11 pattern because the local workspace file is the source of truth for both workspace membership and build approvals. [pnpm](https://pnpm.io/migration)

## Install flow

Use this in the subproject directory:

```bash
pnpm install
```

Do not use `pnpm install --ignore-workspace` there, because that mode is meant to ignore workspace config, which defeats the point of a local `pnpm-workspace.yaml` and can cause pnpm to treat builds as unapproved again. The `approve-builds` docs explicitly say approved dependencies are written to `allowBuilds` in `pnpm-workspace.yaml`, and that unapproved ignored builds are auto-added as placeholders during install. [github](https://github.com/pnpm/pnpm/issues/7802)

## Why this works

pnpm v11 defines the workspace root from `pnpm-workspace.yaml`, and the migration guide says build-approval settings moved into that file. That means the local workspace file is the correct mechanism for isolated subprojects, while `--ignore-workspace` is the wrong mechanism if you still need workspace-level settings like `allowBuilds` to apply. [pnpm](https://pnpm.io/cli/approve-builds)

## Practical recommendation

Use two layers:

- Root workspace: owns the monorepo packages, excludes isolated subprojects. [pnpm](https://pnpm.io/pnpm-workspace_yaml)
- Local subproject workspace: owns only `.` and its own `allowBuilds`. [pnpm](https://pnpm.io/cli/approve-builds)

That gives you isolation, predictable installs, and no dependency on a flag that suppresses workspace config. [pnpm](https://pnpm.io/migration)

Would you like me to turn this into a concrete before/after tree with exact `pnpm-workspace.yaml` files for your repo?