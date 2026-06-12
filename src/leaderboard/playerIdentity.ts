const PLAYER_NAME_KEY = 'everlasting-oblivion-leaderboard-name';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function normalizePlayerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 24);
}

export function loadPlayerName(storage: StorageLike = localStorage): string {
  try {
    return normalizePlayerName(storage.getItem(PLAYER_NAME_KEY) ?? '');
  } catch {
    return '';
  }
}

export function savePlayerName(value: string, storage: StorageLike = localStorage): string {
  const normalized = normalizePlayerName(value);
  try {
    storage.setItem(PLAYER_NAME_KEY, normalized);
  } catch {
    return normalized;
  }
  return normalized;
}
