import { BALANCE } from '../config/balanceConfig';
import type { PlayerStats, StatModifier, WeaponModifier, WeaponStats } from '../types/gameTypes';

export const BASE_PLAYER_STATS: PlayerStats = {
  maxHealth: 100,
  moveSpeed: 220,
  damage: 1,
  attackSpeed: 1,
  pickupRadius: 105,
  dashCooldown: 3200,
  dashSpeed: 975,
  critChance: 0.05,
  critDamage: 1.75,
  bossDamage: 1,
  soulShardChance: 0.05,
  shieldInterval: 0,
  soulGain: 1,
  xpGain: 1,
  threatPowerBonus: 0,
};

export function applyStatModifiers(stats: PlayerStats, modifiers: readonly StatModifier[]): void {
  for (const modifier of modifiers) {
    const current = stats[modifier.stat];
    stats[modifier.stat] = modifier.mode === 'add' ? current + modifier.value : current * modifier.value;
  }
  clampPlayerStats(stats);
}

export function applyWeaponModifiers(
  stats: WeaponStats,
  modifiers: readonly WeaponModifier[],
  baseStats: WeaponStats = stats,
): void {
  for (const modifier of modifiers) {
    const current = stats[modifier.stat];
    stats[modifier.stat] = modifier.mode === 'add' ? current + modifier.value : current * modifier.value;
  }
  clampWeaponStats(stats, baseStats);
}

export function clampPlayerStats(stats: PlayerStats): PlayerStats {
  stats.maxHealth = Math.max(1, stats.maxHealth);
  stats.moveSpeed = clamp(stats.moveSpeed, 1, BASE_PLAYER_STATS.moveSpeed * BALANCE.maxMoveSpeedMultiplier);
  stats.damage = Math.max(0.1, stats.damage);
  stats.attackSpeed = clamp(stats.attackSpeed, 0.1, BALANCE.maxAttackSpeedMultiplier);
  stats.pickupRadius = clamp(
    stats.pickupRadius,
    1,
    BASE_PLAYER_STATS.pickupRadius * BALANCE.maxPickupRadiusMultiplier,
  );
  stats.dashCooldown = Math.max(
    BASE_PLAYER_STATS.dashCooldown * (1 - BALANCE.maxCooldownReduction),
    stats.dashCooldown,
  );
  stats.dashSpeed = Math.max(1, stats.dashSpeed);
  stats.critChance = clamp(stats.critChance, 0, BALANCE.maxCritChance);
  stats.critDamage = Math.max(1, stats.critDamage);
  stats.bossDamage = Math.max(0, stats.bossDamage);
  stats.soulShardChance = clamp(stats.soulShardChance, 0, 1);
  stats.shieldInterval = stats.shieldInterval <= 0 ? 0 : Math.max(2500, stats.shieldInterval);
  stats.soulGain = Math.max(0, stats.soulGain);
  stats.xpGain = clamp(stats.xpGain, 0, BALANCE.maxXpGainMultiplier);
  stats.threatPowerBonus = clamp(stats.threatPowerBonus, 0, BALANCE.maxThreatPowerBonus);
  return stats;
}

export function clampWeaponStats(stats: WeaponStats, baseStats: WeaponStats): WeaponStats {
  stats.damage = Math.max(1, stats.damage);
  stats.cooldownMs = Math.max(baseStats.cooldownMs * (1 - BALANCE.maxCooldownReduction), stats.cooldownMs);
  stats.range = Math.max(1, stats.range);
  stats.projectileSpeed = Math.max(0, stats.projectileSpeed);
  stats.projectileSize = Math.max(1, stats.projectileSize);
  stats.projectileCount = Math.max(1, stats.projectileCount);
  stats.pierce = Math.max(0, stats.pierce);
  stats.area = clamp(stats.area, 1, baseStats.area * BALANCE.maxAreaMultiplier);
  stats.targetCount = Math.max(1, stats.targetCount);
  stats.critChance = clamp(stats.critChance, 0, BALANCE.maxCritChance);
  stats.critDamage = Math.max(0, stats.critDamage);
  return stats;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
