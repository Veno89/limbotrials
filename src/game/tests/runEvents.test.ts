import { describe, expect, it } from 'vitest';
import { getPendingRunEvents, type RunEventId } from '../data/runEvents';

describe('run events', () => {
  it('holds authored events until their scheduled time', () => {
    expect(getPendingRunEvents(89999, new Set())).toEqual([]);
    expect(getPendingRunEvents(90000, new Set()).map((event) => event.id)).toEqual(['first-judgment']);
  });

  it('returns every overdue event once and respects triggered events', () => {
    const triggered = new Set<RunEventId>(['first-judgment', 'crawler-tide']);
    expect(getPendingRunEvents(360000, triggered).map((event) => event.id)).toEqual([
      'void-choir',
      'wraith-procession',
    ]);
  });

  it('builds a full fifteen-minute arc with formation encounters and two curse beats', () => {
    const events = getPendingRunEvents(810000, new Set());
    expect(events).toHaveLength(9);
    expect(events.filter((event) => event.reward === 'curse')).toHaveLength(2);
    expect(events.some((event) => event.spawns.some((spawn) => spawn.formation === 'ring'))).toBe(true);
    expect(events.find((event) => event.id === 'grave-march')?.warning).toContain('14:00');
    expect(events.at(-1)?.spawns.map((spawn) => spawn.enemyId)).toContain('sentinel-of-woe');
  });
});
