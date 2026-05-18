# Perplexity Q&A — AHQ-145: `engines.node` range for supporting Node 22 + 24 LTS

## Purpose / Provenance

Supporting research artefact for Jira **AHQ-145** (Node 24 LTS upgrade). Raised because the Jira AC
mandates the `engines.node` value `">=22.0.0 <25.0.0"` verbatim, but Research Report 1 flagged that
this contiguous range also permits the EOL Node 23 and that a disjoint range would be a deliberate
choice. The maintainer asked for "the right thing" to be researched. The Perplexity MCP was not
available, so the question was answered by the maintainer pasting it into perplexity.ai (2026-05-17).
**This doc records why `engines.node` deviates from the Jira AC's literal text — see Decision (D).**

## Context

Deciding the `engines.node` value in `package.json` for an open-source TypeScript CLI (npm-distributed,
ESM, pnpm 11). The project supports the two LTS lines **Node 22 and Node 24**, not the EOL
Current-only **Node 23** between them.

## Question asked

> I maintain an open-source TypeScript CLI tool distributed via npm (`package.json`, ESM, package
> manager pnpm 11). As of May 2026, Node.js 22 is in LTS and Node.js 24 is Active LTS. Node.js 23 was
> a "Current"-only release between them — never promoted to LTS, now end-of-life. I want the project
> to officially support the two LTS lines, Node 22 and Node 24, and I'm deciding what to put in the
> `engines.node` field of `package.json`.
>
> Two candidate semver ranges:
> (A) `">=22.0.0 <25.0.0"` — a single contiguous range. Simple, but it also permits the EOL Node 23.
> (B) `"^22.0.0 || ^24.0.0"` — a disjoint range matching only the 22.x and 24.x major lines,
> explicitly excluding Node 23 (and 25).
>
> Questions:
> 1. Which of (A) or (B) is the idiomatic / best-practice way to express "supports Node 22 and 24 LTS
>    only" in `engines.node`, and why? Is there a more conventional third option?
> 2. Is there any real practical downside to a contiguous range that permits an EOL, odd-numbered,
>    never-LTS Node major (23) that the project does not test against?
> 3. How do npm and pnpm treat the `engines` field by default (warn vs error), and does `engine-strict`
>    / `.npmrc` change which range is advisable?
> 4. Is there authoritative guidance on whether to include odd-numbered "Current" Node releases in
>    supported ranges?
> 5. Given Node's even/odd release model, what do well-maintained projects typically do here?
>
> Please give a clear recommendation with reasoning.

## Perplexity's Answer

Use **(B) `^22.0.0 || ^24.0.0`**. For a package that explicitly supports only the active LTS lines,
that is the clearest and most idiomatic expression because it matches the actual support policy and
excludes Node 23, which Node's own release schedule says is an odd-numbered Current-only line that is
now EOL.

**Recommendation.**
- Best choice: `^22.0.0 || ^24.0.0`. It communicates "22.x or 24.x major lines only" directly, and
  the excluded odd major is not an accident — it reflects the support matrix.
- Acceptable but looser: `>=22.0.0 <25.0.0`. Semver-valid, but it overstates support by including
  Node 23, which the project does not test and does not intend to support.
- More conventional third option: many projects simply use the oldest supported LTS floor, such as
  `>=22.0.0`, and document that only currently supported LTS majors are tested. Simpler, but it does
  not express "22 and 24 only" as precisely as the disjoint range.

**Why B fits better.** Node's release model is intentionally even/odd: odd majors are Current-only for
about six months and then become unsupported, while even majors transition to LTS and are intended
for production use. Node's docs say production applications should only use Active LTS or Maintenance
LTS releases. A disjoint range like `^22.0.0 || ^24.0.0` is a faithful encoding of that policy: "these
two supported LTS majors, and nothing else." The contiguous range `>=22 <25` describes a broader
compatibility claim than intended.

**Practical downside of A.** The main downside is support signaling: a user on Node 23 may install
successfully, see the package nominally accepts it, and assume it is tested/supported when it is not.
There is also some compatibility risk — odd-major "Current" releases can contain API and ecosystem
changes never stabilized for production, so "works on 22 and 24" does not automatically imply "works
on 23." The risk is often low for a small CLI but is nonzero and unnecessary.

**npm and pnpm behavior.** By default npm treats `engines` as advisory only, emitting warnings rather
than blocking installation, unless `engine-strict` is enabled; pnpm follows the same general idea in
practice. So `engines.node` is primarily a communication/guardrail mechanism — the range should
reflect the support promise as accurately as possible; a looser range just weakens the signal.

**Strictness settings.** If the repo/CI uses `engine-strict`, the field becomes an enforcement
boundary, making the precise disjoint range even more advisable. If engines are not strictly
enforced, the exact range still matters for docs, warnings and package-manager messages.

**What well-maintained projects do.** They anchor support to currently supported LTS majors and bump
the floor when an older LTS goes EOL — either a single oldest-LTS floor like `>=22`, or a disjoint
set of explicit majors when they want to be precise about supported branches.

**Clear answer:**
```json
"engines": {
  "node": "^22.0.0 || ^24.0.0"
}
```

Sources cited by Perplexity: Node.js previous-releases / release schedule (nodejs.org), npm
`package.json` docs (docs.npmjs.com), pnpm issue #1927 (github.com/pnpm/pnpm), openedx wg-frontend
issue #171 (github.com).

## Decision (D)

**Set `engines.node` to `"^22.0.0 || ^24.0.0"`** in the root `package.json` and all six
`ts-workflow/package.json` files.

This is a **deliberate, maintainer-approved deviation from the AHQ-145 Jira AC's literal text**,
which mandates `">=22.0.0 <25.0.0"`. The maintainer asked for the researched "right thing" to be
done; Perplexity's recommendation is the disjoint range because it precisely encodes the project's
real support policy (the two LTS lines 22 and 24) and does not silently admit the EOL, Current-only
Node 23. The deviation is:
- recorded here and in the AHQ-145 implementation plan (Decision D);
- to be called out in the Jira comment and the GREEN phase summary so the AC checklist's literal
  mismatch is explained;
- left for the maintainer to optionally update the Jira AC text to match.
