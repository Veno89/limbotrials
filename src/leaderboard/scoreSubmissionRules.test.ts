import { describe, expect, it } from 'vitest';
import { parseScoreSubmission, SCORE_LIMITS } from './scoreSubmissionRules';

const validSubmission = {
  runId: 'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
  playerName: 'Veno 89',
  damageDealt: 551348,
  enemiesKilled: 2942,
  survivalMs: 613747,
  characterId: 'haunted',
  victory: false,
};

describe('score submission rules', () => {
  it('accepts and normalizes a valid bounded score', () => {
    expect(parseScoreSubmission({ ...validSubmission, playerName: '  Veno   89 ' })).toEqual(validSubmission);
  });

  it('rejects malformed, unsafe, and absurd submissions', () => {
    expect(parseScoreSubmission({ ...validSubmission, playerName: '<script>' })).toBeUndefined();
    expect(parseScoreSubmission({ ...validSubmission, damageDealt: SCORE_LIMITS.maxDamageDealt + 1 })).toBeUndefined();
    expect(parseScoreSubmission({ ...validSubmission, enemiesKilled: 1.5 })).toBeUndefined();
    expect(parseScoreSubmission({ ...validSubmission, characterId: 'warden' })).toBeUndefined();
    expect(parseScoreSubmission({ ...validSubmission, runId: 'not-a-run-id' })).toBeUndefined();
  });
});
