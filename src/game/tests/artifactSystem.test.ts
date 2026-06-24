import { describe, expect, it } from 'vitest';
import { ARTIFACTS, getAvailableArtifacts, rollArtifact } from '../data/artifacts';
import { ENEMIES } from '../data/enemies';
import { mutateArtifactReward } from '../systems/CursedRewardMutationSystem';
import { ArtifactEffectSystem } from '../systems/ArtifactEffectSystem';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('artifact system', () => {
  it('gives every redesigned stat relic a typed runtime identity', () => {
    const flatOnly = Object.values(ARTIFACTS).filter(
      (artifact) => (artifact.modifiers || artifact.weaponModifiers) && !artifact.effect && !artifact.special,
    );
    expect(flatOnly).toEqual([]);
  });

  it('filters locked tiers and never rolls an owned artifact', () => {
    const save = createDefaultSave();
    const available = getAvailableArtifacts(save);
    expect(available.every((artifact) => artifact.poolTier === 'base')).toBe(true);
    expect(available).not.toContain(ARTIFACTS['cursed-hourglass']);

    const owned = available.slice(0, -1).map((artifact) => artifact.id);
    expect(rollArtifact(available, owned, () => 0)?.id).toBe(available.at(-1)?.id);
  });

  it('returns null when no valid artifact remains', () => {
    const available = [ARTIFACTS['pendant-of-vigor']];
    expect(rollArtifact(available, ['pendant-of-vigor'])).toBeNull();
    expect(rollArtifact([], [])).toBeNull();
  });

  it('keeps the configured rarity ordering across repeated rolls', () => {
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const random = seededRandom(19);
    for (let index = 0; index < 4000; index += 1) {
      const artifact = rollArtifact(Object.values(ARTIFACTS), [], random);
      counts[artifact!.rarity] += 1;
    }
    expect(counts.common).toBeGreaterThan(counts.uncommon);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
    expect(counts.rare).toBeGreaterThan(counts.epic);
    expect(counts.epic).toBeGreaterThan(counts.legendary);
  });

  it('applies percentage modifiers with the same factor convention as upgrades', () => {
    const run = new RunState(createDefaultSave());
    expect(run.artifacts.apply('winged-sandals')).toBe(true);
    expect(run.stats.current.moveSpeed).toBeCloseTo(242);
    expect(run.artifacts.apply('winged-sandals')).toBe(false);
  });

  it('runs typed artifact effects from the central artifact effect system', () => {
    const run = new RunState(createDefaultSave());
    const effect = artifactEffects(run);
    expect(run.artifacts.apply('pendant-of-vigor')).toBe(true);
    effect.onArtifactGained(ARTIFACTS['pendant-of-vigor'].effect);
    expect(run.resources.shield).toBe(35);

    expect(run.artifacts.apply('winged-sandals')).toBe(true);
    effect.onDash();
    expect(effect.reducedCooldowns).toBe(220);

    expect(run.artifacts.apply('magnet-stone')).toBe(true);
    for (let index = 0; index < 5; index += 1) {
      effect.onPickupCollected(1, 1);
    }
    expect(run.resources.souls).toBe(3);
  });

  it('lets blood vial heal through enemy-death hooks', () => {
    const run = new RunState(createDefaultSave());
    const effect = artifactEffects(run);
    expect(run.artifacts.apply('blood-vial')).toBe(true);
    run.resources.health = 50;

    for (let index = 0; index < 10; index += 1) {
      effect.onEnemyDeath({ x: 0, y: 0, lifetimeMs: 1000, definition: ENEMIES['lost-soul'] });
    }

    expect(run.resources.health).toBe(54);
  });

  it('applies typed special effects to current and future weapons', () => {
    const run = new RunState(createDefaultSave());
    expect(run.artifacts.apply('extra-pocket')).toBe(true);
    expect(run.weapons.cap).toBe(6);

    expect(run.artifacts.apply('spectral-pass')).toBe(true);
    expect(run.weapons.getState('bone-scythe').stats.pierce).toBe(1);
    expect(run.weapons.add('soul-bolt')).toBe(true);
    expect(run.weapons.getState('soul-bolt').stats.pierce).toBe(1);
  });

  it('records generated cursed artifact rewards as structured analytics', () => {
    const run = new RunState(createDefaultSave());
    run.curse.gain(50, 'test');
    const reward = mutateArtifactReward(ARTIFACTS['winged-sandals'], run.curse.snapshot(), () => 0);

    expect(run.artifacts.applyReward(reward).applied).toBe(true);

    expect(run.summary(false).balance.cursedRewards[0]).toMatchObject({
      sourceKind: 'artifact',
      sourceId: 'winged-sandals',
      baseId: 'winged-sandals',
      generated: true,
      name: 'Cursed Winged Sandals',
      pattern: 'reliquary-oath',
      curseGain: 12,
      curseBefore: 50,
      curseAfter: 62,
      tierBefore: 'condemned',
      tierAfter: 'condemned',
      crossedTiers: [],
    });
  });
});

function artifactEffects(run: RunState): ArtifactEffectSystem & { reducedCooldowns: number } {
  let reducedCooldowns = 0;
  const effect = new ArtifactEffectSystem(
    run,
    {
      warning: () => undefined,
      ring: () => undefined,
    },
    {
      reduceWeaponCooldowns: (milliseconds) => {
        reducedCooldowns += milliseconds;
      },
      collectAllPickups: () => undefined,
      grantPowerup: () => undefined,
      spawnPowerup: () => undefined,
      playerPosition: () => ({ x: 0, y: 0 }),
    },
  ) as ArtifactEffectSystem & { reducedCooldowns: number };
  Object.defineProperty(effect, 'reducedCooldowns', { get: () => reducedCooldowns });
  return effect;
}
