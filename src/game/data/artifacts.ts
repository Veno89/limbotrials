import type { ArtifactDefinition, ArtifactId, SaveData } from '../types/gameTypes';
import { BALANCE } from '../config/balanceConfig';

export const ARTIFACTS: Record<ArtifactId, ArtifactDefinition> = {
  'pendant-of-vigor': {
    id: 'pendant-of-vigor',
    name: 'Pendant of Vigor',
    description: 'Increases maximum health by 25.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [{ stat: 'maxHealth', mode: 'add', value: 25 }],
  },
  'winged-sandals': {
    id: 'winged-sandals',
    name: 'Winged Sandals',
    description: 'Increases movement speed by 12%.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-boots',
    modifiers: [{ stat: 'moveSpeed', mode: 'multiply', value: 1.12 }],
  },
  'magnet-stone': {
    id: 'magnet-stone',
    name: 'Magnet Stone',
    description: 'Increases pickup radius by 30%.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-void-sword', // temporary icon references from preload list
    modifiers: [{ stat: 'pickupRadius', mode: 'multiply', value: 1.3 }],
  },
  'sharpened-stone': {
    id: 'sharpened-stone',
    name: 'Sharpened Stone',
    description: 'Increases critical strike chance by 8%.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [{ stat: 'critChance', mode: 'add', value: 0.08 }],
  },
  'blood-vial': {
    id: 'blood-vial',
    name: 'Blood Vial',
    description: 'Increases maximum health by 10 and damage by 5%.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-void-sword',
    modifiers: [
      { stat: 'maxHealth', mode: 'add', value: 10 },
      { stat: 'damage', mode: 'multiply', value: 1.05 },
    ],
  },
  'reinforced-buckler': {
    id: 'reinforced-buckler',
    name: 'Reinforced Buckler',
    description: 'Grants a 20-point shield every 18 seconds.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [{ stat: 'shieldInterval', mode: 'add', value: 18000 }],
  },
  'hallowed-ash': {
    id: 'hallowed-ash',
    name: 'Hallowed Ash',
    description: 'Increases soul gain by 15%.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-staff',
    modifiers: [{ stat: 'soulGain', mode: 'multiply', value: 1.15 }],
  },
  'vampiric-fury': {
    id: 'vampiric-fury',
    name: 'Vampiric Fury',
    description: 'Increases critical strike damage by 30%.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [{ stat: 'critDamage', mode: 'add', value: 0.30 }],
  },
  'soul-lantern': {
    id: 'soul-lantern',
    name: 'Soul Lantern',
    description: 'Increases soul gain by 25% and pickup radius by 15%.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'soulGain', mode: 'multiply', value: 1.25 },
      { stat: 'pickupRadius', mode: 'multiply', value: 1.15 },
    ],
  },
  'shadow-cloak': {
    id: 'shadow-cloak',
    name: 'Shadow Cloak',
    description: 'Reduces dash cooldown by 20%.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-boots',
    modifiers: [{ stat: 'dashCooldown', mode: 'multiply', value: 0.8 }],
  },
  'lucky-clover': {
    id: 'lucky-clover',
    name: 'Lucky Clover',
    description: 'Increases soul shard drop chance by 10%.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [{ stat: 'soulShardChance', mode: 'add', value: 0.10 }],
  },
  'unstable-core': {
    id: 'unstable-core',
    name: 'Unstable Core',
    description: 'Increases global damage by 15% and attack speed by 8%.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-void-sword',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.08 },
    ],
  },
  'spiked-collar': {
    id: 'spiked-collar',
    name: 'Spiked Collar',
    description: 'Increases global damage by 12% and max health by 15.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.12 },
      { stat: 'maxHealth', mode: 'add', value: 15 },
    ],
  },
  'cursed-hourglass': {
    id: 'cursed-hourglass',
    name: 'Cursed Hourglass',
    description: 'Reduces dash cooldown by 15% and increases attack speed by 12%.',
    rarity: 'rare',
    poolTier: 'tier-2',
    iconTexture: 'icon-boots',
    modifiers: [
      { stat: 'dashCooldown', mode: 'multiply', value: 0.85 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.12 },
    ],
  },
  'golden-egg': {
    id: 'golden-egg',
    name: 'Golden Egg',
    description: 'Increases soul gain by 40% and critical strike chance by 5%.',
    rarity: 'rare',
    poolTier: 'tier-2',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'soulGain', mode: 'multiply', value: 1.4 },
      { stat: 'critChance', mode: 'add', value: 0.05 },
    ],
  },
  'death-gaze': {
    id: 'death-gaze',
    name: 'Death Gaze',
    description: 'Increases critical strike chance by 10% and critical damage by 40%.',
    rarity: 'rare',
    poolTier: 'tier-3',
    iconTexture: 'icon-sword',
    modifiers: [
      { stat: 'critChance', mode: 'add', value: 0.10 },
      { stat: 'critDamage', mode: 'add', value: 0.40 },
    ],
  },
  'giants-belt': {
    id: 'giants-belt',
    name: "Giant's Belt",
    description: 'Increases maximum health by 50 and global damage by 10%.',
    rarity: 'rare',
    poolTier: 'tier-3',
    iconTexture: 'icon-chest',
    modifiers: [
      { stat: 'maxHealth', mode: 'add', value: 50 },
      { stat: 'damage', mode: 'multiply', value: 1.1 },
    ],
  },
  'wardens-eye': {
    id: 'wardens-eye',
    name: "Warden's Eye",
    description: 'Increases boss damage by 40%.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-void-sword',
    modifiers: [{ stat: 'bossDamage', mode: 'multiply', value: 1.4 }],
  },
  'soul-furnace': {
    id: 'soul-furnace',
    name: 'Soul Furnace',
    description: 'Increases global damage by 25% and soul gain by 30%.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.25 },
      { stat: 'soulGain', mode: 'multiply', value: 1.3 },
    ],
  },
  'extra-pocket': {
    id: 'extra-pocket',
    name: 'Extra Pocket',
    description: 'Grants +1 maximum weapon slot.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-chest',
    special: 'extra-weapon-slot',
  },
  'spectral-pass': {
    id: 'spectral-pass',
    name: 'Spectral Pass',
    description: 'All weapons pierce 1 additional enemy and attack 15% faster.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-bow',
    modifiers: [{ stat: 'attackSpeed', mode: 'multiply', value: 1.15 }],
    special: 'all-weapons-pierce',
  },
  'ascended-crown': {
    id: 'ascended-crown',
    name: 'Ascended Crown',
    description: 'Increases global damage by 20% and attack speed by 10%.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.1 },
    ],
  },
};

export function getAvailableArtifacts(save: SaveData): ArtifactDefinition[] {
  const unlockedTiers = save.unlockedArtifactTiers || ['base'];
  return Object.values(ARTIFACTS).filter((art) => unlockedTiers.includes(art.poolTier));
}

export function rollArtifact(
  available: ArtifactDefinition[],
  owned: ArtifactId[],
  random: () => number = Math.random,
): ArtifactDefinition | null {
  const pool = available.filter((art) => !owned.includes(art.id));
  if (pool.length === 0) {
    return null;
  }

  const rarities = (Object.keys(BALANCE.artifactRarityWeights) as ArtifactDefinition['rarity'][])
    .map((rarity) => ({
      rarity,
      candidates: pool.filter((artifact) => artifact.rarity === rarity),
      weight: BALANCE.artifactRarityWeights[rarity],
    }))
    .filter((entry) => entry.candidates.length > 0);
  const totalWeight = rarities.reduce((total, entry) => total + entry.weight, 0);
  let roll = random() * totalWeight;
  for (const entry of rarities) {
    roll -= entry.weight;
    if (roll < 0) {
      return entry.candidates[Math.floor(random() * entry.candidates.length)] ?? null;
    }
  }
  return rarities.at(-1)?.candidates.at(-1) ?? null;
}
