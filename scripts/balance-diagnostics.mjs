import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
});

try {
  const { createBalanceDiagnosticReport } = await server.ssrLoadModule(
    '/src/game/balance/balanceDiagnostics.ts',
  );
  const report = createBalanceDiagnosticReport();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(report.disclaimer);
    console.log('\nBase weapon output');
    console.table(
      report.weapons.map((weapon) => ({
        id: weapon.weaponId,
        damageMin: weapon.connectedDamageRangePerActivation.minimum,
        damageMax: weapon.connectedDamageRangePerActivation.maximum,
        singleTargetDps: weapon.dps.singleTargetExpected,
        maxCoverageDps: weapon.dps.maximumExplicitCoverageExpected,
      })),
    );
    console.log('\nRepresentative enemy time-to-kill (seconds)');
    console.table(
      report.enemyTtk.map((entry) => ({
        weapon: entry.weaponId,
        enemy: entry.enemyId,
        ttk: entry.timeToKillSeconds ?? 'no-output',
        impossible: entry.impossible,
        trivial: entry.trivial,
      })),
    );
    console.log('\nContact-damage intake');
    console.table(
      report.playerDamageIntake.map((entry) => ({
        enemy: entry.enemyId,
        hitsPerMinute: entry.assumedHitsPerMinute,
        damagePerMinute: entry.damagePerMinute,
        healthLostPercent: entry.healthLostPerMinutePercent,
        survivalSeconds: entry.timeToDepleteHealthSeconds ?? 'no-damage',
      })),
    );
    console.log('\nAuthored wave pressure');
    console.table(
      report.authoredWaves.map((wave) => ({
        tier: wave.tierIndex,
        durationSeconds: wave.durationMs / 1000,
        targetPopulation: wave.targetPopulation,
        populationCap: wave.globalPopulationCap,
        spawnCapacityPerMinute: wave.authoredSpawnCapacityPerMinute,
        impossible: wave.impossible,
        trivial: wave.trivial,
      })),
    );
    console.log(`\nUpgrade outlier signals (${report.upgradeValueOutliers.length})`);
    console.table(
      report.upgradeValueOutliers.map((outlier) => ({
        id: outlier.upgradeId,
        direction: outlier.direction,
        signalPercent: outlier.largestModeledSignalPercent,
        thresholdPercent: outlier.thresholdPercent,
      })),
    );
    console.log('\nImpossible/trivial screening flags');
    console.table(
      [...report.flags.impossible, ...report.flags.trivial].map((flag) => ({
        code: flag.code,
        subject: flag.subjectId,
        value: flag.metricValue,
        threshold: flag.threshold,
      })),
    );
  }
} finally {
  await server.close();
}
