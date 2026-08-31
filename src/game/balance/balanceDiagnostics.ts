import { BOSS_SPAWN_MS, RUN_DURATION_MS } from '../constants';
import { ENEMIES } from '../data/enemies';
import { UPGRADES } from '../data/upgrades';
import { WAVE_TIERS } from '../data/waves';
import { WEAPONS } from '../data/weapons';
import type {
  EnemyId,
  PlayerStats,
  UpgradeDefinition,
  UpgradeId,
  WeaponDefinition,
  WeaponId,
  WeaponStats,
} from '../types/gameTypes';
import { applyStatModifiers, applyWeaponModifiers, BASE_PLAYER_STATS } from '../utils/statModifiers';

export const BALANCE_DIAGNOSTIC_DISCLAIMER =
  'Deterministic theoretical diagnostics only; this report is not approval that the game is fun or balanced.';

export const DEFAULT_DIAGNOSTIC_WEAPON_IDS = [
  'bone-scythe',
  'soul-bolt',
  'grave-lance',
  'poison-flask',
  'tesla-coil',
] as const satisfies readonly WeaponId[];

export const DEFAULT_DIAGNOSTIC_ENEMY_IDS = [
  'lost-soul',
  'limbo-knight',
  'condemned-brute',
  'limbo-warden',
] as const satisfies readonly EnemyId[];

export interface BalanceDiagnosticThresholds {
  trivialEnemyTtkSeconds: number;
  impossibleEnemyTtkSeconds: number;
  minimumPlayerSurvivalSeconds: number;
  trivialWaveTargetPopulation: number;
  upgradeOutlierPercent: number;
}

export const DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS: Readonly<BalanceDiagnosticThresholds> = {
  trivialEnemyTtkSeconds: 0.5,
  impossibleEnemyTtkSeconds: RUN_DURATION_MS / 1000,
  minimumPlayerSurvivalSeconds: 10,
  trivialWaveTargetPopulation: 0,
  upgradeOutlierPercent: 75,
};

export interface BalanceDiagnosticOptions {
  weaponIds?: readonly WeaponId[];
  enemyIds?: readonly EnemyId[];
  playerStats?: Readonly<Partial<PlayerStats>>;
  incomingHitsPerMinute?: number;
  thresholds?: Readonly<Partial<BalanceDiagnosticThresholds>>;
}

export interface WeaponDamageDiagnostic {
  weaponId: WeaponId;
  weaponName: string;
  cooldownMs: number;
  attacksPerSecond: number;
  explicitHitOpportunities: number;
  damagePerConnectedHit: {
    nonCritical: number;
    critical: number;
    expected: number;
  };
  connectedDamageRangePerActivation: {
    minimum: number;
    maximum: number;
  };
  dps: {
    singleTargetExpected: number;
    maximumExplicitCoverageExpected: number;
  };
}

export interface EnemyTtkDiagnostic {
  weaponId: WeaponId;
  enemyId: EnemyId;
  enemyName: string;
  enemyMaxHealth: number;
  effectiveSingleTargetDps: number;
  timeToKillSeconds: number | null;
  impossible: boolean;
  trivial: boolean;
}

export interface PlayerDamageIntakeDiagnostic {
  enemyId: EnemyId;
  enemyName: string;
  contactDamage: number;
  assumedHitsPerMinute: number;
  damagePerMinute: number;
  healthLostPerMinutePercent: number;
  timeToDepleteHealthSeconds: number | null;
  impossible: boolean;
}

export interface WaveSessionPressureDiagnostic {
  sessionId: string;
  targetPopulation: number;
  spawnBatchSize: number;
  spawnEveryMs: number;
  authoredSpawnCapacityPerMinute: number;
}

export interface WavePressureDiagnostic {
  tierIndex: number;
  fromMs: number;
  toMs: number;
  durationMs: number;
  globalPopulationCap: number;
  targetPopulation: number;
  populationUtilizationPercent: number | null;
  authoredSpawnCapacityPerMinute: number;
  sessions: WaveSessionPressureDiagnostic[];
  impossible: boolean;
  trivial: boolean;
}

export interface UpgradeValueComponentDiagnostic {
  source: 'player' | 'weapon';
  stat: string;
  before: number;
  after: number;
  beneficialDeltaPercent: number;
}

export interface UpgradeValueDiagnostic {
  upgradeId: UpgradeId;
  upgradeName: string;
  category: UpgradeDefinition['category'];
  targetWeapon?: WeaponId;
  perStack: true;
  components: UpgradeValueComponentDiagnostic[];
  estimatedCoverageDpsDeltaPercent: number | null;
  estimatedPlayerOffenseDeltaPercent: number | null;
  modeledNetPercent: number;
  largestModeledSignalPercent: number;
  unmodeledEffects: string[];
}

export interface UpgradeValueOutlier {
  upgradeId: UpgradeId;
  upgradeName: string;
  direction: 'high-positive' | 'high-negative' | 'tradeoff';
  largestModeledSignalPercent: number;
  thresholdPercent: number;
  reason: string;
}

export type BalanceDiagnosticFlagCode =
  | 'non-positive-weapon-output'
  | 'enemy-ttk-exceeds-threshold'
  | 'enemy-ttk-below-threshold'
  | 'player-survival-below-threshold'
  | 'wave-target-exceeds-cap'
  | 'wave-duration-not-positive'
  | 'wave-spawn-cadence-not-positive'
  | 'wave-pressure-below-threshold';

export interface BalanceDiagnosticFlag {
  code: BalanceDiagnosticFlagCode;
  scope: 'weapon' | 'enemy-ttk' | 'player-intake' | 'wave';
  subjectId: string;
  metricValue: number | null;
  threshold: number | null;
  message: string;
}

export interface BalanceDiagnosticReport {
  classification: 'diagnostic-only';
  disclaimer: string;
  assumptions: string[];
  inputs: {
    weaponIds: WeaponId[];
    enemyIds: EnemyId[];
    incomingHitsPerMinute: number;
    playerMaxHealth: number;
    thresholds: BalanceDiagnosticThresholds;
  };
  weapons: WeaponDamageDiagnostic[];
  enemyTtk: EnemyTtkDiagnostic[];
  playerDamageIntake: PlayerDamageIntakeDiagnostic[];
  authoredWaves: WavePressureDiagnostic[];
  upgradeValues: UpgradeValueDiagnostic[];
  upgradeValueOutliers: UpgradeValueOutlier[];
  flags: {
    impossible: BalanceDiagnosticFlag[];
    trivial: BalanceDiagnosticFlag[];
  };
  summary: {
    hasImpossibleConfigurations: boolean;
    hasTrivialConfigurations: boolean;
    upgradeOutlierCount: number;
  };
}

interface WeaponOutput {
  attacksPerSecond: number;
  explicitHitOpportunities: number;
  nonCriticalDamage: number;
  criticalDamage: number;
  expectedDamage: number;
  singleTargetExpectedDps: number;
  maximumExplicitCoverageExpectedDps: number;
}

const LOWER_IS_BETTER_STATS = new Set(['cooldownMs', 'dashCooldown', 'threatPowerBonus']);

const STAT_NORMALIZERS: Readonly<Record<string, number>> = {
  critChance: 1,
  critDamage: 1,
  soulShardChance: 1,
  shieldInterval: 10000,
  threatPowerBonus: 28,
};

export function createBalanceDiagnosticReport(options: BalanceDiagnosticOptions = {}): BalanceDiagnosticReport {
  const thresholds = normalizeThresholds(options.thresholds);
  const incomingHitsPerMinute = nonNegativeFinite(options.incomingHitsPerMinute, 6);
  const playerStats: PlayerStats = { ...BASE_PLAYER_STATS, ...options.playerStats };
  const weaponIds = unique(options.weaponIds ?? DEFAULT_DIAGNOSTIC_WEAPON_IDS);
  const enemyIds = unique(options.enemyIds ?? DEFAULT_DIAGNOSTIC_ENEMY_IDS);

  const weapons = weaponIds.map((weaponId) => analyzeWeapon(WEAPONS[weaponId], playerStats));
  const enemyTtk = analyzeEnemyTtk(weapons, enemyIds, playerStats, thresholds);
  const playerDamageIntake = analyzePlayerDamageIntake(
    enemyIds,
    playerStats,
    incomingHitsPerMinute,
    thresholds,
  );
  const authoredWaves = analyzeAuthoredWaves(thresholds);
  const upgradeValues = Object.values(UPGRADES)
    .map((upgrade) => analyzeUpgradeValue(upgrade))
    .sort((left, right) => compareIds(left.upgradeId, right.upgradeId));
  const upgradeValueOutliers = findUpgradeValueOutliers(upgradeValues, thresholds.upgradeOutlierPercent);

  const impossible = collectImpossibleFlags(weapons, enemyTtk, playerDamageIntake, authoredWaves, thresholds);
  const trivial = collectTrivialFlags(enemyTtk, authoredWaves, thresholds);

  return {
    classification: 'diagnostic-only',
    disclaimer: BALANCE_DIAGNOSTIC_DISCLAIMER,
    assumptions: [
      'Weapon output uses current base weapon stats and supplied player stats; evolutions, damage-over-time, geometry, behavior-specific effects, synergies, and conditional bonuses are not simulated.',
      'Maximum explicit coverage assumes every authored projectile, pierce opportunity, and explicit target slot connects; it is an upper-bound signal, not observed combat damage.',
      'Enemy time-to-kill is a continuous health divided by expected single-target DPS estimate.',
      'Player intake includes contact damage only at the configured hits-per-minute assumption; armor, healing, shields, knockback, and invulnerability windows are omitted.',
      'Wave spawn capacity is authored batch throughput before population caps, kill rate, pathing, and frame-time effects.',
      'Upgrade values are per-stack normalized modifier signals. Special effects and interactions listed as unmodeled are not assigned numeric value.',
    ],
    inputs: {
      weaponIds,
      enemyIds,
      incomingHitsPerMinute,
      playerMaxHealth: round(nonNegativeFinite(playerStats.maxHealth, 0)),
      thresholds,
    },
    weapons,
    enemyTtk,
    playerDamageIntake,
    authoredWaves,
    upgradeValues,
    upgradeValueOutliers,
    flags: { impossible, trivial },
    summary: {
      hasImpossibleConfigurations: impossible.length > 0,
      hasTrivialConfigurations: trivial.length > 0,
      upgradeOutlierCount: upgradeValueOutliers.length,
    },
  };
}

function analyzeWeapon(definition: WeaponDefinition, playerStats: PlayerStats): WeaponDamageDiagnostic {
  const output = calculateWeaponOutput(definition.baseStats, playerStats);
  return {
    weaponId: definition.id,
    weaponName: definition.name,
    cooldownMs: round(definition.baseStats.cooldownMs),
    attacksPerSecond: round(output.attacksPerSecond),
    explicitHitOpportunities: output.explicitHitOpportunities,
    damagePerConnectedHit: {
      nonCritical: round(output.nonCriticalDamage),
      critical: round(output.criticalDamage),
      expected: round(output.expectedDamage),
    },
    connectedDamageRangePerActivation: {
      minimum: round(output.nonCriticalDamage),
      maximum: round(output.criticalDamage * output.explicitHitOpportunities),
    },
    dps: {
      singleTargetExpected: round(output.singleTargetExpectedDps),
      maximumExplicitCoverageExpected: round(output.maximumExplicitCoverageExpectedDps),
    },
  };
}

function calculateWeaponOutput(stats: WeaponStats, playerStats: PlayerStats): WeaponOutput {
  const damageMultiplier = nonNegativeFinite(playerStats.damage, 0);
  const attackSpeed = nonNegativeFinite(playerStats.attackSpeed, 0);
  const baseDamage = nonNegativeFinite(stats.damage, 0) * damageMultiplier;
  const critChance = clamp(
    nonNegativeFinite(playerStats.critChance, 0) + nonNegativeFinite(stats.critChance, 0),
    0,
    1,
  );
  const critMultiplier = Math.max(
    1,
    nonNegativeFinite(playerStats.critDamage, 1) + nonNegativeFinite(stats.critDamage, 0),
  );
  const criticalDamage = baseDamage * critMultiplier;
  const expectedDamage = baseDamage + (criticalDamage - baseDamage) * critChance;
  const cooldownMs = nonNegativeFinite(stats.cooldownMs, 0);
  const attacksPerSecond = cooldownMs > 0 ? (attackSpeed * 1000) / cooldownMs : 0;
  const explicitHitOpportunities =
    positiveInteger(stats.projectileCount) *
    (nonNegativeInteger(stats.pierce) + 1) *
    positiveInteger(stats.targetCount);
  const singleTargetExpectedDps = expectedDamage * attacksPerSecond;

  return {
    attacksPerSecond,
    explicitHitOpportunities,
    nonCriticalDamage: baseDamage,
    criticalDamage,
    expectedDamage,
    singleTargetExpectedDps,
    maximumExplicitCoverageExpectedDps: singleTargetExpectedDps * explicitHitOpportunities,
  };
}

function analyzeEnemyTtk(
  weapons: readonly WeaponDamageDiagnostic[],
  enemyIds: readonly EnemyId[],
  playerStats: PlayerStats,
  thresholds: BalanceDiagnosticThresholds,
): EnemyTtkDiagnostic[] {
  const bossDamage = nonNegativeFinite(playerStats.bossDamage, 0);
  const diagnostics: EnemyTtkDiagnostic[] = [];

  for (const weapon of weapons) {
    for (const enemyId of enemyIds) {
      const enemy = ENEMIES[enemyId];
      const effectiveDps = weapon.dps.singleTargetExpected * (enemy.boss ? bossDamage : 1);
      const timeToKillSeconds = effectiveDps > 0 ? round(enemy.maxHealth / effectiveDps) : null;
      diagnostics.push({
        weaponId: weapon.weaponId,
        enemyId,
        enemyName: enemy.name,
        enemyMaxHealth: enemy.maxHealth,
        effectiveSingleTargetDps: round(effectiveDps),
        timeToKillSeconds,
        impossible: timeToKillSeconds === null || timeToKillSeconds > thresholds.impossibleEnemyTtkSeconds,
        trivial: timeToKillSeconds !== null && timeToKillSeconds <= thresholds.trivialEnemyTtkSeconds,
      });
    }
  }

  return diagnostics;
}

function analyzePlayerDamageIntake(
  enemyIds: readonly EnemyId[],
  playerStats: PlayerStats,
  incomingHitsPerMinute: number,
  thresholds: BalanceDiagnosticThresholds,
): PlayerDamageIntakeDiagnostic[] {
  const maxHealth = nonNegativeFinite(playerStats.maxHealth, 0);
  return enemyIds.map((enemyId) => {
    const enemy = ENEMIES[enemyId];
    const damagePerMinute = nonNegativeFinite(enemy.contactDamage, 0) * incomingHitsPerMinute;
    const timeToDepleteHealthSeconds = damagePerMinute > 0 ? round((maxHealth / damagePerMinute) * 60) : null;
    return {
      enemyId,
      enemyName: enemy.name,
      contactDamage: enemy.contactDamage,
      assumedHitsPerMinute: incomingHitsPerMinute,
      damagePerMinute: round(damagePerMinute),
      healthLostPerMinutePercent: maxHealth > 0 ? round((damagePerMinute / maxHealth) * 100) : 0,
      timeToDepleteHealthSeconds,
      impossible:
        timeToDepleteHealthSeconds !== null &&
        timeToDepleteHealthSeconds <= thresholds.minimumPlayerSurvivalSeconds,
    };
  });
}

function analyzeAuthoredWaves(thresholds: BalanceDiagnosticThresholds): WavePressureDiagnostic[] {
  return WAVE_TIERS.map((tier, tierIndex) => {
    const toMs = WAVE_TIERS[tierIndex + 1]?.fromMs ?? BOSS_SPAWN_MS;
    const sessions = tier.sessions.map((spawnSession) => ({
      sessionId: spawnSession.id,
      targetPopulation: spawnSession.targetPopulation,
      spawnBatchSize: spawnSession.spawnBatchSize,
      spawnEveryMs: spawnSession.spawnEveryMs,
      authoredSpawnCapacityPerMinute:
        spawnSession.spawnEveryMs > 0
          ? round((spawnSession.spawnBatchSize * 60000) / spawnSession.spawnEveryMs)
          : 0,
    }));
    const targetPopulation = sessions.reduce((total, spawnSession) => total + spawnSession.targetPopulation, 0);
    const authoredSpawnCapacityPerMinute = sessions.reduce(
      (total, spawnSession) => total + spawnSession.authoredSpawnCapacityPerMinute,
      0,
    );
    const durationMs = toMs - tier.fromMs;
    const hasInvalidCadence = sessions.some((spawnSession) => spawnSession.spawnEveryMs <= 0);

    return {
      tierIndex,
      fromMs: tier.fromMs,
      toMs,
      durationMs,
      globalPopulationCap: tier.globalPopulationCap,
      targetPopulation,
      populationUtilizationPercent:
        tier.globalPopulationCap > 0 ? round((targetPopulation / tier.globalPopulationCap) * 100) : null,
      authoredSpawnCapacityPerMinute: round(authoredSpawnCapacityPerMinute),
      sessions,
      impossible:
        durationMs <= 0 || hasInvalidCadence || targetPopulation > tier.globalPopulationCap,
      trivial:
        targetPopulation <= thresholds.trivialWaveTargetPopulation || authoredSpawnCapacityPerMinute <= 0,
    };
  });
}

function analyzeUpgradeValue(upgrade: UpgradeDefinition): UpgradeValueDiagnostic {
  const components: UpgradeValueComponentDiagnostic[] = [];
  let estimatedCoverageDpsDeltaPercent: number | null = null;
  let estimatedPlayerOffenseDeltaPercent: number | null = null;

  if (upgrade.modifiers?.length) {
    const beforeOffense = playerOffenseFactor(BASE_PLAYER_STATS);
    const playerStats = { ...BASE_PLAYER_STATS };
    for (const modifier of upgrade.modifiers) {
      const before = playerStats[modifier.stat];
      applyStatModifiers(playerStats, [modifier]);
      const after = playerStats[modifier.stat];
      components.push({
        source: 'player',
        stat: modifier.stat,
        before: round(before),
        after: round(after),
        beneficialDeltaPercent: normalizedBeneficialDelta(modifier.stat, before, after),
      });
    }
    estimatedPlayerOffenseDeltaPercent = percentageChange(beforeOffense, playerOffenseFactor(playerStats));
  }

  if (upgrade.weaponModifiers?.length && upgrade.targetWeapon) {
    const weapon = WEAPONS[upgrade.targetWeapon];
    const baseStats = { ...weapon.baseStats };
    const weaponStats = { ...weapon.baseStats };
    const beforeCoverageDps = calculateWeaponOutput(baseStats, BASE_PLAYER_STATS).maximumExplicitCoverageExpectedDps;
    for (const modifier of upgrade.weaponModifiers) {
      const before = weaponStats[modifier.stat];
      applyWeaponModifiers(weaponStats, [modifier], baseStats);
      const after = weaponStats[modifier.stat];
      components.push({
        source: 'weapon',
        stat: modifier.stat,
        before: round(before),
        after: round(after),
        beneficialDeltaPercent: normalizedBeneficialDelta(modifier.stat, before, after),
      });
    }
    const afterCoverageDps = calculateWeaponOutput(weaponStats, BASE_PLAYER_STATS).maximumExplicitCoverageExpectedDps;
    estimatedCoverageDpsDeltaPercent = percentageChange(beforeCoverageDps, afterCoverageDps);
  }

  const signals = components.map((component) => component.beneficialDeltaPercent);
  if (estimatedCoverageDpsDeltaPercent !== null) signals.push(estimatedCoverageDpsDeltaPercent);
  if (estimatedPlayerOffenseDeltaPercent !== null) signals.push(estimatedPlayerOffenseDeltaPercent);

  return {
    upgradeId: upgrade.id,
    upgradeName: upgrade.name,
    category: upgrade.category,
    ...(upgrade.targetWeapon ? { targetWeapon: upgrade.targetWeapon } : {}),
    perStack: true,
    components,
    estimatedCoverageDpsDeltaPercent,
    estimatedPlayerOffenseDeltaPercent,
    modeledNetPercent: round(components.reduce((total, component) => total + component.beneficialDeltaPercent, 0)),
    largestModeledSignalPercent: round(signals.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0)),
    unmodeledEffects: collectUnmodeledEffects(upgrade),
  };
}

function findUpgradeValueOutliers(
  upgrades: readonly UpgradeValueDiagnostic[],
  thresholdPercent: number,
): UpgradeValueOutlier[] {
  return upgrades
    .filter((upgrade) => upgrade.largestModeledSignalPercent >= thresholdPercent)
    .map((upgrade) => {
      const signalValues = upgrade.components.map((component) => component.beneficialDeltaPercent);
      if (upgrade.estimatedCoverageDpsDeltaPercent !== null) {
        signalValues.push(upgrade.estimatedCoverageDpsDeltaPercent);
      }
      if (upgrade.estimatedPlayerOffenseDeltaPercent !== null) {
        signalValues.push(upgrade.estimatedPlayerOffenseDeltaPercent);
      }
      const hasPositive = signalValues.some((value) => value > 0);
      const hasNegative = signalValues.some((value) => value < 0);
      const direction = hasPositive && hasNegative ? 'tradeoff' : hasNegative ? 'high-negative' : 'high-positive';
      return {
        upgradeId: upgrade.upgradeId,
        upgradeName: upgrade.upgradeName,
        direction,
        largestModeledSignalPercent: upgrade.largestModeledSignalPercent,
        thresholdPercent,
        reason: `At least one normalized per-stack signal is ${upgrade.largestModeledSignalPercent}% versus the configured ${thresholdPercent}% screening threshold.`,
      };
    });
}

function collectImpossibleFlags(
  weapons: readonly WeaponDamageDiagnostic[],
  enemyTtk: readonly EnemyTtkDiagnostic[],
  playerDamageIntake: readonly PlayerDamageIntakeDiagnostic[],
  authoredWaves: readonly WavePressureDiagnostic[],
  thresholds: BalanceDiagnosticThresholds,
): BalanceDiagnosticFlag[] {
  const flags: BalanceDiagnosticFlag[] = [];

  for (const weapon of weapons) {
    if (weapon.dps.singleTargetExpected <= 0) {
      flags.push({
        code: 'non-positive-weapon-output',
        scope: 'weapon',
        subjectId: weapon.weaponId,
        metricValue: weapon.dps.singleTargetExpected,
        threshold: 0,
        message: `${weapon.weaponName} has no positive theoretical single-target output in this scenario.`,
      });
    }
  }

  for (const diagnostic of enemyTtk) {
    if (!diagnostic.impossible) continue;
    flags.push({
      code: 'enemy-ttk-exceeds-threshold',
      scope: 'enemy-ttk',
      subjectId: `${diagnostic.weaponId}:${diagnostic.enemyId}`,
      metricValue: diagnostic.timeToKillSeconds,
      threshold: thresholds.impossibleEnemyTtkSeconds,
      message:
        diagnostic.timeToKillSeconds === null
          ? `${diagnostic.weaponId} cannot produce positive theoretical DPS against ${diagnostic.enemyName}.`
          : `${diagnostic.weaponId} needs ${diagnostic.timeToKillSeconds}s of continuous base-output damage against ${diagnostic.enemyName}.`,
    });
  }

  for (const diagnostic of playerDamageIntake) {
    if (!diagnostic.impossible) continue;
    flags.push({
      code: 'player-survival-below-threshold',
      scope: 'player-intake',
      subjectId: diagnostic.enemyId,
      metricValue: diagnostic.timeToDepleteHealthSeconds,
      threshold: thresholds.minimumPlayerSurvivalSeconds,
      message: `${diagnostic.enemyName} contact damage depletes the modeled player health inside the configured minimum survival window.`,
    });
  }

  for (const wave of authoredWaves) {
    if (wave.targetPopulation > wave.globalPopulationCap) {
      flags.push({
        code: 'wave-target-exceeds-cap',
        scope: 'wave',
        subjectId: String(wave.tierIndex),
        metricValue: wave.targetPopulation,
        threshold: wave.globalPopulationCap,
        message: `Wave tier ${wave.tierIndex} targets more enemies than its global population cap can hold.`,
      });
    }
    if (wave.durationMs <= 0) {
      flags.push({
        code: 'wave-duration-not-positive',
        scope: 'wave',
        subjectId: String(wave.tierIndex),
        metricValue: wave.durationMs,
        threshold: 0,
        message: `Wave tier ${wave.tierIndex} has no positive authored duration.`,
      });
    }
    for (const spawnSession of wave.sessions) {
      if (spawnSession.spawnEveryMs > 0) continue;
      flags.push({
        code: 'wave-spawn-cadence-not-positive',
        scope: 'wave',
        subjectId: `${wave.tierIndex}:${spawnSession.sessionId}`,
        metricValue: spawnSession.spawnEveryMs,
        threshold: 0,
        message: `Wave tier ${wave.tierIndex} session ${spawnSession.sessionId} has no positive spawn cadence.`,
      });
    }
  }

  return flags;
}

function collectTrivialFlags(
  enemyTtk: readonly EnemyTtkDiagnostic[],
  authoredWaves: readonly WavePressureDiagnostic[],
  thresholds: BalanceDiagnosticThresholds,
): BalanceDiagnosticFlag[] {
  const flags: BalanceDiagnosticFlag[] = [];

  for (const diagnostic of enemyTtk) {
    if (!diagnostic.trivial) continue;
    flags.push({
      code: 'enemy-ttk-below-threshold',
      scope: 'enemy-ttk',
      subjectId: `${diagnostic.weaponId}:${diagnostic.enemyId}`,
      metricValue: diagnostic.timeToKillSeconds,
      threshold: thresholds.trivialEnemyTtkSeconds,
      message: `${diagnostic.weaponId} defeats ${diagnostic.enemyName} inside the configured trivial TTK threshold.`,
    });
  }

  for (const wave of authoredWaves) {
    if (!wave.trivial) continue;
    flags.push({
      code: 'wave-pressure-below-threshold',
      scope: 'wave',
      subjectId: String(wave.tierIndex),
      metricValue: wave.targetPopulation,
      threshold: thresholds.trivialWaveTargetPopulation,
      message: `Wave tier ${wave.tierIndex} is at or below the configured trivial population threshold, or has no spawn throughput.`,
    });
  }

  return flags;
}

function normalizedBeneficialDelta(stat: string, before: number, after: number): number {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === after) return 0;
  if (stat === 'shieldInterval') {
    if (before <= 0 && after > 0) return 100;
    if (before > 0 && after <= 0) return -100;
  }

  const denominator = STAT_NORMALIZERS[stat] ?? Math.max(Math.abs(before), 1);
  const rawPercent = ((after - before) / denominator) * 100;
  return round(LOWER_IS_BETTER_STATS.has(stat) ? -rawPercent : rawPercent);
}

function playerOffenseFactor(stats: PlayerStats): number {
  const critChance = clamp(nonNegativeFinite(stats.critChance, 0), 0, 1);
  const critMultiplier = Math.max(1, nonNegativeFinite(stats.critDamage, 1));
  const expectedCritFactor = 1 + critChance * (critMultiplier - 1);
  return nonNegativeFinite(stats.damage, 0) * nonNegativeFinite(stats.attackSpeed, 0) * expectedCritFactor;
}

function collectUnmodeledEffects(upgrade: UpgradeDefinition): string[] {
  const effects: string[] = [];
  if (upgrade.weaponEffect) effects.push(`weapon-effect:${upgrade.weaponEffect}`);
  if (upgrade.conditionalEffect) effects.push(`conditional-effect:${upgrade.conditionalEffect}`);
  if (upgrade.unlockWeapon) effects.push(`weapon-unlock:${upgrade.unlockWeapon}`);
  if (upgrade.curse) effects.push('curse-reward-and-downside');
  if (upgrade.category === 'weapon-evolution') effects.push('evolved-behavior');
  return effects;
}

function normalizeThresholds(
  overrides: Readonly<Partial<BalanceDiagnosticThresholds>> | undefined,
): BalanceDiagnosticThresholds {
  return {
    trivialEnemyTtkSeconds: nonNegativeFinite(
      overrides?.trivialEnemyTtkSeconds,
      DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS.trivialEnemyTtkSeconds,
    ),
    impossibleEnemyTtkSeconds: nonNegativeFinite(
      overrides?.impossibleEnemyTtkSeconds,
      DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS.impossibleEnemyTtkSeconds,
    ),
    minimumPlayerSurvivalSeconds: nonNegativeFinite(
      overrides?.minimumPlayerSurvivalSeconds,
      DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS.minimumPlayerSurvivalSeconds,
    ),
    trivialWaveTargetPopulation: nonNegativeFinite(
      overrides?.trivialWaveTargetPopulation,
      DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS.trivialWaveTargetPopulation,
    ),
    upgradeOutlierPercent: nonNegativeFinite(
      overrides?.upgradeOutlierPercent,
      DEFAULT_BALANCE_DIAGNOSTIC_THRESHOLDS.upgradeOutlierPercent,
    ),
  };
}

function percentageChange(before: number, after: number): number {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === 0) return 0;
  return round(((after - before) / Math.abs(before)) * 100);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function positiveInteger(value: number): number {
  return Math.max(1, Math.floor(nonNegativeFinite(value, 1)));
}

function nonNegativeInteger(value: number): number {
  return Math.max(0, Math.floor(nonNegativeFinite(value, 0)));
}

function nonNegativeFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
