import { MAX_WEAPON_LEVEL } from '../types/gameTypes';
import type { UpgradeDefinition, UpgradeId, WeaponId } from '../types/gameTypes';

export interface UpgradePresentationContext {
  stacks: ReadonlyMap<UpgradeId, number>;
  weaponLevels: ReadonlyMap<WeaponId, number>;
  weaponCount: number;
  weaponCap: number;
}

export function getUpgradeProgressLabel(
  choice: UpgradeDefinition,
  context: UpgradePresentationContext,
): string {
  if (choice.category === 'weapon') {
    return `ARSENAL ${context.weaponCount + 1} / ${context.weaponCap}`;
  }
  if (
    (choice.category === 'weapon-level' ||
      choice.category === 'weapon-upgrade' ||
      choice.category === 'weapon-evolution') &&
    choice.targetWeapon
  ) {
    const current = context.weaponLevels.get(choice.targetWeapon) ?? 1;
    if (choice.category === 'weapon-upgrade' && current >= MAX_WEAPON_LEVEL) {
      return `EVOLVED SPECIALIZATION ${(context.stacks.get(choice.id) ?? 0) + 1} / ${choice.maxStacks}`;
    }
    return `LEVEL ${current} -> ${current + 1}`;
  }
  return `RANK ${(context.stacks.get(choice.id) ?? 0) + 1} / ${choice.maxStacks}`;
}

export function getUpgradeDescription(
  choice: UpgradeDefinition,
  weaponLevels: ReadonlyMap<WeaponId, number>,
): string {
  if (choice.category !== 'weapon-upgrade') {
    return choice.description;
  }
  const current = choice.targetWeapon ? (weaponLevels.get(choice.targetWeapon) ?? 1) : 1;
  return current >= MAX_WEAPON_LEVEL
    ? `${choice.description}\n\nFurther specializes this evolved weapon.`
    : `${choice.description}\n\nAlso advances this weapon by +1 level.`;
}
