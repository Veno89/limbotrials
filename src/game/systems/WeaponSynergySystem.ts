import { WEAPON_SYNERGIES, type WeaponSynergyDefinition } from '../data/weaponSynergies';
import type { WeaponId } from '../types/gameTypes';
import type { RunState } from './RunState';

export class WeaponSynergySystem {
  private cachedWeaponCount = -1;
  private cachedActive: WeaponSynergyDefinition[] = [];

  constructor(private readonly run: RunState) {}

  active(): WeaponSynergyDefinition[] {
    if (this.cachedWeaponCount !== this.run.weapons.size) {
      this.cachedWeaponCount = this.run.weapons.size;
      this.cachedActive = WEAPON_SYNERGIES.filter((synergy) =>
        synergy.requiredWeapons.every((weapon) => this.run.weapons.has(weapon)),
      );
    }
    return this.cachedActive;
  }

  damageMultiplier(id: WeaponId): number {
    return this.active().reduce(
      (multiplier, synergy) =>
        synergy.affectedWeapons.includes(id) ? multiplier * synergy.damageMultiplier : multiplier,
      1,
    );
  }

  critChanceBonus(id: WeaponId): number {
    return this.active().reduce(
      (bonus, synergy) => (synergy.affectedWeapons.includes(id) ? bonus + synergy.critChanceBonus : bonus),
      0,
    );
  }
}
