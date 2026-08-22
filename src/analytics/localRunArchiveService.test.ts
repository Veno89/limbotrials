import { describe, expect, it, vi } from 'vitest';
import { createDefaultSave } from '../game/systems/SaveSystem';
import { RunState } from '../game/systems/RunState';
import { archiveRunLocally } from './localRunArchiveService';

describe('local run archive service', () => {
  it('sends the complete run to the development recorder', async () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      filePath: 'playtest-data/runs/example.json',
      indexCount: 4,
    }), { status: 201 }));

    const result = await archiveRunLocally(summary, fetcher, '11111111-1111-4111-8111-111111111111');

    expect(result).toMatchObject({
      status: 'saved',
      filePath: 'playtest-data/runs/example.json',
      indexCount: 4,
    });
    expect(fetcher).toHaveBeenCalledWith('/__dev/playtest-runs', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        formatVersion: 1,
        runId: '11111111-1111-4111-8111-111111111111',
        summary,
      }),
    }));
  });

  it('points to the download fallback when automatic saving is unavailable', async () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'Recorder stopped.' }), { status: 500 }));

    await expect(archiveRunLocally(summary, fetcher, '22222222-2222-4222-8222-222222222222')).resolves.toEqual({
      status: 'failed',
      message: 'Recorder stopped.',
    });
  });
});
