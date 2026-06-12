import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';
import { WeaponSynergySystem } from '../systems/WeaponSynergySystem';

describe('weapon synergies', () => {
  it('activates only after every required weapon is equipped', () => {
    const run = new RunState(createDefaultSave());
    const synergies = new WeaponSynergySystem(run);
    expect(synergies.active()).toEqual([]);
    run.addWeapon('soul-bolt');
    expect(synergies.active().map((synergy) => synergy.id)).toEqual(['reapers-choir']);
    expect(synergies.critChanceBonus('bone-scythe')).toBe(0.08);
  });
});
