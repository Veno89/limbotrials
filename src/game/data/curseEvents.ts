import type { CurseSnapshot, CurseTierId } from '../types/gameTypes';
import type { RunEventSpawn } from './runEvents';

export type CurseEventId =
  | 'curse-threshold-marked'
  | 'curse-threshold-condemned'
  | 'curse-threshold-forsaken'
  | 'curse-surge';

export interface CurseEventDefinition {
  id: CurseEventId;
  warning: string;
  warningColor: string;
  spawns: readonly RunEventSpawn[];
}

const THRESHOLD_EVENTS: Partial<Record<CurseTierId, CurseEventDefinition>> = {
  marked: {
    id: 'curse-threshold-marked',
    warning: 'HELL HAS NOTICED YOU',
    warningColor: '#d26468',
    spawns: [{ enemyId: 'wretched-runt', count: 8, distance: 620, formation: 'ring' }],
  },
  condemned: {
    id: 'curse-threshold-condemned',
    warning: 'THE CONDEMNED ANSWER YOUR MARK',
    warningColor: '#ff6a4d',
    spawns: [
      { enemyId: 'wretched-runt', count: 10, distance: 600, formation: 'ring' },
      { enemyId: 'sinbound-stalker', count: 2, distance: 680 },
    ],
  },
  forsaken: {
    id: 'curse-threshold-forsaken',
    warning: 'LIMBO OPENS ITS HUNT',
    warningColor: '#ff3b66',
    spawns: [
      { enemyId: 'wretched-runt', count: 12, distance: 590, formation: 'ring' },
      { enemyId: 'sinbound-stalker', count: 4, distance: 650, formation: 'ring' },
    ],
  },
};

const SURGE_DELAY_MS = 45_000;
const BASE_SURGE_INTERVAL_MS = 92_000;

export function getPendingCurseThresholdEvents(
  snapshot: CurseSnapshot,
  triggered: ReadonlySet<CurseEventId>,
): CurseEventDefinition[] {
  return snapshot.thresholdsCrossed
    .map((tier) => THRESHOLD_EVENTS[tier])
    .filter((event): event is CurseEventDefinition => event !== undefined)
    .filter((event) => !triggered.has(event.id));
}

export function shouldScheduleCurseSurges(snapshot: CurseSnapshot): boolean {
  return snapshot.level >= 25;
}

export function getInitialCurseSurgeDelayMs(): number {
  return SURGE_DELAY_MS;
}

export function getCurseSurgeIntervalMs(snapshot: CurseSnapshot): number {
  if (snapshot.tier === 'forsaken') {
    return BASE_SURGE_INTERVAL_MS * 0.7;
  }
  if (snapshot.tier === 'condemned') {
    return BASE_SURGE_INTERVAL_MS * 0.84;
  }
  return BASE_SURGE_INTERVAL_MS;
}

export function getCurseSurgeEvent(snapshot: CurseSnapshot): CurseEventDefinition {
  if (snapshot.tier === 'forsaken') {
    return {
      id: 'curse-surge',
      warning: 'A FORSAKEN SURGE BREAKS THROUGH',
      warningColor: '#ff3b66',
      spawns: [
        { enemyId: 'wretched-runt', count: 10, distance: 610, formation: 'ring' },
        { enemyId: 'sinbound-stalker', count: 3, distance: 680 },
      ],
    };
  }
  if (snapshot.tier === 'condemned') {
    return {
      id: 'curse-surge',
      warning: 'CURSED SOULS CLAW INTO THE TRIAL',
      warningColor: '#ff6a4d',
      spawns: [
        { enemyId: 'wretched-runt', count: 8, distance: 620, formation: 'ring' },
        { enemyId: 'sinbound-stalker', count: 1, distance: 690 },
      ],
    };
  }
  return {
    id: 'curse-surge',
    warning: 'THE MARK PULLS HUSKS FROM BELOW',
    warningColor: '#d26468',
    spawns: [{ enemyId: 'wretched-runt', count: 6, distance: 630, formation: 'ring' }],
  };
}
