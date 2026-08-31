import { describe, expect, it } from 'vitest';
import { BOSS_SPAWN_MS } from '../constants';
import {
  BALANCE_DIAGNOSTIC_DISCLAIMER,
  createBalanceDiagnosticReport,
} from '../balance/balanceDiagnostics';

describe('balance diagnostics', () => {
  it('is deterministic and labels its evidence as diagnostic rather than approval', () => {
    const first = createBalanceDiagnosticReport();
    const second = createBalanceDiagnosticReport();

    expect(first).toEqual(second);
    expect(first.classification).toBe('diagnostic-only');
    expect(first.disclaimer).toBe(BALANCE_DIAGNOSTIC_DISCLAIMER);
    expect(first.disclaimer).toContain('not approval');
    expect(first.assumptions.length).toBeGreaterThan(0);
  });

  it('reports theoretical connected damage and expected DPS from authored weapon stats', () => {
    const report = createBalanceDiagnosticReport({ weaponIds: ['soul-bolt', 'tesla-coil'] });
    const soulBolt = report.weapons.find((weapon) => weapon.weaponId === 'soul-bolt');
    const teslaCoil = report.weapons.find((weapon) => weapon.weaponId === 'tesla-coil');

    expect(soulBolt).toMatchObject({
      cooldownMs: 500,
      attacksPerSecond: 2,
      explicitHitOpportunities: 1,
      damagePerConnectedHit: {
        nonCritical: 18,
        critical: 31.5,
        expected: 18.675,
      },
      connectedDamageRangePerActivation: {
        minimum: 18,
        maximum: 31.5,
      },
      dps: {
        singleTargetExpected: 37.35,
        maximumExplicitCoverageExpected: 37.35,
      },
    });
    expect(teslaCoil?.explicitHitOpportunities).toBe(3);
    expect(teslaCoil?.dps.maximumExplicitCoverageExpected).toBeCloseTo(
      (teslaCoil?.dps.singleTargetExpected ?? 0) * 3,
      2,
    );
  });

  it('reports representative enemy TTK and configured contact-damage intake', () => {
    const report = createBalanceDiagnosticReport({
      weaponIds: ['soul-bolt'],
      enemyIds: ['lost-soul'],
      incomingHitsPerMinute: 6,
    });

    expect(report.enemyTtk).toEqual([
      expect.objectContaining({
        weaponId: 'soul-bolt',
        enemyId: 'lost-soul',
        enemyMaxHealth: 32,
        effectiveSingleTargetDps: 37.35,
        timeToKillSeconds: 0.857,
      }),
    ]);
    expect(report.playerDamageIntake).toEqual([
      expect.objectContaining({
        enemyId: 'lost-soul',
        assumedHitsPerMinute: 6,
        damagePerMinute: 36,
        healthLostPerMinutePercent: 36,
        timeToDepleteHealthSeconds: 166.667,
      }),
    ]);
  });

  it('reports authored wave duration, population, and uncapped spawn pressure', () => {
    const report = createBalanceDiagnosticReport();
    const first = report.authoredWaves[0];
    const last = report.authoredWaves.at(-1);

    expect(first).toMatchObject({
      fromMs: 0,
      toMs: 120000,
      durationMs: 120000,
      globalPopulationCap: 42,
      targetPopulation: 32,
      authoredSpawnCapacityPerMinute: 428.571,
      impossible: false,
      trivial: false,
    });
    expect(last?.toMs).toBe(BOSS_SPAWN_MS);
    expect(last?.durationMs).toBe(60000);
    expect(report.authoredWaves.every((wave) => wave.targetPopulation <= wave.globalPopulationCap)).toBe(true);
  });

  it('screens normalized per-stack upgrade signals for outliers without valuing special effects', () => {
    const report = createBalanceDiagnosticReport();
    const projectileUpgrade = report.upgradeValues.find(
      (upgrade) => upgrade.upgradeId === 'soul-bolt-projectiles',
    );
    const projectileOutlier = report.upgradeValueOutliers.find(
      (upgrade) => upgrade.upgradeId === 'soul-bolt-projectiles',
    );

    expect(projectileUpgrade).toMatchObject({
      perStack: true,
      estimatedCoverageDpsDeltaPercent: 100,
      largestModeledSignalPercent: 100,
      components: [
        expect.objectContaining({
          source: 'weapon',
          stat: 'projectileCount',
          before: 1,
          after: 2,
          beneficialDeltaPercent: 100,
        }),
      ],
    });
    expect(projectileOutlier).toMatchObject({
      direction: 'high-positive',
      largestModeledSignalPercent: 100,
      thresholdPercent: 75,
    });
  });

  it('emits explicit impossible and trivial flags at configured screening thresholds', () => {
    const report = createBalanceDiagnosticReport({
      weaponIds: ['soul-bolt'],
      enemyIds: ['lost-soul', 'limbo-warden'],
      thresholds: {
        trivialEnemyTtkSeconds: 1,
        impossibleEnemyTtkSeconds: 100,
      },
    });

    expect(report.flags.trivial).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'enemy-ttk-below-threshold',
          subjectId: 'soul-bolt:lost-soul',
        }),
      ]),
    );
    expect(report.flags.impossible).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'enemy-ttk-exceeds-threshold',
          subjectId: 'soul-bolt:limbo-warden',
        }),
      ]),
    );
    expect(report.summary).toMatchObject({
      hasImpossibleConfigurations: true,
      hasTrivialConfigurations: true,
    });
  });
});
