import { execFileSync } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { MAX_LOCAL_RUN_BYTES, saveRunData } from './scripts/run-data-store.mjs';

function localRunRecorder(): Plugin {
  return {
    name: 'limbo-local-run-recorder',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/playtest-runs', (request, response) => {
        void handleRunArchiveRequest(request, response);
      });
    },
  };
}

async function handleRunArchiveRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (process.env.VITE_DISABLE_RUN_ARCHIVE === 'true') {
    sendJson(response, 404, { error: 'Local run recording is disabled.' });
    return;
  }
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = JSON.parse(await readRequestBody(request));
    const result = await saveRunData(payload, {
      rootDir: process.cwd(),
      gitCommit: currentGitCommit(),
    });
    sendJson(response, result.duplicate ? 200 : 201, result);
  } catch (error) {
    const message = error instanceof Error && error.message === 'Invalid run data.'
      ? error.message
      : 'Could not save the local run.';
    sendJson(response, message === 'Invalid run data.' ? 400 : 500, { error: message });
  }
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_LOCAL_RUN_BYTES) {
      throw new Error('Run data is too large.');
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function currentGitCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default defineConfig({
  publicDir: false,
  plugins: [tailwindcss(), localRunRecorder()],
  build: {
    target: 'es2022',
  },
});
