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
};
