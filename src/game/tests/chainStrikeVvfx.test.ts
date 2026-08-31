import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { WEAPONS } from '../data/weapons';
import type { GameplayEffectSequenceId } from '../types/gameTypes';
import { fireChainStrike } from '../systems/weapons/chainStrike';
import { fireTeslaCoil } from '../systems/weapons/teslaCoil';
import type {
  WeaponContext,
  WeaponSequenceController,
} from '../systems/weapons/WeaponContext';
import type {
  GameplayEffectBeamOptions,
  GameplayEffectHandle,
  GameplayEffectPointOptions,
} from '../vfx/GameplayEffectSystem';
import type { GameplayEffectRole } from '../vfx/GameplayEffectRegistry';

function fakeEffectHandle(): GameplayEffectHandle & { cancel: ReturnType<typeof vi.fn> } {
  const cancel = vi.fn();
  return {
    active: true,
    usedFallback: false,
    runtimeHandle: undefined,
    cancel,
  };
}

function createContext(targets: Phaser.Physics.Arcade.Image[]) {
  const definitions = new Map(
    targets.map((target, index) => [target, { id: `test-enemy-${index}` }]),
  );
  const identities = new Map(
    targets.map((target, index) => [target, `enemy-${index}`]),
  );
  const spawnGenerations = new Map(
    targets.map((target, index) => [target, index + 1]),
  );
  const playBeam = vi.fn<(
    sequenceId: GameplayEffectSequenceId,
    role: GameplayEffectRole,
    options: GameplayEffectBeamOptions,
  ) => GameplayEffectHandle>(() => fakeEffectHandle());
  const playPoint = vi.fn<(
    sequenceId: GameplayEffectSequenceId,
    role: GameplayEffectRole,
    options: GameplayEffectPointOptions,
  ) => GameplayEffectHandle>(() => fakeEffectHandle());
  const damageArea = vi.fn();
  const damageEnemy = vi.fn().mockReturnValue({ killed: false });
  const afterAreaAttack = vi.fn();
  const trackSequence = vi.fn();
  const player = { x: 100, y: 200, active: true } as Phaser.Physics.Arcade.Image;
  const findNearest = vi.fn().mockReturnValue(targets[0]);
  const context = {
    player,
    scene: { time: { now: 1000 } },
    enemies: {
      forEach: vi.fn((visit: (sprite: Phaser.Physics.Arcade.Image, definition: object) => void) => {
        for (const target of targets) {
          if (target.active) {
            visit(target, definitions.get(target)!);
          }
        }
      }),
      findNearest,
      getDefinition: vi.fn((target: Phaser.Physics.Arcade.Image) => definitions.get(target)),
      getSpawnGeneration: vi.fn((target: Phaser.Physics.Arcade.Image) => spawnGenerations.get(target)),
    },
    effects: { playBeam, playPoint },
    vfx: { spawnBetween: vi.fn() },
    juice: { heavyImpact: vi.fn(), ring: vi.fn() },
    attachmentPoint: vi.fn((sprite: { x: number; y: number }) => ({ x: sprite.x, y: sprite.y })),
    targetIdentity: vi.fn((sprite: Phaser.Physics.Arcade.Image) => identities.get(sprite)!),
    nextEffectSeed: vi.fn(() => 12345),
    trackSequence,
    damageArea,
    damageEnemy,
    afterAreaAttack,
  } as unknown as WeaponContext;
  return {
    context,
    player,
    targets,
    definitions,
    spawnGenerations,
    playBeam,
    playPoint,
    damageArea,
    damageEnemy,
    afterAreaAttack,
    findNearest,
    trackSequence,
  };
}

function trackedSequence(setup: ReturnType<typeof createContext>): WeaponSequenceController {
  return setup.trackSequence.mock.calls[0]?.[0] as WeaponSequenceController;
}

describe('chain weapon semantic presentation', () => {
  it('plays semantic Tesla roles in order and keeps active Beam anchors live', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const third = { x: 590, y: 440, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([third, second, first]);
    const state = {
      level: 1,
      stats: { ...WEAPONS['tesla-coil'].baseStats },
    };

    fireTeslaCoil(setup.context, 'tesla-coil', state);

    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.playBeam.mock.calls[0]?.slice(0, 2)).toEqual([
      'tesla-chain',
      'initialDischarge',
    ]);
    const firstBeam = setup.playBeam.mock.calls[0]?.[2] as GameplayEffectBeamOptions;
    expect(firstBeam.start()).toEqual({ x: setup.player.x, y: setup.player.y });
    expect(firstBeam.end()).toEqual({ x: first.x, y: first.y });
    expect(setup.trackSequence).toHaveBeenCalledTimes(1);

    first.x = 325;
    first.y = 365;
    expect(firstBeam.end()).toEqual({ x: 325, y: 365 });

    const sequence = trackedSequence(setup);
    expect(sequence.update(1419)).toBe(true);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(sequence.update(1420)).toBe(true);
    expect(setup.playBeam.mock.calls[1]?.slice(0, 2)).toEqual([
      'tesla-chain',
      'beam',
    ]);
    expect(sequence.update(1489)).toBe(true);
    expect(setup.playBeam).toHaveBeenCalledTimes(2);
    expect(sequence.update(1490)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(3);

    expect(setup.damageEnemy.mock.calls.map(([target]) => target)).toEqual([
      first,
      second,
      third,
    ]);
    expect(setup.afterAreaAttack).toHaveBeenCalledTimes(3);
    expect(setup.playPoint.mock.calls.filter((call) => call[1] === 'targetElectricity')).toHaveLength(3);
    expect(setup.playPoint.mock.calls.filter((call) => call[1] === 'impact')).toHaveLength(3);
    expect(setup.playPoint.mock.calls.filter((call) => call[1] === 'finalChain')).toHaveLength(1);
    const pointOptions = setup.playPoint.mock.calls[0]?.[2] as GameplayEffectPointOptions;
    expect(pointOptions.point()).toEqual({ x: 300, y: 350 });
  });

  it('stops cleanly when no target is in initial range', () => {
    const distant = { x: 2000, y: 2000, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([distant]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);

    expect(setup.playBeam).not.toHaveBeenCalled();
    expect(setup.damageEnemy).not.toHaveBeenCalled();
    expect(setup.trackSequence).not.toHaveBeenCalled();
  });

  it('cancels downstream work when its source disappears', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    const firstBeam = setup.playBeam.mock.calls[0]?.[2] as GameplayEffectBeamOptions;
    setup.definitions.delete(first);
    first.active = false;
    first.x = 900;
    expect(firstBeam.end()).toEqual({ x: 300, y: 350 });
    const sequence = trackedSequence(setup);

    expect(sequence.update(1420)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
    const firstHandle = setup.playBeam.mock.results[0]?.value as GameplayEffectHandle;
    expect(firstHandle.cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels when a pooled target is reused with a different definition', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    setup.definitions.set(second, { id: 'replacement-enemy' });

    expect(trackedSequence(setup).update(1420)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it('cancels when a pooled target is reused with the same definition', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    setup.spawnGenerations.set(second, setup.spawnGenerations.get(second)! + 1);

    expect(trackedSequence(setup).update(1420)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it('cancels downstream work when the delayed target disappears', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    setup.definitions.delete(second);
    second.active = false;

    expect(trackedSequence(setup).update(1420)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it('rechecks hop range when actors move before a delayed strike', () => {
    const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
    const second = { x: 460, y: 390, active: true } as Phaser.Physics.Arcade.Image;
    const setup = createContext([first, second]);
    const state = { level: 1, stats: { ...WEAPONS['tesla-coil'].baseStats } };

    fireTeslaCoil(setup.context, 'tesla-coil', state);
    second.x = 900;
    second.y = 900;

    expect(trackedSequence(setup).update(1420)).toBe(false);
    expect(setup.playBeam).toHaveBeenCalledTimes(1);
    expect(setup.damageEnemy).toHaveBeenCalledTimes(1);
  });

  it.each(['dirge-staff', 'eclipse-brand'] as const)(
    'keeps %s on the generic judgment behavior without Tesla presentation',
    (weaponId) => {
      const first = { x: 300, y: 350, active: true } as Phaser.Physics.Arcade.Image;
      const setup = createContext([first]);
      const state = {
        level: 1,
        stats: { ...WEAPONS[weaponId].baseStats, targetCount: 1 },
      };

      fireChainStrike(setup.context, weaponId, state);

      expect(setup.playBeam).not.toHaveBeenCalled();
      expect(setup.damageArea).toHaveBeenCalledWith(first.x, first.y, 0, weaponId);
    },
  );
});
