/**
 * Unit Test: DefaultAhqCommandLine (AHQ-197)
 *
 * The incoming command line — the entire argv this process was launched
 * with, as composed by an AHQ entry-point wrapper (the bin wrappers for the
 * main CLI, the workflow runner for workflow programs). It owns the shared
 * entry seam of the explicit parameter chain: the required `--build-mode=`
 * and `--ahq-package-root=` options become typed runtime params, and the
 * remaining argv is yielded for Commander. Both options are required with
 * NO defaults — omission or an invalid build-mode value is a loud error at
 * construction, per the AHQ-195 parent brief.
 */
import { describe, expect, it } from 'vitest';

import { DefaultAhqCommandLine } from '../../../src/runtime-params/default-ahq-command-line.js';

const NODE_ARGV_PREFIX = ['/usr/bin/node', '/repo/src/cli/main.ts'];

describe('DefaultAhqCommandLine', () => {
  it('yields build-first params and the remaining argv in order', () => {
    const commandLine = new DefaultAhqCommandLine([
      ...NODE_ARGV_PREFIX,
      '--build-mode=build-first',
      '--ahq-package-root=/repo',
      'math',
      '--',
      '--input-number=7',
    ]);

    expect(commandLine.getAhqRuntimeParams().getBuildMode().getValue()).toBe('build-first');
    expect(commandLine.getAhqRuntimeParams().getAhqPackageRoot().getPath()).toBe('/repo');
    expect(commandLine.getRemainingArgs()).toEqual([
      ...NODE_ARGV_PREFIX,
      'math',
      '--',
      '--input-number=7',
    ]);
  });

  it('yields prebuilt params', () => {
    const commandLine = new DefaultAhqCommandLine([
      ...NODE_ARGV_PREFIX,
      '--build-mode=prebuilt',
      '--ahq-package-root=/installed/package/root',
    ]);

    expect(commandLine.getAhqRuntimeParams().getBuildMode().getValue()).toBe('prebuilt');
    expect(commandLine.getAhqRuntimeParams().getAhqPackageRoot().getPath()).toBe(
      '/installed/package/root'
    );
  });

  it('throws loudly at construction when --build-mode is missing', () => {
    expect(
      () => new DefaultAhqCommandLine([...NODE_ARGV_PREFIX, '--ahq-package-root=/repo', 'list'])
    ).toThrowError(/--build-mode/);
  });

  it('throws loudly at construction when --ahq-package-root is missing', () => {
    expect(
      () => new DefaultAhqCommandLine([...NODE_ARGV_PREFIX, '--build-mode=build-first', 'list'])
    ).toThrowError(/--ahq-package-root/);
  });

  it('throws loudly at construction on an invalid --build-mode value', () => {
    expect(
      () =>
        new DefaultAhqCommandLine([
          ...NODE_ARGV_PREFIX,
          '--build-mode=sideways',
          '--ahq-package-root=/repo',
        ])
    ).toThrowError(/sideways/);
  });
});
