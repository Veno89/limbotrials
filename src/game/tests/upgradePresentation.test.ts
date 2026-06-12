import { describe, expect, it } from 'vitest';
import { UPGRADES } from '../data/upgrades';
import { getUpgradeDescription, getUpgradeProgressLabel } from '../ui/upgradePresentation';
import type { UpgradeId, WeaponId } from '../types/gameTypes';

function presentationContext(level: number, stacks: ReadonlyMap<UpgradeId, number> = new Map()) {
  return {
    stacks,
    weaponLevels: new Map<WeaponId, number>([['bloodletter-axe', level]]),
    weaponCount: 2,
    weaponCap: 5,
  };
}

describe('upgrade presentation', () => {
  it('presents focused upgrades as level advancement before evolution', () => {
    const choice = UPGRADES['bloodletter-axe-count'];
    const context = presentationContext(4);

    expect(getUpgradeProgressLabel(choice, context)).toBe('LEVEL 4 -> 5');
    expect(getUpgradeDescription(choice, context.weaponLevels)).toContain('Also advances this weapon by +1 level.');
  });

  it('presents focused upgrades as specializations after evolution', () => {
    const choice = UPGRADES['bloodletter-axe-count'];
    const context = presentationContext(7, new Map<UpgradeId, number>([['bloodletter-axe-count', 1]]));

    expect(getUpgradeProgressLabel(choice, context)).toBe('EVOLVED SPECIALIZATION 2 / 2');
    expect(getUpgradeDescription(choice, context.weaponLevels)).toContain(
      'Further specializes this evolved weapon.',
    );
    expect(getUpgradeDescription(choice, context.weaponLevels)).not.toContain('advances');
  });
});
