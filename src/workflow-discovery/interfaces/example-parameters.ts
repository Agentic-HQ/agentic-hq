/**
 * ExampleParameters — A workflow's example CLI parameters (no leading
 * separator; may be empty).
 *
 * SRP Does: Represent the parameters text and return it as a
 * (possibly empty) string.
 *
 * SRP Knows About: That the value is a trailing CLI parameter string
 * that may legitimately be empty.
 *
 * SRP Knows Nothing About: Where the parameters came from or how they
 * join with other command parts.
 */
export interface ExampleParameters {
  /** Return the example parameters string (may be empty). */
  toString(): string;
}
