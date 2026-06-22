import type { WeaponStats } from '../types/gameTypes';

export interface AcidPoolProfile {
  radius: number;
  durationMs: number;
  tickIntervalMs: number;
  damageScale: number;
  appliesPoison: boolean;
  poisonDamagePerTick: number;
}

export const POISON_FLASK_POOL = {
  baseDurationMs: 3200,
  evolvedDurationMs: 4600,
  tickIntervalMs: 650,
  baseDamageScale: 0.24,
  evolvedDamageScale: 0.28,
  poisonDamageScale: 0.08,
} as const;

export function poisonFlaskTravelMs(distance: number, projectileSpeed: number): number {
  const travelMs = (distance / Math.max(1, projectileSpeed)) * 1000;
  return Math.max(320, Math.min(1500, Math.round(travelMs)));
}

export function poisonFlaskImpactRadius(stats: WeaponStats): number {
  return Math.max(30, Math.round(stats.projectileSize * 0.9));
}

export function poisonFlaskPoolProfile(stats: WeaponStats, evolved: boolean): AcidPoolProfile {
  return {
    radius: Math.max(54, Math.round(stats.area)),
    durationMs: evolved ? POISON_FLASK_POOL.evolvedDurationMs : POISON_FLASK_POOL.baseDurationMs,
    tickIntervalMs: POISON_FLASK_POOL.tickIntervalMs,
    damageScale: evolved ? POISON_FLASK_POOL.evolvedDamageScale : POISON_FLASK_POOL.baseDamageScale,
    appliesPoison: evolved,
    poisonDamagePerTick: Math.max(2, Math.round(stats.damage * POISON_FLASK_POOL.poisonDamageScale)),
  };
}
