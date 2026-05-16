Question:

What happens to globally installed binaries when you upgrade from 10 to 11, and do the pnpm project recommended you (a) leave the old binaries in the old location (harmless) or (b) clean them up?

Answer:


When you upgrade from pnpm v10 to v11, your globally installed packages and their binaries undergo a major structural change due to pnpm 11’s new architecture.

Here is exactly what happens and what you need to do about it:

## What Happens to Global Binaries in v11?

In pnpm v11, global installations are completely isolated and use a **global virtual store**. Instead of dumping everything into a shared folder, every time you run `pnpm add -g <pkg>`, pnpm creates a distinct, sandboxed directory under:

`{pnpmHomeDir}/global/v11/{hash}/`

Because of this new directory structure, **pnpm v11 does not automatically migrate, look at, or recognize your old v10 global binaries**.

* Running `pnpm list -g` in v11 will show an empty list.
* Your old v10 binaries are effectively "orphaned" in their old location (`{pnpmHomeDir}/global/v5/` or similar v10 layout).
* If you run `pnpm setup` after upgrading, pnpm will update your system's `PATH` variable to look at the new v11 binary location. Consequently, trying to run your old global CLI tools will result in a "command not found" error until you reinstall them.

---

## Clean Them Up or Leave Them?

The pnpm project strongly recommends **cleaning them up**.

While technically leaving them there is "harmless" in the sense that they won't corrupt your new pnpm 11 installation, leaving them creates a few issues:

1. **Wasted Disk Space:** They will sit in a limbo state, taking up storage with no way for pnpm v11 to manage or delete them.
2. **Path Conflicts:** If your shell configuration ever falls back to older path declarations, you might accidentally trigger an outdated v10 binary instead of your intended v11 version.

### The Migration Checklist

To smoothly handle your global binaries during the upgrade, you should follow this manual workflow:

1. **List your old globals:** If you haven't upgraded yet (or still have a way to check), take note of what you have installed globally.
2. **Clean up the old layout:** Locate your old global storage directory (usually inside `~/.local/share/pnpm/global` on Linux/macOS or `%LocalAppData%\pnpm\global` on Windows) and delete the old versioned folders (like `v5`) to reclaim space.
3. **Update your shell:** Run the setup command so pnpm can point your system's environment variables to the right v11 path:
```bash
pnpm setup

```


4. **Reinstall your binaries:** Freshly install your required global tools using the updated v11 syntax:
```bash
pnpm add -g <package-name>

```


*(Note: `pnpm install -g` with no arguments is no longer supported in v11; you must explicitly use `pnpm add -g`).*







Question:


Whats the single command to list my old globals?


Answer:

To list your old pnpm globals using a single command, you need to explicitly point pnpm to the directory where your v10 configuration lives, bypassing the new v11 default.

Run this single command in your terminal:

```bash
pnpm --dir "$(pnpm store path | sed 's|/store/v3||')/global/v5" list

```

### How it works:

* **`pnpm store path`**: Dynamically finds your local pnpm storage base directory (so this command works automatically on Mac, Linux, and Windows).
* **`sed 's|/store/v3||'`**: Trims off the internal store path to get back to the root pnpm data folder.
* **`--dir ".../global/v5"`**: Forces pnpm to execute the list command inside the exact directory where the old v10 (`v5` layout) globals are stored.



Question:

I'm running pnpm 11 already - how to list the old global binaries please?


Answer:


pnpm --dir ~/Library/pnpm/global/5 list




Steve ran this and got:


(base) stevepersonal@Steves-MacBook-Pro-4 agentic-hq % pnpm --dir ~/Library/pnpm/global/5 list
Legend: production dependency, optional only, dev only

/Users/stevepersonal/Library/pnpm/global/5
│
│   dependencies:
├── agentic-hq@link:../../../../dev/agentic-hq/agentic-hq
├── agentic-hq-with-colours-classwitch-override@link:../../../../dev/agentic-hq/agentic-hq-with-colours-classwitch-override
└── temp-agentic-hq-with-colours@link:../../../../dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120

3 packages
(base) stevepersonal@Steves-MacBook-Pro-4 agentic-hq % 