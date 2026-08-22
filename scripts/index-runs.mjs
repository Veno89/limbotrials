import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rebuildRunIndexes } from './run-data-store.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let gitCommit = 'unknown';
try {
  gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).trim();
} catch {
  // Indexing still works when the folder is copied outside a Git repository.
}

const count = await rebuildRunIndexes({ rootDir: workspaceRoot, gitCommit });
console.log(`Indexed ${count} run${count === 1 ? '' : 's'} in playtest-data/.`);
