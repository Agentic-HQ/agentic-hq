import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Recursively hash every file under rootDir: POSIX-relative path → SHA-256
 * hex digest. Keys are forward-slashed on every OS, so path expectations can
 * be written once and a Windows-built tree's map is directly comparable with
 * a Mac/Linux one (AHQ-211). */
export function hashTree(rootDir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        const digest = createHash('sha256').update(fs.readFileSync(entryPath)).digest('hex');
        const posixRelativePath = path.relative(rootDir, entryPath).split(path.sep).join('/');
        hashes[posixRelativePath] = digest;
      }
    }
  };
  walk(rootDir);
  return hashes;
}
