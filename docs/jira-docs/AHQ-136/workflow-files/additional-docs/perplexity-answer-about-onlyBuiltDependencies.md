Question:


In pnpm 11, the onlyBuiltDependencies setting was removed and replaced by allowBuilds. I understand that for a workspace project this goes in pnpm-workspace.yaml. But my question is about a STANDALONE project
   that has NO pnpm-workspace.yaml and currently configures build-script approvals via the "pnpm": { "onlyBuiltDependencies": [...] } field inside its package.json.

  For pnpm 11:
  
  1. Does pnpm 11 still read settings from the "pnpm" field in package.json at all, or have all pnpm-field settings been moved out of package.json into pnpm-workspace.yaml?
  2. If a standalone (non-workspace, single-package) project keeps "pnpm": { "onlyBuiltDependencies": [...] } in its package.json and is installed with pnpm install --ignore-workspace under pnpm 11 — what 
  happens? Is the field silently ignored, does it warn, or does it error?
  3. What is the correct way for such a standalone project to whitelist build scripts (allowBuilds) under pnpm 11 — does it now REQUIRE creating a pnpm-workspace.yaml file even for a single-package project, or 
  is there a way to keep the config in package.json?
  4. With strictDepBuilds: true being the pnpm 11 default, if the old onlyBuiltDependencies config stops being honoured, will pnpm install fail when a dependency (e.g. node-pty, esbuild) has a build script that
   is no longer whitelisted?

  Please cite the pnpm 11 release notes / official migration guide. pnpm version context: latest is 11.1.2.



Answer:


Yes — in pnpm 11, the `package.json#pnpm` field is no longer read for configuration, and the old build-dependency settings were moved to `pnpm-workspace.yaml` under `allowBuilds`. pnpm’s migration guide explicitly says it “no longer reads configuration from the `pnpm` field in `package.json`,” and that `onlyBuiltDependencies`, `neverBuiltDependencies`, `ignoredBuiltDependencies`, and `onlyBuiltDependenciesFile` were consolidated into `allowBuilds`. [pnpm](https://pnpm.io/migration)

## 1) Does pnpm 11 still read `package.json#pnpm`?
No. The official v10 → v11 migration guide says pnpm no longer reads configuration from the `pnpm` field in `package.json`, and instead moves project settings into `pnpm-workspace.yaml`. The v11 release notes repeat that `package.json#pnpm` is not read anymore. That means `onlyBuiltDependencies` inside `package.json` is not a valid pnpm 11 configuration source anymore. [pnpm](https://pnpm.io/es/blog/releases/11.0)

## 2) What happens with `--ignore-workspace` in a standalone project?
The docs do not describe a special compatibility mode for keeping `onlyBuiltDependencies` in `package.json`; they say that field is simply no longer read in v11. So in practice, for a standalone project installed with pnpm 11, the setting is ignored rather than honored, and there is no official indication that pnpm emits a hard error just for the stale field itself. The build-scripts docs for v11 show that approvals are now tracked in `pnpm-workspace.yaml`, including for installs where packages with ignored builds are encountered. [pnpm](https://pnpm.io/next/cli/approve-builds)

## 3) How should a single-package project whitelist builds?
Under pnpm 11, the supported place for `allowBuilds` is `pnpm-workspace.yaml`, and the approve-builds command writes there. The migration guide says project settings move into `pnpm-workspace.yaml`, not into `package.json`. So for a standalone project, pnpm 11 still expects a `pnpm-workspace.yaml` if you want to persist `allowBuilds` in the project; there is no documented way to keep that whitelist in `package.json` anymore. [pnpm](https://pnpm.io/cli/approve-builds)

## 4) Will installs fail under `strictDepBuilds: true`?
Yes, that is the intended behavior. pnpm 11 flips `strictDepBuilds` to `true` by default, and the v11 release notes say the legacy build-dependency settings are removed in favor of `allowBuilds`. If a package like `node-pty` or `esbuild` needs a build script and it is not allowed via `allowBuilds`, pnpm will treat it as an ignored build and, with strict mode on, fail the install rather than silently proceeding. The effect is that stale `onlyBuiltDependencies` in `package.json` will no longer protect you in pnpm 11, so you need to migrate that allowlist to `pnpm-workspace.yaml` or install will break for unapproved build-script dependencies. [github](https://github.com/renovatebot/renovate/discussions/36502)

## Relevant official sources
- Migration guide: “Migrating from v10 to v11”. [pnpm](https://pnpm.io/migration)
- pnpm 11 release notes. [pnpm](https://pnpm.io/es/blog/releases/11.0)
- `pnpm approve-builds` / `allowBuilds` docs. [pnpm](https://pnpm.io/next/cli/approve-builds)

If you want, I can also give you the exact minimal `pnpm-workspace.yaml` for a one-package repo and the equivalent migration from `onlyBuiltDependencies` to `allowBuilds`.