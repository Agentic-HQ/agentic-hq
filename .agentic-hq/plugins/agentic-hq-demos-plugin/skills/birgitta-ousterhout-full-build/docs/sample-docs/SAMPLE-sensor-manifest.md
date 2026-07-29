# Sensor Manifest

> **SAMPLE — this file shows the required SHAPE, not content to copy.** The example content below
> assumes an imaginary payroll calculator CLI built in Node/TypeScript; the real manifest records
> whatever the actually-chosen stack affords. Written by L4 during slice 1's harness standup;
> extended if later slices add languages or tools. **A manifest that admits its gaps is worth more
> than one that implies coverage it does not have.**

---

## Sensors that exist for this stack

| Sensor | How it is run |
|---|---|
| S1 · Clean Build | `npm run build` — `tsc` with `--noEmit false`, all warnings promoted to errors |
| S2 · Static Analysis | `npm run lint` — ESLint with `max-lines-per-function: 50`, `max-lines: 300`, `complexity: 10`, `max-params: 4` configured explicitly (the preset left all four off); failure messages carry what-to-do text |
| S3/S4 · Checks (this slice + regression) | `npm test` — the whole suite, every slice's checks |
| S5 · Runs From Clean | `scripts/check-clean-clone.sh` — clones the repo to a temp dir and follows README build/run steps |
| S6 · Idempotence & Re-run | `npm test && npm test` — the suite includes setup/teardown re-run checks |

## Sensors that are absent, with reasons

| Sensor | Why absent |
|---|---|
| Clone detector | jscpd would need a new dependency mid-run; near-duplicate checking is done by reading at the big review (S9) instead |
| Mutation testing | Stryker not installed; S18 at the big review falls back to the inferential which-check-fails-if-this-breaks method |
