import { loadLeaderboard } from '../leaderboard/leaderboardService';
import {
  formatLeaderboardNumber,
  formatLeaderboardTime,
  getLeaderboardRankLabel,
} from '../leaderboard/leaderboardPresentation';
import type { LeaderboardEntry, LeaderboardMetric } from '../leaderboard/leaderboardTypes';

export function mountLeaderboardPanel(root: HTMLElement): void {
  let metric: LeaderboardMetric = 'damage_dealt';
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-leaderboard-metric]')];
  const body = root.querySelector<HTMLElement>('[data-leaderboard-body]');
  const status = root.querySelector<HTMLElement>('[data-leaderboard-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-leaderboard-retry]');

  if (!body || !status) {
    return;
  }

  const refresh = async (): Promise<void> => {
    setActiveTab(tabs, metric);
    body.innerHTML = loadingRows();
    status.textContent = 'CONSULTING THE RECORDS';
    retry?.classList.add('hidden');

    const result = await loadLeaderboard(metric);
    if (result.status !== 'ready') {
      body.replaceChildren(emptyState(result.message ?? 'No records are available.'));
      status.textContent = result.status === 'unconfigured' ? 'AWAITING SUPABASE' : 'RECORDS UNAVAILABLE';
      retry?.classList.toggle('hidden', result.status === 'unconfigured');
      return;
    }
    status.textContent = result.entries.length > 0 ? 'LIVE RECORDS' : 'NO SOULS RECORDED';
    body.replaceChildren(...result.entries.map((entry, index) => entryRow(entry, index, metric)));
    if (result.entries.length === 0) {
      body.replaceChildren(emptyState('No trial has yet been carved into this ledger.'));
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      metric = tab.dataset.leaderboardMetric === 'enemies_killed' ? 'enemies_killed' : 'damage_dealt';
      void refresh();
    });
  }
  retry?.addEventListener('click', () => void refresh());
  void refresh();
}

function setActiveTab(tabs: HTMLButtonElement[], metric: LeaderboardMetric): void {
  for (const tab of tabs) {
    const active = tab.dataset.leaderboardMetric === metric;
    tab.classList.toggle('border-relic/70', active);
    tab.classList.toggle('bg-relic/10', active);
    tab.classList.toggle('text-fog', active);
    tab.classList.toggle('border-mist/15', !active);
    tab.classList.toggle('text-mist', !active);
  }
}

function entryRow(entry: LeaderboardEntry, index: number, metric: LeaderboardMetric): HTMLElement {
  const row = document.createElement('article');
  row.className =
    'grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-mist/10 px-4 py-4 last:border-0 md:grid-cols-[4rem_1fr_9rem_8rem] md:px-6';

  const rank = document.createElement('span');
  rank.className = `font-display text-sm tracking-[0.18em] ${index < 3 ? 'text-relic' : 'text-mist/65'}`;
  rank.textContent = getLeaderboardRankLabel(index + 1);

  const identity = document.createElement('div');
  const name = document.createElement('p');
  name.className = 'font-display text-sm tracking-[0.08em] text-fog';
  name.textContent = entry.player_name;
  const detail = document.createElement('p');
  detail.className = 'mt-1 text-[11px] uppercase tracking-[0.16em] text-mist/65';
  detail.textContent = `${entry.character_id.replaceAll('-', ' ')} · ${entry.victory ? 'Warden slain' : 'Claimed by Limbo'}`;
  identity.append(name, detail);

  const score = document.createElement('div');
  score.className = 'text-right';
  const scoreValue = document.createElement('p');
  scoreValue.className = 'font-display text-base text-soul';
  scoreValue.textContent = formatLeaderboardNumber(
    metric === 'damage_dealt' ? entry.damage_dealt : entry.enemies_killed,
  );
  const scoreLabel = document.createElement('p');
  scoreLabel.className = 'text-[10px] uppercase tracking-[0.18em] text-mist/55';
  scoreLabel.textContent = metric === 'damage_dealt' ? 'damage' : 'kills';
  score.append(scoreValue, scoreLabel);

  const duration = document.createElement('p');
  duration.className = 'hidden text-right font-display text-xs tracking-[0.12em] text-mist md:block';
  duration.textContent = formatLeaderboardTime(entry.survival_ms);

  row.append(rank, identity, score, duration);
  return row;
}

function emptyState(message: string): HTMLElement {
  const state = document.createElement('div');
  state.className = 'px-6 py-14 text-center text-sm leading-7 text-mist';
  state.textContent = message;
  return state;
}

function loadingRows(): string {
  return Array.from(
    { length: 4 },
    () => '<div class="mx-4 my-3 h-16 animate-pulse rounded-sm border border-mist/5 bg-mist/5"></div>',
  ).join('');
}
