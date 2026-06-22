import { ARTIFACTS } from './artifacts';
import { UPGRADES } from './upgrades';
import type { ArtifactId, UpgradeId } from '../types/gameTypes';

export type ShopOfferDefinition =
  | {
      id: string;
      kind: 'weapon';
      rewardId: UpgradeId;
      name: string;
      description: string;
      iconTexture: string;
      healthCost: number;
      rarity: 'rare' | 'legendary';
    }
  | {
      id: string;
      kind: 'artifact';
      rewardId: ArtifactId;
      name: string;
      description: string;
      iconTexture: string;
      healthCost: number;
      rarity: 'rare' | 'legendary';
    };

const weaponOffer = (rewardId: UpgradeId, healthCost: number): ShopOfferDefinition => {
  const reward = UPGRADES[rewardId];
  return {
    id: `weapon:${rewardId}`,
    kind: 'weapon',
    rewardId,
    name: reward.name.replace(/^Buy /, ''),
    description: reward.description,
    iconTexture: reward.iconTexture,
    healthCost,
    rarity: 'rare',
  };
};

const artifactOffer = (rewardId: ArtifactId, healthCost: number): ShopOfferDefinition => {
  const reward = ARTIFACTS[rewardId];
  return {
    id: `artifact:${rewardId}`,
    kind: 'artifact',
    rewardId,
    name: reward.name,
    description: reward.description,
    iconTexture: reward.iconTexture,
    healthCost,
    rarity: reward.rarity === 'legendary' ? 'legendary' : 'rare',
  };
};

export const SHOP_CATALOG: readonly ShopOfferDefinition[] = [
  weaponOffer('unlock-sanguine-needle', 30),
  artifactOffer('red-ledger', 38),
  artifactOffer('heart-of-the-market', 52),
];
