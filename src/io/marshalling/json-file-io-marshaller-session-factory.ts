/**
 * JsonFileIOMarshallerSessionFactory — Creates JsonFileIOMarshallerSession instances.
 *
 * SRP Does: Create a new JsonFileIOMarshallerSession per execution,
 * scoped to the workspace's temp directory.
 *
 * SRP Knows About: Where the temp directory lives (via Workspace).
 *
 * SRP Knows Nothing About: How the session reads/writes files internally.
 */
import type { IOMarshallerSessionFactory } from '../../interfaces/io-marshaller-session-factory.js';
import type { IOMarshallerSession } from '../../interfaces/io-marshaller-session.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';

import { JsonFileIOMarshallerSession } from './json-file-io-marshaller-session.js';

export class JsonFileIOMarshallerSessionFactory implements IOMarshallerSessionFactory {
  private readonly tempDir: string;

  constructor(workspace: Workspace) {
    this.tempDir = workspace.getTempDir();
  }

  /** Create a new session with its own unique temp subdirectory. */
  create(): IOMarshallerSession {
    return new JsonFileIOMarshallerSession(this.tempDir);
  }
}
