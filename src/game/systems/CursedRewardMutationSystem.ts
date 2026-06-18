import { getCurseTier, getCurseTierById } from '../data/curse';
import type {
  ArtifactDefinition,
  CurseRewardDefinition,
  CurseSnapshot,
  StatModifier,
  UpgradeDefinition,
  UpgradeOfferKind,
  WeaponModifier,
} from '../types/gameTypes';

export function mutateUpgradeChoices(
  choices: readonly UpgradeDefinition[],
  snapshot: CurseSnapshot,
  kind: UpgradeOfferKind,
  random: () => number = Math.random,
): UpgradeDefinition[] {
  if (kind === 'curse') {
    return choices.filter((choice) => rewardTierAllowed(choice.curse, snapshot));
  }
  const tier = getCurseTier(snapshot.level);
  if (!snapshot.canMutateUpgrades || random() >= tier.upgradeMutationChance) {
    return [...choices];
  }
  const candidates = choices.filter((choice) => canMutateUpgrade(choice));
  if (candidates.length === 0) {
    return [...choices];
  }
  const selected = candidates[Math.floor(random() * candidates.length)]!;
  return choices.map((choice) => (choice === selected ? createCursedUpgradeVariant(choice, snapshot) : choice));
}

export function mutateArtifactReward(
  artifact: ArtifactDefinition,
  snapshot: CurseSnapshot,
  random: () => number = Math.random,
): ArtifactDefinition {
  const tier = getCurseTier(snapshot.level);
  if (!snapshot.canMutateArtifacts || random() >= tier.artifactMutationChance) {
    return artifact;
  }
  const curseGain = tier.id === 'forsaken' ? 18 : 12;
  return {
    ...artifact,
    name: `Cursed ${artifact.name}`,
    description:
      `${artifact.description}\n\nCursed Reliquary: +12% global damage, ` +
      `but elites and cursed enemies answer sooner. Curse +${curseGain}.`,
    rarity: artifact.rarity === 'common' ? 'uncommon' : artifact.rarity,
    modifiers: [
      ...(artifact.modifiers ?? []),
      { stat: 'damage', mode: 'multiply', value: 1.12 },
      { stat: 'threatPowerBonus', mode: 'add', value: 8 },
    ],
    curse: {
      curseGain,
      pattern: 'reliquary-oath',
      downside: 'Elites and curse-gated enemies pressure the run sooner.',
      warning: 'A RELIQUARY HAS CURDLED INTO SIN',
      requiredTier: 'condemned',
    },
  };
}

function canMutateUpgrade(choice: UpgradeDefinition): boolean {
  return !choice.curse && choice.category !== 'curse' && choice.category !== 'weapon-evolution';
}

function createCursedUpgradeVariant(choice: UpgradeDefinition, snapshot: CurseSnapshot): UpgradeDefinition {
  const targetWeapon = choice.targetWeapon ?? choice.unlockWeapon;
  const weaponModifiers = targetWeapon
    ? [...(choice.weaponModifiers ?? []), ...cursedWeaponModifiers(choice)]
    : choice.weaponModifiers;
  const modifiers = [...(choice.modifiers ?? []), ...cursedStatModifiers(choice)];
  const curseGain = snapshot.tier === 'forsaken' ? 9 : snapshot.tier === 'condemned' ? 7 : 5;
  const curse = cursedUpgradeReward(choice, curseGain);
  return {
    ...choice,
    name: `${choice.name}: ${curseName(curse.pattern)}`,
    description: `${choice.description}\n\nCursed: ${cursedBenefit(choice)} ${curse.downside} Curse +${curseGain}.`,
    rarity: 'rare',
    modifiers,
    weaponModifiers,
    curse,
  };
}

function cursedUpgradeReward(choice: UpgradeDefinition, curseGain: number): CurseRewardDefinition {
  if (choice.category === 'weapon' || choice.category === 'weapon-level' || choice.category === 'weapon-upgrade') {
    return {
      curseGain,
      pattern: 'overgrowth-of-sin',
      downside: 'Limbo reads your weapon growth and sends harder pressure.',
      warning: 'HELL HAS NOTICED YOUR WEAPON',
    };
  }
  if (choice.id === 'stat-forbidden-tutelage' || choice.id === 'stat-pickup') {
    return {
      curseGain: curseGain + 2,
      pattern: 'greed-mark',
      downside: 'Greed-marked enemies unlock earlier.',
      warning: 'GREED HAS MARKED YOU',
    };
  }
  return {
    curseGain,
    pattern: 'fragile-power',
    downside: 'Your safety margin shrinks while your power rises.',
    warning: 'POWER BURNS THROUGH THE FLESH',
  };
}

function cursedStatModifiers(choice: UpgradeDefinition): StatModifier[] {
  if (choice.id === 'stat-forbidden-tutelage') {
    return [
      { stat: 'xpGain', mode: 'multiply', value: 1.18 },
      { stat: 'threatPowerBonus', mode: 'add', value: 7 },
    ];
  }
  if (choice.id === 'stat-pickup') {
    return [
      { stat: 'pickupRadius', mode: 'multiply', value: 1.18 },
      { stat: 'soulGain', mode: 'multiply', value: 1.1 },
      { stat: 'threatPowerBonus', mode: 'add', value: 5 },
    ];
  }
  return [
    { stat: 'damage', mode: 'multiply', value: 1.08 },
    { stat: 'threatPowerBonus', mode: 'add', value: 4 },
  ];
}

function cursedWeaponModifiers(choice: UpgradeDefinition): WeaponModifier[] {
  const modifiers: WeaponModifier[] = [{ stat: 'damage', mode: 'multiply', value: 1.18 }];
  if (choice.category === 'weapon-upgrade') {
    modifiers.push({ stat: 'area', mode: 'multiply', value: 1.08 });
  }
  return modifiers;
}

function cursedBenefit(choice: UpgradeDefinition): string {
  if (choice.category === 'weapon' || choice.category === 'weapon-level' || choice.category === 'weapon-upgrade') {
    return 'The chosen weapon gains a stronger damage imprint.';
  }
  if (choice.id === 'stat-forbidden-tutelage') {
    return 'XP gain rises further.';
  }
  if (choice.id === 'stat-pickup') {
    return 'Pickup reach and soul yield both swell.';
  }
  return 'You gain additional global damage.';
}

function curseName(pattern: CurseRewardDefinition['pattern']): string {
  return pattern
    .split('-')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function rewardTierAllowed(reward: CurseRewardDefinition | undefined, snapshot: CurseSnapshot): boolean {
  if (!reward?.requiredTier) {
    return true;
  }
  return getCurseTier(snapshot.level).minCurse >= getCurseTierById(reward.requiredTier).minCurse;
}
