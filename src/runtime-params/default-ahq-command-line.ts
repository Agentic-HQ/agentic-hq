/**
 * DefaultAhqCommandLine — the standard AhqCommandLine (AHQ-197).
 *
 * Constructed from the entire raw `process.argv`. The constructor is the
 * fail-fast validation point for option PRESENCE: an AHQ entry-point
 * wrapper always inserts `--build-mode=` and `--ahq-package-root=`, so a
 * command line missing either was not composed by a wrapper and throws
 * loudly (uncaught, per this repo's catastrophic-failure convention).
 * Value validation stays delegated to the value objects —
 * `BuildMode.fromValue()` and `DefaultAhqPackageRoot`.
 */
import type { AhqCommandLine } from '../interfaces/ahq-command-line.js';
import type { AhqRuntimeParams } from '../interfaces/ahq-runtime-params.js';
import { BuildMode } from '../interfaces/build-mode.js';

import { DefaultAhqPackageRoot } from './default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from './default-ahq-runtime-params.js';

const BUILD_MODE_OPTION = '--build-mode=';
const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';

export class DefaultAhqCommandLine implements AhqCommandLine {
  private readonly ahqRuntimeParams: AhqRuntimeParams;
  private readonly remainingArgs: string[];

  constructor(argv: string[]) {
    let buildModeValue: string | undefined;
    let ahqPackageRootPath: string | undefined;
    const remainingArgs: string[] = [];

    for (const arg of argv) {
      if (arg.startsWith(BUILD_MODE_OPTION)) {
        buildModeValue = arg.slice(BUILD_MODE_OPTION.length);
      } else if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
        ahqPackageRootPath = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
      } else {
        remainingArgs.push(arg);
      }
    }

    if (!buildModeValue) {
      throw new Error(
        `DefaultAhqCommandLine: required option ${BUILD_MODE_OPTION}<build-first|prebuilt> is missing — an entry-point wrapper (the bin wrapper or the workflow runner) inserts it, so a direct invocation must supply it explicitly`
      );
    }
    if (!ahqPackageRootPath) {
      throw new Error(
        `DefaultAhqCommandLine: required option ${AHQ_PACKAGE_ROOT_OPTION}<dir> is missing — an entry-point wrapper (the bin wrapper or the workflow runner) inserts it, so a direct invocation must supply it explicitly`
      );
    }

    this.ahqRuntimeParams = new DefaultAhqRuntimeParams(
      BuildMode.fromValue(buildModeValue),
      new DefaultAhqPackageRoot(ahqPackageRootPath)
    );
    this.remainingArgs = remainingArgs;
  }

  getAhqRuntimeParams(): AhqRuntimeParams {
    return this.ahqRuntimeParams;
  }

  getRemainingArgs(): string[] {
    return [...this.remainingArgs];
  }
}
