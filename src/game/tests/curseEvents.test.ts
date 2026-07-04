import { describe, expect, it } from 'vitest';
import {
  getCurseSurgeEvent,
  getCurseSurgeIntervalMs,
  getPendingCurseThresholdEvents,
  shouldScheduleCurseSurges,
} from '../data/curseEvents';
import { curseSnapshot } from '../data/curse';
import type { CurseTierId } from '../types/gameTypes';
import type { CurseEventId } from '../data/curseEvents';

function snapshot(level: number, crossed: CurseTierId[] = ['unmarked']) {
  return curseSnapshot(level, level, new Set(crossed));
}

describe('curse events', () => {
  it('does not schedule curse events before the first meaningful threshold', () => {
    const safe = snapshot(0);

    expect(getPendingCurseThresholdEvents(safe, new Set())).toEqual([]);
    expect(shouldScheduleCurseSurges(safe)).toBe(false);
  });

  it('creates one-shot threshold events for crossed curse tiers', () => {
    const marked = snapshot(25, ['unmarked', 'touched', 'marked']);

    expect(getPendingCurseThresholdEvents(marked, new Set()).map((event) => event.id)).toEqual([
      'curse-threshold-marked',
    ]);
    expect(
      getPendingCurseThresholdEvents(marked, new Set<CurseEventId>(['curse-threshold-marked'])).map(
        (event) => event.id,
      ),
    ).toEqual([]);
  });

  it('escalates recurring surges by current curse tier', () => {
    const marked = snapshot(25, ['unmarked', 'touched', 'marked']);
    const forsaken = snapshot(90, ['unmarked', 'touched', 'marked', 'condemned', 'forsaken']);

    expect(shouldScheduleCurseSurges(marked)).toBe(true);
    expect(getCurseSurgeEvent(marked).spawns.map((spawn) => spawn.enemyId)).toEqual(['wretched-runt']);
    expect(getCurseSurgeEvent(forsaken).spawns.map((spawn) => spawn.enemyId)).toContain('sinbound-stalker');
    expect(getCurseSurgeIntervalMs(forsaken)).toBeLessThan(getCurseSurgeIntervalMs(marked));
  });
});
