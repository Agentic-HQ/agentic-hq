#!/usr/bin/env node
/**
 * CLI: Add Feature — the simple flagship starter workflow.
 *
 * A short, generic, customizable four-stage loop for adding one small feature to an
 * existing codebase:
 *   01 — Researcher    (turns the request into an approved feature brief; decides if it's a good size)
 *   02 — Planner       (turns the brief into an approved implementation plan)
 *   03 — Implementer   (implements the approved plan with tests)
 *   04 — Reviewer      (concise evidence-backed review + a path to customize the workflow)
 *
 * Broadcast + stage-outcome gate. The CLI builds the variables string itself (the AHQ
 * package root + the mandatory ticket-id) and passes the SAME string to all four commands; the
 * outputs of commands 02-04 are ignored. Command 01's (the Researcher's) trimmed output
 * is the stage outcome:
 *   - CONTINUE_WORKFLOW — run agents 02, 03, 04 in order.
 *   - TERMINATE_WORKFLOW — print the termination line and exit 0 (a success path).
 *   - anything else — a broken-contract failure: throw (uncaught) so the full stack trace
 *     is printed for a bug report.
 *
 * The framework's required --build-mode / --ahq-package-root options
 * (forwarded by the shared workflow runner) are consumed by
 * DefaultWorkflowRuntime — this file contains only add-feature code.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-157
 * See: https://agentic-hq.atlassian.net/browse/AHQ-197
 */

import { Command } from 'commander';

import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';

const CONTINUE_WORKFLOW_OUTCOME = 'CONTINUE_WORKFLOW';
const TERMINATE_WORKFLOW_OUTCOME = 'TERMINATE_WORKFLOW';

const COMMAND_01_RESEARCHER = '/agentic-hq-demos-plugin:add-feature:01-researcher';
const COMMAND_02_PLANNER = '/agentic-hq-demos-plugin:add-feature:02-planner';
const COMMAND_03_IMPLEMENTER = '/agentic-hq-demos-plugin:add-feature:03-implementer';
const COMMAND_04_REVIEWER = '/agentic-hq-demos-plugin:add-feature:04-reviewer';

const runtime = new DefaultWorkflowRuntime(process.argv);
const tool = runtime.getClaudeCodeTool();

const program = new Command();

program
  .name('add-feature-cli')
  .description(
    'Add a small feature using a simple four-stage research/plan/implement/review workflow'
  )
  .requiredOption('--ticket-id <id>', 'Mandatory ticket id (make one up if you have no issue tracker)')
  .action(async (options: { ticketId: string }) => {
    // The TS program builds the full broadcast string itself and passes the SAME string to all four commands.
    const allVariables =
      `The variables used in this workflow are: ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` +
      ` and ticket-id=${options.ticketId}`;

    // The Researcher's trimmed output is the stage-outcome gate (exactly one of three outcomes).
    const researcherOutcome = (await tool.execute(COMMAND_01_RESEARCHER, allVariables)).trim();

    if (researcherOutcome === TERMINATE_WORKFLOW_OUTCOME) {
      // Termination is a success path, not an error — the program then exits naturally with code 0.
      console.log('Got TERMINATE_WORKFLOW response from agent. Terminating workflow.');
    } else if (researcherOutcome === CONTINUE_WORKFLOW_OUTCOME) {
      // Broadcast the same string to each later command (ignore their outputs).
      await tool.execute(COMMAND_02_PLANNER, allVariables);
      await tool.execute(COMMAND_03_IMPLEMENTER, allVariables);
      await tool.execute(COMMAND_04_REVIEWER, allVariables);
    } else {
      // CATASTROPHIC: the Researcher broke the stage-outcome contract, so the whole workflow is
      // broken. Throw (uncaught) with a full explanation of the cause so Node prints the ENTIRE
      // stack trace — there is no logging system, so that terminal stack trace is exactly what the
      // user copies into a bug report. A clean one-line message would lose the diagnostic info.
      throw new Error(
        `The add-feature workflow is broken: the Researcher (command 01) returned an unexpected stage ` +
          `outcome "${researcherOutcome}", but it must return exactly "${CONTINUE_WORKFLOW_OUTCOME}" or ` +
          `"${TERMINATE_WORKFLOW_OUTCOME}". This should never happen and the workflow cannot continue. ` +
          `Please report this as a bug and include the full stack trace printed below.`
      );
    }
  });

// We deliberately use parse() and do NOT attach a .catch() handler. A thrown Error above is an
// unrecoverable, "the whole workflow is broken" failure: leaving it UNCAUGHT makes Node print the
// FULL STACK TRACE and exit non-zero. With no logging system, that stack trace is the bug report
// the user sends us, so suppressing it into a tidy one-line message would actively hurt.
// DO NOT add a boundary catch here. (Happy paths — TERMINATE / CONTINUE — simply resolve, exit 0.)
program.parse(runtime.getWorkflowArgs());
