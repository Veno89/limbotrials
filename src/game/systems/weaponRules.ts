import type { WeaponStats } from '../types/gameTypes';

export interface BloodletterThrowProfile {
  outboundDurationMs: number;
  lifetimeMs: number;
}

export function calculateBloodletterThrow(stats: WeaponStats): BloodletterThrowProfile {
  const outboundDurationMs = (stats.range / stats.projectileSpeed) * 1000;
  return {
    outboundDurationMs,
    lifetimeMs: outboundDurationMs * 2 + 500,
  };
}

export function getBloodletterThrowAngles(baseAngle: number, projectileCount: number): number[] {
  const count = Math.max(1, Math.floor(projectileCount));
  const spread = Math.min(0.6, 0.2 * (count - 1));
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    return baseAngle - spread / 2 + ratio * spread;
  });
}
