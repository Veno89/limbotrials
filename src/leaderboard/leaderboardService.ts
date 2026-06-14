import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
