import type { RunSummary } from '../types/gameTypes';
import type { StorageLike } from './SaveSystem';

const BALANCE_REPORT_KEY = 'everlasting-oblivion-last-balance-report';

export function writeLastRunSummary(summary: RunSummary, storage: StorageLike = localStorage): void {
  storage.setItem(BALANCE_REPORT_KEY, JSON.stringify(summary));
}

export function loadLastRunSummary(storage: StorageLike = localStorage): RunSummary | undefined {
  try {
    const raw = storage.getItem(BALANCE_REPORT_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<RunSummary>;
    if (!parsed.balance || !Array.isArray(parsed.weaponResults)) {
      return undefined;
    }
    parsed.balance.threatSamples ??= [];
    return parsed as RunSummary;
  } catch {
    return undefined;
  }
}
