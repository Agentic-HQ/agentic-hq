/**
 * Tests ListingFormatter — assembles the full `agentic-hq list` output
 * by reading getter-based data from Workspace / Plugin / AhqWorkflow.
 * Tests use plain object-literal stubs so we observe behaviour through
 * the public string output, not through implementation internals.
 *
 * ANSI codes are deliberately NOT asserted: `src/cli/listing/colors.ts` disables
 * colour when stdout isn't a TTY (which is true under vitest), so the
 * output is plain text. We assert text content, structural layout, and
 * branching behaviour (empty-plugin filtering, same-as-AHQ message).
 */
import { describe, expect, it } from 'vitest';

import { ListingFormatter } from '../../../../src/cli/listing/listing-formatter.js';
import type { AhqWorkflow } from '../../../../src/workflow-discovery/interfaces/ahq-workflow.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import type { Plugin } from '../../../../src/workflow-discovery/plugin/plugin.js';

function stubWorkflow(opts: {
  shortName: string;
  description: string;
  exampleCommandPart: string;
  exampleArgsPart: string;
}): AhqWorkflow {
  return {
    getShortName: () => ({ toString: () => opts.shortName }),
    getDescription: () => ({ toString: () => opts.description }),
    getFullClaudeSkillCommand: () => ({ toString: () => `/plugin:${opts.shortName}` }),
    getExampleCommand: () => ({
      getCommandPart: () => opts.exampleCommandPart,
      getArgsPart: () => opts.exampleArgsPart,
      toString: () => opts.exampleCommandPart + opts.exampleArgsPart,
    }),
  };
}

function stubPlugin(name: string, workflows: AhqWorkflow[]): Plugin {
  return {
    getName: () => name,
    getWorkflows: () => workflows,
    registerWorkflowsWith: () => {},
  };
}

function stubWorkspace(opts: {
  displayName: string;
  root: string;
  plugins: Plugin[];
  isAhq: boolean;
}): Workspace {
  return {
    getDisplayName: () => opts.displayName,
    getPlugins: () => opts.plugins,
    registerWorkflowsWith: () => {},
    getRoot: () => opts.root,
    getTempDir: () => `${opts.root}/.agentic-hq/temp`,
    getDotAgenticHqDir: () => `${opts.root}/.agentic-hq`,
    isAhqPackage: () => opts.isAhq,
  };
}

const REVERSAL_WORKFLOW = stubWorkflow({
  shortName: 'reversal',
  description: 'Reverses a string',
  exampleCommandPart: 'agentic-hq reversal',
  exampleArgsPart: " -- --string-to-reverse='hi'",
});

const MATH_WORKFLOW = stubWorkflow({
  shortName: 'math',
  description: 'Solves math problems',
  exampleCommandPart: 'agentic-hq math',
  exampleArgsPart: ' -- --input-number=11',
});

const NOOP_WORKFLOW = stubWorkflow({
  shortName: 'noop',
  description: 'Does nothing of note',
  exampleCommandPart: 'agentic-hq noop',
  exampleArgsPart: '',
});

describe('ListingFormatter', () => {
  describe('formatWorkflowsListing', () => {
    it('should include the "Available workflows" title in the output', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).toContain('Available workflows');
    });

    it('should render single-line workspace headers in the form "{name}: {path}"', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/path/to/ahq',
        plugins: [],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/path/to/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).toContain('Agentic HQ Package: /path/to/ahq');
    });

    it('should render plugin headings with the "Plugin: " prefix', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('my-plugin', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).toContain('Plugin: my-plugin');
    });

    it('should place each workflow command line directly above its description line', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('demos', [REVERSAL_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);
      const lines = output.split('\n');
      const commandLineIndex = lines.findIndex((l) => l.includes('agentic-hq reversal'));
      expect(commandLineIndex).toBeGreaterThanOrEqual(0);
      expect(lines[commandLineIndex + 1]).toContain('Reverses a string');
    });

    it('should filter out plugins that have no workflows (no empty "Plugin: foo" headings)', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('empty-plugin', []), stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).not.toContain('Plugin: empty-plugin');
      expect(output).toContain('Plugin: demos');
    });

    it('should render the "Same as Agentic HQ Package" message when local IS the AHQ package', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).toContain('Local Workspace:');
      expect(output).toContain(
        'Same as Agentic HQ Package (running from within the AHQ package directory)'
      );
    });

    it('should NOT repeat the local plugins inline when local IS the AHQ package', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [stubPlugin('local-only-plugin', [NOOP_WORKFLOW])],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).not.toContain('local-only-plugin');
    });

    it('should render the full local workspace block (header + plugins) when local differs from AHQ', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [stubPlugin('demos', [MATH_WORKFLOW])],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/some/other/path',
        plugins: [stubPlugin('local-plugin', [NOOP_WORKFLOW])],
        isAhq: false,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output).toContain('Local Workspace: /some/other/path');
      expect(output).toContain('Plugin: local-plugin');
      expect(output).toContain('agentic-hq noop');
      expect(output).not.toContain('Same as Agentic HQ Package');
    });

    it('should start and end with a blank line so output prints with breathing space', () => {
      const ahq = stubWorkspace({
        displayName: 'Agentic HQ Package',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });
      const local = stubWorkspace({
        displayName: 'Local Workspace',
        root: '/ahq',
        plugins: [],
        isAhq: true,
      });

      const output = new ListingFormatter().formatWorkflowsListing(ahq, local);

      expect(output.startsWith('\n')).toBe(true);
      expect(output.endsWith('\n')).toBe(true);
    });
  });
});
