import { COLORS } from '../constants';
import type { StatusEffectDefinition, StatusEffectId } from '../types/gameTypes';

export const STATUS_EFFECTS: Record<StatusEffectId, StatusEffectDefinition> = {
  bleed: {
    id: 'bleed',
    name: 'Bleeding',
    description: 'Takes physical damage over time. Repeated cuts stack.',
    iconTexture: 'status-bleed',
    color: COLORS.blood,
    durationMs: 3200,
    tickIntervalMs: 800,
    baseDamagePerTick: 3,
    maxStacks: 3,
  },
  poison: {
    id: 'poison',
    name: 'Poisoned',
    description: 'Takes lingering toxic damage over time. Repeated doses stack.',
    iconTexture: 'status-poison',
    color: 0x51d96b,
    durationMs: 5200,
    tickIntervalMs: 1000,
    baseDamagePerTick: 3,
    maxStacks: 4,
  },
  burn: {
    id: 'burn',
    name: 'Burning',
    description: 'Takes rapid fire damage over time. Repeated applications stack.',
    iconTexture: 'status-burn',
    color: COLORS.hellfire,
    durationMs: 3000,
    tickIntervalMs: 500,
    baseDamagePerTick: 4,
    maxStacks: 3,
  },
  slow: {
    id: 'slow',
    name: 'Slowed',
    description: 'Movement speed is significantly reduced.',
    iconTexture: 'status-slow',
    color: 0x4a90e2,
    durationMs: 4000,
    tickIntervalMs: 4000, // We don't really care about ticks for slow, just duration
    baseDamagePerTick: 0,
    maxStacks: 1, // Only refresh duration, don't stack slow multiplier
    speedModifier: 0.5, // 50% speed
  },
};
