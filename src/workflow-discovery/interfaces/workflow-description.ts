/**
 * WorkflowDescription — A workflow's human-readable description, shown
 * to users in the listing.
 *
 * SRP Does: Represent the description text and return it as a string.
 *
 * SRP Knows About: That it models an end-user-facing description string.
 *
 * SRP Knows Nothing About: Where the description came from, how it's
 * validated, or where it appears in the listing.
 */
export interface WorkflowDescription {
  /** Return the description string. */
  toString(): string;
}
