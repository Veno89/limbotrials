import type { EnemyDefinition } from '../types/gameTypes';

export interface SpectralChainsSweepProfile {
  facingAngle: number;
  arcSweepAngle: number;
}

export function isPointInArc(
  centerX: number,
  centerY: number,
  pointX: number,
  pointY: number,
  radius: number,
  profile: SpectralChainsSweepProfile,
  pointRadius: number,
): boolean {
  const dx = pointX - centerX;
  const dy = pointY - centerY;
  const distanceSq = dx * dx + dy * dy;
  const effectiveRadius = radius + pointRadius;

  if (distanceSq > effectiveRadius * effectiveRadius) {
    return false;
  }

  // Inside radius, now check angle
  const angleToPoint = Math.atan2(dy, dx);
  
  // Normalize angles to -PI to PI
  let angleDiff = angleToPoint - profile.facingAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  return Math.abs(angleDiff) <= profile.arcSweepAngle / 2;
}

export function calculateBindingsJumpTargets(
  allNearbyEnemies: { sprite: Phaser.Physics.Arcade.Image; definition: EnemyDefinition }[],
  sourceX: number,
  sourceY: number,
  jumpRadius: number,
  excluded: Set<Phaser.Physics.Arcade.Image>,
  count: number
): Phaser.Physics.Arcade.Image[] {
  const jumpRadiusSq = jumpRadius * jumpRadius;
  const targets: Phaser.Physics.Arcade.Image[] = [];
  
  const sorted = allNearbyEnemies
    .filter(e => !excluded.has(e.sprite))
    .map(e => ({
      sprite: e.sprite,
      definition: e.definition,
      distSq: Phaser.Math.Distance.Squared(sourceX, sourceY, e.sprite.x, e.sprite.y)
    }))
    .filter(e => e.distSq <= jumpRadiusSq)
    .sort((a, b) => a.distSq - b.distSq);

  for (const item of sorted.slice(0, count)) {
    targets.push(item.sprite);
  }
  return targets;
}
