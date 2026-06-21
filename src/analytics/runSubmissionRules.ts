import type { RunSummary } from '../game/types/gameTypes';
import {
  parsePlayerName,
  parseScoreSubmission,
  SCORE_LIMITS,
  type ScoreSubmission,
} from '../leaderboard/scoreSubmissionRules';

export const RUN_RECORD_SCHEMA_VERSION = 1;
export const MAX_RUN_RECORD_BYTES = 300_000;

export interface RunRecordSubmission {
  schemaVersion: typeof RUN_RECORD_SCHEMA_VERSION;
  runId: string;
  playerName?: string;
  summary: RunSummary;
}

export interface ParsedRunRecordSubmission extends RunRecordSubmission {
  score: ScoreSubmission;
}

export function createRunRecordSubmission(
  summary: RunSummary,
  playerName: string,
  runId: string = crypto.randomUUID(),
): RunRecordSubmission {
  return {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    runId,
    ...(playerName ? { playerName } : {}),
    summary,
  };
}

export function parseRunRecordSubmission(input: unknown): ParsedRunRecordSubmission | undefined {
  if (!isRecord(input) || input.schemaVersion !== RUN_RECORD_SCHEMA_VERSION || !isRecord(input.summary)) {
    return undefined;
  }
  const summary = input.summary;
  const balance = summary.balance;
  if (!isRecord(balance) || balance.presetId !== 'standard') {
    return undefined;
  }

  const playerName = parsePlayerName(input.playerName);
  const score = parseScoreSubmission({
    runId: input.runId,
    playerName: playerName ?? 'Anonymous',
    damageDealt: roundedNumber(balance.totalDamageDealt),
    enemiesKilled: summary.kills,
    survivalMs: roundedNumber(summary.elapsedMs),
    characterId: summary.characterId,
    victory: summary.victory,
  });
  if (
    !score ||
    !isBoundedNumber(summary.elapsedMs, SCORE_LIMITS.maxSurvivalMs) ||
    !isBoundedInteger(summary.souls, 100_000_000) ||
    !isBoundedInteger(summary.level, 1_000, 1) ||
    !isBoundedNumber(balance.measurementDurationMs, SCORE_LIMITS.maxSurvivalMs) ||
    !hasBoundedArrays(summary, balance)
  ) {
    return undefined;
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(summary);
  } catch {
    return undefined;
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_RUN_RECORD_BYTES) {
    return undefined;
  }

  return {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    runId: score.runId,
    ...(playerName ? { playerName } : {}),
    summary: summary as unknown as RunSummary,
    score,
  };
}

function hasBoundedArrays(summary: Record<string, unknown>, balance: Record<string, unknown>): boolean {
  return (
    boundedArray(summary.artifacts, 30) &&
    boundedArray(summary.cursedArtifacts, 30) &&
    boundedArray(summary.upgradeIds, 128) &&
    boundedArray(summary.newlyUnlockedCharacters, 10) &&
    boundedArray(summary.newlyUnlockedArtifactTiers, 10) &&
    boundedArray(summary.weaponResults, 10) &&
    boundedArray(balance.weaponResults, 10) &&
    boundedArray(balance.incomingDamage, 64) &&
    boundedArray(balance.enemyResults, 64) &&
    boundedArray(balance.upgradeOffers, 512) &&
    boundedArray(balance.upgradeChoices, 512) &&
    boundedArray(balance.cursedRewards, 128) &&
    boundedArray(balance.threatSamples, 128) &&
    boundedArray(balance.timeline, 2_048) &&
    boundedArray(balance.minutes, 31)
  );
}

function boundedArray(value: unknown, maximumLength: number): boolean {
  return Array.isArray(value) && value.length <= maximumLength;
}

function roundedNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : Number.NaN;
}

function isBoundedNumber(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum;
}

function isBoundedInteger(value: unknown, maximum: number, minimum = 0): value is number {
  return Number.isInteger(value) && isBoundedNumber(value, maximum) && value >= minimum;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
