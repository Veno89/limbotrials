import type { BalancePresetId, EnemyId, UpgradeId, WeaponId } from '../types/gameTypes';

export interface BalancePresetSpawn {
  enemyId: EnemyId;
  count: number;
  radius: number;
  maintainCount?: number;
  batchSize?: number;
}

export interface BalancePresetDefinition {
  id: Exclude<BalancePresetId, 'standard'>;
  name: string;
  description: string;
  elapsedMs: number;
  weapons: readonly WeaponId[];
  upgrades: readonly UpgradeId[];
  replenishEveryMs: number;
  spawns: readonly BalancePresetSpawn[];
}

const repeated = (id: UpgradeId, count: number): UpgradeId[] => Array.from({ length: count }, () => id);

export const BALANCE_PRESETS: Record<Exclude<BalancePresetId, 'standard'>, BalancePresetDefinition> = {
  'scythe-evolution': {
    id: 'scythe-evolution',
    name: 'ALL ENEMIES LAB',
    description: 'A debug lab that spawns exactly 1 of every normal enemy type continuously.',
    elapsedMs: 0,
    weapons: ['ashen-longbow'],
    upgrades: ['stat-movement', 'stat-movement', 'stat-movement', 'stat-movement'],
    replenishEveryMs: 650,
    spawns: [
      { enemyId: 'lost-soul', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'grave-crawler', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'limbo-knight', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'tormented-shade', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'void-caster', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'screamer', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'flayed-wanderer', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'lantern-ghost', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'gravebound-archer', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'veil-stalker', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'condemned-brute', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'sentinel-of-woe', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'elite-void-caster', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'elite-screamer', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'elite-summoner', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'plague-crawler', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'ember-imp', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'grave-defiler', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'wretched-runt', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
      { enemyId: 'sinbound-stalker', count: 1, radius: 400, maintainCount: 1, batchSize: 1 },
    ],
  },
  'projectile-evolution': {
    id: 'projectile-evolution',
    name: 'PROJECTILE EVOLUTION LAB',
    description: 'Evolved Soul Bolt, Grave Lance, and Wailing Shards against lanes and crowds.',
    elapsedMs: 180000,
    weapons: ['soul-bolt', 'grave-lance', 'wailing-shards'],
    upgrades: [
      ...repeated('level-soul-bolt', 2),
      'soul-bolt-projectiles',
      ...repeated('level-soul-bolt', 2),
      'evolve-soul-bolt',
      ...repeated('level-grave-lance', 2),
      'grave-lance-pierce',
      ...repeated('level-grave-lance', 2),
      'evolve-grave-lance',
      ...repeated('level-wailing-shards', 2),
      'wailing-shards-count',
      ...repeated('level-wailing-shards', 2),
      'evolve-wailing-shards',
    ],
    replenishEveryMs: 550,
    spawns: [
      { enemyId: 'lost-soul', count: 36, radius: 400, maintainCount: 40, batchSize: 12 },
      { enemyId: 'limbo-knight', count: 12, radius: 520, maintainCount: 14, batchSize: 4 },
      { enemyId: 'void-caster', count: 6, radius: 620, maintainCount: 6, batchSize: 2 },
    ],
  },
  'curse-pressure': {
    id: 'curse-pressure',
    name: 'CURSE PRESSURE LAB',
    description: 'Two offensive curses against ability-heavy enemies.',
    elapsedMs: 150000,
    weapons: ['hellfire-sigil', 'cinder-reliquary'],
    upgrades: [
      ...repeated('level-hellfire-sigil', 3),
      ...repeated('level-cinder-reliquary', 3),
      'curse-blood-price',
      'curse-fevered-soul',
    ],
    replenishEveryMs: 800,
    spawns: [
      { enemyId: 'void-caster', count: 10, radius: 500, maintainCount: 12, batchSize: 4 },
      { enemyId: 'screamer', count: 6, radius: 430, maintainCount: 7, batchSize: 3 },
      { enemyId: 'condemned-brute', count: 1, radius: 620, maintainCount: 1, batchSize: 1 },
    ],
  },
  'boss-endgame': {
    id: 'boss-endgame',
    name: 'WARDEN ENDGAME LAB',
    description: 'Five evolved weapons against the Warden and a final-wave escort.',
    elapsedMs: 240000,
    weapons: ['soul-bolt', 'hellfire-sigil', 'grave-lance', 'wailing-shards'],
    upgrades: [
      ...repeated('level-bone-scythe', 5),
      'evolve-bone-scythe',
      ...repeated('level-soul-bolt', 5),
      'evolve-soul-bolt',
      ...repeated('level-hellfire-sigil', 5),
      'evolve-hellfire-sigil',
      ...repeated('level-grave-lance', 5),
      'evolve-grave-lance',
      ...repeated('level-wailing-shards', 5),
      'evolve-wailing-shards',
      'stat-vigor',
      'stat-movement',
    ],
    replenishEveryMs: 750,
    spawns: [
      { enemyId: 'limbo-warden', count: 1, radius: 560 },
      { enemyId: 'limbo-knight', count: 12, radius: 650, maintainCount: 14, batchSize: 4 },
      { enemyId: 'void-caster', count: 6, radius: 700, maintainCount: 7, batchSize: 3 },
    ],
  },
  'new-weapon-lab': {
    id: 'new-weapon-lab',
    name: 'NEW WEAPON LAB',
    description: 'Evolution-ready Ashen Longbow, Bloodletter Axe, Dirge Staff, and Poison Flask against mixed pressure.',
    elapsedMs: 180000,
    weapons: ['ashen-longbow', 'bloodletter-axe', 'dirge-staff', 'poison-flask'],
    upgrades: [
      ...repeated('level-ashen-longbow', 2),
      'ashen-longbow-volley',
      ...repeated('level-ashen-longbow', 2),
      ...repeated('level-bloodletter-axe', 2),
      'bloodletter-axe-count',
      ...repeated('level-bloodletter-axe', 2),
      ...repeated('level-dirge-staff', 2),
      'dirge-staff-targets',
      ...repeated('level-dirge-staff', 2),
      ...repeated('level-poison-flask', 2),
      'poison-flask-area',
      ...repeated('level-poison-flask', 2),
      'evolve-poison-flask',
    ],
    replenishEveryMs: 600,
    spawns: [
      { enemyId: 'flayed-wanderer', count: 26, radius: 390, maintainCount: 30, batchSize: 9 },
      { enemyId: 'veil-stalker', count: 10, radius: 450, maintainCount: 12, batchSize: 4 },
      { enemyId: 'lantern-ghost', count: 8, radius: 530, maintainCount: 10, batchSize: 3 },
      { enemyId: 'gravebound-archer', count: 5, radius: 620, maintainCount: 6, batchSize: 2 },
    ],
  },
  'crimson-orbit-lab': {
    id: 'crimson-orbit-lab',
    name: 'CRIMSON ORBIT LAB',
    description: 'Evolved Bloodletter Axe with post-evolution specialization against close-range mixed pressure.',
    elapsedMs: 240000,
    weapons: ['bloodletter-axe'],
    upgrades: [
      'bloodletter-axe-size',
      'bloodletter-axe-haste',
      ...repeated('level-bloodletter-axe', 3),
      'evolve-bloodletter-axe',
      ...repeated('bloodletter-axe-count', 2),
      'stat-movement',
    ],
    replenishEveryMs: 650,
    spawns: [
      { enemyId: 'flayed-wanderer', count: 24, radius: 250, maintainCount: 28, batchSize: 8 },
      { enemyId: 'limbo-knight', count: 8, radius: 330, maintainCount: 10, batchSize: 3 },
      { enemyId: 'veil-stalker', count: 5, radius: 410, maintainCount: 6, batchSize: 2 },
    ],
  },
  'weapon-identity-lab': {
    id: 'weapon-identity-lab',
    name: 'WEAPON IDENTITY LAB',
    description: 'Remaining weapon identities with one-stack cadence tradeoffs.',
    elapsedMs: 300000,
    weapons: ['wailing-shards', 'cinder-reliquary', 'ashen-longbow'],
    upgrades: [
      'bone-scythe-committed-reap',
      ...repeated('level-bone-scythe', 2),
      'wailing-shards-fractured-choir',
      ...repeated('level-wailing-shards', 2),
      'cinder-reliquary-funeral-furnace',
      ...repeated('level-cinder-reliquary', 2),
      'ashen-longbow-full-draw',
      ...repeated('level-ashen-longbow', 2),
      'stat-movement',
    ],
    replenishEveryMs: 650,
    spawns: [
      { enemyId: 'flayed-wanderer', count: 30, radius: 320, maintainCount: 34, batchSize: 10 },
      { enemyId: 'limbo-knight', count: 10, radius: 430, maintainCount: 12, batchSize: 4 },
      { enemyId: 'gravebound-archer', count: 5, radius: 600, maintainCount: 6, batchSize: 2 },
    ],
  },
  'upgrade-effects-lab': {
    id: 'upgrade-effects-lab',
    name: 'UPGRADE EFFECTS LAB',
    description: 'Splintering projectiles, spreading areas, echoes, and accelerated threat.',
    elapsedMs: 120000,
    weapons: ['soul-bolt', 'hellfire-sigil', 'dirge-staff'],
    upgrades: [
      'soul-bolt-splintering-memory',
      ...repeated('level-soul-bolt', 2),
      'hellfire-spreading-sentence',
      ...repeated('level-hellfire-sigil', 2),
      'dirge-staff-echoed-rites',
      ...repeated('level-dirge-staff', 2),
      ...repeated('stat-forbidden-tutelage', 2),
      'stat-movement',
    ],
    replenishEveryMs: 600,
    spawns: [
      { enemyId: 'flayed-wanderer', count: 30, radius: 350, maintainCount: 34, batchSize: 10 },
      { enemyId: 'limbo-knight', count: 10, radius: 460, maintainCount: 12, batchSize: 4 },
      { enemyId: 'gravebound-archer', count: 5, radius: 620, maintainCount: 6, batchSize: 2 },
    ],
  },
};

export function getPresetReplenishCount(target: number, batchSize: number, current: number): number {
  return Math.max(0, Math.min(batchSize, target - current));
}
