import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../game/systems/SaveSystem';
import { RunState } from '../game/systems/RunState';
import {
  createRunRecordSubmission,
  MAX_RUN_RECORD_BYTES,
  parseRunRecordSubmission,
} from './runSubmissionRules';

describe('run submission rules', () => {
  it('accepts anonymous standard-run analytics without leaderboard eligibility', () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const submission = createRunRecordSubmission(
      summary,
      '',
      'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
    );

    const parsed = parseRunRecordSubmission(submission);

    expect(parsed?.playerName).toBeUndefined();
    expect(parsed?.score.playerName).toBe('Anonymous');
    expect(parsed?.summary.balance.presetId).toBe('standard');
    expect(parsed?.summary.balance.cursedRewards).toEqual([]);
  });

  it('normalizes a named run for analytics and leaderboard storage', () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const submission = createRunRecordSubmission(
      summary,
      '  Veno   89 ',
      'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
    );

    expect(parseRunRecordSubmission(submission)?.playerName).toBe('Veno 89');
  });

  it('records analytics anonymously when a leaderboard name is invalid', () => {
    const summary = new RunState(createDefaultSave()).summary(false);
    const submission = createRunRecordSubmission(
      summary,
      '<script>',
      'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
    );

    expect(parseRunRecordSubmission(submission)?.playerName).toBeUndefined();
  });

  it('rejects balance presets and oversized run records', () => {
    const summary = new RunState(createDefaultSave(), 'boss-endgame').summary(false);
    const submission = createRunRecordSubmission(
      summary,
      'Veno 89',
      'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
    );
    expect(parseRunRecordSubmission(submission)).toBeUndefined();

    summary.balance.presetId = 'standard';
    summary.balance.timeline = [{ id: 'x'.repeat(MAX_RUN_RECORD_BYTES), atMs: 0 }];
    expect(parseRunRecordSubmission(submission)).toBeUndefined();
  });
});
