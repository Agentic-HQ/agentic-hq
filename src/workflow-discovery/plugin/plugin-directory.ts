import type { AhqFiles } from '../interfaces/ahq-files.js';

/**
 * PluginDirectory — A plugin's directory that can find workflow
 * files within it.
 *
 * Note: this interface is not currently referenced as a declared
 * type by any production code — callers use `PluginDirectoryImpl`
 * directly. It is deliberately kept per DR.1 ("class/interface pair
 * for every concept") for future switchability (test doubles /
 * alternative impls). See
 * `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/04a-refactor-phase-proposed-refactors.md`
 * §`Refactor 2.6: Delete PluginDirectory.toString() (dead — downstream of 2.3)`
 * (and the adjacent 2.7 rejection note) for the rationale.
 *
 * SRP Does: Find workflow files within a plugin directory.
 *
 * SRP Knows About: That a plugin directory contains discoverable
 * workflow files.
 *
 * SRP Knows Nothing About: How the path is resolved, which glob
 * engine is used, or what the workflow files contain.
 */
export interface PluginDirectory {
  /** Find all ahq-workflow.json files within this plugin directory. */
  findWorkflowFiles(): AhqFiles;
}
