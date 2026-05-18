#!/usr/bin/env bash
# =============================================================================
# AHQ-145 — Manual Node 22 -> 24 LTS machine-upgrade script
# =============================================================================
#
# PURPOSE
#   Makes Node.js 24 LTS the maintainer's machine default, while KEEPING Node 22
#   installed. The Agentic HQ repo itself already accepts both lines
#   (engines.node = "^22.0.0 || ^24.0.0"); this script changes MACHINE / GLOBAL
#   state, which is NOT version-controlled.
#
# HOW TO USE THIS FILE  ***  READ THIS FIRST  ***
#   This is NOT a script to run all at once. Run it MANUALLY, ONE LINE AT A TIME.
#   After each state-changing command, run the verification line beneath it and
#   check the actual output against the "# EXPECT:" comment before continuing.
#   If anything does not match, STOP and use the ROLLBACK section at the end.
#
#   An AI agent must NOT run this script — every command here is run by the
#   human maintainer (it touches nvm defaults, Corepack, and possibly ~/.zshrc).
#
# MACHINE FACTS (from research report 3, AHQ-145/additional-reports/)
#   - macOS; nvm-managed Node.
#   - Node 24 (v24.x) is ALREADY INSTALLED — this script does NOT install Node.
#   - Node 22 (v22.20.0) stays installed: it is the simplest rollback safety net.
#   - pnpm 11.1.2 via Corepack, pinned by "packageManager" in package.json.
#   - Gotcha: on a freshly-defaulted Node major, `pnpm` is "command not found"
#     until `corepack enable` is run for THAT Node version.
#
# THE THREE MACHINE-STATE CHANGES THIS SCRIPT MAKES
#   1. nvm alias default 24
#   2. corepack enable            (on Node 24 — creates pnpm/yarn shims)
#   3. corepack install -g pnpm@11.1.2   (sets Corepack global default)
#   ~/.zshrc is NOT expected to change — it is backed up anyway as a safety net.
# =============================================================================


# -----------------------------------------------------------------------------
# CONFIG — confirm this path points at your Agentic HQ repo before continuing.
# -----------------------------------------------------------------------------
PROJECT_DIR="$HOME/dev/agentic-hq/agentic-hq"
ls "$PROJECT_DIR/package.json"
# EXPECT: prints the path with no error. If "No such file", fix PROJECT_DIR.


# =============================================================================
# STEP 0 — BACKUP: capture machine state BEFORE any change (run on Node 22)
# =============================================================================
# Do NOT proceed past Step 0 until $BACKUP_DIR exists and is fully populated.

# 0.0 — Create the timestamped backup directory. Keep BACKUP_DIR set for the
#       whole session. In a new shell, re-export the SAME path (do not
#       regenerate the timestamp).
BACKUP_DIR="$HOME/ahq-145-backup/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup dir: $BACKUP_DIR"
# EXPECT: prints "Backup dir: /Users/<you>/ahq-145-backup/<timestamp>"

# 0.1 — Installed Node versions / aliases (master reference for "Node 22 state").
nvm ls > "$BACKUP_DIR/nvm-ls.txt"
nvm ls --no-colors > "$BACKUP_DIR/nvm-ls-plain.txt"

# 0.2 — Current nvm default alias (resolved form + raw on-disk file).
nvm alias default > "$BACKUP_DIR/nvm-alias-default.txt"
cat "$HOME/.nvm/alias/default" > "$BACKUP_DIR/nvm-alias-default-file.txt"

# 0.3 — Active node/npm binary + version.
which node > "$BACKUP_DIR/which-node.txt"
node --version > "$BACKUP_DIR/node-version.txt"
which npm > "$BACKUP_DIR/which-npm.txt"
npm --version > "$BACKUP_DIR/npm-version.txt"

# 0.4 — Full PATH (nvm switches Node by reordering $PATH; capture for diffing).
echo "$PATH" | tr ':' '\n' > "$BACKUP_DIR/path.txt"

# 0.5 — Global npm packages (per-Node-version; they do NOT migrate to Node 24).
npm ls -g --depth=0 > "$BACKUP_DIR/npm-global-packages.txt" 2>&1

# 0.6 — Global pnpm packages + global root location.
pnpm ls -g --depth=0 > "$BACKUP_DIR/pnpm-global-packages.txt" 2>&1
pnpm root -g > "$BACKUP_DIR/pnpm-global-root.txt" 2>&1

# 0.7 — Corepack version + global default snapshot.
corepack --version > "$BACKUP_DIR/corepack-version.txt"
which corepack > "$BACKUP_DIR/which-corepack.txt"
ls -la "${COREPACK_HOME:-$HOME/.cache/node/corepack}" > "$BACKUP_DIR/corepack-home-listing.txt" 2>&1

# 0.8 — pnpm version INSIDE and OUTSIDE the project (the key gotcha diagnostic).
( cd "$PROJECT_DIR" && pnpm --version ) > "$BACKUP_DIR/pnpm-version-in-project.txt" 2>&1
( cd "$HOME" && pnpm --version ) > "$BACKUP_DIR/pnpm-version-outside-project.txt" 2>&1

# 0.9 — Timestamped copy of ~/.zshrc (highest-consequence file; only rollback
#       path for it — there is no git history). Also back up .zprofile/.zshenv.
cp -p "$HOME/.zshrc" "$BACKUP_DIR/.zshrc.backup-$(date +%Y%m%d-%H%M%S)"
for f in .zprofile .zshenv; do [ -f "$HOME/$f" ] && cp -p "$HOME/$f" "$BACKUP_DIR/$f.backup-$(date +%Y%m%d-%H%M%S)"; done

# 0.10 — Manifest (self-describing index of the backup).
{ echo "AHQ-145 pre-upgrade backup"; echo "Captured: $(date)"; echo "Host: $(hostname)"; echo "Backup dir: $BACKUP_DIR"; } > "$BACKUP_DIR/MANIFEST.txt"
ls -la "$BACKUP_DIR" >> "$BACKUP_DIR/MANIFEST.txt"

# 0.11 — VERIFY the backup is complete before going any further.
cat "$BACKUP_DIR/MANIFEST.txt"
# EXPECT: lists every file from steps 0.1-0.9 (nvm-ls.txt, path.txt,
#         .zshrc.backup-*, etc.). If anything is missing, STOP and re-run it.


# =============================================================================
# STEP 1 — Verify Node 24 is already installed (this script does NOT install it)
# =============================================================================
nvm ls 24
# EXPECT: shows an installed v24.x line (e.g. "v24.15.0"). If it prints "N/A"
#         the Node 24 line is not installed — STOP. Installing Node is out of
#         scope for this script; install it separately (`nvm install 24`) and
#         then restart from Step 1.


# =============================================================================
# STEP 2 — MACHINE CHANGE #1: make Node 24 the nvm default
# =============================================================================
nvm alias default 24
nvm use default

# VERIFY:
nvm alias default
# EXPECT: default -> 24 (-> v24.x.x)
node --version
# EXPECT: v24.x.x


# =============================================================================
# STEP 3 — MACHINE CHANGE #2: enable Corepack on Node 24
# =============================================================================
# On a freshly-defaulted Node major, `pnpm` is "command not found" until this
# runs. Corepack is enabled PER Node installation.
corepack enable

# VERIFY:
which pnpm
# EXPECT: a path under the Node 24 install, e.g.
#         /Users/<you>/.nvm/versions/node/v24.x.x/bin/pnpm


# =============================================================================
# STEP 4 — MACHINE CHANGE #3: set the Corepack global pnpm default
# =============================================================================
# Needed so `pnpm` resolves OUTSIDE the project too (inside the project,
# Corepack already resolves pnpm@11.1.2 from package.json's "packageManager").
# If Step 5's "outside the project" check already prints 11.1.2, this step can
# be skipped — run it only if pnpm fails or resolves a different version.
corepack install -g pnpm@11.1.2

# VERIFY:
( cd "$HOME" && pnpm --version )
# EXPECT: 11.1.2


# =============================================================================
# STEP 5 — Verify pnpm resolves correctly inside AND outside the project
# =============================================================================
( cd "$PROJECT_DIR" && pnpm --version )
# EXPECT: 11.1.2   (resolved from package.json "packageManager")
( cd "$HOME" && pnpm --version )
# EXPECT: 11.1.2   (resolved from the Corepack global default set in Step 4)


# =============================================================================
# STEP 6 — Repo verification on Node 24
# =============================================================================
# 6.1 — Reinstall dependencies on Node 24 (native addons such as node-pty are
#       ABI-specific; a fresh install rebuilds/relinks them for Node 24).
cd "$PROJECT_DIR"
pnpm install
# EXPECT: completes with no error; the "postinstall" chmod step runs.

# 6.2 — Full validation gate (typecheck + lint + format + unit tests).
pnpm validate
# EXPECT: all four checks pass, ending with all unit tests green.

# 6.3 — End-to-end smoke test: run the string-reversal demo workflow.
agentic-hq reversal -- --string-to-reverse=hello
# EXPECT: the workflow runs and reports the reversed string "olleh".
#         (If `agentic-hq` is "command not found", run Step 6.4 first.)

# 6.4 — Smoke-test the install scripts on Node 24.
scripts/infra/install-dev-agentic-hq.sh
# EXPECT: completes; `agentic-hq` is registered globally (open a new terminal
#         if the shell has not picked up the symlink).
scripts/infra/install-prod-agentic-hq.sh
# EXPECT: completes with no error.

# -----------------------------------------------------------------------------
# UPGRADE COMPLETE. Node 24 is now the machine default; Node 22 is still
# installed. Keep $BACKUP_DIR until the upgrade has been stable for ~a week.
#
# NOTE: Node 22 is intentionally KEPT — do NOT run `nvm uninstall 22`. The
# Node 22 install is the simplest, strongest rollback safety net.
# -----------------------------------------------------------------------------


# #############################################################################
# # ROLLBACK SECTION — commented out. Uncomment and run line-by-line ONLY if
# # the upgrade needs to be reverted. Roll back in REVERSE order (#3 -> #2 -> #1).
# #############################################################################
#
# # --- ROLLBACK of STEP 4 — Corepack global pnpm default -----------------------
# # Compare current Corepack home against the backup:
# diff <(ls -la "${COREPACK_HOME:-$HOME/.cache/node/corepack}") "$BACKUP_DIR/corepack-home-listing.txt"
# # If a global default existed BEFORE the upgrade, re-pin that version:
# #   corepack install -g pnpm@<previous-version-from-backup>
# # If NO global default existed before (likely), just clear the cache — it
# # re-hydrates on demand:
# #   rm -rf "${COREPACK_HOME:-$HOME/.cache/node/corepack}"
#
# # --- ROLLBACK of STEP 3 — corepack enable on Node 24 -------------------------
# nvm use 24
# corepack disable
# ls -la "$HOME/.nvm/versions/node/v24."*/bin | grep -E 'pnpm|yarn' || echo "no corepack shims present"
# # EXPECT: "no corepack shims present" (corepack disable is per-Node-install).
#
# # --- ROLLBACK of STEP 2 — nvm default back to Node 22 ------------------------
# nvm alias default 22
# nvm use default
# nvm alias default
# # EXPECT: default -> 22 (-> v22.20.0)
# node --version
# # EXPECT: v22.20.0
# # If `nvm alias` misbehaves, restore the raw alias file from the backup:
# #   cp "$BACKUP_DIR/nvm-alias-default-file.txt" "$HOME/.nvm/alias/default" && nvm use default
#
# # --- ROLLBACK of ~/.zshrc — ONLY if it was unexpectedly modified -------------
# diff "$HOME/.zshrc" "$BACKUP_DIR/.zshrc.backup-"*
# # Only if the diff shows an unexpected change:
# #   cp "$BACKUP_DIR/.zshrc.backup-"* "$HOME/.zshrc"
#
# # --- POST-ROLLBACK verification ----------------------------------------------
# nvm alias default            # EXPECT: default -> 22 (-> v22.20.0)
# node --version               # EXPECT: v22.20.0
# which node                   # EXPECT: matches "$BACKUP_DIR/which-node.txt"
# echo "$PATH" | tr ':' '\n' | diff - "$BACKUP_DIR/path.txt"   # EXPECT: no diff
# ( cd "$PROJECT_DIR" && pnpm --version )                      # EXPECT: 11.1.2
# #############################################################################
