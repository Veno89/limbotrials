export type LeaderboardMetric = 'damage_dealt' | 'enemies_killed';

export interface LeaderboardEntry {
  id: number;
  player_name: string;
  damage_dealt: number;
  enemies_killed: number;
  survival_ms: number;
  character_id: string;
  victory: boolean;
  created_at: string;
}

export interface LeaderboardResult {
  status: 'ready' | 'unconfigured' | 'error';
  entries: LeaderboardEntry[];
  message?: string;
}
