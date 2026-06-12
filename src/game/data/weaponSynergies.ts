import type { WeaponId } from '../types/gameTypes';

export interface WeaponSynergyDefinition {
  id: string;
  name: string;
  description: string;
  requiredWeapons: readonly WeaponId[];
  affectedWeapons: readonly WeaponId[];
  damageMultiplier: number;
  critChanceBonus: number;
}

export const WEAPON_SYNERGIES: readonly WeaponSynergyDefinition[] = [
  {
    id: 'ashen-rite',
    name: 'Ashen Rite',
    description: 'Hellfire Sigil and Cinder Reliquary deal 15% more damage.',
    requiredWeapons: ['hellfire-sigil', 'cinder-reliquary'],
    affectedWeapons: ['hellfire-sigil', 'cinder-reliquary'],
    damageMultiplier: 1.15,
    critChanceBonus: 0,
  },
  {
    id: 'mourning-procession',
    name: 'Mourning Procession',
    description: 'Grave Lance and Wailing Shards deal 14% more damage.',
    requiredWeapons: ['grave-lance', 'wailing-shards'],
    affectedWeapons: ['grave-lance', 'wailing-shards'],
    damageMultiplier: 1.14,
    critChanceBonus: 0,
  },
  {
    id: 'reapers-choir',
    name: "Reaper's Choir",
    description: 'Bone Scythe and Soul Bolt gain 8% critical chance.',
    requiredWeapons: ['bone-scythe', 'soul-bolt'],
    affectedWeapons: ['bone-scythe', 'soul-bolt'],
    damageMultiplier: 1,
    critChanceBonus: 0.08,
  },
  {
    id: 'executioners-rite',
    name: "Executioner's Rite",
    description: 'Bone Scythe and Bloodletter Axe gain 8% critical chance.',
    requiredWeapons: ['bone-scythe', 'bloodletter-axe'],
    affectedWeapons: ['bone-scythe', 'bloodletter-axe'],
    damageMultiplier: 1,
    critChanceBonus: 0.08,
  },
  {
    id: 'last-volley',
    name: 'Last Volley',
    description: 'Ashen Longbow and Dirge Staff deal 12% more damage.',
    requiredWeapons: ['ashen-longbow', 'dirge-staff'],
    affectedWeapons: ['ashen-longbow', 'dirge-staff'],
    damageMultiplier: 1.12,
    critChanceBonus: 0,
  },
];
