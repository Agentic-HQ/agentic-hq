/**
 * Indent constants for the `agentic-hq list` output hierarchy.
 *
 * The visual contract — "each level adds one INDENT_UNIT" — used to be
 * implicit, with magic-spaced strings sprinkled across four files. This
 * module makes the hierarchy explicit:
 *
 *     Available workflows                            (level 0 — no indent)
 *       Workspace: /path                             (level 1)
 *         Plugin: foo                                (level 2)
 *           agentic-hq foo -- --bar                  (level 3)
 *             Description text                       (level 4)
 *
 * To change indent depth globally, edit `INDENT_UNIT`.
 */

const INDENT_UNIT = '  ';

export const WORKSPACE_INDENT = INDENT_UNIT.repeat(1);
export const PLUGIN_INDENT = INDENT_UNIT.repeat(2);
export const COMMAND_INDENT = INDENT_UNIT.repeat(3);
export const DESCRIPTION_INDENT = INDENT_UNIT.repeat(4);
