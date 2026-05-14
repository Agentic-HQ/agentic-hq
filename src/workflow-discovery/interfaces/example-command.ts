/**
 * ExampleCommand — The `agentic-hq {shortName} {params}` example
 * invocation string, exposed as a whole and as its two parts so
 * callers (e.g. the listing formatter) can render them differently
 * without re-parsing the joined string.
 *
 * SRP Does: Represent the example CLI invocation as a whole string
 * and as its command-half / args-half.
 *
 * SRP Knows About: That the command combines a short name with
 * optional trailing parameters.
 *
 * SRP Knows Nothing About: Where the parts came from or how they're
 * formatted together (colours, indentation, etc.).
 */
export interface ExampleCommand {
  /** Return the `agentic-hq {shortName}` half (no trailing space, no args). */
  getCommandPart(): string;
  /** Return the args half with its leading separator space (` -- {params}`), or `""` when there are no params. */
  getArgsPart(): string;
  /** Return the full example command string. Equal to `getCommandPart() + getArgsPart()`. */
  toString(): string;
}
