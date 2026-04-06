import type { AhqDirectory } from '../interfaces/ahq-directory.js';
import type { AhqFiles } from '../interfaces/ahq-files.js';
import type { AhqWorkspace } from '../interfaces/ahq-workspace.js';

import { AhqDirectoryImpl } from './ahq-directory-impl.js';

export const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';

/**
 * AhqWorkspaceImpl — Concrete AhqWorkspace that reads the root path
 * from the `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegates searches
 * to an AhqDirectory.
 *
 * SRP Does: Read the workspace root path from the
 * `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegate file searches to
 * an AhqDirectory at that root.
 *
 * SRP Knows About: The `AGENTIC_HQ_WORKSPACE_ROOT` env var name and
 * the AhqDirectoryImpl constructor.
 *
 * SRP Knows Nothing About: How globs are matched or what the files
 * contain.
 */
export class AhqWorkspaceImpl implements AhqWorkspace {
  private readonly rootDirectory: AhqDirectory;

  constructor() {
    const root = process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR] ?? '';
    this.rootDirectory = new AhqDirectoryImpl(root);
  }

  /** Return files in the workspace matching the given glob (delegates to the root AhqDirectory). */
  findFiles(globPattern: string): AhqFiles {
    return this.rootDirectory.findMatchingFiles(globPattern);
  }
}
