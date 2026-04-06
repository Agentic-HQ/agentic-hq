/**
 * AhqWorkflow — A discoverable workflow entity that returns its
 * listing entry line.
 *
 * SRP Does: Return this single workflow's line for the workflow listing.
 *
 * SRP Knows About: That each workflow contributes one entry line to
 * the listing.
 *
 * SRP Knows Nothing About: The full listing, the listing header, other
 * workflows, or how the entry line is assembled.
 */
export interface AhqWorkflow {
  /** Return this workflow's single line for the workflow listing. */
  getWorkflowListingEntryString(): string;
}
