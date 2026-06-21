import type { RunSummary } from '../types/gameTypes';
import type { StorageLike } from './SaveSystem';
import { curseSnapshot } from '../data/curse';

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
    parsed.balance.cursedRewards ??= [];
    parsed.cursedArtifacts ??= [];
    parsed.upgradeIds ??= [];
    parsed.curse ??= curseSnapshot(0, 0, new Set(['unmarked']));
    return parsed as RunSummary;
  } catch {
    return undefined;
  }
}
