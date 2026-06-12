import { describe, expect, it } from 'vitest';
import { BOSS_SPAWN_MS, RUN_DURATION_MS } from '../constants';
import { xpRequiredForNextLevel } from '../data/progression';
import { shouldSpawnBoss } from '../data/waves';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';

describe('run progression', () => {
  it('reserves the final minute of the standard trial for the Warden', () => {
    expect(RUN_DURATION_MS).toBe(15 * 60 * 1000);
    expect(BOSS_SPAWN_MS).toBe(14 * 60 * 1000);
    expect(shouldSpawnBoss(BOSS_SPAWN_MS - 1, false)).toBe(false);
    expect(shouldSpawnBoss(BOSS_SPAWN_MS, false)).toBe(true);
    expect(shouldSpawnBoss(BOSS_SPAWN_MS, true)).toBe(false);
  });

  it('uses a predictable square XP curve', () => {
    expect(xpRequiredForNextLevel(1)).toBe(45);
    expect(xpRequiredForNextLevel(10)).toBe(353);
    expect(xpRequiredForNextLevel(20)).toBe(1037);
  });

  it('grants every level represented by a consolidated pickup', () => {
    const run = new RunState(createDefaultSave());
    expect(run.addXp(200)).toBe(3);
    expect(run.level).toBe(4);
    expect(run.xp).toBe(2);
    expect(run.xpToNext).toBe(115);
  });

  it('does not create permanent currency from zero-value fodder drops', () => {
    const run = new RunState(createDefaultSave());
    run.addSouls(0);
    expect(run.souls).toBe(0);
  });

  it('applies Forbidden Tutelage to XP while immediately increasing power threat', () => {
    const run = new RunState(createDefaultSave());
    const threatBefore = run.getThreatSnapshot();

    expect(run.applyUpgrade('stat-forbidden-tutelage')).toBe(true);
    expect(run.stats.xpGain).toBeCloseTo(1.2);
    expect(run.stats.threatPowerBonus).toBe(7);
    expect(run.addXp(10)).toBe(0);
    expect(run.xp).toBeCloseTo(12);
    expect(run.getThreatSnapshot().powerTier).toBeGreaterThanOrEqual(threatBefore.powerTier);
  });
});
