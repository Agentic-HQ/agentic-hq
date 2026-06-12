# The Prompt I Would Write To Myself (If I Were Steve)

## Why This Prompt And Not Another

My own 04 response ends with a rule: *"This document should be the last analysis artifact before a stranger runs the product."* So the next prompt cannot ask for more opinions — it has to convert the analysis that already exists into the build input that is currently blocking everything else. The critical path in 04's ordered plan is: **fix the 02 spec → build AHQ-157 → PTY failure semantics → friend share.** Item 1 is the only one that is pure document work, it gates item 2, and it is the one where I (Fable) already hold all the context — every defect is identified, with line numbers and recommendations, in 04.

There is one obstacle: 04 contains ~20 open **Decision** fields, and a corrected spec depends on several of them (bootstrap, trimming, reviewer scope, the TERMINATE_WORKFLOW contract). Waiting for Steve to answer them one at a time before producing the spec would serialise human effort in front of AI effort — exactly backwards. The fix is AHQ's own interaction pattern: apply the AI recommendations as defaults, and put a **Decision Register** at the top of the deliverable in the in-file Q&A format (`AI Recommendation` + `Human Answer ('Yes' means follow AI Recommendation)`), so one pass through the register answers the spec decisions *and* the corresponding 04 findings in minutes. The deliverable eats AHQ's own dogfood, which is fitting for the spec of the flagship workflow.

Prompts I considered and rejected:

- **"Build AHQ-157 directly from 02, fixing as you go."** Rejected: the spec's defects would be patched silently by the builder with no human decision trail, which violates the project's whole philosophy — and the bootstrap and reviewer-scope decisions are genuinely Steve's to make, not the builder's.
- **"Write the Phase 1 launch runbook / friend-share questions."** Rejected: real work, but it is item 5 on the ordered list and nothing about it is blocked. Doing it now would be the meta-work comfort zone wearing a new hat.
- **"Give me a fourth opinion on X."** Self-banned in 04, by name.

## The Prompt

---

Hi Fable,

I've read 04. Rather than me answering your Decision fields one by one and then asking you to rewrite the spec, do it the other way round:

**Rewrite the 02 spec into a build-ready v2, applying your own S1–S8 recommendations as the defaults.** Put a Decision Register at the top using our own in-file Q&A format — each decision gets the question, what 02 said, what v2 now says, why, and a `Human Answer ('Yes' means follow AI Recommendation):` line. Map each register entry back to its 04 finding ID so one pass through the register also closes out the spec-related Decision fields in 04. List separately which 04 decisions (the F-findings and the ordered plan) are *not* covered by the register and still need answers from me.

Requirements for the v2 spec itself:

1. **Self-contained.** No "see 02 for details" back-references — same rule as my command files. The AI that builds AHQ-157 gets this one document plus the repo.
2. **All four S1 text errors fixed**, and anything else of that kind you find on the re-read.
3. **The bootstrap specified** — who creates `01-feature-brief.md`, when the human's request gets in, what happens on re-runs.
4. **The TS CLI contract specified completely**: the `ticket-id` parameter, the exact `TERMINATE_WORKFLOW` / `CONTINUE_WORKFLOW` strings, exit behaviour on each, hard failure on anything unexpected (no silent fallbacks — house rule), and the fake-claude-cli tests the build must include for both branches.
5. **The Implementer's failing-test path specified** — what it does when planned tests won't go green within plan scope, and the never-weaken-never-delete rule.
6. **The chat-interaction policy made consistent** — 02 bans interactive questions and then uses them; enumerate the sanctioned chat moments and the rule that every one gets recorded into the doc.
7. **The trimming pass from S3 applied**, with the line budgets stated as checkable numbers, and the kept/ditched lists corrected so the spec doesn't claim to ditch a thing it actually keeps.
8. **A Definition of Done for AHQ-157** — the checkable list that tells the builder (and me) the ticket is actually finished.
9. **Don't add scope.** This is editing and completing, not inventing. Where a fix genuinely requires new behaviour (the TERMINATE_WORKFLOW contract is the only one I know of), say so explicitly in the register.
10. Where v2 conflicts with anything I've previously said or annotated (01b, my HUMAN COMMENTs in 01, the planning docs), flag the conflict in the register rather than silently choosing.

Write it at `06-fables-self-prompt-response.md`. Be thorough — I'd rather review one complete document than iterate on three partial ones.

When I've filled in the register, the next prompt will be: build it.

Thanks.

---

## The Queue After This Prompt

So the next moves are already loaded (in 04's order):

1. **This prompt** → v2 spec + Decision Register. *(Steve: ~15 minutes to answer the register.)*
2. **"Build AHQ-157 from the v2 spec."** The build run, including the fake-CLI branch tests. First time `agentic-hq list` has a flagship again.
3. **"Write the friend-share runbook"** — pre-committed success measure, the question list (including the permissions question from 01b), and the light README pass that re-points Quick Start at `add-feature`.

*(An earlier draft of this queue included PTY failure semantics (04/F4) as its own step. Steve decided "leave" — months of real runs have never hit a non-zero Claude exit, and the live PTY means any such error would be visible on screen anyway; logging will be added later based on real feedback.)*

After step 3, the next feedback on this project should come from a human who isn't Steve and a model that isn't asked for an opinion.
