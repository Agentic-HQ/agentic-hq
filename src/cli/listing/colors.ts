/**
 * Semantic colour helpers for CLI output.
 *
 * Honours `NO_COLOR`, `TERM=dumb`, and falls back to plain text when stdout
 * is not a TTY (e.g. piped to a file, captured by execSync in e2e tests).
 *
 * Why hand-rolled instead of `chalk`: this is ~40 lines doing exactly one
 * thing — adding a dep for it would be overkill for a single list command.
 *
 * Callers use the named helpers below (`formatTitle`, `formatPluginHeading`, etc.)
 * rather than composing raw `bold`/`yellow`/etc. — that keeps the visual vocabulary
 * in one place. To retheme, edit the composition expressions here.
 */

const ENABLE_COLOR =
  process.stdout.isTTY === true &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== 'dumb';

function wrap(openCode: number, closeCode: number): (text: string) => string {
  return (text) => (ENABLE_COLOR ? `\x1b[${openCode}m${text}\x1b[${closeCode}m` : text);
}

const bold = wrap(1, 22);
const dim = wrap(2, 22);
const cyan = wrap(36, 39);
const yellow = wrap(33, 39);
const green = wrap(32, 39);

export const formatTitle = (s: string): string => bold(cyan(s));
export const formatWorkspaceName = (s: string): string => bold(s);
export const formatWorkspacePath = (s: string): string => dim(s);
export const formatPluginHeading = (s: string): string => bold(yellow(s));
export const formatCommandText = (s: string): string => bold(green(s));
export const formatArgsText = (s: string): string => dim(s);
export const formatSameAsAhqMessageLine = (s: string): string => dim(s);
