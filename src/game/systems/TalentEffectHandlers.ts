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
  'bone-scythe-harvest-steps': (run, ranks) => run.setBoneScytheHarvestStepsRanks(ranks),
  'bone-scythe-crooked-reach': (run, ranks) => run.setBoneScytheCrookedReachRanks(ranks),
  'bone-scythe-grave-procession': (run, ranks) => run.enableBoneScytheGraveProcession(ranks > 0),
  'bone-scythe-first-reaping': (run, ranks) => run.enableBoneScytheFirstReaping(ranks),
  'bone-scythe-consume-bleed': (run, ranks) => run.enableBoneScytheBleedConsumption(ranks > 0),
  'bone-scythe-reaping-wake': (run, ranks) => run.setBoneScytheWakeRanks(ranks),
  'bone-scythe-executioner': (run, ranks) => run.setBoneScytheExecutionRanks(ranks),
  'bone-scythe-full-circle': (run, ranks) => run.enableBoneScytheFullCircle(ranks > 0),
};
