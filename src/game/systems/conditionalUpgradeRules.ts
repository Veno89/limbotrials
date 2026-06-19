import type { ConditionalUpgradeEffectId, EnemyDefinition } from '../types/gameTypes';

export const FUGITIVE_WAKE_DURATION_MS = 3000;
export const OATHHUNTER_ELITE_SOULS = 12;
export const ECHO_MARK_CURSED_SOULS = 3;
export const ECHO_MARK_ECHO_SOULS = 25;

interface ConditionalDamageInput {
  effects: ReadonlySet<ConditionalUpgradeEffectId>;
  moving: boolean;
  fugitiveWakeActive: boolean;
  shielded: boolean;
  target: EnemyDefinition;
}

export function conditionalDamageMultiplier(input: ConditionalDamageInput): number {
  let multiplier = 1;
  if (input.effects.has('restless-footwork') && input.moving) {
    multiplier *= 1.1;
  }
  if (input.effects.has('fugitive-wake') && input.fugitiveWakeActive) {
    multiplier *= 1.22;
  }
  if (input.effects.has('bulwark-pyre') && input.shielded) {
    multiplier *= 1.24;
  }
  if (input.effects.has('oathhunter-tithe')) {
    multiplier *= input.target.elite || input.target.boss ? 1.25 : 0.95;
  }
  if (input.effects.has('echo-mark') && isEchoMarkedTarget(input.target)) {
    multiplier *= 1.35;
  }
  return multiplier;
}

export function isEchoMarkedTarget(target: EnemyDefinition): boolean {
  if (target.id === 'player-echo') {
    return true;
  }
  const tags = target.spawnRequirements?.tags ?? [];
  return tags.includes('cursed') || tags.includes('hunted') || tags.includes('debt');
}

export function echoMarkSoulReward(target: EnemyDefinition): number {
  if (target.id === 'player-echo') {
    return ECHO_MARK_ECHO_SOULS;
  }
  return isEchoMarkedTarget(target) ? ECHO_MARK_CURSED_SOULS : 0;
}
