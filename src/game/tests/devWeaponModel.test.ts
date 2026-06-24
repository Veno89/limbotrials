import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { devWeaponActionState, getDevWeaponProgression } from '../systems/devWeaponModel';

describe('dev weapon model', () => {
  it('derives level, evolution, and focused upgrades for every weapon', () => {
    for (const weapon of Object.values(WEAPONS)) {
      const progression = getDevWeaponProgression(weapon.id);
      expect(progression.level.targetWeapon).toBe(weapon.id);
      expect(progression.evolution.targetWeapon).toBe(weapon.id);
      if (!['gravetide-repeater', 'saintbreaker-pike', 'ashen-orbit', 'choir-of-teeth', 'eclipse-brand'].includes(weapon.id)) {
        expect(progression.focusedUpgrades.length).toBeGreaterThan(0);
      }
      expect(Boolean(progression.unlock)).toBe(weapon.id !== 'bone-scythe');
    }
  });

  it('enables only the progression action valid at the current level', () => {
    expect(devWeaponActionState(false, 0, 1, 5)).toMatchObject({ canAdd: true, canLevel: false, canEvolve: false });
    expect(devWeaponActionState(true, 4, 2, 5)).toMatchObject({ canAdd: false, canLevel: true, canEvolve: false });
    expect(devWeaponActionState(true, 6, 2, 5)).toMatchObject({ canLevel: false, canEvolve: true, evolved: false });
    expect(devWeaponActionState(true, 7, 2, 5)).toMatchObject({ canLevel: false, canEvolve: false, evolved: true });
    expect(devWeaponActionState(false, 0, 5, 5).canAdd).toBe(false);
  });
});
