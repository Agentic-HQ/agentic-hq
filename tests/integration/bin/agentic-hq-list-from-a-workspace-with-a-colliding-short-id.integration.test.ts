/**
 * Integration Test: `agentic-hq list` from a workspace whose workflow shortId collides
 * with a shipped one (AHQ-205)
 *
 * Every discovered workflow's `shortId` becomes a Commander subcommand — from the AHQ
 * package AND from the current working directory. Before AHQ-205, a local workflow that
 * reused a shipped `shortId` (here `add-feature`) made Commander throw
 * `cannot add command 'add-feature' as already have command 'add-feature'` inside program
 * construction, so `list`, `--help`, everything died with exit 1.
 *
 * The fix: the first registration of a short name wins (local workspace registers before
 * the AHQ package), later ones are not registered, and `agentic-hq list` marks each loser
 * with a `DISABLED — shortId '<x>' is already used by existing workflow` line above it.
 *
 * This test runs `list` through the dev bin wrapper (tsx over `src/`, no `release/`
 * build) from a temp workspace containing exactly one colliding local workflow, and
 * asserts the whole visible contract: exit 0, and exactly one DISABLED line — in the
 * package block (before the `Local Workspace:` header), naming `add-feature`. Needs no
 * Claude.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-205
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const TEST_TIMEOUT_MS = 60_000; // plain node + tsx subprocess, no Claude

const repoRoot = process.cwd();
const devBinPath = path.join(repoRoot, 'bin', 'agentic-hq.cjs');

// Under os.tmpdir(), never a hardcoded /tmp: /tmp does not exist on Windows,
// where the literal path silently created C:\tmp instead (AHQ-211)
const TEMP_WORKSPACES_BASE = path.join(os.tmpdir(), 'agentic-hq-test-workspaces');
const COLLIDING_SHORT_ID = 'add-feature'; // shipped by the repo's own agentic-hq-demos-plugin
const LOCAL_PLUGIN_NAME = 'local-plugin';

const TITLE_LINE = 'Available workflows';
const LOCAL_WORKSPACE_HEADER_PREFIX = 'Local Workspace:';
const DISABLED_MARKER = 'DISABLED';

let collidingWorkspace: string;

/** Create `<workspace>/.agentic-hq/plugins/local-plugin/skills/add-feature/ahq-workflow.json`. */
function createWorkspaceWithCollidingWorkflow(): string {
  fs.mkdirSync(TEMP_WORKSPACES_BASE, { recursive: true });
  const workspace = fs.mkdtempSync(path.join(TEMP_WORKSPACES_BASE, 'ahq-205-colliding-'));
  const skillDir = path.join(
    workspace,
    '.agentic-hq',
    'plugins',
    LOCAL_PLUGIN_NAME,
    'skills',
    COLLIDING_SHORT_ID
  );
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'ahq-workflow.json'),
    JSON.stringify({
      pluginId: LOCAL_PLUGIN_NAME,
      skillId: COLLIDING_SHORT_ID,
      shortId: COLLIDING_SHORT_ID,
      description: 'A LOCAL workflow that happens to share a shortId with a shipped one',
      exampleParameters: '-- --ticket-id=LOCAL-1',
      version: '1.0.0',
      author: { name: 'Local User' },
    }),
    'utf-8'
  );
  return workspace;
}

beforeAll(() => {
  collidingWorkspace = createWorkspaceWithCollidingWorkflow();
});

afterAll(() => {
  fs.rmSync(collidingWorkspace, { recursive: true, force: true });
});

describe('agentic-hq list from a workspace with a colliding shortId (AHQ-205)', () => {
  it(
    'should exit 0 and flag exactly one DISABLED entry — the package copy, in the package block',
    () => {
      const result = spawnSync(process.execPath, [devBinPath, 'list'], {
        encoding: 'utf-8',
        cwd: collidingWorkspace,
      });

      expect(result.stderr).not.toContain('cannot add command');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(TITLE_LINE);

      const lines = result.stdout.split('\n');
      const disabledLineIndexes = lines
        .map((line, index) => (line.includes(DISABLED_MARKER) ? index : -1))
        .filter((index) => index >= 0);
      const localHeaderIndex = lines.findIndex((line) =>
        line.includes(LOCAL_WORKSPACE_HEADER_PREFIX)
      );

      expect(localHeaderIndex).toBeGreaterThan(0);
      expect(disabledLineIndexes).toHaveLength(1);
      const disabledLineIndex = disabledLineIndexes[0]!;
      expect(lines[disabledLineIndex]).toContain(`'${COLLIDING_SHORT_ID}'`);
      // The flag sits in the package block (rendered first), directly above the package's
      // own `agentic-hq add-feature` command line — never in the local block.
      expect(disabledLineIndex).toBeLessThan(localHeaderIndex);
      expect(lines[disabledLineIndex + 1]).toContain(`agentic-hq ${COLLIDING_SHORT_ID}`);
    },
    TEST_TIMEOUT_MS
  );
});
