import { describe, expect, it } from 'vitest';
import { RunState } from '../systems/RunState';
import { getAvailableArtifacts } from '../data/artifacts';
import { selectUpgradeChoices, UpgradeSelectionContext } from '../systems/UpgradeSystem';
import type { SaveData, WeaponId } from '../types/gameTypes';

const MOCK_SAVE: SaveData = {
  version: 1,
  selectedCharacter: 'the-penitent',
  unlockedCharacters: ['the-penitent'],
  unlockedArtifactTiers: ['base', 'tier-2'],
  ngPlusEdicts: [],
  hasCompletedGame: true,
  talentProgress: { 'the-penitent': { allocations: {} } },
} as unknown as SaveData;

describe('NG+ System', () => {
  it('RunState calculates soulMultiplierBonus based on edicts', () => {
    const run1 = new RunState(MOCK_SAVE, 'standard', 'the-penitent', true, ['frailty', 'haste']);
    // frailty is 0.25, haste is 0.3
    expect(run1.soulMultiplierBonus).toBe(0.55);

    const run2 = new RunState(MOCK_SAVE, 'standard', 'the-penitent', true, ['scarcity', 'ruin', 'hollow-host']);
    // scarcity 0.25, ruin 0.35, hollow-host 0.4
    expect(run2.soulMultiplierBonus).toBe(1.0);
  });

  it('getAvailableArtifacts includes ng-plus tier only if isNgPlus is true', () => {
    const baseArtifacts = getAvailableArtifacts(MOCK_SAVE, false);
    expect(baseArtifacts.some((a) => a.poolTier === 'ng-plus')).toBe(false);

    const ngPlusArtifacts = getAvailableArtifacts(MOCK_SAVE, true);
    expect(ngPlusArtifacts.some((a) => a.poolTier === 'ng-plus')).toBe(true);
  });

  it('selectUpgradeChoices filters isNgPlus upgrades based on context', () => {
    const baseContext: UpgradeSelectionContext = {
      stacks: new Map(),
      equippedWeapons: new Set<WeaponId>(['gravetide-repeater']),
      weaponLevels: new Map<WeaponId, number>([['gravetide-repeater', 1]]),
      playerLevel: 5,
      isNgPlus: false,
    };
    
    // Test base context
    const baseChoices = selectUpgradeChoices(baseContext, Math.random, 100);
    expect(baseChoices.some((u) => u.isNgPlus)).toBe(false);

    // Test ng+ context
    const ngContext: UpgradeSelectionContext = {
      ...baseContext,
      isNgPlus: true,
    };
    const ngChoices = selectUpgradeChoices(ngContext, Math.random, 100);
    expect(ngChoices.some((u) => u.isNgPlus)).toBe(true);
  });
});
