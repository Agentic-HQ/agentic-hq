import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

import { JsonFileImpl } from './json-file-impl.js';

/**
 * JsonFileWorkflowMetadata — Concrete WorkflowMetadata backed by
 * JsonFileImpl; inherits `get()` unchanged and gains the domain-named
 * interface.
 *
 * SRP Does: Bind JsonFileImpl's `get(fieldId)` behavior to the
 * WorkflowMetadata domain interface, adding no new behavior.
 *
 * SRP Knows About: That JsonFileImpl's string-field-lookup behavior
 * is the right implementation for WorkflowMetadata.
 *
 * SRP Knows Nothing About: Which file was loaded, which metadata
 * fields exist, or how the fields are used.
 */
export class JsonFileWorkflowMetadata extends JsonFileImpl implements WorkflowMetadata {}
