import { describe, expect, it } from 'vitest';
import {
  availableSouls,
  createDefaultSave,
  loadSave,
  purchaseMetaUpgrade,
  recordRunResult,
  writeSave,
  type StorageLike,
} from '../systems/SaveSystem';
import { curseSnapshot } from '../data/curse';

class MemoryStorage implements StorageLike {
  value: string | null = null;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
  }
}

describe('save system', () => {
  it('round trips save data', () => {
    const storage = new MemoryStorage();
    const save = createDefaultSave();
    save.totalSouls = 50;
    writeSave(save, storage);
    expect(loadSave(storage).totalSouls).toBe(50);
  });

  it('merges missing fields with current defaults', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ version: 0, totalSouls: 12 });
    const save = loadSave(storage);
    expect(save.totalSouls).toBe(12);
    expect(save.metaLevels['vital-remnant']).toBe(0);
    expect(save.metaLevels['fateful-thread']).toBe(0);
    expect(save.settings.masterVolume).toBe(0.75);
    expect(save.settings.musicVolume).toBe(0.35);
    expect(save.selectedCharacter).toBe('haunted');
    expect(save.unlockedCharacters).toEqual(['haunted']);
    expect(save.unlockedArtifactTiers).toEqual(['base']);
    expect(save.characterStats.ashwalker.runs).toBe(0);
  });

  it('preserves old victory and kill milestones during migration', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ version: 3, highestBossDefeated: 1, totalKills: 600 });
    const save = loadSave(storage);
    expect(save.totalWardenKills).toBe(1);
    expect(save.unlockedCharacters).toContain('ashwalker');
    expect(save.unlockedArtifactTiers).toEqual(['base', 'tier-2', 'tier-3']);
  });

  it('sanitizes invalid content IDs from stored JSON', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({
      selectedCharacter: 'unknown',
      unlockedCharacters: ['unknown'],
      unlockedArtifactTiers: ['not-a-tier'],
    });
    const save = loadSave(storage);
    expect(save.selectedCharacter).toBe('haunted');
    expect(save.unlockedCharacters).toEqual(['haunted']);
    expect(save.unlockedArtifactTiers).toEqual(['base']);
  });

  it('spends available souls once', () => {
    const save = createDefaultSave();
    save.totalSouls = 30;
    expect(purchaseMetaUpgrade(save, 'vital-remnant', 25, 5)).toBe(true);
    expect(availableSouls(save)).toBe(5);
    expect(purchaseMetaUpgrade(save, 'vital-remnant', 25, 5)).toBe(false);
  });

  it('records run progression and returns newly unlocked content', () => {
    const save = createDefaultSave();
    save.runsSurvivedTenMinutes = 2;
    const summary = {
      victory: true,
      elapsedMs: 15 * 60 * 1000,
      kills: 600,
      souls: 120,
      level: 20,
      characterId: 'haunted' as const,
      artifacts: [],
      cursedArtifacts: [],
      upgradeIds: [],
      curse: curseSnapshot(0, 0, new Set(['unmarked'])),
      newlyUnlockedCharacters: [],
      newlyUnlockedArtifactTiers: [],
      weaponResults: [],
      balance: {
        presetId: 'standard' as const,
        measurementDurationMs: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalHealing: 0,
        dashes: 0,
        perfectDodges: 0,
        rerolls: 0,
        skips: 0,
        shrineUses: 0,
        weaponResults: [],
        incomingDamage: [],
        enemyResults: [],
        upgradeOffers: [],
        upgradeChoices: [],
        powerupsSpawned: { 'mending-soul': 0, 'soul-vacuum': 0, 'grave-frenzy': 0 },
        powerupsCollected: { 'mending-soul': 0, 'soul-vacuum': 0, 'grave-frenzy': 0 },
        threatSamples: [],
        timeline: [],
        minutes: [],
      },
    };

    const result = recordRunResult(save, summary);
    expect(result.save.totalRuns).toBe(1);
    expect(result.save.totalWardenKills).toBe(1);
    expect(result.save.characterStats.haunted.victories).toBe(1);
    expect(result.newlyUnlockedCharacters).toEqual(['the-penitent', 'ashwalker']);
    expect(result.newlyUnlockedArtifactTiers).toEqual(['tier-2', 'tier-3']);
  });
});
