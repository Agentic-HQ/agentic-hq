/**
 * ExampleCommand — The `agentic-hq {shortName} {params}` example
 * invocation string.
 *
 * SRP Does: Represent the example CLI invocation and return it as
 * a string.
 *
 * SRP Knows About: That the command combines a short name with
 * optional trailing parameters.
 *
 * SRP Knows Nothing About: Where the parts came from or how they're
 * formatted together.
 */
export interface ExampleCommand {
  /** Return the example command string. */
  toString(): string;
}
