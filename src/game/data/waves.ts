import { BOSS_SPAWN_MS } from '../constants';
import type { EnemyId } from '../types/gameTypes';

export interface SpawnSession {
  id: 'fodder' | 'bruiser' | 'caster' | 'screamer';
  enemyPool: readonly EnemyId[];
  spawnEveryMs: number;
  spawnBatchSize: number;
  targetPopulation: number;
  distance: number;
}

export interface WaveTier {
  fromMs: number;
  globalPopulationCap: number;
  sessions: readonly SpawnSession[];
  eliteEveryMs?: number;
  elitePool?: readonly EnemyId[];
}

const session = (
  id: SpawnSession['id'],
  enemyPool: readonly EnemyId[],
  spawnEveryMs: number,
  spawnBatchSize: number,
  targetPopulation: number,
  distance: number,
): SpawnSession => ({ id, enemyPool, spawnEveryMs, spawnBatchSize, targetPopulation, distance });

export const WAVE_TIERS: readonly WaveTier[] = [
  {
    fromMs: 0,
    globalPopulationCap: 42,
    sessions: [session('fodder', ['lost-soul'], 700, 5, 32, 590)],
  },
  {
    fromMs: 120000,
    globalPopulationCap: 68,
    sessions: [session('fodder', ['lost-soul', 'lost-soul', 'bone-crawler', 'plague-crawler'], 620, 7, 52, 600)],
  },
  {
    fromMs: 240000,
    globalPopulationCap: 82,
    sessions: [
      session(
        'fodder',
        ['lost-soul', 'lost-soul', 'bone-crawler', 'bone-crawler', 'flayed-wanderer', 'plague-crawler'],
        570,
        8,
        58,
        610,
      ),
      session('bruiser', ['wraith', 'hollow-knight'], 1450, 2, 8, 640),
      session('caster', ['void-caster', 'ember-imp'], 2900, 1, 2, 690),
    ],
    eliteEveryMs: 120000,
    elitePool: ['condemned-brute'],
  },
  {
    fromMs: 330000,
    globalPopulationCap: 92,
    sessions: [
      session(
        'fodder',
        ['lost-soul', 'bone-crawler', 'flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'plague-crawler'],
        540,
        9,
        64,
        610,
      ),
      session('bruiser', ['wraith', 'hollow-knight'], 1300, 3, 10, 640),
      session('caster', ['void-caster', 'gravebound-archer', 'ember-imp'], 2600, 1, 3, 690),
    ],
    eliteEveryMs: 120000,
    elitePool: ['condemned-brute'],
  },
  {
    fromMs: 420000,
    globalPopulationCap: 105,
    sessions: [
      session(
        'fodder',
        ['lost-soul', 'bone-crawler', 'flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'plague-crawler'],
        520,
        9,
        68,
        620,
      ),
      session('bruiser', ['wraith', 'hollow-knight', 'lantern-ghost'], 1250, 3, 14, 650),
      session('caster', ['void-caster', 'gravebound-archer', 'ember-imp'], 2500, 1, 4, 700),
      session('screamer', ['screamer'], 4800, 1, 1, 710),
    ],
    eliteEveryMs: 105000,
    elitePool: ['condemned-brute', 'sentinel-of-woe'],
  },
  {
    fromMs: 510000,
    globalPopulationCap: 120,
    sessions: [
      session('fodder', ['bone-crawler', 'flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'grave-defiler'], 480, 11, 78, 620),
      session('bruiser', ['hollow-knight', 'lantern-ghost', 'lantern-ghost'], 1100, 4, 18, 650),
      session('caster', ['void-caster', 'gravebound-archer', 'gravebound-archer', 'ember-imp'], 2300, 1, 5, 700),
      session('screamer', ['screamer'], 4200, 1, 2, 710),
    ],
    eliteEveryMs: 105000,
    elitePool: ['condemned-brute', 'sentinel-of-woe'],
  },
  {
    fromMs: 600000,
    globalPopulationCap: 135,
    sessions: [
      session('fodder', ['flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'grave-defiler'], 455, 12, 86, 630),
      session('bruiser', ['hollow-knight', 'lantern-ghost', 'lantern-ghost'], 1020, 4, 22, 660),
      session('caster', ['void-caster', 'gravebound-archer', 'gravebound-archer', 'ember-imp'], 2200, 1, 5, 710),
      session('screamer', ['screamer'], 4000, 1, 2, 720),
    ],
    eliteEveryMs: 90000,
    elitePool: ['sentinel-of-woe', 'sentinel-of-woe', 'condemned-brute'],
  },
  {
    fromMs: 690000,
    globalPopulationCap: 145,
    sessions: [
      session('fodder', ['flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'grave-defiler'], 430, 13, 92, 630),
      session('bruiser', ['hollow-knight', 'lantern-ghost', 'lantern-ghost'], 950, 5, 24, 660),
      session('caster', ['gravebound-archer', 'gravebound-archer', 'void-caster', 'ember-imp'], 2100, 1, 6, 710),
      session('screamer', ['screamer'], 3800, 1, 3, 720),
    ],
    eliteEveryMs: 90000,
    elitePool: ['sentinel-of-woe', 'sentinel-of-woe', 'condemned-brute'],
  },
  {
    fromMs: 780000,
    globalPopulationCap: 160,
    sessions: [
      session('fodder', ['flayed-wanderer', 'flayed-wanderer', 'veil-stalker', 'grave-defiler'], 390, 15, 102, 640),
      session('bruiser', ['lantern-ghost', 'lantern-ghost', 'hollow-knight'], 850, 6, 30, 670),
      session('caster', ['gravebound-archer', 'gravebound-archer', 'void-caster', 'ember-imp'], 1900, 1, 7, 720),
      session('screamer', ['screamer'], 3400, 1, 4, 730),
    ],
    eliteEveryMs: 75000,
    elitePool: ['sentinel-of-woe', 'sentinel-of-woe', 'condemned-brute'],
  },
];

export function getWaveTier(elapsedMs: number): WaveTier {
  let selected = WAVE_TIERS[0]!;
  for (const tier of WAVE_TIERS) {
    if (elapsedMs >= tier.fromMs) {
      selected = tier;
    }
  }
  return selected;
}

export function getSessionSpawnCount(
  sessionDefinition: SpawnSession,
  sessionPopulation: number,
  globalPopulation: number,
  globalPopulationCap: number,
): number {
  return Math.max(
    0,
    Math.min(
      sessionDefinition.spawnBatchSize,
      sessionDefinition.targetPopulation - sessionPopulation,
      globalPopulationCap - globalPopulation,
    ),
  );
}

export function selectEnemyFromPool(pool: readonly EnemyId[], random: () => number = Math.random): EnemyId {
  return pool[Math.floor(random() * pool.length)]!;
}

export function shouldSpawnBoss(elapsedMs: number, bossSpawned: boolean): boolean {
  return !bossSpawned && elapsedMs >= BOSS_SPAWN_MS;
}
