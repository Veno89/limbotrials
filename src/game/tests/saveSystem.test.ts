import { describe, expect, it } from 'vitest';
import {
  createDefaultSave,
  loadSave,
  recordRunResult,
  writeSave,
  type StorageLike,
} from '../systems/SaveSystem';
import { curseSnapshot } from '../data/curse';
import { TALENT_POINT_THRESHOLDS } from '../data/talentTree';
import { availableTalentPoints, earnedTalentPoints } from '../systems/TalentTreeSystem';

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
    save.talentProgress.haunted.legacySouls = 120;
    writeSave(save, storage);
    expect(loadSave(storage).totalSouls).toBe(50);
    expect(loadSave(storage).talentProgress.haunted.legacySouls).toBe(120);
  });

  it('merges missing fields and wipes legacy souls during old-save migration', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({
      version: 6,
      totalSouls: 12,
      spentSouls: 5,
      totalSoulsEarned: 999,
      metaLevels: { 'vital-remnant': 5 },
    });
    const save = loadSave(storage);
    expect(save.totalSouls).toBe(0);
    expect(save.spentSouls).toBe(0);
    expect(save.totalSoulsEarned).toBe(0);
    expect(save.metaLevels['vital-remnant']).toBe(0);
    expect(save.metaLevels['fateful-thread']).toBe(0);
    expect(save.talentProgress.haunted.legacySouls).toBe(0);
    expect(save.talentProgress.haunted.allocations).toEqual({});
    expect(save.settings.masterVolume).toBe(0.75);
    expect(save.settings.musicVolume).toBe(0.35);
    expect(save.selectedCharacter).toBe('haunted');
    expect(save.unlockedCharacters).toEqual(['haunted']);
    expect(save.unlockedArtifactTiers).toEqual(['base']);
    expect(save.journal.weapons).toEqual(['bone-scythe']);
    expect(save.journal.artifacts).toEqual([]);
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
      journal: {
        weapons: ['fake-weapon'],
        enemies: ['lost-soul', 'limbo-warden'],
        bosses: ['limbo-warden', 'lost-soul'],
      },
    });
    const save = loadSave(storage);
    expect(save.selectedCharacter).toBe('haunted');
    expect(save.unlockedCharacters).toEqual(['haunted']);
    expect(save.unlockedArtifactTiers).toEqual(['base']);
    expect(save.journal.weapons).toEqual(['bone-scythe']);
    expect(save.journal.enemies).toEqual(['lost-soul']);
    expect(save.journal.bosses).toEqual(['limbo-warden']);
  });

  it('preserves current-version talent progress', () => {
    const storage = new MemoryStorage();
    const save = createDefaultSave();
    save.talentProgress.haunted.legacySouls = TALENT_POINT_THRESHOLDS[3]!;
    save.talentProgress.haunted.allocations['haunted-reaper-root'] = 2;
    writeSave(save, storage);

    const loaded = loadSave(storage);
    expect(earnedTalentPoints(loaded, 'haunted')).toBe(4);
    expect(availableTalentPoints(loaded, 'haunted')).toBe(2);
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
        cursedRewards: [],
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
    expect(result.save.talentProgress.haunted.legacySouls).toBe(120);
    expect(result.save.talentProgress['the-penitent'].legacySouls).toBe(0);
    expect(result.newlyUnlockedCharacters).toEqual(['the-penitent', 'ashwalker']);
    expect(result.newlyUnlockedArtifactTiers).toEqual(['tier-2', 'tier-3']);
  });
});
