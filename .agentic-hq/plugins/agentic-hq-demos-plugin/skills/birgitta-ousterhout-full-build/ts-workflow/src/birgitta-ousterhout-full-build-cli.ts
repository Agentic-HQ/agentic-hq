#!/usr/bin/env node
/**
 * CLI: birgitta-ousterhout-full-build workflow using Claude Code
 *
 * Builds a whole system from a specification in thin vertical slices:
 * prologue (spec interrogation, rough shape) → a runtime-length slice loop
 * (scope → design → failing check → implement → check → refactor → commit,
 * once per slice in fresh sessions) → epilogue (big review, big refactor,
 * validate/report/commit).
 *
 * Control contract (all loop bounds and stop conditions live here, in
 * TypeScript, never in a prompt):
 * - Command 01's output is prefix-checked for `env_check_failed` — fail fast.
 * - Command 03's output is a bare verdict sentinel, EXACT-matched on the
 *   trimmed string. Never substring-match: "no_more_slices" contains
 *   "more_slices", so .includes() would read every stop as a continue.
 * - Command 07's output is `coverage-delta=<n>`; two consecutive zero-delta
 *   passes end the loop after the in-flight pass completes its commit stage,
 *   so no-progress never leaves an uncommitted slice behind.
 * - At the pass cap the CLI prompts on stdin (the one human touch-point,
 *   between stages — every Claude stage remains fully unattended);
 *   Enter/anything-but-y/EOF/non-interactive stdin all mean No.
 * - Malformed control outputs throw uncaught with the full command output in
 *   the message (AHQ convention: catastrophic failures print the full stack
 *   trace as the bug report; no boundary catch).
 *
 * This is the plugin-bundled version of the workflow CLI.
 * Import uses the agentic-hq package (resolved via link: protocol for local dev).
 */

import * as readline from 'node:readline/promises';

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const COMMAND_01_P1_SPEC_INTERROGATION =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:01-p1-spec-interrogation';
const COMMAND_02_P2_ROUGH_SHAPE_AND_SLICE_BACKLOG =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:02-p2-rough-shape-and-slice-backlog';
const COMMAND_03_L1_SLICE_SCOPE_AND_LOOP_CONTROL =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:03-l1-slice-scope-and-loop-control';
const COMMAND_04_L2_SLICE_DESIGN =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:04-l2-slice-design';
const COMMAND_05_L3_FAILING_CHECK =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:05-l3-failing-check';
const COMMAND_06_L4_IMPLEMENTATION =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:06-l4-implementation';
const COMMAND_07_L5_SLICE_CHECK =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:07-l5-slice-check';
const COMMAND_08_L6_REFACTOR_AND_RECONCILE =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:08-l6-refactor-and-reconcile';
const COMMAND_09_L7_SLICE_COMMIT =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:09-l7-slice-commit';
const COMMAND_10_E1_BIG_REVIEW =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:10-e1-big-review';
const COMMAND_11_E2_BIG_REFACTOR =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:11-e2-big-refactor';
const COMMAND_12_E3_VALIDATE_REPORT_COMMIT =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:12-e3-validate-report-commit';

/** Consecutive zero-coverage-delta passes that end the loop. */
const NO_PROGRESS_LIMIT = 2;

/** How many extra passes a 'y' at the cap prompt grants. */
const CAP_EXTENSION = 20;

/** Default path to the specification when --spec-file is not passed. */
const DEFAULT_SPEC_FILE = './docs/spec.md';

/** Default slice-loop pass cap when --max-passes is not passed. */
const DEFAULT_MAX_PASSES = 40;

/** Prefix Command 01 (P1) puts on its output when the environment self-test fails. */
const ENV_CHECK_FAILED_PREFIX = 'env_check_failed';

/** The exact shape of Command 07's (L5) entire output. */
const COVERAGE_DELTA_PATTERN = /^coverage-delta=(\d+)$/;

/** The three sentinels Command 03 (L1) may return as its entire output. */
type SliceVerdict = 'more_slices' | 'no_more_slices' | 'run_unsalvageable';

/** Why the slice loop ended — passed to Command 12 (E3) for honest reporting. */
type LoopExitReason = 'no_more_slices' | 'run_unsalvageable' | 'max_passes_reached' | 'no_progress';

/** Builds the fresh per-invocation variables string the command files parse. */
function buildVariablesString(
  agenticHqWorkspaceRoot: string,
  specFile: string,
  extraVariables?: Record<string, string | number>
): string {
  let variablesString = `Your variables for use in this command are: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot} and spec-file=${specFile}`;
  for (const [name, value] of Object.entries(extraVariables ?? {})) {
    variablesString += ` and ${name}=${value}`;
  }
  return variablesString;
}

/** Parses Command 07's (L5) `coverage-delta=<n>` output; anything else throws. */
function parseCoverageDelta(l5Output: string): number {
  const deltaMatch = l5Output.trim().match(COVERAGE_DELTA_PATTERN);
  if (!deltaMatch) {
    throw new Error(`Unparseable L5 coverage delta. Full Command 07 output:\n${l5Output}`);
  }
  return Number.parseInt(deltaMatch[1], 10);
}

/**
 * Parses Command 03's (L1) bare verdict sentinel, EXACT-matched on the trimmed
 * output — never substring-matched, because "no_more_slices" contains
 * "more_slices". Anything else throws.
 */
function parseSliceVerdict(l1Output: string): SliceVerdict {
  const verdict = l1Output.trim();
  if (verdict === 'more_slices' || verdict === 'no_more_slices' || verdict === 'run_unsalvageable') {
    return verdict;
  }
  throw new Error(`Unrecognised L1 verdict. Full Command 03 output:\n${l1Output}`);
}

/**
 * Asks on stdin whether to extend the pass cap. Default is No: Enter, any
 * answer other than y/Y, EOF, or a non-interactive stdin all decline — so an
 * unattended run is never blocked here; at worst the epilogue runs as normal
 * with every completed slice already committed.
 */
async function askToExtendCap(maxPasses: number): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `Limit of ${maxPasses} passes hit. Continue another ${CAP_EXTENSION}? (y/N) `
    );
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

/** One full run of the workflow: prologue → slice loop → epilogue. */
class FullBuildRun {
  private maxPasses: number;
  private passesCompleted = 0;
  private zeroDeltaStreak = 0;

  constructor(
    private readonly tool: DefaultClaudeCodeTool,
    private readonly agenticHqWorkspaceRoot: string,
    private readonly specFile: string,
    initialMaxPasses: number
  ) {
    this.maxPasses = initialMaxPasses;
  }

  async run(): Promise<void> {
    await this.runPrologue();
    const exitReason = await this.runSliceLoop();
    await this.runEpilogue(exitReason);
  }

  /**
   * P1 (spec interrogation, opening with the environment self-test — a broken
   * environment costs seconds here, not a half-run of tokens) then P2 (rough
   * shape & slice backlog).
   */
  private async runPrologue(): Promise<void> {
    const p1Output = await this.executeCommand(COMMAND_01_P1_SPEC_INTERROGATION);
    if (p1Output.trim().startsWith(ENV_CHECK_FAILED_PREFIX)) {
      throw new Error(`Environment self-test failed. Full Command 01 output:\n${p1Output}`);
    }
    await this.executeCommand(COMMAND_02_P2_ROUGH_SHAPE_AND_SLICE_BACKLOG);
  }

  /** The slice loop. Iteration count is unknown up front: L1's verdict decides. */
  private async runSliceLoop(): Promise<LoopExitReason> {
    let exitReason: LoopExitReason | null = null;
    while (exitReason === null) {
      exitReason = await this.runNextPass();
    }
    return exitReason;
  }

  /**
   * The loop body: cap gate, L1 verdict, then (if the run continues) one full
   * slice pass. Returns the loop's exit reason, or null to keep looping.
   */
  private async runNextPass(): Promise<LoopExitReason | null> {
    if (!(await this.capAllowsAnotherPass())) {
      return 'max_passes_reached';
    }
    const passNumber = this.passesCompleted + 1;
    const verdict = await this.getSliceVerdict(passNumber);
    if (verdict !== 'more_slices') {
      return verdict;
    }
    const coverageDelta = await this.runSliceStages(passNumber);
    this.passesCompleted = passNumber;
    return this.recordProgress(coverageDelta);
  }

  /**
   * The runaway guard. At the cap, asks whether to extend; repeatable — a 'y'
   * raises the cap and the question is asked again at the new cap.
   */
  private async capAllowsAnotherPass(): Promise<boolean> {
    while (this.passesCompleted >= this.maxPasses) {
      if (!(await askToExtendCap(this.maxPasses))) {
        return false;
      }
      this.maxPasses += CAP_EXTENSION;
    }
    return true;
  }

  /** Runs Command 03 (L1) and parses its bare verdict sentinel. */
  private async getSliceVerdict(passNumber: number): Promise<SliceVerdict> {
    return parseSliceVerdict(
      await this.executeCommand(COMMAND_03_L1_SLICE_SCOPE_AND_LOOP_CONTROL, {
        'pass-number': passNumber,
      })
    );
  }

  /**
   * L2 → L7 for the current pass. The pass always completes through its
   * commit stage (L7) — even a pass that ends the loop leaves nothing
   * uncommitted behind. Returns the slice's coverage delta from L5.
   */
  private async runSliceStages(passNumber: number): Promise<number> {
    const passVariables = { 'pass-number': passNumber };
    await this.executeCommand(COMMAND_04_L2_SLICE_DESIGN, passVariables);
    await this.executeCommand(COMMAND_05_L3_FAILING_CHECK, passVariables);
    await this.executeCommand(COMMAND_06_L4_IMPLEMENTATION, passVariables);
    const coverageDelta = parseCoverageDelta(
      await this.executeCommand(COMMAND_07_L5_SLICE_CHECK, passVariables)
    );
    await this.executeCommand(COMMAND_08_L6_REFACTOR_AND_RECONCILE, passVariables);
    await this.executeCommand(COMMAND_09_L7_SLICE_COMMIT, passVariables);
    return coverageDelta;
  }

  /** Applies the no-progress rule: two consecutive zero-delta passes end the loop. */
  private recordProgress(coverageDelta: number): LoopExitReason | null {
    if (coverageDelta === 0) {
      this.zeroDeltaStreak += 1;
    } else {
      this.zeroDeltaStreak = 0;
    }
    return this.zeroDeltaStreak >= NO_PROGRESS_LIMIT ? 'no_progress' : null;
  }

  /**
   * E1/E2 are skipped only for an unsalvageable run: reviewing and refactoring
   * a corpse wastes the run's remaining budget. E3 ALWAYS runs — an honest
   * RESULTS.md and the final local commit happen on every exit path. The run
   * never pushes.
   */
  private async runEpilogue(exitReason: LoopExitReason): Promise<void> {
    if (exitReason !== 'run_unsalvageable') {
      await this.executeCommand(COMMAND_10_E1_BIG_REVIEW);
      await this.executeCommand(COMMAND_11_E2_BIG_REFACTOR);
    }
    await this.executeCommand(COMMAND_12_E3_VALIDATE_REPORT_COMMIT, {
      'loop-exit-reason': exitReason,
      'passes-completed': this.passesCompleted,
    });
  }

  /** Executes one workflow command with a freshly built variables string. */
  private async executeCommand(
    command: string,
    extraVariables?: Record<string, string | number>
  ): Promise<string> {
    return this.tool.execute(
      command,
      buildVariablesString(this.agenticHqWorkspaceRoot, this.specFile, extraVariables)
    );
  }
}

function requireAgenticHqWorkspaceRoot(): string {
  const agenticHqWorkspaceRoot = process.env['AGENTIC_HQ_WORKSPACE_ROOT'];
  if (!agenticHqWorkspaceRoot) {
    console.error(
      'ERROR: AGENTIC_HQ_WORKSPACE_ROOT environment variable is not set.\n' +
        'This CLI is designed to be launched by the agentic-hq CLI, which exports it on every run.'
    );
    process.exit(1);
  }
  return agenticHqWorkspaceRoot;
}

/** Explicit integer check: a NaN cap would make the runaway guard silently never fire. */
function parseMaxPasses(rawMaxPasses: string): number {
  const maxPasses = Number.parseInt(rawMaxPasses, 10);
  if (Number.isNaN(maxPasses) || maxPasses < 1) {
    throw new Error(`--max-passes must be a positive integer, got: ${rawMaxPasses}`);
  }
  return maxPasses;
}

const program = new Command();

program
  .name('birgitta-ousterhout-full-build-cli')
  .description(
    'Builds a whole system from a specification in thin vertical slices, steered by APoSD Guides and checked by Birgitta Böckeler-style Sensors.'
  )
  .option(
    '--spec-file <path>',
    'Path to the specification of the system to build, relative to the working directory',
    DEFAULT_SPEC_FILE
  )
  .option(
    '--max-passes <n>',
    'Hard cap on slice-loop passes (runaway guard, not a target)',
    String(DEFAULT_MAX_PASSES)
  )
  .action(async (options: { specFile: string; maxPasses: string }) => {
    const run = new FullBuildRun(
      new DefaultClaudeCodeTool(),
      requireAgenticHqWorkspaceRoot(),
      options.specFile,
      parseMaxPasses(options.maxPasses)
    );
    await run.run();
  });

program.parse();
