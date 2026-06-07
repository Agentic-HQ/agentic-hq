# {ticket-id} - Refactoring Execution Document

> Records the execution of the **approved** refactors from the Refactoring Plan. Only refactors that
> were APPROVED in the Refactoring Plan are included here — "skipped"/rejected refactors are not.
> The structure below follows the plan that was executed.

## Code Changes Made

<Summary of the code changes made across all refactors in this stage (files touched, nature of changes).>

## Refactors Executed

| Refactor | Outcome | Plan Deviation? | Notes |
| --- | --- | --- | --- |
| Refactor <id>: <Title> | DONE / FAILED / ABANDONED | NONE / <describe> | <notes> |

<Summary line: state whether all approved refactors were executed without deviation, or list the
deviations. A FAILED refactor is one that was reverted because it could not be carried out as planned;
an ABANDONED refactor is one the human agreed to drop (with the reason recorded here). The AI must NOT
silently substitute a different, unplanned refactoring.>

## Details And Results Of "New Tests" Run Before And After Refactoring

**New Tests identified** (created/updated by the Executor): <list>

**Quick Validation / Quick Unit Test command**: `<command>`

| Run point | New Tests result | Quick Validation result |
| --- | --- | --- |
| Before refactoring | PASS / FAIL | PASS / FAIL |
| After all refactoring | PASS / FAIL | PASS / FAIL |

## Details Of Quick Validation / Quick Unit Tests Run Between Every Refactor

<The Quick Validation / Quick Unit Test command is run BETWEEN every refactor (except trivial batched
constant extractions). Record each run and its result here.>

| After Refactor | Quick Validation result | Notes |
| --- | --- | --- |
| Refactor <id> | PASS / FAIL | <notes> |

## Large Refactor

<If a large refactor was planned it is done LAST. Before it starts, the human is recommended to commit
locally so changes can be reverted if problems are hit, and the AI waits for the human's confirmation
to continue. Record the details of the Large Refactor here EVEN IF it was not done (and why).>

## Plan Deviation Discussion Gate

<If there was any deviation from the plan it must be highlighted and discussed with the human here, and
either an alternative plan agreed or the Refactor marked ABANDONED (with the human's agreement and the
reason). If there was no deviation, state that here.>

## Human Approval Details

<Placeholder — the human must review this document and all the code changes before giving approval.
The AI STOPS until approval is given. Once approval is obtained, record it here.>
