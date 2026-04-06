import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { test } from 'vitest';

export const tmpdirTest = test.extend<{ tmpdir: string }>({
  tmpdir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-'));
    await use(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  },
});
