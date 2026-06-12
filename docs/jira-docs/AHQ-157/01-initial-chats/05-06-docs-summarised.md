# Docs 05–06: Summarised (Originals Deleted)

Files `05-fables-self-prompt.md` and `06-fables-self-prompt-response.md` were deleted on 2026-06-12. They were intermediate working documents whose useful output has been fully folded into `07-final-build-spec.md` — keeping them alongside the spec risked confusing the implementing agent (06 in particular contained a full draft spec explicitly marked "REFERENCE ONLY" that must not be treated as build input). If required, the full originals are in git history.

**For the implementing agent: `07-final-build-spec.md` is the single, self-contained build input for AHQ-157. Docs 01–04 are useful history/commentary. Nothing in this file or git history overrides 07.**

## What Was In 05-fables-self-prompt.md

The prompt Steve asked Fable to write to itself: convert the 04 analysis into build input by rewriting the 02 spec with the S1–S8 recommendations applied as defaults, fronted by a Decision Register in AHQ's own in-file Q&A format so one human pass closed all open spec decisions. Produced 06. Its remaining queue: review/commit 07 → build AHQ-157 from 07 → friend-share runbook (pre-committed success measure, question list, light README pass).

## What Was In 06-fables-self-prompt-response.md

The response to 05, in five parts: (1) the **Decision Register** — every spec decision from 04's S1–S8 answered by Steve and subsequently applied to 07 as minimal edits; (2) a draft "v2 spec" marked REFERENCE ONLY — never the build input, the main confusion risk and the main reason for deletion; (3) a list of what stayed unchanged from the original 02 spec; (4) a conflict check against Steve's earlier statements (no blockers); (5) a list of 04 decisions not covered by the register.

All register outcomes are reflected in 07. Notable late amendments (2026-06-12, recorded in the register before deletion):

- **Decision 1 (bootstrap)** was reverted to Steve's original flow — the human writes the initial request into the `Human Prompt` section; the Researcher only creates the directory/file if missing, and treats a pre-existing `01-feature-brief.md` as a re-run signal (flag it and ask the human what to do).
- **Decision 6 (Stage Outcome Contract)** — the contract stands as specified in 07, but its test mandate was dropped: no tests for individual TypeScript workflow code for now (no existing workflow CLI has any; revisit later if deemed a good idea).
