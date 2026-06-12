export const SCORE_LIMITS = {
  maxDamageDealt: 100_000_000,
  maxEnemiesKilled: 100_000,
  maxSurvivalMs: 30 * 60 * 1000,
  maxPlayerNameLength: 24,
} as const;

const CHARACTER_IDS = new Set(['haunted', 'the-penitent', 'ashwalker']);
const PLAYER_NAME_PATTERN = /^[\p{L}\p{N} .'-]+$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ScoreSubmission {
  runId: string;
  playerName: string;
  damageDealt: number;
  enemiesKilled: number;
  survivalMs: number;
  characterId: string;
  victory: boolean;
}

export function parseScoreSubmission(input: unknown): ScoreSubmission | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  const value = input as Record<string, unknown>;
  const playerName = typeof value.playerName === 'string'
    ? value.playerName.trim().replace(/\s+/g, ' ')
    : '';

  if (
    typeof value.runId !== 'string' ||
    !UUID_PATTERN.test(value.runId) ||
    playerName.length < 2 ||
    playerName.length > SCORE_LIMITS.maxPlayerNameLength ||
    !PLAYER_NAME_PATTERN.test(playerName) ||
    !isBoundedInteger(value.damageDealt, SCORE_LIMITS.maxDamageDealt) ||
    !isBoundedInteger(value.enemiesKilled, SCORE_LIMITS.maxEnemiesKilled) ||
    !isBoundedInteger(value.survivalMs, SCORE_LIMITS.maxSurvivalMs) ||
    typeof value.characterId !== 'string' ||
    !CHARACTER_IDS.has(value.characterId) ||
    typeof value.victory !== 'boolean'
  ) {
    return undefined;
  }

  return {
    runId: value.runId,
    playerName,
    damageDealt: value.damageDealt,
    enemiesKilled: value.enemiesKilled,
    survivalMs: value.survivalMs,
    characterId: value.characterId,
    victory: value.victory,
  };
}

function isBoundedInteger(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum;
}
