/**
 * WorkflowShortName — A workflow's short identifier used on the CLI as
 * `agentic-hq {shortName}`.
 *
 * SRP Does: Represent the short-name value and return it as a string.
 *
 * SRP Knows About: That it models an identifier with a single string form.
 *
 * SRP Knows Nothing About: Where the short name came from, how it's
 * validated, or how it's used in listings or other commands.
 */
export interface WorkflowShortName {
  /** Return the short-name string. */
  toString(): string;
}
