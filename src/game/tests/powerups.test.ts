import { describe, expect, it } from 'vitest';
import {
  canSpawnRandomPowerup,
  FIRST_RANDOM_POWERUP_AT_MS,
  RANDOM_POWERUP_COOLDOWN_MS,
  RANDOM_POWERUP_DROP_CHANCE,
  POWERUPS,
} from '../data/powerups';

describe('powerup pacing', () => {
  it('blocks random powerups before the first-drop time and during cooldown', () => {
    expect(canSpawnRandomPowerup(FIRST_RANDOM_POWERUP_AT_MS - 1, FIRST_RANDOM_POWERUP_AT_MS, 0)).toBe(false);
    expect(canSpawnRandomPowerup(100000, 100001, 0)).toBe(false);
  });

  it('allows an eligible drop only on a successful roll', () => {
    expect(canSpawnRandomPowerup(100000, 90000, RANDOM_POWERUP_DROP_CHANCE)).toBe(true);
    expect(canSpawnRandomPowerup(100000, 90000, RANDOM_POWERUP_DROP_CHANCE + 0.001)).toBe(false);
    expect(RANDOM_POWERUP_COOLDOWN_MS).toBe(90000);
  });

  it('describes immediate and timed pickup effects', () => {
    expect(POWERUPS['mending-soul'].pickupMessage).toContain('25 health');
    expect(POWERUPS['soul-vacuum'].pickupMessage).toContain('all soul remnants');
    expect(POWERUPS['grave-frenzy']).toMatchObject({
      durationMs: 10000,
      pickupMessage: '+35% attack speed / +12% crit / 10s.',
    });
  });
});
