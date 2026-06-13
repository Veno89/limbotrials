import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { parseScoreSubmission } from '../../src/leaderboard/scoreSubmissionRules';

export const handler: Handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod === 'GET') {
    return leaderboardHealth(headers);
  }
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, headers);
  }
  if (!originAllowed(event)) {
    return json({ error: 'Origin not allowed.' }, 403, headers);
  }

  let input: unknown;
  try {
    input = JSON.parse(event.body ?? '');
  } catch {
    return json({ error: 'Invalid JSON.' }, 400, headers);
  }
  const submission = parseScoreSubmission(input);
  if (!submission) {
    return json({ error: 'Invalid score submission.' }, 400, headers);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return json({ error: 'Leaderboard service is not configured.' }, 503, headers);
  }

  const supabase = createSupabaseClient(supabaseUrl, secretKey);
  const { error } = await supabase
    .from('leaderboard_entries')
    .insert({
      run_id: submission.runId,
      player_name: submission.playerName,
      damage_dealt: submission.damageDealt,
      enemies_killed: submission.enemiesKilled,
      survival_ms: submission.survivalMs,
      character_id: submission.characterId,
      victory: submission.victory,
    });

  if (error) {
    const duplicate = error.code === '23505';
    return json(
      { error: duplicate ? 'This run has already been recorded.' : 'The score could not be recorded.' },
      duplicate ? 409 : 502,
      headers,
    );
  }
  return json({ recorded: true }, 201, headers);
};

async function leaderboardHealth(headers: Record<string, string>): Promise<HandlerResponse> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return json({ configured: false, databaseReachable: false }, 503, headers);
  }

  const supabase = createSupabaseClient(supabaseUrl, secretKey);
  const { error } = await supabase
    .from('leaderboard_entries')
    .select('id', { count: 'exact', head: true });

  return error
    ? json(
        {
          configured: true,
          databaseReachable: false,
          databaseErrorCode: classifyDatabaseError(error),
        },
        503,
        headers,
      )
    : json({ configured: true, databaseReachable: true }, 200, headers);
}

function classifyDatabaseError(error: { code?: string; details?: string; message?: string }): string {
  if (error.code) {
    return error.code;
  }

  const description = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  if (description.includes('fetch failed') || description.includes('failed to fetch')) {
    return 'fetch_failed';
  }
  if (description.includes('invalid api key') || description.includes('api key is invalid')) {
    return 'invalid_api_key';
  }
  if (description.includes('jwt')) {
    return 'invalid_jwt';
  }
  if (description.includes('permission denied')) {
    return 'permission_denied';
  }
  if (description.includes('could not find the table') || description.includes('relation')) {
    return 'table_not_found';
  }
  return 'unknown';
}

function createSupabaseClient(url: string, key: string) {
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
