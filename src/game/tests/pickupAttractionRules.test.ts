import { describe, expect, it } from 'vitest';
import {
  magnetAttractionSpeed,
  PICKUP_BASE_SIZE,
  PICKUP_MAX_SIZE,
  pickupDisplaySize,
  vacuumMotionProfile,
  vacuumStartDelay,
} from '../systems/pickupAttractionRules';

describe('pickup attraction rules', () => {
  it('makes ordinary and consolidated XP globes larger within a fixed cap', () => {
    expect(pickupDisplaySize(0)).toBeGreaterThanOrEqual(PICKUP_BASE_SIZE);
    expect(pickupDisplaySize(64)).toBeGreaterThan(pickupDisplaySize(1));
    expect(pickupDisplaySize(100000)).toBe(PICKUP_MAX_SIZE);
  });

  it('accelerates normal magnet attraction near the player', () => {
    expect(magnetAttractionSpeed(100, 100)).toBe(190);
    expect(magnetAttractionSpeed(10, 100)).toBeGreaterThan(500);
  });

  it('stagger-starts vacuumed pickups and accelerates their curved pull', () => {
    expect(vacuumStartDelay(10)).toBeGreaterThan(vacuumStartDelay(1));
    const start = vacuumMotionProfile(600, 0, 1);
    const late = vacuumMotionProfile(200, 650, 1);
    expect(late.speed).toBeGreaterThan(start.speed);
    expect(Math.abs(late.angleOffset)).toBeLessThanOrEqual(Math.abs(start.angleOffset));
    expect(late.scale).toBeGreaterThan(start.scale);
  });
});
