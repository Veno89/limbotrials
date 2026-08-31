import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const rootDir = resolve(process.cwd());
const distDir = join(rootDir, 'dist');
const devToolsExplicitlyEnabled = process.env.VITE_ENABLE_DEV_TOOLS === 'true';

const forbiddenMarkers = [
  'LOCAL DEV MODE',
  'DEV SERVER ONLY. SETTINGS LIVE IN LOCALSTORAGE, NOT GIT.',
  'LIMBO CONTENT LAB',
  'ContentLabScene',
];

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(fullPath));
    } else if (entry.isFile() && extname(entry.name) === '.js') {
      files.push(fullPath);
    }
  }
  return files;
}

if (devToolsExplicitlyEnabled) {
  console.log('Production dev-tool bundle check skipped: VITE_ENABLE_DEV_TOOLS=true.');
} else {
  const violations = [];
  for (const filePath of await collectJavaScriptFiles(distDir)) {
    const source = await readFile(filePath, 'utf8');
    for (const marker of forbiddenMarkers) {
      if (source.includes(marker)) {
        violations.push(`${relative(rootDir, filePath)} contains ${JSON.stringify(marker)}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Development tooling leaked into the production bundle:\n${violations.join('\n')}`,
    );
  }

  console.log('Production bundle contains no development-tool markers.');
}
