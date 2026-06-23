import type { TalentEffectId } from '../types/gameTypes';
import type { RunState } from './RunState';

type TalentEffectHandler = (run: RunState, ranks: number) => void;

export const TALENT_EFFECT_HANDLERS: Record<TalentEffectId, TalentEffectHandler> = {
  'extra-upgrade-choice': (run, ranks) => run.upgrades.addChoiceBonus(ranks),
  'extra-reroll': (run, ranks) => run.resources.addRerolls(ranks),
  'extra-weapon-slot': (run, ranks) => run.weapons.increaseCap(ranks),
  'all-weapons-pierce': (run, ranks) => run.weapons.addGlobalPierce(ranks),
  'starting-shield': (run, ranks) => run.resources.addStartingShield(30 * ranks),
  'start-with-curse': (run, ranks) => run.addStartingCurse(10 * ranks, 'talent:start-with-curse'),
  'bone-scythe-harvest-steps': (run, ranks) => run.boneScythe.setHarvestStepsRanks(ranks),
  'bone-scythe-crooked-reach': (run, ranks) => run.boneScythe.setCrookedReachRanks(ranks),
  'bone-scythe-grave-procession': (run, ranks) => run.boneScythe.enableGraveProcession(ranks > 0),
  'bone-scythe-first-reaping': (run, ranks) => run.boneScythe.enableFirstReaping(ranks),
  'bone-scythe-consume-bleed': (run, ranks) => run.boneScythe.enableBleedConsumption(ranks > 0),
  'bone-scythe-reaping-wake': (run, ranks) => run.boneScythe.setWakeRanks(ranks),
  'bone-scythe-executioner': (run, ranks) => run.boneScythe.setExecutionRanks(ranks),
  'bone-scythe-full-circle': (run, ranks) => run.boneScythe.enableFullCircle(ranks > 0),
};
