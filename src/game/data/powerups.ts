import { COLORS } from '../constants';
import type { PowerupId } from '../types/gameTypes';

export const FIRST_RANDOM_POWERUP_AT_MS = 60000;
export const RANDOM_POWERUP_COOLDOWN_MS = 90000;
export const RANDOM_POWERUP_DROP_CHANCE = 0.006;

export interface PowerupDefinition {
  id: PowerupId;
  name: string;
  texture: string;
  color: number;
  pickupMessage: string;
  durationMs?: number;
}

export const POWERUPS: Record<PowerupId, PowerupDefinition> = {
  'mending-soul': {
    id: 'mending-soul',
    name: 'Mending Soul',
    texture: 'icon-powerup-mending-soul',
    color: 0x92e6b1,
    pickupMessage: 'Restores up to 25 health.',
  },
  'soul-vacuum': {
    id: 'soul-vacuum',
    name: 'Soul Vacuum',
    texture: 'icon-powerup-soul-vacuum',
    color: COLORS.soul,
    pickupMessage: 'Collects all soul remnants.',
  },
  'grave-frenzy': {
    id: 'grave-frenzy',
    name: 'Grave Frenzy',
    texture: 'icon-powerup-grave-frenzy',
    color: COLORS.hellfire,
    pickupMessage: '+35% attack speed / +12% crit / 10s.',
    durationMs: 10000,
  },
};

export function canSpawnRandomPowerup(elapsedMs: number, nextDropAtMs: number, roll: number): boolean {
  return elapsedMs >= nextDropAtMs && roll <= RANDOM_POWERUP_DROP_CHANCE;
}
