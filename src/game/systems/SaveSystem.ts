import { SAVE_KEY, SAVE_VERSION } from '../constants';
import { checkArtifactUnlocks } from '../data/artifactUnlocks';
import { checkCharacterUnlocks, isCharacterId } from '../data/characters';
import type {
  ArtifactPoolTier,
  CharacterId,
  CharacterRunStats,
  MetaUpgradeId,
  RunSummary,
  SaveData,
} from '../types/gameTypes';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSave(): SaveData {
  const emptyCharacterStats = (): CharacterRunStats => ({
    runs: 0,
    victories: 0,
    bestSurvivalMs: 0,
    kills: 0,
  });
  return {
    version: SAVE_VERSION,
    totalSouls: 0,
    spentSouls: 0,
    metaLevels: {
      'vital-remnant': 0,
      'cruel-memory': 0,
      'hungry-echo': 0,
      'fateful-thread': 0,
    },
    bestRunTimeMs: 0,
    highestBossDefeated: 0,
    totalKills: 0,
    totalRuns: 0,
    totalDeaths: 0,
    totalWardenKills: 0,
    totalSoulsEarned: 0,
    runsSurvivedTenMinutes: 0,
    selectedCharacter: 'haunted',
    unlockedCharacters: ['haunted'],
    characterStats: {
      haunted: emptyCharacterStats(),
      'the-penitent': emptyCharacterStats(),
      ashwalker: emptyCharacterStats(),
    },
    unlockedArtifactTiers: ['base'],
    settings: {
      screenShake: true,
      particles: true,
      masterVolume: 0.75,
      musicVolume: 0.35,
      effectsVolume: 0.7,
    },
  };
}

export function loadSave(storage: StorageLike = localStorage): SaveData {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      return createDefaultSave();
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const defaults = createDefaultSave();
    const unlockedCharacters: CharacterId[] = Array.isArray(parsed.unlockedCharacters)
      ? parsed.unlockedCharacters.filter(isCharacterId)
      : ['haunted'];
    if (!unlockedCharacters.includes('haunted')) {
      unlockedCharacters.unshift('haunted');
    }
    const selectedCharacter =
      isCharacterId(parsed.selectedCharacter) && unlockedCharacters.includes(parsed.selectedCharacter)
        ? parsed.selectedCharacter
        : 'haunted';
    const validArtifactTiers = new Set<ArtifactPoolTier>(['base', 'tier-2', 'tier-3', 'tier-4', 'ng-plus']);
    const unlockedArtifactTiers: ArtifactPoolTier[] = Array.isArray(parsed.unlockedArtifactTiers)
      ? parsed.unlockedArtifactTiers.filter((tier): tier is ArtifactPoolTier => validArtifactTiers.has(tier))
      : ['base'];
    if (!unlockedArtifactTiers.includes('base')) {
      unlockedArtifactTiers.unshift('base');
    }
    const migrated: SaveData = {
      ...defaults,
      ...parsed,
      version: SAVE_VERSION,
      totalWardenKills: parsed.totalWardenKills ?? parsed.highestBossDefeated ?? 0,
      metaLevels: { ...defaults.metaLevels, ...parsed.metaLevels },
      selectedCharacter,
      unlockedCharacters: [...new Set(unlockedCharacters)],
      characterStats: {
        haunted: { ...defaults.characterStats.haunted, ...parsed.characterStats?.haunted },
        'the-penitent': {
          ...defaults.characterStats['the-penitent'],
          ...parsed.characterStats?.['the-penitent'],
        },
        ashwalker: { ...defaults.characterStats.ashwalker, ...parsed.characterStats?.ashwalker },
      },
      unlockedArtifactTiers: [...new Set(unlockedArtifactTiers)],
      settings: { ...defaults.settings, ...parsed.settings },
    };
    const artifactUnlocks = checkArtifactUnlocks(migrated);
    checkCharacterUnlocks(artifactUnlocks.nextSave);
    return artifactUnlocks.nextSave;
  } catch {
    return createDefaultSave();
  }
}

export function writeSave(save: SaveData, storage: StorageLike = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function availableSouls(save: SaveData): number {
  return save.totalSouls - save.spentSouls;
}

export function purchaseMetaUpgrade(
  save: SaveData,
  id: MetaUpgradeId,
  cost: number,
  maxLevel: number,
): boolean {
  if (availableSouls(save) < cost || save.metaLevels[id] >= maxLevel) {
    return false;
  }
  save.spentSouls += cost;
  save.metaLevels[id] += 1;
  return true;
}

export interface RecordedRunResult {
  save: SaveData;
  newlyUnlockedCharacters: CharacterId[];
  newlyUnlockedArtifactTiers: ArtifactPoolTier[];
}

export function recordRunResult(save: SaveData, summary: RunSummary): RecordedRunResult {
  const next: SaveData = {
    ...save,
    characterStats: {
      haunted: { ...save.characterStats.haunted },
      'the-penitent': { ...save.characterStats['the-penitent'] },
      ashwalker: { ...save.characterStats.ashwalker },
    },
    unlockedCharacters: [...save.unlockedCharacters],
    unlockedArtifactTiers: [...save.unlockedArtifactTiers],
  };
  next.totalSouls += summary.souls;
  next.totalSoulsEarned += summary.souls;
  next.totalKills += summary.kills;
  next.totalRuns += 1;
  next.totalDeaths += summary.victory ? 0 : 1;
  next.bestRunTimeMs = Math.max(next.bestRunTimeMs, summary.elapsedMs);
  next.runsSurvivedTenMinutes += summary.elapsedMs >= 10 * 60 * 1000 ? 1 : 0;
  if (summary.victory) {
    next.highestBossDefeated = Math.max(next.highestBossDefeated, 1);
    next.totalWardenKills += 1;
  }

  const characterStats = next.characterStats[summary.characterId];
  characterStats.runs += 1;
  characterStats.victories += summary.victory ? 1 : 0;
  characterStats.bestSurvivalMs = Math.max(characterStats.bestSurvivalMs, summary.elapsedMs);
  characterStats.kills += summary.kills;

  const artifactUnlocks = checkArtifactUnlocks(next);
  const newlyUnlockedCharacters = checkCharacterUnlocks(artifactUnlocks.nextSave);
  return {
    save: artifactUnlocks.nextSave,
    newlyUnlockedCharacters,
    newlyUnlockedArtifactTiers: artifactUnlocks.unlocked,
  };
}
