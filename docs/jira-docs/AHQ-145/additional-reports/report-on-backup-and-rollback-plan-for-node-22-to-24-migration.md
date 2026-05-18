# AHQ-145 — Backup & Rollback Plan for the Node 22 → 24 Migration (Machine / Global State)

**File path:** `docs/jira-docs/AHQ-145/additional-reports/report-on-backup-and-rollback-plan-for-node-22-to-24-migration.md`

## Purpose / Provenance

This is **research report 3 of 3** for Jira **AHQ-145** ("Upgrade Agentic HQ to default to Node 24 LTS, supporting Node 22-24"), a mandatory deliverable per AHQ-145 Section 4. Written by a separate research agent with fresh context on **2026-05-16**. Scope is narrow: project-repo changes revert with `git checkout`; the **real** risk is **machine / global state, which is not version-controlled** — the `nvm` default alias, `~/.zshrc`, `$PATH`, globally-installed npm/pnpm packages, and Corepack's global default. This report defines what to capture before the upgrade and a step-by-step rollback for every machine-state change, and is the backbone of the manual, line-by-line upgrade script.

> **Advisory only.** Per the maintainer's standing rule, automated agents must **never** modify `~/.zshrc`, shell config, or `nvm` defaults. Every command here is run **manually by the maintainer**.

## Machine facts

- macOS, `darwin-x64` (Intel); `nvm` `0.39.7`.
- Current `nvm` default: Node 22 (`v22.20.0`). Node 24 (`v24.15.0`) **already installed** — upgrade only makes it the default.
- pnpm `11.1.2` via Corepack, pinned by `packageManager` in `package.json` (`pnpm@11.1.2+sha512.415a1cc…`).
- Only Node project on the machine.
- Gotcha: on a freshly-defaulted Node major, `pnpm` is "command not found" until `corepack enable`; the Corepack global default may also need `corepack install -g pnpm@11.1.2` for pnpm to work outside the pinned project.

**The three machine-state changes the upgrade makes:** (1) `nvm alias default 24`; (2) `corepack enable` on Node 24 (creates `pnpm`/`yarn` shims); (3) `corepack install -g pnpm@11.1.2` (sets Corepack global default). `~/.zshrc` is **not** expected to change — captured anyway as a safety net (past `pnpm setup` incidents silently appended to it).

## 1. State to capture BEFORE any change

Run all of the below while still on Node 22, save the output.

**1.0 — Create the timestamped backup dir first:**
```bash
BACKUP_DIR="$HOME/ahq-145-backup/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"; echo "Backup dir: $BACKUP_DIR"
```
Keep `BACKUP_DIR` set for all subsequent commands; re-export to the same path (don't regenerate the timestamp) in a new shell.

**1.1 — Installed Node versions/aliases** — master reference for "Node 22 state":
```bash
nvm ls > "$BACKUP_DIR/nvm-ls.txt"
nvm ls --no-colors > "$BACKUP_DIR/nvm-ls-plain.txt"
```

**1.2 — Current nvm default alias (both ways)** — `nvm alias default` prints the resolved alias; the raw file is the on-disk source of truth `nvm` restores from:
```bash
nvm alias default > "$BACKUP_DIR/nvm-alias-default.txt"
cat "$HOME/.nvm/alias/default" > "$BACKUP_DIR/nvm-alias-default-file.txt"
```

**1.3 — Active node binary and version** — confirms resolved path/version for post-rollback comparison:
```bash
which node > "$BACKUP_DIR/which-node.txt"
node --version > "$BACKUP_DIR/node-version.txt"
which npm > "$BACKUP_DIR/which-npm.txt"
npm --version > "$BACKUP_DIR/npm-version.txt"
```

**1.4 — Full PATH** — `nvm` switches Node by reordering `$PATH`; capture for diffing:
```bash
echo "$PATH" | tr ':' '\n' > "$BACKUP_DIR/path.txt"
```

**1.5 — Global npm packages** — global npm packages are per-Node-version and do NOT migrate:
```bash
npm ls -g --depth=0 > "$BACKUP_DIR/npm-global-packages.txt" 2>&1
```

**1.6 — Global pnpm packages** — records pnpm global store contents/location (likely minimal here):
```bash
pnpm ls -g --depth=0 > "$BACKUP_DIR/pnpm-global-packages.txt" 2>&1
pnpm root -g > "$BACKUP_DIR/pnpm-global-root.txt" 2>&1
```

**1.7 — Corepack version + global default** — the global default is recorded inside `COREPACK_HOME`; listing it snapshots it:
```bash
corepack --version > "$BACKUP_DIR/corepack-version.txt"
which corepack > "$BACKUP_DIR/which-corepack.txt"
ls -la "${COREPACK_HOME:-$HOME/.cache/node/corepack}" > "$BACKUP_DIR/corepack-home-listing.txt" 2>&1
```

**1.8 — pnpm version inside AND outside the project** — the key diagnostic for the gotcha:
```bash
( cd "$HOME/dev/agentic-hq/agentic-hq" && pnpm --version ) > "$BACKUP_DIR/pnpm-version-in-project.txt" 2>&1
( cd "$HOME" && pnpm --version ) > "$BACKUP_DIR/pnpm-version-outside-project.txt" 2>&1
```
Inside the project Corepack resolves pnpm from `packageManager` (expect `11.1.2`); outside it uses the Corepack global default (may differ or error).

**1.9 — Timestamped copy of `~/.zshrc`** — highest-consequence file, the only rollback path for it:
```bash
cp -p "$HOME/.zshrc" "$BACKUP_DIR/.zshrc.backup-$(date +%Y%m%d-%H%M%S)"
# optionally also: ~/.zprofile, ~/.zshenv (nvm is sometimes sourced from .zprofile on macOS)
for f in .zprofile .zshenv; do [ -f "$HOME/$f" ] && cp -p "$HOME/$f" "$BACKUP_DIR/$f.backup-$(date +%Y%m%d-%H%M%S)"; done
```

**1.10 — Manifest** — self-describing index:
```bash
{ echo "AHQ-145 pre-upgrade backup"; echo "Captured: $(date)"; echo "Host: $(hostname)"; echo "Backup dir: $BACKUP_DIR"; } > "$BACKUP_DIR/MANIFEST.txt"
ls -la "$BACKUP_DIR" >> "$BACKUP_DIR/MANIFEST.txt"
```

## 2. Step-by-step rollback procedure

Roll back in **reverse order** of application (#3 → #2 → #1).

**Rollback of #1 — `nvm alias default 24`:**
```bash
nvm alias default 22
nvm use default
nvm alias default   # expect: default -> 22 (-> v22.20.0)
node --version      # expect: v22.20.0
```
If `nvm alias` misbehaves, restore the raw alias file: `cp "$BACKUP_DIR/nvm-alias-default-file.txt" "$HOME/.nvm/alias/default" && nvm use default`. `nvm alias default 24` does not delete Node 22; open a new terminal to confirm.

**Rollback of #2 — `corepack enable` on Node 24:**
```bash
nvm use 24
corepack disable
ls -la "$HOME/.nvm/versions/node/v24.15.0/bin" | grep -E 'pnpm|yarn' || echo "no corepack shims present"
```
`corepack disable` removes shims from the active Node install only — per-Node-install scoped, cannot affect Node 22.

**Rollback of #3 — `corepack install -g pnpm@11.1.2`:**
```bash
diff <(ls -la "${COREPACK_HOME:-$HOME/.cache/node/corepack}") "$BACKUP_DIR/corepack-home-listing.txt"
```
- If a global default existed before: `corepack install -g pnpm@<previous-version-from-backup>`.
- If no global default existed (likely here): `rm -rf "${COREPACK_HOME:-$HOME/.cache/node/corepack}"` — this clears only a cache; Corepack re-hydrates on demand.

**Rollback of `~/.zshrc` (only if modified):**
```bash
diff "$HOME/.zshrc" "$BACKUP_DIR/.zshrc.backup-"*
# only if the diff shows unexpected change:
cp "$BACKUP_DIR/.zshrc.backup-"* "$HOME/.zshrc"
```

**Post-rollback verification:** re-run captures and diff against backup — `nvm alias default`, `node --version`, `which node`, `echo $PATH | tr ':' '\n' | diff - "$BACKUP_DIR/path.txt"`, and `pnpm --version` inside the project (expect `11.1.2`).

## 3. What can and cannot easily be rolled back

| Change | Reversible? | Assessment |
|--------|-------------|------------|
| `nvm alias default 24` | **Trivially** | `nvm alias default 22`; alias is one small file, restorable by copy. Deterministic, no data loss. |
| `corepack enable` on Node 24 | **Yes, cleanly** | `corepack disable` removes the shims; per-Node-install scoped, cannot touch Node 22. |
| `corepack install -g pnpm@11.1.2` | **Yes** | Re-pin previous global default, or delete `COREPACK_HOME` (a cache); re-hydrates on demand. |
| `~/.zshrc` modification | **Yes, IF backed up first** | The timestamped `cp` backup is the **only** rollback path — no `git` history exists for it. |
| Node 24 already installed | **N/A** | Not part of this upgrade — nothing to roll back. |
| Global npm packages on Node 24 | **Not automatic** | Per-Node-version, don't migrate; the Section 1.5 capture lets you detect and manually reinstall. No one-command undo, but Node's per-version isolation makes it a non-issue unless globals are installed onto Node 24 (the upgrade doesn't). |

**Bottom line:** every deliberate change is mechanically and cleanly reversible. The only genuinely irreversible-without-a-backup item is `~/.zshrc` — hence Section 1.9 is non-negotiable.

## 4. Recommended backup directory layout

```
~/ahq-145-backup/20260516-141500/
├── MANIFEST.txt
├── nvm-ls.txt / nvm-ls-plain.txt
├── nvm-alias-default.txt / nvm-alias-default-file.txt
├── which-node.txt / node-version.txt / which-npm.txt / npm-version.txt
├── path.txt
├── npm-global-packages.txt
├── pnpm-global-packages.txt / pnpm-global-root.txt
├── corepack-version.txt / which-corepack.txt / corepack-home-listing.txt
├── pnpm-version-in-project.txt / pnpm-version-outside-project.txt
└── .zshrc.backup-20260516-141500
```
One timestamped dir per run; all text, small. Keep until the upgrade is confirmed stable (~a week of use).

## 5. Closing note — Node 22 is KEPT installed

The maintainer has **chosen not to `nvm uninstall 22`**. Node 22 (`v22.20.0`) stays fully installed alongside Node 24 — itself the **simplest, strongest rollback safety net**. The whole upgrade undoes with one command: `nvm alias default 22 && nvm use default`, because the Node 22 install, its global packages, and its Corepack/pnpm setup are all physically present and untouched. The Corepack and `~/.zshrc` rollback steps are for completeness/edge cases.

## Implications for the AHQ-145 upgrade-script design

- The script must be **manual / line-by-line** — agents cannot run `nvm alias default`, `corepack enable`, or any `~/.zshrc`-touching step.
- **Step 0 must be the Section 1 capture** — the upgrade should not proceed until `$BACKUP_DIR` exists and is populated.
- Pass `$BACKUP_DIR` through as a shell variable so capture, upgrade, and rollback share one directory.
- Forward order: (1) `nvm alias default 24` + `nvm use default`, (2) `corepack enable` on Node 24, (3) `corepack install -g pnpm@11.1.2`, then verify `pnpm --version` inside and outside the project. **Rollback is reverse order.**
- Build the verification commands in as explicit post-step checks so a failed step is caught immediately.
- Each rollback command should appear as a labelled "ROLLBACK" block beside its forward step.

---

Sources: [nvm-sh/nvm README](https://github.com/nvm-sh/nvm), [nodejs/corepack README](https://github.com/nodejs/corepack/blob/main/README.md), [Corepack — Node.js docs](https://nodejs.org/api/corepack.html)
