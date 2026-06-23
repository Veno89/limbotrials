import type { EdictDefinition, EdictId } from '../types/gameTypes';

export const EDICTS: Record<EdictId, EdictDefinition> = {
  frailty: {
    id: 'frailty',
    name: 'Edict of Frailty',
    description: 'Player maximum health is reduced by 25%.',
    soulMultiplierBonus: 0.25,
  },
  haste: {
    id: 'haste',
    name: 'Edict of Haste',
    description: 'Enemies move 15% faster and attack 10% faster.',
    soulMultiplierBonus: 0.3,
  },
  scarcity: {
    id: 'scarcity',
    name: 'Edict of Scarcity',
    description: 'Healing drops are reduced by 50%.',
    soulMultiplierBonus: 0.25,
  },
  ruin: {
    id: 'ruin',
    name: 'Edict of Ruin',
    description: 'Bosses have 20% more health and deal 10% more damage.',
    soulMultiplierBonus: 0.35,
  },
  'hollow-host': {
    id: 'hollow-host',
    name: 'Edict of the Hollow Host',
    description: 'Elite and special enemies appear significantly more often.',
    soulMultiplierBonus: 0.4,
  },
};
