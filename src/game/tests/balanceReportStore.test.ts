import { describe, expect, it } from 'vitest';
import { loadLastRunSummary, writeLastRunSummary } from '../systems/BalanceReportStore';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';
import type { StorageLike } from '../systems/SaveSystem';

class MemoryStorage implements StorageLike {
  value: string | null = null;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
  }
}

describe('balance report storage', () => {
  it('round trips the latest run summary', () => {
    const storage = new MemoryStorage();
    const summary = new RunState(createDefaultSave()).summary(false);
    writeLastRunSummary(summary, storage);
    expect(loadLastRunSummary(storage)?.balance.presetId).toBe('standard');
  });

  it('rejects malformed stored reports', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ elapsedMs: 100 });
    expect(loadLastRunSummary(storage)).toBeUndefined();
  });
});
