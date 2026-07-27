# Fable 5 Review — Findings & Recommendations for the AHQ-192 Driving Agent

> Written 2026-07-27 by a Claude Fable 5 review session, at Steve's request, after an adversarial verification of docs 13 and 14. Steve has decided these items should be done; **how** each is done is the driving agent's call — the "Recommended change" lines are starting points, not prescriptions. If you disagree with a recommendation, say so to Steve rather than silently skipping it.
>
> ⛔ **The `create-workflow` agent must not read this document.** It quotes and discusses the frozen experiment protocol (doc 13), which that agent is barred from reading (doc 14's header rule). Same reasoning, same rule.
>
> **Scope note:** Part A items touch doc 13, which is **frozen** — every Part A change goes through doc 13's §10 amendment log (date, what, why, "no arm had run"), per its own amendment rule. Part B items touch doc 14, which is not yet frozen. Part C lists things verified correct — do not "fix" them.

---

## What was verified and found correct (calibration — no action)

- **Doc 13 gates G1–G12** each trace to a real spec requirement (AC 1–7, §8, §9, §12); **traps T1–T4** match spec §6/§11 with the right sanity-check numbers; the fifth pitfall correctly demoted to unscored commentary.
- **The tool grant in doc 13 §2.2** is verbatim-accurate against `claude-command-builder.ts` (nine MCP tools; the appended `Read(<.agentic-hq>)`; no `--model` anywhere — including the builder's unused `extraArgs` path).
- **Doc 14's AHQ-mechanics claims** are line-number exact (`full-jira-tdd-story-workflow-demo-cli.ts:55-81`, `add-feature-detailed-example-cli.ts:93-101`); all seven short-ids correct; `.npmrc` is in the scaffold; passthrough params are supported; the interactive-PTY/hang claim matches `pty-cli-wrapper.ts`.
- **The stripped handoff spec** is exactly the original minus the revision note.
- **The freeze commit `be0d017`** is real and contains the full doc 13.
- **Böckeler quotes**: the §5/§6 header quotes, the feedback/feedforward pairing sentence, the repeat-runs finding, the "clogging the context window" script anecdote, and the regression-tests line are verbatim; "spiral of over-engineered refactorings" is correctly framed as *her worry*, not an observed event; "always green is suspicious" is her CD-pipeline analogy deployed exactly as she deploys it (for sensors).
- **The §6.5 Guide→Sensor coverage table** was independently re-derived and agrees cell-for-cell, including the G4-partial and G9-advisory judgments and the G5 result-not-process note.

---

## PART A — Doc 13 amendments (all via §10; all safe now because no arm has run)

### A1. The frozen judge prompt never tells the judge to run anything — §5.2 vs §5.3 · **HIGH**

**Finding:** §5.3 requires each judge to run `verify.sh` plus one scenario per repo — the entire mechanism grounding N3/N5 in something executed. The frozen §5.2 prompt contains no instruction to run anything; as frozen, judges will score everything from reading, and the gap will bite silently at plan step 7.1.

**Recommended change:** amend the §5.2 prompt (logged in §10) to add an execution paragraph, e.g.:

> Before scoring, in each repo: run `./verify.sh`, and run one scenario of your choice — **the same scenario in both repos** — using the commands the repo's own documentation gives you. Use what happens as evidence for the reproducibility and verification-depth criteria. If something fails to run, that is itself evidence: record what you tried and what happened, and score with that.

The same-scenario-in-both requirement keeps the two executions comparable. Judges have passwordless sudo already.

### A2. The §8 interpretation table is not total — outcomes exist that map to no row · **HIGH**

**Finding:** three gaps. (1) Arm 2 ahead by 0.5–0.75 on *both* blocks is neither Wash (>±0.5) nor Clear win (<0.75) nor Qualified win as defined. (2) "Ahead on Block N but not Block A" — the reverse-tautology case, arguably the most informative outcome — is undefined. (3) "Ahead on Block A but not Block N" is ambiguous between "not ahead on N" and "not ≥0.75 on N". A pre-registered lookup with holes forces post-hoc judgment exactly where pre-registration was meant to remove it.

**Recommended change:** replace Step 2 with a **total** decision rule — every (ΔA, ΔN, reversal) combination must map to exactly one row. A starting shape (first matching row applies; Δ = arm 2 mean − arm 1 mean; "reversal" = at least one judge whose own two block means both favour the other arm):

1. **Clear win (AHQ):** ΔA ≥ +0.75 AND ΔN ≥ +0.75 AND no reversal.
2. **Clear loss:** the mirror.
3. **Wash:** |ΔA| ≤ 0.5 AND |ΔN| ≤ 0.5.
4. **Mixed (everything else)** — report both Δs and which side each favours, with mandatory wording per sub-case: only-A-favours-arm-2 → the *possibly tautological* label; only-N-favours-arm-2 → "better code, but not distinctively APoSD-shaped — the hypothesis is not supported even though the product is better"; both favour arm 2 but below the bar (or a reversal exists) → "directional, below the pre-registered bar"; mirrored wording when arm 1 is favoured.

Whatever thresholds/wording you choose, the property to preserve is **totality** — check it by trying adversarial pairs (e.g. ΔA = −0.2, ΔN = +0.9) before freezing the amendment. Define "reversal" once, precisely.

### A3. Judge session mechanics are unspecified — grant, launch, and web access · **MEDIUM**

**Finding:** §2.2 pins the arms' permissions to the word, but nothing says what the three judge sessions run with. They need Bash (verify.sh + a scenario, sudo via the VM rule); unspecified means judging-day improvisation, or three unmatched judges. Separately, nothing denies judges web tools — a judge with `WebSearch` can unblind itself in one query, and "judge only what is in front of you" implies no web anyway.

**Recommended change:** amend §5.1: all three judges launched identically, from their own `~/judging/judge-N/` directory, with `--allowedTools "Bash"` and nothing else — **explicitly no WebSearch/WebFetch and no settings.local.json in the judging directories** (blinding, not just parity). Exact launch command pre-written during 7.1 prep and recorded in doc 15 alongside the arm command lines.

### A4. Doc 09 Q8's "second round if close" was dropped silently, not rescinded · **LOW**

**Finding:** doc 09 Q8's agreed answer included "pre-commit to a second round only if the result is close". Doc 13 §1/§8 carries n=1 but never retires the rider; the Wash outcome is exactly where it would have applied.

**Recommended change:** one §10 line: "No second round regardless of closeness — Golden Rule 1 (proportionality); supersedes doc 09 Q8's 'if close' rider." (Or, if Steve wants to keep the rider, put it in the Wash row — either way, on the record.)

### A5. Two parentheticals reference doc 12 text that no longer exists · **LOW**

**Finding:** §2.2's "*doc 12 step 5.3 says eight*" and "*Plan step 5.5's phrase 'MCP neutralised' is superseded*" describe doc 12 as it stood **before** commit `be0d017` — which itself updated doc 12 to nine/matched. A cold-start agent instructed to trust doc 12 will find both claims false.

**Recommended change:** clarifying-wording edit (permitted class): mark both as historical, e.g. "(an earlier doc 12 draft said eight; fixed in the same commit that froze this document)".

### A6. Captured artifacts have no stated destination · **LOW–MEDIUM**

**Finding:** §6 lists five things captured per arm, and §5.1 mentions `judging/assignment.md` "in this repo", but no path convention exists. The Snapshot Law means every capture must be committed and pushed **before each restore** — scatter here risks losing gate logs or judge verdicts to a restore.

**Recommended change:** amend §6/§5.1 with one parent directory (e.g. `docs/jira-docs/AHQ-192/experiment-results/` with `arm1/`, `arm2/`, `judging/` beneath it — exact path your call), stated once, with the rule "committed via `/git:02` before any snapshot restore".

---

## PART B — Doc 14 changes (before the 3.3 freeze)

### B1. Factual error: the "god module" anecdote merges two separate false positives · **HIGH (it's the only factual error found)**

**Finding:** §6.7's false-positives bullet says her LLM "flagged her deliberate dependency-injection factory as a 'god module'". Per the sensors article ("Coupling data" observations), these were **two distinct findings**: (1) the deliberate DI factory was flagged as one of the biggest issues; (2) a **shared zod schema** between frontend and backend was the thing "declared a 'god module' by the LLM".

**Recommended change:** correct the sentence (e.g. "Böckeler's coupling analysis flagged her deliberate dependency-injection factory as a top issue and declared a deliberately shared schema a 'god module' — both purposeful patterns"). Optional strengthener: her later, fuller inferential review (Modularity Skills) "nicely pointed out that they have a purpose" — i.e. richer semantic review *reduced* the false positives, which supports §6.4's inferential-sensor design and is worth a clause.

### B2. Missing sensor: test verification depth — coverage lies, and this run has AI writing all the tests · **HIGH**

**Finding:** the sensors article's most consequential finding for exactly this workflow is absent. Her concrete case: a module with **100% statement / 75% branch coverage and zero unit tests** (coverage inflated by one acceptance test); Stryker mutation testing found **13 surviving mutants**. Her conclusion: "my eyes have really been opened to how crucial mutation testing becomes when we make the decision to leave most of the testing to AI." This run is the limiting case — the same unattended process writes the code *and* the tests, and no human ever reviews the tests. Doc 14's S3/S4 check only that tests **pass**. Note also: the §6.5 audit could not surface this gap — a Guide→Sensor audit finds missing sensors for existing Guides, never missing principles.

**Recommended change:** add a sensor (S18 · Test Verification Depth, or your naming). Suggested shape: epilogue (E1) primary — mutation testing where the stack affords a tool, run incrementally (her own cost mitigation: manually-triggered incremental runs, plus a query script so the JSON doesn't flood context, per §6.6's summarise rule); where no tool exists, the inferential fallback: *sample the system's public behaviours and ask, for each, "which test fails if this breaks?" — behaviours with no answer are findings.* Plus one sentence in §4.4 or S3: **a coverage number is not evidence of verification — executed is not verified.** Task-agnostic throughout (§3.1 sanity test applies).

### B3. The harness stage should inherit her two strongest empirical results: preset gaps and custom self-correction messages · **HIGH**

**Finding:** two findings from the sensors article that bear directly on §6.2's walking-skeleton harness remit are missing, and one existing line mildly contradicts them. (1) The rules that target the most common AI failure modes — max function length, file length, cyclomatic complexity, max arguments — "weren't even active in ESLint's default preset". (2) Her natural experiment: cyclomatic complexity was the **only** rule the agent kept evading (bumping thresholds) — and the only one she hadn't given a custom self-correction message: "an indicator that the custom lint messages can indeed make quite a difference." S2's "zero-config-available beats perfect-config-eventually" reads as licence to stop at presets.

**Recommended change:** in §6.2's harness remit add: *explicitly enable the size/complexity rule family (function length, file length, complexity, argument count) even where the stack's preset omits it — cheap on any stack, and it targets the failure modes agents actually exhibit; where the tooling allows, make the failure message carry what-to-do text* (this extends §6.6's output-shape rule from LLM sensors to configuring the computational ones). Reword S2 so it doesn't contradict — e.g. "zero-config-available beats perfect-config-eventually, **plus** the handful of size/complexity rules presets leave off."

### B4. S15 needs G3's own qualifier, or it trains strawmen · **MEDIUM**

**Finding:** G3 applies to "any **non-trivial** slice"; S15 checks *every* slice's design-doc entry for a rejected alternative. Unqualified, it false-positives on the walking skeleton and trivial slices — and a per-slice demand for a rejected alternative is a Goodhart pressure toward fabricated strawmen, which G3's own text warns about ("two variations on the same idea is not designing it twice"). Also, "close to deterministic" oversells it: *presence* of an entry is greppable; *materiality* is a judgment.

**Recommended change:** give S15 the same non-trivial qualifier as G3, make "trivial slice — no alternative required, stated as such" a passing outcome, and let the check ask for **material difference** (accepting that makes it partly inferential — soften "close to deterministic" accordingly).

### B5. Claim the structural win: AHQ solves her hardest sensor-integration problem — and scope the pointer-following quote honestly · **MEDIUM**

**Finding:** two related items in §5.3 and around it. (1) The article's closing problem is **getting agents to actually consult sensors** — her ranked options (markdown guide: easiest but "quite unreliable"; harness hooks; pre-commit hooks; custom harness extension) all treat it as a compliance problem. This workflow dissolves it structurally: sensors run in a **dedicated pipeline stage** (L5/E1) the TypeScript always executes — "will the agent run the sensors" stops being a prompt-compliance question at all. That is the strongest AHQ-vs-plain-agent argument available to this document and it is currently implicit. (2) Meanwhile §5.3 stretches her quote slightly: "via a guide … quite unreliable" was specifically about agents ignoring a markdown instruction *to run her sensors CLI* — an instance of (1) — not a general finding about resource-doc pointer-following. The inline-heavy delivery conclusion survives on its own logic.

**Recommended change:** add a sentence (e.g. in §6.1 or §6.2) making the structural claim explicitly, citing her integration-options finding as the problem it removes; rescope the §5.3 attribution ("her finding that markdown instructions to consult sensors were 'quite unreliable'").

### B6. Attribution nit: the computational/inferential split covers both halves · **LOW**

**Finding:** §5.1 says she "splits **Guides** into computational … and inferential". Her article applies the split to *both*: "There are two execution types of guides and sensors" — it's a 2×2, and doc 14 itself uses it that way (§6.3 computational, §6.4 inferential).

**Recommended change:** one-line rewording ("Böckeler splits both Guides and Sensors into…").

### B7. Source title nit · **LOW**

**Finding:** the second article's actual title is "**Maintainability sensors for coding agents**". §10 (and doc 12 step 3.1) shorten it. URL is correct.

**Recommended change:** use the real title in §10. Doc 12's mention is Steve's plan text — flag rather than edit if preferred.

### B8. Optional: a computational half for widened S9 · **LOW**

**Finding:** near-duplicate detection is one of the few APoSD symptoms with real deterministic tooling (jscpd, PMD CPD and kin, stack-dependent).

**Recommended change:** one clause in §6.2's harness remit or S9: where the stack affords a clone detector, wire it in as the deterministic half of S9's near-duplicates question. Advisory; skip if it reads as gold-plating.

---

## PART C — Checked and deliberately not recommended (guard against over-correction)

1. **S15/S16 mirroring frozen rubric criteria A9/A8 is legitimate — do not undo it.** Checked: G3 and G7 were Guides before the coverage audit; the rubric froze before doc 14 existed; sensors enforcing existing Guides add no APoSD content beyond the declared hypothesis, which §5.2's honesty note already covers and Block N exists to check. Worth **one disclosure sentence in doc 15** (not doc 14 — doc 14 must not discuss doc 13's contents).
2. **The §6.5 table's G5 row is right as written** (result-not-process) — with one commit per slice, intra-slice ordering is unobservable forever; don't add a process check.
3. **S17's advisory status is correct** — do not harden it; the caveat text is the defence §6.7 describes.
4. **No cost/token measurement anywhere** — several B items add tooling; none may grow a cost dimension (Golden Rule 8).
5. **Do not add doc 13 references into doc 14** while implementing Part B — doc 14 is handed to an agent barred from doc 13, and this document is barred too (header rule).
