import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Recursively hash every file under rootDir: relative path → SHA-256 hex digest. */
export function hashTree(rootDir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        const digest = createHash('sha256').update(fs.readFileSync(entryPath)).digest('hex');
        hashes[path.relative(rootDir, entryPath)] = digest;
      }
    }
  };
  walk(rootDir);
  return hashes;
}
