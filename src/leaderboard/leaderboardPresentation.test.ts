import { describe, expect, it } from 'vitest';
import {
  formatLeaderboardNumber,
  formatLeaderboardTime,
  getLeaderboardRankLabel,
} from './leaderboardPresentation';

describe('leaderboard presentation', () => {
  it('formats scores, duration, and ranked numerals', () => {
    expect(formatLeaderboardNumber(551348)).toBe('551,348');
    expect(formatLeaderboardTime(613747)).toBe('10:13');
    expect(getLeaderboardRankLabel(1)).toBe('I');
    expect(getLeaderboardRankLabel(3)).toBe('III');
    expect(getLeaderboardRankLabel(7)).toBe('07');
  });
});
