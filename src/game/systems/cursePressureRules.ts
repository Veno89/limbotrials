import { getCurseTierById } from '../data/curse';
import type { CurseSnapshot, EnemyDefinition } from '../types/gameTypes';

export interface CursePressureProfile {
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  tint?: number;
  alphaMultiplier: number;
}

const NO_CURSE_PRESSURE: CursePressureProfile = {
  healthMultiplier: 1,
  damageMultiplier: 1,
  speedMultiplier: 1,
  alphaMultiplier: 1,
};

const CURSE_TINTS: Record<CurseSnapshot['tier'], number | undefined> = {
  unmarked: undefined,
  touched: 0xb687ed,
  marked: 0xb86dff,
  condemned: 0xd26468,
  forsaken: 0xff3b66,
};

export function cursePressureForEnemy(
  definition: EnemyDefinition,
  snapshot: CurseSnapshot,
): CursePressureProfile {
  if (snapshot.tier === 'unmarked' || snapshot.tier === 'touched') {
    return NO_CURSE_PRESSURE;
  }

  const overcapSteps = Math.min(
    4,
    Math.floor(Math.max(0, snapshot.level - getCurseTierById('forsaken').minCurse) / 25),
  );

  if (definition.boss) {
    return bossPressure(snapshot, overcapSteps);
  }

  if (isCurseGatedEnemy(definition)) {
    return curseGatedPressure(snapshot, overcapSteps);
  }

  return ambientPressure(snapshot, overcapSteps);
}

function isCurseGatedEnemy(definition: EnemyDefinition): boolean {
  return Boolean(definition.spawnRequirements);
}

function curseGatedPressure(snapshot: CurseSnapshot, overcapSteps: number): CursePressureProfile {
  if (snapshot.tier === 'marked') {
    return {
      healthMultiplier: 1.8,
      damageMultiplier: 1.25,
      speedMultiplier: 1.05,
      tint: CURSE_TINTS.marked,
      alphaMultiplier: 1,
    };
  }
  if (snapshot.tier === 'condemned') {
    return {
      healthMultiplier: 2.45,
      damageMultiplier: 1.45,
      speedMultiplier: 1.08,
      tint: CURSE_TINTS.condemned,
      alphaMultiplier: 1,
    };
  }
  return {
    healthMultiplier: Math.min(4, 3.1 + overcapSteps * 0.22),
    damageMultiplier: Math.min(2.05, 1.7 + overcapSteps * 0.06),
    speedMultiplier: 1.12,
    tint: CURSE_TINTS.forsaken,
    alphaMultiplier: 1,
  };
}

function ambientPressure(snapshot: CurseSnapshot, overcapSteps: number): CursePressureProfile {
  if (snapshot.tier === 'marked') {
    return {
      healthMultiplier: 1.04,
      damageMultiplier: 1,
      speedMultiplier: 1,
      tint: undefined,
      alphaMultiplier: 1,
    };
  }
  if (snapshot.tier === 'condemned') {
    return {
      healthMultiplier: 1.12,
      damageMultiplier: 1.06,
      speedMultiplier: 1.02,
      tint: CURSE_TINTS.condemned,
      alphaMultiplier: 0.96,
    };
  }
  return {
    healthMultiplier: Math.min(1.48, 1.24 + overcapSteps * 0.06),
    damageMultiplier: Math.min(1.24, 1.1 + overcapSteps * 0.035),
    speedMultiplier: 1.03,
    tint: CURSE_TINTS.forsaken,
    alphaMultiplier: 0.94,
  };
}

function bossPressure(snapshot: CurseSnapshot, overcapSteps: number): CursePressureProfile {
  if (snapshot.tier === 'marked') {
    return NO_CURSE_PRESSURE;
  }
  if (snapshot.tier === 'condemned') {
    return {
      healthMultiplier: 1.18,
      damageMultiplier: 1.08,
      speedMultiplier: 1,
      tint: CURSE_TINTS.condemned,
      alphaMultiplier: 1,
    };
  }
  return {
    healthMultiplier: Math.min(2, 1.45 + overcapSteps * 0.12),
    damageMultiplier: Math.min(1.36, 1.14 + overcapSteps * 0.045),
    speedMultiplier: 1.03,
    tint: CURSE_TINTS.forsaken,
    alphaMultiplier: 1,
  };
}
