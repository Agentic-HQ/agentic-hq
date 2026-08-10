/**
 * AhqPackageRoot — where the agentic-hq package lives (AHQ-197).
 *
 * Dev: the repo checkout. Production: the installed package root. Flows
 * visibly from the entry points through the whole chain — never sourced from
 * environment variables.
 */

export interface AhqPackageRoot {
  getPath(): string;
}
