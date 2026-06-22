import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import {
  EVOLUTION_READY_LEVEL,
  MAX_WEAPON_LEVEL,
  type UpgradeDefinition,
  type WeaponDefinition,
  type WeaponId,
} from '../types/gameTypes';

export interface DevWeaponProgression {
  weapon: WeaponDefinition;
  unlock?: UpgradeDefinition;
  level: UpgradeDefinition;
  evolution: UpgradeDefinition;
  focusedUpgrades: UpgradeDefinition[];
}

export interface DevWeaponActionState {
  equipped: boolean;
  canAdd: boolean;
  canLevel: boolean;
  canEvolve: boolean;
  evolved: boolean;
  level: number;
}

export function getDevWeaponProgression(id: WeaponId): DevWeaponProgression {
  const upgrades = Object.values(UPGRADES);
  const level = upgrades.find((upgrade) => upgrade.category === 'weapon-level' && upgrade.targetWeapon === id);
  const evolution = upgrades.find(
    (upgrade) => upgrade.category === 'weapon-evolution' && upgrade.targetWeapon === id,
  );
  if (!level || !evolution) {
    throw new Error(`Weapon ${id} is missing dev progression definitions.`);
  }
  return {
    weapon: WEAPONS[id],
    unlock: upgrades.find((upgrade) => upgrade.category === 'weapon' && upgrade.unlockWeapon === id),
    level,
    evolution,
    focusedUpgrades: upgrades.filter(
      (upgrade) => upgrade.category === 'weapon-upgrade' && upgrade.targetWeapon === id,
    ),
  };
}

export function devWeaponActionState(
  equipped: boolean,
  level: number,
  weaponCount: number,
  weaponCap: number,
): DevWeaponActionState {
  return {
    equipped,
    canAdd: !equipped && weaponCount < weaponCap,
    canLevel: equipped && level < EVOLUTION_READY_LEVEL,
    canEvolve: equipped && level === EVOLUTION_READY_LEVEL,
    evolved: equipped && level === MAX_WEAPON_LEVEL,
    level,
  };
}
