import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { parseScoreSubmission } from '../../src/leaderboard/scoreSubmissionRules';

export default async function submitScore(request: Request): Promise<Response> {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, headers);
  }
  if (!originAllowed(request)) {
    return json({ error: 'Origin not allowed.' }, 403, headers);
  }

  let input: unknown;
  try {
    input = await request.json();
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

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
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
}

export const config: Config = {
  path: '/api/leaderboard',
  method: ['POST', 'OPTIONS'],
  rateLimit: {
    windowSize: 60,
    windowLimit: 8,
    aggregateBy: ['ip'],
  },
};

function originAllowed(request: Request): boolean {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = request.headers.get('origin');
  return !allowedOrigin || !origin || origin === allowedOrigin;
}

function corsHeaders(request: Request): HeadersInit {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  return {
    'access-control-allow-origin': allowedOrigin ?? request.headers.get('origin') ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
    vary: 'origin',
  };
}

function json(body: object, status: number, headers: HeadersInit): Response {
  return Response.json(body, { status, headers });
}
