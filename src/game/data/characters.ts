import type { CharacterDefinition, CharacterId, SaveData } from '../types/gameTypes';

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  haunted: {
    id: 'haunted',
    name: 'Haunted',
    title: 'The Unremembered',
    flavorText: 'A condemned soul still stubborn enough to carry a blade.',
    texture: 'scythe_char',
    starterWeapon: 'bone-scythe',
    baseStatOverrides: {},
    unlockCondition: {
      type: 'default',
      description: 'Available from the beginning.',
    },
  },
  'the-penitent': {
    id: 'the-penitent',
    name: 'The Penitent',
    title: 'Bearer of the Last Burden',
    flavorText: 'Slow beneath the weight of old vows, but terribly difficult to end.',
    texture: 'thepenitent_idle_1',
    starterWeapon: 'gravecleaver',
    baseStatOverrides: {
      maxHealth: 140,
      moveSpeed: 187,
      damage: 1.1,
    },
    unlockCondition: {
      type: 'milestone',
      description: 'Survive at least 10 minutes in 3 trials.',
    },
  },
  ashwalker: {
    id: 'ashwalker',
    name: 'Ashwalker',
    title: 'The Cinder Between Worlds',
    flavorText: 'A swift, fragile remnant that refuses to cool.',
    texture: 'player-ashwalker',
    starterWeapon: 'soul-bolt',
    baseStatOverrides: {
      maxHealth: 75,
      moveSpeed: 275,
      pickupRadius: 120.75,
    },
    unlockCondition: {
      type: 'challenge',
      description: 'Defeat the Limbo Warden or survive a full 15-minute trial.',
    },
  },
};

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && value in CHARACTERS;
}

export function checkCharacterUnlocks(save: SaveData): CharacterId[] {
  const unlocked = new Set(save.unlockedCharacters);
  const newlyUnlocked: CharacterId[] = [];
  const unlock = (id: CharacterId, condition: boolean): void => {
    if (condition && !unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  };

  unlock('haunted', true);
  unlock('the-penitent', save.runsSurvivedTenMinutes >= 3);
  unlock('ashwalker', save.totalWardenKills >= 1 || save.bestRunTimeMs >= 15 * 60 * 1000);
  save.unlockedCharacters = [...unlocked];
  return newlyUnlocked;
}
