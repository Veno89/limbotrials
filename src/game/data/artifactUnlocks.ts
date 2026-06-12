import type { ArtifactPoolTier, SaveData } from '../types/gameTypes';

export interface ArtifactUnlockCondition {
  id: ArtifactPoolTier;
  name: string;
  description: string;
  check: (save: SaveData) => boolean;
}

export const ARTIFACT_UNLOCKS: Record<Exclude<ArtifactPoolTier, 'base' | 'ng-plus'>, ArtifactUnlockCondition> = {
  'tier-2': {
    id: 'tier-2',
    name: 'Grave Wanderer Artifact Pool',
    description: 'Kill 500 total enemies across all runs.',
    check: (save: SaveData) => (save.totalKills || 0) >= 500,
  },
  'tier-3': {
    id: 'tier-3',
    name: 'Warden Bane Artifact Pool',
    description: 'Defeat the Limbo Warden at least once.',
    check: (save: SaveData) => save.totalWardenKills >= 1,
  },
  'tier-4': {
    id: 'tier-4',
    name: 'Eternity Unbound Artifact Pool',
    description: 'Defeat the Limbo Warden 3 times or kill 2000 total enemies.',
    check: (save: SaveData) => save.totalWardenKills >= 3 || save.totalKills >= 2000,
  },
};

export function checkArtifactUnlocks(save: SaveData): { unlocked: Exclude<ArtifactPoolTier, 'base' | 'ng-plus'>[]; nextSave: SaveData } {
  const currentUnlocked = new Set(save.unlockedArtifactTiers);
  const newlyUnlocked: Exclude<ArtifactPoolTier, 'base' | 'ng-plus'>[] = [];

  for (const [tier, condition] of Object.entries(ARTIFACT_UNLOCKS)) {
    const poolTier = tier as Exclude<ArtifactPoolTier, 'base' | 'ng-plus'>;
    if (!currentUnlocked.has(poolTier) && condition.check(save)) {
      newlyUnlocked.push(poolTier);
      currentUnlocked.add(poolTier);
    }
  }

  const nextSave: SaveData = {
    ...save,
    unlockedArtifactTiers: Array.from(currentUnlocked) as ArtifactPoolTier[],
  };

  return { unlocked: newlyUnlocked, nextSave };
}
