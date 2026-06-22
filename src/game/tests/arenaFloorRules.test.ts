import { describe, expect, it } from 'vitest';
import { canFlipArenaTile, createArenaFloorLayout, selectArenaTile } from '../systems/arenaFloorRules';

describe('arena floor rules', () => {
  it('weights tiles one and two above decorative variants', () => {
    expect(selectArenaTile(0)).toBe(1);
    expect(selectArenaTile(0.5)).toBe(2);
    expect(selectArenaTile(0.8)).toBe(3);
    expect(selectArenaTile(0.9)).toBe(4);
    expect(selectArenaTile(0.99)).toBe(5);
  });

  it('builds a stable layout dominated by tiles one and two', () => {
    const layout = createArenaFloorLayout(20, 15);
    const flat = layout.flat();
    const counts = new Map<number, number>();
    for (const tile of flat) {
      counts.set(tile, (counts.get(tile) ?? 0) + 1);
    }
    expect(layout).toEqual(createArenaFloorLayout(20, 15));
    expect((counts.get(1) ?? 0) + (counts.get(2) ?? 0)).toBeGreaterThan(flat.length * 0.75);
    expect(counts.get(1) ?? 0).toBeGreaterThan(counts.get(3) ?? 0);
    expect(counts.get(2) ?? 0).toBeGreaterThan(counts.get(4) ?? 0);
    expect(counts.get(2) ?? 0).toBeGreaterThan(counts.get(5) ?? 0);
  });

  it('does not place decorative tiles directly beside each other', () => {
    const layout = createArenaFloorLayout(20, 15);
    const rare = (tile: number): boolean => tile >= 3;
    layout.forEach((row, y) => row.forEach((tile, x) => {
      if (!rare(tile)) {
        return;
      }
      if (x > 0) {
        expect(rare(row[x - 1]!)).toBe(false);
      }
      if (y > 0) {
        expect(rare(layout[y - 1]![x]!)).toBe(false);
      }
    }));
  });

  it('preserves the authored orientation of grass and bone tiles', () => {
    expect(canFlipArenaTile(3)).toBe(false);
    expect(canFlipArenaTile(5)).toBe(false);
    expect(canFlipArenaTile(1)).toBe(true);
    expect(canFlipArenaTile(2)).toBe(true);
    expect(canFlipArenaTile(4)).toBe(true);
  });
});
