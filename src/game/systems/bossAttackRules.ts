import type { BossAttackId } from '../types/gameTypes';

const PHASE_ATTACKS: Record<number, readonly BossAttackId[]> = {
  1: ['shockwave', 'grave-chain', 'shattered-judgment'],
  2: ['shockwave', 'soul-prison', 'grave-chain', 'cathedral-rupture', 'shattered-judgment'],
  3: [
    'shockwave',
    'soul-prison',
    'grave-chain',
    'cathedral-rupture',
    'shattered-judgment',
    'condemned-star',
  ],
};

export function getBossAttackPool(phase: number): readonly BossAttackId[] {
  return PHASE_ATTACKS[Math.max(1, Math.min(3, phase))]!;
}

export function selectBossAttack(sequenceIndex: number, phase: number): BossAttackId {
  const pool = getBossAttackPool(phase);
  return pool[sequenceIndex % pool.length]!;
}
