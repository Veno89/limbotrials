import { describe, expect, it } from 'vitest';
import { directionFromVelocity, HAUNTED_IDLE_FRAMES } from '../systems/playerVisualRules';

describe('player visual direction rules', () => {
  it('uses the dominant velocity axis', () => {
    expect(directionFromVelocity(10, 2)).toBe('right');
    expect(directionFromVelocity(-10, 2)).toBe('left');
    expect(directionFromVelocity(2, -10)).toBe('back');
    expect(directionFromVelocity(2, 10)).toBe('front');
    expect(directionFromVelocity(0, 0)).toBeUndefined();
  });

  it('defines one stable directional hover frame for every direction', () => {
    expect(HAUNTED_IDLE_FRAMES).toEqual({
      front: 1,
      back: 4,
      left: 7,
      right: 10,
    });
  });
});
