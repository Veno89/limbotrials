import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave } from '../game/systems/SaveSystem';
import { RunState } from '../game/systems/RunState';
import { createRunSubmissionSession } from './runSubmissionService';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('run submission session', () => {
  it('reuses one run ID when an anonymous result is later named', async () => {
    const requests: Array<{ runId: string; playerName?: string }> = [];
    vi.stubGlobal('fetch', vi.fn(async (_input: string, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({
        analyticsRecorded: true,
        leaderboardRecorded: requests.length > 1,
        leaderboardEligible: requests.length > 1,
      }), { status: 201 });
    }));

    const session = createRunSubmissionSession(new RunState(createDefaultSave()).summary(false));
    await session.submit('');
    await session.submit('Veno 89');

    expect(requests).toHaveLength(2);
    expect(requests[0]?.runId).toBe(requests[1]?.runId);
    expect(requests[0]?.playerName).toBeUndefined();
    expect(requests[1]?.playerName).toBe('Veno 89');
  });
});
