import type { TalentEffectId } from '../types/gameTypes';
import type { RunState } from './RunState';

type TalentEffectHandler = (run: RunState, ranks: number) => void;

export const TALENT_EFFECT_HANDLERS: Record<TalentEffectId, TalentEffectHandler> = {
  'extra-upgrade-choice': (run, ranks) => run.addUpgradeChoiceBonus(ranks),
  'extra-reroll': (run, ranks) => run.addRerolls(ranks),
  'extra-weapon-slot': (run, ranks) => run.increaseWeaponCap(ranks),
  'all-weapons-pierce': (run, ranks) => run.addGlobalWeaponPierce(ranks),
  'starting-shield': (run, ranks) => run.addStartingShield(30 * ranks),
  'start-with-curse': (run, ranks) => run.addStartingCurse(10 * ranks, 'talent:start-with-curse'),
};
