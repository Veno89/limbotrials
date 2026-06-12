export function xpRequiredForNextLevel(level: number): number {
  return Math.max(1, Math.round((level + 4) ** 2 * 1.8));
}
