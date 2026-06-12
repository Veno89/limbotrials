export type PlayerVisualDirection = 'front' | 'back' | 'left' | 'right';

export const HAUNTED_IDLE_FRAMES: Record<PlayerVisualDirection, number> = {
  front: 1,
  back: 4,
  left: 7,
  right: 10,
};

export function directionFromVelocity(x: number, y: number): PlayerVisualDirection | undefined {
  if (x === 0 && y === 0) {
    return undefined;
  }
  if (Math.abs(x) > Math.abs(y)) {
    return x < 0 ? 'left' : 'right';
  }
  return y < 0 ? 'back' : 'front';
}
