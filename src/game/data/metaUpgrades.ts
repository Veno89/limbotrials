import type { MetaUpgradeDefinition, MetaUpgradeId } from '../types/gameTypes';

export const META_UPGRADES: Record<MetaUpgradeId, MetaUpgradeDefinition> = {
  'vital-remnant': {
    id: 'vital-remnant',
    name: 'Vital Remnant',
    description: '+10 starting maximum health per rank.',
    maxLevel: 5,
    costs: [25, 55, 100, 170, 260],
  },
  'cruel-memory': {
    id: 'cruel-memory',
    name: 'Cruel Memory',
    description: '+5% starting damage per rank.',
    maxLevel: 5,
    costs: [35, 70, 125, 200, 300],
  },
  'hungry-echo': {
    id: 'hungry-echo',
    name: 'Hungry Echo',
    description: '+12% soul gain per rank.',
    maxLevel: 5,
    costs: [30, 65, 115, 185, 280],
  },
  'fateful-thread': {
    id: 'fateful-thread',
    name: 'Fateful Thread',
    description: '+1 upgrade reroll available in every trial.',
    maxLevel: 2,
    costs: [90, 240],
  },
};
