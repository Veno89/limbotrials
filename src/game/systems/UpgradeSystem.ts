import { UPGRADES } from '../data/upgrades';
import { EVOLUTION_READY_LEVEL, MAX_WEAPON_LEVEL, WEAPON_CAP } from '../types/gameTypes';
import type {
  UpgradeCategory,
  UpgradeDefinition,
  UpgradeId,
  WeaponId,
} from '../types/gameTypes';

const RARITY_WEIGHT: Record<UpgradeDefinition['rarity'], number> = {
  common: 6,
  uncommon: 3,
  rare: 1.4,
};

export interface UpgradeSelectionContext {
  stacks: ReadonlyMap<UpgradeId, number>;
  equippedWeapons: ReadonlySet<WeaponId>;
  weaponLevels: ReadonlyMap<WeaponId, number>;
  playerLevel: number;
  shieldSource?: boolean;
  curseLevel?: number;
  weaponCap?: number;
}

export function selectUpgradeChoices(
  context: UpgradeSelectionContext,
  random: () => number = Math.random,
  count = 3,
): UpgradeDefinition[] {
  const weaponCap = context.weaponCap ?? WEAPON_CAP;
  const pool = Object.values(UPGRADES).filter(
    (upgrade) =>
      upgrade.source !== 'shop' &&
      upgrade.category !== 'curse' &&
      isEligible(upgrade, context, weaponCap),
  );
  const choices: UpgradeDefinition[] = [];
  const evolutionCandidates = pool.filter((upgrade) => upgrade.category === 'weapon-evolution');
  if (evolutionCandidates.length > 0 && choices.length < count) {
    choices.push(evolutionCandidates[Math.floor(random() * evolutionCandidates.length)]!);
    for (let index = pool.length - 1; index >= 0; index -= 1) {
      if (pool[index]!.category === 'weapon-evolution') {
        pool.splice(index, 1);
      }
    }
  }

  while (choices.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, upgrade) => sum + upgradeWeight(upgrade, context.playerLevel), 0);
    let roll = random() * totalWeight;
    let selectedIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      const upgrade = pool[index]!;
      roll -= upgradeWeight(upgrade, context.playerLevel);
      if (roll <= 0) {
        selectedIndex = index;
        break;
      }
    }

    choices.push(pool[selectedIndex]!);
    const selected = pool[selectedIndex]!;
    pool.splice(selectedIndex, 1);
    if (selected.category === 'weapon') {
      for (let index = pool.length - 1; index >= 0; index -= 1) {
        if (pool[index]!.category === 'weapon') {
          pool.splice(index, 1);
        }
      }
    }
  }

  return choices;
}

export function selectCurseChoices(
  context: UpgradeSelectionContext,
  random: () => number = Math.random,
  count = 3,
): UpgradeDefinition[] {
  const pool = Object.values(UPGRADES).filter(
    (upgrade) =>
      upgrade.source !== 'shop' &&
      upgrade.category === 'curse' &&
      isEligible(upgrade, context, context.weaponCap ?? WEAPON_CAP),
  );
  const choices: UpgradeDefinition[] = [];
  while (choices.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    choices.push(pool[index]!);
    pool.splice(index, 1);
  }
  return choices;
}

function isEligible(
  upgrade: UpgradeDefinition,
  context: UpgradeSelectionContext,
  weaponCap: number,
): boolean {
  if ((context.stacks.get(upgrade.id) ?? 0) >= upgrade.maxStacks) {
    return false;
  }
  if (upgrade.requirements?.shieldSource && !context.shieldSource) {
    return false;
  }
  if (upgrade.requirements?.minCurse !== undefined && (context.curseLevel ?? 0) < upgrade.requirements.minCurse) {
    return false;
  }
  if (upgrade.category === 'weapon') {
    return Boolean(
      upgrade.unlockWeapon &&
        context.equippedWeapons.size < weaponCap &&
        !context.equippedWeapons.has(upgrade.unlockWeapon),
    );
  }
  if (upgrade.category === 'weapon-level') {
    return Boolean(
      upgrade.targetWeapon &&
        context.equippedWeapons.has(upgrade.targetWeapon) &&
        (context.weaponLevels.get(upgrade.targetWeapon) ?? 0) < EVOLUTION_READY_LEVEL,
    );
  }
  if (upgrade.category === 'weapon-upgrade') {
    const weaponLevel = upgrade.targetWeapon
      ? (context.weaponLevels.get(upgrade.targetWeapon) ?? 0)
      : 0;
    return Boolean(
      upgrade.targetWeapon &&
        context.equippedWeapons.has(upgrade.targetWeapon) &&
        (weaponLevel < EVOLUTION_READY_LEVEL || weaponLevel === MAX_WEAPON_LEVEL),
    );
  }
  if (upgrade.category === 'weapon-evolution') {
    return Boolean(
      upgrade.targetWeapon &&
        context.equippedWeapons.has(upgrade.targetWeapon) &&
        (context.weaponLevels.get(upgrade.targetWeapon) ?? 0) === EVOLUTION_READY_LEVEL,
    );
  }
  return true;
}

function upgradeWeight(upgrade: UpgradeDefinition, playerLevel: number): number {
  return RARITY_WEIGHT[upgrade.rarity] * categoryWeight(upgrade.category, playerLevel);
}

function categoryWeight(category: UpgradeCategory, playerLevel: number): number {
  if (category === 'weapon') {
    if (playerLevel <= 3) {
      return 7;
    }
    if (playerLevel <= 6) {
      return 4;
    }
    return 1.4;
  }
  if (category === 'weapon-level') {
    return playerLevel <= 3 ? 1.4 : 3.2;
  }
  if (category === 'weapon-upgrade') {
    return playerLevel <= 3 ? 0.8 : 2.4;
  }
  if (category === 'weapon-evolution') {
    return 10;
  }
  if (category === 'curse') {
    return 0;
  }
  return 2;
}
