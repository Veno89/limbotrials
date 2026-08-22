import { describe, expect, it, vi } from 'vitest';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';
import { copyRunSummaryJson, formatRunSummaryJson } from '../ui/runJsonExport';

describe('run JSON export', () => {
  it('formats the complete run summary as readable JSON', () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const json = formatRunSummaryJson(summary);

    expect(JSON.parse(json)).toEqual(summary);
    expect(json).toContain('\n  "balance": {');
  });

  it('copies the formatted run summary without requiring an upload', async () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const writeText = vi.fn(async () => undefined);

    await expect(copyRunSummaryJson(summary, { writeText }, undefined)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(formatRunSummaryJson(summary));
  });

  it('reports failure when neither clipboard path is available', async () => {
    const summary = new RunState(createDefaultSave()).summary(false);

    await expect(copyRunSummaryJson(summary, null, undefined)).resolves.toBe(false);
  });
});
