import type { RunSummary } from '../game/types/gameTypes';
import { createRunRecordSubmission } from './runSubmissionRules';

export interface RunSubmissionResult {
  status: 'recorded' | 'partial' | 'failed';
  analyticsRecorded: boolean;
  leaderboardRecorded: boolean;
  message: string;
}

export interface RunSubmissionSession {
  submit(playerName?: string): Promise<RunSubmissionResult>;
}

export function createRunSubmissionSession(summary: RunSummary): RunSubmissionSession {
  const runId = crypto.randomUUID();
  return {
    submit: (playerName = '') =>
      submitRunRecord(createRunRecordSubmission(summary, playerName, runId)),
  };
}

async function submitRunRecord(
  submission: ReturnType<typeof createRunRecordSubmission>,
): Promise<RunSubmissionResult> {
  try {
    const response = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
    });
    const result = await readResponse(response);
    if (!response.ok) {
      return {
        status: result.analyticsRecorded ? 'partial' : 'failed',
        analyticsRecorded: result.analyticsRecorded,
        leaderboardRecorded: result.leaderboardRecorded,
        message: result.error ?? 'The run could not be recorded.',
      };
    }
    if (!result.leaderboardEligible) {
      return {
        status: 'recorded',
        analyticsRecorded: true,
        leaderboardRecorded: false,
        message: 'Run analytics recorded. Submit a name above to publish this score.',
      };
    }
    return {
      status: 'recorded',
      analyticsRecorded: true,
      leaderboardRecorded: true,
      message: 'Run analytics and leaderboard score recorded.',
    };
  } catch {
    return {
      status: 'failed',
      analyticsRecorded: false,
      leaderboardRecorded: false,
      message: 'Global run recording could not be reached.',
    };
  }
}

interface RunSubmissionResponse {
  analyticsRecorded: boolean;
  leaderboardRecorded: boolean;
  leaderboardEligible: boolean;
  error?: string;
}

async function readResponse(response: Response): Promise<RunSubmissionResponse> {
  try {
    const value = await response.json() as Partial<RunSubmissionResponse>;
    return {
      analyticsRecorded: value.analyticsRecorded === true,
      leaderboardRecorded: value.leaderboardRecorded === true,
      leaderboardEligible: value.leaderboardEligible === true,
      ...(typeof value.error === 'string' ? { error: value.error } : {}),
    };
  } catch {
    return {
      analyticsRecorded: false,
      leaderboardRecorded: false,
      leaderboardEligible: false,
    };
  }
}
