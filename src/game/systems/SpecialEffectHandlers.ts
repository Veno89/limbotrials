import type { SpecialEffectId } from '../types/gameTypes';
import type { RunState } from './RunState';

type SpecialEffectHandler = (run: RunState) => void;

export const SPECIAL_EFFECT_HANDLERS: Record<SpecialEffectId, SpecialEffectHandler> = {
  'extra-weapon-slot': (run) => run.increaseWeaponCap(1),
  'all-weapons-pierce': (run) => run.addGlobalWeaponPierce(1),
};
