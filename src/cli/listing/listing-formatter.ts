/**
 * ListingFormatter — Renders the `agentic-hq list` output by reading
 * structured data from Workspace / Plugin / AhqWorkflow entities.
 *
 * SRP Does: Take an AHQ package and a current-user workspace and
 * produce the full coloured, indented listing string ready to print —
 * including which entries are DISABLED because their short name was
 * already claimed (by the built-in `list`, or by an entry earlier in
 * the same first-claim walk that registration performs; AHQ-205).
 *
 * SRP Knows About: The visual contract (title text, headers, "Same
 * as AHQ" message, DISABLED flag, blank-line spacing), the first-claim
 * walk order (built-in `list`, then local workspace, then AHQ package),
 * and the colour/indent helpers under `src/cli/listing/`.
 *
 * SRP Knows Nothing About: How plugins or workflows are discovered.
 * It reads them as plain data via the getter methods on Workspace,
 * Plugin, and AhqWorkflow — so the layering arrow points
 * CLI → workflow-discovery, never the other way.
 */
import type { AhqWorkflow } from '../../workflow-discovery/interfaces/ahq-workflow.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';
import type { Plugin } from '../../workflow-discovery/plugin/plugin.js';
import { LIST_SUBCOMMAND_NAME } from '../agentic-hq-program.js';

import {
  formatArgsText,
  formatCommandText,
  formatDisabledFlag,
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
const DISABLED_FLAG_PREFIX = "DISABLED — shortId '";
const DISABLED_FLAG_SUFFIX = "' is already used by existing workflow";

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
    // Rendered in REGISTRATION order (the local workspace claims short names first — AHQ-205)
    // but assembled in DISPLAY order (package block first). This is the same first-claim walk
    // WorkflowSearchResultsImpl.registerWorkflowsWith performs (`list` is registered before any
    // workflow, so it is pre-claimed), so what is flagged DISABLED here is exactly what
    // registration skipped.
    const claimedShortNames = new Set<string>([LIST_SUBCOMMAND_NAME]);
    const localBlock = this.localWorkspaceBlock(localWorkspace, claimedShortNames);
    const packageBlock = this.workspaceBlock(ahqPackage, claimedShortNames);
    // Leading + trailing LINE_BREAK give the output a blank line top and bottom, matching
    // the pre-refactor `['', ...sections, ''].join('\n')` shape so output stays byte-identical.
    const body = [this.titleLine(), packageBlock, localBlock].join(BLANK_LINE_BETWEEN_BLOCKS);
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
  private workspaceBlock(workspace: Workspace, claimedShortNames: Set<string>): string {
    const header = this.workspaceHeaderLine(workspace);
    const pluginBlocks = this.allPluginBlocksIn(workspace, claimedShortNames);
    if (pluginBlocks.length === 0) {
      return header;
    }
    return header + BLANK_LINE_BETWEEN_BLOCKS + pluginBlocks.join(BLANK_LINE_BETWEEN_BLOCKS);
  }

  /**
   * The local workspace's section. When the local workspace IS the AHQ
   * workspace, we don't repeat its content — instead a one-line "Same as
   * AHQ" message is shown under the local-workspace header (and, mirroring
   * CurrentUserWorkspaceImpl.registerWorkflowsWith, no short names are claimed).
   */
  private localWorkspaceBlock(localWorkspace: Workspace, claimedShortNames: Set<string>): string {
    if (localWorkspace.isAhqPackage()) {
      return this.sameAsAhqMessageLine(localWorkspace);
    }
    return this.workspaceBlock(localWorkspace, claimedShortNames);
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
  private allPluginBlocksIn(workspace: Workspace, claimedShortNames: Set<string>): string[] {
    return workspace
      .getPlugins()
      .map((plugin) => this.pluginBlock(plugin, claimedShortNames))
      .filter((block) => block.length > 0);
  }

  /**
   * A plugin's listing section: bold-yellow heading followed by each
   * workflow's entry, separated by blank lines. Returns the empty
   * string when the plugin contains no workflows.
   */
  private pluginBlock(plugin: Plugin, claimedShortNames: Set<string>): string {
    const entries = plugin
      .getWorkflows()
      .map((workflow) => this.workflowEntry(workflow, claimedShortNames));
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

  /**
   * A workflow's two-line entry: command line on top, description line below.
   * When the short name is already claimed (by the built-in `list`, or by an
   * entry rendered earlier in the walk) the entry lost the collision and is not
   * a subcommand — a bold-red DISABLED flag line is prepended. Claims the name.
   */
  private workflowEntry(workflow: AhqWorkflow, claimedShortNames: Set<string>): string {
    const shortName = workflow.getShortName().toString();
    const isDisabled = claimedShortNames.has(shortName);
    claimedShortNames.add(shortName);
    const flagLine = isDisabled ? this.disabledFlagLine(shortName) + LINE_BREAK : '';
    return (
      flagLine +
      this.workflowCommandLine(workflow) +
      LINE_BREAK +
      this.workflowDescriptionLine(workflow)
    );
  }

  /** `      DISABLED — shortId '{x}' is already used by existing workflow` — bold-red, command indent. */
  private disabledFlagLine(shortName: string): string {
    return (
      COMMAND_INDENT + formatDisabledFlag(DISABLED_FLAG_PREFIX + shortName + DISABLED_FLAG_SUFFIX)
    );
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
