# AHQ-136 — Jira update for the 2026-05-16 scope change

> **For the human to apply manually** in Jira (https://agentic-hq.atlassian.net/browse/AHQ-136).
> Editing the Jira via the API breaks the formatting, so this doc gives you the exact text
> to paste in yourself.

---

## 1. Change the issue Title (Summary)

**From:**

```
Upgrade pnpm from 10 to 11
```

**To:**

```
Upgrade pnpm From 10 To 11 As Global Default, In Agentic HQ And Workflow Typescript Projects
```

---

## 2. Add this new requirement to the Description

Add the following block to the Acceptance Criteria / Requirements section of the
description (it is a new, additional requirement — it does not replace anything):

---

**New requirement — pnpm 11 as the corepack global default**

There is exactly one `pnpm` on the machine: the **corepack shim**. corepack resolves the
pnpm version **per-directory** from each project's `packageManager` field:

- Inside `agentic-hq/` (which pins `pnpm@11.1.2`) → corepack runs **pnpm 11.1.2**.
- In any directory with no `packageManager` pin (e.g. `/tmp`) → corepack runs its **global
  default**, which after this upgrade is still **pnpm 10.33.0**.

Because pnpm 10 and pnpm 11 disagree about the global bin directory (`$PNPM_HOME` vs
`$PNPM_HOME/bin`), `cd /tmp; pnpm list -g` invokes pnpm 10.33.0, which errors with
`global bin directory ... is not in PATH` and does not list the globally-installed
`agentic-hq`.

**Acceptance:** pnpm 11 must also become the **corepack global default**, so that from
*any* directory `pnpm` is v11 and `cd /tmp; pnpm list -g` runs without error and lists
`agentic-hq`.

This is a **global machine change** — it is delivered as **human-run instructions**
(the human runs `corepack install -g pnpm@11.1.2` and verifies), not done by the AI agent.

---

## 3. Why the scope changed (background — optional, for the description or a comment)

The original AHQ-136 scope was just "upgrade the package manager in the agentic-hq repo".
During manual verification it emerged that upgrading the *repo's* pin to pnpm 11 does not
make pnpm 11 the machine default — corepack still falls back to pnpm 10.33.0 outside a
pinned project. Since the dev-install script registers `agentic-hq` as a global binary,
and global pnpm operations are expected to work from any directory, the scope was widened
to also make pnpm 11 the corepack global default. The new title reflects this.
