import { describe, expect, it } from 'vitest';
import { checkCharacterUnlocks } from '../data/characters';
import { RunState } from '../systems/RunState';
import { createDefaultSave } from '../systems/SaveSystem';

describe('character system', () => {
  it('starts with only Haunted unlocked', () => {
    const save = createDefaultSave();
    expect(save.unlockedCharacters).toEqual(['haunted']);
    expect(new RunState(save).characterId).toBe('haunted');
  });

  it('applies character stats and starter weapons before run progression', () => {
    const save = createDefaultSave();
    save.unlockedCharacters.push('the-penitent', 'ashwalker');

    const penitent = new RunState(save, 'standard', 'the-penitent');
    expect(penitent.stats.current.maxHealth).toBe(140);
    expect(penitent.stats.current.damage).toBeCloseTo(1.1);
    expect([...penitent.weapons.equipped]).toEqual(['gravecleaver']);

    const ashwalker = new RunState(save, 'standard', 'ashwalker');
    expect(ashwalker.stats.current.maxHealth).toBe(75);
    expect(ashwalker.stats.current.moveSpeed).toBe(275);
    expect([...ashwalker.weapons.equipped]).toEqual(['ashen-longbow']);
  });

  it('evaluates visible character unlock milestones', () => {
    const save = createDefaultSave();
    save.runsSurvivedTenMinutes = 3;
    expect(checkCharacterUnlocks(save)).toEqual(['the-penitent']);
    save.totalWardenKills = 1;
    expect(checkCharacterUnlocks(save)).toEqual(['ashwalker']);
  });
});
