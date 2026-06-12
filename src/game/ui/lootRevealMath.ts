export interface Point {
  x: number;
  y: number;
}

export function lootArcPoint(start: Point, end: Point, progress: number, bend = 110): Point {
  const t = Math.max(0, Math.min(1, progress));
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const control = {
    x: start.x + dx * 0.5 - (dy / length) * bend,
    y: start.y + dy * 0.5 + (dx / length) * bend,
  };
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}
