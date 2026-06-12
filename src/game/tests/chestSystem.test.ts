import { describe, expect, it } from 'vitest';
import { BALANCE } from '../config/balanceConfig';
import { canSpawnChest, scheduleNextChestSpawn, shouldDespawnChest } from '../systems/chestRules';

describe('chest rules', () => {
  it('respects the active chest cap', () => {
    expect(canSpawnChest(BALANCE.maxActiveChests - 1)).toBe(true);
    expect(canSpawnChest(BALANCE.maxActiveChests)).toBe(false);
  });

  it('despawns at the configured expiry time', () => {
    expect(shouldDespawnChest(999, 1000)).toBe(false);
    expect(shouldDespawnChest(1000, 1000)).toBe(true);
  });

  it('schedules spawns from active elapsed time rather than a scene clock', () => {
    expect(scheduleNextChestSpawn(0, BALANCE.firstChestSpawnDelayMs.min)).toBe(25000);
    expect(scheduleNextChestSpawn(42000, BALANCE.chestSpawnDelayMs.min)).toBe(107000);
  });
});
