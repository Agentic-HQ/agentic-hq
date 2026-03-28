/**
 * IOMarshallerSessionFactory — Creates a fresh IOMarshallerSession per execution.
 *
 * Each Tool.execute() call needs its own session (with a unique marshalling ID),
 * so MarshalledCLITool depends on this factory rather than a single session instance.
 */
import type { IOMarshallerSession } from './io-marshaller-session.js';

export interface IOMarshallerSessionFactory {
  create(): IOMarshallerSession;
}
