/**
 * Unit Test: BuildMode companion constants (AHQ-197)
 *
 * The closed set of build modes lives as companion constants on the
 * BuildMode interface (declaration-merged const): BuildMode.BUILD_FIRST and
 * BuildMode.PREBUILT are the only instances that can ever exist, and
 * BuildMode.fromValue() is the single validation point for raw strings
 * crossing the argv/CLI boundary.
 */
import { describe, expect, it } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';

describe('BuildMode', () => {
  it('BUILD_FIRST holds build-first', () => {
    expect(BuildMode.BUILD_FIRST.getValue()).toBe('build-first');
  });

  it('PREBUILT holds prebuilt', () => {
    expect(BuildMode.PREBUILT.getValue()).toBe('prebuilt');
  });

  it('fromValue returns the matching constant', () => {
    expect(BuildMode.fromValue('build-first')).toBe(BuildMode.BUILD_FIRST);
    expect(BuildMode.fromValue('prebuilt')).toBe(BuildMode.PREBUILT);
  });

  it('fromValue throws loudly on an invalid value', () => {
    expect(() => BuildMode.fromValue('sideways')).toThrowError(/sideways/);
  });

  it('fromValue throws loudly on an empty value', () => {
    expect(() => BuildMode.fromValue('')).toThrowError(/build-first, prebuilt/);
  });
});
