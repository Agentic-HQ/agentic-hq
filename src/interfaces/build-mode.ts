/**
 * BuildMode — how the agentic-hq artifact is built and run (AHQ-197).
 *
 * A structural truth baked into whichever entry point was invoked: the dev
 * wrapper passes `build-first` (build the release tree on the fly, execute
 * from it), the shipped wrapper passes `prebuilt` (execute the installed
 * artifact as-is). Only the shared workflow runner acts on the value.
 *
 * The closed set of modes lives as companion constants on the interface
 * (declaration-merged const): `BuildMode.BUILD_FIRST` and
 * `BuildMode.PREBUILT` are the only instances that can ever exist, and
 * `BuildMode.fromValue()` is the single validation point for raw strings
 * crossing the argv/CLI boundary — it throws loudly on anything invalid,
 * per this repo's catastrophic-failure convention.
 */

export type BuildModeValue = 'build-first' | 'prebuilt';

export interface BuildMode {
  getValue(): BuildModeValue;
}

// Not exported: the closed set means the companion constants below are the
// only BuildMode instances that can ever exist.
class StandardBuildMode implements BuildMode {
  constructor(private readonly value: BuildModeValue) {}

  getValue(): BuildModeValue {
    return this.value;
  }
}

export const BuildMode = {
  BUILD_FIRST: new StandardBuildMode('build-first') as BuildMode,
  PREBUILT: new StandardBuildMode('prebuilt') as BuildMode,

  /** Parse a raw string from the argv/CLI boundary into one of the constants. */
  fromValue(value: string): BuildMode {
    if (value === 'build-first') {
      return BuildMode.BUILD_FIRST;
    }
    if (value === 'prebuilt') {
      return BuildMode.PREBUILT;
    }
    throw new Error(
      `BuildMode: invalid build-mode value "${value}" (valid: build-first, prebuilt)`
    );
  },
} as const;
