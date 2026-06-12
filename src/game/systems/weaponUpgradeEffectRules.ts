export interface DelayedAreaEffect {
  x: number;
  y: number;
  radius: number;
  delayMs: number;
  damageScale: number;
}

export const SOUL_BOLT_SPLINTERING_MEMORY = {
  targetCount: 2,
  range: 280,
  damageScale: 0.35,
} as const;

export function getHellfireSpreadEffects(
  x: number,
  y: number,
  radius: number,
  sourceAngle: number,
): DelayedAreaEffect[] {
  const perpendicular = sourceAngle + Math.PI / 2;
  const offset = radius * 0.68;
  const effectRadius = radius * 0.62;
  return [-1, 1].map((direction, index) => ({
    x: x + Math.cos(perpendicular) * offset * direction,
    y: y + Math.sin(perpendicular) * offset * direction,
    radius: effectRadius,
    delayMs: 260 + index * 170,
    damageScale: 0.38,
  }));
}

export function getDirgeEchoEffect(x: number, y: number, radius: number): DelayedAreaEffect {
  return {
    x,
    y,
    radius: radius * 0.75,
    delayMs: 320,
    damageScale: 0.42,
  };
}
