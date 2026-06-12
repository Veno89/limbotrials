import { describe, expect, it } from 'vitest';
import { ARTIFACTS, getAvailableArtifacts, rollArtifact } from '../data/artifacts';
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
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    const random = seededRandom(19);
    for (let index = 0; index < 4000; index += 1) {
      const artifact = rollArtifact(Object.values(ARTIFACTS), [], random);
      counts[artifact!.rarity] += 1;
    }
    expect(counts.common).toBeGreaterThan(counts.uncommon);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
    expect(counts.rare).toBeGreaterThan(counts.legendary);
  });

  it('applies percentage modifiers with the same factor convention as upgrades', () => {
    const run = new RunState(createDefaultSave());
    expect(run.applyArtifact('winged-sandals')).toBe(true);
    expect(run.stats.moveSpeed).toBeCloseTo(246.4);
    expect(run.applyArtifact('winged-sandals')).toBe(false);
  });

  it('applies typed special effects to current and future weapons', () => {
    const run = new RunState(createDefaultSave());
    expect(run.applyArtifact('extra-pocket')).toBe(true);
    expect(run.getWeaponCap()).toBe(6);

    expect(run.applyArtifact('spectral-pass')).toBe(true);
    expect(run.getWeaponState('bone-scythe').stats.pierce).toBe(1);
    expect(run.addWeapon('soul-bolt')).toBe(true);
    expect(run.getWeaponState('soul-bolt').stats.pierce).toBe(1);
  });
});
