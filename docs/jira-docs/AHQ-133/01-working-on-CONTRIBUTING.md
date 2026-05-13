# Working on CONTRIBUTING.md (AHQ-133)

Jira: https://agentic-hq.atlassian.net/browse/AHQ-133

This is the working doc for AHQ-133. It captures research, recommendations, and open questions for Steve **before** we draft `CONTRIBUTING.md` itself. Once Steve has answered the questions below, we'll plan and create the real `CONTRIBUTING.md` in the repo root.

---

## 1. Three reference CONTRIBUTING.md files

Three well-known TypeScript projects, chosen to span very different scales and contributor cultures:

### a) VS Code — https://github.com/microsoft/vscode/blob/main/CONTRIBUTING.md

- **Scale:** Massive; thousands of contributors; backed by Microsoft.
- **Focus:** Mostly about **issue reporting**, not PRs. Detailed guidance on how to write a good issue, how to disambiguate extension bugs from core bugs, etc.
- **Outsourced PR detail:** "How to actually submit a PR" is largely pushed to the wiki, keeping the file itself approachable.
- **Distinctive policies:**
  - Automated triage: GitHub Actions auto-closes `info-needed` issues after 7 days, locks resolved issues after 45.
  - "File a single issue per problem and feature request."
  - "Built-in Report Issue tool" that pre-populates system info.
- **Tone:** Friendly and welcoming — "Welcome, and thank you for your interest" / "Don't feel bad if the developers can't reproduce the issue right away."
- **Length:** ~2,000 words.
- **What we can borrow:** the issue-quality emphasis, the friendly tone, and the idea of outsourcing fine detail to longer-form docs in the repo (we already have `docs/`).

### b) Vite — https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md

- **Scale:** Medium-large; very active core team; large monorepo.
- **Focus:** Balanced between contributor enablement and maintainer policies.
- **Distinctive policies:**
  - **Conventional Commits required in PR titles** (e.g. `fix: description (fix #xxxx)`) for automatic changelog generation.
  - Strong anti-bikeshedding stance: "Code readability is subjective. The maintainers of this project have chosen to write the code in its current style based on our preferences" — stylistic refactors discouraged.
  - "You do not need to ask for permission to work on an open issue. You can start investigating or open a PR directly" — low-friction onramp.
  - 2+ reviewer approval required to merge.
  - Detailed sections on dependency philosophy, testing, debugging, release process.
- **Tone:** Welcoming up front, procedural in the maintenance sections.
- **Length:** ~3,000 words.
- **What we can borrow:** the no-permission-needed phrasing, the anti–drive-by-refactor stance (very aligned with AHQ's "don't add features beyond what the task requires"), Conventional Commits for changelog automation.

### c) Prettier — https://github.com/prettier/prettier/blob/main/CONTRIBUTING.md

- **Scale:** Medium; very opinionated single-purpose tool.
- **Focus:** Setup → tests → PR workflow → advanced topics.
- **Distinctive policies:**
  - **Hard "no new options" policy:** *"Prettier is an opinionated formatter and is not accepting pull requests that add new formatting options."*
  - **Mandatory changelog entry per PR** (one file under `changelog_unreleased/`).
  - **Explicit AI-usage policy** (added recently): low-quality AI contributions will be closed immediately. *"Only submit code you fully understand and have tested."*
  - Snapshot-driven tests — `jest -u`, then commit the diff.
- **Tone:** Formal but approachable; clear about what won't be accepted.
- **Length:** ~2,000 words.
- **What we can borrow:** the AI-usage policy (highly relevant to AHQ given the project is *itself* about AI-assisted dev), the "submit only what you understand" line, the explicit list of out-of-scope contributions.

### d) Pi (earendil-works/pi) — https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md

A very recent, well-respected AI software project. Worth including precisely because the maintainer has already been **overwhelmed by AI-generated contribution spam** and his policy is the most field-tested response we've got. It's the closest-in-spirit reference to AHQ in this whole list.

- **Scale:** Small, solo-maintained, high-traffic.
- **Length:** ~1,300 words. Tight.
- **Structure:** Contributing to pi → **The One Rule** → Contribution Gate → Quality Bar For Issues → Blocking → Before Submitting a PR → Philosophy → Questions? → FAQ (incl. "Why are new issues and PRs auto-closed?", "Why are weekend issues not reviewed?", "Why do some issues get no reply?", "Why not let AI triage everything?", "Is this hostile to contributors?").
- **The One Rule:** **comprehension** — you must understand your code. If you can't explain what your changes do, your PR is closed. AI-assisted is fine; AI-without-comprehension is not.
- **Important clarification on "blocking AI":** Pi does **not** ban AI contributions outright. It bans **un-defendable** AI output. The substance of the policy is *"use whatever tools you like, but the human submitter must comprehend and be able to defend every line."* Polished AI-generated issues can still be rejected if they're wrong.
- **Distinctive policies:**
  - **Auto-close-by-default.** New issues and PRs from non-trusted contributors auto-close on creation. A maintainer reopens the good ones in a manual weekday pass. This is a *defensive* mechanism against agent spam.
  - **Earned-trust `lgtm` / `lgtmi` system.** A maintainer comment of `lgtmi` grants a contributor future-issue immunity from auto-close; `lgtm` grants both issue *and* PR rights. Progression is gated.
  - **Weekend embargo.** No reviews Fri–Sun. Deliberately creates lag to protect maintainer rest.
  - **One-screen rule.** Issues exceeding one screen height are rejected outright.
  - **AGENTS.md.** A separate binding rules file for *agents* running in the repo. Contributors using AI agents must run them from the repo root so AGENTS.md is loaded. (This pattern is directly relevant to AHQ — we already have `CLAUDE.md` doing similar duty.)
  - **Two-strike permanent block.** Two violations or any spam campaign → permanent account ban.
  - **Don't edit the changelog.**
- **Reasoning given:** *not* ideological opposition to AI; explicit burnout from bulk agent submissions and low-effort tracker noise. The FAQ section is unusually honest about *why* the policies exist.
- **Tone:** Blunt, no-nonsense, protective of maintainer time. *"If you cannot explain your changes, your PR will be closed."* / *"Polished AI-generated issues can still be wrong."* / *"No taksies backsies."* Friendly toward earnest contributors, hostile toward low-effort automation.
- **What we can borrow:**
  - **The "One Rule" framing**: compress AHQ's AI-contribution policy into a single, memorable line.
  - **AGENTS.md pattern**: surface a file that any contributor's AI agent will read when invoked in the repo. AHQ has `CLAUDE.md` already — we could either rename/symlink to `AGENTS.md` (which is the emerging cross-vendor convention) or have AGENTS.md point at CLAUDE.md.
  - **Honest "why" FAQ**: a short FAQ explaining *why* the rules exist beats long prose policy.
  - **Permission to be firm**: Pi gives us social proof that being protective of maintainer time at launch is normal and accepted in 2025–2026 AI-adjacent OSS, not user-hostile.
- **What we probably should NOT borrow (yet):**
  - **Auto-close-by-default and the `lgtm` earned-trust system.** Powerful, but only justifiable once you're being spammed. Day-one default for AHQ should be open; we can add this later if it's needed.
  - **Weekend embargo as a formal policy.** Same — a private de-facto practice, not a public one, until volume forces it.

### Cross-cutting takeaways (across all four references)

- Length range: ~1,300 (Pi) → ~3,000 (Vite) words. **AHQ should aim ~1,500–2,500**. None of these try to encode every internal convention — they link out.
- All four have **explicit "what we won't accept"** sections. This saves maintainer time and prevents bikeshedding.
- Prettier and Pi address **AI-generated contributions** head-on; Pi's "one rule" framing is the sharpest and most enforceable. AHQ's file must address this — it's our project's subject matter.
- All four have a **welcoming opening line, even Pi.** Worth keeping.
- Pi shows that **being firm and honest about maintainer constraints is acceptable** — including in the file's tone. We don't have to over-apologise.

---

## 2. What AHQ is (one-paragraph summary)

Agentic HQ is an **early-stage (v0.1.0), MIT-licensed, TypeScript open-source framework** that lets you write small TypeScript programs that chain Claude Code "Skills" into multi-step workflows. Each step runs in a **fresh Claude Code session** with a focused context, and steps communicate via JSON files on disk (file-based marshalling) — so workflows are debuggable and could in future be paused/resumed. Workflows ship as **plugins** under `.agentic-hq/plugins/` using Claude Code's standard plugin format. The codebase itself is built largely by the founder (Steve) collaborating with Claude Code, so the project is unusually **AI-collaborative by design** and has strong opinions encoded in `CLAUDE.md` (TDD mandatory, fail-fast configuration, `pnpm validate` before every commit, no catch-and-fallback, no underscore-suppression of warnings, etc.). It is **macOS-only tested** so far, **pnpm-based** (via corepack), and uses an internal **Jira project (AHQ-xxx)** for tracking. The repo is currently private and AHQ-133 is one of the items blocking the public release.

---

## 3. Recommendations (my proposed defaults)

These are the defaults I'd suggest if Steve doesn't want to think hard about each one. He can override any of them with a single "no, do X instead."

1. **Length:** target ~1,500–2,500 words in the root `CONTRIBUTING.md`. Longer detail (architecture, TDD cycle, plugin layout) already lives in `docs/dev/` — link out, don't duplicate.
2. **Sections:** Welcome → Code of Conduct → Ways to contribute → Reporting issues → Proposing changes (small vs large) → Local dev setup → Running tests / `pnpm validate` → Submitting a PR → Style / conventions → AI-generated contributions → What we won't accept → How releases work → Recognition → License.
3. **Issues:** Use **GitHub Issues** as the primary external onramp (with templates: bug, feature, question). Steve can mirror to Jira internally, but external contributors shouldn't have to learn Jira.
4. **Discussion channel:** Add a **GitHub Discussions** tab for open-ended questions (avoids Issues becoming a Q&A dump). Keep the agentichq.ai contact form for support during private phase only.
5. **Commit conventions:** Adopt **Conventional Commits** for external contributors (enables auto-changelog later via Changesets or similar). Keep the `/commit` Claude Code skill as an *internal nicety*, not a contributor requirement.
6. **TDD:** Make it a *strong recommendation* in CONTRIBUTING ("TDD is how we build this — see CLAUDE.md") rather than a procedural ritual to enforce on outsiders. Reviewer judgement decides whether tests are adequate.
7. **`pnpm validate` is a hard gate:** every PR must pass it locally; CI should re-run it (separate ticket if no CI yet).
8. **AI-generated contributions:** *Explicitly welcomed*, **disclosure required**, **author-must-understand-and-have-tested** clause (Prettier-style). This is on-brand for AHQ and forestalls junk PRs.
9. **CLA / DCO:** **Neither**, for now. MIT + GitHub's standard inbound=outbound is sufficient at this scale. Revisit if a company ever wants to contribute.
10. **Companion files to add at the same time:**
    - `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1 (drop-in).
    - `SECURITY.md` — vulnerability disclosure contact (the auto-approved Claude permissions warning in the README makes this especially relevant).
    - `.github/ISSUE_TEMPLATE/` — bug-report.yml, feature-request.yml, question.yml.
    - (Already exists) `.github/pull_request_template.md` — expand to include "TDD followed?" and "AI assistance disclosed?" checkboxes.
11. **Third-party plugins:** Live in *their own repos*, not this one. AHQ should publish a curated/community plugin list (Claude Code already supports plugin marketplaces — leverage that). The core repo stays focused.
12. **Platform expansion (macOS-only → Linux/Windows):** Call out as a high-value contribution area in the "Ways to contribute" section.
13. **Maintainer expectations:** Be honest — "This is currently maintained by one person; response times may be days, not hours." Sets healthy expectations.

---

## 3.5 Combined stance (Claude + Perplexity)

Perplexity's response is at [`perplexity-response.md`](./perplexity-response.md). Headline summary:

> *"Welcoming, disclosure-based, GitHub-first, Conventional Commits externally, DCO optional, and strict TDD enforced by review plus CI."*

It largely confirms my defaults. The table below shows agreement, divergence, and where Perplexity strengthens or expands what I proposed.

| # | Topic | My default (§3) | Perplexity | Combined decision |
|---|---|---|---|---|
| AI | AI-generated contributions | Welcome + disclosure + "submit only what you understand" | Same, but warns against Prettier-style threat tone for an early project; suggests defining "meaningful" AI use so people don't spam disclosures for autocomplete; recommends an AHQ-specific honesty line | **Adopt Perplexity's softening**. Welcome + disclosure of *meaningful* AI use + same-quality-bar. Add one AHQ-specific line: *"This project is built collaboratively with Claude Code — we care about process transparency, not tool purity."* |
| Onramp | GitHub Issues primary, Jira internal | Same | Confirms — public Jira is usually wrong for small OSS; recommends "external ideas/bugs start in GitHub Issues; maintainers triage into Jira as needed" | **More genuine choice than originally implied — see §3.6 below.** |
| Commits | Conventional Commits external, `/commit` internal | Same | Confirms strongly. Suggests phrasing: *"External contributors may use Conventional Commits; maintainers may squash or normalize commit history during merge."* | **Adopt with that wording.** |
| TDD | Strong recommendation, reviewer judgement | Roughly same | **Slightly firmer**: hard rule, but enforced *procedurally* (reviewer rejects PRs that add behavior without test coverage) rather than by automation. Suggests: *"Behavioral changes must be driven by tests; PRs without meaningful test coverage will not be merged."* | **Upgrade my default.** TDD = hard rule for behavioral PRs; doc/refactor PRs exempt; reviewer enforces; CI confirms outcomes via `pnpm validate`. |
| CLA/DCO | Neither | DCO optional; if you do anything, DCO over CLA (cites OpenStack's 2025 CLA→DCO move) | **Keep "neither" as default, but flag DCO as a real option.** New question for Steve below. |
| Companion files | CoC + SECURITY + ISSUE_TEMPLATE + PR template | Confirms exactly this set; says skip FUNDING.yml unless you already have a sponsor path | **Adopt.** Drop FUNDING.yml from the launch set. |
| Plugins | Separate repos + curated list in main repo | Same; suggests `docs/plugins.md` with a table (name, repo, maintainer, status, compatibility, install command) | **Adopt with the table format.** |
| Maintainer bandwidth | Honest "days not hours" | Same; cautions against promising fast turnaround; suggests *"I review high-signal bug reports and well-scoped PRs first; incomplete reports may be closed or left untriaged until additional detail is provided."* | **Adopt that wording.** |

### New things Perplexity adds that weren't in my §3

These are 2025–2026-specific items I'd missed. I'd recommend including all four:

1. **AI-generated code IP / licensing warning.** Contributors must not submit AI-generated code that may have come from sources they have no rights to reuse. AI-generated code still needs human review for IP risk. *(Cites the 2026 OSSRA report on open-source licensing conflicts.)*
2. **Supply-chain hygiene.** Encourage pinned tool versions (we already do via corepack), cautious plugin review, and minimal dependencies.
3. **Platform-status disclaimer.** Explicitly state "macOS tested first; Linux/WSL is best-effort." Manages expectations and invites Linux/Windows contributions without false confidence.
4. **Examples to read** — Perplexity links three AI-aware repos worth checking before we draft:
   - [`callstack/ai-cli`](https://github.com/callstack/ai-cli/blob/main/CONTRIBUTING.md) — AI-adjacent TypeScript project structure.
   - [`ovh/ai-training-examples`](https://github.com/ovh/ai-training-examples/blob/main/CONTRIBUTING.md) — sign-off and discipline.
   - [`kubevirt/community/ai-contribution-policy.md`](https://github.com/kubevirt/community/blob/main/ai-contribution-policy.md) — explicit AI disclosure language.

### The one-liner Perplexity proposed (worth keeping somewhere in our final file)

> *"Agentic HQ welcomes human and AI-assisted contributions. If AI meaningfully helped shape your PR, disclose that in the description. Open issues on GitHub, keep changes covered by tests, and expect `pnpm validate` to pass before review."*

I'd put this near the top of CONTRIBUTING.md as a tl;dr.

### Where Perplexity and I differ in emphasis

- **TDD strictness:** Perplexity is slightly firmer than I was. I'd take its position.
- **DCO:** Perplexity surfaces this as a real choice. I'd defaulted to "neither" — adding it as an explicit question (Q14) below.
- **Tone toward AI contributions:** Perplexity warns against the Prettier-style "low-quality AI contributions will be closed immediately" line. I had floated that in Q12. **Recommendation: drop it.** Use a positive quality bar instead of a threat.

## 3.6 Issue tracker choice — genuinely a three-way decision

My original §3 default said "GitHub Issues primary, mirror to Jira internally," and Perplexity confirmed that. Steve pushed back: he pointed out that **not all GitHub projects use GitHub Issues** — Apache Lucene was cited as an example of a Jira-direct project. After checking, here's the empirical picture:

### What GitHub-hosted projects actually do (2026)

- **GitHub Issues only** is by far the most common pattern. *Even Atlassian's own OSS* (Pragmatic Drag and Drop, the Atlassian Design System, react-beautiful-dnd) uses GitHub Issues, not Jira.
- **External tracker only** is rare and shrinking. Apache Foundation projects historically used issues.apache.org Jira; **Apache Lucene itself migrated to GitHub Issues in 2022**, and its CHANGES entries now reference `GITHUB#XXX` rather than the old `LUCENE-XXX` Jira format. Apache Kafka is one of the larger holdouts still on Jira. Eclipse Foundation has likewise been drifting GitHub-ward. Linux kernel uses LKML mailing list. Chromium/Firefox use their own bespoke trackers.
- **Mailing list + tracker** is largely a foundation-scale pattern (Apache, Eclipse).

So the "Apache pattern" exists but is fading. The Lucene wiki page cited in conversation is somewhat out of date.

### Three genuine options for AHQ

| | Option A — GitHub Issues primary *(Perplexity & my original default)* | Option B — Jira-only intake *(Apache-style, but applied to a small project)* | Option C — Hybrid by issue type |
|---|---|---|---|
| **Where contributors file** | GitHub Issues; Steve mirrors important ones to Jira internally | https://agentic-hq.atlassian.net (GitHub Issues disabled or redirected with a stickied note) | Bug reports + questions → GitHub Issues; feature work / coding tickets → Jira (Steve creates the Jira after triage) |
| **Friction for outsiders** | Lowest. Anyone with a GitHub login can file. | High. Requires Atlassian Cloud sign-up. Steve must allow anonymous reporters (or accept lower volume). | Low for bugs, higher for feature work — but the higher friction is at the right point (after triage). |
| **Source-of-truth drift** | Real risk. Two systems to keep in sync. Steve does the syncing. | None. Single system. | Some — but only at the bug→work handoff, which is a natural triage point anyway. |
| **Filtering effect** | None. You'll get low-effort bug reports. | Strong — Pi-like. People willing to make a Jira account self-select. | Light. Anyone can file a bug; only people committed enough to track work go to Jira. |
| **Fits AHQ's architecture** | OK. | **Excellent** — `full-jira`/`quick-jira` workflows already exist, so contributors could literally `agentic-hq quick-jira -- --jira-id=AHQ-XXX` to work on a ticket. AHQ eats its own dogfood. | OK. |
| **Maintainer effort** | Medium (manual mirror). | Low after setup. | Medium (two channels to triage). |
| **Risk** | Healthy. Standard default. | Possible reputational risk — being seen as "weird" or contributor-hostile by GitHub-native devs in 2026. | Need to communicate the two-channel rule clearly or contributors will be confused. |
| **Reversibility** | Easy to switch later. | Harder once a stickied "file Jiras here" precedent exists. | Easiest — collapse to A or B if it doesn't work. |

### Decision (2026-05-11)

**Option A — GitHub Issues primary, mirror to Jira internally.** Confirmed by Steve. Reasoning: Lucene's 2022 migration is the strongest contemporary signal that the Apache pattern is fading; GitHub Issues is the path of least friction for outsiders; Steve can mirror to Jira where useful.

### Original recommendation (kept for the record)

Before Steve decided, I'd leaned toward **Option C (hybrid by issue type)** as a soft default, framed simply in CONTRIBUTING.md:

> *"For bug reports and questions, please use [GitHub Issues](https://github.com/Agentic-HQ/agentic-hq/issues). When a bug or feature is ready to be worked on, a maintainer will create a Jira ticket (AHQ-XXX) for tracking and you can follow progress there. If you're submitting a PR, link both the GitHub Issue and the AHQ-XXX Jira if one exists."*

Why C over A: it keeps the Jira-driven AHQ workflow intact for actual coding work (which is where Jira earns its keep), without forcing externals to make an Atlassian account just to say "this doesn't build on Linux."

Why C over B: a brand-new MIT OSS project rejecting GitHub Issues out of the gate would be perceived as user-hostile in 2026 in a way that wasn't true of Apache 15 years ago. Lose contributors before they've even arrived.

But **Option B is defensible** if Steve wants the Pi-like filtering effect from day one, and if he's willing to configure his Atlassian instance to accept reports from logged-in Atlassian accounts (or anonymous). It's the most architecturally pure choice for a Jira-centric project.

This supersedes the row in the table above and the bare-bones default in Q1.

---

### Additional shifts after reading Pi (earendil-works/pi)

Pi is the most field-tested AI-aware CONTRIBUTING.md we've looked at. It pushes me in a slightly firmer direction than Perplexity alone did:

- **Adopt a "One Rule" framing** at the top of AHQ's CONTRIBUTING.md, after the welcoming line. The rule should be **comprehension**: *"You must understand your code. If you cannot explain what your change does and why, your PR will not be merged."* This is enforceable, AI-tool-agnostic, and on-brand for a TDD project.
- **Add an `AGENTS.md` (or symlink/pointer to `CLAUDE.md`)** as a small companion file at the repo root. AGENTS.md is becoming the cross-vendor convention (works with Claude Code, Codex, Cursor, etc.); contributors using *any* AI agent should hit it. AHQ's `CLAUDE.md` is already 90% of what this needs.
- **Add a short FAQ** at the end of CONTRIBUTING.md à la Pi — *"Why do we require X? Because…"* — rather than burying reasoning in long prose. Honest > bureaucratic.
- **Permission to be firm.** Pi's tone gives social proof that being protective of maintainer time is normal in 2025–2026 OSS. AHQ can be welcoming *and* firm.
- **Don't borrow yet:** Pi's auto-close-by-default and earned-trust `lgtm` system. These are reactive responses to actual spam volume. Day-one default for AHQ should be open. We can add them later if/when needed — file as a future-Jira reminder, not a launch item.

---

## 4. Open questions for Steve

Please answer these before I draft the actual `CONTRIBUTING.md`. Defaults from §3 are shown in parentheses — feel free to just say "use defaults" or override individually.

### Contribution onramp
- **Q1.** Primary external entry point — see §3.6. ✅ **DECIDED 2026-05-11: Option A — GitHub Issues primary, mirror to Jira internally.**
- **Q2.** Want a **GitHub Discussions** tab enabled? *(default: yes)*
- **Q3.** During the immediate post-public-launch period, do you want a "no PRs without prior discussion" rule, or open-the-floodgates from day one? *(default: discussion-first for features; bug-fix PRs welcome directly)*

### Commits & PRs
- **Q4.** Conventional Commits for PR titles/commits, or stay with prose? *(default: Conventional Commits)*
- **Q5.** Is `/commit` (your internal Claude Code commit skill) **required** for external contributors? *(default: no — internal convenience only)*
- **Q6.** Single-commit vs multi-commit PRs — preferred? Squash on merge? *(default: squash on merge, no commit-count rule)*

### TDD & quality gates
- **Q7.** How strictly is TDD enforced on external PRs? *(default: strong recommendation, reviewer judgement)*
- **Q8.** Must every PR pass `pnpm validate` locally before submission? *(default: yes, hard rule)*
- **Q9.** Is there CI running `pnpm validate` on PRs yet? If not, should that be a separate Jira before public launch? *(default: file a new Jira if not present)*

### AI-generated contributions
- **Q10.** Welcome AI-generated contributions explicitly? *(default: yes, with disclosure)*
- **Q11.** Require disclosure of AI use? *(default: yes — a checkbox on the PR template)*
- **Q12.** Adopt a Prettier-style "low-quality AI contributions will be closed immediately" warning? *(**updated default after Perplexity input: no — Perplexity advises this tone reads as hostile for an early project. Use a positive quality bar instead: "submit only what you understand and have tested, with the same standards for correctness, tests, and maintainability as human-written work."**)*
- **Q13.** Should contributors who used AHQ workflows to make their contribution be encouraged to say so? *(default: yes, light touch — "If you used AHQ itself to build this, tell us — we'd love to hear how it went")*

### Legal & community
- **Q14.** CLA or DCO required? *(default: **neither for now**. Perplexity surfaces DCO as a credible lightweight option if you ever want a clear provenance record — cites OpenStack's 2025 CLA→DCO transition. CLA is overkill at this stage. Real choices: **(a) neither** [my default], **(b) DCO `Signed-off-by:` line required**, **(c) full CLA via CLA-assistant**.)*
- **Q15.** Add `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)? *(default: yes)*
- **Q16.** Add `SECURITY.md`? What contact mechanism do you want for vulnerability reports? Options: **(a) GitHub's built-in private vulnerability reporting** (no email exposed publicly), **(b) a generic alias** like `security@agentichq.ai`, **(c) the contact form on agentichq.ai already linked from the README**, **(d) a personal email** (please supply — I will not guess from memory). *(default: (a) GitHub private vulnerability reporting — it's the modern best-practice and keeps any email private)*
HUMAN: please provide both (a) and (c) as 2 options.
- **Q17.** License header / copyright assignment for contributions? *(default: inbound=outbound under MIT — no explicit assignment)*

### Scope rules ("what we won't accept")
- **Q18.** Are stylistic-only refactors (à la Vite) declined? *(default: yes — aligns with your CLAUDE.md "don't add features beyond what the task requires")*
HUMAN: Don't want this restricted or mentioned. Too much info / overkill.  Refactorings that don't change any behaviour are fine (welcomed) if they make the code/system/docs better.
- **Q19.** Are third-party plugins in this repo accepted, or must they live in separate repos? *(default: separate repos; we maintain a curated list / marketplace)*
HUMAN: Don't mention it - we'll deal with it on a case by case basis.
- **Q20.** Anything else explicitly out-of-scope? (e.g. Windows-specific patches that complicate macOS support; plugins that auto-approve dangerous permissions; etc.)
HUMAN: No.

### Release & recognition
- **Q21.** Will there be tagged releases and a changelog? Use Changesets / semantic-release / manual? *(default: defer — list "future" in CONTRIBUTING and revisit at 1.0)*
- **Q22.** Recognition: README contributors list, all-contributors bot, release-note shout-outs, none? *(default: release-note shout-outs only at this stage)*
HUMAN: Don't mention it
- **Q23.** Maintainer-bandwidth statement — comfortable saying "currently one maintainer; response in days not hours"? *(default: yes — sets honest expectations)*

### Pi-inspired (new after reading earendil-works/pi)
- **Q26.** Adopt a Pi-style **"One Rule"** prominent at the top of CONTRIBUTING.md? *(default: yes — "You must understand your code. If you cannot explain what your change does and why, your PR will not be merged.")*
- **Q27.** Add an **`AGENTS.md`** file at the repo root (cross-vendor convention for AI agents)? Options: **(a) new minimal AGENTS.md that points at CLAUDE.md**, **(b) move/rename CLAUDE.md → AGENTS.md** (CLAUDE.md becomes a thin pointer for backwards compat), **(c) skip — keep CLAUDE.md only.** *(default: (a) — least disruptive, broadest reach)*
- **Q28.** Include a Pi-style **short FAQ** at the end of CONTRIBUTING.md ("Why do we require X?" Q&As) instead of long policy prose? *(default: yes — a 4–6 question FAQ)*
- **Q29.** Day-one default for issue/PR handling: **open** (anyone can file, you triage normally) vs **Pi-style auto-close-by-default with maintainer reopen**? *(default: open at launch; file a future-Jira to revisit if you start getting AI-spam)*
- **Q30.** Don't-edit-the-changelog rule? Currently we don't have a changelog at all (Q21). *(default: defer until Q21 is decided)*
HUMAN: Don't mention it

### Plus
- **Q24.** Anything I've missed that you specifically want in CONTRIBUTING.md from day one?
- **Q25.** Anything from CLAUDE.md you want **promoted** to CONTRIBUTING.md (i.e. surfaced to outside contributors), vs **kept internal** to CLAUDE.md?

---

## 5. Perplexity.ai prompt (please run, paste response back)

Per the Jira: the Perplexity MCP no longer works, so please copy the block below into perplexity.ai yourself and paste the response back to me. I'll fold its recommendations into ours before we draft the real CONTRIBUTING.md.

```
I'm writing a CONTRIBUTING.md for an early-stage (v0.1.0), MIT-licensed open-source TypeScript project called "Agentic HQ". It's a thin TypeScript wrapper around Anthropic's Claude Code that lets developers chain Claude Code Skills into multi-step AI workflows.

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
```

---

## 6. Next steps

1. ✅ **Done:** Steve provided the Perplexity response — folded into §3.5 above.
2. **Steve answers** Q1–Q25 in §4 (or says "use updated defaults" / answers selectively).
3. **I produce** a draft outline / plan for the real `CONTRIBUTING.md` (sections + rough wording per section) for Steve to approve before any prose is written.
4. After approval, we write the real `CONTRIBUTING.md` (and any companion files Steve has agreed to — `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue templates, expanded PR template).
5. Update `README.md:228` to remove the "TBD" link to AHQ-133 and replace it with a working link to `CONTRIBUTING.md`.
