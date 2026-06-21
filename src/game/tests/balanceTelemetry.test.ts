import { describe, expect, it } from 'vitest';
import { BalanceTelemetry } from '../systems/BalanceTelemetry';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';

describe('balance telemetry', () => {
  it('aggregates combat, incoming damage, enemies, choices, and minute pressure', () => {
    const telemetry = new BalanceTelemetry('projectile-evolution');
    telemetry.recordWeaponEquipped('soul-bolt', 0);
    telemetry.recordWeaponHit('soul-bolt', 30, false, true, false, 10000);
    telemetry.recordWeaponHit('soul-bolt', 70, true, false, true, 70000);
    telemetry.recordDamageAttempt('void-orb', true, 15000);
    telemetry.recordDamageAttempt('scream', false, 80000);
    telemetry.recordDamageTaken('scream', 17, 3, 80000);
    telemetry.recordEnemySpawn('screamer', 65000);
    telemetry.recordEnemyDeath('screamer', 4200);
    telemetry.recordOffer('standard', ['stat-vigor', 'stat-movement'], 72000);
    telemetry.recordChoice('standard', 'selected', 72000, 'stat-vigor');
    telemetry.recordChoice('standard', 'rerolled', 73000);
    telemetry.recordCursedReward({
      atMs: 73500,
      sourceKind: 'upgrade',
      sourceId: 'curse-blood-price',
      baseId: 'curse-blood-price',
      generated: false,
      name: 'Blood Price',
      pattern: 'blood-price',
      curseGain: 8,
      downside: 'Maximum health is cut away as payment.',
      warning: 'BLOOD PRICE ACCEPTED',
      curseBefore: 0,
      curseAfter: 8,
      tierBefore: 'unmarked',
      tierAfter: 'touched',
      crossedTiers: ['touched'],
    });
    telemetry.recordPowerupSpawn('grave-frenzy');
    telemetry.recordPowerupCollected('grave-frenzy', 74000);
    telemetry.recordThreat(
      { tier: 2, timeTier: 1, powerTier: 2, healthMultiplier: 1.36, damageMultiplier: 1.12 },
      74000,
    );
    telemetry.recordThreat(
      { tier: 2, timeTier: 2, powerTier: 2, healthMultiplier: 1.36, damageMultiplier: 1.12 },
      90000,
    );
    telemetry.samplePressure(75000, 42, 35, 100);

    const report = telemetry.report(120000);
    expect(report.presetId).toBe('projectile-evolution');
    expect(report.totalDamageDealt).toBe(100);
    expect(report.totalDamageTaken).toBe(17);
    expect(report.perfectDodges).toBe(1);
    expect(report.rerolls).toBe(1);
    expect(report.weaponResults[0]).toMatchObject({
      id: 'soul-bolt',
      hits: 2,
      criticalHits: 1,
      kills: 1,
      bossDamage: 70,
    });
    expect(report.incomingDamage).toContainEqual({
      source: 'void-orb',
      attemptedHits: 1,
      landedHits: 0,
      avoidedHits: 1,
      damage: 0,
      absorbed: 0,
    });
    expect(report.enemyResults[0]).toEqual({
      id: 'screamer',
      spawned: 1,
      killed: 1,
      averageLifetimeMs: 4200,
    });
    expect(report.minutes[1]).toMatchObject({
      damageDealt: 70,
      damageTaken: 17,
      kills: 1,
      enemiesSpawned: 1,
      choicesMade: 1,
      peakEnemies: 42,
      lowestHealthRatio: 0.35,
    });
    expect(report.threatSamples).toEqual([
      {
        atMs: 74000,
        tier: 2,
        timeTier: 1,
        powerTier: 2,
        healthMultiplier: 1.36,
        damageMultiplier: 1.12,
      },
    ]);
    expect(report.cursedRewards).toContainEqual({
      atMs: 73500,
      sourceKind: 'upgrade',
      sourceId: 'curse-blood-price',
      baseId: 'curse-blood-price',
      generated: false,
      name: 'Blood Price',
      pattern: 'blood-price',
      curseGain: 8,
      downside: 'Maximum health is cut away as payment.',
      warning: 'BLOOD PRICE ACCEPTED',
      curseBefore: 0,
      curseAfter: 8,
      tierBefore: 'unmarked',
      tierAfter: 'touched',
      crossedTiers: ['touched'],
    });
    expect(report.timeline).toContainEqual({ atMs: 74000, id: 'threat:tier-2' });
  });

  it('records actual shield absorption and damage through RunState', () => {
    const run = new RunState(createDefaultSave());
    run.shield = 10;
    run.balance.recordDamageAttempt('lost-soul', false, run.elapsedMs);
    const result = run.takeDamage(16, 'lost-soul');
    expect(result).toEqual({ fatal: false, dealt: 6, absorbed: 10 });
    expect(run.summary(false).balance.incomingDamage[0]).toMatchObject({
      source: 'lost-soul',
      damage: 6,
      absorbed: 10,
    });
  });

  it('separates late-run preset clocks from measured sample duration', () => {
    const telemetry = new BalanceTelemetry('scythe-evolution');
    telemetry.setMeasurementStart(180000);
    telemetry.recordWeaponEquipped('bone-scythe', 180000);
    telemetry.recordChoice('preset', 'selected', 180000, 'level-bone-scythe');
    telemetry.recordWeaponHit('bone-scythe', 100, true, false, false, 185000);
    const report = telemetry.report(190000);
    expect(report.measurementDurationMs).toBe(10000);
    expect(report.weaponResults[0]?.dps).toBe(10);
    expect(report.minutes).toHaveLength(1);
    expect(report.minutes[0]?.kills).toBe(1);
    expect(report.minutes[0]?.choicesMade).toBe(0);
  });

  it('reports weapon DPS over the time each weapon was equipped', () => {
    const telemetry = new BalanceTelemetry();
    telemetry.recordWeaponEquipped('bone-scythe', 0);
    telemetry.recordWeaponEquipped('hellfire-sigil', 90000);
    telemetry.recordWeaponHit('bone-scythe', 1200, false, false, false, 120000);
    telemetry.recordWeaponHit('hellfire-sigil', 300, false, false, false, 120000);
    const report = telemetry.report(120000);
    expect(report.weaponResults.find((result) => result.id === 'bone-scythe')?.dps).toBe(10);
    expect(report.weaponResults.find((result) => result.id === 'hellfire-sigil')?.dps).toBe(10);
  });
});
