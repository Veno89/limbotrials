import { describe, expect, it } from 'vitest';
import { curseSnapshot } from '../data/curse';
import { ENEMIES } from '../data/enemies';
import { cursePressureForEnemy } from '../systems/cursePressureRules';
import type { CurseTierId } from '../types/gameTypes';

function snapshot(level: number, crossed: CurseTierId[] = ['unmarked']) {
  return curseSnapshot(level, level, new Set(crossed));
}

describe('curse pressure rules', () => {
  it('keeps safe and merely touched runs at baseline enemy pressure', () => {
    expect(cursePressureForEnemy(ENEMIES['lost-soul'], snapshot(0))).toMatchObject({
      healthMultiplier: 1,
      damageMultiplier: 1,
      speedMultiplier: 1,
    });
    expect(cursePressureForEnemy(ENEMIES['condemned-husk'], snapshot(12, ['unmarked', 'touched']))).toMatchObject({
      healthMultiplier: 1,
      damageMultiplier: 1,
      speedMultiplier: 1,
    });
  });

  it('makes curse-gated enemies substantially tougher than ambient enemies at high curse', () => {
    const highCurse = snapshot(125, ['unmarked', 'touched', 'marked', 'condemned', 'forsaken']);
    const ambient = cursePressureForEnemy(ENEMIES['lost-soul'], highCurse);
    const husk = cursePressureForEnemy(ENEMIES['condemned-husk'], highCurse);

    expect(husk.healthMultiplier).toBeGreaterThan(ambient.healthMultiplier * 2);
    expect(husk.damageMultiplier).toBeGreaterThan(ambient.damageMultiplier);
    expect(husk.tint).toBeDefined();
    expect(ambient.tint).toBeDefined();
  });

  it('lets high curse strengthen bosses without changing safe-run Warden behavior', () => {
    const safe = cursePressureForEnemy(ENEMIES['limbo-warden'], snapshot(0));
    const forsaken = cursePressureForEnemy(
      ENEMIES['limbo-warden'],
      snapshot(150, ['unmarked', 'touched', 'marked', 'condemned', 'forsaken']),
    );

    expect(safe.healthMultiplier).toBe(1);
    expect(forsaken.healthMultiplier).toBeGreaterThan(1.5);
    expect(forsaken.damageMultiplier).toBeGreaterThan(1.1);
  });
});
