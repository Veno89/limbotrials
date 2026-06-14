import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  MAX_RUN_RECORD_BYTES,
  parseRunRecordSubmission,
  type ParsedRunRecordSubmission,
} from '../../src/analytics/runSubmissionRules';

export const handler: Handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod === 'GET') {
    return runServiceHealth(headers);
  }
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, headers);
  }
  if (!originAllowed(event)) {
    return json({ error: 'Origin not allowed.' }, 403, headers);
  }
  if (Buffer.byteLength(event.body ?? '', 'utf8') > MAX_RUN_RECORD_BYTES + 20_000) {
    return json({ error: 'Run record is too large.' }, 413, headers);
  }

  let input: unknown;
  try {
    input = JSON.parse(event.body ?? '');
  } catch {
    return json({ error: 'Invalid JSON.' }, 400, headers);
  }
  const submission = parseRunRecordSubmission(input);
  if (!submission) {
    return json({ error: 'Invalid run submission.' }, 400, headers);
  }

  const supabase = configuredClient();
  if (!supabase) {
    return json({ error: 'Run recording service is not configured.' }, 503, headers);
  }

  const analyticsError = await insertAnalytics(supabase, submission);
  if (analyticsError && analyticsError !== '23505') {
    return json(
      {
        error: 'Run analytics could not be recorded.',
        analyticsRecorded: false,
        leaderboardRecorded: false,
        leaderboardEligible: Boolean(submission.playerName),
      },
      502,
      headers,
    );
  }

  if (!submission.playerName) {
    return json(
      {
        analyticsRecorded: true,
        leaderboardRecorded: false,
        leaderboardEligible: false,
      },
      201,
      headers,
    );
  }

  const leaderboardError = await insertLeaderboard(supabase, submission);
  if (leaderboardError && leaderboardError !== '23505') {
    return json(
      {
        error: 'Run analytics were recorded, but the leaderboard score could not be recorded.',
        analyticsRecorded: true,
        leaderboardRecorded: false,
        leaderboardEligible: true,
      },
      502,
      headers,
    );
  }

  return json(
    {
      analyticsRecorded: true,
      leaderboardRecorded: true,
      leaderboardEligible: true,
    },
    201,
    headers,
  );
};

async function insertAnalytics(
  supabase: SupabaseClient,
  submission: ParsedRunRecordSubmission,
): Promise<string | undefined> {
  const { error } = await supabase.from('run_analytics').insert({
    run_id: submission.runId,
    player_name: submission.playerName ?? null,
    character_id: submission.score.characterId,
    victory: submission.score.victory,
    survival_ms: submission.score.survivalMs,
    enemies_killed: submission.score.enemiesKilled,
    damage_dealt: submission.score.damageDealt,
    level_reached: submission.summary.level,
    souls_collected: submission.summary.souls,
    run_summary: submission.summary,
  });
  return error?.code;
}

async function insertLeaderboard(
  supabase: SupabaseClient,
  submission: ParsedRunRecordSubmission,
): Promise<string | undefined> {
  const { error } = await supabase.from('leaderboard_entries').insert({
    run_id: submission.runId,
    player_name: submission.playerName,
    damage_dealt: submission.score.damageDealt,
    enemies_killed: submission.score.enemiesKilled,
    survival_ms: submission.score.survivalMs,
    character_id: submission.score.characterId,
    victory: submission.score.victory,
  });
  return error?.code;
}

async function runServiceHealth(headers: Record<string, string>): Promise<HandlerResponse> {
  const supabase = configuredClient();
  if (!supabase) {
    return json({ configured: false, databaseReachable: false }, 503, headers);
  }

  const [leaderboard, analytics] = await Promise.all([
    supabase.from('leaderboard_entries').select('id').limit(1),
    supabase.from('run_analytics').select('id').limit(1),
  ]);
  const leaderboardReachable = !leaderboard.error;
  const analyticsReachable = !analytics.error;
  return json(
    {
      configured: true,
      databaseReachable: leaderboardReachable && analyticsReachable,
      leaderboardReachable,
      analyticsReachable,
      ...(!leaderboardReachable || !analyticsReachable
        ? { databaseErrorCode: leaderboard.error?.code ?? analytics.error?.code ?? 'unknown' }
        : {}),
    },
    leaderboardReachable && analyticsReachable ? 200 : 503,
    headers,
  );
}

function configuredClient(): SupabaseClient | undefined {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return undefined;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function originAllowed(event: HandlerEvent): boolean {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = event.headers.origin;
  return !allowedOrigin || !origin || origin === allowedOrigin;
}

function corsHeaders(event: HandlerEvent): Record<string, string> {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  return {
    'access-control-allow-origin': allowedOrigin ?? event.headers.origin ?? '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
    vary: 'origin',
  };
}

function json(body: object, statusCode: number, headers: Record<string, string>): HandlerResponse {
  return {
    statusCode,
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
