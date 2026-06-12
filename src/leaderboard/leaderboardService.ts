import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RunSummary } from '../game/types/gameTypes';
import { loadPlayerName } from './playerIdentity';
import { parseScoreSubmission } from './scoreSubmissionRules';
import type { LeaderboardEntry, LeaderboardMetric, LeaderboardResult } from './leaderboardTypes';

const LEADERBOARD_TABLE = 'leaderboard_entries';
let client: SupabaseClient | undefined;

export async function loadLeaderboard(metric: LeaderboardMetric): Promise<LeaderboardResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      status: 'unconfigured',
      entries: [],
      message: 'The public leaderboard awakens after Supabase environment variables are configured.',
    };
  }

  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .select('id, player_name, damage_dealt, enemies_killed, survival_ms, character_id, victory, created_at')
    .order(metric, { ascending: false })
    .limit(10);

  if (error) {
    return {
      status: 'error',
      entries: [],
      message: 'The records could not be reached. The trial remembers, but remains silent.',
    };
  }

  return {
    status: 'ready',
    entries: (data ?? []) as LeaderboardEntry[],
  };
}

export async function submitRunScore(summary: RunSummary): Promise<void> {
  const playerName = loadPlayerName();
  if (!playerName || summary.balance.presetId !== 'standard') {
    return;
  }
  const submission = parseScoreSubmission({
    runId: crypto.randomUUID(),
    playerName,
    damageDealt: Math.round(summary.balance.totalDamageDealt),
    enemiesKilled: summary.kills,
    survivalMs: Math.round(summary.elapsedMs),
    characterId: summary.characterId,
    victory: summary.victory,
  });
  if (!submission) {
    return;
  }

  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
      keepalive: true,
    });
  } catch {
    // A failed public leaderboard submission must never interrupt the end-of-run flow.
  }
}

function getSupabaseClient(): SupabaseClient | undefined {
  if (client) {
    return client;
  }
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return undefined;
  }
  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
