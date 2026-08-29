import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { WEAPONS } from '../data/weapons';
import {
  fireMeteorHammer,
  METEOR_IMPACT_DELAY_MS,
} from '../systems/weapons/meteorHammer';
import type { WeaponContext } from '../systems/weapons/WeaponContext';

describe('Meteor Hammer authored Vvfx', () => {
  it('plays the point effect and resolves gameplay on its authored impact moment', () => {
    const target = { x: 420, y: 360, active: true } as Phaser.Physics.Arcade.Image;
    const delayed: Array<{ delay: number; callback: () => void }> = [];
    const spawnAt = vi.fn().mockReturnValue(true);
    const damageArc = vi.fn();
    const damageArea = vi.fn();
    const ring = vi.fn();
    const heavyImpact = vi.fn();
    const fragments = vi.fn();
    const spawnHazard = vi.fn();
    const context = {
      player: { x: 100, y: 200, active: true },
      enemies: { findNearest: vi.fn().mockReturnValue(target) },
      scene: {
        time: {
          delayedCall: vi.fn((delay: number, callback: () => void) => {
            delayed.push({ delay, callback });
          }),
        },
      },
      vfx: { spawnAt },
      juice: { ring, heavyImpact },
      impactFragments: { spawn: fragments },
      hazardZones: { spawn: spawnHazard },
      damageArc,
      damageArea,
    } as unknown as WeaponContext;
    const state = {
      level: 1,
      stats: { ...WEAPONS['meteor-hammer'].baseStats },
    };

    fireMeteorHammer(
      context,
      'meteor-hammer',
      state,
    );

    expect(spawnAt).toHaveBeenCalledWith('meteor-strike', {
      x: target.x,
      y: target.y,
      baseDepth: 60,
    });
    expect(damageArc).toHaveBeenCalledTimes(1);
    expect(delayed).toHaveLength(1);
    expect(delayed[0]?.delay).toBe(METEOR_IMPACT_DELAY_MS);
    expect(damageArea).not.toHaveBeenCalled();
    expect(spawnHazard).not.toHaveBeenCalled();

    delayed[0]?.callback();

    expect(ring).toHaveBeenCalledWith(
      target.x,
      target.y,
      state.stats.area,
      expect.any(Number),
      METEOR_IMPACT_DELAY_MS,
    );
    expect(heavyImpact).toHaveBeenCalledTimes(1);
    expect(fragments).toHaveBeenCalledWith({
      x: target.x,
      y: target.y,
      preset: 'meteor',
    });
    expect(damageArea).toHaveBeenCalledWith(
      target.x,
      target.y,
      state.stats.area,
      'meteor-hammer',
    );
    expect(spawnHazard).toHaveBeenCalledWith(
      target.x,
      target.y,
      'meteor-hammer',
      expect.objectContaining({
        radius: state.stats.area,
        durationMs: 4000,
        visualPreset: 'burning-ground',
      }),
    );
  });

  it('does not resolve the delayed impact after the player is gone', () => {
    const target = { x: 420, y: 360, active: true } as Phaser.Physics.Arcade.Image;
    let impact: (() => void) | undefined;
    const damageArea = vi.fn();
    const context = {
      player: { x: 100, y: 200, active: true },
      enemies: { findNearest: vi.fn().mockReturnValue(target) },
      scene: {
        time: {
          delayedCall: vi.fn((_delay: number, callback: () => void) => {
            impact = callback;
          }),
        },
      },
      vfx: { spawnAt: vi.fn().mockReturnValue(true) },
      juice: { ring: vi.fn(), heavyImpact: vi.fn() },
      impactFragments: { spawn: vi.fn() },
      hazardZones: { spawn: vi.fn() },
      damageArc: vi.fn(),
      damageArea,
    } as unknown as WeaponContext;

    fireMeteorHammer(
      context,
      'meteor-hammer',
      { level: 1, stats: { ...WEAPONS['meteor-hammer'].baseStats } },
    );
    context.player.active = false;
    impact?.();

    expect(damageArea).not.toHaveBeenCalled();
  });
});
