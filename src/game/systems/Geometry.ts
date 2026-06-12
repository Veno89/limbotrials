export function distanceToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }
  const projection = Math.max(
    0,
    Math.min(1, ((pointX - startX) * segmentX + (pointY - startY) * segmentY) / lengthSquared),
  );
  return Math.hypot(pointX - (startX + projection * segmentX), pointY - (startY + projection * segmentY));
}
