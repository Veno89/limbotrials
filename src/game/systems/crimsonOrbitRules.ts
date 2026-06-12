import { BALANCE } from '../config/balanceConfig';
import type { WeaponStats } from '../types/gameTypes';

export interface CrimsonOrbitProfile {
  axeCount: number;
  radius: number;
  axeSize: number;
  collisionRadius: number;
  angularSpeed: number;
  hitCooldownMs: number;
  damageScale: number;
}

export function calculateCrimsonOrbit(stats: WeaponStats, attackSpeedMultiplier = 1): CrimsonOrbitProfile {
  const axeSize = clamp(stats.projectileSize * 0.58, 48, BALANCE.maxCrimsonOrbitAxeSize);
  const axeCount = Math.floor(clamp(stats.projectileCount + 2, 3, BALANCE.maxCrimsonOrbitAxes));
  return {
    axeCount,
    radius: clamp(132 + axeSize * 0.7 + (axeCount - 3) * 12, 160, BALANCE.maxCrimsonOrbitRadius),
    axeSize,
    collisionRadius: axeSize * 0.5,
    angularSpeed: clamp((5.1 / stats.cooldownMs) * attackSpeedMultiplier, 0.0024, 0.0038),
    hitCooldownMs: clamp(
      (stats.cooldownMs * 0.34) / attackSpeedMultiplier,
      BALANCE.minCrimsonOrbitHitCooldownMs,
      720,
    ),
    damageScale: 0.88,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
