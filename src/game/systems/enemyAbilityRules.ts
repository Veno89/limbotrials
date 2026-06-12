export interface BruteChargeProfile {
  distance: number;
  durationMs: number;
  speed: number;
  speedMultiplier: number;
}

const BRUTE_CHARGE_DISTANCE = 520;
const BRUTE_CHARGE_DURATION_MS = 1000;

export function calculateBruteCharge(baseSpeed: number): BruteChargeProfile {
  const speed = (BRUTE_CHARGE_DISTANCE / BRUTE_CHARGE_DURATION_MS) * 1000;
  return {
    distance: BRUTE_CHARGE_DISTANCE,
    durationMs: BRUTE_CHARGE_DURATION_MS,
    speed,
    speedMultiplier: speed / baseSpeed,
  };
}
