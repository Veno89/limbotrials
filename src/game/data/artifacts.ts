import type { ArtifactDefinition, ArtifactId, SaveData } from '../types/gameTypes';
import { BALANCE } from '../config/balanceConfig';

export const ARTIFACTS: Record<ArtifactId, ArtifactDefinition> = {
  'pendant-of-vigor': {
    id: 'pendant-of-vigor',
    name: 'Pendant of Vigor',
    description: 'Increases maximum health by 35. When claimed, gain a 35-point shield.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [{ stat: 'maxHealth', mode: 'add', value: 35 }],
    effect: 'vital-shield',
  },
  'winged-sandals': {
    id: 'winged-sandals',
    name: 'Winged Sandals',
    description: 'Increases movement speed by 10%. Dashing briefly quickens all weapon cooldowns.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-boots',
    modifiers: [{ stat: 'moveSpeed', mode: 'multiply', value: 1.1 }],
    effect: 'winged-quicken',
  },
  'magnet-stone': {
    id: 'magnet-stone',
    name: 'Magnet Stone',
    description: 'Increases pickup radius by 40%. Every 5 pickups grant +3 bonus souls.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-void-sword', // temporary icon references from preload list
    modifiers: [{ stat: 'pickupRadius', mode: 'multiply', value: 1.4 }],
    effect: 'magnet-tithe',
  },
  'sharpened-stone': {
    id: 'sharpened-stone',
    name: 'Sharpened Stone',
    description: 'Increases critical chance by 8% and critical damage by 20%. Every 18 kills whet your weapons, reducing cooldowns.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [
      { stat: 'critChance', mode: 'add', value: 0.08 },
      { stat: 'critDamage', mode: 'add', value: 0.2 },
    ],
    effect: 'whetstone-cadence',
  },
  'blood-vial': {
    id: 'blood-vial',
    name: 'Blood Vial',
    description: 'Increases maximum health by 20. Every 10 kills heal a little; elite and boss kills heal more.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-void-sword',
    modifiers: [{ stat: 'maxHealth', mode: 'add', value: 20 }],
    effect: 'blood-vial-feast',
  },
  'reinforced-buckler': {
    id: 'reinforced-buckler',
    name: 'Reinforced Buckler',
    description: 'Grants a 20-point shield every 16 seconds. When that shield breaks, your weapons quicken.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [{ stat: 'shieldInterval', mode: 'add', value: 16000 }],
    effect: 'buckler-break',
  },
  'hallowed-ash': {
    id: 'hallowed-ash',
    name: 'Hallowed Ash',
    description: 'Increases soul gain by 20%. Elite and boss kills release bonus souls.',
    rarity: 'common',
    poolTier: 'base',
    iconTexture: 'icon-staff',
    modifiers: [{ stat: 'soulGain', mode: 'multiply', value: 1.2 }],
    effect: 'hallowed-tithe',
  },
  'vampiric-fury': {
    id: 'vampiric-fury',
    name: 'Vampiric Fury',
    description: 'Increases critical damage by 45%. Elite and boss kills restore health.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [{ stat: 'critDamage', mode: 'add', value: 0.45 }],
    effect: 'vampiric-elite-heal',
  },
  'soul-lantern': {
    id: 'soul-lantern',
    name: 'Soul Lantern',
    description: 'Increases soul gain by 25% and pickup radius by 20%. Every 12 pickups, all soul remnants are drawn in.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'soulGain', mode: 'multiply', value: 1.25 },
      { stat: 'pickupRadius', mode: 'multiply', value: 1.2 },
    ],
    effect: 'soul-lantern-vacuum',
  },
  'shadow-cloak': {
    id: 'shadow-cloak',
    name: 'Shadow Cloak',
    description: 'Reduces dash cooldown by 15%. Perfect dodges grant a small shield and extra weapon quickening.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-boots',
    modifiers: [{ stat: 'dashCooldown', mode: 'multiply', value: 0.85 }],
    effect: 'shadow-perfect-dodge',
  },
  'lucky-clover': {
    id: 'lucky-clover',
    name: 'Lucky Clover',
    description: 'Increases soul shard drop chance by 12%. Every 45 kills, a temporary powerup drops.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-sword',
    modifiers: [{ stat: 'soulShardChance', mode: 'add', value: 0.12 }],
    effect: 'lucky-powerup',
  },
  'unstable-core': {
    id: 'unstable-core',
    name: 'Unstable Core',
    description: 'Increases global damage by 12% and attack speed by 8%. Every 35 kills triggers Grave Frenzy.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-void-sword',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.12 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.08 },
    ],
    effect: 'unstable-frenzy',
  },
  'spiked-collar': {
    id: 'spiked-collar',
    name: 'Spiked Collar',
    description: 'Increases global damage by 15% and max health by 20. Taking HP damage quickens your weapons.',
    rarity: 'uncommon',
    poolTier: 'base',
    iconTexture: 'icon-chest',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'maxHealth', mode: 'add', value: 20 },
    ],
    effect: 'spiked-retaliation',
  },
  'cursed-hourglass': {
    id: 'cursed-hourglass',
    name: 'Cursed Hourglass',
    description: 'Reduces dash cooldown by 15% and increases attack speed by 14%. Dashing tears time, quickening all weapons.',
    rarity: 'rare',
    poolTier: 'tier-2',
    iconTexture: 'artifact-cursed-hourglass',
    modifiers: [
      { stat: 'dashCooldown', mode: 'multiply', value: 0.85 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.14 },
    ],
    effect: 'hourglass-quicken',
  },
  'golden-egg': {
    id: 'golden-egg',
    name: 'Golden Egg',
    description: 'Immediately grants +80 souls. Increases soul gain by 35% and critical chance by 5%.',
    rarity: 'rare',
    poolTier: 'tier-2',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'soulGain', mode: 'multiply', value: 1.35 },
      { stat: 'critChance', mode: 'add', value: 0.05 },
    ],
    effect: 'golden-windfall',
  },
  'death-gaze': {
    id: 'death-gaze',
    name: 'Death Gaze',
    description: 'Increases critical chance by 10% and critical damage by 50%. Every 25 kills, Death Gaze blinks and quickens all weapons.',
    rarity: 'rare',
    poolTier: 'tier-3',
    iconTexture: 'icon-sword',
    modifiers: [
      { stat: 'critChance', mode: 'add', value: 0.10 },
      { stat: 'critDamage', mode: 'add', value: 0.50 },
    ],
    effect: 'death-gaze-blink',
  },
  'giants-belt': {
    id: 'giants-belt',
    name: "Giant's Belt",
    description: 'Increases maximum health by 75 and global damage by 10%. Taking HP damage grants a brief defensive shield.',
    rarity: 'rare',
    poolTier: 'tier-3',
    iconTexture: 'icon-chest',
    modifiers: [
      { stat: 'maxHealth', mode: 'add', value: 75 },
      { stat: 'damage', mode: 'multiply', value: 1.1 },
    ],
    effect: 'giants-last-stand',
  },
  'wardens-eye': {
    id: 'wardens-eye',
    name: "Warden's Eye",
    description: 'Increases boss damage by 35%. Elite and boss kills pay a Warden-marked soul bounty.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-void-sword',
    modifiers: [{ stat: 'bossDamage', mode: 'multiply', value: 1.35 }],
    effect: 'wardens-prize',
  },
  'soul-furnace': {
    id: 'soul-furnace',
    name: 'Soul Furnace',
    description: 'Increases global damage by 20% and soul gain by 25%. Souls stoke the furnace, periodically quickening all weapons.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'soulGain', mode: 'multiply', value: 1.25 },
    ],
    effect: 'soul-furnace-stoke',
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
    description: 'Increases global damage by 15% and attack speed by 10%. Standard level-ups offer one additional choice.',
    rarity: 'legendary',
    poolTier: 'tier-4',
    iconTexture: 'icon-staff',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'attackSpeed', mode: 'multiply', value: 1.1 },
    ],
    effect: 'ascended-choice',
  },
  'red-ledger': {
    id: 'red-ledger',
    name: 'Red Ledger',
    description: 'Gain 18% damage and 25% more Souls. Every 16 kills pays a blood dividend; elites pay more.',
    rarity: 'rare',
    poolTier: 'base',
    iconTexture: 'status-bleed',
    source: 'shop',
    modifiers: [
      { stat: 'damage', mode: 'multiply', value: 1.18 },
      { stat: 'soulGain', mode: 'multiply', value: 1.25 },
    ],
    effect: 'red-ledger-tithe',
  },
  'heart-of-the-market': {
    id: 'heart-of-the-market',
    name: 'Heart of the Market',
    description: 'Attack 25% faster. Taking HP damage periodically wraps you in an 18-point blood ward.',
    rarity: 'legendary',
    poolTier: 'base',
    iconTexture: 'status-bleed',
    source: 'shop',
    modifiers: [{ stat: 'attackSpeed', mode: 'multiply', value: 1.25 }],
    effect: 'market-heart-ward',
  },
};

export function getAvailableArtifacts(save: SaveData): ArtifactDefinition[] {
  const unlockedTiers = save.unlockedArtifactTiers || ['base'];
  return Object.values(ARTIFACTS).filter(
    (art) => art.source !== 'shop' && unlockedTiers.includes(art.poolTier),
  );
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
