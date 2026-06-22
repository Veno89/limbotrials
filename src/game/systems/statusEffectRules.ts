import type { StatusEffectDefinition, StatusEffectId, WeaponId } from '../types/gameTypes';

export interface StatusApplicationSource {
  sourceWeaponId?: WeaponId;
  damagePerTick?: number;
}

export interface ActiveStatusEffect {
  id: StatusEffectId;
  stacks: number;
  expiresAt: number;
  nextTickAt: number;
  damagePerTick: number;
  sourceWeaponId?: WeaponId;
}

export const BONE_SCYTHE_CRIMSON_HARVEST = {
  bleedDamageScale: 0.11,
} as const;

export function boneScytheBleedDamage(baseDamage: number): number {
  return Math.max(2, Math.round(baseDamage * BONE_SCYTHE_CRIMSON_HARVEST.bleedDamageScale));
}

export function applyStatusEffect(
  definition: StatusEffectDefinition,
  now: number,
  existing?: ActiveStatusEffect,
  source: StatusApplicationSource = {},
): ActiveStatusEffect {
  const damagePerTick = source.damagePerTick ?? existing?.damagePerTick ?? definition.baseDamagePerTick;
  return {
    id: definition.id,
    stacks: Math.min(definition.maxStacks, (existing?.stacks ?? 0) + 1),
    expiresAt: now + definition.durationMs,
    nextTickAt: existing?.nextTickAt ?? now + definition.tickIntervalMs,
    damagePerTick,
    ...(source.sourceWeaponId ?? existing?.sourceWeaponId
      ? { sourceWeaponId: source.sourceWeaponId ?? existing?.sourceWeaponId }
      : {}),
  };
}

export function dueStatusTicks(
  definition: StatusEffectDefinition,
  status: ActiveStatusEffect,
  now: number,
): number {
  if (now < status.nextTickAt) {
    return 0;
  }
  return Math.floor((now - status.nextTickAt) / definition.tickIntervalMs) + 1;
}

export function advanceStatusTicks(
  definition: StatusEffectDefinition,
  status: ActiveStatusEffect,
  ticks: number,
): ActiveStatusEffect {
  return {
    ...status,
    nextTickAt: status.nextTickAt + definition.tickIntervalMs * ticks,
  };
}

export function statusTickDamage(status: ActiveStatusEffect): number {
  return Math.max(1, Math.round(status.damagePerTick * status.stacks));
}

export function fullDurationStatusDamage(
  definition: StatusEffectDefinition,
  status: ActiveStatusEffect,
): number {
  const totalTicks = Math.ceil(definition.durationMs / definition.tickIntervalMs);
  return statusTickDamage(status) * totalTicks;
}

export function isStatusExpired(status: ActiveStatusEffect, now: number): boolean {
  return now >= status.expiresAt;
}
