import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { ASSETS } from '../data/assets';
import { BALANCE_PRESETS } from '../data/balancePresets';
import { ENEMIES } from '../data/enemies';
import { UPGRADES } from '../data/upgrades';
import { applyBalancePreset } from '../systems/BalancePresetSystem';
import { parseDeathEchoSnapshot } from '../systems/deathEchoRules';
import { RunState } from '../systems/RunState';
import { createDefaultSave } from '../systems/SaveSystem';
import type { EnemySystem } from '../systems/EnemySystem';
import { MAX_WEAPON_LEVEL } from '../types/gameTypes';

describe('Tesla Coil data integration', () => {
  it('accepts Tesla Coil as a persisted Death Echo weapon', () => {
    const snapshot = parseDeathEchoSnapshot({
      classId: 'haunted',
      survivedSeconds: 240,
      level: 18,
      mainWeaponId: 'tesla-coil',
      upgradeIds: ['unlock-tesla-coil', 'tesla-coil-induction'],
      artifactIds: [],
      curseLevel: 0,
      curseTier: 'unmarked',
      kills: 120,
      soulsEarned: 450,
    });

    expect(snapshot).toMatchObject({
      mainWeaponId: 'tesla-coil',
      upgradeIds: ['unlock-tesla-coil', 'tesla-coil-induction'],
    });
  });

  it('includes a complete Tesla Coil path in the new-weapon balance lab', () => {
    const preset = BALANCE_PRESETS['new-weapon-lab'];
    expect(preset.weapons).toContain('tesla-coil');
    expect(preset.upgrades).toEqual(
      expect.arrayContaining([
        'level-tesla-coil',
        'tesla-coil-induction',
        'evolve-tesla-coil',
      ]),
    );
    expect(preset.upgrades.every((id) => Boolean(UPGRADES[id]))).toBe(true);
  });

  it('actually equips and evolves Tesla Coil when the new-weapon lab is applied', () => {
    const run = new RunState(createDefaultSave(), 'new-weapon-lab');
    const enemies = { spawn: vi.fn() } as unknown as EnemySystem;
    const player = { x: 1920, y: 1080 } as Phaser.Physics.Arcade.Image;

    applyBalancePreset('new-weapon-lab', run, enemies, player);

    expect([...BALANCE_PRESETS['new-weapon-lab'].weapons].every((id) => run.weapons.equipped.has(id))).toBe(true);
    expect(run.weapons.getState('tesla-coil').level).toBe(MAX_WEAPON_LEVEL);
  });

  it('loads a semantic texture for every enemy in the Tesla balance lab', () => {
    const loadedKeys = new Set(ASSETS.map(([key]) => key));
    const textureKeys = BALANCE_PRESETS['new-weapon-lab'].spawns.map(
      ({ enemyId }) => ENEMIES[enemyId].texture,
    );

    expect(textureKeys.every((key) => loadedKeys.has(key))).toBe(true);
  });
});
