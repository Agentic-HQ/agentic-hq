import type { JsonFile } from './json-file.js';

/**
 * WorkflowMetadata — Domain-named metadata for a workflow, read as
 * string fields (file-format agnostic).
 *
 * SRP Does: Provide a domain-named contract for reading workflow
 * metadata fields (inherits `get(fieldId)` from JsonFile).
 *
 * SRP Knows About: That workflow metadata behaves like a JsonFile
 * (string-valued field lookup by id).
 *
 * SRP Knows Nothing About: Which file format backs the metadata,
 * which fields exist, or how they're used.
 */
export interface WorkflowMetadata extends JsonFile {}
