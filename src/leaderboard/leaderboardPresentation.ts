export function formatLeaderboardNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatLeaderboardTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getLeaderboardRankLabel(rank: number): string {
  if (rank === 1) {
    return 'I';
  }
  if (rank === 2) {
    return 'II';
  }
  if (rank === 3) {
    return 'III';
  }
  return rank.toString().padStart(2, '0');
}
