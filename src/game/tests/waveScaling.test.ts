import { describe, expect, it } from 'vitest';
import { WAVE_TIERS, getSessionSpawnCount, getWaveTier, selectEnemyFromPool } from '../data/waves';

describe('wave scaling', () => {
  it('starts with a dedicated lost-soul fodder session', () => {
    const tier = getWaveTier(0);
    expect(tier.sessions).toHaveLength(1);
    expect(tier.sessions[0]?.id).toBe('fodder');
    expect(tier.sessions[0]?.enemyPool).toEqual(['lost-soul']);
  });

  it('increases pressure and introduces independently capped specialists', () => {
    const early = getWaveTier(0);
    const late = getWaveTier(800000);
    expect(late.globalPopulationCap).toBeGreaterThan(early.globalPopulationCap);
    expect(late.sessions.find((session) => session.id === 'fodder')?.targetPopulation).toBeGreaterThan(
      early.sessions[0]!.targetPopulation,
    );
    expect(late.sessions.find((session) => session.id === 'caster')?.targetPopulation).toBe(7);
    expect(late.sessions.find((session) => session.id === 'screamer')?.targetPopulation).toBe(4);
  });

  it('replenishes each session without exceeding its target or the global cap', () => {
    const definition = getWaveTier(800000).sessions[0]!;
    expect(getSessionSpawnCount(definition, 0, 0, 160)).toBe(definition.spawnBatchSize);
    expect(getSessionSpawnCount(definition, definition.targetPopulation - 2, 100, 160)).toBe(2);
    expect(getSessionSpawnCount(definition, definition.targetPopulation, 100, 160)).toBe(0);
    expect(getSessionSpawnCount(definition, 0, 159, 160)).toBe(1);
    expect(getSessionSpawnCount(definition, 0, 160, 160)).toBe(0);
  });

  it('uses intermediate tiers to smooth the four- and seven-minute pressure increases', () => {
    expect(getWaveTier(240000).globalPopulationCap).toBe(82);
    expect(getWaveTier(330000).globalPopulationCap).toBe(92);
    expect(getWaveTier(420000).globalPopulationCap).toBe(105);
    expect(getWaveTier(510000).globalPopulationCap).toBe(120);
    const lateSteps = WAVE_TIERS.slice(2).map(
      (tier, index) => tier.globalPopulationCap - WAVE_TIERS[index + 1]!.globalPopulationCap,
    );
    expect(Math.max(...lateSteps)).toBeLessThanOrEqual(15);
  });

  it('introduces stronger enemies before fully retiring the opening fodder', () => {
    const mixedPools = getWaveTier(330000).sessions.flatMap((session) => session.enemyPool);
    expect(mixedPools).toContain('lost-soul');
    expect(mixedPools).toContain('bone-crawler');
    expect(mixedPools).toContain('flayed-wanderer');
    expect(mixedPools).toContain('gravebound-archer');

    const latePools = getWaveTier(600000).sessions.flatMap((session) => session.enemyPool);
    expect(latePools).not.toContain('lost-soul');
    expect(latePools).not.toContain('bone-crawler');
    expect(latePools).toContain('veil-stalker');
    expect(latePools).toContain('lantern-ghost');
  });

  it('varies timed elites by phase and supports deterministic weighted selection', () => {
    expect(getWaveTier(240000).elitePool).toEqual(['condemned-brute']);
    expect(getWaveTier(600000).elitePool).toEqual([
      'sentinel-of-woe',
      'sentinel-of-woe',
      'condemned-brute',
    ]);
    expect(selectEnemyFromPool(['sentinel-of-woe', 'condemned-brute'], () => 0.99)).toBe(
      'condemned-brute',
    );
  });
});
