import { describe, expect, it } from 'vitest';
import { loadPlayerName, normalizePlayerName, savePlayerName } from './playerIdentity';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('leaderboard player identity', () => {
  it('normalizes and persists a bounded player name', () => {
    const storage = memoryStorage();
    expect(normalizePlayerName('  Ash   Walker  ')).toBe('Ash Walker');
    expect(savePlayerName('  Ash   Walker  ', storage)).toBe('Ash Walker');
    expect(loadPlayerName(storage)).toBe('Ash Walker');
    expect(normalizePlayerName('x'.repeat(30))).toHaveLength(24);
  });
});
