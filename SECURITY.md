# Security Policy

Thank you for helping keep Agentic HQ and its users safe. This document explains how to report a vulnerability responsibly.

## Reporting a vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.** Use one of the private channels below.

NOTE: Until the Agentic HQ has been made public, it isn't possible to enable "Private Vulnerability Reporting".  This is due to be done under Jira:
https://agentic-hq.atlassian.net/browse/AHQ-137 - PostLaunch: When GitHub Repo Goes Public: Enable Privately reporting a security vulnerability
as soon as the project is made public.  If the links below don't work, please report this via the contact form at https://agentichq.ai/

**Preferred — GitHub Private Vulnerability Reporting:**
- Go to the repository's [Security tab](https://github.com/Agentic-HQ/agentic-hq/security) and click **"Report a vulnerability"**.
- This routes your report privately to the maintainers and does not expose your contact details publicly.

**Alternative — agentichq.ai contact form:**
- Use the contact form at [https://agentichq.ai/](https://agentichq.ai/) if you prefer not to use GitHub, or if the GitHub channel is unavailable.

## What to include

A useful report typically contains:

- A clear description of the vulnerability and its impact.
- Steps to reproduce, or a proof-of-concept.
- The version / commit of Agentic HQ you tested against.
- Your environment (macOS version, Node version, pnpm version).
- Whether the issue is already public anywhere, and if so, where.

## Response expectations

Agentic HQ is maintained by one person at present.

- We aim to **acknowledge your report within 7 days**.
- We will keep you informed as we investigate, fix, and (if appropriate) publish a public advisory.
- For confirmed vulnerabilities, we'll coordinate disclosure timing with you.

If you don't hear back within 7 days, please nudge us via the alternative channel above — it's more likely we missed the notification than ignored you.

## Scope

In-scope:

- Anything in this repository that could allow an attacker to compromise a user's machine, their data, or any system the user can access.
- The **auto-approved Claude Code tool permissions** invoked by `agentic-hq` workflows. The set of permissions and their consequences are documented in [`docs/user-docs/WARNING-re-auto-approved-claude-permissions.md`](./docs/user-docs/WARNING-re-auto-approved-claude-permissions.md); flaws that broaden what those permissions can do, or that allow a workflow to invoke them without the user being aware, are explicitly in scope.
- Supply-chain risks introduced by our dependencies, install scripts, or plugin marketplaces.
- Prompt-injection vectors that can cause Agentic HQ to take destructive or exfiltrative actions on a user's machine.

Out of scope:

- Issues in third-party services (Claude Code itself, the Anthropic API, Atlassian / Jira, GitHub, MCP servers we don't control). Please report those upstream.
- Theoretical attacks requiring already-compromised local accounts or already-malicious user input that the user explicitly typed.

## No bug bounty

We do not currently offer financial rewards for vulnerability reports. We do credit reporters in advisories where you wish to be credited.

## Public disclosure

We will publish a GitHub Security Advisory (and a CVE where applicable) once a fix is available, including credit to the reporter unless you request anonymity.
