const DIRECTIONS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'] as const;

export function formatChestObjective(angle: number, distance: number, remainingMs: number): string {
  const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const direction = DIRECTIONS[Math.round(normalized / (Math.PI / 4)) % DIRECTIONS.length]!;
  return `${direction}  ${Math.round(distance)}  ${Math.ceil(remainingMs / 1000)}s`;
}
