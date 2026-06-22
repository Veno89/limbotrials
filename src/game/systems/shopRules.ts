import { SHOP_CATALOG, type ShopOfferDefinition } from '../data/shop';
import type { ArtifactId, WeaponId } from '../types/gameTypes';

export interface ShopSelectionContext {
  ownedArtifacts: ReadonlySet<ArtifactId>;
  equippedWeapons: ReadonlySet<WeaponId>;
  weaponCount: number;
  weaponCap: number;
}

export function canAffordBlood(health: number, healthCost: number): boolean {
  return healthCost > 0 && health - healthCost >= 1;
}

export function scheduleNextShopCheck(elapsedMs: number, delayMs: number): number {
  return elapsedMs + Math.max(0, delayMs);
}

export function shouldSpawnShop(randomValue: number, chance: number): boolean {
  return randomValue < chance;
}

export function selectShopOffers(
  context: ShopSelectionContext,
  random: () => number = Math.random,
  count = 3,
): ShopOfferDefinition[] {
  const pool = SHOP_CATALOG.filter((offer) => {
    if (offer.kind === 'artifact') {
      return !context.ownedArtifacts.has(offer.rewardId);
    }
    const weapon = offer.rewardId === 'unlock-sanguine-needle' ? 'sanguine-needle' : undefined;
    return Boolean(
      weapon &&
      context.weaponCount < context.weaponCap &&
      !context.equippedWeapons.has(weapon),
    );
  });
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex]!, pool[index]!];
  }
  return pool.slice(0, count);
}
