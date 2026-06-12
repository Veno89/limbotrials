import { BALANCE } from '../config/balanceConfig';
import type { ThreatSnapshot } from '../types/gameTypes';

export interface ThreatInputs {
  elapsedMs: number;
  playerLevel: number;
  weaponCount: number;
  totalWeaponLevels: number;
  evolvedWeaponCount: number;
  threatPowerBonus: number;
}

export interface EnemyThreatScaling {
  healthMultiplier: number;
  damageMultiplier: number;
}

export function calculateThreat(inputs: ThreatInputs): ThreatSnapshot {
  const timeTier = clampTier(Math.floor(inputs.elapsedMs / BALANCE.threatTierDurationMs));
  const powerScore =
    inputs.playerLevel +
    inputs.totalWeaponLevels +
    inputs.evolvedWeaponCount * BALANCE.threatEvolvedWeaponScore +
    Math.max(0, inputs.weaponCount - 1) +
    inputs.threatPowerBonus;
  const powerTier = clampTier(
    Math.floor(
      Math.max(0, powerScore - BALANCE.threatPowerScoreOffset) /
        BALANCE.threatPowerScorePerTier,
    ),
  );
  const tier = Math.max(timeTier, powerTier);
  return {
    tier,
    timeTier,
    powerTier,
    healthMultiplier: roundMultiplier(1 + tier * BALANCE.threatHealthPerTier),
    damageMultiplier: roundMultiplier(1 + tier * BALANCE.threatDamagePerTier),
  };
}

export function enemyThreatScaling(
  threat: ThreatSnapshot,
  isBoss: boolean,
): EnemyThreatScaling {
  return isBoss
    ? { healthMultiplier: 1, damageMultiplier: 1 }
    : {
        healthMultiplier: threat.healthMultiplier,
        damageMultiplier: threat.damageMultiplier,
      };
}

export function scaleThreatDamage(baseDamage: number, multiplier: number): number {
  return Math.max(1, Math.round(baseDamage * multiplier));
}

function clampTier(tier: number): number {
  return Math.max(0, Math.min(BALANCE.maxThreatTier, tier));
}

function roundMultiplier(multiplier: number): number {
  return Math.round(multiplier * 100) / 100;
}
