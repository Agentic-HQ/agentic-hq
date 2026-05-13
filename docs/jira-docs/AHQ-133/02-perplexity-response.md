<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I'm writing a CONTRIBUTING.md for an early-stage (v0.1.0), MIT-licensed open-source TypeScript project called "Agentic HQ". It's a thin TypeScript wrapper around Anthropic's Claude Code that lets developers chain Claude Code Skills into multi-step AI workflows.

Project context:

- Pre-public release; the repo is currently private and going public soon. CONTRIBUTING.md is one of the last items needed before launch.
- The project itself is built largely by its founder collaborating with Claude Code (i.e. the project's subject matter and its construction method are the same thing). It is inherently AI-collaborative.
- Very strict internal conventions (encoded in CLAUDE.md): TDD mandatory (strict Red-Green-Refactor cycle), pnpm + corepack, a single `pnpm validate` command (typecheck + lint + format + unit tests) that must pass before every commit, all internal work tracked in a Jira project (AHQ-xxx), fail-fast configuration (no catch-and-fallback), no underscore-suffix for warning suppression, no "-er" suffix classes, and many similar opinionated rules.
- macOS-only tested so far (Linux likely works; Windows via WSL might work).
- Plugin-based architecture using Claude Code's official plugin format; third-party plugins are anticipated.
- One maintainer at the moment.

I want concrete, current (2025–2026) best-practice recommendations on the following, with reasoning for each:

1. How to handle AI-generated contributions in CONTRIBUTING.md. Should we (a) explicitly welcome them, (b) require disclosure on the PR, (c) impose a quality bar like Prettier's "low-quality AI contributions will be closed immediately"? What wording is becoming the norm in 2025–2026 for AI-aware open-source projects?
2. Primary contributor onramp: when a project already uses Jira internally but is becoming public, should external contributors enter through GitHub Issues, public Jira, or both? Pros and cons.
3. Commit conventions: should we keep our idiosyncratic internal `/commit` workflow as a *requirement* for external contributors, or adopt Conventional Commits for outside-the-team contributions? Trade-offs for changelog automation.
4. TDD enforcement on outside contributions: how do other strict-TDD open-source projects in 2025–2026 actually enforce it? Procedural ritual, reviewer judgement, CI checks, or just documentation?
5. CLA, DCO, or neither for a small early-stage MIT-licensed TypeScript project. What is current best practice?
6. Companion files to ship alongside CONTRIBUTING.md (CODE_OF_CONDUCT.md, SECURITY.md, ISSUE_TEMPLATE/, PR template, FUNDING.yml, etc.) — minimum viable set for a 2026 launch?
7. Plugin/extension ecosystem hosting: when a project supports plugins, should the plugins live in the main repo or in separate repos curated via a marketplace/list? What patterns work well at small scale (under ~10 third-party plugins)?
8. Setting expectations about maintainer bandwidth: how do solo-maintained projects honestly signal response time without sounding off-putting? Any wording you've seen that works well?
9. Examples from comparable small-to-medium TypeScript projects (well under 100 active contributors, opinionated, AI-friendly or AI-aware) whose CONTRIBUTING.md is worth reading.
10. Anything 2025–2026-specific I should include that older guides typically miss (LLM-related licensing concerns, attribution for AI-assisted code, supply-chain hygiene, etc.).

Please give concrete recommendations and reasoning, not generic advice. Where you cite examples, link them.

For **Agentic HQ**, I would explicitly welcome AI-assisted contributions, require disclosure for meaningful AI use, and set a clear quality bar that says AI is allowed but never a substitute for understanding, tests, or maintainability. That combination is the direction many AI-aware OSS projects are moving in: permissive about tools, strict about standards, and explicit about contributor responsibility.[^1][^2][^3]

## 1) AI-generated contributions

The strongest 2025–2026 pattern is: “AI is allowed, disclose meaningful use, human remains responsible.” That is more durable than a blanket welcome and more practical than a hard ban, because it avoids stigma while preserving review clarity.[^2][^3][^1]
I would **not** use wording that sounds like a threat-first posture unless your repo is already high-noise or abuse-prone. Prettier-style language such as “low-quality AI contributions will be closed immediately” signals seriousness, but for an early-stage project it can read as hostile unless softened with a quality rubric and a disclosure expectation.[^1][^2]
Recommended wording: “AI assistance is welcome, but contributors must disclose meaningful AI use in the PR description, and all contributions must meet the same standards for correctness, tests, and maintainability as human-written work.”[^3][^1]

A useful nuance is to define “meaningful” AI use, so contributors do not spam disclosures for autocomplete. Practical threshold: disclose if AI helped generate or rewrite nontrivial code, influenced architecture, wrote substantial docs/comments, or materially aided debugging; don’t require disclosure for trivial completions or typo fixes.[^2][^1]
For Agentic HQ, I’d add one sentence acknowledging your own workflow: “This project is built collaboratively with Claude Code; we therefore care about process transparency, not tool purity.” That framing is unusually honest and fits your project’s identity.

## 2) Issues and Jira

For a project that is becoming public but still run by one maintainer, the best default is **GitHub Issues for external contributors, Jira for internal tracking**. GitHub is where contributors already are, it lowers friction, and GitHub templates/workflows are built for public OSS contribution intake.[^4][^5][^6]
Public Jira is usually a bad first choice for small OSS projects unless you already have a strong external community using Atlassian tools, because it adds an account/login burden and exposes internal project structure you may not want to standardize yet. It can also create duplicate-system drift unless one system is clearly authoritative.[^5][^4]
A clean compromise is: “External ideas/bugs start in GitHub Issues; maintainers triage into Jira as needed.” That preserves your internal AHQ-xxx convention without forcing outsiders into it. If you later get many contributors, you can add a public Jira mirror or a read-only roadmap view, but I would not start there.

## 3) Commit conventions

Do **not** require external contributors to use your internal `/commit` workflow if it is idiosyncratic or tool-specific. That is the sort of thing that often works inside a team but becomes a barrier for drive-by contributors and first-timers.
Instead, I would make the PR title and commit message convention external-facing and use **Conventional Commits** for public contributions if you want changelog automation. Conventional Commits are widely understood, automate release notes well, and fit small projects better than enforcing a bespoke workflow at the repo edge.
You can keep your internal `/commit` process for maintainers and Claude-driven work, but do not make it a hard requirement for outside PRs. In the CONTRIBUTING.md, say something like: “External contributors may use Conventional Commits; maintainers may squash or normalize commit history during merge.” That keeps release automation intact without overfitting the contributor experience.

## 4) TDD enforcement

Strict-TDD projects usually enforce it through a mix of **documentation, reviewer judgement, and CI expectations**, not through an automated proof that every change was TDD. In practice, the enforceable part is that changes should come with failing-then-passing tests, and reviewers reject PRs that add behavior without test coverage or with brittle, implementation-coupled tests.
For your repo, I would state TDD as a **hard contribution rule** but enforce it procedurally: ask for tests in every behavioral PR, require CI to pass `pnpm validate`, and have reviewers verify that the change is test-first in spirit. CI can confirm outcomes, but it cannot reliably prove the sequence of Red-Green-Refactor.[^7][^8]
A good CONTRIBUTING.md phrase is: “Behavioral changes must be driven by tests; PRs without meaningful test coverage will not be merged.” That is enforceable without pretending automation can detect process purity. If a contributor adds docs or a trivial refactor, you can exempt that explicitly.

## 5) CLA, DCO, or neither

For a small MIT-licensed TypeScript project with one maintainer, the current best practice is usually **neither CLA nor heavy legal intake**, unless you have a specific corporate distribution goal. A DCO is lighter than a CLA and has become attractive for projects that want contributor sign-off without legal friction; OpenStack’s 2025 shift from CLA to DCO is a strong signal of that direction.[^9][^10]
My recommendation is: start with **DCO-style sign-off only if you expect meaningful external code** or want a clear provenance record; otherwise keep it simple and do not add a CLA yet. For an early-stage MIT repo, a CLA is usually overkill and likely to slow first contributions more than it helps.
If you do choose something, DCO is the better default because it is lightweight and familiar to OSS contributors. The trade-off is that DCO gives you less customized legal control than a CLA, but most small projects do not need that extra control.

## 6) Minimum file set

For a 2026 launch, the minimum viable companion set I would ship is: `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, one issue template, and one pull request template. GitHub supports templates cleanly, and these files cover community behavior, vulnerability reporting, and contribution intake without overbuilding governance.[^6][^11][^4][^5]
If you want one more lightweight add-on, include `FUNDING.yml` only if you already have a sponsor path worth advertising. Otherwise, it can wait. I would not add multiple templates or a large policy zoo before launch unless you already know the repo will receive heavy traffic.
A practical small-project layout is:

- `CONTRIBUTING.md`.
- `CODE_OF_CONDUCT.md`.
- `SECURITY.md`.
- `.github/PULL_REQUEST_TEMPLATE.md`.
- `.github/ISSUE_TEMPLATE/bug_report.md`.
- `.github/ISSUE_TEMPLATE/feature_request.md`.


## 7) Plugin ecosystem hosting

At under ~10 third-party plugins, the best pattern is usually a **curated registry/list in the main repo** plus separate plugin repositories for actual development. That keeps the core repo lean while giving users one canonical place to discover compatible plugins.
Keeping plugins in the main repo works only for first-party or tightly coupled plugins. Once third parties appear, separate repos are cleaner because they let plugin authors version independently, use their own release cadence, and avoid bloating the core package surface.
For Agentic HQ, I’d create a `plugins/` page or `docs/plugins.md` in the main repo with a table: name, repo, maintainer, status, compatibility, and install command. That is enough at small scale and can later evolve into a marketplace if adoption grows.

## 8) Maintainer bandwidth

The most effective solo-maintainer wording is honest, specific, and non-apologetic. Good examples are along the lines of: “This is a solo-maintained project; response times may vary, but I triage issues in order of severity and contribution readiness.”
Avoid promising fast turnaround unless you can keep it. A timebox like “I usually review within a week” is fine only if it is genuinely true most of the time.
A strong template sentence is: “I review high-signal bug reports and well-scoped PRs first; incomplete reports may be closed or left untriaged until additional detail is provided.” That sets expectations without sounding dismissive.

## 9) Examples to read

A few worth skimming for style and tone are:

- [`callstack/ai-cli` CONTRIBUTING.md](https://github.com/callstack/ai-cli/blob/main/CONTRIBUTING.md), for an AI-adjacent TypeScript project structure.[^12][^13]
- [`ovh/ai-training-examples` CONTRIBUTING.md](https://github.com/ovh/ai-training-examples/blob/main/CONTRIBUTING.md), for sign-off and contribution discipline.[^14]
- [`kubevirt/community` AI contribution policy](https://github.com/kubevirt/community/blob/main/ai-contribution-policy.md), for explicit AI disclosure language.[^3]
- GitHub’s own PR template guidance, which is useful because it shows the lowest-friction pattern for prompting good PRs.[^4][^5]
- OpenStack’s 2025 DCO transition, which is a good contemporary signal for contribution provenance policy.[^9]


## 10) 2025–2026 additions

The older “generic contributing guide” templates often miss AI provenance, licensing risk, and supply-chain hygiene. In 2025–2026, you should explicitly mention that contributors must avoid submitting code copied from sources they do not have rights to reuse, and that AI-generated code still needs human review for IP and license risk.[^15][^16][^17]
For a project like Agentic HQ, I would also add:

- A short AI-use disclosure section.
- A note that contributors are responsible for validating generated code and tests.
- A reminder to keep dependencies minimal and use `pnpm`/`corepack` as required.
- A mention that CI must pass `pnpm validate` before merge.
- A warning that the project is macOS-tested first, with Linux/WSL as best-effort.
- A supply-chain note encouraging pinned tool versions and cautious plugin review.[^16][^17][^15]


## Suggested stance

If I had to compress all of this into one policy direction: **welcoming, disclosure-based, GitHub-first, Conventional Commits externally, DCO optional, and strict TDD enforced by review plus CI**. That is the best fit for a solo-maintained, AI-collaborative, early-stage TypeScript project that wants to grow without becoming bureaucratic.[^4][^9][^1][^3]

A concise CONTRIBUTING.md policy statement that matches this could be:
“Agentic HQ welcomes human and AI-assisted contributions. If AI meaningfully helped shape your PR, disclose that in the description. Open issues on GitHub, keep changes covered by tests, and expect `pnpm validate` to pass before review.”
<span style="display:none">[^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29]</span>

<div align="center">⁂</div>

[^1]: https://www.digitalocean.com/community/tutorials/ai-coding-tools-open-source

[^2]: https://newsletter.specstory.com/p/how-to-be-an-open-source-hero-contributing

[^3]: https://github.com/kubevirt/community/blob/main/ai-contribution-policy.md

[^4]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository

[^5]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates

[^6]: https://github.blog/developer-skills/github/issue-and-pull-request-templates/

[^7]: https://www.eggthropic.com/notes/claude-code-agentic-coding-2026

[^8]: https://www.youtube.com/watch?v=qR_yS24SPRg

[^9]: https://governance.openstack.org/tc/resolutions/20250520-replace-the-cla-with-dco-for-all-contributions.html

[^10]: https://osr.finos.org/docs/bok/Artifacts/CLAs-And-DCOs

[^11]: https://maehr.github.io/github-template/

[^12]: https://github.com/callstack/ai-cli/blob/main/CONTRIBUTING.md

[^13]: https://github.com/callstack/ai-cli/blob/HEAD/CONTRIBUTING.md

[^14]: https://github.com/ovh/ai-training-examples/blob/main/CONTRIBUTING.md

[^15]: https://digitalisationworld.com/news/71819/2026-ossra-report-evaluating-the-risks-in-ai-powered-open-source-development

[^16]: https://sdtimes.com/ai/report-open-source-licensing-conflicts-hit-an-all-time-high-as-organizations-struggle-to-audit-ai-generated-code-for-ip-risks/

[^17]: https://www.mend.io/resources/white-papers/the-complete-guide-for-open-source-licenses/

[^18]: https://www.ey.com/en_gl/insights/supply-chain/how-generative-ai-in-supply-chain-can-drive-value

[^19]: https://github.com/PT-3Y/react_typescript/blob/main/CONTRIBUTING.md

[^20]: https://www.forbes.com/councils/forbesbusinesscouncil/2025/03/17/harnessing-artificial-intelligence-for-supply-chain-sustainability-and-resilience/

[^21]: https://github.com/github/docs/blob/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository.md

[^22]: https://opensource.com/article/18/3/cla-vs-dco-whats-difference

[^23]: https://discourse.nixos.org/t/proposal-to-have-an-ai-usage-policy/75650

[^24]: https://openssf.org/blog/2025/09/22/from-beginner-to-builder-your-first-code-contribution/

[^25]: https://dev.to/hexshift/designing-a-plugin-system-in-typescript-for-modular-web-applications-4db5

[^26]: https://www.typescriptlang.org/dev/playground-plugins/

[^27]: https://discourse.sustainoss.org/t/github-template-repository-with-best-practices/1225

[^28]: https://lobehub.com/es/mcp/gmoneyn-mcp-creator-typescript

[^29]: https://github.com/auth0/open-source-template/blob/master/GENERAL-CONTRIBUTING.md

