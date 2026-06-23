import { describe, expect, it } from 'vitest';
import { getAvailableArtifacts } from '../data/artifacts';
import { selectUpgradeChoices } from '../systems/UpgradeSystem';
import {
  canAffordBlood,
  scheduleNextShopCheck,
  selectShopOffers,
  shouldSpawnShop,
} from '../systems/shopRules';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';

describe('shop rules', () => {
  it('requires the player to survive a blood purchase', () => {
    expect(canAffordBlood(31, 30)).toBe(true);
    expect(canAffordBlood(30, 30)).toBe(false);
  });

  it('uses active run time for checks and a configurable chance', () => {
    expect(scheduleNextShopCheck(40000, 70000)).toBe(110000);
    expect(shouldSpawnShop(0.39, 0.4)).toBe(true);
    expect(shouldSpawnShop(0.4, 0.4)).toBe(false);
  });

  it('filters owned rewards and weapons that cannot fit', () => {
    const offers = selectShopOffers({
      ownedArtifacts: new Set(['red-ledger']),
      equippedWeapons: new Set(['bone-scythe']),
      weaponCount: 5,
      weaponCap: 5,
    });
    expect(offers.map((offer) => offer.id)).toEqual(['artifact:heart-of-the-market']);
  });

  it('keeps shop rewards out of normal reward pools', () => {
    const save = createDefaultSave();
    expect(getAvailableArtifacts(save).every((artifact) => artifact.source !== 'shop')).toBe(true);
    const choices = selectUpgradeChoices({
      stacks: new Map(),
      equippedWeapons: new Set(['bone-scythe']),
      weaponLevels: new Map([['bone-scythe', 1]]),
      playerLevel: 1,
    }, () => 0, 100);
    expect(choices.some((choice) => choice.source === 'shop')).toBe(false);
  });

  it('pays blood without allowing a lethal purchase', () => {
    const run = new RunState(createDefaultSave());
    run.resources.health = 31;
    expect(run.resources.spendBlood(30)).toBe(true);
    expect(run.resources.health).toBe(1);
    expect(run.resources.spendBlood(1)).toBe(false);
  });

  it('supports full progression for the shop-exclusive weapon', () => {
    const run = new RunState(createDefaultSave());
    expect(run.upgrades.apply('unlock-sanguine-needle')).toBe(true);
    for (let index = 0; index < 5; index += 1) {
      expect(run.upgrades.apply('level-sanguine-needle')).toBe(true);
    }
    expect(run.upgrades.apply('evolve-sanguine-needle')).toBe(true);
    expect(run.weapons.getState('sanguine-needle').stats.projectileCount).toBe(3);
  });
});
