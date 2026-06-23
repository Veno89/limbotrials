import { applyStatModifiers, BASE_PLAYER_STATS, clampPlayerStats } from '../../utils/statModifiers';
import { CHARACTERS } from '../../data/characters';
import type { CharacterId, PlayerStats, StatModifier } from '../../types/gameTypes';

export class StatManager {
  public current: PlayerStats;

  constructor(characterId: CharacterId) {
    const character = CHARACTERS[characterId] || CHARACTERS['haunted'];
    this.current = clampPlayerStats({ ...BASE_PLAYER_STATS, ...character.baseStatOverrides });
  }

  applyModifiers(modifiers: readonly StatModifier[]): void {
    applyStatModifiers(this.current, modifiers);
    this.current = clampPlayerStats(this.current);
  }
}
