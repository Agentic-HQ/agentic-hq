/**
 * PtyCLIWrapper unit tests (AHQ-211 Phase 4 item 3 — win32 PTY tuning).
 *
 * node-pty is mocked, so these tests observe the wrapper's process-level
 * behaviour without spawning anything:
 * - the pty is killed/disposed on normal exit (on Windows the ConPTY agent
 *   otherwise keeps the Node process alive after the child has exited)
 * - on win32 + ConPTY the disposal must NOT go through node-pty's kill():
 *   kill() forks a conpty_console_list_agent helper that crashes noisily
 *   (AttachConsole failed) when the child has already exited — the wrapper
 *   performs kill()'s remaining cleanup on the agent internals instead
 *   (AHQ-211 Phase 5 item 6)
 * - SIGINT cleanup handlers are registered for the run and removed after
 * - the SIGTERM handler is POSIX-only: Windows never delivers SIGTERM to a
 *   handler (process.kill(pid, 'SIGTERM') terminates unconditionally there,
 *   which Phase 5's kill script relies on), so registering one is dead code
 *
 * The real spawn/passthrough behaviour is covered by the fake-claude PTY
 * tests in tests/unit/claude-code-tool/.
 */
import { spawn as spawnPty } from 'node-pty';
import { describe, expect, it, vi } from 'vitest';

import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import { PtyCLIWrapper } from '../../../../src/io/terminal/pty-cli-wrapper.js';

// Hoisted by Vitest's transform above every import, so the mock is in place
// before node-pty is loaded
vi.mock('node-pty', () => ({ spawn: vi.fn() }));

/** Mirrors the node-pty WindowsPtyAgent internals the wrapper's win32
 *  quiet-disposal path touches (node-pty is exact-pinned, see package.json). */
interface FakeConptyAgent {
  _useConpty: boolean;
  _useConptyDll: boolean;
  _inSocket: { readable: boolean };
  _outSocket: { readable: boolean };
  _ptyNative: { kill: ReturnType<typeof vi.fn> };
  _pty: number;
  _conoutSocketWorker: { dispose: ReturnType<typeof vi.fn> };
}

function createFakeConptyAgent(overrides: Partial<FakeConptyAgent> = {}): FakeConptyAgent {
  return {
    _useConpty: true,
    _useConptyDll: false,
    _inSocket: { readable: true },
    _outSocket: { readable: true },
    _ptyNative: { kill: vi.fn() },
    _pty: 7,
    _conoutSocketWorker: { dispose: vi.fn() },
    ...overrides,
  };
}

interface FakePty {
  onData: ReturnType<typeof vi.fn>;
  onExit: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  triggerExit: () => void;
  _agent?: FakeConptyAgent;
}

function createFakePty(agent?: FakeConptyAgent): FakePty {
  let exitCallback: (event: { exitCode: number }) => void = () => {
    throw new Error('pty exit triggered before onExit was registered');
  };
  return {
    onData: vi.fn(),
    onExit: vi.fn((callback: (event: { exitCode: number }) => void) => {
      exitCallback = callback;
    }),
    kill: vi.fn(),
    resize: vi.fn(),
    write: vi.fn(),
    triggerExit: () => exitCallback({ exitCode: 0 }),
    ...(agent === undefined ? {} : { _agent: agent }),
  };
}

const CLI_COMMAND: CLICommand = {
  executable: 'fake-executable',
  args: ['--fake-arg'],
  logDebug: vi.fn(),
};

/** Start a run against a fresh fake pty; registrations all happen synchronously. */
function startRun(agent?: FakeConptyAgent): { fakePty: FakePty; runPromise: Promise<void> } {
  const fakePty = createFakePty(agent);
  vi.mocked(spawnPty).mockReturnValue(fakePty as never);
  const runPromise = new PtyCLIWrapper().run(CLI_COMMAND, '/fake/cwd');
  return { fakePty, runPromise };
}

describe('PtyCLIWrapper', () => {
  it('should kill the pty on normal exit so ConPTY cannot keep the process alive', async () => {
    const { fakePty, runPromise } = startRun();
    expect(fakePty.kill).not.toHaveBeenCalled();

    fakePty.triggerExit();
    await runPromise;

    expect(fakePty.kill).toHaveBeenCalledTimes(1);
  });

  it('should register a SIGINT cleanup handler for the run and remove it after exit', async () => {
    const sigintListenersBefore = process.listenerCount('SIGINT');

    const { fakePty, runPromise } = startRun();
    expect(process.listenerCount('SIGINT')).toBe(sigintListenersBefore + 1);

    fakePty.triggerExit();
    await runPromise;

    expect(process.listenerCount('SIGINT')).toBe(sigintListenersBefore);
  });

  it.runIf(process.platform === 'win32')(
    'should NOT register a SIGTERM handler on win32 — Windows never delivers one',
    async () => {
      const sigtermListenersBefore = process.listenerCount('SIGTERM');

      const { fakePty, runPromise } = startRun();
      expect(process.listenerCount('SIGTERM')).toBe(sigtermListenersBefore);

      fakePty.triggerExit();
      await runPromise;

      expect(process.listenerCount('SIGTERM')).toBe(sigtermListenersBefore);
    }
  );

  it.skipIf(process.platform === 'win32')(
    'should register a SIGTERM cleanup handler on POSIX and remove it after exit',
    async () => {
      const sigtermListenersBefore = process.listenerCount('SIGTERM');

      const { fakePty, runPromise } = startRun();
      expect(process.listenerCount('SIGTERM')).toBe(sigtermListenersBefore + 1);

      fakePty.triggerExit();
      await runPromise;

      expect(process.listenerCount('SIGTERM')).toBe(sigtermListenersBefore);
    }
  );

  // node-pty's kill() on a ConPTY pty forks a conpty_console_list_agent
  // helper to sweep the child's console processes; on an ALREADY-EXITED
  // child the console is gone, so the helper crashes with a noisy
  // "AttachConsole failed" stderr trace (observed at the end of the
  // otherwise-clean 2026-08-27 Windows demo run). On exit the wrapper must
  // therefore do kill()'s remaining cleanup directly on the agent internals
  // — release the native handle and dispose the conout worker, the parts
  // that end the ConPTY keep-alive — WITHOUT calling kill() itself.
  describe('win32 quiet disposal of an exited ConPTY pty (AHQ-211 Phase 5)', () => {
    it.runIf(process.platform === 'win32')(
      'should dispose ConPTY agent internals on exit instead of calling kill()',
      async () => {
        const agent = createFakeConptyAgent();
        const { fakePty, runPromise } = startRun(agent);

        fakePty.triggerExit();
        await runPromise;

        expect(fakePty.kill).not.toHaveBeenCalled();
        expect(agent._ptyNative.kill).toHaveBeenCalledWith(agent._pty, agent._useConptyDll);
        expect(agent._conoutSocketWorker.dispose).toHaveBeenCalledTimes(1);
        expect(agent._inSocket.readable).toBe(false);
        expect(agent._outSocket.readable).toBe(false);
      }
    );

    it.runIf(process.platform === 'win32')(
      'should fall back to plain kill() on the legacy winpty backend',
      async () => {
        const agent = createFakeConptyAgent({ _useConpty: false });
        const { fakePty, runPromise } = startRun(agent);

        fakePty.triggerExit();
        await runPromise;

        expect(fakePty.kill).toHaveBeenCalledTimes(1);
        expect(agent._ptyNative.kill).not.toHaveBeenCalled();
        expect(agent._conoutSocketWorker.dispose).not.toHaveBeenCalled();
      }
    );
  });
});
