import type { CurseSnapshot, CurseTierId } from '../types/gameTypes';

export interface CurseVisualProfile {
  color: number;
  textColor: string;
  auraRadius: number;
  auraAlpha: number;
}

const CURSE_VISUALS: Record<CurseTierId, CurseVisualProfile> = {
  unmarked: {
    color: 0x637985,
    textColor: '#637985',
    auraRadius: 0,
    auraAlpha: 0,
  },
  touched: {
    color: 0xb687ed,
    textColor: '#d8b7ff',
    auraRadius: 49,
    auraAlpha: 0.18,
  },
  marked: {
    color: 0xb86dff,
    textColor: '#d39cff',
    auraRadius: 54,
    auraAlpha: 0.26,
  },
  condemned: {
    color: 0xd26468,
    textColor: '#ff8d91',
    auraRadius: 61,
    auraAlpha: 0.34,
  },
  forsaken: {
    color: 0xff3b66,
    textColor: '#ff8aa3',
    auraRadius: 69,
    auraAlpha: 0.44,
  },
};

export function curseVisualFor(snapshot: CurseSnapshot): CurseVisualProfile {
  const visual = CURSE_VISUALS[snapshot.tier];
  if (snapshot.tier !== 'forsaken') {
    return visual;
  }
  const overflow = Math.min(0.16, Math.max(0, snapshot.level - 75) / 600);
  return {
    ...visual,
    auraRadius: visual.auraRadius + overflow * 40,
    auraAlpha: visual.auraAlpha + overflow,
  };
}
