import { describe, expect, it } from 'vitest';
import { curseSnapshot } from '../data/curse';
import {
  createDefaultJournalDiscovery,
  discoverEnemyJournalEntry,
  discoverFromRunSummary,
  discoverJournalEntry,
  markJournalCategorySeen,
  sanitizeJournalDiscovery,
  unseenJournalCount,
} from '../systems/JournalDiscoverySystem';
import { createDefaultSave } from '../systems/SaveSystem';

describe('journal discovery system', () => {
  it('starts with the default starter weapon known and hides everything else', () => {
    expect(createDefaultJournalDiscovery()).toMatchObject({
      weapons: ['bone-scythe'],
      evolutions: [],
      artifacts: [],
      enemies: [],
      bosses: [],
      buffs: [],
      debuffs: [],
      seen: {
        weapons: ['bone-scythe'],
      },
    });
  });

  it('sanitizes invalid stored content ids', () => {
    expect(
      sanitizeJournalDiscovery({
        weapons: ['bone-scythe', 'fake-weapon'],
        artifacts: ['pendant-of-vigor', 'bogus'],
        enemies: ['lost-soul', 'limbo-warden'],
        bosses: ['limbo-warden', 'lost-soul'],
        buffs: ['grave-frenzy', 'fake-buff'],
        debuffs: ['poison', 'frostbite'],
      }),
    ).toMatchObject({
      weapons: ['bone-scythe'],
      artifacts: ['pendant-of-vigor'],
      enemies: ['lost-soul'],
      bosses: ['limbo-warden'],
      buffs: ['grave-frenzy'],
      debuffs: ['poison'],
    });
  });

  it('records discoveries once and routes bosses to the boss journal', () => {
    const save = createDefaultSave();

    expect(discoverJournalEntry(save, 'weapons', 'poison-flask')).toBe(true);
    expect(discoverJournalEntry(save, 'weapons', 'poison-flask')).toBe(false);
    expect(discoverEnemyJournalEntry(save, 'limbo-warden')).toBe(true);

    expect(save.journal.weapons).toContain('poison-flask');
    expect(save.journal.bosses).toEqual(['limbo-warden']);
    expect(save.journal.enemies).not.toContain('limbo-warden');
  });

  it('tracks unseen discoveries by category and clears only the viewed category', () => {
    const save = createDefaultSave();
    expect(unseenJournalCount(save)).toBe(0);

    discoverJournalEntry(save, 'weapons', 'poison-flask');
    discoverEnemyJournalEntry(save, 'lost-soul');
    expect(unseenJournalCount(save)).toBe(2);
    expect(unseenJournalCount(save, 'weapons')).toBe(1);

    expect(markJournalCategorySeen(save, 'weapons')).toBe(true);
    expect(unseenJournalCount(save, 'weapons')).toBe(0);
    expect(unseenJournalCount(save, 'enemies')).toBe(1);
    expect(unseenJournalCount(save)).toBe(1);
    expect(markJournalCategorySeen(save, 'weapons')).toBe(false);
  });

  it('can infer discoveries from completed run summaries', () => {
    const save = createDefaultSave();
    discoverFromRunSummary(save, {
      victory: false,
      elapsedMs: 120000,
      kills: 10,
      souls: 12,
      level: 5,
      characterId: 'haunted',
      artifacts: ['pendant-of-vigor'],
      cursedArtifacts: [],
      upgradeIds: ['unlock-poison-flask', 'evolve-bone-scythe'],
      curse: curseSnapshot(0, 0, new Set(['unmarked'])),
      newlyUnlockedCharacters: [],
      newlyUnlockedArtifactTiers: [],
      weaponResults: [{ id: 'poison-flask', damage: 100, kills: 2, hits: 4, criticalHits: 0, bossDamage: 0, dps: 50 }],
      balance: {
        presetId: 'standard',
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
        enemyResults: [{ id: 'lost-soul', spawned: 4, killed: 4, averageLifetimeMs: 1000 }],
        upgradeOffers: [],
        upgradeChoices: [],
        cursedRewards: [],
        powerupsSpawned: { 'mending-soul': 0, 'soul-vacuum': 0, 'grave-frenzy': 0 },
        powerupsCollected: { 'mending-soul': 0, 'soul-vacuum': 1, 'grave-frenzy': 0 },
        threatSamples: [],
        timeline: [],
        minutes: [],
      },
    });

    expect(save.journal.weapons).toContain('poison-flask');
    expect(save.journal.evolutions).toContain('bone-scythe');
    expect(save.journal.artifacts).toContain('pendant-of-vigor');
    expect(save.journal.enemies).toContain('lost-soul');
    expect(save.journal.buffs).toContain('soul-vacuum');
  });
});
