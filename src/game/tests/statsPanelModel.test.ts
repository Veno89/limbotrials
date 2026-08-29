import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';
import { buildStatsPanelModel } from '../ui/statsPanelModel';

describe('stats panel model', () => {
  it('updates global and weapon-specific values from the current run', () => {
    const run = new RunState(createDefaultSave());
    const before = buildStatsPanelModel(run);
    expect(before.weapons[0]).toMatchObject({ name: 'BONE SCYTHE', levelLabel: 'LEVEL 1' });
    expect(before.general.find((entry) => entry.label === 'CRIT CHANCE')?.value).toBe('5%');

    run.upgrades.apply('stat-crit');
    run.upgrades.apply('stat-forbidden-tutelage');
    run.upgrades.apply('bone-scythe-area');
    run.weapons.add('bloodletter-axe');
    const after = buildStatsPanelModel(run);

    expect(after.general.find((entry) => entry.label === 'CRIT CHANCE')?.value).toBe('9%');
    expect(after.general.find((entry) => entry.label === 'XP GAIN')?.value).toBe('x1.20');
    expect(after.general.find((entry) => entry.label === 'THREAT POWER')?.value).toBe('+7');
    expect(after.weapons.find((weapon) => weapon.id === 'bone-scythe')?.levelLabel).toBe('LEVEL 2');
    expect(after.weapons.find((weapon) => weapon.id === 'bone-scythe')?.details).toContain('AREA');
    expect(after.weapons.find((weapon) => weapon.id === 'bloodletter-axe')?.details).toContain('PIERCE 5');
  });

  it('describes evolved Bloodletter Axe as a continuous bounded orbit', () => {
    const run = new RunState(createDefaultSave());
    run.weapons.add('bloodletter-axe');
    for (let index = 0; index < 5; index += 1) {
      run.upgrades.apply('level-bloodletter-axe');
    }
    run.upgrades.apply('evolve-bloodletter-axe');

    const axe = buildStatsPanelModel(run).weapons.find((weapon) => weapon.id === 'bloodletter-axe');
    expect(axe?.primary).toContain('CONTINUOUS');
    expect(axe?.details).toContain('AXES 3');
    expect(axe?.details).toContain('ORBIT');
    expect(axe?.details).not.toContain('PIERCE');
  });

  it('labels Tesla Coil acquisition range, hop range, and target count clearly', () => {
    const run = new RunState(createDefaultSave());
    run.weapons.add('tesla-coil');

    const tesla = buildStatsPanelModel(run).weapons.find((weapon) => weapon.id === 'tesla-coil');
    expect(tesla?.details).toContain('HOP 260');
    expect(tesla?.details).toContain('RANGE 680');
    expect(tesla?.details).toContain('TARGETS 3');
  });
});
