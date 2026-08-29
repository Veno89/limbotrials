import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { fireChainStrike } from '../systems/weapons/chainStrike';
import { fireTeslaCoil } from '../systems/weapons/teslaCoil';
import type { WeaponContext } from '../systems/weapons/WeaponContext';

interface DelayedStrike {
  delay: number;
  callback: () => void;
}

function createContext(targets: Phaser.Physics.Arcade.Image[]) {
  const delayed: DelayedStrike[] = [];
  const definitions = new Map(
    targets.map((target, index) => [target, { id: `test-enemy-${index}` }]),
  );
  const findNearest = vi.fn();
  targets.forEach((target) => findNearest.mockReturnValueOnce(target));
  findNearest.mockReturnValue(undefined);
  const spawnBetween = vi.fn().mockReturnValue(true);
  const damageArea = vi.fn();
  const damageEnemy = vi.fn().mockReturnValue({ killed: false });
  const afterAreaAttack = vi.fn();
  const player = { x: 100, y: 200 } as Phaser.Physics.Arcade.Image;
  const context = {
    player,
    scene: {
      time: {
        delayedCall: vi.fn((delay: number, callback: () => void) => {
          delayed.push({ delay, callback });
        }),
      },
    },
    enemies: {
      findNearest,
      getDefinition: vi.fn((target: Phaser.Physics.Arcade.Image) => definitions.get(target)),
    },
    vfx: { spawnBetween },
    juice: { ring: vi.fn() },
    damageArea,
    damageEnemy,
    afterAreaAttack,
  } as unknown as WeaponContext;
  return {
    context,
    player,
    delayed,
    definitions,
    findNearest,
    spawnBetween,
    damageArea,
    damageEnemy,
    afterAreaAttack,
  };
}

describe('chain weapon Vvfx ownership', () => {
  it('plays the authored attack first, then ordered enemy-to-enemy Tesla links', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const third = { x: 590, y: 440, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second, third]);
    const state = {
      level: 1,
      stats: { ...WEAPONS['tesla-coil'].baseStats },
    };

    fireTeslaCoil(setup.context, 'tesla-coil', state);

    expect(setup.findNearest).toHaveBeenNthCalledWith(
      1,
      setup.player.x,
      setup.player.y,
      state.stats.range,
      expect.any(Set),
    );
    expect(setup.findNearest).toHaveBeenNthCalledWith(
      2,
      first.x,
      first.y,
      state.stats.area,
      expect.any(Set),
    );
    expect(setup.findNearest).toHaveBeenNthCalledWith(
      3,
      second.x,
      second.y,
      state.stats.area,
      expect.any(Set),
    );
    expect(setup.spawnBetween).toHaveBeenCalledTimes(1);
    expect(setup.spawnBetween).toHaveBeenCalledWith('chain-lightning', {
      start: { x: setup.player.x, y: setup.player.y },
      end: { x: first.x, y: first.y },
      beamFit: 'crop',
      beamThicknessScale: 0.67,
      maxDurationMs: 500,
    });
    expect(setup.delayed.map(({ delay }) => delay)).toEqual([420, 490]);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);

    first.x = 320;
    first.y = 360;
    second.x = 480;
    second.y = 400;
    third.x = 620;
    third.y = 450;

    setup.delayed.forEach(({ callback }) => callback());

    expect(setup.spawnBetween.mock.calls).toEqual([
      [
        'chain-lightning',
        {
          start: { x: setup.player.x, y: setup.player.y },
          end: { x: 300, y: 350 },
          beamFit: 'crop',
          beamThicknessScale: 0.67,
          maxDurationMs: 500,
        },
      ],
      [
        'tesla-chain-link',
        {
          start: { x: first.x, y: first.y },
          end: { x: second.x, y: second.y },
          beamFit: 'crop',
          beamThicknessScale: 0.75,
          maxDurationMs: 500,
        },
      ],
      [
        'tesla-chain-link',
        {
          start: { x: second.x, y: second.y },
          end: { x: third.x, y: third.y },
          beamFit: 'crop',
          beamThicknessScale: 0.75,
          maxDurationMs: 500,
        },
      ],
    ]);
    expect(setup.damageEnemy.mock.calls.map(([target, , weaponId]) => [target, weaponId])).toEqual([
      [first, 'tesla-coil'],
      [second, 'tesla-coil'],
      [third, 'tesla-coil'],
    ]);
    expect(setup.afterAreaAttack).toHaveBeenCalledTimes(3);
  });

  it('stops cleanly when no enemy-to-enemy hop is available', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first]);
    const state = {
      level: 1,
      stats: { ...WEAPONS['tesla-coil'].baseStats },
    };

    fireTeslaCoil(setup.context, 'tesla-coil', state);

    expect(setup.spawnBetween).toHaveBeenCalledTimes(1);
    expect(setup.delayed).toEqual([]);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it('does not damage a target that died before its delayed chain link arrives', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    second.active = false;
    setup.delayed[0]?.callback();

    expect(setup.spawnBetween).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it('does not follow a pooled sprite that was reused for another enemy', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    setup.definitions.set(second, { id: 'test-enemy-1' });
    setup.delayed[0]?.callback();

    expect(setup.spawnBetween).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it.each(['dirge-staff', 'eclipse-brand'] as const)(
    'keeps %s on the generic judgment behavior without Tesla effects',
    (weaponId) => {
      const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
      const setup = createContext([first]);
      const state = {
        level: 1,
        stats: { ...WEAPONS[weaponId].baseStats, targetCount: 1 },
      };

      fireChainStrike(setup.context, weaponId, state);

      expect(setup.spawnBetween).not.toHaveBeenCalled();
      expect(setup.damageArea).toHaveBeenCalledWith(first.x, first.y, 0, weaponId);
    },
  );
});
