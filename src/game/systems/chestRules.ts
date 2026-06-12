import { BALANCE } from '../config/balanceConfig';

export function canSpawnChest(activeCount: number): boolean {
  return activeCount < BALANCE.maxActiveChests;
}

export function shouldDespawnChest(time: number, expiresAt: number): boolean {
  return time >= expiresAt;
}

export function scheduleNextChestSpawn(elapsedMs: number, delayMs: number): number {
  return elapsedMs + delayMs;
}
