import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { getBossAttackPool, selectBossAttack } from '../systems/bossAttackRules';
import { distanceToSegment } from '../systems/Geometry';

describe('boss attack geometry', () => {
  it('measures distance from the grave chain segment', () => {
    expect(distanceToSegment(5, 4, 0, 0, 10, 0)).toBe(4);
    expect(distanceToSegment(14, 0, 0, 0, 10, 0)).toBe(4);
  });

  it('expands the Warden attack pool across phases without random repeats', () => {
    expect(getBossAttackPool(1)).toEqual(['shockwave', 'grave-chain', 'shattered-judgment']);
    expect(getBossAttackPool(2)).toContain('cathedral-rupture');
    expect(getBossAttackPool(3)).toContain('condemned-star');
    const phaseThree = getBossAttackPool(3);
    const cycle = phaseThree.map((_, index) => selectBossAttack(index, 3));
    expect(new Set(cycle).size).toBe(phaseThree.length);
  });

  it('gives the rebuilt Warden enough health for a multi-pattern fight', () => {
    expect(ENEMIES['limbo-warden'].maxHealth).toBe(120000);
  });
});
