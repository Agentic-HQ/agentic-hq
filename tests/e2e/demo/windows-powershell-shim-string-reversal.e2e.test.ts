/**
 * E2E Test: String Reversal through a PowerShell `.ps1` shim (Windows only)
 *
 * The regression guard for AHQ-214. Every other CLI e2e test invokes
 * `node bin/agentic-hq.cjs …` through `execSync`, which shells out to cmd.exe
 * on Windows — and cmd.exe passes a bare `--` straight through. That is why
 * they all stayed green while the documented command was broken for every
 * PowerShell user.
 *
 * PowerShell is different: `--` is its OWN "end of named parameters" token, so
 * its parameter binder CONSUMES the first one before the script's `$args` is
 * populated. That binder applies because npm generates a `.ps1` shim for every
 * `bin` entry and PowerShell prefers `.ps1` over `.cmd` — a PATH-installed CLI
 * is therefore a PowerShell command, not a native one. The documented
 *
 *     agentic-hq-dev reversal -- --string-to-reverse="wow this is amazing"
 *
 * arrives at Node as `reversal --string-to-reverse=wow this is amazing`, and
 * before the fix Commander rejected it with
 * `error: unknown option '--string-to-reverse=wow this is amazing'`.
 *
 * The test generates its own npm-shaped shim rather than relying on a global
 * `npm link` — self-contained, no PATH dependency (same reasoning as the
 * sibling `agentic-hq-cli-string-reversal` test invoking the wrapper file
 * directly).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-214
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 300_000; // 300s because Claude can be reeeeeeeally slow
const LOG_FILE_LABEL = 'windows-powershell-shim-string-reversal';

const TEST_INPUT_STRING = 'this is a test string';
const EXPECTED_REVERSED_STRING = 'gnirts tset a si siht';

// The mechanism under test is PowerShell's own argument binding, which exists
// only on Windows (the .ps1 shim npm writes there is what makes the CLI a
// PowerShell command in the first place).
const describeWindowsOnly = describe.skipIf(process.platform !== 'win32');

let shimDirectory: string;

/**
 * A `.ps1` shim shaped like the one npm writes for a `bin` entry: it splats
 * `$args` at node. What matters is that it is a PowerShell *script*, so
 * PowerShell binds parameters before `$args` exists.
 */
function createPowerShellShim(directory: string): string {
  const shimPath = path.join(directory, 'agentic-hq-dev.ps1');
  const wrapperPath = path.join(process.cwd(), 'bin', 'agentic-hq.cjs');
  fs.writeFileSync(
    shimPath,
    ['#!/usr/bin/env pwsh', `& "node" "${wrapperPath}" $args`, 'exit $LASTEXITCODE'].join('\n')
  );
  return shimPath;
}

/**
 * The command a Windows user actually types, run the way PowerShell runs it.
 * `-Command` is required: `powershell -File` binds arguments differently and
 * PRESERVES the `--`, so it would not reproduce the fault at all.
 */
function powerShellCommandFor(shimPath: string, stringToReverse: string): string {
  return `powershell -NoProfile -Command "& '${shimPath}' reversal -- --string-to-reverse='${stringToReverse}'"`;
}

describeWindowsOnly('String Reversal through a PowerShell .ps1 shim', () => {
  beforeAll(() => {
    shimDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-powershell-shim-'));
  });

  afterAll(() => {
    fs.rmSync(shimDirectory, { recursive: true, force: true });
  });

  // Pins the PREMISE of the test below, so a failure there is diagnosable: if
  // PowerShell ever stops eating the separator, this fails first and says so —
  // rather than the workflow test quietly passing for the wrong reason.
  it('should confirm PowerShell drops the -- separator before the shim sees it', () => {
    const argvProbe = path.join(shimDirectory, 'argv-probe.cjs');
    fs.writeFileSync(argvProbe, 'console.log(JSON.stringify(process.argv.slice(2)));');
    const probeShim = path.join(shimDirectory, 'argv-probe.ps1');
    fs.writeFileSync(
      probeShim,
      ['#!/usr/bin/env pwsh', `& "node" "${argvProbe}" $args`, 'exit $LASTEXITCODE'].join('\n')
    );

    const delivered = execSync(powerShellCommandFor(probeShim, TEST_INPUT_STRING), {
      encoding: 'utf-8',
    });

    expect(JSON.parse(delivered)).toEqual(['reversal', `--string-to-reverse=${TEST_INPUT_STRING}`]);
  });

  it(
    'should reverse a string when PowerShell has eaten the -- separator',
    () => {
      // Arrange — the exact documented command, run through a PowerShell shim
      const command = powerShellCommandFor(createPowerShellShim(shimDirectory), TEST_INPUT_STRING);

      // Act - run the CLI and capture stdout via log file
      const output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS);

      // Assert - the workflow received its argument and reversed it
      expect(output).toContain(EXPECTED_REVERSED_STRING);
    },
    TEST_TIMEOUT_MS
  );
});
