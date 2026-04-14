import * as path from 'node:path';

import type { AhqFiles } from '../interfaces/ahq-files.js';
import { AhqDirectoryImpl } from '../workspace/ahq-directory-impl.js';

import type { PluginDirectory } from './plugin-directory.js';

const PLUGINS_SUBPATH = path.join('.agentic-hq', 'plugins');
const WORKFLOW_FILES_GLOB = 'skills/*/ahq-workflow.json';

/**
 * PluginDirectoryImpl — Concrete PluginDirectory that computes its
 * full path dynamically from workspace root + plugin name, and
 * delegates workflow file discovery to AhqDirectoryImpl.
 *
 * SRP Does: Find workflow files within a plugin directory by computing
 * the directory path and delegating to an AhqDirectoryImpl.
 *
 * SRP Knows About: The `.agentic-hq/plugins/{name}` path convention
 * and the `skills/` /ahq-workflow.json glob pattern.
 *
 * SRP Knows Nothing About: What the workflow files contain or how
 * the glob engine works.
 */
export class PluginDirectoryImpl implements PluginDirectory {
  constructor(
    private readonly pluginName: string,
    private readonly workspaceRoot: string
  ) {}

  /** Find all ahq-workflow.json files within this plugin by delegating to AhqDirectoryImpl. */
  findWorkflowFiles(): AhqFiles {
    const pluginPath = path.join(this.workspaceRoot, PLUGINS_SUBPATH, this.pluginName);
    return new AhqDirectoryImpl(pluginPath).findMatchingFiles(WORKFLOW_FILES_GLOB);
  }
}
