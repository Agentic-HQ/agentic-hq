/**
 * WorkflowSearchResults — Results of discovering workflows; returns
 * the full listing (header + entries) for the user.
 *
 * SRP Does: Return the full listing string (header plus entries)
 * ready to show the user.
 *
 * SRP Knows About: That the listing has a header prepended to the
 * per-workflow entries.
 *
 * SRP Knows Nothing About: How workflows are discovered or how
 * individual entry lines are formatted.
 */
export interface WorkflowSearchResults {
  /** Return the full workflow listing string with header. */
  getWorkflowsListingString(): string;
}
