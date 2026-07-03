import type { EnemyId } from '../types/gameTypes';

export type RunEventId =
  | 'first-judgment'
  | 'crawler-tide'
  | 'void-choir'
  | 'wraith-procession'
  | 'midpoint-hunt'
  | 'knights-advance'
  | 'second-soul-surge'
  | 'grave-march'
  | 'final-procession';

export interface RunEventSpawn {
  enemyId: EnemyId;
  count: number;
  distance: number;
  formation?: 'scatter' | 'ring';
}

export interface RunEventDefinition {
  id: RunEventId;
  atMs: number;
  warning: string;
  warningColor: string;
  spawns: RunEventSpawn[];
  reward?: 'curse';
}

export const RUN_EVENTS: readonly RunEventDefinition[] = [
  {
    id: 'first-judgment',
    atMs: 90000,
    warning: 'THE FIRST JUDGMENT APPROACHES',
    warningColor: '#d98a63',
    spawns: [{ enemyId: 'condemned-brute', count: 1, distance: 700 }],
  },
  {
    id: 'crawler-tide',
    atMs: 180000,
    warning: 'THE GRAVE FLOOR STIRS',
    warningColor: '#c7a76a',
    spawns: [{ enemyId: 'grave-crawler', count: 24, distance: 650, formation: 'ring' }],
  },
  {
    id: 'void-choir',
    atMs: 270000,
    warning: 'THE VOID CHOIR GATHERS',
    warningColor: '#b88ce1',
    spawns: [
      { enemyId: 'void-caster', count: 4, distance: 700, formation: 'ring' },
      { enemyId: 'gravebound-archer', count: 3, distance: 720, formation: 'ring' },
      { enemyId: 'screamer', count: 1, distance: 740 },
    ],
    reward: 'curse',
  },
  {
    id: 'wraith-procession',
    atMs: 360000,
    warning: 'THE UNBURIED CROSS THE VEIL',
    warningColor: '#69d9ff',
    spawns: [
      { enemyId: 'wraith', count: 10, distance: 690, formation: 'ring' },
      { enemyId: 'lantern-ghost', count: 8, distance: 720, formation: 'ring' },
    ],
  },
  {
    id: 'midpoint-hunt',
    atMs: 450000,
    warning: 'THE CONDEMNED BEGIN THE HUNT',
    warningColor: '#d98a63',
    spawns: [
      { enemyId: 'sentinel-of-woe', count: 1, distance: 740 },
      { enemyId: 'veil-stalker', count: 12, distance: 640, formation: 'ring' },
    ],
  },
  {
    id: 'knights-advance',
    atMs: 540000,
    warning: 'THE HOLLOW GUARD ADVANCES',
    warningColor: '#c7a76a',
    spawns: [
      { enemyId: 'hollow-knight', count: 8, distance: 720, formation: 'ring' },
      { enemyId: 'sentinel-of-woe', count: 1, distance: 760 },
      { enemyId: 'gravebound-archer', count: 4, distance: 700, formation: 'ring' },
    ],
  },
  {
    id: 'second-soul-surge',
    atMs: 630000,
    warning: 'LIMBO DEMANDS A SECOND COVENANT',
    warningColor: '#b88ce1',
    spawns: [
      { enemyId: 'gravebound-archer', count: 5, distance: 720, formation: 'ring' },
      { enemyId: 'lantern-ghost', count: 8, distance: 680, formation: 'ring' },
      { enemyId: 'screamer', count: 2, distance: 760, formation: 'ring' },
    ],
    reward: 'curse',
  },
  {
    id: 'grave-march',
    atMs: 720000,
    warning: 'THE WARDEN ENTERS AT 14:00 - THE GRAVE MARCH BEGINS',
    warningColor: '#d98a63',
    spawns: [
      { enemyId: 'sentinel-of-woe', count: 1, distance: 760 },
      { enemyId: 'lantern-ghost', count: 12, distance: 680, formation: 'ring' },
      { enemyId: 'veil-stalker', count: 10, distance: 720, formation: 'ring' },
    ],
  },
  {
    id: 'final-procession',
    atMs: 810000,
    warning: 'THE FINAL PROCESSION MARCHES',
    warningColor: '#c7a76a',
    spawns: [
      { enemyId: 'flayed-wanderer', count: 16, distance: 680, formation: 'ring' },
      { enemyId: 'gravebound-archer', count: 6, distance: 720, formation: 'ring' },
      { enemyId: 'sentinel-of-woe', count: 1, distance: 770 },
      { enemyId: 'screamer', count: 3, distance: 760, formation: 'ring' },
    ],
  },
];

export function getPendingRunEvents(
  elapsedMs: number,
  triggered: ReadonlySet<RunEventId>,
): RunEventDefinition[] {
  return RUN_EVENTS.filter((event) => elapsedMs >= event.atMs && !triggered.has(event.id));
}
