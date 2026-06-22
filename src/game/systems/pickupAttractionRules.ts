export const PICKUP_BASE_SIZE = 23;
export const PICKUP_MAX_SIZE = 36;
export const PICKUP_COLLECTION_DISTANCE = 28;
export const PICKUP_VACUUM_STAGGER_MS = 5;

export interface PickupMotionProfile {
  speed: number;
  angleOffset: number;
  scale: number;
}

export function pickupDisplaySize(value: number): number {
  return Math.min(PICKUP_MAX_SIZE, PICKUP_BASE_SIZE + Math.log2(Math.max(1, value) + 1) * 2);
}

export function magnetAttractionSpeed(distance: number, pickupRadius: number): number {
  const radius = Math.max(1, pickupRadius);
  const proximity = Math.max(0, Math.min(1, 1 - distance / radius));
  return 190 + proximity * 420;
}

export function vacuumStartDelay(index: number): number {
  return Math.max(0, index) * PICKUP_VACUUM_STAGGER_MS;
}

export function vacuumMotionProfile(distance: number, elapsedMs: number, seed: number): PickupMotionProfile {
  const progress = Math.max(0, Math.min(1, elapsedMs / 650));
  const speed = 360 + progress * 1080 + Math.min(420, Math.max(0, distance) * 0.45);
  const curveStrength = (1 - progress) * 0.34;
  return {
    speed,
    angleOffset: Math.sin(elapsedMs * 0.014 + seed) * curveStrength,
    scale: 1 + progress * 0.22,
  };
}
