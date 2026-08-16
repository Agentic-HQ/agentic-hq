/**
 * ListingFormatter — Renders the `agentic-hq list` output by reading
 * structured data from Workspace / Plugin / AhqWorkflow entities.
 *
 * SRP Does: Take an AHQ package and a current-user workspace and
 * produce the full coloured, indented listing string ready to print.
 *
 * SRP Knows About: The visual contract (title text, headers, "Same
 * as AHQ" message, blank-line spacing) and the colour/indent helpers
 * under `src/cli/listing/`.
 *
 * SRP Knows Nothing About: How plugins or workflows are discovered.
 * It reads them as plain data via the getter methods on Workspace,
 * Plugin, and AhqWorkflow — so the layering arrow points
 * CLI → workflow-discovery, never the other way.
 */
import type { AhqWorkflow } from '../../workflow-discovery/interfaces/ahq-workflow.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';
import type { Plugin } from '../../workflow-discovery/plugin/plugin.js';

import {
  formatArgsText,
  formatCommandText,
  formatPluginHeading,
  formatSameAsAhqMessageLine,
  formatTitle,
  formatWorkspaceName,
  formatWorkspacePath,
} from './colors.js';
import {
  COMMAND_INDENT,
  DESCRIPTION_INDENT,
  PLUGIN_INDENT,
  WORKSPACE_INDENT,
} from './listing-indent.js';

// Literal text fragments — naming these makes the assembly read like English below.
const TITLE_TEXT = 'Available workflows';
const PLUGIN_LABEL = 'Plugin: ';
const WORKSPACE_NAME_SUFFIX = ':';
const SAME_AS_AHQ_MESSAGE_TEXT =
  'Same as Agentic HQ Package (running from within the AHQ package directory)';

// Structural punctuation — keeps line-assembly readable as prose.
const LINE_BREAK = '\n';
const BLANK_LINE_BETWEEN_BLOCKS = '\n\n';
const SPACE = ' ';

export class ListingFormatter {
  /**
   * Top-level entry point. Returns the full listing string, padded
   * with a leading and trailing blank line (matches prior output so
   * the visible result is byte-identical).
   */
  formatWorkflowsListing(ahqPackage: Workspace, localWorkspace: Workspace): string {
    // Leading + trailing LINE_BREAK give the output a blank line top and bottom, matching
    // the pre-refactor `['', ...sections, ''].join('\n')` shape so output stays byte-identical.
    const body = [
      this.titleLine(),
      this.workspaceBlock(ahqPackage),
      this.localWorkspaceBlock(localWorkspace),
    ].join(BLANK_LINE_BETWEEN_BLOCKS);
    return LINE_BREAK + body + LINE_BREAK;
  }

  /** The bold-cyan title shown at the top of the listing. */
  private titleLine(): string {
    return formatTitle(TITLE_TEXT);
  }

  /**
   * A workspace's full section: a single-line header followed by each
   * non-empty plugin block, separated by blank lines. When the workspace
   * has no plugins (or only empty plugins), just the header is returned.
   */
  private workspaceBlock(workspace: Workspace): string {
    const header = this.workspaceHeaderLine(workspace);
    const pluginBlocks = this.allPluginBlocksIn(workspace);
    if (pluginBlocks.length === 0) {
      return header;
    }
    return header + BLANK_LINE_BETWEEN_BLOCKS + pluginBlocks.join(BLANK_LINE_BETWEEN_BLOCKS);
  }

  /**
   * The local workspace's section. When the local workspace IS the AHQ
   * workspace, we don't repeat its content — instead a one-line "Same as
   * AHQ" message is shown under the local-workspace header.
   */
  private localWorkspaceBlock(localWorkspace: Workspace): string {
    if (localWorkspace.isAhqPackage()) {
      return this.sameAsAhqMessageLine(localWorkspace);
    }
    return this.workspaceBlock(localWorkspace);
  }

  /** `  {display name}: {root path}` — single-line workspace header, indented one level. */
  private workspaceHeaderLine(workspace: Workspace): string {
    const labelledName = formatWorkspaceName(workspace.getDisplayName() + WORKSPACE_NAME_SUFFIX);
    const dimmedPath = formatWorkspacePath(workspace.getRoot());
    return WORKSPACE_INDENT + labelledName + SPACE + dimmedPath;
  }

  /**
   * All non-empty plugin blocks in a workspace, in discovery order.
   * Plugins with no workflows produce an empty string from `pluginBlock`
   * and are filtered out — the user never sees an empty plugin heading.
   */
  private allPluginBlocksIn(workspace: Workspace): string[] {
    return workspace
      .getPlugins()
      .map((plugin) => this.pluginBlock(plugin))
      .filter((block) => block.length > 0);
  }

  /**
   * A plugin's listing section: bold-yellow heading followed by each
   * workflow's entry, separated by blank lines. Returns the empty
   * string when the plugin contains no workflows.
   */
  private pluginBlock(plugin: Plugin): string {
    const entries = plugin.getWorkflows().map((workflow) => this.workflowEntry(workflow));
    if (entries.length === 0) {
      return '';
    }
    return (
      this.pluginHeadingLine(plugin) +
      BLANK_LINE_BETWEEN_BLOCKS +
      entries.join(BLANK_LINE_BETWEEN_BLOCKS)
    );
  }

  /** `    Plugin: {name}` — indented two levels, bold-yellow. */
  private pluginHeadingLine(plugin: Plugin): string {
    return PLUGIN_INDENT + formatPluginHeading(PLUGIN_LABEL + plugin.getName());
  }

  /** A workflow's two-line entry: command line on top, description line below. */
  private workflowEntry(workflow: AhqWorkflow): string {
    return this.workflowCommandLine(workflow) + LINE_BREAK + this.workflowDescriptionLine(workflow);
  }

  /**
   * `      agentic-hq <command> [bold green] -- <args> [dim]` — indented
   * three levels. The command-half is emphasised in bold-green; the
   * args-half (with its leading separator space) is visually demoted in dim.
   * The split lives on `ExampleCommand` itself, so the formatter never
   * re-parses the joined string.
   */
  private workflowCommandLine(workflow: AhqWorkflow): string {
    const example = workflow.getExampleCommand();
    return (
      COMMAND_INDENT +
      formatCommandText(example.getCommandPart()) +
      formatArgsText(example.getArgsPart())
    );
  }

  /** `        {description}` — indented four levels, plain text. */
  private workflowDescriptionLine(workflow: AhqWorkflow): string {
    return DESCRIPTION_INDENT + workflow.getDescription().toString();
  }

  /**
   * The single-line "Same as Agentic HQ Package" message that replaces
   * the local-workspace block when local IS the AHQ package. Renders as:
   *   `  Local Workspace: Same as Agentic HQ Package (...)` — dim suffix.
   */
  private sameAsAhqMessageLine(localWorkspace: Workspace): string {
    const labelledName = formatWorkspaceName(
      localWorkspace.getDisplayName() + WORKSPACE_NAME_SUFFIX
    );
    return (
      WORKSPACE_INDENT + labelledName + SPACE + formatSameAsAhqMessageLine(SAME_AS_AHQ_MESSAGE_TEXT)
    );
  }
}
