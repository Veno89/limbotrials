import { describe, expect, it } from 'vitest';
import { lootArcPoint } from '../ui/lootRevealMath';

describe('loot reveal arc', () => {
  it('starts and ends at the requested positions', () => {
    const start = { x: 10, y: 20 };
    const end = { x: 210, y: 20 };
    expect(lootArcPoint(start, end, 0)).toEqual(start);
    expect(lootArcPoint(start, end, 1)).toEqual(end);
  });

  it('bends away from a straight line while travelling', () => {
    expect(lootArcPoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.5).y).toBeGreaterThan(0);
  });
});
