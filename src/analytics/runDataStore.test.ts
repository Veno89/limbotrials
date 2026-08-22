import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createDefaultSave } from '../game/systems/SaveSystem';
import { RunState } from '../game/systems/RunState';
import { saveRunData } from '../../scripts/run-data-store.mjs';

let testDirectory: string | undefined;

afterEach(async () => {
  if (!testDirectory) {
    return;
  }
  const resolvedTarget = resolve(testDirectory);
  if (!resolvedTarget.startsWith(resolve(tmpdir()))) {
    throw new Error(`Refusing to remove unexpected test directory: ${resolvedTarget}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
  testDirectory = undefined;
});

describe('run data store', () => {
  it('saves one readable record and rebuilds both AI indexes', async () => {
    testDirectory = await mkdtemp(join(tmpdir(), 'limbo-run-data-'));
    const summary = new RunState(createDefaultSave()).summary(false);
    const payload = {
      formatVersion: 1,
      runId: '33333333-3333-4333-8333-333333333333',
      summary,
    };
    const options = {
      rootDir: testDirectory,
      gitCommit: 'abc1234',
      now: new Date('2026-08-22T19:30:12.345Z'),
    };

    const first = await saveRunData(payload, options);
    const second = await saveRunData(payload, options);
    const saved = JSON.parse(await readFile(join(testDirectory, first.filePath), 'utf8'));
    const index = await readFile(join(testDirectory, 'playtest-data', 'index.csv'), 'utf8');
    const jsonl = await readFile(join(testDirectory, 'playtest-data', 'runs.jsonl'), 'utf8');
    const serializedSummary = JSON.parse(JSON.stringify(summary));

    expect(first).toMatchObject({ duplicate: false, indexCount: 1 });
    expect(second).toMatchObject({ duplicate: true, indexCount: 1, filePath: first.filePath });
    expect(saved).toMatchObject({
      formatVersion: 1,
      runId: payload.runId,
      savedAt: '2026-08-22T19:30:12.345Z',
      gitCommit: 'abc1234',
      summary: serializedSummary,
    });
    expect(index).toContain('run_id,saved_at,git_commit,file,character,result');
    expect(index).toContain('33333333-3333-4333-8333-333333333333');
    expect(JSON.parse(jsonl.trim())).toMatchObject({ runId: payload.runId, summary: serializedSummary });
  });
});
