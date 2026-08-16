/**
 * AhqFile — A file on disk within the AHQ package whose content
 * can be read as a string.
 *
 * SRP Does: Read the file's content as a string.
 *
 * SRP Knows About: That each file has readable string content.
 *
 * SRP Knows Nothing About: The file's path, encoding details, or
 * what format the content is in.
 */
export interface AhqFile {
  /** Read the file content as a string. */
  readContent(): string;
}
