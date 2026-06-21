import type {
  BossCurseTag,
  CurseRewardDefinition,
  CurseSnapshot,
  CurseTierDefinition,
  CurseTierId,
  EnemyDefinition,
  EnemyTag,
} from '../types/gameTypes';

export const CURSE_TIERS: readonly CurseTierDefinition[] = [
  {
    id: 'unmarked',
    minCurse: 0,
    label: 'Unmarked',
    description: 'Limbo has not yet marked this run.',
    upgradeMutationChance: 0,
    artifactMutationChance: 0,
    enemyTagsUnlocked: [],
    bossTagsUnlocked: [],
    eliteSpawnModifier: 1,
  },
  {
    id: 'touched',
    minCurse: 1,
    label: 'Touched',
    description: 'Cursed upgrade variants may now appear.',
    upgradeMutationChance: 0.22,
    artifactMutationChance: 0,
    enemyTagsUnlocked: [],
    bossTagsUnlocked: [],
    eliteSpawnModifier: 1.05,
  },
  {
    id: 'marked',
    minCurse: 25,
    label: 'Marked',
    description: 'Cursed enemies may now enter the trial.',
    upgradeMutationChance: 0.34,
    artifactMutationChance: 0,
    enemyTagsUnlocked: ['cursed', 'hunted'],
    bossTagsUnlocked: [],
    eliteSpawnModifier: 1.18,
  },
  {
    id: 'condemned',
    minCurse: 50,
    label: 'Condemned',
    description: 'Reliquaries may twist and the Warden may answer your curse.',
    upgradeMutationChance: 0.46,
    artifactMutationChance: 0.2,
    enemyTagsUnlocked: ['cursed', 'hunted', 'debt'],
    bossTagsUnlocked: ['curse-minions'],
    eliteSpawnModifier: 1.34,
  },
  {
    id: 'forsaken',
    minCurse: 75,
    label: 'Forsaken',
    description: 'Hell has noticed you. Cursed power mutates often.',
    upgradeMutationChance: 0.6,
    artifactMutationChance: 0.34,
    enemyTagsUnlocked: ['cursed', 'hunted', 'debt', 'echo'],
    bossTagsUnlocked: ['curse-minions', 'curse-aura'],
    eliteSpawnModifier: 1.55,
  },
];

export function getCurseTier(curseLevel: number): CurseTierDefinition {
  let selected = CURSE_TIERS[0]!;
  for (const tier of CURSE_TIERS) {
    if (curseLevel >= tier.minCurse) {
      selected = tier;
    }
  }
  return selected;
}

export function getCurseTierById(id: CurseTierId): CurseTierDefinition {
  return CURSE_TIERS.find((tier) => tier.id === id) ?? CURSE_TIERS[0]!;
}

export function getCrossedCurseTiers(previousCurse: number, nextCurse: number): CurseTierDefinition[] {
  return CURSE_TIERS.filter((tier) => tier.minCurse > previousCurse && tier.minCurse <= nextCurse);
}

export function curseSnapshot(curseLevel: number, totalGained: number, crossed: ReadonlySet<CurseTierId>): CurseSnapshot {
  const tier = getCurseTier(curseLevel);
  return {
    level: curseLevel,
    totalGained,
    tier: tier.id,
    tierLabel: tier.label,
    thresholdsCrossed: [...crossed],
    enemyTagsUnlocked: [...tier.enemyTagsUnlocked],
    bossTagsUnlocked: [...tier.bossTagsUnlocked],
    canMutateUpgrades: tier.upgradeMutationChance > 0,
    canMutateArtifacts: tier.artifactMutationChance > 0,
  };
}

export function curseTierProgress(curseLevel: number): number {
  const current = getCurseTier(curseLevel);
  const currentIndex = CURSE_TIERS.findIndex((tier) => tier.id === current.id);
  const next = CURSE_TIERS[currentIndex + 1];
  if (!next) {
    return 1;
  }
  return Math.max(0, Math.min(1, (curseLevel - current.minCurse) / (next.minCurse - current.minCurse)));
}

export function curseRewardAllowed(reward: CurseRewardDefinition | undefined, snapshot: CurseSnapshot): boolean {
  if (!reward?.requiredTier) {
    return true;
  }
  return getCurseTier(snapshot.level).minCurse >= getCurseTierById(reward.requiredTier).minCurse;
}

export function enemyAllowedByCurse(definition: EnemyDefinition, snapshot: CurseSnapshot): boolean {
  const requirement = definition.spawnRequirements;
  if (!requirement) {
    return true;
  }
  if (requirement.minCurse !== undefined && snapshot.level < requirement.minCurse) {
    return false;
  }
  if (
    requirement.requiredCurseTier &&
    getCurseTier(snapshot.level).minCurse < getCurseTierById(requirement.requiredCurseTier).minCurse
  ) {
    return false;
  }
  if (requirement.tags?.some((tag) => !snapshot.enemyTagsUnlocked.includes(tag))) {
    return false;
  }
  return true;
}

export function hasBossCurseTag(snapshot: CurseSnapshot, tag: BossCurseTag): boolean {
  return snapshot.bossTagsUnlocked.includes(tag);
}

export function hasEnemyCurseTag(snapshot: CurseSnapshot, tag: EnemyTag): boolean {
  return snapshot.enemyTagsUnlocked.includes(tag);
}
